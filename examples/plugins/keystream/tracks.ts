import { buildChart, type Chart, type Level } from './chart'
import { starsOf } from './difficulty'
import { readSong, type Score } from './notation'
import { SONGS } from './songs/index'

/**
 * The tracks a pane offers: the songs that read without a problem, and their charts and
 * stars, each worked out once, the first time the menu or a play asks for it. The menu and
 * a play know a track by its place in this list; the place after the last is FREE PLAY.
 */
export class Tracks {
  readonly scores: readonly Score[]
  private readonly charts = new Map<string, Chart>()
  private readonly stars = new WeakMap<Chart, number>()

  /** `log` hears each song left out, and why. */
  constructor(log: (line: string) => void) {
    this.scores = SONGS.map(readSong).filter((score) => {
      if (score.problems.length > 0) log(`${score.source.id}: ${score.problems.join('; ')}`)
      return score.problems.length === 0
    })
  }

  /** How many tracks there are: also FREE PLAY's place, after them. */
  get count(): number {
    return this.scores.length
  }

  /** A track's id, or 'free' for FREE PLAY's place (and anything past it). */
  idOf(index: number): string {
    return this.scores[index]?.source.id ?? 'free'
  }

  /** A track's place by its id: FREE PLAY's for 'free', the first track's for one not here. */
  indexOf(id: string | undefined): number {
    if (id === 'free') return this.count
    return Math.max(
      0,
      this.scores.findIndex((s) => s.source.id === id),
    )
  }

  chartOf(index: number, level: Level): Chart | null {
    const score = this.scores[index]
    if (score === undefined) return null
    const key = `${score.source.id}:${level}`
    let chart = this.charts.get(key)
    if (chart === undefined) {
      chart = buildChart(score, level)
      this.charts.set(key, chart)
    }
    return chart
  }

  starsOf(chart: Chart): number {
    let stars = this.stars.get(chart)
    if (stars === undefined) {
      stars = starsOf(chart.notes)
      this.stars.set(chart, stars)
    }
    return stars
  }
}
