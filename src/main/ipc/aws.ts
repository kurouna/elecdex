import path from 'node:path'
import { profileName } from '@shared/aws/board'
import type { AwsBoard } from '@shared/aws/types'
import { CH } from '@shared/channels'
import { app } from 'electron'
import { BillingFileSchema, billingStore } from '../aws/billing-store.js'
import { InventoryFileSchema, inventoryStore } from '../aws/inventory-store.js'
import { AwsService } from '../aws/service.js'
import { cacheFile } from '../store/cache-file.js'
import { openExternalIfSafe } from '../window.js'
import type { CloudShared } from './cloud.js'
import { cliVersion, cloudBoards } from './cloud-boards.js'
import { registerTable } from './table.js'

/**
 * AWS STATUS IPC (docs/aws.md): pages subscribe to board keys while a pane is seen, and main runs
 * AWS CLI only for the keys somebody subscribes to. Every other call names a key the page
 * subscribes to and ids main showed it; nothing reaches a plugin.
 */

export function registerAwsIpc(shared: CloudShared): { dispose: () => void } {
  const { cli } = shared
  const boards = cloudBoards<AwsBoard>(shared, 'aws', CH.aws.update, () => service)
  const billing = billingStore(
    cacheFile(path.join(app.getPath('userData'), 'aws-billing.json'), BillingFileSchema, {}),
    () => Date.now(),
  )
  const timers = {
    setTimer: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimer: (handle: unknown) => clearTimeout(handle as NodeJS.Timeout),
  }
  // RESOURCES' readings and memory per account (aws.md §14.4), written two seconds after a change.
  const inventory = inventoryStore(
    cacheFile(path.join(app.getPath('userData'), 'aws-inventory.json'), InventoryFileSchema, {}),
    timers,
  )
  const service = new AwsService({
    cli,
    limit: shared.limit,
    billing,
    inventory,
    now: () => Date.now(),
    ...timers,
    publish: boards.publish,
    incidents: () => shared.status.incidents('aws'),
    alert: (alert) => shared.alerts.quota(alert),
    cliVersion: cliVersion(shared, 'aws', /aws-cli\/([\d.]+)/),
    executable: () => shared.executable('aws'),
    startedAt: Date.now(),
  })
  shared.onIncidents.aws = () => service.incidentsChanged()
  shared.awsRegions = () => service.shownRegions()
  const { holds } = boards

  const unregister = registerTable({
    on: {
      [CH.aws.subscribe]: (event, key) => boards.subscribe(event.sender, key),
      [CH.aws.unsubscribe]: (event, key) => boards.unsubscribe(event.sender, key),
    },
    handle: {
      [CH.aws.refresh]: (event, key) => (holds(event.sender, key) ? service.refresh(key) : 0),
      [CH.aws.drill]: (event, key, which) =>
        holds(event.sender, key) ? service.drill(key, which) : null,
      [CH.aws.item]: (event, key, which, id, region) =>
        holds(event.sender, key) ? service.item(key, which, id, region) : null,
      [CH.aws.history]: (event, key, which, id, region) =>
        holds(event.sender, key) ? service.history(key, which, id, region) : null,
      [CH.aws.open]: async (event, key, id) => {
        if (!holds(event.sender, key)) return false
        const url = service.urlOf(key, id)
        if (url === null) return false
        await openExternalIfSafe(url)
        return true
      },
      [CH.aws.costExplorer]: (event, key, answer) =>
        holds(event.sender, key) ? service.answerCostExplorer(key, answer) : false,
      [CH.aws.quota]: (event, key, quota) =>
        holds(event.sender, key) ? service.setQuota(key, quota) : false,
      [CH.aws.keep]: (event, key, id, on) =>
        holds(event.sender, key) ? service.keep(key, id, on) : false,
      [CH.aws.sweep]: (event, key, what) =>
        holds(event.sender, key) ? service.sweep(key, what ?? 'now') : 0,
      [CH.aws.metricData]: (event, key, answer) =>
        holds(event.sender, key) ? service.metricData(key, answer) : false,
      [CH.aws.profiles]: async () => {
        const result = await shared.limit(() =>
          cli({ tool: 'aws', argv: ['configure', 'list-profiles'] }),
        )
        if (!result.ok) return []
        return result.stdout
          .split(/\r?\n/)
          .map((line) => profileName(line.trim()))
          .filter((name): name is string => name !== null)
          .slice(0, 100)
      },
      [CH.aws.watching]: () => service.watching(),
    },
  })

  return {
    dispose: () => {
      shared.shown('aws', false)
      service.dispose()
      unregister()
    },
  }
}
