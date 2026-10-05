#!/usr/bin/env node
/**
 * Draws ELECAIRCOMBAT's pictures (docs/elec16-elecaircombat.md) into
 * resources/elec16/games/elecaircombat/art: the palettes, the enemy fighter from every view
 * and size, the sky's tiles and their table, the cockpit, the HUD's marks, clouds, smoke,
 * explosions, the sun and the title. The PNG files (and horizon.txt) are the source from then
 * on - they may be touched up in any paint program, keeping to each palette's colours - and
 * this script is how they were first made. Run it again only to start them over: it
 * overwrites them.
 *
 *   node scripts/elecaircombat-art.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cockpit, screens } from './elecaircombat/cockpit.mjs'
import { horizon } from './elecaircombat/horizon.mjs'
import { logo } from './elecaircombat/logo.mjs'
import { PALETTES, paletteOf } from './elecaircombat/palettes.mjs'
import { arcwing, drawFrame, VIEWS } from './elecaircombat/plane.mjs'
import * as sprites from './elecaircombat/sprites.mjs'
import { Canvas, sheet } from './eleclance/draw.mjs'
import { bitFrames, blastFrames } from './eleclance/foes.mjs'
import { fontFrames } from './eleclance/font.mjs'
import { writePng } from './png.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'resources', 'elec16', 'games', 'elecaircombat')
const out = path.join(dir, 'art')
mkdirSync(out, { recursive: true })
const file = (name) => path.join(out, name)

/** A canvas as RGBA in palette `name`, colour 0 clear. */
function save(name, canvas, palette) {
  const pal = paletteOf(palette)
  const data = new Uint8Array(canvas.w * canvas.h * 4)
  for (let k = 0; k < canvas.px.length; k++) {
    const c = canvas.px[k]
    if (c !== 0) data.set([...pal[c], 255], k * 4)
  }
  writeFileSync(file(name), writePng({ width: canvas.w, height: canvas.h, data }))
}

// The palettes: a row each, sixteen points wide.
const palData = new Uint8Array(16 * PALETTES.length * 4)
PALETTES.forEach((p, y) => {
  p.colours.forEach(([r, g, b], x) => {
    palData.set([r, g, b, 255], (y * 16 + x) * 4)
  })
})
writeFileSync(file('palettes.png'), writePng({ width: 16, height: PALETTES.length, data: palData }))

/**
 * The fighter: for each size, every view's eight turns, frames stacked down a picture as wide
 * as a frame, so the kit reads each frame's cells together (game.json's `stream`).
 */
export const BANDITS = [
  { png: 'bandit64.png', box: 64, size: 62, views: 9 },
  { png: 'bandit48.png', box: 48, size: 46, views: 9 },
  { png: 'bandit32.png', box: 32, size: 30, views: 17 },
  { png: 'bandit24.png', box: 32, size: 22, views: 17 },
  { png: 'bandit16.png', box: 16, size: 15, views: 17 },
  { png: 'bandit12.png', box: 16, size: 11, views: 17 },
  { png: 'bandit8.png', box: 8, size: 7, views: 17 },
]
const tris = arcwing()
for (const b of BANDITS) {
  const c = new Canvas(b.box, b.box * b.views * 8)
  for (let v = 0; v < b.views; v++) {
    for (let g = 0; g < 8; g++) c.blit(drawFrame(tris, v, g, b.box, b.size), 0, (v * 8 + g) * b.box)
  }
  save(b.png, c, 'ace_gannet')
}

// The sky's tiles, sixteen to a row, and the table that picks them (horizon.txt).
const sky = horizon()
save('horizon.png', sheet(sky.tiles, 8, 16), 'sky_day')
const lines = []
for (let k = 0; k < sky.table.length; k += 16) lines.push(sky.table.slice(k, k + 16).join(' '))
writeFileSync(
  path.join(dir, 'horizon.txt'),
  `# ELECAIRCOMBAT's sky: tiles of horizon.png by the horizon's distance (321 bands, -160 to\n# 160 points), then by its angle and offset (17 x 13). Written by scripts/elecaircombat-art.mjs.\n${lines.join('\n')}\n`,
)

// The views as the game finds them (views.txt): each one's direction in 64ths, then for each
// the nearest of the first nine (the views the two largest sizes are drawn from).
const q6 = VIEWS.flatMap((v) => v.map((c) => Math.round(c * 64)))
const near = VIEWS.map((v) => {
  let best = 0
  VIEWS.slice(0, 9).forEach((w, k) => {
    const d = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    if (d(v, w) > d(v, VIEWS[best])) best = k
  })
  return best
})
writeFileSync(
  path.join(dir, 'views.txt'),
  `# ELECAIRCOMBAT's views of the fighter (scripts/elecaircombat/plane.mjs): 17 directions to the
# camera (x right, y up, z ahead, in 64ths), then each one's nearest of the first nine.
${[...q6, ...near].join(' ')}
`,
)

const cl = sprites.clouds()
const tr = sprites.trail()
const sun = sprites.sun()
const sheets = [
  ['font.png', fontFrames(), 8, 'hud_text'],
  ['hud8.png', sprites.hudSmall(), 8, 'hud'],
  ['hud16.png', sprites.hudLarge(), 16, 'hud'],
  ['seeker.png', [sprites.seekerQuarter()], 32, 'hud'],
  ['shots.png', sprites.shots(), 8, 'shot'],
  ['blast32.png', blastFrames(32, 8, 3), 32, 'fire'],
  ['blast16.png', blastFrames(16, 6, 4), 16, 'fire'],
  ['bits.png', bitFrames(), 8, 'fire'],
  ['smoke.png', sprites.smoke(), 16, 'cloud'],
  ['cloud64.png', cl.big, 32, 'cloud'],
  ['cloud32.png', cl.mid, 32, 'cloud'],
  ['cloud16.png', cl.small, 16, 'cloud'],
  ['cloud8.png', cl.tiny, 8, 'cloud'],
  ['sun.png', [sun.disc], 32, 'sun'],
  ['flare.png', sun.ghosts, 16, 'sun'],
  ['burst16.png', sprites.bursts(), 16, 'fire'],
  ['muzzle.png', sprites.muzzle(), 16, 'shot'],
  ['trail16.png', tr.big, 16, 'cloud'],
  ['trail8.png', tr.small, 8, 'cloud'],
]
for (const [name, frames, cell, palette] of sheets) save(name, sheet(frames, cell, 8), palette)
// The big clouds two halves to a row, so each cloud's halves are read together.
save('cloud64.png', sheet(cl.big, 32, 2), 'cloud')

save('cockpit.png', cockpit(), 'frame')
save('screens.png', screens(), 'screen')
save('logo.png', logo(), 'logo')
console.log(
  `elecaircombat art: ${BANDITS.length} fighter sheets, ${sheets.length} sheets, ${sky.tiles.length} sky tiles, the cockpit and the title in ${out}`,
)
