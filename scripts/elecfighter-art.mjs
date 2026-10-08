#!/usr/bin/env node
/**
 * Draws ELECFIGHTER's pictures (docs/elec16-elecfighter-design.md 2, 4) into
 * resources/elec16/games/elecfighter: the stage GRID from scripts/elecfighter/svg/stage.svg (its
 * map, its palette's row and stages/grid/stage.txt); every used slot's fighter in every pose row
 * (three.js in a hidden Electron window, the viewer's scene: fighters/<id>/art/cells.png, art.txt,
 * poses.txt with boxes drafted from the drawing, limbs.txt) and its KO pieces; the hit spark, the
 * guard's firewall and the shadows (art/spark.png, art/shadow.png); the fighters' and the
 * effects' palettes; the screens' pictures (art/big.png, art/title.png, art/busts.png and busts.txt:
 * scripts/elecfighter/screens.mjs). The PNG files are the source from then on - they may be touched up in any
 * paint program, keeping to each palette's colours - and this script is how they were first
 * made. Run it again only to start a picture over: it overwrites them (but never the boxes set
 * by hand, fighters/<id>/boxes.txt).
 *
 *   node scripts/elecfighter-art.mjs            everything
 *   node scripts/elecfighter-art.mjs stage      only the stage
 *   node scripts/elecfighter-art.mjs title      only the title's map (the stage and svg/logo.svg)
 *   node scripts/elecfighter-art.mjs screens    the screens' pictures and the palettes, not the fighters
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBitmaps } from './elecfighter/bitmaps.mjs'
import { FX, sparkJobs, writeEffects } from './elecfighter/effects.mjs'
import { fighterJobs, writeFighters, writePalettes } from './elecfighter/fighters.mjs'
import { fighterPalette, mirrorPalette } from './elecfighter/palettes.mjs'
import { BIG_PAL, bustJobs, writeScreens, writeTitle } from './elecfighter/screens.mjs'
import { drawStage } from './elecfighter/stage.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const here = path.join(root, 'scripts', 'elecfighter')
const game = path.join(root, 'resources', 'elec16', 'games', 'elecfighter')
const docs = path.join(root, 'docs', 'elecfighter-mock')
const only = process.argv[2]

if (only === 'title') {
  writeTitle(game, here)
  console.log('title: the stage and the logo')
} else if (only !== 'screens') {
  const stage = drawStage(here, game)
  console.log(`stage GRID: ${stage.exact} tiles, ${stage.flip} with flipped copies shared`)
}
if (only === undefined || only === 'screens') {
  const slots = JSON.parse(readFileSync(path.join(here, 'slots.json'), 'utf8'))
  const poses = JSON.parse(readFileSync(path.join(here, 'poses.json'), 'utf8'))
  const fighters = only === undefined
  const { renderer, results } = renderBitmaps({
    ...(fighters ? { ...fighterJobs(slots, poses), ...sparkJobs() } : {}),
    ...bustJobs(slots),
  })
  console.log(`three.js on ${renderer}`)
  if (fighters) {
    for (const line of writeFighters(results, slots, poses, game, docs)) console.log(line)
    console.log(writeEffects(results, game))
  }
  console.log(writeScreens(results, slots, game, here))
  // The palettes' rows (game.json's names): p1 3, cpu 4, fx 5, big 6, mirror 7.
  writePalettes(path.join(game, 'art/palettes.png'), [
    [3, fighterPalette('p1')],
    [4, fighterPalette('cpu')],
    [5, FX],
    [6, BIG_PAL],
    [7, mirrorPalette()],
  ])
}
