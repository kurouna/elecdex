import { hostname } from 'node:os'
import { describe, expect, it } from 'vitest'
import { OscParser } from '../../src/main/pty/osc-parser.js'

const enc = new TextEncoder()
const dec = new TextDecoder()

/** Feeds a whole string and returns the passthrough text plus the events. */
function feed(input: string) {
  const parser = new OscParser()
  const { data, events } = parser.write(enc.encode(input))
  return { text: dec.decode(data), events }
}

/** Feeds a string one byte at a time, to prove chunk boundaries are handled. */
function feedByteByByte(input: string) {
  const parser = new OscParser()
  const bytes = enc.encode(input)
  const out: number[] = []
  const events = []
  for (const byte of bytes) {
    const r = parser.write(new Uint8Array([byte]))
    out.push(...r.data)
    events.push(...r.events)
  }
  return { text: dec.decode(new Uint8Array(out)), events }
}

const ST = '\u001b\\'
const osc = (payload: string, terminator = ST) => `\u001b]${payload}${terminator}`

describe('OscParser: passthrough', () => {
  it('leaves ordinary text untouched', () => {
    const { text, events } = feed('hello world\r\n')
    expect(text).toBe('hello world\r\n')
    expect(events).toEqual([])
  })

  it('leaves unrelated escape sequences untouched', () => {
    const input = '\u001b[1;31mred\u001b[0m'
    expect(feed(input).text).toBe(input)
  })

  it('passes through OSC codes it does not own, re-terminated with ST', () => {
    // OSC 0 sets the window title - not ours.
    const { text, events } = feed(`a${osc('0;my title')}b`)
    expect(text).toBe(`a${osc('0;my title')}b`)
    expect(events).toEqual([])
  })

  it('preserves multi-byte utf-8 split across chunks', () => {
    const parser = new OscParser()
    const bytes = enc.encode('日本語')
    const a = parser.write(bytes.subarray(0, 4))
    const b = parser.write(bytes.subarray(4))
    expect(dec.decode(new Uint8Array([...a.data, ...b.data]))).toBe('日本語')
  })
})

describe('OscParser: OSC 7 cwd', () => {
  it('reports a posix path and strips the sequence', () => {
    const { text, events } = feed(`x${osc('7;file:///home/me/code')}y`)
    expect(text).toBe('xy')
    expect(events).toEqual([{ cwd: '/home/me/code' }])
  })

  it('strips the leading slash from a windows path', () => {
    expect(feed(osc('7;file:///C:/Users/me')).events).toEqual([{ cwd: 'C:/Users/me' }])
  })

  it('accepts localhost as the host', () => {
    expect(feed(osc('7;file://localhost/var/tmp')).events).toEqual([{ cwd: '/var/tmp' }])
  })

  it('percent-decodes the path', () => {
    expect(feed(osc('7;file:///home/me/my%20dir')).events).toEqual([{ cwd: '/home/me/my dir' }])
  })

  it('ignores a remote host, since its cwd is meaningless locally', () => {
    const input = osc('7;file://some-remote-box/home/me')
    const { text, events } = feed(input)
    expect(events).toEqual([])
    expect(text).toBe(input) // passed through, not swallowed
  })

  it.each(['7;not-a-uri', '7;file://', '7;file:///%ZZ'])(
    'passes through malformed payload %s',
    (payload) => {
      const { text, events } = feed(osc(payload))
      expect(events).toEqual([])
      expect(text).toBe(osc(payload))
    },
  )
})

describe('OscParser: OSC 133 command lifecycle', () => {
  it('reports prompt, start and end with an exit code', () => {
    const { text, events } = feed(
      `${osc('133;A')}$ ${osc('133;B')}ls${osc('133;C')}\r\nfile\r\n${osc('133;D;0')}`,
    )
    expect(text).toBe('$ ls\r\nfile\r\n')
    expect(events).toEqual([
      { promptStart: true },
      {}, // input start: consumed, carries nothing we act on
      { commandStart: true },
      { commandEnd: { exitCode: 0 } },
    ])
  })

  it('reports a non-zero exit code', () => {
    expect(feed(osc('133;D;127')).events).toEqual([{ commandEnd: { exitCode: 127 } }])
  })

  it('reports a null exit code when none is given', () => {
    expect(feed(osc('133;D')).events).toEqual([{ commandEnd: { exitCode: null } }])
    expect(feed(osc('133;D;')).events).toEqual([{ commandEnd: { exitCode: null } }])
  })

  it('reports a null exit code when it is not a number', () => {
    expect(feed(osc('133;D;abc')).events).toEqual([{ commandEnd: { exitCode: null } }])
  })

  it('passes through an unknown OSC 133 subcommand', () => {
    const { text, events } = feed(osc('133;Z'))
    expect(events).toEqual([])
    expect(text).toBe(osc('133;Z'))
  })
})

describe('OscParser: terminators', () => {
  it('accepts BEL as a terminator', () => {
    const { text, events } = feed(`a\u001b]7;file:///tmp\u0007b`)
    expect(text).toBe('ab')
    expect(events).toEqual([{ cwd: '/tmp' }])
  })

  it('accepts ESC-backslash as a terminator', () => {
    expect(feed(osc('7;file:///tmp')).events).toEqual([{ cwd: '/tmp' }])
  })
})

describe('OscParser: chunk boundaries', () => {
  it('handles a sequence split at every possible byte', () => {
    const input = `before${osc('7;file:///home/me')}middle${osc('133;D;3')}after`
    const { text, events } = feedByteByByte(input)
    expect(text).toBe('beforemiddleafter')
    expect(events).toEqual([{ cwd: '/home/me' }, { commandEnd: { exitCode: 3 } }])
  })

  it('keeps state across writes for a sequence spanning three chunks', () => {
    const parser = new OscParser()
    const r1 = parser.write(enc.encode('a\u001b]7;file://'))
    const r2 = parser.write(enc.encode('/home/m'))
    const r3 = parser.write(enc.encode(`e${ST}b`))
    expect(dec.decode(r1.data)).toBe('a')
    expect(dec.decode(r2.data)).toBe('')
    expect(dec.decode(r3.data)).toBe('b')
    expect([...r1.events, ...r2.events, ...r3.events]).toEqual([{ cwd: '/home/me' }])
  })
})

describe('OscParser: hostile input', () => {
  it('does not buffer without bound when a sequence never terminates', () => {
    const parser = new OscParser()
    const huge = `\u001b]7;${'A'.repeat(9000)}`
    const { data, events } = parser.write(enc.encode(huge))
    expect(events).toEqual([])
    // The abandoned sequence is flushed as plain output rather than retained.
    expect(data.length).toBeGreaterThan(4000)
    // And the parser is usable again afterwards.
    const next = parser.write(enc.encode(osc('7;file:///tmp')))
    expect(next.events).toEqual([{ cwd: '/tmp' }])
  })

  it('emits a withheld ESC when the next byte is not an OSC introducer', () => {
    const { text } = feed('\u001bXtail')
    expect(text).toBe('\u001bXtail')
  })

  it('handles a doubled ESC before the OSC introducer', () => {
    const { text, events } = feed(`\u001b\u001b]7;file:///tmp${ST}`)
    expect(text).toBe('\u001b')
    expect(events).toEqual([{ cwd: '/tmp' }])
  })

  it('rejects a cwd carrying control characters', () => {
    // A stray ESC stays part of the payload (it does not terminate the string), so
    // the sequence completes with a control char in the path. Reporting that would let
    // a hostile stream smuggle escape codes into wherever we display the cwd.
    const { events } = feed('\u001b]7;file:///tm\u001bXp\u0007')
    expect(events).toEqual([])
  })

  it('forgets a partial sequence after reset', () => {
    const parser = new OscParser()
    parser.write(enc.encode('\u001b]7;file://'))
    parser.reset()
    const { data, events } = parser.write(enc.encode('plain'))
    expect(dec.decode(data)).toBe('plain')
    expect(events).toEqual([])
  })
})

describe('OscParser: real-world payloads', () => {
  it('decodes the OSC 7 that our PowerShell integration actually emits', () => {
    // Captured from powershell.exe on Windows 11: the drive colon arrives
    // percent-encoded, and the host is the machine name rather than empty.
    const { events } = feed(osc(`7;file://${hostname()}/C%3A/Users/me/Claude/elecdex`))
    expect(events).toEqual([{ cwd: 'C:/Users/me/Claude/elecdex' }])
  })

  it('follows the full prompt-command-exit cycle PowerShell emits', () => {
    const { events } = feed(
      [
        osc('133;A'),
        osc('133;B'),
        osc('133;C'),
        osc('133;D;42'),
        osc(`7;file://${hostname()}/C%3A/Temp`),
        osc('133;A'),
      ].join(''),
    )
    expect(events).toEqual([
      { promptStart: true },
      {},
      { commandStart: true },
      { commandEnd: { exitCode: 42 } },
      { cwd: 'C:/Temp' },
      { promptStart: true },
    ])
  })
})
