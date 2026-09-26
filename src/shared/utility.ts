/**
 * The UTILITY pane (docs/architecture.md section 5.16): small tools in one
 * pane, one shown at a time. What a pane keeps of them, and AWAKE's decisions,
 * are here and pure; QR's are in qr.ts and CODEC's in codec.ts.
 *
 * AWAKE keeps the machine from sleeping while the user says so. The hold is
 * main's - one for the whole machine, saved in awake.json and taken up again at
 * start - and never a pane's: pane state travels with saved layouts to other
 * machines, and there may be two panes, or none.
 */

import { CODEC_OPS, type CodecOp } from './codec.js'

/** The tools, in the order of the pane's switch. Add a tool here, never as a pane. */
export const UTILITY_MODULES = ['awake', 'qr', 'codec'] as const
export type UtilityModule = (typeof UTILITY_MODULES)[number]

// ---- AWAKE ----

/**
 * How much is kept awake. `display` keeps the system awake too - a screen that
 * stays on keeps the machine on - so there is no display-only level.
 */
export const AWAKE_LEVELS = ['off', 'system', 'display'] as const
export type AwakeLevel = (typeof AWAKE_LEVELS)[number]
export type HoldLevel = Exclude<AwakeLevel, 'off'>

const MINUTE = 60_000

/** The lengths offered, `null` for as long as it is not turned off. */
export const AWAKE_DURATIONS: readonly (number | null)[] = [
  null,
  30 * MINUTE,
  60 * MINUTE,
  120 * MINUTE,
  240 * MINUTE,
]
/** What `+30M` adds. */
export const AWAKE_EXTEND_MS = 30 * MINUTE
/** A hold never ends further than this from now, however often it is extended. */
export const AWAKE_MAX_MS = 24 * 60 * MINUTE

/** A hold as main keeps and saves it. */
export interface AwakeHold {
  level: AwakeLevel
  /** When it ends (epoch ms), or null for as long as it is not turned off. */
  until: number | null
  /** When the length it ends by was chosen: the start of the ring's arc. */
  since: number | null
}

/** Main's answer: the hold, and what is known about keeping it. */
export interface AwakeState extends AwakeHold {
  /** Whether the system took the request: false while off, and when it was refused. */
  held: boolean
  onBattery: boolean
}

export const RELEASED: AwakeHold = { level: 'off', until: null, since: null }

export type AwakeRequest = { level: 'off' } | { level: HoldLevel; forMs: number | null }

/** A request from the page, checked: only the levels and lengths offered. */
export function isAwakeRequest(value: unknown): value is AwakeRequest {
  if (typeof value !== 'object' || value === null) return false
  const { level, forMs } = value as { level?: unknown; forMs?: unknown }
  if (level === 'off') return true
  if (level !== 'system' && level !== 'display') return false
  return AWAKE_DURATIONS.includes(forMs as number | null)
}

/** The hold a request asks for, from `now`. */
export function holdFor(request: AwakeRequest, now: number): AwakeHold {
  if (request.level === 'off') return RELEASED
  if (request.forMs === null) return { level: request.level, until: null, since: now }
  return { level: request.level, until: now + request.forMs, since: now }
}

/**
 * A hold made longer: from its end, or from now if that has passed, and never
 * further than `AWAKE_MAX_MS` away. A hold with no end, or none, is as it was.
 */
export function extendHold(hold: AwakeHold, ms: number, now: number): AwakeHold {
  if (hold.level === 'off' || hold.until === null) return hold
  const until = Math.min(Math.max(hold.until, now) + ms, now + AWAKE_MAX_MS)
  return { ...hold, until }
}

export function holdExpired(hold: AwakeHold, now: number): boolean {
  return hold.level !== 'off' && hold.until !== null && now >= hold.until
}

/**
 * The hold saved last time, as it stands now: off when it has ended while
 * elecdex was not running, or when what was saved does not hang together (a
 * hand edit, a file from a newer version).
 */
export function restoreHold(saved: AwakeHold, now: number): AwakeHold {
  if (saved.level === 'off') return RELEASED
  const until = saved.until
  if (until !== null && (!Number.isFinite(until) || until <= now || until > now + AWAKE_MAX_MS)) {
    return RELEASED
  }
  const since = saved.since !== null && Number.isFinite(saved.since) ? saved.since : now
  return { level: saved.level, until, since: Math.min(since, now) }
}

/** What Electron's powerSaveBlocker is asked for. */
export type BlockerKind = 'prevent-app-suspension' | 'prevent-display-sleep'

export function blockerKind(level: AwakeLevel): BlockerKind | null {
  if (level === 'system') return 'prevent-app-suspension'
  if (level === 'display') return 'prevent-display-sleep'
  return null
}

/** The share of a timed hold still to run, for the ring: 1 with no end, 0 when off. */
export function holdFraction(hold: AwakeHold, now: number): number {
  if (hold.level === 'off') return 0
  if (hold.until === null) return 1
  const total = hold.until - (hold.since ?? now)
  if (total <= 0) return 0
  return Math.max(0, Math.min(1, (hold.until - now) / total))
}

const pad = (n: number): string => String(n).padStart(2, '0')

/** Time left as the tasks' T-minus has it: `01:24:08`, or `1d 02:05` past a day. */
export function tMinus(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const days = Math.floor(total / 86_400)
  const hours = Math.floor(total / 3600) % 24
  const minutes = Math.floor(total / 60) % 60
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}`
  return `${pad(hours)}:${pad(minutes)}:${pad(total % 60)}`
}

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

/** A moment as a clock time, with the weekday when it is not today. */
export function clockAt(at: number, now: number): string {
  const when = new Date(at)
  const today = new Date(now)
  const time = `${pad(when.getHours())}:${pad(when.getMinutes())}`
  return when.toDateString() === today.toDateString() ? time : `${WEEKDAYS[when.getDay()]} ${time}`
}

/**
 * The hold in a few words - `system · until 15:42`, `display · ∞` - for the
 * status bar, the tray's tooltip and the boot log; null when nothing is held.
 * Nothing in it counts down, so nothing has to redraw it every second.
 */
export function awakeLine(hold: AwakeHold, now: number): string | null {
  if (hold.level === 'off') return null
  return `${hold.level} · ${hold.until === null ? '∞' : `until ${clockAt(hold.until, now)}`}`
}

// ---- the pane's own choices ----

export const QR_KINDS = ['text', 'url', 'wifi'] as const
export type QrKind = (typeof QR_KINDS)[number]
export const QR_ECC = ['L', 'M', 'Q', 'H'] as const
export type QrEcc = (typeof QR_ECC)[number]
export const WIFI_AUTH = ['WPA', 'WEP', 'nopass'] as const
export type WifiAuth = (typeof WIFI_AUTH)[number]

export const UTILITY_LIMITS = {
  /** The longest text a code can carry is 2953 bytes; a little over, to say it does not fit. */
  qrText: 4000,
  ssid: 64,
  password: 128,
  /** A sealed password as the page keeps it. */
  sealed: 1024,
} as const

/** What a sealed secret starts with: the page keeps it, only main can read it. */
export const SEALED_PREFIX = 'v1:'

export function isSealed(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= UTILITY_LIMITS.sealed &&
    value.startsWith(SEALED_PREFIX) &&
    /^[A-Za-z0-9+/]+=*$/.test(value.slice(SEALED_PREFIX.length))
  )
}

/** A pane's choices, as its state holds them (widgetState). */
export interface UtilityPane {
  module: UtilityModule
  /** The length AWAKE's level buttons hold for. */
  awakeFor: number | null
  qrKind: QrKind
  qrText: string
  qrUrl: string
  qrEcc: QrEcc
  wifiSsid: string
  wifiAuth: WifiAuth
  wifiHidden: boolean
  /** The Wi-Fi password, sealed by main; never the password itself. */
  wifiSealed: string | null
  codecOp: CodecOp
}

const oneOf = <T extends string>(list: readonly T[], value: unknown, fallback: T): T =>
  list.includes(value as T) ? (value as T) : fallback

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.slice(0, max) : ''

/** A pane's state read with care: anything missing or out of shape is the default. */
export function readUtilityPane(state: Record<string, unknown> | undefined): UtilityPane {
  const s = state ?? {}
  return {
    module: oneOf(UTILITY_MODULES, s.module, 'awake'),
    awakeFor: AWAKE_DURATIONS.includes(s.awakeFor as number | null)
      ? (s.awakeFor as number | null)
      : null,
    qrKind: oneOf(QR_KINDS, s.qrKind, 'text'),
    qrText: text(s.qrText, UTILITY_LIMITS.qrText),
    qrUrl: text(s.qrUrl, UTILITY_LIMITS.qrText),
    qrEcc: oneOf(QR_ECC, s.qrEcc, 'M'),
    wifiSsid: text(s.wifiSsid, UTILITY_LIMITS.ssid),
    wifiAuth: oneOf(WIFI_AUTH, s.wifiAuth, 'WPA'),
    wifiHidden: s.wifiHidden === true,
    wifiSealed: isSealed(s.wifiSealed) ? s.wifiSealed : null,
    codecOp: oneOf(
      CODEC_OPS.map((op) => op.id),
      s.codecOp,
      'b64',
    ),
  }
}

/** What the page may ask main to put on the clipboard. */
export type UtilityCopy = { kind: 'text'; text: string } | { kind: 'png'; data: Uint8Array }

export const COPY_LIMITS = { text: 1_000_000, png: 4 * 1024 * 1024 } as const

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** A copy from the page, checked: text within bounds, or a PNG by its signature. */
export function isUtilityCopy(value: unknown): value is UtilityCopy {
  if (typeof value !== 'object' || value === null) return false
  const { kind, text: body, data } = value as { kind?: unknown; text?: unknown; data?: unknown }
  if (kind === 'text') return typeof body === 'string' && body.length <= COPY_LIMITS.text
  if (kind !== 'png' || !(data instanceof Uint8Array)) return false
  return (
    data.length > PNG_SIGNATURE.length &&
    data.length <= COPY_LIMITS.png &&
    PNG_SIGNATURE.every((byte, i) => data[i] === byte)
  )
}
