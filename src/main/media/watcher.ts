import {
  artUrl,
  EMPTY_NOW_PLAYING,
  NOW_PLAYING_LINGER_MS,
  type NowPlaying,
  type NowPlayingAction,
  type NowPlayingControlResult,
  type NowPlayingSession,
  nextBoundary,
  readSession,
  sameSession,
} from '@shared/now-playing'

/**
 * One answer from a platform's reader: the session it chose (the raw object,
 * checked by `readSession`) or null, and the art when it changed - base64 of a
 * JPEG, null for none, left out when it is the same as last time.
 */
export interface NowPlayingReading {
  session: unknown
  art?: string | null
  /** For a press: whether the player took it. */
  done?: boolean
}

/** A platform's way of reading media sessions (main/media/windows.ts, stub.ts). */
export interface NowPlayingBackend {
  read(): Promise<NowPlayingReading>
  control(action: NowPlayingAction): Promise<NowPlayingReading>
  /** Ends whatever the reader holds (its process); the next read starts it again. */
  close(): void
}

export interface NowPlayingDeps {
  /** Null where the platform cannot be read: the pane says so, and nothing runs. */
  backend: NowPlayingBackend | null
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  publish(state: NowPlaying): void
  lingerMs?: number
}

/**
 * The media session, read in main (architecture.md §5.15).
 *
 * It reads only while a pane wants it (`sync(true)`: a pane is seen), on the
 * wall clock's half seconds - one timer, armed for the next boundary after each
 * look, never an interval - and a look still running when the next boundary
 * comes is not overlapped. When the last pane goes it stops reading at once and
 * lets the reader go a little later (`NOW_PLAYING_LINGER_MS`), so a pane moved
 * or a tab flicked does not start the reader again. Nothing is written anywhere:
 * the last session read is kept in memory, to be shown the moment a pane is
 * back, and a reading only goes out when it changes what a pane draws.
 */
export class NowPlayingWatcher {
  readonly #deps: NowPlayingDeps
  #state: NowPlaying
  #wanted = false
  #timer: unknown = null
  #linger: unknown = null
  #busy = false
  /** The art of the session shown, kept apart: the reader sends it only when it changes. */
  #art: string | null = null

  constructor(deps: NowPlayingDeps) {
    this.#deps = deps
    this.#state = { ...EMPTY_NOW_PLAYING, support: deps.backend === null ? 'none' : 'full' }
  }

  get active(): boolean {
    return this.#wanted && this.#deps.backend !== null
  }

  state(): NowPlaying {
    return this.#state
  }

  sync(wanted: boolean): void {
    if (wanted === this.#wanted) return
    this.#wanted = wanted
    if (this.#deps.backend === null) return
    if (wanted) {
      this.#cancelLinger()
      void this.#look()
      this.#arm()
    } else {
      this.#stop()
      this.#linger = this.#deps.setTimer(() => {
        this.#linger = null
        if (!this.#wanted) this.#deps.backend?.close()
      }, this.#deps.lingerMs ?? NOW_PLAYING_LINGER_MS)
    }
    this.#set({ ...this.#state, watching: this.active })
  }

  /** A press of one of the pane's buttons, passed to the player the pane shows. */
  async control(action: NowPlayingAction): Promise<NowPlayingControlResult> {
    const backend = this.#deps.backend
    if (backend === null) return 'unsupported'
    // Only a pane on screen presses anything; a page that is not subscribed is refused.
    if (!this.#wanted) return 'unsupported'
    if (this.#state.session === null) return 'no-session'
    try {
      const reading = await backend.control(action)
      this.#take(reading)
      if (reading.session === null) return 'no-session'
      return reading.done === false ? 'refused' : 'ok'
    } catch {
      return 'failed'
    }
  }

  dispose(): void {
    this.#wanted = false
    this.#stop()
    this.#cancelLinger()
    this.#deps.backend?.close()
  }

  #arm(): void {
    if (!this.active || this.#timer !== null) return
    const now = this.#deps.now()
    this.#timer = this.#deps.setTimer(() => {
      this.#timer = null
      // Armed before looking, so the next look stays on the grid however long this one takes.
      this.#arm()
      void this.#look()
    }, nextBoundary(now) - now)
  }

  #stop(): void {
    if (this.#timer === null) return
    this.#deps.clearTimer(this.#timer)
    this.#timer = null
  }

  #cancelLinger(): void {
    if (this.#linger === null) return
    this.#deps.clearTimer(this.#linger)
    this.#linger = null
  }

  async #look(): Promise<void> {
    const backend = this.#deps.backend
    if (this.#busy || backend === null) return
    this.#busy = true
    try {
      this.#take(await backend.read())
    } catch (error) {
      if (this.#wanted)
        this.#set({
          ...this.#state,
          error: error instanceof Error ? error.message : 'the media session could not be read',
        })
    } finally {
      this.#busy = false
    }
  }

  #take(reading: NowPlayingReading): void {
    // The art is kept even from a reading that is not shown: the reader sends it
    // only once per track, and would not send it again.
    if (reading.art !== undefined) this.#art = artUrl(reading.art)
    // The last pane went while it was reading: what it read is not news to anyone.
    if (!this.#wanted) return
    const session: NowPlayingSession | null = readSession(
      reading.session,
      this.#art,
      this.#deps.now(),
    )
    if (session === null) this.#art = null
    const same = sameSession(session, this.#state.session)
    this.#set({
      ...this.#state,
      session: same ? this.#state.session : session,
      error: null,
    })
  }

  #set(next: NowPlaying): void {
    const current = this.#state
    if (
      next.session === current.session &&
      next.error === current.error &&
      next.watching === current.watching &&
      next.support === current.support
    )
      return
    this.#state = next
    this.#deps.publish(next)
  }
}
