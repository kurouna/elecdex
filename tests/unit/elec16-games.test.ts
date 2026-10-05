import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { assemble, romImage } from '@shared/elec16/asm'
import { CART_HEADER, CART_MAX_SIZE, type CartHeader, makeCart } from '@shared/elec16/cartridge'
import type { LinkRequest } from '@shared/elec16/link'
import { LINK_SERVICE, LINK_STATUS } from '@shared/elec16/link-services'
import { Elec16 } from '@shared/elec16/machine'
import { BANK_SIZE } from '@shared/elec16/map'
import { toBase64 } from '@shared/emu/base64'
import { linkSettings, SettingsSchema } from '@shared/settings'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Elec16Games } from '../../src/main/elec16/games.js'
import { CART_TYPE, CartLinkService } from '../../src/main/elec16/link/cart.js'
import { LinkHub, type LinkService } from '../../src/main/elec16/link/hub.js'
import { Elec16Units } from '../../src/main/elec16/units.js'

/**
 * ELEC-16 PLAY's cartridges in main (docs/elec16-play.md section 7, G4): the game shelf
 * (bundled and imported, apart from CHIP-8's), the game in a unit's slot, the save RAM kept for
 * it, CART answering through LINK, LINK's switch for each service, and the settings from before
 * those switches.
 */

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-games-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const HEADER: CartHeader = { banks: 2, saveBanks: 1, entry: 0xc000, id: 'SPACE', name: 'SPACE RUN' }
const cart = (h: Partial<CartHeader> = {}) =>
  makeCart({ ...HEADER, ...h }, new Uint8Array(4 * BANK_SIZE).fill(0x42))
const sha = (b: Uint8Array) => new Uint8Array(createHash('sha256').update(b).digest())

/** A resources folder with games.json holding these images. */
function resources(images: Uint8Array[]): string {
  const res = path.join(dir, 'resources')
  mkdirSync(path.join(res, 'games'), { recursive: true })
  writeFileSync(
    path.join(res, 'games', 'games.json'),
    JSON.stringify({ games: images.map((g) => ({ data: toBase64(g), about: 'bundled one' })) }),
  )
  return res
}

/** A file to import. */
function file(name: string, bytes: Uint8Array): string {
  const at = path.join(dir, name)
  writeFileSync(at, bytes)
  return at
}

const shelf = (images: Uint8Array[] = []) =>
  new Elec16Games(path.join(dir, 'user'), resources(images), () => 99)

describe('the game shelf', () => {
  it('lists the bundled games, then the imported ones by name, with no images', () => {
    const g = shelf([cart({ id: 'B1', name: 'BUNDLED' })])
    expect(g.import(file('z.e16g', cart({ id: 'ZED', name: 'ZED' })))).toEqual({
      ok: true,
      id: 'ZED',
    })
    expect(g.import(file('a.e16g', cart({ id: 'ACE', name: 'ACE' })))).toEqual({
      ok: true,
      id: 'ACE',
    })
    expect(g.list()).toEqual([
      { id: 'B1', name: 'BUNDLED', banks: 2, saveBanks: 1, bundled: true, about: 'bundled one' },
      { id: 'ACE', name: 'ACE', banks: 2, saveBanks: 1, bundled: false, about: 'a.e16g' },
      { id: 'ZED', name: 'ZED', banks: 2, saveBanks: 1, bundled: false, about: 'z.e16g' },
    ])
    // Another shelf on the same folder reads what was kept.
    expect(
      shelf([])
        .list()
        .map((x) => x.id),
    ).toEqual(['ACE', 'ZED'])
  })

  it('gives a game its image and the hash of it, by id', () => {
    const image = cart()
    const g = shelf([image])
    expect(g.image('SPACE')).toEqual({ image, digest: sha(image) })
    expect(g.image('NONE')).toBeNull()
  })

  it('refuses a file that is not a cartridge, one too big, and an id already on the shelf', () => {
    const g = shelf([cart()])
    expect(g.import(file('x.e16g', new Uint8Array(100)))).toMatchObject({
      ok: false,
      problem: /not an ELEC-16 PLAY cartridge/,
    })
    expect(g.import(file('big.e16g', new Uint8Array(CART_MAX_SIZE + 1)))).toMatchObject({
      ok: false,
      problem: /more than a cartridge holds/,
    })
    expect(g.import(file('dup.e16g', cart()))).toMatchObject({
      ok: false,
      problem: /already on the shelf/,
    })
    expect(g.import(path.join(dir, 'missing.e16g'))).toMatchObject({
      ok: false,
      problem: /could not be read/,
    })
    expect(g.list()).toHaveLength(1)
  })

  it('reads and hashes an imported file once, not on every look', () => {
    const g = shelf([])
    g.import(file('m.e16g', cart({ id: 'MINE' })))
    const first = g.image('MINE')
    g.list()
    expect(g.image('MINE')?.image).toBe(first?.image)
    expect(g.image('MINE')?.digest).toBe(first?.digest)
  })

  it('takes an imported game off, never a bundled one', () => {
    const g = shelf([cart({ id: 'B1' })])
    g.import(file('m.e16g', cart({ id: 'MINE' })))
    expect(g.remove('B1')).toBe(false)
    expect(g.remove('MINE')).toBe(true)
    expect(g.remove('MINE')).toBe(false)
    expect(g.list().map((x) => x.id)).toEqual(['B1'])
    expect(g.image('MINE')).toBeNull()
  })

  it('drops an imported game whose file went or no longer reads, alone', () => {
    const g = shelf([])
    g.import(file('a.e16g', cart({ id: 'ACE' })))
    g.import(file('b.e16g', cart({ id: 'BEE' })))
    const kept = path.join(
      dir,
      'user',
      'games',
      `${Buffer.from(sha(cart({ id: 'ACE' }))).toString('hex')}.e16g`,
    )
    writeFileSync(kept, new Uint8Array(10))
    expect(g.list().map((x) => x.id)).toEqual(['BEE'])
  })

  it('has no shelf without games.json, and leaves out a broken bundled entry', () => {
    expect(new Elec16Games(path.join(dir, 'user'), null).list()).toEqual([])
    const res = resources([cart()])
    writeFileSync(
      path.join(res, 'games', 'games.json'),
      JSON.stringify({ games: [{ data: '!!' }, { data: toBase64(cart({ id: 'OK' })) }] }),
    )
    expect(new Elec16Games(path.join(dir, 'user'), res).list().map((x) => x.id)).toEqual(['OK'])
  })
})

const units = () => new Elec16Units(path.join(dir, 'elec16'), () => 1234)
const A = { page: 1, pane: 'p1' }
const B = { page: 1, pane: 'p2' }

describe("a unit's slot and the save RAM it keeps", () => {
  it('takes a game in and out only from the pane that holds the unit, by a header id', () => {
    const u = units()
    u.list()
    u.claim('u1', A)
    // A model with no slot takes no game.
    expect(u.setCart('u1', A, 'SPACE')).toBeNull()
    u.update('u1', { model: 'play-320' })
    expect(u.setCart('u1', B, 'SPACE')).toBeNull()
    expect(u.setCart('u1', A, 'space')).toBeNull()
    expect(u.setCart('u1', A, 'SPACE')?.cart).toBe('SPACE')
    expect(units().unit('u1')?.cart).toBe('SPACE')
    expect(u.setCart('u1', A, null)).not.toHaveProperty('cart')
    expect(units().unit('u1')).not.toHaveProperty('cart')
  })

  it('keeps the save RAM of the game in a backup by its id, and gives it back', () => {
    const u = units()
    u.list()
    u.update('u1', { model: 'play-320' })
    u.claim('u1', A)
    const m = Elec16.boot(romImage(assemble('.org 0x8000\nebreak')), 'play-320')
    const image = cart()
    m.insertCart(image, sha(image))
    m.state.cart?.save.fill(0x77, 0, 3)
    expect(u.save('u1', A, m.snapshot())).toBe(true)
    const kept = u.saveOf('u1', 'SPACE')
    expect(kept?.length).toBe(BANK_SIZE)
    expect(Array.from(kept?.subarray(0, 4) ?? [])).toEqual([0x77, 0x77, 0x77, 0])
    expect(u.saveOf('u1', 'OTHER')).toBeUndefined()
    expect(u.saveOf('u9', 'SPACE')).toBeUndefined()
    expect(u.saveOf('u1', '../x')).toBeUndefined()
  })
})

const request = (type: number): LinkRequest => ({
  serial: 1,
  service: LINK_SERVICE.cart,
  type,
  query: new Uint8Array([0x47]),
  max: 64,
  fresh: false,
})
const ctx = { unit: 'u1', signal: new AbortController().signal }

describe('CART', () => {
  const image = cart()
  const service = (over: Partial<ConstructorParameters<typeof CartLinkService>[0]> = {}) =>
    new CartLinkService({
      hasSlot: () => true,
      inSlot: () => 'SPACE',
      image: (id) => (id === 'SPACE' ? { image, digest: sha(image) } : null),
      saveOf: () => new Uint8Array([5]),
      ...over,
    })

  it('answers INFO with the header of the game in the slot, and nothing more', async () => {
    const answer = await service().ask(request(CART_TYPE.info), ctx)
    expect(answer).toEqual({ status: LINK_STATUS.ready, data: image.slice(0, CART_HEADER) })
  })

  it('answers LOAD with the header and brings the game and its save RAM', async () => {
    const answer = await service().ask(request(CART_TYPE.load), ctx)
    expect(answer.data).toEqual(image.slice(0, CART_HEADER))
    expect(answer.cart).toEqual({ image, digest: sha(image), save: new Uint8Array([5]) })
    const fresh = await service({ saveOf: () => undefined }).ask(request(CART_TYPE.load), ctx)
    expect(fresh.cart).not.toHaveProperty('save')
  })

  it('fails, saying why, with no slot, an empty one, or a game no longer on the shelf', async () => {
    expect(await service({ hasSlot: () => false }).ask(request(0), ctx)).toEqual({
      status: LINK_STATUS.failed,
      note: 'no cartridge slot',
    })
    expect(await service({ hasSlot: () => null }).ask(request(0), ctx)).toMatchObject({
      note: 'no cartridge slot',
    })
    expect(await service({ inSlot: () => null }).ask(request(1), ctx)).toEqual({
      status: LINK_STATUS.failed,
      note: 'no cartridge',
    })
    expect(await service({ inSlot: () => 'GONE' }).ask(request(1), ctx)).toEqual({
      status: LINK_STATUS.failed,
      note: 'GONE is not on the shelf',
    })
  })
})

describe("LINK's switches", () => {
  const echo = (n: number): LinkService => ({
    service: n,
    ask: async () => ({ status: LINK_STATUS.ready, data: new Uint8Array([n]) }),
    forget: () => {},
  })
  const hub = (on: (service: number) => boolean) =>
    new LinkHub({
      services: [echo(0), echo(1)],
      enabled: on,
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (h) => clearTimeout(h as NodeJS.Timeout),
    })
  const ask = (h: LinkHub, service: number) => h.ask('u1', { ...request(0), service })

  it('ask the hub about each service apart', async () => {
    const h = hub((s) => s === 1)
    expect((await ask(h, 0)).status).toBe(LINK_STATUS.off)
    expect((await ask(h, 1)).status).toBe(LINK_STATUS.ready)
    expect((await ask(h, 0)).note).toMatch(/LINK panel/)
  })
})

describe("LINK's settings", () => {
  const link = (raw: unknown) => SettingsSchema.parse({ elec16: { link: raw } }).elec16.link

  it('are on as a whole, the AI off and CART on, for a new install', () => {
    expect(SettingsSchema.parse({}).elec16.link).toEqual({
      on: true,
      ai: { on: false, provider: '' },
      cart: { on: true },
    })
  })

  it("take the one switch from before as the AI's, LINK coming on: nothing new goes out", () => {
    expect(link({ on: true, ai: { provider: 'x' } })).toEqual({
      on: true,
      ai: { on: true, provider: 'x' },
      cart: { on: true },
    })
    expect(link({ on: false, ai: { provider: 'x' } })).toEqual({
      on: true,
      ai: { on: false, provider: 'x' },
      cart: { on: true },
    })
    expect(link({ on: false })).toEqual({
      on: true,
      ai: { on: false, provider: '' },
      cart: { on: true },
    })
  })

  it('leave settings of today as they are, LINK off included', () => {
    const now = { on: false, ai: { on: true, provider: 'p' }, cart: { on: false } }
    expect(link(now)).toEqual(now)
    expect(linkSettings(now)).toBe(now)
    expect(linkSettings(null)).toBeNull()
  })
})
