/**
 * The app version, baked in at build time from package.json.
 *
 * `app.getVersion()` is unreliable for us: Electron reads it from the app
 * directory's package.json, and `out/` (what `electron-vite dev` and the e2e
 * suite run) has none - so it would report the Electron version instead.
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0-unknown'
