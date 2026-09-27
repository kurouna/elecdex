/**
 * Four beats to a bar in every song: the notation, the band and the chart all count in
 * fours. A module of its own, importing nothing, so the notation and the band (which read
 * each other) never need each other to know it - a cycle there left the band's step unset
 * whenever the notation happened to load first.
 */
export const BEATS_PER_BAR = 4
