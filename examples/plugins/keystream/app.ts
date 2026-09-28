import type { KeyPress, Note, SettingValues, ViewContext, Voice } from '../elecdex-plugin'
import { drawLanes, leadTime } from './draw/field'
import { drawFree } from './draw/free'
import { Effects } from './draw/fx'
import { drawKeyboard } from './draw/keys'
import { type Layout, layoutOf } from './draw/layout'
import { drawConnect, drawInstrument, INSTRUMENT_MS } from './draw/overlays'
import { type Paint, paintOf } from './draw/paint'
import { drawResult, EXIT_MS, REVEAL_MS, type ResultView } from './draw/result'
import { FrameLead } from './frame-lead'
import { FreePlay, type FreeSaved, STRENGTHS } from './free'
import { INSTRUMENTS, instrumentOfKey, instrumentOfVoice, validInstrument } from './instruments'
import { keyOf, NOTE_KEYS } from './keyboard'
import { MenuController, type MenuSaved, playCue } from './menu-controller'
import { PlayController } from './play-controller'
import { loopLength } from './schedule'
import { wordsFor } from './text'
import { Tracks } from './tracks'

/**
 * One pane of the game: the menu (menu-controller.ts), a track loading, playing and paused
 * (play-controller.ts), and its result - and FREE mode (free.ts), the keyboard as an
 * instrument, which the menu lists after the tracks. This holds which screen is up, sends
 * the keys to it, and draws it.
 *
 * Everything is drawn on one canvas block. The view draws only while something moves - a
 * track playing, a word fading, a key's light going out - and stops the moment nothing
 * does, so a pane left on the menu costs nothing. The keys' own notes are bound to the host
 * (ctx.keys.play), so a key sounds the instant it goes down; the view only judges it.
 */

export interface Settings extends SettingValues {
  volume: number
  offset: number
  guide: boolean
}

/** A track loading and playing are one screen: PlayController tells the two apart. */
type Phase = 'menu' | 'play' | 'result' | 'free'

interface Saved extends MenuSaved {
  speed?: number
  /** The instrument the keys play, by its voice. */
  instrument?: string
  free?: FreeSaved
}

const SURFACE = 'screen'
const MENU_KEY_LENGTH = 520

export function startGame(ctx: ViewContext<Settings, unknown>): () => void {
  return new Game(ctx).start()
}

class Game {
  readonly ctx: ViewContext<Settings, unknown>
  readonly tracks: Tracks
  readonly fx = new Effects()
  private readonly menu: MenuController
  private readonly play: PlayController
  private readonly free: FreePlay
  private phase: Phase = 'menu'
  /** When the result came up: its reveal runs from it. */
  private resultAt = 0
  private result: ResultView | null = null
  private stopFrames: (() => void) | null = null
  /** How far ahead of a frame's time what moves is drawn: the frame is shown that much later. */
  private readonly frames = new FrameLead()
  /** A key pressed on the result: its hint blinks and the screen closes before it acts. */
  private leaving: { to: 'menu' | 'retry'; at: number } | null = null
  /** The instrument the keys play, by its place in INSTRUMENTS, and when it was last picked. */
  private instrument = 0
  private instrumentAt = Number.NEGATIVE_INFINITY

  constructor(ctx: ViewContext<Settings, unknown>) {
    this.ctx = ctx
    this.tracks = new Tracks((line) => ctx.log(line))
    const host = {
      ctx,
      tracks: this.tracks,
      fx: this.fx,
      volume: () => this.volume,
      lead: () => this.lead,
      start: (now: number) => this.startChosen(now),
    }
    const saved = ctx.state.get<Saved>() ?? {}
    this.menu = new MenuController(host, saved)
    this.play = new PlayController(host, saved.speed)
    this.free = new FreePlay(
      ctx,
      (index) => this.tracks.chartOf(index, 'normal'),
      this.tracks.count,
      () => this.lead,
    )
    this.free.restore(saved.free)
    // Kept in the pane (before it was, FREE PLAY had one of its own); key 1's when nothing
    // valid is kept - written back at once, leaving the rest of what was kept.
    this.instrument = instrumentOfVoice(saved.instrument ?? saved.free?.tone)
    if (saved.instrument !== this.lead) this.save()
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
        this.menu.silence()
      }),
      // The preview is sent a few seconds ahead; this keeps it going without drawing.
      ctx.every(1000, () => this.menu.previewTick(performance.now(), this.phase === 'menu')),
      ctx.on('settings', () => {
        this.bindKeys()
        this.wake()
      }),
      ctx.on('key', (key) => this.onKey(key)),
    ]
    this.bindKeys()
    this.menu.shown(performance.now())
    // Which instrument the keys play, shown as the keyboard comes to the game (onFocus).
    if (ctx.keys.focused) this.instrumentAt = performance.now()
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
    // The number row picks the instrument on every screen but the loading one.
    const loading = this.phase === 'play' && this.play.loading
    const instrument = key.down && !loading ? instrumentOfKey(key.code) : null
    if (instrument !== null) this.pick(instrument, key.at)
    // FREE mode plays keys as held, so it hears them come up too; elsewhere only a press acts.
    else if (key.down || this.phase === 'free') this.act(key)
    this.wake()
  }

  /**
   * An instrument picked: the keys play it at once, the band's next window plays the melody's
   * guide on it, its name shows over the keyboard, and on the menu it is heard.
   */
  private pick(index: number, at: number): void {
    this.instrument = validInstrument(index)
    this.instrumentAt = at
    this.bindKeys()
    this.save()
    if (this.phase === 'menu') this.menu.picked(at)
  }

  private act(key: KeyPress): void {
    switch (this.phase) {
      case 'menu':
        if (this.menu.key(key.code, key.at)) this.save()
        return
      case 'play':
        this.playKey(key)
        return
      case 'result':
        if (key.code === 'Enter' || key.code === 'Escape') this.leave('menu', key.at)
        else if (key.code === 'KeyR') this.leave('retry', key.at)
        return
      case 'free': {
        const done = this.free.key(key)
        if (done === 'leave') this.toMenu()
        else if (done === 'changed') this.save()
      }
    }
  }

  private playKey(key: KeyPress): void {
    const ask = this.play.key(key)
    if (ask === 'menu') this.toMenu()
    else if (ask === 'retry') this.load(key.at)
    else if (ask === 'changed') this.save()
  }

  private onFocus(): void {
    const now = performance.now()
    if (!this.ctx.keys.focused) {
      this.pause(now)
      // The band stops with the keyboard gone: nobody is playing over it.
      this.free.stopBacking()
      this.menu.silence()
    } else {
      this.menu.focused(now)
      this.instrumentAt = now
    }
    this.wake()
  }

  /*
   * Screens.
   */

  /** The chosen row's blink is over: the track loads, or FREE PLAY opens. */
  private startChosen(now: number): void {
    if (this.menu.free) this.enterFree()
    else this.load(now)
  }

  /** The chosen track, at the chosen level: its boot log runs, then the count, then the song. */
  private load(now: number): void {
    const chart = this.tracks.chartOf(this.menu.selected, this.menu.level)
    if (chart === null) return
    this.result = null
    this.leaving = null
    this.fx.clear()
    this.phase = 'play'
    this.play.load(this.menu.selected, chart, now)
    this.bindKeys()
  }

  private enterFree(): void {
    this.ctx.sound.stop()
    this.play.clear()
    this.fx.clear()
    this.phase = 'free'
    this.free.enter()
  }

  private toMenu(): void {
    if (this.phase === 'free') this.free.leave()
    this.ctx.sound.stop()
    this.play.clear()
    this.phase = 'menu'
    this.leaving = null
    this.menu.shown(performance.now())
    this.fx.clear()
    this.bindKeys()
  }

  private pause(now: number): void {
    if (this.phase !== 'play') return
    this.play.pause(now)
    this.wake()
  }

  /** A key on the result: its hint blinks and the screen closes, then it acts (frame). */
  private leave(to: 'menu' | 'retry', at: number): void {
    if (this.leaving !== null) return
    playCue(this.ctx, 'choose', this.volume)
    if (this.ctx.theme.reducedMotion) {
      this.left(to, at)
      return
    }
    this.leaving = { to, at }
  }

  private left(to: 'menu' | 'retry', now: number): void {
    this.leaving = null
    if (to === 'menu') this.toMenu()
    else this.load(now)
  }

  /*
   * Frames.
   */

  private wake(): void {
    this.stopFrames ??= this.ctx.animate((now) => this.frame(now))
  }

  private frame(now: number): void {
    if (this.phase === 'play') {
      const result = this.play.frame(now)
      if (result !== null) {
        this.result = result
        this.phase = 'result'
        this.resultAt = now
      }
    }
    if (this.phase === 'menu') this.menu.frame(now)
    const leaving = this.leaving
    if (this.phase === 'result' && leaving && now - leaving.at >= EXIT_MS)
      this.left(leaving.to, now)
    if (this.phase === 'free') this.free.frame(now)
    this.draw(now, this.frames.tick(now))
    if (this.moving(now)) return
    this.stopFrames?.()
    this.stopFrames = null
  }

  private moving(now: number): boolean {
    if (this.phase === 'play' && this.play.moving()) return true
    if (this.phase === 'result' && (now - this.resultAt < REVEAL_MS || this.leaving)) return true
    if (this.phase === 'free' && this.free.moving()) return true
    if (this.phase === 'menu' && this.menu.moving(now)) return true
    if (now - this.instrumentAt < INSTRUMENT_MS) return true
    return this.fx.alive(now)
  }

  /**
   * Draws the frame. What keeps time with the song - the field, the count, the band's
   * pulse - is drawn `lead` ahead of `now`, where it will stand when the frame is shown
   * (frame-lead.ts); the effects and the reveals run on `now` itself.
   */
  private draw(now: number, lead: number): void {
    const surface = this.ctx.surface(SURFACE)
    if (surface === null) return
    const p = paintOf(surface, this.ctx.theme)
    const l = layoutOf(surface.w, surface.h)
    p.g.clearRect(0, 0, p.w, p.h)
    const labels = this.ctx.keys.labels
    const instrument = this.instrumentShown
    if (this.phase === 'menu') this.menu.draw(p, l, now, { instrument, speed: this.play.speed })
    else if (this.phase === 'free') this.drawFree(p, l, now, now + lead)
    else if (this.phase === 'result' && this.result !== null)
      drawResult(p, l, this.result, now - this.resultAt, labels, this.exitOf(now))
    else this.play.draw(p, l, now, now + lead, instrument.name)
    const shift = this.phase === 'free' ? this.free.octave * 12 : 0
    drawKeyboard(p, l, labels, (code) => this.fx.light(code, now), shift)
    const picked = now - this.instrumentAt
    if (picked < INSTRUMENT_MS) drawInstrument(p, l, instrument, picked)
    const playing = this.phase === 'play' && this.play.running
    if (!this.ctx.keys.focused && !playing) drawConnect(p, l, wordsFor(this.ctx.locale).connect)
  }

  /** The result's way out, as far as it has gone: which hint blinks, and since when. */
  private exitOf(now: number): { key: 0 | 1; age: number } | null {
    const leaving = this.leaving
    return leaving ? { key: leaving.to === 'menu' ? 0 : 1, age: now - leaving.at } : null
  }

  private get instrumentShown(): { name: string; key: string } {
    const chosen = INSTRUMENTS[validInstrument(this.instrument)] ?? INSTRUMENTS[0]
    return { name: chosen?.name ?? '', key: chosen?.key ?? '' }
  }

  /** `shown` is the moment the frame is seen, for the band's pulse; `now` for the rest. */
  private drawFree(p: Paint, l: Layout, now: number, shown: number): void {
    const free = this.free
    const chart = free.backing?.chart ?? null
    const loop = free.loopTime(shown)
    // The line pulses with the band's beat when one plays; nothing falls in this mode.
    drawLanes(p, l, {
      chart,
      time: chart === null || loop === null ? 0 : loop % Math.max(1, loopLength(chart)),
      lead: leadTime(this.play.speed),
      state: () => 'live',
      droppedAt: () => undefined,
      labels: this.ctx.keys.labels,
      lines: false,
    })
    drawFree(
      p,
      l,
      {
        instrument: this.instrumentShown.name,
        instrumentKey: this.instrumentShown.key,
        octave: free.octave,
        strength: free.strength,
        strengths: STRENGTHS.length,
        pedal: free.pedal,
        backing: free.backing?.index ?? null,
        cursor: free.cursor,
        tracks: this.tracks.scores.map((s) => s.source.title),
        trails: free.trails,
        holding: free.holding,
        played: free.played,
      },
      now,
    )
  }

  /*
   * Settings and state.
   */

  private get volume(): number {
    return Math.min(1, Math.max(0, this.ctx.settings.volume / 100))
  }

  /** The voice the keys, the guide and the preview play: the instrument picked, or key 1's. */
  private get lead(): Voice {
    return INSTRUMENTS[validInstrument(this.instrument)]?.voice ?? 'epiano'
  }

  /**
   * Every key's note, played by the host the instant the key goes down. The keyboard stays
   * an instrument on every screen - the menu, a pause, the result - on purpose: it is how the
   * notes are learnt, and a key there is never judged (the pause's own keys, R and Q, play
   * nothing). Only the moment it is bound in differs: a track's notes ring for about a beat.
   */
  private bindKeys(): void {
    if (this.phase === 'free') {
      this.free.bind()
      return
    }
    const length = this.play.keyLength ?? MENU_KEY_LENGTH
    const note = (pitch: number): Note => ({
      voice: this.lead,
      pitch,
      length,
      level: 0.85 * this.volume,
    })
    this.ctx.keys.play(Object.fromEntries(NOTE_KEYS.map((k) => [k.code, note(k.pitch ?? 60)])))
  }

  private save(): void {
    const saved: Saved = {
      ...this.menu.saved(),
      speed: this.play.speed,
      instrument: this.lead,
      free: this.free.saved(),
    }
    this.ctx.state.set(saved)
  }
}
