/**
 * Every IPC channel name used by the app, in one place.
 *
 * `main`, `preload` and `renderer` all import from here so a renamed channel is
 * a compile error rather than a silent no-op.
 */
export const CH = {
  system: {
    info: 'system:info',
    openExternal: 'system:open-external',
    revealInFolder: 'system:reveal-in-folder',
    toggleDevTools: 'system:toggle-devtools',
    setFullscreen: 'system:set-fullscreen',
  },
} as const

/** Channels the renderer is allowed to `invoke`. */
export type InvokeChannel =
  | typeof CH.system.info
  | typeof CH.system.openExternal
  | typeof CH.system.revealInFolder

/** Channels the renderer is allowed to `send` (fire and forget). */
export type SendChannel = typeof CH.system.toggleDevTools | typeof CH.system.setFullscreen
