<script lang="ts">
import type { LauncherEntry } from '@shared/launcher'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import type { WidgetProps } from '../registry.ts'

/**
 * An application launcher: the platform's own list (Start Menu on Windows,
 * /Applications on macOS, .desktop files on Linux) with the user's own entries
 * from settings.json pinned first.
 *
 * Type to filter; Enter starts the first match. Icons are fetched lazily, only
 * for tiles that scroll into view, and drawn in the theme's accent colour: the
 * icon's own shape is the mask, and its grayscale shading is multiplied over the
 * accent, so each icon stays recognisable while the grid reads as one HUD. The
 * original colours come back on hover. All of it is static CSS - nothing is
 * recomputed per frame, and a theme switch is a plain repaint.
 */
const { paneId }: WidgetProps = $props()

let entries = $state.raw<LauncherEntry[]>([])
let loading = $state(true)
let filter = $state('')
let status = $state<{ text: string; error: boolean } | null>(null)
let icons = $state.raw<Record<string, string | null>>({})
let grid = $state<HTMLUListElement | null>(null)

// Reload when settings change: the user may have added entries by hand.
$effect(() => {
  void appearance.settings.launcher
  let stale = false
  void window.elecdex.launcher.list().then((list) => {
    if (stale) return
    entries = list
    loading = false
  })
  return () => {
    stale = true
  }
})

const visible = $derived.by(() => {
  const q = filter.trim().toLowerCase()
  if (q === '') return entries
  return entries.filter(
    (e) => e.name.toLowerCase().includes(q) || (e.group ?? '').toLowerCase().includes(q),
  )
})

$effect(() => {
  const pinned = entries.filter((e) => e.source === 'user').length
  paneMeta.set(paneId, {
    subtitle: loading
      ? 'scanning…'
      : `${entries.length} apps${pinned ? ` · ${pinned} pinned` : ''}`,
  })
})

// Icons for tiles that come into view, once each.
$effect(() => {
  const root = grid
  void visible
  if (root === null) return
  const observer = new IntersectionObserver(
    (seen) => {
      for (const item of seen) {
        if (!item.isIntersecting) continue
        const id = (item.target as HTMLElement).dataset.id
        if (!id || id in icons) continue
        icons = { ...icons, [id]: null }
        void window.elecdex.launcher.icon(id).then((data) => {
          icons = { ...icons, [id]: data }
        })
        observer.unobserve(item.target)
      }
    },
    { root },
  )
  for (const tile of root.querySelectorAll('[data-id]')) observer.observe(tile)
  return () => observer.disconnect()
})

async function launch(entry: LauncherEntry | undefined): Promise<void> {
  if (!entry) return
  sfx.play('granted')
  status = { text: `starting ${entry.name}…`, error: false }
  const result = await window.elecdex.launcher.launch(entry.id)
  status = result.ok
    ? { text: `started ${entry.name}`, error: false }
    : { text: `${entry.name}: ${result.error}`, error: true }
  if (!result.ok) sfx.play('alarm')
  setTimeout(() => {
    status = null
  }, 4000)
}

function onFilterKey(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    void launch(visible[0])
  } else if (event.key === 'Escape') {
    filter = ''
  }
}

const initial = (name: string) =>
  name
    .replace(/[^\p{L}\p{N}]/gu, '')
    .slice(0, 2)
    .toUpperCase()
</script>

<div class="launcher" data-testid="launcher">
  <div class="bar">
    <input
      class="filter"
      bind:value={filter}
      onkeydown={onFilterKey}
      placeholder="type to find · enter to launch"
      spellcheck="false"
      data-testid="launcher-filter"
    />
    <button
      type="button"
      class="edit"
      title="Add your own entries under launcher.items in settings.json"
      onclick={() => void window.elecdex.settings.openFile()}
      data-testid="launcher-edit"
    >
      edit list
    </button>
  </div>

  {#if loading}
    <p class="empty">scanning applications…</p>
  {:else if visible.length === 0}
    <p class="empty" data-testid="launcher-empty">
      {entries.length === 0 ? 'no applications found' : `nothing matches “${filter}”`}
    </p>
  {:else}
    <ul class="grid" bind:this={grid}>
      {#each visible as entry, i (entry.id)}
        <li>
          <button
            type="button"
            class="tile"
            class:pinned={entry.source === 'user'}
            class:first={i === 0 && filter !== ''}
            title={entry.group ? `${entry.name} — ${entry.group}` : entry.name}
            onclick={() => void launch(entry)}
            data-id={entry.id}
            data-testid="launcher-entry"
            data-source={entry.source}
          >
            <span class="icon">
              {#if icons[entry.id]}
                <span class="glyph" style:--icon={`url("${icons[entry.id]}")`} data-testid="launcher-icon">
                  <img src={icons[entry.id]} alt="" />
                </span>
              {:else}
                <span class="monogram">{initial(entry.name)}</span>
              {/if}
            </span>
            <span class="name">{entry.name}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <p class="status" class:error={status?.error} data-testid="launcher-status">{status?.text ?? ''}</p>
</div>

<style>
.launcher {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) 0;
}

.bar {
  display: flex;
  gap: var(--space-2);
}

.filter {
  flex: 1;
  min-width: 0;
  padding: 0.15rem var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  outline: none;
}

.filter:focus {
  border-color: var(--accent);
}

.edit {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.edit:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5.2rem, 1fr));
  grid-auto-rows: 4.8rem;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  align-content: start;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  width: 100%;
  height: 100%;
  padding: var(--space-1);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.tile:hover,
.tile:focus-visible,
.tile.first {
  border-color: var(--panel-border);
  background: var(--accent-faint);
  outline: none;
}

.tile:active {
  background: var(--accent);
  color: var(--text-inverse);
}

.tile.pinned .monogram {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.icon {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
}

/* Tinted: the icon's silhouette cut from the accent, shaded by the icon itself. */
.glyph {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--accent);
  mask: var(--icon) center / contain no-repeat;
  isolation: isolate;
}

.glyph img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* Lifted so dark outlines become a dim accent rather than vanishing into black. */
  filter: grayscale(1) brightness(1.45) contrast(1.15);
  mix-blend-mode: multiply;
}

.tile:hover .glyph,
.tile:focus-visible .glyph {
  background: transparent;
}

.tile:hover .glyph img,
.tile:focus-visible .glyph img {
  filter: none;
  mix-blend-mode: normal;
}

.monogram {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border: 1px solid var(--panel-border);
  font-family: var(--font-display);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.name {
  max-width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  text-align: center;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  line-height: 1.15;
  word-break: break-word;
}

.empty {
  flex: 1;
  margin: 0;
  color: var(--text-muted);
  font-size: var(--step--1);
}

.status {
  min-height: 1.2em;
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.status.error {
  color: var(--danger);
}
</style>
