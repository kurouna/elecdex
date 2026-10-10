<script lang="ts">
import type { Level } from '@shared/cluster'
import Digits from '../common/Digits.svelte'

/**
 * The one way the CLUSTER pane shows a figure (docs/cluster.md §2): a label, the
 * number and its unit, a hairline meter and a note - never boxed. Digits roll as
 * they change and keep one width each, so nothing beside a number moves; a word
 * (a process name, OFF) is set as text.
 *
 * A level marks the label as well as the colour (▲ amber, ◆ red), since AMBER's
 * warning yellow is close to its accent.
 */
interface Props {
  label: string
  value: string
  unit?: string
  note?: string
  /** 0-1 for the meter; null for none. */
  meter?: number | null
  level?: Level
  /** Set as text, not rolling digits. */
  word?: boolean
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  align?: 'start' | 'end'
  /** The room the widest value takes, so the unit after it stays put. */
  cells?: string
  /** Without its label and note, where the room is short. */
  quiet?: boolean
  /** Opens this figure's detail card. */
  onhover?: (event: { box: DOMRect; x: number | null } | null) => void
  testid?: string
}

const {
  label,
  value,
  unit = '',
  note = '',
  meter = null,
  level = 'none',
  word = false,
  size = 'sm',
  align = 'start',
  cells,
  quiet = false,
  onhover,
  testid,
}: Props = $props()

let el = $state<HTMLElement | null>(null)

function enter(x: number | null): void {
  if (el !== null) onhover?.({ box: el.getBoundingClientRect(), x })
}
</script>

<!-- Focusable so the keyboard reaches its detail card, as a pointer resting on it does. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={el}
  class="figure {size}"
  class:end={align === 'end'}
  data-level={level}
  data-testid={testid}
  role={onhover ? 'group' : undefined}
  aria-label={onhover ? `${label} ${value} ${unit}`.trim() : undefined}
  tabindex={onhover ? 0 : undefined}
  onpointerenter={onhover ? (event) => enter(event.clientX) : undefined}
  onpointerleave={onhover ? () => onhover(null) : undefined}
  onfocus={onhover
    ? (event) => {
        // The keyboard's focus, not the one a click leaves behind: the pointer has its own rest.
        if (event.currentTarget.matches(':focus-visible')) enter(null)
      }
    : undefined}
  onblur={onhover ? () => onhover(null) : undefined}
>
  {#if !quiet}<span class="label">{label}</span>{/if}
  <span class="value">
    <!-- Letters between digits (the d of 12d 04:33:07) take their own width; only digits are fixed. -->
    <b class:fixed={cells !== undefined} style:min-width={cells} style:--separator-width={/[a-z]/i.test(value) ? 'auto' : undefined}
      >{#if word}{value}{:else}<Digits {value} />{/if}</b>
    {#if unit}<u>{unit}</u>{/if}
  </span>
  {#if meter !== null}
    <span class="meter"><i style:--fill={Math.min(1, Math.max(0, meter))}></i></span>
  {/if}
  {#if note && !quiet}<span class="note">{note}</span>{/if}
</div>

<style>
.figure {
  display: grid;
  row-gap: 0.2rem;
  min-width: 0;
  --digit-width: 0.62em;
  --separator-width: 0.36em;
}

.figure:focus-visible {
  outline: 1px solid var(--accent-strong);
  outline-offset: 3px;
}

.label,
.note {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--text-muted);
}

.label {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  font-weight: 500;
  letter-spacing: var(--tracking-wider);
}

.note {
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

.value {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  min-width: 0;
  white-space: nowrap;
}

b {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-weight: 600;
  line-height: 1.05;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

u {
  flex: none;
  text-decoration: none;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.xl b {
  font-size: var(--step-4);
  color: var(--accent-strong);
}

.lg b {
  font-size: var(--step-3);
  color: var(--accent-strong);
}

.md b {
  font-size: var(--step-2);
}

.xs b {
  font-size: var(--step-0);
}

.end {
  text-align: end;
}

.end .value {
  justify-content: flex-end;
}

.end b,
b.fixed {
  text-align: end;
}

.meter {
  height: 2px;
  overflow: hidden;
  background: var(--line);
}

.meter i {
  display: block;
  height: 100%;
  background: var(--accent);
  transform-origin: left;
  transform: scaleX(var(--fill, 0));
  transition: transform calc(700ms * var(--motion-scale)) var(--ease-out);
}

[data-level='warn'] .label,
[data-level='warn'] b {
  color: var(--cluster-warn, var(--warn));
}

[data-level='warn'] .meter i {
  background: var(--cluster-warn, var(--warn));
}

[data-level='crit'] .label,
[data-level='crit'] b {
  color: var(--cluster-crit, var(--danger));
}

[data-level='crit'] .meter i {
  background: var(--cluster-crit, var(--danger));
}

[data-level='warn'] .label::before {
  content: '▲ ';
}

[data-level='crit'] .label::before {
  content: '◆ ';
}
</style>
