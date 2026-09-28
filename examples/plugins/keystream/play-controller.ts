import type { KeyPress, ViewContext, Voice } from '../elecdex-plugin'
import type { Settings } from './app'
import { barAt, type Chart } from './chart'
import { drawLanes, drawNotes, type FieldView, leadTime } from './draw/field'
import type { Effects } from './draw/fx'
import { drawHud } from './draw/hud'
import type { Layout } from './draw/layout'
import { countWord, drawCount, drawLoading, drawPause, LOAD_MS } from './draw/overlays'
import type { Paint } from './draw/paint'
import { drawPanels, type LogLine } from './draw/panels'
import { RANK_AT, RECORD_AT, type ResultView } from './draw/result'
import { fanfare } from './fanfare'
import { rankOf, scoreOf } from './judge'
import { keyOf, labelOf } from './keyboard'
import { bestOf, submit } from './records'
import { nextWindow, notesBetween } from './schedule'
import { type Outcome, Session } from './session'

/**
 * A track played: its boot log, the count, the song with the band sent to the host a window
 * at a time, the keys judged against it, a pause and the count back from one, and the result
 * it ends on. It starts at `load` and is over when `frame` answers the result; the view
 * (app.ts) holds which screen is up.
 */

const RESUME_MS = 1500
/** Notes to a sound.play: under the host's limit of 4096, which a window stays well within. */
const CHUNK = 4000

/** What a key in a play asks of the view, beyond what the play does itself. */
export type PlayAsk = 'menu' | 'retry' | 'changed' | null

/** What a play needs of the view around it. */
export interface PlayHost {
  readonly ctx: ViewContext<Settings, unknown>
  /** The keys' lights and the words and bursts of a hit, which the view draws on every screen. */
  readonly fx: Effects
  /** The sound's volume, 0 to 1. */
  volume(): number
  /** The voice the keys play, which the guide melody plays on. */
  lead(): Voice
}

export class PlayController {
  /** How fast the notes fall, 1 to 10: the arrows change it while a track plays. */
  speed = 5
  private readonly host: PlayHost
  /** The track loaded, by its place in the list, and its chart at the level chosen. */
  private index = 0
  private chart: Chart | null = null
  /** The song under way; null while the boot log runs. */
  private session: Session | null = null
  /** When the track was loaded: the boot log runs from it. */
  private loadAt = 0
  private resumeAt: number | null = null
  /** What was typed this play, for the log beside the field. */
  private log: LogLine[] = []
  /** The song time up to which what the game plays has been sent to the host. */
  private sentTo = Number.NEGATIVE_INFINITY
  /** Where the last frame laid the field out, for what a key lights between frames. */
  private layout: Layout | null = null

  constructor(host: PlayHost, speed: unknown) {
    this.host = host
    if (typeof speed === 'number') this.speed = Math.min(10, Math.max(1, speed))
  }

  /** The boot log is running: the song has not begun. */
  get loading(): boolean {
    return this.chart !== null && this.session === null
  }

  /** How long the loaded track's notes ring on a key; null with none loaded. */
  get keyLength(): number | null {
    return this.chart?.keyLength ?? null
  }

  /** A track chosen: the boot log runs, then the count, then the song. */
  load(index: number, chart: Chart, now: number): void {
    const { ctx } = this.host
    ctx.sound.stop()
    this.index = index
    this.chart = chart
    this.session = null
    this.resumeAt = null
    this.log = []
    this.loadAt = now
    // A tick for each line of the boot log.
    ctx.sound.play(
      [0, 1, 2, 3].map((i) => ({
        voice: 'hat',
        at: now + 180 + i * 230,
        level: 0.35 * this.host.volume(),
      })),
    )
  }

  /** The play is left: nothing loaded. */
  clear(): void {
    this.chart = null
    this.session = null
  }

  private begin(now: number): void {
    const { chart } = this
    if (chart === null) return
    const { ctx } = this.host
    this.session = new Session(chart, now - chart.start, ctx.settings.offset)
    // The keyboard left, or the pane went out of sight, while the track loaded: it waits,
    // paused before its count, rather than playing to no one.
    if (!ctx.keys.focused || !ctx.visible) this.session.pause(now)
    else this.schedule(this.session.songTime(now))
  }

  /** Sends what the game plays from a song time on, a window at a time (schedule.ts). */
  private schedule(from: number): void {
    this.sentTo = from
    this.topUp(from)
  }

  /** Sends the next window once the song has come near the end of what was sent. */
  private topUp(time: number): void {
    const session = this.session
    if (session === null || session.paused) return
    const to = nextWindow(time, this.sentTo)
    if (to === null) return
    const notes = notesBetween(session.chart, this.sentTo, to, {
      lead: this.host.lead(),
      volume: this.host.volume(),
      guide: this.host.ctx.settings.guide,
      heardAt: (songTime) => session.heardAt(songTime),
    })
    this.sentTo = to
    const { sound } = this.host.ctx
    for (let i = 0; i < notes.length; i += CHUNK) sound.play(notes.slice(i, i + CHUNK))
  }

  pause(now: number): void {
    const session = this.session
    if (session === null || session.paused) return
    session.pause(now)
    this.resumeAt = null
    this.host.ctx.sound.stop()
  }

  private resume(now: number): void {
    const session = this.session
    if (session === null || !this.host.ctx.keys.focused) return
    // Paused before the song began: the count-in is the countdown, taken from its start
    // again, rather than a count before a count.
    const before = session.songTime(now) < 0
    const from = before
      ? session.resume(now, 0, session.chart.start)
      : session.resume(now, RESUME_MS)
    this.resumeAt = before ? null : now
    this.schedule(from)
  }

  /** A key pressed in a play: what it asks of the view, beyond what the play did with it. */
  key(key: KeyPress): PlayAsk {
    const session = this.session
    if (session === null) return key.code === 'Escape' ? 'menu' : null
    if (session.paused) return this.pausedKey(key.code, key.at)
    if (key.code === 'Escape' || key.code === 'Space') this.pause(key.at)
    else if (key.code === 'ArrowUp' || key.code === 'ArrowDown') {
      this.speed = Math.min(10, Math.max(1, this.speed + (key.code === 'ArrowUp' ? 1 : -1)))
      return 'changed'
    } else if (keyOf(key.code)?.pitch != null) {
      const outcome = session.press(key.code, key.at)
      if (outcome !== null) this.show(outcome, key.at)
    }
    return null
  }

  private pausedKey(code: string, at: number): PlayAsk {
    if (code === 'Escape' || code === 'Space' || code === 'Enter') this.resume(at)
    else if (code === 'KeyR') return 'retry'
    else if (code === 'KeyQ') return 'menu'
    return null
  }

  /**
   * A frame of the play: the song begins once the boot log has run, the band is topped up,
   * what the passing song dropped is shown - and answers the result when the song is over.
   */
  frame(now: number): ResultView | null {
    if (this.loading && now - this.loadAt >= LOAD_MS) this.begin(now)
    const session = this.session
    if (session === null) return null
    this.topUp(session.shownTime(now))
    for (const outcome of session.advance(now)) this.show(outcome, now)
    return session.over(now) ? this.finish(now) : null
  }

  /** Whether the play still moves: the boot log, or the song while it is not paused. */
  moving(): boolean {
    return this.loading || !(this.session?.paused ?? true)
  }

  /** The song is heard going on: neither loading nor paused. */
  get running(): boolean {
    return this.session !== null && !this.session.paused
  }

  private finish(now: number): ResultView {
    const session = this.session as Session
    const { ctx } = this.host
    const volume = this.host.volume()
    const tally = session.tally
    const score = scoreOf(tally)
    const rank = rankOf(score)
    const { song, level } = session.chart
    const previous = bestOf(song.id, level)?.score ?? null
    const newRecord =
      !tally.failed &&
      submit(song.id, level, {
        score,
        rank,
        maxChain: tally.maxChain,
        fullChain: tally.counts.DROP === 0,
      })
    if (!tally.failed) {
      const when = { rank: now + RANK_AT, record: now + RECORD_AT }
      ctx.sound.play(fanfare(rank, newRecord, when, volume))
    } else {
      // The link goes down: the band stops, a cymbal and a low drum.
      ctx.sound.stop()
      ctx.sound.play([
        { voice: 'crash', level: 0.5 * volume },
        { voice: 'tom', pitch: 31, level: 0.8 * volume },
      ])
    }
    return {
      chart: session.chart,
      index: this.index,
      tally,
      score,
      rank,
      newRecord,
      failed: tally.failed,
      previous,
      offset: ctx.settings.offset,
    }
  }

  /** What a key or the passing song did, lit where it happened. */
  private show(outcome: Outcome, now: number): void {
    this.remember(outcome)
    const { fx, ctx } = this.host
    const l = this.layout
    const reduced = ctx.theme.reducedMotion
    if (outcome.kind === 'stray') {
      fx.mark(outcome.code, 'stray', now)
      return
    }
    const key = keyOf(outcome.note.code)
    if (key === undefined || l === null) return
    if (outcome.kind === 'drop') {
      fx.drop(l.keyX(key), now, l, reduced)
      fx.mark(key.code, 'drop', now)
      return
    }
    fx.hit(l.keyX(key), l.line, outcome.grade, outcome.delta, now, l, reduced)
    fx.mark(key.code, 'hit', now)
    const chain = this.session?.tally.chain ?? 0
    if (chain > 0 && chain % 50 === 0) fx.milestone(now, reduced)
  }

  private remember(outcome: Outcome): void {
    const code = outcome.kind === 'stray' ? outcome.code : outcome.note.code
    const label = labelOf(this.host.ctx.keys.labels, code)
    const line: LogLine =
      outcome.kind === 'hit'
        ? { label, grade: outcome.grade, delta: outcome.delta }
        : { label, grade: outcome.kind === 'drop' ? 'DROP' : 'STRAY', delta: null }
    this.log = [...this.log.slice(-59), line]
  }

  /**
   * Draws the play. `shown` is the moment the frame is seen: the field stands where the song
   * is then; the effects run on `now`.
   */
  draw(p: Paint, l: Layout, now: number, shown: number, instrument: string): void {
    this.layout = l
    const chart = this.chart
    if (chart === null) return
    const { ctx, fx } = this.host
    const session = this.session
    drawHud(p, l, {
      chart,
      index: this.index,
      tally: session?.tally ?? null,
      speed: this.speed,
      instrument,
    })
    const time = session?.shownTime(shown) ?? chart.start
    const labels = ctx.keys.labels
    const field: FieldView = {
      chart,
      time,
      lead: leadTime(this.speed),
      state: (i) => session?.stateOf(i) ?? 'live',
      droppedAt: (i) => session?.droppedAt(i),
      labels,
    }
    drawLanes(p, l, field)
    drawPanels(p, l, {
      log: this.log,
      queue: (session?.next(24) ?? chart.notes.slice(0, 24)).map((n) => labelOf(labels, n.code)),
      time,
      duration: chart.duration,
      bar: barAt(chart, time),
      bars: chart.bars,
    })
    // The words stand behind the notes, which must never be hidden; while paused, neither moves.
    if (!session?.paused) fx.drawWords(p, l, now, session?.tally.chain ?? 0)
    drawNotes(p, l, field)
    if (!session?.paused) fx.draw(p, l, now)
    if (session === null) drawLoading(p, l, chart, this.index, now - this.loadAt)
    else if (session.paused) drawPause(p, l, labels)
    else this.drawCounts(p, l, shown, session, chart)
  }

  /** The count-in before the song, and the count before a paused song goes on. */
  private drawCounts(p: Paint, l: Layout, shown: number, session: Session, chart: Chart): void {
    if (this.resumeAt !== null && shown - this.resumeAt < RESUME_MS) {
      const left = RESUME_MS - (shown - this.resumeAt)
      drawCount(p, l, String(Math.ceil(left / 500)), 500 - (left % 500))
      return
    }
    const count = countWord(session.songTime(shown), -chart.clock.time(-1))
    if (count !== null) drawCount(p, l, count.word, count.age)
  }
}
