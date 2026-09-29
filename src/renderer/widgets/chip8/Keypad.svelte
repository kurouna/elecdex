<script lang="ts">
import { KEYPAD_LAYOUT } from '@shared/chip8/keys'
import type { Chip8Runner } from './runner.svelte.ts'

/**
 * The COSMAC VIP's keypad (docs/architecture.md section 5.18), with the keyboard key on
 * each. A pad the program has asked about is lit; one held down is filled. It presses
 * with the pointer too, for a pad nobody can find on the keyboard.
 */
const { runner }: { runner: Chip8Runner } = $props()

const label = (code: string): string => code.replace(/^Digit|^Key/, '')

/** The pad the pointer holds, let go when the pointer leaves or lifts anywhere. */
let held: number | null = null

function down(key: number, event: PointerEvent): void {
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  held = key
  runner.press(key)
}

function up(): void {
  if (held === null) return
  runner.release(held)
  held = null
}
</script>

<div class="keypad" role="group" aria-label="keypad" data-testid="chip8-keypad">
  {#each KEYPAD_LAYOUT as row, r (r)}
    {#each row as pad (pad.key)}
      <button
        type="button"
        tabindex="-1"
        class="pad"
        class:sensed={(runner.sensed & (1 << pad.key)) !== 0}
        class:down={(runner.keys & (1 << pad.key)) !== 0}
        onpointerdown={(e) => down(pad.key, e)}
        onpointerup={up}
        onpointercancel={up}
        onlostpointercapture={up}
        aria-label="key {pad.key.toString(16).toUpperCase()}"
        data-testid="chip8-pad"
        data-key={pad.key}
      >
        <span class="hex">{pad.key.toString(16).toUpperCase()}</span>
        <span class="pc">{label(pad.code)}</span>
      </button>
    {/each}
  {/each}
</div>

<style>
.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 3px;
}

.pad {
  position: relative;
  height: 1.9rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step-0);
  cursor: pointer;
  touch-action: none;
}

.pad .pc {
  position: absolute;
  right: 3px;
  bottom: 0;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  opacity: 0.75;
}

.pad.sensed {
  color: var(--text);
  border-color: var(--panel-border);
}

.pad.down {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}
</style>
