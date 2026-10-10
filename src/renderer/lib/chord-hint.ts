import { actionChord, type KeybindingAction, withChord } from '@shared/keybindings'
import { appearance } from '../stores/appearance.svelte.ts'

/**
 * A button's tooltip naming the shortcut that does the same, as it is bound now
 * (shared/keybindings.ts): "Close pane (Ctrl+Shift+W)", or the words alone when
 * the action is unbound. Read in a template, it follows a rebinding at once.
 */
export function chordHint(text: string, action: KeybindingAction): string {
  // Without the bridge's platform (a component test) no chord can be named surely.
  const platform = window.elecdex?.system?.platform
  if (platform === undefined) return text
  return withChord(text, actionChord(action, appearance.settings.keybindings, platform))
}
