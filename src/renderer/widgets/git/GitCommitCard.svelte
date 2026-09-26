<script lang="ts">
import type { GitFile, GitGraphCommit } from '@shared/git'
import type { CardAnchor, CardSize } from '../../lib/hover-card.ts'
import HoverCard from '../common/HoverCard.svelte'

/**
 * The whole of a commit, shown while the pointer rests on its row in the graph:
 * its message, who wrote it and when, the names on it, its parents, and what it
 * changed. The message is the repository's text, drawn as text.
 *
 * The frame and its place are every detail card's (HoverCard, architecture.md §7.4).
 */
interface Props {
  commit: GitGraphCommit
  /** The files it changed, or null while they are read. */
  files: GitFile[] | null
  /** Its row, in the pane's own pixels; it keeps inside `bounds`. */
  anchor: CardAnchor
  bounds: CardSize
}

const { commit, files, anchor, bounds }: Props = $props()

const summary = $derived.by(() => {
  if (files === null) return 'reading the files…'
  let added = 0
  let deleted = 0
  for (const file of files) {
    added += file.added ?? 0
    deleted += file.deleted ?? 0
  }
  const count = `${files.length} file${files.length === 1 ? '' : 's'} changed`
  return `${count} · +${added} −${deleted}`
})

const when = $derived(new Date(commit.time * 1000).toLocaleString())
const REF_MARK = { head: '', branch: '⎇ ', remote: '', tag: '◆ ' }
</script>

<HoverCard {anchor} {bounds} testid="git-card">
  <p class="meta">
    <span class="hash">{commit.short}</span>
    <span class="author">{commit.author}</span>
    <span class="date">{when}</span>
  </p>
  {#if commit.refs.length > 0}
    <p class="refs">
      {#each commit.refs as ref (`${ref.kind}:${ref.name}`)}
        <span class="ref {ref.kind}" class:current={ref.current}>{REF_MARK[ref.kind]}{ref.name}</span>
      {/each}
    </p>
  {/if}
  <p class="subject" data-testid="git-card-subject">{commit.subject}</p>
  {#if commit.body !== ''}<p class="body" data-testid="git-card-body">{commit.body}</p>{/if}
  <p class="foot">
    <span data-testid="git-card-files">{summary}</span>
    {#if commit.parents.length > 1}
      <span>merge of {commit.parents.map((p) => p.slice(0, 7)).join(' + ')} · files against the first</span>
    {:else if commit.parents.length === 1}
      <span>parent {commit.parents[0]?.slice(0, 7)}</span>
    {:else}
      <span>the first commit</span>
    {/if}
  </p>
</HoverCard>

<style>
p {
  margin: 0;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.7rem;
  color: var(--text-muted);
  font-size: var(--step--1);
}

.hash {
  color: var(--accent-strong);
}

.author {
  color: var(--text);
}

.refs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.25rem;
}

.ref {
  padding: 0 0.3rem;
  border: 1px solid var(--accent-dim);
  font-family: var(--font-ui);
  font-size: var(--step--2);
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

.subject {
  margin-top: 0.3rem;
  font-weight: 600;
}

/* The message as its author wrote it: its lines kept, a long one wrapped. */
.body {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 0.25rem;
  color: var(--text-muted);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 14;
  line-clamp: 14;
}

.foot {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.9rem;
  margin-top: 0.35rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--panel-rule);
  color: var(--text-muted);
  font-size: var(--step--2);
}
</style>
