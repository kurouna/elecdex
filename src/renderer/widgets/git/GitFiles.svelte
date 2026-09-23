<script lang="ts">
import type { GitArea, GitFile } from '@shared/git'
import { flip } from 'svelte/animate'
import { appearance } from '../../stores/appearance.svelte.ts'
import { foldOut, landIn } from './motion.ts'

/**
 * The files a repository has changed, in the lists git keeps them in - or the
 * files of a commit, in one list. Each row: git's letter for what happened, the
 * folder dim and the name bright (a long path loses its start, never its name),
 * and the lines added and removed with a five-cell gauge of how much.
 *
 * A file moving from one list to another is the same row moving (keyed by path,
 * animate:flip), so staging reads as a move rather than a flicker.
 */
interface Props {
  files: readonly GitFile[]
  selected: string | null
  /** Showing a commit's files rather than the working tree. */
  commit: boolean
  counts: Record<GitArea, number> | null
  dropped: number
  /** Rows arriving now are the first reading, not a change: no motion. */
  still: boolean
  repoPath: string
  onselect: (file: GitFile) => void
  onopen: (file: GitFile) => void
  onreveal: (file: GitFile) => void
}

const {
  files,
  selected,
  commit,
  counts,
  dropped,
  still,
  repoPath,
  onselect,
  onopen,
  onreveal,
}: Props = $props()

const AREAS: { area: GitArea; label: string }[] = [
  { area: 'conflicted', label: 'CONFLICTED' },
  { area: 'staged', label: 'STAGED' },
  { area: 'unstaged', label: 'UNSTAGED' },
  { area: 'untracked', label: 'UNTRACKED' },
]

const keyOf = (file: GitFile): string => `${file.area}:${file.path}`

/** One flat list with section heads, so rows can move between sections with flip. */
const rows = $derived.by(() => {
  if (commit) return files.map((file) => ({ kind: 'file' as const, key: keyOf(file), file }))
  const out: (
    | { kind: 'head'; key: string; label: string; count: number; area: GitArea }
    | { kind: 'file'; key: string; file: GitFile }
  )[] = []
  // A file is keyed by its path, so staging it moves its row; only a file in two
  // lists at once (staged, then edited again) keys its second row by the list too.
  const used = new Set<string>()
  for (const { area, label } of AREAS) {
    const inArea = files.filter((file) => file.area === area)
    if (inArea.length === 0) continue
    out.push({
      kind: 'head',
      key: `head:${area}`,
      label,
      count: counts?.[area] ?? inArea.length,
      area,
    })
    for (const file of inArea) {
      const key = used.has(file.path) ? `file:${file.path}:${area}` : `file:${file.path}`
      used.add(file.path)
      out.push({ kind: 'file', key, file })
    }
  }
  return out
})

/** Cells lit in the five-cell gauge: added then removed, in proportion, at least one each. */
function cells(file: GitFile): ('a' | 'd' | '')[] {
  const added = file.added ?? 0
  const deleted = file.deleted ?? 0
  const total = added + deleted
  if (total === 0) return ['', '', '', '', '']
  const lit = Math.min(5, Math.max(1, Math.ceil(Math.log2(total + 1))))
  let a = Math.round((added / total) * lit)
  if (added > 0 && a === 0) a = 1
  if (deleted > 0 && a === lit) a = lit - 1
  return Array.from({ length: 5 }, (_, i) => (i < a ? 'a' : i < lit ? 'd' : ''))
}

const folder = (path: string): string =>
  path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : ''
const name = (path: string): string => path.slice(path.lastIndexOf('/') + 1)

let menu = $state<{ file: GitFile; x: number; y: number } | null>(null)
let list = $state<HTMLElement | null>(null)

function showMenu(event: MouseEvent, file: GitFile): void {
  event.preventDefault()
  const box = list?.getBoundingClientRect()
  menu = {
    file,
    x: event.clientX - (box?.left ?? 0),
    y: event.clientY - (box?.top ?? 0) + (list?.scrollTop ?? 0),
  }
}

function copy(text: string): void {
  void navigator.clipboard?.writeText(text)
  menu = null
}

const fullPath = (file: GitFile): string =>
  `${repoPath}${repoPath.includes('\\') ? '\\' : '/'}${repoPath.includes('\\') ? file.path.replaceAll('/', '\\') : file.path}`
</script>

<svelte:window onpointerdown={(event) => {
  if (menu !== null && !(event.target as Element).closest?.('.menu')) menu = null
}} onkeydown={(event) => {
  if (event.key === 'Escape') menu = null
}} />

<div class="files" bind:this={list} data-testid="git-files">
  {#each rows as row (row.key)}
    <div class="slot" animate:flip={{ duration: appearance.reducedMotion ? 0 : 180 }} in:landIn={{ still }} out:foldOut>
      {#if row.kind === 'head'}
        <p class="section" data-area={row.area}>{row.label}<span>{row.count}</span></p>
      {:else}
        {@const file = row.file}
        <button
          type="button"
          class="file"
          class:on={keyOf(file) === selected}
          data-testid="git-file"
          data-area={file.area}
          data-path={file.path}
          title={file.from ? `${file.from} → ${file.path}` : file.path}
          onclick={() => onselect(file)}
          ondblclick={() => onopen(file)}
          oncontextmenu={(event) => showMenu(event, file)}
        >
          <span class="code c-{file.code === '?' ? 'Q' : file.code}">{file.code}</span>
          <span class="path"><span class="dir">{folder(file.path)}</span><span class="name"
              >{name(file.path)}</span
            ></span>
          <span class="stat">
            {#if file.binary}BIN{:else if file.added !== null}
              <span class="plus">+{file.added}</span>{#if (file.deleted ?? 0) > 0}<span class="minus">
                  −{file.deleted}</span
                >{/if}
            {:else if file.area === 'untracked'}new{/if}
            <span class="cells" aria-hidden="true"
              >{#each cells(file) as cell, i (i)}<i class={cell}></i>{/each}</span
            >
          </span>
        </button>
      {/if}
    </div>
  {:else}
    <p class="clean" data-testid="git-clean">{commit ? 'no files' : 'working tree clean'}</p>
  {/each}
  {#if dropped > 0}<p class="clean">+{dropped} more not listed</p>{/if}

  {#if menu !== null}
    {@const file = menu.file}
    <div class="menu" role="menu" style:left="{menu.x}px" style:top="{menu.y}px" data-testid="git-menu">
      <button type="button" role="menuitem" onclick={() => { onopen(file); menu = null }}>Open</button>
      <button type="button" role="menuitem" onclick={() => copy(file.path)}>Copy relative path</button>
      <button type="button" role="menuitem" onclick={() => copy(fullPath(file))}>Copy full path</button>
      {#if !commit || file.code !== 'D'}
        <button type="button" role="menuitem" onclick={() => { onreveal(file); menu = null }}
          >Show in folder</button
        >
      {/if}
    </div>
  {/if}
</div>

<style>
.files {
  position: relative;
  overflow: auto;
  min-height: 0;
  padding-bottom: var(--space-1);
}

.section {
  display: flex;
  justify-content: space-between;
  margin: 0;
  padding: 0.35rem var(--space-2) 0.1rem;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.16em;
  color: var(--text-muted);
}

.section[data-area='conflicted'] {
  color: var(--danger);
}

.file {
  display: grid;
  grid-template-columns: 1.1em minmax(0, 1fr) auto;
  align-items: center;
  gap: 0 0.5rem;
  width: 100%;
  padding: 0.02rem var(--space-2);
  border: none;
  border-left: 2px solid transparent;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  text-align: left;
  cursor: pointer;
}

.file:hover {
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

.file.on {
  border-left-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 13%, transparent);
}

.code {
  font-weight: 600;
  text-align: center;
}

.c-M,
.c-T {
  color: var(--warn);
}

.c-A,
.c-C {
  color: var(--ok);
}

.c-D,
.c-U {
  color: var(--danger);
}

.c-R,
.c-Q {
  color: var(--info);
}

/*
 * A long path gives up its folder first, from the end, and keeps the file name
 * whole as long as it can: the name is what the row is about.
 */
.path {
  display: flex;
  min-width: 0;
  white-space: nowrap;
}

.dir {
  overflow: hidden;
  flex-shrink: 1;
  min-width: 0;
  color: var(--text-muted);
  text-overflow: ellipsis;
}

.name {
  overflow: hidden;
  flex-shrink: 0;
  max-width: 100%;
  text-overflow: ellipsis;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--step--2);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.plus {
  color: var(--ok);
}

.minus {
  color: var(--danger);
}

.cells {
  display: inline-flex;
  gap: 1px;
}

.cells i {
  display: block;
  width: 0.28rem;
  height: 0.5rem;
  background: var(--panel-rule);
}

.cells i.a {
  background: var(--ok);
}

.cells i.d {
  background: var(--danger);
}

.clean {
  margin: var(--space-2);
  font-family: var(--font-ui);
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.menu {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  min-width: 11rem;
  padding: 0.2rem 0;
  border: 1px solid var(--accent);
  background: var(--panel-bg-raised);
  box-shadow: 0 0.3rem 1rem rgb(0 0 0 / 0.45);
}

.menu button {
  padding: 0.15rem 0.7rem;
  border: none;
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.04em;
  text-align: left;
  cursor: pointer;
}

.menu button:hover {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
}

@container (max-width: 22rem) {
  .cells {
    display: none;
  }
}
</style>
