import { defaultSettings } from '@shared/settings'
import type { NewTask, Task, TaskPatch, TasksFile } from '@shared/tasks'
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
/** Main's broadcast, so a test can make it land before the call returns. */
let changed: ((next: TasksFile) => void) | null = null
let add: ReturnType<typeof vi.fn>
let update: ReturnType<typeof vi.fn>
let remove: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  changed = null
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
  // Answers as main does: the task as it is after the change, not a fixed one.
  update = vi.fn(async (id: string, patch: TaskPatch) => {
    const next = task({ id })
    if (patch.title !== undefined) next.title = patch.title
    if (patch.done !== undefined) next.done = patch.done
    if (patch.allDay !== undefined) next.allDay = patch.allDay
    if (patch.repeat !== undefined) next.repeat = patch.repeat
    if (patch.due === null) delete next.due
    else if (patch.due !== undefined) next.due = patch.due
    return next
  })
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
      onChange: (handler: (next: TasksFile) => void) => {
        changed = handler
        return () => {}
      },
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

/**
 * Renders the pane on the tasks this test set up.
 *
 * The store is one object for the whole window, so it outlives a single test's
 * component; pushing the file the way main's broadcast does puts it on the tasks
 * this test means, whether or not the store happened to re-read them.
 */
async function mount(state: Record<string, unknown> = {}): Promise<void> {
  render(TodoWidget, { props: { paneId: 'p', state } as never })
  await settle()
  changed?.(structuredClone(file))
  await settle()
}

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
    await mount()

    const text = screen.getByTestId('todo-rows').textContent ?? ''
    expect(text.indexOf('overdue')).toBeLessThan(text.indexOf('today one'))
    expect(text).toContain('no due date')
    // An overdue row is marked, so the colour is not the only thing saying so.
    expect(screen.getByTestId('todo-rows').querySelector('.row.late')).toBeTruthy()
  })

  it('offers a deleted task back', async () => {
    file = { ...file, tasks: [task({ title: 'delete me' })] }
    await mount()
    await fireEvent.click(screen.getByTestId('todo-remove'))
    await settle()

    expect(remove).toHaveBeenCalledWith('t1')
    const undo = toasts.items.at(-1)?.actions.find((action) => action.label === 'undo')
    expect(undo).toBeTruthy()
    undo?.run()
    await settle()
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ title: 'delete me' }))
  })

  it('adds a task once when main has already broadcast it', async () => {
    // Main writes the file and broadcasts it before the call returns, so the
    // window can hear about a task before it is handed the task. Appending what
    // came back put it in the list twice, the keyed rows threw on the duplicate,
    // and with the render broken the pane stopped answering altogether.
    add.mockImplementation(async (input: NewTask) => {
      const made = task({ id: 'echo', title: input.title })
      changed?.({ ...file, tasks: [made] })
      return made
    })
    render(TodoWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.input(input(), { target: { value: 'buy milk' } })
    await fireEvent.keyDown(input(), { key: 'Enter' })
    await settle()

    expect(screen.getAllByTestId('todo-row')).toHaveLength(1)
  })

  it('shows a completed task rather than letting it look as though it went', async () => {
    file = { ...file, tasks: [task({ title: 'done one', done: true, completedAt: NOW })] }
    await mount()

    // Completed tasks were collapsed behind a heading too small to read as a
    // button, so ticking one off looked like losing it. They show by default.
    expect(screen.getByTestId('todo-row-done')).toBeTruthy()
    expect(screen.getByTestId('todo-toggle-done').getAttribute('aria-expanded')).toBe('true')
  })

  it('renames a task where it is read', async () => {
    file = { ...file, tasks: [task({ title: 'buy milk' })] }
    await mount()

    await fireEvent.click(screen.getByTestId('todo-title'))
    await settle()
    const field = screen.getByTestId('todo-edit-title')
    await fireEvent.input(field, { target: { value: 'buy oat milk' } })
    await fireEvent.keyDown(field, { key: 'Enter' })
    await settle()
    expect(update).toHaveBeenCalledWith('t1', { title: 'buy oat milk' })

    // Escape leaves the task as it was.
    await fireEvent.click(screen.getByTestId('todo-title'))
    await settle()
    await fireEvent.input(screen.getByTestId('todo-edit-title'), { target: { value: 'nonsense' } })
    await fireEvent.keyDown(screen.getByTestId('todo-edit-title'), { key: 'Escape' })
    await settle()
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('sets and clears a deadline with the same words the quick-add takes', async () => {
    file = { ...file, tasks: [task({ title: 'call back' })] }
    await mount()

    await fireEvent.click(screen.getByTestId('todo-when'))
    await settle()
    const field = screen.getByTestId('todo-edit-due')
    await fireEvent.input(field, { target: { value: '明日 9:00' } })
    await fireEvent.keyDown(field, { key: 'Enter' })
    await settle()
    expect(update).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ due: new Date(2026, 8, 17, 9, 0).getTime(), allDay: false }),
    )

    // An empty line takes the deadline off rather than meaning nothing.
    file = { ...file, tasks: [task({ title: 'call back', due: NOW })] }
    cleanup()
    await mount()
    await fireEvent.click(screen.getByTestId('todo-when'))
    await settle()
    await fireEvent.keyDown(screen.getByTestId('todo-edit-due'), { key: 'Enter' })
    await settle()
    expect(update).toHaveBeenCalledWith('t1', { due: null })
  })

  it('removes a task with Delete from the box tabbing lands on', async () => {
    file = { ...file, tasks: [task()] }
    await mount()
    await fireEvent.keyDown(screen.getByTestId('todo-complete'), { key: 'Delete' })
    await settle()
    expect(remove).toHaveBeenCalledWith('t1')
  })

  it('lets the row play its completion before the task is ticked off', async () => {
    file = { ...file, tasks: [task()] }
    await mount()
    await fireEvent.click(screen.getByTestId('todo-complete'))
    await settle()
    expect(update).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    await settle()
    expect(update).toHaveBeenCalledWith('t1', { done: true })
  })

  it('pulses a late task on the shared beat, and asks for no beat when nothing is late', async () => {
    file.tasks = [task({ id: 'late', title: 'overdue', due: NOW - 3_600_000 })]
    await mount()
    const pane = screen.getByTestId('todo')
    expect(pane.querySelector('.row.late')).not.toBeNull()
    const phases: Array<string | undefined> = []
    for (let step = 0; step < 4; step++) {
      vi.advanceTimersByTime(250)
      flushSync()
      phases.push(pane.dataset.pulse)
    }
    expect(new Set(phases)).toEqual(new Set(['0', '1', '2', '3']))

    // Done with: nothing is late, and the pane stops asking.
    changed?.({ ...file, tasks: [] })
    await settle()
    expect(pane.querySelector('.row.late')).toBeNull()
    expect(pane.dataset.pulse).toBeUndefined()
  })
})
