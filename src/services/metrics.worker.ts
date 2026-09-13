/**
 * The metrics collector, run as an Electron utilityProcess.
 *
 * systeminformation shells out to wmic, PowerShell, lsof and friends; a slow
 * call here must never stall the main process (which owns every terminal's I/O)
 * or the renderer (which draws at display rate). Running it out of process also
 * means a crash in a collector restarts one child, not the app.
 *
 * Protocol, all over process.parentPort:
 *   parent -> child  { t: 'active', ids }        the full set of sources to poll
 *                    { t: 'stats', nonce }       ask for diagnostics
 *   child -> parent  { t: 'sample', id, at, data }
 *                    { t: 'error', id, message }
 *                    { t: 'stats', nonce, active, collections }
 */
import { MetricScheduler } from './metrics/scheduler.js'
import { SOURCES } from './metrics/sources.js'

export type WorkerRequest = { t: 'active'; ids: string[] } | { t: 'stats'; nonce: number }

export type WorkerMessage =
  | { t: 'sample'; id: string; at: number; data: unknown }
  | { t: 'error'; id: string; message: string }
  | { t: 'stats'; nonce: number; active: string[]; collections: Record<string, number> }

const port = process.parentPort
if (!port) {
  throw new Error('metrics.worker must be started with utilityProcess.fork()')
}

const post = (message: WorkerMessage): void => port.postMessage(message)

const scheduler = new MetricScheduler(SOURCES, {
  sample: (id, at, data) => post({ t: 'sample', id, at, data }),
  error: (id, message) => post({ t: 'error', id, message }),
})

port.on('message', (event: { data: unknown }) => {
  const request = event.data as Partial<WorkerRequest> | null
  if (request === null || typeof request !== 'object') return

  if (request.t === 'active' && Array.isArray(request.ids)) {
    scheduler.setActive(request.ids.filter((id): id is string => typeof id === 'string'))
  } else if (request.t === 'stats' && typeof request.nonce === 'number') {
    post({
      t: 'stats',
      nonce: request.nonce,
      active: scheduler.active(),
      collections: scheduler.collections(),
    })
  }
})
