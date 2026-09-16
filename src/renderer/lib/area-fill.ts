/**
 * The soft fill under a line chart: the line's own colour fading to nothing toward the
 * chart's baseline. Without it a flat series (memory that barely moves) reads as a rule
 * drawn across the pane rather than as data.
 *
 * Every column fades from where the line is in that column down (or, below a zero line, up)
 * to the baseline, so a line that stays low keeps a full-strength fill under it even when an
 * earlier spike is still in view. One gradient for the whole area, from the peak, left CPU and
 * traffic almost bare: their lines sit near the baseline most of the time. A linear gradient
 * cannot vary its length across x, so the area is clipped to the line and painted in narrow
 * strips, each with its own gradient; strip edges fall on whole device pixels, where abutting
 * rectangles leave no antialiasing seams.
 *
 * The far end of the gradient is the same colour with no alpha (relative colour syntax, so any
 * colour a theme gives works). Plain `transparent` is transparent *black*, and the canvas
 * interpolates toward it unpremultiplied, which darkened the fill into the dark ground.
 */

/** How strong the fill is right under the line. */
export const FILL_ALPHA = { accent: 0.32, dim: 0.16 } as const

/** Strip width in device pixels: narrow enough that the steps never show. */
const STRIP_PX = 2

type Point = readonly [number, number]

export function fillArea(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  options: { baseline: number; color: string; alpha: number },
): void {
  const first = points[0]
  const last = points.at(-1)
  if (first === undefined || last === undefined || points.length < 2) return
  const { baseline, color } = options
  if (points.every(([, y]) => y === baseline)) return

  const clear = `rgb(from ${color} r g b / 0)`
  ctx.save()
  ctx.globalAlpha = options.alpha
  ctx.beginPath()
  ctx.moveTo(first[0], baseline)
  for (const [x, y] of points) ctx.lineTo(x, y)
  ctx.lineTo(last[0], baseline)
  ctx.closePath()
  ctx.clip()

  const scale = ctx.getTransform().a || 1
  const step = STRIP_PX / scale
  let from = Math.floor(first[0] * scale) / scale
  let i = 0
  while (from < last[0]) {
    const to = from + step
    // Past the points that end before this strip; the one before it still bounds the strip.
    while (i < points.length - 2 && (points[i + 1]?.[0] ?? 0) <= from) i++
    const edge = furthest(points, i, from, to, baseline)
    if (edge !== baseline) {
      const gradient = ctx.createLinearGradient(0, edge, 0, baseline)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, clear)
      ctx.fillStyle = gradient
      ctx.fillRect(from, Math.min(edge, baseline), step, Math.abs(baseline - edge))
    }
    from = to
  }
  ctx.restore()
}

/** The line's y furthest from the baseline between `from` and `to`, starting at segment `i`. */
function furthest(
  points: readonly Point[],
  i: number,
  from: number,
  to: number,
  baseline: number,
): number {
  let edge = baseline
  const take = (y: number): void => {
    if (Math.abs(y - baseline) > Math.abs(edge - baseline)) edge = y
  }
  take(yAt(points, i, from))
  for (let j = i + 1; j < points.length; j++) {
    const p = points[j]
    if (p === undefined || p[0] >= to) break
    take(p[1])
  }
  take(yAt(points, i, to))
  return edge
}

/** The line's y at `x`, searching forward from segment `i` and clamping at the ends. */
function yAt(points: readonly Point[], i: number, x: number): number {
  for (let j = i; j < points.length - 1; j++) {
    const a = points[j]
    const b = points[j + 1]
    if (a === undefined || b === undefined) break
    if (x <= b[0] || j === points.length - 2) {
      if (x <= a[0]) return a[1]
      if (x >= b[0]) return b[1]
      return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])
    }
  }
  return points[i]?.[1] ?? 0
}
