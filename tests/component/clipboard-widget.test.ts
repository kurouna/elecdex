import type { ClipBoard, ClipEntryView } from '@shared/clipboard'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: ClipboardWidget } = await import(
  '../../src/renderer/widgets/clipboard/ClipboardWidget.svelte'
)
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The clipboard pane: it follows main's history only while seen, puts an entry
 * back by id, hides what entries say when masked (the filter too, since a
 * matching guess would tell), and asks before clearing.
 */

let deliver: ((board: ClipBoard) => void) | null = null
let subscriptions = 0
const restore = vi.fn(async (_id: string) => 'ok' as const)
const remove = vi.fn((_id: string) => {})
const clear = vi.fn(() => {})
const pause = vi.fn((_paused: boolean) => {})

const entry = (id: string, preview: string, over: Partial<ClipEntryView> = {}): ClipEntryView => ({
  id,
  preview,
  chars: preview.length,
  lines: preview.split('\n').length,
  kind: 'text',
  rich: false,
  kept: true,
  firstAt: Date.now() - 120_000,
  at: Date.now() - 120_000,
  copies: 1,
  ...over,
})

const board = (entries: ClipEntryView[], over: Partial<ClipBoard> = {}): ClipBoard => ({
  entries,
  current: entries[0]?.id ?? null,
  watching: true,
  paused: false,
  skipped: 0,
  ...over,
})

beforeEach(() => {
  deliver = null
  subscriptions = 0
  restore.mockClear()
  remove.mockClear()
  clear.mockClear()
  pause.mockClear()
  // New rows come in with a flip; jsdom runs no animations.
  Element.prototype.getAnimations ??= () => []
  // The pane measures its height (fewer lines per row when short); jsdom has no observer.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('elecdex', {
    clipboard: {
      subscribe: (handler: (board: ClipBoard) => void) => {
        subscriptions += 1
        deliver = handler
        return () => {
          subscriptions -= 1
          deliver = null
        }
      },
      restore,
      remove,
      clear,
      pause,
    },
    layout: { save: vi.fn(async () => {}) },
  })
})

afterEach(async () => {
  cleanup()
  await layout.flush()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

async function mount(state: Record<string, unknown> = {}, visible = true) {
  const view = render(ClipboardWidget, {
    props: { paneId: 'p1', title: 'clipboard', props: {}, state, active: true, visible },
  })
  await settle()
  return view
}

async function push(next: ClipBoard): Promise<void> {
  deliver?.(structuredClone(next))
  await settle()
}

describe('ClipboardWidget', () => {
  it('follows the history only while it is seen', async () => {
    const view = await mount({}, false)
    expect(subscriptions).toBe(0)
    await view.rerender({ visible: true })
    await settle()
    expect(subscriptions).toBe(1)
    await view.rerender({ visible: false })
    await settle()
    expect(subscriptions).toBe(0)
  })

  it('lists entries with their tag, marks the current one, and puts one back by id', async () => {
    await mount()
    await push(board([entry('c2', 'https://example.test', { kind: 'url' }), entry('c1', 'one')]))
    expect(screen.getAllByTestId('clip-text').map((el) => el.textContent)).toEqual([
      'https://example.test',
      'one',
    ])
    expect(screen.getAllByTestId('clip-row')[0]?.textContent).toContain('URL')
    expect(screen.getAllByTestId('clip-current')).toHaveLength(1)
    await fireEvent.click(screen.getAllByTestId('clip-entry')[1] as HTMLElement)
    await settle()
    expect(restore).toHaveBeenCalledWith('c1')
    expect(screen.getAllByTestId('clip-age')[1]?.textContent).toBe('COPIED')
  })

  it('cannot put back an entry too long to have been kept', async () => {
    await mount()
    await push(board([entry('c1', 'x'.repeat(40), { kept: false, chars: 300_000 })]))
    expect((screen.getByTestId('clip-entry') as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByTestId('clip-row').textContent).toContain('NOT KEPT')
  })

  it('masks what the entries say, and offers no filter then', async () => {
    await mount({ mask: true })
    await push(board([entry('c1', 'hunter2 is not a password')]))
    expect(screen.getByTestId('clip-text').textContent).not.toContain('hunter2')
    expect(screen.queryByTestId('clip-filter')).toBeNull()
    await fireEvent.click(screen.getByTestId('clip-entry'))
    expect(restore).toHaveBeenCalledWith('c1')
  })

  it('filters on the words typed', async () => {
    await mount()
    await push(board([entry('c2', 'npm run build'), entry('c1', 'git log')]))
    await fireEvent.input(screen.getByTestId('clip-filter'), { target: { value: 'GIT' } })
    await settle()
    expect(screen.getAllByTestId('clip-text').map((el) => el.textContent)).toEqual(['git log'])
  })

  it('asks once more before clearing', async () => {
    await mount()
    await push(board([entry('c1', 'one')]))
    await fireEvent.click(screen.getByTestId('clip-clear'))
    expect(clear).not.toHaveBeenCalled()
    expect(screen.getByTestId('clip-clear').textContent).toBe('CLEAR 1?')
    await fireEvent.click(screen.getByTestId('clip-clear'))
    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('pauses and resumes through main, and says so', async () => {
    await mount()
    await push(board([]))
    expect(screen.getByTestId('clip-state').textContent).toContain('WATCHING')
    await fireEvent.click(screen.getByTestId('clip-pause'))
    expect(pause).toHaveBeenCalledWith(true)
    await push(board([], { paused: true, watching: false }))
    expect(screen.getByTestId('clip-state').textContent).toContain('PAUSED')
    await fireEvent.click(screen.getByTestId('clip-pause'))
    expect(pause).toHaveBeenLastCalledWith(false)
  })

  it('moves between rows with the arrow keys', async () => {
    await mount()
    await push(board([entry('c3', 'three'), entry('c2', 'two'), entry('c1', 'one')]))
    const entries = () => screen.getAllByTestId('clip-entry')
    ;(entries()[0] as HTMLElement).focus()
    await fireEvent.keyDown(entries()[0] as HTMLElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(entries()[1])
    await fireEvent.keyDown(entries()[1] as HTMLElement, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(entries()[0])
  })

  it('removes the focused entry with Delete and moves the focus on', async () => {
    await mount()
    await push(board([entry('c2', 'two'), entry('c1', 'one')]))
    const first = screen.getAllByTestId('clip-entry')[0] as HTMLElement
    first.focus()
    await fireEvent.keyDown(first, { key: 'Delete' })
    expect(remove).toHaveBeenCalledWith('c2')
    expect(document.activeElement).toBe(screen.getAllByTestId('clip-entry')[1])
  })

  it('says how many private copies were left out', async () => {
    await mount()
    await push(board([], { skipped: 2 }))
    expect(screen.getByTestId('clip-skipped').textContent).toContain('2 private copies left out')
  })
})
