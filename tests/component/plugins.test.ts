import { pluginRuntime, stripGlobals } from '@shared/plugin-runtime'
import { grantFor, NO_PERMISSIONS, type PluginCatalog, type PluginSource } from '@shared/plugins'
import { defaultSettings, type Settings } from '@shared/settings'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PluginWorker } from '../../src/renderer/plugins/worker.ts'

/**
 * Plugin panes and the plugin settings, with the host's worker replaced: by the real
 * runtime running in-process (so a plugin's messages are the real ones), or by a worker
 * that never answers. The bridge to main is a stand-in the test inspects.
 */

let factory: (source: PluginSource) => PluginWorker
vi.mock('../../src/renderer/plugins/worker.ts', () => ({
  createWorker: (source: PluginSource) => factory(source),
}))
vi.mock('../../src/renderer/stores/layout.svelte.ts', () => ({ layout: { setPaneState: vi.fn() } }))

const { plugins } = await import('../../src/renderer/plugins/plugins.svelte.ts')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')
const { ui } = await import('../../src/renderer/stores/ui.svelte.ts')
const { default: PluginPane } = await import('../../src/renderer/plugins/PluginPane.svelte')
const { default: PluginSettings } = await import('../../src/renderer/plugins/PluginSettings.svelte')

/** The real runtime, in this thread: messages cross as clones, a microtask apart. */
function inProcess(source: PluginSource): PluginWorker {
  let handler: (data: unknown) => void = () => {}
  let alive = true
  const scope = {
    postMessage: (m: unknown) => {
      const copy = structuredClone(m)
      queueMicrotask(() => alive && handler(copy))
    },
    setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
    clearInterval: (h: unknown) => clearInterval(h as ReturnType<typeof setInterval>),
    onmessage: null as ((e: { data: unknown }) => void) | null,
  }
  new Function(
    'self',
    `(${stripGlobals})(self);(${pluginRuntime})(self, ${source.code}, ${JSON.stringify(source.entry)})`,
  )(scope)
  terminated.set(source.key, false)
  const self = {}
  latest.set(source.key, self)
  return {
    post: (m) => {
      const copy = structuredClone(m)
      queueMicrotask(() => alive && scope.onmessage?.({ data: copy }))
    },
    onMessage: (h) => {
      handler = h
    },
    terminate: () => {
      alive = false
      // A worker ended late (after its grace) must not mark the one that replaced it.
      if (latest.get(source.key) === self) terminated.set(source.key, true)
    },
  }
}
/** Whether the newest worker for each file has been ended. */
const terminated = new Map<string, boolean>()
const latest = new Map<string, object>()
const realSetTimeout = globalThis.setTimeout

const COUNTER = `export default {
  apiVersion: 1, id: 'counter', title: 'counter', permissions: { notify: true },
  settings: [{ key: 'step', type: 'number', label: 'Step', default: 1 }],
  service(ctx) {
    let n = 0
    ctx.publish(n)
    ctx.on('action', (a) => { if (a.action === 'add') ctx.publish(n += ctx.settings.step) })
  },
  view(ctx) {
    ctx.onData((n) => ctx.render([
      { t: 'big', value: String(n) },
      { t: 'buttons', items: [{ action: 'add', text: 'add' }] },
      ...(n > 1 ? [{ t: 'bar', value: 'broken' }] : []),
    ]))
  },
}`

/** A one-file plugin as main would hand it over (written as plain JavaScript, so no transform). */
const source = (key: string, code: string): PluginSource => ({
  key,
  hash: String(code.length),
  code: `{"index.ts": function (module, exports, require) {\n${code.replace('export default', 'exports.default =')}\n}}`,
  entry: 'index.ts',
  error: null,
})

let catalog: PluginCatalog
const patches: unknown[] = []

function settingsWith(plugins: Settings['plugins']): void {
  appearance.settings = { ...defaultSettings(), plugins }
}

/** Lets messages cross and the shared frame that applies renders come round. */
async function settle(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await vi.advanceTimersByTimeAsync(50)
    flushSync()
  }
}

beforeEach(async () => {
  vi.useFakeTimers()
  factory = inProcess
  terminated.clear()
  latest.clear()
  patches.length = 0
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      readonly callback: IntersectionObserverCallback
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
      }
      observe() {
        this.callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as never)
      }
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }))
  vi.stubGlobal('elecdex', {
    plugins: {
      catalog: async () => catalog,
      onChange: () => () => {},
      onSession: () => () => {},
      storageLoad: async () => ({}),
      storageSet: async () => true,
      fetch: async () => ({ ok: false, error: 'no network in tests' }),
      notify: vi.fn(),
      signIn: vi.fn(async () => {}),
      forget: vi.fn(async () => {}),
    },
    settings: {
      patch: async (patch: unknown) => {
        patches.push(patch)
        return appearance.settings
      },
    },
    metrics: { subscribe: () => () => {} },
  })
})

afterEach(async () => {
  // Unmount here, under the fake clock, and let the stop grace run out: left to the
  // shared cleanup (which runs after this hook), a pane's plugin would stop on the real
  // clock and its worker would be ended in the middle of the next test.
  cleanup()
  await vi.advanceTimersByTimeAsync(1000)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function startHost(sources: PluginSource[], stored: Settings['plugins']): Promise<void> {
  catalog = { folder: 'C:/plugins', plugins: sources }
  settingsWith(stored)
  await plugins.apply(catalog)
  await settle()
}

const pane = (id: string, paneId = 'pane-1') =>
  render(PluginPane, {
    props: {
      paneId,
      title: id,
      props: undefined,
      state: undefined,
      active: true,
      widget: `plugin:${id}`,
    },
  })

describe('a plugin pane', () => {
  it('says a plugin is off, and takes the user to where it is turned on', async () => {
    await startHost([source('counter.ts', COUNTER)], {})
    const openSettings = vi.spyOn(ui, 'openSettings')
    pane('counter')
    await settle()
    expect(screen.getByTestId('plugin-pane').dataset.status).toBe('disabled')
    await fireEvent.click(screen.getByTestId('plugin-open-settings'))
    expect(openSettings).toHaveBeenCalledWith('plugins')
    expect(terminated.has('counter.ts')).toBe(true)
    // Only the probe ran; it was ended once it had described the plugin.
    expect(terminated.get('counter.ts')).toBe(true)
  })

  it('draws what the plugin renders, and sends a click back to it', async () => {
    const granted = grantFor({ ...NO_PERMISSIONS, notify: true })
    await startHost([source('counter.ts', COUNTER)], {
      counter: { enabled: true, key: 'counter.ts', granted, values: { step: 1 } },
    })
    pane('counter')
    await settle()
    expect(screen.getByText('0')).toBeTruthy()
    await fireEvent.click(screen.getByTestId('plugin-button'))
    await settle()
    expect(screen.getByText('1')).toBeTruthy()
  })

  it('shows why a block was dropped, and draws the rest', async () => {
    const granted = grantFor({ ...NO_PERMISSIONS, notify: true })
    await startHost([source('counter.ts', COUNTER)], {
      counter: { enabled: true, key: 'counter.ts', granted, values: { step: 2 } },
    })
    pane('counter')
    await settle()
    await fireEvent.click(screen.getByTestId('plugin-button'))
    await settle()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByTestId('plugin-problem').textContent).toMatch(/block 2/)
  })

  it('does not run a plugin that now asks for more than was agreed to', async () => {
    await startHost([source('counter.ts', COUNTER)], {
      counter: { enabled: true, key: 'counter.ts', granted: grantFor(NO_PERMISSIONS), values: {} },
    })
    terminated.clear()
    pane('counter')
    await settle()
    expect(screen.getByTestId('plugin-pane').dataset.status).toBe('consent')
    expect(terminated.size).toBe(0)
  })

  it('stops a plugin that stops answering, and starts it again on request', async () => {
    await startHost([source('counter.ts', COUNTER)], {
      counter: {
        enabled: true,
        key: 'counter.ts',
        granted: grantFor({ ...NO_PERMISSIONS, notify: true }),
        values: {},
      },
    })
    let stuck = true
    factory = (s) => {
      if (!stuck) return inProcess(s)
      return { post: () => {}, onMessage: () => {}, terminate: () => terminated.set('stuck', true) }
    }
    pane('counter')
    await settle()
    await vi.advanceTimersByTimeAsync(8000)
    flushSync()
    expect(screen.getByTestId('plugin-stopped').textContent).toMatch(/stopped responding/)
    expect(terminated.get('stuck')).toBe(true)
    stuck = false
    await fireEvent.click(screen.getByTestId('plugin-restart'))
    await settle()
    expect(screen.getByText('0')).toBeTruthy()
  })

  it('ends the worker when the last pane goes, unless the plugin runs in the background', async () => {
    const granted = grantFor({ ...NO_PERMISSIONS, notify: true })
    await startHost([source('counter.ts', COUNTER)], {
      counter: { enabled: true, key: 'counter.ts', granted, values: {} },
    })
    const first = pane('counter', 'a')
    const second = pane('counter', 'b')
    await settle()
    // Real time passing, as on a loaded machine: nothing left by an earlier test may end
    // this worker meanwhile.
    await new Promise((resolve) => realSetTimeout(resolve, 400))
    first.unmount()
    await vi.advanceTimersByTimeAsync(500)
    expect(terminated.get('counter.ts')).toBe(false)
    second.unmount()
    await vi.advanceTimersByTimeAsync(500)
    expect(terminated.get('counter.ts')).toBe(true)
  })

  it('does not hand a plugin’s permissions to another file that takes its id', async () => {
    const granted = grantFor({ ...NO_PERMISSIONS, notify: true })
    await startHost([source('impostor.ts', COUNTER)], {
      counter: { enabled: true, key: 'counter.ts', granted, values: {} },
    })
    terminated.clear()
    pane('counter')
    await settle()
    expect(screen.getByTestId('plugin-pane').dataset.status).toBe('consent')
    expect(terminated.size).toBe(0)
    render(PluginSettings)
    await settle()
    expect(screen.getByTestId('plugin-consent-reason').textContent).toBe(
      'impostor.ts now uses the id you agreed to for counter.ts.',
    )
  })

  it('keeps pane state within its limit even when a plugin posts around the runtime', async () => {
    const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
    const setPaneState = vi.mocked(layout.setPaneState)
    setPaneState.mockClear()
    const code = `export default {
      apiVersion: 1, id: 'hoarder', title: 'hoarder',
      view(ctx) {
        ctx.state.set({ small: true })
        ctx.render([{ t: 'text', text: 'drawn' }])
        self.postMessage({ t: 'state', pane: 'pane-1', value: 'x'.repeat(70000) })
      },
    }`
    // In-process, "self" in the plugin is this test's global: route its post to the host.
    factory = (s) => {
      const worker = inProcess(s)
      let deliver: (data: unknown) => void = () => {}
      vi.stubGlobal('postMessage', (m: unknown) => deliver(structuredClone(m)))
      return {
        ...worker,
        onMessage: (h) => {
          deliver = h
          worker.onMessage(h)
        },
      }
    }
    await startHost([source('hoarder.ts', code)], {
      hoarder: { enabled: true, key: 'hoarder.ts', granted: grantFor(NO_PERMISSIONS), values: {} },
    })
    pane('hoarder')
    await settle()
    expect(setPaneState.mock.calls).toEqual([['pane-1', { plugin: { small: true } }]])
    expect(screen.getByTestId('plugin-error').textContent).toMatch(/at most 64 KiB/)
  })

  it('describes plugins one at a time, so spinning ones take one core, not all', async () => {
    let running = 0
    let most = 0
    factory = (s) => {
      running += 1
      most = Math.max(most, running)
      const worker = inProcess(s)
      return {
        ...worker,
        terminate: () => {
          running -= 1
          worker.terminate()
        },
      }
    }
    const many = ['a', 'b', 'c'].map((name) =>
      source(`${name}.ts`, COUNTER.replace("id: 'counter'", `id: '${name}'`)),
    )
    await startHost(many, {})
    expect([...plugins.entries.keys()].filter((k) => k.length === 4)).toEqual([
      'a.ts',
      'b.ts',
      'c.ts',
    ])
    expect(most).toBe(1)
  })

  it('shows the site a link opens next to its text', async () => {
    const code = `export default {
      apiVersion: 1, id: 'linker', title: 'linker',
      view(ctx) { ctx.render([{ t: 'link', text: 'Open the docs', href: 'https://docs.example.com/a' }]) },
    }`
    await startHost([source('linker.ts', code)], {
      linker: { enabled: true, key: 'linker.ts', granted: grantFor(NO_PERMISSIONS), values: {} },
    })
    pane('linker')
    await settle()
    expect(screen.getByTestId('plugin-link').textContent).toBe('Open the docsdocs.example.com')
  })

  it('lets a plugin run again once the other file with its id is gone', async () => {
    const granted = grantFor({ ...NO_PERMISSIONS, notify: true })
    const stored = { counter: { enabled: true, key: 'counter.ts', granted, values: {} } }
    await startHost([source('counter.ts', COUNTER), source('copy.ts', COUNTER)], stored)
    expect(plugins.entries.get('counter.ts')?.status).toBe('duplicate')
    await startHost([source('counter.ts', COUNTER)], stored)
    expect(plugins.entries.get('counter.ts')).toMatchObject({ status: 'ready', error: null })
  })

  it('applies catalogs in the order they arrive, even while one is still being read', async () => {
    await startHost([], {})
    const two = [
      source('counter.ts', COUNTER),
      source('other.ts', COUNTER.replace("id: 'counter'", "id: 'other'")),
    ]
    const first = plugins.apply({ folder: 'C:/plugins', plugins: two })
    const second = plugins.apply({ folder: 'C:/plugins', plugins: [] })
    await vi.advanceTimersByTimeAsync(500)
    await Promise.all([first, second])
    expect([...plugins.entries.keys()]).toEqual([])
  })

  it('carries how a plugin wants its pane brought forward to the registry', async () => {
    const { zoomModeOf } = await import('../../src/renderer/widgets/registry.ts')
    const code = `export default {
      apiVersion: 1, id: 'roomy', title: 'roomy', zoom: 'panel',
      view(ctx) { ctx.render([{ t: 'text', text: 'hi' }]) },
    }`
    await startHost([source('roomy.ts', code)], {
      roomy: { enabled: true, key: 'roomy.ts', granted: grantFor(NO_PERMISSIONS), values: {} },
    })
    expect(zoomModeOf('plugin:roomy')).toBe('panel')
    // The sample plugin says nothing about it, so its pane is not brought forward.
    expect(zoomModeOf('plugin:counter')).toBeNull()
  })

  it('registers an unchanged plugin only once, however often the settings change', async () => {
    const { listWidgets } = await import('../../src/renderer/widgets/registry.ts')
    await startHost([source('counter.ts', COUNTER)], {})
    const before = listWidgets().find((w) => w.id === 'plugin:counter')
    settingsWith({
      counter: { enabled: false, key: null, granted: grantFor(NO_PERMISSIONS), values: {} },
    })
    await plugins.apply(catalog)
    expect(listWidgets().find((w) => w.id === 'plugin:counter')).toBe(before)
  })

  it('draws an icon button with its text as its name', async () => {
    const code = `export default {
      apiVersion: 1, id: 'iconic', title: 'iconic',
      view(ctx) { ctx.render([{ t: 'buttons', items: [
        { action: 'refresh', text: 'Refresh now', icon: 'refresh' },
        { action: 'plain', text: 'plain' },
        { action: 'load', text: 'Loading', icon: 'refresh', busy: true },
        { action: 'go', text: 'Going', icon: 'play', busy: true },
      ] }]) },
    }`
    await startHost([source('iconic.ts', code)], {
      iconic: { enabled: true, key: 'iconic.ts', granted: grantFor(NO_PERMISSIONS), values: {} },
    })
    pane('iconic')
    await settle()
    const [icon, plain, loading, going] = screen.getAllByTestId('plugin-button')
    // Busy: a round icon turns, any other pulses; an idle one does neither.
    expect(loading?.getAttribute('aria-busy')).toBe('true')
    expect(loading?.querySelector('svg')?.classList.contains('turn')).toBe(true)
    expect(going?.querySelector('svg')?.classList.contains('pulse')).toBe(true)
    expect(icon?.hasAttribute('aria-busy')).toBe(false)
    expect(icon?.querySelector('svg')?.getAttribute('class') ?? '').not.toMatch(/turn|pulse/)
    expect(icon?.getAttribute('aria-label')).toBe('Refresh now')
    expect(icon?.getAttribute('title')).toBe('Refresh now')
    expect(icon?.textContent).toBe('')
    expect(icon?.querySelector('svg[data-icon="refresh"]')).not.toBeNull()
    expect(plain?.textContent).toBe('plain')
    expect(plain?.hasAttribute('aria-label')).toBe(false)
  })

  it('fills under a line from its colour to nothing at the baseline, column by column', async () => {
    const { fillArea } = await import('../../src/renderer/lib/area-fill.ts')
    const gradients: number[][] = []
    const stops: string[] = []
    const rects: number[][] = []
    const calls: string[] = []
    let scale = 1
    const ctx = {
      createLinearGradient: (...a: number[]) => {
        gradients.push(a)
        return { addColorStop: (o: number, c: string) => stops.push(`${o} ${c}`) }
      },
      getTransform: () => ({ a: scale }),
      save: () => calls.push('save'),
      restore: () => calls.push('restore'),
      beginPath: () => calls.push('begin'),
      moveTo: (x: number, y: number) => calls.push(`move ${x},${y}`),
      lineTo: (x: number, y: number) => calls.push(`line ${x},${y}`),
      closePath: () => calls.push('close'),
      clip: () => calls.push('clip'),
      fillRect: (...a: number[]) => rects.push(a),
      set fillStyle(_: unknown) {},
    } as unknown as CanvasRenderingContext2D
    const reset = (): void => {
      gradients.length = 0
      stops.length = 0
      rects.length = 0
      calls.length = 0
    }
    const line: Array<[number, number]> = [
      [0, 30],
      [50, 10],
      [100, 20],
    ]
    fillArea(ctx, line, { baseline: 80, color: 'red', alpha: 0.3 })
    // Clipped to the area under the line.
    expect(calls).toEqual([
      'save',
      'begin',
      'move 0,80',
      'line 0,30',
      'line 50,10',
      'line 100,20',
      'line 100,80',
      'close',
      'clip',
      'restore',
    ])
    // Fading to the same colour with no alpha, never to transparent black.
    expect(stops.slice(0, 2)).toEqual(['0 red', '1 rgb(from red r g b / 0)'])
    // Each 2px strip starts where the line is there, not at the peak (y 10) for all of them.
    expect(rects).toHaveLength(50)
    expect(gradients[0]).toEqual([0, 29.2, 0, 80])
    expect(rects[0]).toEqual([0, 29.2, 2, 50.8])
    expect(gradients[24]).toEqual([0, 10, 0, 80])
    expect(gradients[49]?.[1]).toBeCloseTo(19.6)

    // A spike between strip edges still reaches the top of its strip.
    reset()
    fillArea(
      ctx,
      [
        [0, 70],
        [3, 10],
        [6, 70],
      ],
      { baseline: 80, color: 'red', alpha: 0.3 },
    )
    expect(gradients.map((g) => g[1])).toEqual([30, 10, 30])

    // Strips are whole device pixels wide at any scale.
    reset()
    scale = 1.25
    fillArea(ctx, line, { baseline: 80, color: 'red', alpha: 0.3 })
    expect(rects[0]?.[2]).toBe(1.6)
    expect(rects[1]?.[0]).toBe(1.6)
    scale = 1

    // Below a zero line (download traffic) each strip runs from the line up to the zero line.
    reset()
    const below: Array<[number, number]> = [
      [0, 60],
      [50, 70],
    ]
    fillArea(ctx, below, { baseline: 40, color: 'red', alpha: 0.3 })
    expect(gradients[0]).toEqual([0, 60.4, 0, 40])
    expect(rects[0]).toEqual([0, 40, 2, 20.4])
    expect(gradients.at(-1)).toEqual([0, 70, 0, 40])

    // Nothing to fill: one point, or a line lying on its baseline.
    reset()
    const flat: Array<[number, number]> = [
      [0, 80],
      [9, 80],
    ]
    fillArea(ctx, [[0, 30]], { baseline: 80, color: 'red', alpha: 0.3 })
    fillArea(ctx, flat, { baseline: 80, color: 'red', alpha: 0.3 })
    expect(calls).toEqual([])
    expect(rects).toEqual([])
  })

  it('dates the ends of a time axis that spans more than a day', async () => {
    const { axisTime } = await import('../../src/renderer/plugins/ticker.svelte.ts')
    const at = new Date(2026, 8, 19, 21, 30).getTime()
    expect(axisTime(at, 5 * 3600_000)).toBe('21:30')
    expect(axisTime(at, 7 * 24 * 3600_000)).toBe('09/19 21:30')
  })

  it('says a plugin is gone from the folder, keeping the pane', async () => {
    await startHost([], {})
    pane('vanished')
    await settle()
    expect(screen.getByTestId('plugin-pane').dataset.status).toBe('missing')
    expect(screen.getByText(/not in the plugins folder/)).toBeTruthy()
  })
})

describe('the plugin settings', () => {
  it('spell out what a plugin may do, and agreeing turns it on with exactly that grant', async () => {
    await startHost([source('counter.ts', COUNTER)], {})
    render(PluginSettings)
    await settle()
    const toggle = screen.getByTestId('plugin-enabled') as HTMLInputElement
    await fireEvent.click(toggle)
    flushSync()
    expect(screen.getByTestId('plugin-consent').textContent).toMatch(
      /sound and show system notifications/,
    )
    expect(patches).toEqual([])
    // Not on until the user agrees.
    expect(toggle.checked).toBe(false)
    await fireEvent.click(screen.getByTestId('plugin-agree'))
    expect(patches).toEqual([
      {
        plugins: {
          counter: {
            enabled: true,
            key: 'counter.ts',
            granted: grantFor({ ...NO_PERMISSIONS, notify: true }),
          },
        },
      },
    ])
  })

  it('warn when a plugin could send personal readings to the hosts it reaches', async () => {
    const spy = (permissions: string) =>
      source(
        'spy.ts',
        `export default { apiVersion: 1, id: 'spy', title: 'spy', permissions: ${permissions}, view() {} }`,
      )
    await startHost([spy(`{ metrics: ['proc.list', 'cpu.load'], hosts: ['api.example.com'] }`)], {})
    const view = render(PluginSettings)
    await settle()
    expect(screen.getByTestId('plugin-exposure').textContent).toBe(
      'It could send the names of the programs running to api.example.com.',
    )
    view.unmount()
    // Load alone, or personal readings kept at home, need no warning.
    await startHost([spy(`{ metrics: ['cpu.load'], hosts: ['api.example.com'] }`)], {})
    render(PluginSettings)
    await settle()
    expect(screen.queryByTestId('plugin-exposure')).toBeNull()
  })

  it('turn a plugin off before deleting what it stored', async () => {
    const granted = grantFor({ ...NO_PERMISSIONS, notify: true })
    await startHost([source('counter.ts', COUNTER)], {
      counter: { enabled: true, key: 'counter.ts', granted, values: {} },
    })
    const order: string[] = []
    const bridge = window.elecdex as unknown as {
      plugins: { forget: (id: string) => Promise<void> }
      settings: { patch: (p: unknown) => Promise<unknown> }
    }
    const patch = bridge.settings.patch
    bridge.settings.patch = async (p) => {
      order.push('settings')
      return patch(p)
    }
    bridge.plugins.forget = async () => {
      order.push('forget')
    }
    render(PluginSettings)
    await settle()
    const forget = screen.getByTestId('plugin-forget')
    await fireEvent.click(forget)
    await fireEvent.click(forget)
    await settle()
    expect(order).toEqual(['settings', 'forget'])
    expect(patches.at(-1)).toEqual({ plugins: { counter: null } })
  })

  it('show a broken plugin’s error without an on switch', async () => {
    await startHost(
      [
        {
          key: 'broken.ts',
          hash: 'x',
          code: null,
          entry: null,
          error: 'broken.ts: Unexpected token',
        },
      ],
      {},
    )
    render(PluginSettings)
    await settle()
    expect(screen.getByTestId('settings-plugin').dataset.status).toBe('error')
    expect(screen.getByText(/Unexpected token/)).toBeTruthy()
    expect(screen.queryByTestId('plugin-enabled')).toBeNull()
  })
})

describe('the plugin host', () => {
  it('applies the next catalog after one failed', async () => {
    await startHost([], {})
    const failed = vi.spyOn(console, 'error').mockImplementation(() => {})
    const host = plugins as unknown as { applyNow: (catalog: PluginCatalog) => Promise<void> }
    const once = vi.spyOn(host, 'applyNow').mockRejectedValueOnce(new Error('boom'))
    await plugins.apply({ folder: 'C:/plugins', plugins: [] })
    once.mockRestore()

    const granted = grantFor({ ...NO_PERMISSIONS, notify: true })
    await startHost([source('counter.ts', COUNTER)], {
      counter: { enabled: true, key: 'counter.ts', granted, values: { step: 1 } },
    })
    expect(plugins.entry('counter')?.status).toBe('ready')
    expect(failed).toHaveBeenCalled()
    failed.mockRestore()
  })

  it('applies a catalog that was already waiting behind the one that failed', async () => {
    await startHost([], {})
    const failed = vi.spyOn(console, 'error').mockImplementation(() => {})
    const host = plugins as unknown as { applyNow: (catalog: PluginCatalog) => Promise<void> }
    const real = host.applyNow.bind(host)
    // Only the first of the two fails: the second was queued while it was still running,
    // which is what the folder's change events do.
    const once = vi
      .spyOn(host, 'applyNow')
      .mockRejectedValueOnce(new Error('boom'))
      .mockImplementation(real)
    const granted = grantFor({ ...NO_PERMISSIONS, notify: true })
    settingsWith({ counter: { enabled: true, key: 'counter.ts', granted, values: { step: 1 } } })
    const first = plugins.apply({ folder: 'C:/plugins', plugins: [] })
    const second = plugins.apply({
      folder: 'C:/plugins',
      plugins: [source('counter.ts', COUNTER)],
    })
    await first
    await second
    await settle()
    expect(plugins.entry('counter')?.status).toBe('ready')
    expect(failed).toHaveBeenCalled()
    once.mockRestore()
    failed.mockRestore()
  })
})
