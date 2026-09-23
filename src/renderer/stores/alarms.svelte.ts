import type { Alarm, AlarmPatch, NewAlarm } from '@shared/alarms'
import { refCounted } from '../lib/ref-counted.ts'

/**
 * The alarms every chrono pane shares.
 *
 * One read per window, reference-counted like the notes and the tasks: a second
 * pane costs nothing, and a window with no chrono pane is not listening. The
 * alarms themselves live in main, which is also what announces them, so what is
 * here is only what the pane draws.
 */
class AlarmsStore {
  // Replaced whole with each change from main, never changed in place: no deep proxy.
  items = $state.raw<Alarm[]>([])
  ready = $state(false)

  /** Called by a pane while it is mounted; returns the release. */
  readonly use = refCounted(() => this.start())

  async add(alarm: NewAlarm): Promise<Alarm | null> {
    const made = await window.elecdex.alarms.add(alarm)
    if (made !== null) this.merge(made)
    return made
  }

  async update(id: string, patch: AlarmPatch): Promise<Alarm | null> {
    const next = await window.elecdex.alarms.update(id, patch)
    if (next !== null) this.merge(next)
    return next
  }

  async remove(id: string): Promise<void> {
    await window.elecdex.alarms.remove(id)
    this.items = this.items.filter((alarm) => alarm.id !== id)
  }

  /**
   * Puts one alarm in, whether or not it is already there.
   *
   * Main broadcasts the file as it writes, and that can reach the window before
   * the call that caused it has returned; appending what comes back would put
   * the same alarm in the list twice, and a keyed list throws on the duplicate.
   */
  private merge(alarm: Alarm): void {
    const at = this.items.findIndex((entry) => entry.id === alarm.id)
    if (at === -1) this.items = [...this.items, alarm]
    else this.items = this.items.map((entry) => (entry.id === alarm.id ? alarm : entry))
  }

  /** Follows main's file and answers the first reading; returns how to stop. */
  private start(): () => void {
    const stop = window.elecdex.alarms.onChange((file) => {
      this.items = file.alarms
      this.ready = true
    })
    void window.elecdex.alarms.list().then((file) => {
      this.items = file.alarms
      this.ready = true
    })
    return stop
  }
}

export const alarms = new AlarmsStore()
