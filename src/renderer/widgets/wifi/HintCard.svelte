<script lang="ts">
import { type HintContext, hintFor, liveFor } from './hints.ts'

/**
 * The card that explains a figure when the pointer rests on it: what it is, how
 * to read it, the limits it is judged by, and what it reads now - the pane's
 * figures are an engineer's, and each is a word or two on screen.
 *
 * Any element in the pane with `data-hint="<key>"` has one (hints.ts holds the
 * words); this listens once on the pane rather than on each of them. It opens
 * after a short rest, so a pointer passing over the pane opens nothing, and it
 * stays inside the pane. The NOW line follows the readings while it is open.
 */
interface Props {
  /** The pane's root, which the card is laid out in (position: relative). */
  root: HTMLElement | null
  context: HintContext
}

const { root, context }: Props = $props()

const REST_MS = 350
const WIDTH_REM = 22

let key = $state<string | null>(null)
let place = $state({ left: 0, top: 0, below: true })

const hint = $derived(key === null ? null : hintFor(key))
const live = $derived(key === null ? null : liveFor(key, context))

$effect(() => {
  const el = root
  if (el === null) return
  let timer: ReturnType<typeof setTimeout> | undefined
  let over: Element | null = null

  const open = (target: Element): void => {
    const box = el.getBoundingClientRect()
    const at = target.getBoundingClientRect()
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const width = Math.min(WIDTH_REM * rem, box.width - 8)
    const below = at.bottom - box.top < box.height * 0.6
    place = {
      left: Math.max(4, Math.min(at.left - box.left, box.width - width - 4)),
      top: below ? at.bottom - box.top + 6 : at.top - box.top - 6,
      below,
    }
    key = target.getAttribute('data-hint')
  }

  const onOver = (event: PointerEvent): void => {
    const target = (event.target as Element | null)?.closest('[data-hint]') ?? null
    if (target === over) return
    over = target
    clearTimeout(timer)
    if (target === null || !el.contains(target)) {
      key = null
      return
    }
    // Moving between figures with a card open: the next one opens at once.
    if (key !== null) open(target)
    else timer = setTimeout(() => open(target), REST_MS)
  }
  const onLeave = (): void => {
    clearTimeout(timer)
    over = null
    key = null
  }

  el.addEventListener('pointerover', onOver)
  el.addEventListener('pointerleave', onLeave)
  el.addEventListener('pointerdown', onLeave)
  return () => {
    clearTimeout(timer)
    el.removeEventListener('pointerover', onOver)
    el.removeEventListener('pointerleave', onLeave)
    el.removeEventListener('pointerdown', onLeave)
  }
})
</script>

{#if hint !== null}
  <div
    class="card"
    class:above={!place.below}
    style:left="{place.left}px"
    style:top="{place.top}px"
    style:--width="{WIDTH_REM}rem"
    role="tooltip"
    data-testid="wifi-hint"
    data-key={key}
  >
    <b class="title">{hint.title}</b>
    {#each hint.body as line, i (i)}<p>{line}</p>{/each}
    {#if hint.limits}<p class="limits"><span>LIMITS</span> {hint.limits}</p>{/if}
    {#if live !== null}<p class="now" data-testid="wifi-hint-now"><span>NOW</span> {live}</p>{/if}
  </div>
{/if}

<style>
/* Laid over the pane's figures, on the app's ground, cut like the shell frame. */
.card {
  position: absolute;
  z-index: 20;
  width: min(var(--width), calc(100% - 8px));
  padding: 0.45rem 0.6rem 0.5rem;
  border: 1px solid var(--accent);
  border-left-width: 3px;
  background: color-mix(in srgb, var(--app-bg) 94%, var(--accent));
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
  box-shadow: 0 0 calc(var(--glow) * 0.8rem) color-mix(in srgb, var(--accent) 35%, transparent);
  pointer-events: none;
}

.card.above {
  transform: translateY(-100%);
}

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
