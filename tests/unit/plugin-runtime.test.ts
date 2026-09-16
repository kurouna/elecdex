import { bundle } from '@main/plugins/folder'
import { pluginRuntime, stripGlobals } from '@shared/plugin-runtime'
import type { HostMessage } from '@shared/plugins'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The worker runtime, run the way a worker runs it: the script is built from the two
 * functions' source text, so these tests fail if either reaches for a name outside itself.
 * The worker's global is a stand-in that records what the plugin posts.
 */

type Message = Record<string, unknown> & { t: string }

function run(files: Record<string, string>, entry = 'index.ts') {
  const code = bundle(Object.entries(files).map(([path, source]) => ({ path, source })))
  const posted: Message[] = []
  const scope = {
    postMessage: (m: unknown) => posted.push(structuredClone(m) as Message),
    setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
    clearInterval: (h: unknown) => clearInterval(h as NodeJS.Timeout),
    onmessage: null as ((event: { data: unknown }) => void) | null,
    addEventListener: () => {},
  }
  const script = `(${stripGlobals.toString()})(self);\n(${pluginRuntime.toString()})(self, ${code}, ${JSON.stringify(entry)});`
  new Function('self', script)(scope)
  const send = (m: HostMessage) => scope.onmessage?.({ data: m })
  const of = (t: string) => posted.filter((m) => m.t === t)
  return { posted, send, of, scope }
}

const start = (settings = {}, storage = {}): HostMessage => ({
  t: 'start',
  settings,
  locale: 'en',
  storage,
  service: true,
})
const mount = (pane: string, visible = true): HostMessage => ({
  t: 'mount',
  pane,
  size: { w: 300, h: 200 },
  visible,
  state: undefined,
})

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('the plugin runtime', () => {
  it('describes a plugin without its functions, and says whether it has a service', () => {
    const p = run({
      'index.ts': `export default { apiVersion: 1, id: 'x', title: 'X', service() {}, view(ctx: any) {} }`,
    })
    p.send({ t: 'probe' })
    expect(p.of('descriptor')).toEqual([
      { t: 'descriptor', descriptor: { apiVersion: 1, id: 'x', title: 'X', hasService: true } },
    ])
  })

  it('loads the plugin’s own files, and nothing outside them', () => {
    const p = run({
      'index.ts': `import { label } from './lib/label'\nexport default { apiVersion: 1, id: label, title: 't', view() {} }`,
      'lib/label.ts': `export const label: string = 'from-lib'`,
    })
    p.send({ t: 'probe' })
    expect(p.of('descriptor')[0]?.descriptor).toMatchObject({ id: 'from-lib' })

    for (const specifier of ['fs', 'electron', '../outside', './missing']) {
      const bad = run({ 'index.ts': `import x from '${specifier}'\nexport default { x }` })
      bad.send({ t: 'probe' })
      expect(bad.of('error')[0], specifier).toMatchObject({ fatal: true })
    }
  })

  it('hands the service’s model to every view, and to a view opened later', async () => {
    const p = run({
      'index.ts': `export default {
        apiVersion: 1, id: 'x', title: 'X',
        service(ctx) { ctx.publish({ n: 1 }) },
        view(ctx) { ctx.onData((m) => ctx.render([{ t: 'text', text: 'n=' + m.n + ' ' + ctx.size.w }])) },
      }`,
    })
    p.send(start())
    p.send(mount('a'))
    p.send(mount('b'))
    await Promise.resolve()
    expect(p.of('render')).toEqual([
      { t: 'render', pane: 'a', blocks: [{ t: 'text', text: 'n=1 300' }] },
      { t: 'render', pane: 'b', blocks: [{ t: 'text', text: 'n=1 300' }] },
    ])
  })

  it('does not run a view’s timer while its pane is hidden, and catches up once it shows', () => {
    const p = run({
      'index.ts': `let n = 0; export default {
        apiVersion: 1, id: 'x', title: 'X',
        view(ctx) { ctx.every(10, () => ctx.render([{ t: 'text', text: String(++n) }])) },
      }`,
    })
    p.send(start())
    p.send(mount('a', false))
    // Asked for every 10ms: held to a second.
    vi.advanceTimersByTime(999)
    expect(p.of('render')).toHaveLength(0)
    vi.advanceTimersByTime(3000)
    expect(p.of('render')).toHaveLength(0)
    p.send({ t: 'visible', pane: 'a', visible: true })
    expect(p.of('render')).toHaveLength(1)
    vi.advanceTimersByTime(1000)
    expect(p.of('render')).toHaveLength(2)
    p.send({ t: 'unmount', pane: 'a' })
    vi.advanceTimersByTime(5000)
    expect(p.of('render')).toHaveLength(2)
  })

  it('refuses a storage key that could reach a prototype', () => {
    const p = run({
      'index.ts': `export default {
        apiVersion: 1, id: 'x', title: 'X',
        service(ctx) {
          for (const key of ['__proto__', 'constructor', 'a b']) {
            try { ctx.storage.set(key, { polluted: true }) } catch (e) { ctx.log(e.message) }
          }
          ctx.log(String(({}).polluted))
        },
        view() {},
      }`,
    })
    p.send(start())
    expect(p.of('storage')).toEqual([])
    expect(p.of('log').map((m) => m.text)).toEqual([
      '"__proto__" is not a storage key: use letters, digits and _ . : -',
      '"constructor" is not a storage key: use letters, digits and _ . : -',
      '"a b" is not a storage key: use letters, digits and _ . : -',
      'undefined',
    ])
  })

  it('keeps storage within its limit, and pane state within its own', () => {
    const p = run({
      'index.ts': `export default {
        apiVersion: 1, id: 'x', title: 'X',
        service(ctx) {
          ctx.storage.set('kept', { a: ctx.storage.get('before') })
          try { ctx.storage.set('huge', 'x'.repeat(1024 * 1024)) } catch (e) { ctx.log('storage: ' + e.message) }
          try { ctx.storage.set('fn', () => 1) } catch (e) { ctx.log('fn: ' + e.message) }
        },
        view(ctx) { try { ctx.state.set('y'.repeat(70000)) } catch (e) { ctx.log('state: ' + e.message) } },
      }`,
    })
    p.send(start({}, { before: 7 }))
    p.send(mount('a'))
    expect(p.of('storage')).toEqual([{ t: 'storage', key: 'kept', value: { a: 7 } }])
    expect(p.of('log').map((m) => m.text)).toEqual([
      'storage: storage is full (1 MiB)',
      'fn: a stored value must be JSON',
      'state: pane state is too big (64 KiB)',
    ])
    expect(p.of('state')).toEqual([])
  })

  it('refuses metrics and notifications the plugin did not declare', () => {
    const p = run({
      'index.ts': `export default {
        apiVersion: 1, id: 'x', title: 'X', permissions: { metrics: ['cpu.load'] },
        service(ctx) {
          ctx.metrics.on('cpu.load', (v) => ctx.log('cpu ' + v.total))
          try { ctx.metrics.on('proc.list', () => {}) } catch (e) { ctx.log(e.message) }
          try { ctx.notify({ title: 'hi' }) } catch (e) { ctx.log(e.message) }
        },
        view() {},
      }`,
    })
    p.send(start())
    expect(p.of('metrics')).toEqual([{ t: 'metrics', id: 'cpu.load', on: true }])
    p.send({ t: 'metric', id: 'cpu.load', value: { total: 42 } })
    expect(p.of('log').map((m) => m.text)).toEqual([
      'proc.list is not in permissions.metrics',
      'notify needs permissions.notify',
      'cpu 42',
    ])
  })

  it('answers a fetch with the response main sends back, or its error', async () => {
    const p = run({
      'index.ts': `export default {
        apiVersion: 1, id: 'x', title: 'X',
        async service(ctx) {
          const r = await ctx.fetch('https://api.example.com/a', { headers: { accept: 'application/json' } })
          ctx.log('got ' + r.status + ' ' + r.json().ok)
          try { await ctx.fetch('https://other.example.com/') } catch (e) { ctx.log('failed ' + e.message) }
        },
        view() {},
      }`,
    })
    p.send(start())
    expect(p.of('fetch')).toEqual([
      {
        t: 'fetch',
        id: 0,
        url: 'https://api.example.com/a',
        headers: { accept: 'application/json' },
      },
    ])
    p.send({ t: 'fetched', id: 0, response: { status: 200, headers: {}, body: '{"ok":true}' } })
    await vi.waitFor(() => expect(p.of('fetch')).toHaveLength(2))
    p.send({ t: 'fetched', id: 1, error: 'not granted' })
    await vi.waitFor(() =>
      expect(p.of('log').map((m) => m.text)).toEqual(['got 200 true', 'failed not granted']),
    )
  })

  it('sends a click to the pane’s view and to the service', () => {
    const p = run({
      'index.ts': `export default {
        apiVersion: 1, id: 'x', title: 'X',
        service(ctx) { ctx.on('action', (a) => ctx.log('service ' + a.action + ' ' + a.pane)) },
        view(ctx) { ctx.on('action', (a) => ctx.log('view ' + a.action + ' ' + a.item)) },
      }`,
    })
    p.send(start())
    p.send(mount('a'))
    p.send({ t: 'action', pane: 'a', action: 'open', item: 'row-2' })
    expect(p.of('log').map((m) => m.text)).toEqual(['view open row-2', 'service open a'])
  })

  it('reports a throwing view for its pane only, and keeps the others drawing', () => {
    const p = run({
      'index.ts': `export default {
        apiVersion: 1, id: 'x', title: 'X',
        view(ctx) { if (ctx.size.w < 100) throw new Error('too narrow'); ctx.render([]) },
      }`,
    })
    p.send(start())
    p.send({ ...(mount('narrow') as object), size: { w: 50, h: 50 } } as HostMessage)
    p.send(mount('wide'))
    expect(p.of('error')).toEqual([
      expect.objectContaining({
        pane: 'narrow',
        fatal: false,
        message: expect.stringMatching(/too narrow/),
      }),
    ])
    expect(p.of('render')).toEqual([{ t: 'render', pane: 'wide', blocks: [] }])
  })

  it('tells the service how many panes are open and on screen', () => {
    const p = run({
      'index.ts': `export default {
        apiVersion: 1, id: 'x', title: 'X',
        service(ctx) {
          ctx.log('start ' + JSON.stringify(ctx.views))
          ctx.on('views', () => ctx.log(JSON.stringify(ctx.views)))
        },
        view() {},
      }`,
    })
    p.send(start())
    p.send(mount('a', false))
    p.send(mount('b', true))
    p.send({ t: 'visible', pane: 'a', visible: true })
    p.send({ t: 'visible', pane: 'a', visible: true })
    p.send({ t: 'unmount', pane: 'b' })
    p.send({ t: 'stop' })
    expect(p.of('log').map((m) => m.text)).toEqual([
      'start {"open":0,"visible":0}',
      '{"open":1,"visible":0}',
      '{"open":2,"visible":1}',
      '{"open":2,"visible":2}',
      '{"open":1,"visible":1}',
    ])
  })

  it('answers pings, so the host can tell a busy plugin from a stuck one', () => {
    const p = run({
      'index.ts': `export default { apiVersion: 1, id: 'x', title: 'X', view() {} }`,
    })
    p.send({ t: 'ping', n: 3 })
    expect(p.of('pong')).toEqual([{ t: 'pong', n: 3 }])
  })

  it('stops every timer and runs cleanups when asked to stop', () => {
    const p = run({
      'index.ts': `export default {
        apiVersion: 1, id: 'x', title: 'X',
        service(ctx) { ctx.every(1000, () => ctx.log('tick')); return () => ctx.log('service gone') },
        view(ctx) { return () => ctx.log('view gone') },
      }`,
    })
    p.send(start())
    p.send(mount('a'))
    vi.advanceTimersByTime(1000)
    p.send({ t: 'stop' })
    vi.advanceTimersByTime(5000)
    expect(p.of('log').map((m) => m.text)).toEqual(['tick', 'view gone', 'service gone'])
  })
})

describe('stripping the worker global', () => {
  it('removes network and storage from the global and from what it inherits', () => {
    class GlobalScope {
      fetch() {
        return 'network'
      }
    }
    class WorkerScope extends GlobalScope {}
    const scope = Object.assign(new WorkerScope(), {
      XMLHttpRequest: class {},
      postMessage: () => {},
    }) as unknown as Record<string, unknown>
    stripGlobals(scope)
    expect(scope.fetch).toBeUndefined()
    expect((GlobalScope.prototype as unknown as Record<string, unknown>).fetch).toBeUndefined()
    expect(scope.XMLHttpRequest).toBeUndefined()
    expect(typeof scope.postMessage).toBe('function')
    expect(() => {
      scope.fetch = () => 'again'
    }).toThrow()
  })
})
