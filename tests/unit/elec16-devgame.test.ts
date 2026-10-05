import {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { type CartHeader, makeCart } from '@shared/elec16/cartridge'
import { BANK_SIZE } from '@shared/elec16/map'
import { toBase64 } from '@shared/emu/base64'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type DevPage, devHandlers } from '../../src/main/elec16/dev-handlers.js'
import {
  changeCounts,
  DevFolders,
  devKey,
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

  it('reads nothing through a link out of the folder, game.json included', () => {
    const outside = mkdtempSync(path.join(tmpdir(), 'elecdex-out-'))
    try {
      writeFileSync(path.join(outside, 'secret.txt'), 'SECRET')
      // A folder picked through a link of its own is read where the link leads.
      const own = { ...META, sources: ['secret.txt'], sheets: [], music: [] }
      writeFileSync(
        path.join(outside, 'game.json'),
        JSON.stringify({ ...own, palettes: { png: 'secret.txt', names: ['a'] } }),
      )
      // A junction needs no privilege on Windows; elsewhere it is a directory symlink.
      symlinkSync(outside, path.join(dir, 'lib'), 'junction')
      put('game.json', JSON.stringify({ ...META, sources: ['lib/secret.txt'] }))
      expect(readGameFolder(dir)).toEqual({
        ok: false,
        problem: 'lib/secret.txt is not inside the folder',
      })
      rmSync(path.join(dir, 'game.json'))
      symlinkSync(outside, path.join(dir, 'inner'), 'junction')
      expect(readGameFolder(path.join(dir, 'inner')).ok).toBe(true)
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  })

  it('refuses a game.json too big to be one, before reading it', () => {
    put('game.json', new Uint8Array(256 * 1024 + 1).fill(0x20))
    expect(readGameFolder(dir)).toEqual({ ok: false, problem: 'game.json is more than 256 kB' })
  })

  it('keeps a file named __proto__ as a file, not a prototype', () => {
    put('game.json', JSON.stringify({ ...META, sources: ['__proto__'], sheets: [], music: [] }))
    put('__proto__', 'code')
    put('art/pal.png', new Uint8Array([1]))
    const read = readGameFolder(dir)
    if (!read.ok) throw new Error(read.problem)
    expect(Object.entries(read.files.texts)).toEqual([['__proto__', 'code']])
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

  it('never writes through a file left where its temporary file goes', () => {
    const outside = mkdtempSync(path.join(tmpdir(), 'elecdex-out-'))
    try {
      const victim = path.join(outside, 'victim.txt')
      writeFileSync(victim, 'ORIGINAL')
      linkSync(victim, path.join(dir, 'compiled.s.tmp'))
      writeBack(dir, 'A', 'BUILT')
      expect(readFileSync(victim, 'utf8')).toBe('ORIGINAL')
      expect(readFileSync(path.join(dir, 'compiled.s'), 'utf8')).toBe('BUILT')
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  })

  it("writes the template into an empty folder, never over a game, and the app's template builds", () => {
    expect(writeTemplate(dir, { 'game.json': '{}', 'art/a.png': new Uint8Array([1]) })).toBeNull()
    expect(existsSync(path.join(dir, 'art', 'a.png'))).toBe(true)
    expect(writeTemplate(dir, { 'game.json': 'over it' })).toBe('NEW GAME needs an empty folder')
    expect(readFileSync(path.join(dir, 'game.json'), 'utf8')).toBe('{}')
    const template = templateFiles('resources/elec16/kit-template')
    const other = path.join(dir, 'project')
    mkdirSync(other)
    writeFileSync(path.join(other, 'README.md'), 'MINE')
    expect(writeTemplate(other, { 'README.md': 'TEMPLATE', 'game.json': '{}' })).toBe(
      'NEW GAME needs an empty folder',
    )
    expect(readFileSync(path.join(other, 'README.md'), 'utf8')).toBe('MINE')
    expect(existsSync(path.join(other, 'game.json'))).toBe(false)
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
    const key = devKey(1, 'p1')
    folders.open(key, dir)
    folders.watch(key, true, () => {
      told++
    })
    expect(folders.watching()).toEqual([key])
    writeBack(dir, 'A', 'C')
    await new Promise((r) => setTimeout(r, 700))
    expect(told).toBe(0)
    put('main.e16.ts', 'changed')
    put('main.e16.ts', 'changed again')
    await new Promise((r) => setTimeout(r, 900))
    expect(told).toBe(1)
    folders.watch(key, false, () => {})
    expect(folders.watching()).toEqual([])
    folders.close(key)
    expect(folders.dirOf(key)).toBeNull()
  })

  it('tells nothing once the watch is off, even of a change made just before', async () => {
    const folders = new DevFolders()
    let told = 0
    const key = devKey(1, 'p1')
    folders.open(key, dir)
    folders.watch(key, true, () => {
      told++
    })
    put('main.e16.ts', 'changed')
    await new Promise((r) => setTimeout(r, 100))
    folders.watch(key, false, () => {})
    await new Promise((r) => setTimeout(r, 600))
    expect(told).toBe(0)
    folders.close(key)
  })

  it("keeps each pane's folder apart, and a build of an earlier opening is refused", () => {
    const folders = new DevFolders()
    const a = devKey(1, 'a')
    const b = devKey(1, 'b')
    const first = folders.open(a, dir)
    folders.open(b, path.join(dir, 'other'))
    expect(folders.dirOf(a, first)).toBe(dir)
    expect(folders.dirOf(b)).toBe(path.join(dir, 'other'))
    const second = folders.open(a, path.join(dir, 'again'))
    expect(folders.dirOf(a, first)).toBeNull()
    expect(folders.dirOf(a, second)).toBe(path.join(dir, 'again'))
    expect(folders.state(a)).toEqual({ name: 'again', gen: second })
    folders.closePage(1)
    expect([folders.dirOf(a), folders.dirOf(b)]).toEqual([null, null])
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

  it('never takes the place of a game imported from a file', () => {
    const shelf = new Elec16Games(path.join(dir, 'user'), null, () => 5)
    const file = path.join(dir, 'picked.e16g')
    writeFileSync(file, cart({ id: 'SPACE' }, 7))
    expect(shelf.import(file)).toEqual({ ok: true, id: 'SPACE' })
    expect(shelf.importBuilt(cart({ id: 'SPACE' }, 8), 'space')).toEqual({
      ok: false,
      problem: 'SPACE is the id of a game imported from a file: take it off the shelf first',
    })
    expect(shelf.image('SPACE')?.image[64]).toBe(7)
  })
})

describe("DEVELOP's channels", () => {
  const page = (id = 1): DevPage & { gone: boolean } => ({
    id,
    gone: false,
    isDestroyed() {
      return this.gone
    },
  })
  const desk = (pick: string | undefined, template: Record<string, Uint8Array> | null = {}) => {
    const folders = new DevFolders()
    const told: string[] = []
    const installed: string[] = []
    const handlers = devHandlers({
      folders,
      pick: async () => pick,
      template: () => template,
      install: (image, from) => {
        installed.push(`${from} ${image.length}`)
        return { ok: true, id: 'MINE' }
      },
      opened: () => {},
      changed: (_page, pane) => void told.push(pane),
    })
    return { folders, handlers, told, installed }
  }

  it('keeps a folder for each pane, checked by its id, and refuses a build of an earlier opening', async () => {
    const { folders, handlers, installed } = desk(dir)
    const p = page()
    expect(await handlers.open(p, '')).toBeNull()
    expect(await handlers.open(p, 'x'.repeat(65))).toBeNull()
    expect(folders.keys()).toEqual([])
    const first = await handlers.open(p, 'a')
    const other = await handlers.open(p, 'b')
    if (first?.ok !== true || other?.ok !== true) throw new Error('not opened')
    expect(handlers.state(p, 'a')).toEqual({ name: path.basename(dir), gen: first.gen })
    expect(handlers.state(page(2), 'a')).toBeNull()
    const again = await handlers.open(p, 'a')
    if (again?.ok !== true) throw new Error('not opened')
    expect(handlers.read(p, 'a', first.gen)).toEqual({ ok: false, problem: 'no folder is open' })
    expect(handlers.write(p, 'a', first.gen, 'A', 'C')).toBe(false)
    expect(existsSync(path.join(dir, 'compiled.s'))).toBe(false)
    expect(handlers.install(p, 'a', first.gen, new Uint8Array(3))).toEqual({
      ok: false,
      problem: 'no folder is open',
    })
    expect(handlers.install(p, 'a', 'one', new Uint8Array(3)).ok).toBe(false)
    expect(handlers.write(p, 'a', again.gen, 'A', 'C')).toBe(true)
    expect(handlers.install(p, 'a', again.gen, new Uint8Array(3))).toEqual({ ok: true, id: 'MINE' })
    expect(installed).toEqual([`${path.basename(dir)} 3`])
    // Pane b's folder is its own.
    expect(handlers.state(p, 'b')?.gen).toBe(other.gen)
    handlers.close(p, 'a')
    expect(folders.keys()).toEqual([devKey(1, 'b')])
  })

  it('keeps nothing for a page that went while its picker was open', async () => {
    const { folders, handlers } = desk(dir)
    const p = page()
    p.gone = true
    expect(await handlers.open(p, 'a')).toBeNull()
    expect(await handlers.create(p, 'a')).toBeNull()
    expect(folders.keys()).toEqual([])
  })

  it('says why a new game was not made, never in silence nor with a path', async () => {
    expect(await desk(dir, null).handlers.create(page(), 'a')).toEqual({
      ok: false,
      problem: 'the game template is not there',
    })
    const thrown = devHandlers({
      folders: new DevFolders(),
      pick: async () => dir,
      template: () => {
        throw new Error(`ENOENT ${dir}`)
      },
      install: () => ({ ok: true, id: 'X' }),
      opened: () => {},
      changed: () => {},
    })
    expect(await thrown.create(page(), 'a')).toEqual({
      ok: false,
      problem: 'the game template is not there',
    })
    const made = await desk(dir, { 'game.json': new Uint8Array([123, 125]) }).handlers.create(
      page(),
      'a',
    )
    expect(made?.ok).toBe(true)
  })

  it('tells a write that failed as false, never a thrown error with its path', async () => {
    const { handlers } = desk(dir)
    const p = page()
    const opened = await handlers.open(p, 'a')
    if (opened?.ok !== true) throw new Error('not opened')
    // compiled.s.tmp a folder: the temporary file cannot be made.
    mkdirSync(path.join(dir, 'compiled.s.tmp'))
    put('compiled.s.tmp/keep', 'x')
    expect(handlers.write(p, 'a', opened.gen, 'A', 'C')).toBe(false)
  })

  it("tells the pane whose folder changed, and not the build's own files nor a tool's", async () => {
    const { handlers, told } = desk(dir)
    const p = page()
    await handlers.open(p, 'a')
    handlers.watch(p, 'a', true)
    put('.git/index', 'x')
    put('node_modules/x/y.js', 'x')
    await new Promise((r) => setTimeout(r, 700))
    expect(told).toEqual([])
    put('main.e16.ts', 'changed')
    await new Promise((r) => setTimeout(r, 700))
    expect(told).toEqual(['a'])
    handlers.watch(p, 'a', false)
    expect(
      ['main.e16.ts', 'art/x.png', '.git', '.git/index', 'a/node_modules/b', 'compiled.s.tmp'].map(
        changeCounts,
      ),
    ).toEqual([true, true, false, false, false, false])
  })

  it('holds game.json to a count of names', () => {
    const many = Array.from({ length: 600 }, (_, k) => `f${k}.e16.ts`)
    expect(listedFiles({ ...META, sources: many })).toBe('game.json names more than 512 files')
  })
})
