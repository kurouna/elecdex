import { describe, expect, it } from 'vitest'
import {
  CRT_ZOOM_MS,
  flipFrom,
  PANEL_BOX,
  pinStyle,
  ZOOM_FRACTION,
  zoomBox,
} from '../../src/renderer/layout/pane-zoom.js'

/**
 * The geometry of a pane brought to the front: the box it is pinned in, and the
 * transform that makes it fly there from where it sat.
 */

const box = (top: number, right: number, bottom: number, left: number) => ({
  top,
  right,
  bottom,
  left,
})

describe('zoomBox', () => {
  it('centres nine tenths of the workspace in it', () => {
    expect(zoomBox(box(0, 1000, 800, 0), 'full')).toEqual(box(40, 950, 760, 50))
    expect(ZOOM_FRACTION).toBe(0.9)
  })

  it('keeps the workspace offset', () => {
    // The workspace sits inside the window's padding, so its box rarely starts at 0.
    expect(zoomBox(box(100, 1100, 900, 100), 'full')).toEqual(box(140, 1050, 860, 150))
  })

  it('holds a panel to its own size, centred in the same place', () => {
    // A widget with little to show is brought forward as a panel: a readout with
    // a hand's width of nothing around it is worse than the pane it came from.
    const area = box(0, 1920, 1080, 0)
    const panel = zoomBox(area, 'panel')
    expect(panel).toEqual(
      box(
        (1080 - PANEL_BOX.h) / 2,
        (1920 + PANEL_BOX.w) / 2,
        (1080 + PANEL_BOX.h) / 2,
        (1920 - PANEL_BOX.w) / 2,
      ),
    )
  })

  it('never lets a panel grow past what a full one would take', () => {
    // A small window: the panel is the nine tenths, not its own larger size.
    expect(zoomBox(box(0, 600, 400, 0), 'panel')).toEqual(zoomBox(box(0, 600, 400, 0), 'full'))
  })

  it('gives nothing for a workspace with no area', () => {
    expect(zoomBox(box(0, 0, 0, 0), 'full')).toBeNull()
    expect(zoomBox(box(10, 10, 10, 10), 'panel')).toBeNull()
  })
})

describe('flipFrom', () => {
  it('carries a pane from its old box to its new one, about their centres', () => {
    // From the left quarter (0..200 of 800 wide, full height) to the middle of the window.
    const flip = flipFrom(box(0, 200, 400, 0), box(100, 700, 300, 300))
    expect(flip).toEqual({ dx: -400, dy: 0, sx: 0.5, sy: 2 })
  })

  it('has nothing to play when either box has no area', () => {
    expect(flipFrom(box(0, 0, 0, 0), box(0, 100, 100, 0))).toBeNull()
    expect(flipFrom(box(0, 100, 100, 0), box(0, 0, 0, 0))).toBeNull()
  })
})

describe('pinStyle', () => {
  it('places the pane in whole pixels', () => {
    expect(pinStyle(box(40.4, 950, 760, 50), null, CRT_ZOOM_MS)).toBe(
      '--zoom-top: 40px; --zoom-left: 50px; --zoom-width: 900px; --zoom-height: 720px',
    )
  })

  it('adds the flight it plays, when there is one', () => {
    expect(pinStyle(box(0, 100, 100, 0), { dx: -30, dy: 12, sx: 0.5, sy: 0.25 }, 260)).toBe(
      '--zoom-top: 0px; --zoom-left: 0px; --zoom-width: 100px; --zoom-height: 100px; ' +
        '--zoom-dx: -30px; --zoom-dy: 12px; --zoom-sx: 0.5; --zoom-sy: 0.25; --crt-duration: 260ms',
    )
  })
})
