#!/usr/bin/env node
/**
 * Draws ELECLANCE's pictures (docs/elec16-eleclance.md) into resources/elec16/games/eleclance/art:
 * the palettes, the sprite sheets, the stage, the side panels and the title's word. The PNG
 * files are the source from then on - they may be touched up in any paint program, keeping to
 * each palette's colours - and this script is how they were first made. Run it again only to
 * start a picture over: it overwrites them.
 *
 *   node scripts/eleclance-art.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { logo, panels, stagePicture } from './eleclance/bg.mjs'
import { bastionFrames, zenithFrames } from './eleclance/boss.mjs'
import { chance, sheet } from './eleclance/draw.mjs'
import * as foes from './eleclance/foes.mjs'
import { fontFrames } from './eleclance/font.mjs'
import { savePng } from './eleclance/out.mjs'
import { PALETTES, paletteOf } from './eleclance/palettes.mjs'
import * as ship from './eleclance/ship.mjs'
import { writePng } from './png.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'resources', 'elec16', 'games', 'eleclance', 'art')
mkdirSync(out, { recursive: true })
const file = (name) => path.join(out, name)

// The palettes: a row each, sixteen points wide.
const palData = new Uint8Array(16 * PALETTES.length * 4)
PALETTES.forEach((p, y) => {
  p.colours.forEach(([r, g, b], x) => {
    palData.set([r, g, b, 255], (y * 16 + x) * 4)
  })
})
writeFileSync(file('palettes.png'), writePng({ width: 16, height: PALETTES.length, data: palData }))

const rnd = chance(7)
const sheets = [
  ['ship.png', [-2, -1, 0, 1, 2].map(ship.shipFrame), 16, 'ship'],
  ['flame.png', ship.flameFrames(), 16, 'ship'],
  ['shot.png', ship.shotFrames(), 8, 'shot'],
  ['lance.png', ship.lanceFrames(rnd), 16, 'shot'],
  ['lance-ends.png', ship.lanceEnds(), 16, 'shot'],
  ['mote.png', foes.moteFrames(), 16, 'enemy'],
  ['dart.png', foes.dartFrames(), 16, 'enemy'],
  ['pike.png', foes.pikeFrames(), 16, 'enemy'],
  ['rock-big.png', foes.rockFrames().slice(0, 2), 32, 'enemy'],
  ['rock-small.png', foes.rockFrames().slice(2), 16, 'enemy'],
  ['halberd.png', foes.halberdFrames(), 32, 'heavy'],
  ['warden.png', foes.wardenFrames(), 32, 'heavy'],
  ['bastion.png', bastionFrames(), 32, 'heavy'],
  ['zenith.png', zenithFrames(), 32, 'heavy'],
  ['bullets.png', foes.bulletFrames().small, 8, 'bullet'],
  ['orbs.png', foes.bulletFrames().big, 16, 'bullet'],
  ['blast-small.png', foes.blastFrames(16, 6, 4), 16, 'fire'],
  ['blast-big.png', foes.blastFrames(32, 8, 3), 32, 'fire'],
  ['bits.png', foes.bitFrames(), 8, 'fire'],
  ['stars.png', foes.starFrames(), 8, 'item'],
  ['ring.png', foes.ringFrames(), 16, 'item'],
  ['far-stars.png', foes.farStarFrames(), 8, 'item'],
  ['pickups.png', foes.pickupFrames(), 16, 'item'],
  ['font.png', fontFrames(), 8, 'text'],
]
for (const [name, frames, cell, palette] of sheets) {
  savePng(file(name), sheet(frames, cell, 8), palette)
}

// The stage: each cell in its own palette (slots: space, nebula, station, hull).
const bySlot = ['space', 'nebula', 'station', 'hull'].map(paletteOf)
writeFileSync(file('stage.png'), writePng(stagePicture((slot) => bySlot[slot])))
savePng(file('panels.png'), panels(), 'panel')
savePng(file('logo.png'), logo(), 'logo')
console.log(`eleclance art: ${sheets.length} sheets, the stage, the panels and the logo in ${out}`)
