import { readFileSync } from 'node:fs'
import { readTle } from '@shared/orbits'
import { describe, expect, it } from 'vitest'
import { StarlinkField } from '../../src/renderer/widgets/orbit/starlink.js'

/**
 * The Starlink cloud, placed a slice a second. Built on the page's own thread
 * after a worker proved impossible in development (the page's CSP admits only
 * blob workers, and one cannot import modules there): the dots were missing.
 */

const elements = readTle(readFileSync('tests/fixtures/orbits/starlink-60.tle', 'utf8')) ?? []
const AT = Date.UTC(2026, 8, 23, 3, 0, 0)

describe('the Starlink field', () => {
  it('places a slice at a time and comes round to every satellite', () => {
    const field = new StarlinkField(elements)
    expect(field.size).toBe(60)
    expect(field.placed()).toBe(0)
    field.step(AT, 25)
    expect(field.placed()).toBe(25)
    field.step(AT + 1000, 25)
    field.step(AT + 2000, 25)
    expect(field.placed()).toBe(60)
    const lat = field.positions[0] ?? 0
    expect(Math.abs(lat)).toBeLessThanOrEqual(54)
  })

  it('makes each SGP4 record once, when first placed', () => {
    const field = new StarlinkField(elements)
    field.step(AT, 10)
    const first = field.record(3)
    field.step(AT + 1000, 60)
    expect(field.record(3)).toBe(first)
  })

  it('leaves out a satellite whose lines SGP4 cannot use, and keeps the rest in place', () => {
    const broken = elements.map((e, i) =>
      i === 1 && e.tle
        ? { ...e, tle: [e.tle[0].replace(/\d{8}$/, '99999999'), e.tle[1]] as [string, string] }
        : e,
    )
    const field = new StarlinkField(broken)
    field.step(AT, 60)
    expect(field.names[2]).toBe(elements[2]?.name)
    expect(Number.isNaN(field.positions[4] ?? Number.NaN)).toBe(false)
  })
})
