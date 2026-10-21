/**
 * The ELEC-16's skins (docs/elec16.md section 7): the body's colours and shape, its keys,
 * and the LCD's ground and dots - data, as themes are, with the colours the agreed mocks gave
 * them (docs/elec16-skins-mock for ALLOY, GRAPHITE, NEO, MOCHI and GLASS). ELEC, PLAIN and
 * GLASS follow the app's theme (GLASS its mode and accent); the others keep their own colours
 * whatever the theme. PLAIN is no pocket computer at all: no case, no plate, a flat screen
 * without the dots' gaps and shadows, and the app's own flat buttons for keys.
 * None copies a real product's.
 *
 * The body's colours go to CSS as variables on the device; the LCD's are read once into
 * RGB for the canvas (any CSS colour, a theme variable included).
 */

import { ELEC16_SKINS, type Elec16SkinId } from '@shared/elec16-units'
import type { Face } from './faces.ts'

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
    font: Face
    /**
     * Raised keys that go down when pressed, flat tiles that blink (ELEC, TRON), plain
     * rounded keys that darken (the Business skins, as their themes' buttons), low keys set in
     * their own cuts in the case (NEO, MOCHI), or capsules of glass (GLASS).
     */
    keys: 'raised' | 'flat' | 'plain' | 'chiclet' | 'glass'
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
    /**
     * The case modelled in light, from above and a little to the left: a lit chamfer and a
     * parting line, a sunk LCD and deck, keys with a side and a shadow, a lens for the lamp.
     */
    relief: boolean
    /** The case's material (skin-art.ts): a plain colour, or a picture made for the skin. */
    texture: 'none' | 'brushed' | 'grain' | 'grain-soft' | 'polka' | 'glass'
    /** Thin coloured rules along the plate's foot, top first. */
    stripes: readonly string[]
    /** The panel the keys stand on, in its own colour; none to stand them on the case. */
    deck: { fill: string; edge: string } | null
    /** The buzzer's openings beside POWER. */
    grille: 'none' | 'slits' | 'holes' | 'pills'
    /** The plate's letters pressed into the face. */
    plateEtched: boolean
    /** A sugar-glaze highlight on the keys' upper third (MOCHI). */
    gloss: boolean
    /** The colour shadows fall in, as `r g b`: black, or the case's own shade on a pink one. */
    shade: string
    /** The cut round a chiclet key, darker than the case. */
    well: string
    /** The keypad's keys (row.right's that are not functions). */
    padKey: string
    padText: string
    padLegend: string
    /**
     * One typeface for the keys, their shifted faces, the plate and the LCD's marks - as a real
     * machine is printed. Without it the shifted faces are the mono face and the plate and the
     * marks the UI face, as they always were.
     */
    oneFace: boolean
    keyWeight: number
    /** The function keys' and BRK's weight: light letters on dark keys look a step bolder. */
    fnWeight: number
    keyTrack: string
    fnTrack: string
    plateWeight: number
    plateTrack: string
    /** OpenType features for the keys' letters ('normal', or e.g. '"case"'). */
    keyFeatures: string
    /** The least a label is narrowed sideways to fit its key (round letters go oval sooner). */
    fitFloor: number
  }
  /**
   * The LCD, as CSS colours: its ground, a dot that is on, and a dot's shadow on the ground;
   * `flat` draws it as a plain screen - no gaps between the dots, no shadows, no sunk glass.
   */
  lcd: {
    ground: string
    dot: string
    shadow: string
    flat: boolean
    /** The unlit dots, faint, as a real LCD shows them (0 for none); only with the gaps. */
    unlit: number
    /** A reflection across the glass (relief skins). */
    glare: number
  }
}

/** What every skin before the five of 2026-10-22 draws: none of what they added. */
const TODAY = {
  relief: false,
  texture: 'none',
  stripes: [],
  deck: null,
  grille: 'none',
  plateEtched: false,
  gloss: false,
  shade: '0 0 0',
  oneFace: false,
  keyWeight: 600,
  fnWeight: 600,
  keyTrack: '0.04em',
  fnTrack: '0.1em',
  plateWeight: 700,
  plateTrack: '0.14em',
  keyFeatures: 'normal',
  fitFloor: 0.8,
} as const

/** The keypad as the letter keys, and a chiclet's cut, for the skins that have neither. */
const samePad = (key: string, text: string, legend: string) => ({
  padKey: key,
  padText: text,
  padLegend: legend,
  well: 'transparent',
})

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
      ...TODAY,
      ...samePad('transparent', 'var(--accent)', 'var(--warn)'),
    },
    lcd: {
      ground: 'var(--surface-0)',
      dot: 'var(--accent-strong)',
      shadow: 'var(--accent-faint)',
      flat: false,
      unlit: 0,
      glare: 0,
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
      ...TODAY,
      ...samePad('transparent', 'var(--accent)', 'var(--text-muted)'),
    },
    lcd: {
      ground: 'var(--surface-1)',
      dot: 'var(--accent)',
      shadow: 'var(--surface-1)',
      flat: true,
      unlit: 0,
      glare: 0,
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
      ...TODAY,
      ...samePad('transparent', TRON, '#e0b35a'),
    },
    lcd: {
      ground: '#02050a',
      dot: 'hsl(183 22% 86%)',
      shadow: 'hsl(183 30% 16%)',
      flat: false,
      unlit: 0,
      glare: 0,
    },
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
      ...TODAY,
      ...samePad('#ffffff', '#1a1a1a', '#005fb8'),
    },
    lcd: { ground: '#e8ebe6', dot: '#1b1b1b', shadow: '#c3c5c1', flat: false, unlit: 0, glare: 0 },
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
      ...TODAY,
      ...samePad('#3a3a3a', '#ffffff', '#60cdff'),
    },
    lcd: { ground: '#202020', dot: '#f3f3f3', shadow: '#101010', flat: false, unlit: 0, glare: 0 },
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
      ...TODAY,
      ...samePad('#3a3d43', '#ece9e1', '#e8a54a'),
    },
    lcd: { ground: '#a9b49a', dot: '#1c2217', shadow: '#87917b', flat: false, unlit: 0, glare: 0 },
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
      ...TODAY,
      ...samePad('#f5f0e6', '#3a3327', '#b0412e'),
    },
    lcd: { ground: '#c4c9b9', dot: '#23271e', shadow: '#a4a99a', flat: false, unlit: 0, glare: 0 },
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
      ...TODAY,
      ...samePad('#344152', '#e2e9f2', '#7cc4ff'),
    },
    lcd: { ground: '#1c3d92', dot: '#eaf1ff', shadow: '#0e225d', flat: false, unlit: 0, glare: 0 },
  },
  /**
   * The 80s' thin metal-panel machines: brushed metal, the plate's letters pressed in, one
   * amber rule, black keys on a sunk black deck. Light letters on dark keys at 500.
   */
  alloy: {
    id: 'alloy',
    label: 'ALLOY',
    body: {
      face: '#b9bcc1',
      edge: '#878b91',
      sheen: 'rgb(255 255 255 / 0.75)',
      plate: '#141518',
      print: '#464a50',
      led: '#36c45f',
      key: '#2c2e33',
      keyText: '#eeede8',
      keyEdge: '#0a0a0c',
      fnKey: '#4f535a',
      fnText: '#f4f3ef',
      brk: '#b9432a',
      brkText: '#fff3ec',
      enter: '#d68c2b',
      enterText: '#1a1208',
      legend: '#e9a94a',
      bezel: '#141518',
      radius: 2,
      font: 'barlow',
      keys: 'raised',
      glow: false,
      brackets: false,
      plateShown: true,
      bare: false,
      relief: true,
      texture: 'brushed',
      stripes: ['#d68c2b'],
      deck: { fill: '#17181b', edge: '#08080a' },
      grille: 'slits',
      plateEtched: true,
      gloss: false,
      shade: '0 0 0',
      well: 'transparent',
      padKey: '#2c2e33',
      padText: '#eeede8',
      padLegend: '#e9a94a',
      oneFace: true,
      keyWeight: 500,
      fnWeight: 500,
      keyTrack: '0.06em',
      fnTrack: '0.1em',
      plateWeight: 700,
      plateTrack: '0.12em',
      keyFeatures: 'normal',
      fitFloor: 0.8,
    },
    lcd: {
      ground: '#bcc0a8',
      dot: '#20241a',
      shadow: '#9b9f89',
      flat: false,
      unlit: 0.032,
      glare: 0.12,
    },
  },
  /**
   * The 90s' big many-function machines: a matte graphite moulding, light keys, a near-white
   * keypad, dark function keys; BRK the only colour (never a yellow ENTER or blue function
   * keys, the grammar of a product family).
   */
  graphite: {
    id: 'graphite',
    label: 'GRAPHITE',
    body: {
      face: '#3a4049',
      edge: '#535a65',
      sheen: 'rgb(255 255 255 / 0.10)',
      plate: '#e4e7eb',
      print: '#a9b0b9',
      led: '#52c873',
      key: '#c8ccd1',
      keyText: '#1b1e22',
      keyEdge: '#7a8089',
      fnKey: '#58626e',
      fnText: '#f2f4f7',
      brk: '#cf3b2f',
      brkText: '#fff4f2',
      enter: '#cbcfd4',
      enterText: '#1b1e22',
      legend: '#1f4a8f',
      bezel: '#1b1e23',
      radius: 3,
      font: 'plex',
      keys: 'raised',
      glow: false,
      brackets: false,
      plateShown: true,
      bare: false,
      relief: true,
      texture: 'grain',
      stripes: [],
      deck: { fill: '#23272e', edge: '#15181c' },
      grille: 'slits',
      plateEtched: false,
      gloss: false,
      shade: '0 0 0',
      well: 'transparent',
      padKey: '#e8e9eb',
      padText: '#1b1e22',
      padLegend: '#1f4a8f',
      oneFace: true,
      keyWeight: 600,
      fnWeight: 500,
      keyTrack: '0.02em',
      fnTrack: '0.06em',
      plateWeight: 700,
      plateTrack: '0.14em',
      keyFeatures: 'normal',
      fitFloor: 0.8,
    },
    lcd: {
      ground: '#b6c1c1',
      dot: '#16203a',
      shadow: '#97a3a5',
      flat: false,
      unlit: 0.032,
      glare: 0.1,
    },
  },
  /**
   * A pocket computer made today: a cool light-grey bead-blasted shell, low keys in their own
   * cuts, a memory-LCD-like paper screen, one colour (cobalt) and BRK's red.
   */
  neo: {
    id: 'neo',
    label: 'NEO',
    body: {
      face: '#d8dbdf',
      edge: '#bcc1c6',
      sheen: 'rgb(255 255 255 / 0.9)',
      plate: '#15171a',
      print: '#555b62',
      led: '#24b35c',
      key: '#f6f7f8',
      keyText: '#1a1c1f',
      keyEdge: '#b0b5bb',
      fnKey: '#e3e6e9',
      fnText: '#2a2d31',
      brk: '#c9382d',
      brkText: '#ffffff',
      enter: '#2353d8',
      enterText: '#ffffff',
      legend: '#2353d8',
      bezel: '#c9cdd2',
      radius: 6,
      font: 'interTight',
      keys: 'chiclet',
      glow: false,
      brackets: false,
      plateShown: true,
      bare: false,
      relief: true,
      texture: 'grain-soft',
      stripes: [],
      deck: null,
      grille: 'holes',
      plateEtched: false,
      gloss: false,
      shade: '0 0 0',
      well: '#a9aeb4',
      padKey: '#f6f7f8',
      padText: '#1a1c1f',
      padLegend: '#2353d8',
      oneFace: true,
      keyWeight: 500,
      fnWeight: 500,
      keyTrack: '0.03em',
      fnTrack: '0.02em',
      plateWeight: 600,
      plateTrack: '0.2em',
      // Brackets and the like at the capitals' height, as on a keytop.
      keyFeatures: '"case"',
      fitFloor: 0.8,
    },
    lcd: {
      ground: '#d7d9d3',
      dot: '#131513',
      shadow: '#c4c6c0',
      flat: false,
      unlit: 0.025,
      glare: 0.16,
    },
  },
  /**
   * Cute: sakura milk with white polka dots, round keys glazed like sweets in pastel groups,
   * a rounded face; no black anywhere (plum is the darkest), shadows in the case's own shade.
   * Every small print is 4.5:1 or more on its ground.
   */
  mochi: {
    id: 'mochi',
    label: 'MOCHI',
    body: {
      face: '#f5d9e2',
      edge: '#e6b4c4',
      sheen: 'rgb(255 255 255 / 0.9)',
      plate: '#b4466e',
      print: '#8f4664',
      led: '#34c98a',
      key: '#fffaf3',
      keyText: '#6a3a50',
      keyEdge: '#ecc6d2',
      fnKey: '#c8ead9',
      fnText: '#2d5c49',
      brk: '#ff7584',
      brkText: '#5a1426',
      enter: '#cbb8f5',
      enterText: '#3f2470',
      legend: '#b8326a',
      bezel: '#efc0cf',
      radius: 9,
      font: 'mplus',
      keys: 'chiclet',
      glow: false,
      brackets: false,
      plateShown: true,
      bare: false,
      relief: true,
      texture: 'polka',
      stripes: [],
      deck: null,
      grille: 'pills',
      plateEtched: true,
      gloss: true,
      shade: '120 40 70',
      well: '#ebc3d0',
      padKey: '#fff0b5',
      padText: '#6a3a50',
      padLegend: '#b8326a',
      oneFace: true,
      keyWeight: 700,
      fnWeight: 700,
      keyTrack: '0.02em',
      fnTrack: '0.04em',
      plateWeight: 800,
      plateTrack: '0.08em',
      keyFeatures: 'normal',
      // Round letters turn oval when narrowed: they narrow by 12% at most.
      fitFloor: 0.88,
    },
    lcd: {
      ground: '#f4e9da',
      dot: '#5a3150',
      shadow: '#e3d3c3',
      flat: false,
      unlit: 0.03,
      glare: 0.16,
    },
  },
  /**
   * A case of clear glass: a rim lit by direction, a clear band inside it, the machine's board
   * deep inside and out of focus, glass keys with a core that hides the board behind their
   * letters. It follows the theme's mode and accent (--gl-*, Device.svelte); ENTER is glass
   * tinted by the accent with the glass's own letters, readable whatever the accent.
   */
  glass: {
    id: 'glass',
    label: 'GLASS',
    body: {
      face: 'var(--gl-face)',
      edge: 'var(--gl-edge)',
      sheen: 'rgb(255 255 255 / 0.5)',
      plate: 'var(--gl-text)',
      print: 'var(--gl-print)',
      led: '#4fd27e',
      key: 'var(--gl-key)',
      keyText: 'var(--gl-text)',
      keyEdge: 'rgb(255 255 255 / 0.3)',
      fnKey: 'var(--gl-fn)',
      fnText: 'var(--gl-text)',
      brk: 'var(--gl-brk)',
      brkText: '#ffffff',
      enter: 'color-mix(in srgb, var(--accent) 28%, var(--gl-key))',
      enterText: 'var(--gl-text)',
      legend: 'var(--gl-legend)',
      bezel: 'var(--gl-bezel)',
      radius: 8,
      font: 'albert',
      keys: 'glass',
      glow: false,
      brackets: false,
      plateShown: true,
      bare: false,
      relief: true,
      texture: 'glass',
      stripes: [],
      deck: null,
      grille: 'pills',
      plateEtched: false,
      gloss: false,
      shade: '0 0 0',
      well: 'transparent',
      padKey: 'var(--gl-key)',
      padText: 'var(--gl-text)',
      padLegend: 'var(--gl-legend)',
      oneFace: true,
      keyWeight: 500,
      fnWeight: 500,
      keyTrack: '0.03em',
      fnTrack: '0.04em',
      plateWeight: 600,
      plateTrack: '0.2em',
      keyFeatures: 'normal',
      fitFloor: 0.8,
    },
    lcd: {
      ground: '#d5dadc',
      dot: '#12161a',
      shadow: '#bfc5c7',
      flat: false,
      unlit: 0.03,
      glare: 0.2,
    },
  },
}

export const isSkinId = (value: unknown): value is SkinId =>
  typeof value === 'string' && (SKIN_IDS as readonly string[]).includes(value)
