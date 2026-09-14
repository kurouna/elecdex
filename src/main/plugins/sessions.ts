import { BrowserWindow, net, type Session, session } from 'electron'
import { markHelperWindow } from '../app-windows.js'
import type { RawRequest } from './net.js'

/**
 * Where plugin requests go out from, and the sign-in window (docs/plugins.md 7.1).
 *
 * Each plugin that uses a sign-in session has its own persistent partition, so one plugin
 * never sees another's cookies and the workspace's session sees none of them. Requests
 * without a session use a shared in-memory partition that neither sends nor keeps cookies.
 * Neither kind grants a page any permission.
 */

const ANONYMOUS = 'elecdex-plugins'
const prepared = new WeakSet<Session>()
/** Open sign-in windows by plugin id. */
const signIns = new Map<string, { win: BrowserWindow; closed: Promise<void> }>()

const partition = (id: string) => `persist:plugin-${id}`

function prepare(ses: Session, userAgent: string | null): Session {
  if (prepared.has(ses)) return ses
  prepared.add(ses)
  ses.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  ses.setPermissionCheckHandler(() => false)
  // Sign-in pages and their bot checks refuse browsers that name themselves Electron.
  if (userAgent !== null) ses.setUserAgent(userAgent)
  return ses
}

/** Chromium's own user agent, without the Electron and app tokens. */
export function browserUserAgent(): string {
  return session.defaultSession.getUserAgent().replace(/\s(?:elecdex|Electron)\/\S+/gi, '')
}

export const pluginSession = (id: string): Session =>
  prepare(session.fromPartition(partition(id)), browserUserAgent())

const anonymousSession = (): Session => prepare(session.fromPartition(ANONYMOUS), null)

/** One GET through Chromium's network stack, redirects reported rather than followed. */
export function rawRequest(
  id: string,
  userAgent: string,
  options: Parameters<RawRequest>[0],
): ReturnType<RawRequest> {
  const ses = options.session ? pluginSession(id) : anonymousSession()
  return new Promise((resolve, reject) => {
    const request = net.request({
      url: options.url,
      method: 'GET',
      session: ses,
      useSessionCookies: options.session,
      redirect: 'manual',
      cache: 'no-store',
    })
    for (const [name, value] of Object.entries(options.headers)) request.setHeader(name, value)
    if (!options.session) request.setHeader('user-agent', userAgent)
    const timer = setTimeout(() => {
      request.abort()
      reject(new Error('the request timed out'))
    }, options.timeoutMs)
    const done = (): void => clearTimeout(timer)

    request.on('redirect', (_status, _method, location) => {
      done()
      request.abort()
      resolve({ redirect: location })
    })
    request.on('response', (response) => {
      const chunks: Buffer[] = []
      let size = 0
      response.on('data', (chunk: Buffer) => {
        size += chunk.byteLength
        if (size > options.maxBytes) {
          done()
          request.abort()
          reject(new Error(`the response is larger than ${options.maxBytes / 1024} KiB`))
          return
        }
        chunks.push(chunk)
      })
      response.on('end', () => {
        done()
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: new Uint8Array(Buffer.concat(chunks)),
        })
      })
      response.on('error', (error: Error) => {
        done()
        reject(error)
      })
    })
    request.on('error', (error) => {
      done()
      reject(error)
    })
    request.end()
  })
}

/**
 * The sign-in window for a plugin's session host. It has no preload and no permissions;
 * https navigation is allowed, because signing in often passes through another site, and
 * pop-ups open in the same window. Resolves when the user closes it. A plugin has one at a
 * time: asking again brings the open one forward.
 */
export function openSignIn(
  id: string,
  url: string,
  parent: BrowserWindow | undefined,
): Promise<void> {
  const open = signIns.get(id)
  if (open) {
    open.win.focus()
    return open.closed
  }
  const win = new BrowserWindow({
    width: 520,
    height: 760,
    title: 'sign in',
    autoHideMenuBar: true,
    ...(parent ? { parent } : {}),
    webPreferences: {
      session: pluginSession(id),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: false,
    },
  })
  markHelperWindow(win)
  const allowed = (target: string): boolean => {
    try {
      const parsed = new URL(target)
      return (
        parsed.protocol === 'https:' ||
        (parsed.protocol === 'http:' &&
          parsed.hostname === '127.0.0.1' &&
          process.env.ELECDEX_PLUGIN_HOST_MAP !== undefined)
      )
    } catch {
      return false
    }
  }
  const showOrigin = (): void => {
    try {
      win.setTitle(`sign in (plugin ${id}) - ${new URL(win.webContents.getURL()).origin}`)
    } catch {
      // No URL yet.
    }
  }
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    if (allowed(target)) void win.loadURL(target)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, target) => {
    if (!allowed(target)) event.preventDefault()
  })
  win.webContents.on('did-navigate', showOrigin)
  win.webContents.on('page-title-updated', (event) => {
    event.preventDefault()
    showOrigin()
  })
  void win.loadURL(url)
  const closed = new Promise<void>((resolve) =>
    win.once('closed', () => {
      signIns.delete(id)
      resolve()
    }),
  )
  signIns.set(id, { win, closed })
  return closed
}

/** Forgets everything the plugin's session holds: cookies, storage and cache. */
export async function signOut(id: string): Promise<void> {
  const ses = pluginSession(id)
  await ses.clearStorageData()
  await ses.clearCache()
  await ses.clearAuthCache()
}
