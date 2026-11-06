/**
 * A canvas font with a space before it, taken as it is meant (docs/decisions.md, 2026-11-07).
 *
 * xterm's WebGL renderer draws its glyphs with `${italic} ${weight} ${size}px ${family}`, which
 * starts with a space when the text is not italic. Chromium 156.0.8078.80 (Electron 45.2.3) stopped
 * taking such a font: the assignment is dropped and the context keeps `10px sans-serif`, so every
 * shell drew a small proportional face in its monospaced cells. CSS allows the space, and so did
 * Chromium 156.0.8078.75. A context whose browser drops it gets the font with the space taken off;
 * one that takes it is left alone, so this goes quiet when Chromium mends it.
 */

/** A 2D context's prototype, as far as its `font` is concerned. */
export interface FontHolder {
  font: string
}

/** Whether a font with a space before it is dropped by these contexts. */
export function dropsLeadingSpace(make: () => FontHolder | null): boolean {
  const ctx = make()
  if (ctx === null) return false
  ctx.font = '10px sans-serif'
  ctx.font = ' 13px monospace'
  return !/13px/.test(ctx.font)
}

/**
 * Makes `font` on these prototypes take a font with the space before it taken off. Once per
 * prototype; a prototype without an accessor for `font` is left as it is.
 */
export function trimFontOn(proto: object): void {
  const desc = Object.getOwnPropertyDescriptor(proto, 'font')
  const { get, set } = desc ?? {}
  if (!desc || !get || !set || (set as { trims?: true }).trims) return
  const trimmed = function (this: FontHolder, value: string) {
    set.call(this, typeof value === 'string' ? value.trimStart() : value)
  }
  Object.assign(trimmed, { trims: true })
  Object.defineProperty(proto, 'font', { ...desc, set: trimmed })
}

/** The page's canvases, mended where this Chromium drops the font (main.ts, before any is drawn). */
export function mendCanvasFonts(): void {
  const kinds: [object | undefined, () => FontHolder | null][] = [
    [
      globalThis.CanvasRenderingContext2D?.prototype,
      () => document.createElement('canvas').getContext('2d'),
    ],
    [
      globalThis.OffscreenCanvasRenderingContext2D?.prototype,
      () =>
        typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(1, 1).getContext('2d') : null,
    ],
  ]
  for (const [proto, make] of kinds) {
    if (proto && dropsLeadingSpace(make)) trimFontOn(proto)
  }
}
