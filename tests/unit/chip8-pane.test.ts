import { readFileSync } from 'node:fs'
import path from 'node:path'
import { BUZZER_PATTERN, PatternVoice, patternRate, toneOf } from '@shared/chip8/audio'
import { Chip8 } from '@shared/chip8/machine'
import { quirksFor } from '@shared/chip8/quirks'
import { DEFAULT_IPF, programFromEntry, readCatalog } from '@shared/chip8-library'
import { applySettingsPatch, defaultSettings } from '@shared/settings'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bootLine,
  changedRegisters,
  codeAround,
  haltLines,
  readCore,
} from '../../src/renderer/widgets/chip8/core.js'
import {
  originalPalette,
  type Palette,
  themePalette,
} from '../../src/renderer/widgets/chip8/palette.js'
import {
  LIST_SHARE,
  PANEL_WIDTH,
  panelShown,
  readChip8Pane,
} from '../../src/renderer/widgets/chip8/pane-state.js'
import { Painter } from '../../src/renderer/widgets/emu/painter.js'

describe('the pane state', () => {
  it('opens on the library with nothing chosen, whatever the view says', () => {
    expect(readChip8Pane(undefined)).toMatchObject({
      view: 'library',
      program: null,
      filter: 'all',
      panel: null,
    })
    expect(readChip8Pane({ view: 'run' }).view).toBe('library')
    expect(readChip8Pane({ view: 'run', program: 'diag/5-quirks' })).toMatchObject({
      view: 'run',
      program: 'diag/5-quirks',
    })
  })

  it('takes nothing strange from a hand-edited layout', () => {
    const pane = readChip8Pane({
      program: '../../etc/passwd',
      view: 'wat',
      filter: 'games',
      tab: 'regs',
      phosphor: 'yes',
      scale: 'huge',
      palette: 'rainbow',
      panel: 1,
      listShare: 'wide',
    })
    expect(pane).toEqual({
      view: 'library',
      program: null,
      filter: 'all',
      panel: null,
      tab: 'core',
      phosphor: true,
      dots: true,
      scale: 'integer',
      palette: 'theme',
      muted: false,
      listShare: 0.5,
    })
  })

  it("holds the library list's share of the width to its range", () => {
    expect(readChip8Pane({ listShare: 0.62 }).listShare).toBe(0.62)
    expect(readChip8Pane({ listShare: 0.01 }).listShare).toBe(LIST_SHARE.min)
    expect(readChip8Pane({ listShare: 5 }).listShare).toBe(LIST_SHARE.max)
    expect(readChip8Pane({ listShare: Number.NaN }).listShare).toBe(LIST_SHARE.reset)
  })

  it('shows the panel only where the screen keeps three pixels a hires dot beside it', () => {
    const wide = { w: PANEL_WIDTH + 128 * 3, h: 64 * 3 }
    expect(panelShown(true, wide)).toBe(true)
    expect(panelShown(false, wide)).toBe(false)
    expect(panelShown(true, { w: wide.w - 1, h: wide.h })).toBe(false)
    expect(panelShown(true, { w: 2000, h: 64 * 3 - 1 })).toBe(false)
  })
})

describe('the palette', () => {
  it('makes four shades of the accent over the ground', () => {
    const p = themePalette({ ground: [0, 0, 0], accent: [100, 200, 100], strong: [150, 250, 150] })
    expect(p[0]).toEqual([0, 0, 0])
    expect(p[1]).toEqual([100, 200, 100])
    expect(p[2].map(Math.round)).toEqual([42, 84, 42])
    expect(p[3]).toEqual([150, 250, 150])
  })

  it("gives the same author's colours the same palette, so nothing restarts for a new one", () => {
    const colours = { ground: '#000000', plane1: '#ffffff', plane2: '#ff0000', both: '#00ff00' }
    expect(originalPalette(colours)).toBe(originalPalette(colours))
  })

  it("takes the author's colours only when all four are there", () => {
    expect(
      originalPalette({ ground: '#000000', plane1: '#ff0000', plane2: '#00ff00', both: '#0000ff' }),
    ).toEqual([
      [0, 0, 0],
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
    ])
    expect(originalPalette(undefined)).toBeNull()
    expect(
      originalPalette({ ground: 'red', plane1: '#ff0000', plane2: '#00ff00', both: '#0000ff' }),
    ).toBeNull()
  })
})

describe('the painter', () => {
  const PALETTE: Palette = [
    [0, 0, 0],
    [200, 200, 200],
    [100, 100, 100],
    [255, 255, 255],
  ]
  const out = () => ({ width: 2, height: 1, data: new Uint8ClampedArray(8) })

  it('lights a dot at once and lets it fade over a few frames, then settles', () => {
    const painter = new Painter()
    const image = out()
    painter.paint({ width: 2, height: 1, pixels: new Uint8Array([1, 0]) }, PALETTE, image, true)
    expect([...image.data.subarray(0, 4)]).toEqual([200, 200, 200, 255])
    painter.paint({ width: 2, height: 1, pixels: new Uint8Array([0, 0]) }, PALETTE, image, true)
    const first = image.data[0] ?? 0
    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThan(200)
    expect(painter.fading).toBe(true)
    let frames = 0
    while (painter.fading && frames < 30) {
      painter.paint({ width: 2, height: 1, pixels: new Uint8Array([0, 0]) }, PALETTE, image, true)
      frames++
    }
    expect(image.data[0]).toBe(0)
    // A tail of a few frames, not a smear.
    expect(frames).toBeLessThan(12)
  })

  it('snaps without the glow, and on a new start', () => {
    const painter = new Painter()
    const image = out()
    painter.paint({ width: 2, height: 1, pixels: new Uint8Array([1, 0]) }, PALETTE, image, false)
    painter.paint({ width: 2, height: 1, pixels: new Uint8Array([0, 0]) }, PALETTE, image, false)
    expect(image.data[0]).toBe(0)
    expect(painter.fading).toBe(false)
  })
})

describe('the buzzer', () => {
  it('rises an octave for 48 steps of pitch', () => {
    expect(patternRate(64)).toBe(4000)
    expect(patternRate(112)).toBeCloseTo(8000)
    expect(patternRate(16)).toBeCloseTo(2000)
  })

  it('beeps a square wave until a program loads a pattern', () => {
    expect([...toneOf(10, new Uint8Array(16), 64, false).pattern]).toEqual([...BUZZER_PATTERN])
    const own = new Uint8Array(16).fill(0xaa)
    expect([...toneOf(10, own, 64, true).pattern]).toEqual([...own])
    expect(toneOf(6, own, 64, true).seconds).toBeCloseTo(0.1)
  })

  /** Zero crossings from falling to rising, in `samples`. */
  const rises = (samples: Float32Array): number => {
    let n = 0
    for (let k = 1; k < samples.length; k++)
      if ((samples[k - 1] ?? 0) < 0 && (samples[k] ?? 0) >= 0) n++
    return n
  }

  it('plays the buzzer at 500 Hz and stops by itself when its time is up', () => {
    const voice = new PatternVoice(48000)
    voice.set({ seconds: 0.5, pattern: BUZZER_PATTERN.slice(), rate: 4000 })
    const second = new Float32Array(24000)
    voice.render(second)
    expect(Math.abs(rises(second) - 250)).toBeLessThanOrEqual(2)
    const after = new Float32Array(24000)
    voice.render(after)
    // A few milliseconds of fade, then silence.
    expect(after.subarray(1000).every((v) => v === 0)).toBe(true)
    expect(voice.busy).toBe(false)
  })

  it('carries on without a jump when the pitch changes mid-note', () => {
    const voice = new PatternVoice(48000)
    voice.set({ seconds: 1, pattern: BUZZER_PATTERN.slice(), rate: 4000 })
    const a = new Float32Array(128)
    voice.render(a)
    voice.set({ seconds: 1, pattern: BUZZER_PATTERN.slice(), rate: 4400 })
    const b = new Float32Array(128)
    voice.render(b)
    expect(Math.abs((b[0] ?? 0) - (a[127] ?? 0))).toBeLessThan(0.1)
  })

  it('is silent with nothing to play', () => {
    const voice = new PatternVoice(44100)
    const out = new Float32Array(64).fill(1)
    voice.render(out)
    expect(out.every((v) => v === 0)).toBe(true)
  })
})

describe('the CORE reading', () => {
  it('types where a program went in, its size and its quirks, or where it goes on', () => {
    expect(bootLine({ size: 3584, quirks: quirksFor('chip8'), resumed: false, pc: 0x200 })).toBe(
      'LOAD 200 · 3,584 B · VIP',
    )
    expect(bootLine({ size: 246, quirks: quirksFor('xochip'), resumed: true, pc: 0x2a4 })).toBe(
      'RESUME 2A4 · 246 B · XO',
    )
    const custom = { ...quirksFor('schip'), clip: false }
    expect(bootLine({ size: 1, quirks: custom, resumed: false, pc: 0 })).toContain('CUSTOM')
  })

  it('shows the code round the program counter and the stack innermost first', () => {
    const m = Chip8.load(
      new Uint8Array([0x22, 0x04, 0x00, 0x00, 0x22, 0x08, 0x00, 0x00, 0x60, 0x07]),
      { platform: 'chip8', quirks: quirksFor('chip8'), ipf: 1, font: 'octo' },
      1,
    )
    m.step()
    m.step()
    const reading = readCore(m.state)
    expect(reading.pc).toBe(0x208)
    expect(reading.stack).toEqual([0x206, 0x202])
    const current = reading.lines.find((line) => line.current)
    expect(current).toMatchObject({ address: 0x208, text: 'v0 := 0x07' })
    expect(codeAround(m.state, 0x200)[0]?.address).toBe(0x200 - 6)
  })

  it('points at the instruction that stopped it', () => {
    const m = Chip8.load(
      new Uint8Array([0x01, 0x23]),
      { platform: 'chip8', quirks: quirksFor('chip8'), ipf: 1, font: 'octo' },
      1,
    )
    m.step()
    expect(readCore(m.state).pc).toBe(0x200)
    expect(haltLines({ reason: 'illegal', pc: 0x200, op: 0x0123 })).toEqual({
      title: 'ILLEGAL INSTRUCTION',
      detail: '0123 @ 0x200',
      fault: true,
    })
    expect(haltLines({ reason: 'exit', pc: 0x2a0, op: 0x00fd }).fault).toBe(false)
  })

  it('marks the registers that changed', () => {
    expect([...changedRegisters([1, 2, 3], [1, 5, 3])]).toEqual([1])
    expect(changedRegisters(null, [1]).size).toBe(0)
  })
})

describe('the catalog', () => {
  it('reads the bundled programs.json whole', () => {
    const file = path.resolve(__dirname, '..', '..', 'resources', 'chip8', 'programs.json')
    const { entries, dropped } = readCatalog(JSON.parse(readFileSync(file, 'utf8')))
    expect(dropped).toEqual([])
    expect(entries.map((e) => e.id)).toContain('diag/5-quirks')
    for (const entry of entries) {
      const rom = readFileSync(path.join(path.dirname(file), entry.file))
      expect(rom.length, entry.id).toBeGreaterThan(0)
    }
  })

  it('drops a broken or repeated entry on its own, and a file of another version whole', () => {
    const good = {
      id: 'diag/x',
      title: 'X',
      authors: [],
      platform: 'chip8',
      genre: 'diag',
      description: '',
      licence: 'GPL-3.0',
      file: 'test-suite/x.ch8',
    }
    const { entries, dropped } = readCatalog({
      version: 1,
      programs: [good, good, { ...good, id: 'diag/y', file: '../../secret.ch8' }, { id: 5 }],
    })
    expect(entries.map((e) => e.id)).toEqual(['diag/x'])
    expect(dropped).toEqual(['diag/x', 'diag/y', '?'])
    expect(readCatalog({ version: 2, programs: [good] }).entries).toEqual([])
  })

  it('turns chip8Archive’s settings into the machine’s', () => {
    const program = programFromEntry({
      id: 'archive/x',
      title: 'X',
      authors: ['Someone'],
      platform: 'chip8',
      genre: 'action',
      description: '',
      licence: 'CC0-1.0',
      file: 'archive/x.ch8',
      octo: { shiftQuirks: true, vBlankQuirks: false },
      fontStyle: 'vip',
      screenRotation: 90,
      keys: 0,
    })
    expect(program.ipf).toBe(DEFAULT_IPF.chip8)
    expect(program.quirks).toEqual({ ...quirksFor('chip8'), shiftVx: true, displayWait: false })
    expect(program.font).toBe('vip')
    expect(program.rotation).toBe(90)
    expect('file' in program).toBe(false)
  })
})

describe('the settings', () => {
  it('show the core and set the buzzer at half by default, and take a patch', () => {
    expect(defaultSettings().chip8).toEqual({ core: true, volume: 0.5 })
    const next = applySettingsPatch(defaultSettings(), { chip8: { core: false } })
    expect(next?.chip8).toEqual({ core: false, volume: 0.5 })
    expect(applySettingsPatch(defaultSettings(), { chip8: { volume: 2 } })?.chip8.volume).toBe(0.5)
  })
})

afterEach(() => {
  vi.useRealTimers()
})
