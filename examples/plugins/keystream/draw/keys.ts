import { isBlack, KEYS, type KeyDef, noteName } from '../keyboard'
import type { Layout } from './layout'
import { alpha, font, type Paint, write } from './paint'

/**
 * The keyboard along the bottom, as eDEX-UI drew one under its shell: two rows of caps that
 * light while pressed. Each cap says what it prints on this keyboard and the note it plays;
 * the caps between (Q, R, I, [ and ]) play nothing and stay faint.
 */

export interface KeyLight {
  /** 0 to 1: held is 1, fading after. */
  level: number
  /** What lit it: a key held, a note hit, a note dropped, or a key that matched nothing. */
  tone: 'held' | 'hit' | 'drop' | 'stray'
}

export function drawKeyboard(
  p: Paint,
  l: Layout,
  labels: Readonly<Record<string, string>>,
  light: (code: string) => KeyLight | null,
  /** Semitones the keys are shifted by (FREE mode's octaves): the note names follow. */
  shift = 0,
): void {
  for (const key of KEYS) {
    drawCap(p, l, key, labels[key.code] ?? key.char.toUpperCase(), light(key.code), shift)
  }
}

function drawCap(
  p: Paint,
  l: Layout,
  key: KeyDef,
  label: string,
  lit: KeyLight | null,
  shift: number,
): void {
  const x = l.keyX(key) - l.cap / 2
  const y = l.keyTop(key)
  const level = lit?.level ?? 0
  capBody(p, l, key, x, y, lit)
  const ink =
    key.pitch === null
      ? alpha(p.c.muted, 0.6)
      : level > 0.5 && !p.light
        ? p.c.accentStrong
        : p.c.text
  write(p, label, x + l.cap / 2, y + l.cap * 0.47, {
    font: font(600, l.cap * 0.36, p.fonts.mono),
    color: ink,
    align: 'center',
    baseline: 'middle',
  })
  if (key.pitch === null) return
  write(p, noteName(key.pitch + shift), x + l.cap / 2, y + l.cap * 0.86, {
    font: font(500, Math.max(8, l.cap * 0.19), p.fonts.ui),
    color: p.c.muted,
    align: 'center',
    baseline: 'alphabetic',
    spacing: '0.06em',
  })
  // A black key carries a short bar across its top edge, as a piano's stands above the white.
  if (isBlack(key)) {
    p.g.fillStyle = alpha(p.c.accent, 0.55)
    p.g.fillRect(x + l.cap * 0.3, y + 2, l.cap * 0.4, 2)
  }
}

/** The cap itself: a black key on the ground, a white one raised, a silent one bare. */
function capBody(
  p: Paint,
  l: Layout,
  key: KeyDef,
  x: number,
  y: number,
  lit: KeyLight | null,
): void {
  const g = p.g
  const plays = key.pitch !== null
  const black = isBlack(key)
  const level = lit?.level ?? 0
  g.beginPath()
  g.roundRect(x, y, l.cap, l.cap, l.cap * 0.12)
  if (plays) {
    g.fillStyle = alpha(black ? p.c.ground : p.c.raised, 0.92)
    g.fill()
  }
  if (level > 0) {
    g.fillStyle = alpha(toneColor(p, lit), (p.light ? 0.35 : 0.5) * level)
    g.fill()
  }
  g.lineWidth = black && plays ? 1.5 : 1
  g.strokeStyle =
    level > 0.05
      ? alpha(toneColor(p, lit), 0.6 + 0.4 * level)
      : alpha(p.c.border, plays ? 0.8 : 0.3)
  g.stroke()
}

export function toneColor(p: Paint, lit: KeyLight | null): string {
  switch (lit?.tone) {
    case 'hit':
      return p.c.accentStrong
    case 'drop':
      return p.c.danger
    case 'stray':
      return p.c.muted
    default:
      return p.c.accent
  }
}
