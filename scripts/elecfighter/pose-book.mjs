#!/usr/bin/env node
/**
 * ELECFIGHTER's poses as a person would describe them: where the hips sit and turn, where each
 * foot and fist goes and which way the knees and elbows point. The two-bone solver (ik.mjs)
 * turns them into the joint rotations of poses.json, which the viewer, the mock and the art
 * script read. Edit a pose here and run this to write poses.json afresh:
 *
 *   node scripts/elecfighter/pose-book.mjs
 *
 * Model space (README.md): metres, Y up, the front +Z (towards the opponent, screen right), the
 * model's left +X (away from the camera: the far side). The ankle (the foot bone's head) of a
 * standing foot is 0.085 up. The stance leads with the near side - the right foot and fist
 * forward - so the chest turns from the camera and the body reads side-on; the light strikes
 * come from the lead side without turning, the heavy ones from the rear side, the body turning
 * through (their limbs drawn as near while they cross in front).
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { aim, reach, skeletonOf } from './ik.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SKEL = skeletonOf(join(HERE, 'models/human.gltf'))

/** The torso's parts that a pose turns directly. */
const TORSO = ['spine', 'chest', 'neck', 'head']
const ARM_R = ['upperarm_r', 'forearm_r', 'hand_r']
const ARM_L = ['upperarm_l', 'forearm_l', 'hand_l']
const LEG_R = ['thigh_r', 'shin_r', 'foot_r']
const LEG_L = ['thigh_l', 'shin_l', 'foot_l']

/**
 * A pose from its description: `hips` { t, r }, the torso's rotations, each foot
 * { at, knee (a point the knee turns towards), yaw, pitch, roll } and each fist
 * { at (the wrist), elbow, yaw, pitch, roll }; `near` lists far bones drawn as near.
 */
function solve(d) {
  const pose = { bones: { hips: { r: d.hips?.r ?? [0, 0, 0], t: d.hips?.t ?? [0, 0, 0] } } }
  for (const b of TORSO) if (d[b]) pose.bones[b] = { r: d[b] }
  const limb = (spec, [a, b, c], bend) => {
    if (!spec) return
    reach(SKEL, pose, a, b, c, spec.at, spec.knee ?? spec.elbow, bend)
    if (spec.yaw !== undefined || spec.pitch !== undefined || spec.roll !== undefined)
      aim(SKEL, pose, c, spec.yaw ?? 0, spec.pitch ?? 0, spec.roll ?? 0)
  }
  limb(d.R, LEG_R, 'back')
  limb(d.L, LEG_L, 'back')
  limb(d.rh, ARM_R, 'front')
  limb(d.lh, ARM_L, 'front')
  if (d.near) pose.near = d.near
  return pose
}

/** A copy of a description with parts replaced (one level deep). */
const vary = (d, parts) => {
  const out = { ...d }
  for (const [k, v] of Object.entries(parts))
    out[k] = v && !Array.isArray(v) ? { ...d[k], ...v } : v
  return out
}

/**
 * A picture between two descriptions, `t` of the way from `a` to `b`: every place, turn and
 * pole interpolated, the IK solving the limbs afresh (an in-between's joints stay on the body's
 * own lengths); far bones drawn as near as the nearer end has them.
 */
function blend(a, b, t) {
  const mix = (x, y) => {
    if (Array.isArray(x) || Array.isArray(y)) {
      const u = x ?? [0, 0, 0]
      const v = y ?? [0, 0, 0]
      return u.map((n, k) => n + ((v[k] ?? 0) - n) * t)
    }
    if (typeof x === 'number' || typeof y === 'number') return (x ?? 0) + ((y ?? 0) - (x ?? 0)) * t
    const out = {}
    for (const k of new Set([...Object.keys(x ?? {}), ...Object.keys(y ?? {})]))
      out[k] = mix(x?.[k], y?.[k])
    return out
  }
  const out = {}
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (k === 'near') continue
    out[k] = mix(a[k], b[k])
  }
  const near = t < 0.5 ? a.near : b.near
  if (near) out.near = near
  return out
}

// ---------- the stance ----------
const STAND = {
  hips: { t: [0, -0.1, 0.0], r: [4, 18, 0] },
  spine: [4, 4, 0],
  chest: [3, 6, 0],
  neck: [-4, -12, 0],
  head: [10, -14, 0],
  R: { at: [-0.07, 0.085, 0.25], knee: [-0.2, 0.5, 1.2], yaw: 10 },
  L: { at: [0.14, 0.085, -0.22], knee: [0.5, 0.5, 0.9], yaw: 50 },
  rh: { at: [-0.06, 1.3, 0.3], elbow: [-0.45, 0.9, 0.1] },
  lh: { at: [0.02, 1.36, 0.17], elbow: [0.35, 0.9, -0.1] },
}

const ARM_FAR = [...ARM_L, 'clavicle_l']
const LEG_FAR = [...LEG_L]

// ---------- the crouch: low, leaning in, the fists before the face ----------
const CROUCH = {
  hips: { t: [0, -0.58, -0.02], r: [34, 20, 0] },
  spine: [12, 4, 0],
  chest: [6, 6, 0],
  neck: [-24, -12, 0],
  head: [0, -14, 0],
  R: { at: [-0.08, 0.085, 0.3], knee: [-0.25, 0.6, 1.2], yaw: 10 },
  L: { at: [0.15, 0.1, -0.24], knee: [0.5, 0.6, 0.8], yaw: 40, pitch: 30 },
  rh: { at: [-0.07, 0.86, 0.36], elbow: [-0.45, 0.5, 0.1] },
  lh: { at: [0.02, 0.92, 0.22], elbow: [0.35, 0.5, 0.0] },
}

// ---------- in the air: knees up, fists up ----------
const TUCK = {
  hips: { t: [0, 0, 0], r: [10, 18, 0] },
  spine: [6, 4, 0],
  chest: [4, 6, 0],
  neck: [-6, -12, 0],
  head: [8, -14, 0],
  R: { at: [-0.08, 0.5, 0.26], knee: [-0.2, 1.0, 1.2], yaw: 10, pitch: 30 },
  L: { at: [0.14, 0.4, -0.12], knee: [0.4, 1.0, 1.0], yaw: 30, pitch: 50 },
  rh: { at: [-0.07, 1.36, 0.3], elbow: [-0.45, 0.9, 0.1] },
  lh: { at: [0.02, 1.4, 0.17], elbow: [0.35, 0.9, -0.1] },
}

/** A walk's step: the stance with the feet moved and the hips lifted a little. */
const step = (r, l, lift = 0) =>
  vary(STAND, {
    hips: { t: [0, -0.1 + lift, 0], r: [4, 18, 0] },
    R: { at: r, knee: [-0.2, 0.6, 1.2], yaw: 10 },
    L: { at: l, knee: [0.5, 0.6, 0.9], yaw: 50 },
  })

const BOOK = {
  // ---- standing, moving ----
  stand: STAND,
  // A breath: a centimetre lower, the fists a little down (shown in turn with the stand).
  idle: vary(STAND, {
    hips: { t: [0, -0.125, 0], r: [6, 18, 0] },
    rh: { at: [-0.06, 1.25, 0.31] },
    lh: { at: [0.02, 1.31, 0.18] },
  }),
  // The walk: a boxer's shuffle, the lead foot sliding out, the rear one following.
  walk1: step([-0.07, 0.085, 0.25], [0.14, 0.085, -0.22]),
  walk2: step([-0.07, 0.15, 0.34], [0.14, 0.085, -0.18], 0.01),
  walk3: step([-0.07, 0.085, 0.38], [0.14, 0.085, -0.26]),
  walk4: step([-0.07, 0.085, 0.26], [0.14, 0.15, -0.1], 0.01),
  // The dash: low and leaning in, the lead foot reaching.
  dash: vary(STAND, {
    hips: { t: [0, -0.16, 0.1], r: [16, 20, 0] },
    spine: [8, 4, 0],
    R: { at: [-0.08, 0.12, 0.46], knee: [-0.2, 0.6, 1.4], yaw: 10, pitch: -10 },
    L: { at: [0.14, 0.12, -0.32], knee: [0.5, 0.5, 0.9], yaw: 40, pitch: 40 },
  }),
  // The backdash: leaning away, both feet off the floor.
  backdash: vary(STAND, {
    hips: { t: [0, -0.06, -0.06], r: [-10, 18, 0] },
    spine: [-4, 4, 0],
    neck: [4, -12, 0],
    R: { at: [-0.07, 0.2, 0.2], knee: [-0.2, 0.8, 1.2], yaw: 10, pitch: 20 },
    L: { at: [0.14, 0.12, -0.3], knee: [0.5, 0.6, 0.9], yaw: 40, pitch: 10 },
  }),
  crouch: CROUCH,
  // The squat before a jump and after a landing.
  prejump: vary(STAND, {
    hips: { t: [0, -0.3, 0], r: [18, 18, 0] },
    spine: [8, 4, 0],
    R: { at: [-0.07, 0.085, 0.24], knee: [-0.2, 0.6, 1.4], yaw: 10 },
    L: { at: [0.14, 0.085, -0.2], knee: [0.5, 0.6, 0.9], yaw: 40 },
    rh: { at: [-0.08, 1.08, 0.3] },
    lh: { at: [0.02, 1.12, 0.17] },
  }),
  jump: TUCK,
  // Coming down: the legs reaching for the floor, the fists still up.
  fall: vary(TUCK, {
    hips: { t: [0, 0, 0], r: [4, 18, 0] },
    R: { at: [-0.08, 0.16, 0.2], knee: [-0.2, 0.8, 1.2], yaw: 10, pitch: 20 },
    L: { at: [0.14, 0.2, -0.2], knee: [0.4, 0.8, 1.0], yaw: 30, pitch: 30 },
  }),

  // ---- struck ----
  // Hit high: the head snapped back, the body bent back from the blow, the fists flung down.
  hit: vary(STAND, {
    hips: { t: [0, -0.1, -0.08], r: [-8, 18, 0] },
    spine: [-10, 0, 0],
    chest: [-10, 4, 0],
    neck: [-14, -6, 0],
    head: [-22, -10, 0],
    R: { at: [-0.07, 0.085, 0.28], knee: [-0.2, 0.5, 1.2], yaw: 10 },
    L: { at: [0.14, 0.085, -0.3], knee: [0.5, 0.5, 0.9], yaw: 50 },
    rh: { at: [-0.3, 1.0, 0.12], elbow: [-0.5, 1.2, -0.3] },
    lh: { at: [0.26, 1.08, -0.06], elbow: [0.5, 1.2, -0.3] },
  }),
  // Hit crouching: the crouch jolted upright and back.
  hitc: vary(CROUCH, {
    hips: { t: [0, -0.5, -0.06], r: [6, 20, 0] },
    spine: [-6, 4, 0],
    chest: [-8, 6, 0],
    neck: [-10, -12, 0],
    head: [-18, -14, 0],
    rh: { at: [-0.28, 0.82, 0.08], elbow: [-0.5, 1.0, -0.3] },
    lh: { at: [0.26, 0.88, -0.06], elbow: [0.5, 1.0, -0.3] },
  }),
  // Struck in the air: thrown back, legs forward, arms flung behind (and the KO's last picture).
  air: {
    hips: { t: [0, 0, 0], r: [-42, 18, 0] },
    spine: [-8, 0, 0],
    chest: [-8, 0, 0],
    neck: [-10, 0, 0],
    head: [-20, 0, 0],
    R: { at: [-0.08, 0.42, 0.52], knee: [-0.2, 1.4, 0.8], yaw: 10, pitch: -30 },
    L: { at: [0.12, 0.62, 0.4], knee: [0.3, 1.4, 0.6], yaw: 20, pitch: -10 },
    rh: { at: [-0.32, 1.46, -0.42], elbow: [-0.6, 1.6, 0.0] },
    lh: { at: [0.3, 1.36, -0.5], elbow: [0.6, 1.6, 0.0] },
  },
  // Down: on the back, the head away, the knees up a little.
  down: {
    hips: { t: [0, -0.8, -0.18], r: [-88, 10, 0] },
    spine: [-2, 0, 0],
    chest: [-2, 0, 0],
    neck: [6, 0, 0],
    head: [10, -30, 0],
    R: { at: [-0.1, 0.11, 0.62], knee: [-0.15, 0.9, 0.4], yaw: 10, pitch: -60 },
    L: { at: [0.12, 0.11, 0.7], knee: [0.2, 0.9, 0.4], yaw: 10, pitch: -60 },
    rh: { at: [-0.3, 0.09, -0.36], elbow: [-0.6, 0.2, -0.2] },
    lh: { at: [0.3, 0.09, -0.32], elbow: [0.6, 0.2, -0.2] },
  },
  // Waking: up on one knee, a hand on the floor.
  wake: vary(CROUCH, {
    hips: { t: [0, -0.52, -0.06], r: [32, 20, 0] },
    spine: [12, 4, 0],
    R: { at: [-0.08, 0.085, 0.32], knee: [-0.25, 0.6, 1.2], yaw: 10 },
    L: { at: [0.15, 0.1, -0.32], knee: [0.4, 0.0, 0.3], yaw: 30, pitch: 50 },
    rh: { at: [-0.16, 0.12, 0.42], elbow: [-0.6, 0.6, 0.2] },
    lh: { at: [0.04, 0.84, 0.2] },
  }),
  // The guard: both fists high before the face, elbows in, the head down behind them.
  guard: vary(STAND, {
    hips: { t: [0, -0.12, -0.04], r: [8, 20, 0] },
    neck: [6, -10, 0],
    head: [14, -12, 0],
    rh: { at: [-0.05, 1.42, 0.2], elbow: [-0.2, 1.0, 0.4] },
    lh: { at: [0.03, 1.45, 0.17], elbow: [0.15, 1.0, 0.4] },
  }),
  guardc: vary(CROUCH, {
    hips: { t: [0, -0.5, -0.06], r: [24, 20, 0] },
    neck: [-8, -10, 0],
    head: [10, -12, 0],
    rh: { at: [-0.05, 0.98, 0.22], elbow: [-0.2, 0.5, 0.4] },
    lh: { at: [0.03, 1.0, 0.18], elbow: [0.15, 0.5, 0.4] },
  }),
  // Held by a throw: doubled over, the arms hanging.
  thrown: vary(STAND, {
    hips: { t: [0, -0.12, -0.04], r: [30, 20, 0] },
    spine: [14, 4, 0],
    chest: [10, 4, 0],
    neck: [10, -10, 0],
    head: [10, -10, 0],
    rh: { at: [-0.2, 0.82, 0.32], elbow: [-0.6, 1.0, 0.0] },
    lh: { at: [0.18, 0.86, 0.26], elbow: [0.6, 1.0, 0.0] },
  }),
  // The round won: upright, the lead fist straight up.
  win: vary(STAND, {
    hips: { t: [0, -0.02, 0], r: [-2, 22, 0] },
    spine: [-2, 4, 0],
    chest: [-2, 6, 0],
    neck: [-4, -14, 0],
    head: [-10, -14, 0],
    R: { at: [-0.1, 0.085, 0.14], knee: [-0.2, 0.5, 1.2], yaw: 10 },
    L: { at: [0.14, 0.085, -0.12], knee: [0.5, 0.5, 0.9], yaw: 40 },
    rh: { at: [-0.16, 1.92, 0.12], elbow: [-0.6, 1.6, 0.0] },
    lh: { at: [0.2, 1.0, 0.06], elbow: [0.5, 1.2, -0.3] },
  }),

  // ---- standing strikes ----
  // The jab: the lead fist straight out at the chin's height, the shoulder behind it, no turn.
  lp0: vary(STAND, {
    hips: { t: [0, -0.1, 0.01], r: [5, 20, 0] },
    rh: { at: [-0.06, 1.28, 0.46], elbow: [-0.45, 1.0, 0.2] },
  }),
  lp: vary(STAND, {
    hips: { t: [0, -0.1, 0.03], r: [6, 22, 0] },
    chest: [4, 10, 0],
    rh: { at: [-0.06, 1.36, 0.66], elbow: [-0.4, 1.0, 0.3] },
  }),
  // The cross: wound up with the rear fist back, then driven far, the hips and chest turned
  // through, the weight forward on a bent lead knee, the rear heel up; then half back.
  hp0: vary(STAND, {
    hips: { t: [0, -0.13, -0.03], r: [6, 34, 0] },
    spine: [4, 8, 0],
    chest: [4, 10, 0],
    neck: [-4, -26, 0],
    head: [10, -24, 0],
    lh: { at: [0.16, 1.26, -0.06], elbow: [0.5, 1.0, -0.4] },
  }),
  hp: vary(STAND, {
    hips: { t: [0, -0.2, 0.16], r: [16, -26, 0] },
    spine: [10, -14, 0],
    chest: [8, -16, 0],
    neck: [-14, 22, 0],
    head: [2, 20, 0],
    R: { at: [-0.08, 0.085, 0.44], knee: [-0.2, 0.5, 1.6], yaw: 0 },
    L: { at: [0.12, 0.1, -0.34], knee: [0.4, 0.5, 1.0], yaw: 20, pitch: 30 },
    rh: { at: [-0.12, 1.12, 0.3], elbow: [-0.5, 0.7, 0.0] },
    lh: { at: [0.0, 1.3, 1.0], elbow: [0.5, 1.0, 0.4] },
    near: ARM_FAR,
  }),
  hp2: vary(STAND, {
    hips: { t: [0, -0.16, 0.1], r: [12, -10, 0] },
    spine: [8, -8, 0],
    chest: [6, -8, 0],
    neck: [-10, 12, 0],
    head: [4, 10, 0],
    R: { at: [-0.08, 0.085, 0.4], knee: [-0.2, 0.5, 1.6], yaw: 0 },
    L: { at: [0.12, 0.09, -0.3], knee: [0.4, 0.5, 1.0], yaw: 30, pitch: 15 },
    rh: { at: [-0.1, 1.18, 0.3], elbow: [-0.5, 0.7, 0.0] },
    lh: { at: [0.02, 1.24, 0.62], elbow: [0.5, 0.8, 0.0] },
    near: ARM_FAR,
  }),
  // The snap kick: the lead knee up, then the shin flicked out at the waist.
  lk0: vary(STAND, {
    hips: { t: [0, -0.08, -0.03], r: [0, 22, 0] },
    R: { at: [-0.06, 0.46, 0.3], knee: [-0.15, 1.0, 1.0], yaw: 0, pitch: 30 },
    L: { at: [0.1, 0.085, -0.14], knee: [0.4, 0.5, 0.9], yaw: 40 },
  }),
  lk: vary(STAND, {
    hips: { t: [0, -0.07, -0.04], r: [-6, 24, 0] },
    spine: [0, 2, 0],
    R: { at: [-0.06, 0.44, 0.68], knee: [-0.15, 1.0, 1.0], yaw: 0, pitch: 30 },
    L: { at: [0.1, 0.085, -0.12], knee: [0.4, 0.5, 0.9], yaw: 40 },
  }),
  // The roundhouse: the rear knee lifted as the body turns, the leg swung high and far, then
  // coming down.
  hk0: vary(STAND, {
    hips: { t: [0, -0.07, -0.02], r: [-4, -6, -4] },
    spine: [-2, -6, 0],
    neck: [0, 10, 0],
    head: [8, 8, 0],
    R: { at: [-0.05, 0.085, 0.02], knee: [-0.3, 0.5, 1.0], yaw: -10 },
    L: { at: [0.04, 0.62, 0.22], knee: [0.3, 1.4, 0.8], yaw: 0, pitch: 50 },
    near: LEG_FAR,
  }),
  // The kick lands with the leg straight out at the chest's height, the foot as far as it goes,
  // the body leaning back over the standing leg to give it the length.
  hk: vary(STAND, {
    hips: { t: [0, -0.08, 0.06], r: [-30, -40, -8] },
    spine: [-16, -10, 0],
    chest: [-12, -6, 0],
    neck: [16, 30, 0],
    head: [18, 24, 0],
    R: { at: [-0.04, 0.085, -0.1], knee: [-0.3, 0.5, 1.0], yaw: -40 },
    L: { at: [0.02, 1.34, 1.2], knee: [0.6, 1.8, 0.5], yaw: 0, pitch: 70 },
    rh: { at: [-0.34, 0.96, -0.3], elbow: [-0.6, 1.0, -0.1] },
    lh: { at: [0.1, 1.24, -0.08], elbow: [0.4, 0.9, -0.2] },
    near: LEG_FAR,
  }),
  hk2: vary(STAND, {
    hips: { t: [0, -0.06, -0.04], r: [-8, -26, -4] },
    spine: [-4, -8, 0],
    neck: [2, 22, 0],
    head: [8, 18, 0],
    R: { at: [-0.04, 0.085, 0.0], knee: [-0.3, 0.5, 1.0], yaw: -30 },
    L: { at: [0.06, 0.5, 0.46], knee: [0.4, 1.2, 0.6], yaw: 0, pitch: 40 },
    rh: { at: [-0.16, 1.16, 0.06], elbow: [-0.6, 1.0, 0.0] },
    near: LEG_FAR,
  }),

  // ---- crouching strikes ----
  clp0: vary(CROUCH, { rh: { at: [-0.06, 0.84, 0.48] } }),
  clp: vary(CROUCH, {
    hips: { t: [0, -0.5, 0.0], r: [26, 22, 0] },
    rh: { at: [-0.05, 0.8, 0.72], elbow: [-0.45, 0.5, 0.2] },
  }),
  // The anti-air: the rear fist driven straight up from the crouch, the body rising with it.
  chp0: vary(CROUCH, {
    hips: { t: [0, -0.52, -0.02], r: [30, 30, 0] },
    lh: { at: [0.1, 0.56, 0.04], elbow: [0.5, 0.4, -0.3] },
  }),
  chp: vary(CROUCH, {
    hips: { t: [0, -0.3, 0.06], r: [6, -20, 0] },
    spine: [-2, -8, 0],
    chest: [-4, -10, 0],
    neck: [-6, 16, 0],
    head: [-4, 14, 0],
    R: { at: [-0.08, 0.085, 0.34], knee: [-0.25, 0.6, 1.4], yaw: 0 },
    L: { at: [0.14, 0.12, -0.26], knee: [0.4, 0.6, 0.9], yaw: 30, pitch: 40 },
    rh: { at: [-0.14, 0.98, 0.18], elbow: [-0.5, 0.6, 0.0] },
    lh: { at: [0.0, 1.66, 0.36], elbow: [0.5, 1.2, 0.0] },
    near: ARM_FAR,
  }),
  chp2: vary(CROUCH, {
    hips: { t: [0, -0.4, 0.02], r: [16, -6, 0] },
    spine: [4, -4, 0],
    neck: [-10, 6, 0],
    head: [0, 6, 0],
    lh: { at: [0.02, 1.26, 0.42], elbow: [0.5, 0.8, 0.0] },
    near: ARM_FAR,
  }),
  // The low kick: the lead foot slid out along the floor.
  clk0: vary(CROUCH, {
    R: { at: [-0.08, 0.12, 0.46], knee: [-0.25, 0.6, 1.2], yaw: 0, pitch: 10 },
  }),
  clk: vary(CROUCH, {
    hips: { t: [0, -0.52, -0.06], r: [30, 22, 0] },
    R: { at: [-0.06, 0.1, 0.72], knee: [-0.2, 0.6, 1.0], yaw: 0, pitch: 0 },
  }),
  // The sweep: down on a hand, the rear leg swung long and low through the front.
  chk0: vary(CROUCH, {
    hips: { t: [0, -0.56, 0.0], r: [34, -10, 0] },
    neck: [-20, 10, 0],
    head: [0, 10, 0],
    rh: { at: [-0.16, 0.12, 0.36], elbow: [-0.5, 0.6, 0.2] },
    L: { at: [0.14, 0.1, -0.06], knee: [0.4, 0.6, 0.6], yaw: 30, pitch: 40 },
  }),
  chk: vary(CROUCH, {
    hips: { t: [0, -0.6, -0.04], r: [34, -36, -6] },
    spine: [6, -6, 0],
    chest: [4, -6, 0],
    neck: [-20, 24, 0],
    head: [0, 20, 0],
    R: { at: [-0.12, 0.085, 0.12], knee: [-0.5, 0.6, 1.0], yaw: -20 },
    L: { at: [-0.02, 0.1, 0.88], knee: [0.3, 0.6, 0.6], yaw: 0, pitch: 20 },
    rh: { at: [-0.22, 0.12, 0.28], elbow: [-0.6, 0.6, 0.2] },
    lh: { at: [0.14, 0.8, 0.0], elbow: [0.5, 0.6, -0.2] },
    near: LEG_FAR,
  }),
  chk2: vary(CROUCH, {
    hips: { t: [0, -0.56, -0.02], r: [30, -16, -4] },
    neck: [-20, 14, 0],
    head: [0, 12, 0],
    rh: { at: [-0.18, 0.12, 0.32], elbow: [-0.6, 0.6, 0.2] },
    L: { at: [0.06, 0.1, 0.52], knee: [0.3, 0.6, 0.6], yaw: 0, pitch: 60 },
    near: LEG_FAR,
  }),

  // ---- jumping strikes ----
  jlp: vary(TUCK, {
    hips: { t: [0, 0, 0], r: [16, 20, 0] },
    rh: { at: [-0.06, 1.0, 0.62], elbow: [-0.45, 1.2, 0.0] },
  }),
  // The hammer: the rear fist brought down from high and far.
  jhp0: vary(TUCK, {
    hips: { t: [0, 0, 0], r: [-4, 10, 0] },
    lh: { at: [0.1, 1.7, -0.08], elbow: [0.5, 1.4, -0.4] },
  }),
  jhp: vary(TUCK, {
    hips: { t: [0, 0, 0], r: [24, -16, 0] },
    spine: [10, -8, 0],
    chest: [8, -8, 0],
    neck: [-14, 18, 0],
    head: [0, 14, 0],
    lh: { at: [0.0, 0.9, 0.8], elbow: [0.5, 1.4, 0.4] },
    rh: { at: [-0.14, 1.18, 0.18], elbow: [-0.5, 0.8, 0.0] },
    near: ARM_FAR,
  }),
  jlk: vary(TUCK, {
    hips: { t: [0, 0, 0], r: [0, 22, 0] },
    R: { at: [-0.06, 0.36, 0.62], knee: [-0.15, 1.0, 1.0], yaw: 0, pitch: 60 },
  }),
  // The flying kick: the rear leg driven long and down, the body leaning back from it.
  jhk: vary(TUCK, {
    hips: { t: [0, 0, 0], r: [-14, -20, 0] },
    spine: [-6, -6, 0],
    neck: [10, 18, 0],
    head: [8, 14, 0],
    R: { at: [-0.08, 0.66, 0.22], knee: [-0.2, 1.2, 1.2], yaw: 0, pitch: 40 },
    L: { at: [0.0, 0.32, 0.84], knee: [0.3, 1.0, 0.6], yaw: 0, pitch: 70 },
    near: LEG_FAR,
  }),

  // ---- the throw: reach, hold, heave ----
  throw0: vary(STAND, {
    hips: { t: [0, -0.12, 0.06], r: [12, 4, 0] },
    spine: [6, -2, 0],
    rh: { at: [-0.1, 1.24, 0.56], elbow: [-0.5, 1.0, 0.2] },
    lh: { at: [0.06, 1.26, 0.54], elbow: [0.5, 1.0, 0.2] },
    near: ARM_FAR,
  }),
  throw: vary(STAND, {
    hips: { t: [0, -0.16, 0.04], r: [10, 0, 0] },
    spine: [6, -2, 0],
    rh: { at: [-0.1, 1.14, 0.44], elbow: [-0.5, 0.8, 0.0] },
    lh: { at: [0.08, 1.16, 0.42], elbow: [0.5, 0.8, 0.0] },
    near: ARM_FAR,
  }),
  throw2: vary(STAND, {
    hips: { t: [0, -0.14, -0.04], r: [6, -40, 0] },
    spine: [4, -14, 0],
    chest: [2, -14, 0],
    neck: [-4, 30, 0],
    head: [8, 26, 0],
    rh: { at: [-0.34, 1.2, -0.12], elbow: [-0.6, 1.0, -0.2] },
    lh: { at: [0.12, 1.36, 0.46], elbow: [0.5, 1.0, 0.2] },
    near: ARM_FAR,
  }),
}

/**
 * The pictures in the game's order of pose rows (engine/fighter.e16.ts, fighters/<id>/poses.txt):
 * the common ones, a startup, active and recovery picture for each move of moves.txt (a light's
 * recovery and a jump attack's are its startup again), then rows that only change the picture.
 * The striking limb of each active picture is named in `strikes` (the art script drafts the hit
 * box from it).
 */
const ROWS = [
  ['stand', 'crouch', 'prejump', 'jump', 'prejump', 'hit', 'hitc', 'guard', 'guardc', 'down'],
  ['wake', 'air'],
  ['lp0', 'lp', 'lp0', 'hp0', 'hp', 'hp2', 'lk0', 'lk', 'lk0', 'hk0', 'hk', 'hk2'],
  ['clp0', 'clp', 'clp0', 'chp0', 'chp', 'chp2', 'clk0', 'clk', 'clk0', 'chk0', 'chk', 'chk2'],
  ['jump', 'jlp', 'jump', 'jhp0', 'jhp', 'jhp0', 'jump', 'jlk', 'jump', 'jump', 'jhk', 'jump'],
  ['throw0', 'throw', 'throw2'],
  ['walk1', 'walk2', 'walk3', 'walk4', 'fall', 'dash', 'backdash', 'thrown', 'win', 'idle'],
].flat()

/**
 * The in-between pictures (design 2.2): drawn between two of the book's poses by `blend`, shown
 * only where a row's sequence (SEQ) names them - they have no boxes of their own (a row's boxes
 * hold for all its pictures). In art.txt they follow the rows and the KO's pieces, in this order.
 */
const B = BOOK
const TWEENS = {
  breath: blend(B.stand, B.idle, 0.5),
  walk1b: blend(B.walk1, B.walk2, 0.5),
  walk2b: blend(B.walk2, B.walk3, 0.5),
  walk3b: blend(B.walk3, B.walk4, 0.5),
  walk4b: blend(B.walk4, B.walk1, 0.5),
  takeoff: blend(B.prejump, B.jump, 0.5),
  apex: blend(B.jump, B.fall, 0.5),
  land: blend(B.fall, B.prejump, 0.5),
  dash0: blend(B.stand, B.dash, 0.5),
  dash2: blend(B.dash, B.stand, 0.5),
  backdash0: blend(B.stand, B.backdash, 0.5),
  hit2: blend(B.hit, B.stand, 0.5),
  hitc2: blend(B.hitc, B.crouch, 0.5),
  knock: blend(B.air, B.down, 0.5),
  wake0: blend(B.down, B.wake, 0.5),
  wake2: blend(B.wake, B.stand, 0.5),
  win0: blend(B.stand, B.win, 0.5),
  // A light's fist or foot drawn back halfway before the stance.
  lp1: blend(B.lp, B.lp0, 0.5),
  lk1: blend(B.lk, B.lk0, 0.5),
  // A heavy's wind-up begun, and its follow-through settling back into the stance.
  hp0a: blend(B.stand, B.hp0, 0.5),
  hp3: blend(B.hp2, B.stand, 0.4),
  hp4: blend(B.hp2, B.stand, 0.75),
  hk0a: blend(B.stand, B.hk0, 0.45),
  hk3: blend(B.hk2, B.stand, 0.4),
  hk4: blend(B.hk2, B.stand, 0.75),
  chp0a: blend(B.crouch, B.chp0, 0.5),
  chp3: blend(B.chp2, B.crouch, 0.5),
  chk0a: blend(B.crouch, B.chk0, 0.5),
  chk3: blend(B.chk2, B.crouch, 0.5),
  jhk0: blend(B.jump, B.jhk, 0.35),
  throw3: blend(B.throw2, B.stand, 0.5),
}

/**
 * Each row's pictures in turn (engine/look.e16.ts): `[picture, until]`, the picture shown while
 * the row's clock is below `until` (the last one holds). The clock is the frames since the row
 * began (a state entered again begins it again), or, for the walk's steps (`step: true`), the
 * points walked into the step (0-7; walking back counts down, so a step plays backwards). A row
 * not listed shows its own picture throughout. Thresholds count from the row's start, so a
 * slot's quicker or slower move (design 3.1) only shortens or lengthens its last picture.
 */
const HOLD = 999
const SEQ = {
  0: [
    ['stand', 26],
    ['breath', HOLD],
  ],
  60: [
    ['idle', 26],
    ['breath', HOLD],
  ],
  51: {
    step: true,
    pics: [
      ['walk1', 4],
      ['walk1b', HOLD],
    ],
  },
  52: {
    step: true,
    pics: [
      ['walk2', 4],
      ['walk2b', HOLD],
    ],
  },
  53: {
    step: true,
    pics: [
      ['walk3', 4],
      ['walk3b', HOLD],
    ],
  },
  54: {
    step: true,
    pics: [
      ['walk4', 4],
      ['walk4b', HOLD],
    ],
  },
  3: [
    ['takeoff', 5],
    ['jump', HOLD],
  ],
  55: [
    ['apex', 6],
    ['fall', HOLD],
  ],
  4: [
    ['land', 1],
    ['prejump', HOLD],
  ],
  5: [
    ['hit', 8],
    ['hit2', HOLD],
  ],
  6: [
    ['hitc', 8],
    ['hitc2', HOLD],
  ],
  9: [
    ['knock', 4],
    ['down', HOLD],
  ],
  10: [
    ['wake0', 4],
    ['wake', 8],
    ['wake2', HOLD],
  ],
  14: [
    ['lp1', 3],
    ['lp0', HOLD],
  ],
  15: [
    ['hp0a', 3],
    ['hp0', HOLD],
  ],
  17: [
    ['hp2', 6],
    ['hp3', 12],
    ['hp4', HOLD],
  ],
  20: [
    ['lk1', 3],
    ['lk0', HOLD],
  ],
  21: [
    ['hk0a', 3],
    ['hk0', HOLD],
  ],
  23: [
    ['hk2', 6],
    ['hk3', 13],
    ['hk4', HOLD],
  ],
  27: [
    ['chp0a', 2],
    ['chp0', HOLD],
  ],
  29: [
    ['chp2', 8],
    ['chp3', HOLD],
  ],
  33: [
    ['chk0a', 3],
    ['chk0', HOLD],
  ],
  35: [
    ['chk2', 10],
    ['chk3', HOLD],
  ],
  45: [
    ['jump', 2],
    ['jhk0', HOLD],
  ],
  50: [
    ['throw2', 10],
    ['throw3', HOLD],
  ],
  56: [
    ['dash0', 2],
    ['dash', 10],
    ['dash2', HOLD],
  ],
  57: [
    ['backdash0', 3],
    ['backdash', HOLD],
  ],
  59: [
    ['win0', 6],
    ['win', HOLD],
  ],
}
/** At most this many pictures a row (engine/look.e16.ts reads a row of 1 + 2 * SEQ_MOST words). */
const SEQ_MOST = 4

const FIST_R = ['hand_r', 'forearm_r', 'upperarm_r']
const FIST_L = ['hand_l', 'forearm_l', 'upperarm_l']
const FOOT_R = ['foot_r', 'shin_r', 'thigh_r']
const FOOT_L = ['foot_l', 'shin_l', 'thigh_l']
const STRIKES = {
  lp: FIST_R,
  hp: FIST_L,
  lk: FOOT_R,
  hk: FOOT_L,
  clp: FIST_R,
  chp: FIST_L,
  clk: FOOT_R,
  chk: FOOT_L,
  jlp: FIST_R,
  jhp: FIST_L,
  jlk: FOOT_R,
  jhk: FOOT_L,
  throw: [...FIST_R, ...FIST_L],
  // A heavy's recovery leaves its limb out where it can be struck (design 7.5).
  hp2: FIST_L,
  hk2: FOOT_L,
  chp2: FIST_L,
  chk2: FOOT_L,
}

for (const k of Object.keys(TWEENS)) if (BOOK[k]) throw new Error(`in-between ${k} is a pose`)
const order = [...Object.keys(BOOK), ...Object.keys(TWEENS)]
for (const r of ROWS) if (!BOOK[r]) throw new Error(`no pose ${r}`)
const poses = Object.fromEntries(order.map((k) => [k, solve(BOOK[k] ?? TWEENS[k])]))
const seq = ROWS.map((name, r) => {
  const d = SEQ[r] ?? [[name, HOLD]]
  const pics = Array.isArray(d) ? d : d.pics
  if (pics.length > SEQ_MOST) throw new Error(`row ${r}: more than ${SEQ_MOST} pictures`)
  for (const [p] of pics) if (!poses[p]) throw new Error(`row ${r}: no picture ${p}`)
  return { step: !Array.isArray(d) && d.step === true, pics }
})
for (const [k, bones] of Object.entries(STRIKES)) poses[k].strikes = bones
writeFileSync(
  join(HERE, 'poses.json'),
  `${JSON.stringify(
    {
      about:
        "Written by pose-book.mjs (edit the poses there): joint rotations per bone, Euler degrees [x, y, z] applied in the order Y, X, Z (yaw, pitch, roll) in the bone's rest frame (X across to the model's left, Y up, Z front). hips may also move by t [x, y, z] metres; `near` lists far bones drawn as near, `strikes` the bones an active picture strikes with. Every pose is put on the ground (lowest point y = 0). `rows` are the game's pose rows, each a picture; `tweens` the in-between pictures; `seq` each row's pictures in turn ([picture, until] by the row's clock; `step` for a walk's step).",
      order,
      rows: ROWS,
      tweens: Object.keys(TWEENS),
      seq,
      poses,
    },
    null,
    1,
  )}\n`,
)
console.log(
  `poses.json: ${order.length} poses (${Object.keys(TWEENS).length} in-between), ${ROWS.length} rows`,
)
