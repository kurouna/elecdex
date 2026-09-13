import { compareVersions, parseRelease, type UpdateStatus } from '@shared/updates'

/**
 * Asks GitHub for the latest release, shortly after start and then once a day,
 * while the setting is on. A check the user asks for runs regardless.
 *
 * Everything outside - the request, the clock, timers - is injected, so the
 * schedule is unit-tested without a network or waiting a day.
 */

export const FIRST_CHECK_DELAY_MS = 15_000
export const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

export interface ReleaseResponse {
  status: number
  json: unknown
}

export interface UpdateCheckerDeps {
  currentVersion: string
  fetchLatest: () => Promise<ReleaseResponse>
  now: () => number
  setTimer: (fn: () => void, ms: number) => unknown
  clearTimer: (handle: unknown) => void
  publish: (status: UpdateStatus) => void
}

export class UpdateChecker {
  private readonly deps: UpdateCheckerDeps
  private current: UpdateStatus = { state: 'idle' }
  private timer: unknown = null
  private enabled = false
  private inFlight: Promise<UpdateStatus> | null = null

  constructor(deps: UpdateCheckerDeps) {
    this.deps = deps
  }

  status(): UpdateStatus {
    return this.current
  }

  /** Turns the daily check on or off. Turning it on schedules the first check. */
  setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) return
    this.enabled = enabled
    this.cancel()
    if (enabled) {
      if (this.current.state === 'disabled') this.set({ state: 'idle' })
      this.schedule(FIRST_CHECK_DELAY_MS)
    } else if (this.current.state !== 'available') {
      // A found update stays on screen; there is no reason to hide it.
      this.set({ state: 'disabled' })
    }
  }

  /** Checks now. Concurrent calls share one request. */
  check(): Promise<UpdateStatus> {
    this.inFlight ??= this.run().finally(() => {
      this.inFlight = null
    })
    return this.inFlight
  }

  dispose(): void {
    this.cancel()
    this.enabled = false
  }

  private async run(): Promise<UpdateStatus> {
    this.set({ state: 'checking' })
    let result: UpdateStatus
    try {
      result = this.interpret(await this.deps.fetchLatest())
    } catch (error) {
      result = {
        state: 'error',
        checkedAt: this.deps.now(),
        error: error instanceof Error ? error.message : String(error),
      }
    }
    this.set(result)
    if (this.enabled) this.schedule(CHECK_INTERVAL_MS)
    return result
  }

  private interpret(response: ReleaseResponse): UpdateStatus {
    const checkedAt = this.deps.now()
    // No release published yet.
    if (response.status === 404) return { state: 'current', checkedAt, latest: null }
    if (response.status !== 200) {
      return { state: 'error', checkedAt, error: `GitHub answered HTTP ${response.status}` }
    }
    const release = parseRelease(response.json)
    if (release === null) return { state: 'current', checkedAt, latest: null }
    return compareVersions(release.version, this.deps.currentVersion) > 0
      ? { state: 'available', checkedAt, latest: release.version, url: release.url }
      : { state: 'current', checkedAt, latest: release.version }
  }

  private schedule(ms: number): void {
    this.cancel()
    this.timer = this.deps.setTimer(() => {
      this.timer = null
      void this.check()
    }, ms)
  }

  private cancel(): void {
    if (this.timer !== null) this.deps.clearTimer(this.timer)
    this.timer = null
  }

  private set(status: UpdateStatus): void {
    this.current = status
    this.deps.publish(status)
  }
}
