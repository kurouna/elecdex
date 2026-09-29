/**
 * The clock of an emulated machine that runs in frames (docs/architecture.md section 5.18).
 *
 * The page calls `framesDue` from its own animation frame with the time since the last
 * call. The machine's frames stay at their own rate whatever the display's is: a 120 Hz
 * screen runs a 60 Hz machine every other frame, and the remainder carries over.
 *
 * A long gap - the page held up, a window brought back - is not caught up: at most
 * `maxFrames` run and the rest of the time is dropped, so a game slows down for a moment
 * rather than jumping ahead, and one late call never turns into hundreds of frames.
 *
 * Pure and machine-agnostic: it knows nothing of what a frame does.
 */

export interface FramesDue {
  /** Whole frames to run now. */
  frames: number
  /** Milliseconds owed to the next call, always less than one period. */
  carryMs: number
}

export function framesDue(
  elapsedMs: number,
  carryMs: number,
  periodMs: number,
  maxFrames: number,
): FramesDue {
  if (!(periodMs > 0) || maxFrames < 1) return { frames: 0, carryMs: 0 }
  // A clock that went backwards, or a call with nothing measured, owes nothing new.
  const owed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0) + Math.max(0, carryMs)
  const whole = Math.floor(owed / periodMs)
  if (whole > maxFrames) return { frames: maxFrames, carryMs: 0 }
  return { frames: whole, carryMs: owed - whole * periodMs }
}
