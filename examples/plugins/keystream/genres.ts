/**
 * The menu's shelves: every track, or the tracks of one genre. A song names its genre
 * (SongSource.genre) as well as its finer style word (HOUSE, J-POP); the genre is what the
 * menu's tabs file it under. The decisions are here; the menu only draws them.
 */

export const GENRES = ['classics', 'pop', 'dance', 'electro'] as const
export type Genre = (typeof GENRES)[number]

/** A tab of the menu: every track, or one genre's. */
export type Shelf = 'all' | Genre
export const SHELVES: readonly Shelf[] = ['all', ...GENRES]

export const isShelf = (value: unknown): value is Shelf => SHELVES.includes(value as Shelf)

/** The shelf before or after, round the tabs. */
export function stepShelf(shelf: Shelf, by: 1 | -1): Shelf {
  const at = SHELVES.indexOf(shelf)
  return SHELVES[(at + by + SHELVES.length) % SHELVES.length] ?? 'all'
}

/** The places in the track list that a shelf shows, in the list's order. */
export function onShelf(genres: readonly Genre[], shelf: Shelf): number[] {
  return genres.flatMap((genre, i) => (shelf === 'all' || genre === shelf ? [i] : []))
}

/**
 * The next row up or down a shelf, round it. `rows` is what the shelf shows - its tracks,
 * then FREE PLAY - and `selected` one of them, or anything else to start from the top.
 */
export function stepRow(rows: readonly number[], selected: number, by: 1 | -1): number {
  const at = rows.indexOf(selected)
  if (at < 0) return rows[0] ?? selected
  return rows[(at + by + rows.length) % rows.length] ?? selected
}

/** The choice kept where the new shelf shows it, else the shelf's first row. */
export function settle(rows: readonly number[], selected: number): number {
  return rows.includes(selected) ? selected : (rows[0] ?? selected)
}
