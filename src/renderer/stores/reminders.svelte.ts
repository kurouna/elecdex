import type { TaskReminder } from '@shared/tasks'
import { appearance } from './appearance.svelte.ts'
import { layout } from './layout.svelte.ts'
import { sfx } from './sound.svelte.ts'
import { toasts } from './toasts.svelte.ts'

/**
 * Task reminders, as the window shows them.
 *
 * Listened for at the app level rather than inside the tasks widget, because
 * that is the whole point of the arrangement: main schedules a deadline whether
 * or not a pane is open, so the banner has to exist whether or not one is.
 */

/** The pane a reminder opens when the user asks to see the task. */
const TASKS_WIDGET = 'todo'

function openTasks(): void {
  const existing = layout.paneWith(TASKS_WIDGET)
  if (existing !== null) {
    layout.focus(existing)
    return
  }
  layout.addPane(TASKS_WIDGET, 'tab')
}

/** Starts listening. Returns the unsubscribe, for `$effect`. */
export function watchReminders(): () => void {
  return window.elecdex.tasks.onRemind((reminder: TaskReminder) => {
    if (appearance.settings.reminders.sound) sfx.play('alarm')
    const snoozeMinutes = appearance.settings.reminders.snoozeMinutes

    toasts.show({
      title: reminder.title,
      body: reminder.overdue ? 'overdue' : 'due now',
      tone: reminder.overdue ? 'danger' : 'warn',
      // Long enough to be read on the way past, and held open under the pointer.
      timeoutMs: 20_000,
      actions: [
        {
          label: 'done',
          primary: true,
          run: () => {
            void window.elecdex.tasks.update(reminder.taskId, { done: true })
          },
        },
        {
          label: `snooze ${snoozeMinutes}m`,
          run: () => {
            void window.elecdex.tasks.update(reminder.taskId, {
              snoozedUntil: Date.now() + snoozeMinutes * 60_000,
            })
          },
        },
        { label: 'open', run: openTasks },
      ],
    })
  })
}
