// RIVET, ELECDRILL's driller (docs/elec16-elecdrill.md section 6): a small miner in an orange
// suit and a round helmet with a lamp, a drill held in both hands. Drawn from a pose - how
// high the body sits, how squashed, where the feet and the drill are, the face - so every
// frame is the same character. 16 points square, facing right (the game flips it for left).
//
// Palette `driller`: 1 outline, 2-4 the suit dark to light, 5-6 skin, 7-8 visor, 9 white,
// 10-11 boots, 12-13 the drill, 14 the lamp, 15 red.
import { Canvas, each } from '../eleclance/draw.mjs'

const POSE = {
  bob: 0, // the body up (negative) or down
  squash: 0, // 1 flattened, -1 stretched
  feet: [0, 0], // each foot's x offset
  lift: [0, 0], // each foot raised
  drill: 'side', // side, down, up, high (held up in joy), none
  spin: 0, // the drill's stripes
  face: 'open', // open, blink, shut, x, gasp, joy, front
  blue: false, // out of air: the face goes pale blue
  arms: 'hold', // hold, up, flail
}

/** A frame from a pose (fields as POSE). */
export function driller(p) {
  const pose = { ...POSE, ...p }
  const c = new Canvas(16, 16)
  const sq = pose.squash
  // Heights: the head's middle and the body's top, squashed down or stretched up.
  const headY = 5.5 + pose.bob + sq * 2.5
  const bodyTop = 9 + pose.bob + sq * 1.5
  boots(c, pose)
  suit(c, bodyTop, 6 + sq)
  const brim = Math.round(headY - 0.5)
  head(c, pose, headY, brim)
  face(c, pose, brim)
  arms(c, pose, Math.round(bodyTop + 1))
  c.outline(1)
  return c
}

function boots(c, pose) {
  for (const k of [0, 1]) {
    const x = (k === 0 ? 4 : 8) + pose.feet[k]
    const y = 14 - pose.lift[k]
    c.rect(x, y, 3, 2, 10)
    c.set(x + 1, y, 11)
    c.set(x + 2, y, 11)
  }
}

/** The suit: a round body `bw` wide with a lighter front, a belt and its buckle. */
function suit(c, bodyTop, bw) {
  const x0 = Math.round(7.5 - bw / 2)
  const x1 = Math.round(7.5 + bw / 2)
  for (let y = Math.round(bodyTop); y <= 13; y++) {
    for (let x = x0; x < x1; x++) c.set(x, y, x === x0 || x === x1 - 1 ? 2 : x > 7 ? 4 : 3)
  }
  c.rect(x0, 12, x1 - x0, 1, 10)
  c.set(Math.round(7.5), 12, 14)
}

/** The head: the helmet lit from the top left above its dark brim, skin below, the lamp. */
function head(c, pose, headY, brim) {
  const sq = pose.squash
  const skin = pose.blue ? 8 : 5
  const shade = pose.blue ? 7 : 6
  c.ellipse(7.5, headY, 4.6 + sq * 0.8, 4.4 - sq * 0.9, (nx, ny, _nz, _x, y) => {
    if (y < brim) return nx + ny < -0.7 ? 4 : nx > 0.45 ? 2 : 3
    return nx > 0.55 || ny > 0.75 ? shade : skin
  })
  for (let x = 2; x < 14; x++) if (c.get(x, brim) !== 0) c.set(x, brim, 2)
  const lamp =
    pose.face === 'front'
      ? [
          [7, -3, 14],
          [8, -3, 14],
          [7, -4, 9],
        ]
      : [
          [11, -2, 14],
          [12, -2, 14],
          [11, -3, 9],
          [12, -1, 2],
        ]
  for (const [x, dy, k] of lamp) c.set(x, brim + dy, k)
}

/** Each eye's points for a face, from the eye's top: [dx, dy, colour]. */
const EYES = {
  open: [
    [0, 0, 9],
    [0, 1, 1],
    [0, 2, 1],
  ],
  blink: [[0, 1, 1]],
  shut: [
    [0, 1, 1],
    [-1, 1, 1],
  ],
  x: [
    [-1, -1, 1],
    [1, -1, 1],
    [0, 0, 1],
    [-1, 1, 1],
    [1, 1, 1],
  ],
  joy: [
    [-1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
}

/** The mouth for a face, from below the eyes: [dx, dy, colour]. */
const MOUTHS = {
  gasp: [
    [0, 3, 1],
    [0, 4, 1],
  ],
  joy: [
    [-1, 3, 15],
    [0, 3, 15],
  ],
}

function face(c, pose, brim) {
  const ey = brim + 2
  const front = pose.face === 'front'
  // Facing right the near eye is at 8, the far one at 11; facing us, 5 and 9.
  const eye = EYES[pose.face] ?? EYES.open
  for (const ex of front ? [5, 9] : [8, 11]) {
    for (const [dx, dy, k] of eye) c.set(ex + dx, ey + dy, k)
  }
  if (!pose.blue) blush(c, front ? [4, 10] : [9, 12], ey + 3)
  const mx = front ? 7 : 11
  for (const [dx, dy, k] of MOUTHS[pose.face] ?? []) c.set(mx + dx, ey + dy, k)
}

/** A blush under the eyes, on the face only. */
function blush(c, xs, y) {
  for (const x of xs) if (c.get(x, y) !== 0) c.set(x, y, 6)
}

/** Hands up (in fright, or holding the drill high in joy) or flailing. */
const HANDS = {
  up: [
    [3, -2, 5],
    [12, -2, 5],
    [3, -1, 3],
    [3, 0, 3],
    [12, -1, 3],
    [12, 0, 3],
  ],
  flail: [
    [2, 0, 5],
    [13, -1, 5],
    [3, 0, 3],
    [12, 0, 3],
  ],
}

/** The arms and the drill: a steel cone with stripes that turn, in both hands. */
function arms(c, pose, y) {
  if (pose.drill === 'side') {
    c.rect(7, y, 4, 2, 11)
    c.set(8, y, 5)
    cone(c, 11, y - 1, 'right', pose.spin)
    return
  }
  if (pose.drill === 'down') {
    c.rect(6, y + 1, 4, 2, 11)
    cone(c, 6, 13, 'down', pose.spin)
    return
  }
  if (pose.drill === 'up') {
    c.rect(9, y - 3, 2, 4, 11)
    cone(c, 8, 0, 'up', pose.spin)
    return
  }
  const hands = pose.drill === 'high' ? HANDS.up : HANDS[pose.arms]
  for (const [x, dy, k] of hands ?? []) c.set(x, y + dy, k)
}

/** A drill's cone from (x, y): five points long, five across at its base, its stripes turning. */
function cone(c, x, y, way, spin) {
  const half = [2, 2, 1, 1, 0]
  const at = {
    right: (k, w) => [x + k, y + 1 + w],
    down: (k, w) => [x + 1 + w, y - 2 + k],
    up: (k, w) => [x + 1 + w, y + 4 - k],
  }[way]
  for (let k = 0; k < 5; k++) {
    for (let w = -half[k]; w <= half[k]; w++) {
      const [px, py] = at(k, w)
      c.set(px, py, (k + w + spin) % 3 === 0 || w > 0 ? 12 : 13)
    }
  }
}

/** The frames in the sheet's order; the game names them by these numbers (player.e16.ts). */
export function drillerFrames() {
  const f = (p) => driller(p)
  return [
    // 0-1 standing, a breath and a blink
    f({}),
    f({ bob: 0.5, face: 'blink' }),
    // 2-5 running
    f({ feet: [1, -1], lift: [0, 1], bob: -0.5 }),
    f({ feet: [0, 0], bob: 0 }),
    f({ feet: [-1, 1], lift: [1, 0], bob: -0.5 }),
    f({ feet: [0, 0], bob: 0.5 }),
    // 6-7 drilling to the side: the drill out, a shudder
    f({ drill: 'side', spin: 0, face: 'shut', bob: 0.5 }),
    f({ drill: 'side', spin: 1, face: 'shut', feet: [-1, 0] }),
    // 8-9 drilling down
    f({ drill: 'down', spin: 0, bob: -1, face: 'shut' }),
    f({ drill: 'down', spin: 1, bob: -0.5, face: 'shut' }),
    // 10-11 drilling up
    f({ drill: 'up', spin: 0, face: 'open' }),
    f({ drill: 'up', spin: 1, bob: 0.5, face: 'shut' }),
    // 12 falling, 13 landing
    f({ drill: 'none', arms: 'up', bob: -1, lift: [1, 1], face: 'gasp' }),
    f({ drill: 'side', squash: 1, face: 'shut' }),
    // 14-15 climbing a step
    f({ drill: 'none', arms: 'up', bob: -2, lift: [2, 0], feet: [1, 0] }),
    f({ drill: 'none', arms: 'up', bob: -1, lift: [0, 2], feet: [0, 1] }),
    // 16-17 crushed flat
    f({ drill: 'none', squash: 2, bob: 3, face: 'x' }),
    f({ drill: 'none', squash: 2.4, bob: 3.5, face: 'x', arms: 'flail' }),
    // 18-20 out of air: gasping, pale, fallen
    f({ drill: 'none', arms: 'flail', face: 'gasp', blue: true }),
    f({ drill: 'none', arms: 'flail', face: 'gasp', blue: true, bob: 0.5, feet: [1, -1] }),
    f({ drill: 'none', face: 'x', blue: true, squash: 1, bob: 2 }),
    // 21-22 joy: a hop with the drill held high
    f({ drill: 'high', face: 'joy', bob: -2, lift: [2, 2] }),
    f({ drill: 'high', face: 'joy', bob: 0 }),
    // 23 facing us (the title, the results)
    f({ drill: 'none', face: 'front' }),
  ]
}

/**
 * The drill's bit as it bites, in the cell drilled (palette `fx`): right, down, up, two turns
 * each - a long steel cone, its spiral stripes turning, grit and sparks flying back.
 */
export function bitFrames() {
  const out = []
  for (const way of ['right', 'down', 'up']) {
    for (let spin = 0; spin < 2; spin++) out.push(turned(bitRight(spin), way))
  }
  return out
}

const SPARKS = [
  [
    [13, 5],
    [14, 10],
    [12, 2],
  ],
  [
    [14, 6],
    [13, 12],
    [15, 3],
  ],
]

/** The bit pointing right from x 0: twelve long, seven across at its root. */
function bitRight(spin) {
  const r = new Canvas(16, 16)
  for (let k = 0; k < 12; k++) {
    const half = Math.round(3.4 * (1 - k / 12.5))
    for (let w = -half; w <= half; w++) r.set(k, 7 + w, bitShade(k, w, half, spin))
  }
  r.outline(7)
  for (const [a, b] of SPARKS[spin]) r.set(a, b, spin === 0 ? 5 : 4)
  return r
}

/** Steel lit from above, banded by its spiral, bright at the point. */
function bitShade(k, w, half, spin) {
  if (k === 11) return 9
  const v = w < -half / 2 ? 9 : w > half / 2 ? 7 : 8
  const band = Math.floor((k + w * 0.6 + spin * 1.5) / 1.5) % 2 === 0
  if (!band) return v
  return v === 9 ? 8 : 7
}

/** Right as it is; down is right turned a quarter (x becomes y); up is down upside down. */
function turned(r, way) {
  if (way === 'right') return r
  const c = new Canvas(16, 16)
  each(16, 16, (x, y) => {
    const v = r.get(y, x)
    if (v !== 0) c.set(x, way === 'down' ? y : 15 - y, v)
  })
  return c
}
