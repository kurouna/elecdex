import path from 'node:path'
import {
  ALARM_LIMITS,
  type Alarm,
  type AlarmPatch,
  AlarmPatchSchema,
  type AlarmRing,
  type AlarmsFile,
  AlarmsFileSchema,
  emptyAlarms,
  formatAlarmTime,
  isSpent,
  type NewAlarm,
  NewAlarmSchema,
  nextAlarmAt,
} from '@shared/alarms'
import { CH } from '@shared/channels'
import { app, ipcMain, Notification, powerMonitor } from 'electron'
import { appWindows } from '../app-windows.js'
import { createScheduler } from '../reminders/scheduler.js'
import { JsonStore } from '../store/json-store.js'
import { watchUserFile } from '../store/watch-user-file.js'
import { showMainWindow, windowInFront } from '../window-control.js'
import type { SettingsHandle } from './settings.js'

/**
 * Alarms: a time of day, announced whether or not the chrono pane is open.
 *
 * Owned by main for the same reason the tasks are - an alarm that only goes off
 * while its pane happens to be on screen is not an alarm - and scheduled the
 * same way: one timer for the next of them all (reminders/scheduler.ts), worked
 * out again whenever the alarms change, the machine wakes, or one goes off.
 * Nothing is polled.
 */

export function registerAlarmsIpc(settings: SettingsHandle): { dispose: () => void } {
  const file = path.join(app.getPath('userData'), 'alarms.json')
  const store = new JsonStore<AlarmsFile>({
    file,
    schema: AlarmsFileSchema,
    makeDefault: emptyAlarms,
    keepInvalid: true,
  })

  let alarms = store.read()

  const broadcast = (channel: string, payload: unknown): void => {
    for (const win of appWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(channel, payload)
    }
  }

  /** The moments the scheduler waits on: the next time each alarm is due. */
  const moments = (): { id: string; at: number }[] =>
    alarms.alarms.flatMap((alarm) => {
      const at = nextAlarmAt(alarm, Date.now())
      return at === null ? [] : [{ id: alarm.id, at }]
    })

  const scheduler = createScheduler((id, at) => {
    const alarm = alarms.alarms.find((entry) => entry.id === id)
    if (alarm !== undefined) ring(alarm, at)
  })

  const commit = (next: AlarmsFile): void => {
    alarms = next
    store.write(next)
    broadcast(CH.alarms.changed, alarms)
    scheduler.update(moments())
  }

  /**
   * Announces one alarm.
   *
   * A one-off has had its moment, so it switches itself off - as a phone's does
   * - while a repeating one is only marked as having rung, which is what keeps
   * the same time of day from being announced twice.
   */
  const ring = (alarm: Alarm, at: number): void => {
    const once = isSpent(alarm)
    commit({
      ...alarms,
      alarms: alarms.alarms.map((entry) =>
        entry.id === alarm.id
          ? { ...entry, lastRangAt: at, ...(once ? { enabled: false } : {}) }
          : entry,
      ),
    })

    if (!settings.current().reminders.notify) return

    const label = alarm.label.trim() === '' ? formatAlarmTime(alarm) : alarm.label
    const payload: AlarmRing = { alarmId: alarm.id, label, at, once }
    broadcast(CH.alarms.ring, payload)

    if (!settings.current().reminders.system || windowInFront() || !Notification.isSupported()) {
      return
    }
    const notification = new Notification({
      title: label.slice(0, 200),
      body: formatAlarmTime(alarm),
    })
    notification.on('click', showMainWindow)
    notification.show()
  }

  let disposed = false
  // A machine that slept through an alarm wakes with its timer still pending,
  // and the days may have moved on: work the schedule out again.
  const onResume = (): void => {
    if (!disposed) scheduler.update(moments())
  }
  powerMonitor.on('resume', onResume)

  const watcher = watchUserFile(file, () => {
    store.invalidate()
    const next = store.read()
    if (JSON.stringify(next) === JSON.stringify(alarms)) return
    alarms = next
    broadcast(CH.alarms.changed, alarms)
    scheduler.update(moments())
  })

  ipcMain.handle(CH.alarms.list, (): AlarmsFile => alarms)

  ipcMain.handle(CH.alarms.add, (_event, raw: unknown): Alarm | null => {
    const parsed = NewAlarmSchema.safeParse(raw)
    if (!parsed.success) return null
    if (alarms.alarms.length >= ALARM_LIMITS.alarms) return null
    const alarm = makeAlarm(parsed.data)
    commit({ ...alarms, alarms: [...alarms.alarms, alarm] })
    return alarm
  })

  ipcMain.handle(CH.alarms.update, (_event, id: unknown, raw: unknown): Alarm | null => {
    if (typeof id !== 'string') return null
    const parsed = AlarmPatchSchema.safeParse(raw)
    if (!parsed.success) return null
    const current = alarms.alarms.find((alarm) => alarm.id === id)
    if (current === undefined) return null

    const next = applyPatch(current, parsed.data)
    commit({ ...alarms, alarms: alarms.alarms.map((alarm) => (alarm.id === id ? next : alarm)) })
    return next
  })

  ipcMain.handle(CH.alarms.remove, (_event, id: unknown): boolean => {
    if (typeof id !== 'string' || !alarms.alarms.some((alarm) => alarm.id === id)) return false
    commit({ ...alarms, alarms: alarms.alarms.filter((alarm) => alarm.id !== id) })
    return true
  })

  scheduler.update(moments())

  return {
    dispose: () => {
      disposed = true
      powerMonitor.off('resume', onResume)
      scheduler.dispose()
      watcher.close()
      for (const channel of [CH.alarms.list, CH.alarms.add, CH.alarms.update, CH.alarms.remove]) {
        ipcMain.removeHandler(channel)
      }
    },
  }
}

function makeAlarm(input: NewAlarm): Alarm {
  return {
    id: crypto.randomUUID(),
    label: (input.label ?? '').trim().slice(0, ALARM_LIMITS.label),
    hour: input.hour,
    minute: input.minute,
    days: [...new Set(input.days ?? [])].sort((a, b) => a - b),
    enabled: true,
  }
}

/**
 * Applies a change.
 *
 * Moving an alarm - its time, its days, or switching it back on - clears what it
 * last rang for, so the new time is announced even when the old one has already
 * been. Without that, an alarm moved forward within the same day would stay
 * silent until tomorrow.
 */
function applyPatch(current: Alarm, patch: AlarmPatch): Alarm {
  const next: Alarm = { ...current }
  const moved =
    (patch.hour !== undefined && patch.hour !== current.hour) ||
    (patch.minute !== undefined && patch.minute !== current.minute) ||
    patch.days !== undefined ||
    (patch.enabled === true && !current.enabled)

  if (patch.label !== undefined) next.label = patch.label.trim().slice(0, ALARM_LIMITS.label)
  if (patch.hour !== undefined) next.hour = patch.hour
  if (patch.minute !== undefined) next.minute = patch.minute
  if (patch.days !== undefined) next.days = [...new Set(patch.days)].sort((a, b) => a - b)
  if (patch.enabled !== undefined) next.enabled = patch.enabled
  if (moved) delete next.lastRangAt

  return next
}
