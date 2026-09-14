import { onFrame } from '../lib/frame-loop.ts'

/**
 * The current time for plugin time blocks, moved on once a second by the shared frame
 * loop - and only while some block is showing, so an app without one never wakes for it.
 */
class Ticker {
  now = $state(Date.now())
  private users = 0
  private stop: (() => void) | null = null

  use(): () => void {
    this.users += 1
    if (this.users === 1) {
      this.now = Date.now()
      this.stop = onFrame(() => {
        this.now = Date.now()
      }, 1000)
    }
    let released = false
    return () => {
      if (released) return
      released = true
      this.users -= 1
      if (this.users > 0) return
      this.stop?.()
      this.stop = null
    }
  }
}

export const ticker = new Ticker()

const pad = (n: number): string => String(n).padStart(2, '0')

/** mm:ss to the moment, or h:mm:ss from an hour out; 00:00 once it has passed. */
export function countdown(at: number, now: number): string {
  const seconds = Math.max(0, Math.ceil((at - now) / 1000))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** "2h 13m", "45s", "3d 4h", with "ago" for the past. */
export function relative(at: number, now: number): string {
  const diff = at - now
  const seconds = Math.round(Math.abs(diff) / 1000)
  const d = Math.floor(seconds / 86_400)
  const h = Math.floor((seconds % 86_400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const text = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m` : `${seconds}s`
  return diff < 0 ? `${text} ago` : text
}

export function timeOfDay(at: number): string {
  const t = new Date(at)
  return `${pad(t.getHours())}:${pad(t.getMinutes())}`
}

export function dateOf(at: number): string {
  const t = new Date(at)
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
}
