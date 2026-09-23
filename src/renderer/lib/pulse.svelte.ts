import { onBoundary } from './frame-loop.ts'
import { refCounted } from './ref-counted.ts'

/**
 * The beat of whatever pulses for attention: a late task, a countdown's last
 * seconds. Four steps a second - full, part, low, part - which is what the CSS
 * animations they used to be played (`1s steps(2, end) infinite` over three
 * keyframes).
 *
 * Not an animation, because one that never ends is the compositor's for as long
 * as it runs - which for a late task can be all day - and runs on in a window put
 * away unless it is paused there. As a number on the shared wall-clock tick
 * (lib/frame-loop.ts) it is four small repaints a second, two of them in a frame
 * the loop draws anyway, none while nothing pulses, and none while the window is
 * put away. Measured on a tasks pane alone with one late task: 9.6% of one core
 * as an animation, 7.6% as this (most of either is the T-plus readout rolling
 * each second; with nothing late the pane measures about 1%).
 *
 * Use: hold it with `use()` while something pulses, put `pulse.phase` in a
 * `data-pulse` attribute, and give phases 1 and 3 the part opacity and 2 the low.
 */
export const PULSE_STEP_MS = 250

const phaseAt = (now: number): number => Math.floor(now / PULSE_STEP_MS) % 4

class Pulse {
  phase = $state(0)
  /** Steps while anything uses it; returns the release. */
  readonly use = refCounted(() => {
    this.phase = phaseAt(Date.now())
    return onBoundary(PULSE_STEP_MS, () => {
      this.phase = phaseAt(Date.now())
    })
  })
}

export const pulse = new Pulse()
