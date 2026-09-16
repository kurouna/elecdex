import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PluginFolder, TYPES_FILE } from '@main/plugins/folder'
import { PluginNet, type PluginNetDeps, responseHeaders } from '@main/plugins/net'
import { PluginStorage } from '@main/plugins/storage'
import { grantFor, NO_PERMISSIONS, PLUGIN_LIMITS } from '@shared/plugins'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Main's side of plugins: the folder, requests for plugins, and their storage. */

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-plugins-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const folderAt = (sub = 'plugins', types = '// types v1') =>
  new PluginFolder({
    dir: path.join(dir, sub),
    types,
    sample: { 'pomodoro/index.ts': 'export default {}', 'pomodoro/timer.ts': 'export {}' },
  })

describe('the plugins folder', () => {
  it('writes the sample once: a folder that exists, even emptied, is never filled again', () => {
    const folder = folderAt()
    folder.prepare()
    expect(folder.scan().map((p) => p.key)).toEqual(['pomodoro'])
    rmSync(path.join(folder.dir, 'pomodoro'), { recursive: true })
    folder.prepare()
    expect(folder.scan()).toEqual([])
  })

  it('keeps the type definitions in step with the build, over hand edits', () => {
    folderAt().prepare()
    const types = path.join(dir, 'plugins', TYPES_FILE)
    writeFileSync(types, 'edited')
    folderAt('plugins', '// types v2').prepare()
    expect(readFileSync(types, 'utf8')).toBe('// types v2')
  })

  it('reads single files and folders, and a folder’s own imports become requires', () => {
    const folder = folderAt()
    folder.prepare()
    writeFileSync(path.join(folder.dir, 'clock.ts'), 'const n: number = 1\nexport default { n }')
    writeFileSync(path.join(folder.dir, 'notes.d.ts'), 'export {}')
    writeFileSync(path.join(folder.dir, 'readme.md'), '# not code')
    const found = folder.scan()
    expect(found.map((p) => p.key)).toEqual(['clock.ts', 'pomodoro'])
    const pomodoro = found.find((p) => p.key === 'pomodoro')
    expect(pomodoro).toMatchObject({ entry: 'index.ts', error: null })
    expect(pomodoro?.code).toContain('"timer.ts": function (module, exports, require)')
    expect(found[0]?.code).not.toContain(': number')
  })

  it('changes a plugin’s hash when any of its files changes', () => {
    const folder = folderAt()
    folder.prepare()
    const before = folder.scan()[0]?.hash
    writeFileSync(path.join(folder.dir, 'pomodoro', 'timer.ts'), 'export const x = 2')
    expect(folder.scan()[0]?.hash).not.toBe(before)
  })

  it('isolates a plugin that does not parse or has no entry, and reads the rest', () => {
    const folder = folderAt()
    folder.prepare()
    writeFileSync(path.join(folder.dir, 'broken.ts'), 'export default {{{')
    mkdirSync(path.join(folder.dir, 'data'))
    writeFileSync(path.join(folder.dir, 'data', 'a.ts'), 'export {}')
    const found = folder.scan()
    expect(found.find((p) => p.key === 'broken.ts')).toMatchObject({ code: null })
    expect(found.find((p) => p.key === 'data')?.error).toMatch(/index\.ts/)
    expect(found.find((p) => p.key === 'pomodoro')?.error).toBeNull()
  })

  it('refuses a plugin over the size or file limits without reading it whole', () => {
    const folder = folderAt()
    folder.prepare()
    writeFileSync(path.join(folder.dir, 'big.ts'), 'x'.repeat(PLUGIN_LIMITS.sourceBytes + 1))
    const many = path.join(folder.dir, 'many')
    mkdirSync(many)
    writeFileSync(path.join(many, 'index.ts'), 'export default {}')
    for (let i = 0; i < PLUGIN_LIMITS.files; i++) writeFileSync(path.join(many, `f${i}.ts`), '')
    const found = folder.scan()
    expect(found.find((p) => p.key === 'big.ts')?.error).toMatch(/too large/)
    expect(found.find((p) => p.key === 'many')?.error).toMatch(/more than 64/)
  })

  it('does not descend past the depth limit or into node_modules', () => {
    const folder = folderAt()
    folder.prepare()
    const deep = path.join(folder.dir, 'pomodoro', 'a', 'b', 'c', 'd')
    mkdirSync(deep, { recursive: true })
    writeFileSync(path.join(deep, 'deep.ts'), 'export {}')
    mkdirSync(path.join(folder.dir, 'pomodoro', 'node_modules', 'x'), { recursive: true })
    writeFileSync(path.join(folder.dir, 'pomodoro', 'node_modules', 'x', 'index.ts'), 'export {}')
    const code = folder.scan()[0]?.code ?? ''
    expect(code).not.toContain('deep.ts')
    expect(code).not.toContain('node_modules')
  })

  it('does not follow a symbolic link out of the folder', (context) => {
    const folder = folderAt()
    folder.prepare()
    const outside = path.join(dir, 'outside')
    mkdirSync(outside)
    writeFileSync(path.join(outside, 'index.ts'), 'export default { secret: 1 }')
    // A junction needs no privilege on Windows; a file link needs developer mode there.
    symlinkSync(outside, path.join(folder.dir, 'linked'), 'junction')
    expect(folder.scan().map((p) => p.key)).toEqual(['pomodoro'])
    try {
      symlinkSync(path.join(outside, 'index.ts'), path.join(folder.dir, 'linked.ts'))
    } catch {
      context.skip()
    }
    expect(folder.scan().map((p) => p.key)).toEqual(['pomodoro'])
  })
})

describe('requests for plugins', () => {
  const granted = {
    ...grantFor(NO_PERMISSIONS),
    hosts: ['api.example.com', 'claude.ai'],
    session: ['claude.ai'],
  }

  function net(
    responses: Array<Awaited<ReturnType<PluginNetDeps['request']>>>,
    extra: Partial<PluginNetDeps> = {},
  ) {
    const request = vi.fn(async () => {
      const next = responses.shift()
      if (!next) throw new Error('no more responses')
      return next
    })
    let now = 0
    const service = new PluginNet({
      grant: (id) => (id === 'on' ? granted : null),
      request,
      now: () => now,
      hostMap: new Map(),
      ...extra,
    })
    return { service, request, tick: (ms: number) => (now += ms) }
  }
  const ok = (body = 'hi') => ({
    status: 200,
    headers: { 'content-type': 'text/plain', 'set-cookie': ['s=1'] },
    body: new TextEncoder().encode(body),
  })

  it('fetches for an enabled plugin only, on a granted host', async () => {
    const { service, request } = net([ok()])
    await expect(service.fetch('off', 'https://api.example.com/', undefined)).rejects.toThrow(
      /not enabled/,
    )
    await expect(service.fetch('on', 'https://evil.example.com/', undefined)).rejects.toThrow(
      /granted/,
    )
    expect(request).not.toHaveBeenCalled()
    await expect(
      service.fetch('on', 'https://api.example.com/x', { cookie: 'a' }),
    ).resolves.toEqual({
      status: 200,
      headers: { 'content-type': 'text/plain' },
      body: 'hi',
    })
    expect(request).toHaveBeenCalledWith(
      'on',
      expect.objectContaining({ url: 'https://api.example.com/x', session: false, headers: {} }),
    )
  })

  it('sends the sign-in session only to the hosts listed for it', async () => {
    const { service, request } = net([ok(), ok()])
    await service.fetch('on', 'https://claude.ai/api/organizations', undefined)
    await service.fetch('on', 'https://api.example.com/', undefined)
    expect(
      request.mock.calls.map((c) => (c as unknown as [string, { session: boolean }])[1].session),
    ).toEqual([true, false])
  })

  it('checks every redirect against the grant', async () => {
    const good = net([{ redirect: '/moved' }, ok('moved')])
    await expect(
      good.service.fetch('on', 'https://api.example.com/a', undefined),
    ).resolves.toMatchObject({ body: 'moved' })
    expect(good.request).toHaveBeenLastCalledWith(
      'on',
      expect.objectContaining({ url: 'https://api.example.com/moved' }),
    )

    const bad = net([{ redirect: 'http://192.168.0.1/admin' }, ok()])
    await expect(bad.service.fetch('on', 'https://api.example.com/a', undefined)).rejects.toThrow(
      /only https/,
    )
    expect(bad.request).toHaveBeenCalledTimes(1)

    const loop = net(Array.from({ length: 10 }, () => ({ redirect: '/again' })))
    await expect(loop.service.fetch('on', 'https://api.example.com/a', undefined)).rejects.toThrow(
      /too many redirects/,
    )
    expect(loop.request).toHaveBeenCalledTimes(PLUGIN_LIMITS.redirects + 1)
  })

  it('refuses a burst beyond the budget until it refills', async () => {
    const { service, tick } = net(Array.from({ length: 20 }, () => ok()))
    for (let i = 0; i < PLUGIN_LIMITS.fetchBurst; i++)
      await service.fetch('on', 'https://api.example.com/', undefined)
    await expect(service.fetch('on', 'https://api.example.com/', undefined)).rejects.toThrow(
      /too many requests/,
    )
    tick(60_000 / PLUGIN_LIMITS.fetchPerMinute)
    await expect(service.fetch('on', 'https://api.example.com/', undefined)).resolves.toMatchObject(
      { status: 200 },
    )
  })

  it('sends a mapped test host to its local stub, and maps the stub’s redirects back', async () => {
    const { service, request } = net([{ redirect: 'http://127.0.0.1:9000/next?x=1' }, ok()], {
      hostMap: new Map([['api.example.com', '127.0.0.1:9000']]),
    })
    await service.fetch('on', 'https://api.example.com/a?b=2', undefined)
    expect(
      request.mock.calls.map((c) => (c as unknown as [string, { url: string }])[1].url),
    ).toEqual(['http://127.0.0.1:9000/a?b=2', 'http://127.0.0.1:9000/next?x=1'])
  })

  it('drops credentials once a redirect leaves the first origin, and keeps them within it', async () => {
    const headers = { accept: 'application/json', authorization: 'Bearer secret', 'x-api-key': 'k' }
    const same = net([{ redirect: '/v2' }, ok()])
    await same.service.fetch('on', 'https://api.example.com/v1', headers)
    const sameHeaders = same.request.mock.calls.map(
      (c) => (c as unknown as [string, { headers: Record<string, string> }])[1].headers,
    )
    expect(sameHeaders).toEqual([headers, headers])

    // Away and back again: once handed on, the credentials stay dropped.
    const away = net([
      { redirect: 'https://claude.ai/next' },
      { redirect: 'https://api.example.com/back' },
      ok(),
    ])
    await away.service.fetch('on', 'https://api.example.com/v1', headers)
    const awayHeaders = away.request.mock.calls.map(
      (c) => (c as unknown as [string, { headers: Record<string, string> }])[1].headers,
    )
    expect(awayHeaders).toEqual([
      headers,
      { accept: 'application/json' },
      { accept: 'application/json' },
    ])
  })

  it('never hands a plugin the cookies a response sets', () => {
    expect(responseHeaders({ 'Set-Cookie': ['a=1'], ETag: '"x"', vary: ['a', 'b'] })).toEqual({
      etag: '"x"',
      vary: 'a, b',
    })
  })
})

describe('plugin storage', () => {
  it('keeps values per plugin across a reload, written a moment after the last change', () => {
    vi.useFakeTimers()
    try {
      const store = new PluginStorage(path.join(dir, 'plugin-data'))
      expect(store.load('pomodoro')).toEqual({})
      expect(store.set('pomodoro', 'timer', { phase: 'work' }, false)).toBe(true)
      expect(new PluginStorage(path.join(dir, 'plugin-data')).load('pomodoro')).toEqual({})
      vi.advanceTimersByTime(1000)
      expect(new PluginStorage(path.join(dir, 'plugin-data')).load('pomodoro')).toEqual({
        timer: { phase: 'work' },
      })
      store.set('pomodoro', 'timer', null, true)
      store.flush()
      expect(new PluginStorage(path.join(dir, 'plugin-data')).load('pomodoro')).toEqual({})
    } finally {
      vi.useRealTimers()
    }
  })

  it('refuses a change past the limit and keeps what was there', () => {
    const store = new PluginStorage(path.join(dir, 'plugin-data'))
    store.set('p', 'a', 1, false)
    expect(store.set('p', 'b', 'x'.repeat(PLUGIN_LIMITS.storageBytes), false)).toBe(false)
    expect(store.load('p')).toEqual({ a: 1 })
  })

  it('treats an unreadable file as empty, and forgets a plugin on request', () => {
    const data = path.join(dir, 'plugin-data')
    mkdirSync(data)
    writeFileSync(path.join(data, 'p.json'), '{not json')
    const store = new PluginStorage(data)
    expect(store.load('p')).toEqual({})
    store.set('p', 'a', 1, false)
    store.flush()
    store.clear('p')
    expect(new PluginStorage(data).load('p')).toEqual({})
  })

  it('never turns an id into a path outside its folder', () => {
    const store = new PluginStorage(path.join(dir, 'plugin-data'))
    expect(() => store.set('../settings', 'a', 1, false)).toThrow(/not a plugin id/)
  })

  it('refuses keys that would reach an object’s prototype, and keeps the store plain', () => {
    const store = new PluginStorage(path.join(dir, 'plugin-data'))
    for (const key of ['__proto__', 'constructor', 'prototype', '', 'a b', 'x'.repeat(101)]) {
      expect(store.set('p', key, { polluted: true }, false), key).toBe(false)
    }
    expect(store.set('p', 'timer.v1', 1, false)).toBe(true)
    const value = store.load('p')
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype)
    expect(value).toEqual({ 'timer.v1': 1 })
  })
})
