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
