<script lang="ts">
import { ago, type ChatStop, compactCount } from '@shared/ai'
import {
  applyElecEvent,
  type Ballot,
  countsAsVote,
  ELEC_LIMITS,
  type ElecRun,
  type ElecView,
  EMPTY_ELEC_VIEW,
  OUTCOME_WORDS,
  type Outcome,
  paneElec,
  readVote,
  resolve,
  resolveSeat,
  UNIT_INDICES,
  type UnitIndex,
  unitLabel,
} from '@shared/elec'
import ConfirmButton from '../../ConfirmButton.svelte'
import { CopyFlag } from '../../lib/copied.svelte.ts'
import { crtPower } from '../../lib/crt-transitions.ts'
import { onBoundary } from '../../lib/frame-loop.ts'
import { pulse } from '../../lib/pulse.svelte.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { elec } from '../../stores/elec.svelte.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'
import Markdown from '../aichat/Markdown.svelte'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import SeatsPanel from './SeatsPanel.svelte'
import Stage, { type Readout, type UnitView } from './Stage.svelte'

/**
 * The ELEC system: a motion put to a council of three units - LOGOS, ETHOS,
 * PATHOS - each a provider and model of the AI settings given a standpoint of
 * its own, which vote APPROVE, REJECT or ABSTAIN (shared/elec.ts).
 *
 * Built on the chat pane's ground and spoken in its words: the seats and the rule
 * are settings, the deliberation and the answers being written are main's, and
 * this pane holds only which deliberation it shows - moved, reloaded or behind
 * another tab, the council goes on. Nothing is asked of any provider until a
 * motion is submitted, or a model list opened.
 *
 *   Enter        submit        Shift+Enter  a new line
 *   Esc          stop the deliberation
 */
const { paneId, state: paneState }: WidgetProps = $props()

const choice = $derived(paneElec(paneState))
const providers = $derived(appearance.settings.ai.providers)
const settings = $derived(appearance.settings.elec)

$effect(() => elec.use())

function save(change: Record<string, unknown>): void {
  layout.setPaneState(paneId, { ...paneState, ...change })
}

let view = $state.raw<ElecView>(EMPTY_ELEC_VIEW)
/** The deliberation the view belongs to: a pane switched to another shows nothing of the last one. */
let viewOf: string | null = null
let problem = $state<string | null>(null)

$effect(() => {
  const sessionId = choice.session
  view = EMPTY_ELEC_VIEW
  viewOf = sessionId
  if (sessionId === null) return
  let off: (() => void) | null = null
  const follow = (): void => {
    off = window.elecdex.elec.subscribe(sessionId, (event) => {
      if (viewOf !== sessionId) return
      // Deleted, here or from another pane: main says so, and the pane lets go of it.
      if (event.type === 'snapshot' && event.session === null) {
        save({ session: undefined })
        return
      }
      const next = applyElecEvent(view, event)
      if (next !== 'resync') {
        view = next
        return
      }
      // A piece went missing: start over from a snapshot rather than show a text with a hole.
      off?.()
      follow()
    })
  }
  follow()
  return () => off?.()
})

const session = $derived(view.session)
const live = $derived(view.live)
const busy = $derived(live !== null)
const round = $derived(live?.round ?? session?.rounds ?? settings.rounds)
const resolution = $derived(session === null ? null : resolve(session))
/** A deliberation that stopped with no resolution and nobody voting: the app went away mid-vote. */
const outcome = $derived<Outcome | 'interrupted' | null>(
  session === null || busy ? null : (resolution?.outcome ?? 'interrupted'),
)

/** The seats as the settings have them: what a motion submitted now is put to. */
const seatsNow = $derived(UNIT_INDICES.map((u) => resolveSeat(settings.seats[u], providers)))
const blocked = $derived.by(() => {
  if (providers.length === 0) return null
  const missing = UNIT_INDICES.find((u) => seatsNow[u]?.model === '')
  return missing === undefined
    ? null
    : `${unitLabel(missing)} has no model - choose one under seats`
})

/*
 * The seconds since the motion was put, while the council sits: on the wall-clock
 * ticks everything else uses, and hung off a number, not the view, which is a new
 * object ten times a second.
 */
const startedAt = $derived(busy ? (session?.createdAt ?? null) : null)
let elapsed = $state(0)

$effect(() => {
  if (startedAt === null) return
  const began = startedAt
  const count = (): void => {
    const next = Math.max(0, Math.floor((Date.now() - began) / 1000))
    if (next !== elapsed) elapsed = next
  }
  count()
  return onBoundary(1000, count)
})

$effect(() => {
  if (busy) return pulse.use()
})

/** The ways a ballot ends that are the link's, worded as the chat pane words them. */
const STOP_CODES: Record<ChatStop, string> = {
  stopped: 'stopped',
  length: 'truncated',
  refusal: 'declined',
  error: 'link error',
  unreachable: 'no carrier',
}

const ballotOf = (unit: UnitIndex, r: number): Ballot | undefined =>
  session?.ballots.find((b) => b.unit === unit && b.round === r)
const runOf = (unit: UnitIndex): ElecRun | undefined => live?.runs.find((r) => r.unit === unit)

/** What a ballot that does not count says instead of a verdict. */
function voidCode(ballot: Ballot): string {
  if (ballot.stop !== undefined && ballot.stop !== 'length') return STOP_CODES[ballot.stop]
  return ballot.stop === 'length' ? 'truncated' : 'no verdict'
}

function runCode(run: ElecRun): string {
  if (run.text !== '') return 'rx'
  return run.thinking === '' ? 'tx' : 'rx · reasoning'
}

/** A seat before any motion: what a motion submitted now would be put to. */
function standbyView(unit: UnitIndex): UnitView {
  const model = seatsNow[unit]?.model ?? ''
  const code = providers.length === 0 ? 'no link' : model === '' ? 'no model' : 'standby'
  return { unit, state: 'standby', code, model, confidence: null, ballot: null, was: null }
}

/** A seat's vote in the round shown, and the first round's when the second changed it. */
function ballotView(base: UnitView, ballot: Ballot): UnitView {
  if (!countsAsVote(ballot) || ballot.verdict === null) {
    return { ...base, state: 'invalid', code: voidCode(ballot), ballot: ballot.id }
  }
  const first = ballot.round === 2 ? ballotOf(ballot.unit, 1) : undefined
  const changed = first !== undefined && countsAsVote(first) && first.verdict !== ballot.verdict
  return {
    ...base,
    state: ballot.verdict,
    code: ballot.verdict,
    confidence: ballot.confidence ?? null,
    ballot: ballot.id,
    was: changed ? first.verdict : null,
  }
}

function unitView(unit: UnitIndex): UnitView {
  if (session === null) return standbyView(unit)
  const base: UnitView = {
    unit,
    state: 'queued',
    code: 'queued',
    model: session.seats[unit]?.model ?? '',
    confidence: null,
    ballot: null,
    was: null,
  }
  const run = runOf(unit)
  if (run !== undefined) {
    const state = run.text === '' && run.thinking === '' ? 'tx' : 'rx'
    return { ...base, state, code: runCode(run) }
  }
  const ballot = ballotOf(unit, round)
  if (ballot !== undefined) return ballotView(base, ballot)
  // Not asked yet: waiting its turn while the council sits, or never asked if the app went away.
  return busy ? base : { ...base, state: 'invalid', code: 'interrupted' }
}

const units = $derived(UNIT_INDICES.map(unitView))

/** The motion's call sign: the first letters of its id, as a console numbers what it files. */
const sign = $derived(session === null ? '----' : session.id.slice(0, 4).toUpperCase())

const seconds = (ms: number): string =>
  ms < 60_000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms / 60_000)}m`

const left = $derived<Readout[]>([
  { label: 'RULE', value: (session?.rule ?? settings.rule).toUpperCase() },
  {
    label: 'ROUND',
    value: `${session === null ? '-' : round} / ${session?.rounds ?? settings.rounds}`,
  },
])

const right = $derived.by<Readout[]>(() => {
  const ballots = session?.ballots ?? []
  const tokens = ballots.reduce(
    (sum, b) => sum + (b.usage === undefined ? 0 : b.usage.input + b.usage.output),
    0,
  )
  const lastAt = Math.max(0, ...ballots.map((b) => b.at))
  const time =
    session === null
      ? '-'
      : busy
        ? `T+${elapsed}s`
        : seconds(Math.max(0, lastAt - session.createdAt))
  const voted = ballots.filter((b) => b.round === round && countsAsVote(b)).length
  return [
    { label: busy ? 'ELAPSED' : 'TOOK', value: time },
    { label: 'VOTES', value: session === null ? '-' : `${voted} / 3` },
    { label: 'TOKENS', value: tokens === 0 ? '-' : compactCount(tokens) },
  ]
})

/** The sweep of a link sending, stepping with the shared pulse (as in the chat pane). */
const SWEEP = ['▰▱▱▱', '▱▰▱▱', '▱▱▰▱', '▱▱▱▰'] as const

const core = $derived.by(() => {
  if (providers.length === 0) return 'no link'
  if (session === null) return blocked === null ? 'awaiting motion' : 'no model'
  if (busy) return `round ${round} · T+${elapsed}s`
  return outcome === null || outcome === 'interrupted' ? 'interrupted' : OUTCOME_WORDS[outcome]
})

/** The pane's heading names the motion; while the council sits, the badge says so in words. */
$effect(() => {
  const title = session?.title ?? ''
  paneMeta.set(paneId, {
    ...(title === '' ? {} : { subtitle: title }),
    ...(busy ? { badge: 'deliberating', badgeKind: 'ok' as const } : {}),
  })
})

/*
 * Heard while this pane watches: each vote landing, and the resolution - granted
 * for a motion approved, the alarm for one rejected, the glitch when the council
 * could not decide.
 */
let heardOf: string | null = null
let heardVotes = 0
let wasBusy = false

function hear(votes: number, now: boolean): void {
  if (votes > heardVotes && now) sfx.play('panel')
  if (!wasBusy || now) return
  sfx.play(outcome === 'approved' ? 'granted' : outcome === 'rejected' ? 'alarm' : 'glitch')
}

$effect(() => {
  const id = session?.id ?? null
  const votes = session?.ballots.length ?? 0
  const now = busy
  if (id === heardOf) hear(votes, now)
  heardOf = id
  heardVotes = votes
  wasBusy = now
})

let draft = $state('')
let composer = $state<HTMLTextAreaElement | null>(null)

async function submit(text: string): Promise<boolean> {
  if (busy || blocked !== null || providers.length === 0) return false
  problem = null
  const result = await window.elecdex.elec.submit(text)
  if (!result.ok) {
    problem = result.error
    return false
  }
  historyOpen = false
  save({ session: result.sessionId })
  sfx.play('stdout')
  return true
}

async function send(): Promise<void> {
  const text = draft.trim()
  if (text === '') return
  if (await submit(text)) draft = ''
}

function onComposerKey(event: KeyboardEvent): void {
  // Enter that confirms an IME conversion is not the Enter that submits.
  if (event.isComposing || event.keyCode === 229) return
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault()
    void send()
  } else if (event.key === 'Escape' && busy && choice.session !== null) {
    window.elecdex.elec.stop(choice.session)
    event.stopPropagation()
  }
}

function fresh(): void {
  problem = null
  historyOpen = false
  save({ session: undefined })
  composer?.focus()
}

let historyOpen = $state(false)
/** Whether a long motion is shown whole; each deliberation opens folded to two lines. */
let motionOpen = $state(false)
$effect(() => {
  void choice.session
  motionOpen = false
})
let seatsOpen = $state(false)
/** When the log was opened: its "2h" are said from then, and do not tick. */
let openedAt = $state(Date.now())

function toggleHistory(): void {
  historyOpen = !historyOpen
  if (historyOpen) openedAt = Date.now()
}

function openSession(id: string): void {
  problem = null
  historyOpen = false
  save({ session: id })
}

async function removeSession(id: string): Promise<void> {
  await window.elecdex.elec.remove(id)
  if (id === choice.session) save({ session: undefined })
}

const copied = new CopyFlag()
$effect(() => () => copied.dispose())

const time = (at: number): string => new Date(at).toTimeString().slice(0, 5)

/** "42 › 180 tok · 3.1s": what the provider counted, and how long the unit took. */
function telemetry(ballot: Ballot): string | null {
  const parts: string[] = []
  if (ballot.usage !== undefined) {
    parts.push(`${compactCount(ballot.usage.input)} › ${compactCount(ballot.usage.output)} tok`)
  }
  if (ballot.ms !== undefined && ballot.text !== '') parts.push(seconds(ballot.ms))
  return parts.length === 0 ? null : parts.join(' · ')
}

const FAILED = new Set<ChatStop | undefined>(['error', 'unreachable', 'refusal'])
</script>

<div
  class="elec"
  data-testid="elec"
  data-busy={busy}
  data-outcome={outcome ?? undefined}
  data-pulse={busy ? pulse.phase : undefined}
>
  <SettingsButton open={false} label="ai settings" testid="elec-settings" ontoggle={() => ui.openSettings('ai')} />

  {#if providers.length === 0}
    <div class="standby fx-rise" data-testid="elec-setup">
      <span class="state"><span class="lamp"></span>no link</span>
      <span class="hint">the council asks the providers of the ai settings: a local server, or a service you have a key for</span>
      <button type="button" class="command" onclick={() => ui.openSettings('ai')} data-testid="elec-open-settings">
        <span aria-hidden="true">&gt;</span> set up provider
      </button>
    </div>
  {:else}
    <div class="bar">
      <button
        type="button"
        class="cmd lit"
        onclick={fresh}
        disabled={busy || choice.session === null}
        title={choice.session === null ? 'this is a new motion' : 'put a new motion'}
        data-testid="elec-new"
      >
        <span aria-hidden="true">+</span> new
      </button>
      <button
        type="button"
        class="cmd"
        aria-expanded={historyOpen}
        onclick={toggleHistory}
        title="the deliberations kept on this computer"
        data-testid="elec-log-toggle"
      >
        log
      </button>
      <button
        type="button"
        class="cmd"
        class:wanting={blocked !== null}
        aria-expanded={seatsOpen}
        onclick={() => (seatsOpen = !seatsOpen)}
        title="the provider and model in each seat"
        data-testid="elec-seats-toggle"
      >
        seats
      </button>
      <span class="spacer"></span>
      <select
        value={settings.rule}
        onchange={(e) => void appearance.patch({ elec: { rule: e.currentTarget.value as 'majority' | 'unanimous' } })}
        aria-label="rule"
        title="majority: two seats decide · unanimous: all three must approve"
        data-testid="elec-rule"
      >
        <option value="majority">majority</option>
        <option value="unanimous">unanimous</option>
      </select>
      <select
        value={String(settings.rounds)}
        onchange={(e) => void appearance.patch({ elec: { rounds: e.currentTarget.value === '2' ? 2 : 1 } })}
        aria-label="rounds"
        title="2 rounds: each unit reads the others' statements and votes again - twice the requests"
        data-testid="elec-rounds"
      >
        <option value="1">1 round</option>
        <option value="2">2 rounds</option>
      </select>
    </div>

    {#if seatsOpen}
      <SeatsPanel />
    {/if}

    {#if historyOpen}
      <ul class="history" data-testid="elec-log">
        {#each elec.sessions as entry, n (entry.id)}
          <li class="fx-rise" class:current={entry.id === choice.session} style:--fx-delay={`${Math.min(n, 12) * 22}ms`}>
            <button type="button" class="open" onclick={() => openSession(entry.id)} data-testid="elec-log-item">
              <span class="index">{String(n + 1).padStart(2, '0')}</span>
              <span class="name">{entry.title === '' ? 'untitled' : entry.title}</span>
              <span class="outcome" data-outcome={entry.outcome ?? 'interrupted'}>{entry.outcome === null ? '—' : OUTCOME_WORDS[entry.outcome]}</span>
              <span class="when" title={new Date(entry.updatedAt).toLocaleString()}>{ago(entry.updatedAt, openedAt)}</span>
            </button>
            <button type="button" class="cmd tool" title="save as markdown" onclick={() => void window.elecdex.elec.export(entry.id)}>
              export
            </button>
            <ConfirmButton
              label="delete"
              action="delete"
              title="Delete this deliberation"
              testid="elec-log-delete"
              onconfirm={() => void removeSession(entry.id)}
            />
          </li>
        {:else}
          <li class="none">No deliberations yet.</li>
        {/each}
      </ul>
    {/if}

    <!--
      The motion, over the council that votes on it: what the plates and the resolution are the
      answer to. Always there, so submitting one does not move the stage; two lines at most, the
      rest a click away.
    -->
    <div class="motion" class:open={motionOpen} data-testid="elec-motion" data-empty={session === null}>
      <span class="sign">motion #{sign}</span>
      {#if session === null}
        <span class="said quiet">awaiting motion · type one below</span>
      {:else}
        {#key session.id}
          <button
            type="button"
            class="said fx-rise"
            title={motionOpen ? 'show less' : session.motion}
            onclick={() => (motionOpen = !motionOpen)}
            data-testid="elec-motion-text"
          >
            {session.motion}
          </button>
        {/key}
        <span class="tools">
          <span class="meta">{time(session.createdAt)}</span>
          <button type="button" class="act" onclick={() => void copied.copy(session.id, session.motion)}>
            {copied.key === session.id ? 'copied' : 'copy'}
          </button>
          <button type="button" class="act" onclick={() => (draft = session.motion)} title="put it in the line below, to change and submit">
            edit
          </button>
        </span>
      {/if}
    </div>

    <Stage {units} live={busy} {left} {right} {core} />

    <!-- The resolution: what the council decided, powering on like every notice here. -->
    <div class="resolution" data-testid="elec-resolution" data-outcome={outcome ?? (busy ? 'pending' : 'none')}>
      <span class="label">resolution</span>
      <span class="rule"></span>
      {#if busy}
        <span class="pending"><span class="sweep" aria-hidden="true">{SWEEP[pulse.phase] ?? SWEEP[0]}</span>deliberating</span>
      {:else if outcome === null}
        <span class="pending">awaiting motion</span>
      {:else}
        {#key session?.id}
          <span class="verdict crt-on" transition:crtPower data-testid="elec-outcome">
            {outcome === 'interrupted' ? 'interrupted' : OUTCOME_WORDS[outcome]}
          </span>
        {/key}
        {#if resolution !== null}
          <span class="tally" title="approve · reject · abstain · invalid (a failed link, or no verdict)">
            <span class="ok">{resolution.approve}</span>·<span class="no">{resolution.reject}</span>·<span class="ab">{resolution.abstain}</span>·<span class="void">{resolution.invalid}</span>
          </span>
        {/if}
        <button
          type="button"
          class="cmd"
          disabled={blocked !== null}
          onclick={() => session !== null && void submit(session.motion)}
          title="put the same motion to the council as it is seated now"
          data-testid="elec-again"
        >
          again
        </button>
      {/if}
      <span class="rule back"></span>
    </div>

    <div class="record" data-testid="elec-record">
      {#if session === null}
        <p class="brief rising" data-testid="elec-empty">
          <span>Put a motion the council can answer yes or no.</span>
          <span>Each unit votes from its own standpoint; {settings.rule === 'majority' ? 'two seats decide' : 'all three must approve'}.</span>
          <span class="quiet">Nothing is sent until you submit · deliberations stay on this computer</span>
        </p>
      {:else}
        <div class="ballots">
          {#each UNIT_INDICES as unit (unit)}
            {@const run = runOf(unit)}
            {@const ballot = ballotOf(unit, round)}
            {@const first = round === 2 ? ballotOf(unit, 1) : undefined}
            {@const state = units[unit]?.state ?? 'standby'}
            <article class="ballot fx-rise" data-state={state} data-testid="elec-ballot" data-unit={unit} style:--fx-delay={`${unit * 60}ms`}>
              <header>
                <span class="who">{unitLabel(unit)}</span>
                <span class="rule"></span>
                <span class="chip" data-testid="elec-ballot-code">{units[unit]?.code}</span>
              </header>
              <span class="model">
                {session.seats[unit]?.provider} · {ballot?.model ?? session.seats[unit]?.model}{#if ballot !== undefined && telemetry(ballot) !== null}&nbsp;· {telemetry(ballot)}{/if}
              </span>
              {#if first !== undefined}
                <details class="thinking">
                  <summary>round 1 · {countsAsVote(first) ? first.verdict : voidCode(first)}</summary>
                  <p>{readVote(first.text).statement}</p>
                </details>
              {/if}
              {#if run !== undefined}
                {#if run.thinking !== ''}
                  <details class="thinking" open={run.text === ''}>
                    <summary>reasoning</summary>
                    <p>{run.thinking}</p>
                  </details>
                {/if}
                <div class="running">
                  {#if run.text !== ''}
                    <Markdown source={readVote(run.text).statement} />
                  {:else if run.thinking === ''}
                    <p class="note">waiting for {run.provider}<span class="caret">▍</span></p>
                  {/if}
                </div>
              {:else if ballot !== undefined}
                {#if ballot.thinking}
                  <details class="thinking">
                    <summary>reasoning</summary>
                    <p>{ballot.thinking}</p>
                  </details>
                {/if}
                {#if readVote(ballot.text).statement !== ''}
                  <Markdown source={readVote(ballot.text).statement} />
                {/if}
                {#if ballot.stop !== undefined || !countsAsVote(ballot)}
                  <p class="stop" class:failed={FAILED.has(ballot.stop) || ballot.verdict === null} data-testid="elec-ballot-stop">
                    <span class="code">{voidCode(ballot)}</span>{#if ballot.error}<span class="detail">{ballot.error}</span>{:else if ballot.verdict === null && ballot.stop === undefined}<span class="detail">no VERDICT line could be read - the vote does not count</span>{/if}
                  </p>
                {/if}
              {:else if busy}
                <p class="note">queued · asked when the unit before it on the same server has voted</p>
              {/if}
            </article>
          {/each}
        </div>
      {/if}
    </div>

    {#if problem !== null}
      <p class="problem" data-testid="elec-problem"><span class="code">refused</span><span class="detail">{problem}</span></p>
    {:else if blocked !== null && draft.trim() !== ''}
      <p class="problem" data-testid="elec-blocked"><span class="code">no model</span><span class="detail">{blocked}</span></p>
    {/if}

    <form
      class="composer"
      onsubmit={(e) => {
        e.preventDefault()
        void send()
      }}
    >
      <span class="prompt" aria-hidden="true">&gt;</span>
      <textarea
        bind:this={composer}
        bind:value={draft}
        rows="1"
        maxlength={ELEC_LIMITS.motion}
        placeholder="motion · enter to submit, shift+enter for a new line"
        onkeydown={onComposerKey}
        data-testid="elec-input"
      ></textarea>
      {#if busy}
        <button
          type="button"
          class="cmd stop"
          onclick={() => choice.session !== null && window.elecdex.elec.stop(choice.session)}
          data-testid="elec-stop-button"
        >
          stop
        </button>
      {:else}
        <button type="submit" class="cmd lit" disabled={draft.trim() === '' || blocked !== null} data-testid="elec-submit">
          submit
        </button>
      {/if}
    </form>
  {/if}
</div>

<style>
.elec {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  position: relative;
  padding: 0 var(--space-1);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  color: var(--text);
  /* The stage is sized by the pane's width as well as its height. */
  container-type: inline-size;
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: var(--space-1);
  /* Clears the settings button in the corner. */
  padding-right: 1.6rem;
  min-height: 1.4rem;
}

.spacer {
  flex: 1;
}

select {
  flex: 0 1 7.5rem;
  min-width: 0;
  padding: 0 var(--space-1);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

select:focus {
  border-color: var(--accent);
  outline: none;
}

.cmd {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.cmd:not(:disabled):hover,
.cmd[aria-expanded='true'] {
  color: var(--accent);
  border-color: var(--accent);
}

.cmd:disabled {
  opacity: 0.5;
  cursor: default;
}

.cmd.wanting {
  border-color: var(--warn);
  color: var(--warn);
}

.cmd.stop {
  border-color: var(--warn);
  color: var(--warn);
}

/* As in the chat pane: what begins something is lit while it can be pressed. */
.cmd.lit:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.composer .cmd.lit:not(:disabled) {
  background: var(--accent-faint);
}

.cmd.lit:not(:disabled):hover,
.cmd.lit:not(:disabled):focus-visible {
  background: var(--accent);
  color: var(--app-bg);
  outline: none;
}

.history {
  flex: 0 0 auto;
  max-height: 40%;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  border: 1px solid var(--panel-border);
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.history li {
  display: flex;
  align-items: stretch;
  gap: var(--space-1);
  padding: 0.1rem var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.history li > :global(:not(.open)) {
  opacity: 0;
}

.history li:hover > :global(:not(.open)),
.history li:focus-within > :global(:not(.open)) {
  opacity: 1;
}

.history li + li {
  border-top: 1px solid var(--panel-rule);
}

.history li.current .name {
  color: var(--accent-strong);
}

.history .none {
  color: var(--text-muted);
}

.index,
.when {
  flex: none;
  color: var(--text-muted);
}

.open {
  display: flex;
  flex: 1;
  min-width: 0;
  gap: var(--space-2);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.open:hover .name,
.open:focus-visible .name {
  color: var(--accent);
}

.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.outcome {
  flex: none;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.outcome[data-outcome='approved'] {
  color: var(--ok);
}

.outcome[data-outcome='rejected'] {
  color: var(--danger);
}

.outcome:is([data-outcome='deadlock'], [data-outcome='no-consensus'], [data-outcome='no-quorum']) {
  color: var(--warn);
}

/* The resolution strip: a label, rules out to the verdict, the tally beside it. */
.resolution {
  --tone: var(--text-muted);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  /* The decision is what the pane is for: a band of its own, not a status line. */
  min-height: 3.6rem;
  padding: var(--space-1);
  border-block: 1px solid var(--panel-rule);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
  user-select: none;
}

.resolution[data-outcome='approved'] {
  --tone: var(--ok);
}

.resolution[data-outcome='rejected'] {
  --tone: var(--danger);
}

.resolution:is(
    [data-outcome='deadlock'],
    [data-outcome='no-consensus'],
    [data-outcome='no-quorum'],
    [data-outcome='interrupted']
  ) {
  --tone: var(--warn);
}

.resolution[data-outcome='pending'] {
  --tone: var(--accent);
  color: var(--accent);
}

.label {
  flex: none;
  font-family: var(--font-display);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wider);
}

.rule {
  flex: 1;
  min-width: var(--space-2);
  height: 1px;
  background: linear-gradient(to right, var(--accent-dim), transparent);
}

.rule.back {
  background: linear-gradient(to left, var(--accent-dim), transparent);
}

.resolution[data-outcome] .rule {
  background: linear-gradient(to right, color-mix(in srgb, var(--tone) 60%, transparent), transparent);
}

.resolution[data-outcome] .rule.back {
  background: linear-gradient(to left, color-mix(in srgb, var(--tone) 60%, transparent), transparent);
}

.pending {
  display: inline-flex;
  gap: var(--space-2);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wider);
}

/* The verdict, struck in the display face between two rules of its colour. */
.verdict {
  padding: 0.1rem 1.6rem;
  border: 1px solid var(--tone);
  background: color-mix(in srgb, var(--tone) 18%, transparent);
  font-family: var(--font-display);
  font-size: var(--step-3);
  line-height: 1.2;
  letter-spacing: 0.3em;
  color: var(--tone);
  text-shadow: 0 0 calc(var(--glow) * 0.6rem) var(--tone);
  clip-path: polygon(0.8rem 0, 100% 0, 100% calc(100% - 0.8rem), calc(100% - 0.8rem) 100%, 0 100%, 0 0.8rem);
}

/* A narrow pane keeps the verdict on one line: QUORUM NOT MET is the longest it says. */
@container (max-width: 34rem) {
  .verdict {
    padding: 0.1rem 0.8rem;
    font-size: var(--step-1);
    letter-spacing: var(--tracking-wider);
  }

  .resolution .label {
    display: none;
  }
}

.tally {
  display: inline-flex;
  gap: 0.4rem;
  font-size: var(--step-1);
  color: var(--text-muted);
}

.tally .ok {
  color: var(--ok);
}

.tally .no {
  color: var(--danger);
}

.tally .ab {
  color: var(--info);
}

.tally .void {
  color: var(--warn);
}

.record {
  flex: 1;
  /* The statements keep a few lines in sight however tall the stage wants to be. */
  min-height: 7rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  overflow-y: auto;
  padding: var(--space-1) var(--space-1) var(--space-1) 0;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
  /* Text here is for reading and copying, unlike the HUD around it. */
  user-select: text;
}

.brief {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  margin: auto;
  max-width: 90%;
  text-align: center;
  color: var(--text-muted);
  line-height: 1.5;
  user-select: none;
}

.brief .quiet {
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.rising > * {
  animation: fx-rise calc(360ms * var(--motion-scale)) var(--ease-emphasized) backwards;
}

.rising > :nth-child(2) {
  animation-delay: calc(70ms * var(--motion-scale));
}

.rising > :nth-child(3) {
  animation-delay: calc(140ms * var(--motion-scale));
}

/* The motion reads as the chat pane's own message: the accent down its left, the cut corner. */
/*
 * The motion over the stage: its call sign as a tag, then the question itself in the display
 * size a heading gets, on the accent's band with the cut corner the panels have.
 */
.motion {
  flex: none;
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-1) var(--space-2);
  border-left: 2px solid var(--accent);
  background: var(--accent-faint);
  clip-path: polygon(0 0, calc(100% - 0.6rem) 0, 100% 0.6rem, 100% 100%, 0 100%);
}

.motion[data-empty='true'] {
  border-left-color: var(--panel-border);
  background: transparent;
}

.sign {
  flex: none;
  padding: 0 0.35rem;
  border: 1px solid var(--accent);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent);
  user-select: none;
}

.motion[data-empty='true'] .sign {
  border-color: var(--panel-border);
  color: var(--text-muted);
}

.motion .said {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font-family: var(--font-ui);
  font-size: var(--step-1);
  line-height: 1.35;
  text-align: left;
  color: var(--accent-strong);
  text-shadow: 0 0 calc(var(--glow) * 0.4rem) var(--accent);
  cursor: pointer;
  user-select: text;
  /* Two lines at most, the rest a click away. */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.motion.open .said {
  -webkit-line-clamp: unset;
  line-clamp: unset;
  max-height: 12rem;
  overflow-y: auto;
}

.motion .said.quiet {
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
  text-shadow: none;
  cursor: default;
}

.tools {
  flex: none;
  display: flex;
  gap: var(--space-2);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  user-select: none;
}

.who {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--font-display);
  color: var(--accent-strong);
}

.meta {
  flex: none;
  font-family: var(--font-mono);
  letter-spacing: 0;
  color: var(--text-muted);
}

.act {
  flex: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
  opacity: 0;
}

.motion:hover .act,
.act:focus-visible {
  opacity: 1;
}

.act:hover {
  color: var(--accent);
}

.said {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.5;
}

/* The three statements side by side where there is room, one above another where not. */
.ballots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-2);
  align-items: start;
}

.ballot {
  --tone: var(--panel-rule);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  padding: var(--space-1) var(--space-2);
  border-left: 2px solid var(--tone);
  background: linear-gradient(to right, color-mix(in srgb, var(--tone) 8%, transparent), transparent 60%);
}

.ballot:is([data-state='tx'], [data-state='rx']) {
  --tone: var(--accent);
}

.ballot[data-state='approve'] {
  --tone: var(--ok);
}

.ballot[data-state='reject'] {
  --tone: var(--danger);
}

.ballot[data-state='abstain'] {
  --tone: var(--info);
}

.ballot[data-state='invalid'] {
  --tone: var(--warn);
}

.chip {
  flex: none;
  padding: 0 0.35rem;
  border: 1px solid var(--tone);
  font-family: var(--font-mono);
  letter-spacing: var(--tracking-wide);
  color: var(--tone);
}

.ballot:is([data-state='standby'], [data-state='queued']) .chip {
  border-color: var(--panel-border);
  color: var(--text-muted);
}

.model {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

.thinking {
  color: var(--text-muted);
  font-size: var(--step--2);
}

.thinking summary {
  cursor: pointer;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  user-select: none;
}

.thinking summary:hover {
  color: var(--accent);
}

.thinking p {
  margin: var(--space-1) 0 0;
  padding-left: var(--space-2);
  border-left: 1px dashed var(--panel-rule);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.4;
}

/* The caret at the end of what is being written, on the shared pulse (as in the chat pane). */
.caret,
.running :global(.markdown > :last-child:not(.code, .table-frame, ul, ol, hr)::after),
.running :global(.markdown > :is(ul, ol):last-child > li:last-child > :last-child::after),
.running :global(.markdown > .code:last-child pre > code::after) {
  content: '▍';
  margin-left: 0.1em;
  color: var(--accent);
}

.elec[data-pulse='1'] .caret,
.elec[data-pulse='3'] .caret,
.elec[data-pulse='1'] .running :global(.markdown ::after),
.elec[data-pulse='3'] .running :global(.markdown ::after) {
  opacity: 0.6;
}

.elec[data-pulse='2'] .caret,
.elec[data-pulse='2'] .running :global(.markdown ::after) {
  opacity: 0.15;
}

.note {
  margin: 0;
  color: var(--text-muted);
}

.stop,
.problem {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--step--2);
  color: var(--text-muted);
}

.stop.failed,
.problem {
  color: var(--warn);
}

.code {
  flex: none;
  padding: 0 0.35rem;
  border: 1px solid currentcolor;
  font-family: var(--font-mono);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.detail {
  min-width: 0;
  overflow-wrap: anywhere;
}

.standby {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  margin: auto;
  max-width: 90%;
  text-align: center;
  user-select: none;
}

.state {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-muted);
}

.lamp {
  width: 0.5rem;
  height: 0.5rem;
  border: 1px solid var(--warn);
}

.hint {
  font-size: var(--step--1);
  color: var(--text-muted);
  line-height: 1.5;
}

.command {
  margin-top: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent-strong);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  cursor: pointer;
}

.command:hover,
.command:focus-visible {
  background: var(--accent-faint);
  outline: none;
}

.composer {
  display: flex;
  align-items: stretch;
  margin-bottom: var(--space-1);
  border: 1px solid var(--panel-border);
}

.composer:focus-within {
  border-color: var(--accent);
  box-shadow: inset 2px 0 0 var(--accent);
}

.composer:not(:focus-within) .prompt {
  color: var(--text-muted);
}

.prompt {
  flex: none;
  padding: var(--space-1) 0 0 var(--space-2);
  font-family: var(--font-mono);
  line-height: 1.4;
  color: var(--accent);
  user-select: none;
}

textarea {
  flex: 1;
  min-width: 0;
  resize: none;
  padding: var(--space-1) var(--space-2);
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  line-height: 1.4;
  field-sizing: content;
  min-height: 1.4em;
  max-height: 8rem;
}

.composer .cmd {
  display: flex;
  align-items: center;
  border-width: 0 0 0 1px;
}

.sweep {
  letter-spacing: 0.05em;
}
</style>
