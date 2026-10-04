/**
 * The ELEC-16's skins (docs/elec16.md section 7): the body's colours and shape, its keys,
 * and the LCD's ground and dots - data, as themes are, with the colours the agreed mock gave
 * them. ELEC and PLAIN follow the app's theme; the others keep their own colours whatever the
 * theme. PLAIN is no pocket computer at all: no case, no plate, a flat screen without the dots'
 * gaps and shadows, and the app's own flat buttons for keys.
 * None copies a real product's.
 *
 * The body's colours go to CSS as variables on the device; the LCD's are read once into
 * RGB for the canvas (any CSS colour, a theme variable included).
 */

import { ELEC16_SKINS, type Elec16SkinId } from '@shared/elec16-units'

export const SKIN_IDS = ELEC16_SKINS
export type SkinId = Elec16SkinId

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
    /** A light along the case's top edge (none for the flat HUD skins). */
    sheen: string
    /** The name plate's big ELEC-16. */
    plate: string
    /** The plate's small print, the shifted faces' engravings beside them, and POWER. */
    print: string
    /** The POWER lamp, lit. */
    led: string
    key: string
    keyText: string
    /** Under a raised key: its side. */
    keyEdge: string
    /** The keys that are not characters (MODE, CLS, the arrows...). */
    fnKey: string
    fnText: string
    brk: string
    brkText: string
    enter: string
    enterText: string
    /** A key's shifted face, engraved above it. */
    legend: string
    /** The LCD's bezel round the glass. */
    bezel: string
    /** A key's corners, in CSS pixels; the case's are a little rounder. */
    radius: number
    font: 'ui' | 'display' | 'mono'
    /**
     * Raised keys that go down when pressed, flat tiles that blink (ELEC, TRON), or plain
     * rounded keys that darken (the Business skins, as their themes' buttons).
     */
    keys: 'raised' | 'flat' | 'plain'
    /** The case's edge glows (TRON). */
    glow: boolean
    /** HUD corner brackets on the case (ELEC). */
    brackets: boolean
    /**
     * The name plate - ELEC-16, 16-BIT POCKET COMPUTER and the POWER lamp - as a pocket
     * computer has; the Business skins, plain as their themes, have none.
     */
    plateShown: boolean
    /** No case: the screen and the keys stand in the pane on its own ground (PLAIN). */
    bare: boolean
  }
  /**
   * The LCD, as CSS colours: its ground, a dot that is on, and a dot's shadow on the ground;
   * `flat` draws it as a plain screen - no gaps between the dots, no shadows, no sunk glass.
   */
  lcd: { ground: string; dot: string; shadow: string; flat: boolean }
}

const TRON = 'hsl(183 22% 74%)'

export const SKINS: Readonly<Record<SkinId, Skin>> = {
  elec: {
    id: 'elec',
    label: 'ELEC',
    body: {
      face: 'var(--surface-2)',
      edge: 'var(--panel-rule)',
      sheen: 'transparent',
      plate: 'var(--accent)',
      print: 'var(--text-muted)',
      led: 'var(--ok)',
      key: 'transparent',
      keyText: 'var(--accent)',
      keyEdge: 'var(--panel-rule)',
      fnKey: 'var(--accent-faint)',
      fnText: 'var(--accent-strong)',
      brk: 'color-mix(in srgb, var(--danger) 20%, transparent)',
      brkText: 'var(--danger)',
      enter: 'var(--accent)',
      enterText: 'var(--surface-1)',
      legend: 'var(--warn)',
      bezel: 'var(--surface-0)',
      radius: 0,
      font: 'ui',
      keys: 'flat',
      glow: false,
      brackets: true,
      plateShown: true,
      bare: false,
    },
    lcd: {
      ground: 'var(--surface-0)',
      dot: 'var(--accent-strong)',
      shadow: 'var(--accent-faint)',
      flat: false,
    },
  },
  plain: {
    id: 'plain',
    label: 'PLAIN',
    body: {
      face: 'transparent',
      edge: 'transparent',
      sheen: 'transparent',
      plate: 'var(--accent)',
      print: 'var(--text-muted)',
      led: 'var(--ok)',
      key: 'transparent',
      keyText: 'var(--accent)',
      keyEdge: 'var(--panel-rule)',
      fnKey: 'transparent',
      fnText: 'var(--text-muted)',
      brk: 'transparent',
      brkText: 'var(--danger)',
      enter: 'var(--accent-faint)',
      enterText: 'var(--accent-strong)',
      legend: 'var(--text-muted)',
      bezel: 'transparent',
      radius: 0,
      font: 'ui',
      keys: 'flat',
      glow: false,
      brackets: false,
      plateShown: false,
      bare: true,
    },
    lcd: {
      ground: 'var(--surface-1)',
      dot: 'var(--accent)',
      shadow: 'var(--surface-1)',
      flat: true,
    },
  },
  tron: {
    id: 'tron',
    label: 'TRON',
    body: {
      face: '#0b1118',
      edge: TRON,
      sheen: 'transparent',
      plate: TRON,
      print: 'hsl(183 22% 74% / 0.62)',
      led: '#5fd38d',
      key: 'transparent',
      keyText: TRON,
      keyEdge: 'hsl(183 22% 74% / 0.3)',
      fnKey: 'hsl(183 22% 74% / 0.12)',
      fnText: 'hsl(183 22% 86%)',
      brk: 'rgb(232 106 106 / 0.18)',
      brkText: '#e86a6a',
      enter: TRON,
      enterText: '#05080d',
      legend: '#e0b35a',
      bezel: '#000000',
      radius: 0,
      font: 'display',
      keys: 'flat',
      glow: true,
      brackets: false,
      plateShown: true,
      bare: false,
    },
    lcd: { ground: '#02050a', dot: 'hsl(183 22% 86%)', shadow: 'hsl(183 30% 16%)', flat: false },
  },
  'business-light': {
    id: 'business-light',
    label: 'BUSINESS LIGHT',
    body: {
      face: '#f3f3f3',
      edge: '#d6d6d6',
      sheen: 'rgb(255 255 255 / 0.8)',
      plate: '#1a1a1a',
      print: '#5f5f5f',
      led: '#0f7b0f',
      key: '#ffffff',
      keyText: '#1a1a1a',
      keyEdge: '#d1d1d1',
      fnKey: '#e9e9e9',
      fnText: '#1a1a1a',
      brk: '#c42b1c',
      brkText: '#ffffff',
      enter: '#005fb8',
      enterText: '#ffffff',
      legend: '#005fb8',
      bezel: '#d6d6d6',
      radius: 4,
      font: 'ui',
      keys: 'plain',
      glow: false,
      brackets: false,
      plateShown: false,
      bare: false,
    },
    lcd: { ground: '#e8ebe6', dot: '#1b1b1b', shadow: '#c3c5c1', flat: false },
  },
  'business-dark': {
    id: 'business-dark',
    label: 'BUSINESS DARK',
    body: {
      face: '#2c2c2c',
      edge: '#3a3a3a',
      sheen: 'rgb(255 255 255 / 0.05)',
      plate: '#ffffff',
      print: '#9e9e9e',
      led: '#6ccb5f',
      key: '#3a3a3a',
      keyText: '#ffffff',
      keyEdge: '#1c1c1c',
      fnKey: '#454545',
      fnText: '#ffffff',
      brk: '#c42b1c',
      brkText: '#ffffff',
      enter: '#60cdff',
      enterText: '#000000',
      legend: '#60cdff',
      bezel: '#1c1c1c',
      radius: 4,
      font: 'ui',
      keys: 'plain',
      glow: false,
      brackets: false,
      plateShown: false,
      bare: false,
    },
    lcd: { ground: '#202020', dot: '#f3f3f3', shadow: '#101010', flat: false },
  },
  classic: {
    id: 'classic',
    label: 'CLASSIC',
    body: {
      face: '#25272a',
      edge: '#3a3d42',
      sheen: 'rgb(255 255 255 / 0.06)',
      plate: '#ded9cc',
      print: '#8f8b82',
      // Green, as every skin's: a red lamp reads as one gone off.
      led: '#5ccf72',
      key: '#3a3d43',
      keyText: '#ece9e1',
      keyEdge: '#141518',
      fnKey: '#5b6068',
      fnText: '#f2f0ea',
      brk: '#c4552b',
      brkText: '#fff4ec',
      enter: '#8b919a',
      enterText: '#141518',
      legend: '#e8a54a',
      bezel: '#15171a',
      radius: 3,
      font: 'ui',
      keys: 'raised',
      glow: false,
      brackets: false,
      plateShown: true,
      bare: false,
    },
    lcd: { ground: '#a9b49a', dot: '#1c2217', shadow: '#87917b', flat: false },
  },
  ivory: {
    id: 'ivory',
    label: 'IVORY',
    body: {
      face: '#e5dece',
      edge: '#c9bda4',
      sheen: 'rgb(255 255 255 / 0.5)',
      plate: '#4f4535',
      print: '#8a7d66',
      led: '#3f9d5a',
      key: '#f5f0e6',
      keyText: '#3a3327',
      keyEdge: '#b4a78c',
      fnKey: '#8c806a',
      fnText: '#fbf7ef',
      brk: '#b0412e',
      brkText: '#fff6ef',
      enter: '#5a6b7d',
      enterText: '#f6f3ec',
      legend: '#b0412e',
      bezel: '#6b6555',
      radius: 3,
      font: 'ui',
      keys: 'raised',
      glow: false,
      brackets: false,
      plateShown: true,
      bare: false,
    },
    lcd: { ground: '#c4c9b9', dot: '#23271e', shadow: '#a4a99a', flat: false },
  },
  night: {
    id: 'night',
    label: 'NIGHT',
    body: {
      face: '#232c38',
      edge: '#36424f',
      sheen: 'rgb(255 255 255 / 0.07)',
      plate: '#b9c7d8',
      print: '#71829a',
      led: '#59b7ff',
      key: '#344152',
      keyText: '#e2e9f2',
      keyEdge: '#151b23',
      fnKey: '#4c6687',
      fnText: '#eef4fb',
      brk: '#d0792e',
      brkText: '#fff7ef',
      enter: '#6f8fb6',
      enterText: '#0d1219',
      legend: '#7cc4ff',
      bezel: '#0d1219',
      radius: 3,
      font: 'ui',
      keys: 'raised',
      glow: false,
      brackets: false,
      plateShown: true,
      bare: false,
    },
    lcd: { ground: '#1c3d92', dot: '#eaf1ff', shadow: '#0e225d', flat: false },
  },
}

export const isSkinId = (value: unknown): value is SkinId =>
  typeof value === 'string' && (SKIN_IDS as readonly string[]).includes(value)
