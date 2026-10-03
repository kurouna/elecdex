/**
 * The ELEC-16's skins (docs/elec16.md section 7): the body's colours and shape, its keys,
 * and the LCD's ground and dots - data, as themes are. ELEC follows the app's theme; the
 * others keep their own colours whatever the theme. None copies a real product's.
 *
 * The body's colours go to CSS as variables on the device; the LCD's are read once into
 * RGB for the canvas (any CSS colour, a theme variable included).
 */

export const SKIN_IDS = [
  'elec',
  'tron',
  'business-light',
  'business-dark',
  'classic',
  'ivory',
  'night',
] as const
export type SkinId = (typeof SKIN_IDS)[number]

export interface Skin {
  id: SkinId
  /** As TUNE names it. */
  label: string
  /** The device's CSS variables. */
  body: {
    /** The case. */
    face: string
    /** Its edge, and the rules on it. */
    edge: string
    /** Engravings beside the keys and the annunciators. */
    print: string
    key: string
    keyText: string
    /** The keys that are not characters (MODE, CLS, BRK, the arrows...). */
    fnKey: string
    fnText: string
    /** A key's corners, in CSS pixels. */
    radius: number
    font: 'ui' | 'display' | 'mono'
    /** The case's edge glows (TRON). */
    glow: boolean
    /** HUD corner brackets on the case (ELEC). */
    brackets: boolean
  }
  /** The LCD, as CSS colours: its ground, a dot that is on, and a dot's shadow on the ground. */
  lcd: { ground: string; dot: string; shadow: string }
}

export const SKINS: Readonly<Record<SkinId, Skin>> = {
  elec: {
    id: 'elec',
    label: 'ELEC',
    body: {
      face: 'var(--surface-1)',
      edge: 'var(--panel-border)',
      print: 'var(--text-muted)',
      key: 'transparent',
      keyText: 'var(--accent)',
      fnKey: 'var(--accent-faint)',
      fnText: 'var(--accent-strong)',
      radius: 0,
      font: 'ui',
      glow: false,
      brackets: true,
    },
    lcd: { ground: 'var(--surface-0)', dot: 'var(--accent-strong)', shadow: 'var(--accent-faint)' },
  },
  tron: {
    id: 'tron',
    label: 'TRON',
    body: {
      face: '#05080d',
      edge: 'hsl(183 22% 74%)',
      print: 'hsl(183 12% 58%)',
      key: '#0b1118',
      keyText: 'hsl(183 22% 74%)',
      fnKey: '#10202a',
      fnText: 'hsl(183 40% 82%)',
      radius: 2,
      font: 'display',
      glow: true,
      brackets: false,
    },
    lcd: { ground: '#02090c', dot: 'hsl(183 45% 76%)', shadow: 'hsl(183 30% 22%)' },
  },
  'business-light': {
    id: 'business-light',
    label: 'BUSINESS LIGHT',
    body: {
      face: '#f3f3f3',
      edge: '#d6d6d6',
      print: '#5f5f5f',
      key: '#ffffff',
      keyText: '#1a1a1a',
      fnKey: '#005fb8',
      fnText: '#ffffff',
      radius: 6,
      font: 'ui',
      glow: false,
      brackets: false,
    },
    lcd: { ground: '#fbfbfb', dot: '#1a1a1a', shadow: '#e3e3e3' },
  },
  'business-dark': {
    id: 'business-dark',
    label: 'BUSINESS DARK',
    body: {
      face: '#202020',
      edge: '#3a3a3a',
      print: '#9e9e9e',
      key: '#2d2d2d',
      keyText: '#ffffff',
      fnKey: '#60cdff',
      fnText: '#000000',
      radius: 6,
      font: 'ui',
      glow: false,
      brackets: false,
    },
    lcd: { ground: '#1a1a1a', dot: '#f2f2f2', shadow: '#2e2e2e' },
  },
  classic: {
    id: 'classic',
    label: 'CLASSIC',
    body: {
      face: '#1c1c1f',
      edge: '#3a3a40',
      print: '#b9b9c0',
      key: '#2e2e33',
      keyText: '#ececec',
      fnKey: '#5d6168',
      fnText: '#ffffff',
      radius: 3,
      font: 'ui',
      glow: false,
      brackets: false,
    },
    lcd: { ground: '#a9b78e', dot: '#1e2914', shadow: '#94a27a' },
  },
  ivory: {
    id: 'ivory',
    label: 'IVORY',
    body: {
      face: '#e8e1cf',
      edge: '#c9bfa6',
      print: '#6d6450',
      key: '#f7f3e8',
      keyText: '#3a352c',
      fnKey: '#8c826d',
      fnText: '#fbf8f0',
      radius: 4,
      font: 'ui',
      glow: false,
      brackets: false,
    },
    lcd: { ground: '#b8bbb3', dot: '#262a25', shadow: '#a5a8a0' },
  },
  night: {
    id: 'night',
    label: 'NIGHT',
    body: {
      face: '#111a33',
      edge: '#2a3966',
      print: '#9fb0dd',
      key: '#1c2747',
      keyText: '#d8e2ff',
      fnKey: '#33488a',
      fnText: '#ffffff',
      radius: 4,
      font: 'ui',
      glow: false,
      brackets: false,
    },
    lcd: { ground: '#0b2c6b', dot: '#c4e6ff', shadow: '#123a84' },
  },
}

export const isSkinId = (value: unknown): value is SkinId =>
  typeof value === 'string' && (SKIN_IDS as readonly string[]).includes(value)
