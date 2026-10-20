<script lang="ts">
import type { GitRepoRef } from '@shared/git'
import { oneAtATime } from '../../lib/one-at-a-time.ts'

/**
 * The git pane before it shows a repository: SELECT REPOSITORY (main's picker)
 * and the ones used lately, or - when the repository it holds cannot be read -
 * what is wrong with it, and a way to choose another. A repository is known by
 * main's id only; the paths here are for the eye and never go back to main.
 */
interface Props {
  /** The repository the pane holds, if any: then BACK returns to it. */
  current: string | null
  /** What is wrong with the repository held, in words; then only that and a way out show. */
  trouble?: string | null
  /** A repository chosen, by id. */
  onchoose?: (id: string) => void
  /** Back to the repository held, unchanged. */
  onback?: () => void
  /** From the trouble to the chooser. */
  onchange?: () => void
}

const nothing = (): void => {}
const {
  current,
  trouble = null,
  onchoose = nothing,
  onback = nothing,
  onchange = nothing,
}: Props = $props()

let recent = $state.raw<GitRepoRef[]>([])
let problem = $state<string | null>(null)

// Read each time the chooser comes up: a repository chosen in another pane is in the list.
$effect(() => {
  if (trouble !== null) return
  void window.elecdex.git.recent().then((list) => {
    recent = list
  })
})

const pick = oneAtATime(async (): Promise<void> => {
  problem = null
  const result = await window.elecdex.git.pick()
  if (result === null) return
  if ('problem' in result) {
    problem = result.problem
    return
  }
  onchoose(result.repo.id)
})

function useRepo(id: string): void {
  problem = null
  onchoose(id)
}
</script>

{#if trouble !== null}
  <div class="choose">
    <p class="problem" data-testid="git-problem">{trouble}</p>
    <button type="button" class="select" onclick={onchange}>CHOOSE A REPOSITORY</button>
  </div>
{:else}
  <div class="choose" data-testid="git-choose">
    <button type="button" class="select" data-testid="git-select" onclick={pick}>SELECT REPOSITORY</button>
    {#if problem !== null}<p class="problem" data-testid="git-problem">{problem}</p>{/if}
    {#if recent.length > 0}
      <p class="label">RECENT</p>
      <ul class="recent">
        {#each recent as repo (repo.id)}
          <li>
            <button type="button" data-testid="git-recent" onclick={() => useRepo(repo.id)}>
              <span class="name">{repo.name}</span><span class="where">{repo.path}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    {#if current !== null}
      <button type="button" class="cancel" onclick={onback}>BACK</button>
    {/if}
  </div>
{/if}

<style>
.choose {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  padding: var(--space-2);
  overflow: auto;
}

.select,
.cancel {
  padding: 0.15rem 0.6rem;
  border: 1px solid var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.14em;
  cursor: pointer;
}

.cancel {
  border-color: var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
}

.select:hover,
.cancel:hover {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
}

.problem {
  margin: 0;
  color: var(--warn);
  font-family: var(--font-ui);
}

.label {
  margin: var(--space-1) 0 0;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.16em;
  color: var(--text-muted);
}

.recent {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.recent button {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  width: 100%;
  padding: 0.1rem 0.3rem;
  border: none;
  background: transparent;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.recent button:hover {
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.recent .name {
  font-family: var(--font-ui);
  letter-spacing: 0.06em;
}

.recent .where {
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
