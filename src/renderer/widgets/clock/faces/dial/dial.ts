/**
 * DIAL's hands: where each points, in degrees clockwise from twelve. The second hand steps once
 * a second rather than sweeping, so the face changes only when the time does.
 */
export function handAngles(now: Date): { hour: number; minute: number; second: number } {
  const s = now.getSeconds()
  const m = now.getMinutes() + s / 60
  const h = (now.getHours() % 12) + m / 60
  return { hour: h * 30, minute: m * 6, second: s * 6 }
}

/** The dial's ticks: sixty, every fifth a longer one. Fewer on a small dial, where they would merge. */
export function dialTicks(diameter: number): Array<{ angle: number; major: boolean }> {
  const every = diameter < 60 ? 5 : 1
  const ticks: Array<{ angle: number; major: boolean }> = []
  for (let i = 0; i < 60; i += every) ticks.push({ angle: i * 6, major: i % 5 === 0 })
  return ticks
}

/**
 * DIAL's arrangement: the dial and the figures side by side, on one line as the user asked, while
 * the pane is wide enough for both; stacked, the figures under the dial, in a pane taller than it
 * is wide, where side by side would leave the dial small and the figures cramped (review
 * 2026-11-22). `size` is the figures' HH:MM height.
 */
export function dialLayout(
  width: number,
  height: number,
): { stacked: boolean; diameter: number; size: number } {
  const stacked = height > width * 0.9
  if (stacked) {
    const diameter = Math.max(16, Math.min(width - 24, height * 0.62))
    return { stacked, diameter, size: Math.max(12, Math.min(height * 0.16, width * 0.16)) }
  }
  const diameter = Math.max(16, Math.min(height - 8, width * 0.45))
  return {
    stacked,
    diameter,
    size: Math.max(12, Math.min(height * 0.66, diameter * 0.42, width * 0.11)),
  }
}
