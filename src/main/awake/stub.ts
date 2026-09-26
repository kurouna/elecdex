import type { BlockerKind } from '@shared/utility'
import type { PowerSource } from './power.js'
import type { PowerBlocker } from './service.js'

/**
 * A stand-in for the power-save blocker and the power source
 * (ELECDEX_AWAKE_STUB=1, the tests): a test run never keeps this machine
 * awake. The end-to-end tests read what is held, and switch to the battery,
 * through `globalThis.__elecdexAwake`.
 */
export interface AwakeHooks {
  /** The kinds held now, in the order they were asked for. */
  held(): BlockerKind[]
  /** Every kind ever asked for, so a test sees a change of level take the new one first. */
  asked(): BlockerKind[]
  battery(on: boolean): void
  /** The machine woke from a sleep. */
  resume(): void
}

export function stubAwake(): { blocker: PowerBlocker; power: PowerSource } {
  const held = new Map<number, BlockerKind>()
  const asked: BlockerKind[] = []
  let next = 1
  let battery = false
  let onChange = (): void => {}
  let onResume = (): void => {}
  const hooks: AwakeHooks = {
    held: () => [...held.values()],
    asked: () => [...asked],
    battery: (on) => {
      battery = on
      onChange()
    },
    resume: () => onResume(),
  }
  ;(globalThis as { __elecdexAwake?: AwakeHooks }).__elecdexAwake = hooks
  return {
    blocker: {
      start: (kind) => {
        const id = next
        next += 1
        held.set(id, kind)
        asked.push(kind)
        return id
      },
      stop: (id) => {
        held.delete(id)
      },
      isStarted: (id) => held.has(id),
    },
    power: {
      onBattery: () => battery,
      watch: (changed, resumed) => {
        onChange = changed
        onResume = resumed
        return () => {
          onChange = () => {}
          onResume = () => {}
        }
      },
    },
  }
}
