<script lang="ts">
import { parseTask } from '@shared/task-parse'
import {
  BAND_LABELS,
  bandOf,
  DEFAULT_LIST_ID,
  type Task,
  type TaskBand,
  urgency,
} from '@shared/tasks'
import { onBoundary } from '../../lib/frame-loop.ts'
import { pulse } from '../../lib/pulse.svelte.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { tasks } from '../../stores/tasks.svelte.ts'
import { toasts } from '../../stores/toasts.svelte.ts'
import Readout from '../common/Readout.svelte'
import SegmentMeter from '../common/SegmentMeter.svelte'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * Tasks: a queue with the deadlines drawn rather than written.
 *
 * Every task with a due date carries a meter of how much of its life has gone,
 * so a glance at the pane says what is nearly out of time without reading a
 * single date. The nearest deadline of all counts down in the header - the one
 * number the pane exists to tell you.
 *
 * The tasks themselves live in main (tasks.json), which is also where the
 * reminder for the next deadline is scheduled: this pane may be closed, on
 * another tab, or never opened, and the reminder still arrives.
 */

const { paneId, state: paneState }: WidgetProps = $props()

const BANDS: readonly TaskBand[] = ['overdue', 'today', 'tomorrow', 'later', 'someday']

$effect(() => tasks.use())

const listId = $derived(
  typeof paneState?.listId === 'string'
    ? paneState.listId
    : (tasks.lists[0]?.id ?? DEFAULT_LIST_ID),
)
const list = $derived(tasks.lists.find((entry) => entry.id === listId) ?? tasks.lists[0] ?? null)
/**
 * Completed tasks are shown unless they are hidden.
 *
 * They were collapsed by default, behind a heading small enough that it did not
 * read as a button: a task ticked off looked as though it had simply gone, and
 * there was no obvious way to see it again. Having done something is worth
 * seeing.
 */
const showCompleted = $derived(paneState?.showCompleted !== false)

let draft = $state('')
let settingsOpen = $state(false)
let listsOpen = $state(false)
/** The task whose row is playing its completion, so the strike can be drawn. */
let striking = $state<string | null>(null)
/**
 * What is being edited in place, if anything.
 *
 * A task typed in a hurry is a task typed with the wrong word in it, and a
 * deadline is the thing most likely to move. Both are changed where they are
 * read rather than in a dialog: the row is the record, so the row is the form.
 */
let editing = $state<{ id: string; field: 'title' | 'due'; value: string } | null>(null)

/**
 * Now, to the second.
 *
 * Woken on wall-clock boundaries rather than by an interval, so the change lands
 * in the same frame as the clock's and the shared draw loop's. While nothing is
 * due within a day there is nothing a second could change, so it ticks by the
 * minute instead.
 */
let now = $state(Date.now())

const soonest = $derived.by(() => {
  let best: number | null = null
  for (const task of tasks.inList(listId)) {
    if (task.done || task.due === undefined) continue
    if (best === null || task.due < best) best = task.due
  }
  return best
})

const fine = $derived(soonest !== null && soonest - now < 86_400_000)

/** Something is late: its row pulses, and only then is the beat asked for. */
const anyLate = $derived(soonest !== null && soonest < now)
$effect(() => (anyLate ? pulse.use() : undefined))

$effect(() =>
  onBoundary(fine ? 1000 : 60_000, () => {
    now = Date.now()
  }),
)

/** The header's T-minus, or null when nothing in this list is waiting. */
const countdown = $derived.by(() => {
  if (soonest === null) return null
  const left = soonest - now
  const over = left < 0
  const total = Math.floor(Math.abs(left) / 1000)
  const days = Math.floor(total / 86_400)
  const hours = Math.floor(total / 3600) % 24
  const minutes = Math.floor(total / 60) % 60
  const seconds = total % 60
  const pad = (n: number): string => String(n).padStart(2, '0')
  return {
    over,
    text:
      days > 0
        ? `${days}d ${pad(hours)}:${pad(minutes)}`
        : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  }
})

const parsed = $derived(draft.trim() === '' ? null : parseTask(draft, now))
const understood = $derived(
  parsed !== null && (parsed.matched.length > 0 || parsed.repeat !== 'none') ? parsed : null,
)

const open = $derived(tasks.inList(listId).filter((task) => !task.done))
const done = $derived(
  tasks
    .inList(listId)
    .filter((task) => task.done)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
)

const grouped = $derived.by(() => {
  const bands = new Map<TaskBand, Task[]>()
  for (const task of open) {
    const band = bandOf(task, now)
    const bucket = bands.get(band)
    if (bucket === undefined) bands.set(band, [task])
    else bucket.push(task)
  }
  for (const bucket of bands.values()) {
    bucket.sort(
      (a, b) =>
        (a.due ?? Number.POSITIVE_INFINITY) - (b.due ?? Number.POSITIVE_INFINITY) ||
        a.order - b.order,
    )
  }
  return BANDS.flatMap((band) => {
    const bucket = bands.get(band)
    return bucket === undefined || bucket.length === 0 ? [] : [{ band, tasks: bucket }]
  })
})

function save(change: Record<string, unknown>): void {
  layout.patchPaneState(paneId, change)
}

function add(): void {
  const line = draft.trim()
  if (line === '' || parsed === null) return
  void tasks.add({
    listId,
    title: parsed.title,
    ...(parsed.due === undefined ? {} : { due: parsed.due }),
    allDay: parsed.allDay,
    repeat: parsed.repeat,
  })
  draft = ''
  sfx.play('panel')
}

/**
 * Ticks a task off.
 *
 * The row plays its strike before the list is regrouped, so the eye follows the
 * task out instead of finding it gone.
 */
function complete(task: Task): void {
  striking = task.id
  sfx.play('chime')
  setTimeout(
    () => {
      striking = null
      void tasks.update(task.id, { done: true })
    },
    appearance.reducedMotion ? 0 : 260,
  )
}

function reopen(task: Task): void {
  void tasks.update(task.id, { done: false })
}

function beginEdit(task: Task, field: 'title' | 'due'): void {
  editing = { id: task.id, field, value: field === 'title' ? task.title : '' }
}

/**
 * Commits an in-place edit.
 *
 * A deadline is typed the same way it is typed when the task is added - the same
 * parser, so "明日 9:00" means the same thing in both places - and an empty line
 * takes the deadline off rather than meaning nothing.
 */
function commitEdit(task: Task): void {
  const edit = editing
  editing = null
  if (edit === null) return

  if (edit.field === 'title') {
    const title = edit.value.trim()
    if (title === '' || title === task.title) return
    void tasks.update(task.id, { title })
    return
  }

  const line = edit.value.trim()
  if (line === '') {
    if (task.due !== undefined) void tasks.update(task.id, { due: null })
    return
  }
  // The parser wants something to hang the date on; the title will do.
  const parsed = parseTask(`${task.title} ${line}`, now)
  if (parsed.due === undefined) {
    sfx.play('glitch')
    return
  }
  void tasks.update(task.id, {
    due: parsed.due,
    allDay: parsed.allDay,
    ...(parsed.repeat === 'none' ? {} : { repeat: parsed.repeat }),
  })
}

/**
 * The keys a row answers to, from the box that tabbing lands on.
 *
 * Space and Enter are the button's own - they tick the task off - so only the
 * two extra ones are handled here; taking Space as well would complete a task
 * twice.
 */
function onRowKey(event: KeyboardEvent, task: Task): void {
  if (event.key === 'Delete') {
    event.preventDefault()
    remove(task)
    return
  }
  if (event.key === 'F2' || event.key === 'e') {
    event.preventDefault()
    beginEdit(task, 'title')
  }
}

function remove(task: Task): void {
  void tasks.remove(task.id)
  sfx.play('collapse')
  toasts.show({
    title: 'task deleted',
    body: task.title,
    tone: 'warn',
    actions: [
      {
        label: 'undo',
        primary: true,
        run: () => {
          void tasks.add({
            listId: task.listId,
            title: task.title,
            ...(task.due === undefined ? {} : { due: task.due }),
            allDay: task.allDay,
            repeat: task.repeat,
          })
        },
      },
    ],
  })
}

function clearDone(): void {
  void tasks.clearCompleted(listId).then((gone) => {
    if (gone > 0) sfx.play('collapse')
  })
}

async function newList(): Promise<void> {
  const name = `list ${tasks.lists.length + 1}`
  const made = await tasks.addList(name)
  if (made === null) return
  save({ listId: made.id })
  listsOpen = false
}

const timeOf = (task: Task): string => {
  if (task.due === undefined) return ''
  const date = new Date(task.due)
  if (task.allDay) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }
  const today = new Date(now)
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  const clock = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return sameDay
    ? clock
    : `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${clock}`
}

const toneOf = (task: Task): 'accent' | 'warn' | 'danger' => {
  if (task.due === undefined) return 'accent'
  if (task.due < now) return 'danger'
  // The last stretch before a deadline is the part worth colouring.
  return urgency(task, now) > 0.75 ? 'warn' : 'accent'
}

function patchReminders(change: Record<string, unknown>): void {
  void appearance.patch({ reminders: change })
}

$effect(() => {
  paneMeta.set(paneId, {
    subtitle: list === null ? '' : list.name,
    ...(open.length === 0 ? {} : { badge: String(open.length) }),
  })
})
</script>

<div class="todo" data-testid="todo" data-pulse={anyLate ? pulse.phase : undefined}>
  <SettingsButton
    open={settingsOpen}
    label="tasks settings"
    testid="todo-settings-toggle"
    ontoggle={() => (settingsOpen = !settingsOpen)}
  />

  <div class="head">
    <button
      type="button"
      class="list-name"
      onclick={() => (listsOpen = !listsOpen)}
      aria-expanded={listsOpen}
      data-testid="todo-lists-toggle"
    >
      <span class="chevron" aria-hidden="true">{listsOpen ? '▾' : '▸'}</span>
      {list?.name ?? 'tasks'}
    </button>
    <span class="next" data-testid="todo-next">
      {#if countdown !== null}
        <span class="next-label">{countdown.over ? 'late' : 'next'}</span>
        <Readout
          value={countdown.text}
          size="step-2"
          tone={countdown.over ? 'danger' : 'accent'}
          testid="todo-countdown"
        />
      {:else}
        <span class="next-label idle">no deadline</span>
      {/if}
    </span>
  </div>

  {#if listsOpen}
    <div class="lists" data-testid="todo-lists">
      {#each tasks.lists as entry (entry.id)}
        <button
          type="button"
          class:on={entry.id === listId}
          onclick={() => {
            save({ listId: entry.id })
            listsOpen = false
          }}
          data-testid="todo-list-item"
        >
          {entry.name}
        </button>
      {/each}
      <button type="button" class="add-list" onclick={() => void newList()} data-testid="todo-add-list">
        + list
      </button>
      {#if tasks.lists.length > 1}
        <button
          type="button"
          class="add-list danger"
          onclick={() => void tasks.removeList(listId)}
          data-testid="todo-remove-list"
        >
          delete list
        </button>
      {/if}
    </div>
  {/if}

  {#if settingsOpen}
    <div class="settings" data-testid="todo-settings">
      <label>
        <input
          type="checkbox"
          checked={appearance.settings.reminders.notify}
          onchange={(e) => patchReminders({ notify: e.currentTarget.checked })}
          data-testid="todo-notify"
        />
        <span>remind me</span>
      </label>
      <label>
        <input
          type="checkbox"
          checked={appearance.settings.reminders.system}
          onchange={(e) => patchReminders({ system: e.currentTarget.checked })}
          data-testid="todo-notify-system"
        />
        <span>system notification when away</span>
      </label>
      <label>
        <input
          type="checkbox"
          checked={appearance.settings.reminders.sound}
          onchange={(e) => patchReminders({ sound: e.currentTarget.checked })}
        />
        <span>sound</span>
      </label>
      <label class="number">
        <span>snooze</span>
        <input
          type="number"
          min="1"
          max="1440"
          value={appearance.settings.reminders.snoozeMinutes}
          onchange={(e) => patchReminders({ snoozeMinutes: Number(e.currentTarget.value) })}
          data-testid="todo-snooze-minutes"
        />
        <span>min</span>
      </label>
      <label class="number">
        <span>warn</span>
        <input
          type="number"
          min="0"
          max="1440"
          value={appearance.settings.reminders.leadMinutes}
          onchange={(e) => patchReminders({ leadMinutes: Number(e.currentTarget.value) })}
        />
        <span>min early</span>
      </label>
      <label>
        <input
          type="checkbox"
          checked={showCompleted}
          onchange={(e) => save({ showCompleted: e.currentTarget.checked })}
          data-testid="todo-show-completed"
        />
        <span>show completed</span>
      </label>
    </div>
  {/if}

  <div class="compose">
    <span class="caret" aria-hidden="true">&gt;</span>
    <input
      bind:value={draft}
      onkeydown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          add()
        }
        if (e.key === 'Escape') draft = ''
      }}
      maxlength="200"
      spellcheck="false"
      placeholder="new task · 明日 9:00 · fri 18:30 · weekly"
      aria-label="New task"
      data-testid="todo-input"
    />
  </div>

  {#if understood !== null}
    <div class="decoded" data-testid="todo-decoded">
      {#if understood.due !== undefined}
        <span class="chip">
          due {new Date(understood.due).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            ...(understood.allDay ? {} : { hour: '2-digit', minute: '2-digit' }),
          })}
        </span>
      {/if}
      {#if understood.repeat !== 'none'}
        <span class="chip">↻ {understood.repeat}</span>
      {/if}
      <span class="chip title">{understood.title}</span>
    </div>
  {/if}

  <div class="rows" data-testid="todo-rows">
    {#each grouped as group (group.band)}
      <div class="band-head">
        <span>{BAND_LABELS[group.band]}</span>
        <span class="band-count">{group.tasks.length}</span>
      </div>
      {#each group.tasks as task (task.id)}
        <div
          class="row {toneOf(task)}"
          class:striking={striking === task.id}
          class:late={task.due !== undefined && task.due < now}
          data-testid="todo-row"
          data-task={task.id}
        >
          <button
            type="button"
            class="check"
            aria-label="complete {task.title}"
            title="Complete · Delete removes · F2 renames"
            onclick={() => complete(task)}
            onkeydown={(event) => onRowKey(event, task)}
            data-testid="todo-complete">[ ]</button
          >
          {#if editing?.id === task.id && editing.field === 'title'}
            <!-- svelte-ignore a11y_autofocus -->
            <input
              class="edit title"
              autofocus
              bind:value={editing.value}
              onkeydown={(event) => {
                if (event.key === 'Enter') commitEdit(task)
                if (event.key === 'Escape') editing = null
              }}
              onblur={() => commitEdit(task)}
              aria-label="Task title"
              data-testid="todo-edit-title"
            />
          {:else}
            <button
              type="button"
              class="title"
              title="Click to rename"
              onclick={() => beginEdit(task, 'title')}
              data-testid="todo-title">{task.title}</button
            >
          {/if}
          {#if task.repeat !== 'none'}<span class="repeat" title={task.repeat}>↻</span>{/if}
          {#if editing?.id === task.id && editing.field === 'due'}
            <!-- svelte-ignore a11y_autofocus -->
            <input
              class="edit when"
              autofocus
              bind:value={editing.value}
              placeholder="明日 9:00 · fri 18:30 · empty to clear"
              onkeydown={(event) => {
                if (event.key === 'Enter') commitEdit(task)
                if (event.key === 'Escape') editing = null
              }}
              onblur={() => commitEdit(task)}
              aria-label="Deadline"
              data-testid="todo-edit-due"
            />
          {:else}
            <button
              type="button"
              class="when"
              title="Click to set a deadline"
              onclick={() => beginEdit(task, 'due')}
              data-testid="todo-when">{timeOf(task) || '—'}</button
            >
          {/if}
          {#if task.due !== undefined}
            <span class="meter" title="time gone before this is due">
              <SegmentMeter
                value={1 - urgency(task, now)}
                segments={10}
                direction="right"
                tone={toneOf(task)}
                testid="todo-meter"
              />
            </span>
          {/if}
          <button
            type="button"
            class="kill"
            aria-label="delete {task.title}"
            onclick={() => remove(task)}
            data-testid="todo-remove">×</button
          >
        </div>
      {/each}
    {:else}
      <p class="empty">nothing queued</p>
    {/each}

    {#if done.length > 0}
      <div class="band-head done-head">
        <button
          type="button"
          class="disclose"
          aria-expanded={showCompleted}
          onclick={() => save({ showCompleted: !showCompleted })}
          data-testid="todo-toggle-done"
        >
          <span class="chevron" aria-hidden="true">{showCompleted ? '▾' : '▸'}</span>
          <span>done</span>
          <span class="band-count">{done.length}</span>
        </button>
        <button type="button" class="clear" onclick={clearDone} data-testid="todo-clear-done">clear</button>
      </div>
      {#if showCompleted}
        {#each done as task (task.id)}
          <div class="row finished" data-testid="todo-row-done">
            <button
              type="button"
              class="check"
              aria-label="reopen {task.title}"
              onclick={() => reopen(task)}
              data-testid="todo-reopen">[x]</button
            >
            <span class="title">{task.title}</span>
          </div>
        {/each}
      {/if}
    {/if}
  </div>
</div>

<style>
.todo {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

/*
 * A wide pane: the rows keep a measure rather than stretching a three-word task
 * across the whole screen, and the meter grows into the room instead.
 */
@container (min-width: 32rem) {
  .rows,
  .compose,
  .decoded {
    width: min(100%, 46rem);
    margin-inline: auto;
  }

  .meter {
    width: 6rem;
  }
}

/* Wider still, the bands stand side by side rather than one long column. */
@container (min-width: 56rem) {
  .rows {
    width: min(100%, 72rem);
    columns: 2;
    column-gap: var(--space-5);
  }

  .band-head,
  .row {
    break-inside: avoid;
  }

  .band-head {
    break-after: avoid;
  }
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  padding-right: 1.5rem;
}

.list-name {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--accent-strong);
  font-family: var(--font-display);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.chevron {
  color: var(--text-muted);
  font-size: var(--step--2);
}

.next {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.next-label {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.lists,
.settings {
  position: absolute;
  inset: 2.2rem var(--space-1) auto;
  z-index: 3;
  max-height: 70%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.lists button {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font: inherit;
  padding: var(--space-1);
  text-align: left;
  cursor: pointer;
}

.lists button.on {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.lists button.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.settings label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.settings .number input {
  width: 3.5rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font: inherit;
}

.compose {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  border-bottom: 1px solid var(--panel-border);
}

.caret {
  color: var(--accent);
}

.compose input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: var(--step-0);
  outline: none;
}

.compose input::placeholder {
  color: var(--text-muted);
}

/* What the line was understood to mean, revealed rather than simply appearing:
   it is a claim about the user's words and it should be noticed. */
.decoded {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  animation: decode calc(220ms * var(--motion-scale)) var(--ease-out) backwards;
}

@keyframes decode {
  from { clip-path: inset(0 100% 0 0); opacity: 0.4; }
  to { clip-path: inset(0 0 0 0); opacity: 1; }
}

.chip {
  padding: 0 var(--space-1);
  border: 1px solid var(--accent-dim);
  color: var(--accent);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.chip.title {
  border-color: var(--panel-rule);
  color: var(--text-muted);
  text-transform: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.rows {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.band-head {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-1);
  padding-bottom: 1px;
  border-bottom: 1px solid var(--panel-rule);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-muted);
}

.band-head button {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}

.band-count {
  margin-left: auto;
  opacity: 0.7;
}

/* The whole heading is the switch, and it looks like one: the tiny chevron on
   its own was not enough to say that completed tasks could be brought back. */
.done-head .disclose {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: 1px var(--space-1);
  border: 1px solid transparent;
}

.done-head .disclose:hover {
  border-color: var(--panel-rule);
  color: var(--accent);
}

.done-head .clear {
  margin-left: var(--space-2);
  color: var(--text-muted);
}

.done-head .clear:hover {
  color: var(--danger);
}

.row {
  --row-tone: var(--accent);
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: 1px 0;
}

.row.warn { --row-tone: var(--warn); }
.row.danger { --row-tone: var(--danger); }

.row:hover {
  background: var(--accent-faint);
}

.check,
.kill {
  border: 0;
  padding: 0 2px;
  background: transparent;
  color: var(--row-tone);
  font: inherit;
  cursor: pointer;
}

.kill {
  color: transparent;
}

.row:hover .kill {
  color: var(--text-muted);
}

.row:hover .kill:hover {
  color: var(--danger);
}

.title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
  border: 0;
  background: transparent;
  font: inherit;
  padding: 0;
  text-align: left;
  cursor: text;
}

.row:hover .title {
  text-decoration: underline;
  text-decoration-color: var(--accent-dim);
  text-underline-offset: 2px;
}

/* Editing happens in the row, in the same type, so nothing jumps. */
.edit {
  border: 0;
  border-bottom: 1px solid var(--accent);
  background: transparent;
  color: var(--accent-strong);
  font: inherit;
  outline: none;
  padding: 0;
}

.edit.title {
  flex: 1;
  min-width: 0;
}

.edit.when {
  flex: 0 1 14rem;
  min-width: 6rem;
  font-size: var(--step--1);
}

.repeat {
  color: var(--text-muted);
}

.when {
  color: var(--row-tone);
  font-size: var(--step--1);
  white-space: nowrap;
  border: 0;
  background: transparent;
  font-family: inherit;
  padding: 0;
  cursor: text;
}

.row:hover .when {
  text-decoration: underline;
  text-decoration-color: var(--accent-dim);
  text-underline-offset: 2px;
}

.meter {
  display: block;
  width: 3.5rem;
  height: 0.5rem;
  flex: none;
}

/* An overdue row breathes once a second - the one thing in the pane allowed to
   move on its own, and only while something really is late: full, part, low,
   part, a step each quarter second, on the shared beat (lib/pulse.svelte.ts). */
.todo[data-pulse='1'] .row.late .when,
.todo[data-pulse='3'] .row.late .when {
  opacity: 0.725;
}

.todo[data-pulse='2'] .row.late .when {
  opacity: 0.45;
}

/* Completion: the row is struck through left to right, then collapses. */
.row.striking .title {
  position: relative;
}

.row.striking .title::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  height: 1px;
  background: var(--ok);
  animation: strike calc(220ms * var(--motion-scale)) var(--ease-out) forwards;
}

.row.striking {
  animation: settle calc(260ms * var(--motion-scale)) var(--ease-in-out) forwards;
}

@keyframes strike {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes settle {
  from { opacity: 1; }
  to { opacity: 0.2; transform: translateX(0.5rem); }
}

.row.finished .title {
  color: var(--text-muted);
  text-decoration: line-through;
}

.empty {
  margin: auto 0;
  color: var(--text-muted);
  font-size: var(--step--2);
  text-align: center;
}
</style>
