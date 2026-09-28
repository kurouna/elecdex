/**
 * The piano's strings, key by key (docs/plugins.md section 13.8): what a physical model needs
 * to know of each - how long and how taut its strings are, how stiff, how many to a note and
 * how far apart in tune, what hammer strikes them and where - and, from that, the partials the
 * engine sounds.
 *
 * Nothing here is measured from a recording. The figures are the textbook shape of a concert
 * grand (string lengths, tensions, hammer masses, decay times), written as smooth curves over
 * the keyboard, and the sound follows from the physics:
 *
 * - A stiff string's partials are stretched: f_n = n f0 sqrt(1 + B n^2), the inharmonicity
 *   that is much of what makes a piano sound like one.
 * - The strings of one note are coupled through the bridge (Weinreich): the partial of each
 *   string is a pole i*w - sigma, and the bridge adds -eta to every entry, so the strings
 *   moving together lose their energy to the soundboard quickly (the prompt sound) and those
 *   moving against each other keep it (the aftersound). The eigenvalues of that small complex
 *   symmetric matrix are the note's modes: its beating and its two-stage decay.
 * - The felt of the hammer stiffens as it is squeezed (F = K d^p), so a harder blow is a
 *   shorter one, and brighter - the piano's change of colour with loudness is not a filter.
 *
 * Pure, and free of the page and of Web Audio, so the audio thread, the tests and a script
 * that writes WAV files run the same code.
 */

export const LOW_KEY = 21
export const HIGH_KEY = 108
/** Keys from here up have no dampers, as on a real piano: they ring on after release. */
export const FIRST_UNDAMPED = 89

/** Tension of every string, in newtons: a grand's strings sit around 700-900 N. */
const TENSION = 760
/** The highest partial frequency sounded, well below the ear's limit and any sample rate's. */
const TOP_PARTIAL_HZ = 14000
/** Partials to a string at most: the bass's hundreds beyond this add little but cost. */
const MAX_PARTIALS = 96
/** The hammer speed a level of 0 and of 1 stand for, in m/s: ppp to fff. */
const SLOWEST_BLOW = 0.35
const FASTEST_BLOW = 6.5
/** The blow at which the felt is calibrated, m/s (a mezzo-forte). */
const REFERENCE_BLOW = 2

export interface Hammer {
  /** kg */
  mass: number
  /** The felt's stiffness: F = stiffness * compression^exponent. */
  stiffness: number
  exponent: number
  /** Hunt-Crossley loss, s/m: the felt gives back less than it takes. */
  loss: number
  /** Seconds a mezzo-forte blow would touch a rigid string: how finely the contact is stepped. */
  contact: number
}

/**
 * One key's modes, flattened: each is a decaying phasor y' = lambda*y + gain*F whose
 * imaginary part is a displacement. Weights turn the phasors into the string's displacement
 * under the hammer (for the contact) and the force on the bridge (the sound).
 */
export interface KeyModel {
  pitch: number
  f0: number
  strings: number
  /** Modes in order of their partial, so the lowest are kept longest when culled. */
  count: number
  /** The pole, per second: real part (negative, the decay) and imaginary (rad/s). */
  decay: Float64Array
  omega: Float64Array
  /** What a newton of hammer force adds per second, as a complex number. */
  gainRe: Float64Array
  gainIm: Float64Array
  /** The mode's share of the string's displacement where the hammer strikes. */
  hammerWeight: Float64Array
  /** The mode's share of the force on the bridge. */
  bridgeWeight: Float64Array
  hammer: Hammer
  dampered: boolean
  longitudinal: Longitudinal
}

/**
 * The string stretching as it bends (Conklin, Bank): the tension rises with the square of the
 * slope, so the bridge is pushed along the string by EA/(2T^2) times the square of the
 * transverse force. That square holds the sums of every pair of partials - the phantom
 * partials - and rings the string's own longitudinal modes, far above its fundamental: the
 * metallic clang of a hard blow in the bass, and nothing at all of a soft one.
 */
export interface Longitudinal {
  /** Newtons along the string for a newton squared across it, on each string. */
  force: number
  /** The first longitudinal mode, Hz. */
  freq: number
}

/** Steel: Young's modulus (Pa) and density (kg/m^3). */
const STEEL_E = 2e11
const STEEL_DENSITY = 7850
/** How much of the push along the string the soundboard takes up: it moves mostly across. */
const LONGITUDINAL_COUPLING = 0.03

/**
 * The wire's steel: plain strings are all steel; the bass's are a steel core wound with copper,
 * which adds mass but no stiffness, so their longitudinal modes fall to a few hundred hertz.
 */
export function longitudinalOf(pitch: number): Longitudinal {
  const key = clampKey(pitch)
  const length = lengthOf(key)
  const density = TENSION / (2 * length * fundamental(key)) ** 2
  const core =
    key >= 45 ? density / STEEL_DENSITY : Math.PI * ((1.6e-3 - (0.5e-3 * (key - 21)) / 24) / 2) ** 2
  const stiffness = STEEL_E * core
  return {
    force: ((stiffness / (2 * TENSION * TENSION)) * LONGITUDINAL_COUPLING) / stringsOf(key),
    freq: Math.sqrt(stiffness / density) / (2 * length),
  }
}

/** A curve over the keyboard, through points given as [key, value], interpolated in log. */
function logCurve(key: number, points: readonly (readonly [number, number])[]): number {
  const first = points[0] as readonly [number, number]
  const last = points[points.length - 1] as readonly [number, number]
  if (key <= first[0]) return first[1]
  if (key >= last[0]) return last[1]
  for (let i = 1; i < points.length; i++) {
    const [k1, v1] = points[i] as readonly [number, number]
    const [k0, v0] = points[i - 1] as readonly [number, number]
    if (key <= k1) return v0 * (v1 / v0) ** ((key - k0) / (k1 - k0))
  }
  return last[1]
}

const clampKey = (pitch: number) => Math.min(HIGH_KEY, Math.max(LOW_KEY, pitch))

/**
 * Stretched tuning, in cents: a piano is tuned so its octaves agree with its own stretched
 * partials, a little flat in the bass and sharp in the treble (Railsback). Negligible in the
 * middle, where a plugin's other voices play.
 */
export function stretchCents(pitch: number): number {
  const octaves = (pitch - 69) / 12
  return octaves >= 0 ? 2.2 * octaves ** 2 : -1.1 * octaves ** 2
}

/** The sounding fundamental of a key, stretch included. */
export function fundamental(pitch: number): number {
  return 440 * 2 ** ((pitch - 69) / 12 + stretchCents(clampKey(pitch)) / 1200)
}

/** Single wound strings in the lowest octave, pairs above, then three to a note. */
export function stringsOf(pitch: number): number {
  const key = clampKey(pitch)
  if (key <= 30) return 1
  return key <= 48 ? 2 : 3
}

/** Speaking length, in metres: halving each octave in the treble, foreshortened in the bass. */
export function lengthOf(pitch: number): number {
  const key = clampKey(pitch)
  const at48 = 0.052 * 2 ** ((0.88 * (HIGH_KEY - 48)) / 12)
  if (key >= 48) return 0.052 * 2 ** ((0.88 * (HIGH_KEY - key)) / 12)
  return at48 * 2 ** ((0.35 * (48 - key)) / 12)
}

/**
 * The inharmonicity coefficient B: smallest in the tenor, rising steeply to the short, thick
 * treble strings and a little in the wound bass (Young, Conklin).
 */
export function inharmonicity(pitch: number): number {
  return logCurve(clampKey(pitch), [
    [21, 3.5e-4],
    [36, 1.4e-4],
    [48, 1.1e-4],
    [60, 3.2e-4],
    [72, 8e-4],
    [84, 2.4e-3],
    [96, 7e-3],
    [108, 2e-2],
  ])
}

/** Seconds to fall 60 dB for a string alone at its fundamental: the aftersound's pace. */
export function afterDecay(pitch: number): number {
  return logCurve(clampKey(pitch), [
    [21, 45],
    [48, 32],
    [60, 25],
    [72, 16],
    [84, 9],
    [96, 4],
    [108, 1.4],
  ])
}

/** Seconds to fall 60 dB for the strings moving together: the prompt sound's pace. */
export function promptDecay(pitch: number): number {
  return (
    afterDecay(pitch) /
    logCurve(clampKey(pitch), [
      [21, 3],
      [60, 3.5],
      [96, 2.5],
      [108, 1.5],
    ])
  )
}

/**
 * The strings' own losses grow with frequency (air and the wire's internal friction), so the
 * upper partials die first and a held note darkens; per second, added to the fundamental's.
 */
export function partialLoss(freq: number): number {
  return 9e-7 * freq * freq + 1.4e-3 * freq
}

/**
 * The voicing: a piano technician needles or hardens each hammer's felt until the scale is
 * even, since the physics alone leaves the short treble strings loud on the bridge (and our
 * soundboard radiating them the most) and the long bass ones soft. A gain per key, measured
 * so a mezzo-forte scale heard through the soundboard is even within a couple of decibels,
 * a little softer at both ends.
 */
export function voicing(pitch: number): number {
  return logCurve(clampKey(pitch), [
    [21, 2.11],
    [24, 2.04],
    [36, 1.24],
    [48, 1.135],
    [60, 1],
    [72, 1.12],
    [84, 0.496],
    [96, 0.3],
    [108, 0.93],
  ])
}

/** Seconds for the damper to silence a key: slower on the long, heavy bass strings. */
export function damperTime(pitch: number): number {
  return logCurve(clampKey(pitch), [
    [21, 0.55],
    [48, 0.3],
    [72, 0.16],
    [FIRST_UNDAMPED - 1, 0.1],
  ])
}

/** The decay a damper adds to a partial, per second: its felt grips the upper ones harder. */
export function damperDecay(pitch: number, omega: number): number {
  const f = omega / (2 * Math.PI)
  return (6.9078 / damperTime(pitch)) * Math.sqrt(0.35 + f / 1000)
}

/** Whether a key has a damper at all. */
export const hasDamper = (pitch: number) => clampKey(pitch) < FIRST_UNDAMPED

/** Where along the string the hammer strikes, as a fraction of its length. */
export function strikePoint(pitch: number): number {
  const key = clampKey(pitch)
  return key <= 80 ? 0.122 : 0.122 - (0.06 * (key - 80)) / (HIGH_KEY - 80)
}

/**
 * The hammer: heavy in the bass, light in the treble, its felt stiffer and more nonlinear up
 * the keyboard. The felt's stiffness is set so that a mezzo-forte blow on a rigid string
 * would last the contact time measured on real pianos; on the real, yielding string it lasts
 * a little longer, as it does.
 */
export function hammerOf(pitch: number): Hammer {
  const key = clampKey(pitch)
  const mass = 11e-3 * 2 ** (-(key - LOW_KEY) / 60)
  const exponent = 2.3 + (1.1 * (key - LOW_KEY)) / (HIGH_KEY - LOW_KEY)
  const contact = logCurve(key, [
    [21, 3.2e-3],
    [60, 1e-3],
    [108, 0.25e-3],
  ])
  // Rigid-string contact: t = 2 * dmax / v * I(p), dmax = ((p+1) m v^2 / (2K))^(1/(p+1)).
  const compression = (contact * REFERENCE_BLOW) / (2 * contactIntegral(exponent))
  const stiffness =
    ((exponent + 1) * mass * REFERENCE_BLOW ** 2) / (2 * compression ** (exponent + 1))
  return { mass, stiffness, exponent, loss: 0.25, contact }
}

/**
 * The integral from 0 to 1 of du / sqrt(1 - u^q), q = p + 1: a Beta function,
 * sqrt(pi) * Gamma(1 + 1/q) / Gamma(1/2 + 1/q).
 */
export function contactIntegral(exponent: number): number {
  const q = exponent + 1
  return Math.sqrt(Math.PI) * Math.exp(logGamma(1 + 1 / q) - logGamma(0.5 + 1 / q))
}

const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905,
  -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7,
]

/** ln Gamma(x) for x > 0 (Lanczos, g = 7): good to about fifteen digits. */
function logGamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  const z = x - 1
  let a = 0.9999999999998099
  LANCZOS.forEach((c, i) => {
    a += c / (z + i + 1)
  })
  const t = z + 7.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a)
}

/** The hammer's speed for a note's level: a level is heard as loudness, so exponential. */
export function blowSpeed(level: number): number {
  const l = Math.min(1, Math.max(0, level))
  return SLOWEST_BLOW * (FASTEST_BLOW / SLOWEST_BLOW) ** l
}

/** A small repeatable generator: every piano has the same slightly imperfect unisons. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * How the strings of a unison are tuned against each other, in cents: a tuner leaves them
 * within about a cent, never exactly together - which is what the aftersound needs.
 */
export function unisonCents(pitch: number): number[] {
  const n = stringsOf(pitch)
  if (n === 1) return [0]
  const random = seeded(pitch * 7919 + 17)
  const spread = 0.15 + random() * 0.45
  const cents =
    n === 2 ? [-spread / 2, spread / 2] : [-spread / 2, (random() - 0.5) * 0.4 * spread, spread / 2]
  return cents.map((c) => c + (random() - 0.5) * 0.15)
}

// Complex numbers as [re, im].
type C = [number, number]
const add = (a: C, b: C): C => [a[0] + b[0], a[1] + b[1]]
const sub = (a: C, b: C): C => [a[0] - b[0], a[1] - b[1]]
const mul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]
function div(a: C, b: C): C {
  const d = b[0] * b[0] + b[1] * b[1]
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]
}
function sqrtC(a: C): C {
  const r = Math.hypot(a[0], a[1])
  const re = Math.sqrt((r + a[0]) / 2)
  const im = Math.sqrt(Math.max(0, (r - a[0]) / 2))
  return [re, a[1] < 0 ? -im : im]
}

/**
 * The modes of N coupled strings: the eigenvalues of D - eta*J (D the strings' own poles, J
 * all ones), found as the roots of det = 0 by Durand-Kerner, with the eigenvectors
 * (D - lambda)^-1 * 1 normalised so v^T v = 1 (the matrix is complex symmetric, so they are
 * their own left eigenvectors). Poles are taken about their mean, where they differ by a few
 * rad/s, not about zero, where they differ in the ninth digit.
 */
export function coupledModes(poles: readonly C[], eta: C): { lambda: C; vector: C[] }[] {
  const n = poles.length
  const centre: C = [
    poles.reduce((s, p) => s + p[0], 0) / n,
    poles.reduce((s, p) => s + p[1], 0) / n,
  ]
  const d = poles.map((p) => sub(p, centre))
  const scale = Math.max(Math.hypot(eta[0], eta[1]), ...d.map((x) => Math.hypot(x[0], x[1])), 1e-9)
  const roots = durandKerner(d, eta, scale)
  return roots.map((lam) => {
    let v = d.map((di) => {
      const gap = sub(di, lam)
      // A string exactly at an eigenvalue carries the mode alone.
      return Math.hypot(gap[0], gap[1]) < scale * 1e-12 ? ([1e12, 0] as C) : div([1, 0], gap)
    })
    let norm: C = [0, 0]
    for (const x of v) norm = add(norm, mul(x, x))
    const root = sqrtC(norm)
    v = v.map((x) => div(x, root))
    return { lambda: add(lam, centre), vector: v }
  })
}

/**
 * A string moves up and down (towards the soundboard, which the hammer strikes) and a little
 * from side to side (Weinreich). The bridge yields little sideways, so that motion keeps its
 * energy and radiates weakly: a second, slow and quiet decay under the first - the
 * aftersound even of a single bass string.
 */
const POLARISATIONS = [
  { vertical: true, excited: 1, coupling: 1, radiates: 1 },
  { vertical: false, excited: 0.3, coupling: 0.08, radiates: 0.45 },
] as const

/**
 * The roots of det(D - eta*J - lambda) / (-1)^n = prod(lambda - d_i) + eta * sum_i
 * prod_{k != i}(lambda - d_k), all at once (Durand-Kerner), in plain numbers: a key's model is
 * built on the audio thread, where a few hundred of these must not allocate their way into a
 * dropout.
 */
function durandKerner(d: readonly C[], eta: C, scale: number): C[] {
  const n = d.length
  const dr = Float64Array.from(d, (x) => x[0])
  const di = Float64Array.from(d, (x) => x[1])
  const rr = new Float64Array(n)
  const ri = new Float64Array(n)
  for (let j = 0; j < n; j++) {
    rr[j] = (dr[j] as number) + scale * 0.3 * Math.cos(j + 0.4)
    ri[j] = (di[j] as number) + scale * 0.3 * Math.sin(j + 0.4)
  }
  const f = new Float64Array(2)
  const q = new Float64Array(2)
  for (let iter = 0; iter < 100; iter++) {
    let moved = 0
    for (let j = 0; j < n; j++) {
      const xr = rr[j] as number
      const xi = ri[j] as number
      characteristic(dr, di, eta, xr, xi, f)
      // The product of the gaps from this root to the others.
      productOf(rr, ri, j, xr, xi, q)
      const [fr, fi, qr, qi] = [f[0] as number, f[1] as number, q[0] as number, q[1] as number]
      const size = qr * qr + qi * qi
      const stepR = (fr * qr + fi * qi) / size
      const stepI = (fi * qr - fr * qi) / size
      rr[j] = xr - stepR
      ri[j] = xi - stepI
      moved = Math.max(moved, Math.abs(stepR) + Math.abs(stepI))
    }
    if (moved < scale * 1e-12) break
  }
  return Array.from({ length: n }, (_, j): C => [rr[j] as number, ri[j] as number])
}

/** Writes into `out` the product of (x - a_k) over every k but `skip` (-1 skips none). */
function productOf(
  ar: Float64Array,
  ai: Float64Array,
  skip: number,
  xr: number,
  xi: number,
  out: Float64Array,
): void {
  let pr = 1
  let pi = 0
  for (let k = 0; k < ar.length; k++) {
    if (k === skip) continue
    const gr = xr - (ar[k] as number)
    const gi = xi - (ai[k] as number)
    const t = pr * gr - pi * gi
    pi = pr * gi + pi * gr
    pr = t
  }
  out[0] = pr
  out[1] = pi
}

const leftOut = new Float64Array(2)

/** Writes into `out` prod(x - d_i) + eta * sum_i prod_{k != i}(x - d_k). */
function characteristic(
  dr: Float64Array,
  di: Float64Array,
  eta: C,
  xr: number,
  xi: number,
  out: Float64Array,
): void {
  let sr = 0
  let si = 0
  for (let i = 0; i < dr.length; i++) {
    productOf(dr, di, i, xr, xi, leftOut)
    sr += leftOut[0] as number
    si += leftOut[1] as number
  }
  productOf(dr, di, -1, xr, xi, out)
  out[0] = (out[0] as number) + eta[0] * sr - eta[1] * si
  out[1] = (out[1] as number) + eta[0] * si + eta[1] * sr
}

const cache = new Map<string, KeyModel>()

/** Whether a key's model at a sample rate has been made already. */
export const modelMade = (pitch: number, sampleRate: number) => cache.has(`${pitch}:${sampleRate}`)

/** A key's model at a sample rate (partials near Nyquist are left out). Cached. */
export function keyModel(pitch: number, sampleRate: number): KeyModel {
  const id = `${pitch}:${sampleRate}`
  let model = cache.get(id)
  if (model === undefined) {
    model = buildKey(pitch, sampleRate)
    cache.set(id, model)
  }
  return model
}

interface ModeRow {
  decay: number
  omega: number
  gain: C
  hammerWeight: number
  bridgeWeight: number
}

function buildKey(pitch: number, sampleRate: number): KeyModel {
  const f0 = fundamental(pitch)
  const n = stringsOf(pitch)
  const length = lengthOf(pitch)
  const density = TENSION / (2 * length * f0) ** 2
  const modalMass = (density * length) / 2
  const b = inharmonicity(pitch)
  const beta = strikePoint(pitch)
  const cents = unisonCents(pitch)
  const random = seeded(pitch * 104729 + 3)
  // The hammer never meets the strings of a unison quite evenly.
  const share = cents.map(() => 1 + (random() - 0.5) * 0.08)
  const ownDecay = 6.9078 / afterDecay(pitch)
  const coupling = (6.9078 / promptDecay(pitch) - ownDecay) / n
  const top = Math.min(TOP_PARTIAL_HZ, sampleRate * 0.45)
  // The horizontal polarisation's strings sit a hair apart from the vertical's.
  const sideways = cents.map((c) => c + 0.1 + random() * 0.25)
  const rows: ModeRow[] = []
  for (let k = 1; k <= MAX_PARTIALS; k++) {
    const fk = f0 * k * Math.sqrt((1 + b * k * k) / (1 + b))
    if (fk > top) break
    const phi = Math.sin(k * Math.PI * beta)
    const sigma = ownDecay + partialLoss(fk) - partialLoss(f0)
    const bridge = (TENSION * k * Math.PI) / length
    for (const p of POLARISATIONS) {
      const poles = (p.vertical ? cents : sideways).map(
        (c): C => [-sigma, 2 * Math.PI * fk * 2 ** (c / 1200)],
      )
      const eta: C = [coupling * p.coupling, 0.15 * coupling * p.coupling]
      for (const { lambda, vector } of coupledModes(poles, eta)) {
        // Force on the unison enters as v^T u, and the strings' sum leaves as 1^T v.
        let enters: C = [0, 0]
        let leaves: C = [0, 0]
        vector.forEach((x, i) => {
          enters = add(enters, [x[0] * (share[i] as number), x[1] * (share[i] as number)])
          leaves = add(leaves, x)
        })
        const unit = (p.excited * phi) / (n * modalMass * lambda[1])
        rows.push({
          decay: lambda[0],
          omega: lambda[1],
          gain: mul(mul(leaves, enters), [unit, 0]),
          // The hammer moves, and feels, the vertical only.
          hammerWeight: p.vertical ? phi / n : 0,
          bridgeWeight: bridge * p.radiates,
        })
      }
    }
  }
  rows.sort((x, y) => x.omega - y.omega)
  const count = rows.length
  const model: KeyModel = {
    pitch,
    f0,
    strings: n,
    count,
    decay: new Float64Array(count),
    omega: new Float64Array(count),
    gainRe: new Float64Array(count),
    gainIm: new Float64Array(count),
    hammerWeight: new Float64Array(count),
    bridgeWeight: new Float64Array(count),
    hammer: hammerOf(pitch),
    dampered: hasDamper(pitch),
    longitudinal: longitudinalOf(pitch),
  }
  rows.forEach((row, i) => {
    model.decay[i] = row.decay
    model.omega[i] = row.omega
    model.gainRe[i] = row.gain[0]
    model.gainIm[i] = row.gain[1]
    model.hammerWeight[i] = row.hammerWeight
    model.bridgeWeight[i] = row.bridgeWeight
  })
  return model
}
