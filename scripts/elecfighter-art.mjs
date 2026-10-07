#!/usr/bin/env node
/**
 * Draws ELECFIGHTER's pictures (docs/elec16-elecfighter-design.md) into
 * resources/elec16/games/elecfighter: for now the stage GRID from scripts/elecfighter/svg/stage.svg
 * (its map, its palette's row and stages/grid/stage.txt); the fighters' poses come here in P3.
 * The PNG files are the source from then on - they may be touched up in any paint program,
 * keeping to each palette's colours - and this script is how they were first made. Run it again
 * only to start a picture over: it overwrites them.
 *
 *   node scripts/elecfighter-art.mjs
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { drawStage } from './elecfighter/stage.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const here = path.join(root, 'scripts', 'elecfighter')
const game = path.join(root, 'resources', 'elec16', 'games', 'elecfighter')

const stage = drawStage(here, game)
console.log(`stage GRID: ${stage.exact} tiles, ${stage.flip} with flipped copies shared`)
