import type { AiProvider, ChatEvent, ChatSummary } from '@shared/ai'
import type {
  ProviderAdapter,
  StreamRequest,
  StreamResult,
  StreamSink,
} from '../../../src/main/ai/adapter.js'
import { ChatFiles } from '../../../src/main/ai/files.js'
import { AiChatService } from '../../../src/main/ai/service.js'
import { ChatStore } from '../../../src/main/ai/store.js'

/**
 * The AI chat service with nothing real behind it but its folder, which the service, context
 * and files tests all drive. They differ only in the providers, keys and summaries they set up,
 * so one harness keeps the stand-in adapter, clock, ids and timers the same in all of them.
 */

/** One answer under the test's control: pieces are pushed, then it is ended or failed. */
export interface Pending {
  request: StreamRequest
  sink: StreamSink
  end(result?: StreamResult): void
  fail(error: unknown): void
}

export interface AiHarnessOptions {
  providers: readonly AiProvider[]
  keys?: Record<string, string>
  systemPrompt?: string
  /** Read on every send, so a test can turn summaries on and off between questions. */
  compacts?: () => boolean
  /** What the model list answers. */
  models?: readonly { id: string }[]
  /** How a kept file is named: by a counter, or with the conversation ids' maker. */
  fileIds?: 'counter' | 'uuid'
}

export function aiHarness(dir: string, options: AiHarnessOptions) {
  const keys = options.keys ?? {}
  const events: ChatEvent[] = []
  const lists: ChatSummary[][] = []
  const pending: Pending[] = []
  const timers: Array<() => void> = []
  let clock = 1_000
  let ids = 0
  const newId = () => {
    ids += 1
    return `00000000-0000-4000-8000-${String(ids).padStart(12, '0')}`
  }
  const fileId =
    options.fileIds === 'uuid'
      ? newId
      : () => {
          ids += 1
          return `file-${ids}`
        }

  const adapter: ProviderAdapter = {
    stream: (request, sink) =>
      new Promise<StreamResult>((resolve, reject) => {
        pending.push({ request, sink, end: (result = {}) => resolve(result), fail: reject })
        request.signal.addEventListener('abort', () => reject(new Error('aborted')))
      }),
    models: async () => [...(options.models ?? [])],
  }

  const store = new ChatStore(dir)
  const files = new ChatFiles(dir, fileId)
  const service = new AiChatService({
    store,
    files,
    providers: () => [...options.providers],
    systemPrompt: () => options.systemPrompt ?? '',
    compact: options.compacts ?? (() => false),
    keyFor: (id) => keys[id] ?? null,
    adapter: async () => adapter,
    now: () => {
      clock += 1
      return clock
    },
    newId,
    setTimer: (fn) => {
      timers.push(fn)
      return fn
    },
    clearTimer: (handle) => {
      const at = timers.indexOf(handle as () => void)
      if (at !== -1) timers.splice(at, 1)
    },
    publish: (event) => events.push(event),
    listChanged: (list) => lists.push(list),
  })

  return {
    service,
    store,
    files,
    events,
    lists,
    pending,
    /** Runs the flush timer, if one is waiting. */
    tick: () => timers.shift()?.(),
    /** Lets the service's own promises (the adapter being fetched, an answer ending) run. */
    settle: async () => {
      for (let i = 0; i < 5; i += 1) await Promise.resolve()
    },
  }
}
