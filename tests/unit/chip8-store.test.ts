import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Chip8 } from '@shared/chip8/machine'
import { decodePreview } from '@shared/chip8/preview'
import { quirksFor } from '@shared/chip8/quirks'
import { maxProgramSize } from '@shared/chip8/types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Chip8Catalog } from '../../src/main/chip8/catalog.js'
import { Chip8Saves } from '../../src/main/chip8/saves.js'
import { Chip8Store, titleOfFile } from '../../src/main/chip8/store.js'
import { tuningFrom, whenWords } from '../../src/renderer/widgets/chip8/labels.js'

const RESOURCES = path.resolve(__dirname, '..', '..', 'resources', 'chip8')
const LOGO = path.join(RESOURCES, 'test-suite', '2-ibm-logo.ch8')

let dir: string
let outside: string
let clock: number
const catalog = new Chip8Catalog(RESOURCES)
const store = () => new Chip8Store(catalog, path.join(dir, 'chip8'), () => clock)

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-chip8-'))
  outside = path.join(dir, 'picked')
  mkdirSync(outside)
  clock = Date.UTC(2026, 8, 30, 12, 0)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

/** A file as the user might pick it. */
function picked(name: string, bytes: Uint8Array): string {
  const file = path.join(outside, name)
  writeFileSync(file, bytes)
  return file
}

/** A running machine's snapshot, for the saves. */
function machine(platform: 'chip8' | 'xochip' = 'chip8'): Uint8Array {
  const rom = new Uint8Array(readFileSync(LOGO))
  const m = Chip8.load(rom, { platform, quirks: quirksFor(platform), ipf: 30, font: 'octo' }, 1)
  for (let k = 0; k < 20; k++) m.frame()
  return m.snapshot()
}

describe('importing a program', () => {
  it('keeps a picked file under its hash, guesses its machine and previews it', async () => {
    const lib = store()
    const result = await lib.importFile(picked('ibm_logo-v2.ch8', readFileSync(LOGO)))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.already).toBe(false)
    expect(result.guess).toBe('plain')
    const { program } = result
    expect(program.id).toMatch(/^imported\/[0-9a-f]{16}$/)
    expect(program.title).toBe('ibm logo v2')
    expect(program.platform).toBe('chip8')
    expect(program.genre).toBe('imported')
    expect(program.source).toEqual({ name: 'ibm_logo-v2.ch8', size: 132, at: clock })
    // The IBM logo drew, and its preview is that.
    const frame = program.preview === undefined ? null : decodePreview(program.preview)
    expect(frame?.pixels.some((dot) => dot !== 0)).toBe(true)
    // Its bytes are the file's, from main's copy: the file picked may go.
    rmSync(path.join(outside, 'ibm_logo-v2.ch8'))
    expect(await lib.rom(program.id)).toEqual(new Uint8Array(readFileSync(LOGO)))
    // Listed after the bundled ones, in a new store too (read from library.json).
    const list = await store().programs()
    expect(list.at(-1)?.id).toBe(program.id)
    expect(list.filter((p) => p.genre !== 'imported').length).toBe(
      (await catalog.programs()).length,
    )
  })

  it('takes the same bytes twice as one program', async () => {
    const lib = store()
    const first = await lib.importFile(picked('a.ch8', readFileSync(LOGO)))
    const second = await lib.importFile(picked('b.c8', readFileSync(LOGO)))
    expect(second.ok && second.already).toBe(true)
    expect(first.ok && second.ok && first.program.id === second.program.id).toBe(true)
    expect((await lib.programs()).filter((p) => p.genre === 'imported')).toHaveLength(1)
  })

  it('refuses an empty file, one too big for any machine, and a folder', async () => {
    const lib = store()
    const empty = await lib.importFile(picked('empty.ch8', new Uint8Array(0)))
    expect(empty).toEqual({ ok: false, problem: 'That file is empty.' })
    const big = await lib.importFile(
      picked('big.bin', new Uint8Array(maxProgramSize('xochip') + 1)),
    )
    expect(big.ok).toBe(false)
    expect(!big.ok && big.problem).toContain('65,025 bytes')
    expect((await lib.importFile(outside)).ok).toBe(false)
    expect((await lib.importFile(path.join(outside, 'nothing.ch8'))).ok).toBe(false)
    expect(existsIn(path.join(dir, 'chip8', 'imported'))).toEqual([])
  })

  it('takes a program too big for CHIP-8 for XO-CHIP, and will not run it as less', async () => {
    const lib = store()
    const bytes = new Uint8Array(maxProgramSize('schip') + 10)
    bytes.set([0x12, 0x00])
    const result = await lib.importFile(picked('big.xo8', bytes))
    expect(result.ok && result.program.platform).toBe('xochip')
    expect(result.ok && result.guess).toBe('size')
    const id = result.ok ? result.program.id : ''
    expect(lib.update(id, { platform: 'chip8' })).toBeNull()
    expect((await lib.programs()).find((p) => p.id === id)?.platform).toBe('xochip')
  })
})

describe('an imported program', () => {
  async function imported(lib: Chip8Store): Promise<string> {
    const result = await lib.importFile(picked('logo.ch8', readFileSync(LOGO)))
    if (!result.ok) throw new Error(result.problem)
    return result.program.id
  }

  it('is renamed and run as another machine, which drops its tuning', async () => {
    const lib = store()
    const id = await imported(lib)
    expect(await lib.tune(id, { ipf: 100 })).toBe(true)
    expect(lib.update(id, { title: '  Logo  ' })).toEqual({ machine: false })
    let program = (await lib.programs()).find((p) => p.id === id)
    expect(program?.title).toBe('Logo')
    expect(program?.tuning).toEqual({ ipf: 100 })
    expect(lib.update(id, { platform: 'schip' })).toEqual({ machine: true })
    program = (await lib.programs()).find((p) => p.id === id)
    expect(program?.platform).toBe('schip')
    expect(program?.quirks).toEqual(quirksFor('schip'))
    expect(program?.tuning).toBeUndefined()
  })

  it('refuses a change that is not one: an empty title, a bundled program, an unknown id', async () => {
    const lib = store()
    const id = await imported(lib)
    expect(lib.update(id, { title: '   ' })).toBeNull()
    expect(lib.update(id, { platform: 'pdp-11' })).toBeNull()
    expect(lib.update('diag/2-ibm-logo', { title: 'mine' })).toBeNull()
    expect(lib.update('imported/0000000000000000', { title: 'x' })).toBeNull()
  })

  it('is removed with its file, its tuning and its star; a bundled one is not', async () => {
    const lib = store()
    const id = await imported(lib)
    await lib.tune(id, { ipf: 7 })
    await lib.favourite(id, true)
    expect(lib.remove('diag/2-ibm-logo')).toBe(false)
    expect(lib.remove(id)).toBe(true)
    expect((await lib.programs()).some((p) => p.id === id)).toBe(false)
    expect(await lib.rom(id)).toBeNull()
    expect(await lib.has(id)).toBe(false)
    expect(existsIn(path.join(dir, 'chip8', 'imported'))).toEqual([])
    const file = JSON.parse(readFileSync(path.join(dir, 'chip8', 'library.json'), 'utf8'))
    expect(file.tuning).toEqual({})
    expect(file.favourites).toEqual([])
  })

  it('whose file has gone is left out of the list rather than listed broken', async () => {
    const lib = store()
    const id = await imported(lib)
    for (const name of existsIn(path.join(dir, 'chip8', 'imported')))
      rmSync(path.join(dir, 'chip8', 'imported', name))
    expect((await store().programs()).some((p) => p.id === id)).toBe(false)
  })
})

describe('tuning and stars', () => {
  it('are kept per program, bundled or not, and read back with the list', async () => {
    const lib = store()
    const [first] = await catalog.programs()
    if (first === undefined) throw new Error('no programs')
    expect(await lib.tune(first.id, { ipf: 200 })).toBe(true)
    expect(await lib.favourite(first.id, true)).toBe(true)
    const again = (await store().programs()).find((p) => p.id === first.id)
    expect(again?.tuning).toEqual({ ipf: 200 })
    expect(again?.favourite).toBe(true)
    expect(await lib.tune(first.id, null)).toBe(true)
    expect(await lib.favourite(first.id, false)).toBe(true)
    const back = (await store().programs()).find((p) => p.id === first.id)
    expect(back?.tuning).toBeUndefined()
    expect(back?.favourite).toBe(false)
  })

  it('refuse what is not a tuning, and a program not in the library', async () => {
    const lib = store()
    expect(await lib.tune('diag/2-ibm-logo', { ipf: 0 })).toBe(false)
    expect(await lib.tune('diag/2-ibm-logo', { quirks: { clip: true } })).toBe(false)
    expect(await lib.tune('../../etc', { ipf: 10 })).toBe(false)
    expect(await lib.tune('diag/not-there', { ipf: 10 })).toBe(false)
    expect(await lib.favourite('diag/2-ibm-logo', 'yes')).toBe(false)
    expect(await lib.favourite('imported/0123456789abcdef', true)).toBe(false)
  })

  it('survive a library.json with broken entries, dropping only those', async () => {
    const file = path.join(dir, 'chip8', 'library.json')
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        imported: [{ id: 'imported/../../x', title: 'bad' }],
        tuning: { 'diag/1-chip8-logo': { ipf: 'fast' }, '..': { ipf: 1 } },
        favourites: ['diag/2-ibm-logo', 'diag/2-ibm-logo', '../x'],
      }),
    )
    const lib = store()
    expect(await lib.tune('diag/2-ibm-logo', { ipf: 30 })).toBe(true)
    const written = JSON.parse(readFileSync(file, 'utf8'))
    expect(written.imported).toEqual([])
    expect(written.tuning).toEqual({ 'diag/2-ibm-logo': { ipf: 30 } })
    expect(written.favourites).toEqual(['diag/2-ibm-logo'])
  })

  it('are what differs from the program in TUNE', () => {
    const program = {
      ipf: 15,
      quirks: quirksFor('chip8'),
    } as Parameters<typeof tuningFrom>[0]
    expect(tuningFrom(program, { ipf: 15, quirks: quirksFor('chip8') })).toBeNull()
    expect(tuningFrom(program, { ipf: 30, quirks: quirksFor('chip8') })).toEqual({ ipf: 30 })
    expect(tuningFrom(program, { ipf: 15, quirks: quirksFor('schip') })).toEqual({
      quirks: quirksFor('schip'),
    })
  })
})

describe('saved machines', () => {
  const saves = () => new Chip8Saves(path.join(dir, 'saves'), () => clock)

  it('are kept per program and slot, with the screen they had', () => {
    const s = saves()
    const bytes = machine()
    const info = s.save('diag/ibm-logo', '1', bytes)
    expect(info?.slot).toBe('1')
    expect(info?.at).toBe(clock)
    const frame = info?.preview === undefined ? null : decodePreview(info.preview)
    expect(frame?.w).toBe(64)
    expect(frame?.pixels.some((dot) => dot !== 0)).toBe(true)
    expect(s.load('diag/ibm-logo', '1')).toEqual(bytes)
    expect(s.load('diag/ibm-logo', '2')).toBeNull()
    expect(
      saves()
        .slots('diag/ibm-logo')
        .map((i) => i.slot),
    ).toEqual(['1'])
    // One folder a program, its slash turned into what an id never holds.
    expect(existsIn(path.join(dir, 'saves'))).toEqual(['diag--ibm-logo'])
  })

  it('keep an XO-CHIP machine and its two planes', () => {
    const info = saves().save('imported/0123456789abcdef', 'auto', machine('xochip'))
    expect(info?.preview?.planes).toBe(2)
  })

  it('refuse what is not a snapshot, a slot or an id, and write nothing for it', () => {
    const s = saves()
    expect(s.save('diag/ibm-logo', '1', new Uint8Array([1, 2, 3]))).toBeNull()
    expect(s.save('diag/ibm-logo', '4', machine())).toBeNull()
    expect(s.save('diag/ibm-logo', '1', Array.from(machine()))).toBeNull()
    expect(s.save('../../x', '1', machine())).toBeNull()
    expect(s.load('diag/ibm-logo', '../../x')).toBeNull()
    expect(existsIn(path.join(dir, 'saves'))).toEqual([])
  })

  it('read a file that is not one of ours as an empty slot', () => {
    const file = path.join(dir, 'saves', 'diag--ibm-logo', 'auto.c8s')
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, 'not a machine')
    expect(saves().load('diag/ibm-logo', 'auto')).toBeNull()
    expect(saves().slots('diag/ibm-logo')).toEqual([])
  })

  it('are forgotten with their program', () => {
    const s = saves()
    s.save('imported/0123456789abcdef', '1', machine())
    s.save('imported/0123456789abcdef', 'auto', machine())
    s.forget('imported/0123456789abcdef')
    expect(s.slots('imported/0123456789abcdef')).toEqual([])
  })
})

describe('the words', () => {
  it('name a file as a title', () => {
    expect(titleOfFile('C:\\games\\Space_Invaders-1978.ch8')).toBe('Space Invaders 1978')
    expect(titleOfFile('/tmp/.ch8')).toBe('Untitled')
    expect(titleOfFile('x'.repeat(200))).toHaveLength(80)
  })

  it('say when, the time alone today', () => {
    const now = new Date(2026, 8, 30, 18, 0).getTime()
    expect(whenWords(new Date(2026, 8, 30, 9, 5).getTime(), now)).toBe('09:05')
    expect(whenWords(new Date(2026, 8, 29, 23, 59).getTime(), now)).toBe('2026-09-29 23:59')
  })
})

function existsIn(folder: string): string[] {
  try {
    return readdirSync(folder)
  } catch {
    return []
  }
}
