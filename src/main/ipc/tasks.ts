import path from 'node:path'
import { CH } from '@shared/channels'
import {
  DEFAULT_LIST_ID,
  emptyTasks,
  type NewTask,
  NewTaskSchema,
  nextOccurrence,
  TASK_LIMITS,
  type Task,
  type TaskList,
  type TaskPatch,
  TaskPatchSchema,
  type TaskReminder,
  type TasksFile,
  TasksFileSchema,
} from '@shared/tasks'
import { app, ipcMain, Notification, powerMonitor } from 'electron'
import { appWindows } from '../app-windows.js'
import { createScheduler } from '../reminders/scheduler.js'
import { JsonStore } from '../store/json-store.js'
import { watchUserFile } from '../store/watch-user-file.js'
import { showMainWindow, windowInFront } from '../window-control.js'
import type { SettingsHandle } from './settings.js'

/**
 * Tasks, and the reminders that are the reason main owns them.
 *
 * A deadline has to arrive whether or not a tasks pane is open, so the schedule
 * lives here rather than in a widget: one timer for the next deadline of all
 * (reminders/scheduler.ts), recomputed whenever the tasks, the settings or the
 * machine's sleep state change. Nothing is fetched and nothing is polled.
 */

export function registerTasksIpc(settings: SettingsHandle): { dispose: () => void } {
  const file = path.join(app.getPath('userData'), 'tasks.json')
  const store = new JsonStore<TasksFile>({
    file,
    schema: TasksFileSchema,
    makeDefault: emptyTasks,
    keepInvalid: true,
  })

  let tasks = withDefaultList(store.read())

  const broadcast = (channel: string, payload: unknown): void => {
    for (const win of appWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(channel, payload)
    }
  }

  const leadMs = (): number => settings.current().reminders.leadMinutes * 60_000

  const scheduler = createScheduler((task, at) => announce(task, at))

  const commit = (next: TasksFile): void => {
    tasks = next
    store.write(next)
    broadcast(CH.tasks.changed, tasks)
    scheduler.update(tasks.tasks, leadMs())
  }

  /**
   * Announces one task: the banner every window draws, and the system's own
   * notification when no window is in front to show it.
   */
  const announce = (task: Task, at: number): void => {
    // Mark it announced first. A reminder that fails to reach anybody must still
    // not come round again in a loop.
    commit({
      ...tasks,
      tasks: tasks.tasks.map((entry) =>
        entry.id === task.id ? { ...entry, remindedAt: at } : entry,
      ),
    })

    const reminders = settings.current().reminders
    if (!reminders.notify) return

    const payload: TaskReminder = {
      taskId: task.id,
      title: task.title,
      at,
      overdue: task.due !== undefined && task.due < Date.now() - 60_000,
    }
    broadcast(CH.tasks.remind, payload)

    if (!reminders.system || windowInFront() || !Notification.isSupported()) return
    const notification = new Notification({
      title: task.title.slice(0, 200),
      body: payload.overdue ? 'overdue' : 'due now',
    })
    notification.on('click', showMainWindow)
    notification.show()
  }

  // SettingsHandle has no way to take a listener back, so it checks for itself
  // whether this module is still the one running.
  let disposed = false
  settings.onChange(() => {
    if (!disposed) scheduler.update(tasks.tasks, leadMs())
  })
  // Timers count monotonic time, so a machine that slept through a deadline
  // wakes with the timeout still pending. Look again as soon as it is back.
  const onResume = (): void => scheduler.update(tasks.tasks, leadMs())
  powerMonitor.on('resume', onResume)

  const watcher = watchUserFile(file, () => {
    store.invalidate()
    const next = withDefaultList(store.read())
    if (JSON.stringify(next) === JSON.stringify(tasks)) return
    tasks = next
    broadcast(CH.tasks.changed, tasks)
    scheduler.update(tasks.tasks, leadMs())
  })

  ipcMain.handle(CH.tasks.list, (): TasksFile => tasks)

  ipcMain.handle(CH.tasks.add, (_event, raw: unknown): Task | null => {
    const parsed = NewTaskSchema.safeParse(raw)
    if (!parsed.success) return null
    if (tasks.tasks.length >= TASK_LIMITS.tasks) return null
    const task = makeTask(parsed.data, tasks)
    commit({ ...tasks, tasks: [...tasks.tasks, task] })
    return task
  })

  ipcMain.handle(CH.tasks.update, (_event, id: unknown, raw: unknown): Task | null => {
    if (typeof id !== 'string') return null
    const parsed = TaskPatchSchema.safeParse(raw)
    if (!parsed.success) return null
    const current = tasks.tasks.find((task) => task.id === id)
    if (current === undefined) return null

    const next = applyPatch(current, parsed.data)
    const repeated = repeatOf(current, next, tasks)
    commit({
      ...tasks,
      tasks: [
        ...tasks.tasks.map((task) => (task.id === id ? next : task)),
        ...(repeated === null ? [] : [repeated]),
      ],
    })
    return next
  })

  ipcMain.handle(CH.tasks.remove, (_event, id: unknown): boolean => {
    if (typeof id !== 'string' || !tasks.tasks.some((task) => task.id === id)) return false
    commit({ ...tasks, tasks: tasks.tasks.filter((task) => task.id !== id) })
    return true
  })

  ipcMain.handle(CH.tasks.clearCompleted, (_event, listId: unknown): number => {
    if (typeof listId !== 'string') return 0
    const keep = tasks.tasks.filter((task) => !(task.done && task.listId === listId))
    const gone = tasks.tasks.length - keep.length
    if (gone > 0) commit({ ...tasks, tasks: keep })
    return gone
  })

  ipcMain.handle(CH.tasks.addList, (_event, name: unknown): TaskList | null => {
    if (typeof name !== 'string') return null
    const trimmed = name.trim().slice(0, TASK_LIMITS.listName)
    if (trimmed === '' || tasks.lists.length >= TASK_LIMITS.lists) return null
    const list: TaskList = { id: crypto.randomUUID(), name: trimmed }
    commit({ ...tasks, lists: [...tasks.lists, list] })
    return list
  })

  ipcMain.handle(CH.tasks.renameList, (_event, id: unknown, name: unknown): boolean => {
    if (typeof id !== 'string' || typeof name !== 'string') return false
    const trimmed = name.trim().slice(0, TASK_LIMITS.listName)
    if (trimmed === '' || !tasks.lists.some((list) => list.id === id)) return false
    commit({
      ...tasks,
      lists: tasks.lists.map((list) => (list.id === id ? { ...list, name: trimmed } : list)),
    })
    return true
  })

  ipcMain.handle(CH.tasks.removeList, (_event, id: unknown): boolean => {
    if (typeof id !== 'string') return false
    // The last list never goes: a pane with no list to show has nothing to offer.
    if (tasks.lists.length <= 1 || !tasks.lists.some((list) => list.id === id)) return false
    commit({
      ...tasks,
      lists: tasks.lists.filter((list) => list.id !== id),
      tasks: tasks.tasks.filter((task) => task.listId !== id),
    })
    return true
  })

  scheduler.update(tasks.tasks, leadMs())

  return {
    dispose: () => {
      disposed = true
      powerMonitor.off('resume', onResume)
      scheduler.dispose()
      watcher.close()
      for (const channel of [
        CH.tasks.list,
        CH.tasks.add,
        CH.tasks.update,
        CH.tasks.remove,
        CH.tasks.clearCompleted,
        CH.tasks.addList,
        CH.tasks.renameList,
        CH.tasks.removeList,
      ]) {
        ipcMain.removeHandler(channel)
      }
    },
  }
}

/** A file edited down to no lists at all still has somewhere to put a task. */
function withDefaultList(file: TasksFile): TasksFile {
  if (file.lists.length > 0) return file
  return { ...file, lists: [{ id: DEFAULT_LIST_ID, name: 'tasks' }] }
}

function makeTask(input: NewTask, file: TasksFile): Task {
  const now = Date.now()
  const orders = file.tasks.filter((task) => task.listId === input.listId).map((task) => task.order)
  return {
    id: crypto.randomUUID(),
    listId: input.listId,
    title: input.title,
    ...(input.due === undefined ? {} : { due: input.due }),
    allDay: input.allDay ?? false,
    repeat: input.repeat ?? 'none',
    done: false,
    order: orders.length === 0 ? 0 : Math.max(...orders) + 1,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Applies a patch.
 *
 * Changing a deadline clears what was already announced for the old one, so a
 * task moved forward alerts again; ticking one off records when.
 */
function applyPatch(current: Task, patch: TaskPatch): Task {
  const next: Task = { ...current, updatedAt: Date.now() }

  if (patch.title !== undefined) next.title = patch.title
  if (patch.note !== undefined) next.note = patch.note
  if (patch.allDay !== undefined) next.allDay = patch.allDay
  if (patch.repeat !== undefined) next.repeat = patch.repeat
  if (patch.order !== undefined) next.order = patch.order
  if (patch.listId !== undefined) next.listId = patch.listId

  applyTiming(next, patch)
  if (patch.done !== undefined && patch.done !== current.done) applyDone(next, patch.done)

  return next
}

/** The deadline and the snooze, both of which decide what is still to be announced. */
function applyTiming(next: Task, patch: TaskPatch): void {
  if (patch.due !== undefined) {
    if (patch.due === null) delete next.due
    else next.due = patch.due
    delete next.remindedAt
    delete next.snoozedUntil
  }

  if (patch.snoozedUntil === undefined) return
  if (patch.snoozedUntil === null) {
    delete next.snoozedUntil
    return
  }
  next.snoozedUntil = patch.snoozedUntil
  delete next.remindedAt
}

/** Ticking a task off, or putting it back. */
function applyDone(next: Task, done: boolean): void {
  next.done = done
  delete next.snoozedUntil
  if (done) {
    next.completedAt = Date.now()
    return
  }
  // Brought back to life: it is waiting for its deadline again.
  delete next.completedAt
  delete next.remindedAt
}

/**
 * The next occurrence of a repeating task, when this change completed one.
 *
 * The completed task stays as it is - the record of having done it - and a fresh
 * one is added for the next deadline, counted from the deadline just met.
 */
function repeatOf(current: Task, next: Task, file: TasksFile): Task | null {
  if (current.done || !next.done) return null
  if (next.repeat === 'none' || next.due === undefined) return null
  if (file.tasks.length >= TASK_LIMITS.tasks) return null

  const due = nextOccurrence(next.due, next.repeat)
  if (due === null) return null
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    listId: next.listId,
    title: next.title,
    ...(next.note === undefined ? {} : { note: next.note }),
    due,
    allDay: next.allDay,
    repeat: next.repeat,
    done: false,
    order: next.order,
    createdAt: now,
    updatedAt: now,
  }
}
