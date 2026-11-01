/**
 * Emacs at work in a shell pane, for a short landscape video (X): keys reach a console program
 * as the keys they are (win32-input-mode, architecture.md §6.4), so `emacs -nw` runs as it would
 * in Windows Terminal - C-SPC, C-M-SPC and C-/ included.
 *
 * The take, in the standard preset's shell (the first of its three tabs):
 *   start     `emacs -nw notes.org` in the demo repository
 *   forward   C-x 3 in the layout, then Ctrl+Shift+Z brings the shell to the front; Emacs
 *             redraws both windows at the new size
 *   windows   dired on src/, C-x 2, src/clock.js in js-mode, line numbers by M-x
 *   marks     C-SPC and four lines down (the region lit), M-w; C-M-SPC over an array, C-w to cut
 *             it and C-/ to put it back
 *   org       the notes' heading opened with TAB
 *   tetris    M-x tetris in the notes' window, a few pieces turned and dropped
 *   end       M-x kill-emacs, and Ctrl+Shift+Z puts the shell back in the layout
 *
 * Emacs is the one thing of this machine it runs: `ELECDEX_DEMO_EMACS`, or the newest
 * %LOCALAPPDATA%\emacs-*\bin\emacs.exe, put on the take's PATH so only `emacs -nw` is typed.
 * Nothing else of this machine is read: HOME is the demo home (demo-take.mjs), where this take
 * writes Emacs's init.el (no splash, no backups, dired without owners) and the files it opens,
 * all made up here. The system column is this machine's readings, as in every take.
 * About 30 seconds, no captions.
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:emacs`.
 * 1600x900 unless told otherwise; the options are demo-take.mjs's (`takeOptions`) - `--theme`,
 * `--pace`, `--shots=<dir>` to look it over - and `--exit` closes the window at the end.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { HOME, PROJECT } from './demo-fixtures.mjs'
import { MAIN, openTake, prepareData, say, takeOptions } from './demo-take.mjs'
import { presetTrees } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 10 })
const exit = process.argv.includes('--exit')

/** The Emacs to run: the one named, or the newest of the GNU installer's folders. */
function findEmacs() {
  const named = process.env.ELECDEX_DEMO_EMACS
  if (named !== undefined) return existsSync(named) ? named : null
  const local = process.env.LOCALAPPDATA ?? ''
  const found = existsSync(local)
    ? readdirSync(local)
        .filter((name) => /^emacs-\d/.test(name))
        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
        .map((name) => path.join(local, name, 'bin', 'emacs.exe'))
        .filter((file) => existsSync(file))
    : []
  return found.at(-1) ?? null
}

const emacs = findEmacs()
if (emacs === null) {
  console.error(
    'demo:emacs needs Windows Emacs: set ELECDEX_DEMO_EMACS to its emacs.exe, or install it under %LOCALAPPDATA%\\emacs-<version>',
  )
  process.exit(1)
}

/** Emacs's settings in the demo home: nothing of the user's is loaded. */
// The cookie: without it Emacs 31 opens a *Warnings* window over a third of the frame.
const INIT = `;; Written by scripts/demo-emacs.mjs for the take.  -*- lexical-binding: t; -*-
(setq inhibit-startup-screen t
      ;; dired's header would say how much this machine's disk has free
      dired-free-space nil
      make-backup-files nil
      auto-save-default nil
      create-lockfiles nil
      ;; dired would list the files' owner, this machine's user
      ls-lisp-verbosity nil
      ring-bell-function #'ignore)
`

/** The notes the take opens first. */
const NOTES = `* elecdex: Emacs in a shell pane
** DONE win32-input-mode
   Keys go to ConPTY as Windows key events, as Windows Terminal sends them.
   - C-SPC sets the mark (it was read as C-" on a Japanese layout)
   - C-M-SPC marks an expression
   - C-/ undoes, C-. reaches the program
** TODO Try it
   1. Open a shell pane (Ctrl+Shift+A)
   2. Run emacs -nw
   3. Split, mark, undo, play
#+STARTUP: overview
`

/** The code the take marks, cuts and puts back. */
const CLOCK = `// A made-up clock face for the take: nothing here runs.

const DIALS = [
  { name: 'hours', turn: 12, hand: 0.5 },
  { name: 'minutes', turn: 60, hand: 0.75 },
  { name: 'seconds', turn: 60, hand: 0.9 },
]

function angle(value, turn) {
  return (value / turn) * 2 * Math.PI - Math.PI / 2
}

export function hands(now) {
  const values = [now.getHours() % 12, now.getMinutes(), now.getSeconds()]
  return DIALS.map((dial, i) => ({
    name: dial.name,
    angle: angle(values[i], dial.turn),
    length: dial.hand,
  }))
}

export function tick(draw) {
  draw(hands(new Date()))
  setTimeout(() => tick(draw), 1000 - (Date.now() % 1000))
}
`

const { standIn } = await prepareData()
// After prepareData, which lays the demo repository out afresh.
mkdirSync(path.join(HOME, '.emacs.d'), { recursive: true })
writeFileSync(path.join(HOME, '.emacs.d', 'init.el'), INIT)
writeFileSync(path.join(PROJECT, 'notes.org'), NOTES)
writeFileSync(path.join(PROJECT, 'src', 'clock.js'), CLOCK)

const trees = await presetTrees(MAIN)
const standard = trees.get('standard')
if (standard === undefined) throw new Error('no standard preset in the built app')

const { app, page, wait, settled, run } = await openTake({
  items: [{ id: 'emacs-standard', name: 'standard', preset: 'standard', tree: standard }],
  options,
  standIn,
  // The shell opens in the demo repository, at its prompt: the take's first line is Emacs.
  settings: { terminal: { fontSize: 15, startDirectory: PROJECT } },
  env: { PATH: `${path.dirname(emacs)};${process.env.PATH ?? ''}` },
  typeFirst: false,
})

/**
 * Whether a shell's screen shows `pattern` now: the screen as a pane attaching would get it
 * (Emacs draws on a canvas, so the page has no text to wait on).
 */
const screenShows = (pattern) =>
  page.evaluate(async (source) => {
    const decoder = new TextDecoder()
    for (const session of await window.elecdex.pty.list()) {
      let text = ''
      const off = await window.elecdex.pty.attach(session.id, {
        onData: (chunk) => {
          text += decoder.decode(chunk, { stream: true })
        },
        onExit() {},
        onCwd() {},
        onCommandEnd() {},
        onIntegrationUnavailable() {},
      })
      await new Promise((resolve) => setTimeout(resolve, 250))
      off()
      if (new RegExp(source).test(text)) return true
    }
    return false
  }, pattern.source)

/** Waits until a shell shows `pattern`, then lets it be seen for `ms`. */
async function until(pattern, ms = 0) {
  for (let i = 0; i < 60; i++) {
    if (await screenShows(pattern)) break
    await page.waitForTimeout(250)
  }
  await wait(ms)
}

/** Keys pressed one after another, as a hand would, with a pause after. */
async function keys(list, ms = 300, gap = 110) {
  for (const key of list) {
    await page.keyboard.press(key)
    await page.waitForTimeout(gap)
  }
  await wait(ms)
}

/** M-x and a command, typed and run. */
async function mx(command, ms = 600) {
  await page.keyboard.press('Alt+x')
  await wait(250)
  await page.keyboard.type(command, { delay: 40 })
  await wait(250)
  await page.keyboard.press('Enter')
  await wait(ms)
}

/** A line typed into Emacs's minibuffer, and Enter. */
async function answer(text, ms = 600) {
  await page.keyboard.type(text, { delay: 45 })
  await wait(200)
  await page.keyboard.press('Enter')
  await wait(ms)
}

const shell = page
  .locator('[data-testid=pane][data-widget=terminal]:not(.hidden) .xterm-screen')
  .first()

await run(async () => {
  await settled()
  const started = Date.now()

  say('start: emacs -nw notes.org')
  // Keys sent before the prompt are lost to a shell still loading: once it names its folder.
  await page
    .locator('[data-testid=pane-subtitle], [data-testid=group-subtitle]')
    .filter({ hasText: /[\\/]/ })
    .first()
    .waitFor({ timeout: 20_000 })
  await wait(800)
  await shell.click()
  await page.keyboard.type('emacs -nw notes.org', { delay: 45 })
  await page.keyboard.press('Enter')
  await until(/notes\.org/, 700)

  say('C-x 3 in the layout, then forward')
  // Emacs seen whole in the pane first: split at once, it looked as if it had opened split.
  await wait(1000)
  await keys(['Control+x', '3'], 700)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(1100)

  say('windows: dired, C-x 2, clock.js, line numbers')
  await keys(['Control+x', 'o'], 150)
  await keys(['Control+x', 'd'], 250)
  await answer('src', 700)
  await keys(['Control+x', '2'], 400)
  await keys(['Control+x', 'o'], 150)
  await keys(['Control+x', 'Control+f'], 250)
  await answer('clock.js', 700)
  await mx('display-line-numbers-mode', 700)

  say('marks: C-SPC, the region, M-w; C-M-SPC, C-w, C-/')
  await keys(['Alt+Shift+Comma', 'Control+n', 'Control+n'], 200)
  await keys(['Control+Space'], 600)
  await keys(['Control+n', 'Control+n', 'Control+n', 'Control+n', 'Control+e'], 900, 200)
  await keys(['Alt+w'], 500)
  // Back to the line that opens the array, before its bracket.
  await keys(['Control+p', 'Control+p', 'Control+p', 'Control+p', 'Control+e', 'Control+b'], 200)
  await keys(['Control+Alt+Space'], 1000)
  await keys(['Control+w'], 800)
  await keys(['Control+Slash'], 900)

  say('org: TAB on the heading')
  await keys(['Control+x', 'o'], 250)
  await keys(['Alt+Shift+Comma', 'Tab'], 1100)

  // In the notes' window: the board is taller than the half-height ones on the right.
  say('tetris')
  await mx('tetris', 900)
  for (const round of [
    ['ArrowUp', 'ArrowLeft', 'ArrowLeft', 'Space'],
    ['ArrowRight', 'ArrowRight', 'ArrowUp', 'Space'],
  ]) {
    await keys(round, 600, 150)
  }

  say('end: kill-emacs, and back into the layout')
  await mx('kill-emacs', 700)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(1500)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
