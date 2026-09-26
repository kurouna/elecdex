<script lang="ts">
import { anchorOf, type CardAnchor, type CardSize, HoverRest } from '../../lib/hover-card.ts'
import HoverCard from '../common/HoverCard.svelte'
import { type HintContext, hintFor, liveFor } from './hints.ts'

/**
 * The card that explains a figure when the pointer rests on it: what it is, how
 * to read it, the limits it is judged by, and what it reads now - the pane's
 * figures are an engineer's, and each is a word or two on screen.
 *
 * Any element in the pane with `data-hint="<key>"` has one (hints.ts holds the
 * words); this listens once on the pane rather than on each of them. It opens
 * after a short rest, so a pointer passing over the pane opens nothing; the frame,
 * its place and its timing are every detail card's (HoverCard, architecture.md
 * §7.4). The NOW line follows the readings while it is open.
 */
interface Props {
  /** The pane's root, which the card is laid out in (position: relative). */
  root: HTMLElement | null
  context: HintContext
}

const { root, context }: Props = $props()

let key = $state<string | null>(null)
let place = $state.raw<{ anchor: CardAnchor; bounds: CardSize } | null>(null)

const hint = $derived(key === null ? null : hintFor(key))
const live = $derived(key === null ? null : liveFor(key, context))

$effect(() => {
  const el = root
  if (el === null) return
  let over: Element | null = null
  // Rests and moves between figures as every detail card does (lib/hover-card.ts).
  const resting = new HoverRest<Element>(() => {
    key = null
  })

  const open = (target: Element): void => {
    const box = el.getBoundingClientRect()
    place = {
      anchor: anchorOf(box, target.getBoundingClientRect(), null),
      bounds: { width: box.width, height: box.height },
    }
    key = target.getAttribute('data-hint')
  }

  const onOver = (event: PointerEvent): void => {
    const target = (event.target as Element | null)?.closest('[data-hint]') ?? null
    if (target === over) return
    if (over !== null) resting.leave(over)
    over = target
    if (target !== null && el.contains(target)) resting.enter(target, () => open(target))
  }
  const onLeave = (): void => {
    over = null
    resting.leave()
  }

  el.addEventListener('pointerover', onOver)
  el.addEventListener('pointerleave', onLeave)
  el.addEventListener('pointerdown', onLeave)
  return () => {
    resting.dispose()
    el.removeEventListener('pointerover', onOver)
    el.removeEventListener('pointerleave', onLeave)
    el.removeEventListener('pointerdown', onLeave)
  }
})
</script>

{#if hint !== null && place !== null}
  <HoverCard anchor={place.anchor} bounds={place.bounds} width="22rem" testid="wifi-hint" data-key={key}>
    <b class="title">{hint.title}</b>
    {#each hint.body as line, i (i)}<p>{line}</p>{/each}
    {#if hint.limits}<p class="limits"><span>LIMITS</span> {hint.limits}</p>{/if}
    {#if live !== null}<p class="now" data-testid="wifi-hint-now"><span>NOW</span> {live}</p>{/if}
  </HoverCard>
{/if}

<style>
.title {
  display: block;
  margin-bottom: 0.2rem;
  font-family: var(--font-display);
  font-size: var(--step--1);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  color: var(--accent-strong);
}

p {
  margin: 0.15rem 0 0;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  line-height: 1.3;
  color: var(--text);
}

.limits,
.now {
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.limits {
  color: var(--text-muted);
}

.now {
  margin-top: 0.3rem;
  padding-top: 0.25rem;
  border-top: 1px dashed var(--panel-rule);
  color: var(--accent-strong);
}

.limits span,
.now span {
  margin-right: 0.3em;
  font-family: var(--font-ui);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}
</style>
