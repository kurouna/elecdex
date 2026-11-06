<script lang="ts">
import type { TranslateBoard } from '@shared/translate/board'
import type { HistoryRow } from '@shared/translate/history'
import { untrack } from 'svelte'
import { onSummoned } from '../../lib/summoned.svelte.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import EngineView from './EngineView.svelte'
import HistoryView from './HistoryView.svelte'
import { draftOf, isActive, keepDraft, newDraftId, RunFollower } from './run-follower.svelte.ts'
import SetupView from './SetupView.svelte'
import TextView from './TextView.svelte'
import { firstSetupStep, phaseLamp, whereTextGoes } from './translate-view.ts'
import ViewSwitch from './ViewSwitch.svelte'

/**
 * TRANSLATE: PLaMo 3 Translate on this PC through llama-server (docs/translate.md). Main starts
 * the engine and fetches; this pane follows main's board only while it is seen, and never talks to
 * the engine itself. Its translation is main's too: the pane follows it while it is seen, and while
 * it is being written even unseen (§8.5), so a run behind a tab goes on and is drawn when shown.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))

let board = $state.raw<TranslateBoard | null>(null)
let view = $state<'text' | 'history' | 'setup' | 'engine'>('text')

/**
 * A model chosen in ENGINE or SETUP and not yet the settings' (user's request 2026-11-06): written
 * only by DONE with a model in place, or by SETUP's fetch, which fetches the settings' model.
 * Leaving the two views any other way puts it back: a model only listed must never become the one
 * TEXT translates with.
 */
let pendingModel = $state<string | null>(null)
const chosenModel = $derived(pendingModel ?? board?.selectedModel ?? '')

$effect(() => {
  if (view !== 'engine' && view !== 'setup') pendingModel = null
})

$effect(() => {
  // Let go only once the board says so: main publishes it a moment after the settings are written,
  // and until then the board still names the model before (SETUP would take that one as fetched).
  if (pendingModel !== null && board?.selectedModel === pendingModel) pendingModel = null
})

/** The chosen model becomes the settings', and the engine follows it; awaited before a fetch. */
async function commitModel(): Promise<void> {
  const id = pendingModel
  if (id !== null && id !== board?.selectedModel)
    await appearance.patch({ translate: { modelId: id } })
}
let step = $state(1)

$effect(() => (visible ? window.elecdex.translate.subscribe((next) => (board = next)) : undefined))

// A pane's id is its mount's for good: the follower is made once.
const follower = new RunFollower(untrack(() => paneId))
const following = $derived(visible || isActive(follower.run))
$effect(() => (following ? follower.follow() : undefined))

// Out of sight, a LIVE run stops (§8.5): what is typed for the screen is not written unseen. Here,
// not in TEXT, which HISTORY and ENGINE take the place of.
$effect(() => {
  const run = follower.run
  if (!visible && run !== null && run.mode === 'live' && isActive(run)) {
    window.elecdex.translate.cancelLive(paneId)
  }
})

const settings = $derived(appearance.settings.translate)
const lamp = $derived(board ? phaseLamp(board.engine.phase) : null)
const where = $derived(board ? whereTextGoes(board.engine) : null)

$effect(() => {
  const b = board
  paneMeta.set(paneId, {
    subtitle: b ? `${b.selectedModel.replace(/^plamo3-/, 'plamo-3-translate-')}` : 'translate',
    ...(b?.engine.phase === 'fault' ? { badge: 'engine fault', badgeKind: 'danger' as const } : {}),
  })
})

/**
 * A history row opened (§3): main puts the entry on this pane as a finished run - its snapshot
 * reaches the follower before the answer - and TEXT, mounted afresh on an empty draft, takes the
 * source back from it; the languages and form become the pane's again.
 */
async function openEntry(row: HistoryRow): Promise<void> {
  const answer = await window.elecdex.translate.historyOpen(paneId, row.id)
  if ('problem' in answer) return
  // The pane's context stays: an entry carries none of its own.
  keepDraft(paneId, { text: '', draftId: newDraftId(), context: draftOf(paneId).context })
  widgetState.patch(paneId, {
    srcLang: row.srcLang,
    tgtLang: row.tgtLang,
    ...(row.form ? { form: row.form } : {}),
  })
  view = 'text'
}

/**
 * Ctrl+Shift+Y (§12): the pane comes up with the clipboard's text, read by main, and translates
 * it at once (recorded as a TRANSLATE is); with no text there, it opens on an empty source.
 */
let summon = $state.raw<{ seq: number; text: string } | null>(null)
let summons = 0
onSummoned(
  () => paneId,
  () => {
    void window.elecdex.translate.clipboardText().then((text) => {
      view = 'text'
      summon = { seq: ++summons, text: text ?? '' }
    })
  },
)

function openSetup(at?: number): void {
  if (board) step = at ?? firstSetupStep(board, chosenModel)
  view = 'setup'
}
</script>

<div class="translate" data-testid="translate-pane">
  <SettingsButton
    open={view === 'engine'}
    label="engine and models"
    testid="translate-settings-toggle"
    ontoggle={() => (view = view === 'engine' ? 'text' : 'engine')}
  />
  {#if board}
    {#key view}
      <div class="view crt-on">
        {#if view === 'history'}
          <div class="toolbar"><ViewSwitch view="history" onchange={(next) => (view = next)} /></div>
          <HistoryView
            revision={board.library}
            saving={settings.saveHistory}
            onopen={(row) => void openEntry(row)}
          />
        {:else if view === 'setup'}
          <SetupView
            {board}
            {step}
            onstep={(next) => (step = next)}
            chosen={chosenModel}
            onselect={(modelId) => (pendingModel = modelId)}
            oncommit={commitModel}
            ondone={() => (view = 'text')}
          />
        {:else if view === 'engine'}
          <EngineView
            {board}
            {settings}
            chosen={chosenModel}
            onpick={(modelId) => (pendingModel = modelId)}
            onsetup={(at) => openSetup(at)}
            onupdate={(modelId) => {
              // The update is agreed to and fetched in SETUP, from its licence.
              pendingModel = modelId
              openSetup(3)
            }}
            ondone={() => void commitModel().then(() => (view = 'text'))}
          />
        {:else}
          <TextView
            {paneId}
            {board}
            {paneState}
            {visible}
            {follower}
            onsetup={() => openSetup()}
            onengine={() => (view = 'engine')}
            onhistory={() => (view = 'history')}
            {summon}
          />
        {/if}
      </div>
    {/key}
    <footer class="foot">
      <span class="lampw {lamp?.kind}"><i></i><b>{lamp?.word}</b></span>
      <span class="fig">{board.engine.build ?? ''}{board.engine.port ? ` · 127.0.0.1:${board.engine.port}` : ''} · ctx {board.engine.ctx}</span>
      <span class="spacer"></span>
      <span class="credit">Built with PLaMo · PLaMo 3 Translate · PLaMo Community License · llama.cpp</span>
      <span class:warn={where?.warn} data-testid="translate-where">· {where?.text}</span>
    </footer>
  {/if}
</div>

<style>
.translate { position: relative; display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 0 var(--space-1); font-family: var(--font-ui); color: var(--text); }
.view { flex: 1; min-height: 0; display: flex; flex-direction: column; padding-top: var(--space-1); }
.foot { display: flex; align-items: center; gap: var(--space-1) var(--space-3); padding: var(--space-1) var(--space-1); margin-top: var(--space-1); border-top: 1px solid var(--panel-rule); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); flex-wrap: wrap; }
.lampw { display: inline-flex; align-items: center; gap: var(--space-1); color: var(--text); font-weight: 600; }
.lampw i { width: 0.5rem; height: 0.5rem; transform: rotate(45deg); border: 1px solid var(--text-muted); }
.lampw.ok i { background: var(--ok); border-color: var(--ok); }
.lampw.warn i { border-color: var(--warn); }
.lampw.warn b { color: var(--warn); }
.lampw.bad i { background: var(--danger); border-color: var(--danger); }
.lampw.bad b { color: var(--danger); }
.lampw.busy i { background: var(--accent); border-color: var(--accent); }
.fig { font-family: var(--font-mono); text-transform: none; letter-spacing: 0; }
.credit { text-transform: none; letter-spacing: 0.02em; }
.spacer { flex: 1; }
.toolbar { display: flex; align-items: center; min-height: 1.6rem; padding-right: 1.7rem; margin-bottom: var(--space-1); }
.warn { color: var(--warn); }
/* The press that blinks (lib/blink.ts), as CHIP-8's and the ELEC-16's buttons do: one held flashes
   the accent on the 100 ms beat, and a choice that changes what is shown (afterBlink) blinks three
   beats first. Every view's buttons, in one place (user's report 2026-11-06: only SETUP had it);
   not the text links, the spine's numbers, or a row of a list (a model's name, a history entry,
   a language), which are not buttons to the eye, nor the settings button every pane shares. */
.translate :global(button:not(:disabled, .link, .node, .name, .open, .li, .settings-toggle):active), .translate :global(.blinking) { animation: tr-press 100ms linear infinite; animation-play-state: var(--ambient-play-state); }
@keyframes -global-tr-press { 50% { background: var(--accent); color: var(--text-inverse); border-color: var(--accent); } }
</style>
