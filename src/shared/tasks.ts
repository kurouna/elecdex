import { z } from 'zod'

/**
 * Tasks and their lists, kept in tasks.json under userData.
 *
 * Owned by main for two reasons. Like a note, a task outlives the pane that
 * created it; unlike a note, a task has to be watched even when no pane is
 * open, because its reminder has to arrive whether or not the user left the
 * pane on screen (main/reminders).
 */

export const TASKS_VERSION = 1

export const TASK_LIMITS = {
  tasks: 1000,
  lists: 20,
  title: 200,
  note: 2000,
  listName: 40,
} as const

export const REPEATS = ['none', 'daily', 'weekdays', 'weekly', 'monthly'] as const
export type Repeat = (typeof REPEATS)[number]

export const TaskSchema = z.object({
  id: z.string().min(1).max(64),
  listId: z.string().min(1).max(64),
  title: z.string().min(1).max(TASK_LIMITS.title),
  note: z.string().max(TASK_LIMITS.note).optional(),
  /** When it is due, in epoch milliseconds. Absent for a task with no deadline. */
  due: z.number().int().nonnegative().optional(),
  /** The due time is a date the user named, not a clock time: shown without one. */
  allDay: z.boolean().default(false),
  repeat: z.enum(REPEATS).default('none'),
  done: z.boolean().default(false),
  completedAt: z.number().int().nonnegative().optional(),
  /** Manual order within a list; lower is higher up. */
  order: z.number().default(0),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  /** The due time this task was last announced for, so one deadline alerts once. */
  remindedAt: z.number().int().nonnegative().optional(),
  /** Put off until then; the reminder waits for this instead of `due`. */
  snoozedUntil: z.number().int().nonnegative().optional(),
})
export type Task = z.infer<typeof TaskSchema>

export const TaskListSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(TASK_LIMITS.listName),
})
export type TaskList = z.infer<typeof TaskListSchema>

export const TasksFileSchema = z.object({
  version: z.literal(TASKS_VERSION).default(TASKS_VERSION),
  lists: z.array(TaskListSchema).max(TASK_LIMITS.lists).default([]),
  tasks: z.array(TaskSchema).max(TASK_LIMITS.tasks).default([]),
})
export type TasksFile = z.infer<typeof TasksFileSchema>

export const DEFAULT_LIST_ID = 'tasks'

export const emptyTasks = (): TasksFile => ({
  version: TASKS_VERSION,
  lists: [{ id: DEFAULT_LIST_ID, name: 'tasks' }],
  tasks: [],
})

/** What a pane may ask main to add. Main supplies the id, the order and the clock. */
export const NewTaskSchema = z.object({
  listId: z.string().min(1).max(64),
  title: z.string().min(1).max(TASK_LIMITS.title),
  due: z.number().int().nonnegative().optional(),
  allDay: z.boolean().optional(),
  repeat: z.enum(REPEATS).optional(),
})
export type NewTask = z.infer<typeof NewTaskSchema>

/** What a pane may change about an existing task. */
export const TaskPatchSchema = z.object({
  title: z.string().min(1).max(TASK_LIMITS.title).optional(),
  note: z.string().max(TASK_LIMITS.note).optional(),
  due: z.number().int().nonnegative().nullable().optional(),
  allDay: z.boolean().optional(),
  repeat: z.enum(REPEATS).optional(),
  done: z.boolean().optional(),
  order: z.number().optional(),
  listId: z.string().min(1).max(64).optional(),
  snoozedUntil: z.number().int().nonnegative().nullable().optional(),
})
export type TaskPatch = z.infer<typeof TaskPatchSchema>

/** What main sends when a task comes due. */
export interface TaskReminder {
  taskId: string
  title: string
  /** The moment it was announced for: the due time, or the end of a snooze. */
  at: number
  /** True when it was already overdue at the time it was announced. */
  overdue: boolean
}

const DAY_MS = 86_400_000

/**
 * When a repeating task next comes due, from the deadline it just met.
 *
 * Counted from the deadline rather than from the moment it was ticked off, so a
 * weekly task done three days late is still due on its own day next week. Months
 * keep the day of the month and are clamped, so the 31st in a 30-day month lands
 * on the 30th rather than sliding into the next month.
 */
export function nextOccurrence(due: number, repeat: Repeat, now = Date.now()): number | null {
  if (repeat === 'none') return null

  let next = due
  // A task left undone for weeks would otherwise come back already overdue.
  let guard = 0
  do {
    next = advance(next, repeat)
    guard += 1
  } while (next <= now && guard < 500)
  return next
}

function advance(from: number, repeat: Repeat): number {
  if (repeat === 'daily') return from + DAY_MS
  if (repeat === 'weekly') return from + 7 * DAY_MS
  if (repeat === 'weekdays') {
    const date = new Date(from)
    const day = date.getDay()
    // Friday and Saturday jump the weekend; Sunday is already before Monday.
    const skip = day === 5 ? 3 : day === 6 ? 2 : 1
    return from + skip * DAY_MS
  }
  const date = new Date(from)
  const day = date.getDate()
  const target = new Date(date)
  target.setDate(1)
  target.setMonth(target.getMonth() + 1)
  const lastOfMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, lastOfMonth))
  return target.getTime()
}

/** The moment a task should be announced at, or null when it never should. */
export function dueAt(task: Task, leadMs = 0): number | null {
  if (task.done) return null
  if (task.snoozedUntil !== undefined) return task.snoozedUntil
  if (task.due === undefined) return null
  return task.due - leadMs
}

/**
 * The next task to announce and when, or null when nothing is waiting.
 *
 * Main schedules one timer for this moment alone rather than polling, so a
 * thousand tasks cost one `setTimeout`.
 */
export function nextReminder(
  tasks: readonly Task[],
  leadMs = 0,
): { task: Task; at: number } | null {
  let best: { task: Task; at: number } | null = null
  for (const task of tasks) {
    const at = dueAt(task, leadMs)
    if (at === null) continue
    // Announced already for this deadline: nothing more to say until it moves.
    if (task.remindedAt !== undefined && task.remindedAt >= at) continue
    if (best === null || at < best.at) best = { task, at }
  }
  return best
}

/** How tasks are grouped under their headings in the pane. */
export type TaskBand = 'overdue' | 'today' | 'tomorrow' | 'later' | 'someday'

export const BAND_LABELS: Record<TaskBand, string> = {
  overdue: 'overdue',
  today: 'today',
  tomorrow: 'tomorrow',
  later: 'later',
  someday: 'no due date',
}

/** Midnight at the start of the day `at` falls in, in the local zone. */
export function startOfDay(at: number): number {
  const date = new Date(at)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function bandOf(task: Task, now: number): TaskBand {
  if (task.due === undefined) return 'someday'
  if (task.due < now) return 'overdue'
  const today = startOfDay(now)
  if (task.due < today + DAY_MS) return 'today'
  if (task.due < today + 2 * DAY_MS) return 'tomorrow'
  return 'later'
}

/**
 * How far a task has travelled from when it was made to when it is due, 0 to 1.
 *
 * The pane draws this as a meter, so a deadline is visible as a quantity rather
 * than as a date to be worked out. A task made after its own deadline (typed as
 * already overdue) starts full instead of dividing by nothing.
 */
export function urgency(task: Task, now: number): number {
  if (task.due === undefined) return 0
  const span = task.due - task.createdAt
  if (span <= 0) return 1
  return Math.max(0, Math.min(1, (now - task.createdAt) / span))
}
