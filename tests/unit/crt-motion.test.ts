import { describe, expect, it } from 'vitest'
import { fadeShade, handoffDelay, powerOffStyle } from '../../src/renderer/lib/crt-motion.js'

/** A dialog's power-off, frame by frame, matching crt-power-off's keyframes. */
describe('powerOffStyle', () => {
  it('starts as the whole picture', () => {
    expect(powerOffStyle(0)).toBe('transform: scale(1, 1); filter: brightness(1); opacity: 1;')
  })

  it('is the bright line at 45%, the dot at 80%, and nothing at the end', () => {
    expect(powerOffStyle(0.45)).toBe(
      'transform: scale(1, 0.004); filter: brightness(4); opacity: 1;',
    )
    expect(powerOffStyle(0.8)).toBe(
      'transform: scale(0.02, 0.004); filter: brightness(6); opacity: 1;',
    )
    expect(powerOffStyle(1)).toBe('transform: scale(0, 0); filter: brightness(6); opacity: 0;')
  })

  it('squeezes before it shrinks, and fades only at the end', () => {
    const scale = (p: number) =>
      (/scale\(([\d.]+), ([\d.]+)\)/.exec(powerOffStyle(p)) ?? []).slice(1).map(Number)
    expect(scale(0.2)[0]).toBe(1)
    expect(scale(0.2)[1]).toBeLessThan(1)
    expect(scale(0.6)[1]).toBe(0.004)
    expect(scale(0.6)[0]).toBeLessThan(1)
    expect(powerOffStyle(0.79)).toContain('opacity: 1;')
    expect(powerOffStyle(0.9)).toMatch(/opacity: 0\.\d+;/)
  })

  it('keeps a transform the element already has in front of the scale', () => {
    expect(powerOffStyle(0.45, 'translate(0px, 80px)')).toBe(
      'transform: translate(0px, 80px) scale(1, 0.004); filter: brightness(4); opacity: 1;',
    )
  })

  it('holds its ends for progress outside 0 to 1', () => {
    expect(powerOffStyle(-1)).toBe(powerOffStyle(0))
    expect(powerOffStyle(2)).toBe(powerOffStyle(1))
  })
})

describe('fadeShade', () => {
  it('scales the alpha of a computed colour', () => {
    expect(fadeShade('rgba(0, 0, 0, 0.55)', 0.5)).toBe('rgba(0, 0, 0, 0.275)')
    expect(fadeShade('rgb(10, 20, 30)', 0.25)).toBe('rgba(10, 20, 30, 0.25)')
    expect(fadeShade('rgba(0, 0, 0, 0.55)', 0)).toBe('rgba(0, 0, 0, 0)')
  })
})

describe('handoffDelay', () => {
  // The old picture is the line at 135 ms; the new one shows its line 23 ms into its power-on.
  it('opens a dialog out of the line the closing one becomes', () => {
    expect(handoffDelay(0)).toBe(112)
    expect(handoffDelay(40)).toBe(72)
  })

  it('does not wait once that line has passed, or when nothing closed', () => {
    expect(handoffDelay(112)).toBe(0)
    expect(handoffDelay(500)).toBe(0)
    expect(handoffDelay(Number.POSITIVE_INFINITY)).toBe(0)
  })
})
