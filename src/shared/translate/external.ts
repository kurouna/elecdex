/**
 * The address of a llama-server the user runs (docs/translate.md §4.1, §10). Every translation is
 * sent to it, so main takes only an http(s) origin: no user name or password in it (they would be
 * kept in a file and shown), no path (the API's paths are elecdex's), no other scheme.
 */

export type ExternalUrl =
  | { ok: true; origin: string; host: string; loopback: boolean }
  | { ok: false; problem: string }

export function parseExternalUrl(raw: unknown): ExternalUrl {
  if (typeof raw !== 'string' || raw.trim() === '' || raw.length > 300) {
    return { ok: false, problem: 'Enter the address of a running llama-server.' }
  }
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return { ok: false, problem: 'That is not an address (http://host:port).' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, problem: 'Only http and https addresses.' }
  }
  if (url.username !== '' || url.password !== '') {
    return { ok: false, problem: 'No user name or password in the address.' }
  }
  return { ok: true, origin: url.origin, host: url.host, loopback: isLoopback(url.hostname) }
}

/** Whether a host name is this machine: the footer warns about anything else. */
export function isLoopback(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  return host === 'localhost' || host === '::1' || /^127(\.\d{1,3}){3}$/.test(host)
}

/** Whether a server's `/props` says it runs PLaMo 3 Translate (its model path names it). */
export function servesPlamo(props: unknown): boolean {
  if (typeof props !== 'object' || props === null) return false
  const path = (props as { model_path?: unknown }).model_path
  return typeof path === 'string' && /plamo-3-translate/i.test(path)
}
