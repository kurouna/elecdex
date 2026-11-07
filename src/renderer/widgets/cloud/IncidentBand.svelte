<script lang="ts">
import type { StatusIncident } from '@shared/cloud-cli/status'
import { crtPower } from '../../lib/crt-transitions.ts'
import { ageText } from './cloud-view.ts'

/**
 * The public status's band (docs/cloud-cli.md §12.4), only while an incident is open: one line,
 * the heaviest first, "+2 more" when there are others, which a press lists below. ↗ (or Enter
 * on the band) opens the status page, which main builds; a click on the line itself only lists.
 * It is the service's public status, never the account's: the list says so.
 */
interface Props {
  incidents: readonly StatusIncident[]
  source: 'AWS' | 'GITHUB'
  now: number
  onopen: (id: string) => void
}

const { incidents, source, now, onopen }: Props = $props()

const RANK = { danger: 0, warn: 1, info: 2 } as const
const sorted = $derived(
  [...incidents].sort(
    (a, b) =>
      Number(a.stale) - Number(b.stale) ||
      RANK[a.weight] - RANK[b.weight] ||
      b.updatedAt - a.updatedAt,
  ),
)
const top = $derived(sorted[0])
let open = $state(false)

function onkey(event: KeyboardEvent): void {
  if (event.key === 'Enter' && top !== undefined) {
    event.preventDefault()
    onopen(top.id)
  }
}
</script>

{#if top !== undefined}
  <div class="incident crt-on" transition:crtPower data-weight={top.weight} class:stale={top.stale} data-testid="cloud-incident">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="line" tabindex="0" role="button" aria-expanded={open} onclick={() => (open = !open)} onkeydown={onkey}>
      <span class="src">{source} · {top.region ?? top.status}</span>
      <span class="what">{top.title}</span>
      <span class="when">{top.stale ? `last update ${ageText(top.updatedAt, now)} ago` : `since ${ageText(top.since, now)} · ${top.status}`}</span>
      {#if sorted.length > 1}<span class="more">+{sorted.length - 1} more</span>{/if}
      <button type="button" class="go" aria-label="open the status page" onclick={(e) => { e.stopPropagation(); onopen(top.id) }}>↗</button>
    </div>
    {#if open}
      <ul class="list">
        {#each sorted as incident (incident.id)}
          <li data-weight={incident.weight}>
            <span>{incident.region ?? incident.status}</span><span class="what">{incident.title}</span><span class="when">updated {ageText(incident.updatedAt, now)} ago</span>
            <button type="button" class="go" aria-label="open the status page" onclick={() => onopen(incident.id)}>↗</button>
          </li>
        {/each}
        <li class="note">This is {source === 'AWS' ? "AWS's" : "GitHub's"} public status, not your account's.</li>
      </ul>
    {/if}
  </div>
{/if}

<style>
.incident { --tone: var(--info); border: 1px solid var(--tone); font-size: var(--step--1); }
.incident[data-weight='danger'] { --tone: var(--danger); }
.incident[data-weight='warn'] { --tone: var(--warn); }
.incident.stale { opacity: 0.6; }
.line { display: flex; align-items: center; gap: 0.7rem; padding: 0.15rem 0.5rem; cursor: pointer; min-width: 0; }
.line:focus-visible { outline: 1px solid var(--accent); outline-offset: -1px; }
.src { color: var(--tone); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; font-weight: 600; white-space: nowrap; }
.what { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
.when, .more { font-family: var(--font-mono); color: var(--text-dim); white-space: nowrap; }
.go { padding: 0 0.3rem; border: 1px solid var(--panel-rule); background: transparent; color: var(--text-muted); font-family: var(--font-mono); cursor: pointer; }
.go:hover { color: var(--text); border-color: var(--accent); }
.list { list-style: none; margin: 0; padding: 0.1rem 0.5rem 0.3rem; border-top: 1px dashed var(--panel-rule); }
.list li { display: grid; grid-template-columns: 7rem minmax(0, 1fr) auto auto; gap: 0.6rem; align-items: center; padding: 0.05rem 0; color: var(--text-dim); }
.list li.note { display: block; color: var(--text-muted); }
</style>
