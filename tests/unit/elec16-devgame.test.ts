import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { type CartHeader, makeCart } from '@shared/elec16/cartridge'
import { BANK_SIZE } from '@shared/elec16/map'
import { toBase64 } from '@shared/emu/base64'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DevFolders,
  insideName,
  listedFiles,
  readGameFolder,
  templateFiles,
  writeBack,
  writeTemplate,
} from '../../src/main/elec16/devgame.js'
import { Elec16Games } from '../../src/main/elec16/games.js'

/**
 * ELEC-16 PLAY's development folders in main (docs/elec16-play.md section 11): only what
 * game.json names is read, only inside the folder and within its sizes; only the build's two
 * files are written back, and only when they change; a new game never goes over one; the
 * watch tells of the author's changes and not of its own; a build takes its earlier build's
 * place on the shelf, never a bundled game's.
 */

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-dev-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const put = (name: string, content: string | Uint8Array) => {
  const file = path.join(dir, name)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
}

const META = {
  id: 'MINE',
  name: 'MINE',
  sources: ['main.e16.ts', { file: 'far.e16.ts', bank: 1 }],
  palettes: { png: 'art/pal.png', names: ['a'] },
  sheets: [{ png: 'art/ship.png' }],
  music: ['music/songs.mml'],
}

describe("a game folder's files", () => {
  it('keeps names inside the folder', () => {
    expect(['main.e16.ts', 'art/ship.png', 'art\\ship.png'].map(insideName)).toEqual([
      true,
      true,
      true,
    ])
    expect(['../x.ts', 'a/../../x', '/etc/x', 'C:/x', 'a//b', ''].map(insideName)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ])
    expect(listedFiles({ ...META, music: ['../secret.mml'] })).toBe(
      '../secret.mml is not a file inside the folder',
    )
    expect(listedFiles({ id: 'X' })).toMatch(/not a kit game/)
  })

  it('reads game.json and only the files it names, texts and pictures apart', () => {
    put('game.json', JSON.stringify(META))
    put('main.e16.ts', 'main')
    put('far.e16.ts', 'far')
    put('music/songs.mml', 'song x')
    put('art/pal.png', new Uint8Array([1, 2]))
    put('art/ship.png', new Uint8Array([3]))
    put('notes.txt', 'not named, not read')
    const read = readGameFolder(dir)
    if (!read.ok) throw new Error(read.problem)
    expect(Object.keys(read.files.texts).sort()).toEqual([
      'far.e16.ts',
      'main.e16.ts',
      'music/songs.mml',
    ])
    expect(Object.keys(read.files.pictures).sort()).toEqual(['art/pal.png', 'art/ship.png'])
    expect(read.files.texts['music/songs.mml']).toBe('song x')
  })

  it('says what is missing, what is too big, and a game.json that does not parse', () => {
    expect(readGameFolder(dir)).toEqual({ ok: false, problem: 'the folder has no game.json' })
    put('game.json', '{ broken')
    const broken = readGameFolder(dir)
    expect(broken.ok === false && broken.problem.startsWith('game.json:')).toBe(true)
    put('game.json', JSON.stringify(META))
    expect(readGameFolder(dir)).toEqual({ ok: false, problem: 'main.e16.ts could not be read' })
    put('main.e16.ts', new Uint8Array(4 * 1024 * 1024 + 1))
    expect(readGameFolder(dir)).toEqual({ ok: false, problem: 'main.e16.ts is more than 4 MB' })
  })
})

describe("what main writes into a game's folder", () => {
  it('writes assets.e16.ts and compiled.s, and leaves them be when unchanged', () => {
    writeBack(dir, 'A', 'C')
    expect(readFileSync(path.join(dir, 'assets.e16.ts'), 'utf8')).toBe('A')
    expect(readFileSync(path.join(dir, 'compiled.s'), 'utf8')).toBe('C')
    const before = statSync(path.join(dir, 'compiled.s')).mtimeMs
    writeBack(dir, 'A2', 'C')
    expect(readFileSync(path.join(dir, 'assets.e16.ts'), 'utf8')).toBe('A2')
    expect(statSync(path.join(dir, 'compiled.s')).mtimeMs).toBe(before)
  })

  it("writes the template into an empty folder, never over a game, and the app's template builds", () => {
    expect(writeTemplate(dir, { 'game.json': '{}', 'art/a.png': new Uint8Array([1]) })).toBeNull()
    expect(existsSync(path.join(dir, 'art', 'a.png'))).toBe(true)
    expect(writeTemplate(dir, { 'game.json': 'over it' })).toBe(
      'the folder already has a game.json',
    )
    expect(readFileSync(path.join(dir, 'game.json'), 'utf8')).toBe('{}')
    const template = templateFiles('resources/elec16/kit-template')
    expect(Object.keys(template)).toEqual(
      expect.arrayContaining([
        'game.json',
        'main.e16.ts',
        'art/palettes.png',
        'art/ship.png',
        'music/songs.mml',
      ]),
    )
  })
})

describe('the watch on a game folder', () => {
  it("tells of the author's changes once they settle, not of the build's own two files", async () => {
    const folders = new DevFolders()
    let told = 0
    folders.open(1, dir)
    folders.watch(1, true, () => {
      told++
    })
    expect(folders.watching()).toEqual(['1'])
    writeBack(dir, 'A', 'C')
    await new Promise((r) => setTimeout(r, 700))
    expect(told).toBe(0)
    put('main.e16.ts', 'changed')
    put('main.e16.ts', 'changed again')
    await new Promise((r) => setTimeout(r, 900))
    expect(told).toBe(1)
    folders.watch(1, false, () => {})
    expect(folders.watching()).toEqual([])
    folders.close(1)
    expect(folders.dirOf(1)).toBeNull()
  })
})

describe('a build on the shelf', () => {
  const HEADER: CartHeader = { banks: 1, saveBanks: 0, entry: 0xc000, id: 'MINE', name: 'MINE' }
  const cart = (h: Partial<CartHeader>, fill: number) =>
    makeCart({ ...HEADER, ...h }, new Uint8Array(BANK_SIZE).fill(fill))

  it("takes its earlier build's place, never a bundled game's", () => {
    const res = path.join(dir, 'res')
    mkdirSync(path.join(res, 'games'), { recursive: true })
    writeFileSync(
      path.join(res, 'games', 'games.json'),
      JSON.stringify({ games: [{ data: toBase64(cart({ id: 'BUNDLED' }, 1)), about: '' }] }),
    )
    const shelf = new Elec16Games(path.join(dir, 'user'), res, () => 5)
    expect(shelf.importBuilt(cart({}, 2), 'mine')).toEqual({ ok: true, id: 'MINE' })
    expect(shelf.importBuilt(cart({}, 3), 'mine')).toEqual({ ok: true, id: 'MINE' })
    expect(shelf.list().filter((g) => g.id === 'MINE')).toHaveLength(1)
    expect(shelf.image('MINE')?.image[64]).toBe(3)
    expect(shelf.importBuilt(cart({ id: 'BUNDLED' }, 4), 'x')).toEqual({
      ok: false,
      problem: 'BUNDLED is the id of a game that comes with the app',
    })
    expect(shelf.importBuilt(new Uint8Array([1, 2, 3]), 'x').ok).toBe(false)
  })
})
