<script lang="ts">
import type { GitState } from '@shared/git'
import {
  GIT_SYNC_ACTIONS,
  type GitSyncAction,
  SYNC_BUSY,
  syncArmed,
  syncBlocked,
  syncTitle,
} from '@shared/git-sync'
import ConfirmButton from '../../ConfirmButton.svelte'
import { pulse } from '../../lib/pulse.svelte.ts'

/**
 * The git pane's header: the receive lamp, the branch and how far it is from its
 * upstream, a merge or rebase left half done, the commit HEAD is at, the stash,
 * and FETCH, PULL and PUSH - two presses each, dimmed with the reason while
 * `syncBlocked` says no. It only shows: the widget runs a sync and keeps which
 * one is under way, so leaving for the chooser and coming back still says so.
 */
interface Props {
  state: GitState | null
  /** Shown in its tab, with the window on screen: the chips step with the pulse only then. */
  visible: boolean
  /** Bumped on each changed state after the first: the lamp lights and the hash rolls. */
  received: number
  /** The fetch, pull or push under way from this pane. */
  syncing: GitSyncAction | null
  onsync: (action: GitSyncAction) => void
  /** To the chooser, for another repository. */
  onswitch: () => void
}

const { state, visible, received, syncing, onsync, onswitch }: Props = $props()

// The operation chip blinks on the shared pulse while a merge or rebase is left half done.
$effect(() => (visible && state?.operation ? pulse.use() : undefined))
// The button of a sync under way steps with it too.
$effect(() => (visible && syncing !== null ? pulse.use() : undefined))
</script>

<header class="head" data-testid="git-head">
  {#key received}<span class="lamp" class:rx={received > 0} aria-hidden="true" data-testid="git-lamp" data-received={received}></span>{/key}
  <span class="chip" data-testid="git-branch" title={state?.branch.upstream ?? 'no upstream'}
    >⎇ {state?.branch.head ?? (state?.branch.oid ? 'DETACHED' : '…')}</span
  >
  {#if state?.branch.upstream}
    <span class="ab">↑{state.branch.ahead} ↓{state.branch.behind}</span>
  {/if}
  {#if state?.operation}
    <span class="chip warn" data-testid="git-operation" data-phase={visible ? pulse.phase : 0}
      >{state.operation.toUpperCase()}</span
    >
  {/if}
  {#key state?.branch.oid}
    <span class="hash" class:roll={received > 0}>{state?.head?.short ?? ''}</span>
  {/key}
  <span class="subject">{state?.head?.subject ?? ''}</span>
  {#if (state?.stash ?? 0) > 0}<span class="ab">stash {state?.stash}</span>{/if}
  <span class="sync">
    {#each GIT_SYNC_ACTIONS as action (action)}
      {#if syncing === action}
        <span class="busy" data-phase={visible ? pulse.phase : 0} data-testid="git-{action}-busy"
          >{SYNC_BUSY[action]}</span
        >
      {:else}
        <ConfirmButton
          label={action.toUpperCase()}
          action={syncArmed(state, action)}
          title={syncTitle(state, action)}
          testid="git-{action}"
          disabled={syncing !== null || syncBlocked(state, action) !== null}
          onconfirm={() => onsync(action)}
        />
      {/if}
    {/each}
  </span>
  <button
    type="button"
    class="switch"
    title={`${state?.repo?.path ?? ''} - choose another repository`}
    data-testid="git-switch"
    onclick={onswitch}>⟲</button
  >
</header>

<style>
.head {
  display: flex;
  align-items: center;
  gap: 0.35rem 0.7rem;
  min-width: 0;
  padding: 0.25rem var(--space-2);
  border-bottom: 1px solid var(--panel-rule);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

/* The receive lamp: dark, and lit once each time main sends a changed state. */
.lamp {
  position: relative;
  flex-shrink: 0;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--panel-rule);
}

/* Lit by the opacity of a lit dot over the dark one, never a colour in keyframes. */
.lamp::after {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--ok);
  box-shadow: 0 0 0.45rem var(--ok);
  content: '';
  opacity: 0;
}

.lamp.rx::after {
  animation: git-rx calc(700ms * var(--motion-scale)) ease-out;
}

@keyframes git-rx {
  0%,
  30% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

.chip {
  flex-shrink: 0;
  padding: 0 0.45rem;
  border: 1px solid var(--accent-dim);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.12em;
}

.chip.warn {
  border-color: var(--warn);
  color: var(--warn);
}

.chip.warn[data-phase='2'] {
  opacity: 0.45;
}

.ab {
  flex-shrink: 0;
  color: var(--text-muted);
}

.hash {
  flex-shrink: 0;
  color: var(--accent-strong);
}

.hash.roll {
  animation: git-roll calc(300ms * var(--motion-scale)) steps(3) backwards;
}

@keyframes git-roll {
  from {
    opacity: 0.2;
    transform: translateY(-0.2em);
  }
}

.subject {
  overflow: hidden;
  flex: 1;
  min-width: 0;
  color: var(--text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* FETCH, PULL and PUSH: two presses each, like every write the app makes on a click. */
.sync {
  display: flex;
  flex-shrink: 0;
  gap: 0.3rem;
  margin-left: auto;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.12em;
}

.busy {
  padding: 0 var(--space-2);
  border: 1px solid var(--accent);
  color: var(--accent-strong);
}

.busy[data-phase='2'] {
  opacity: 0.45;
}

.switch {
  flex-shrink: 0;
  padding: 0 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.14em;
  cursor: pointer;
}

.switch:hover {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
}

/* Narrow (the pane's own width, .git's container): the subject goes first. */
@container (max-width: 40rem) {
  .subject {
    display: none;
  }
}
</style>
