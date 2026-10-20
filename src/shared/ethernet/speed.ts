// ---------------------------------------------------------------------------
// Speeds
// ---------------------------------------------------------------------------

/** The steps of the speed ladder, Mb/s; 500 is Realtek's Gigabit Lite. */
export const SPEED_STEPS = [10, 100, 500, 1000, 2500, 5000, 10000] as const

/** "1 Gb/s", "100 Mb/s", "2.5 Gb/s". */
export function speedLabel(mbps: number | null): string {
  if (mbps === null) return '—'
  if (mbps >= 1000) return `${+(mbps / 1000).toFixed(1)} Gb/s`
  return `${Math.round(mbps)} Mb/s`
}

/** The ladder's short word for a speed: "1G", "100M". */
export function speedWord(mbps: number | null): string {
  if (mbps === null) return '—'
  if (mbps >= 1000) return `${+(mbps / 1000).toFixed(1)}G`
  return `${Math.round(mbps)}M`
}

/** The copper standard of a speed. */
export function standardOf(mbps: number | null): string {
  switch (mbps) {
    case 10:
      return '10BASE-T'
    case 100:
      return '100BASE-TX'
    case 500:
      return '1000BASE-T at 500M'
    case 1000:
      return '1000BASE-T'
    case 2500:
      return '2.5GBASE-T'
    case 5000:
      return '5GBASE-T'
    case 10000:
      return '10GBASE-T'
    default:
      return mbps === null ? '—' : speedLabel(mbps)
  }
}

/** The step a speed lights up to: the highest step not above it (an odd speed lights the one below). */
export function stepIndex(mbps: number | null): number {
  if (mbps === null) return -1
  let index = -1
  SPEED_STEPS.forEach((s, i) => {
    if (s <= mbps) index = i
  })
  return index
}
