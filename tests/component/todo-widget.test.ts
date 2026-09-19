import { defaultSettings } from '@shared/settings'
import type { NewTask, Task, TasksFile } from '@shared/tasks'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: TodoWidget } = await import('../../src/renderer/widgets/todo/TodoWidget.svelte')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')

/**
 * The tasks pane.
 *
 * What it must get right on screen: the line is read back before it is added
 * (so a misread date is caught by the user, not discovered later), the rows are
 * banded by when they are due, and deleting one offers it back.
 */

/** Wednesday, 16 September 2026, 10:00 local. */
const NOW = new Date(2026, 8, 16, 10, 0).getTime()

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  listId: 'tasks',
  title: 'a task',
  allDay: false,
  repeat: 'none',
  done: false,
  order: 0,
  createdAt: NOW - 3_600_000,
  updatedAt: NOW - 3_600_000,
  ...over,
})

let file: TasksFile
let add: ReturnType<typeof vi.fn>
let update: ReturnType<typeof vi.fn>
let remove: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  file = { version: 1, lists: [{ id: 'tasks', name: 'tasks' }], tasks: [] }
  add = vi.fn(async (input: NewTask) =>
    task({
      id: `t${Date.now()}`,
      listId: input.listId,
      title: input.title,
      ...(input.due === undefined ? {} : { due: input.due }),
      allDay: input.allDay ?? false,
      repeat: input.repeat ?? 'none',
    }),
  )
  update = vi.fn(async (id: string) => task({ id, done: true }))
  remove = vi.fn(async () => true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      readonly #callback: () => void
      constructor(callback: () => void) {
        this.#callback = callback
      }
      observe() {
        this.#callback()
      }
      disconnect() {}
    },
  )
  // The completion delay asks whether motion is reduced; jsdom has no matchMedia.
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }))
  vi.stubGlobal('elecdex', {
    tasks: {
      list: vi.fn(async () => structuredClone(file)),
      add,
      update,
      remove,
      clearCompleted: vi.fn(async () => 0),
      addList: vi.fn(async () => null),
      renameList: vi.fn(async () => true),
      removeList: vi.fn(async () => true),
      onChange: () => () => {},
      onRemind: () => () => {},
    },
    layout: { load: vi.fn(), save: vi.fn(async () => undefined) },
    settings: { patch: vi.fn(async () => defaultSettings()) },
  })
  vi.spyOn(layout, 'setPaneState').mockImplementation(() => {})
  appearance.settings = defaultSettings()
})

afterEach(async () => {
  cleanup()
  toasts.clear()
  await layout.flush()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

const input = (): HTMLInputElement => screen.getByTestId('todo-input') as HTMLInputElement

describe('TodoWidget', () => {
  it('reads the line back before anything is added', async () => {
    render(TodoWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.input(input(), { target: { value: '歯医者 明日 9:00' } })
    await settle()

    const decoded = screen.getByTestId('todo-decoded').textContent ?? ''
    expect(decoded).toContain('17 Sep')
    expect(decoded).toContain('歯医者')
    expect(add).not.toHaveBeenCalled()
  })

  it('says nothing about a line it did not understand', async () => {
    render(TodoWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.input(input(), { target: { value: 'ask mon about the invoice' } })
    await settle()
    expect(screen.queryByTestId('todo-decoded')).toBeNull()
  })

  it('adds the task with the deadline it showed, and clears the line', async () => {
    render(TodoWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.input(input(), { target: { value: 'review fri 18:30' } })
    await fireEvent.keyDown(input(), { key: 'Enter' })
    await settle()

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'review', due: new Date(2026, 8, 18, 18, 30).getTime() }),
    )
    expect(input().value).toBe('')
  })

  it('bands the rows by when they are due', async () => {
    file = {
      ...file,
      tasks: [
        task({ id: 'late', title: 'late one', due: NOW - 3_600_000 }),
        task({ id: 'today', title: 'today one', due: NOW + 3_600_000 }),
        task({ id: 'someday', title: 'no date' }),
      ],
    }
    render(TodoWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()

    const text = screen.getByTestId('todo-rows').textContent ?? ''
    expect(text.indexOf('overdue')).toBeLessThan(text.indexOf('today one'))
    expect(text).toContain('no due date')
    // An overdue row is marked, so the colour is not the only thing saying so.
    expect(screen.getByTestId('todo-rows').querySelector('.row.late')).toBeTruthy()
  })

  it('offers a deleted task back', async () => {
    file = { ...file, tasks: [task({ title: 'delete me' })] }
    render(TodoWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('todo-remove'))
    await settle()

    expect(remove).toHaveBeenCalledWith('t1')
    const undo = toasts.items.at(-1)?.actions.find((action) => action.label === 'undo')
    expect(undo).toBeTruthy()
    undo?.run()
    await settle()
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ title: 'delete me' }))
  })

  it('lets the row play its completion before the task is ticked off', async () => {
    file = { ...file, tasks: [task()] }
    render(TodoWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('todo-complete'))
    await settle()
    expect(update).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    await settle()
    expect(update).toHaveBeenCalledWith('t1', { done: true })
  })
})
