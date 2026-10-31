import type { KEYBINDING_ACTIONS } from '../../../src/shared/keybindings.js'

/**
 * The keybindings contract's table (docs/e2e-design.md, section 3.2): one row per page action
 * of src/shared/keybindings.ts - every action but the system-wide ones, which main registers
 * with the OS and the page never receives. tests/unit/e2e-keybindings-contract.test.ts holds it
 * to that file, so an action added there and not here fails before any e2e runs.
 *
 * A row says in which world the contract presses its default chord, or why it is not pressed
 * there and which test presses it instead. What a pressed row must do is written beside its
 * world in keybindings.spec.ts, typed from this table, so a workspace row without a check does
 * not compile.
 */

type Action = (typeof KEYBINDING_ACTIONS)[number]

/** The actions main registers with the OS: never the page's to run. */
export type GlobalAction = Extract<Action, { scope: 'global' }>['id']

/** Every action the page runs when its chord is pressed. */
export type PageAction = Exclude<Action['id'], GlobalAction>

export type KeyRow =
  /** Pressed in the workspace of four panes, which is put back before every row. */
  | { world: 'workspace' }
  /** Pressed over eleven saved layouts, the ten in the slots and one more to start from. */
  | { world: 'slots' }
  /** Pressed in an app with no saved layout, going from one preset to the next. */
  | { world: 'presets' }
  /**
   * Not pressed by the contract, with the reason, and the spec and test that press it: the
   * one app the contract runs could not go on after it.
   */
  | { elsewhere: { spec: string; test: string; why: string } }

export const KEY_ROWS = {
  'pane.add': { world: 'workspace' },
  'pane.splitRight': { world: 'workspace' },
  'pane.splitDown': { world: 'workspace' },
  'pane.newTab': { world: 'workspace' },
  'pane.close': { world: 'workspace' },
  'pane.zoom': { world: 'workspace' },
  'focus.next': { world: 'workspace' },
  'focus.previous': { world: 'workspace' },
  'focus.left': { world: 'workspace' },
  'focus.right': { world: 'workspace' },
  'focus.up': { world: 'workspace' },
  'focus.down': { world: 'workspace' },
  'layout.reset': { world: 'workspace' },
  'layout.saved': { world: 'workspace' },
  'layout.saved1': { world: 'slots' },
  'layout.saved2': { world: 'slots' },
  'layout.saved3': { world: 'slots' },
  'layout.saved4': { world: 'slots' },
  'layout.saved5': { world: 'slots' },
  'layout.saved6': { world: 'slots' },
  'layout.saved7': { world: 'slots' },
  'layout.saved8': { world: 'slots' },
  'layout.saved9': { world: 'slots' },
  'layout.saved10': { world: 'slots' },
  'layout.preset.standard': { world: 'presets' },
  'layout.preset.network': { world: 'presets' },
  'layout.preset.earth': { world: 'presets' },
  'layout.preset.dev': { world: 'presets' },
  'layout.preset.media': { world: 'presets' },
  'layout.preset.desk': { world: 'presets' },
  'layout.preset.ai': { world: 'presets' },
  'layout.preset.cockpit': { world: 'presets' },
  'layout.preset.retro': { world: 'presets' },
  'layout.preset.blank': { world: 'presets' },
  'launcher.focus': { world: 'workspace' },
  'utility.focus': { world: 'workspace' },
  'shell.focus': { world: 'workspace' },
  'shell.find': { world: 'workspace' },
  'shell.clear': { world: 'workspace' },
  'shell.fontBigger': { world: 'workspace' },
  'shell.fontSmaller': { world: 'workspace' },
  'tab.next': { world: 'workspace' },
  'tab.previous': { world: 'workspace' },
  'shell.next': { world: 'workspace' },
  'shell.previous': { world: 'workspace' },
  'settings.open': { world: 'workspace' },
  'palette.open': { world: 'workspace' },
  'window.fullscreen': { world: 'workspace' },
  'window.minimize': {
    elsewhere: {
      spec: 'app/chrome.spec.ts',
      test: 'Ctrl+Shift+M minimizes the window, even with a shell focused',
      why: 'a minimised window needs a window manager to come back from (a bare Xvfb has none)',
    },
  },
  'app.quit': {
    elsewhere: {
      spec: 'app/exit.spec.ts',
      test: 'Ctrl+Shift+Q asks first, even with a terminal focused: no stays, yes quits',
      why: 'it ends the one app every other row runs in',
    },
  },
} as const satisfies Record<PageAction, KeyRow>

/** The actions pressed in `world`. */
export type InWorld<W extends string> = {
  [K in keyof typeof KEY_ROWS]: (typeof KEY_ROWS)[K] extends { world: W } ? K : never
}[keyof typeof KEY_ROWS]

/** Playwright's name for a chord of keybindings.ts: "Ctrl+Shift+KeyA" -> "Control+Shift+KeyA". */
export const pressable = (chord: string): string =>
  chord
    .split('+')
    .map((part) => (part === 'Ctrl' ? 'Control' : part))
    .join('+')
