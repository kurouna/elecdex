<script lang="ts">
import {
  type GitDiff,
  type GitFile,
  type GitGraphCommit,
  type GitLogScope,
  type GitState,
  isCommitId,
  isRepoId,
} from '@shared/git'
import { type GitSyncAction, syncHeadline, syncTone } from '@shared/git-sync'
import { untrack } from 'svelte'
import { onBoundary } from '../../lib/frame-loop.ts'
import { anchorOf, type CardAnchor, type CardSize } from '../../lib/hover-card.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { toasts } from '../../stores/toasts.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import DiffView from '../common/DiffView.svelte'
import Splitter from '../common/Splitter.svelte'
import type { WidgetProps } from '../registry.ts'
import GitChooser from './GitChooser.svelte'
import GitCommitCard from './GitCommitCard.svelte'
import GitFileCard from './GitFileCard.svelte'
import GitFiles from './GitFiles.svelte'
import GitGraph from './GitGraph.svelte'
import GitHead from './GitHead.svelte'
import { isNews, keyOf } from './rows.ts'

/**
 * One git repository, read only: its branch, what changed, the diff of the file
 * chosen, and the commit graph.
 *
 * The pane knows its repository by an id (pane state `repo`), which main maps to
 * a folder in git-repos.json; main watches that folder while the pane is open
 * and sends a new state after each change. Nothing here polls, and nothing is
 * connected to any other pane - a second git pane is simply a second repository.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
/** Shown in its tab, with the window on screen: what the pane does for the eye runs only then. */
const visible = $derived(seen(inTab))

const repoId = $derived(isRepoId(paneState?.repo) ? paneState.repo : null)
/** The file chosen, as `area:path`, and the commit being looked at instead of the tree. */
const chosen = $derived(typeof paneState?.chosen === 'string' ? paneState.chosen : null)
const commit = $derived(isCommitId(paneState?.commit) ? paneState.commit : null)
const split = $derived(paneState?.split === true)
/** The graph's history: this branch with its upstream (the default), or everything. */
const scope = $derived<GitLogScope>(paneState?.graph === 'all' ? 'all' : 'head')

/**
 * The lines between the parts, as shares the user drags and the pane keeps:
 * how wide the list is beside the diff, and how much of the list's height the
 * log takes. Kept in pane state, so each pane has its own and a restart keeps it.
 */
const LIST_WIDTH = { min: 0.15, max: 0.7, reset: 0.34 }
const LOG_SHARE = { min: 0.15, max: 0.85, reset: 0.6 }
const share = (value: unknown, range: { min: number; max: number; reset: number }): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(range.max, Math.max(range.min, value))
    : range.reset
/** While a line is being dragged: drawn from here, saved when it is let go. */
let draggedWidth = $state<number | null>(null)
let draggedLog = $state<number | null>(null)
const listWidth = $derived(draggedWidth ?? share(paneState?.listWidth, LIST_WIDTH))
const logShare = $derived(draggedLog ?? share(paneState?.logShare, LOG_SHARE))
let bodyEl = $state<HTMLElement | null>(null)
let rootEl = $state<HTMLElement | null>(null)
let leftEl = $state<HTMLElement | null>(null)

const setState = (patch: Record<string, unknown>): void => {
  widgetState.patch(paneId, patch)
}

let repoState = $state.raw<GitState | null>(null)
let diff = $state.raw<GitDiff | null>(null)
let loadingDiff = $state(false)
let commitFiles = $state.raw<GitFile[] | null>(null)
let choosing = $state(false)
/** Bumped on each state after the first: the receive lamp and the branch change play on it. */
let received = $state(0)
/** Until a reading after the first: the rows of what the repository already is land without motion. */
let quiet = $state(true)
let switching = $state(false)
let now = $state(Date.now())

/**
 * Main watches the repository only while the pane is on screen: behind another
 * tab it reads nothing and runs no git. What was shown stays, so coming back is
 * the last reading at once and then a fresh one - which, if the repository
 * moved on meanwhile, lands as the change it is.
 */
let shownRepo: string | null = null

$effect(() => {
  const id = repoId
  if (id !== shownRepo) {
    repoState = null
    diff = null
    quiet = true
    shownRepo = id
  }
  if (id === null || !visible) return
  // Coming back with a reading on screen: main's next one is news only if it differs.
  let back = untrack(() => (repoState?.readAt ?? 0) !== 0)
  return window.elecdex.git.subscribe(id, (next) => {
    const before = untrack(() => repoState)
    // Main's word before its first reading after a return is not news: keep what is shown.
    if (next.readAt === 0 && before !== null && before.readAt !== 0 && next.problem === null) return
    repoState = next
    // The first reading is what the repository is, not a change to it.
    const news = isNews(before, next, back)
    if (before !== null && next.readAt !== before.readAt) back = false
    if (!news || before === null) return
    quiet = false
    received += 1
    if (before.branch.head !== next.branch.head) switching = true
  })
})

// The log's "2h" moves on by itself; once a minute is as fine as it reads.
$effect(() => {
  if (!visible) return
  now = Date.now()
  return onBoundary(60_000, () => {
    now = Date.now()
  })
})

/** The files shown: the working tree's, or the chosen commit's. */
const files = $derived(commit !== null ? (commitFiles ?? []) : (repoState?.files ?? []))
/** The chosen file if it is still listed, else the first one: a pane always shows a diff if it can. */
const selected = $derived(files.find((file) => keyOf(file) === chosen) ?? files[0] ?? null)

$effect(() => {
  const id = repoId
  const oid = commit
  commitFiles = null
  if (id === null || oid === null) return
  // Commits clicked in quick succession: only the last one's files may land.
  let cancelled = false
  void window.elecdex.git.commit(id, oid).then((list) => {
    if (!cancelled) commitFiles = list ?? []
  })
  return () => {
    cancelled = true
  }
})

/**
 * Which diff is wanted, as a string, so the effect below runs for another file
 * and not for every new list that holds the same one.
 */
const wanted = $derived(
  repoId === null || selected === null
    ? null
    : [repoId, commit ?? '', selected.area, selected.from ?? '', selected.path].join('\u0000'),
)
/** A commit's diff never changes; the working tree's may whenever main reads it again. */
const readAgain = $derived(commit === null ? (repoState?.readAt ?? 0) : 0)
/** The diff on screen is of this; another file's is never shown under this one's name. */
let shownFor: string | null = null

$effect(() => {
  const key = wanted
  void readAgain
  const id = repoId
  const file = untrack(() => selected)
  const oid = commit
  if (key !== shownFor) {
    // Another file: the last one's lines go at once, and none of the next one's counts as new.
    diff = null
    shownFor = key
  }
  if (key === null || id === null || file === null) return
  if (file.path.endsWith('/')) {
    // git lists a repository inside this one, not yet added, as its folder.
    diff = {
      repoId: id,
      path: file.path,
      binary: false,
      cut: false,
      tooLarge: false,
      hunks: [],
      problem: 'a folder: a repository of its own inside this one',
    }
    return
  }
  let cancelled = false
  loadingDiff = true
  const request =
    oid !== null
      ? { repoId: id, path: file.path, commit: oid, ...(file.from ? { from: file.from } : {}) }
      : { repoId: id, path: file.path, area: file.area }
  void window.elecdex.git
    .diff(request)
    .then((next) => {
      if (!cancelled) diff = next
    })
    .catch(() => {})
    .finally(() => {
      if (!cancelled) loadingDiff = false
    })
  return () => {
    cancelled = true
  }
})

/**
 * The fetch, pull or push under way from this pane. Kept here, not in the header, so
 * the pane still says so when it comes back from the chooser while one runs.
 */
let syncing = $state<GitSyncAction | null>(null)

/**
 * Runs a fetch, a fast-forward pull or a push in main and says how it ended: the short
 * code first, git's own words beside it. The new state arrives by the usual way.
 */
async function syncRepo(action: GitSyncAction): Promise<void> {
  if (repoId === null || syncing !== null) return
  const where = [repoState?.repo?.name, repoState?.branch.head].filter(Boolean).join(' · ')
  syncing = action
  try {
    const result = await window.elecdex.git.sync(repoId, action)
    if (result === null) {
      // Main would not run it for this page: say so rather than nothing.
      toasts.show({ title: `CANNOT ${action.toUpperCase()}`, body: where, tone: 'warn' })
      return
    }
    toasts.show({
      title: syncHeadline(result),
      body: [where, result.message].filter(Boolean).join(' — '),
      tone: syncTone(result.code),
    })
  } finally {
    syncing = null
  }
}

async function open(file: GitFile, line: number | null): Promise<void> {
  if (repoId === null) return
  const result = await window.elecdex.git.open(repoId, file.path, line)
  if (!result.ok)
    toasts.show({ title: `Cannot open ${file.path}`, body: result.message, tone: 'warn' })
}

$effect(() => {
  const repo = repoState?.repo
  if (repoId === null || repo == null) {
    paneMeta.set(paneId, { subtitle: repoId === null ? 'no repository' : 'reading…' })
    return
  }
  const changed = repoState?.files.length ?? 0
  paneMeta.set(paneId, {
    subtitle: `${repo.name} · ${changed === 0 ? 'clean' : `${changed} changed`}`,
    ...(repoState?.operation ? { badge: repoState.operation, badgeKind: 'warn' as const } : {}),
  })
})

/**
 * The commit the pointer rests on in the graph, where its card goes (in the
 * pane's own pixels), and the files it changed once read. Each commit's files
 * are read once: a commit never changes.
 */
let hover = $state.raw<{
  commit: GitGraphCommit
  anchor: CardAnchor
  bounds: CardSize
} | null>(null)
let hoverFiles = $state.raw<GitFile[] | null>(null)
const filesOf = new Map<string, GitFile[]>()

function onhover(next: { commit: GitGraphCommit; row: DOMRect; x: number } | null): void {
  if (next === null || rootEl === null || repoId === null) {
    hover = null
    return
  }
  const box = rootEl.getBoundingClientRect()
  hover = {
    commit: next.commit,
    anchor: anchorOf(box, next.row, next.x),
    bounds: { width: box.width, height: box.height },
  }
  const oid = next.commit.oid
  const known = filesOf.get(oid)
  hoverFiles = known ?? null
  if (known !== undefined) return
  const id = repoId
  void window.elecdex.git.commit(id, oid).then((list) => {
    if (list === null || repoId !== id) return
    filesOf.set(oid, list)
    if (hover?.commit.oid === oid) hoverFiles = list
  })
}

/** The changed file whose card is up, and where its row is (the pane's pixels). */
let fileHover = $state.raw<{ file: GitFile; anchor: CardAnchor; bounds: CardSize } | null>(null)

function onfilehover(next: { file: GitFile; row: DOMRect; x: number | null } | null): void {
  if (next === null || rootEl === null) {
    fileHover = null
    return
  }
  const box = rootEl.getBoundingClientRect()
  fileHover = {
    file: next.file,
    anchor: anchorOf(box, next.row, next.x),
    bounds: { width: box.width, height: box.height },
  }
}

// Another repository, or the pane put away: no card stays behind, and no files are kept for it.
$effect(() => {
  void repoId
  if (!visible) {
    hover = null
    fileHover = null
  }
  return () => {
    hover = null
    fileHover = null
    filesOf.clear()
  }
})
</script>

<div class="git" data-testid="git" data-pane-id={paneId} bind:this={rootEl}>
  {#if repoId === null || choosing}
    <GitChooser
      current={repoId}
      onchoose={(id) => {
        choosing = false
        setState({ repo: id, chosen: null, commit: null })
      }}
      onback={() => (choosing = false)}
      onchange={() => (choosing = true)}
    />
  {:else if repoState?.problem}
    <GitChooser
      current={repoId}
      trouble={repoState.problem === 'unknown'
        ? 'This repository is not known on this machine.'
        : repoState.message || repoState.problem}
      onchange={() => (choosing = true)}
    />
  {:else}
    <GitHead
      state={repoState}
      {visible}
      {received}
      {syncing}
      onsync={(action) => void syncRepo(action)}
      onswitch={() => (choosing = true)}
    />

    {#if commit !== null}
      <div class="viewing" data-testid="git-viewing">
        VIEWING <span class="hash">{commit.slice(0, 7)}</span>
        <button type="button" onclick={() => setState({ commit: null, chosen: null })}
          >← WORKING TREE</button
        >
      </div>
    {/if}

    <div
      class="body"
      bind:this={bodyEl}
      style:--list-width="{listWidth * 100}%"
      class:switching
      onanimationend={(event) => {
        if (event.animationName === 'git-switch') switching = false
      }}
    >
      <div
        class="left"
        bind:this={leftEl}
        style:grid-template-rows="minmax(0, {1 - logShare}fr) minmax(0, {logShare}fr)"
      >
        <Splitter
          axis="x"
          value={listWidth}
          min={LIST_WIDTH.min}
          max={LIST_WIDTH.max}
          reset={LIST_WIDTH.reset}
          label="Width of the file list"
          testid="git-split-width"
          within={() => bodyEl}
          onmove={(next) => (draggedWidth = next)}
          ondone={(next) => {
            draggedWidth = null
            setState({ listWidth: next })
          }}
        />
        <GitFiles
          {files}
          selected={selected === null ? null : keyOf(selected)}
          commit={commit !== null}
          dropped={commit !== null ? 0 : (repoState?.dropped ?? 0)}
          still={quiet}
          onselect={(file) => setState({ chosen: keyOf(file) })}
          onopen={(file) => void open(file, null)}
          onreveal={(file) => repoId !== null && void window.elecdex.git.reveal(repoId, file.path)}
          repoPath={repoState?.repo?.path ?? ''}
          onhover={onfilehover}
        />
        <div class="log" data-testid="git-log">
          <Splitter
            axis="y"
            value={1 - logShare}
            min={1 - LOG_SHARE.max}
            max={1 - LOG_SHARE.min}
            reset={1 - LOG_SHARE.reset}
            label="Height of the log"
            testid="git-split-log"
            within={() => leftEl}
            onmove={(next) => (draggedLog = 1 - next)}
            ondone={(next) => {
              draggedLog = null
              setState({ logShare: 1 - next })
            }}
          />
          {#if repoId !== null}
            {#key repoId}
              <GitGraph
                {repoId}
                historyAt={repoState?.historyAt ?? 0}
                headOid={repoState?.branch.oid ?? null}
                selected={commit}
                {visible}
                {scope}
                still={quiet}
                {now}
                onselect={(oid) => setState({ commit: oid === commit ? null : oid, chosen: null })}
                onscope={(next) => setState({ graph: next === 'all' ? 'all' : undefined })}
                {onhover}
              />
            {/key}
          {/if}
        </div>
      </div>
      <div class="right">
        <DiffView
          {diff}
          path={selected?.path ?? ''}
          loading={loadingDiff}
          {split}
          onsplit={(next) => setState({ split: next })}
          onopenline={(line) => selected !== null && void open(selected, line)}
        />
      </div>
    </div>
    {#if fileHover !== null}
      <GitFileCard
        file={fileHover.file}
        repoPath={repoState?.repo?.path ?? ''}
        commit={commit !== null}
        anchor={fileHover.anchor}
        bounds={fileHover.bounds}
      />
    {/if}
    {#if hover !== null}
      <GitCommitCard commit={hover.commit} files={hoverFiles} anchor={hover.anchor} bounds={hover.bounds} />
    {/if}
  {/if}
</div>

<style>
.git {
  container-type: inline-size;
  /* The commit card is laid over the pane, placed in its pixels. */
  position: relative;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
}

.viewing button {
  padding: 0.15rem 0.6rem;
  border: 1px solid var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.14em;
  cursor: pointer;
}

.viewing button:hover {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
}

/* The commit being viewed, in the bar under the header. */
.hash {
  flex-shrink: 0;
  color: var(--accent-strong);
}

.viewing {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.15rem var(--space-2);
  border-bottom: 1px solid var(--panel-rule);
  background: color-mix(in srgb, var(--info) 8%, transparent);
  color: var(--info);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.16em;
}

.viewing button {
  margin-left: auto;
  padding: 0 0.5rem;
  font-size: var(--step--2);
}

.body {
  display: grid;
  grid-template-columns: minmax(10rem, var(--list-width, 34%)) minmax(0, 1fr);
  grid-row: 3;
  min-height: 0;
}

/*
 * The branch changed under the pane: the whole working tree is another one, so
 * the pane powers off to a line and back, as a layout switch does, rather than
 * letting every row change at once. Transform only; played once.
 */
.body.switching {
  animation: git-switch calc(420ms * var(--motion-scale)) var(--ease-emphasized);
}

@keyframes git-switch {
  0% {
    transform: scaleY(1);
  }
  40% {
    transform: scaleY(0.03);
    opacity: 0.6;
  }
  100% {
    transform: scaleY(1);
  }
}

.left {
  display: grid;
  /* The rows are the shares the user set (style), the log three fifths by default: it is most of what there is to read. */
  grid-template-rows: minmax(0, 2fr) minmax(0, 3fr);
  position: relative;
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--panel-rule);
}

.right {
  min-width: 0;
  min-height: 0;
}

/* The graph's header stays; its rows scroll (GitGraph). */
.log {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  position: relative;
  min-height: 0;
  overflow: hidden;
  border-top: 1px solid var(--panel-rule);
}

/* Narrow: the list above the diff, rather than a sliver beside it. */
@container (max-width: 40rem) {
  .body {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 2fr) minmax(0, 3fr);
  }

  .left {
    border-right: none;
    border-bottom: 1px solid var(--panel-rule);
  }

  /* Stacked, the list has no width of its own to set. */
  .left > :global(.splitter.x) {
    display: none;
  }
}
</style>
