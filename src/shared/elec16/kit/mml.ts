import { CHANNELS, ENV_MS } from '../apu.js'

/**
 * The game kit's music (docs/elec16-play.md section 10): a song written as text, one line per
 * channel in the manner of MML, compiled to the bytecode the kit's sound driver (games/lib)
 * plays a frame at a time. Everything the driver need not work out is worked out here: notes
 * become FREQ values, lengths frames, repeats and definitions are unrolled, the echo of a
 * channel is a second channel written out. Pure, so the build script and the tests compile
 * alike.
 *
 * A file:
 *
 *   # a comment (at a line's start or after a space: `c#` is a sharp)
 *   tempo 6                         frames to a sixteenth note (6 is 150 BPM at 60 frames)
 *   inst lead wave=sq25 vol=12 env=2/250/9/120 vib=3,6 pan=8
 *   define riff = o2 l16 a a > a < a
 *   C0: @lead o4 l8 a4. g8 L a2 ...      lines for one channel are joined in order
 *   C3: [$riff]4
 *   echo C1 = C0 delay 3 vol -4 pan 12
 *
 * In a channel: `c d e f g a b` with `+`/`#` or `-`, a length (1 2 4 8 16 32 64), dots and
 * `^` ties; `r` a rest; `o` `<` `>` octaves; `l` the length (dotted too); `v` volume; `@` an
 * instrument; `p` pan; `q` how much of a note is held, in eighths; `k` transpose in semitones;
 * `L` where it loops; `[ ... ]n` repeats; `$name` a definition.
 */

/** The most items a channel unrolls to: past it a song is refused, never left to run on. */
export const MAX_ITEMS = 8192
/** The most commands a channel reads, repeats unrolled: a song can never hang a build. */
const MAX_WORK = 1_000_000

export const OP = {
  note: 1,
  rest: 2,
  inst: 3,
  vol: 4,
  pan: 5,
  loop: 6,
  end: 7,
  hold: 8,
  /** A note as long and as held as the last: just its FREQ. */
  again: 9,
  /** The last note once more. */
  repeat: 10,
} as const

const WAVES: Record<string, number> = {
  sq12: 0,
  sq25: 1,
  sq50: 2,
  sq75: 3,
  tri: 4,
  saw: 5,
  noise: 6,
  tbl0: 8,
  tbl1: 9,
  tbl2: 10,
  tbl3: 11,
  tbl4: 12,
  tbl5: 13,
  tbl6: 14,
  tbl7: 15,
}

export interface Instrument {
  name: string
  wave: number
  vol: number
  env: number
  mod: number
  pan: number
  /** Each frame FREQ loses FREQ >> drop (a kick's fall); 0 for none. */
  drop: number
}

export interface Song {
  name: string
  tempo: number
  instruments: Instrument[]
  /** Bytecode per channel used, by channel number. */
  channels: { channel: number; code: number[]; loop: number | null }[]
}

export class MmlError extends Error {}

/** The FREQ register's value for a MIDI note: quarters of a hertz, A4 (69) at 440 Hz. */
export const freqOf = (note: number): number =>
  Math.min(0xffff, Math.round(440 * 2 ** ((note - 69) / 12) * 4))

const NOTE_STEPS: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }

/** The nearest envelope step to `ms`. */
function envStep(ms: number): number {
  let best = 0
  ENV_MS.forEach((m, k) => {
    if (Math.abs(m - ms) < Math.abs((ENV_MS[best] ?? 0) - ms)) best = k
  })
  return best
}

/** The ENV register for attack, decay and release in ms and a sustain level, nearest steps. */
export function envOf(attack: number, decay: number, sustain: number, release: number): number {
  if (!(sustain >= 0 && sustain <= 15)) throw new MmlError('a sustain is 0 to 15')
  return envStep(attack) | (envStep(decay) << 4) | (sustain << 8) | (envStep(release) << 12)
}

type Field = (inst: Instrument, value: string, n: (s: string) => number) => void

/** What each field of an `inst` line does to the instrument. */
const FIELDS: Record<string, Field> = {
  wave: (inst, value) => {
    const w = WAVES[value]
    if (w === undefined) throw new MmlError(`no wave ${value}`)
    inst.wave = w
  },
  vol: (inst, value, n) => {
    inst.vol = n(value) & 15
  },
  pan: (inst, value, n) => {
    inst.pan = n(value) & 15
  },
  drop: (inst, value, n) => {
    inst.drop = n(value) & 15
  },
  env: (inst, value, n) => {
    const [a, d, s, r] = value.split('/').map(n)
    inst.env = envOf(a ?? 0, d ?? 0, s ?? 15, r ?? 0)
  },
  slide: (inst, value, n) => {
    inst.mod = (inst.mod & 0xff00) | (n(value) & 0xff)
  },
  vib: (inst, value, n) => {
    const [depth, rate] = value.split(',').map(n)
    inst.mod = (inst.mod & 0xff) | (((depth ?? 0) & 15) << 8) | (((rate ?? 0) & 15) << 12)
  },
}

function instrument(name: string, fields: string[]): Instrument {
  const inst: Instrument = { name, wave: 2, vol: 15, env: 0x0f00, mod: 0, pan: 8, drop: 0 }
  for (const field of fields) {
    const [key = '', value = ''] = field.split('=')
    const n = (s: string) => {
      const v = Number(s)
      if (!Number.isFinite(v)) throw new MmlError(`${field} is not a number`)
      return v
    }
    const set = FIELDS[key]
    try {
      if (set === undefined) throw new MmlError(`no field ${key}`)
      set(inst, value, n)
    } catch (e) {
      throw new MmlError(`${name}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return inst
}

interface Event {
  /** A note's MIDI number, or null for a rest. */
  note: number | null
  frames: number
  /** Frames the key is held, for a note. */
  held: number
}

type Item =
  | { k: 'event'; e: Event }
  | { k: 'inst'; i: number }
  | { k: 'vol'; v: number }
  | { k: 'pan'; p: number }
  | { k: 'loop' }

/** A cursor over one piece of a channel's text. */
class Cursor {
  readonly text: string
  i = 0

  constructor(text: string) {
    this.text = text
  }

  get done(): boolean {
    return this.i >= this.text.length
  }

  peek(): string {
    return this.text[this.i] ?? ''
  }

  take(): string {
    return this.text[this.i++] ?? ''
  }

  number(): number | null {
    return this.match(/^-?\d+/, Number)
  }

  match<T>(pattern: RegExp, read: (s: string) => T): T | null {
    const m = pattern.exec(this.text.slice(this.i))
    if (m === null) return null
    this.i += m[0].length
    return read(m[0])
  }
}

/** One channel's text read into items, with its own octave, length, gate and transpose. */
class Track {
  items: Item[] = []
  octave = 4
  length = 4
  /** The dots of the default length (`l8.`). */
  lengthDots = 0
  gate = 8
  transpose = 0
  readonly #tempo: number
  readonly #insts: Map<string, number>
  readonly #defs: Map<string, string>
  #depth = 0
  #work = 0

  constructor(tempo: number, insts: Map<string, number>, defs: Map<string, string>) {
    this.#tempo = tempo
    this.#insts = insts
    this.#defs = defs
  }

  /** A length (1 to 64, dotted) in frames: a whole note is sixteen sixteenths. */
  #frames(length: number, dots: number): number {
    let f = (16 * this.#tempo) / length
    let add = f
    for (let k = 0; k < dots; k++) {
      add /= 2
      f += add
    }
    if (!Number.isInteger(f)) throw new MmlError(`a 1/${length} note is not whole frames`)
    return f
  }

  /** A length's number, if one is written: 1 or more. */
  #lengthNumber(c: Cursor): number | null {
    const n = c.number()
    if (n !== null && n <= 0) throw new MmlError(`a length of ${n}: lengths are 1 to 64`)
    return n
  }

  #dots(c: Cursor): number {
    let dots = 0
    while (c.peek() === '.') {
      dots++
      c.take()
    }
    return dots
  }

  #length(c: Cursor): number {
    const n = this.#lengthNumber(c)
    const dots = this.#dots(c)
    return n === null ? this.#frames(this.length, this.lengthDots + dots) : this.#frames(n, dots)
  }

  read(text: string): void {
    this.#count()
    this.#depth++
    if (this.#depth > 16) throw new MmlError('definitions nest too deeply')
    const c = new Cursor(text)
    while (!c.done) {
      this.#count()
      this.#command(c, c.take())
    }
    this.#depth--
  }

  /** A step of work: a song that unrolls past what a channel can hold stops here. */
  #count(): void {
    this.#work++
    if (this.#work > MAX_WORK || this.items.length > MAX_ITEMS) {
      throw new MmlError(`more than ${MAX_ITEMS} notes and changes unrolled: repeat less`)
    }
  }

  /** One command, its letter `raw` already taken. */
  #command(c: Cursor, raw: string): void {
    const k = raw.toLowerCase()
    if (/\s|\|/.test(k)) return
    if (raw === 'L') this.items.push({ k: 'loop' })
    else if (k in NOTE_STEPS) this.#note(c, NOTE_STEPS[k] ?? 0)
    else if (k === 'r') this.#event(null, this.#length(c))
    else if (k === '^') this.#tie(this.#length(c))
    else if (k === '@') this.#instrument(c)
    else if (k === '$') this.read(this.#definition(c))
    else if (k === '[') this.#repeat(c)
    else if (!this.#setting(c, k)) throw new MmlError(`what is ${raw}`)
  }

  /** o < > l q k v p: answers whether `k` was one. */
  #setting(c: Cursor, k: string): boolean {
    if (k === 'o') this.octave = c.number() ?? this.octave
    else if (k === '<') this.octave--
    else if (k === '>') this.octave++
    else if (k === 'l') this.#defaultLength(c)
    else if (k === 'q') this.gate = Math.max(1, Math.min(8, c.number() ?? 8))
    else if (k === 'k') this.transpose = c.number() ?? 0
    else if (k === 'v') this.items.push({ k: 'vol', v: (c.number() ?? 15) & 15 })
    else if (k === 'p') this.items.push({ k: 'pan', p: (c.number() ?? 8) & 15 })
    else return false
    return true
  }

  /** `l`: the length a note without one takes, dots and all. */
  #defaultLength(c: Cursor): void {
    const n = this.#lengthNumber(c)
    const dots = this.#dots(c)
    if (n === null && dots === 0) return
    this.length = n ?? this.length
    this.lengthDots = dots
    this.#frames(this.length, this.lengthDots)
  }

  #note(c: Cursor, base: number): void {
    let step = base
    while (c.peek() !== '' && '+#-'.includes(c.peek())) step += c.take() === '-' ? -1 : 1
    const frames = this.#length(c)
    this.#event((this.octave + 1) * 12 + step + this.transpose, frames)
  }

  #instrument(c: Cursor): void {
    const name = c.match(/^[\w-]+/, (s) => s) ?? ''
    const index = this.#insts.get(name)
    if (index === undefined) throw new MmlError(`no instrument ${name}`)
    this.items.push({ k: 'inst', i: index })
  }

  #definition(c: Cursor): string {
    const name = c.match(/^\w+/, (s) => s) ?? ''
    const body = this.#defs.get(name)
    if (body === undefined) throw new MmlError(`no definition ${name}`)
    return body
  }

  #repeat(c: Cursor): void {
    const end = matching(c.text, c.i - 1)
    const body = c.text.slice(c.i, end)
    c.i = end + 1
    const times = c.number() ?? 2
    if (times < 1) throw new MmlError(`[ ... ]${times}: a repeat is played once or more`)
    for (let k = 0; k < times; k++) this.read(body)
  }

  #event(note: number | null, frames: number): void {
    const held = note === null ? 0 : Math.max(1, Math.round((frames * this.gate) / 8))
    this.items.push({ k: 'event', e: { note, frames, held } })
  }

  #tie(frames: number): void {
    const last = this.items.at(-1)
    if (last?.k !== 'event') throw new MmlError('^ follows a note or a rest')
    const full = last.e.held === last.e.frames
    last.e.frames += frames
    if (last.e.note === null) return
    last.e.held = full ? last.e.frames : Math.max(1, Math.round((last.e.frames * this.gate) / 8))
  }
}

/** Where the `]` that closes the `[` at `open` is. */
function matching(text: string, open: number): number {
  let depth = 0
  for (let k = open; k < text.length; k++) {
    if (text[k] === '[') depth++
    if (text[k] === ']') depth--
    if (text[k] === ']' && depth === 0) return k
  }
  throw new MmlError('a [ with no ]')
}

/** `frames` as lengths of at most 255. */
function chunks(frames: number): number[] {
  const out: number[] = []
  let left = frames
  while (left > 255) {
    out.push(255)
    left -= 255
  }
  out.push(left)
  return out
}

/** The last note a channel's code played: what AGAIN and REPEAT take from. */
interface Last {
  freq: number
  frames: number
  held: number
}

/**
 * A note as bytecode: REPEAT when it is the last note again, AGAIN when only its pitch differs,
 * NOTE otherwise. One longer than 255 frames goes on in HOLDs of at most 255, each saying how
 * many of its frames the key is still held (0 when it is held past it, or was let go before),
 * so the key is let go on the note's exact frame.
 */
function noteCode(e: Event, code: number[], last: Last): void {
  const [first = 0, ...rest] = chunks(e.frames)
  const freq = freqOf(e.note ?? 0)
  // A held of 0 keeps the key down past the first part: a HOLD lets it go.
  const held = rest.length > 0 && e.held > first ? 0 : e.held
  if (rest.length === 0 && first === last.frames && held === last.held) {
    if (freq === last.freq) code.push(OP.repeat)
    else code.push(OP.again, freq & 0xff, freq >> 8)
    last.freq = freq
    return
  }
  code.push(OP.note, freq & 0xff, freq >> 8, first, held)
  last.freq = freq
  last.frames = first
  last.held = held
  // Past 255 frames the channel's last length is not this one: the next note says its own.
  if (rest.length > 0) last.frames = -1
  let left = e.held - first
  rest.forEach((f, k) => {
    const end = k === rest.length - 1
    code.push(OP.hold, f, left <= 0 || (left > f && !end) ? 0 : Math.min(left, f))
    left -= f
  })
}

/** One item's bytecode onto `code`. */
function itemCode(item: Exclude<Item, { k: 'loop' }>, code: number[], last: Last): void {
  switch (item.k) {
    case 'inst':
      code.push(OP.inst, item.i)
      return
    case 'vol':
      code.push(OP.vol, item.v)
      return
    case 'pan':
      code.push(OP.pan, item.p)
      return
    default:
      if (item.e.note !== null) noteCode(item.e, code, last)
      else for (const f of chunks(item.e.frames)) code.push(OP.rest, f)
  }
}

/** A channel's items as bytecode; one that loops must take time after its loop point. */
function encode(items: Item[]): { code: number[]; loop: number | null } {
  const back = items.findLastIndex((item) => item.k === 'loop')
  if (back >= 0 && !items.slice(back).some((item) => item.k === 'event')) {
    throw new MmlError('nothing plays after L: the loop would never take a frame')
  }
  const code: number[] = []
  let loop: number | null = null
  // Nothing is known at the start, nor where the loop comes back to.
  const last: Last = { freq: -1, frames: -1, held: -1 }
  for (const item of items) {
    if (item.k === 'loop') {
      loop = code.length
      last.frames = -1
      last.freq = -1
    } else itemCode(item, code, last)
  }
  code.push(loop === null ? OP.end : OP.loop)
  return { code, loop }
}

/** The echo of a channel: its items shifted later and quieter, perhaps placed elsewhere. */
function echoOf(items: Item[], delay: number, volume: number, pan: number | null): Item[] {
  const out: Item[] = delay > 0 ? [{ k: 'event', e: { note: null, frames: delay, held: 0 } }] : []
  // A channel that sets no volume before its first note plays at 15: its echo is quieter
  // than that from the start, not only after a `v`.
  const first = items.findIndex((item) => item.k === 'event' || item.k === 'vol')
  if (first < 0 || items[first]?.k !== 'vol') {
    out.push({ k: 'vol', v: Math.max(0, Math.min(15, 15 + volume)) })
  }
  for (const item of items) {
    if (item.k === 'vol') out.push({ k: 'vol', v: Math.max(0, Math.min(15, item.v + volume)) })
    else if (item.k === 'pan') out.push({ k: 'pan', p: pan ?? item.p })
    else out.push(item)
    if (item.k === 'inst' && pan !== null) out.push({ k: 'pan', p: pan })
  }
  return out
}

interface Echo {
  to: number
  from: number
  delay: number
  vol: number
  pan: number | null
}

const ECHO = /^echo\s+C(\d+)\s*=\s*C(\d+)\s+delay\s+(\d+)(?:\s+vol\s+(-?\d+))?(?:\s+pan\s+(\d+))?$/

/** A song's lines, read: its tempo, instruments, definitions, channels' text and echoes. */
class SongText {
  tempo = 6
  readonly instruments: Instrument[] = []
  readonly insts = new Map<string, number>()
  readonly defs = new Map<string, string>()
  readonly lines = new Map<number, string[]>()
  readonly echoes: Echo[] = []
  readonly #name: string

  constructor(name: string) {
    this.#name = name
  }

  /** One line, or false when it is none of the kinds. */
  line(line: string): boolean {
    const tempo = /^tempo\s+(\d+)$/.exec(line)
    if (tempo) this.tempo = Number(tempo[1])
    const inst = /^inst\s+([\w-]+)\s*(.*)$/.exec(line)
    if (inst) this.#instrument(inst[1] ?? '', inst[2] ?? '')
    const def = /^define\s+(\w+)\s*=\s*(.*)$/.exec(line)
    if (def) this.defs.set(def[1] ?? '', def[2] ?? '')
    const channel = /^C(\d+):(.*)$/.exec(line)
    if (channel) this.#channel(Number(channel[1]), channel[2] ?? '')
    const echo = ECHO.exec(line)
    if (echo) this.#echo(echo)
    return Boolean(tempo || inst || def || channel || echo)
  }

  #instrument(name: string, fields: string): void {
    const inst = instrument(name, fields.split(/\s+/).filter(Boolean))
    this.insts.set(inst.name, this.instruments.length)
    this.instruments.push(inst)
  }

  #channel(ch: number, text: string): void {
    if (ch >= CHANNELS) throw new MmlError(`${this.#name}: no channel ${ch}`)
    this.lines.set(ch, [...(this.lines.get(ch) ?? []), text])
  }

  #echo(m: RegExpExecArray): void {
    const echo: Echo = {
      to: Number(m[1]),
      from: Number(m[2]),
      delay: Number(m[3]),
      vol: Number(m[4] ?? -4),
      pan: m[5] === undefined ? null : Number(m[5]),
    }
    const say = (what: string) => new MmlError(`${this.#name}: echo ${what}`)
    for (const ch of [echo.to, echo.from]) {
      if (ch >= CHANNELS) throw say(`on C${ch}: no such channel`)
    }
    if (echo.delay > 255) throw say(`delay ${echo.delay}: at most 255 frames`)
    if (echo.vol < -15 || echo.vol > 15) throw say(`vol ${echo.vol}: -15 to 15`)
    if (echo.pan !== null && echo.pan > 15) throw say(`pan ${echo.pan}: 0 to 15`)
    this.echoes.push(echo)
  }
}

/** Each channel's text read into items, and the echoes written out. */
function tracksOf(name: string, song: SongText): Map<number, Item[]> {
  const tracks = new Map<number, Item[]>()
  for (const [ch, parts] of song.lines) {
    const track = new Track(song.tempo, song.insts, song.defs)
    try {
      track.read(parts.join(' '))
    } catch (e) {
      throw new MmlError(`${name} C${ch}: ${e instanceof Error ? e.message : String(e)}`)
    }
    tracks.set(ch, track.items)
  }
  for (const e of song.echoes) {
    const from = tracks.get(e.from)
    if (from === undefined) throw new MmlError(`${name}: echo of an empty C${e.from}`)
    tracks.set(e.to, echoOf(from, e.delay, e.vol, e.pan))
  }
  return tracks
}

/** A song's text compiled. */
export function compileSong(name: string, text: string): Song {
  const song = new SongText(name)
  for (const raw of text.split(/\r?\n/)) {
    // A comment starts a line or follows a space: `c#` is a sharp.
    const line = raw.replace(/(^|\s)#.*$/, '').trim()
    if (line !== '' && !song.line(line)) throw new MmlError(`${name}: what is "${line}"`)
  }
  if (!(song.tempo >= 1 && song.tempo <= 60)) {
    throw new MmlError(`${name}: a tempo is 1 to 60 frames`)
  }
  const channels = [...tracksOf(name, song)]
    .sort((a, b) => a[0] - b[0])
    .map(([channel, items]) => ({ channel, ...encode(items) }))
  return { name, tempo: song.tempo, instruments: song.instruments, channels }
}

/** A file of songs: `song name` starts each one. */
export function compileSongs(text: string): Song[] {
  const songs: Song[] = []
  let name: string | null = null
  let body: string[] = []
  const flush = () => {
    if (name !== null) songs.push(compileSong(name, body.join('\n')))
  }
  for (const line of text.split(/\r?\n/)) {
    const m = /^song\s+(\w+)\s*$/.exec(line.trim())
    if (m) {
      flush()
      name = m[1] ?? ''
      body = []
    } else body.push(line)
  }
  flush()
  return songs
}

/** Each op's size in bytes, and the frames it takes (from its bytes, or the last note's). */
const OP_SIZE: Record<
  number,
  { size: number; frames: (code: number[], at: number, last: number) => number }
> = {
  [OP.note]: { size: 5, frames: (code, at) => code[at + 3] ?? 0 },
  [OP.rest]: { size: 2, frames: (code, at) => code[at + 1] ?? 0 },
  [OP.hold]: { size: 3, frames: (code, at) => code[at + 1] ?? 0 },
  [OP.again]: { size: 3, frames: (_code, _at, last) => last },
  [OP.repeat]: { size: 1, frames: (_code, _at, last) => last },
  [OP.inst]: { size: 2, frames: () => 0 },
  [OP.vol]: { size: 2, frames: () => 0 },
  [OP.pan]: { size: 2, frames: () => 0 },
}

/** How many frames each channel plays before it loops or ends, for tests and the report. */
export function channelFrames(song: Song): Map<number, number> {
  return new Map(song.channels.map((ch) => [ch.channel, framesFrom(ch.code, 0)]))
}

/**
 * How many frames each looping channel takes to come round: from its loop point to its end.
 * Channels that loop together must agree, or the band drifts apart.
 */
export function loopFrames(song: Song): Map<number, number> {
  const looping = song.channels.filter((ch) => ch.loop !== null)
  return new Map(looping.map((ch) => [ch.channel, framesFrom(ch.code, ch.loop ?? 0)]))
}

/** The frames a channel's code takes from offset `from` to its end. */
function framesFrom(code: number[], from: number): number {
  let frames = 0
  let at = 0
  let last = 0
  for (let op = OP_SIZE[code[0] ?? 0]; op !== undefined; op = OP_SIZE[code[at] ?? 0]) {
    if (at >= from) frames += op.frames(code, at, last)
    if (code[at] === OP.note) last = code[at + 3] ?? 0
    at += op.size
  }
  return frames
}

/**
 * A song as bytes for the cartridge: a head, the instruments and each channel's code. Offsets
 * are from the song's start, so it can sit anywhere in a bank (at an even address).
 *
 *   0  channels used (n)        1  instruments (m)
 *   2  per channel: number, 0, start (u16), loop (u16, 0xFFFF none)    6 bytes each
 *   .. per instrument: wave, vol, env (u16), mod (u16), pan, drop      8 bytes each
 *   .. the code
 */
export function songBytes(song: Song): Uint8Array {
  const head = 2 + song.channels.length * 6
  let at = head + song.instruments.length * 8
  const out: number[] = [song.channels.length, song.instruments.length]
  for (const ch of song.channels) {
    const loop = ch.loop === null ? 0xffff : at + ch.loop
    out.push(ch.channel, 0, at & 0xff, at >> 8, loop & 0xff, loop >> 8)
    at += ch.code.length
  }
  for (const i of song.instruments) {
    out.push(i.wave, i.vol, i.env & 0xff, i.env >> 8, i.mod & 0xff, i.mod >> 8, i.pan, i.drop)
  }
  for (const ch of song.channels) out.push(...ch.code)
  if (out.length > 0x2000) throw new MmlError(`${song.name} is more than a bank`)
  return Uint8Array.from(out)
}
