import { describe, expect, it } from 'vitest'
import { readForm, type Section } from '../../examples/plugins/keystream/arrange'
import { buildChart } from '../../examples/plugins/keystream/chart'
import { parseChord } from '../../examples/plugins/keystream/harmony'
import { barsIn, readSong } from '../../examples/plugins/keystream/notation'
import { previewSpan } from '../../examples/plugins/keystream/preview'
import { SONGS } from '../../examples/plugins/keystream/songs/index'

/**
 * KEYSTREAM's songs as data (examples/plugins/keystream/songs): written by hand - and now
 * and then by another hand - so what is easy to get wrong is held here song by song, with
 * the song named in each failure: the melody, the chords and the band's form the same
 * number of bars; every line of the band made of the characters its part reads (arrange.ts
 * drops the rest without a word); every section the form names defined, and every section
 * defined played; the preview inside the song, and on notes.
 */

/** What each part of a band's section reads; anything else in a line is silently ignored. */
const ALPHABET: Readonly<Record<string, RegExp>> = {
  kick: /^[xo.]{16}$/,
  snare: /^[xo.]{16}$/,
  clap: /^[xo.]{16}$/,
  hat: /^[xo.]{16}$/,
  openhat: /^[xo.]{16}$/,
  tom: /^[xo.]{16}$/,
  crash: /^[xo.]{16}$/,
  bass: /^[ro53.-]{16}$/,
  comp: /^[xo.-]{16}$/,
  arp: /^[x.-]{16}$/,
}

const chordBars = (lines: readonly string[]) =>
  lines.flatMap((line) => line.split('|')).filter((bar) => bar.trim() !== '')

describe.each(SONGS.map((song) => [song.id, song] as const))('%s', (_id, song) => {
  it('has as many bars of chords and of band as of melody', () => {
    const melody = barsIn(...song.melody)
    expect(melody).toBeGreaterThan(0)
    expect(chordBars(song.chords), 'bars of chords').toHaveLength(melody)
    expect(readForm(song.band).bars, 'bars of the band’s form').toHaveLength(melody)
    expect(readSong(song).bars).toBe(melody)
  })

  it('writes every chord so that it can be read', () => {
    for (const bar of chordBars(song.chords)) {
      for (const symbol of bar.trim().split(/\s+/)) {
        expect(parseChord(symbol), symbol).not.toBeNull()
      }
    }
  })

  it('writes each part of each section in the characters it reads, sixteen to a bar', () => {
    for (const [name, section] of Object.entries(song.band.sections)) {
      for (const [part, line] of Object.entries(section as Section)) {
        if (part === 'pad') {
          expect(typeof line, `${name}.pad`).toBe('boolean')
          continue
        }
        const alphabet = ALPHABET[part]
        expect(alphabet, `${name}.${part} is not a part`).toBeDefined()
        expect(line, `${name}.${part}`).toMatch(alphabet ?? /^$/)
      }
    }
  })

  it('plays every section it defines, and defines every section its form names', () => {
    const { problems } = readForm(song.band)
    expect(problems).toEqual([])
    const named = new Set(song.band.form.replace(/[|*!]/g, ' ').split(/\s+/).filter(Boolean))
    expect(new Set(Object.keys(song.band.sections))).toEqual(named)
  })

  it('previews a part inside the song that has notes in it', () => {
    const score = readSong(song)
    if (song.preview !== undefined) {
      expect(song.preview).toBeGreaterThanOrEqual(0)
      expect(song.preview).toBeLessThan(score.bars)
    }
    const chart = buildChart(score, 'normal')
    const span = previewSpan(chart)
    const heard = chart.notes.filter((n) => n.time >= span.from && n.time < span.to)
    expect(heard.length).toBeGreaterThan(8)
  })
})
