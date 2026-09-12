import type { AppInfo, ElecdexApi } from '@shared/api'
import { CH } from '@shared/channels'
import { contextBridge, ipcRenderer } from 'electron'

/**
 * The only bridge between the sandboxed renderer and the main process.
 *
 * Rules for this file:
 *  - never expose `ipcRenderer` itself, only narrow typed functions
 *  - never expose a function that takes a channel name from the caller
 *  - keep it free of Node API usage so it keeps working under `sandbox: true`
 */
const api: ElecdexApi = {
  system: {
    info: () => ipcRenderer.invoke(CH.system.info) as Promise<AppInfo>,
    openExternal: (url) => ipcRenderer.invoke(CH.system.openExternal, url) as Promise<void>,
    revealInFolder: (path) => ipcRenderer.invoke(CH.system.revealInFolder, path) as Promise<void>,
    toggleDevTools: () => ipcRenderer.send(CH.system.toggleDevTools),
    setFullscreen: (on) => ipcRenderer.send(CH.system.setFullscreen, on),
  },
}

contextBridge.exposeInMainWorld('elecdex', api)
