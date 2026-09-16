/**
 * Formatting for the HUD readouts. Pure, so every edge case is unit-tested.
 */

const TIB = 1024 ** 4
const GIB = 1024 ** 3
const MIB = 1024 ** 2

/** "7.7 GiB" / "512 MiB" - binary units, as eDEX-UI's memory panel used. */
export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes >= TIB) return `${(bytes / TIB).toFixed(digits)} TiB`
  if (bytes >= GIB) return `${(bytes / GIB).toFixed(digits)} GiB`
  if (bytes >= MIB) return `${(bytes / MIB).toFixed(digits)} MiB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(digits)} KiB`
  return `${Math.round(bytes)} B`
}

/** "1.32 GB" / "158 MB" - decimal units for network totals, as the original did. */
export function formatTotal(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000
    unit += 1
  }
  const digits = value >= 100 || unit === 0 ? 0 : 2
  return `${value.toFixed(digits)} ${units[unit]}`
}

/** Bytes per second as megabytes per second - the "MB/S" of the traffic chart. */
export function toMegabytesPerSecond(bytesPerSecond: number): number {
  return Number.isFinite(bytesPerSecond) && bytesPerSecond > 0 ? bytesPerSecond / 1_000_000 : 0
}

/**
 * Uptime as "d:hh:mm", the format of eDEX-UI's UPTIME cell ("1:09:51" is one
 * day, nine hours, fifty-one minutes).
 */
export function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00:00'
  const total = Math.floor(seconds / 60)
  const minutes = total % 60
  const hours = Math.floor(total / 60) % 24
  const days = Math.floor(total / 1440)
  return `${days}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** "12%" / "0.4%" - one decimal below 10, none above, never negative or NaN. */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0%'
  if (value < 10) return `${(Math.round(value * 10) / 10).toString()}%`
  return `${Math.round(value)}%`
}

/** Clock digits. `twelveHour` returns the suffix separately so it can be styled. */
export function formatClock(
  date: Date,
  twelveHour = false,
): { hh: string; mm: string; ss: string; suffix: string | null } {
  let hours = date.getHours()
  let suffix: string | null = null
  if (twelveHour) {
    suffix = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
  }
  return {
    hh: String(hours).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0'),
    suffix,
  }
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

/** "APR 29" */
export function formatMonthDay(date: Date): string {
  return `${MONTHS[date.getMonth()] ?? ''} ${date.getDate()}`
}

/** "SUN" */
export function formatWeekday(date: Date): string {
  return WEEKDAYS[date.getDay()] ?? ''
}

/** The short OS label of eDEX-UI's TYPE cell. */
export function osLabel(platform: string): string {
  const p = platform.toLowerCase()
  if (p.startsWith('win')) return 'win'
  if (p === 'darwin' || p.startsWith('mac')) return 'macOS'
  if (p === '') return '--'
  return p
}

export interface OsVersionParts {
  platform: string
  distro: string
  release: string
  /** Optional: a sample cached by an older collector lacks the newer fields. */
  codename?: string
  build?: string
  kernel?: string
  arch: string
}

/** A reported value, or '' where the source had none ("unknown" on some Linux). */
const known = (value: string | undefined): string => {
  const v = (value ?? '').trim()
  return v === 'unknown' ? '' : v
}

const joinParts = (parts: readonly string[]): string => parts.filter((p) => p !== '').join(' ')

const wrapped = (before: string, value: string, after = ''): string =>
  value === '' ? '' : `${before}${value}${after}`

function windowsVersion(os: OsVersionParts): string {
  return joinParts([
    known(os.distro).replace(/^Microsoft\s+/i, ''),
    wrapped('Version ', known(os.codename)),
    wrapped('(Build ', known(os.build), ')'),
    known(os.arch),
  ])
}

function macVersion(os: OsVersionParts): string {
  const name = known(os.distro)
  const codename = known(os.codename)
  // systeminformation falls back to "macOS" as the codename of a release it does not know.
  const nickname = name.toLowerCase().includes(codename.toLowerCase()) ? '' : codename
  return joinParts([
    name,
    nickname,
    known(os.release),
    wrapped('(Build ', known(os.build), ')'),
    known(os.arch),
  ])
}

function unixVersion(os: OsVersionParts): string {
  const kernelName = os.platform === 'linux' ? 'Linux' : known(os.platform)
  return joinParts([
    known(os.distro),
    known(os.release),
    wrapped('(', known(os.codename), ')'),
    wrapped(`· ${kernelName} `, known(os.kernel)),
    known(os.arch),
  ])
}

/**
 * The OS cell, in each platform's own words:
 * "Windows 11 Pro Version 25H2 (Build 26200.9457) x64",
 * "macOS Sequoia 15.1 (Build 24B83) arm64",
 * "Ubuntu 24.04.1 LTS (Noble Numbat) · Linux 6.8.0-45-generic x64".
 * The host name is left out on purpose: screenshots get shared.
 */
export function osVersionLabel(os: OsVersionParts): string {
  const p = os.platform.toLowerCase()
  let label: string
  if (p.startsWith('win')) label = windowsVersion(os)
  else if (p === 'darwin' || p.startsWith('mac')) label = macVersion(os)
  else label = unixVersion(os)
  return label === '' ? '--' : label
}

/**
 * The POWER cell: a percentage on battery, CHARGE while charging, WIRED on a
 * machine with no battery - the same three states the original showed.
 */
export function powerLabel(battery: {
  hasBattery: boolean
  percent: number | null
  isCharging: boolean
  acConnected: boolean
}): string {
  if (!battery.hasBattery) return battery.acConnected ? 'WIRED' : '--'
  if (battery.isCharging) return 'CHARGE'
  return battery.percent === null ? '--' : `${Math.round(battery.percent)}%`
}

/** Below this charge the battery is drawn in the danger colour. */
export const LOW_BATTERY_PERCENT = 20

/**
 * The battery gauge beside the POWER value: its charge, rounded, whether it is
 * low, and whether power is connected - charging, or plugged in and holding a full
 * charge, which Windows reports as not charging. Null on a machine without a
 * battery or without a reading.
 */
export function batteryGauge(battery: {
  hasBattery: boolean
  percent: number | null
  isCharging: boolean
  acConnected: boolean
}): { percent: number; low: boolean; charging: boolean; plugged: boolean } | null {
  if (!battery.hasBattery || battery.percent === null || !Number.isFinite(battery.percent)) {
    return null
  }
  const percent = Math.max(0, Math.min(100, Math.round(battery.percent)))
  return {
    percent,
    low: percent < LOW_BATTERY_PERCENT,
    charging: battery.isCharging,
    plugged: battery.isCharging || battery.acConnected,
  }
}

/**
 * Keeps at most the first `words` words of a hardware string, dropping words
 * that repeat a context already shown (eDEX-UI trimmed "HP HP EliteBook..."
 * the same way).
 */
export function trimHardware(value: string, words = 2, ...exclude: string[]): string {
  const skip = new Set(exclude.flatMap((e) => e.toLowerCase().split(/\s+/)).filter(Boolean))
  const kept = value
    .trim()
    .split(/\s+/)
    .filter((w) => w !== '' && !skip.has(w.toLowerCase()))
    .slice(0, words)
  return kept.length === 0 ? '--' : kept.join(' ')
}

/** A transfer rate: "12.4 MiB/s", "0 B/s". */
export function formatRate(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`
}

/** How full a volume is, for its bar: warn from 90%, full from 97%. */
export function fillLevel(fraction: number): 'ok' | 'warn' | 'full' {
  if (fraction >= 0.97) return 'full'
  if (fraction >= 0.9) return 'warn'
  return 'ok'
}

/** Locales whose ICU data names zones the others only give as an offset (JST, BST, AEST, IST). */
const ZONE_NAME_LOCALES = ['en-US', 'en-GB', 'en-AU', 'en-IN', 'ja-JP', 'en-NZ', 'en-CA', 'en-ZA']

/** Common zones no locale above abbreviates. */
const ZONE_ABBREVIATIONS: Record<string, string> = {
  'Asia/Seoul': 'KST',
  'Asia/Shanghai': 'CST',
  'Asia/Hong_Kong': 'HKT',
  'Asia/Taipei': 'CST',
  'Asia/Singapore': 'SGT',
  'Asia/Manila': 'PHT',
  'Asia/Jakarta': 'WIB',
  'Asia/Bangkok': 'ICT',
  'Asia/Ho_Chi_Minh': 'ICT',
  'Asia/Dubai': 'GST',
}

const OFFSET_ONLY = /^(GMT|UTC)([+-]\d|$)/

/**
 * The short name of a time zone at a moment: "JST", "EDT", "BST". Where no
 * locale has one, the offset, as "UTC+5:45".
 */
export function zoneAbbreviation(timeZone: string, date: Date): string {
  let offset = ''
  for (const locale of ZONE_NAME_LOCALES) {
    let name: string | undefined
    try {
      name = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' })
        .formatToParts(date)
        .find((p) => p.type === 'timeZoneName')?.value
    } catch {
      return ''
    }
    if (!name) continue
    if (name === 'UTC' || !OFFSET_ONLY.test(name)) return name
    offset ||= name
  }
  return ZONE_ABBREVIATIONS[timeZone] ?? offset.replace(/^GMT/, 'UTC')
}
