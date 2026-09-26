import path from 'node:path'
import { CH } from '@shared/channels'
import {
  AWAKE_EXTEND_MS,
  AWAKE_LEVELS,
  type AwakeState,
  awakeLine,
  isAwakeRequest,
  isUtilityCopy,
  UTILITY_LIMITS,
} from '@shared/utility'
import { app, ipcMain } from 'electron'
import { z } from 'zod'
import { appWindows } from '../app-windows.js'
import { systemBlocker, systemPower } from '../awake/power.js'
import { AwakeService } from '../awake/service.js'
import { stubAwake } from '../awake/stub.js'
import { seal, unseal } from '../secrets/seal.js'
import { secretCodec } from '../secrets/system.js'
import { JsonStore } from '../store/json-store.js'
import type { ClipboardWriter } from './clipboard.js'

/**
 * The UTILITY pane's IPC (docs/architecture.md section 5.16): AWAKE's hold,
 * sealed secrets and copies.
 *
 * The hold is taken up from awake.json here, before the window exists, and
 * goes on with no pane open: every change is sent to every window (the status
 * bar shows it) and to `onLine` (the tray's tooltip). With
 * ELECDEX_AWAKE_STUB=1 (the tests) the blocker and the power source are
 * stand-ins, so no run keeps this machine awake.
 *
 * No plugin can reach any of it: plugin-api.ts has none of these.
 */

const AwakeFileSchema = z.object({
  version: z.literal(1).default(1),
  level: z.enum(AWAKE_LEVELS).default('off'),
  until: z.number().nullable().default(null),
  since: z.number().nullable().default(null),
})

export interface UtilityIpc {
  /** Calls `listener` with the hold in words now and on every change (null when off). */
  onLine(listener: (line: string | null) => void): void
  dispose(): void
}

export function registerUtilityIpc(clipboard: ClipboardWriter): UtilityIpc {
  const stand = process.env.ELECDEX_AWAKE_STUB === '1' ? stubAwake() : null
  const power = stand?.power ?? systemPower
  const file = new JsonStore({
    file: path.join(app.getPath('userData'), 'awake.json'),
    schema: AwakeFileSchema,
    makeDefault: () => AwakeFileSchema.parse({}),
  })
  const lines = new Set<(line: string | null) => void>()

  const publish = (state: AwakeState): void => {
    for (const win of appWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(CH.utility.awakeChanged, state)
    }
    const line = awakeLine(state, Date.now())
    for (const listener of lines) listener(line)
  }

  const service = new AwakeService({
    blocker: stand?.blocker ?? systemBlocker,
    load: () => {
      const { level, until, since } = file.read()
      return { level, until, since }
    },
    save: (hold) => {
      const { level, until, since } = file.read()
      // Only a change is written: a hold taken up again as it was is not one.
      if (level === hold.level && until === hold.until && since === hold.since) return
      file.write({ version: 1, ...hold })
    },
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    onBattery: () => power.onBattery(),
    publish,
  })
  service.start()
  const unwatch = power.watch(
    () => service.powerChanged(),
    () => service.check(),
  )

  ipcMain.handle(CH.utility.awakeState, () => service.state())
  ipcMain.handle(CH.utility.awakeSet, (_event, request: unknown) =>
    isAwakeRequest(request) ? service.set(request) : service.state(),
  )
  ipcMain.handle(CH.utility.awakeExtend, () => service.extend(AWAKE_EXTEND_MS))

  ipcMain.handle(CH.utility.seal, (_event, secret: unknown) =>
    typeof secret === 'string' && secret !== '' && secret.length <= UTILITY_LIMITS.password
      ? seal(secretCodec(), secret)
      : null,
  )
  ipcMain.handle(CH.utility.unseal, (_event, sealed: unknown) => unseal(secretCodec(), sealed))

  ipcMain.handle(CH.utility.copy, async (_event, what: unknown) => {
    if (!isUtilityCopy(what)) return false
    try {
      if (what.kind === 'text') await clipboard.writeText(what.text)
      else await clipboard.writeImage(what.data)
      return true
    } catch {
      return false
    }
  })

  return {
    onLine: (listener) => {
      lines.add(listener)
      listener(awakeLine(service.state(), Date.now()))
    },
    dispose: () => {
      unwatch()
      service.dispose()
      lines.clear()
      for (const channel of [
        CH.utility.awakeState,
        CH.utility.awakeSet,
        CH.utility.awakeExtend,
        CH.utility.seal,
        CH.utility.unseal,
        CH.utility.copy,
      ])
        ipcMain.removeHandler(channel)
    },
  }
}
