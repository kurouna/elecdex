<script lang="ts">
import { updates } from './stores/updates.svelte.ts'

/**
 * A small notice in the bottom-right corner when a newer release exists. The
 * status bar is usually hidden and fullscreen has no title bar, so this is the
 * one place it is sure to be seen. It opens the release page; nothing is
 * downloaded by the app.
 */
$effect(() => {
  updates.init()
})

const available = $derived(
  updates.status.state === 'available' && updates.dismissed !== updates.status.latest
    ? updates.status
    : null,
)
</script>

{#if available}
  <div class="notice crt-on" role="status" data-testid="update-notice">
    <button
      type="button"
      class="open"
      title={available.url}
      onclick={() => void window.elecdex.system.openExternal(available.url)}
    >
      elecdex {available.latest} is available
    </button>
    <button
      type="button"
      class="close"
      aria-label="dismiss"
      onclick={() => (updates.dismissed = available.latest)}
      data-testid="update-notice-dismiss">×</button
    >
  </div>
{/if}

<style>
.notice {
  --crt-duration: 300ms;
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: 800;
  display: flex;
  align-items: center;
  border: 1px solid var(--accent);
  background: var(--app-bg);
  box-shadow: 0 0 12px var(--accent-dim);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

button {
  padding: var(--space-1) var(--space-3);
  border: 0;
  background: transparent;
  color: var(--accent-strong);
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}

.open:hover {
  background: var(--accent-faint);
}

.close {
  padding: var(--space-1) var(--space-2);
  border-left: 1px solid var(--panel-border);
  color: var(--text-muted);
}

.close:hover {
  color: var(--accent);
}
</style>
