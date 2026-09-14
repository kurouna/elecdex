<script lang="ts">
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

<div
  class="plugin-pane"
  class:glowing
  bind:this={element}
  data-testid="plugin-pane"
  data-plugin={id}
  data-status={entry?.status ?? 'missing'}
>
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
      <p>{title} asks for more than you agreed to.</p>
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
