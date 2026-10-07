// The mock's palettes. A fighter's palette is one sprite palette (index 0 clear): 1-2 the wire,
// the same for every fighter and side; 3-11 three fills of three tones, the only part that
// differs between P1 and the CPU; 12 glow, 13 void, 14-15 spare. Every value is a multiple of
// 8, as the machine's palette holds them.

/** A colour on the machine's grid (multiples of 8, at most 248). */
export const q8 = (c) => c.map((v) => Math.min(248, Math.max(0, Math.round(v / 8) * 8)))
export const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)

/** The ground (elecdex's background). */
export const GROUND = q8([0, 8, 16])
const VOID = q8([8, 16, 24])

// The theme's cyan, hsl(183): bright for the outline and material borders, dim for creases.
const WIRE = [q8([136, 240, 248]), q8([40, 136, 152])]

const SIDES = {
  // P1: slate blue suit, graphite gear, a pale grey mannequin head.
  p1: [
    [136, 168, 216],
    [88, 112, 168],
    [56, 72, 120],
    [96, 104, 120],
    [64, 72, 88],
    [40, 44, 56],
    [200, 208, 224],
    [152, 160, 184],
    [104, 112, 136],
  ],
  // CPU: crimson suit, dark umber gear, a warm grey head.
  cpu: [
    [232, 120, 104],
    [176, 72, 80],
    [112, 40, 64],
    [112, 88, 88],
    [80, 56, 64],
    [48, 32, 40],
    [224, 200, 192],
    [176, 152, 152],
    [120, 96, 112],
  ],
}

/** The 16 colours of a side's fighter palette. */
export function fighterPalette(side) {
  return [
    GROUND,
    ...WIRE,
    ...SIDES[side].map(q8),
    q8([248, 216, 120]),
    VOID,
    q8([248, 248, 248]),
    q8([248, 160, 72]),
  ]
}

/** The same palette with the fill emptied: the figure drawn by its wire alone. */
export function wireOnly(pal, wire = 2) {
  const p = [...pal]
  for (let i = 3; i <= 11; i++) p[i] = VOID
  p[13] = VOID
  if (wire < 2) p[1] = pal[2]
  if (wire < 1) p[2] = q8(mix(pal[2], VOID, 0.45))
  return p
}

/** The fill brought `t` of the way from the void to its own colours. */
export function filling(pal, t) {
  return pal.map((c, i) => ((i >= 3 && i <= 11) || i === 13 ? q8(mix(VOID, c, t)) : c))
}

/** The hit flash: the wire white, the fill lightened. */
export function hitFlash(pal) {
  const p = pal.map((c, i) => (i >= 3 && i <= 11 ? q8(mix(c, [248, 248, 248], 0.45)) : c))
  p[1] = q8([248, 248, 248])
  p[2] = q8([208, 224, 232])
  return p
}

/** One colour for every index: a silhouette. */
export const flat = (c) => Array(16).fill(q8(c))

// The stage (BG palette): ground, then the cyan lines in three levels and the skyline's fills.
export const STAGE = [
  GROUND,
  [120, 216, 224],
  [48, 120, 136],
  [24, 72, 88],
  [32, 88, 104],
  [16, 48, 64],
  [8, 24, 40],
].map(q8)

// The HUD (BG palette): ground, bright, dim, the bar's empty part, amber, white.
export const HUD = [
  GROUND,
  [152, 232, 232],
  [56, 112, 120],
  [16, 40, 48],
  [248, 192, 72],
  [248, 248, 248],
].map(q8)

// The hit spark: white wire, then hot fills.
export const SPARK = [
  GROUND,
  [248, 248, 248],
  [248, 200, 96],
  [248, 240, 200],
  [248, 200, 112],
  [216, 128, 40],
  [248, 176, 72],
  [216, 96, 32],
  [152, 56, 24],
  [248, 240, 200],
  [248, 200, 112],
  [216, 128, 40],
  [248, 216, 120],
  [8, 16, 24],
  [248, 248, 248],
  [248, 160, 72],
].map(q8)

export const SHADOW = flat([0, 0, 8])
