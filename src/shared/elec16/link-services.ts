/**
 * What LINK (FF70-FF7E, docs/elec16.md section 12) can reach: main's services by number, and
 * each one's kinds (TYPE) and the most it answers. The core checks a request against this
 * table and knows nothing more of a service; main does the work (main/elec16/link). The ROM,
 * BASIC, e16c and the manuals take their names from here. Pure.
 *
 * Only the AI is built. Another service (quotes for candlesticks, say) is a line here and a
 * `LinkService` in main: the device, the page and the ROM's service stay as they are.
 */

export interface LinkServiceInfo {
  /** The name BASIC and the manuals use. */
  name: string
  /** Its kinds by TYPE, in order. */
  types: readonly string[]
  /** The most bytes it answers (MAX may not be larger). */
  max: number
}

/** The AI's types (shared/elec16/link-text.ts has what each asks of the model). */
export const AI_TYPES = [
  'NORMAL',
  'TUTOR',
  'BASIC',
  'QUIZ',
  'STORY',
  'POET',
  'FORTUNE',
  'DICT',
  'TRANS',
  'SEARCH',
  'WEATHER',
] as const
export type AiType = (typeof AI_TYPES)[number]

/** CART's types: the header of the cartridge in the slot, or that and the cartridge put in. */
export const CART_TYPES = ['INFO', 'LOAD'] as const

/** Services by their SERVICE number. */
export const LINK_SERVICES: readonly LinkServiceInfo[] = [
  { name: 'AI', types: AI_TYPES, max: 255 },
  // PLAY-320's cartridge (docs/elec16-play.md section 7): its 64-byte header.
  { name: 'CART', types: CART_TYPES, max: 64 },
]

export const LINK_SERVICE = { ai: 0, cart: 1 } as const

/** A question is 1 to this many bytes, ended by a zero. */
export const LINK_QUERY_MAX = 255

/** STATUS: what became of the last command. */
export const LINK_STATUS = {
  /** The answer is at REPLY, LENGTH bytes. */
  ready: 0,
  busy: 1,
  /** LINK, or this service, is off in the LINK panel. */
  off: 2,
  /** Nobody pressed anything since the last SEND. */
  held: 3,
  /** The service could not answer (no answer, a key refused, too slow, turned down). */
  failed: 4,
  /** A type the service does not have, an empty or unended question, a bad MAX or range. */
  badRequest: 5,
  /** The machine was put away while it waited. */
  interrupted: 6,
  cancelled: 7,
  noService: 8,
} as const

export const LINK_STATUS_NAMES = [
  'READY',
  'BUSY',
  'OFF',
  'HELD',
  'FAILED',
  'BAD REQUEST',
  'INTERRUPTED',
  'CANCELLED',
  'NO SERVICE',
] as const

/** CMD's values. */
export const LINK_CMD = { send: 1, fresh: 2, cancel: 3 } as const

export const LINK_REG = {
  cmd: 0xff70,
  service: 0xff72,
  type: 0xff74,
  query: 0xff76,
  reply: 0xff78,
  max: 0xff7a,
  status: 0xff7c,
  length: 0xff7e,
} as const

/** The service a request names and the type in it; null when there is no such service. */
export function linkServiceOf(service: number): LinkServiceInfo | null {
  return LINK_SERVICES[service] ?? null
}
