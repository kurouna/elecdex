/**
 * The shape LevelBars draws.
 *
 * In its own module because a Svelte component cannot export a type from its
 * instance script, and both the component and everything that builds bars for
 * it need this.
 */
export interface Bar {
  /** Height, 0 to 1 of the tallest. */
  value: number
  /** Colours the bar: the fastest lap, the slowest, the one still being measured. */
  mark?: 'best' | 'worst' | 'live'
}
