import { describe, expect, it } from 'vitest'
import { demoCoverPixels } from '../../src/main/media/demo-art'
import { stubNowPlaying } from '../../src/main/media/stub'

describe("the demo tracks' covers", () => {
  it('are drawn square and opaque, each a picture of its own', () => {
    const sunset = demoCoverPixels('sunset', 32)
    const orbit = demoCoverPixels('orbit', 32)
    expect(sunset).toHaveLength(32 * 32 * 4)
    for (let i = 3; i < sunset.length; i += 4) expect(sunset[i]).toBe(255)
    expect(Buffer.from(sunset).equals(Buffer.from(orbit))).toBe(false)
  })

  it('reach the reader as the plate art and the card art, only in the demo', async () => {
    const covers = [{ small: '/9j/SMALL', large: '/9j/LARGE' }, null]
    const demo = await stubNowPlaying(true, () => 1000, covers).read()
    expect(demo.art).toMatchObject({ small: '/9j/SMALL', large: '/9j/LARGE' })
    const tests = await stubNowPlaying(false, () => 1000, covers).read()
    expect(tests.art).toBeNull()
  })
})
