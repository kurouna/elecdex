import { describe, expect, it } from 'vitest'
import { MIRROR, onceFor, person, rng, roundBy } from './elec16-elecfighter-support'

/**
 * ELECFIGHTER's ladder against the tests' person (design 3.1, 7.10), and that person's measure.
 * Apart from the one-button and spammer rounds so that vitest runs them side by side.
 */

describe('ELECFIGHTER the ladder against a person (design 3.1, 7.10)', { timeout: 120_000 }, () => {
  it('is easier at the first place than at ROOT for a person', () => {
    // The tests' person (support's `person`) took 97% of the rounds at place 0 and 25% at ROOT
    // over four slots and four clocks (2026-10-09; 94% and 25% after the third balance pass).
    // Here S1 BALANCE, four clocks each.
    const won = (at: number) =>
      [10, 11, 12, 13].filter((second, k) => roundBy(0, at, second, person(k + 1)) === 0).length
    const first = won(0)
    const root = won(MIRROR)
    expect(first).toBeGreaterThanOrEqual(3)
    expect(root).toBeLessThan(first)
    expect(root).toBeLessThanOrEqual(2)
  })
})

describe("the tests' person (design 3.1's measure)", () => {
  it('chains half the lights that strike: one draw a move, kept through its frames', () => {
    const r = rng(7)
    const d = { id: -1, on: false }
    let on = 0
    for (let id = 1; id <= 400; id++) {
      const first = onceFor(d, id, r, 0.5)
      for (let f = 0; f < 12; f++) expect(onceFor(d, id, r, 0.5)).toBe(first)
      if (first) on++
    }
    expect(on).toBeGreaterThan(160)
    expect(on).toBeLessThan(240)
  })
})
