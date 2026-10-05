// ELECAIRCOMBAT's palettes (docs/elec16-elecaircombat.md): sixteen colours each, every value a
// multiple of 8 so it is exactly an RGB555 colour. Colour 0 is the clear one (on the sky's rows
// it is the backdrop). The order is the rows of art/palettes.png and the game's PAL_ constants;
// which slot a palette goes in is the game's.
//
// The sky has a row for each sortie's time of day, and the enemy a row for each ace's paint:
// the game swaps the row into the slot, so the same tiles and frames take every look.

const hex = (s) => {
  const v = Number.parseInt(s.slice(1), 16)
  return [(v >> 16) & 0xf8, (v >> 8) & 0xf8, v & 0xf8]
}
const row = (...colours) => colours.map(hex)

/**
 * Where each step of the sky's gradient lives: [slot, colour], from the haze at the horizon
 * (step 0) up to the zenith, and the sea's from its haze down to the deep water. A slot has
 * fifteen colours and every background slot is taken, so the steps between are shared out
 * between the sky's own slot (0) and the free colours 7-15 of two slots of words, the red
 * (5) and the white (7) - the font draws only with 1, 4, 5 and 6. A band's tile is one colour,
 * and its tile word names the slot (horizon.mjs). The horizon's own cells use the sky's slot
 * only: its haze (7), the glow (8) and the sea's haze (9).
 */
const SKY_STEPS = 16
const SEA_STEPS = 15

/** The words' slots that keep sky steps, with their own colours (0-6). */
export const WORD_SLOTS = [
  {
    slot: 5,
    name: 'red',
    colours: ['#000000', '#200000', '#000000', '#000000', '#a01020', '#f03040', '#f8b0a8'],
  },
  {
    slot: 7,
    name: 'white',
    colours: ['#000000', '#000810', '#000000', '#000000', '#6888a8', '#b8d0e8', '#f8f8f8'],
  },
]
/** The free colours 7-15 of those slots, in the order the steps take them. */
const MORE = WORD_SLOTS.flatMap(({ slot }) => Array.from({ length: 9 }, (_, k) => [slot, 7 + k]))

/**
 * `n` steps' places: the first (the haze) at `haze`; the far end's six in the sky's slot from
 * `far` towards the haze (`dir` the way), and those between in the words' slots from `more`.
 */
function places(n, haze, far, dir, more) {
  return Array.from({ length: n }, (_, k) => {
    if (k === 0) return [0, haze]
    if (k >= n - 6) return [0, far + dir * (n - 1 - k)]
    const at = MORE[more + k - 1]
    if (at === undefined) throw new Error('more sky steps than free colours')
    return at
  })
}
export const SKY_PLACES = places(SKY_STEPS, 7, 1, 1, 0)
export const SEA_PLACES = places(SEA_STEPS, 9, 15, -1, SKY_STEPS - 7)

/**
 * A sky from its five chosen colours: the zenith, the haze at the horizon, the glow on it, the
 * sea's haze below it and the deep water. The bands between are the two ends split into even
 * steps in OKLab (`steps`), so neighbouring bands differ by the same small amount all the way
 * and the whole reads as one smooth gradient (user review 2026-10-05). A row for the sky's
 * slot (the backdrop is the zenith again), and one for each words' slot with its steps.
 */
function sky(name, { zenith, haze, glow, seaHaze, deep }) {
  const rows = new Map([[0, Array(16).fill(hex(zenith))]])
  for (const w of WORD_SLOTS) rows.set(w.slot, [...row(...w.colours), ...Array(9).fill([0, 0, 0])])
  rows.get(0)[8] = hex(glow)
  const place = (places, colours) => {
    places.forEach(([slot, k], j) => {
      rows.get(slot)[k] = colours[j]
    })
  }
  place(SKY_PLACES, steps(haze, zenith, SKY_PLACES.length))
  place(SEA_PLACES, steps(seaHaze, deep, SEA_PLACES.length))
  return [
    { name: `sky_${name}`, colours: rows.get(0) },
    ...WORD_SLOTS.map((w) => ({ name: `${w.name}_${name}`, colours: rows.get(w.slot) })),
  ]
}

/** sRGB (0-1) to OKLab and back (Björn Ottosson's matrices). */
const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const gamma = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)
function toLab(rgb) {
  const [r, g, b] = rgb.map((c) => linear(c / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
function fromLab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.min(248, Math.round((gamma(Math.max(0, Math.min(1, c))) * 255) / 8) * 8))
}

/** `n` colours from `from` to `to` (both kept) in even steps of OKLab, each exact in RGB555. */
export function steps(from, to, n) {
  const a = toLab(hex(from))
  const b = toLab(hex(to))
  return Array.from({ length: n }, (_, k) =>
    fromLab(a.map((v, j) => v + ((b[j] - v) * k) / (n - 1))),
  )
}

const HOURS = [
  sky('day', {
    zenith: '#102868',
    haze: '#98c0e8',
    glow: '#e8f0f0',
    seaHaze: '#a8c8e0',
    deep: '#204880',
  }),
  sky('dawn', {
    zenith: '#282050',
    haze: '#f0c080',
    glow: '#f8f0c8',
    seaHaze: '#e0c0b0',
    deep: '#383858',
  }),
  sky('storm', {
    zenith: '#283038',
    haze: '#889098',
    glow: '#c8d0d0',
    seaHaze: '#a8b0b8',
    deep: '#303038',
  }),
  sky('dusk', {
    zenith: '#180838',
    haze: '#f89038',
    glow: '#f8d890',
    seaHaze: '#f0b080',
    deep: '#281838',
  }),
  sky('night', {
    zenith: '#000010',
    haze: '#182848',
    glow: '#5070a8',
    seaHaze: '#284060',
    deep: '#000818',
  }),
]
/** The sky's slot for each hour, in the game's order (day, dawn, storm, dusk, night). */
export const SKIES = HOURS.map((h) => h[0])
/** The words' slots for each hour, with the sky's further steps: the reds, then the whites. */
const REDS = HOURS.map((h) => h[1])
const WHITES = HOURS.map((h) => h[2])

/**
 * An ace's paint: the outline, the upper paint dark to light (2-6), the underside (7-9), the
 * markings (10-11), the canopy (12-13), the burner (14) and the light details (15).
 */
const paint = (name, colours) => ({ name, colours: row(...colours) })

export const PAINTS = [
  // GANNET: plain air-superiority grey, blue markings.
  paint('ace_gannet', [
    '#000000',
    '#080810',
    '#303848',
    '#506070',
    '#788898',
    '#a0b0c0',
    '#d0d8e0',
    '#607080',
    '#8898a8',
    '#b0c0d0',
    '#1840a0',
    '#4888f0',
    '#101828',
    '#b8e0f8',
    '#f89028',
    '#f0f8f8',
  ]),
  // MISTRAL: desert sand, olive markings.
  paint('ace_mistral', [
    '#000000',
    '#100800',
    '#504020',
    '#786030',
    '#a08048',
    '#c8a868',
    '#e8d098',
    '#887058',
    '#b09878',
    '#d8c8a0',
    '#405020',
    '#80a040',
    '#181008',
    '#f8e8a8',
    '#f88820',
    '#f8f0d8',
  ]),
  // CINDER: dark charcoal, red markings.
  paint('ace_cinder', [
    '#000000',
    '#000000',
    '#181818',
    '#282828',
    '#383840',
    '#505860',
    '#707880',
    '#303038',
    '#484850',
    '#686870',
    '#a01010',
    '#f83820',
    '#080808',
    '#f89880',
    '#f8a020',
    '#c8c8c8',
  ]),
  // ORACLE: white, violet markings.
  paint('ace_oracle', [
    '#000000',
    '#100818',
    '#787890',
    '#9898b0',
    '#b8b8d0',
    '#d8d8e8',
    '#f8f8f8',
    '#9890a8',
    '#b8b0c8',
    '#d8d0e0',
    '#582090',
    '#9050e0',
    '#181028',
    '#d8b8f8',
    '#f88820',
    '#f8f8f8',
  ]),
  // NOCTURNE: black, gold markings and a red canopy; its lit edges grey-blue, so it shows on the
  // night sky.
  paint('ace_nocturne', [
    '#000000',
    '#200008',
    '#101018',
    '#181820',
    '#202030',
    '#303048',
    '#505068',
    '#181820',
    '#282830',
    '#383848',
    '#a07818',
    '#f8d040',
    '#300808',
    '#f84040',
    '#f86030',
    '#f8d040',
  ]),
]

export const PALETTES = [
  ...SKIES,
  {
    // The cockpit's frame and panel: black to bright steel, warning stripes, three lamps
    // (13 MISSILE, 14 ALT, 15 LOCK) dark until the game lights them.
    name: 'frame',
    colours: row(
      '#000000',
      '#000000',
      '#0c1014',
      '#161c22',
      '#20282e',
      '#2c363e',
      '#3c4852',
      '#566470',
      '#7c8a96',
      '#a8b4bc',
      '#c8a020',
      '#f8d848',
      '#381818',
      '#401010',
      '#403010',
      '#103018',
    ),
  },
  {
    // The displays' screens (BG0 under the panel): dark glass, phosphor green; then our
    // fighter's four parts (10 the nose, 11 the left wing, 12 the right wing, 13 the tail,
    // each a green of its own so the map keeps them apart; the game sets them by damage),
    // its edge and its canopy.
    name: 'screen',
    colours: row(
      '#000000',
      '#000000',
      '#020c08',
      '#041810',
      '#0a2a18',
      '#124424',
      '#1c6436',
      '#30a058',
      '#60f090',
      '#b0f8c8',
      '#40c060',
      '#40c068',
      '#48c060',
      '#40c860',
      '#2860a0',
      '#80c0f8',
    ),
  },
  {
    // Words on the HUD: green with a dark edge (the font's 1, 4, 5 and 6).
    name: 'hud_text',
    colours: row(
      '#000000',
      '#002808',
      '#000000',
      '#000000',
      '#20c060',
      '#60f090',
      '#c0f8d0',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
    ),
  },
  {
    // Words on the panel's displays: amber.
    name: 'amber_text',
    colours: row(
      '#000000',
      '#100800',
      '#000000',
      '#000000',
      '#a06000',
      '#f0b000',
      '#f8e888',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
    ),
  },
  ...REDS,
  ...WHITES,
  {
    // The title's letters: steel and sky blue, an afterburner orange edge.
    name: 'logo',
    colours: row(
      '#000000',
      '#04040c',
      '#101830',
      '#203058',
      '#385088',
      '#5878b0',
      '#88a8d8',
      '#c0d8f0',
      '#f8f8f8',
      '#601808',
      '#c04010',
      '#f88020',
      '#f8c050',
      '#f8f0b0',
      '#40c8f8',
      '#d0f0f8',
    ),
  },
  {
    // The HUD's sprites: green lines and marks with a dark edge (the font's indices too).
    name: 'hud',
    colours: row(
      '#000000',
      '#002808',
      '#08481c',
      '#107030',
      '#20c060',
      '#60f090',
      '#c0f8d0',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
    ),
  },
  {
    // The same marks in red: a lock, a warning.
    name: 'hud_red',
    colours: row(
      '#000000',
      '#280000',
      '#500808',
      '#801010',
      '#e02020',
      '#f86050',
      '#f8c8c0',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
      '#000000',
    ),
  },
  {
    // Fire: explosions and the burner, white-hot to dark red.
    name: 'fire',
    colours: row(
      '#000000',
      '#180808',
      '#401010',
      '#802010',
      '#c03808',
      '#f06808',
      '#f8a020',
      '#f8d050',
      '#f8f0a0',
      '#f8f8f8',
      '#302828',
      '#504848',
      '#706868',
      '#989090',
      '#5080f8',
      '#a8d0f8',
    ),
  },
  {
    // Clouds and smoke: shadowed grey to sunlit white.
    name: 'cloud',
    colours: row(
      '#000000',
      '#384050',
      '#485868',
      '#5c6c80',
      '#748498',
      '#8c9cb0',
      '#a8b8c8',
      '#c0ccd8',
      '#d8e0e8',
      '#f0f4f8',
      '#f8f8f8',
      '#282828',
      '#403c3c',
      '#585454',
      '#787070',
      '#989090',
    ),
  },
  {
    // Tracers, missiles and flares.
    name: 'shot',
    colours: row(
      '#000000',
      '#402000',
      '#906000',
      '#f0b000',
      '#f8e050',
      '#f8f8c0',
      '#f8f8f8',
      '#c0c8d0',
      '#808890',
      '#f86020',
      '#f8a040',
      '#40a0f8',
      '#a0e0f8',
      '#f83040',
      '#f8a0a0',
      '#e0e0e0',
    ),
  },
  {
    // Every colour light: an enemy drawn in this palette for a frame flashes when hit.
    name: 'flash',
    colours: row(
      '#000000',
      '#a8a8b8',
      '#f8f8f8',
      '#f8f8f8',
      '#f8f8f8',
      '#f8f8f8',
      '#f8f8f8',
      '#f0f0f8',
      '#f8f8f8',
      '#f8f8f8',
      '#f8f8e0',
      '#f8f8e0',
      '#e8e8f8',
      '#f8f8f8',
      '#f8f8a0',
      '#f8f8f8',
    ),
  },
  {
    // The sun and its flare.
    name: 'sun',
    colours: row(
      '#000000',
      '#603808',
      '#a06010',
      '#e09020',
      '#f8c040',
      '#f8e080',
      '#f8f8c0',
      '#f8f8f8',
      '#204880',
      '#3870b0',
      '#60a0d8',
      '#90c8f0',
      '#803060',
      '#c060a0',
      '#408858',
      '#70c088',
    ),
  },
  ...PAINTS,
]

/** A palette's colours by name. */
export const paletteOf = (name) => {
  const p = PALETTES.find((x) => x.name === name)
  if (p === undefined) throw new Error(`no palette ${name}`)
  return p.colours
}
