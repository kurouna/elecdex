/**
 * The soft fill under a line chart: the line's own colour fading to nothing toward the
 * chart's baseline. Without it a flat series (memory that barely moves) reads as a rule
 * drawn across the pane rather than as data.
 *
 * The gradient starts at the line's furthest point from the baseline (its peak, or its trough
 * for values drawn below a zero line) and fades to `transparent` at the baseline, which a
 * canvas interpolates without darkening, so any CSS colour a theme gives works. Starting at the
 * line rather than the chart's edge keeps the fill visible under a line that stays low.
 */

/** How strong the fill is where the values are highest. */
export const FILL_ALPHA = { accent: 0.32, dim: 0.16 } as const

export function fillArea(
  ctx: CanvasRenderingContext2D,
  points: readonly (readonly [number, number])[],
  options: { baseline: number; color: string; alpha: number },
): void {
  const first = points[0]
  const last = points.at(-1)
  if (first === undefined || last === undefined || points.length < 2) return
  const ys = points.map(([, y]) => y)
  const below = ys.reduce((sum, y) => sum + y, 0) / ys.length > options.baseline
  const edge = below ? Math.max(...ys) : Math.min(...ys)
  // A line lying on its baseline has nothing to fill.
  if (edge === options.baseline) return
  const gradient = ctx.createLinearGradient(0, edge, 0, options.baseline)
  gradient.addColorStop(0, options.color)
  gradient.addColorStop(1, 'transparent')
  ctx.save()
  ctx.globalAlpha = options.alpha
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(first[0], options.baseline)
  for (const [x, y] of points) ctx.lineTo(x, y)
  ctx.lineTo(last[0], options.baseline)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
