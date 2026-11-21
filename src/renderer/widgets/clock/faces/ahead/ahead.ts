import { type Alarm, nextAlarmAt } from '@shared/alarms'
import { dueAt, type Task } from '@shared/tasks'

/**
 * AHEAD's axis and what stands on it: the next 24 hours on a logarithmic scale, so the coming
 * minutes get most of the width and tomorrow morning still fits, with the alarms and the tasks
 * that fall due in that time. Both come from main's own files (the alarms and tasks stores):
 * nothing new is asked of anyone.
 */

export const AHEAD_SPAN_MS = 24 * 3_600_000
/** The scale's knee: the first five minutes are about as wide as the next hour's rest. */
const KNEE_MS = 5 * 60_000

/** Where a moment `ms` ahead of now sits across a band `width` wide. */
export function aheadX(ms: number, width: number): number {
  const t = Math.max(0, Math.min(AHEAD_SPAN_MS, ms))
  return (Math.log1p(t / KNEE_MS) / Math.log1p(AHEAD_SPAN_MS / KNEE_MS)) * width
}

/** The marks on the axis: how far ahead each is, and its label. */
export const AHEAD_TICKS: ReadonlyArray<readonly [ms: number, label: string]> = [
  [5 * 60_000, '5m'],
  [15 * 60_000, '15m'],
  [3_600_000, '1h'],
  [4 * 3_600_000, '4h'],
  [12 * 3_600_000, '12h'],
  [24 * 3_600_000, '24h'],
]

export interface AheadEvent {
  key: string
  kind: 'alarm' | 'task'
  at: number
  label: string
}

/** The alarms and tasks due in the next 24 hours, soonest first. */
export function aheadEvents(
  alarms: readonly Alarm[],
  tasks: readonly Task[],
  now: number,
): AheadEvent[] {
  const events: AheadEvent[] = []
  for (const alarm of alarms) {
    const at = nextAlarmAt(alarm, now)
    if (at === null || at - now > AHEAD_SPAN_MS) continue
    events.push({ key: `a:${alarm.id}`, kind: 'alarm', at, label: alarm.label || 'alarm' })
  }
  for (const task of tasks) {
    const at = dueAt(task)
    if (at === null || at <= now || at - now > AHEAD_SPAN_MS) continue
    events.push({ key: `t:${task.id}`, kind: 'task', at, label: task.title })
  }
  return events.sort((a, b) => a.at - b.at)
}

/** How long until a moment, as the nearest event's label says it: "7m", "2h05", "18h". */
export function untilLabel(ms: number): string {
  const minutes = Math.max(0, Math.ceil(ms / 60_000))
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h >= 10 || m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/** The next local midnight, which the axis marks by the day it begins. */
export function nextMidnight(now: number): number {
  const d = new Date(now)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime()
}
