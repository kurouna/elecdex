import type { Note, ViewContext, Voice } from '../elecdex-plugin'
import type { Settings } from './app'
import { LEVELS, type Level, openingBars } from './chart'
import type { Layout } from './draw/layout'
import { drawMenu, type LevelRow, type MenuList } from './draw/menu'
import { MenuMotion } from './draw/menu-motion'
import type { Paint } from './draw/paint'
import { isShelf, onShelf, SHELVES, type Shelf, settle, stepRow, stepShelf } from './genres'
import { labelOf } from './keyboard'
import { PreviewPlayer } from './preview'
import { bestOf, bestsOf } from './records'
import { wordsFor } from './text'
import type { Tracks } from './tracks'

/**
 * The menu: the genre tabs and their tracks, the levels' panel a chosen track opens, and the
 * preview of the track under the cursor. It holds the choice - track, level, tab - and what
 * the keys do to it; the view (app.ts) starts what is chosen and keeps it in the pane.
 */

/** What the menu keeps in the pane. */
export interface MenuSaved {
  /** A track's id, or 'free' for FREE PLAY. */
  song?: string
  level?: Level
  /** The menu's tab. */
  shelf?: Shelf
  /** Whether the menu plays the chosen track; on unless Space turned it off. */
  preview?: boolean
}

export type Cue = 'move' | 'switch' | 'choose'

/** The menu's small sounds, at a volume: a tick, a blip, and two rising for a start. */
const CUES: Readonly<Record<Cue, (v: number, now: number) => Note[]>> = {
  // A short breath of noise: the cursor sweeping past, not a click.
  move: (v) => [{ voice: 'openhat', length: 70, level: 0.08 * v }],
  switch: (v) => [{ voice: 'chip', pitch: 84, length: 45, level: 0.14 * v }],
  choose: (v, now) => [
    { voice: 'chip', pitch: 84, length: 50, level: 0.18 * v },
    { voice: 'chip', pitch: 96, at: now + 70, length: 110, level: 0.18 * v },
  ],
}

/** A small sound of the menu's - also the result's, as a key there is pressed. */
export function playCue(ctx: ViewContext<Settings, unknown>, kind: Cue, volume: number): void {
  if (volume === 0) return
  ctx.sound.play(CUES[kind](volume, performance.now()))
}

/** The tab a key asks for: the left arrow or < for the one before, the right or > after. */
function shelfFor(code: string, shelf: Shelf): Shelf | null {
  if (code === 'Comma' || code === 'ArrowLeft') return stepShelf(shelf, -1)
  if (code === 'Period' || code === 'ArrowRight') return stepShelf(shelf, 1)
  return null
}

/** The level a key moves to on the levels' panel: up or left easier, down or right harder. */
const LEVEL_STEP: Readonly<Record<string, 1 | -1>> = {
  ArrowUp: -1,
  ArrowLeft: -1,
  ArrowDown: 1,
  ArrowRight: 1,
}

/** What the menu needs of the view around it. */
export interface MenuHost {
  readonly ctx: ViewContext<Settings, unknown>
  readonly tracks: Tracks
  /** The sound's volume, 0 to 1. */
  volume(): number
  /** The voice the keys play, which the preview plays the melody on. */
  lead(): Voice
  /** The chosen row's blink is over: the track loads, or FREE PLAY opens. */
  start(now: number): void
}

/** What the menu draws beside the choice, which the view holds. */
export interface MenuExtras {
  instrument: { name: string; key: string }
  speed: number
}

export class MenuController {
  /** The chosen track by its place in the whole list; `tracks.count` is FREE PLAY. */
  selected = 0
  level: Level = 'normal'
  private readonly host: MenuHost
  /** Each tab's rows - its tracks by their place in the list, then FREE PLAY - and the tabs. */
  private readonly shelves: ReadonlyMap<Shelf, readonly number[]>
  private readonly tabs: readonly { name: string; count: number }[]
  /** The menu's tab, and the choice it had before the last change of tab. */
  private shelf: Shelf = 'all'
  private beforeSelected = 0
  private readonly motion = new MenuMotion()
  /** A row was chosen and blinks before it starts. */
  private starting = false
  /** Choosing a track, or its level on the panel opened over the list. */
  private stage: 'tracks' | 'levels' = 'tracks'
  /** The track under the cursor, heard once it rests there. */
  private readonly preview: PreviewPlayer
  private previewOn = true

  constructor(host: MenuHost, saved: MenuSaved) {
    this.host = host
    const { tracks, ctx } = host
    const genres = tracks.scores.map((score) => score.source.genre)
    this.shelves = new Map(
      SHELVES.map((shelf) => [shelf, [...onShelf(genres, shelf), tracks.count]]),
    )
    this.tabs = SHELVES.map((s) => ({ name: s.toUpperCase(), count: this.shelfRows(s).length - 1 }))
    this.preview = new PreviewPlayer({
      play: (notes) => ctx.sound.play(notes),
      stop: () => ctx.sound.stop(),
    })
    this.selected = tracks.indexOf(saved.song)
    if (saved.level !== undefined && LEVELS.includes(saved.level)) this.level = saved.level
    if (isShelf(saved.shelf)) this.shelf = saved.shelf
    if (saved.preview === false) this.previewOn = false
    this.selected = settle(this.shelfRows(this.shelf), this.selected)
  }

  saved(): Required<MenuSaved> {
    return {
      song: this.host.tracks.idOf(this.selected),
      level: this.level,
      shelf: this.shelf,
      preview: this.previewOn,
    }
  }

  /** FREE PLAY is the choice, rather than a track. */
  get free(): boolean {
    return this.selected >= this.host.tracks.count
  }

  /** The menu comes on, or back from a track: the next is chosen before its level, as at first. */
  shown(now: number): void {
    this.starting = false
    this.stage = 'tracks'
    this.motion.shown(now)
    this.preview.rest(now)
  }

  /** The keyboard came to the pane: the preview waits out its rest again. */
  focused(now: number): void {
    this.preview.rest(now)
  }

  /** The keyboard left, or the pane went out of sight: nobody is listening. */
  silence(): void {
    this.preview.stop()
  }

  /**
   * An instrument picked on the menu: it is heard - a rising chord - with the preview
   * starting over on it a moment later.
   */
  picked(at: number): void {
    if (this.starting) return
    this.preview.rest(at)
    const v = this.host.volume()
    if (v === 0) return
    const voice = this.host.lead()
    this.host.ctx.sound.play(
      [60, 64, 67, 72].map((pitch, i) => ({
        voice,
        pitch,
        at: at + i * 90,
        length: 280,
        level: 0.55 * v,
      })),
    )
  }

  /**
   * A key on the menu; answers whether it changed what the pane keeps. A key the menu has no
   * use for (a note played on the keyboard) changes nothing.
   */
  key(code: string, at: number): boolean {
    // A chosen row blinks before it starts; nothing else is taken meanwhile.
    if (this.starting) return false
    if (code === 'Space') return this.togglePreview(at)
    return this.stage === 'levels' ? this.levelsKey(code, at) : this.tracksKey(code, at)
  }

  /** Space on the menu, on either stage: the chosen track heard, or not; kept in the pane. */
  private togglePreview(at: number): true {
    this.previewOn = !this.previewOn
    if (this.previewOn) this.preview.rest(at)
    else this.preview.stop()
    this.cue('switch')
    return true
  }

  /** Choosing a track: up and down the rows, left and right the tabs, Enter its levels. */
  private tracksKey(code: string, at: number): boolean {
    const shelf = shelfFor(code, this.shelf)
    if (shelf !== null) return this.toShelf(shelf, at)
    if (code === 'ArrowUp' || code === 'ArrowDown') {
      this.moveRow(code === 'ArrowUp' ? -1 : 1, at)
      return true
    }
    if (code !== 'Enter') return false
    // FREE PLAY has no levels: it starts at once.
    if (this.free) this.choose(at)
    else this.openLevels(at)
    return true
  }

  /** Choosing its level: the arrows the level, Enter to start, Escape back to the tracks. */
  private levelsKey(code: string, at: number): boolean {
    const by = LEVEL_STEP[code]
    if (by !== undefined) return this.shiftLevel(by, at)
    if (code === 'Enter') this.choose(at)
    else if (code === 'Escape' || code === 'Backspace') this.closeLevels(at)
    else return false
    return true
  }

  private openLevels(at: number): void {
    this.stage = 'levels'
    this.motion.opened(at)
    this.cue('switch')
  }

  private closeLevels(at: number): void {
    this.stage = 'tracks'
    this.motion.closed(at)
    this.cue('switch')
  }

  /** The rows a tab shows: its tracks, by their place in the list, then FREE PLAY. */
  private shelfRows(shelf: Shelf): readonly number[] {
    return this.shelves.get(shelf) ?? [this.host.tracks.count]
  }

  /** Answers whether the tab changed. */
  private toShelf(shelf: Shelf, at: number): boolean {
    if (shelf === this.shelf) return false
    this.motion.tab(at, SHELVES.indexOf(this.shelf), this.shelf)
    this.beforeSelected = this.selected
    this.shelf = shelf
    this.selected = settle(this.shelfRows(shelf), this.selected)
    this.preview.rest(at)
    this.cue('switch')
    return true
  }

  private moveRow(by: 1 | -1, at: number): void {
    this.selected = stepRow(this.shelfRows(this.shelf), this.selected, by)
    this.motion.moved(at)
    this.preview.rest(at)
    this.cue('move')
  }

  /** Answers whether the level changed: at either end, a step further changes nothing. */
  private shiftLevel(by: number, at: number): boolean {
    const from = LEVELS.indexOf(this.level)
    this.level = LEVELS[Math.min(LEVELS.length - 1, Math.max(0, from + by))] ?? this.level
    if (LEVELS.indexOf(this.level) === from) return false
    this.motion.level(at)
    this.motion.panelLevel(at, from)
    this.cue('switch')
    return true
  }

  /** A row chosen: it blinks, and then the view starts it (frame). */
  private choose(at: number): void {
    this.preview.stop()
    this.cue('choose')
    if (this.host.ctx.theme.reducedMotion) {
      this.host.start(at)
      return
    }
    this.starting = true
    this.motion.chosen(at)
  }

  private cue(kind: Cue): void {
    playCue(this.host.ctx, kind, this.host.volume())
  }

  /** A frame on the menu: a chosen row's blink ends in its start, and the preview goes on. */
  frame(now: number): void {
    if (this.starting && this.motion.blinked(now)) {
      this.starting = false
      this.host.start(now)
      return
    }
    this.previewTick(now, true)
  }

  /** The chosen track, heard on the menu while the pane has the keys and sound is on. */
  previewTick(now: number, onMenu: boolean): void {
    const { ctx, tracks } = this.host
    const volume = this.host.volume()
    const track = this.free ? null : this.selected
    const listening = onMenu && this.previewOn && !this.starting && ctx.keys.focused && volume > 0
    const chart = listening && track !== null ? tracks.chartOf(track, 'normal') : null
    const chosen = chart === null || track === null ? null : { index: track, chart }
    this.preview.tick(now, chosen, { lead: this.host.lead(), volume })
  }

  /** Whether the menu still moves: a blink, its motion, or a preview waiting to be heard. */
  moving(now: number): boolean {
    const track = this.free ? null : this.selected
    return (
      this.starting ||
      this.motion.alive(now, this.host.ctx.theme.reducedMotion) ||
      (this.previewOn && this.preview.waiting(now, track))
    )
  }

  draw(p: Paint, l: Layout, now: number, extras: MenuExtras): void {
    const { ctx, tracks } = this.host
    const labels = ctx.keys.labels
    const chosen = tracks.chartOf(this.selected, this.level)
    const opening = chosen
      ? openingBars(chosen, 4).map((bar) => bar.map((code) => labelOf(labels, code)))
      : []
    const words = wordsFor(ctx.locale)
    const frame = this.motion.frame(now, ctx.theme.reducedMotion)
    const drawn = drawMenu(
      p,
      l,
      {
        stage: this.stage,
        levels: this.levelRows(),
        instrument: extras.instrument,
        list: this.menuList(this.shelf, this.selected),
        before: frame.tab ? this.menuList(this.motion.before, this.beforeSelected) : null,
        tabs: this.tabs,
        tab: SHELVES.indexOf(this.shelf),
        level: this.level,
        speed: extras.speed,
        note: words.layout,
        opening,
        free: words.free,
        previewing: this.preview.index !== null && this.preview.index === this.selected,
        preview: this.previewOn,
      },
      frame,
    )
    this.motion.remember(drawn)
  }

  /** A tab's rows as the menu draws them, with `chosen` - a place in the whole list - picked. */
  private menuList(shelf: Shelf, chosen: number): MenuList {
    const { tracks } = this.host
    const places = this.shelfRows(shelf).slice(0, -1)
    const rows = places.flatMap((i) => {
      const chart = tracks.chartOf(i, this.level)
      if (chart === null) return []
      const bests = bestsOf(chart.song.id)
      return [{ chart, bests, number: i + 1, stars: tracks.starsOf(chart) }]
    })
    const selected = chosen === tracks.count ? rows.length : places.indexOf(chosen)
    return { rows, selected: Math.max(0, selected) }
  }

  /** The chosen track's levels, as its panel lists them; null on FREE PLAY. */
  private levelRows(): LevelRow[] | null {
    if (this.free) return null
    const { ctx, tracks } = this.host
    const words = wordsFor(ctx.locale)
    return LEVELS.flatMap((level) => {
      const chart = tracks.chartOf(this.selected, level)
      if (chart === null) return []
      return [
        {
          level,
          stars: tracks.starsOf(chart),
          notes: chart.notes.length,
          best: bestOf(chart.song.id, level),
          note: words.levels[level],
        },
      ]
    })
  }
}
