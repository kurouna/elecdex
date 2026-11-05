import { describe, expect, it } from 'vitest'
import { CHRF_WARN, chrF } from '../../src/shared/translate/chrf'
import { applyBlockPatch, type BlockView, mergeTripPatch } from '../../src/shared/translate/run'

/** ROUND TRIP's score and how a round trip travels in patches (docs/translate.md §6.4). */

describe('chrF', () => {
  it('is 100 for the same text, white space aside, and low for an unrelated one', () => {
    expect(chrF('The pane is here.', 'The pane is here.')).toBe(100)
    expect(chrF('The pane is here.', 'The  pane   is here.')).toBe(100)
    expect(chrF('The pane is here.', 'Completely different words.')).toBeLessThan(CHRF_WARN)
  })

  it('weighs what of the source came back over what was added', () => {
    const missing = chrF('The metrics collector runs apart.', 'The metrics collector')
    const added = chrF('The metrics collector', 'The metrics collector runs apart.')
    expect(missing).toBeLessThan(added)
  })

  it('works on text without spaces, as Japanese', () => {
    expect(chrF('ペインは右にある', 'ペインは右にある')).toBe(100)
    expect(chrF('ペインは右にある', 'ペインは左にある')).toBeGreaterThan(30)
    expect(chrF('', '')).toBe(100)
    expect(chrF('あ', '')).toBe(0)
  })
})

describe('round trip patches', () => {
  const block: BlockView = {
    index: 0,
    lead: '',
    source: 'Hi.',
    text: 'やあ。',
    state: 'done',
    note: null,
    tokens: null,
    ms: null,
    history: 0,
    terms: 0,
    edited: false,
    trip: null,
  }

  it('builds a round trip from its patches, and null takes it away', () => {
    let b = applyBlockPatch(block, { index: 0, trip: { text: '', state: 'queued', score: null } })
    b = applyBlockPatch(b, { index: 0, trip: { state: 'running' } })
    b = applyBlockPatch(b, { index: 0, trip: { append: 'Hi' } })
    b = applyBlockPatch(b, { index: 0, trip: { append: '.', state: 'done', score: 100 } })
    expect(b.trip).toEqual({ text: 'Hi.', state: 'done', score: 100 })
    expect(applyBlockPatch(b, { index: 0, trip: null }).trip).toBeNull()
  })

  it('merges two patches as one, a whole text dropping what came before it', () => {
    expect(mergeTripPatch({ append: 'a' }, { append: 'b', state: 'done' })).toEqual({
      append: 'ab',
      state: 'done',
    })
    expect(mergeTripPatch({ append: 'a' }, { text: '' })).toEqual({ text: '' })
    expect(mergeTripPatch({ append: 'a' }, null)).toBeNull()
    expect(mergeTripPatch(null, { append: 'c' })).toEqual({ append: 'c' })
  })
})
