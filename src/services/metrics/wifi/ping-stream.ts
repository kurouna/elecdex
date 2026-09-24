import { type ChildProcess, spawn } from 'node:child_process'

/**
 * One long-lived `ping` per target, for the platforms where the Windows
 * sampler's in-process echo is not there (Linux, macOS).
 *
 * A process per reading every second is what the Windows rule forbids and
 * what costs everywhere, so each target gets one `ping -i 1` that keeps
 * running while the pane is seen and is ended when nobody has asked for a
 * reading for a while. Its replies are read as they come; a reading is the
 * last reply if it came within the last second and a half, else a loss.
 */

/** A reply this old no longer stands for the current second. */
const FRESH_MS = 1500
/** A new ping has had no chance to answer yet: its first readings say nothing. */
const WARM_MS = 2000
/** Nobody asked for this long: the process is ended. */
const IDLE_MS = 15_000

/** `time=12.3 ms` in iputils' and BSD ping's replies. */
const REPLY = /time[=<]([\d.]+)\s*ms/

export function parsePingReply(line: string): number | null {
  const m = REPLY.exec(line)
  return m === null ? null : Number(m[1])
}

export type SpawnPing = (target: string) => ChildProcess

const spawnPing: SpawnPing = (target) =>
  spawn('ping', ['-n', '-i', '1', target], { stdio: ['ignore', 'pipe', 'ignore'] })

export class PingStream {
  private child: ChildProcess | null = null
  private target: string | null = null
  private started = 0
  private lastReply = 0
  private lastMs: number | null = null
  private lastAsked = 0
  private idle: ReturnType<typeof setInterval> | null = null
  private readonly start: SpawnPing

  constructor(start: SpawnPing = spawnPing) {
    this.start = start
  }

  /**
   * The round trip to `target` this second: a number, null for a loss, or
   * undefined while there is no answer to give (no target, just started).
   */
  read(target: string | null, now = Date.now()): number | null | undefined {
    this.lastAsked = now
    if (target === null || !/^[A-Za-z0-9.:-]+$/.test(target)) {
      this.end()
      return undefined
    }
    if (target !== this.target || this.child === null) this.begin(target, now)
    if (now - this.started < WARM_MS && now - this.lastReply > FRESH_MS) return undefined
    return now - this.lastReply <= FRESH_MS ? this.lastMs : null
  }

  /**
   * The round trip if this stream is already running to `target` - for a
   * reader that must not start one (the network status pane's ping), so one
   * echo serves both panes while the Wi-Fi pane is up.
   */
  peek(target: string, now = Date.now()): number | null | undefined {
    if (this.child === null || this.target !== target || now - this.started < WARM_MS)
      return undefined
    return now - this.lastReply <= FRESH_MS ? this.lastMs : null
  }

  end(): void {
    this.child?.kill()
    this.child = null
    this.target = null
    if (this.idle !== null) clearInterval(this.idle)
    this.idle = null
  }

  private begin(target: string, now: number): void {
    this.end()
    this.target = target
    this.started = now
    this.lastReply = 0
    this.lastMs = null
    const child = this.start(target)
    this.child = child
    let buffer = ''
    child.stdout?.setEncoding('utf8')
    child.stdout?.on('data', (chunk: string) => {
      buffer += chunk
      let newline = buffer.indexOf('\n')
      while (newline >= 0) {
        const ms = parsePingReply(buffer.slice(0, newline))
        buffer = buffer.slice(newline + 1)
        if (ms !== null && this.child === child) {
          this.lastMs = ms
          this.lastReply = Date.now()
        }
        newline = buffer.indexOf('\n')
      }
    })
    child.on('error', () => {
      if (this.child === child) this.child = null
    })
    child.on('exit', () => {
      if (this.child === child) this.child = null
    })
    this.idle = setInterval(() => {
      if (Date.now() - this.lastAsked > IDLE_MS) this.end()
    }, 5000)
    this.idle.unref?.()
  }
}
