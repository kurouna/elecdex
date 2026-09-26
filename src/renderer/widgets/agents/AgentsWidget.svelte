<script lang="ts">
import type { AgentBoard, AgentSession, AgentTask, AgentTaskState } from '@shared/agents'
import { compactCount } from '@shared/ai'
import type { GitDiff } from '@shared/git'
import { untrack } from 'svelte'
import { onBoundary } from '../../lib/frame-loop.ts'
import { pulse } from '../../lib/pulse.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import DiffView from '../common/DiffView.svelte'
import Splitter from '../common/Splitter.svelte'
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
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
/** Shown in its tab, with the window on screen: what the pane does for the eye runs only then. */
const visible = $derived(seen(inTab))

const open = $derived(typeof paneState?.open === 'string' ? paneState.open : null)
const fileKey = $derived(typeof paneState?.file === 'string' ? paneState.file : null)
const split = $derived(paneState?.split === true)

/**
 * The line between the sessions and the diff, as the git pane has it: across
 * (the list's width) when the pane is wide, down (the list's height) when it is
 * narrow and the two are stacked. Each is kept in pane state, so each pane has
 * its own and a restart keeps it.
 */
const LIST_WIDTH = { min: 0.2, max: 0.75, reset: 0.4 }
const LIST_HEIGHT = { min: 0.15, max: 0.85, reset: 0.45 }
const share = (value: unknown, range: { min: number; max: number; reset: number }): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(range.max, Math.max(range.min, value))
    : range.reset
let draggedWidth = $state<number | null>(null)
let draggedHeight = $state<number | null>(null)
const listWidth = $derived(draggedWidth ?? share(paneState?.listWidth, LIST_WIDTH))
const listHeight = $derived(draggedHeight ?? share(paneState?.listHeight, LIST_HEIGHT))
let workEl = $state<HTMLElement | null>(null)

const setState = (patch: Record<string, unknown>): void => {
  widgetState.patch(paneId, patch)
}

let board = $state.raw<AgentBoard | null>(null)
let diff = $state.raw<GitDiff | null>(null)
let now = $state(Date.now())

// The records are read only while the pane is on screen; behind another tab the last board stays.
$effect(() => (visible ? window.elecdex.agents.subscribe((next) => (board = next)) : undefined))

// Elapsed times move on by the minute; nothing else here keeps time.
$effect(() => {
  if (!visible) return
  now = Date.now()
  return onBoundary(60_000, () => {
    now = Date.now()
  })
})

const busy = $derived(board?.sessions.some((s) => s.status === 'busy') ?? false)
// A busy session's lamp blinks on the shared pulse, only while one is busy.
$effect(() => (visible && busy ? pulse.use() : undefined))

const openSession = $derived(board?.sessions.find((s) => s.id === open) ?? null)
const openFile = $derived(openSession?.files.find((f) => f.key === fileKey) ?? null)

/**
 * The chosen file, and when its session last moved on, as plain values: every
 * board is new objects, and the diff is read again only when these change.
 */
const wanted = $derived(
  openSession === null || openFile === null
    ? null
    : { source: openSession.source, sessionId: openSession.id, key: openFile.key },
)
const wantedKey = $derived(wanted === null ? null : `${wanted.sessionId}:${wanted.key}`)
const movedAt = $derived(openSession?.updatedAt ?? 0)
/** The diff on screen is of this; another file's is never shown under this one's name. */
let shownFor: string | null = null

$effect(() => {
  const key = wantedKey
  void movedAt
  const request = untrack(() => wanted)
  if (key !== shownFor) {
    diff = null
    shownFor = key
  }
  if (request === null) return
  let cancelled = false
  void window.elecdex.agents
    .diff(request)
    .then((next) => {
      if (!cancelled) diff = next
    })
    .catch(() => {})
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

/** A length of time in minutes, then hours. */
const span = (ms: number): string => {
  const minutes = Math.max(0, Math.floor(ms / 60_000))
  return minutes < 60
    ? `${minutes}m`
    : `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`
}
const since = (at: number): string => span(now - at)

const STATUS_LABEL: Record<AgentSession['status'], string> = {
  busy: 'BUSY',
  idle: 'IDLE',
  waiting: 'WAITING',
  ended: 'ENDED',
  unknown: '—',
}

const TASK_LABEL: Record<AgentTaskState, string> = {
  running: 'RUN',
  done: 'DONE',
  failed: 'FAIL',
  stopped: 'STOP',
  unknown: '—',
}

/** How long a task has run, or ran. */
const lasted = (task: AgentTask): string => span((task.endedAt ?? now) - task.startedAt)

const running = (session: AgentSession): number =>
  session.tasks.filter((task) => task.state === 'running').length

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
    <div
      class="work"
      class:with-diff={openFile !== null}
      bind:this={workEl}
      style:--list-width="{listWidth * 100}%"
      style:--list-rows="minmax(0, {listHeight}fr) minmax(0, {1 - listHeight}fr)"
    >
    <div class="list">
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
            {#if running(session) > 0}
              <span class="running" data-testid="agent-running">{running(session)} RUNNING</span>
            {/if}
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
          {#if session.tasks.length > 0}
            <ul class="tasks" data-testid="agent-tasks">
              {#each session.tasks as task (task.id)}
                <li class="task" data-state={task.state} data-testid="agent-task">
                  <span class="kind">{task.kind === 'agent' ? 'AGENT' : 'SHELL'}</span>
                  <span class="task-state" data-testid="agent-task-state">{TASK_LABEL[task.state]}</span>
                  <span class="task-title" title={task.type ? `${task.type}: ${task.title}` : task.title}
                    >{task.title}</span
                  >
                  <span class="task-when">{lasted(task)}</span>
                  {#if task.state === 'running' && task.activity}
                    <span class="step" data-testid="agent-task-step"
                      ><span class="tool">{task.activity.tool.toUpperCase()}</span>
                      {task.activity.detail}</span
                    >
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
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
                  >{#if file.subagent}<span class="by" title="Changed by a subagent">SUB</span
                    >{/if}{file.path}</button
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
        <Splitter
          axis="x"
          edge="start"
          value={listWidth}
          min={LIST_WIDTH.min}
          max={LIST_WIDTH.max}
          reset={LIST_WIDTH.reset}
          label="Width of the session list"
          testid="agent-split-width"
          within={() => workEl}
          onmove={(next) => (draggedWidth = next)}
          ondone={(next) => {
            draggedWidth = null
            setState({ listWidth: next })
          }}
        />
        <Splitter
          axis="y"
          value={listHeight}
          min={LIST_HEIGHT.min}
          max={LIST_HEIGHT.max}
          reset={LIST_HEIGHT.reset}
          label="Height of the session list"
          testid="agent-split-height"
          within={() => workEl}
          onmove={(next) => (draggedHeight = next)}
          ondone={(next) => {
            draggedHeight = null
            setState({ listHeight: next })
          }}
        />
        <DiffView {diff} path={openFile.path} {split} onsplit={(next) => setState({ split: next })} />
      </div>
    {/if}
    </div>
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

/*
 * The sessions, and beside them the diff of the file chosen: across when the
 * pane is wide, stacked when it is narrow; the line between them moves.
 */
.work {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  min-height: 0;
}

.work.with-diff {
  grid-template-columns: minmax(12rem, var(--list-width, 40%)) minmax(0, 1fr);
}

.list {
  position: relative;
  overflow: auto;
  min-height: 0;
  padding: var(--space-1) 0;
}

.diff {
  position: relative;
  min-width: 0;
  min-height: 0;
  border-left: 1px solid var(--panel-rule);
}

/* Across, the height line has nothing to divide. */
.diff > :global(.splitter.y) {
  display: none;
}

@container (max-width: 40rem) {
  .work.with-diff {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: var(--list-rows);
  }

  .diff {
    border-left: none;
    border-top: 1px solid var(--panel-rule);
  }

  .diff > :global(.splitter.x) {
    display: none;
  }

  .diff > :global(.splitter.y) {
    display: block;
  }
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
  font-size: var(--step--1);
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
  font-size: var(--step--1);
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

.by {
  flex-shrink: 0;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.running {
  flex-shrink: 0;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.12em;
  color: var(--ok);
}

/* A task a line: what it is, how it stands, what it is called, how long; a running subagent's step below. */
.tasks {
  margin: 0;
  padding: 0 var(--space-2) 0.25rem calc(var(--space-2) + 1rem);
  list-style: none;
}

.task {
  display: grid;
  grid-template-columns: 3.4em 2.8em minmax(0, 1fr) auto;
  column-gap: 0.5rem;
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.kind {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
}
.task-state {
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.1em;
}

.task[data-state='running'] {
  color: var(--text);
}

.task[data-state='running'] .task-state {
  color: var(--ok);
}

.task[data-state='failed'] .task-state {
  color: var(--danger);
}

.task[data-state='stopped'] .task-state {
  color: var(--warn);
}

.task-title,
.step {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-when {
  font-size: var(--step--1);
}

.step {
  grid-column: 3 / -1;
  color: var(--text);
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
