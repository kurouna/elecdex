import type { BlockerKind } from '@shared/utility'
import { powerMonitor, powerSaveBlocker } from 'electron'
import type { PowerBlocker } from './service.js'

/** Where the machine's power comes from, and word when that changes or it wakes. */
export interface PowerSource {
  onBattery(): boolean
  /** Calls `changed` when the source changes and `resumed` after a sleep; returns the removal. */
  watch(changed: () => void, resumed: () => void): () => void
}

export const systemBlocker: PowerBlocker = {
  start: (kind: BlockerKind) => powerSaveBlocker.start(kind),
  stop: (id) => powerSaveBlocker.stop(id),
  isStarted: (id) => powerSaveBlocker.isStarted(id),
}

export const systemPower: PowerSource = {
  onBattery: () => powerMonitor.isOnBatteryPower(),
  watch: (changed, resumed) => {
    powerMonitor.on('on-battery', changed)
    powerMonitor.on('on-ac', changed)
    powerMonitor.on('resume', resumed)
    return () => {
      powerMonitor.off('on-battery', changed)
      powerMonitor.off('on-ac', changed)
      powerMonitor.off('resume', resumed)
    }
  },
}
