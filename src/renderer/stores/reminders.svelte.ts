import type { AlarmRing } from '@shared/alarms'
import type { TaskReminder } from '@shared/tasks'
import { appearance } from './appearance.svelte.ts'
import { layout } from './layout.svelte.ts'
import { sfx } from './sound.svelte.ts'
import { toasts } from './toasts.svelte.ts'

/**
 * Task reminders and alarms, as the window shows them.
 *
 * Listened for at the app level rather than inside the panes, because that is
 * the whole point of the arrangement: main schedules a deadline and a time of
 * day whether or not a pane is open, so the banner has to exist whether or not
 * one is.
 */

/** The pane a notice opens when the user asks to see what it came from. */
const TASKS_WIDGET = 'todo'
const CHRONO_WIDGET = 'timer'

function openPane(widget: string): void {
  const existing = layout.paneWith(widget)
  if (existing !== null) {
    layout.focus(existing)
    return
  }
  layout.addPane(widget, 'tab')
}

const openTasks = (): void => openPane(TASKS_WIDGET)

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

/**
 * Alarms.
 *
 * Louder than a reminder on purpose: an alarm is set for a moment the day is
 * built around, so its card stays until it is answered rather than going of its
 * own accord, the way a phone's does.
 */
export function watchAlarms(): () => void {
  return window.elecdex.alarms.onRing((ring: AlarmRing) => {
    if (appearance.settings.reminders.sound) sfx.play('alarm')
    toasts.show({
      title: ring.label,
      body: ring.once ? 'alarm · switched off' : 'alarm',
      tone: 'warn',
      timeoutMs: 0,
      actions: [
        { label: 'dismiss', primary: true, run: () => undefined },
        { label: 'open', run: () => openPane(CHRONO_WIDGET) },
      ],
    })
  })
}
