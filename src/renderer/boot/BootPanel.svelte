<script lang="ts">
import type { AppInfo } from '@shared/api'

interface Props {
  info: AppInfo | null
  error: string | null
}

const { info, error }: Props = $props()

const rows = $derived(
  info === null
    ? []
    : [
        ['build', `${info.name} ${info.version}${info.isPackaged ? '' : ' (dev)'}`],
        ['host', `${info.platform} ${info.arch}`],
        ['electron', info.versions.electron],
        ['chromium', info.versions.chrome],
        ['node', info.versions.node],
      ],
)
</script>

<section class="frame" data-notch="tr bl" data-testid="boot-panel">
  <header class="frame-title">
    <span>elecdex</span>
    <span>system bootstrap</span>
  </header>

  <div class="body">
    <h1>elecdex</h1>
    <p class="tagline">science-fiction terminal &amp; system monitor</p>

    {#if error !== null}
      <p class="error" data-testid="boot-error">bridge unavailable — {error}</p>
    {:else if info === null}
      <p class="pending">querying main process…</p>
    {:else}
      <dl data-testid="boot-info">
        {#each rows as [label, value] (label)}
          <dt>{label}</dt>
          <dd>{value}</dd>
        {/each}
      </dl>
    {/if}

    <p class="phase">phase 0 — scaffold. terminal arrives in phase 1.</p>
  </div>
</section>

<style>
section {
  width: min(560px, 100%);
}

.body {
  padding: var(--space-5);
}

h1 {
  font-family: var(--font-display);
  font-size: var(--step-4);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  line-height: 1;
  text-transform: lowercase;
}

.tagline {
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-1) var(--space-4);
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--panel-rule);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

dt {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

dd {
  color: var(--text);
  overflow-wrap: anywhere;
}

.pending,
.error,
.phase {
  margin-top: var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

.pending {
  color: var(--text-muted);
}

.error {
  color: var(--danger);
}

.phase {
  color: var(--text-muted);
  opacity: 0.65;
}
</style>
