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

/** Draws per second. Well above the ~5 pixel shifts per second a chart makes. */
export const CHART_FPS = 10

const FRAME_INTERVAL = 1000 / CHART_FPS

const callbacks = new Set<FrameCallback>()
let timer: ReturnType<typeof setTimeout> | null = null
let raf = 0

function schedule(): void {
  if (timer !== null || raf !== 0 || callbacks.size === 0 || document.hidden) return
  timer = setTimeout(() => {
    timer = null
    raf = requestAnimationFrame((now) => {
      raf = 0
      if (callbacks.size === 0 || document.hidden) return
      for (const callback of callbacks) callback(now)
      schedule()
    })
  }, FRAME_INTERVAL)
}

function cancel(): void {
  if (timer !== null) clearTimeout(timer)
  if (raf !== 0) cancelAnimationFrame(raf)
  timer = null
  raf = 0
}

// Hidden: stop outright. Visible again: resume.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancel()
  else schedule()
})

export function onFrame(callback: FrameCallback): () => void {
  callbacks.add(callback)
  schedule()
  return () => {
    callbacks.delete(callback)
    if (callbacks.size === 0) cancel()
  }
}
