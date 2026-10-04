#!/usr/bin/env node
/**
 * Draws ELECDRILL's pictures (docs/elec16-elecdrill.md) into resources/elec16/games/elecdrill/art:
 * the palettes, the blocks, the driller, the effects, the panels, the lettering and the title's
 * word. The PNG files are the source from then on - they may be touched up in any paint
 * program, keeping to each palette's colours - and this script is how they were first made.
 * Run it again only to start a picture over: it overwrites them.
 *
 *   node scripts/elecdrill-art.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as blocks from './elecdrill/blocks.mjs'
import { bitFrames, drillerFrames } from './elecdrill/driller.mjs'
import { PALETTES, paletteOf } from './elecdrill/palettes.mjs'
import * as panel from './elecdrill/panel.mjs'
import { fxFrames, logo } from './elecdrill/title.mjs'
import { sheet } from './eleclance/draw.mjs'
import { writePng } from './png.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'resources', 'elec16', 'games', 'elecdrill', 'art')
mkdirSync(out, { recursive: true })
const file = (name) => path.join(out, name)

/** A canvas as RGBA in palette `name`, colour 0 clear. */
function save(name, canvas, palette) {
  const pal = paletteOf(palette)
  const data = new Uint8Array(canvas.w * canvas.h * 4)
  for (let k = 0; k < canvas.px.length; k++) {
    const c = canvas.px[k]
    if (c === 0) continue
    const [r, g, b] = pal[c]
    data.set([r, g, b, 255], k * 4)
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

const sheets = [
  ['font.png', panel.fontTiles(), 8, 'panel', 16],
  ['digits.png', panel.bigDigitTiles(), 8, 'panel', 6],
  ['tank.png', panel.tankTiles(), 8, 'panel', 2],
  ['icons.png', panel.iconTiles(), 8, 'panel', 5],
  ['band.png', panel.bandFrames(), 16, 'panel', 3],
  ['quarters.png', blocks.blockQuarters(), 8, 'red', 5],
  ['loose.png', blocks.looseFrames(), 16, 'red', 4],
  ['pop.png', blocks.popFrames(), 16, 'red', 5],
  ['alloy.png', blocks.alloyFrames(), 16, 'panel', 5],
  ['capsule.png', blocks.capsuleFrames(), 16, 'panel', 2],
  ['core.png', [blocks.coreFrame()], 16, 'flash', 1],
  ['ground.png', blocks.groundQuarters(), 8, 'earth1', 9],
  ['driller.png', drillerFrames(), 16, 'driller', 8],
  ['bit.png', bitFrames(), 16, 'fx', 2],
  ['fx.png', fxFrames(), 8, 'fx', 10],
]
for (const [name, frames, cell, palette, across] of sheets) {
  save(name, sheet(frames, cell, across), palette)
}
save('panels.png', panel.panels(), 'panel')
save('logo.png', logo(), 'logo')
console.log(`elecdrill art: ${sheets.length} sheets, the panels and the logo in ${out}`)
