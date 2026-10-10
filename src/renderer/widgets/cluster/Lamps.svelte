<script lang="ts">
import type { ClusterMessage, Lamp } from '@shared/cluster'
import { pulse } from '../../lib/pulse.svelte.ts'

/**
 * The lamps on one line and, beside them, the message line saying the most
 * severe in words (docs/cluster.md §2). A lamp fades on and off; a red one
 * breathes on the shared pulse (lib/pulse.svelte.ts), not an animation of its
 * own. The line is a live region, read out when it changes.
 */
interface Props {
  lamps: readonly Lamp[]
  message: ClusterMessage
  /** Lets the words wrap, where the pane is too narrow for one line. */
  wrap: boolean
  onhover: (event: { box: DOMRect; x: number | null } | null) => void
}

const { lamps, message, wrap, onhover }: Props = $props()

const red = $derived(lamps.some((lamp) => lamp.state === 'crit'))
$effect(() => (red ? pulse.use() : undefined))

const line = $derived(message.more > 0 ? `${message.text} · +${message.more} MORE` : message.text)

let msgEl = $state<HTMLElement | null>(null)
const enter = (x: number | null): void => {
  if (msgEl !== null) onhover({ box: msgEl.getBoundingClientRect(), x })
}
</script>

<div class="lamps" class:wrap>
  <ul data-testid="cluster-lamps" data-pulse={red ? pulse.phase : undefined}>
    {#each lamps as lamp (lamp.id)}
      <li data-state={lamp.state} data-lamp={lamp.id}>
        <span class="off">{lamp.id.toUpperCase()}</span>
        <span class="on">{lamp.id.toUpperCase()}</span>
      </li>
    {/each}
  </ul>
  <!-- Focusable so the keyboard reaches the card listing every lit lamp. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    bind:this={msgEl}
    class="message"
    data-level={message.level}
    data-testid="cluster-message"
    role="status"
    aria-live="polite"
    tabindex="0"
    onpointerenter={(event) => enter(event.clientX)}
    onpointerleave={() => onhover(null)}
    onfocus={(event) => {
      if (event.currentTarget.matches(':focus-visible')) enter(null)
    }}
    onblur={() => onhover(null)}
  >
    {#key line}<span class="text fx-message">{line}</span>{/key}
  </div>
</div>

<style>
.lamps {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.3rem 1.5rem;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--panel-rule);
}

.lamps.wrap {
  grid-template-columns: minmax(0, 1fr);
}

ul {
  display: flex;
  gap: 0.25rem 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
}

.wrap ul {
  flex-wrap: wrap;
  font-size: var(--step--2);
}

li {
  display: inline-grid;
}

li > span {
  grid-area: 1 / 1;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
  transition: opacity calc(450ms * var(--motion-scale)) ease-in-out;
}

li > span::before {
  content: '';
  width: 0.4rem;
  height: 0.4rem;
  background: currentColor;
}

.off {
  color: var(--text-muted);
}

.off::before {
  opacity: 0.5;
}

.on {
  opacity: 0;
  color: var(--info);
}

li:not([data-state='off']) .off {
  opacity: 0;
}

li:not([data-state='off']) .on {
  opacity: 1;
}

li[data-state='warn'] .on {
  color: var(--warn);
}

li[data-state='crit'] .on {
  color: var(--danger);
}

/* A red lamp breathes on the shared pulse: part, low, part, full. */
[data-pulse='1'] li[data-state='crit'] .on,
[data-pulse='3'] li[data-state='crit'] .on {
  opacity: 0.75;
}

[data-pulse='2'] li[data-state='crit'] .on {
  opacity: 0.45;
}

.message {
  position: relative;
  min-width: 0;
  height: 1.3em;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.3;
  color: var(--text-muted);
}

.message:focus-visible {
  outline: 1px solid var(--accent-strong);
  outline-offset: 2px;
}

.wrap .message {
  height: 2.6em;
}

.text {
  position: absolute;
  inset: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.wrap .text {
  white-space: normal;
}

.message[data-level='warn'] {
  color: var(--warn);
}

.message[data-level='crit'] {
  color: var(--danger);
}

/* A new message rises in; the old one is simply replaced. */
.fx-message {
  animation: fx-message calc(260ms * var(--motion-scale)) var(--ease-out) backwards;
}

@keyframes fx-message {
  from {
    opacity: 0;
    transform: translateY(0.8em);
  }
}
</style>
