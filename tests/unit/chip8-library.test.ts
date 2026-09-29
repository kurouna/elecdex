import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  decodePreview,
  encodePreview,
  litDots,
  pickPreview,
  previewRun,
  type ScreenFrame,
} from '@shared/chip8/preview'
import { quirksFor } from '@shared/chip8/quirks'
import { maxProgramSize } from '@shared/chip8/types'
import { CHIP8_GENRES, programFromEntry, readCatalog } from '@shared/chip8-library'
import { describe, expect, it } from 'vitest'
import { keyWords, programRows, quirkWords } from '../../src/renderer/widgets/chip8/labels.js'

const DIR = path.resolve(__dirname, '..', '..', 'resources', 'chip8')
const catalog = readCatalog(JSON.parse(readFileSync(path.join(DIR, 'programs.json'), 'utf8')))
const rom = (file: string) => new Uint8Array(readFileSync(path.join(DIR, file)))

const frame = (w: number, h: number, lit: (k: number) => number): ScreenFrame => ({
  w,
  h,
  pixels: Uint8Array.from({ length: w * h }, (_, k) => lit(k)),
})

describe('previews', () => {
  it('pack a screen to bits and back, one plane or two', () => {
    const lores = frame(64, 32, (k) => (k % 3 === 0 ? 1 : 0))
    const one = encodePreview(lores, 1)
    expect(one.data.length).toBe(Math.ceil(256 / 3) * 4)
    expect([...(decodePreview(one)?.pixels ?? [])]).toEqual([...lores.pixels])
    const xo = frame(128, 64, (k) => k % 4)
    expect([...(decodePreview(encodePreview(xo, 2))?.pixels ?? [])]).toEqual([...xo.pixels])
  })

  it('refuse a preview that is not whole', () => {
    const good = encodePreview(
      frame(64, 32, () => 1),
      1,
    )
    expect(decodePreview({ ...good, w: 100 })).toBeNull()
    expect(decodePreview({ ...good, data: good.data.slice(4) })).toBeNull()
    expect(decodePreview({ ...good, data: `${good.data.slice(4)}!!!!` })).toBeNull()
    expect(decodePreview({ ...good, planes: 2 })).toBeNull()
  })

  it('pick the fullest frame, but not one nearly all lit, and nothing from blanks', () => {
    const blank = frame(64, 32, () => 0)
    const some = frame(64, 32, (k) => (k < 300 ? 1 : 0))
    const more = frame(64, 32, (k) => (k < 900 ? 1 : 0))
    const flash = frame(64, 32, (k) => (k < 2000 ? 1 : 0))
    expect(pickPreview([blank, some, more, flash])).toBe(more)
    expect(pickPreview([blank, blank])).toBeNull()
    expect(litDots(more)).toBe(900)
  })

  it('come out the same every time for the same bytes', () => {
    const program = rom('test-suite/2-ibm-logo.ch8')
    const config = {
      platform: 'chip8',
      quirks: quirksFor('chip8'),
      ipf: 1000,
      font: 'octo',
    } as const
    const a = previewRun(program, config)
    expect(a).toEqual(previewRun(program, config))
    expect(
      litDots(
        decodePreview(a.preview ?? { w: 0, h: 0, planes: 1, data: '' }) ?? frame(1, 1, () => 0),
      ),
    ).toBe(230)
  })
})

describe('the bundled library', () => {
  it('is whole: 104 of chip8Archive and 8 of the test suite, none dropped', () => {
    expect(catalog.dropped).toEqual([])
    expect(catalog.entries.filter((e) => e.id.startsWith('archive/'))).toHaveLength(104)
    expect(catalog.entries.filter((e) => e.id.startsWith('diag/'))).toHaveLength(8)
  })

  it('has every program in a tab, its bytes in its machine, and a preview that reads', () => {
    for (const entry of catalog.entries) {
      expect(CHIP8_GENRES, entry.id).toContain(entry.genre)
      const bytes = rom(entry.file)
      expect(bytes.length, entry.id).toBeGreaterThan(0)
      expect(bytes.length, entry.id).toBeLessThanOrEqual(maxProgramSize(entry.platform))
      expect(entry.preview, entry.id).toBeDefined()
      if (entry.preview !== undefined) expect(decodePreview(entry.preview), entry.id).not.toBeNull()
      expect(entry.licence).toBe(entry.id.startsWith('diag/') ? 'GPL-3.0' : 'CC0-1.0')
    }
  })

  it('holds the previews and keys the core draws now (run npm run gen:chip8 after changing it)', () => {
    for (const entry of catalog.entries) {
      const program = programFromEntry(entry)
      const run = previewRun(rom(entry.file), {
        platform: program.platform,
        quirks: program.quirks,
        ipf: program.ipf,
        font: program.font,
      })
      expect(entry.preview, entry.id).toEqual(run.preview ?? undefined)
      expect(entry.keys, entry.id).toBe(run.sensed)
    }
  })
})

describe('the words for a program', () => {
  const quirks = quirksFor('chip8')

  it('names a profile, or says what differs from the machine’s own', () => {
    expect(quirkWords('chip8', quirks)).toBe('VIP')
    expect(quirkWords('schip', quirksFor('xochip'))).toBe('XO')
    expect(quirkWords('chip8', { ...quirks, shiftVx: true, displayWait: false })).toBe(
      'VIP, shift vx on, display wait off',
    )
  })

  it('lists the keys as the pad names them', () => {
    expect(keyWords((1 << 4) | (1 << 6) | (1 << 0xe))).toBe('4 6 E')
    expect(keyWords(0)).toBe('')
  })

  it('puts on the card what the row has no room for, never the row again', () => {
    const entry = catalog.entries.find((e) => e.id === 'archive/octoma')
    expect(entry).toBeDefined()
    if (entry === undefined) return
    const program = programFromEntry(entry)
    const text = programRows(program)
      .map((row) => `${row.label} ${row.value}`)
      .join('\n')
    expect(text).toContain('XO-CHIP')
    expect(text).toContain('10,000 instructions a frame')
    for (const shown of [program.title, ...program.authors, program.event ?? '']) {
      if (shown !== '') expect(text, shown).not.toContain(shown)
    }
  })
})
