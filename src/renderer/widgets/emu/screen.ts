/**
 * What every emulator screen does round its picture (docs/emu.md): read the room it is given
 * in device pixels, and draw the gaps between whole dots.
 */

/** The room in device pixels, and the ratio it was measured at. */
export interface Room {
  w: number
  h: number
  ratio: number
}

/**
 * The room a ResizeObserver entry gives, in device pixels where the browser gives them - read
 * from the entry, never by measuring the element inside the callback: a pane just brought
 * forward still answers with the size it had in the layout (CLAUDE.md, Panes). Null for an
 * empty box: behind a tab a screen measures nothing, and keeps its size for when it is back.
 */
export function deviceRoom(entry: ResizeObserverEntry, ratio: number): Room | null {
  const device = entry.devicePixelContentBoxSize?.[0]
  const box = entry.contentBoxSize?.[0]
  const w = device?.inlineSize ?? (box?.inlineSize ?? entry.contentRect.width) * ratio
  const h = device?.blockSize ?? (box?.blockSize ?? entry.contentRect.height) * ratio
  return w === 0 || h === 0 ? null : { w, h, ratio }
}

/** The room in CSS pixels. */
export interface CssRoom {
  w: number
  h: number
}

/**
 * Calls `seen` with the room `el` is given in CSS pixels whenever it changes size, read from
 * the observer's entry; an empty box (behind a tab) is skipped, so a pane keeps its layout for
 * when it is back. Gives the function that stops watching.
 */
export function watchRoom(el: Element, seen: (room: CssRoom) => void): () => void {
  const observer = new ResizeObserver((entries) => {
    const box = entries[entries.length - 1]?.contentRect
    if (box === undefined || box.width === 0 || box.height === 0) return
    seen({ w: box.width, h: box.height })
  })
  observer.observe(el)
  return () => observer.disconnect()
}

/**
 * The gaps between dots: a one-pixel line in `colour` every `step` device pixels, on a canvas
 * the size of the picture, drawn when the size or the colour changes and never again. Drawn
 * by CSS gradients instead, the small screen canvas under it (which Chromium paints in
 * software) had the gradients rasterised afresh on every frame it changed - with an
 * afterglow fading, every frame: about a tenth of a core for the grid alone, measured.
 */
export function drawDotGrid(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  step: number,
  colour: string,
): void {
  const ctx = canvas.getContext('2d')
  if (ctx === null) return
  canvas.width = width
  canvas.height = height
  ctx.clearRect(0, 0, width, height)
  if (!(step > 0)) return
  ctx.fillStyle = colour
  for (let x = 0; x < width; x += step) ctx.fillRect(x, 0, 1, height)
  for (let y = 0; y < height; y += step) ctx.fillRect(0, y, width, 1)
}
