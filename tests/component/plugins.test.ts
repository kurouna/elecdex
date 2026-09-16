import { pluginRuntime, stripGlobals } from '@shared/plugin-runtime'
import { grantFor, NO_PERMISSIONS, type PluginCatalog, type PluginSource } from '@shared/plugins'
import { defaultSettings, type Settings } from '@shared/settings'
import { fireEvent, render, screen } from '@testing-library/svelte'
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
      terminated.set(source.key, true)
    },
  }
}
const terminated = new Map<string, boolean>()

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

afterEach(() => {
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
