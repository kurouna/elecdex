import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { build } from 'vite'
import { type Launched, launch } from './support.js'

/**
 * The spectrum's painter redraws only the columns that changed (spectrum-draw.ts).
 * What that must never do is leave something behind: a canvas painted frame by
 * frame has to end up the same picture as one painted whole from the same levels.
 *
 * It did not. The strips had fractional edges, so the clip's anti-aliasing let a
 * column's glow into the pixel it shares with its neighbour and only partly took
 * it out again - thin lines as tall as the sound had been, left standing after
 * the startup sound. Only a real canvas shows that (jsdom has none), so the
 * painter is bundled and run in the app's own Chromium, on a canvas of its own.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

let launched: Launched

/** The painter and what it needs, as one script that leaves them on the page. */
async function painterScript(): Promise<string> {
  const entry = 'virtual:spectrum-paint'
  const result = await build({
    configFile: false,
    root: ROOT,
    logLevel: 'silent',
    resolve: { alias: { '@shared': path.join(ROOT, 'src/shared') } },
    plugins: [
      {
        name: 'spectrum-paint-entry',
        resolveId: (id) => (id === entry ? `\0${entry}` : null),
        load: (id) =>
          id === `\0${entry}`
            ? `import { SpectrumPainter } from '/src/renderer/widgets/audio/spectrum-draw.ts'
               import { emptyMeters } from '/src/shared/audio.ts'
               globalThis.__spectrumPaint = { SpectrumPainter, emptyMeters }`
            : null,
      },
    ],
    build: {
      write: false,
      minify: false,
      rollupOptions: { input: entry, output: { format: 'iife' } },
    },
  })
  const output = (Array.isArray(result) ? result[0] : result) as {
    output: Array<{ code?: string }>
  }
  return output.output[0]?.code ?? ''
}

test.beforeAll(async () => {
  launched = await launch()
  await launched.page.evaluate(await painterScript())
})

test.afterAll(async () => {
  await launched?.close()
})

interface Case {
  width: number
  bands: 7 | 10 | 16 | 31
  style: 'vfd-cyan' | 'led' | 'accent'
  pattern: 'bars' | 'mirror' | 'peak'
}

const CASES: Case[] = [
  // The pane in the report: 31 bands, where the glow is wider than the gap between bars.
  { width: 524, bands: 31, style: 'vfd-cyan', pattern: 'bars' },
  { width: 523, bands: 31, style: 'vfd-cyan', pattern: 'mirror' },
  { width: 401, bands: 16, style: 'vfd-cyan', pattern: 'peak' },
  { width: 333, bands: 10, style: 'accent', pattern: 'bars' },
  { width: 524, bands: 31, style: 'led', pattern: 'bars' },
]

for (const c of CASES) {
  test(`sound that comes and goes leaves nothing behind: ${c.bands} bands, ${c.style}, ${c.pattern}, ${c.width}px`, async () => {
    const differing = await launched.page.evaluate((spec) => {
      const { SpectrumPainter, emptyMeters } = (
        globalThis as unknown as {
          __spectrumPaint: {
            SpectrumPainter: new () => {
              paint(
                canvas: HTMLCanvasElement,
                meters: { level: number[]; peak: number[]; hold: number[] },
                prefs: unknown,
                palette: unknown,
                force?: boolean,
              ): void
            }
            emptyMeters: (count: number) => { level: number[]; peak: number[]; hold: number[] }
          }
        }
      ).__spectrumPaint
      const prefs = { style: spec.style, bands: spec.bands, pattern: spec.pattern, peakHold: true }
      const palette = { accent: '#aacfd1', label: 'rgba(170, 207, 209, 0.5)' }
      const canvasOf = (): HTMLCanvasElement => {
        const canvas = document.createElement('canvas')
        canvas.style.cssText = `position:fixed;left:0;top:0;width:${spec.width}px;height:300px;z-index:-1`
        document.body.append(canvas)
        return canvas
      }
      const pixels = (canvas: HTMLCanvasElement): Uint8ClampedArray =>
        (canvas.getContext('2d') as CanvasRenderingContext2D).getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data

      // A burst of sound, column by column at its own height, falling away to silence.
      const stepped = canvasOf()
      const painter = new SpectrumPainter()
      const silence = emptyMeters(spec.bands)
      painter.paint(stepped, silence, prefs, palette, true)
      for (let frame = 0; frame < 40; frame++) {
        const meters = emptyMeters(spec.bands)
        for (let col = 0; col < spec.bands; col++) {
          const height = Math.max(0, Math.sin(frame / 6 + col) * (1 - frame / 40))
          meters.level[col] = height
          meters.peak[col] = Math.min(1, height + 0.15 * (1 - frame / 40))
        }
        painter.paint(stepped, meters, prefs, palette)
      }
      painter.paint(stepped, silence, prefs, palette)

      const whole = canvasOf()
      new SpectrumPainter().paint(whole, silence, prefs, palette, true)

      const a = pixels(stepped)
      const b = pixels(whole)
      const rowBytes = stepped.width * 4
      let count = 0
      const rows = new Set<number>()
      for (let i = 0; i < a.length; i++) {
        if (a[i] === b[i]) continue
        count += 1
        rows.add(Math.floor(i / rowBytes))
      }
      stepped.remove()
      whole.remove()
      if (a.length !== b.length) return 'different sizes'
      // Where they differ says what differs: the plot, or the labels below it.
      const sorted = [...rows].sort((x, y) => x - y)
      return count === 0
        ? ''
        : `${count} bytes in rows ${sorted[0]}-${sorted.at(-1)} of ${stepped.height}`
    }, c)
    expect(differing).toBe('')
  })
}
