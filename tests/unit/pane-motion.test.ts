import { describe, expect, it } from 'vitest'
import { insetStyle } from '../../src/renderer/layout/pane-close.js'
import { type HostMotionState, hostMotion } from '../../src/renderer/layout/pane-motion.js'
import { edgeStyle, landStyle } from '../../src/renderer/layout/pane-reflow.js'
import { CRT_CLOSE_MS, CRT_FLARE_MS } from '../../src/renderer/lib/crt-timing.js'

/**
 * The effects a pane or a tab group plays on itself, said once for both hosts:
 * which of them wins when more than one is asked for, and where the zoom's
 * placement goes.
 */

const still: HostMotionState = {
  closing: false,
  pinned: false,
  zoom: { phase: null, style: null },
}
const inset = { top: 10, right: 0, bottom: 0, left: 0 }
const extend = { kind: 'extend', inset } as const
const ZOOM = 'position: fixed; top: 0px; left: 0px; width: 100px; height: 100px'
const ADDED = '--crt-duration: 520ms'

const on = (classes: Record<string, boolean>): string[] =>
  Object.entries(classes)
    .filter(([, set]) => set)
    .map(([name]) => name)

describe('hostMotion', () => {
  it('plays nothing for a host standing still', () => {
    const motion = hostMotion(still)
    expect(on(motion.classes)).toEqual([])
    expect(motion.style).toBeUndefined()
  })

  it('powers a pane on with the timing it is given', () => {
    const motion = hostMotion({ ...still, powerOn: ADDED })
    expect(on(motion.classes)).toEqual(['crt-on'])
    expect(motion.style).toBe(ADDED)
    expect(motion.poweringOn).toBe(true)
  })

  it('powers off with the beam, cutting short a power-on', () => {
    const motion = hostMotion({ ...still, closing: true, powerOn: ADDED })
    expect(on(motion.classes)).toEqual(['crt-off', 'crt-beam'])
    expect(motion.style).toBe(`--crt-duration: ${CRT_CLOSE_MS}ms`)
    expect(motion.poweringOn).toBe(false)
  })

  it('powers off rather than extending: the class and the style say the same', () => {
    const motion = hostMotion({ ...still, closing: true, reflow: extend })
    expect(on(motion.classes)).toEqual(['crt-off', 'crt-beam'])
    expect(motion.style).toBe(`--crt-duration: ${CRT_CLOSE_MS}ms`)
  })

  it('extends from its inset, cutting short a power-on', () => {
    const motion = hostMotion({ ...still, reflow: extend, powerOn: ADDED })
    expect(on(motion.classes)).toEqual(['crt-extend'])
    expect(motion.style).toBe(insetStyle(inset))
  })

  it('is pinned by the zoom style, which comes after its own effect', () => {
    const motion = hostMotion({
      ...still,
      closing: true,
      pinned: true,
      zoom: { phase: null, style: ZOOM },
    })
    expect(on(motion.classes)).toEqual(['crt-off', 'crt-beam', 'pane-pinned'])
    expect(motion.style).toBe(`--crt-duration: ${CRT_CLOSE_MS}ms; ${ZOOM}`)
  })

  it('flies in and out only while pinned', () => {
    const flying = (phase: 'in' | 'out') => ({ ...still, zoom: { phase, style: ZOOM } })
    expect(on(hostMotion({ ...flying('in'), pinned: true }).classes)).toEqual([
      'pane-pinned',
      'crt-zoom',
    ])
    expect(on(hostMotion({ ...flying('out'), pinned: true }).classes)).toEqual([
      'pane-pinned',
      'crt-zoom-out',
    ])
    // Another host while one flies: the zoom is not its own.
    const other = hostMotion(flying('in'))
    expect(on(other.classes)).toEqual([])
    expect(other.style).toBeUndefined()
  })

  it('flies a moved host in, and lights the edges of one that lost room', () => {
    const flip = { dx: -600, dy: 0, sx: 1, sy: 1 }
    const landing = hostMotion({ ...still, reflow: { kind: 'land', flip }, powerOn: ADDED })
    expect(on(landing.classes)).toEqual(['crt-land'])
    expect(landing.style).toBe(landStyle(flip))
    const edges = { top: 0, right: 2, bottom: 0, left: 0 }
    const edged = hostMotion({ ...still, reflow: { kind: 'edge', edges } })
    expect(on(edged.classes)).toEqual(['crt-edge'])
    expect(edged.style).toBe(edgeStyle(edges))
  })

  it('plays one effect of its own at a time, the first that applies', () => {
    const land = { kind: 'land', flip: { dx: 10, dy: 0, sx: 1, sy: 1 } } as const
    const edge = { kind: 'edge', edges: { top: 2, right: 0, bottom: 0, left: 0 } } as const
    expect(on(hostMotion({ ...still, reflow: land, flare: true }).classes)).toEqual(['crt-land'])
    expect(on(hostMotion({ ...still, reflow: edge, powerOn: ADDED }).classes)).toEqual(['crt-edge'])
  })

  it('flares only when nothing else of its own plays, and not while the zoom flies it', () => {
    const flared = hostMotion({ ...still, flare: true })
    expect(on(flared.classes)).toEqual(['crt-flare'])
    expect(flared.style).toBe(`--crt-duration: ${CRT_FLARE_MS}ms`)
    expect(on(hostMotion({ ...still, flare: true, powerOn: ADDED }).classes)).toEqual(['crt-on'])
    const flying = {
      ...still,
      pinned: true,
      zoom: { phase: 'in' as const, style: ZOOM },
      flare: true,
    }
    expect(on(hostMotion(flying).classes)).toEqual(['pane-pinned', 'crt-zoom'])
    // Pinned and standing still, it flares where it is.
    const standing = { ...flying, zoom: { phase: null, style: ZOOM } }
    expect(on(hostMotion(standing).classes)).toEqual(['crt-flare', 'pane-pinned'])
  })
})
