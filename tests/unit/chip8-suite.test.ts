import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Chip8 } from '@shared/chip8/machine'
import { quirksFor } from '@shared/chip8/quirks'
import type { Platform } from '@shared/chip8/types'
import { describe, expect, it } from 'vitest'
import { screenText } from './chip8-helpers'

/**
 * Timendus's chip8-test-suite, run as it ships in resources/chip8/test-suite. Each test
 * draws its own verdict: a tick or a cross per check. The screens below were read by eye
 * against the suite's README (every check ticked, the quirks as each platform expects);
 * a change to the core that changes any of them fails here.
 *
 * The quirks and scrolling tests pick their platform from the byte at 0x1FF, as their
 * README allows, instead of from their menus.
 */

const SUITE = path.resolve(__dirname, '..', '..', 'resources', 'chip8', 'test-suite')
const rom = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(path.join(SUITE, `${name}.ch8`)))

function boot(name: string, platform: Platform, choice?: number): Chip8 {
  const program = rom(name)
  // The menu choice sits at 0x1FF, the byte before the program; it is poked in as the
  // program's last byte of padding would be.
  const machine = Chip8.load(
    program,
    { platform, quirks: quirksFor(platform), ipf: 1000, font: 'octo' },
    1,
  )
  if (choice !== undefined) machine.state.memory[0x1ff] = choice
  return machine
}

const run = (machine: Chip8, frames: number): Chip8 => {
  for (let k = 0; k < frames; k++) machine.frame()
  return machine
}

const fixture = (name: string): string => path.join(__dirname, 'fixtures', 'chip8', `${name}.txt`)

describe('chip8-test-suite', () => {
  it('draws the CHIP-8 logo', async () => {
    await expect(screenText(run(boot('1-chip8-logo', 'chip8'), 60))).toMatchFileSnapshot(
      fixture('1-chip8-logo'),
    )
  })

  it('draws the IBM logo', async () => {
    await expect(screenText(run(boot('2-ibm-logo', 'chip8'), 60))).toMatchFileSnapshot(
      fixture('2-ibm-logo'),
    )
  })

  it('passes every opcode check of corax+', async () => {
    await expect(screenText(run(boot('3-corax+', 'chip8'), 120))).toMatchFileSnapshot(
      fixture('3-corax+'),
    )
  })

  it.each(['chip8', 'xochip'] as const)('passes every flag check on %s', async (platform) => {
    await expect(screenText(run(boot('4-flags', platform), 120))).toMatchFileSnapshot(
      fixture(`4-flags-${platform}`),
    )
  })

  it.each([
    ['chip8', 1],
    ['schip', 2],
    ['xochip', 3],
  ] as const)('finds the quirks %s expects', async (platform, choice) => {
    const machine = run(boot('5-quirks', platform, choice), 600)
    expect(machine.running).toBe(true)
    await expect(screenText(machine)).toMatchFileSnapshot(fixture(`5-quirks-${platform}`))
  })

  it('waits for a key to be pressed and let go (FX0A)', async () => {
    // Choice 3: GETKEY.
    const machine = run(boot('6-keypad', 'chip8', 3), 30)
    expect(machine.waiting).toBe(true)
    // A key pressed is not taken until it is let go ("NOT RELEASED")...
    machine.press(5)
    run(machine, 10)
    expect(machine.waiting).toBe(true)
    // ...and then it is.
    machine.release(5)
    run(machine, 60)
    await expect(screenText(machine)).toMatchFileSnapshot(fixture('6-keypad-getkey'))
  })

  it('sounds the buzzer while B is held', () => {
    const machine = run(boot('7-beep', 'chip8'), 600)
    machine.press(0xb)
    run(machine, 10)
    expect(machine.sounding).toBe(true)
    machine.release(0xb)
    run(machine, 30)
    expect(machine.sounding).toBe(false)
  })

  it.each([
    ['schip', 1, 'schip-lores'],
    ['schip', 3, 'schip-hires'],
    ['xochip', 4, 'xochip-lores'],
    ['xochip', 5, 'xochip-hires'],
  ] as const)('scrolls %s (choice %i) as expected', async (platform, choice, name) => {
    await expect(screenText(run(boot('8-scrolling', platform, choice), 120))).toMatchFileSnapshot(
      fixture(`8-scrolling-${name}`),
    )
  })
})
