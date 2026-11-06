import { Worker } from 'node:worker_threads'

/**
 * The sha256 of a file, computed in a worker thread (docs/translate.md §5). A model is up to
 * 19.5 GB: hashed on main, even 4 MB at a time, the pauses add up to seconds of a window that
 * does not answer. The worker's code is given inline, so the bundle needs no second entry.
 */

// The worker answers once the file is closed ('close', after 'end' or 'error'), and is stopped by
// a message that destroys its stream, never ended while the stream is open: a worker ended
// between its stream's open and 'close' left the file open for the rest of the process, and
// Windows cannot replace or remove a file held open, so an UPDATE, a DELETE, a CANCEL after a
// PAUSE, or a RESUME's placing failed (found 2026-11-06).
const WORKER = `
const { parentPort, workerData } = require('node:worker_threads')
const { createHash } = require('node:crypto')
const { createReadStream } = require('node:fs')
const hash = createHash('sha256')
let answer = null
const stream = createReadStream(workerData.file, { highWaterMark: 4 * 1024 * 1024 })
  .on('data', (chunk) => hash.update(chunk))
  .on('error', (error) => { answer = { error: String(error && error.message || error) } })
  .on('end', () => { answer = { digest: hash.digest('hex') } })
  .on('close', () => parentPort.postMessage(answer || { error: 'stopped' }))
parentPort.on('message', () => stream.destroy())
`

/** Workers still hashing, so quitting can end them (§4.3). */
const running = new Set<Worker>()

export function sha256File(file: string, signal?: AbortSignal): Promise<string> {
  if (signal?.aborted) return Promise.reject(new Error('aborted'))
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER, { eval: true, workerData: { file } })
    running.add(worker)
    let stopped = false
    const done = (): void => {
      running.delete(worker)
      signal?.removeEventListener('abort', onAbort)
    }
    // Stopped: the worker closes the file, answers, and only then is ended (above).
    const onAbort = (): void => {
      stopped = true
      worker.postMessage({ stop: true })
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    worker.once('message', (message: { digest?: string; error?: string }) => {
      done()
      void worker.terminate()
      if (stopped) reject(new Error('aborted'))
      else if (message.digest) resolve(message.digest)
      else reject(new Error(message.error ?? 'cannot hash the file'))
    })
    worker.once('error', (error) => {
      done()
      reject(error)
    })
    // A worker ended without a word (stopHashing on quit, or it ran out of memory): the promise
    // must settle, or the fetch that waits on it waits for ever. After an answer this is a no-op.
    worker.once('exit', () => {
      done()
      reject(new Error('The hashing stopped before it finished.'))
    })
  })
}

/** Ends every hashing worker: elecdex is quitting. */
export function stopHashing(): void {
  for (const worker of running) void worker.terminate()
  running.clear()
}
