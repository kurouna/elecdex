<script lang="ts">
import { awakeLine, readUtilityPane, UTILITY_MODULES, type UtilityModule } from '@shared/utility'
import { awake } from '../../stores/awake.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import AwakeModule from './AwakeModule.svelte'
import CodecModule from './CodecModule.svelte'
import QrModule from './QrModule.svelte'

/**
 * UTILITY (docs/architecture.md section 5.16): small tools, one shown at a
 * time behind a switch, as the timer shows its stopwatch, timers and alarms.
 * Which one is shown, and each one's choices, are the pane's state.
 *
 * While AWAKE holds, the pane says so whichever tool is shown - beside the
 * switch, and in its header's badge, which a tab behind another still shows -
 * since the hold is the one thing here that goes on out of sight.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))
const pane = $derived(readUtilityPane(paneState))

const LABELS: Record<UtilityModule, string> = { awake: 'awake', qr: 'qr code', codec: 'codec' }

function show(module: UtilityModule): void {
  if (module === pane.module) return
  widgetState.patch(paneId, { module: module === 'awake' ? undefined : module })
  sfx.play('panel')
}

/** The hold in words, beside the switch: a clock time, so it never has to count. */
const holdWords = $derived(awakeLine(awake.state, Date.now()))

$effect(() => {
  paneMeta.set(paneId, {
    subtitle: LABELS[pane.module],
    ...(awake.holding ? { badge: 'hold', badgeKind: 'ok' as const } : {}),
  })
})
</script>

<div class="utility" data-testid="utility" data-module={pane.module}>
  <div class="modes">
    {#each UTILITY_MODULES as module (module)}
      <button
        type="button"
        class:on={pane.module === module}
        aria-pressed={pane.module === module}
        onclick={() => show(module)}
        data-testid="utility-mode"
        data-module={module}>{LABELS[module]}</button
      >
    {/each}
    {#if pane.module !== 'awake' && holdWords !== null}
      <button
        type="button"
        class="aside"
        title="keeping this machine awake: open AWAKE"
        onclick={() => show('awake')}
        data-testid="utility-hold-aside"
      >
        ◆ hold · {holdWords}
      </button>
    {/if}
  </div>

  {#if pane.module === 'awake'}
    <AwakeModule {paneId} {pane} {visible} />
  {:else if pane.module === 'qr'}
    <QrModule {paneId} {pane} {visible} />
  {:else}
    <CodecModule {paneId} {pane} />
  {/if}
</div>

<style>
.utility {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  height: 100%;
  min-height: 0;
  padding: var(--space-1);
  font-family: var(--font-ui);
}

.modes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
}

.modes button {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: 0 var(--space-2);
  cursor: pointer;
}

.modes button:hover {
  color: var(--text);
}

.modes button.on {
  border-color: var(--accent);
  color: var(--accent-strong);
  background: var(--accent-faint);
}

.modes .aside {
  margin-left: auto;
  font-family: var(--font-mono);
  text-transform: none;
  color: var(--accent);
  border-color: var(--accent-dim);
}

/* The tools' own controls look alike: rows of a label and a set of chips. */
.utility :global(.u-row) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.utility :global(.u-label) {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

/* A row's label is a column of its own, as wide as the tool says (--u-label). */
.utility :global(.u-row > .u-label) {
  flex: 0 0 var(--u-label, 4.2rem);
}

.utility :global(.u-chips) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.utility :global(.u-chip) {
  padding: 0.1rem 0.45rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.08em;
  white-space: nowrap;
  cursor: pointer;
}

.utility :global(.u-chip:hover:not(:disabled)) {
  border-color: var(--accent);
  color: var(--text);
}

.utility :global(.u-chip.on) {
  border-color: var(--accent);
  background: var(--accent-faint);
  color: var(--accent-strong);
}

.utility :global(.u-chip:disabled) {
  opacity: 0.4;
  cursor: default;
}
</style>
