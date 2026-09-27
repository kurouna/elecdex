import type { SongSource } from '../notation'
import { song as bootSequence } from './boot-sequence'
import { song as galopInfernal } from './galop-infernal'
import { song as mountainKing } from './mountain-king'
import { song as packetStorm } from './packet-storm'

/**
 * The tracks, easiest first. Two are elecdex's own; two are tunes in the public domain in
 * arrangements of elecdex's own. A new song is a file here and a line in this list.
 */
export const SONGS: readonly SongSource[] = [bootSequence, galopInfernal, mountainKing, packetStorm]
