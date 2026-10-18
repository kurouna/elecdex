<script lang="ts">
import type { Snippet } from 'svelte'
import { faultText, reportFault } from '../lib/fault-report.ts'

/**
 * Around every built-in widget, in the layout and popped up: a throw while it
 * draws or in one of its effects is said as a toast (lib/fault-report.ts) and
 * the pane shows what stopped it, with a way to start it again - never a blank
 * pane, and never the rest of the workspace taken down with it.
 */

interface Props {
  /** The widget's title, which the toast and the report name. */
  source: string
  children: Snippet
}

const { source, children }: Props = $props()
</script>

<svelte:boundary onerror={(error) => reportFault(source.toUpperCase(), error)}>
  {@render children()}
  {#snippet failed(error, reset)}
    <div class="fault" data-testid="pane-fault">
      <span>THE PANE STOPPED</span>
      <small>{faultText(error)}</small>
      <button type="button" onclick={reset} data-testid="pane-fault-retry">RETRY</button>
    </div>
  {/snippet}
</svelte:boundary>

<style>
.fault {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 100%;
  font-family: var(--font-display);
  font-size: var(--step-1);
  letter-spacing: var(--tracking-wider);
  color: var(--danger);
}

.fault small {
  max-width: 90%;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0;
  color: var(--text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fault button {
  padding: 0.2rem 0.8rem;
  border: 1px solid var(--accent-dim);
  background: transparent;
  font: inherit;
  font-size: var(--step--1);
  color: var(--accent);
  cursor: pointer;
}

.fault button:hover,
.fault button:focus-visible {
  background: var(--accent-faint);
}
</style>
