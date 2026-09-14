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
      counter: { enabled: true, granted, values: { step: 1 } },
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
      counter: { enabled: true, granted, values: { step: 2 } },
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
      counter: { enabled: true, granted: grantFor(NO_PERMISSIONS), values: {} },
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
      counter: { enabled: true, granted, values: {} },
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
          counter: { enabled: true, granted: grantFor({ ...NO_PERMISSIONS, notify: true }) },
        },
      },
    ])
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
