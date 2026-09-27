import type { Grade } from '../judge'
import type { KeyLight } from './keys'
import type { Layout } from './layout'
import { alpha, clamp, font, type Paint, write } from './paint'

/**
 * The light of the game: what flares where a note is hit, the word for how well, the chain,
 * and the keys' own glow. Each effect lives a fraction of a second; while any does, the
 * view keeps drawing, and once none does, it stops - nothing moves on a still screen.
 * With motion reduced only the keys' light and the words are left.
 */

interface Particle {
  vx: number
  vy: number
  size: number
}

type Effect =
  | { kind: 'burst'; x: number; y: number; at: number; grade: Grade; parts: Particle[] }
  | { kind: 'ring'; x: number; y: number; w: number; h: number; at: number; grade: Grade }
  | { kind: 'beam'; x: number; w: number; at: number; grade: Grade }
  | { kind: 'flash'; x: number; w: number; at: number }
  | { kind: 'sweep'; at: number }

const LIFE: Readonly<Record<Effect['kind'], number>> = {
  burst: 480,
  ring: 320,
  beam: 280,
  flash: 240,
  sweep: 560,
}

const KEY_FADE_MS = 110
const MARK_MS = 260
const WORD_MS = 720

export function gradeColor(p: Paint, grade: Grade): string {
  switch (grade) {
    case 'SYNC':
      return p.c.accentStrong
    case 'LOCK':
      return p.c.accent
    case 'ACK':
      return p.c.warn
    default:
      return p.c.danger
  }
}

export class Effects {
  private items: Effect[] = []
  private readonly keys = new Map<
    string,
    { down: boolean; at: number; tone: KeyLight['tone']; markAt: number }
  >()
  private word: { grade: Grade; delta: number | null; at: number } | null = null
  private chainAt = 0

  clear(): void {
    this.items = []
    this.word = null
    this.keys.clear()
  }

  press(code: string, now: number): void {
    const was = this.keys.get(code)
    this.keys.set(code, {
      down: true,
      at: now,
      tone: was?.tone ?? 'held',
      markAt: was?.markAt ?? 0,
    })
  }

  release(code: string, now: number): void {
    const key = this.keys.get(code)
    if (key) this.keys.set(code, { ...key, down: false, at: now })
  }

  /** Colours a key by what its press did. */
  mark(code: string, tone: KeyLight['tone'], now: number): void {
    const key = this.keys.get(code) ?? { down: false, at: now }
    this.keys.set(code, { ...key, tone, markAt: now })
  }

  light(code: string, now: number): KeyLight | null {
    const key = this.keys.get(code)
    if (key === undefined) return null
    const tone = now - key.markAt < MARK_MS ? key.tone : 'held'
    const level = key.down ? 1 : Math.exp(-(now - key.at) / KEY_FADE_MS)
    return level < 0.02 ? null : { level, tone }
  }

  hit(
    x: number,
    y: number,
    grade: Grade,
    delta: number,
    now: number,
    l: Layout,
    reduced: boolean,
  ): void {
    this.word = { grade, delta, at: now }
    this.chainAt = now
    if (reduced) return
    const w = l.unit * 0.8
    this.items.push({ kind: 'beam', x, w, at: now, grade })
    this.items.push({ kind: 'ring', x, y, w, h: l.unit * 0.46, at: now, grade })
    const count = grade === 'SYNC' ? 14 : grade === 'LOCK' ? 10 : 6
    const parts = Array.from({ length: count }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4
      const speed = l.unit * (0.004 + Math.random() * 0.006)
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
      }
    })
    this.items.push({ kind: 'burst', x, y, at: now, grade, parts })
  }

  drop(x: number, now: number, l: Layout, reduced: boolean): void {
    this.word = { grade: 'DROP', delta: null, at: now }
    this.chainAt = now
    if (!reduced) this.items.push({ kind: 'flash', x, w: l.unit * 0.8, at: now })
  }

  /** Every fiftieth note in a chain: a scan across the field. */
  milestone(now: number, reduced: boolean): void {
    if (!reduced) this.items.push({ kind: 'sweep', at: now })
  }

  alive(now: number): boolean {
    this.items = this.items.filter((e) => now - e.at < LIFE[e.kind])
    const wordOn = this.word !== null && now - this.word.at < WORD_MS
    const keysOn = [...this.keys.keys()].some((code) => this.light(code, now) !== null)
    return this.items.length > 0 || wordOn || keysOn
  }

  draw(p: Paint, l: Layout, now: number): void {
    const g = p.g
    g.save()
    g.globalCompositeOperation = p.light ? 'source-over' : 'lighter'
    for (const e of this.items) {
      const t = clamp((now - e.at) / LIFE[e.kind], 0, 1)
      if (e.kind === 'beam') beam(p, l, e.x, e.w, t, gradeColor(p, e.grade))
      else if (e.kind === 'flash') flash(p, l, e.x, e.w, t)
      else if (e.kind === 'ring') ring(p, e, t)
      else if (e.kind === 'burst') burst(p, e, now - e.at, t)
      else sweep(p, l, t)
    }
    g.restore()
  }

  /** The word for the last note, over the field, and the chain above it. */
  drawWords(p: Paint, l: Layout, now: number, chain: number): void {
    const cx = l.field.x + l.field.w / 2
    const cy = l.field.y + l.field.h * 0.44
    const size = clamp(l.unit * 0.5, 14, 40)
    if (chain >= 5) chainFigure(p, cx, cy - size * 1.5, size, chain, now - this.chainAt)
    const word = this.word
    if (word === null || now - word.at > WORD_MS) return
    const age = now - word.at
    const fade = age < WORD_MS * 0.6 ? 1 : 1 - (age - WORD_MS * 0.6) / (WORD_MS * 0.4)
    const pop = p.reduced ? 1 : 1 + 0.22 * (1 - clamp(age / 110, 0, 1))
    const g = p.g
    g.save()
    g.globalAlpha = fade
    g.translate(cx, cy)
    g.scale(pop, pop)
    write(p, word.grade, 0, 0, {
      font: font(700, size * 0.8, p.fonts.display),
      color: gradeColor(p, word.grade),
      align: 'center',
      baseline: 'middle',
      spacing: '0.3em',
    })
    g.restore()
    timing(p, cx, cy + size * 0.75, size, word.delta, fade)
  }
}

function beam(p: Paint, l: Layout, x: number, w: number, t: number, color: string): void {
  const g = p.g
  const top = l.line - l.unit * 4.5
  const gradient = g.createLinearGradient(0, l.line, 0, top)
  gradient.addColorStop(0, alpha(color, 0.45 * (1 - t)))
  gradient.addColorStop(1, alpha(color, 0))
  g.fillStyle = gradient
  g.fillRect(x - (w / 2) * (1 - t * 0.5), top, w * (1 - t * 0.5), l.line - top)
}

function flash(p: Paint, l: Layout, x: number, w: number, t: number): void {
  const g = p.g
  g.fillStyle = alpha(p.c.danger, 0.28 * (1 - t))
  g.fillRect(x - w / 2, l.field.y, w, l.line - l.field.y)
}

function ring(
  p: Paint,
  e: { x: number; y: number; w: number; h: number; grade: Grade },
  t: number,
): void {
  const g = p.g
  const grow = 1 + t * 0.9
  const w = e.w * grow
  const h = e.h * grow
  g.beginPath()
  g.roundRect(e.x - w / 2, e.y - h / 2, w, h, h * 0.2)
  g.lineWidth = 0.5 + 2 * (1 - t)
  g.strokeStyle = alpha(gradeColor(p, e.grade), 1 - t)
  g.stroke()
}

function burst(
  p: Paint,
  e: { x: number; y: number; grade: Grade; parts: Particle[] },
  age: number,
  t: number,
): void {
  const g = p.g
  g.fillStyle = alpha(gradeColor(p, e.grade), 1 - t)
  const fall = 0.0009 * age * age
  for (const part of e.parts) {
    const x = e.x + part.vx * age
    const y = e.y + part.vy * age + fall
    g.fillRect(x - part.size / 2, y - part.size / 2, part.size, part.size)
  }
}

function sweep(p: Paint, l: Layout, t: number): void {
  const g = p.g
  const y = l.field.y + (l.line - l.field.y) * t
  const trail = l.unit * 1.6
  const gradient = g.createLinearGradient(0, y - trail, 0, y)
  gradient.addColorStop(0, alpha(p.c.accent, 0))
  gradient.addColorStop(1, alpha(p.c.accent, 0.22 * (1 - t)))
  g.fillStyle = gradient
  g.fillRect(l.field.x, y - trail, l.field.w, trail)
  g.fillStyle = alpha(p.c.accentStrong, 0.7 * (1 - t))
  g.fillRect(l.field.x, y, l.field.w, 1.5)
}

function chainFigure(
  p: Paint,
  x: number,
  y: number,
  size: number,
  chain: number,
  since: number,
): void {
  const g = p.g
  const pop = p.reduced ? 1 : 1 + 0.12 * (1 - clamp(since / 90, 0, 1))
  g.save()
  g.translate(x, y)
  g.scale(pop, pop)
  write(p, String(chain), 0, 0, {
    font: font(600, size * 1.25, p.fonts.mono),
    color: alpha(p.c.text, 0.9),
    align: 'center',
    baseline: 'middle',
  })
  g.restore()
  write(p, 'CHAIN', x, y + size * 0.85, {
    font: font(500, Math.max(9, size * 0.32), p.fonts.ui),
    color: p.c.muted,
    align: 'center',
    baseline: 'middle',
    spacing: '0.4em',
  })
}

/** How early or late the key was, under the word: said only when it is worth saying. */
function timing(
  p: Paint,
  x: number,
  y: number,
  size: number,
  delta: number | null,
  fade: number,
): void {
  if (delta === null || Math.abs(delta) < 12) return
  const words = `${delta < 0 ? 'EARLY' : 'LATE'} ${Math.round(Math.abs(delta))}MS`
  write(p, words, x, y, {
    font: font(500, Math.max(9, size * 0.34), p.fonts.ui),
    color: alpha(delta < 0 ? p.c.info : p.c.warn, 0.85 * fade),
    align: 'center',
    baseline: 'middle',
    spacing: '0.2em',
  })
}
