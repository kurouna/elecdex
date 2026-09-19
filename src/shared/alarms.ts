import { z } from 'zod'

/**
 * Alarms: a time of day that says something, kept in alarms.json under userData.
 *
 * Not the same thing as a task's deadline, though both end in a notice. A task
 * is a thing to do, with a date; an alarm is a time the day is built around -
 * waking up, the start of lunch - set once and switched on and off from then on.
 * That is why it lives beside the chrono rather than in the tasks pane, and why
 * it is owned by main: it has to go off whether or not its pane is open.
 */

export const ALARMS_VERSION = 1

export const ALARM_LIMITS = {
  alarms: 20,
  label: 80,
} as const

/** Sunday first, as the calendar pane and `Date.getDay()` have it. */
export const WEEKDAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export const AlarmSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().max(ALARM_LIMITS.label).default(''),
  /** Local time of day. */
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  /**
   * The days it repeats on, as `Date.getDay()` numbers. Empty means it goes off
   * at the next such time and then switches itself off, the way a phone's
   * one-off alarm does.
   */
  days: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  enabled: z.boolean().default(true),
  /** The moment it last went off, so one time of day is announced once. */
  lastRangAt: z.number().int().nonnegative().optional(),
})
export type Alarm = z.infer<typeof AlarmSchema>

export const AlarmsFileSchema = z.object({
  version: z.literal(ALARMS_VERSION).default(ALARMS_VERSION),
  alarms: z.array(AlarmSchema).max(ALARM_LIMITS.alarms).default([]),
})
export type AlarmsFile = z.infer<typeof AlarmsFileSchema>

export const emptyAlarms = (): AlarmsFile => ({ version: ALARMS_VERSION, alarms: [] })

/** What a pane may ask main to add; main supplies the id. */
export const NewAlarmSchema = z.object({
  label: z.string().max(ALARM_LIMITS.label).optional(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  days: z.array(z.number().int().min(0).max(6)).max(7).optional(),
})
export type NewAlarm = z.infer<typeof NewAlarmSchema>

export const AlarmPatchSchema = z.object({
  label: z.string().max(ALARM_LIMITS.label).optional(),
  hour: z.number().int().min(0).max(23).optional(),
  minute: z.number().int().min(0).max(59).optional(),
  days: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  enabled: z.boolean().optional(),
})
export type AlarmPatch = z.infer<typeof AlarmPatchSchema>

/** What main sends when an alarm goes off. */
export interface AlarmRing {
  alarmId: string
  label: string
  /** The moment it was announced for. */
  at: number
  /** True when this was its last time: a one-off, now switched off. */
  once: boolean
}

/**
 * When an alarm next goes off, or null when it never will.
 *
 * Strictly after `now`, and worked out by walking days rather than by adding
 * 24 hours: where a zone shifts its clocks, seven o'clock is seven o'clock on
 * both sides of the change, and a day is not always 86,400,000 milliseconds.
 */
export function nextAlarmAt(alarm: Alarm, now: number): number | null {
  if (!alarm.enabled) return null

  const from = new Date(now)
  for (let ahead = 0; ahead <= 7; ahead += 1) {
    const at = new Date(from)
    at.setDate(at.getDate() + ahead)
    at.setHours(alarm.hour, alarm.minute, 0, 0)
    if (at.getTime() <= now) continue
    if (alarm.days.length > 0 && !alarm.days.includes(at.getDay())) continue
    // One that has already been announced for this very moment is spent.
    if (alarm.lastRangAt !== undefined && alarm.lastRangAt >= at.getTime()) continue
    return at.getTime()
  }
  return null
}

/** How the days are shown: "every day", "weekdays", "mon wed fri", or nothing. */
export function describeDays(days: readonly number[]): string {
  if (days.length === 0) return 'once'
  if (days.length === 7) return 'every day'
  const sorted = [...new Set(days)].sort((a, b) => a - b)
  if (sorted.length === 5 && sorted.every((day) => day >= 1 && day <= 5)) return 'weekdays'
  if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) return 'weekends'
  return sorted.map((day) => WEEKDAY_NAMES[day] ?? '').join(' ')
}

/** "07:00", as the readout and the list show it. */
export const formatAlarmTime = (alarm: Pick<Alarm, 'hour' | 'minute'>): string =>
  `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`

/**
 * How long until an alarm goes off, in words: "in 7h 20m", "in 45m", "in 30s".
 *
 * Rough on purpose. The exact second matters for a countdown, but what an alarm
 * has to answer is "is that tonight or tomorrow morning".
 */
export function describeWait(at: number, now: number): string {
  const left = Math.max(0, at - now)
  const minutes = Math.floor(left / 60_000)
  if (minutes < 1) return `in ${Math.max(1, Math.round(left / 1000))}s`
  const hours = Math.floor(minutes / 60)
  if (hours < 1) return `in ${minutes}m`
  const days = Math.floor(hours / 24)
  if (days >= 1) return `in ${days}d ${hours % 24}h`
  return `in ${hours}h ${minutes % 60}m`
}

/** The alarms in the order the pane lists them: by time of day, then by label. */
export const sortAlarms = (alarms: readonly Alarm[]): Alarm[] =>
  [...alarms].sort(
    (a, b) => a.hour - b.hour || a.minute - b.minute || a.label.localeCompare(b.label),
  )

/** Whether a one-off alarm has now had its moment, and should switch itself off. */
export const isSpent = (alarm: Alarm): boolean => alarm.days.length === 0

/** Parses "7", "07:30", "7:5", "１９：３０" into a time of day, or null. */
export function parseTimeOfDay(input: string): { hour: number; minute: number } | null {
  // Full-width digits and colon come from a Japanese keyboard; read them too.
  const text = input
    .trim()
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/[：.]/g, ':')
  const match = /^(\d{1,2})(?::(\d{1,2}))?$/.exec(text)
  if (match === null) return null
  const hour = Number(match[1])
  const minute = match[2] === undefined ? 0 : Number(match[2])
  if (hour > 23 || minute > 59) return null
  return { hour, minute }
}
