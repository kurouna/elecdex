/**
 * How far ahead of a frame's time the field is drawn. The time a frame is handed is the
 * vsync it began on, and what it draws is shown at the next one; a note drawn at the frame's
 * own time would reach the line on screen an interval after it is heard, and a player who
 * plays to the eye rather than the ear would be late by that much - a whole SYNC window at
 * 60 Hz. So the field is drawn as it will stand when the frame is shown, an interval ahead,
 * the interval measured from the frames themselves (a 120 Hz display gets half the lead).
 * Keys are judged on their own times, which this never touches.
 */

export const LEAD = {
  /** Under this a delta is two frames in one, over it a pause between frames: neither counts. */
  min: 4,
  max: 34,
  /** Until enough frames have been seen. */
  fallback: 1000 / 60,
  /** How many intervals the median is taken over. */
  kept: 24,
} as const

export class FrameLead {
  private readonly intervals: number[] = []
  private last: number | null = null

  /** Records a frame's time; answers the lead to draw with. */
  tick(now: number): number {
    if (this.last !== null) {
      const delta = now - this.last
      if (delta >= LEAD.min && delta <= LEAD.max) {
        this.intervals.push(delta)
        if (this.intervals.length > LEAD.kept) this.intervals.shift()
      }
    }
    this.last = now
    return this.lead
  }

  /** The median of the recent intervals, or the fallback until a few have been seen. */
  get lead(): number {
    if (this.intervals.length < 4) return LEAD.fallback
    const sorted = [...this.intervals].sort((a, b) => a - b)
    return sorted[sorted.length >> 1] ?? LEAD.fallback
  }
}
