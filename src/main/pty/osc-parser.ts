/**
 * Extracts shell-integration escape sequences from a PTY output stream.
 *
 * This is how elecdex tracks the working directory and the running command on
 * every platform, including Windows - the original project polled
 * /proc/<pid>/cwd, `lsof` and `ps` once a second and simply could not do it on
 * Windows. See docs/architecture.md section 6.2.
 *
 * Sequences understood (the same ones VS Code's shell integration emits):
 *
 *   OSC 7  ; file://<host><path>          ST   current working directory
 *   OSC 133 ; A                           ST   prompt start
 *   OSC 133 ; B                           ST   command input start
 *   OSC 133 ; C                           ST   command execution start
 *   OSC 133 ; D [ ; <exitCode> ]          ST   command finished
 *
 * ST is either BEL (0x07) or ESC \ (0x1b 0x5c).
 *
 * Consumed sequences are stripped from the returned data so xterm never sees
 * them. Everything else passes through byte-for-byte, including sequences that
 * merely look like ours but are malformed.
 *
 * The parser is a byte-level state machine rather than a regex over decoded
 * text because PTY output arrives in arbitrary chunks: a sequence can be split
 * across any number of them, and a naive regex would both miss those and
 * corrupt multi-byte UTF-8 that happens to straddle a boundary.
 */

import { hostname } from 'node:os'

const BEL = 0x07
const ESC = 0x1b
const BACKSLASH = 0x5c
const OSC = 0x5d // ']' - the byte after ESC that starts an OSC string

/**
 * Hard cap on a buffered sequence. Beyond this we give up on the sequence and
 * flush it as ordinary output, so a stream that emits `ESC ]` and never
 * terminates it cannot grow our buffer without bound.
 */
const MAX_SEQUENCE_BYTES = 4096

export interface OscEvent {
  /** The working directory reported by OSC 7. */
  cwd?: string
  /** A command started executing (OSC 133;C). */
  commandStart?: true
  /** A command finished (OSC 133;D), with its exit code when one was given. */
  commandEnd?: { exitCode: number | null }
  /** The shell drew a prompt (OSC 133;A). */
  promptStart?: true
}

export interface OscParseResult {
  /** The input with every consumed sequence removed. */
  data: Uint8Array
  /** Events in the order they appeared. */
  events: OscEvent[]
}

type State = 'text' | 'esc' | 'osc'

export class OscParser {
  private state: State = 'text'
  /** Bytes of the OSC payload seen so far (excluding the introducer). */
  private seq: number[] = []
  /** True when the previous byte was ESC while inside an OSC string. */
  private oscSawEsc = false

  /**
   * Feeds one chunk. Any partial sequence is retained across calls, so callers
   * must use a single parser instance per PTY session.
   */
  write(chunk: Uint8Array): OscParseResult {
    const out: number[] = []
    const events: OscEvent[] = []

    for (const byte of chunk) {
      switch (this.state) {
        case 'text':
          this.stepText(byte, out)
          break
        case 'esc':
          this.stepEsc(byte, out)
          break
        case 'osc':
          this.stepOsc(byte, out, events)
          break
      }
    }

    return { data: new Uint8Array(out), events }
  }

  /** Outside any sequence: withhold ESC, pass everything else through. */
  private stepText(byte: number, out: number[]): void {
    if (byte === ESC) this.state = 'esc'
    else out.push(byte)
  }

  /** Just after ESC: `]` opens an OSC string, anything else is not ours. */
  private stepEsc(byte: number, out: number[]): void {
    if (byte === OSC) {
      this.state = 'osc'
      this.seq = []
      this.oscSawEsc = false
      return
    }

    // Emit the ESC we withheld, then reprocess this byte as text. A second ESC
    // keeps us here, so `ESC ESC ]` still opens a sequence.
    out.push(ESC)
    if (byte === ESC) {
      this.state = 'esc'
    } else {
      this.state = 'text'
      out.push(byte)
    }
  }

  /** Inside an OSC string: accumulate until BEL or ESC-backslash. */
  private stepOsc(byte: number, out: number[], events: OscEvent[]): void {
    if (this.oscSawEsc) {
      this.oscSawEsc = false
      if (byte === BACKSLASH) {
        this.finishSequence(out, events)
        return
      }
      // A stray ESC inside the payload; keep both bytes and carry on.
      this.seq.push(ESC, byte)
    } else if (byte === BEL) {
      this.finishSequence(out, events)
      return
    } else if (byte === ESC) {
      this.oscSawEsc = true
    } else {
      this.seq.push(byte)
    }

    if (this.seq.length > MAX_SEQUENCE_BYTES) {
      // A sequence this long is never one of ours. Give up on it and flush what
      // we buffered as plain output, so the buffer cannot grow without bound.
      out.push(ESC, OSC, ...this.seq)
      this.seq = []
      this.oscSawEsc = false
      this.state = 'text'
    }
  }

  /** Drops any partially-buffered sequence. Call when the session ends. */
  reset(): void {
    this.state = 'text'
    this.seq = []
    this.oscSawEsc = false
  }

  /**
   * A complete OSC string was seen. Either turn it into an event and swallow it,
   * or - if it is not one of ours - pass it through untouched.
   */
  private finishSequence(out: number[], events: OscEvent[]): void {
    const payload = this.seq
    const event = parsePayload(decodeUtf8(new Uint8Array(payload)))

    if (event === null) {
      // Not ours: re-emit verbatim, terminated with ST so the terminal still
      // sees a well-formed sequence.
      out.push(ESC, OSC, ...payload, ESC, BACKSLASH)
    } else {
      events.push(event)
    }

    this.seq = []
    this.oscSawEsc = false
    this.state = 'text'
  }
}

const utf8 = new TextDecoder('utf-8', { fatal: false })
const decodeUtf8 = (bytes: Uint8Array): string => utf8.decode(bytes)

/** Returns the event for a payload we recognise, or null to pass it through. */
function parsePayload(payload: string): OscEvent | null {
  const semi = payload.indexOf(';')
  if (semi === -1) return null

  const code = payload.slice(0, semi)
  const body = payload.slice(semi + 1)

  if (code === '7') {
    const cwd = parseFileUri(body)
    return cwd === null ? null : { cwd }
  }

  if (code === '133') {
    const [kind, ...rest] = body.split(';')
    switch (kind) {
      case 'A':
        return { promptStart: true }
      case 'B':
        // Input start carries no information we act on, but it is ours, so
        // consume it rather than leaking it to the terminal.
        return {}
      case 'C':
        return { commandStart: true }
      case 'D': {
        const raw = rest[0]
        if (raw === undefined || raw === '') return { commandEnd: { exitCode: null } }
        const exitCode = Number.parseInt(raw, 10)
        return { commandEnd: { exitCode: Number.isNaN(exitCode) ? null : exitCode } }
      }
      default:
        return null
    }
  }

  return null
}

/**
 * Turns the `file://<host>/<path>` form of OSC 7 into a local path.
 *
 * Returns null for a remote host (an ssh session reporting its own cwd, which is
 * meaningless locally) and for anything unparseable.
 */
function parseFileUri(value: string): string | null {
  if (!value.startsWith('file://')) return null

  const rest = value.slice('file://'.length)
  const slash = rest.indexOf('/')
  if (slash === -1) return null

  const host = rest.slice(0, slash)
  if (host !== '' && host !== 'localhost' && host.toLowerCase() !== hostnameLower()) return null

  let path: string
  try {
    path = decodeURIComponent(rest.slice(slash))
  } catch {
    return null // malformed percent-encoding
  }

  // Windows shells report /C:/Users/... - strip the leading slash.
  if (/^\/[a-zA-Z]:/.test(path)) path = path.slice(1)

  if (path === '') return null

  // A path carrying control characters is either a malformed sequence or an
  // attempt to smuggle escape codes into wherever we display the cwd. Either
  // way it is not a directory we should report.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting them is the point
  if (/[\u0000-\u001f\u007f]/.test(path)) return null

  return path
}

let cachedHostname: string | null = null
function hostnameLower(): string {
  cachedHostname ??= hostname().toLowerCase()
  return cachedHostname
}
