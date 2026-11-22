import { MachineKeys } from '../../src/renderer/widgets/elec16/machine-keys.svelte.ts'
import type { Elec16Runner } from '../../src/renderer/widgets/elec16/runner.svelte.ts'

/**
 * A `MachineKeys` made inside an effect root, as the pane's component makes it, with its
 * options as state a test changes: whether the pane listens, and how the machine is typed to.
 */
export function machineKeysHost(
  runner: Elec16Runner,
  input: 'keyboard' | 'pad' | 'calc' = 'keyboard',
): {
  keys: MachineKeys
  setListening: (on: boolean) => void
  setInput: (next: 'keyboard' | 'pad' | 'calc') => void
  stop: () => void
} {
  const options = $state({ listening: true, input })
  let keys: MachineKeys | undefined
  const stop = $effect.root(() => {
    keys = new MachineKeys(runner, {
      listening: () => options.listening,
      input: () => options.input,
      seen: () => true,
    })
  })
  return {
    keys: keys as unknown as MachineKeys,
    setListening: (on) => {
      options.listening = on
    },
    setInput: (next) => {
      options.input = next
    },
    stop,
  }
}
