import type { Tsunami } from '@shared/tsunami'
import { describe, expect, it } from 'vitest'
import { announcedCard, closeCard, followCard } from '../../src/renderer/lib/tsunami-card.js'

const tsunami = (fields: Partial<Tsunami> = {}): Tsunami => ({
  source: 'jma',
  eventId: 'ev',
  level: 'warning',
  issuedAt: 1,
  headline: null,
  areas: [],
  region: null,
  url: 'https://www.jma.go.jp/',
  ...fields,
})

describe('the tsunami card', () => {
  it('opens when announced, even if the last one was folded', () => {
    const folded = closeCard(announcedCard(tsunami()))
    expect(folded).toMatchObject({ folded: true, lifted: false })
    expect(announcedCard(tsunami({ level: 'major' }))).toMatchObject({
      folded: false,
      lifted: false,
    })
  })

  it('follows later readings and stays as the user left it', () => {
    const folded = closeCard(announcedCard(tsunami()))
    const next = followCard(folded, {
      source: 'jma',
      tsunami: tsunami({ level: 'major', issuedAt: 2 }),
    })
    expect(next).toEqual({
      card: { value: tsunami({ level: 'major', issuedAt: 2 }), lifted: false, folded: true },
      lifted: false,
    })
  })

  it('opens to say it was lifted, once, and then closing takes it away', () => {
    const card = closeCard(announcedCard(tsunami()))
    const lifted = followCard(card, { source: 'jma', tsunami: null })
    expect(lifted.lifted).toBe(true)
    expect(lifted.card).toMatchObject({ lifted: true, folded: false })
    // The next empty state changes nothing: the lifting is not announced twice.
    const again = followCard(lifted.card, { source: 'jma', tsunami: null })
    expect(again).toEqual({ card: lifted.card, lifted: false })
    expect(closeCard(lifted.card as NonNullable<typeof lifted.card>)).toBeNull()
  })

  it('comes back in effect if a new reading arrives after a lifting', () => {
    const lifted = followCard(announcedCard(tsunami()), { source: 'jma', tsunami: null }).card
    expect(followCard(lifted, { source: 'jma', tsunami: tsunami() }).card).toMatchObject({
      lifted: false,
    })
  })

  it('goes without claiming a lifting when the source is switched', () => {
    expect(followCard(announcedCard(tsunami()), { source: 'usgs', tsunami: null })).toEqual({
      card: null,
      lifted: false,
    })
    const noaa = announcedCard(tsunami({ source: 'noaa' }))
    expect(followCard(noaa, { source: 'jma', tsunami: null }).card).toBeNull()
    // NOAA goes with the world source.
    expect(followCard(noaa, { source: 'usgs', tsunami: null }).lifted).toBe(true)
  })

  it('does nothing without a card', () => {
    expect(followCard(null, { source: 'jma', tsunami: tsunami() })).toEqual({
      card: null,
      lifted: false,
    })
  })
})
