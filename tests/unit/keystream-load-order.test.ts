import { expect, it } from 'vitest'

/**
 * KEYSTREAM's modules load in any order: the songs first here, as an e2e spec or a plugin
 * that lists them first would. The notation and the band once read each other's values at
 * load, and loading the notation first left the band's step unset (a TDZ error here, NaN
 * beats in the worker); meter.ts, which imports nothing, holds the one value they share.
 */
it('arranges a song whichever of its modules is loaded first', async () => {
  const { SONGS } = await import('../../examples/plugins/keystream/songs/index')
  const { readSong } = await import('../../examples/plugins/keystream/notation')
  const { arrange } = await import('../../examples/plugins/keystream/arrange')
  const song = SONGS[0]
  if (song === undefined) throw new Error('no songs')
  const parts = arrange(readSong(song))
  expect(parts.length).toBeGreaterThan(0)
  expect(parts.every((part) => Number.isFinite(part.beat))).toBe(true)
})
