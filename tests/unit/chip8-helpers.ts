import { screenHeight, screenWidth } from '@shared/chip8/display'
import type { Chip8 } from '@shared/chip8/machine'
import type { Chip8State } from '@shared/chip8/state'

/** Dark, plane 1, plane 2, both. */
const DOTS = ['.', '#', '+', '@']

/** A machine's screen as text, a line per row: the unit tests' way to see it. */
export function screenText(machine: Chip8 | Readonly<Chip8State>): string {
  const s = 'state' in machine ? machine.state : machine
  const w = screenWidth(s)
  const h = screenHeight(s)
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) row += DOTS[(s.pixels[y * w + x] ?? 0) & 3]
    rows.push(row)
  }
  return `${rows.join('\n')}\n`
}
