import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CH } from '@shared/channels'
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

/** Height of the page-drawn title bar, matched by the native controls overlay. */
export const TITLE_BAR_HEIGHT = 30

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
    // The OS title bar cannot be themed, so the page draws its own (hidden in
    // fullscreen) and the native window controls sit over it in the theme's
    // colours: Window Controls Overlay on Windows and Linux, the traffic lights
    // on macOS. The frame is kept, so resizing and snapping work as usual.
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin'
      ? { trafficLightPosition: { x: 12, y: 8 } }
      : {
          titleBarOverlay: { color: '#05080d', symbolColor: '#8fe3ea', height: TITLE_BAR_HEIGHT },
        }),
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

  // The page hides its title bar in fullscreen. enter/leave-full-screen do not
  // fire on Windows for a window with a hidden title bar, so every resize also
  // checks, and only a change is sent.
  let sentFullscreen: boolean | null = null
  const sendWindowState = (): void => {
    const fullscreen = win.isFullScreen()
    if (fullscreen === sentFullscreen || win.webContents.isDestroyed()) return
    sentFullscreen = fullscreen
    win.webContents.send(CH.system.windowStateChanged, { fullscreen })
  }
  win.on('enter-full-screen', sendWindowState)
  win.on('leave-full-screen', sendWindowState)
  win.on('resize', sendWindowState)
  win.webContents.on('did-start-navigation', () => {
    sentFullscreen = null
  })

  // Electron grants every permission request by default. elecdex needs none but
  // the clipboard, so everything else - location above all, which on Windows
  // raises a system prompt - is refused without asking the user.
  const allowed = new Set(['clipboard-read', 'clipboard-sanitized-write'])
  const session = win.webContents.session
  session.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(allowed.has(permission))
  })
  session.setPermissionCheckHandler((_contents, permission) => allowed.has(permission))

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

/** Applies theme colours to the native title bar controls, where the platform has an overlay. */
export function setTitleBarColors(
  win: BrowserWindow,
  colors: { background: string; symbols: string },
): void {
  if (process.platform === 'darwin') return
  try {
    win.setTitleBarOverlay({
      color: colors.background,
      symbolColor: colors.symbols,
      height: TITLE_BAR_HEIGHT,
    })
  } catch {
    // A window created without an overlay (none today) has nothing to paint.
  }
}
