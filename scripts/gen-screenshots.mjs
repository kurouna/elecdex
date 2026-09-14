/**
 * README screenshots (docs/screenshots/*.jpg): the default layout in a clean demo
 * profile, so no personal paths, Start Menu entries or files appear. Live data
 * (markets, weather, globe) comes from the real services.
 *
 * Windows only, as written: the demo home is under C:/Users/Public. Run
 * `npm run build` first, then `npm run gen:screenshots`.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron } from '@playwright/test'

const OUT = path.resolve('docs/screenshots')
const MAIN = path.resolve('out/main/index.js')
const HOME = 'C:\\Users\\Public\\Documents\\elecdex-demo'
const PROJECT = `${HOME}\\projects\\elecdex`
const W = 1600
const H = 900

mkdirSync(OUT, { recursive: true })

// A demo home that looks like a checkout of this project.
for (const dir of ['Documents', 'Downloads', 'docs', 'public', 'scripts', 'src', 'tests']) {
  const parent = ['Documents', 'Downloads'].includes(dir) ? HOME : PROJECT
  mkdirSync(path.join(parent, dir), { recursive: true })
}
for (const file of ['README.md', 'package.json', 'LICENSE', 'biome.json', 'tsconfig.json']) {
  writeFileSync(path.join(PROJECT, file), '')
}

const launcherItems = [
  { name: 'Terminal', target: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe' },
  { name: 'Command Prompt', target: 'C:\\Windows\\System32\\cmd.exe' },
  { name: 'Explorer', target: 'C:\\Windows\\explorer.exe' },
  { name: 'Notepad', target: 'C:\\Windows\\System32\\notepad.exe' },
  { name: 'Calculator', target: 'C:\\Windows\\System32\\calc.exe' },
  { name: 'Task Manager', target: 'C:\\Windows\\System32\\taskmgr.exe' },
  { name: 'elecdex on GitHub', target: 'https://github.com/kurouna/elecdex' },
]

async function shoot(theme, name, extra) {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-readme-'))
  writeFileSync(
    path.join(dir, 'settings.json'),
    JSON.stringify({
      theme,
      sound: { enabled: false },
      updates: { check: false },
      launcher: { showSystem: false, items: launcherItems },
    }),
  )
  const app = await electron.launch({
    args: [MAIN, '--windowed', '--no-intro', `--user-data-dir=${dir}`, '--lang=en-US'],
    // Run from the demo home: PowerShell writes a module cache relative to it.
    cwd: HOME,
    env: {
      ...process.env,
      USERPROFILE: HOME,
      HOMEPATH: '\\Users\\Public\\Documents\\elecdex-demo',
      HOME,
    },
  })
  const page = await app.firstWindow()
  await app.evaluate(
    ({ BrowserWindow }, [w, h]) => {
      const win = BrowserWindow.getAllWindows()[0]
      win.setContentSize(w, h)
      win.center()
    },
    [W, H],
  )
  await page.waitForTimeout(4000)
  const terminal = page
    .locator('[data-testid=pane][data-widget=terminal]:not(.hidden) .xterm-helper-textarea')
    .first()
  await terminal.focus()
  await page.keyboard.type(`cd "${PROJECT}"; Get-ChildItem -Name`)
  await page.keyboard.press('Enter')
  // Long enough for markets, weather and the globe to fill in.
  await page.waitForTimeout(25000)
  await page.mouse.move(W / 2, H / 3)
  if (extra) await extra(page)
  await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 88 })
  await app.close()
}

// One of every built-in theme: the README shows Tron large and the rest in a table.
for (const theme of ['tron', 'amber', 'phosphor', 'white', 'business-dark', 'business-light']) {
  await shoot(theme, `elecdex-${theme}`)
}
await shoot('tron', 'elecdex-settings', async (page) => {
  await page.keyboard.press('Control+Shift+Comma')
  await page.locator('[data-testid=settings-section][data-section=keyboard]').click()
  await page.waitForTimeout(600)
})
console.log(`wrote ${OUT}`)
