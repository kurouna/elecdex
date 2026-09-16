import {
  BAND_SETS,
  bandLabel,
  litSegments,
  type Meters,
  type SpectrumPrefs,
  type SpectrumStyle,
} from '@shared/audio'

/**
 * Draws a spectrum the way a 1990s-2000s car head unit showed it: columns of
 * segments with the unlit ones faintly visible, a held peak segment above each
 * column, and for the fluorescent (VFD) styles a soft glow under the fine mesh of
 * the tube's grid. The VFD and LED styles sit on their own dark glass, as the
 * real displays did, so they read the same on a light theme.
 *
 * It runs up to 20 times a second while sound plays, so the work per frame is kept
 * small. Everything that does not move - the glass, the unlit segments, the
 * labels - is drawn once into a cached layer, and a
 * frame redraws only the columns whose lit segments changed: their strip of that
 * layer, then one path per colour. Blurring each segment (canvas shadows) was the
 * cost: the number of GPU draws a frame, not the canvas size, set it.
 */

interface Look {
  /** The colour of a segment at a height from 0 (bottom) to 1 (top). */
  at(height: number): string
  /** Opacity of unlit segments. */
  ghost: number
  glow: number
  mesh: boolean
  /** The share of each row left dark between segments. */
  gap: number
  glass: boolean
}

const LOOKS: Record<Exclude<SpectrumStyle, 'accent'>, Look> = {
  'vfd-cyan': { at: () => '#7ff6ff', ghost: 0.09, glow: 8, mesh: true, gap: 0.26, glass: true },
  'vfd-amber': { at: () => '#ffb547', ghost: 0.09, glow: 8, mesh: true, gap: 0.26, glass: true },
  led: {
    at: (h) => (h < 0.6 ? '#39f07a' : h < 0.84 ? '#ffd33d' : '#ff4a3a'),
    ghost: 0.1,
    glow: 0,
    mesh: false,
    gap: 0.34,
    glass: true,
  },
}

const GLASS = '#04070b'
const LABEL_HEIGHT = 14

export interface Palette {
  accent: string
  label: string
}

function lookFor(style: SpectrumStyle, palette: Palette): Look {
  if (style !== 'accent') return LOOKS[style]
  return { at: () => palette.accent, ghost: 0.12, glow: 2, mesh: false, gap: 0.3, glass: false }
}

/** The number of segment rows for a height: about one per 12 CSS pixels, within limits. */
export const segmentRows = (height: number): number =>
  Math.max(8, Math.min(32, Math.round(height / 12)))

/**
 * Label every this many columns, so the widest label keeps a small gap to the next:
 * 32 bands in a narrow pane would otherwise print their labels over each other.
 */
export const labelStep = (colW: number, labelW: number): number =>
  colW > 0 ? Math.max(1, Math.ceil((labelW + 4) / colW)) : 1

interface Geometry {
  w: number
  h: number
  dpr: number
  look: Look
  bands: readonly number[]
  pad: number
  innerH: number
  plotH: number
  rows: number
  pitch: number
  segH: number
  colW: number
  barW: number
  mirror: boolean
  /** Rows per column: all of them, or half for the mirrored pattern. */
  count: number
}

function geometry(
  w: number,
  h: number,
  dpr: number,
  prefs: SpectrumPrefs,
  palette: Palette,
): Geometry {
  const look = lookFor(prefs.style, palette)
  const bands = BAND_SETS[prefs.bands]
  const plotH = h - LABEL_HEIGHT
  const pad = look.glass ? 6 : 0
  const innerH = plotH - pad * 2
  const rows = segmentRows(innerH)
  const colW = (w - pad * 2) / bands.length
  const mirror = prefs.pattern === 'mirror'
  return {
    w,
    h,
    dpr,
    look,
    bands,
    pad,
    innerH,
    plotH,
    rows,
    pitch: innerH / rows,
    segH: Math.max(1.5, (innerH / rows) * (1 - look.gap)),
    colW,
    barW: colW * (bands.length > 10 ? 0.74 : 0.7),
    mirror,
    count: mirror ? Math.floor(rows / 2) : rows,
  }
}

/** Where a segment's rectangle starts: row 0 above the base, row -1 below it (mirror). */
function segmentAt(g: Geometry, col: number, row: number): { x: number; y: number } {
  const base = g.mirror ? g.pad + g.innerH / 2 : g.pad + g.innerH
  return {
    x: g.pad + col * g.colW + (g.colW - g.barW) / 2,
    y: base - (row + 1) * g.pitch + (g.pitch - g.segH) / 2,
  }
}

function offscreen(w: number, h: number, dpr: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * dpr))
  canvas.height = Math.max(1, Math.round(h * dpr))
  const ctx = canvas.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  return canvas
}

/** The rows of each column drawn in both halves when mirrored. */
function forRows(g: Geometry, row: number, draw: (row: number) => void): void {
  draw(row)
  if (g.mirror) draw(-row - 1)
}

/** The layer that does not move: glass, unlit segments, labels. */
function staticLayer(g: Geometry, palette: Palette): HTMLCanvasElement {
  const layer = offscreen(g.w, g.h, g.dpr)
  const ctx = layer.getContext('2d')
  if (!ctx) return layer
  if (g.look.glass) {
    ctx.fillStyle = GLASS
    ctx.fillRect(0, 0, g.w, g.plotH)
  }
  ctx.globalAlpha = g.look.ghost
  g.bands.forEach((_, col) => {
    for (let r = 0; r < g.count; r++) {
      ctx.fillStyle = g.look.at(r / g.count)
      forRows(g, r, (row) => {
        const { x, y } = segmentAt(g, col, row)
        ctx.fillRect(x, y, g.barW, g.segH)
      })
    }
  })
  ctx.globalAlpha = 1
  ctx.fillStyle = palette.label
  ctx.font = '10px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  const every = labelStep(
    g.colW,
    Math.max(...g.bands.map((hz) => ctx.measureText(bandLabel(hz)).width)),
  )
  g.bands.forEach((hz, col) => {
    if (col % every !== 0) return
    ctx.fillText(bandLabel(hz), g.pad + col * g.colW + g.colW / 2, g.h - 1)
  })
  return layer
}

/** A pattern of the fluorescent tube's grid mesh: a dark line every third pixel. */
function meshPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const tile = document.createElement('canvas')
  tile.width = 1
  tile.height = 3
  const t = tile.getContext('2d')
  if (!t) return null
  t.fillStyle = 'rgba(4, 7, 11, 0.35)'
  t.fillRect(0, 0, 1, 1)
  return ctx.createPattern(tile, 'repeat')
}

/** Paints spectra onto one canvas, keeping what it can between frames. */
export class SpectrumPainter {
  #key = ''
  #layer: HTMLCanvasElement | null = null
  #mesh: CanvasPattern | null = null
  #geometry: Geometry | null = null
  /** What each column showed when last drawn; empty after a new layout. */
  #drawn: string[] = []

  /** Draws the meters; `force` draws even when the lit segments have not changed. */
  paint(
    canvas: HTMLCanvasElement,
    meters: Meters,
    prefs: SpectrumPrefs,
    palette: Palette,
    force = false,
  ): void {
    // One canvas pixel per CSS pixel whatever the display: segments need no finer
    // edges, and a hi-DPI backing store more than doubled the pixels redrawn each frame.
    const dpr = 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w === 0 || h === 0) return
    const key = [
      w,
      h,
      dpr,
      prefs.style,
      prefs.bands,
      prefs.pattern,
      palette.accent,
      palette.label,
    ].join('|')
    if (key !== this.#key || !this.#geometry) {
      this.#key = key
      this.#geometry = geometry(w, h, dpr, prefs, palette)
      this.#layer = staticLayer(this.#geometry, palette)
      this.#mesh = null
      this.#drawn = []
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    const g = this.#geometry
    const ctx = canvas.getContext('2d')
    const layer = this.#layer
    if (!ctx || !layer) return
    const full = force || this.#drawn.length === 0
    if (full) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // The labels below the columns are drawn once here, with everything else.
      ctx.drawImage(layer, 0, 0)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.#litRows(g, meters, prefs).forEach((lit, col) => {
      const signature = lit.join(',')
      if (!full && this.#drawn[col] === signature) return
      this.#drawn[col] = signature
      this.#column(ctx, layer, g, col, lit, full)
    })
  }

  /**
   * Redraws one column's strip: its piece of the static layer, then its lit
   * segments, clipped to the strip so a glow never lingers over a neighbour that
   * is not redrawn.
   */
  #column(
    ctx: CanvasRenderingContext2D,
    layer: HTMLCanvasElement,
    g: Geometry,
    col: number,
    [bars, peak]: [number, number],
    restored: boolean,
  ): void {
    const left = g.pad + col * g.colW
    ctx.save()
    ctx.beginPath()
    ctx.rect(left, 0, g.colW, g.plotH)
    ctx.clip()
    if (!restored) {
      ctx.clearRect(left, 0, g.colW, g.plotH)
      const d = g.dpr
      ctx.drawImage(layer, left * d, 0, g.colW * d, g.plotH * d, left, 0, g.colW, g.plotH)
    }
    // Lit segments by colour, each colour one path: a halo of slightly larger,
    // faint rectangles for the glow, then the segments. A few fills a column, not a
    // blurred draw per segment.
    const byColour = new Map<string, number[]>()
    const light = (r: number): void => {
      const colour = g.look.at(r / g.count)
      const rows = byColour.get(colour) ?? []
      byColour.set(colour, rows)
      forRows(g, r, (row) => rows.push(row))
    }
    for (let r = 0; r < bars; r++) light(r)
    if (peak >= 0) light(peak)
    const halo = g.look.glow / 2
    for (const [colour, rows] of byColour) {
      ctx.fillStyle = colour
      if (halo > 0) {
        ctx.globalAlpha = 0.22
        this.#rects(ctx, g, col, rows, halo)
      }
      ctx.globalAlpha = 1
      this.#rects(ctx, g, col, rows, 0)
    }
    if (g.look.mesh) {
      this.#mesh ??= meshPattern(ctx)
      if (this.#mesh) {
        ctx.fillStyle = this.#mesh
        ctx.fillRect(left, 0, g.colW, g.plotH)
      }
    }
    ctx.restore()
  }

  /** Fills the given rows of a column as one path, each rectangle grown by `grow`. */
  #rects(
    ctx: CanvasRenderingContext2D,
    g: Geometry,
    col: number,
    rows: number[],
    grow: number,
  ): void {
    ctx.beginPath()
    for (const row of rows) {
      const { x, y } = segmentAt(g, col, row)
      ctx.rect(x - grow, y - grow, g.barW + grow * 2, g.segH + grow * 2)
    }
    ctx.fill()
  }

  /** Per column: how many segments light, and the peak's row or -1 for none. */
  #litRows(g: Geometry, meters: Meters, prefs: SpectrumPrefs): Array<[number, number]> {
    return g.bands.map((_, col) => {
      const bars = prefs.pattern === 'peak' ? 0 : litSegments(meters.level[col] ?? 0, g.count)
      const peakRow = litSegments(meters.peak[col] ?? 0, g.count) - 1
      const showPeak =
        peakRow >= 0 && (prefs.pattern === 'peak' || (prefs.peakHold && peakRow >= bars))
      return [bars, showPeak ? peakRow : -1]
    })
  }
}

/** Paints one mixer meter - a column of LED segments with a held peak - when it changes. */
export class MeterPainter {
  #last = ''

  paint(canvas: HTMLCanvasElement, level: number, peak: number, force = false): void {
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w === 0 || h === 0) return
    const rows = Math.max(8, Math.min(30, Math.round(h / 8)))
    const lit = litSegments(level, rows)
    const peakRow = litSegments(peak, rows) - 1
    const signature = [w, h, dpr, lit, peakRow].join('|')
    if (!force && signature === this.#last) return
    this.#last = signature
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = GLASS
    ctx.fillRect(0, 0, w, h)
    const pitch = h / rows
    for (let r = 0; r < rows; r++) {
      ctx.globalAlpha = r < lit || r === peakRow ? 1 : 0.1
      ctx.fillStyle = LOOKS.led.at(r / rows)
      ctx.fillRect(1, h - (r + 1) * pitch + 1, w - 2, pitch - 2)
    }
    ctx.globalAlpha = 1
  }
}
