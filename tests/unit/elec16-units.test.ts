import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { CARD_STATUS, type CardRequest } from '@shared/elec16/card'
import { cardNameOf, fromMachineText, toMachineText } from '@shared/elec16/charset'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Elec16Units,
  findElec16Dir,
  HAND_OVER_MS,
  readSoftCard,
} from '../../src/main/elec16/units.js'
import { built, switchOn, type } from './elec16-helpers'

vi.mock('electron', () => ({
  app: { getPath: () => '' },
  BrowserWindow: {},
  dialog: {},
  ipcMain: {},
}))
const { importFile } = await import('../../src/main/ipc/elec16.js')

/** main's ELEC-16 units (docs/elec16.md section 8): units, who runs them, backups and cards. */

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-elec16-'))
})
afterEach(() => {
  vi.useRealTimers()
  rmSync(dir, { recursive: true, force: true })
})

const units = () => new Elec16Units(path.join(dir, 'elec16'), () => 1234)
const A = { page: 1, pane: 'p1' }
const B = { page: 1, pane: 'p2' }
const OTHER_PAGE = { page: 2, pane: 'p1' }

/** A machine with a program in it, as bytes. */
function snapshot(line = '10 PRINT 1'): Uint8Array {
  const m = switchOn()
  type(m, `${line}\n`)
  return m.snapshot()
}

const read = (name: string): CardRequest => ({
  op: 'read',
  name,
  newName: '',
  offset: 0,
  length: 100,
  data: null,
  address: 0x7000,
})
const write = (name: string, text: string): CardRequest => ({
  ...read(name),
  op: 'write',
  data: new TextEncoder().encode(text),
  length: text.length,
})

describe('the units', () => {
  it('makes the first unit when there is none, from the seed, and numbers the next', () => {
    const u = units()
    expect(u.list({ clock: 8, model: 'pocket-64' })).toEqual([
      { id: 'u1', name: 'UNIT 1', clock: 8, model: 'pocket-64', autoOff: 10, created: 1234 },
    ])
    expect(u.create().id).toBe('u2')
    expect(
      units()
        .list()
        .map((x) => x.id),
    ).toEqual(['u1', 'u2'])
  })

  it('changes only what TUNE may, checked', () => {
    const u = units()
    u.list()
    expect(u.update('u1', { name: 'DESK', clock: 'max', model: 'handheld-160' })).toMatchObject({
      name: 'DESK',
      clock: 'max',
      model: 'handheld-160',
    })
    expect(u.update('u1', { autoOff: 0 })?.autoOff).toBe(0)
    expect(u.update('u1', { clock: 5 })).toBeNull()
    expect(u.update('u1', { autoOff: 5 })).toBeNull()
    expect(u.update('u1', { name: '\u3042' })).toBeNull()
    expect(u.update('../u1', { name: 'X' })).toBeNull()
    expect(u.update('u9', { name: 'X' })).toBeNull()
  })

  it('gives a unit saved before auto power-off the ten minutes a new one has', () => {
    const file = path.join(dir, 'elec16', 'units.json')
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(
      file,
      JSON.stringify({
        units: [{ id: 'u1', name: 'OLD', clock: 4, model: 'pocket-48', created: 1 }],
      }),
    )
    expect(units().list()[0]?.autoOff).toBe(10)
  })

  it('drops a broken unit alone, never the file', () => {
    const file = path.join(dir, 'elec16', 'units.json')
    units().list()
    const good = JSON.parse(readFileSync(file, 'utf8'))
    writeFileSync(file, JSON.stringify({ version: 1, units: [...good.units, { id: 'x' }, 7] }))
    expect(
      units()
        .list()
        .map((x) => x.id),
    ).toEqual(['u1'])
  })

  it('throws a unit away with its files, but never one held or the last', () => {
    const u = units()
    u.list()
    u.create()
    expect(u.remove('u1')).toBe(true)
    expect(u.remove('u2')).toBe(false)
    u.create()
    u.claim('u2', A)
    expect(u.remove('u2')).toBe(false)
  })
})

describe('who runs a unit', () => {
  it('lets one pane claim it at a time, and gives the backup its release wrote', () => {
    const u = units()
    u.list()
    expect(u.claim('u1', A)).toEqual({ ok: true, snapshot: null })
    expect(u.claim('u1', B)).toEqual({ ok: false })
    expect(u.claim('u1', A).ok).toBe(true)
    const bytes = snapshot()
    expect(u.release('u1', B, bytes)).toBe(false)
    expect(u.release('u1', A, bytes)).toBe(true)
    expect(u.claim('u1', B)).toEqual({ ok: true, snapshot: bytes })
  })

  it('keeps only a backup the core can read back, from the pane that holds the unit', () => {
    const u = units()
    u.list()
    u.claim('u1', A)
    expect(u.save('u1', B, snapshot())).toBe(false)
    expect(u.save('u1', A, new Uint8Array(100))).toBe(false)
    expect(u.save('u1', A, 'text')).toBe(false)
    const bytes = snapshot('20 PRINT 2')
    expect(u.save('u1', A, bytes)).toBe(true)
    // Spoiled on disk, it is no backup: the unit starts afresh.
    const file = path.join(dir, 'elec16', 'units', 'u1', 'ram.e16s')
    expect(new Uint8Array(readFileSync(file))).toEqual(bytes)
    writeFileSync(file, bytes.subarray(0, 100))
    u.release('u1', A, null)
    expect(u.claim('u1', B)).toEqual({ ok: true, snapshot: null })
  })

  it('MOVE HERE asks the holder back and takes the machine it gives', async () => {
    const u = units()
    u.list()
    u.claim('u1', A)
    const given = snapshot('30 PRINT 3')
    const asked: unknown[] = []
    const claim = u.moveHere('u1', OTHER_PAGE, (from) => {
      asked.push(from)
      u.release('u1', from, given)
    })
    expect(await claim).toEqual({ ok: true, snapshot: given })
    expect(asked).toEqual([A])
    expect(u.holders().get('u1')).toEqual(OTHER_PAGE)
  })

  it('MOVE HERE takes the unit anyway when the holder does not answer', async () => {
    vi.useFakeTimers()
    const u = units()
    u.list()
    u.claim('u1', A)
    const claim = u.moveHere('u1', B, () => {})
    await vi.advanceTimersByTimeAsync(HAND_OVER_MS)
    expect((await claim).ok).toBe(true)
    expect(u.release('u1', A, null)).toBe(false)
  })

  it('frees what a page held when it goes', () => {
    const u = units()
    u.list()
    u.create()
    u.claim('u1', A)
    u.claim('u2', OTHER_PAGE)
    expect(u.dropPage(1)).toEqual(['u1'])
    expect([...u.holders().keys()]).toEqual(['u2'])
  })
})

describe('the card', () => {
  it('does commands only for the pane that holds the unit, and keeps the files in card.json', () => {
    const u = units()
    u.list()
    expect(u.card('u1', A, write('A.DAT', 'hi')).status).toBe(CARD_STATUS.noCard)
    u.claim('u1', A)
    expect(u.card('u1', A, write('A.DAT', 'hi'))).toEqual({ status: CARD_STATUS.ok, result: 2 })
    expect(u.card('u1', B, read('A.DAT')).status).toBe(CARD_STATUS.noCard)
    const back = units()
    back.claim('u1', A)
    expect(back.card('u1', A, read('A.DAT')).data).toEqual(new TextEncoder().encode('hi'))
    expect(back.files('u1')).toEqual([{ name: 'A.DAT', size: 2, modified: 1234 }])
    const disk = JSON.parse(
      readFileSync(path.join(dir, 'elec16', 'units', 'u1', 'card.json'), 'utf8'),
    )
    expect(disk.files[0]).toEqual({ name: 'A.DAT', modified: 1234, data: 'aGk=' })
  })

  it('reads the SOFT CARD where the card has no such file, and never writes it', () => {
    const soft = readSoftCard(findElec16Dir(process.cwd()))
    expect(soft.map((f) => f.name)).toContain('PRIMES.BAS')
    const u = new Elec16Units(path.join(dir, 'elec16'), () => 1234, soft)
    u.list()
    u.claim('u1', A)
    expect(u.softFiles()).toContainEqual({
      name: 'PRIMES.BAS',
      size: expect.any(Number),
      modified: 0,
      about: 'THE PRIMES UP TO A NUMBER',
    })
    expect(fromMachineText(u.card('u1', A, read('PRIMES.BAS')).data ?? new Uint8Array())).toMatch(
      /^10 REM PRIMES/,
    )
    expect(u.fileData('u1', 'PRIMES.BAS')).not.toBeNull()
    // A file of the same name on the card is the one read; the SOFT CARD is left as it was.
    expect(u.card('u1', A, write('PRIMES.BAS', 'mine')).status).toBe(CARD_STATUS.ok)
    expect(u.card('u1', A, read('PRIMES.BAS')).data).toEqual(new TextEncoder().encode('mine'))
    expect(u.files('u1').map((f) => f.name)).toEqual(['PRIMES.BAS'])
    expect(u.softFiles().find((f) => f.name === 'PRIMES.BAS')?.size).toBeGreaterThan(4)
    const dirOf = (name: string): CardRequest => ({
      ...read(name),
      op: 'dir',
      address: 0x7000,
      length: 256,
    })
    expect(u.card('u1', A, dirOf('SOFT')).entries?.length).toBe(soft.length)
    expect(u.card('u1', A, dirOf('')).entries).toEqual([{ name: 'PRIMES.BAS', size: 4 }])
    expect(u.card('u1', A, dirOf('OTHER')).status).toBe(CARD_STATUS.noFile)
  })

  it('has no SOFT CARD when soft.json is missing or not one', () => {
    expect(readSoftCard(null)).toEqual([])
    const elec16 = path.join(dir, 'resources', 'elec16')
    rmSync(elec16, { recursive: true, force: true })
    expect(findElec16Dir(dir)).toBeNull()
    mkdirSync(elec16, { recursive: true })
    writeFileSync(path.join(elec16, 'soft.json'), '{"files":[{"name":"../X","data":""}]}')
    expect(findElec16Dir(path.join(dir, 'a', 'b'))).toBe(elec16)
    expect(readSoftCard(elec16)).toEqual([])
    writeFileSync(path.join(elec16, 'soft.json'), 'not json')
    expect(readSoftCard(elec16)).toEqual([])
  })

  it('checks a request again and its names, whatever the page says', () => {
    const u = units()
    u.list()
    u.claim('u1', A)
    expect(u.card('u1', A, { ...read('a.dat') }).status).toBe(CARD_STATUS.badName)
    expect(u.card('u1', A, { ...read('A'), op: 'format' }).status).toBe(CARD_STATUS.noCard)
    expect(u.card('u1', A, { ...write('A', 'x'), data: new Uint8Array(40_000) }).status).toBe(
      CARD_STATUS.noCard,
    )
    expect(
      u.card('u1', A, {
        op: 'rename',
        name: 'A',
        newName: '..',
        offset: 0,
        length: 0,
        data: null,
        address: 0,
      }).status,
    ).toBe(CARD_STATUS.badName)
  })

  it('drops a broken file on the card alone', () => {
    const u = units()
    u.list()
    u.claim('u1', A)
    u.card('u1', A, write('A.DAT', 'hi'))
    const file = path.join(dir, 'elec16', 'units', 'u1', 'card.json')
    const good = JSON.parse(readFileSync(file, 'utf8'))
    writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        files: [...good.files, { name: 'bad name', data: '', modified: 0 }],
      }),
    )
    expect(
      units()
        .files('u1')
        .map((f) => f.name),
    ).toEqual(['A.DAT'])
  })
})

describe('IMPORT and the character set', () => {
  it('turns a listing into the machine text, a line a CR, kana included, and back', () => {
    const made = toMachineText('\uFEFF10 PRINT "\uFF71\uFF72"\r\n\r\n20 END\n')
    expect('bytes' in made && Array.from(made.bytes)).toEqual([
      ...Array.from('10 PRINT "', (c) => c.charCodeAt(0)),
      0xb1,
      0xb2,
      0x22,
      0x0d,
      ...Array.from('20 END', (c) => c.charCodeAt(0)),
      0x0d,
    ])
    if ('bytes' in made)
      expect(fromMachineText(made.bytes)).toBe('10 PRINT "\uFF71\uFF72"\r\n20 END\r\n')
    expect(toMachineText('10 PRINT "\u3042"')).toEqual({
      problem: 'Line 1 has "\u3042" (U+3042), which the ELEC-16 cannot show.',
    })
  })

  it('names a card file from the PC name', () => {
    expect(cardNameOf('C:\\games\\star-trek.bas', 'BAS')).toBe('STARTREK.BAS')
    expect(cardNameOf('/tmp/\u3042.dat')).toBe('IMPORT.DAT')
    expect(cardNameOf('data.json')).toBe('DATA.JSO')
  })

  it('imports a listing, an assembly source for the code area, and raw bytes; refuses the too big', () => {
    const at = (name: string, body: string | Uint8Array) => {
      const file = path.join(dir, name)
      writeFileSync(file, body)
      return file
    }
    expect(importFile(at('hello.bas', '10 PRINT 1\n'))).toMatchObject({ name: 'HELLO.BAS' })
    const code = importFile(at('blink.asm', 'start:\n  li a0, 1\n  ret\n'))
    expect(code).toMatchObject({ name: 'BLINK.BIN' })
    expect('bytes' in code && code.bytes.length).toBeGreaterThan(0)
    expect(importFile(at('bad.asm', '  nonsense t9\n'))).toMatchObject({
      problem: expect.stringMatching(/^Line 1:/),
    })
    expect(importFile(at('low.asm', '.org 0x100\n  ret\n'))).toMatchObject({
      problem: expect.stringMatching(/not all in RAM/),
    })
    expect(importFile(at('big.bin', new Uint8Array(40_000)))).toMatchObject({
      problem: expect.stringMatching(/at most/),
    })
    expect(importFile(path.join(dir, 'missing.bin'))).toEqual({
      problem: 'That file could not be read.',
    })
    expect(built.errors).toEqual([])
  })
})
