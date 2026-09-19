/**
 * Keeping a canvas's backing store in step with its CSS size.
 *
 * Every canvas in the HUD needs the same three things - a backing store at the
 * device pixel ratio, a redraw when the pane is resized, and the disconnect on
 * unmount - so they share this rather than each widget growing its own
 * ResizeObserver with a slightly different rounding rule.
 */

export interface CanvasSize {
  width: number
  height: number
  ratio: number
}

/**
 * Keeps a canvas's backing store at its CSS size times the pixel ratio, and
 * reports each new size. Returns the disconnect.
 */
export function observeCanvas(
  el: HTMLCanvasElement,
  onSize: (size: CanvasSize) => void,
): () => void {
  const observer = new ResizeObserver(() => {
    const ratio = window.devicePixelRatio || 1
    el.width = Math.max(1, Math.round(el.clientWidth * ratio))
    el.height = Math.max(1, Math.round(el.clientHeight * ratio))
    onSize({ width: el.clientWidth, height: el.clientHeight, ratio })
  })
  observer.observe(el)
  return () => observer.disconnect()
}
