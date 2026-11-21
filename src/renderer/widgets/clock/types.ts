import type { Component } from 'svelte'

/**
 * What the CLOCK pane hands a face. The pane keeps the time (one tick on the shared second
 * boundary, none while it is not seen) and names the zone; a face only draws them, so a face
 * never runs a clock of its own and a new face is one component and one row in the table.
 */
export interface ClockFaceProps {
  /** This second. A new Date each second, only while the pane is seen. */
  now: Date
  /** The zone's short name ("JST", "EDT", "UTC+5:45"), or '' where there is none. */
  zone: string
  /** The IANA zone the system is in ("Asia/Tokyo"). */
  timeZone: string
  /** Whether the pane is on screen: a face that animates between seconds stops when it is not. */
  visible: boolean
}

/** One face of the clock: a row of the table in faces.ts. */
export interface ClockFace {
  /** Kept in settings.json (`clock.face`); never renamed once released. */
  id: string
  /** The name in the settings dialog's list. */
  label: string
  /**
   * What it shows, in a line under the list: the dialog covers the clock, so the name alone
   * would not say how the faces differ (review 2026-11-22).
   */
  summary: string
  /**
   * Runs a simulation between seconds and so uses noticeably more CPU than the others: the
   * settings dialog says so beside its name, so no one finds the machine busier without knowing why.
   */
  heavy?: true
  component: Component<ClockFaceProps>
}
