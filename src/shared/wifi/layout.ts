// ---------------------------------------------------------------------------
// The pane's shape
// ---------------------------------------------------------------------------

export interface WifiSections {
  /** The radio's gauge, map and rates. */
  radio: boolean
  /** Radio gauge beside the channel map, or stacked. */
  radioWide: boolean
  /**
   * The timeline, the log and the detail one under another; otherwise they
   * share the room as tabs, one at a time.
   */
  stacked: boolean
  /**
   * Room for two columns: the path beside the radio, and the log beside the
   * detail - what a pane brought forward on a wide screen has, where one column
   * of parts spread its figures to the far edges.
   */
  wide: boolean
}

/** The height each part wants, in CSS pixels, at the type scale of a 1080p screen. */
export const SECTION_HEIGHTS = {
  header: 34,
  path: 124,
  radio: 132,
  timeline: 190,
  log: 130,
  detail: 210,
} as const

/**
 * How the pane lays itself out at this size. The path and its verdict always
 * show; the radio when there is room for it beside what follows; and the
 * timeline, log and detail stacked when all three fit, else as tabs - so none
 * of them is ever out of reach, only a click away.
 */
export function wifiSections(width: number, height: number): WifiSections {
  const h = SECTION_HEIGHTS
  const radio = height >= h.header + h.path + h.radio + h.timeline
  const room = height - h.header - h.path - (radio ? h.radio : 0)
  const stacked = room >= h.timeline + h.log + h.detail
  return {
    radio,
    radioWide: width >= 460,
    stacked,
    wide: stacked && width >= WIDE_FROM,
  }
}

/** The width, in CSS pixels, from which the stacked pane goes to two columns. */
export const WIDE_FROM = 1100
