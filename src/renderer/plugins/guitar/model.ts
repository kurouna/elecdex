/**
 * The electric guitar's strings (docs/plugins.md section 13.9): which string and fret a note is
 * played on, and from that the string's modes - where it is picked, where the pickup hears
 * it, how stiff it is and how fast each partial dies.
 *
 * As the piano, nothing is recorded or measured from a recording: a solid-body guitar with a
 * 648 mm scale and a light set of strings (0.010-0.046 in), a bridge pickup, and the physics
 * of a plucked string. Pure, so the audio thread, the tests and scripts run the same code.
 */

/** The scale length, metres: the nut to the bridge saddle. */
export const SCALE = 0.648
/** Where the bridge pickup sits, metres from the saddle, and how wide it hears. */
const PICKUP_AT = 0.041
const PICKUP_WIDTH = 0.012
/** Where the pick strikes, metres from the saddle: a lead player picks near the bridge. */
const PICK_AT = 0.085

/** A string of the guitar: open pitch, gauge, whether it is wound, and its tension. */
export interface GuitarString {
  open: number
  /** Diameter, metres; for a wound string, its steel core's. */
  core: number
  gauge: number
  wound: boolean
  tension: number
}

/** A light set, E2 to E4: the wound three below a plain G, as on most electric guitars. */
export const STRINGS: readonly GuitarString[] = [
  { open: 40, gauge: 0.046, core: 0.017, wound: true, tension: 77 },
  { open: 45, gauge: 0.036, core: 0.015, wound: true, tension: 82 },
  { open: 50, gauge: 0.026, core: 0.013, wound: true, tension: 78 },
  { open: 55, gauge: 0.017, core: 0.017, wound: false, tension: 72 },
  { open: 59, gauge: 0.013, core: 0.013, wound: false, tension: 67 },
  { open: 64, gauge: 0.01, core: 0.01, wound: false, tension: 72 },
].map((s) => ({ ...s, gauge: s.gauge * 0.0254, core: s.core * 0.0254 }))

/** The last fret a lead player reaches for. */
const TOP_FRET = 22
/** The frets a lead line sits in when it can: up the neck, but not into the dusty end. */
const SWEET_FROM = 5
const SWEET_TO = 15

export interface Fretting {
  string: number
  fret: number
  /** The sounding length, metres. */
  length: number
}

/**
 * The string and fret for a key: the highest string that reaches it without going past the
 * frets a lead line sits in - on the plain strings, where a lead is played, when it can be.
 */
export function fretFor(pitch: number): Fretting {
  const p = Math.round(pitch)
  let reach = -1
  let sweet = -1
  STRINGS.forEach((s, i) => {
    const fret = p - s.open
    if (fret >= 0 && fret <= TOP_FRET) reach = i
    if (fret >= SWEET_FROM && fret <= SWEET_TO) sweet = i
  })
  // Below the lowest string, or above the highest fret: the nearest the guitar has.
  const choice = sweet >= 0 ? sweet : reach >= 0 ? reach : p < 40 ? 0 : STRINGS.length - 1
  const string = STRINGS[choice] as GuitarString
  const fret = Math.min(TOP_FRET, Math.max(0, p - string.open))
  return { string: choice, fret, length: SCALE * 2 ** (-fret / 12) }
}

/**
 * Every place a key can be played, the one a lead player reaches for first (fretFor), then the
 * others from the highest string down: where a chord's second note goes when its string is taken.
 */
export function frettingsFor(pitch: number): Fretting[] {
  const first = fretFor(pitch)
  const p = Math.round(pitch)
  const others: Fretting[] = []
  for (let s = STRINGS.length - 1; s >= 0; s--) {
    const fret = p - (STRINGS[s] as GuitarString).open
    if (s !== first.string && fret >= 0 && fret <= TOP_FRET) {
      others.push({ string: s, fret, length: SCALE * 2 ** (-fret / 12) })
    }
  }
  return [first, ...others]
}

/** One note's modes: frequency (rad/s), decay (per second), and its weights. */
export interface GuitarModes {
  count: number
  omega: Float64Array
  decay: Float64Array
  /** How far each mode is set moving by the pick, per unit of the pick's push. */
  pluck: Float64Array
  /** How much of each mode the pickup hears: its place, width and the velocity it senses. */
  pickup: Float64Array
  f0: number
  length: number
  string: number
}

const STEEL_E = 2e11
const TOP_HZ = 12000

/** Seconds to fall 60 dB at the fundamental: longer on the heavy wound strings, less fretted. */
export function sustainOf(fretting: Fretting): number {
  const string = STRINGS[fretting.string] as GuitarString
  const open = string.wound ? 11 : 7
  return open * 0.93 ** Math.min(12, fretting.fret / 2)
}

/**
 * The modes of a note: a stiff string (B from its steel core), picked near the bridge (a
 * triangle released: the k-th mode set moving by sin(k pi b) / k^2), heard by a pickup that
 * senses velocity over its width (sin at its place, a sinc for its width, times the frequency).
 * The upper partials die faster: the string's air and internal losses, the fret and the finger.
 */
export function modesOf(
  pitch: number,
  sampleRate: number,
  fretting: Fretting = fretFor(pitch),
): GuitarModes {
  const string = STRINGS[fretting.string] as GuitarString
  const f0 = 440 * 2 ** ((pitch - 69) / 12)
  const b =
    (Math.PI ** 3 * STEEL_E * string.core ** 4) / (64 * string.tension * fretting.length ** 2)
  const pick = PICK_AT / fretting.length
  const place = PICKUP_AT / fretting.length
  const width = PICKUP_WIDTH / fretting.length
  const own = 6.9078 / sustainOf(fretting)
  const loss = string.wound ? 2.4e-6 : 1.5e-6
  const top = Math.min(TOP_HZ, sampleRate * 0.45)
  const rows: [number, number, number, number][] = []
  for (let k = 1; k < 200; k++) {
    const f = f0 * k * Math.sqrt((1 + b * k * k) / (1 + b))
    if (f > top) break
    const aperture = Math.abs(Math.sin(k * Math.PI * width)) / (k * Math.PI * width)
    rows.push([
      2 * Math.PI * f,
      own + loss * (f * f - f0 * f0) + 0.9e-3 * (f - f0),
      Math.sin(k * Math.PI * pick) / (k * k),
      Math.sin(k * Math.PI * place) * aperture * k,
    ])
  }
  const count = rows.length
  const modes: GuitarModes = {
    count,
    omega: new Float64Array(count),
    decay: new Float64Array(count),
    pluck: new Float64Array(count),
    pickup: new Float64Array(count),
    f0,
    length: fretting.length,
    string: fretting.string,
  }
  rows.forEach(([w, d, p, u], i) => {
    modes.omega[i] = w
    modes.decay[i] = d
    modes.pluck[i] = p
    modes.pickup[i] = u
  })
  return modes
}
