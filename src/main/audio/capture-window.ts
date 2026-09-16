import { fileURLToPath } from 'node:url'
import { type AudioStub, SPECTRUM_BINS, type SpectrumUpdate } from '@shared/audio'
import { CH } from '@shared/channels'
import { BrowserWindow, desktopCapturer, type IpcMainEvent, ipcMain, session } from 'electron'
import { markHelperWindow } from '../app-windows.js'

/**
 * The hidden window that captures the system's sound for the spectrum panes.
 *
 * Electron captures what the computer plays only through screen capture with
 * loopback audio, and grants that to a page, not to main. The page doing it is
 * kept apart from the workspace:
 *
 *  - its own in-memory session, whose handlers grant display capture to this
 *    window alone - the workspace's session still refuses every permission but
 *    the clipboard;
 *  - its own preload (preload/audio-capture.ts), which can only report frames and
 *    a status - no shell, file or setting is reachable from it;
 *  - a page with no network, no styles and no navigation, which stops the video
 *    track unread and sends on only spectrum levels, checked here.
 *
 * It exists only while a spectrum pane is showing (ipc/audio.ts) and is marked as
 * a helper window, so nothing takes it for the elecdex window. Linux has no
 * loopback capture through Electron, so there only the test stubs use this window;
 * the real sound comes from parec (pulse-capture.ts).
 */

const PRELOAD = fileURLToPath(new URL('../preload/audio-capture.cjs', import.meta.url))
const PAGE = fileURLToPath(new URL('../renderer/audio-capture.html', import.meta.url))
const PARTITION = 'elecdex-audio-capture'

export interface CaptureWindow {
  close(): void
}

let sessionReady = false

/** The capture session's handlers, set once: display capture for the capture page only. */
function captureSession(): Electron.Session {
  const ses = session.fromPartition(PARTITION)
  if (sessionReady) return ses
  sessionReady = true
  const allowed = new Set(['media', 'display-capture'])
  ses.setPermissionRequestHandler((_contents, permission, callback) =>
    callback(allowed.has(permission)),
  )
  ses.setPermissionCheckHandler((_contents, permission) => allowed.has(permission))
  ses.setDisplayMediaRequestHandler(
    (_request, callback) => {
      // A screen must come with the audio; the page stops its track at once.
      desktopCapturer
        .getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } })
        .then(([screen]) => callback(screen ? { video: screen, audio: 'loopback' } : {}))
        .catch(() => callback({}))
    },
    { useSystemPicker: false },
  )
  return ses
}

/** Frames as the capture page sends them, or null for anything else. */
export function validBins(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length !== SPECTRUM_BINS) return null
  for (const value of raw) {
    if (typeof value !== 'number' || !(value >= 0 && value <= 1)) return null
  }
  return raw as number[]
}

export function openCaptureWindow(options: {
  stub: AudioStub | null
  onUpdate: (update: SpectrumUpdate) => void
}): CaptureWindow {
  const win = new BrowserWindow({
    show: false,
    width: 64,
    height: 64,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      partition: PARTITION,
      preload: PRELOAD,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      // A hidden window is throttled; the spectrum must keep its pace.
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
      devTools: false,
      spellcheck: false,
    },
  })
  markHelperWindow(win)
  captureSession()
  const contents = win.webContents
  const fromHere = (event: IpcMainEvent) => !contents.isDestroyed() && event.sender === contents

  const onFrame = (event: IpcMainEvent, raw: unknown): void => {
    if (!fromHere(event)) return
    const bins = validBins(raw)
    if (bins) options.onUpdate({ t: 'frame', bins })
  }
  const onStatus = (event: IpcMainEvent, status: unknown, message: unknown): void => {
    if (!fromHere(event) || (status !== 'running' && status !== 'failed')) return
    options.onUpdate({
      t: 'status',
      status,
      message: typeof message === 'string' ? message.slice(0, 300) : null,
    })
  }
  ipcMain.on(CH.audioCapture.frame, onFrame)
  ipcMain.on(CH.audioCapture.status, onStatus)

  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  contents.on('will-navigate', (event) => event.preventDefault())
  contents.on('render-process-gone', (_event, details) => {
    options.onUpdate({
      t: 'status',
      status: 'failed',
      message: `capture stopped (${details.reason})`,
    })
  })

  const query = options.stub ? { stub: options.stub } : undefined
  const devServerUrl = process.env.ELECTRON_RENDERER_URL
  if (devServerUrl) {
    void win.loadURL(`${devServerUrl}/audio-capture.html${query ? `?stub=${query.stub}` : ''}`)
  } else {
    void win.loadFile(PAGE, query ? { query } : {})
  }

  let closed = false
  return {
    close: () => {
      if (closed) return
      closed = true
      ipcMain.removeListener(CH.audioCapture.frame, onFrame)
      ipcMain.removeListener(CH.audioCapture.status, onStatus)
      if (!win.isDestroyed()) win.destroy()
    },
  }
}
