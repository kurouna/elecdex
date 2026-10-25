/**
 * What every recorded take shares (the demo-*.mjs scripts): the options, the README
 * screenshots' made-up data, a profile holding the layouts a take steps through, and the
 * window, sized and placed for the recorder.
 *
 * Every take shows the same made-up things: the demo home and repository, a made-up Claude
 * Code folder, the made-up socket table and sound, stand-in pages for YouTube and X and a
 * made-up feed, demo notes and tasks (demo-fixtures.mjs, preset-shots.mjs). Only the orbital
 * elements, the weather, the markets and the earthquakes are real, fetched as the panes would.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron } from '@playwright/test'
import {
  claudeFolder,
  demoRepository,
  gitRepos,
  HOME,
  keepOrbits,
  PROJECT,
  prepareHome,
  REPO_ID,
  SESSION,
  seedOrbits,
} from './demo-fixtures.mjs'
import { LOG_ID, logFiles } from './demo-logfeed.mjs'
import { noGamepads } from './demo-play-kit.mjs'
import { deskFiles, mediaStandIn, withState } from './preset-shots.mjs'

export const MAIN = path.resolve('out/main/index.js')

export const say = (text) => console.log(`${new Date().toTimeString().slice(0, 8)} ${text}`)

/**
 * The command line, over a take's own defaults:
 *
 *   --probe          open the window at its size and wait: to check the size and place for the
 *                    recorder before the take
 *   --width --height content size of the window, in pixels
 *   --x=.. --y=..    where the window goes (centred when left out)
 *   --lead=10        seconds between the window appearing and the take starting
 *   --zoom           page zoom: below 1 fits more of the workspace in a small window
 *   --pace=1         a factor on every pause: 1.5 for a slower take, 0.8 for a quicker one
 *   --stay=3         seconds each layout stays on screen
 *   --theme=tron     any built-in theme
 *   --shots=<dir>    also save a screenshot every two seconds there, to look the take over
 *   --no-captions    leave out the captions a take puts at the bottom (`caption`)
 */
export function takeOptions(defaults) {
  const option = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
  const number = (name, fallback) => {
    const value = option(name)
    return value === undefined ? fallback : Number(value)
  }
  return {
    probe: process.argv.includes('--probe'),
    width: number('width', defaults.width),
    height: number('height', defaults.height),
    x: option('x') === undefined ? null : number('x', 0),
    y: option('y') === undefined ? null : number('y', 0),
    lead: number('lead', defaults.lead ?? 10),
    zoom: number('zoom', defaults.zoom ?? 1),
    pace: number('pace', 1),
    stay: number('stay', 3),
    theme: option('theme') ?? defaults.theme ?? 'tron',
    shots: option('shots'),
    captions: !process.argv.includes('--no-captions'),
  }
}

/** The caption's element: the take's own, never the app's. */
const CAPTION_ID = 'elecdex-demo-caption'

/**
 * Puts `text` at the bottom centre of the window as a caption, or takes it away (null). It
 * stays until the next one. It is an element the take adds to the page, so it is in the
 * --shots pictures, and it lets every click and pointer through, so a hover card or a press
 * behaves as without it. It waits for nothing: a caption never moves a take's timing. Bottom
 * centre is clear of the web panes, views drawn over the page in their own places (the media
 * preset's are top left and down the right). It powers on with the app's `crt-on`, in the
 * theme's colours, so it changes with the themes.
 */
async function showCaption(page, text, place = {}) {
  await page
    .evaluate(
      ([id, words, where]) => {
        document.getElementById(id)?.remove()
        if (words === null) return
        const holder = document.createElement('div')
        holder.id = id
        holder.setAttribute('aria-hidden', 'true')
        Object.assign(holder.style, {
          // Across the width with the box centred in it: a holder put at left 50% would give the
          // box only half the window, and a caption in the tall window wrapped at every word.
          position: 'fixed',
          left: '24px',
          right: '24px',
          bottom: '36px',
          display: 'flex',
          justifyContent: 'center',
          zIndex: '2147483000',
          pointerEvents: 'none',
          // A take whose pane fills the bottom centre puts its captions elsewhere (`captionPlace`).
          ...where,
        })
        // crt-on makes its element position: relative, so it goes on a box inside the holder.
        const box = document.createElement('div')
        box.className = 'crt-on'
        box.textContent = words
        Object.assign(box.style, {
          padding: '8px 22px',
          background: 'color-mix(in srgb, var(--surface-1) 88%, transparent)',
          border: '1px solid var(--panel-border)',
          color: 'var(--accent-strong)',
          font: '500 22px/1.3 var(--font-display)',
          letterSpacing: '0.04em',
          textAlign: 'center',
          boxShadow: '0 4px 18px rgb(0 0 0 / 0.45)',
        })
        holder.append(box)
        document.body.append(holder)
      },
      [CAPTION_ID, text, place],
    )
    .catch(() => {})
}

/** The made-up data every take shows, ready before the window opens. */
export async function prepareData() {
  prepareHome()
  demoRepository()
  return { standIn: await mediaStandIn() }
}

/** What the panes of a layout need to show something: a repository, a feed, the satellites. */
export function withDemoState(tree, standIn) {
  return withState(tree, {
    orbit: { starlink: true },
    agents: { open: SESSION },
    git: { repo: REPO_ID, graph: 'all', listWidth: 0.46 },
    rss: { feeds: [standIn.feedUrl] },
    spectrum: { bands: 16 },
    // The made-up log (demo-logfeed.mjs): written only while a take runs its writer.
    logwatch: { file: LOG_ID },
  })
}

/**
 * The window, on a profile whose saved layouts are `items` and whose workspace is the first of
 * them. Resolves with what a take drives it by. `env` is laid over the take's environment: a
 * take of its own stub (the Wi-Fi demo's train) says so there. `prepare` is given the profile
 * folder before the app starts, for what a take needs in it (a plugin's folder). `opening` are
 * the captions before the take: `log` over the boot log, `title` over its title card, `shell`
 * while the first shell is typed into (any of them may be left out). `captionPlace` is laid
 * over the caption's holder (`left`, `right`, `bottom`) where a pane fills the bottom centre.
 */
export async function openTake({
  items,
  options,
  standIn,
  env = {},
  settings = {},
  intro = false,
  opening = {},
  prepare = () => {},
  captionPlace = {},
}) {
  const profile = mkdtempSync(path.join(tmpdir(), 'elecdex-demo-'))
  writeFileSync(path.join(profile, 'layout.json'), JSON.stringify(items[0].tree))
  writeFileSync(
    path.join(profile, 'layouts.json'),
    JSON.stringify({ version: 1, items, active: items[0].id }),
  )
  writeFileSync(
    path.join(profile, 'settings.json'),
    JSON.stringify({
      theme: options.theme,
      sound: { enabled: true },
      updates: { check: false },
      launcher: {
        showSystem: false,
        items: [
          {
            name: 'Terminal',
            target: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
          },
          { name: 'Explorer', target: 'C:\\Windows\\explorer.exe' },
          { name: 'Notepad', target: 'C:\\Windows\\System32\\notepad.exe' },
          { name: 'Calculator', target: 'C:\\Windows\\System32\\calc.exe' },
          { name: 'elecdex on GitHub', target: 'https://github.com/kurouna/elecdex' },
        ],
      },
      // Every switch would end the shells: a take is about the layouts, not the question.
      layout: { confirmSwitch: false },
      ...settings,
    }),
  )
  gitRepos(profile)
  logFiles(profile)
  seedOrbits(profile)
  deskFiles(profile)
  prepare(profile)

  const app = await electron.launch({
    // `intro`: the boot sequence plays as the window opens, welcoming a made-up user.
    args: [
      MAIN,
      '--windowed',
      ...(intro ? [] : ['--no-intro']),
      `--user-data-dir=${profile}`,
      '--lang=en-US',
    ],
    // Run from the demo home: PowerShell writes a module cache relative to it.
    cwd: HOME,
    env: {
      ...process.env,
      USERPROFILE: HOME,
      HOMEPATH: '\\Users\\Public\\Documents\\elecdex-demo',
      HOME,
      // A take that brings its own Claude folder makes none here to leave behind.
      ...(env.ELECDEX_CLAUDE_DIR === undefined ? { ELECDEX_CLAUDE_DIR: claudeFolder() } : {}),
      ELECDEX_SOCKETS_STUB: 'demo',
      ELECDEX_WIFI_STUB: 'demo',
      // A made-up wired link (network and cockpit): never this machine's adapters.
      ELECDEX_ETHER_STUB: 'demo',
      ELECDEX_CLIPBOARD_STUB: 'demo',
      ELECDEX_NOWPLAYING_STUB: 'demo',
      // A made-up Docker engine (the dev layout): never this machine's containers.
      ELECDEX_DOCKER_STUB: 'demo',
      // A made-up GPU: never this machine's adapter or its load.
      ELECDEX_GPU_STUB: 'demo',
      ELECDEX_AUDIO_STUB: 'demo',
      ELECDEX_WEB_HOMES: standIn.homes,
      // No tray icon or system-wide shortcut from a recording run, and nothing kept awake.
      ELECDEX_BACKGROUND_STUB: '1',
      ELECDEX_AWAKE_STUB: '1',
      ELECDEX_DEMO_USER: 'taro',
      ELECDEX_DEMO_HOST: 'ELECDEX-DEMO',
      ...env,
    },
  })
  const page = await app.firstWindow()
  await noGamepads(page)
  const { width, height, x, y, zoom, pace } = options
  await app.evaluate(
    ({ BrowserWindow }, [w, h, left, top, factor]) => {
      const win = BrowserWindow.getAllWindows()[0]
      win.setContentSize(w, h)
      if (left === null || top === null) win.center()
      else win.setPosition(left, top)
      win.webContents.setZoomFactor(factor)
    },
    [width, height, x, y, zoom],
  )
  const closed = new Promise((resolve) => app.on('close', resolve))
  const wait = (ms) => Promise.race([page.waitForTimeout(ms * pace).catch(() => {}), closed])
  const end = () => {
    standIn.server.close()
    keepOrbits(profile)
  }
  process.on('exit', end)

  /** Something in the shell, so the first layout does not open on an empty prompt. */
  const shellAtWork = async () => {
    const shell = page
      .locator('[data-testid=pane][data-widget=terminal]:not(.hidden) .xterm-screen')
      .first()
    if ((await shell.count()) === 0) return
    // Typed into once the prompt is up: keys sent before it are lost to a shell still loading.
    // The pane names the shell's folder once it has started, and the prompt follows shortly -
    // the prompt itself cannot be waited for, since the shell is drawn on a canvas.
    // A shell in a tab group has its folder in the group's header rather than its own.
    await page
      .locator('[data-testid=pane-subtitle], [data-testid=group-subtitle]')
      .filter({ hasText: /[\\/]/ })
      .first()
      .waitFor({ timeout: 20_000 })
      .catch(() => {})
    await wait(1000)
    await shell.click()
    await page.keyboard.type(`cd "${PROJECT}"; Get-ChildItem -Name`, { delay: 25 })
    await page.keyboard.press('Enter')
    // Long enough for the listing to be read on screen, no longer.
    await wait(1200)
  }

  /** Waits until the arrangement has finished powering on. */
  const settled = () =>
    page
      .locator('[data-testid=workspace][data-switching=false]')
      .waitFor({ timeout: 15_000 })
      .catch(() => {})

  /**
   * A picture of the window every two seconds into `dir`, to look the take over afterwards.
   * Taken by the window rather than the page, so a zoomed page comes out as it is on screen
   * (the web panes, views of their own, are not in it; the recording has them).
   */
  const keepShots = (dir) => {
    if (dir === undefined) return
    mkdirSync(dir, { recursive: true })
    let shot = 0
    // Stopped with the window: a timer still set would keep Node running after the take.
    let over = false
    void closed.then(() => {
      over = true
    })
    const snap = async () => {
      if (over) return
      const name = String(shot++).padStart(3, '0')
      const png = await app
        .evaluate(async ({ BrowserWindow }) => {
          // The visible one: a spectrum pane opens a hidden capture window of its own.
          const win = BrowserWindow.getAllWindows().find((w) => w.isVisible())
          return win === undefined ? null : (await win.capturePage()).toPNG().toString('base64')
        })
        .catch(() => null)
      if (png !== null) writeFileSync(path.join(dir, `${name}.png`), Buffer.from(png, 'base64'))
      setTimeout(() => void snap(), 2000)
    }
    void snap()
  }

  /** A caption at the bottom (`showCaption`), or none for null; nothing with --no-captions. */
  const caption = async (text) => {
    if (!options.captions) return
    if (text !== null) say(`caption: ${text}`)
    await showCaption(page, text, captionPlace)
  }

  /**
   * The boot played out with the opening's captions, each put up as its part of the boot
   * appears. Only waits on what the page shows, so the boot takes as long as without them; a
   * click on it would skip it.
   */
  const bootPlays = async () => {
    const boot = page.getByTestId('boot-screen')
    if (opening.log !== undefined) {
      await boot.waitFor({ timeout: 60_000 }).catch(() => {})
      await caption(opening.log)
    }
    if (opening.title !== undefined) {
      await page
        .locator('[data-testid=boot-screen][data-phase=title]')
        .waitFor({ timeout: 60_000 })
        .catch(() => {})
      await caption(opening.title)
    }
    await boot.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {})
  }

  /** Waits out the probe, or the lead before the take; false when there is no take to run. */
  const ready = async () => {
    if (options.probe) {
      say(`probe: the window is ${width}x${height} - close it to end`)
      await closed
      return false
    }
    keepShots(options.shots)
    say(`window up - the take starts in ${options.lead} s`)
    await wait((options.lead * 1000) / pace)
    if (intro) await bootPlays()
    // The typing is the take's opening, and the first switch follows it at once.
    if (opening.shell !== undefined) await caption(opening.shell)
    say('shell: types')
    await shellAtWork()
    return true
  }

  /** Runs the take, then waits for the window to be closed. */
  const run = async (take) => {
    if (await ready()) {
      try {
        await take()
        say('done - close the window to end')
        await closed
      } catch (error) {
        say(`ended: ${error.message.split('\n')[0]}`)
      }
    }
    end()
    await app.close().catch(() => {})
  }

  return { app, page, wait, settled, run, caption }
}
