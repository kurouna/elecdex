/**
 * Formatting for the HUD readouts. Pure, so every edge case is unit-tested.
 */

const GIB = 1024 ** 3
const MIB = 1024 ** 2

/** "7.7 GiB" / "512 MiB" - binary units, as eDEX-UI's memory panel used. */
export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
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

/** "APR 29" */
export function formatMonthDay(date: Date): string {
  return `${MONTHS[date.getMonth()] ?? ''} ${date.getDate()}`
}

/** The short OS label of eDEX-UI's TYPE cell. */
export function osLabel(platform: string): string {
  const p = platform.toLowerCase()
  if (p.startsWith('win')) return 'win'
  if (p === 'darwin' || p.startsWith('mac')) return 'macOS'
  if (p === '') return '--'
  return p
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

/**
 * Deterministically shuffles 0..n-1. The memory dot map lights points in this
 * order, so used memory looks scattered like the original rather than filling
 * row by row - but stays stable between frames so the pattern does not flicker.
 */
export function stableShuffle(n: number, seed = 0x5eed): number[] {
  const order = Array.from({ length: n }, (_, i) => i)
  let s = seed >>> 0
  for (let i = n - 1; i > 0; i--) {
    // xorshift32
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    const j = s % (i + 1)
    const tmp = order[i] as number
    order[i] = order[j] as number
    order[j] = tmp
  }
  return order
}
