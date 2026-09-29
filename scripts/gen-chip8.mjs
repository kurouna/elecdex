#!/usr/bin/env node
/**
 * Writes resources/chip8/programs.json, the CHIP-8 pane's bundled library
 * (docs/architecture.md section 5.18).
 *
 * For now the library is chip8-test-suite's eight programs (the DIAG tab), already in
 * resources/chip8/test-suite with their sources. Each entry keeps the settings the way
 * chip8Archive writes them (Octo's option names, `tickrate`, `fontStyle`); main reads
 * them through shared/chip8/quirks.ts, so the platforms' profiles live in one place.
 *
 *   node scripts/gen-chip8.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'resources', 'chip8')

const SUITE_TITLES = {
  '1-chip8-logo': 'CHIP-8 Logo',
  '2-ibm-logo': 'IBM Logo',
  '3-corax+': 'Corax+',
  '4-flags': 'Flags',
  '5-quirks': 'Quirks',
  '6-keypad': 'Keypad',
  '7-beep': 'Beep',
  '8-scrolling': 'Scrolling',
}

const SUITE_DESCRIPTIONS = {
  '1-chip8-logo':
    'Draws the CHIP-8 logo with the six simplest instructions: the first check that the screen works.',
  '2-ibm-logo': 'The classic first program: clear, load, draw and jump.',
  '3-corax+':
    'Runs every arithmetic, logic and branch instruction and ticks each one off on screen.',
  '4-flags': 'Checks VF after every carry, borrow and shift, in both orders.',
  '5-quirks':
    'Finds which quirks the interpreter has, for CHIP-8, SUPER-CHIP or XO-CHIP chosen with keys 1 to 3, and says whether they match. Change them in TUNE.',
  '6-keypad':
    'Tests the three key instructions, EX9E, EXA1 and FX0A, one key at a time. Choose with keys 1 to 3.',
  '7-beep': 'Beeps SOS in morse and flashes a speaker; hold B to beep by hand.',
  '8-scrolling':
    'Scrolls down, left and right in both resolutions: every arrow should land in its box.',
}

/** chip8-test-suite: CHIP-8 programs, but for the scrolling test, which needs SUPER-CHIP. */
function suite() {
  return Object.entries(SUITE_DESCRIPTIONS).map(([name, description]) => ({
    id: `diag/${name}`,
    title: SUITE_TITLES[name],
    authors: ['Timendus'],
    platform: name === '8-scrolling' ? 'schip' : 'chip8',
    genre: 'diag',
    description,
    released: '2025',
    tickrate: 1000,
    licence: 'GPL-3.0',
    file: `test-suite/${name}.ch8`,
  }))
}

const programs = [...suite()]
for (const program of programs) {
  const file = path.join(dir, program.file)
  if (!existsSync(file) || statSync(file).size === 0) throw new Error(`missing ${program.file}`)
}
const out = path.join(dir, 'programs.json')
writeFileSync(out, `${JSON.stringify({ version: 1, programs }, null, 2)}\n`)
// In the repository's own format, so `npm run verify` passes on what was written.
execFileSync(
  process.execPath,
  [path.join(root, 'node_modules', '@biomejs', 'biome', 'bin', 'biome'), 'format', '--write', out],
  { stdio: 'ignore' },
)
console.log(`gen-chip8: ${programs.length} programs -> ${path.relative(root, out)}`)
