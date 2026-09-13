<script lang="ts">
import { sfx } from './stores/sound.svelte.ts'

/**
 * A button for an action that cannot be undone - quitting, resetting the layout.
 *
 * The first click arms it (red, "click again to …") and the second, within a few
 * seconds, acts; otherwise it disarms by itself. A stray click therefore never
 * ends every running shell.
 */
interface Props {
  label: string
  /** Shown while armed, after "click again to". */
  action: string
  title?: string
  testid: string
  onconfirm: () => void
}

const { label, action, title, testid, onconfirm }: Props = $props()

const CONFIRM_MS = 3000

let armed = $state(false)
let timer: ReturnType<typeof setTimeout> | null = null

function onclick(event: MouseEvent): void {
  event.stopPropagation()
  if (armed) {
    disarm()
    onconfirm()
    return
  }
  armed = true
  sfx.play('alarm')
  timer = setTimeout(disarm, CONFIRM_MS)
}

function disarm(): void {
  armed = false
  if (timer !== null) clearTimeout(timer)
  timer = null
}

$effect(() => disarm)
</script>

<button type="button" class="confirm" class:armed {title} {onclick} data-testid={testid}>
  {armed ? `click again to ${action}` : label}
</button>

<style>
.confirm {
  flex: 0 0 auto;
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  letter-spacing: inherit;
  text-transform: uppercase;
  cursor: pointer;
}

.confirm:hover,
.confirm:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
  outline: none;
}

.confirm.armed {
  color: var(--text-inverse);
  background: var(--danger);
  border-color: var(--danger);
}
</style>
