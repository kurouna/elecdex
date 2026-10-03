import { refCounted } from '../../../lib/ref-counted.ts'
import type { CodeReply, CodeRequest, LevelResult } from './protocol.ts'

/**
 * The page's one CODE compiler: a worker started for the first CODE view and ended after the
 * last (it holds TypeScript's parser). The worker is inlined as a blob, as the page's CSP
 * allows workers only from blob: URLs (plugins run the same way).
 */

let worker: Worker | null = null
let starting: Promise<Worker> | null = null
let next = 1
const waiting = new Map<number, (levels: LevelResult[]) => void>()

async function start(rom: Uint8Array): Promise<Worker> {
  const { default: CompileWorker } = await import('./compile.worker.ts?worker&inline')
  const w = new CompileWorker({ name: 'elec16 code' })
  w.onmessage = (event: MessageEvent<CodeReply>) => {
    const done = waiting.get(event.data.id)
    waiting.delete(event.data.id)
    done?.(event.data.levels)
  }
  const first: CodeRequest = { kind: 'rom', rom: rom.slice() }
  w.postMessage(first)
  return w
}

const use = refCounted(() => () => {
  worker?.terminate()
  worker = null
  starting = null
  // Builds asked of a worker that has gone get no answer: their views have gone too.
  waiting.clear()
})

/** Holds the compiler while a CODE view is open; the release ends it after the last. */
export function holdCompiler(): () => void {
  return use()
}

/** Every level's build of a source, measured on a machine with this ROM. */
export async function compileCode(
  rom: Uint8Array,
  file: string,
  source: string,
): Promise<LevelResult[]> {
  starting ??= start(rom)
  worker = await starting
  const id = next++
  const w = worker
  return new Promise((resolve) => {
    waiting.set(id, resolve)
    const request: CodeRequest = { kind: 'build', id, file, source }
    w.postMessage(request)
  })
}
