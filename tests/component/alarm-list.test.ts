import type { Alarm, AlarmPatch, AlarmsFile, NewAlarm } from '@shared/alarms'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: AlarmList } = await import('../../src/renderer/widgets/timer/AlarmList.svelte')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')

/**
 * The alarm list.
 *
 * An alarm is set once and then only switched on and off, so what this pins down
 * is the switching: the state is main's, the pane only asks for the change, and
 * a time typed however the user types it is understood or refused - never
 * guessed at.
 */

/** Wednesday, 16 September 2026, 10:00 local. */
const NOW = new Date(2026, 8, 16, 10, 0).getTime()

const alarm = (over: Partial<Alarm> = {}): Alarm => ({
  id: 'a1',
  label: 'wake up',
  hour: 7,
  minute: 0,
  days: [1, 2, 3, 4, 5],
  enabled: true,
  ...over,
})

let file: AlarmsFile
let changed: ((next: AlarmsFile) => void) | null = null
let add: ReturnType<typeof vi.fn>
let update: ReturnType<typeof vi.fn>
let remove: ReturnType<typeof vi.fn>

beforeEach(() => {
  changed = null
  file = { version: 1, alarms: [] }
  add = vi.fn(async (input: NewAlarm) =>
    alarm({
      id: `a${Date.now()}`,
      hour: input.hour,
      minute: input.minute,
      label: input.label ?? '',
      days: input.days ?? [],
    }),
  )
  update = vi.fn(async (id: string, patch: AlarmPatch) => ({ ...alarm({ id }), ...patch }))
  remove = vi.fn(async () => true)
  vi.stubGlobal('elecdex', {
    alarms: {
      list: vi.fn(async () => structuredClone(file)),
      add,
      update,
      remove,
      onChange: (handler: (next: AlarmsFile) => void) => {
        changed = handler
        return () => {}
      },
      onRing: () => () => {},
    },
  })
})

afterEach(() => {
  cleanup()
  toasts.clear()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

/** Renders on the alarms this test set up; the store outlives one component. */
async function mount(): Promise<void> {
  render(AlarmList, { props: { now: NOW } })
  await settle()
  changed?.(structuredClone(file))
  await settle()
}

describe('AlarmList', () => {
  it('sets an alarm from a time typed any way round', async () => {
    await mount()
    await fireEvent.input(screen.getByTestId('alarm-time-input'), { target: { value: '７：３０' } })
    await fireEvent.input(screen.getByTestId('alarm-label-input'), { target: { value: 'lunch' } })
    await fireEvent.click(screen.getByTestId('alarm-add-button'))
    await settle()
    expect(add).toHaveBeenCalledWith({ hour: 7, minute: 30, label: 'lunch' })
  })

  it('refuses what is not a time rather than setting the wrong one', async () => {
    await mount()
    await fireEvent.input(screen.getByTestId('alarm-time-input'), { target: { value: 'lunch' } })
    await fireEvent.keyDown(screen.getByTestId('alarm-time-input'), { key: 'Enter' })
    await settle()
    expect(add).not.toHaveBeenCalled()
  })

  it('switches one off without losing it', async () => {
    file = { version: 1, alarms: [alarm()] }
    await mount()
    expect(screen.getByTestId('alarm')).toHaveProperty('dataset.enabled', 'true')

    await fireEvent.click(screen.getByTestId('alarm-toggle'))
    await settle()
    expect(update).toHaveBeenCalledWith('a1', { enabled: false })
    expect(screen.getAllByTestId('alarm')).toHaveLength(1)
  })

  it('says when the next one goes off, and on which days', async () => {
    file = { version: 1, alarms: [alarm()] }
    await mount()
    // 07:00 on weekdays, from Wednesday morning: tomorrow, in 21 hours.
    expect(screen.getByTestId('alarm-next').textContent).toContain('07:00')
    expect(screen.getByTestId('alarm-next').textContent).toContain('in 21h')
    expect(screen.getByTestId('alarm-days').textContent).toContain('weekdays')
  })

  it('changes which days it repeats on', async () => {
    file = { version: 1, alarms: [alarm()] }
    await mount()
    await fireEvent.click(screen.getByTestId('alarm-days'))
    await settle()
    await fireEvent.click(
      screen.getByTestId('alarm-day-picker').querySelector('[data-day="0"]') as HTMLElement,
    )
    await settle()
    expect(update).toHaveBeenCalledWith('a1', { days: [1, 2, 3, 4, 5, 0] })
  })

  it('nudges a time, wrapping round midnight rather than running past it', async () => {
    file = { version: 1, alarms: [alarm({ hour: 0, minute: 0 })] }
    await mount()
    await fireEvent.click(screen.getByLabelText('five minutes earlier'))
    await settle()
    expect(update).toHaveBeenCalledWith('a1', { hour: 23, minute: 55 })
  })

  it('offers a removed alarm back', async () => {
    file = { version: 1, alarms: [alarm()] }
    await mount()
    await fireEvent.click(screen.getByTestId('alarm-remove'))
    await settle()
    expect(remove).toHaveBeenCalledWith('a1')

    const undo = toasts.items.at(-1)?.actions.find((action) => action.label === 'undo')
    undo?.run()
    await settle()
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ hour: 7, minute: 0, label: 'wake up' }),
    )
  })
})
