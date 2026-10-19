import type { KeybindingAction } from '@shared/keybindings'

/**
 * The workspace's shortcuts, for what runs them other than a key (docs/palette.md section
 * 4.1). The action palette reaches them through here rather than importing Workspace.svelte,
 * which hands over its own `run` while it is mounted: a row then does exactly what its key
 * does, through the same `shortcutApplies` and the same refusal while a dialog is open.
 */

export interface CommandRunner {
  /** Runs an action as its key would; false when it does not apply now. */
  run(action: KeybindingAction): boolean
  /** Whether it would do something now, with nothing over the workspace. */
  applies(action: KeybindingAction): boolean
}

let current: CommandRunner | null = null

export const commands: CommandRunner & {
  /** Hands over the runner; the function returned takes it back, if it is still this one. */
  provide(runner: CommandRunner): () => void
} = {
  run: (action) => current?.run(action) ?? false,
  applies: (action) => current?.applies(action) ?? false,
  provide(runner) {
    current = runner
    return () => {
      if (current === runner) current = null
    }
  },
}
