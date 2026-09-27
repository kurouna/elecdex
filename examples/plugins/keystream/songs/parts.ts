/**
 * Bars the bands have in common, sixteen sixteenths each (arrange.ts reads them), so a song's
 * band reads as what it plays: KICK_4 under the verse, BASS_OOM in the galop.
 */

/** A kick on every beat: four on the floor, the pulse a player can always find. */
export const KICK_4 = 'x...x...x...x...'
export const KICK_4_SOFT = 'o...o...o...o...'
export const KICK_13 = 'x.......x.......'
export const KICK_13_SOFT = 'o.......o.......'
/** Eight-beat rock: the kick on one and three, and again on the 'and' of three. */
export const KICK_ROCK = 'x.......x.x.....'
/** An 808's pattern: one, the 'and' of two, three - the downbeat always there to find. */
export const KICK_SYNC = 'x.....x...x.....'
/** Three, three and two sixteenths, twice: a dance break's hits, a drop's stabs. */
export const RIFF_332 = 'x..x..x.x..x..x.'
/** Drum and bass: the second kick pushed to the 'and' of three. */
export const KICK_BROKEN = 'x.........x.....'
export const SNARE_24 = '....x.......x...'
export const SNARE_24_SOFT = '....o.......o...'
/** Half time: the backbeat on three alone. */
export const CLAP_3 = '........x.......'
/** Every beat: a snare building up, a hat counting out a half-time bar. */
export const QUARTERS = 'x...x...x...x...'
/** The 'and' of every beat: an open hat, a 'pah', a house bass. */
export const OFFBEATS = '..x...x...x...x.'
export const OFFBEATS_SOFT = '..o...o...o...o.'
export const EIGHTHS = 'x.x.x.x.x.x.x.x.'
export const EIGHTHS_SOFT = 'o.o.o.o.o.o.o.o.'
export const SIXTEENTHS = 'xoxoxoxoxoxoxoxo'
/** A hit on the first beat only: a last chord, a cymbal. */
export const ONE = 'x...............'

export const BASS_4 = 'r...r...r...r...'
export const BASS_8 = 'r.r.r.r.r.r.r.r.'
/** Root and octave in eighths: disco and eurobeat. */
export const BASS_OCTAVES = 'r.o.r.o.r.o.r.o.'
/** Root and fifth on the beats: oom-pah. */
export const BASS_OOM = 'r...5...r...5...'
export const BASS_LONG = 'r-------r-------'
export const BASS_LAST = 'r-------........'
/** An 808 held under the kick it follows. */
export const BASS_808 = 'r-----r---r-----'
/** Between the kicks, on every 'and': the bass of a big-room drop. */
export const BASS_OFFBEATS = '..r...r...r...r.'

export const COMP_OFFBEATS = '..x...x...x...x.'
export const COMP_24 = '....x.......x...'
/** A piano's chord on one and three, held. */
export const COMP_HALVES = 'x-------x-------'
export const COMP_EIGHTHS = 'x.x.x.x.x.x.x.x.'
export const ARP_EIGHTHS = 'x.x.x.x.x.x.x.x.'
/** Chord pushes, a sixteenth ahead of the beat: house and funk. */
export const COMP_PUSH = 'x..x..x...x..x..'
export const COMP_LAST = 'x-------........'

/** A section name `count` times, for a form. */
export const times = (name: string, count: number): string => Array(count).fill(name).join(' ')
