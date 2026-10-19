import {
  availableOn,
  formatChord,
  isGlobal,
  KEYBINDING_ACTIONS,
  type KeybindingAction,
} from '@shared/keybindings'
import { layoutFromPreset } from '@shared/layout-presets'
import { KEYED_LAYOUTS, type SavedLayoutSummary } from '@shared/layouts'
import {
  ACTION_DETAIL,
  type ArmFacts,
  armsFirst,
  type PaletteItem,
  type PaletteState,
  UNAVAILABLE_REASON,
} from '@shared/palette'
import {
  type PickedWidget,
  type PickerChoice,
  pickerChoice,
  pickerRowState,
} from '../layout/popup.js'

/**
 * Where the action palette's rows come from (docs/palette.md section 5.1): one function a
 * kind, each given plain values rather than reading a store, so a unit test can hold them.
 * ActionPalette.svelte gathers the values from the stores while it is open.
 */

type Bindings = Readonly<Record<KeybindingAction, string | null>>
type Labels = Readonly<Record<string, string>>

const READY: PaletteState = { kind: 'ready' }
const CURRENT: PaletteState = { kind: 'current' }

const row = (
  fields: Omit<PaletteItem, 'note' | 'arm' | 'chord' | 'state'> & Partial<PaletteItem>,
) => ({ chord: null, note: null, state: READY, arm: false, ...fields }) satisfies PaletteItem

const chordOf = (bindings: Bindings, action: string, labels: Labels): string | null => {
  const chord = (bindings as Readonly<Record<string, string | null>>)[action] ?? null
  return chord === null ? null : formatChord(chord, labels)
}

/** The palette's own key, and the slots and presets, which are rows of their own kinds. */
const NOT_AN_ACTION_ROW = /^(palette\.open|layout\.saved\d+|layout\.preset\..+)$/

export interface ActionSource {
  platform: NodeJS.Platform
  /** The chords in effect (`effectiveBindings`). */
  bindings: Bindings
  /** How this keyboard prints its keys (lib/key-labels). */
  labels: Labels
  /** Whether the action does something now, as the workspace would decide on its key. */
  applies: (action: KeybindingAction) => boolean
  arm: ArmFacts
}

/** The shortcuts' actions the page runs, each with its chord as bound now. */
export function actionItems(source: ActionSource): PaletteItem[] {
  return KEYBINDING_ACTIONS.filter(
    (a) => !isGlobal(a.id) && !NOT_AN_ACTION_ROW.test(a.id) && availableOn(a.id, source.platform),
  ).map((a) =>
    row({
      key: `action:${a.id}`,
      kind: 'action',
      label: a.label,
      detail: ACTION_DETAIL[a.id] ?? '',
      words: [a.id],
      chord: chordOf(source.bindings, a.id, source.labels),
      state: source.applies(a.id)
        ? READY
        : { kind: 'off', reason: UNAVAILABLE_REASON[a.id] ?? 'not now' },
      arm: armsFirst(a.id, source.arm),
    }),
  )
}

/** The saved layouts, the first `KEYED_LAYOUTS` on their number keys, the one in use current. */
export function layoutItems(
  saved: readonly SavedLayoutSummary[],
  bindings: Bindings,
  labels: Labels,
): PaletteItem[] {
  return saved.map((entry, i) =>
    row({
      key: `layout:${entry.id}`,
      kind: 'layout',
      label: entry.name,
      detail:
        entry.preset === null
          ? 'a saved layout'
          : `a saved layout, from the ${entry.preset} preset`,
      words: ['layout'],
      chord: i < KEYED_LAYOUTS ? chordOf(bindings, `layout.saved${i + 1}`, labels) : null,
      state: entry.active ? CURRENT : READY,
    }),
  )
}

export interface PresetLike {
  id: string
  name: string
  description: string
}

/** The presets on their keys: to the layout made from one, or a new layout from it. */
export function presetItems(
  presets: readonly PresetLike[],
  saved: readonly SavedLayoutSummary[],
  bindings: Bindings,
  labels: Labels,
): PaletteItem[] {
  return presets.map((preset) => {
    const made = layoutFromPreset(saved, preset.id)
    return row({
      key: `preset:${preset.id}`,
      kind: 'preset',
      label: preset.name,
      detail: made === null ? `adds a layout: ${preset.description}` : `goes to “${made.name}”`,
      words: ['preset', 'layout'],
      chord: chordOf(bindings, `layout.preset.${preset.id}`, labels),
      // Its layout in use: going there would do nothing (`switchTo` refuses the active one).
      state: made?.active === true ? CURRENT : READY,
    })
  })
}

export interface ThemeLike {
  id: string
  name: string
  author?: string | undefined
  mode?: 'dark' | 'light' | undefined
}

/** The themes, built in and the user's, the one in use (`appearance.theme`) current. */
export function themeItems(themes: readonly ThemeLike[], currentId: string): PaletteItem[] {
  return themes.map((theme) => {
    const mode = theme.mode === 'light' ? 'light' : 'dark'
    return row({
      key: `theme:${theme.id}`,
      kind: 'theme',
      label: theme.name,
      detail:
        theme.author === undefined || theme.author === 'elecdex'
          ? `a ${mode} theme`
          : `a ${mode} theme by ${theme.author}`,
      words: ['theme', theme.id, mode],
      state: theme.id === currentId ? CURRENT : READY,
    })
  })
}

export interface WidgetLike extends PickedWidget {
  id: string
  title: string
  pickerTitle?: string | undefined
  description?: string | undefined
  multiple?: boolean | undefined
  plugin?: boolean | undefined
  unlisted?: boolean | undefined
}

/**
 * Where a pane row puts its widget (docs/palette.md Q5): popped up where it can be, else right
 * of the focused pane; one already on screen is focused, as the picker does.
 */
export function paneChoice(widget: WidgetLike, onScreen: string | null): PickerChoice {
  return pickerChoice(widget, widget.popup === true ? 'popup' : 'right', onScreen)
}

/**
 * The widgets the picker offers, saying what Enter does. `onScreen` is the layout's pane of a
 * widget; a widget that may be added again is never sent to its pane, as in the picker.
 */
export function paneItems(
  widgets: readonly WidgetLike[],
  onScreen: (widget: WidgetLike) => string | null,
  usable: (widget: WidgetLike) => boolean,
): PaletteItem[] {
  return widgets
    .filter((w) => !w.unlisted && (!w.plugin || usable(w)))
    .map((w) => {
      const choice = paneChoice(w, w.multiple ? null : onScreen(w))
      return row({
        key: `pane:${w.id}`,
        kind: 'pane',
        label: w.pickerTitle ?? w.title,
        detail: w.description ?? '',
        words: ['pane', w.id, ...(w.plugin ? ['plugin'] : [])],
        note: pickerRowState(choice, w.multiple),
      })
    })
}

/** The settings dialog's sections, each opening it there. */
export function settingsItems(sections: readonly { id: string; label: string }[]): PaletteItem[] {
  return sections.map((section) =>
    row({
      key: `settings:${section.id}`,
      kind: 'settings',
      label: `Settings: ${section.label}`,
      detail: `opens the settings at ${section.label}`,
      words: ['settings', 'preferences'],
    }),
  )
}
