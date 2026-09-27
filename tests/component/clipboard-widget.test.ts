import type { ClipBoard, ClipEntryView } from '@shared/clipboard'
import type { SnippetAdded, SnippetDraft, SnippetView } from '@shared/snippets'
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
 * matching guess would tell), and asks before clearing. Behind its switch, the
 * snippets: kept from a row with SNIP, copied, moved, written, changed and
 * deleted through main, by id.
 */

let deliver: ((board: ClipBoard) => void) | null = null
let subscriptions = 0
const restore = vi.fn(async (_id: string) => 'ok' as const)
const remove = vi.fn((_id: string) => {})
const clear = vi.fn(() => {})
const pause = vi.fn((_paused: boolean) => {})

let tellSnippets: ((snippets: SnippetView[]) => void) | null = null
let snippetListeners = 0
let kept: SnippetView[] = []
const drafts = new Map<string, SnippetDraft>()
const snippets = {
  list: vi.fn(async () => structuredClone(kept)),
  onChange: (handler: (next: SnippetView[]) => void) => {
    snippetListeners += 1
    tellSnippets = handler
    return () => {
      snippetListeners -= 1
      tellSnippets = null
    }
  },
  fromClip: vi.fn(async (_id: string): Promise<SnippetAdded> => ({ id: 'snew', added: true })),
  create: vi.fn(
    async (_name: string, _text: string): Promise<SnippetAdded> => ({ id: 'snew', added: true }),
  ),
  read: vi.fn(async (id: string) => drafts.get(id) ?? null),
  update: vi.fn(async (_id: string, _change: { name?: string; text?: string }) => true),
  move: vi.fn(async (_id: string, _index: number) => true),
  remove: vi.fn(async (_id: string) => true),
  copy: vi.fn(async (_id: string) => 'ok' as const),
}

const snippet = (id: string, preview: string, over: Partial<SnippetView> = {}): SnippetView => ({
  id,
  name: '',
  title: preview,
  preview,
  chars: preview.length,
  lines: preview.split('\n').length,
  kind: 'text',
  rich: false,
  formats: [],
  createdAt: Date.now() - 600_000,
  updatedAt: Date.now() - 600_000,
  copies: 0,
  usedAt: null,
  ...over,
})

const entry = (id: string, preview: string, over: Partial<ClipEntryView> = {}): ClipEntryView => ({
  id,
  preview,
  chars: preview.length,
  lines: preview.split('\n').length,
  kind: 'text',
  rich: false,
  formats: [],
  kept: true,
  firstAt: Date.now() - 120_000,
  at: Date.now() - 120_000,
  copies: 1,
  snipped: false,
  ...over,
})

const board = (entries: ClipEntryView[], over: Partial<ClipBoard> = {}): ClipBoard => ({
  entries,
  current: entries[0]?.id ?? null,
  snippet: null,
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
  tellSnippets = null
  snippetListeners = 0
  kept = []
  drafts.clear()
  for (const mock of Object.values(snippets)) if ('mockClear' in mock) mock.mockClear()
  // New rows come in with a flip; jsdom runs no animations.
  Element.prototype.getAnimations ??= () => []
  // jsdom has no Web Animations: enough of one for a transition to run its length and end.
  Element.prototype.animate = function animate(_frames, options) {
    const animation = { onfinish: null as (() => void) | null, cancel() {}, currentTime: 0 }
    const length = typeof options === 'number' ? options : Number(options?.duration ?? 0)
    setTimeout(() => animation.onfinish?.(), length)
    return animation as unknown as Animation
  }
  // The card powers on like a tube, which asks whether motion is reduced.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
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
    snippets,
    layout: { save: vi.fn(async () => {}) },
  })
})

afterEach(async () => {
  cleanup()
  Reflect.deleteProperty(Element.prototype, 'animate')
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
    expect(screen.getByTestId('clip-clear').textContent).toBe('CLEAR 1 + CLIPBOARD?')
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

  it('tags every row, TXT included, with RICH under a formatted one', async () => {
    await mount()
    await push(board([entry('c2', 'plain'), entry('c1', 'bold', { rich: true, formats: ['rtf'] })]))
    const tags = (i: number) =>
      [
        ...(screen.getAllByTestId('clip-row')[i]?.querySelectorAll('[data-testid=clip-tag]') ?? []),
      ].map((el) => el.textContent)
    expect(tags(0)).toEqual(['TXT'])
    expect(tags(1)).toEqual(['TXT', 'RICH'])
  })

  it('shows the whole preview in a card after a rest of the pointer, and none while masked', async () => {
    const long = `first line
${'x'.repeat(700)}`
    const view = await mount()
    await push(
      board([
        entry('c1', long.slice(0, 600), {
          chars: long.length,
          lines: 2,
          formats: ['html'],
          rich: true,
        }),
      ]),
    )
    const row = screen.getByTestId('clip-row')
    await fireEvent.pointerEnter(row, { clientX: 40 })
    // Passing over is not resting: nothing yet.
    expect(screen.queryByTestId('clip-card')).toBeNull()
    await vi.waitFor(() => expect(screen.getByTestId('clip-card')).toBeTruthy())
    expect(screen.getByTestId('clip-card-text').textContent).toContain('first line')
    expect(screen.getByTestId('clip-card').textContent).toContain('the first 600 of 711 characters')
    expect(screen.getByTestId('clip-card-formats').textContent).toBe('text + HTML')
    await fireEvent.pointerLeave(row)
    // It powers off first.
    await vi.waitFor(() => expect(screen.queryByTestId('clip-card')).toBeNull())

    await view.rerender({ state: { mask: true } })
    await settle()
    await fireEvent.pointerEnter(screen.getByTestId('clip-row'), { clientX: 40 })
    await new Promise((resolve) => setTimeout(resolve, 500))
    await settle()
    expect(screen.queryByTestId('clip-card')).toBeNull()
  })

  it('says how many private copies were left out', async () => {
    await mount()
    await push(board([], { skipped: 2 }))
    expect(screen.getByTestId('clip-skipped').textContent).toContain('2 private copies left out')
  })
})

describe('ClipboardWidget: snippets', () => {
  async function tell(next: SnippetView[]): Promise<void> {
    kept = next
    tellSnippets?.(structuredClone(next))
    await settle()
  }

  const rows = () => screen.getAllByTestId('snip-text').map((el) => el.textContent)

  it('follows the snippets only while it is seen', async () => {
    const view = await mount({ view: 'snippets' }, false)
    expect(snippetListeners).toBe(0)
    await view.rerender({ visible: true })
    await settle()
    expect(snippetListeners).toBe(1)
    expect(snippets.list).toHaveBeenCalledTimes(1)
    await view.rerender({ visible: false })
    await settle()
    expect(snippetListeners).toBe(0)
  })

  it('keeps a history row with SNIP, and blinks the switch it went behind', async () => {
    await mount()
    await push(board([entry('c2', 'two', { snipped: true }), entry('c1', 'one')]))
    const snips = () => screen.getAllByTestId('clip-snip')
    expect(snips().map((el) => el.textContent)).toEqual(['★', 'SNIP'])
    await fireEvent.click(snips()[1] as HTMLElement)
    await settle()
    expect(snippets.fromClip).toHaveBeenCalledWith('c1')
    await vi.waitFor(() =>
      expect(screen.getByTestId('clip-view-snippets').className).toContain('bumped'),
    )
  })

  it('does not light old rows as new again when the history comes back from the snippets', async () => {
    const view = await mount()
    await push(board([entry('c1', 'one')]))
    await push(board([entry('c2', 'two'), entry('c1', 'one')]))
    const lit = () =>
      [...screen.getByTestId('clip-list').querySelectorAll(':scope > li.fx-fresh')].length
    expect(lit()).toBe(1)
    await view.rerender({ state: { view: 'snippets' } })
    await settle()
    await view.rerender({ state: {} })
    await settle()
    expect(lit()).toBe(0)
  })

  it('cannot keep an entry too long to have been kept whole', async () => {
    await mount()
    await push(board([entry('c1', 'x'.repeat(40), { kept: false, chars: 300_000 })]))
    expect((screen.getByTestId('clip-snip') as HTMLButtonElement).disabled).toBe(true)
  })

  it('lists snippets in their slots, marks the one on the clipboard, and copies by id', async () => {
    kept = [snippet('sa', 'ssh deploy@example.test', { name: 'prod' }), snippet('sb', 'two')]
    await mount({ view: 'snippets' })
    await push(board([], { snippet: 'sb' }))
    expect(rows()).toEqual(['ssh deploy@example.test', 'two'])
    expect(screen.getByTestId('snip-name').textContent).toBe('prod')
    expect(screen.getAllByTestId('snip-row')[0]?.textContent).toContain('01')
    expect(screen.getAllByTestId('snip-current')).toHaveLength(1)
    expect(screen.getByTestId('snip-count').textContent).toBe('2/100')
    await fireEvent.click(screen.getAllByTestId('snip-copy')[0] as HTMLElement)
    await settle()
    expect(snippets.copy).toHaveBeenCalledWith('sa')
    expect(screen.getAllByTestId('snip-copy')[0]?.textContent).toBe('COPIED')
  })

  it('asks once more before deleting, by × or Delete', async () => {
    kept = [snippet('sa', 'one'), snippet('sb', 'two')]
    await mount({ view: 'snippets' })
    const drop = () => screen.getAllByTestId('snip-remove')[0] as HTMLElement
    await fireEvent.click(drop())
    expect(snippets.remove).not.toHaveBeenCalled()
    expect(drop().textContent).toBe('DELETE?')
    await fireEvent.click(drop())
    expect(snippets.remove).toHaveBeenCalledWith('sa')
    const copy = screen.getAllByTestId('snip-copy')[1] as HTMLElement
    copy.focus()
    await fireEvent.keyDown(copy, { key: 'Delete' })
    expect(snippets.remove).toHaveBeenCalledTimes(1)
    await fireEvent.keyDown(copy, { key: 'Delete' })
    expect(snippets.remove).toHaveBeenLastCalledWith('sb')
  })

  it('moves a snippet with Alt+arrows, at once on screen', async () => {
    kept = [snippet('sa', 'one'), snippet('sb', 'two'), snippet('sc', 'three')]
    await mount({ view: 'snippets' })
    const copy = screen.getAllByTestId('snip-copy')[0] as HTMLElement
    copy.focus()
    await fireEvent.keyDown(copy, { key: 'ArrowDown', altKey: true })
    await settle()
    expect(snippets.move).toHaveBeenCalledWith('sa', 1)
    expect(rows()).toEqual(['two', 'one', 'three'])
    // The arrows alone move the focus, and nothing else.
    await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowUp' })
    expect(snippets.move).toHaveBeenCalledTimes(1)
  })

  it('moves a snippet by dragging its slot, and not while the list is filtered', async () => {
    kept = [snippet('sa', 'one'), snippet('sb', 'two'), snippet('sc', 'three')]
    await mount({ view: 'snippets' })
    const items = [...screen.getByTestId('snip-list').querySelectorAll(':scope > li')]
    items.forEach((item, i) => {
      item.getBoundingClientRect = () => ({ top: i * 40, height: 40 }) as DOMRect
    })
    await fireEvent.pointerDown(screen.getAllByTestId('snip-handle')[0] as HTMLElement, {
      button: 0,
      clientY: 20,
    })
    await fireEvent.pointerMove(window, { clientY: 110 })
    await settle()
    expect(rows()).toEqual(['two', 'three', 'one'])
    await fireEvent.pointerUp(window)
    await settle()
    expect(snippets.move).toHaveBeenCalledWith('sa', 2)

    await fireEvent.input(screen.getByTestId('clip-filter'), { target: { value: 't' } })
    await settle()
    expect(screen.getAllByTestId('snip-handle')[0]?.className).not.toContain('movable')
  })

  it('writes a new snippet, and says why one was not kept', async () => {
    await mount({ view: 'snippets' })
    expect(screen.getByTestId('snip-empty')).toBeTruthy()
    await fireEvent.click(screen.getByTestId('snip-new'))
    await settle()
    await fireEvent.input(screen.getByTestId('snip-editor-name'), { target: { value: 'sig' } })
    await fireEvent.input(screen.getByTestId('snip-editor-text'), { target: { value: 'Regards' } })
    snippets.create.mockResolvedValueOnce({ error: 'full' })
    await fireEvent.click(screen.getByTestId('snip-editor-save'))
    await settle()
    expect(snippets.create).toHaveBeenCalledWith('sig', 'Regards')
    expect(screen.getByTestId('snip-editor-problem').textContent).toContain('delete one first')
    await fireEvent.keyDown(screen.getByTestId('snip-editor-text'), { key: 'Enter', ctrlKey: true })
    await settle()
    expect(screen.queryByTestId('snip-editor')).toBeNull()
  })

  it('edits by id, and warns that a new text drops the formatting', async () => {
    kept = [snippet('sa', 'bold', { rich: true, formats: ['html'] })]
    drafts.set('sa', { name: '', text: 'bold', rich: true })
    await mount({ view: 'snippets' })
    await fireEvent.click(screen.getByTestId('snip-edit'))
    await settle()
    expect(snippets.read).toHaveBeenCalledWith('sa')
    expect(screen.queryByTestId('snip-editor-rich')).toBeNull()
    await fireEvent.input(screen.getByTestId('snip-editor-text'), { target: { value: 'bolder' } })
    await settle()
    expect(screen.getByTestId('snip-editor-rich')).toBeTruthy()
    await fireEvent.click(screen.getByTestId('snip-editor-save'))
    await settle()
    expect(snippets.update).toHaveBeenCalledWith('sa', { text: 'bolder' })
  })

  it('masks the snippets, and offers no editor for them then', async () => {
    kept = [snippet('sa', 'hunter2', { name: 'wifi' })]
    await mount({ view: 'snippets', mask: true })
    expect(screen.getByTestId('snip-text').textContent).not.toContain('hunter2')
    expect(screen.queryByTestId('snip-edit')).toBeNull()
    expect(screen.queryByTestId('clip-filter')).toBeNull()
    await fireEvent.click(screen.getByTestId('snip-copy'))
    expect(snippets.copy).toHaveBeenCalledWith('sa')
  })

  it('follows a change main tells', async () => {
    kept = [snippet('sa', 'one')]
    await mount({ view: 'snippets' })
    await tell([snippet('sa', 'one'), snippet('sb', 'two')])
    expect(rows()).toEqual(['one', 'two'])
    expect(screen.getByTestId('clip-snippet-count').textContent).toBe('2')
  })
})
