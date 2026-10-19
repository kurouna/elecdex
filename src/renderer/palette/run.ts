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

export interface PaletteTargets {
  action(id: KeybindingAction): void
  layout(id: string): void
  theme(id: string): void
  pane(widget: string): void
  settings(section: string): void
}

const isAction = (id: string): id is KeybindingAction => KEYBINDING_ACTIONS.some((a) => a.id === id)

/** Sends a row to its target by its kind, with the id its key carries after the kind. */
export function dispatch(item: PaletteItem, targets: PaletteTargets): void {
  const id = item.key.slice(item.kind.length + 1)
  switch (item.kind) {
    case 'action':
      if (isAction(id)) targets.action(id)
      return
    case 'preset': {
      const action = `layout.preset.${id}`
      if (isAction(action)) targets.action(action)
      return
    }
    case 'layout':
      targets.layout(id)
      return
    case 'theme':
      targets.theme(id)
      return
    case 'pane':
      targets.pane(id)
      return
    case 'settings':
      targets.settings(id)
      return
  }
}

export const storeTargets: PaletteTargets = {
  action: (id) => void commands.run(id),
  // The question about the shells is the switch's own (`mayReplace`).
  layout: (id) => void layout.switchTo(id),
  theme: (id) => void appearance.patch({ theme: id }).then(() => sfx.play('theme')),
  pane: (widget) => {
    const definition = resolveWidget(widget)
    if (definition === null) return
    const choice = paneChoice(definition, definition.multiple ? null : layout.paneWith(widget))
    if (choice.kind === 'focus') layout.focus(choice.paneId)
    else if (choice.kind === 'add') layout.addPane(widget, choice.placement)
    else if (choice.kind === 'popup') ui.openPopup(widget)
  },
  settings: (section) => ui.openSettings(section),
}
