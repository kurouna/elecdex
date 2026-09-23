import type { QuakeSource } from '@shared/quakes'
import type { Tsunami } from '@shared/tsunami'

/**
 * The tsunami card of the alert banners, as state: which tsunami it shows,
 * whether it has been lifted, and whether the user folded it into a tab.
 * Pure, so the transitions are unit-tested apart from the component.
 */
export interface TsunamiCard {
  value: Tsunami
  lifted: boolean
  folded: boolean
}

/** The tsunami source that goes with an earthquake source. */
const TSUNAMI_SOURCE: Record<QuakeSource, Tsunami['source']> = { jma: 'jma', usgs: 'noaa' }

/** A newly announced tsunami: shown open, even if an earlier one was folded. */
export const announcedCard = (value: Tsunami): TsunamiCard => ({
  value,
  lifted: false,
  folded: false,
})

/**
 * The card after a new state from main.
 *
 *  - Still in effect: it shows the latest reading (areas and level change as
 *    reports come), folded or not as the user left it.
 *  - Gone from a source still in use: lifted - the card opens to say so, and
 *    `lifted` tells the caller to take it away after a while.
 *  - The source was switched: the tsunami was not lifted, it is simply no longer
 *    followed, so the card goes without claiming a lifting.
 */
export function followCard(
  card: TsunamiCard | null,
  state: { source: QuakeSource; tsunami: Tsunami | null },
): { card: TsunamiCard | null; lifted: boolean } {
  if (card === null) return { card, lifted: false }
  if (TSUNAMI_SOURCE[state.source] !== card.value.source) return { card: null, lifted: false }
  if (state.tsunami !== null) {
    return { card: { ...card, value: state.tsunami, lifted: false }, lifted: false }
  }
  if (card.lifted) return { card, lifted: false }
  return { card: { ...card, lifted: true, folded: false }, lifted: true }
}

/** Closing the card: a lifted one goes; one in effect folds into a tab. */
export const closeCard = (card: TsunamiCard): TsunamiCard | null =>
  card.lifted ? null : { ...card, folded: true }

/** How loud a tsunami is drawn, the same in the alert banner and the quakes pane. */
export const tsunamiTone = (value: Tsunami): 'severe' | 'moderate' =>
  value.level === 'major' || value.level === 'warning' ? 'severe' : 'moderate'
