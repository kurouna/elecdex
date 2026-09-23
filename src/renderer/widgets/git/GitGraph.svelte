<script lang="ts">
import { ago } from '@shared/ai'
import { type GitGraphCommit, type GitLog, type GitLogScope, LOG_MAX, LOG_PAGE } from '@shared/git'
import { type GraphEdge, graphRows } from '@shared/git-graph'
import { landIn } from './motion.ts'

/**
 * The commit graph under the file list: each commit a row, with the lines of
 * its branches drawn to its left, the names pointing at it (the branch checked
 * out, other branches, remotes, tags) before its subject, and its age.
 *
 * The commits are main's answer to `git.log`, asked for while the pane is seen
 * and again when the state says the history moved (`historyAt`); the columns
 * and lines are `graphRows`' (shared/git-graph.ts). Clicking a commit shows its
 * files and diffs, as before; resting on one shows the whole commit (the card
 * is the pane's: `onhover` hands it the commit and where the row is).
 */
interface Props {
  repoId: string
  historyAt: number
  headOid: string | null
  selected: string | null
  visible: boolean
  scope: GitLogScope
  /** The rows of what the repository already is land without motion. */
  still: boolean
  now: number
  onselect: (oid: string) => void
  onscope: (scope: GitLogScope) => void
  onhover: (hover: { commit: GitGraphCommit; row: DOMRect; x: number } | null) => void
}

const {
  repoId,
  historyAt,
  headOid,
  selected,
  visible,
  scope,
  still,
  now,
  onselect,
  onscope,
  onhover,
}: Props = $props()

/** One row's height and one lane's width, in CSS pixels: the lines are drawn in these. */
const ROW = 20
const LANE = 11
/** Lanes drawn at most; a wider history is cut at the right, as its rows still say which commit. */
const MAX_LANES = 14
/** The lane colours, in the theme's own tokens, so every theme and both Business modes read. */
const COLORS = ['--accent', '--info', '--ok', '--warn', '--accent-strong', '--danger']

let log = $state.raw<GitLog | null>(null)
let count = $state(LOG_PAGE)

// Asked while the pane is seen, and again when the history moves, the scope changes or more is wanted.
$effect(() => {
  const request = { repoId, scope, count }
  if (!visible || historyAt === 0) return
  let cancelled = false
  void window.elecdex.git
    .log(request)
    .then((next) => {
      if (!cancelled && next !== null) log = next
    })
    .catch(() => {})
  return () => {
    cancelled = true
  }
})

const rows = $derived(graphRows(log?.commits ?? []))
const lanes = $derived(Math.min(MAX_LANES, Math.max(1, ...rows.map((row) => row.width))))
const width = $derived(lanes * LANE + 2)

const x = (column: number): number => column * LANE + LANE / 2 + 1
const color = (index: number): string => `var(${COLORS[index % COLORS.length]})`

/** A line from the top edge to the node's height, or from there to the bottom edge. */
function path(edge: GraphEdge, half: 'top' | 'bottom'): string {
  const [y0, y1] = half === 'top' ? [0, ROW / 2] : [ROW / 2, ROW]
  const [x0, x1] = [x(edge.from), x(edge.to)]
  if (x0 === x1) return `M${x0} ${y0}V${y1}`
  const mid = (y0 + y1) / 2
  return `M${x0} ${y0}C${x0} ${mid} ${x1} ${mid} ${x1} ${y1}`
}

let timer: ReturnType<typeof setTimeout> | null = null
function rest(commit: GitGraphCommit, event: PointerEvent | FocusEvent): void {
  if (timer !== null) clearTimeout(timer)
  const target = event.currentTarget as HTMLElement
  const pointer = 'clientX' in event ? event.clientX : null
  // A moment's rest before the card, so passing over the rows does not flash one per row.
  timer = setTimeout(() => {
    timer = null
    const row = target.getBoundingClientRect()
    onhover({ commit, row, x: pointer ?? row.left + width + 24 })
  }, 350)
}

function leave(): void {
  if (timer !== null) clearTimeout(timer)
  timer = null
  onhover(null)
}

$effect(() => () => {
  if (timer !== null) clearTimeout(timer)
})

const REF_MARK = { head: '', branch: '⎇ ', remote: '', tag: '◆ ' }
</script>

<div class="graph-head">
  <p class="label">LOG</p>
  <div class="scope" role="group" aria-label="Which history">
    <button
      type="button"
      class:on={scope === 'head'}
      data-testid="git-scope-head"
      title="This branch, with its upstream"
      onclick={() => onscope('head')}>BRANCH</button
    >
    <button
      type="button"
      class:on={scope === 'all'}
      data-testid="git-scope-all"
      title="Every branch, tag and remote"
      onclick={() => onscope('all')}>ALL</button
    >
  </div>
</div>
<div class="rows" onscroll={leave} data-testid="git-graph">
  {#each rows as row, i (row.oid)}
    {@const commit = log?.commits[i] as GitGraphCommit}
    <button
      type="button"
      class="commit"
      class:on={row.oid === selected}
      data-testid="git-commit"
      data-oid={row.oid}
      onclick={() => onselect(row.oid)}
      onpointerenter={(event) => rest(commit, event)}
      onpointerleave={leave}
      onfocus={(event) => rest(commit, event)}
      onblur={leave}
      in:landIn={{ still }}
    >
      <svg class="lanes" {width} height={ROW} viewBox="0 0 {width} {ROW}" aria-hidden="true">
        {#each row.top as edge, j (j)}
          <path d={path(edge, 'top')} style:stroke={color(edge.color)} />
        {/each}
        {#each row.bottom as edge, j (j)}
          <path d={path(edge, 'bottom')} style:stroke={color(edge.color)} />
        {/each}
        {#if row.oid === headOid}
          <circle class="head-ring" cx={x(row.column)} cy={ROW / 2} r="5.5" style:stroke={color(row.color)} />
        {/if}
        <circle
          class="node"
          class:merge={row.merge}
          data-testid="git-node"
          data-merge={row.merge}
          cx={x(row.column)}
          cy={ROW / 2}
          r={row.merge ? 3.2 : 3.4}
          style:--lane={color(row.color)}
        />
      </svg>
      <span class="hash">{commit.short}</span>
      <span class="subj"
        >{#each commit.refs as ref (`${ref.kind}:${ref.name}`)}<span
            class="ref {ref.kind}"
            class:current={ref.current}
            data-testid="git-ref"
            data-kind={ref.kind}>{REF_MARK[ref.kind]}{ref.name}</span
          >{/each}{commit.subject}</span
      >
      <span class="when">{ago(commit.time * 1000, now)}</span>
    </button>
  {:else}
    <p class="empty">{log === null ? 'reading…' : 'no commits yet'}</p>
  {/each}
  {#if log?.more && count < LOG_MAX}
    <button
      type="button"
      class="more"
      data-testid="git-more"
      onclick={() => (count = Math.min(LOG_MAX, count + LOG_PAGE))}>MORE</button
    >
  {/if}
</div>

<style>
.graph-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-2);
}

.label {
  margin: var(--space-1) 0 0;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.16em;
  color: var(--text-muted);
}

.scope {
  display: flex;
  gap: 0.25rem;
  margin-top: var(--space-1);
}

.scope button,
.more {
  padding: 0 0.45rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.12em;
  cursor: pointer;
}

.scope button.on {
  border-color: var(--accent);
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.scope button:hover,
.more:hover {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
}

.more {
  margin: 0.2rem var(--space-2);
}

.rows {
  min-height: 0;
  overflow: auto;
  padding-bottom: var(--space-1);
}

.commit {
  display: grid;
  grid-template-columns: auto 4.6em minmax(0, 1fr) auto;
  align-items: center;
  gap: 0 0.45rem;
  width: 100%;
  height: 20px;
  padding: 0 var(--space-2) 0 0.3rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-align: left;
  cursor: pointer;
}

.commit:hover,
.commit.on {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.lanes {
  display: block;
  overflow: hidden;
}

.lanes path {
  fill: none;
  stroke-width: 1.4;
}

.node {
  fill: var(--lane);
  stroke: var(--lane);
  stroke-width: 1;
}

/* A merge is a ring on the ground: it joins lines rather than adds to one. */
.node.merge {
  fill: var(--panel-bg);
  stroke-width: 1.6;
}

.head-ring {
  fill: none;
  stroke-width: 1.2;
}

.hash {
  color: var(--accent-strong);
}

.subj {
  overflow: hidden;
  color: var(--text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ref {
  margin-right: 0.4rem;
  padding: 0 0.3rem;
  border: 1px solid var(--accent-dim);
  color: var(--text);
  font-family: var(--font-ui);
  letter-spacing: 0.06em;
}

.ref.current,
.ref.head {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}

.ref.remote {
  border-style: dashed;
  color: var(--text-muted);
}

.ref.tag {
  border-color: var(--warn);
  color: var(--warn);
}

.empty {
  margin: 0 var(--space-2);
  color: var(--text-muted);
  font-family: var(--font-ui);
}
</style>
