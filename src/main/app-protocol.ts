import { fileURLToPath } from 'node:url'
import { protocol, type Session } from 'electron'
import { APP_SCHEME, appResponse } from './app-scheme.js'

/** The built renderer: what app://elecdex answers from, and nothing outside it. */
const RENDERER_ROOT = fileURLToPath(new URL('../renderer', import.meta.url))

/**
 * Makes app:// a standard, secure scheme, so the page served from it has an origin of its own
 * (its CSP's 'self' is that origin, never the disk) and its module scripts, workers and fonts
 * load as from any https site. Must run before the app is ready.
 */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, codeCache: true },
    },
  ])
}

const serving = new WeakSet<Session>()

/**
 * Answers app:// in one session: the main window's and the capture window's, only. Web panes
 * and plugin sign-in windows have sessions of their own, where the scheme answers nothing.
 */
export function serveApp(ses: Session): void {
  if (serving.has(ses)) return
  serving.add(ses)
  ses.protocol.handle(APP_SCHEME, (request) => appResponse(request.url, RENDERER_ROOT))
}
