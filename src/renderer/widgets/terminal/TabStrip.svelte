<script lang="ts">
import { sessions } from '../../stores/sessions.svelte.ts'

/** Shows the cwd compactly: the last two segments are enough to orient. */
function shortCwd(cwd: string | null): string {
  if (cwd === null) return ''
  const parts = cwd.split(/[\\/]/).filter((p) => p !== '')
  if (parts.length <= 2) return cwd
  return `…/${parts.slice(-2).join('/')}`
}
</script>

<ul class="tabs" data-testid="tab-strip">
  {#each sessions.tabs as tab (tab.key)}
    <li>
      <button
        type="button"
        class="tab"
        class:active={tab.key === sessions.activeKey}
        class:exited={tab.exited !== null}
        onclick={() => sessions.focus(tab.key)}
        data-testid="tab"
      >
        <span class="name">{tab.title}</span>
        {#if tab.cwd !== null}
          <span class="cwd">{shortCwd(tab.cwd)}</span>
        {:else if tab.integrationPending}
          <span class="cwd dim">…</span>
        {:else}
          <span class="cwd dim">no tracking</span>
        {/if}
        {#if tab.lastCommand !== null && tab.lastCommand.exitCode !== null && tab.lastCommand.exitCode !== 0}
          <span class="code">{tab.lastCommand.exitCode}</span>
        {/if}
      </button>
      <button
        type="button"
        class="close"
        aria-label={`Close ${tab.title}`}
        onclick={() => sessions.close(tab.key)}
        data-testid="tab-close">×</button
      >
    </li>
  {/each}
  <li>
    <button
      type="button"
      class="new"
      aria-label="New terminal"
      onclick={() => sessions.open()}
      data-testid="tab-new">+</button
    >
  </li>
</ul>

<style>
.tabs {
  display: flex;
  align-items: stretch;
  gap: var(--space-1);
  list-style: none;
  min-height: 28px;
  padding: 0 var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
  border-bottom: 1px solid var(--panel-rule);
}

.tabs > li {
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
}

.tab {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding: 0 var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  transition: color var(--dur-fast) var(--ease-out);
  white-space: nowrap;
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  color: var(--text);
  border-bottom-color: var(--accent);
  background: var(--accent-faint);
}

.tab.exited .name {
  text-decoration: line-through;
}

.cwd {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.8;
}

.cwd.dim {
  opacity: 0.45;
}

.code {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--danger);
}

.close,
.new {
  padding: 0 var(--space-2);
  color: var(--text-muted);
  font-size: var(--step-0);
  line-height: 1;
}

.close:hover {
  color: var(--danger);
}

.new:hover {
  color: var(--text);
}
</style>
