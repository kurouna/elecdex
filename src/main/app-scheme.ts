import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

/**
 * The scheme the built page is served from (issue 29). As a file:// document its CSP's 'self'
 * was the whole file scheme, so a plugin's blob worker - which inherits that CSP - could load
 * any file on the disk with import() (plugin-containment.spec.ts measured it). Served from
 * app://elecdex, 'self' is the renderer's own files and nothing else.
 *
 * Pure apart from reading the file: app-protocol.ts registers it with Electron.
 */

export const APP_SCHEME = 'app'
export const APP_HOST = 'elecdex'
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`

/** A page of the renderer by its file name, with a query when it takes one. */
export function appPage(file: string, query: Record<string, string> = {}): string {
  const search = new URLSearchParams(query).toString()
  return `${APP_ORIGIN}/${file}${search === '' ? '' : `?${search}`}`
}

/**
 * The kinds of file the page loads, with the type each is answered with; anything else is not
 * answered. The build makes html, scripts, a stylesheet and fonts.
 */
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

/**
 * The file of `root` a URL of the scheme names, or null when it names none: another host, a
 * path that would leave the folder however it is spelt (`..`, encoded or with backslashes), a
 * drive, a NUL. The bare origin is the index page.
 */
export function rendererFile(raw: string, root: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== `${APP_SCHEME}:` || url.hostname !== APP_HOST) return null
  let relative: string
  try {
    relative = decodeURIComponent(url.pathname)
  } catch {
    return null
  }
  if (relative === '/') relative = '/index.html'
  // Only plain forward-slash names: no backslash, drive, NUL or empty segment.
  if (/[\\\0:]/.test(relative) || relative.includes('//')) return null
  const segments = relative.slice(1).split('/')
  if (segments.some((s) => s === '' || s === '.' || s === '..')) return null
  const file = path.resolve(root, ...segments)
  const inside = path.relative(root, file)
  if (inside === '' || inside.startsWith('..') || path.isAbsolute(inside)) return null
  return file
}

const notFound = (): Response => new Response(null, { status: 404 })

/** The scheme's answer to a request: the file with its type, or a 404 for anything else. */
export async function appResponse(raw: string, root: string): Promise<Response> {
  const file = rendererFile(raw, root)
  const type = file === null ? undefined : TYPES[path.extname(file).toLowerCase()]
  if (file === null || type === undefined) return notFound()
  try {
    if (!(await stat(file)).isFile()) return notFound()
    return new Response(new Uint8Array(await readFile(file)), {
      status: 200,
      headers: { 'content-type': type },
    })
  } catch {
    return notFound()
  }
}
