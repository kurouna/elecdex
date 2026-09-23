import type { NewTask, Task, TaskList, TaskPatch } from '@shared/tasks'
import { refCounted } from '../lib/ref-counted.ts'

/**
 * The tasks every tasks pane shares.
 *
 * As with the notes: one read per window, reference-counted, and the lists come
 * along with the tasks so a pane can name the one it is showing. Changes are
 * applied to the store as soon as main answers, so the pane does not wait for
 * the broadcast to come back round.
 */
class TasksStore {
  // Replaced whole with each change from main, never changed in place: no deep proxy.
  items = $state.raw<Task[]>([])
  lists = $state.raw<TaskList[]>([])
  ready = $state(false)

  /** Called by a pane while it is mounted; returns the release. */
  readonly use = refCounted(() => this.start())

  inList(listId: string): Task[] {
    return this.items.filter((task) => task.listId === listId)
  }

  async add(task: NewTask): Promise<Task | null> {
    const made = await window.elecdex.tasks.add(task)
    if (made !== null) this.merge(made)
    return made
  }

  /**
   * Puts one task in, whether or not it is already there.
   *
   * Main broadcasts the whole file as it writes, and that broadcast can reach
   * the window before the call that caused it has returned - so appending what
   * comes back would put the same task in the list twice. A pane keyed by task
   * id then threw on the duplicate, and with the render broken it looked as
   * though nothing worked afterwards: a task ticked off simply stayed put.
   */
  private merge(task: Task): void {
    const at = this.items.findIndex((entry) => entry.id === task.id)
    if (at === -1) this.items = [...this.items, task]
    else this.items = this.items.map((entry) => (entry.id === task.id ? task : entry))
  }

  async update(id: string, patch: TaskPatch): Promise<Task | null> {
    const next = await window.elecdex.tasks.update(id, patch)
    if (next !== null) {
      this.items = this.items.map((task) => (task.id === id ? next : task))
      // Completing a repeating task makes its next occurrence in main; ask for
      // the file rather than guessing at the rule twice.
      if (patch.done === true) void this.refresh()
    }
    return next
  }

  async remove(id: string): Promise<void> {
    await window.elecdex.tasks.remove(id)
    this.items = this.items.filter((task) => task.id !== id)
  }

  async clearCompleted(listId: string): Promise<number> {
    const gone = await window.elecdex.tasks.clearCompleted(listId)
    if (gone > 0) this.items = this.items.filter((task) => !(task.done && task.listId === listId))
    return gone
  }

  async addList(name: string): Promise<TaskList | null> {
    const list = await window.elecdex.tasks.addList(name)
    if (list !== null && !this.lists.some((entry) => entry.id === list.id)) {
      this.lists = [...this.lists, list]
    }
    return list
  }

  async removeList(id: string): Promise<boolean> {
    const gone = await window.elecdex.tasks.removeList(id)
    if (gone) await this.refresh()
    return gone
  }

  private async refresh(): Promise<void> {
    const file = await window.elecdex.tasks.list()
    this.items = file.tasks
    this.lists = file.lists
  }

  /** Follows main's file and answers the first reading; returns how to stop. */
  private start(): () => void {
    const stop = window.elecdex.tasks.onChange((file) => {
      this.items = file.tasks
      this.lists = file.lists
      this.ready = true
    })
    void window.elecdex.tasks.list().then((file) => {
      this.items = file.tasks
      this.lists = file.lists
      this.ready = true
    })
    return stop
  }
}

export const tasks = new TasksStore()
