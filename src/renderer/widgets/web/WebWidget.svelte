<script lang="ts">
import { presetOfWidget, type WebRect, type WebState } from '@shared/web'
import { untrack } from 'svelte'
import { paneDrag } from '../../layout/pane-drag.svelte.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { boot } from '../../stores/boot.svelte.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'
import { web } from '../../stores/web.svelte.ts'
import type { WidgetProps } from '../registry.ts'

/**
 * A web page in a pane: the browser, or a site preset such as YouTube or X
 * (shared/web.ts, docs/architecture.md section 5.4).
 *
 * The page itself is a view main draws over this pane's body; this component only
 * says where, and when to step aside. Whenever something of the page's own must be
 * seen above it - a dialog, a notice, a pane being dragged, the pane's own CRT
 * power-on or -off - the view is hidden and a picture of it stands in its place.
 */

const {
  paneId,
  widget = '',
  state: paneState,
  active,
  visible = true,
  transitioning = false,
}: WidgetProps = $props()

const preset = $derived(presetOfWidget(widget))
const savedUrl = (): string | null => {
  const url = untrack(() => paneState?.url)
  return typeof url === 'string' ? url : null
}

let page = $state<WebState | null>(null)
let address = $state('')
let editing = $state(false)
let body = $state<HTMLDivElement | null>(null)
let root = $state<HTMLDivElement | null>(null)
// Raw: it is sent to main as it is, and IPC cannot clone a state proxy.
let rect = $state.raw<WebRect | null>(null)
let showing = $state(false)
let snapshot = $state<string | null>(null)

const api = window.elecdex.web
/** This mount's claim on the view (main/web/views.ts). */
const claim = crypto.randomUUID()

$effect(() => web.retain())

// Once per mount, whatever the props do: a saved page gives the pane a new node (and
// its props new getters), and opening again would hide the page this mount has shown.
$effect(() => {
  const { id, name, known } = untrack(() => ({ id: paneId, name: widget, known: preset !== null }))
  if (!known) return
  let live = true
  const apply = (state: WebState): void => {
    page = state
    if (!untrack(() => editing)) address = state.url
  }
  const off = api.onState(id, apply)
  // A hidden view whose colours changed under a dialog sends its new picture.
  const offPicture = api.onSnapshot(id, (image) => {
    if (!showing) snapshot = image
  })
  void api.open(id, claim, name, savedUrl()).then((state) => {
    if (live && state !== null) apply(state)
  })
  return () => {
    live = false
    off()
    offPicture()
    // A moved pane mounts again and takes its view back; a closed one is gone.
    if (layout.panes.some((p) => p.id === id)) void api.hide(id, claim, false)
    else api.close(id, claim)
  }
})

/**
 * Whether this pane's pages are drawn in the theme's colour: its own choice, kept in
 * pane state, or the setting until the button is used. A theme that shows launcher
 * icons in their own colours (Business) never tints, and the button says so.
 */
const tintChoice = $derived(typeof paneState?.tint === 'boolean' ? paneState.tint : null)
const tintable = $derived(appearance.theme.effects?.iconTint !== false)
const tinted = $derived(tintable && (tintChoice ?? appearance.settings.web.tint))

// Sent as the pane opens and whenever the choice changes; the setting reaches main
// through the appearance, so following it needs nothing here.
$effect(() => {
  const on = tintChoice
  untrack(() => api.command(paneId, { t: 'tint', on }))
})

function toggleTint(): void {
  layout.setPaneState(paneId, { ...untrack(() => paneState), tint: !tinted })
}

// Where the page is now, for a restart to open it again.
$effect(() => {
  const url = page?.url
  if (url === undefined || url === '') return
  const id = paneId
  // Untracked: writing the tree must not make this effect depend on the tree.
  untrack(() => {
    const current = paneState
    if (current?.url !== url) layout.setPaneState(id, { ...current, url })
  })
})

$effect(() => {
  const title = page?.title ?? ''
  paneMeta.set(paneId, {
    subtitle: title,
    ...(title === '' ? {} : { tooltip: title }),
    ...(page?.error ? { badge: 'error', badgeKind: 'danger' as const } : {}),
  })
})

function measure(): void {
  const box = body?.getBoundingClientRect()
  if (box === undefined || box.width < 1 || box.height < 1) {
    rect = null
    return
  }
  const next = {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  }
  if (
    rect?.x !== next.x ||
    rect.y !== next.y ||
    rect.width !== next.width ||
    rect.height !== next.height
  ) {
    rect = next
  }
}

// Measured when the body resizes, the tree changes (a pane beside it resized, so it
// may have moved without resizing), the window resizes, or a transition ends.
$effect(() => {
  const element = body
  if (element === null) return
  const observer = new ResizeObserver(measure)
  observer.observe(element)
  return () => observer.disconnect()
})
$effect(() => {
  void layout.tree
  void visible
  void transitioning
  measure()
})

const hasPage = $derived((page?.url ?? '') !== '')
/** Something of the workspace is, or may be, above the pane. */
const covered = $derived(
  ui.dialogOpen ||
    paneDrag.source !== null ||
    boot.phase !== 'done' ||
    transitioning ||
    (rect !== null && web.covered(rect)),
)
const wanted = $derived(hasPage && visible && rect !== null && !covered)

let placed: string | null = null
$effect(() => {
  const target = rect
  if (wanted && target !== null) {
    const key = `${target.x},${target.y},${target.width},${target.height}`
    if (key === placed) return
    placed = key
    api.show(paneId, claim, target)
    showing = true
    // The page draws itself again: its picture is a decoded bitmap the size of the
    // pane, which would otherwise be held for as long as the pane lives.
    snapshot = null
    return
  }
  if (placed === null) return
  placed = null
  showing = false
  // A tab put behind another needs no picture: nothing of it is on screen.
  const picture = untrack(() => covered && visible)
  void api.hide(paneId, claim, picture).then((image) => {
    // The page may be back before its picture is taken (a dialog closed at once, a
    // pane moved): holding it then is a bitmap of a page the pane can see.
    if (picture && image !== null && !showing) snapshot = image
  })
})

/**
 * When the workspace was last pressed. A press focuses the pane (its title, its
 * address bar) before the element under the pointer takes the keyboard or starts a
 * drag, and handing the keyboard to the page then would take both away.
 */
let pressedAt = Number.NEGATIVE_INFINITY
const PRESS_MS = 500

// The keyboard follows focus into the page when focus moved without a press (a
// shortcut), unless it is on this pane's own controls.
$effect(() => {
  if (!active || !showing) return
  if (performance.now() - pressedAt < PRESS_MS) return
  if (root?.contains(document.activeElement)) return
  api.focus(paneId)
})

function go(command: Parameters<typeof api.command>[1]): void {
  api.command(paneId, command)
}

function submit(event: SubmitEvent): void {
  event.preventDefault()
  editing = false
  go({ t: 'address', input: address })
  api.focus(paneId)
}

function onAddressKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  editing = false
  address = page?.url ?? ''
  event.currentTarget instanceof HTMLInputElement && event.currentTarget.blur()
}

/** The page's place, without the scheme: enough to see where a preset pane is. */
const where = $derived.by(() => {
  const url = page?.url ?? ''
  try {
    const parsed = new URL(url)
    return `${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}`
  } catch {
    return url
  }
})
</script>

<svelte:window onresize={measure} onpointerdowncapture={() => (pressedAt = performance.now())} />

<div
  class="web"
  bind:this={root}
  data-testid="web"
  data-preset={preset?.id}
  data-showing={showing}
>
  {#if preset === null}
    <p class="note">unknown web preset <code>{widget}</code></p>
  {:else}
    <div class="bar">
      <button
        type="button"
        title="Back"
        aria-label="back"
        disabled={!page?.canGoBack}
        onclick={() => go({ t: 'back' })}
        data-testid="web-back">‹</button
      >
      <button
        type="button"
        title="Forward"
        aria-label="forward"
        disabled={!page?.canGoForward}
        onclick={() => go({ t: 'forward' })}
        data-testid="web-forward">›</button
      >
      {#if page?.loading}
        <button type="button" title="Stop" aria-label="stop" onclick={() => go({ t: 'stop' })} data-testid="web-stop">×</button>
      {:else}
        <button
          type="button"
          title="Reload"
          aria-label="reload"
          disabled={!hasPage}
          onclick={() => go({ t: 'reload' })}
          data-testid="web-reload">↻</button
        >
      {/if}
      <button
        type="button"
        class="tint"
        class:off={!tinted}
        aria-pressed={tinted}
        disabled={!tintable}
        title={tintable
          ? tinted
            ? "Showing the page in the theme's colour"
            : 'Showing the page in its own colours'
          : 'This theme shows web pages in their own colours'}
        aria-label="tint the page in the theme's colour"
        onclick={toggleTint}
        data-testid="web-tint">◐</button
      >
      {#if preset.home !== null}
        <button type="button" title="Home" aria-label="home" onclick={() => go({ t: 'home' })} data-testid="web-home">⌂</button>
        <span class="where" title={page?.url ?? ''} data-testid="web-where">{where}</span>
      {:else}
        <form class="address" onsubmit={submit}>
          <input
            type="text"
            bind:value={address}
            onfocus={(e) => {
              editing = true
              e.currentTarget.select()
            }}
            onblur={() => (editing = false)}
            onkeydown={onAddressKey}
            placeholder="address · enter to open"
            spellcheck="false"
            autocomplete="off"
            aria-label="address"
            data-testid="web-address"
          />
        </form>
      {/if}
      <button
        type="button"
        title="Open in your browser"
        aria-label="open in your browser"
        disabled={!hasPage}
        onclick={() => go({ t: 'external' })}
        data-testid="web-external">↗</button
      >
    </div>
    {#if page?.error}
      <p class="error" role="status" data-testid="web-error">{page.error}</p>
    {/if}
    <div class="page" bind:this={body} data-testid="web-page">
      {#if !hasPage}
        <p class="note" data-testid="web-empty">
          {preset.home === null ? 'type an address above' : 'loading…'}
        </p>
      {:else if snapshot !== null && !showing}
        <img class="snapshot" src={snapshot} alt="" data-testid="web-snapshot" />
      {/if}
    </div>
  {/if}
</div>

<style>
.web {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  font-family: var(--font-ui);
}

.bar {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
}

.bar button {
  flex: none;
  width: 1.4rem;
  height: 1.4rem;
  padding: 0;
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step-0);
  line-height: 1;
  cursor: pointer;
}

.bar button:hover:not(:disabled),
.bar button:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
}

.bar button:disabled {
  opacity: 0.4;
  cursor: default;
}

.address {
  flex: 1;
  min-width: 0;
  margin: 0;
}

.address input {
  box-sizing: border-box;
  width: 100%;
  height: 1.4rem;
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  outline: none;
}

.address input:focus {
  border-color: var(--accent);
}

/* Pressed in: the page is in the theme's colour. */
.bar button.tint:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

.bar button.tint.off:not(:disabled) {
  color: var(--text-muted);
  border-color: var(--panel-border);
}

.where {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.error {
  margin: 0;
  color: var(--danger);
  font-size: var(--step--1);
  overflow-wrap: anywhere;
}

/* The page's view is drawn over this box by main. */
.page {
  position: relative;
  flex: 1;
  min-height: 0;
  background: var(--app-bg);
}

.snapshot {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.note {
  margin: 0;
  padding: var(--space-2);
  color: var(--text-muted);
  font-size: var(--step--1);
}
</style>
