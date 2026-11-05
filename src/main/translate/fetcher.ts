import { createWriteStream, type WriteStream } from 'node:fs'
import { mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'

/**
 * Fetches one large file to a `.part` beside its place, resumes with HTTP Range, checks its size
 * and sha256, and hands it over (docs/translate.md §5). The engine's archive and the models both
 * come through here. Ported from the PLaMo test app's downloader, with the resume checked more
 * strictly: a 206 whose range does not start where the file ends, or a 200 to a ranged request,
 * starts over rather than appending the wrong bytes.
 */

export interface FetchTarget {
  url: string
  /** Where the finished file goes; the download is `<dest>.part` until then. */
  dest: string
  bytes: number
  sha256: string
}

export interface FetchProgress {
  phase: 'downloading' | 'verifying'
  received: number
  total: number
  speed: number
}

export interface FetcherDeps {
  fetch: (url: string, init: RequestInit) => Promise<Response>
  hash: (file: string, signal: AbortSignal) => Promise<string>
  /** Bytes free where the file goes, or null when that cannot be told. */
  freeBytes: (dir: string) => Promise<number | null>
  /** Puts the finished `.part` in place (`replaceFile`). */
  place: (part: string, dest: string) => void
  sleep: (ms: number, signal: AbortSignal) => Promise<void>
  now: () => number
}

export class FetchError extends Error {
  readonly retryable: boolean

  constructor(message: string, retryable: boolean) {
    super(message)
    this.retryable = retryable
  }
}

const PROGRESS_MS = 200
const RETRIES = 5
const DISK_MARGIN = 256 * 1024 * 1024

export const partOf = (dest: string): string => `${dest}.part`

export async function fileSize(file: string): Promise<number> {
  try {
    return (await stat(file)).size
  } catch {
    return 0
  }
}

/** Fetches `target` unless it is already in place. Rejects with `aborted` on the signal. */
export async function fetchFile(
  target: FetchTarget,
  deps: FetcherDeps,
  onProgress: (progress: FetchProgress) => void,
  signal: AbortSignal,
): Promise<void> {
  if ((await fileSize(target.dest)) === target.bytes) return
  await mkdir(path.dirname(target.dest), { recursive: true })
  const part = partOf(target.dest)
  const free = await deps.freeBytes(path.dirname(target.dest))
  const remaining = target.bytes - (await fileSize(part))
  if (free !== null && free < remaining + DISK_MARGIN) {
    throw new FetchError(
      `Not enough disk space: ${gb(remaining + DISK_MARGIN)} needed, ${gb(free)} free.`,
      false,
    )
  }
  for (let attempt = 0; ; attempt++) {
    try {
      await downloadOnce(target, part, deps, onProgress, signal)
      break
    } catch (error) {
      if (signal.aborted) throw new Error('aborted')
      const retryable = !(error instanceof FetchError) || error.retryable
      if (!retryable || attempt >= RETRIES) throw error
      await deps.sleep(Math.min(1000 * 2 ** attempt, 15_000), signal)
    }
  }
  onProgress({ phase: 'verifying', received: target.bytes, total: target.bytes, speed: 0 })
  const digest = await deps.hash(part, signal)
  if (digest !== target.sha256) {
    await rm(part, { force: true })
    throw new FetchError('The file did not match its checksum; fetch it again.', false)
  }
  deps.place(part, target.dest)
}

async function downloadOnce(
  target: FetchTarget,
  part: string,
  deps: FetcherDeps,
  onProgress: (progress: FetchProgress) => void,
  signal: AbortSignal,
): Promise<void> {
  let offset = await fileSize(part)
  if (offset > target.bytes) {
    await rm(part, { force: true })
    offset = 0
  }
  if (offset === target.bytes) return
  const response = await deps.fetch(target.url, {
    headers: offset > 0 ? { Range: `bytes=${offset}-` } : {},
    signal,
    redirect: 'follow',
  })
  offset = await writesFrom(response, offset, part)
  if (!response.body) throw new FetchError('The server sent nothing.', true)
  const received = await writeBody(
    response.body,
    part,
    offset,
    target.bytes,
    deps,
    onProgress,
    signal,
  )
  if (received !== target.bytes) {
    throw new FetchError(`The download stopped early (${received} of ${target.bytes} bytes).`, true)
  }
}

/**
 * Where the answer's bytes go in the `.part`: after what is there for a 206 that starts at its
 * end, from the start for a 200 (a server that ignored the range) or a 206 from byte 0. A 206 from
 * anywhere else would put bytes in the wrong place: the part is dropped and the fetch tried again.
 */
async function writesFrom(response: Response, offset: number, part: string): Promise<number> {
  if (response.status === 200) return 0
  if (response.status !== 206) {
    throw new FetchError(
      `The download failed (HTTP ${response.status}).`,
      response.status >= 500 || response.status === 429,
    )
  }
  const start = rangeStart(response.headers.get('content-range'))
  if (start === offset) return offset
  if (start === 0) return 0
  await response.body?.cancel()
  await rm(part, { force: true })
  throw new FetchError('The server sent another part of the file than asked for.', true)
}

/** Writes the answer to the `.part` from `offset`, reporting on the way; the bytes it ends at. */
async function writeBody(
  body: ReadableStream<Uint8Array>,
  part: string,
  offset: number,
  total: number,
  deps: FetcherDeps,
  onProgress: (progress: FetchProgress) => void,
  signal: AbortSignal,
): Promise<number> {
  const out = createWriteStream(part, { flags: offset > 0 ? 'a' : 'w' })
  // A stream's 'error' with no listener is thrown out of the event loop and ends main: a full disk
  // or an antivirus lock is kept here and thrown from the loop below instead.
  let failure: Error | null = null
  out.on('error', (error) => {
    failure = error
  })
  const reader = body.getReader()
  const meter = speedMeter()
  let received = offset
  let lastReport = 0
  try {
    for (;;) {
      if (failure) throw writeFailure(failure)
      const { done, value } = await reader.read()
      if (done) return received
      received += value.byteLength
      if (!out.write(value)) await drained(out, signal)
      const now = deps.now()
      if (now - lastReport < PROGRESS_MS) continue
      lastReport = now
      onProgress({ phase: 'downloading', received, total, speed: meter(received, now) })
    }
  } finally {
    await closed(out)
    await reader.cancel().catch(() => {})
  }
}

/** Ends the stream, settling also when it failed (its end callback is then never called). */
function closed(out: WriteStream): Promise<void> {
  if (out.destroyed) return Promise.resolve()
  return new Promise<void>((resolve) => {
    out.once('close', () => resolve())
    out.end()
  })
}

/** A failed write as a fetch error: a full disk is said and not retried, a passing lock is. */
export function writeFailure(error: Error): FetchError {
  const code = (error as NodeJS.ErrnoException).code
  return code === 'ENOSPC'
    ? new FetchError('The disk is full.', false)
    : new FetchError(`Cannot write the download (${code ?? error.message}).`, true)
}

/** The first byte of a `Content-Range: bytes 100-199/200`, or null. */
export function rangeStart(header: string | null): number | null {
  const match = header ? /^bytes\s+(\d+)-/.exec(header) : null
  return match?.[1] ? Number(match[1]) : null
}

function speedMeter(): (bytes: number, now: number) => number {
  let lastBytes = -1
  let lastTime = 0
  let smooth = 0
  return (bytes, now) => {
    if (lastBytes >= 0 && now > lastTime) {
      const instant = ((bytes - lastBytes) * 1000) / (now - lastTime)
      smooth = smooth === 0 ? instant : smooth * 0.8 + instant * 0.2
    }
    lastBytes = bytes
    lastTime = now
    return smooth
  }
}

function drained(out: WriteStream, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const settle = (): void => {
      out.off('drain', onDrain)
      out.off('error', onError)
      signal.removeEventListener('abort', onAbort)
    }
    const onAbort = (): void => {
      settle()
      reject(new Error('aborted'))
    }
    const onError = (error: Error): void => {
      settle()
      reject(writeFailure(error))
    }
    const onDrain = (): void => {
      settle()
      resolve()
    }
    out.once('drain', onDrain)
    out.once('error', onError)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

const gb = (bytes: number): string => `${(bytes / 1e9).toFixed(1)} GB`
