/**
 * What the Wi-Fi and Ethernet panes' logs share (EventLog.svelte, LogStrip.svelte):
 * a row's times and the words for a steady beat. Each pane keeps its own kinds,
 * their names and marks.
 */

/** A row of a log: what happened, when, and how long the link was down for it. */
export interface LogEvent {
  key: string
  at: number
  kind: string
  detail: string
  /** Seconds the link was down, for a drop the pane saw end. */
  downFor: number | null
}

/** A kind's glyph and colour, on the timeline and in the log alike. */
export interface LogMark {
  glyph: string
  tone: 'ok' | 'warn' | 'danger' | 'accent'
}

/** The rows a log shows at most: the newest, enough for an hour of trouble. */
export const LOG_ROWS = 120

export const clock = (at: number): string => new Date(at).toTimeString().slice(0, 8)

/** "+40s", "+12m", "+3h": the time since the row before of the same kind. */
export function gap(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 90) return `+${s}s`
  const m = Math.round(s / 60)
  return m < 90 ? `+${m}m` : `+${Math.round(m / 60)}h`
}

/** "45 s", "30 min": a steady beat's length, for the line above the list. */
export function every(ms: number): string {
  const s = Math.round(ms / 1000)
  return s < 120 ? `${s} s` : `${Math.round(s / 60)} min`
}

/** The row before this one of the same kind, looked for without copying the list. */
function lastOfKind<E extends { kind: string }>(list: readonly E[], i: number): E | undefined {
  const kind = list[i]?.kind
  for (let j = i + 1; j < list.length; j++) if (list[j]?.kind === kind) return list[j]
  return undefined
}

/**
 * The newest rows, newest first as given, each with how long after the last of
 * its kind it came - a drop after the drop before, whatever came between - which
 * is how a drop every half hour gives itself away. The kind before is looked for
 * in the whole list, so the last row shown is told it too.
 */
export function sinceRows<E extends LogEvent>(
  events: readonly E[],
): { e: E; since: string | null }[] {
  return events.slice(0, LOG_ROWS).map((e, i) => {
    const older = lastOfKind(events, i)
    return { e, since: older === undefined ? null : gap(e.at - older.at) }
  })
}
