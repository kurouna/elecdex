/**
 * One draw loop for every chart in the window.
 *
 * eDEX-UI's charts each ran their own smoothie render loop at display rate.
 * Here a single loop drives all of them, it stops entirely when nothing is
 * subscribed, and it draws nothing while the window is hidden.
 *
 * It is deliberately NOT a continuous requestAnimationFrame. A rAF loop wakes
 * the renderer on every vsync, and each wake also rouses the GPU process -
 * measured on an i5-1335U, the default layout's charts cost ~7% of a core in
 * the GPU process alone that way. A 60-second chart a few hundred pixels wide
 * only moves one pixel every ~200ms, so the loop sleeps on a timer between
 * frames and uses rAF only to line the actual draw up with a frame.
 */

export type FrameCallback = (now: number) => void

/**
 * The loop's shortest period: ten frames a second, for the globe's turn. Every
 * period a subscriber asks for must be a multiple of it, so all frames fall on
 * the same wall-clock boundaries.
 */
export const FRAME_INTERVAL = 100

/**
 * The time axis every scrolling chart shares, so side by side they move at the
 * same speed: the same span of time across the chart, the same lag behind now,
 * and redraws on the same wall-clock ticks.
 *
 *  - Window: a minute, as eDEX-UI's charts showed.
 *  - Delay: behind "now" by more than the slowest of their sources' intervals, so
 *    the newest point is already in before the line reaches the right edge.
 *  - Tick: a chart redraws only when the tick changes. Every chart changes tick
 *    in the same frame, so the compositor is woken once for all of them rather
 *    than once per chart whenever each happens to cross a pixel.
 */
export const CHART_WINDOW_MS = 60_000
export const CHART_DELAY_MS = 2000
export const CHART_TICK_MS = 200

/** The shared tick a moment falls in. */
export const chartTick = (now: number): number => Math.floor(now / CHART_TICK_MS)

/**
 * Milliseconds past a wall-clock boundary at which timed work wakes. Just past,
 * so a clock reading the time then is already in the new second.
 */
const WAKE_PHASE_MS = 5

/**
 * How long until the next wall-clock multiple of `period` (plus the wake phase).
 *
 * Everything that updates the screen on a schedule wakes on these boundaries:
 * the frame loop every 100ms and the clock every second land on the same
 * moment, so the clock's change is drawn in the loop's frame instead of forcing
 * a frame of its own. Each separate frame is a full commit, raster and GPU
 * swap, which on the default layout costs more than the drawing in it.
 */
export function msUntilBoundary(period: number, now = Date.now()): number {
  return period - ((((now - WAKE_PHASE_MS) % period) + period) % period)
}

interface Subscriber {
  period: number
  /** The period slot this subscriber was last called in. */
  slot: number
}

/**
 * Put away in the notification area, or minimised, as main reports it. With
 * backgroundThrottling off (the monitors keep their pace behind other windows)
 * Electron leaves document.hidden false for such a window, so main says so.
 */
let windowHidden = false

/** Nothing of the page is on screen: no frame is worth drawing. */
const offScreen = (): boolean => document.hidden || windowHidden

const callbacks = new Map<FrameCallback, Subscriber>()
/** When the scheduled wake is for, so a shorter period joining can bring it forward. */
let wakeAt = 0
/** One-shot callbacks for the next frame (nextFrame). */
const pending = new Set<FrameCallback>()
let timer: ReturnType<typeof setTimeout> | null = null
let raf = 0
/** A frame requested for pending callbacks alone, while the loop is not running. */
let loneRaf = 0

/**
 * How long a requested animation frame may take before the work goes ahead
 * without it. A window can be visible to the page (document.hidden false) and yet
 * produce no frames - not yet shown, occluded without being reported hidden, a
 * virtual display on CI - and then the frame never comes: samples waited for it
 * forever and panes showed nothing though their data was arriving.
 */
export const FRAME_STALL_MS = 500

/** Runs what waits for a frame if the frame is late (see FRAME_STALL_MS). */
let pendingStall: ReturnType<typeof setTimeout> | null = null
/** Runs the loop's frame if its animation frame is late. */
let loopStall: ReturnType<typeof setTimeout> | null = null

function runPending(now: number): void {
  if (pendingStall !== null) clearTimeout(pendingStall)
  pendingStall = null
  if (pending.size === 0) return
  const due = [...pending]
  pending.clear()
  for (const callback of due) callback(now)
}

/** The shortest period anyone is waiting for. */
function loopPeriod(): number {
  let period = Number.POSITIVE_INFINITY
  for (const subscriber of callbacks.values()) period = Math.min(period, subscriber.period)
  return period
}

/** The period slot a wall-clock moment falls in, on the shared wake phase. */
const slotOf = (wall: number, period: number): number => Math.floor((wall - WAKE_PHASE_MS) / period)

function frame(now: number): void {
  raf = 0
  if (loopStall !== null) clearTimeout(loopStall)
  loopStall = null
  if (offScreen()) return
  runPending(now)
  const wall = Date.now()
  for (const [callback, subscriber] of callbacks) {
    const slot = slotOf(wall, subscriber.period)
    if (slot === subscriber.slot) continue
    subscriber.slot = slot
    callback(now)
  }
  schedule()
}

function schedule(): void {
  if (raf !== 0 || callbacks.size === 0 || offScreen()) return
  const delay = msUntilBoundary(loopPeriod())
  // Already waking no later than needed.
  if (timer !== null && wakeAt <= Date.now() + delay) return
  if (timer !== null) clearTimeout(timer)
  wakeAt = Date.now() + delay
  timer = setTimeout(() => {
    timer = null
    raf = requestAnimationFrame(frame)
    loopStall = setTimeout(() => {
      loopStall = null
      if (raf === 0) return
      cancelAnimationFrame(raf)
      frame(performance.now())
    }, FRAME_STALL_MS)
  }, delay)
}

function cancel(): void {
  if (timer !== null) clearTimeout(timer)
  if (raf !== 0) cancelAnimationFrame(raf)
  if (loopStall !== null) clearTimeout(loopStall)
  timer = null
  raf = 0
  loopStall = null
}

// Hidden: stop outright, and run anything waiting for a frame now - nothing is
// drawn, so there is no frame to share. Visible again: resume.
//
// The attribute takes `--motion-scale` to zero (tokens.css). Stopping the loop
// is not enough on its own: a CSS animation is the compositor's, not ours, and
// with backgroundThrottling off it goes on painting a window nobody can see -
// the clock's digits roll every second, which is most of a put-away window's
// remaining cost.
function followVisibility(): void {
  document.documentElement.toggleAttribute('data-offscreen', offScreen())
  if (offScreen()) {
    cancel()
    if (loneRaf !== 0) cancelAnimationFrame(loneRaf)
    loneRaf = 0
    runPending(performance.now())
  } else {
    schedule()
  }
}

document.addEventListener('visibilitychange', followVisibility)

/** The window was put away or minimised (true), or is back on screen (false). */
export function setWindowHidden(hidden: boolean): void {
  if (hidden === windowHidden) return
  windowHidden = hidden
  followVisibility()
}

/**
 * Runs `callback` once, in the next frame the loop draws - or, when no loop is
 * running, in the next animation frame. For state that changes the screen at
 * unscheduled moments (samples arriving over IPC): applied in a shared frame, it
 * costs no frame of its own. Runs at once while the window is hidden.
 */
export function nextFrame(callback: FrameCallback): void {
  if (offScreen()) {
    callback(performance.now())
    return
  }
  pending.add(callback)
  pendingStall ??= setTimeout(() => runPending(performance.now()), FRAME_STALL_MS)
  if (callbacks.size > 0) {
    schedule()
  } else if (loneRaf === 0) {
    loneRaf = requestAnimationFrame((now) => {
      loneRaf = 0
      runPending(now)
    })
  }
}

/**
 * Calls `callback` from the loop once in every `period` ms (a multiple of
 * FRAME_INTERVAL), on wall-clock boundaries. The loop wakes only as often as its
 * most frequent subscriber needs: charts that change every 200ms do not wake it
 * ten times a second on a layout with no globe.
 */
export function onFrame(callback: FrameCallback, period = FRAME_INTERVAL): () => void {
  callbacks.set(callback, { period: Math.max(FRAME_INTERVAL, period), slot: Number.NaN })
  schedule()
  return () => {
    if (!callbacks.delete(callback)) return
    // A wake set for the leaver's shorter period would be a frame for no one.
    if (timer !== null) cancel()
    schedule()
  }
}
