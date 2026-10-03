import { refCounted } from '../../../lib/ref-counted.ts'
import { makeCompileWorker } from './make-worker.ts'
import type { CodeReply, CodeRequest, LevelResult } from './protocol.ts'

/**
 * The page's one CODE compiler: a worker started for the first CODE view and ended after the
 * last (it holds TypeScript's parser). A worker that fails - refused, or thrown inside - ends
 * every build waiting on it with the reason, and the next build starts a new one: a COMPILE
 * never waits for an answer that cannot come.
 */

interface Waiting {
  resolve: (levels: LevelResult[]) => void
  reject: (error: Error) => void
}

let worker: Worker | null = null
let starting: Promise<Worker> | null = null
let next = 1
const waiting = new Map<number, Waiting>()

function failAll(error: Error): void {
  worker?.terminate()
  worker = null
  starting = null
  for (const w of waiting.values()) w.reject(error)
  waiting.clear()
}

async function start(rom: Uint8Array): Promise<Worker> {
  const w = await makeCompileWorker()
  w.onmessage = (event: MessageEvent<CodeReply>) => {
    const done = waiting.get(event.data.id)
    waiting.delete(event.data.id)
    done?.resolve(event.data.levels)
  }
  w.onerror = (event: ErrorEvent) => {
    event.preventDefault()
    failAll(new Error(event.message || 'the compiler stopped'))
  }
  w.onmessageerror = () => failAll(new Error('the compiler answered what could not be read'))
  const first: CodeRequest = { kind: 'rom', rom: rom.slice() }
  w.postMessage(first)
  return w
}

// The last view gone: a build still waiting is ended too, never left to wait for ever.
const use = refCounted(() => () => failAll(new Error('the compiler was let go')))

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
  const asked = starting
  let w: Worker
  try {
    w = await asked
  } catch (error) {
    if (starting === asked) starting = null
    throw error
  }
  // Let go while it started: the worker is ended, not kept for no one.
  if (starting !== asked) {
    w.terminate()
    throw new Error('the compiler was let go')
  }
  worker = w
  const id = next++
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject })
    const request: CodeRequest = { kind: 'build', id, file, source }
    w.postMessage(request)
  })
}
