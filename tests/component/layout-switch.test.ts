import type { LayoutNode } from '@shared/schemas/layout'
import { describe, expect, it } from 'vitest'
import {
  SWITCH_GAP_MS,
  SWITCH_OFF_MS,
  SWITCH_ON_MS,
  switchDelaysFor,
  switchRevealEnd,
  switchSoundTimes,
} from '../../src/renderer/layout/layout-switch.ts'

/**
 * The timing of a layout switch. The effect itself is CSS, and the e2e watches
 * it frame by frame; what is checked here is the arithmetic the store waits on -
 * a switch that clears its state too early cuts its own power-on short.
 */

const pane = (id: string, widget: string): LayoutNode => ({ kind: 'pane', id, widget })
const isShell = (widget: string) => widget === 'terminal'

const row: LayoutNode = {
  kind: 'split',
  id: 's',
  direction: 'row',
  sizes: [0.5, 0.25, 0.25],
  children: [pane('t', 'terminal'), pane('c', 'clock'), pane('m', 'memory')],
}

/** A fixed sequence, so the shuffle and the jitter are the same every run. */
const seeded = () => {
  let n = 0
  return () => {
    n += 1
    return (n * 0.37) % 1
  }
}

describe('switchDelaysFor', () => {
  it('gives every pane a moment, with the shells first', () => {
    const delays = switchDelaysFor(row, isShell, seeded())
    expect([...delays.keys()].sort()).toEqual(['c', 'm', 't'])
    expect(delays.get('t')).toBe(0)
    expect(delays.get('c') ?? 0).toBeGreaterThan(0)
    expect(delays.get('m') ?? 0).toBeGreaterThan(0)
  })

  it('is quicker than the boot reveal it borrows its shape from', () => {
    const delays = switchDelaysFor(row, isShell, seeded())
    // The boot reveal spans 1400ms before the last pane starts; this is a
    // switch, which stands between the user and the work.
    expect(Math.max(...delays.values())).toBeLessThan(600)
  })

  it('brings a lone pane on at once', () => {
    const delays = switchDelaysFor(pane('only', 'clock'), isShell, seeded())
    expect(delays.get('only')).toBe(120)
  })

  it('reaches the panes stacked behind a tab, which are in the tree too', () => {
    const tabs: LayoutNode = {
      kind: 'tabs',
      id: 'g',
      activeIndex: 0,
      children: [
        { kind: 'pane', id: 't1', widget: 'terminal' },
        { kind: 'pane', id: 't2', widget: 'terminal' },
      ],
    }
    expect([...switchDelaysFor(tabs, isShell, seeded()).keys()].sort()).toEqual(['t1', 't2'])
  })
})

describe('switchRevealEnd', () => {
  it('is the last pane to start, plus the time it takes to come on', () => {
    const delays = new Map([
      ['a', 0],
      ['b', 250],
    ])
    expect(switchRevealEnd(delays)).toBe(250 + SWITCH_ON_MS)
  })

  it('is nothing at all when no pane arrives', () => {
    expect(switchRevealEnd(new Map())).toBe(0)
  })
})

describe('switchSoundTimes', () => {
  it('sounds once per moment, and tells a shell from a module', () => {
    const delays = new Map([
      ['t', 0],
      ['c', 120],
      ['m', 120],
    ])
    const { shells, modules } = switchSoundTimes(row, isShell, delays)
    expect(shells).toEqual([0])
    // Two modules arriving together are one sound, not two.
    expect(modules).toEqual([120])
  })

  it('says nothing about a layout with no panes it knows', () => {
    const { shells, modules } = switchSoundTimes(pane('c', 'clock'), isShell, new Map())
    expect(shells).toEqual([])
    expect(modules).toEqual([0])
  })
})

describe('the timings the store waits on', () => {
  it('are long enough to be seen and short enough to stay out of the way', () => {
    expect(SWITCH_OFF_MS).toBeGreaterThan(100)
    expect(SWITCH_OFF_MS + SWITCH_GAP_MS).toBeLessThan(500)
    expect(SWITCH_ON_MS).toBeGreaterThan(100)
  })
})
