import { type Session, session } from 'electron'
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

/** Signs out of every site: cookies, storage and the cache. */
export async function clearWebData(): Promise<void> {
  const ses = webSession()
  await ses.clearStorageData()
  await ses.clearCache()
}
