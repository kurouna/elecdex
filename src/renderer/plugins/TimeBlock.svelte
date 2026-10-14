<script lang="ts">
import { untrack } from 'svelte'
import Digits from '../widgets/common/Digits.svelte'
import { countdown, dateOf, relative, ticker, timeOfDay } from './ticker.svelte.ts'

/**
 * A moment that the host keeps current every second, so a plugin need not redraw
 * for it. Its figures roll as they change, so a countdown is seen to run.
 */
interface Props {
  at: number
  style: 'relative' | 'countdown' | 'clock' | 'date'
  label?: string | undefined
  tone?: string | undefined
  size?: 'md' | 'lg' | undefined
  /** On screen: the second is taken only then, and the figure kept as it was meanwhile. */
  visible?: boolean
}

const { at, style, label, tone, size = 'md', visible = true }: Props = $props()

// Behind a tab every time block ticked each second for no one (found in the sweep).
$effect(() => (visible ? ticker.use() : undefined))

const text = $derived.by(() => {
  const now = visible ? ticker.now : untrack(() => ticker.now)
  if (style === 'countdown') return countdown(at, now)
  if (style === 'relative') return relative(at, now)
  if (style === 'clock') return timeOfDay(at)
  return dateOf(at)
})
</script>

<div class="time size-{size}" data-testid="plugin-time">
  {#if label}<span class="label">{label}</span>{/if}
  <span class="value tone-{tone ?? 'none'}"><Digits value={text} /></span>
</div>

<style>
.time {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.label {
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.value {
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.size-md .value {
  font-size: var(--step-1);
}

.size-lg .value {
  font-size: clamp(var(--step-2), 18cqi, var(--step-4));
}
</style>
