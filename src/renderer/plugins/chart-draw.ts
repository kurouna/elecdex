import type { ChartSeries, Tone } from '@shared/plugin-api'

/**
 * Drawing a plugin's chart block on a canvas: grid, series, rules and labels, each on
 * its own, in colours read from the theme's variables on the canvas element.
 */

export interface ChartSpec {
  x: { min: number; max: number }
  y: { min: number; max: number }
  series: readonly ChartSeries[]
  rules: readonly {
    x?: number | undefined
    y?: number | undefined
    label?: string | undefined
    tone?: Tone | undefined
  }[]
  labels: readonly { x: number; y: number; text: string; tone?: Tone | undefined }[]
}

interface Surface {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  px(v: number): number
  py(v: number): number
  color(tone: Tone | undefined, fallback?: string): string
}

const TONE_VARS: Record<Tone, string> = {
  ok: '--ok',
  warn: '--warn',
  danger: '--danger',
  dim: '--text-muted',
  accent: '--accent-strong',
}

const DASH: Record<string, number[]> = { solid: [], dashed: [5, 4], dotted: [1.5, 3] }

export function drawChart(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  spec: ChartSpec,
): void {
  const ctx = canvas.getContext('2d')
  if (ctx === null || width <= 0) return
  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const style = getComputedStyle(canvas)
  const read = (name: string) => style.getPropertyValue(name).trim()
  const spanX = spec.x.max - spec.x.min || 1
  const spanY = spec.y.max - spec.y.min || 1
  const surface: Surface = {
    ctx,
    width,
    height,
    px: (v) => ((v - spec.x.min) / spanX) * width,
    py: (v) => height - ((v - spec.y.min) / spanY) * height,
    color: (tone, fallback = '--accent') => read(tone ? TONE_VARS[tone] : fallback) || '#8fe3ea',
  }
  ctx.font = `${read('--step--2') || '10px'} ${read('--font-mono') || 'monospace'}`
  ctx.textBaseline = 'top'

  drawGrid(surface)
  for (const s of spec.series) drawSeries(surface, s)
  for (const rule of spec.rules) drawRule(surface, rule)
  drawLabels(surface, spec.labels)
}

/** Quarters, dashed, as the monitoring charts draw theirs. */
function drawGrid({ ctx, width, height, color }: Surface): void {
  ctx.strokeStyle = color(undefined, '--panel-rule')
  ctx.lineWidth = 1
  ctx.setLineDash([2, 3])
  ctx.beginPath()
  for (let i = 1; i < 4; i++) {
    const y = Math.round((height * i) / 4) + 0.5
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }
  ctx.stroke()
}

function drawSeries({ ctx, height, px, py, color }: Surface, s: ChartSeries): void {
  const first = s.points[0]
  const last = s.points.at(-1)
  if (first === undefined || last === undefined) return
  ctx.setLineDash(DASH[s.line ?? 'solid'] ?? [])
  ctx.strokeStyle = color(s.tone)
  ctx.lineWidth = 1.4
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(px(first[0]), py(first[1]))
  for (const [x, y] of s.points.slice(1)) ctx.lineTo(px(x), py(y))
  ctx.stroke()
  if (!s.fill) return
  ctx.lineTo(px(last[0]), height)
  ctx.lineTo(px(first[0]), height)
  ctx.closePath()
  ctx.globalAlpha = 0.14
  ctx.fillStyle = color(s.tone)
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawRule(surface: Surface, rule: ChartSpec['rules'][number]): void {
  const { ctx, width, height, px, py, color } = surface
  ctx.setLineDash([4, 3])
  ctx.strokeStyle = color(rule.tone, '--text-muted')
  ctx.fillStyle = ctx.strokeStyle
  ctx.beginPath()
  if (rule.y !== undefined) {
    const y = Math.round(py(rule.y)) + 0.5
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
    ctx.textAlign = 'left'
    if (rule.label) ctx.fillText(rule.label, 2, Math.min(height - 10, y + 2))
  } else if (rule.x !== undefined) {
    const x = Math.round(px(rule.x)) + 0.5
    const right = x > width / 2
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
    ctx.textAlign = right ? 'right' : 'left'
    if (rule.label) ctx.fillText(rule.label, x + (right ? -3 : 3), 2)
  }
  ctx.setLineDash([])
}

function drawLabels(
  { ctx, width, height, px, py, color }: Surface,
  labels: ChartSpec['labels'],
): void {
  for (const label of labels) {
    const x = px(label.x)
    const right = x > width / 2
    ctx.fillStyle = color(label.tone, '--text')
    ctx.textAlign = right ? 'right' : 'left'
    ctx.fillText(
      label.text,
      x + (right ? -4 : 4),
      Math.max(0, Math.min(height - 10, py(label.y) - 12)),
    )
  }
}
