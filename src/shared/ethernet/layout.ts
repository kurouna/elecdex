// ---------------------------------------------------------------------------
// The pane's shape
// ---------------------------------------------------------------------------

export interface EtherSections {
  /** The link panel: the speed ladder, the use of the link, the counts and the settings. */
  link: boolean
  /** The timeline, the log and the detail one under another; otherwise tabs. */
  stacked: boolean
  /** Two columns: the path beside the link panel, the log beside the detail. */
  wide: boolean
  /** The ladder beside the rest of the panel, or above it. */
  linkWide: boolean
}

/**
 * The height each part wants, in CSS pixels, at the type scale of a 1080p screen.
 * The link panel and the detail stand their parts one above another in a narrow
 * pane, and are then about twice as tall (measured on the stubs).
 */
export const ETHER_SECTION_HEIGHTS = {
  header: 34,
  path: 140,
  link: 140,
  linkNarrow: 270,
  timeline: 190,
  log: 130,
  detail: 240,
  detailNarrow: 440,
} as const

/** The width, in CSS pixels, from which the stacked pane goes to two columns (as Wi-Fi's). */
export const ETHER_WIDE_FROM = 1100
/** Below this the link panel's ladder goes above its figures, and the detail to one column. */
export const ETHER_NARROW_BELOW = 480

/**
 * How the pane lays itself out at this size: the path and its verdict always;
 * the link panel when there is room for it above what follows; the timeline, log
 * and detail stacked when all three fit, else as tabs.
 */
export function etherSections(width: number, height: number): EtherSections {
  const h = ETHER_SECTION_HEIGHTS
  const narrow = width < ETHER_NARROW_BELOW
  const withPanel = (panelHeight: number): { link: boolean; stacked: boolean } => {
    const link = height >= h.header + h.path + panelHeight + h.timeline
    const room = height - h.header - h.path - (link ? panelHeight : 0)
    return { link, stacked: room >= h.timeline + h.log + (narrow ? h.detailNarrow : h.detail) }
  }
  // Two columns put the panel beside the path, costing no height - but only when the pane
  // stacks; one column draws it above the lower part, so its height is counted then.
  if (width >= ETHER_WIDE_FROM) {
    const beside = withPanel(0)
    if (beside.stacked) return { ...beside, wide: true, linkWide: true }
  }
  return { ...withPanel(narrow ? h.linkNarrow : h.link), wide: false, linkWide: !narrow }
}
