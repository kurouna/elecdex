import { app, type Session, session, type WebPreferences } from 'electron'
import { browserUserAgent } from '../user-agent.js'

/**
 * The one session every web pane shares (docs/architecture.md section 5.4): signing
 * in to YouTube in its pane signs the browser pane in too. It is never the
 * workspace's session, which is the boundary that matters.
 */
const PARTITION = 'persist:web'

/**
 * What pages may do: copy a link, and show a video full size. Everything else - the
 * location, the camera and microphone, notifications - is refused without asking.
 */
const ALLOWED = new Set(['clipboard-sanitized-write', 'fullscreen'])

let prepared: Session | null = null

export function webSession(): Session {
  if (prepared !== null) return prepared
  const ses = session.fromPartition(PARTITION)
  ses.setPermissionRequestHandler((_contents, permission, callback) =>
    callback(ALLOWED.has(permission)),
  )
  ses.setPermissionCheckHandler((_contents, permission) => ALLOWED.has(permission))
  // Nothing is saved from a pane: a download would land somewhere the user never chose.
  ses.on('will-download', (event) => event.preventDefault())
  // The spell checker would download its dictionaries from Google on first use.
  ses.setSpellCheckerEnabled(false)
  ses.setUserAgent(browserUserAgent())
  prepared = ses
  return ses
}

/**
 * How every page of a web pane runs, in its view or in a sign-in popup, besides its session (`webSession`): one object, so the two
 * cannot drift apart (found in review: the popup had DevTools in a packaged build).
 */
export function pagePreferences(): WebPreferences {
  return {
    sandbox: true,
    contextIsolation: true,
    nodeIntegration: false,
    webSecurity: true,
    allowRunningInsecureContent: false,
    spellcheck: false,
    devTools: !app.isPackaged,
  }
}

/**
 * Signs out of every site: cookies, storage and the cache, and the HTTP sign-ins (Basic, NTLM)
 * and connections the network keeps, which outlived the rest before (found in review).
 */
export async function clearWebData(): Promise<void> {
  const ses = webSession()
  await ses.clearStorageData()
  await ses.clearCache()
  await ses.clearAuthCache()
  await ses.closeAllConnections()
}
