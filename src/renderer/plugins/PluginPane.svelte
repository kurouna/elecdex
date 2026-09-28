<script lang="ts">
import { keyFate } from '@shared/plugin-keys'
import { untrack } from 'svelte'
import { ui } from '../stores/ui.svelte.ts'
import type { WidgetProps } from '../widgets/registry.ts'
import Blocks from './Blocks.svelte'
import { NOTIFY_GLOW_MS, plugins } from './plugins.svelte.ts'

/**
 * Every plugin pane: it tells the host when it is on screen and how big it is, draws the
 * blocks the plugin's view renders, and says plainly why a plugin is not running - off,
 * waiting for consent, broken, or gone from the folder - with the way to fix it.
 */

const { paneId, state: saved, widget = '' }: WidgetProps = $props()

const id = $derived(widget.startsWith('plugin:') ? widget.slice('plugin:'.length) : '')
const entry = $derived(plugins.entry(id))
const ready = $derived(entry?.status === 'ready')
const view = $derived(plugins.views.get(paneId))
const title = $derived(entry?.descriptor?.title ?? id)

let element = $state<HTMLDivElement | null>(null)
let glowing = $state(false)

/*
 * Keys (docs/plugins.md section 13). A plugin granted them is given the keys pressed while
 * its pane itself has the focus and the window has the keyboard - never with Ctrl, Alt or
 * the system key, which stay the app's - and the pane says so with a lamp the plugin
 * cannot draw, so no pane can take keys unseen. A key held down is given once.
 */
const keysOn = $derived(
  ready && entry?.descriptor?.permissions.keys === true && plugins.grant(id).keys,
)
let paneFocused = $state(false)
let windowFocused = $state(document.hasFocus())
const listening = $derived(keysOn && paneFocused && windowFocused)
/** Keys given down and not yet up: they are let go when the keyboard leaves. */
const held = new Set<string>()

$effect(() => {
  const on = listening
  untrack(() => {
    // The keyboard left (or the grant went): what is held goes up, as no key-up will come.
    if (!on) letGo()
    plugins.focus(id, paneId, on)
  })
})

function onkeydown(event: KeyboardEvent): void {
  if (!listening || event.target !== element) return
  const fate = keyFate(event)
  if (fate === 'pass') return
  event.preventDefault()
  if (fate === 'swallow') return
  held.add(event.code)
  plugins.key(id, paneId, {
    code: event.code,
    down: true,
    shift: event.shiftKey,
    at: performance.timeOrigin + event.timeStamp,
  })
}

function onkeyup(event: KeyboardEvent): void {
  if (!held.delete(event.code)) return
  event.preventDefault()
  plugins.key(id, paneId, {
    code: event.code,
    down: false,
    shift: event.shiftKey,
    at: performance.timeOrigin + event.timeStamp,
  })
}

/** The keyboard left: every key still down goes up now, as no key-up will come. */
function letGo(): void {
  const at = performance.timeOrigin + performance.now()
  for (const code of held) plugins.key(id, paneId, { code, down: false, shift: false, at })
  held.clear()
}

$effect(() => {
  const el = element
  if (!ready || el === null) return
  const pluginId = id
  const size = () => ({ w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) })
  // Untracked: attaching reads and writes the host's state, and what a plugin draws must not
  // detach and attach its pane again.
  untrack(() =>
    plugins.attach(pluginId, paneId, { size: size(), visible: false, state: saved?.plugin }),
  )
  const resize = new ResizeObserver(() => plugins.resize(pluginId, paneId, size()))
  resize.observe(el)
  const seen = new IntersectionObserver((entries) =>
    plugins.show(
      pluginId,
      paneId,
      entries.some((e) => e.isIntersecting),
    ),
  )
  seen.observe(el)
  return () => {
    resize.disconnect()
    seen.disconnect()
    plugins.detach(pluginId, paneId)
  }
})

$effect(() => {
  const at = view?.glowAt ?? 0
  if (at === 0) return
  glowing = true
  const timer = setTimeout(() => (glowing = false), NOTIFY_GLOW_MS)
  return () => clearTimeout(timer)
})

const openSettings = () => ui.openSettings('plugins')
</script>

<svelte:window
  onblur={() => {
    windowFocused = false
    letGo()
  }}
  onfocus={() => (windowFocused = true)}
/>

<!-- A pane that takes keys is one control, as a game's field is: role application (the
     check cannot see through the role being given only then). -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="plugin-pane"
  class:glowing
  class:listening
  bind:this={element}
  tabindex={keysOn ? 0 : undefined}
  role={keysOn ? 'application' : undefined}
  aria-label={keysOn ? `${title}: takes the keys you press while it has the focus` : undefined}
  onfocus={() => (paneFocused = true)}
  onblur={() => {
    paneFocused = false
    letGo()
  }}
  {onkeydown}
  {onkeyup}
  data-testid="plugin-pane"
  data-plugin={id}
  data-status={entry?.status ?? 'missing'}
  data-notes={plugins.sounded.get(paneId) ?? 0}
  data-strings={plugins.strung.get(paneId) ?? 0}
>
  {#if listening}
    <!-- Anchored to the top of the view, not of the content: a scrolled pane still shows it. -->
    <div class="lamp-anchor"><span class="keys-lamp" data-testid="plugin-keys" aria-hidden="true">KEYS</span></div>
  {/if}
  {#if entry === null}
    <div class="state">
      <p>plugin <code>{id}</code> is not in the plugins folder.</p>
      <button type="button" onclick={openSettings}>plugins</button>
    </div>
  {:else if entry.status === 'loading'}
    <div class="state"><p>loading {title}…</p></div>
  {:else if entry.status === 'disabled'}
    <div class="state">
      <p>{title} is turned off.</p>
      <button type="button" onclick={openSettings} data-testid="plugin-open-settings">turn on in settings</button>
    </div>
  {:else if entry.status === 'consent'}
    <div class="state">
      <p>{title} is waiting for your agreement.</p>
      <button type="button" onclick={openSettings} data-testid="plugin-open-settings">review in settings</button>
    </div>
  {:else if entry.status !== 'ready'}
    <div class="state">
      <p class="error">{title}: {entry.error}</p>
      <button type="button" onclick={openSettings}>plugins</button>
    </div>
  {:else}
    {#if view?.stopped}
      <div class="state">
        <p class="error" data-testid="plugin-stopped">
          {view.stopped === 'unresponsive' ? `${title} stopped responding.` : `${title} failed.`}
        </p>
        {#if view.error}<pre class="trace">{view.error}</pre>{/if}
        <button type="button" onclick={() => plugins.restart(id)} data-testid="plugin-restart">restart</button>
      </div>
    {:else}
      <Blocks
        blocks={view?.blocks ?? []}
        epoch={view?.epoch ?? 0}
        onsurface={(block, canvas) => plugins.surface(id, paneId, block, canvas)}
        onaction={(action, item) => plugins.action(id, paneId, action, item)}
        onsignin={(host) => void window.elecdex.plugins.signIn(id, host)}
        onlink={(href) => void window.elecdex.system.openExternal(href)}
      />
      {#if view?.error}<pre class="trace" data-testid="plugin-error">{view.error}</pre>{/if}
      {#each view?.problems ?? [] as problem, i (i)}
        <p class="problem" data-testid="plugin-problem">{problem}</p>
      {/each}
    {/if}
  {/if}
</div>

<style>
.plugin-pane {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: auto;
  transition: box-shadow var(--dur-panel) var(--ease-out);
}

.plugin-pane:focus {
  outline: none;
}

/* The pane has the keyboard: a hairline round it, and the lamp in its corner. */
.plugin-pane.listening {
  box-shadow: inset 0 0 0 1px var(--accent-dim);
}

.lamp-anchor {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 0;
}

.keys-lamp {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  padding: 0 0.4em;
  border: 1px solid var(--accent-dim);
  background: var(--app-bg);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--accent-strong);
  pointer-events: none;
}

.keys-lamp::before {
  content: '';
  width: 0.45em;
  height: 0.45em;
  border-radius: 50%;
  background: var(--accent-strong);
  box-shadow: 0 0 0.4em var(--accent);
}

/* A notification lights the pane's edge for a moment. */
.plugin-pane.glowing {
  box-shadow: inset 0 0 0 1px var(--accent), inset 0 0 1.2rem var(--accent-dim);
}

.state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.state p {
  margin: 0;
}

.error {
  color: var(--danger);
}

.state button {
  padding: 0.1rem 0.6rem;
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font: inherit;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.state button:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.trace {
  max-width: 100%;
  margin: 0 var(--space-1);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--danger);
}

.problem {
  margin: 0 var(--space-1);
  font-size: var(--step--2);
  color: var(--warn);
}
</style>
