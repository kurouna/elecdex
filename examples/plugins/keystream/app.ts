import type { KeyPress, Note, SettingValues, ViewContext, Voice } from '../elecdex-plugin'
import { buildChart, type Chart, COUNT_IN_BEATS, LEVELS, type Level, openingBars } from './chart'
import { drawLanes, drawNotes, type FieldView, leadTime } from './draw/field'
import { drawFree } from './draw/free'
import { Effects } from './draw/fx'
import { drawHud } from './draw/hud'
import { drawKeyboard } from './draw/keys'
import { type Layout, layoutOf } from './draw/layout'
import { drawMenu } from './draw/menu'
import { drawConnect, drawCount, drawLoading, drawPause, LOAD_MS } from './draw/overlays'
import { type Paint, paintOf } from './draw/paint'
import { drawPanels, type LogLine } from './draw/panels'
import { drawResult, RANK_AT, RECORD_AT, REVEAL_MS, type ResultView } from './draw/result'
import { fanfare } from './fanfare'
import { FreePlay, type FreeSaved } from './free'
import { rankOf, scoreOf } from './judge'
import { keyOf, NOTE_KEYS } from './keyboard'
import { readSong, type Score } from './notation'
import { bestOf, submit } from './records'
import { loopLength, nextWindow, notesBetween } from './schedule'
import { type Outcome, Session } from './session'
import { SONGS } from './songs/index'
import { wordsFor } from './text'

/**
 * One pane of the game: the menu, a track loading, playing and paused, and its result - and
 * FREE mode (free.ts), the keyboard as an instrument, which the menu lists after the tracks.
 *
 * Everything is drawn on one canvas block. The view draws only while something moves - a
 * track playing, a word fading, a key's light going out - and stops the moment nothing
 * does, so a pane left on the menu costs nothing. The keys' own notes are bound to the host
 * (ctx.keys.play), so a key sounds the instant it goes down; the view only judges it.
 */

export interface Settings extends SettingValues {
  lead: string
  volume: number
  offset: number
  guide: boolean
}

type Phase = 'menu' | 'loading' | 'play' | 'result' | 'free'

interface Saved {
  /** A track's id, or 'free' for FREE PLAY. */
  song?: string
  level?: Level
  speed?: number
  free?: FreeSaved
}

const SURFACE = 'screen'
const LEADS: readonly Voice[] = ['epiano', 'piano', 'lead', 'chip']
const RESUME_MS = 1500
const MENU_KEY_LENGTH = 520
/** Notes to a sound.play: under the host's limit of 4096, which a window stays well within. */
const CHUNK = 4000

/** The bar a song time is in, from 1. */
function barAt(chart: Chart, time: number): number {
  let bar = 0
  for (const beat of chart.beats) {
    if (beat.time > time) break
    if (beat.bar && beat.time >= 0) bar += 1
  }
  return bar
}

export function startGame(ctx: ViewContext<Settings, unknown>): () => void {
  return new Game(ctx).start()
}

class Game {
  private readonly ctx: ViewContext<Settings, unknown>
  private readonly scores: Score[]
  private readonly charts = new Map<string, Chart>()
  private readonly fx = new Effects()
  private phase: Phase = 'menu'
  private selected = 0
  private level: Level = 'normal'
  private speed = 5
  private session: Session | null = null
  /** When the phase began: the boot log and the result reveal run from it. */
  private phaseAt = 0
  private resumeAt: number | null = null
  private result: ResultView | null = null
  private layout: Layout | null = null
  private stopFrames: (() => void) | null = null
  /** What was typed this play, for the log beside the field. */
  private log: LogLine[] = []
  /** The song time up to which what the game plays has been sent to the host. */
  private sentTo = Number.NEGATIVE_INFINITY
  private readonly free: FreePlay

  constructor(ctx: ViewContext<Settings, unknown>) {
    this.ctx = ctx
    this.scores = SONGS.map(readSong).filter((score) => {
      if (score.problems.length > 0) ctx.log(`${score.source.id}: ${score.problems.join('; ')}`)
      return score.problems.length === 0
    })
    this.free = new FreePlay(ctx, (index) => this.chartOf(index, 'normal'), this.scores.length)
    const saved = ctx.state.get<Saved>() ?? {}
    this.free.restore(saved.free)
    this.selected =
      saved.song === 'free'
        ? this.scores.length
        : Math.max(
            0,
            this.scores.findIndex((s) => s.source.id === saved.song),
          )
    if (saved.level !== undefined && LEVELS.includes(saved.level)) this.level = saved.level
    if (typeof saved.speed === 'number') this.speed = Math.min(10, Math.max(1, saved.speed))
  }

  start(): () => void {
    const { ctx } = this
    ctx.render([{ t: 'canvas', id: SURFACE }])
    const offs = [
      ctx.on('surface', () => this.wake()),
      ctx.on('theme', () => this.wake()),
      ctx.on('focus', () => this.onFocus()),
      ctx.on('visibility', () => {
        if (ctx.visible) return
        this.pause(performance.now())
        this.free.stopBacking()
      }),
      ctx.on('settings', () => {
        this.bindKeys()
        this.wake()
      }),
      ctx.on('key', (key) => this.onKey(key)),
    ]
    this.bindKeys()
    return () => {
      for (const off of offs) off()
      this.stopFrames?.()
      ctx.sound.stop()
    }
  }

  /*
   * Keys.
   */

  private onKey(key: KeyPress): void {
    if (keyOf(key.code)?.pitch != null) {
      if (key.down) this.fx.press(key.code, key.at)
      else this.fx.release(key.code, key.at)
    }
    // FREE mode plays keys as held, so it hears them come up too; elsewhere only a press acts.
    if (key.down || this.phase === 'free') this.act(key)
    this.wake()
  }

  private act(key: KeyPress): void {
    switch (this.phase) {
      case 'menu':
        this.menuKey(key.code, key.at)
        return
      case 'loading':
        if (key.code === 'Escape') this.toMenu()
        return
      case 'play':
        if (this.session?.paused) this.pausedKey(key.code, key.at)
        else this.playKey(key)
        return
      case 'result':
        if (key.code === 'Enter' || key.code === 'Escape') this.toMenu()
        else if (key.code === 'KeyR') this.load(key.at)
        return
      case 'free': {
        const done = this.free.key(key)
        if (done === 'leave') this.toMenu()
        else if (done === 'changed') this.save()
      }
    }
  }

  private menuKey(code: string, at: number): void {
    // The tracks, then FREE PLAY.
    const count = this.scores.length + 1
    if (code === 'ArrowUp') this.selected = (this.selected + count - 1) % count
    else if (code === 'ArrowDown') this.selected = (this.selected + 1) % count
    else if (code === 'ArrowLeft' || code === 'ArrowRight')
      this.shiftLevel(code === 'ArrowLeft' ? -1 : 1)
    else if (code === 'Enter' && this.selected === this.scores.length) this.enterFree()
    else if (code === 'Enter') this.load(at)
    else return
    this.save()
  }

  private enterFree(): void {
    this.ctx.sound.stop()
    this.session = null
    this.fx.clear()
    this.phase = 'free'
    this.free.enter()
  }

  private shiftLevel(by: number): void {
    const index = LEVELS.indexOf(this.level) + by
    this.level = LEVELS[Math.min(LEVELS.length - 1, Math.max(0, index))] ?? this.level
  }

  private playKey(key: KeyPress): void {
    const session = this.session
    if (session === null) return
    if (key.code === 'Escape' || key.code === 'Space') this.pause(key.at)
    else if (key.code === 'ArrowUp' || key.code === 'ArrowDown') {
      this.speed = Math.min(10, Math.max(1, this.speed + (key.code === 'ArrowUp' ? 1 : -1)))
      this.save()
    } else if (keyOf(key.code)?.pitch != null) {
      const outcome = session.press(key.code, key.at)
      if (outcome !== null) this.show(outcome, key.at)
    }
  }

  private pausedKey(code: string, at: number): void {
    if (code === 'Escape' || code === 'Space' || code === 'Enter') this.resume(at)
    else if (code === 'KeyR') this.load(at)
    else if (code === 'KeyQ') this.toMenu()
  }

  private onFocus(): void {
    if (!this.ctx.keys.focused) {
      this.pause(performance.now())
      // The band stops with the keyboard gone: nobody is playing over it.
      this.free.stopBacking()
    }
    this.wake()
  }

  /*
   * Play.
   */

  private chartOf(index: number, level: Level): Chart | null {
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

  private get chart(): Chart | null {
    return this.session?.chart ?? this.chartOf(this.selected, this.level)
  }

  /** A track chosen: the boot log runs, then the count, then the song. */
  private load(now: number): void {
    const chart = this.chartOf(this.selected, this.level)
    if (chart === null) return
    this.ctx.sound.stop()
    this.session = null
    this.result = null
    this.resumeAt = null
    this.fx.clear()
    this.log = []
    this.phase = 'loading'
    this.phaseAt = now
    this.bindKeys(chart.keyLength)
    // A tick for each line of the boot log.
    this.ctx.sound.play(
      [0, 1, 2, 3].map((i) => ({
        voice: 'hat',
        at: now + 180 + i * 230,
        level: 0.35 * this.volume,
      })),
    )
  }

  private begin(now: number): void {
    const chart = this.chart
    if (chart === null) return
    const countIn = -chart.clock.time(-COUNT_IN_BEATS)
    this.session = new Session(chart, now + countIn + 120, this.ctx.settings.offset)
    this.phase = 'play'
    // The keyboard left, or the pane went out of sight, while the track loaded: it waits,
    // paused before its count, rather than playing to no one.
    if (!this.ctx.keys.focused || !this.ctx.visible) this.session.pause(now)
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
      lead: this.lead,
      volume: this.volume,
      guide: this.ctx.settings.guide,
      heardAt: (songTime) => session.heardAt(songTime),
    })
    this.sentTo = to
    for (let i = 0; i < notes.length; i += CHUNK) this.ctx.sound.play(notes.slice(i, i + CHUNK))
  }

  private pause(now: number): void {
    const session = this.session
    if (this.phase !== 'play' || session === null || session.paused) return
    session.pause(now)
    this.resumeAt = null
    this.ctx.sound.stop()
    this.wake()
  }

  private resume(now: number): void {
    const session = this.session
    if (session === null || !this.ctx.keys.focused) return
    const from = session.resume(now, RESUME_MS)
    this.resumeAt = now
    this.schedule(from)
  }

  private toMenu(): void {
    if (this.phase === 'free') this.free.leave()
    this.ctx.sound.stop()
    this.session = null
    this.phase = 'menu'
    this.fx.clear()
    this.bindKeys()
  }

  private finish(now: number): void {
    const session = this.session
    if (session === null) return
    const tally = session.tally
    const score = scoreOf(tally)
    const rank = rankOf(score)
    const previous = bestOf(session.chart.song.id, session.chart.level)?.score ?? null
    const newRecord =
      !tally.failed &&
      submit(session.chart.song.id, session.chart.level, {
        score,
        rank,
        maxChain: tally.maxChain,
        fullChain: tally.counts.DROP === 0,
      })
    this.result = {
      chart: session.chart,
      index: this.selected,
      tally,
      score,
      rank,
      newRecord,
      failed: tally.failed,
      previous,
    }
    this.phase = 'result'
    this.phaseAt = now
    if (!tally.failed) {
      const when = { rank: now + RANK_AT, record: now + RECORD_AT }
      this.ctx.sound.play(fanfare(rank, newRecord, when, this.volume))
      return
    }
    // The link goes down: the band stops, a cymbal and a low drum.
    this.ctx.sound.stop()
    this.ctx.sound.play([
      { voice: 'crash', level: 0.5 * this.volume },
      { voice: 'tom', pitch: 31, level: 0.8 * this.volume },
    ])
  }

  /** What a key or the passing song did, lit where it happened. */
  private show(outcome: Outcome, now: number): void {
    this.remember(outcome)
    const l = this.layout
    const reduced = this.ctx.theme.reducedMotion
    if (outcome.kind === 'stray') {
      this.fx.mark(outcome.code, 'stray', now)
      return
    }
    const key = keyOf(outcome.note.code)
    if (key === undefined || l === null) return
    if (outcome.kind === 'drop') {
      this.fx.drop(l.keyX(key), now, l, reduced)
      this.fx.mark(key.code, 'drop', now)
      return
    }
    this.fx.hit(l.keyX(key), l.line, outcome.grade, outcome.delta, now, l, reduced)
    this.fx.mark(key.code, 'hit', now)
    const chain = this.session?.tally.chain ?? 0
    if (chain > 0 && chain % 50 === 0) this.fx.milestone(now, reduced)
  }

  private remember(outcome: Outcome): void {
    const code = outcome.kind === 'stray' ? outcome.code : outcome.note.code
    const label = this.ctx.keys.labels[code] ?? keyOf(code)?.char.toUpperCase() ?? '?'
    const line: LogLine =
      outcome.kind === 'hit'
        ? { label, grade: outcome.grade, delta: outcome.delta }
        : { label, grade: outcome.kind === 'drop' ? 'DROP' : 'STRAY', delta: null }
    this.log = [...this.log.slice(-59), line]
  }

  /*
   * Frames.
   */

  private wake(): void {
    this.stopFrames ??= this.ctx.animate((now) => this.frame(now))
  }

  private frame(now: number): void {
    if (this.phase === 'loading' && now - this.phaseAt >= LOAD_MS) this.begin(now)
    if (this.phase === 'free') this.free.frame(now)
    const session = this.session
    if (this.phase === 'play' && session !== null) {
      this.topUp(session.shownTime(now))
      for (const outcome of session.advance(now)) this.show(outcome, now)
      if (session.over(now)) this.finish(now)
    }
    this.draw(now)
    if (this.moving(now)) return
    this.stopFrames?.()
    this.stopFrames = null
  }

  private moving(now: number): boolean {
    if (this.phase === 'loading') return true
    if (this.phase === 'play') return !(this.session?.paused ?? true) || this.fx.alive(now)
    if (this.phase === 'result' && now - this.phaseAt < REVEAL_MS) return true
    if (this.phase === 'free' && this.free.moving()) return true
    return this.fx.alive(now)
  }

  private draw(now: number): void {
    const surface = this.ctx.surface(SURFACE)
    if (surface === null) return
    const p = paintOf(surface, this.ctx.theme)
    const l = layoutOf(surface.w, surface.h)
    this.layout = l
    p.g.clearRect(0, 0, p.w, p.h)
    const labels = this.ctx.keys.labels
    if (this.phase === 'menu') this.drawMenu(p, l)
    else if (this.phase === 'free') this.drawFree(p, l, now)
    else if (this.phase === 'result' && this.result !== null)
      drawResult(p, l, this.result, now - this.phaseAt, labels)
    else this.drawPlay(p, l, now)
    const shift = this.phase === 'free' ? this.free.octave * 12 : 0
    drawKeyboard(p, l, labels, (code) => this.fx.light(code, now), shift)
    const playing = this.phase === 'play' && !(this.session?.paused ?? true)
    if (!this.ctx.keys.focused && !playing) drawConnect(p, l, wordsFor(this.ctx.locale).connect)
  }

  private drawMenu(p: Paint, l: Layout): void {
    const rows = this.scores.flatMap((score, i) => {
      const chart = this.chartOf(i, this.level)
      return chart === null ? [] : [{ chart, best: bestOf(score.source.id, this.level) }]
    })
    const labels = this.ctx.keys.labels
    const chosen = rows[this.selected]?.chart
    const opening = chosen
      ? openingBars(chosen, 4).map((bar) => bar.map((code) => labels[code] ?? code))
      : []
    drawMenu(p, l, {
      rows,
      selected: this.selected,
      level: this.level,
      speed: this.speed,
      note: wordsFor(this.ctx.locale).layout,
      opening,
      free: wordsFor(this.ctx.locale).free,
    })
  }

  private drawFree(p: Paint, l: Layout, now: number): void {
    const free = this.free
    const chart = free.backing?.chart ?? null
    const loop = free.loopTime(now)
    // The line pulses with the band's beat when one plays; nothing falls in this mode.
    drawLanes(p, l, {
      chart,
      time: chart === null || loop === null ? 0 : loop % Math.max(1, loopLength(chart)),
      lead: leadTime(this.speed),
      state: () => 'live',
      droppedAt: () => undefined,
      labels: this.ctx.keys.labels,
      lines: false,
    })
    drawFree(
      p,
      l,
      {
        tone: free.toneName,
        octave: free.octave,
        pedal: free.pedal,
        backing: free.backing?.index ?? null,
        tracks: this.scores.map((s) => s.source.title),
        trails: free.trails,
        holding: free.holding,
        played: free.played,
      },
      now,
    )
  }

  private drawPlay(p: Paint, l: Layout, now: number): void {
    const chart = this.chart
    if (chart === null) return
    const session = this.session
    drawHud(p, l, { chart, index: this.selected, tally: session?.tally ?? null, speed: this.speed })
    const time = session?.shownTime(now) ?? chart.clock.time(-COUNT_IN_BEATS)
    const labels = this.ctx.keys.labels
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
      queue: (session?.next(24) ?? chart.notes.slice(0, 24)).map((n) => labels[n.code] ?? n.code),
      time,
      duration: chart.duration,
      bar: barAt(chart, time),
      bars: chart.beats.filter((b) => b.bar && b.time >= 0).length - 1,
    })
    // The words stand behind the notes, which must never be hidden; while paused, neither moves.
    if (!session?.paused) this.fx.drawWords(p, l, now, session?.tally.chain ?? 0)
    drawNotes(p, l, field)
    if (!session?.paused) this.fx.draw(p, l, now)
    if (this.phase === 'loading') drawLoading(p, l, chart, this.selected, now - this.phaseAt)
    else if (session?.paused) drawPause(p, l, this.ctx.keys.labels)
    else if (session !== null) this.drawCounts(p, l, now, session, chart)
  }

  /** The count-in before the song, and the count before a paused song goes on. */
  private drawCounts(p: Paint, l: Layout, now: number, session: Session, chart: Chart): void {
    if (this.resumeAt !== null && now - this.resumeAt < RESUME_MS) {
      const left = RESUME_MS - (now - this.resumeAt)
      drawCount(p, l, String(Math.ceil(left / 500)), 500 - (left % 500))
      return
    }
    const time = session.songTime(now)
    if (time >= 0) return
    const beat = -chart.clock.time(-1)
    const left = Math.ceil(-time / beat)
    drawCount(p, l, left <= 1 ? 'LINK' : String(left - 1), time + left * beat)
  }

  /*
   * Settings and state.
   */

  private get volume(): number {
    return Math.min(1, Math.max(0, this.ctx.settings.volume / 100))
  }

  private get lead(): Voice {
    const chosen = this.ctx.settings.lead as Voice
    return LEADS.includes(chosen) ? chosen : 'epiano'
  }

  /**
   * Every key's note, played by the host the instant the key goes down. The keyboard stays
   * an instrument on every screen - the menu, a pause, the result - on purpose: it is how the
   * notes are learnt, and a key there is never judged (the pause's own keys, R and Q, play
   * nothing). Only the moment it is bound in differs: a track's notes ring for about a beat.
   */
  private bindKeys(length = this.session?.chart.keyLength ?? MENU_KEY_LENGTH): void {
    if (this.phase === 'free') {
      this.free.bind()
      return
    }
    const note = (pitch: number): Note => ({
      voice: this.lead,
      pitch,
      length,
      level: 0.85 * this.volume,
    })
    this.ctx.keys.play(Object.fromEntries(NOTE_KEYS.map((k) => [k.code, note(k.pitch ?? 60)])))
  }

  private save(): void {
    const song = this.scores[this.selected]?.source.id ?? 'free'
    this.ctx.state.set({ song, level: this.level, speed: this.speed, free: this.free.saved() })
  }
}
