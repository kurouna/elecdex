import type { Note, NotesFile } from '@shared/notes'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: NotesWidget } = await import('../../src/renderer/widgets/notes/NotesWidget.svelte')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The notes pane against a hand-driven main.
 *
 * The behaviour worth pinning is the save: it is debounced, it is written when
 * the pane goes (a move remounts the widget, and the keystrokes must not go with
 * it), and a note edited in another pane does not overwrite what is being typed
 * here.
 */

const note = (over: Partial<Note> = {}): Note => ({
  id: 'n1',
  body: 'first line\nsecond',
  createdAt: 1000,
  updatedAt: 1000,
  rev: 1,
  ...over,
})

let file: NotesFile
let changed: (file: NotesFile) => void = () => {}
let save: ReturnType<typeof vi.fn>

beforeEach(() => {
  file = { version: 1, notes: [note()] }
  save = vi.fn(async (id: string, body: string) => ({ ...note({ id, body }), rev: 2 }))
  vi.stubGlobal('elecdex', {
    notes: {
      list: vi.fn(async () => structuredClone(file)),
      create: vi.fn(async () => note({ id: 'n2', body: '', rev: 1 })),
      save,
      remove: vi.fn(async () => true),
      export: vi.fn(async () => null),
      onChange: (handler: (next: NotesFile) => void) => {
        changed = handler
        return () => {}
      },
    },
    // The pane records which note it shows through the layout store.
    layout: { load: vi.fn(), save: vi.fn(async () => undefined) },
  })
})

afterEach(async () => {
  // Take the pane down first: its last write goes through window.elecdex, which
  // is about to be taken away. Anything the layout store started, too.
  cleanup()
  await layout.flush()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

const body = (): HTMLTextAreaElement => screen.getByTestId('notes-body') as HTMLTextAreaElement

describe('NotesWidget', () => {
  it('shows the note main has, and writes a change after the pause', async () => {
    vi.useFakeTimers()
    render(NotesWidget, { props: { paneId: 'p', state: { noteId: 'n1' } } as never })
    await settle()
    expect(body().value).toBe('first line\nsecond')

    await fireEvent.input(body(), { target: { value: 'edited' } })
    // Nothing is written while the keys are still coming.
    expect(save).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    await settle()
    expect(save).toHaveBeenCalledWith('n1', 'edited')
  })

  it('writes what was typed when the pane goes, since a move remounts it', async () => {
    vi.useFakeTimers()
    const view = render(NotesWidget, { props: { paneId: 'p', state: { noteId: 'n1' } } as never })
    await settle()
    await fireEvent.input(body(), { target: { value: 'half typed' } })
    view.unmount()
    await settle()
    expect(save).toHaveBeenCalledWith('n1', 'half typed')
  })

  it('takes a change made elsewhere while nothing is being typed here', async () => {
    render(NotesWidget, { props: { paneId: 'p', state: { noteId: 'n1' } } as never })
    await settle()
    changed({ version: 1, notes: [note({ body: 'from another pane', rev: 4 })] })
    await settle()
    expect(body().value).toBe('from another pane')
  })

  it('says so rather than overwriting what is half typed here', async () => {
    vi.useFakeTimers()
    render(NotesWidget, { props: { paneId: 'p', state: { noteId: 'n1' } } as never })
    await settle()
    await fireEvent.input(body(), { target: { value: 'mine' } })
    changed({ version: 1, notes: [note({ body: 'theirs', rev: 9 })] })
    await settle()
    expect(body().value).toBe('mine')
    expect(screen.getByTestId('notes-elsewhere')).toBeTruthy()
  })

  it('falls back to the newest note when the one it showed is gone', async () => {
    render(NotesWidget, { props: { paneId: 'p', state: { noteId: 'missing' } } as never })
    await settle()
    expect(body().value).toBe('first line\nsecond')
  })

  it('works out the sum under the caret, and leaves prose alone', async () => {
    vi.useFakeTimers()
    render(NotesWidget, { props: { paneId: 'p', state: { noteId: 'n1' } } as never })
    await settle()

    await fireEvent.input(body(), { target: { value: 'budget 1200*3' } })
    body().setSelectionRange(11, 11)
    await fireEvent.keyDown(body(), { key: '=', ctrlKey: true })
    await settle()
    expect(body().value).toBe('budget 1200*3 = 3,600')

    await fireEvent.input(body(), { target: { value: 'just words' } })
    body().setSelectionRange(5, 5)
    await fireEvent.keyDown(body(), { key: '=', ctrlKey: true })
    await settle()
    expect(body().value).toBe('just words')
  })
})
