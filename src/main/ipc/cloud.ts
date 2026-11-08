import path from 'node:path'
import type { CloudAlertView } from '@shared/api'
import { CH } from '@shared/channels'
import type { CliCall, CliPriority, RunCli } from '@shared/cloud-cli/probe'
import { app, Notification, net } from 'electron'
import { appWindows } from '../app-windows.js'
import type { CloudAlert } from '../aws/service.js'
import { USER_AGENT } from '../build-info.js'
import { AlertFileSchema, CloudAlerts } from '../cloud-cli/alerts.js'
import { createCliRunner } from '../cloud-cli/run.js'
import { CLI_LANES, concurrencyLimit } from '../cloud-cli/scheduler.js'
import { type StatusSource, StatusWatch } from '../cloud-cli/status.js'
import { stubAws } from '../cloud-cli/stub-aws.js'
import { stubGithub } from '../cloud-cli/stub-github.js'
import { cacheFile } from '../store/cache-file.js'
import { openExternalIfSafe } from '../window.js'
import { showMainWindow, windowInFront } from '../window-control.js'
import { registerAwsIpc } from './aws.js'
import { registerGithubIpc } from './github.js'
import type { SettingsHandle } from './settings.js'
import { registerTable } from './table.js'

/**
 * The two CLI panes (docs/cloud-cli.md): one runner and one limit of four CLI starts at once
 * (`CLI_LANES`) for both, the public status of each read while one of its panes is shown, and their toasts.
 * ELECDEX_CLOUD_STUB puts stand-ins in place of both CLIs (and the tests point the status URLs
 * at a closed port).
 */

export interface CloudShared {
  cli: RunCli
  executable: (tool: 'aws' | 'gh') => string | null
  limit: <T>(work: () => Promise<T>, priority?: CliPriority) => Promise<T>
  status: StatusWatch
  alerts: CloudAlerts
  /** A pane's source is shown or no longer is: its public status follows. */
  shown: (source: StatusSource, shown: boolean) => void
  /** Hooks the IPC modules fill in: the incidents changed, and which AWS regions are shown. */
  onIncidents: Record<StatusSource, () => void>
  awsRegions: () => string[] | null
}

const STATUS_TIMEOUT_MS = 10_000

export function registerCloudIpc(settings: SettingsHandle): { dispose: () => void } {
  const stub = process.env.ELECDEX_CLOUD_STUB
  const stubbed = stub !== undefined && stub !== ''
  const runner = createCliRunner(path.join(app.getPath('userData'), 'cli-cwd'))
  const stubs = stubbed ? { gh: stubGithub(stub), aws: stubAws(stub) } : null
  const cli: RunCli = (call: CliCall) => (stubs ? stubs[call.tool](call) : runner.run(call))

  const broadcast = (channel: string, payload: unknown): void => {
    for (const win of appWindows())
      if (!win.webContents.isDestroyed()) win.webContents.send(channel, payload)
  }

  const alertFile = cacheFile(
    path.join(app.getPath('userData'), 'cloud-alerts.json'),
    AlertFileSchema,
    {
      said: {},
      seeded: {},
      lastAt: {},
    },
  )
  const alerts = new CloudAlerts({
    load: alertFile.load,
    save: alertFile.save,
    now: () => Date.now(),
    inFront: windowInFront,
    choice: (source) => {
      const current = settings.current()
      return source === 'aws' ? current.aws.incidents : current.github.incidents
    },
    toPage: (alert: CloudAlert) => {
      const view: CloudAlertView = {
        id: alert.id,
        title: alert.title,
        body: alert.body,
        maskedBody: alert.maskedBody,
        tone: alert.tone,
        action: alert.action.kind === 'status' ? { kind: 'status' } : alert.action,
      }
      broadcast(CH.cloud.alert, view)
    },
    toSystem: (title, body) => {
      if (!Notification.isSupported()) return
      const notification = new Notification({
        title: title.slice(0, 200),
        body: body.slice(0, 300),
      })
      notification.on('click', showMainWindow)
      notification.show()
    },
  })

  const shared: CloudShared = {
    cli,
    executable: (tool) => (stubbed ? 'stub' : runner.executable(tool)),
    limit: concurrencyLimit(CLI_LANES),
    status: undefined as unknown as StatusWatch,
    alerts,
    shown: (source, shown) => shared.status.set(source, shown),
    onIncidents: { aws: () => {}, github: () => {} },
    awsRegions: () => null,
  }
  shared.status = new StatusWatch({
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    fetchText: async (url) => {
      const response = await net.fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        credentials: 'omit',
        cache: 'no-store',
        signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
      })
      return { status: response.status, text: response.status === 200 ? await response.text() : '' }
    },
    changed: (source, incidents) => {
      alerts.incidents(source, incidents, source === 'aws' ? shared.awsRegions() : null)
      shared.onIncidents[source]()
    },
  })

  const github = registerGithubIpc(shared)
  const aws = registerAwsIpc(shared)

  const unregister = registerTable({
    handle: {
      [CH.cloud.open]: async (_event, alertId) => {
        if (typeof alertId !== 'string') return false
        const url = alerts.urlOf(alertId)
        if (url === null) return false
        await openExternalIfSafe(url)
        return true
      },
      [CH.cloud.watching]: () => shared.status.watching(),
    },
  })

  return {
    dispose: () => {
      github.dispose()
      aws.dispose()
      shared.status.dispose()
      unregister()
    },
  }
}
