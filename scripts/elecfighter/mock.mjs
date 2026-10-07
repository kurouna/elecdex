#!/usr/bin/env node
/**
 * Regenerates ELECFIGHTER's design mock (docs/elecfighter-mock/human-*.png) and prints its
 * counts. The fighters, the hit spark and the KO's pieces are drawn by three.js (render-main.mjs
 * in a hidden Electron window, the same scene code as viewer.html) from the glTF models, the
 * slots and the poses; the stage and the HUD are the SVGs in svg/. Every picture keeps to its
 * 16-colour palette.
 *
 *   node scripts/elecfighter/mock.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBitmaps } from './bitmaps.mjs'
import { glyph, Img } from './img.mjs'
import {
  fighterPalette,
  filling,
  flat,
  GROUND,
  HUD,
  hitFlash,
  q8,
  SHADOW,
  SPARK,
  STAGE,
  wireOnly,
} from './palettes.mjs'
import { isolated } from './pixels.mjs'
import { bbox, cells, flipSprite } from './sprite.mjs'
import { svgIndices, svgText } from './svg.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '../../docs/elecfighter-mock')
const SLOTS = JSON.parse(readFileSync(join(HERE, 'slots.json'), 'utf8'))
// The mock's fourteen pictures (pose-book.mjs names them; the game draws every row).
const ORDER = [
  'stand',
  'walk2',
  'crouch',
  'jump',
  'lp',
  'hp',
  'lk',
  'hk',
  'guard',
  'hit',
  'throw',
  'chp',
  'down',
  'win',
]
const USED = SLOTS.slots.filter((s) => s.used)
const RESERVED = SLOTS.slots.filter((s) => !s.used)
const P1 = fighterPalette('p1')
const CPU = fighterPalette('cpu')
const GREY = q8([120, 136, 144])
const report = []
const log = (s) => {
  report.push(s)
}

const POSE_LABEL = {
  stand: 'STAND',
  walk2: 'WALK',
  crouch: 'CROUCH',
  jump: 'JUMP',
  lp: 'L.PUNCH',
  hp: 'H.PUNCH',
  lk: 'L.KICK',
  hk: 'H.KICK',
  guard: 'GUARD',
  hit: 'HIT',
  throw: 'THROW',
  chp: 'ANTI-AIR',
  ko: 'KO',
  win: 'WIN',
}

// ---------- render everything once ----------
function jobs() {
  const j = {}
  for (const s of USED) for (const p of ORDER) j[`${s.id}/${p}`] = { slot: s.id, pose: p }
  for (const s of RESERVED) j[`${s.id}/stand`] = { slot: s.id, pose: 'stand' }
  j.spark = {
    kind: 'prop',
    file: 'models/effects.gltf',
    mesh: 'spark',
    explode: 0.7,
    scale: 8.5,
    rot: [20, 30, 0],
  }
  j.shatter = { kind: 'shatter', slot: 'S3', pose: 'hit', t: 1, seed: 11 }
  for (let k = 0; k < 4; k++)
    j[`shard${k}`] = {
      kind: 'prop',
      file: 'models/effects.gltf',
      mesh: 'shard',
      scale: 9,
      rot: [k * 50, k * 70 + 20, k * 35],
    }
  return j
}

const { renderer, results: R } = renderBitmaps(jobs())
const spr = (slot, pose) => R[`${slot}/${pose}`]

// ---------- counts ----------
function counts() {
  log(`renderer: three.js WebGLRenderer on ${renderer}`)
  let strays = 0
  for (const s of USED) {
    const n = ORDER.map((p) => cells(spr(s.id, p)).n)
    const iso = ORDER.reduce((a, p) => a + spr(s.id, p).isolated, 0)
    const raw = ORDER.reduce((a, p) => a + spr(s.id, p).isolatedBefore, 0)
    strays += ORDER.reduce((a, p) => a + spr(s.id, p).stray, 0)
    const st = bbox(spr(s.id, 'stand'))
    log(
      `${s.id} ${s.role}: ${spr(s.id, 'stand').tris} tris, stand ${st.w}x${st.h}; cells avg ${(n.reduce((a, b) => a + b, 0) / n.length).toFixed(1)} max ${Math.max(...n)}; isolated ${iso} (cleaned ${raw})`,
    )
    log(`   ${ORDER.map((p, i) => `${p} ${n[i]}`).join(', ')}`)
  }
  log(`pixels not a palette index from the renderer: ${strays}`)
}

// ---------- sheets ----------
function swatches(img, x, y, pal, label) {
  img.text(label, x, y + 5, pal[1])
  for (let i = 1; i < 16; i++) {
    const sx = x + 64 + (i - 1) * 24
    img.rect(sx, y, 20, 14, pal[i])
    img.text(String(i), sx + 2, y + 17, GREY)
  }
}

/** A sprite with its feet (origin) at (x, y), `s` times. */
function at(img, s, x, y, pal, scale = 1, flip = false) {
  const t = flip ? flipSprite(s) : s
  img.sprite(t, x - t.ox * scale, y - t.oy * scale, pal, scale)
  return t
}

function buildsSheet() {
  const img = new Img(1500, 1060)
  img.text(
    'ELECFIGHTER HUMAN MOCK  SLOTS S1-S4 STANDING  3X AND 1X  P1 FILL / CPU FILL  SILHOUETTES',
    12,
    8,
    P1[1],
  )
  let x = 20
  const base3 = 36 + 106 * 3
  for (const s of USED) {
    const st = spr(s.id, 'stand')
    const b = bbox(st)
    const w = b.w * 3
    at(img, st, x - (b.x0 - st.ox) * 3, base3, P1, 3)
    at(img, st, x + w + 12 - (b.x0 - st.ox) * 3, base3, CPU, 3)
    img.text(`${s.id} ${s.role.toUpperCase()}`, x, base3 + 10, P1[1])
    img.text(`${b.h} PX  ${st.tris} TRIS  ${cells(st).n} CELLS`, x, base3 + 22, P1[2])
    x += w * 2 + 44
  }
  // 1x in both fills and the silhouettes at 1x, then the silhouettes at 2x.
  const base1 = base3 + 150
  x = 20
  for (const s of USED) {
    const st = spr(s.id, 'stand')
    at(img, st, x + 20, base1, P1)
    at(img, st, x + 64, base1, CPU)
    img.text(s.id, x + 30, base1 + 8, GREY)
    x += 110
  }
  img.text('1X', 20, base1 + 22, GREY)
  x += 20
  const sil = flat([168, 176, 184])
  for (const s of USED) {
    at(img, spr(s.id, 'stand'), x + 20, base1, sil)
    x += 56
  }
  img.text('SILHOUETTES 1X', x - 220, base1 + 22, GREY)
  const base2 = base1 + 230
  x = 20
  for (const s of USED) {
    const st = spr(s.id, 'stand')
    at(img, st, x - (bbox(st).x0 - st.ox) * 2, base2, sil, 2)
    x += bbox(st).w * 2 + 30
  }
  img.text('SILHOUETTES 2X', 20, base2 + 10, GREY)
  // The reserved slots: the base human, wire only.
  const baseR = base2 + 150
  img.text('S5-S8 RESERVED (THE BASE HUMAN UNTIL A MODEL IS GIVEN)', 20, baseR - 118, GREY)
  x = 20
  for (const s of RESERVED) {
    at(img, spr(s.id, 'stand'), x + 30, baseR, wireOnly(P1, 1))
    img.text(s.id, x + 14, baseR + 8, GREY)
    x += 90
  }
  swatches(img, 480, baseR - 60, P1, 'P1')
  swatches(img, 480, baseR - 28, CPU, 'CPU')
  img.save(join(OUT, 'human-builds.png'))
}

function cellGrid(img, s, sx, sy, scale) {
  const c = cells(s)
  for (const [cx, cy] of c.list)
    img.rect(sx + cx * scale, sy + cy * scale, 16 * scale, 16 * scale, [10, 22, 32])
  const xs = c.list.map((q) => q[0])
  const ys = c.list.map((q) => q[1])
  const gx0 = Math.min(...xs)
  const gy0 = Math.min(...ys)
  const gx1 = Math.max(...xs) + 16
  const gy1 = Math.max(...ys) + 16
  for (let gx = gx0; gx <= gx1; gx += 16)
    img.rect(sx + gx * scale, sy + gy0 * scale, 1, (gy1 - gy0) * scale, [32, 48, 56])
  for (let gy = gy0; gy <= gy1; gy += 16)
    img.rect(sx + gx0 * scale, sy + gy * scale, (gx1 - gx0) * scale, 1, [32, 48, 56])
  return c.n
}

function posesSheet(slot = 'S1') {
  const img = new Img(1640, 930)
  img.text(
    `ELECFIGHTER HUMAN MOCK  ${slot} BALANCE  14 POSES  1X (P1, CPU)  2X WITH 16X16 CELLS`,
    12,
    8,
    P1[1],
  )
  let x = 16
  for (const p of ORDER) {
    const s = spr(slot, p)
    const b = bbox(s)
    at(img, s, x - (b.x0 - s.ox), 140, P1)
    at(img, s, x - (b.x0 - s.ox), 260, CPU)
    x += b.w + 14
  }
  const rows = [ORDER.slice(0, 7), ORDER.slice(7)]
  let y = 290
  for (const row of rows) {
    x = 16
    for (const p of row) {
      const s = spr(slot, p)
      const b = bbox(s)
      const sx = x - b.x0 * 2 + 8
      const sy = y + 228 - (b.y1 + 1) * 2
      const n = cellGrid(img, s, sx, sy, 2)
      img.sprite(s, sx, sy, P1, 2)
      img.text(POSE_LABEL[p], x + 8, y + 238, P1[1])
      img.text(`${n} CELLS`, x + 8, y + 250, P1[2])
      x += Math.max(b.w * 2 + 40, 150) + 50
    }
    y += 300
  }
  swatches(img, 16, y + 4, P1, 'P1')
  swatches(img, 480, y + 4, CPU, 'CPU')
  img.save(join(OUT, 'human-poses.png'))
}

// ---------- the screen ----------
const FOOT = 244

/** An 8x8 tile's indices, and the same tile mirrored by `fx` / `fy`. */
function tileAt(s, tx, ty, fx = false, fy = false) {
  const t = []
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const sx = tx + (fx ? 7 - x : x)
      const sy = ty + (fy ? 7 - y : y)
      t.push(s.px[sy * s.w + sx] ?? 0)
    }
  return t.join('.')
}

/** Distinct 8x8 tiles, exactly and with flipped copies shared. */
function tileCount(s) {
  const exact = new Set()
  const flip = new Set()
  for (let ty = 0; ty < s.h; ty += 8)
    for (let tx = 0; tx < s.w; tx += 8) {
      const ways = [
        [false, false],
        [true, false],
        [false, true],
        [true, true],
      ].map(([fx, fy]) => tileAt(s, tx, ty, fx, fy))
      exact.add(ways[0])
      flip.add(ways.sort()[0])
    }
  return { exact: exact.size, flip: flip.size }
}

/** Text in the 8x8 font into indices, `k` times. */
function indexText(h, str, x, y, c, k = 1) {
  ;[...str].forEach((ch, i) => {
    const g = glyph(ch)
    for (let yy = 0; yy < 8 * k; yy++)
      for (let xx = 0; xx < 8 * k; xx++)
        if (g.get(Math.floor(xx / k), Math.floor(yy / k)) >= 4)
          h.px[(y + yy) * h.w + x + i * 7 * k + xx] = c
  })
}

const STAGE_SVG = svgIndices(svgText(join(HERE, 'svg/stage.svg')), STAGE)

function hudPicture(life1, life2, wins1, wins2, time, names) {
  const amber = '#f8c048'
  const w1 = Math.round(120 * life1)
  const w2 = Math.round(120 * life2)
  const edits = {
    life1: { width: w1 },
    life2: { x: 184 + 120 - w2, width: w2 },
  }
  if (wins1 > 0) edits.win1a = { fill: amber }
  if (wins1 > 1) edits.win1b = { fill: amber }
  if (wins2 > 0) edits.win2a = { fill: amber }
  if (wins2 > 1) edits.win2b = { fill: amber }
  const h = svgIndices(svgText(join(HERE, 'svg/hud.svg'), edits), HUD)
  const text = (str, x, y, c, k = 1) => indexText(h, str, x, y, c, k)
  text(names[0], 8, 4, 1)
  text('P1', 122, 4, 2)
  text('CPU', 186, 4, 2)
  text(names[1], 313 - names[1].length * 7, 4, 1)
  text(time, 146, 4, 1, 2)
  text('TIME', 147, 24, 2)
  return h
}

class Screen {
  constructor(camX) {
    this.img = new Img(320, 288)
    this.sprites = []
    this.camX = camX
    for (let y = 0; y < 288; y++)
      for (let x = 0; x < 320; x++) this.img.set(x, y, STAGE[STAGE_SVG.px[y * 512 + x + camX]])
  }

  /** A sprite placed by its origin; counted by its 16x16 cells. */
  place(s, x, y, pal, flip = false) {
    const t = flip ? flipSprite(s) : s
    const X = x - t.ox
    const Y = y - t.oy
    this.img.sprite(t, X, Y, pal)
    for (const [cx, cy] of cells(t).list) this.sprites.push({ y: Y + cy, size: 16, x: X + cx })
    return { X, Y, t }
  }

  /** A sprite of its own size (one hardware sprite), top left at (X, Y). */
  plain(s, X, Y, pal, size) {
    this.img.sprite(s, X, Y, pal)
    this.sprites.push({ x: X, y: Y, size })
  }

  shadow(x, w = 32) {
    const s = { w, h: 8, px: new Uint8Array(w * 8) }
    for (let y = 0; y < 8; y++)
      for (let xx = 0; xx < w; xx++) {
        const nx = (xx + 0.5 - w / 2) / (w / 2)
        const ny = (y + 0.5 - 4) / 3
        if (nx * nx + ny * ny <= 1) s.px[y * w + xx] = 1
      }
    this.img.sprite(s, x - w / 2, FOOT - 3, SHADOW)
    this.sprites.push({ x: x - w / 2, y: FOOT - 3, size: 16 }, { x, y: FOOT - 3, size: 16 })
  }

  bg1(h, y0 = 0) {
    for (let y = 0; y < h.h; y++)
      for (let x = 0; x < h.w; x++) {
        const v = h.px[y * h.w + x]
        if (v || y0 === 0) this.img.set(x, y + y0, HUD[v])
      }
  }

  logLine(s) {
    this.img.text(s, 8, 272, HUD[1])
  }

  counts() {
    const on = this.sprites.filter((s) => s.x > -s.size && s.x < 320 && s.y > -s.size && s.y < 288)
    let most = 0
    for (let y = 0; y < 288; y++)
      most = Math.max(most, on.filter((s) => y >= s.y && y < s.y + s.size).length)
    return { sprites: on.length, most }
  }
}

/** The rightmost drawn point of a sprite: [x, y] from its origin. */
function front(s) {
  const b = bbox(s)
  let fy = 0
  for (let y = 0; y < s.h; y++) if (s.px[y * s.w + b.x1]) fy = y
  return [b.x1 - s.ox, fy - s.oy]
}

const NAMES = ['S1 BALANCE', 'S3 POWER']
const CAM_X = 96

function fightScreen() {
  const sc = new Screen(CAM_X)
  const hp = spr('S1', 'hp')
  const hit = flipSprite(spr('S3', 'hit'))
  const kx = 118
  const [reach, fy] = front(hp)
  const hb = bbox(hit)
  const dx = kx + reach + (hit.ox - hb.x0) - 6
  sc.shadow(kx, 36)
  sc.shadow(dx, 40)
  sc.place(hp, kx, FOOT, P1)
  sc.place(hit, dx, FOOT, hitFlash(CPU))
  const sp = R.spark
  sc.plain(sp, kx + reach - sp.ox - 2, FOOT + fy - sp.oy, SPARK, 32)
  sc.bg1(hudPicture(0.82, 0.46, 1, 0, '99', NAMES))
  sc.logLine('> P1 COUNTER  HEAVY PUNCH')
  const c = sc.counts()
  const t = tileCount(STAGE_SVG)
  log(
    `fight: sprites ${c.sprites}, most on a scanline ${c.most}; stage (512x288) BG tiles ${t.exact} exact, ${t.flip} with flips shared; stage SVG stray colours ${STAGE_SVG.stray}`,
  )
  log(`spark: ${sp.w}x${sp.h}, isolated ${sp.isolated}`)
  sc.img.scaled(3).save(join(OUT, 'human-fight.png'))
  return sc
}

function koScreen() {
  const sc = new Screen(CAM_X)
  sc.shadow(120, 36)
  sc.place(spr('S1', 'win'), 120, FOOT, P1)
  // The loser in pieces of its own mesh, wire only, mirrored as it faces left.
  const lx = 214
  const pal = wireOnly(CPU, 2)
  let iso = 0
  for (const piece of R.shatter) {
    sc.place(piece, lx, FOOT - 6, pal, true)
    iso += isolated(piece.px, piece.w, piece.h)
  }
  const shards = [0, 1, 2, 3].map((k) => R[`shard${k}`])
  const spots = [
    [176, 150],
    [250, 128],
    [262, 196],
    [190, 206],
  ]
  shards.forEach((s, k) => {
    const b = bbox(s)
    sc.plain(s, spots[k][0] - b.x0, spots[k][1] - b.y0, pal, 16)
  })
  sc.bg1(hudPicture(0.64, 0, 2, 0, '41', NAMES))
  // The band (BG1, in front): ground, rules with end ticks, K.O. at 3x in amber.
  const y0 = 56
  sc.img.rect(0, y0, 320, 44, GROUND)
  sc.img.rect(0, y0, 320, 1, HUD[2])
  sc.img.rect(0, y0 + 43, 320, 1, HUD[2])
  for (const xx of [0, 319]) {
    sc.img.rect(xx, y0, 1, 3, HUD[2])
    sc.img.rect(xx, y0 + 41, 1, 3, HUD[2])
  }
  sc.img.text('K.O.', 160 - 42, y0 + 6, HUD[4], 3)
  sc.img.text('P1 WINS', 160 - 24, y0 + 32, HUD[1])
  sc.logLine('> CPU PROCESS TERMINATED')
  const c = sc.counts()
  log(
    `ko: pieces ${R.shatter.length} (+4 shards from effects.gltf), isolated in pieces ${iso}; sprites ${c.sprites}, most on a scanline ${c.most}`,
  )
  sc.img.scaled(3).save(join(OUT, 'human-ko.png'))
  return sc
}

function introStrip() {
  const s = spr('S1', 'stand')
  const steps = [
    ['WIRE DIM', wireOnly(P1, 1)],
    ['WIRE', wireOnly(P1, 2)],
    ['FILL 50%', filling(P1, 0.5)],
    ['FULL', P1],
  ]
  const panels = steps.map(([label, pal]) => {
    const p = new Img(100, 132)
    for (let y = 0; y < 132; y++)
      for (let x = 0; x < 100; x++) p.set(x, y, STAGE[STAGE_SVG.px[(y + 140) * 512 + x + 206]])
    p.sprite(s, 50 - s.ox, 104 - s.oy, pal)
    p.text(label, 4, 120, GREY)
    return p
  })
  const img = new Img(4 * 300 + 5 * 12, 132 * 3 + 24)
  panels.forEach((p, i) => {
    img.blit(p, 12 + i * 312, 12, 3)
  })
  img.save(join(OUT, 'human-intro.png'))
  return panels
}

function screens1x(fight, ko, intro) {
  const img = new Img(320 * 2 + 404 + 40, 300)
  img.blit(fight.img, 8, 6)
  img.blit(ko.img, 340, 6)
  intro.forEach((p, i) => {
    img.blit(p, 672 + i * 101, 6)
  })
  img.save(join(OUT, 'human-screens-1x.png'))
}

counts()
buildsSheet()
posesSheet()
const fight = fightScreen()
const ko = koScreen()
screens1x(fight, ko, introStrip())
console.log(report.join('\n'))
