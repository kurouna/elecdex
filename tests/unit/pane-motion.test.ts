import { describe, expect, it } from 'vitest'
import { insetStyle } from '../../src/renderer/layout/pane-close.js'
import { type HostMotionState, hostMotion } from '../../src/renderer/layout/pane-motion.js'
import { CRT_CLOSE_MS } from '../../src/renderer/lib/crt-timing.js'

/**
 * The effects a pane or a tab group plays on itself, said once for both hosts:
 * which of them wins when more than one is asked for, and where the zoom's
 * placement goes.
 */

const still: HostMotionState = {
  closing: false,
  extend: undefined,
  pinned: false,
  zoomPhase: null,
  zoomStyle: null,
}
const inset = { top: 10, right: 0, bottom: 0, left: 0 }
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
  })

  it('powers off with the beam, cutting short a power-on', () => {
    const motion = hostMotion({ ...still, closing: true, powerOn: ADDED })
    expect(on(motion.classes)).toEqual(['crt-off', 'crt-beam'])
    expect(motion.style).toBe(`--crt-duration: ${CRT_CLOSE_MS}ms`)
  })

  it('extends from its inset, cutting short a power-on', () => {
    const motion = hostMotion({ ...still, extend: inset, powerOn: ADDED })
    expect(on(motion.classes)).toEqual(['crt-extend'])
    expect(motion.style).toBe(insetStyle(inset))
  })

  it('is pinned by the zoom style, which comes after its own effect', () => {
    const motion = hostMotion({ ...still, closing: true, pinned: true, zoomStyle: ZOOM })
    expect(on(motion.classes)).toEqual(['crt-off', 'crt-beam', 'pane-pinned'])
    expect(motion.style).toBe(`--crt-duration: ${CRT_CLOSE_MS}ms; ${ZOOM}`)
  })

  it('flies in and out only while pinned', () => {
    const flying = { ...still, zoomStyle: ZOOM }
    expect(on(hostMotion({ ...flying, pinned: true, zoomPhase: 'in' }).classes)).toEqual([
      'pane-pinned',
      'crt-zoom',
    ])
    expect(on(hostMotion({ ...flying, pinned: true, zoomPhase: 'out' }).classes)).toEqual([
      'pane-pinned',
      'crt-zoom-out',
    ])
    // Another host while one flies: the zoom is not its own.
    const other = hostMotion({ ...flying, zoomPhase: 'in' })
    expect(on(other.classes)).toEqual([])
    expect(other.style).toBeUndefined()
  })
})
