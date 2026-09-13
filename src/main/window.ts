import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BrowserWindow, screen, shell } from 'electron'

const PRELOAD = fileURLToPath(new URL('../preload/index.cjs', import.meta.url))
const RENDERER_HTML = fileURLToPath(new URL('../renderer/index.html', import.meta.url))

/**
 * The window and taskbar icon, generated from build/icon.svg. Found by walking up
 * from the bundle, since out/main sits two levels below resources/ in development
 * and inside app.asar when packaged. Packaged builds also carry the icon in the
 * executable; this matters for development runs and Linux.
 */
function windowIcon(): string | undefined {
  let dir = path.dirname(fileURLToPath(import.meta.url))
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, 'resources', 'icons', 'icon.png')
    if (existsSync(candidate)) return candidate
    dir = path.dirname(dir)
  }
  return undefined
}

export interface CreateWindowOptions {
  /** Index into `screen.getAllDisplays()`. Falls back to the primary display. */
  monitor?: number | undefined
  fullscreen: boolean
  devtools: boolean
}

export function createMainWindow(opts: CreateWindowOptions): BrowserWindow {
  const displays = screen.getAllDisplays()
  const display =
    (opts.monitor !== undefined ? displays[opts.monitor] : undefined) ?? screen.getPrimaryDisplay()

  const { x, y, width, height } = display.bounds
  const icon = windowIcon()

  const win = new BrowserWindow({
    title: 'elecdex',
    x,
    y,
    width,
    height,
    show: false,
    backgroundColor: '#000000',
    ...(icon ? { icon } : {}),
    autoHideMenuBar: true,
    frame: !opts.fullscreen,
    fullscreen: opts.fullscreen,
    webPreferences: {
      preload: PRELOAD,
      // The whole point of the rewrite: the renderer is a plain web page.
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Monitoring widgets must keep ticking when the window is not focused.
      backgroundThrottling: false,
      devTools: opts.devtools,
      spellcheck: false,
      // Interface sounds play from the first frame - the boot log - before any
      // user gesture could have unlocked audio.
      autoplayPolicy: 'no-user-gesture-required',
    },
  })

  win.once('ready-to-show', () => win.show())

  // Nothing in this app should ever open a second window or navigate away.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void openExternalIfSafe(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) event.preventDefault()
  })

  const devServerUrl = process.env.ELECTRON_RENDERER_URL
  if (devServerUrl) {
    void win.loadURL(devServerUrl)
  } else {
    void win.loadFile(RENDERER_HTML)
  }

  return win
}

/** Opens only http/https links externally; anything else is dropped. */
export async function openExternalIfSafe(rawUrl: string): Promise<void> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return
  await shell.openExternal(parsed.toString())
}
