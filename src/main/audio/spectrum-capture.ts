import type { SpectrumUpdate } from '@shared/audio'

/**
 * When the spectrum's capture runs: from the first pane that shows it to the last,
 * and what a pane is told as it joins. Electron-free - the capture itself (the
 * hidden window) is injected - so the lifecycle is unit-tested.
 *
 * A pane that joins while capture has failed starts it again: the failure may be
 * one the user has since fixed (a permission granted, a device plugged in), and
 * otherwise it would stay failed until every spectrum pane had closed.
 */

export interface CaptureHandle {
  close(): void
}

export type OpenCapture = (onUpdate: (update: SpectrumUpdate) => void) => CaptureHandle

const STARTING: SpectrumUpdate = { t: 'status', status: 'starting', message: null }

export class SpectrumCapture {
  readonly #open: OpenCapture
  readonly #publish: (update: SpectrumUpdate) => void
  #handle: CaptureHandle | null = null
  #status: SpectrumUpdate = STARTING

  constructor(deps: { open: OpenCapture; publish: (update: SpectrumUpdate) => void }) {
    this.#open = deps.open
    this.#publish = deps.publish
  }

  get running(): boolean {
    return this.#handle !== null
  }

  /** Starts or stops capture for the number of panes now subscribed. */
  subscribers(count: number): void {
    if (count > 0 && this.#handle === null) this.#start()
    else if (count === 0) this.#stop()
  }

  /** A pane has joined: retry a failed capture, and return the status to tell it. */
  joined(): SpectrumUpdate {
    if (this.#handle !== null && this.#status.t === 'status' && this.#status.status === 'failed') {
      this.#stop()
      this.#start()
    }
    return this.#status
  }

  dispose(): void {
    this.#stop()
  }

  #start(): void {
    this.#status = STARTING
    let handle: CaptureHandle | null = null
    handle = this.#open((update) => {
      // A capture closed or replaced may still report on its way out.
      if (handle !== null && handle !== this.#handle) return
      if (update.t === 'status') this.#status = update
      this.#publish(update)
    })
    this.#handle = handle
  }

  #stop(): void {
    const handle = this.#handle
    this.#handle = null
    this.#status = STARTING
    handle?.close()
  }
}
