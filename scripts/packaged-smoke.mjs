// The packaged app, started as a user would get it, checked once: it comes up on a new profile
// with the presets, a real shell answers through the unpacked node-pty, a preset is applied, the
// runAsNode fuse holds, and it quits. Run after `npm run package` (CI's package jobs) or
// `npm run package:dir`: node scripts/packaged-smoke.mjs [path to the executable].
//
// Playwright's _electron.launch cannot drive the packaged build (its fuses turn off --inspect), so
// the app is started with --remote-debugging-port and reached through CDP (docs/decisions.md,
// "パッケージ版への接続"). Every start gets a throwaway profile, the fuse check too: a start on
// the default profile once ran the packaged app on the developer's own.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { STUB_ENV } from '../tests/e2e/support/launch.ts'

const log = (...words) => console.log('[packaged-smoke]', ...words)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** The unpacked executable electron-builder left in release/, for this platform. */
function findExecutable() {
  const release = path.resolve('release')
  if (!existsSync(release)) throw new Error('no release/ folder: package the app first')
  for (const dir of readdirSync(release, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    const base = path.join(release, dir.name)
    const candidates =
      process.platform === 'win32'
        ? [path.join(base, 'elecdex.exe')]
        : process.platform === 'darwin'
          ? [path.join(base, 'elecdex.app', 'Contents', 'MacOS', 'elecdex')]
          : [path.join(base, 'elecdex')]
    const found = candidates.find((file) => existsSync(file))
    if (found) return found
  }
  throw new Error(`no packaged elecdex under ${release}`)
}

/** A port no one listens on, for the debugging endpoint. */
function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
    server.on('error', reject)
  })
}

/** Ends the process tree of `pid`. */
function kill(pid) {
  if (pid === undefined) return
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'])
  else {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {}
  }
}

// A CI runner's chrome-sandbox is not owned by root, so Linux starts it unsandboxed there.
const sandbox = process.platform === 'linux' && process.env.CI ? ['--no-sandbox'] : []
// A first start, as a new user's: the presets are seeded.
const env = { ...process.env, ...STUB_ENV, ELECDEX_SEED_LAYOUTS: '1' }

async function smoke(exe) {
  const profile = mkdtempSync(path.join(tmpdir(), 'elecdex-packaged-'))
  const port = await freePort()
  const child = spawn(
    exe,
    [
      '--windowed',
      '--no-intro',
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${port}`,
      ...sandbox,
    ],
    { env, stdio: 'ignore' },
  )
  let browser
  try {
    for (let i = 0; i < 60 && !browser; i++) {
      browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`).catch(() => undefined)
      if (!browser) await sleep(500)
    }
    if (!browser) throw new Error('the packaged app never opened its debugging endpoint')
    let page
    for (let i = 0; i < 60 && !page; i++) {
      page = browser
        .contexts()
        .flatMap((c) => c.pages())
        .find((p) => p.url().startsWith('app://'))
      if (!page) await sleep(250)
    }
    if (!page) throw new Error('no app:// page')
    await page.locator('[data-testid=workspace][data-loaded=true]').waitFor({ timeout: 30_000 })
    const info = await page.evaluate(() => window.elecdex.system.info())
    if (info.isPackaged !== true) throw new Error('system.info says this is not the packaged app')
    log(`up: elecdex ${info.version} on ${process.platform}`)

    // A new profile is given the presets (a first start).
    const saved = await page.evaluate(() => window.elecdex.layout.saved.list())
    if (saved.length < 9)
      throw new Error(`a first start has ${saved.length} saved layouts, not the presets`)

    // A real shell through the unpacked node-pty: what it echoes comes back.
    const marker = `PACKAGED${Date.now()}`
    const echoed = await page.evaluate(async (m) => {
      const session = await window.elecdex.pty.create({ cols: 100, rows: 30 })
      const decoder = new TextDecoder()
      let text = ''
      const seen = new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), 20_000)
        void window.elecdex.pty.attach(session.id, {
          onData: (chunk) => {
            text += decoder.decode(chunk, { stream: true })
            if (text.includes(`${m}-OK`)) {
              clearTimeout(timer)
              resolve(true)
            }
          },
          onExit: () => {},
          onCwd: () => {},
          onCommandEnd: () => {},
          onIntegrationUnavailable: () => {},
        })
        setTimeout(() => window.elecdex.pty.write(session.id, `echo ${m}-OK\r`), 1500)
      })
      const ok = await seen
      await window.elecdex.pty.dispose(session.id)
      return ok
    }, marker)
    if (!echoed) throw new Error('the shell did not echo: node-pty in the package')
    log('a shell answered')

    // A preset is applied and drawn.
    const first = saved[0]
    await page.evaluate((id) => window.elecdex.layout.saved.apply(id), first.id)
    await page.reload()
    await page.locator('[data-testid=workspace][data-loaded=true]').waitFor({ timeout: 30_000 })
    const faults = await page.locator('[data-testid=pane-fault]').count()
    if (faults > 0) throw new Error(`${faults} panes faulted on the "${first.name}" layout`)
    log(`the "${first.name}" layout drew without a fault`)
    await browser.close()
  } finally {
    kill(child.pid)
    await sleep(1000)
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
}

/** The runAsNode fuse: told to run as Node, the executable must not. */
function fuse(exe) {
  const profile = mkdtempSync(path.join(tmpdir(), 'elecdex-packaged-'))
  try {
    const result = spawnSync(
      exe,
      ['-e', 'console.log("RAN-AS-NODE")', `--user-data-dir=${profile}`, ...sandbox],
      { env: { ...env, ELECTRON_RUN_AS_NODE: '1' }, timeout: 15_000, encoding: 'utf8' },
    )
    kill(result.pid)
    if ((result.stdout ?? '').includes('RAN-AS-NODE')) throw new Error('the runAsNode fuse is off')
    log('the runAsNode fuse holds')
  } finally {
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
}

const exe = process.argv[2] ? path.resolve(process.argv[2]) : findExecutable()
log(`checking ${exe}`)
await smoke(exe)
fuse(exe)
log('passed')
