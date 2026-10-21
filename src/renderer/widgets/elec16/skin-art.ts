/**
 * The case's materials for the skins that have one (docs/elec16.md section 7): pictures made
 * as SVG data URLs (the page's CSP takes data: images), each made once per skin and kept.
 * A material is baked: fractal noise laid soft-light over the surface's own colour inside the
 * SVG, so the tile is opaque and the page composites nothing over the case - pressing a key
 * repaints that key alone. Light over it (the fall of light down the case, a band of
 * reflection) is plain gradients. Nothing here moves a size layout.ts computes.
 */

import type { Skin } from './skins.ts'

/** A background layer: an image, and where and how it is laid. */
export interface Layer {
  image: string
  size?: string
  position?: string
  repeat?: string
}

const dataUrl = (svg: string): string => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

/**
 * Grey fractal noise laid soft-light over `base`, as one opaque tile. A layer is the noise's
 * frequency across and down (brushed metal: low across, high down), its octaves, its
 * contrast (slope) and its seed.
 */
export function material(
  base: string,
  layers: readonly (readonly [number, number, number, number, number])[],
  w: number,
  h: number,
): string {
  const noise = layers
    .map(([sx, sy, octaves, slope, seed], i) => {
      const funcs = ['R', 'G', 'B']
        .map((c) => `<feFunc${c} type='linear' slope='${slope}' intercept='${(1 - slope) / 2}'/>`)
        .join('')
      return (
        `<feTurbulence type='fractalNoise' baseFrequency='${sx} ${sy}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch' result='t${i}'/>` +
        `<feColorMatrix in='t${i}' type='saturate' values='0' result='g${i}'/>` +
        `<feComponentTransfer in='g${i}' result='n${i}'>${funcs}<feFuncA type='linear' slope='0' intercept='1'/></feComponentTransfer>`
      )
    })
    .join('')
  const blends = layers
    .map(
      (_, i) =>
        `<feBlend mode='soft-light' in='n${i}' in2='${i === 0 ? 'base' : `b${i - 1}`}' result='b${i}'/>`,
    )
    .join('')
  return dataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><filter id='m' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feFlood flood-color='${base}' result='base'/>${noise}${blends}</filter><rect width='100%' height='100%' filter='url(#m)'/></svg>`,
  )
}

const fall = (top: number, bottom: string): string =>
  `linear-gradient(180deg, rgb(255 255 255 / ${top}) 0%, rgb(255 255 255 / 0) 25%, rgb(0 0 0 / 0) 72%, ${bottom} 100%)`

/**
 * GLASS's board, deep behind the glass and out of focus: one board with rounded corners and a
 * standoff with its screw at each, three buses of parallel traces, chips beside the LCD, the
 * LCD's amber flex. Drawn in fractions of the board, so it is one sheet the size of the case's
 * inside - never a repeating pattern - and blurred inside the SVG. Pale on a dark glass, faint
 * grey on a light one.
 */
export function board(dark: boolean): string {
  const ink = dark ? '#a9bdcc' : '#6f8191'
  const lines = dark ? 0.3 : 0.4
  const bus = (
    x: number,
    y: number,
    length: number,
    n: number,
    step: number,
    down: boolean,
  ): string => {
    let out = ''
    for (let i = 0; i < n; i++) {
      const o = i * step
      out += down
        ? `<line x1='${x + o}%' y1='${y}%' x2='${x + o}%' y2='${y + length}%'/>`
        : `<line x1='${x}%' y1='${y + o}%' x2='${x + length}%' y2='${y + o}%'/>`
    }
    return out
  }
  const corner = (x: string, y: string, dx: number, dy: number): string =>
    `<svg x='${x}' y='${y}' overflow='visible'><circle cx='${dx}' cy='${dy}' r='6.5' fill='none' stroke-width='1.6'/><circle cx='${dx}' cy='${dy}' r='2.6'/></svg>`
  const chips = [
    [1.6, 16, 5, 13],
    [93.4, 16, 5, 13],
    [2.2, 34, 3.6, 8],
    [94.2, 34, 3.6, 8],
  ]
    .map(([x, y, w, h]) => `<rect x='${x}%' y='${y}%' width='${w}%' height='${h}%' rx='1.5'/>`)
    .join('')
  return dataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><filter id='f' x='-2%' y='-2%' width='104%' height='104%'><feGaussianBlur stdDeviation='1.8'/></filter><g filter='url(#f)'>` +
      `<rect x='0.2%' y='0.4%' width='99.6%' height='99.2%' rx='10' fill='${dark ? '#2a4a46' : '#9ab8b0'}' fill-opacity='${dark ? 0.22 : 0.14}' stroke='${ink}' stroke-opacity='${lines * 0.8}'/>` +
      `<g stroke='${ink}' stroke-opacity='${lines}' stroke-width='1.2'>${bus(52, 3, 14, 5, 0.9, false)}${bus(3.6, 49, 43, 4, 0.55, true)}${bus(65.3, 56, 41, 4, 0.45, true)}</g>` +
      `<g fill='${dark ? '#0c1116' : '#8796a3'}' fill-opacity='${dark ? 0.45 : 0.22}' stroke='${ink}' stroke-opacity='${lines}'>${chips}</g>` +
      `<rect x='45%' y='42%' width='10%' height='16%' fill='rgb(200 140 60)' fill-opacity='0.25'/>` +
      `<g fill='${ink}' fill-opacity='${lines}' stroke='${ink}' stroke-opacity='${lines}'>${corner('0', '0', 14, 14)}${corner('100%', '0', -14, 14)}${corner('0', '100%', 14, -14)}${corner('100%', '100%', -14, -14)}</g>` +
      `</g></svg>`,
  )
}

const POLKA = dataUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22'><g fill='white' fill-opacity='0.45'><circle cx='5.5' cy='5.5' r='2'/><circle cx='16.5' cy='16.5' r='2'/></g></svg>`,
)

/** The face's layers, top first, for a skin's texture; none for a plain colour. */
function faceLayers(skin: Skin): Layer[] {
  const c = skin.body.face
  switch (skin.body.texture) {
    case 'brushed':
      // Long fine hairlines over faint long streaks, in a wide tile so no streak repeats in a
      // case's width; a broad band of reflection across the brushing; the fall of light.
      return [
        {
          image:
            'linear-gradient(100deg, rgb(255 255 255 / 0) 4%, rgb(255 255 255 / 0.14) 26%, rgb(255 255 255 / 0.03) 44%, rgb(0 0 0 / 0.06) 66%, rgb(255 255 255 / 0.07) 86%, rgb(255 255 255 / 0) 100%)',
        },
        { image: fall(0.16, 'rgb(0 0 0 / 0.13)') },
        {
          image: material(
            c,
            [
              [0.0015, 0.9, 3, 0.35, 3],
              [0.01, 1.6, 2, 0.5, 9],
            ],
            1200,
            96,
          ),
        },
      ]
    case 'grain':
      return [
        { image: fall(0.07, 'rgb(0 0 0 / 0.16)') },
        { image: material(c, [[0.9, 0.9, 2, 0.42, 3]], 180, 180) },
      ]
    case 'grain-soft':
      return [
        { image: fall(0.22, 'rgb(0 0 0 / 0.06)') },
        { image: material(c, [[0.75, 0.75, 2, 0.4, 5]], 180, 180) },
      ]
    case 'polka':
      return [
        { image: fall(0.28, `rgb(${skin.body.shade} / 0.07)`) },
        { image: POLKA },
        { image: material(c, [[0.75, 0.75, 2, 0.3, 5]], 180, 180) },
      ]
    case 'glass':
      // A glint at the top-left corner, a thin streak of reflection, a broad faint one, and the
      // board, 14px in from the rim (its picture is the mode's: --e16-board, set by Device).
      return [
        {
          image: 'radial-gradient(16px 10px at 24px 9px, rgb(255 255 255 / 0.55), transparent)',
          repeat: 'no-repeat',
        },
        {
          image:
            'linear-gradient(118deg, transparent 18%, rgb(255 255 255 / 0.12) 19.5%, rgb(255 255 255 / 0.03) 23%, transparent 24%)',
        },
        {
          image:
            'linear-gradient(122deg, rgb(255 255 255 / 0.10) 0%, rgb(255 255 255 / 0.03) 16%, rgb(255 255 255 / 0) 30%, rgb(255 255 255 / 0) 68%, rgb(255 255 255 / 0.04) 82%, rgb(255 255 255 / 0) 100%)',
        },
        {
          image: 'var(--e16-board)',
          size: 'calc(100% - 28px) calc(100% - 28px)',
          position: 'center',
          repeat: 'no-repeat',
        },
      ]
    default:
      return []
  }
}

export interface FaceStyle {
  image: string
  size: string
  position: string
  repeat: string
}

const faces = new Map<string, FaceStyle | null>()

/** The case's background for a skin, made once and kept; null for a plain colour. */
export function faceStyle(skin: Skin): FaceStyle | null {
  const kept = faces.get(skin.id)
  if (kept !== undefined) return kept
  const layers = faceLayers(skin)
  const style =
    layers.length === 0
      ? null
      : {
          image: layers.map((l) => l.image).join(', '),
          size: layers.map((l) => l.size ?? 'auto').join(', '),
          position: layers.map((l) => l.position ?? '0 0').join(', '),
          repeat: layers.map((l) => l.repeat ?? 'repeat').join(', '),
        }
  faces.set(skin.id, style)
  return style
}

const decks = new Map<string, string>()

/** The deck's own grain, baked on its colour: the case's grain, or a fine one under metal. */
export function deckImage(skin: Skin): string | null {
  const deck = skin.body.deck
  if (deck === null || !skin.body.relief) return null
  const kept = decks.get(skin.id)
  if (kept !== undefined) return kept
  const image = material(
    deck.fill,
    [[0.9, 0.9, 2, skin.body.texture === 'grain' ? 0.42 : 0.3, 7]],
    180,
    180,
  )
  decks.set(skin.id, image)
  return image
}

let boards: { dark: string; light: string } | null = null

/** GLASS's two boards, made the first time a glass case is drawn. */
export function glassBoards(): { dark: string; light: string } {
  boards ??= { dark: board(true), light: board(false) }
  return boards
}
