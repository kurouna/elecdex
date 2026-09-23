<script lang="ts">
import type { AgentBoard, AgentSession } from '@shared/agents'
import { compactCount } from '@shared/ai'
import type { GitDiff } from '@shared/git'
import { onBoundary } from '../../lib/frame-loop.ts'
import { pulse } from '../../lib/pulse.svelte.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import DiffView from '../common/DiffView.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * AGENT (experimental): the coding agents at work on this machine - one card
 * per session, what it is doing now, how much it carries, and what it has
 * changed, each change a diff.
 *
 * The page asks one layer in main (agents/hub.ts) and gets one board; which
 * agents are read is a setting (`agents.sources`), and so far Claude Code is
 * the one there is. Their records are theirs and undocumented, which is why the
 * pane says it is experimental.
 */
const { paneId, state: paneState }: WidgetProps = $props()

const open = $derived(typeof paneState?.open === 'string' ? paneState.open : null)
const fileKey = $derived(typeof paneState?.file === 'string' ? paneState.file : null)
const split = $derived(paneState?.split === true)

const setState = (patch: Record<string, unknown>): void => {
  layout.setPaneState(paneId, { ...(paneState ?? {}), ...patch })
}

let board = $state.raw<AgentBoard | null>(null)
let diff = $state.raw<GitDiff | null>(null)
let now = $state(Date.now())

$effect(() => window.elecdex.agents.subscribe((next) => (board = next)))

// Elapsed times move on by the minute; nothing else here keeps time.
$effect(() =>
  onBoundary(60_000, () => {
    now = Date.now()
  }),
)

const busy = $derived(board?.sessions.some((s) => s.status === 'busy') ?? false)
// A busy session's lamp blinks on the shared pulse, only while one is busy.
$effect(() => (busy ? pulse.use() : undefined))

const openSession = $derived(board?.sessions.find((s) => s.id === open) ?? null)
const openFile = $derived(openSession?.files.find((f) => f.key === fileKey) ?? null)

/** The chosen file's diff, again whenever the board says the session moved on. */
$effect(() => {
  const session = openSession
  const file = openFile
  void session?.updatedAt
  if (session === null || file === null) {
    diff = null
    return
  }
  let cancelled = false
  void window.elecdex.agents
    .diff({ source: session.source, sessionId: session.id, key: file.key })
    .then((next) => {
      if (!cancelled) diff = next
    })
  return () => {
    cancelled = true
  }
})

$effect(() => {
  const live = board?.sessions.filter((s) => s.live).length ?? 0
  const enabled = board?.sources.filter((s) => s.enabled) ?? []
  paneMeta.set(paneId, {
    subtitle:
      board === null
        ? 'reading…'
        : `${live} live · ${enabled.map((s) => s.name).join(', ') || 'no agent chosen'}`,
    badge: 'experimental',
    badgeKind: 'warn' as const,
  })
})

const since = (at: number): string => {
  const minutes = Math.max(0, Math.floor((now - at) / 60_000))
  return minutes < 60
    ? `${minutes}m`
    : `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`
}

const STATUS_LABEL: Record<AgentSession['status'], string> = {
  busy: 'BUSY',
  idle: 'IDLE',
  waiting: 'WAITING',
  ended: 'ENDED',
  unknown: '—',
}

function toggle(session: AgentSession): void {
  setState(open === session.id ? { open: null, file: null } : { open: session.id, file: null })
}
</script>

<div class="agents" data-testid="agents" data-pane-id={paneId}>
  {#if board === null}
    <p class="note">reading…</p>
  {:else if board.sessions.length === 0}
    <div class="empty" data-testid="agents-empty">
      {#each board.sources as source (source.id)}
        <p>
          <span class="name">{source.name}</span>
          {#if !source.enabled}
            not read (turned off in settings)
          {:else if !source.found}
            not found on this machine
          {:else}
            no session running
          {/if}
        </p>
      {/each}
    </div>
  {:else}
    <div class="list" class:opened={openSession !== null}>
      {#each board.sessions as session (session.id)}
        {@const isOpen = session.id === open}
        <section class="card" class:open={isOpen} data-status={session.status} data-testid="agent-card">
          <button type="button" class="head" onclick={() => toggle(session)} aria-expanded={isOpen}>
            <span
              class="lamp"
              class:blink={session.status === 'busy' && pulse.phase === 2}
              aria-hidden="true"
            ></span>
            <span class="status" data-testid="agent-status">{STATUS_LABEL[session.status]}</span>
            <span class="title" title={session.cwd}>{session.title}</span>
            <span class="project">{session.project}</span>
            <span class="when">{since(session.startedAt)}</span>
          </button>
          {#if session.activity}
            {#key session.activity.at}
              <p class="activity fresh" data-testid="agent-activity">
                <span class="tool">{session.activity.tool.toUpperCase()}</span>
                <span class="detail">{session.activity.detail}</span>
              </p>
            {/key}
          {/if}
          <p class="figures">
            {#if session.model}<span class="model">{session.model}</span>{/if}
            {#if session.context !== null}<span>CTX <b>{compactCount(session.context)}</b></span>{/if}
            <span>OUT <b>{compactCount(session.output)}</b></span>
            <span>TURNS <b>{session.turns}</b></span>
            {#if session.partial}<span class="partial" title="Only the end of a long record was read"
                >recent</span
              >{/if}
          </p>
          {#if isOpen}
            <div class="more">
              {#if session.tools.length > 0}
                <p class="tools">
                  {#each session.tools as tool (tool.name)}
                    <span class="chip">{tool.name} <b>{tool.count}</b></span>
                  {/each}
                </p>
              {/if}
              <p class="label">FILES CHANGED</p>
              {#each session.files as file (file.key)}
                <button
                  type="button"
                  class="file"
                  class:on={file.key === fileKey}
                  data-testid="agent-file"
                  title={file.path}
                  onclick={() => setState({ file: file.key === fileKey ? null : file.key })}
                  ><span class="mark" class:created={file.created}>{file.created ? 'A' : 'M'}</span
                  >{file.path}</button
                >
              {:else}
                <p class="note">none yet</p>
              {/each}
            </div>
          {/if}
        </section>
      {/each}
    </div>
    {#if openFile !== null}
      <div class="diff" data-testid="agent-diff">
        <DiffView {diff} path={openFile.path} {split} onsplit={(next) => setState({ split: next })} />
      </div>
    {/if}
  {/if}
  <p class="credit">
    EXPERIMENTAL · read from the agents' own records on this machine, whose format is not
    documented and may change with their versions. Nothing is sent anywhere.
  </p>
</div>

<style>
.agents {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.list {
  flex: 1 1 auto;
  overflow: auto;
  min-height: 0;
  padding: var(--space-1) 0;
}

.list.opened {
  flex: 0 1 auto;
  max-height: 50%;
}

.diff {
  flex: 1 1 0;
  min-height: 8rem;
  border-top: 1px solid var(--panel-rule);
}

.note,
.empty p {
  margin: var(--space-2);
  font-family: var(--font-ui);
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.empty .name {
  margin-right: 0.5rem;
  color: var(--text);
}

/* A session as a module in a rack: a rule down the left ties its rows to its head. */
.card {
  margin: 0 var(--space-1) var(--space-1);
  border-left: 2px solid var(--panel-rule);
}

.card[data-status='busy'] {
  border-left-color: var(--ok);
}

.card[data-status='waiting'] {
  border-left-color: var(--warn);
}

.card.open {
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}

.head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  width: 100%;
  padding: 0.15rem var(--space-2);
  border: none;
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  text-align: left;
  cursor: pointer;
}

.head:hover {
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.lamp {
  flex-shrink: 0;
  align-self: center;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--panel-rule);
}

[data-status='busy'] .lamp {
  background: var(--ok);
  box-shadow: 0 0 0.4rem var(--ok);
}

[data-status='busy'] .lamp.blink {
  opacity: 0.4;
}

[data-status='waiting'] .lamp {
  background: var(--warn);
}

.status {
  flex-shrink: 0;
  width: 4.6em;
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  color: var(--text-muted);
}

[data-status='busy'] .status {
  color: var(--ok);
}

[data-status='waiting'] .status {
  color: var(--warn);
}

.title {
  overflow: hidden;
  min-width: 0;
  font-size: var(--step-0);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project,
.when {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.when {
  margin-left: auto;
}

.activity {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 0 var(--space-2) 0 calc(var(--space-2) + 1rem);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  min-width: 0;
}

.tool {
  flex-shrink: 0;
  color: var(--accent-strong);
  letter-spacing: 0.06em;
}

.detail {
  overflow: hidden;
  color: var(--text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* A new step lights up once as it comes in: opacity only, played once. */
.fresh {
  animation: agent-step calc(600ms * var(--motion-scale)) ease-out backwards;
}

@keyframes agent-step {
  from {
    opacity: 0.2;
    filter: brightness(1.8);
  }
}

.figures {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.9rem;
  margin: 0;
  padding: 0.05rem var(--space-2) 0.25rem calc(var(--space-2) + 1rem);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.figures b {
  font-family: var(--font-mono);
  font-weight: 400;
  color: var(--text);
  letter-spacing: 0;
}

.model {
  font-family: var(--font-mono);
  letter-spacing: 0;
}

.partial {
  color: var(--warn);
}

.more {
  padding: 0 var(--space-2) var(--space-1) calc(var(--space-2) + 1rem);
}

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin: 0.1rem 0 0.3rem;
}

.chip {
  padding: 0 0.4rem;
  border: 1px solid var(--panel-rule);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.chip b {
  font-family: var(--font-mono);
  font-weight: 400;
  color: var(--text);
}

.label {
  margin: 0.2rem 0 0.1rem;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.16em;
  color: var(--text-muted);
}

.file {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  padding: 0 0.3rem;
  border: none;
  border-left: 2px solid transparent;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.file:hover {
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.file.on {
  border-left-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 13%, transparent);
}

.mark {
  color: var(--warn);
  font-weight: 600;
}

.mark.created {
  color: var(--ok);
}

.credit {
  flex: none;
  margin: 0;
  padding: 0.15rem var(--space-2);
  border-top: 1px solid var(--panel-rule);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  line-height: 1.3;
  color: var(--text-muted);
}
</style>
