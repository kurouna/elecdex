import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubElecdex } from './support/elecdex.ts'

/**
 * The page's record of article pictures (widgets/rss/feed-images.ts). A picture is asked of main
 * once however many cards show it; a picture main could not give is not kept, so the next draw
 * asks again and main's own retry (IMAGE_RETRY_MS for a passing failure) is what decides. Kept,
 * a picture missed while offline stayed missing in the page for its life (found in review).
 */

let answers: Array<string | null | Error>
let asked: string[]

beforeEach(() => {
  vi.resetModules()
  answers = []
  asked = []
  stubElecdex({
    feeds: {
      image: async (url: string) => {
        asked.push(url)
        const answer = answers.shift() ?? null
        if (answer instanceof Error) throw answer
        return answer
      },
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const load = async () => (await import('../../src/renderer/widgets/rss/feed-images.ts')).feedImage

describe('feedImage', () => {
  it('asks main once for a picture it has, however many ask', async () => {
    const feedImage = await load()
    answers = ['data:image/jpeg;base64,AA']
    const [a, b] = await Promise.all([
      feedImage('https://x.test/1.jpg'),
      feedImage('https://x.test/1.jpg'),
    ])
    expect(a).toBe('data:image/jpeg;base64,AA')
    expect(b).toBe(a)
    expect(await feedImage('https://x.test/1.jpg')).toBe(a)
    expect(asked).toEqual(['https://x.test/1.jpg'])
  })

  it('asks again for a picture main did not give, and keeps it once it comes', async () => {
    const feedImage = await load()
    answers = [null, 'data:image/png;base64,BB']
    expect(await feedImage('https://x.test/2.png')).toBeNull()
    expect(await feedImage('https://x.test/2.png')).toBe('data:image/png;base64,BB')
    expect(await feedImage('https://x.test/2.png')).toBe('data:image/png;base64,BB')
    expect(asked).toHaveLength(2)
  })

  it('asks again after a failed call to main too', async () => {
    const feedImage = await load()
    answers = [new Error('gone'), 'data:image/png;base64,CC']
    expect(await feedImage('https://x.test/3.png')).toBeNull()
    expect(await feedImage('https://x.test/3.png')).toBe('data:image/png;base64,CC')
    expect(asked).toHaveLength(2)
  })
})
