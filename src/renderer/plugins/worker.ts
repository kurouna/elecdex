import { pluginRuntime, stripGlobals } from '@shared/plugin-runtime'
import type { HostMessage, PluginSource } from '@shared/plugins'

/**
 * Starting a plugin's worker (docs/plugins.md section 4).
 *
 * The script is the stripping, then the runtime called with the plugin's module table.
 * It is a classic worker from a blob: URL: the page's CSP allows blob: only as
 * worker-src, and the worker inherits connect-src 'self' and the absence of unsafe-eval.
 */

/** What the host needs of a worker; the component tests put a stand-in behind it. */
export interface PluginWorker {
  post(message: HostMessage): void
  onMessage(handler: (data: unknown) => void): void
  terminate(): void
}

export type WorkerFactory = (source: PluginSource) => PluginWorker

export function workerScript(code: string, entry: string): string {
  return `(${stripGlobals.toString()})(self);\n(${pluginRuntime.toString()})(self, ${code}, ${JSON.stringify(entry)});\n`
}

export const createWorker: WorkerFactory = (source) => {
  if (source.code === null || source.entry === null) throw new Error(source.error ?? 'not loaded')
  const url = URL.createObjectURL(
    new Blob([workerScript(source.code, source.entry)], { type: 'text/javascript' }),
  )
  const worker = new Worker(url, { name: `plugin ${source.key}` })
  return {
    post: (message) => worker.postMessage(message),
    onMessage: (handler) => {
      worker.onmessage = (event: MessageEvent) => handler(event.data)
      worker.onerror = (event: ErrorEvent) => {
        // A script that does not even parse never reaches the runtime's own error handler.
        event.preventDefault()
        handler({
          t: 'error',
          pane: null,
          message: event.message || 'the plugin failed to load',
          fatal: true,
        })
      }
    },
    terminate: () => {
      worker.terminate()
      URL.revokeObjectURL(url)
    },
  }
}
