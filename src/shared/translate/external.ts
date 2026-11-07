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
  return /plamo-3-translate/i.test(modelPath(props) ?? '')
}

/**
 * A model an external server runs, as ENGINE shows it in place of elecdex's list (user's request
 * 2026-11-07): the server runs its own model whatever elecdex has chosen.
 */
export interface ServerModel {
  /** The file name (`plamo-3-translate-0.8b-Q4_K_M.gguf`), or the id the server lists it by. */
  name: string
  bytes: number | null
  params: number | null
}

const MAX_SERVER_MODELS = 16

/**
 * The models a llama-server runs, from its `/props` and `/v1/models`. One model is named by the
 * file in `/props` (its id in `/v1/models` is the alias it was started with, which may say
 * nothing); a router's several are named by their ids. Sizes come from `/v1/models`'s `meta`, and
 * are null where it is missing or did not answer.
 */
export function serverModels(props: unknown, list: unknown): ServerModel[] {
  const entries = listEntries(list)
  const file = modelPath(props)?.split(/[\\/]/).pop() ?? ''
  if (entries.length <= 1) {
    const name = file || entries[0]?.name || ''
    return name
      ? [{ name, bytes: entries[0]?.bytes ?? null, params: entries[0]?.params ?? null }]
      : []
  }
  return entries
}

function modelPath(props: unknown): string | null {
  if (typeof props !== 'object' || props === null) return null
  const path = (props as { model_path?: unknown }).model_path
  return typeof path === 'string' ? path.slice(0, 1000) : null
}

function listEntries(list: unknown): ServerModel[] {
  const data = typeof list === 'object' && list !== null ? (list as { data?: unknown }).data : null
  if (!Array.isArray(data)) return []
  return data.slice(0, MAX_SERVER_MODELS).flatMap((raw): ServerModel[] => {
    if (typeof raw !== 'object' || raw === null) return []
    const { id, meta } = raw as { id?: unknown; meta?: unknown }
    if (typeof id !== 'string' || id === '') return []
    const m = typeof meta === 'object' && meta !== null ? (meta as Record<string, unknown>) : {}
    return [{ name: id.slice(0, 200), bytes: count(m.size), params: count(m.n_params) }]
  })
}

function count(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}
