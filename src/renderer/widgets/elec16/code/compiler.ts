import { refCounted } from '../../../lib/ref-counted.ts'
import { makeCompileWorker } from './make-worker.ts'
import type {
  CodeReply,
  CodeRequest,
  KitFiles,
  KitOutcome,
  KitReply,
  LevelResult,
} from './protocol.ts'

/**
 * The page's one CODE compiler: a worker started for the first CODE view and ended after the
 * last (it holds TypeScript's parser). A worker that fails - refused, or thrown inside - ends
 * every build waiting on it with the reason, and the next build starts a new one: a COMPILE
 * never waits for an answer that cannot come.
 */

interface Waiting {
  resolve: (reply: CodeReply | KitReply) => void
  reject: (error: Error) => void
}

let worker: Worker | null = null
let starting: Promise<Worker> | null = null
let next = 1
const waiting = new Map<number, Waiting>()
/** The ROM the worker measures CODE's builds on, as last sent. */
let romSent: Uint8Array | null = null

function failAll(error: Error): void {
  worker?.terminate()
  worker = null
  starting = null
  for (const w of waiting.values()) w.reject(error)
  waiting.clear()
}

async function start(): Promise<Worker> {
  const w = await makeCompileWorker()
  romSent = null
  w.onmessage = (event: MessageEvent<CodeReply | KitReply>) => {
    const done = waiting.get(event.data.id)
    waiting.delete(event.data.id)
    done?.resolve(event.data)
  }
  w.onerror = (event: ErrorEvent) => {
    event.preventDefault()
    failAll(new Error(event.message || 'the compiler stopped'))
  }
  w.onmessageerror = () => failAll(new Error('the compiler answered what could not be read'))
  return w
}

/** How many hold the compiler: a build with nobody holding it starts no worker. */
let holders = 0

// The last view gone: a build still waiting is ended too, never left to wait for ever.
const use = refCounted(() => () => failAll(new Error('the compiler was let go')))

/** Holds the compiler while a CODE view (or a game's folder) is open; the last release ends it. */
export function holdCompiler(): () => void {
  const release = use()
  holders++
  let released = false
  return () => {
    if (released) return
    released = true
    holders--
    release()
  }
}

/** Every level's build of a source, measured on a machine with this ROM. */
export async function compileCode(
  rom: Uint8Array,
  file: string,
  source: string,
): Promise<LevelResult[]> {
  const w = await ready()
  if (romSent !== rom) {
    romSent = rom
    const measureOn: CodeRequest = { kind: 'rom', rom: rom.slice() }
    w.postMessage(measureOn)
  }
  const reply = await ask(w, (id) => ({ kind: 'build', id, file, source }))
  return 'levels' in reply ? reply.levels : []
}

/** A game built from its folder's files with the game kit (docs/elec16-play.md section 11). */
export async function buildKit(files: KitFiles, romTrap: number): Promise<KitOutcome> {
  const w = await ready()
  const reply = await ask(w, (id) => ({ kind: 'kit', id, files, romTrap }))
  if ('kit' in reply) return reply.kit
  return { ok: false, errors: [{ file: '', line: 0, message: 'the compiler did not build it' }] }
}

function ask(w: Worker, request: (id: number) => CodeRequest): Promise<CodeReply | KitReply> {
  const id = next++
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject })
    w.postMessage(request(id))
  })
}

/** The worker, started if need be; let go while it started, it is ended, not kept for no one. */
async function ready(): Promise<Worker> {
  // A worker started for no one would stay: no release would ever come to end it.
  if (holders === 0) throw new Error('the compiler is not held')
  starting ??= start()
  const asked = starting
  let w: Worker
  try {
    w = await asked
  } catch (error) {
    if (starting === asked) starting = null
    throw error
  }
  if (starting !== asked) {
    w.terminate()
    throw new Error('the compiler was let go')
  }
  worker = w
  return w
}
