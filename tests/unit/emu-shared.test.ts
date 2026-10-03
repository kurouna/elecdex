import { ByteReader, ByteWriter } from '@shared/emu/bytes'
import { memoryRows, windowStart } from '@shared/emu/mem-window'
import { seedOf, xorshift32 } from '@shared/emu/random'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SharedAudio } from '../../src/renderer/widgets/emu/audio.js'
import { Painter } from '../../src/renderer/widgets/emu/painter.js'
import { createPark, PARK_MS } from '../../src/renderer/widgets/emu/park.js'
import { deviceRoom, drawDotGrid } from '../../src/renderer/widgets/emu/screen.js'

/** The parts every emulator shares (docs/emu.md), apart from any one machine. */

describe('ByteWriter and ByteReader', () => {
  it('read back what was written, little-endian', () => {
    const w = new ByteWriter(17)
    w.u8(0xab)
    w.i8(-2)
    w.u16(0x1234)
    w.u32(0xdeadbeef)
    w.f64(1.5)
    w.raw([7])
    expect(w.at).toBe(17)
    expect(Array.from(w.bytes.subarray(2, 4))).toEqual([0x34, 0x12])
    const r = new ByteReader(w.bytes)
    expect([r.u8(), r.i8(), r.u16(), r.u32(), r.f64()]).toEqual([0xab, -2, 0x1234, 0xdeadbeef, 1.5])
    expect(Array.from(r.raw(1))).toEqual([7])
    expect(r.overrun).toBe(false)
  })

  it('reads a view into the middle of a larger buffer from its own start', () => {
    const big = new Uint8Array([9, 9, 0x01, 0x02, 9])
    expect(new ByteReader(big.subarray(2, 4)).u16()).toBe(0x0201)
  })

  it('gives what is left of a cut field, and says so', () => {
    const r = new ByteReader(new Uint8Array([1, 2, 3, 4, 5]))
    r.u16()
    expect(Array.from(r.raw(8))).toEqual([3, 4, 5])
    expect(r.at).toBe(5)
    expect(r.overrun).toBe(true)
  })

  it('says a cut input is not whole instead of throwing', () => {
    const r = new ByteReader(new Uint8Array([1, 2, 3]))
    expect(r.u16()).toBe(0x0201)
    expect(r.u32()).toBe(0)
    expect(r.overrun).toBe(true)
    expect(r.raw(4).length).toBe(0)
    expect(r.u8()).toBe(0)
  })
})

describe('xorshift32', () => {
  it('never gives zero from a seed, and repeats from the same state', () => {
    expect(seedOf(0)).not.toBe(0)
    let a = seedOf(42)
    let b = seedOf(42)
    for (let k = 0; k < 1000; k++) {
      a = xorshift32(a)
      b = xorshift32(b)
      expect(a).not.toBe(0)
    }
    expect(a).toBe(b)
  })

  it('is the classic sequence', () => {
    // Marsaglia's xorshift32 (13, 17, 5) from 1.
    expect(xorshift32(1)).toBe(270369)
  })
})

describe('the memory window', () => {
  it('reads a machine whose memory is a reader, not an array', () => {
    const reads: number[] = []
    const source = {
      size: 0x10000,
      read: (address: number) => {
        reads.push(address)
        return address & 0xff
      },
    }
    const rows = memoryRows(source, 0xfff8, 4)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.bytes).toEqual([0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff])
    expect(reads).toHaveLength(8)
    expect(windowStart(0x7000, 0x10000)).toBe(0x7000 - 4 * 8)
  })
})

describe('the parking place', () => {
  afterEach(() => vi.useRealTimers())

  it('keeps one place per kind of machine, so one kind never takes up another', () => {
    const a = createPark<string>()
    const b = createPark<string>()
    a.park('pane-1', 'chip8 machine')
    expect(b.claim('pane-1')).toBeNull()
    expect(a.claim('pane-1')).toBe('chip8 machine')
    expect(a.claim('pane-1')).toBeNull()
  })

  it('lets a machine nobody takes go', () => {
    vi.useFakeTimers()
    const place = createPark<string>()
    place.park('pane-1', 'machine')
    vi.advanceTimersByTime(PARK_MS + 1)
    expect(place.claim('pane-1')).toBeNull()
  })

  it('tells a machine nobody took that it went, and never one taken or parked again', () => {
    vi.useFakeTimers()
    const place = createPark<string>()
    const gone: string[] = []
    place.park('pane-1', 'closed', (e) => gone.push(e))
    place.park('pane-2', 'moved', (e) => gone.push(e))
    place.park('pane-3', 'first', (e) => gone.push(e))
    place.park('pane-3', 'second', (e) => gone.push(e))
    place.claim('pane-2')
    vi.advanceTimersByTime(PARK_MS + 1)
    expect(gone).toEqual(['closed', 'second'])
  })
})

describe('the painter', () => {
  const frame = (value: number) => ({ width: 1, height: 1, pixels: new Uint8Array([value]) })
  const out = () => ({ width: 1, height: 1, data: new Uint8ClampedArray(4) })
  const colours = [
    [0, 0, 0],
    [200, 200, 200],
  ] as const

  it('fades as slowly as its machine asks', () => {
    const fast = new Painter()
    const slow = new Painter({ fade: 0.2 })
    for (const painter of [fast, slow]) {
      painter.paint(frame(1), colours, out(), true)
    }
    const a = out()
    const b = out()
    fast.paint(frame(0), colours, a, true)
    slow.paint(frame(0), colours, b, true)
    // One frame after going dark, the slower glass still shows more of the dot.
    expect(b.data[0]).toBeGreaterThan(a.data[0] ?? 0)
    expect(slow.fading).toBe(true)
  })

  it('draws a dot value its colours do not name as the ground', () => {
    const painter = new Painter()
    const pixels = out()
    painter.paint(frame(7), colours, pixels, false)
    expect(Array.from(pixels.data)).toEqual([0, 0, 0, 255])
  })
})

describe('the screen', () => {
  /** A ResizeObserver entry with only what the browser may give. */
  const entry = (parts: {
    device?: [number, number]
    box?: [number, number]
    rect: [number, number]
  }): ResizeObserverEntry =>
    ({
      devicePixelContentBoxSize: parts.device
        ? [{ inlineSize: parts.device[0], blockSize: parts.device[1] }]
        : undefined,
      contentBoxSize: parts.box
        ? [{ inlineSize: parts.box[0], blockSize: parts.box[1] }]
        : undefined,
      contentRect: { width: parts.rect[0], height: parts.rect[1] },
    }) as unknown as ResizeObserverEntry

  it('reads the room in device pixels, from what the entry has', () => {
    expect(deviceRoom(entry({ device: [1000, 500], box: [800, 400], rect: [1, 1] }), 1.25)).toEqual(
      {
        w: 1000,
        h: 500,
        ratio: 1.25,
      },
    )
    expect(deviceRoom(entry({ box: [800, 400], rect: [1, 1] }), 1.25)).toEqual({
      w: 1000,
      h: 500,
      ratio: 1.25,
    })
    expect(deviceRoom(entry({ rect: [800, 400] }), 2)).toEqual({ w: 1600, h: 800, ratio: 2 })
  })

  it('measures nothing behind a tab, so the picture keeps its size', () => {
    expect(deviceRoom(entry({ device: [0, 500], rect: [0, 400] }), 1)).toBeNull()
    expect(deviceRoom(entry({ rect: [800, 0] }), 1)).toBeNull()
  })

  it('draws a grid line every whole dot, and none for a step of nothing', () => {
    const lines: number[][] = []
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        clearRect: () => {},
        fillRect: (...rect: number[]) => lines.push(rect),
        fillStyle: '',
      }),
    } as unknown as HTMLCanvasElement
    drawDotGrid(canvas, 8, 4, 4, 'black')
    expect([canvas.width, canvas.height]).toEqual([8, 4])
    expect(lines).toEqual([
      [0, 0, 1, 4],
      [4, 0, 1, 4],
      [0, 0, 8, 1],
    ])
    lines.length = 0
    drawDotGrid(canvas, 8, 4, 0, 'black')
    expect(lines).toEqual([])
  })
})

describe('the shared audio context', () => {
  /** A stand-in context that records the worklet modules it is asked to load. */
  function fakeContext(failing: string[] = []) {
    const added: string[] = []
    const ac = {
      state: 'running',
      audioWorklet: {
        addModule: (url: string) => {
          added.push(url)
          return failing.includes(url) ? Promise.reject(new Error('no')) : Promise.resolve()
        },
      },
      resume: () => Promise.resolve(),
      suspend: () => Promise.resolve(),
    }
    return { ac: ac as unknown as AudioContext, added }
  }

  it('makes one context and adds each machine voice once', async () => {
    const { ac, added } = fakeContext()
    let made = 0
    const audio = new SharedAudio(() => {
      made++
      return ac
    })
    await Promise.all([audio.get('chip8.js'), audio.get('chip8.js'), audio.get('elec16.js')])
    expect(made).toBe(1)
    expect(added).toEqual(['chip8.js', 'elec16.js'])
  })

  it('wakes the context while something sounds and puts it to sleep after a quiet while', async () => {
    vi.useFakeTimers()
    const { ac } = fakeContext()
    const calls: string[] = []
    const audio = new SharedAudio(() => ac)
    // Nothing made yet: waking does nothing, and arms nothing.
    audio.wake()
    expect(vi.getTimerCount()).toBe(0)
    await audio.get('chip8.js')
    Object.assign(ac, {
      state: 'suspended',
      resume: () => {
        calls.push('resume')
        return Promise.resolve()
      },
      suspend: () => {
        calls.push('suspend')
        return Promise.resolve()
      },
    })
    audio.wake()
    vi.advanceTimersByTime(3000)
    audio.wake()
    vi.advanceTimersByTime(3999)
    expect(calls).toEqual(['resume', 'resume'])
    vi.advanceTimersByTime(1)
    expect(calls).toEqual(['resume', 'resume', 'suspend'])
    vi.useRealTimers()
  })

  it('answers null where a context cannot be made, or a voice will not load', async () => {
    const none = new SharedAudio(() => {
      throw new Error('no audio')
    })
    expect(await none.get('chip8.js')).toBeNull()
    const { ac } = fakeContext(['broken.js'])
    const audio = new SharedAudio(() => ac)
    expect(await audio.get('broken.js')).toBeNull()
    expect(await audio.get('chip8.js')).toBe(ac)
  })
})
