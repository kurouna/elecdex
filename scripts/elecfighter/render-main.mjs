// Electron's side of the bitmap renderer (started by mock.mjs, not by hand): a hidden window
// loads render.html from serve.mjs and draws every job in a JSON file with three.js's
// WebGLRenderer, writing the indices back to another JSON file.
//
//   electron scripts/elecfighter/render-main.mjs <jobs.json> <out.json>
import { readFileSync, writeFileSync } from 'node:fs'
import { app, BrowserWindow } from 'electron'
import { serve } from './serve.mjs'

const [jobsPath, outPath] = process.argv.slice(-2)

// SwiftShader (software WebGL): the same pixels on every machine, with or without a GPU.
// ELECFIGHTER_GPU=1 draws on the machine's GPU instead (a few edge pixels differ).
if (!process.env.ELECFIGHTER_GPU) {
  app.commandLine.appendSwitch('use-angle', 'swiftshader')
  app.commandLine.appendSwitch('enable-unsafe-swiftshader')
}

async function run() {
  const { url, close } = await serve()
  const win = new BrowserWindow({
    show: false,
    width: 320,
    height: 288,
    webPreferences: { backgroundThrottling: false, sandbox: true, contextIsolation: true },
  })
  win.webContents.on('console-message', (e) => {
    if (e.level === 'error' && !e.message.includes('GL Driver'))
      console.log('[page]', e.message.slice(0, 400))
  })
  win.webContents.on('render-process-gone', (_e, d) => console.error('renderer gone', d.reason))
  await win.loadURL(`${url}render.html`)
  await win.webContents.executeJavaScript(
    'new Promise((r) => { const t = () => (window.ready ? r() : setTimeout(t, 20)); t() })',
  )
  const info = await win.webContents.executeJavaScript('window.rendererInfo()')
  const jobs = JSON.parse(readFileSync(jobsPath, 'utf8'))
  const out = {}
  for (const [id, job] of Object.entries(jobs)) {
    out[id] = await win.webContents.executeJavaScript(`window.renderJob(${JSON.stringify(job)})`)
  }
  writeFileSync(outPath, JSON.stringify({ renderer: info, results: out }))
  close()
  win.destroy()
}

app.whenReady().then(
  () =>
    run().then(
      () => app.quit(),
      (e) => {
        console.error(e)
        app.exit(1)
      },
    ),
  () => app.exit(1),
)
