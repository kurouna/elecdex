import { describe, expect, it } from 'vitest'
import { takeParked, unitToFollow } from '../../src/renderer/widgets/elec16/parked-unit'

/**
 * What a mounting ELEC-16 pane takes of the machine parked under its pane id
 * (widgets/emu/park.ts): a moved pane takes its own machine back; a pane that only shares the
 * id - another saved layout's, on another unit - must not take it up, and the parked one is
 * let go (its unit released with its RAM) instead.
 */

const parked = (unit: string) => ({ unit, machine: `machine of ${unit}`, paused: false })

describe('a parked machine and the pane that mounts', () => {
  it('is taken back by the pane it was parked for: the same unit', () => {
    const p = parked('u1')
    expect(takeParked(p, 'u1')).toEqual({ take: p, letGo: null })
  })

  it('is taken by a pane that names no unit yet (a moved pane before its state was written)', () => {
    const p = parked('u1')
    expect(takeParked(p, undefined)).toEqual({ take: p, letGo: null })
  })

  it("is let go, not taken, when the pane is on another unit (another layout's pane of that id)", () => {
    const p = parked('u1')
    expect(takeParked(p, 'u2')).toEqual({ take: null, letGo: p })
  })

  it('takes nothing when nothing was parked', () => {
    expect(takeParked(null, 'u1')).toEqual({ take: null, letGo: null })
  })
})

/**
 * A pane that stays mounted while its state changes under it: a saved layout switched to has a
 * pane of the same id, so the widget is not mounted again - only its state's unit changes.
 */
describe("a pane's unit changed from outside", () => {
  it('is followed: the running session moves to the unit the pane now names', () => {
    expect(unitToFollow('u2', 'u1', true)).toBe('u2')
  })

  it('is not followed when it is the unit already running (TUNE wrote it back itself)', () => {
    expect(unitToFollow('u1', 'u1', true)).toBeNull()
  })

  it('waits while the session is not running, and for a pane that names no unit', () => {
    expect(unitToFollow('u2', 'u1', false)).toBeNull()
    expect(unitToFollow(undefined, 'u1', true)).toBeNull()
    expect(unitToFollow('u2', null, true)).toBeNull()
  })
})
