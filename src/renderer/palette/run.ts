import { KEYBINDING_ACTIONS, type KeybindingAction } from '@shared/keybindings'
import type { PaletteItem } from '@shared/palette'
import { commands } from '../lib/commands.ts'
import { appearance } from '../stores/appearance.svelte.ts'
import { layout } from '../stores/layout.svelte.ts'
import { sfx } from '../stores/sound.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'
import { resolveWidget } from '../widgets/registry.ts'
import { paneChoice } from './sources.ts'

/**
 * What choosing a palette row does (docs/palette.md section 5.3), through what already does it
 * elsewhere: an action and a preset as their keys do (`commands`), a layout as its number key
 * does, a theme as the status bar's theme button does, a pane as the picker would place it
 * (Q5), a settings section as the dialog opens at one. The palette has closed by then.
 */

/** Each says whether the row went: false (or a promise of false) when it did nothing after all. */
type Went = boolean | Promise<boolean>

export interface PaletteTargets {
  action(id: KeybindingAction): Went
  layout(id: string): Went
  theme(id: string): Went
  pane(widget: string): Went
  settings(section: string): Went
}

const isAction = (id: string): id is KeybindingAction => KEYBINDING_ACTIONS.some((a) => a.id === id)

/**
 * Sends a row to its target by its kind, with the id its key carries after the kind, and says
 * whether it went: what was offered may have changed between the drawing and the Enter (a
 * shortcut no longer applying, a layout switch answered no), and a row that did nothing is not
 * remembered as run.
 */
export function dispatch(item: PaletteItem, targets: PaletteTargets): Went {
  const id = item.key.slice(item.kind.length + 1)
  switch (item.kind) {
    case 'action':
      return isAction(id) && targets.action(id)
    case 'preset': {
      const action = `layout.preset.${id}`
      return isAction(action) && targets.action(action)
    }
    case 'layout':
      return targets.layout(id)
    case 'theme':
      return targets.theme(id)
    case 'pane':
      return targets.pane(id)
    case 'settings':
      return targets.settings(id)
  }
}

export const storeTargets: PaletteTargets = {
  action: (id) => commands.run(id),
  // The question about the shells is the switch's own (`mayReplace`).
  layout: (id) => layout.saved.switchTo(id),
  theme: (id) => {
    void appearance.patch({ theme: id }).then(() => sfx.play('theme'))
    return true
  },
  pane: (widget) => {
    const definition = resolveWidget(widget)
    if (definition === null) return false
    const choice = paneChoice(definition, definition.multiple ? null : layout.paneWith(widget))
    if (choice.kind === 'focus') layout.focus(choice.paneId)
    else if (choice.kind === 'add') layout.addPane(widget, choice.placement)
    else if (choice.kind === 'popup') ui.openPopup(widget)
    return choice.kind !== 'none'
  },
  settings: (section) => {
    ui.openSettings(section)
    return true
  },
}
