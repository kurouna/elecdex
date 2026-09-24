import { defaultLayoutNode, SYSTEM_COLUMN_WIDTH, systemColumn } from './default-layout.js'
import { pane, split, tabs } from './layout-ops.js'
import {
  KEYED_LAYOUTS,
  MAX_SAVED_LAYOUTS,
  type SavedLayout,
  type SavedLayoutSummary,
} from './layouts.js'
import { LAYOUT_VERSION, type LayoutNode, type LayoutTree } from './schemas/layout.js'

/**
 * Layout presets: arrangements for a purpose, built in (architecture.md §5.6).
 *
 * A preset is a template, never a second kind of layout. Choosing one adds a
 * saved layout made from it and goes there; from then on it is a saved layout
 * like any other - it has a number key, and it follows the work (user decision
 * 2026-09-20) - and it only remembers which preset it came from, so that it can
 * be put back to it and so that the preset is not added twice.
 *
 * Every preset keeps the default layout's system column at the same width and
 * heights, so a switch between them changes the stage and leaves the
 * instruments where the eye expects them. A preset turns nothing on: Starlink,
 * quake alerts and the like stay the user's to opt into.
 *
 * Everything here is pure: main and the page both call it, and the tests do.
 */

export const LAYOUT_PRESET_IDS = ['standard', 'network', 'earth', 'dev', 'media', 'desk'] as const
export type LayoutPresetId = (typeof LAYOUT_PRESET_IDS)[number]

export interface LayoutPreset {
  id: LayoutPresetId
  /** Also the name the saved layout made from it starts with. */
  name: string
  /** One line, for the preset's card in the LAYOUTS dialog. */
  description: string
  /** A fresh tree each time, with ids of its own. */
  build: () => LayoutNode
}

/** The rest of the width after the system column, shared out by `stage`. */
const STAGE = 1 - SYSTEM_COLUMN_WIDTH

/** The system column, then the stage's columns at their shares of the rest. */
function withSystemColumn(stage: LayoutNode[], shares: number[]): LayoutNode {
  return split(
    'row',
    [systemColumn(), ...stage],
    [SYSTEM_COLUMN_WIDTH, ...shares.map((share) => share * STAGE)],
  )
}

const shells = (count: number): LayoutNode =>
  tabs(Array.from({ length: count }, () => pane('terminal')))

export const LAYOUT_PRESETS: readonly LayoutPreset[] = [
  {
    id: 'standard',
    name: 'standard',
    description: 'the machine, its shells and the world outside, as elecdex first opens',
    build: defaultLayoutNode,
  },
  {
    // The globe near square, where it draws largest; the socket table beside it;
    // a wide shell beneath for ping and traceroute. Status and traffic are in
    // the system column already.
    id: 'network',
    name: 'network',
    description: 'who this machine talks to, and where in the world they are',
    build: () =>
      withSystemColumn(
        [
          split(
            'column',
            [split('row', [pane('globe'), pane('connections')], [0.45, 0.55]), shells(2)],
            [0.66, 0.34],
          ),
        ],
        [1],
      ),
  },
  {
    // Not "orbit", which is the name of the pane at its centre. At this width the
    // ORBIT map is drawn at its own proportions with little to spare at 1920x1080.
    id: 'earth',
    name: 'earth',
    description: 'stations overhead, the ground shaking below, and the sky',
    build: () =>
      withSystemColumn(
        [
          split('column', [pane('orbit'), pane('terminal')], [0.74, 0.26]),
          split('column', [pane('globe'), pane('quakes'), pane('weather')], [0.34, 0.36, 0.3]),
        ],
        [0.756, 0.244],
      ),
  },
  {
    // The git pane has the full height, which its diff needs; the shells are where
    // the agents the pane above them reads are run.
    id: 'dev',
    name: 'dev',
    description: 'coding agents at work, and the repository they change',
    build: () =>
      withSystemColumn(
        [split('column', [pane('agents'), shells(2)], [0.56, 0.44]), pane('git')],
        [0.415, 0.585],
      ),
  },
  {
    // YouTube's television interface near 16:9, the spectrum under it dancing to
    // its sound; X and the feeds stacked as tabs down the side, X in front.
    id: 'media',
    name: 'media',
    description: 'watch, scroll, and see the sound',
    build: () =>
      withSystemColumn(
        [
          split(
            'column',
            [pane('web.youtubetv'), split('row', [pane('spectrum'), pane('mixer')], [0.66, 0.34])],
            [0.62, 0.38],
          ),
          tabs([pane('web.x'), pane('rss')]),
        ],
        [0.695, 0.305],
      ),
  },
  {
    // Stationery: a notebook open on the left, with a timer and a calculator
    // below it; the list of things to do and the calendar on the right. No
    // shell - the one preset for writing, counting and keeping time.
    id: 'desk',
    name: 'desk',
    description: 'notes, tasks, a calendar, a timer and a calculator',
    build: () =>
      withSystemColumn(
        [
          split(
            'column',
            [pane('notes'), split('row', [pane('timer'), pane('calc')])],
            [0.64, 0.36],
          ),
          split('column', [pane('todo'), pane('calendar')], [0.58, 0.42]),
        ],
        [0.49, 0.51],
      ),
  },
]

export function presetById(id: unknown): LayoutPreset | null {
  return LAYOUT_PRESETS.find((preset) => preset.id === id) ?? null
}

export function presetTree(preset: LayoutPreset): LayoutTree {
  return { version: LAYOUT_VERSION, root: preset.build() }
}

/**
 * A name no saved layout has: the preset's own, or with a number after it when
 * the user already keeps a layout of their own by that name. Two rows with one
 * name could not be told apart, and saving under it would be ambiguous.
 */
export function freeLayoutName(items: readonly { name: string }[], base: string): string {
  const taken = new Set(items.map((item) => item.name))
  if (!taken.has(base)) return base
  for (let n = 2; ; n += 1) {
    const name = `${base} ${n}`
    if (!taken.has(name)) return name
  }
}

/** The saved layout already made from a preset, if there is one. */
export function layoutFromPreset<T extends { preset?: string | null | undefined }>(
  items: readonly T[],
  presetId: string,
): T | null {
  return items.find((item) => item.preset === presetId) ?? null
}

/**
 * The list once a preset is among the saved layouts, and the id of its entry.
 *
 * One already made from it is returned as it is, never replaced or added again:
 * it holds the work done in it since. Null when the preset does not exist or the
 * list is full, so the caller can say so.
 */
export function withPresetLayout(
  items: readonly SavedLayout[],
  presetId: unknown,
  newId: string,
): { items: SavedLayout[]; id: string } | null {
  const preset = presetById(presetId)
  if (preset === null) return null
  const existing = layoutFromPreset(items, preset.id)
  if (existing !== null) return { items: [...items], id: existing.id }
  if (items.length >= MAX_SAVED_LAYOUTS) return null
  const entry: SavedLayout = {
    id: newId,
    name: freeLayoutName(items, preset.name),
    tree: presetTree(preset),
    preset: preset.id,
  }
  return { items: [...items, entry], id: newId }
}

/**
 * The list with one layout put back to the preset it was made from, keeping its
 * name and its place. Null when there is no such layout, or it was not made
 * from a preset this build knows.
 */
export function withPresetRestored(
  items: readonly SavedLayout[],
  id: unknown,
): SavedLayout[] | null {
  const at = items.findIndex((item) => item.id === id)
  const preset = presetById(items[at]?.preset)
  if (at < 0 || preset === null) return null
  return items.map((item, i) => (i === at ? { ...item, tree: presetTree(preset) } : item))
}

/**
 * The saved layouts of a first start: every preset, in order, so the number keys
 * and the status bar have something on them from the first minute. Only for an
 * install with neither file yet; an existing user's list and its keys are theirs
 * and are never added to (user decision 2026-09-24).
 */
export function seededLayouts(makeId: (taken: readonly SavedLayout[]) => string): SavedLayout[] {
  const items: SavedLayout[] = []
  for (const preset of LAYOUT_PRESETS) {
    items.push({
      id: makeId(items),
      name: preset.name,
      tree: presetTree(preset),
      preset: preset.id,
    })
  }
  return items
}

/** A preset as the dialog's shelf shows it: whether it is kept, and on which key. */
export interface PresetCard {
  id: LayoutPresetId
  name: string
  description: string
  /** The saved layout made from it, or null when it is not among them. */
  savedId: string | null
  /** The number key that applies that layout, or null for none. */
  slot: number | null
  /** That layout is the one being worked in. */
  active: boolean
}

/** What a card says about where the preset stands among the saved layouts. */
export function presetBadge(card: PresetCard): string {
  if (card.active) return 'in this one'
  if (card.slot !== null) return `on ${card.slot}`
  return card.savedId !== null ? 'kept' : '+ add'
}

export function presetCards(saved: readonly SavedLayoutSummary[]): PresetCard[] {
  return LAYOUT_PRESETS.map((preset) => {
    const at = saved.findIndex((entry) => entry.preset === preset.id)
    const entry = saved[at]
    return {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      savedId: entry?.id ?? null,
      slot: entry !== undefined && at < KEYED_LAYOUTS ? at + 1 : null,
      active: entry?.active ?? false,
    }
  })
}
