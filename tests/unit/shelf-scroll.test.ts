import { describe, expect, it } from 'vitest'
import { shelfScrollFor } from '../../src/renderer/layout/shelf-scroll.js'

const box = (scrollLeft: number, scrollWidth = 1000, clientWidth = 600) => ({
  scrollLeft,
  scrollWidth,
  clientWidth,
})
const wheel = (deltaY: number, deltaX = 0, deltaMode = 0) => ({ deltaX, deltaY, deltaMode })

describe('shelfScrollFor', () => {
  it('turns a vertical wheel into a sideways scroll', () => {
    expect(shelfScrollFor(wheel(100), box(0))).toBe(100)
    expect(shelfScrollFor(wheel(-100), box(200))).toBe(-100)
  })

  it('counts lines and pages as the wheel means them', () => {
    expect(shelfScrollFor(wheel(3, 0, 1), box(0))).toBe(48)
    expect(shelfScrollFor(wheel(1, 0, 2), box(0))).toBe(600)
  })

  it('leaves a sideways turn to the browser, which scrolls the shelf itself', () => {
    expect(shelfScrollFor(wheel(10, 40), box(0))).toBeNull()
  })

  it('leaves the wheel alone on a shelf that fits, and at either end', () => {
    expect(shelfScrollFor(wheel(100), box(0, 600, 600))).toBeNull()
    expect(shelfScrollFor(wheel(-100), box(0))).toBeNull()
    expect(shelfScrollFor(wheel(100), box(400))).toBeNull()
  })
})
