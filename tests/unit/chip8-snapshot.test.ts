import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Chip8 } from '@shared/chip8/machine'
import { quirksFor } from '@shared/chip8/quirks'
import { SNAPSHOT_MAX_SIZE, SNAPSHOT_VERSION, snapshotSize } from '@shared/chip8/snapshot'
import type { Platform } from '@shared/chip8/types'
import { describe, expect, it } from 'vitest'
import { screenText } from './chip8-helpers'

const SUITE = path.resolve(__dirname, '..', '..', 'resources', 'chip8', 'test-suite')

function corax(platform: Platform = 'chip8'): Chip8 {
  const program = new Uint8Array(readFileSync(path.join(SUITE, '3-corax+.ch8')))
  return Chip8.load(program, { platform, quirks: quirksFor(platform), ipf: 30, font: 'vip' }, 7)
}

const frames = (m: Chip8, count: number): void => {
  for (let k = 0; k < count; k++) m.frame()
}

describe('snapshots', () => {
  it.each(['chip8', 'schip', 'xochip'] as const)(
    'take the size their %s machine says',
    (platform) => {
      expect(corax(platform).snapshot()).toHaveLength(snapshotSize(platform))
      expect(snapshotSize(platform)).toBeLessThanOrEqual(SNAPSHOT_MAX_SIZE)
    },
  )

  it('bring a machine back that goes on exactly as the original', () => {
    const original = corax()
    frames(original, 20)
    const copy = Chip8.restore(original.snapshot())
    expect(copy).not.toBeNull()
    if (copy === null) return
    frames(original, 40)
    frames(copy, 40)
    expect(screenText(copy)).toBe(screenText(original))
    expect(copy.state.pc).toBe(original.state.pc)
    expect([...copy.state.v]).toEqual([...original.state.v])
    expect(copy.state.cycles).toBe(original.state.cycles)
    expect(copy.state.config).toEqual(original.state.config)
  })

  it('keep the random sequence, the quirks as tuned, and a halt', () => {
    const m = Chip8.load(
      new Uint8Array([0xc0, 0xff, 0x01, 0x23]),
      { platform: 'xochip', quirks: quirksFor('xochip'), ipf: 1, font: 'fish' },
      99,
    )
    m.tune({ quirks: { clip: true, vfOrder: true }, ipf: 250 })
    const copy = Chip8.restore(m.snapshot())
    const next = Chip8.restore(m.snapshot())
    m.step()
    copy?.step()
    expect(copy?.state.v[0]).toBe(m.state.v[0])
    expect(copy?.state.config.quirks.clip).toBe(true)
    expect(copy?.state.config.quirks.vfOrder).toBe(true)
    expect(copy?.state.config.ipf).toBe(250)
    expect(copy?.state.config.font).toBe('fish')
    m.step()
    const halted = Chip8.restore(m.snapshot())
    expect(halted?.state.halt).toEqual({ reason: 'illegal', pc: 0x202, op: 0x0123 })
    expect(next?.running).toBe(true)
  })

  it('come back with every key up', () => {
    const m = corax()
    m.press(5)
    expect(Chip8.restore(m.snapshot())?.state.keys).toBe(0)
  })

  it('refuse what is not one of ours', () => {
    const good = corax().snapshot()
    const patched = (at: number, value: number): Uint8Array => {
      const bytes = good.slice()
      bytes[at] = value
      return bytes
    }
    expect(Chip8.restore(good.subarray(0, 100))).toBeNull()
    expect(Chip8.restore(new Uint8Array([...good, 0]))).toBeNull()
    expect(Chip8.restore(patched(0, 0))).toBeNull()
    expect(Chip8.restore(patched(4, SNAPSHOT_VERSION + 1))).toBeNull()
    // A platform that does not exist, and one whose memory is not the length given.
    expect(Chip8.restore(patched(5, 9))).toBeNull()
    expect(Chip8.restore(patched(5, 2))).toBeNull()
    expect(Chip8.restore(new Uint8Array())).toBeNull()
  })

  it('refuse registers out of their range', () => {
    const good = corax().snapshot()
    // After magic (4), version, platform, font, quirks (4) and ipf (2): pc, i, then sp.
    const sp = 4 + 4 + 2 + 2 + 2
    const deep = good.slice()
    deep[sp] = 17
    expect(Chip8.restore(deep)).toBeNull()
    const plane = good.slice()
    plane[sp + 4] = 4
    expect(Chip8.restore(plane)).toBeNull()
    const ipf = good.slice()
    ipf[8] = 0
    ipf[9] = 0
    expect(Chip8.restore(ipf)).toBeNull()
  })

  it('refuse a dot no plane can make, rather than draw it as something else', () => {
    // A dot holds a bit per plane, 0 to 3; the painter draws anything else as the ground.
    const good = corax().snapshot()
    const pixels = good.length - 4096 - 128 * 64
    expect(Chip8.restore(good)).not.toBeNull()
    const stray = good.slice()
    stray[pixels + 10] = 5
    expect(Chip8.restore(stray)).toBeNull()
  })
})
