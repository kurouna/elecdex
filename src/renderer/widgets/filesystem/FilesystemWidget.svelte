<script lang="ts">
import type { DirEntry, DirListing, DriveInfo } from '@shared/fs'
import { formatBytes } from '../../lib/format.ts'
import { cdCommand, quotePath, shellKindOf } from '../../lib/shell-quote.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sessions } from '../../stores/sessions.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import FsIcon from './FsIcon.svelte'

/**
 * eDEX-UI's filesystem display: the followed terminal's working directory as a
 * grid of entries. Volume usage is the disk pane's job.
 *
 *  - It follows the terminal focused most recently, through shell integration
 *    (OSC 7), so it tracks `cd` on Windows too - which the original could not.
 *  - Clicking a directory types `cd <dir>` into that terminal and runs it;
 *    clicking a file types its quoted path at the prompt, for the next command.
 *  - With no terminal to follow, or one whose shell reports no directory, it
 *    browses on its own ("detached"), as the original did when tracking failed.
 */
const { paneId }: WidgetProps = $props()

const followedId = $derived(layout.followedTerminalId)
const terminal = $derived(followedId === null ? null : sessions.get(followedId))
/** The terminal can be driven: it has a live session that reports its cwd. */
const attached = $derived(
  terminal !== null &&
    terminal.sessionId !== null &&
    terminal.cwd !== null &&
    terminal.exited === null,
)

let home = $state<string | null>(null)
let detachedPath = $state<string | null>(null)
let showDrives = $state(false)

let listing = $state.raw<DirListing | null>(null)
let drives = $state.raw<DriveInfo[] | null>(null)
let error = $state<string | null>(null)
/** Bumped by the directory watcher, to re-read without the path changing. */
let revision = $state(0)

$effect(() => {
  void window.elecdex.system.info().then((info) => {
    home = info.host.home
  })
})

/** A primitive, so effects below re-run on a cd - not on every session update. */
const terminalCwd = $derived(terminal?.cwd ?? null)
const path = $derived(attached ? terminalCwd : (detachedPath ?? terminalCwd ?? home))

// A cd in the terminal ends any detour through the drive list.
$effect(() => {
  void terminalCwd
  showDrives = false
})

// Read the directory and its volume whenever the path changes or its contents do.
$effect(() => {
  const dir = path
  void revision
  if (dir == null) return
  let stale = false

  void window.elecdex.fs.readDir(dir).then((result) => {
    if (stale) return
    if (result.ok) {
      listing = result.listing
      error = null
    } else {
      error = result.error
    }
  })
  return () => {
    stale = true
  }
})

/**
 * A primitive, so a re-read (a new listing for the same path) keeps the watch:
 * reopening it would cost two IPC calls and drop a change main is holding back.
 */
const watchedPath = $derived(listing?.path)

// Watch the directory being shown, so files created by a command appear.
$effect(() => {
  const dir = watchedPath
  if (dir === undefined) return
  return window.elecdex.fs.watch(dir, () => {
    revision += 1
  })
})

$effect(() => {
  if (!showDrives) return
  let stale = false
  void window.elecdex.fs.drives().then((result) => {
    if (!stale) drives = result
  })
  return () => {
    stale = true
  }
})

$effect(() => {
  paneMeta.set(paneId, {
    subtitle: showDrives ? 'drives' : (listing?.path ?? path ?? ''),
    ...(attached ? {} : { badge: 'detached', badgeKind: 'warn' as const }),
  })
})

const separator = $derived(listing !== null && /^[A-Za-z]:|\\/.test(listing.path) ? '\\' : '/')

function join(dir: string, name: string): string {
  return dir.endsWith(separator) ? `${dir}${name}` : `${dir}${separator}${name}`
}

/** Types into the followed terminal and hands it the keyboard. */
function typeIntoTerminal(text: string): void {
  sfx.play('folder')
  const sessionId = terminal?.sessionId
  if (followedId === null || sessionId == null) return
  window.elecdex.pty.write(sessionId, text)
  layout.focus(followedId)
}

function enter(dir: string, relative?: string): void {
  showDrives = false
  if (attached && terminal) {
    const kind = shellKindOf(terminal.shell)
    typeIntoTerminal(`${cdCommand(relative ?? dir, kind)}\r`)
  } else {
    sfx.play('folder')
    detachedPath = dir
  }
}

function open(entry: DirEntry): void {
  if (listing === null) return
  const full = join(listing.path, entry.name)
  if (entry.kind === 'dir' || (entry.kind === 'symlink' && entry.targetIsDir)) {
    enter(full, entry.name)
  } else if (attached && terminal) {
    typeIntoTerminal(`${quotePath(full, shellKindOf(terminal.shell))} `)
  }
}

function up(): void {
  if (listing?.parent == null) return
  if (attached) typeIntoTerminal('cd ..\r')
  else detachedPath = listing.parent
}

/** Tiles fade in one after another, as in the original, but the tail is not made to wait. */
const stagger = (index: number) => `${Math.min(index, 40) * 12}ms`
</script>

<div class="fs" data-testid="filesystem" data-attached={attached}>
  {#if showDrives}
    <ul class="grid" data-testid="fs-drives">
      <li>
        <button type="button" class="tile" onclick={() => (showDrives = false)} style:--delay={stagger(0)}>
          <FsIcon kind="up" />
          <span class="name">back</span>
        </button>
      </li>
      {#each drives ?? [] as drive, i (drive.path)}
        <li>
          <button
            type="button"
            class="tile"
            title={`${drive.path} — ${formatBytes(drive.free)} free of ${formatBytes(drive.total)}`}
            onclick={() => enter(drive.path)}
            style:--delay={stagger(i + 1)}
            data-testid="fs-drive"
          >
            <FsIcon kind="drive" />
            <span class="name">{drive.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else if error !== null}
    <p class="error" data-testid="fs-error">cannot read {path}: {error}</p>
  {:else if listing !== null}
    {#key listing.path}
      <ul class="grid" data-testid="fs-entries">
        <li>
          <button type="button" class="tile" onclick={() => (showDrives = true)} style:--delay={stagger(0)} data-testid="fs-show-drives">
            <FsIcon kind="drive" />
            <span class="name">drives</span>
          </button>
        </li>
        {#if listing.parent !== null}
          <li>
            <button type="button" class="tile" onclick={up} style:--delay={stagger(1)} data-testid="fs-up">
              <FsIcon kind="up" />
              <span class="name">..</span>
            </button>
          </li>
        {/if}
        {#each listing.entries as entry, i (entry.name)}
          <li>
            <button
              type="button"
              class="tile"
              class:hidden-entry={entry.hidden}
              title={entry.kind === 'file' ? `${entry.name} — ${formatBytes(entry.size)}` : entry.name}
              onclick={() => open(entry)}
              style:--delay={stagger(i + 2)}
              data-testid="fs-entry"
              data-kind={entry.kind}
              data-name={entry.name}
            >
              <FsIcon kind={entry.kind === 'symlink' && entry.targetIsDir ? 'dirlink' : entry.kind} />
              <span class="name">{entry.name}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/key}
    {#if listing.truncated}
      <p class="note">showing the first {listing.entries.length} entries</p>
    {/if}
  {/if}

</div>

<style>
.fs {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) 0;
}

.grid {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(4.4rem, 1fr));
  grid-auto-rows: 4.4rem;
  gap: var(--space-2);
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
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  cursor: pointer;
  /* backwards, not both: hidden through its delay, then gone once played. A fill
     that outlasts the animation keeps it "active", and Chromium then keeps every
     tile on a GPU layer of its own for good, compositing them all each frame. */
  animation: tile-in 200ms linear var(--delay, 0ms) backwards;
}

.tile:hover,
.tile:focus-visible {
  background: var(--accent-faint);
  outline: none;
}

/* The original's click feedback: a quick blink of the accent. */
.tile:active {
  animation: tile-blink 100ms linear infinite;
}

.tile :global(svg) {
  width: 2.2rem;
  height: 2.2rem;
}

.hidden-entry {
  opacity: 0.6;
}

@keyframes tile-in {
  from {
    opacity: 0;
  }
}

@keyframes tile-blink {
  50% {
    background: var(--accent);
    color: var(--text-inverse);
  }
}

.name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-ui);
  font-size: var(--step--1);
}

.error,
.note {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.error {
  flex: 1;
  color: var(--warn);
}
</style>
