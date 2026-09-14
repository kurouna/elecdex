import { contextBridge, ipcRenderer } from 'electron'

/**
 * The capture window's whole bridge: two ways to report, and nothing to call
 * back into. The workspace's preload (index.ts) is not loaded here, so this page
 * can reach no shell, file or setting - and main listens to it only from this
 * window's own contents.
 *
 * The channel names are written out rather than imported from shared/channels:
 * a sandboxed preload must be a single file, and an import both preloads share
 * would be split into a chunk neither could load. tests/unit/audio.test.ts checks
 * they match CH.audioCapture.
 */
export const CAPTURE_CHANNELS = {
  frame: 'audio-capture:frame',
  status: 'audio-capture:status',
} as const

contextBridge.exposeInMainWorld('elecdexCapture', {
  frame: (bins: number[]) => ipcRenderer.send(CAPTURE_CHANNELS.frame, bins),
  status: (status: string, message: string | null) =>
    ipcRenderer.send(CAPTURE_CHANNELS.status, status, message),
})
