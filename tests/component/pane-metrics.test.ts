import { pane } from '@shared/layout-ops'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

// The terminal widget, registered with the rest, adopts its stylesheet on import.
document.adoptedStyleSheets = []
CSSStyleSheet.prototype.replaceSync ??= () => {}

const { default: PaneHost } = await import('../../src/renderer/layout/PaneHost.svelte')
const { default: ClockWidget } = await import(
  '../../src/renderer/widgets/monitor/ClockWidget.svelte'
)
const { registerBuiltin } = await import('../../src/renderer/widgets/registry.ts')
await import('../../src/renderer/widgets/builtins.ts')

/**
 * The metric sources a pane holds. A tab behind another is display:none, so it
 * releases what nobody can see (a process list is costly to collect), but keeps
 * what it charts - a released source would leave a gap in the history.
 */
const subscribed = new Map<string, number>()
const changes: Array<[string, 'on' | 'off']> = []

beforeEach(() => {
  subscribed.clear()
  changes.length = 0
  vi.stubGlobal('elecdex', {
    metrics: {
      subscribe: (id: string) => {
        subscribed.set(id, (subscribed.get(id) ?? 0) + 1)
        changes.push([id, 'on'])
        return () => {
          const count = (subscribed.get(id) ?? 0) - 1
          if (count > 0) subscribed.set(id, count)
          else subscribed.delete(id)
          changes.push([id, 'off'])
        }
      },
    },
    layout: { save: vi.fn(async () => {}) },
  })
})

afterEach(() => vi.unstubAllGlobals())

const active = () => [...subscribed.keys()].sort()

function host(widget: string, visible: boolean) {
  const view = render(PaneHost, { props: { node: pane(widget), visible, tabbed: true } })
  flushSync()
  return view
}

describe('PaneHost metric subscriptions', () => {
  it('releases a hidden top list and takes it back when shown', async () => {
    const view = host('toplist', true)
    expect(active()).toEqual(['proc.list'])
    await view.rerender({ visible: false })
    expect(active()).toEqual([])
    await view.rerender({ visible: true })
    expect(active()).toEqual(['proc.list'])
    view.unmount()
    expect(active()).toEqual([])
  })

  it('never subscribes a pane that starts hidden to what it does not keep', () => {
    const view = host('netstat', false)
    expect(changes).toEqual([])
    view.unmount()
  })

  it('keeps charted and once-only sources through hiding, without resubscribing them', async () => {
    const view = host('cpu', true)
    expect(active()).toEqual(['cpu.info', 'cpu.load', 'cpu.speed', 'cpu.temperature', 'proc.list'])
    changes.length = 0
    await view.rerender({ visible: false })
    expect(active()).toEqual(['cpu.info', 'cpu.load'])
    await view.rerender({ visible: true })
    expect(active()).toEqual(['cpu.info', 'cpu.load', 'cpu.speed', 'cpu.temperature', 'proc.list'])
    // Only the released sources came and went; the chart's never blinked.
    expect(changes.map(([id]) => id).sort()).toEqual([
      'cpu.speed',
      'cpu.speed',
      'cpu.temperature',
      'cpu.temperature',
      'proc.list',
      'proc.list',
    ])
    view.unmount()
    expect(active()).toEqual([])
  })

  it.each([
    ['memory', ['mem.swap', 'mem.usage']],
    ['throughput', ['net.throughput']],
    ['sysinfo', ['hardware.system', 'os.info']],
    ['disk', []],
    ['netstat', []],
  ])('a hidden %s pane keeps %j', async (widget, kept) => {
    const view = host(widget, true)
    await view.rerender({ visible: false })
    expect(active()).toEqual(kept)
    view.unmount()
  })

  it('keeps a declared source only if the widget reads it', () => {
    registerBuiltin({
      id: 'test-kept',
      title: 'test',
      component: ClockWidget,
      metrics: ['mem.usage'],
      keepWhileHidden: ['cpu.load', 'mem.usage'],
    })
    const view = host('test-kept', false)
    expect(active()).toEqual(['mem.usage'])
    view.unmount()
  })
})
