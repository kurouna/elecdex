import type { NewTask, Task, TaskList, TaskPatch } from '@shared/tasks'

/**
 * The tasks every tasks pane shares.
 *
 * As with the notes: one read per window, reference-counted, and the lists come
 * along with the tasks so a pane can name the one it is showing. Changes are
 * applied to the store as soon as main answers, so the pane does not wait for
 * the broadcast to come back round.
 */
class TasksStore {
  items = $state<Task[]>([])
  lists = $state<TaskList[]>([])
  ready = $state(false)

  private users = 0
  private stop: (() => void) | null = null

  use(): () => void {
    this.users += 1
    if (this.users === 1) this.start()
    return () => {
      this.users -= 1
      if (this.users === 0) {
        this.stop?.()
        this.stop = null
      }
    }
  }

  inList(listId: string): Task[] {
    return this.items.filter((task) => task.listId === listId)
  }

  async add(task: NewTask): Promise<Task | null> {
    const made = await window.elecdex.tasks.add(task)
    if (made !== null) this.items = [...this.items, made]
    return made
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
    if (list !== null) this.lists = [...this.lists, list]
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

  private start(): void {
    this.stop = window.elecdex.tasks.onChange((file) => {
      this.items = file.tasks
      this.lists = file.lists
      this.ready = true
    })
    void window.elecdex.tasks.list().then((file) => {
      this.items = file.tasks
      this.lists = file.lists
      this.ready = true
    })
  }
}

export const tasks = new TasksStore()
