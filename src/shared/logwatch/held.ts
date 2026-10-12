import type { LogItem } from './types.js'

/**
 * How much of a log is held - by main for each file and encoding, and by the page's feed - and
 * what goes first when there is too much (docs/logwatch.md §4). One rule for both sides, so what
 * the page shows is what main would send it again.
 *
 * Two bounds: the lines kept (the setting), and the characters held. The count alone is no bound
 * on memory: a line keeps up to 8,000 characters of text, its raw form and 200 continuation lines
 * of up to 4,000 each.
 */

/** Characters of text, raw lines and continuation lines held for one file in one encoding. */
export const HELD_CHARS = 24_000_000

/** An item's characters, as they count against `HELD_CHARS`. */
export function charsOf(item: LogItem): number {
  if (item.kind === 'mark') return 64
  let n = item.text.length + item.raw.length + item.source.length
  for (const line of item.more) n += line.length
  for (const [key, value] of item.fields) n += key.length + value.length
  return n
}

/**
 * Drops the oldest items until `items` (holding `chars` characters) is within both bounds, and
 * answers the characters left. A banner of what came while hidden that has come to be the oldest
 * stays while lines it sums up are still held - what it sums up is often more than the lines
 * kept, and without it they would seem to have come while watched - and goes with the last of
 * them. Two splices at most, however many go.
 */
export function trimHeld(items: LogItem[], keep: number, chars: number): number {
  let held = chars
  const over = (gone: number): boolean => items.length - gone > keep || held > HELD_CHARS
  const banner = items[0]
  if (banner?.kind === 'mark' && banner.mark === 'away') {
    let gone = 0
    for (let i = 1; over(gone) && i < items.length; i++) {
      const item = items[i]
      if (item === undefined || item.seq > banner.until) break
      held -= charsOf(item)
      gone++
    }
    if (gone > 0) {
      items.splice(1, gone)
      // The last of its lines gone, it goes with them.
      const after = items[1]
      if (after === undefined || after.seq > banner.until) {
        items.splice(0, 1)
        held -= charsOf(banner)
      }
    }
  }
  let gone = 0
  while (over(gone) && gone < items.length) {
    const item = items[gone]
    if (item !== undefined) held -= charsOf(item)
    gone++
  }
  if (gone > 0) items.splice(0, gone)
  return held
}
