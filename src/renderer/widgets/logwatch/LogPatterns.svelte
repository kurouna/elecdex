<script lang="ts">
import { maskText } from '@shared/logwatch/text'
import type { PatternRow } from './view.ts'

/**
 * The PATTERNS tab (docs/logwatch.md §6.4): every pattern among the lines held, errors first,
 * with its count, the last minute in twelve bars, when it was last seen, and MUTE.
 */
interface Props {
  patterns: readonly PatternRow[]
  muted: ReadonlySet<string>
  now: number
  mask: boolean
  ontoggle: (sig: string) => void
}

const { patterns, muted, now, mask, ontoggle }: Props = $props()

function ago(at: number): string {
  const s = Math.max(0, Math.round((now - at) / 1000))
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h`
}

/** The pattern's text, its placeholders told apart. */
const pieces = (text: string): { text: string; slot: boolean }[] =>
  (mask ? maskText(text) : text)
    .split(/(\{(?:n|s|id|ip)\})/)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, slot: /^\{(?:n|s|id|ip)\}$/.test(part) }))
</script>

<div class="patterns" data-testid="logwatch-patterns" role="table" aria-label="patterns">
  <div class="row head" role="row">
    <span role="columnheader" class="count">COUNT</span><span role="columnheader">LVL</span
    ><span role="columnheader">PATTERN</span><span role="columnheader" class="spark">LAST MINUTE</span
    ><span role="columnheader" class="seen">LAST</span><span role="columnheader"></span>
  </div>
  {#each patterns as pattern (pattern.sig)}
    {@const tallest = Math.max(1, ...pattern.recent)}
    <div
      class="row lv-{pattern.level}"
      class:muted={muted.has(pattern.sig)}
      role="row"
      data-testid="logwatch-pattern"
    >
      <span class="count">{pattern.count.toLocaleString()}</span>
      <span class="lvl">{pattern.level}</span>
      <span class="sig"
        >{#if pattern.source !== ''}<span class="src">{pattern.source}</span>{/if}{#each pieces(pattern.text) as piece, i (i)}<span
            class:slot={piece.slot}>{piece.text}</span
          >{/each}</span
      >
      <span class="spark" aria-hidden="true">
        {#each pattern.recent as n, i (i)}<i style:height="{(n / tallest) * 100}%"></i>{/each}
      </span>
      <span class="seen">{ago(pattern.last)}</span>
      <button
        type="button"
        class="mute"
        aria-pressed={muted.has(pattern.sig)}
        onclick={() => ontoggle(pattern.sig)}
        data-testid="logwatch-mute">{muted.has(pattern.sig) ? 'UNMUTE' : 'MUTE'}</button
      >
    </div>
  {:else}
    <p class="empty">no lines held yet</p>
  {/each}
</div>

<style>
.patterns {
  container-type: inline-size;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

.row {
  display: grid;
  grid-template-columns: 7ch 4ch minmax(0, 1fr) 7rem 4ch 6rem;
  column-gap: 1ch;
  align-items: center;
  padding: 0.1rem 0.6rem 0.1rem 0.4rem;
}

.head {
  position: sticky;
  top: 0;
  background: var(--app-bg);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.muted {
  opacity: 0.45;
}

.count {
  text-align: right;
  color: var(--accent-strong);
}

.head .count {
  color: var(--text-muted);
}

.lvl {
  font-size: var(--step--2);
  font-weight: 700;
  text-align: center;
  border: 1px solid var(--panel-rule);
  color: var(--text-muted);
}

.lv-WRN .lvl {
  color: var(--warn);
  border-color: var(--warn);
}

.lv-ERR .lvl,
.lv-FTL .lvl {
  color: var(--text-inverse);
  background: var(--danger);
  border-color: var(--danger);
}

.sig {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.src {
  margin-right: 1ch;
  color: var(--text-muted);
}

.slot {
  color: var(--info);
}

.spark {
  display: flex;
  align-items: flex-end;
  gap: 1px;
  height: 0.9rem;
}

.spark i {
  flex: 1;
  min-height: 1px;
  background: var(--accent-dim);
}

.lv-WRN .spark i {
  background: var(--warn);
}

.lv-ERR .spark i,
.lv-FTL .spark i {
  background: var(--danger);
}

.seen {
  color: var(--text-muted);
  text-align: right;
}

.mute {
  padding: 0 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.mute:hover,
.mute[aria-pressed='true'] {
  color: var(--text);
  border-color: var(--accent);
}

.empty {
  margin: var(--space-2);
  color: var(--text-muted);
  font-family: var(--font-ui);
}

@container (max-width: 34rem) {
  .row {
    grid-template-columns: 6ch 4ch minmax(0, 1fr) 6rem;
  }

  .spark,
  .seen {
    display: none;
  }
}
</style>
