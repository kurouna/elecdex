<script lang="ts">
import type { Settings } from '@shared/settings'
import { CHOSEN_MEANWHILE, type TranslateBoard } from '@shared/translate/board'
import { MODELS } from '@shared/translate/models'
import { CTX_SIZES, IDLE_MINUTES } from '@shared/translate/settings'
import { appearance } from '../../stores/appearance.svelte.ts'
import {
  FIT_WORD,
  formatBytes,
  modelFit,
  modelName,
  phaseLamp,
  serverModelFacts,
} from './translate-view.ts'

/**
 * ENGINE (docs/translate.md §3): where the engine comes from, its state, the models, how it runs,
 * its log and the licence. Run settings go to settings.json; the source goes to main's own file
 * through its picker and TEST, never through settings.
 */
interface Props {
  board: TranslateBoard
  settings: Settings['translate']
  /** The model chosen here: the settings' until another is picked, written only by DONE. */
  chosen: string
  onpick: (modelId: string) => void
  /** Opens SETUP, at a step when one is given; `another` to set up another model (never READY). */
  onsetup: (step?: number | 'another') => void
  /** UPDATE: a model in place set up again at its newest commit, from LICENCE (§5). */
  onupdate: (modelId: string) => void
  ondone: () => void
}

const { board, settings, chosen, onpick, onsetup, onupdate, ondone }: Props = $props()
const api = window.elecdex.translate

// Opened: main asks for newer commits of the models in place, at most once a day (§5).
$effect(() => {
  void api.checkUpdates()
})
/** Whether the chosen model is fetched: a model only listed has nothing to run. */
const selectedInPlace = $derived(
  board.engine.source === 'external' ||
    (board.models.find((m) => m.id === chosen)?.installed ?? false),
)
let logs = $state<string[]>([])
let address = $state('')
let problem = $state<string | null>(null)
/** The model whose DELETE was pressed once: a second press removes it (review 2026-11-07). */
let deleting = $state<string | null>(null)

// The log follows the engine: every boot line while it starts, else each change of state.
$effect(() => {
  void board.engine.phase
  void board.engine.bootLines.length
  void api.logs().then((lines) => {
    logs = lines.slice(-50)
  })
})

const lamp = $derived(phaseLamp(board.engine.phase))
const external = $derived(board.engine.source === 'external')
const phase = $derived(board.engine.phase)
/** The settings' model, which runs: marked "in use" beside the one chosen here (§3). */
const inUse = $derived(board.selectedModel)
/** Another model's download left (under way, paused or failed): it comes before any other setup. */
const leftFetch = $derived.by(() => {
  const fetch = board.fetch
  const model = board.fetchingModel
  if (!fetch || !model) return null
  const word =
    fetch.phase === 'paused' ? 'paused' : fetch.phase === 'failed' ? 'failed' : 'under way'
  return { model, word }
})

function patch(change: Partial<Settings['translate']>): void {
  void appearance.patch({ translate: change })
}

/** A source chosen before is switched to at once; its file or address is picked or tested apart. */
async function setSource(kind: 'fetched' | 'own'): Promise<void> {
  problem = null
  if (kind === 'own' && !board.engine.own) return chooseOwn()
  const answer = await api.setSource(kind)
  if (answer) problem = answer.problem
}

async function chooseOwn(): Promise<void> {
  problem = null
  const picked = await api.pickOwn()
  if (picked && 'problem' in picked && picked.problem !== CHOSEN_MEANWHILE) problem = picked.problem
}

async function test(): Promise<void> {
  problem = null
  const answer = await api.testExternal(address || board.engine.externalOrigin || '')
  // Cut off by a later choice, it says nothing: the later one does.
  if (!answer.ok && answer.problem !== CHOSEN_MEANWHILE) problem = answer.problem
  else if (answer.ok) address = ''
}

function remove(modelId: string): void {
  if (deleting !== modelId) {
    deleting = modelId
    return
  }
  deleting = null
  void api.removeModel(modelId)
}

function copyLog(): void {
  void navigator.clipboard?.writeText(logs.join('\n')).catch(() => {})
}
</script>

<div class="engine" data-testid="translate-engine">
  <div class="bar">
    <span class="lbl">Engine and models</span><span class="spacer"></span>
    <!-- A model chosen and not fetched cannot translate: the way on is its setup, not back to TEXT. -->
    {#if selectedInPlace}
      <button type="button" class="btn lit" data-testid="translate-engine-done" onclick={ondone}>Done</button>
    {:else}
      <button type="button" class="btn lit" data-testid="translate-engine-done" onclick={() => onsetup(2)}>Set up this model ›</button>
    {/if}
  </div>
  <div class="grid">
    <span class="lbl">Engine</span>
    <div class="val">
      <button type="button" class="opt" class:on={board.engine.source === 'fetched'} onclick={() => void setSource('fetched')}>
        <i class="rd"></i><b>Fetched by elecdex</b>
        <span class="mono">llama.cpp {board.engine.build ?? ''} · {board.engine.fetched ? 'in place' : 'not fetched yet'}</span>
      </button>
      <div class="opt" class:on={board.engine.source === 'own'}>
        <button type="button" class="pick" onclick={() => void setSource('own')}><i class="rd"></i><b>My own llama-server</b></button>
        <span class="row">
          <span class="mono">{board.engine.own ? `${board.engine.own.name} · b${board.engine.own.build}` : 'no file chosen'}</span>
          <button type="button" class="btn" onclick={() => void chooseOwn()}>Choose…</button>
        </span>
      </div>
      <div class="opt" class:on={external}>
        <span class="pick"><i class="rd"></i><b>A server already running</b></span>
        {#if board.engine.externalOrigin}<span class="mono" data-testid="translate-external-saved">{external ? 'In use' : 'Tested'}: {board.engine.externalOrigin}</span>{/if}
        <span class="row">
          <input class="field" bind:value={address} placeholder={board.engine.externalOrigin ?? 'http://192.168.1.20:8080'} aria-label="Server address" onkeydown={(e) => { if (e.key === 'Enter' && !e.isComposing) void test() }} />
          <button type="button" class="btn" onclick={() => void test()}>Test</button>
        </span>
        <span class="small">Test checks the address and, when it runs PLaMo 3 Translate, sends every translation there.</span>
      </div>
      {#if problem}<p class="problem">{problem}</p>{/if}
    </div>

    <span class="lbl">State</span>
    <div class="val">
      <span class="mono"><i class="lamp {lamp.kind}"></i>{lamp.word}{board.engine.backend ? ` · ${board.engine.backend}` : ''}{board.engine.device ? ` · ${board.engine.device}` : ''}{board.engine.port ? ` · 127.0.0.1:${board.engine.port}` : ''}</span>
      {#if board.engine.fallback}<span class="small">{board.engine.fallback}</span>{/if}
      {#if board.engine.error}<span class="problem">{board.engine.error}</span>{/if}
      {#if !external}
        <!-- STOP while it starts too (a large model loads for minutes); START from standby. -->
        <span class="row">
          <button type="button" class="btn" data-testid="translate-engine-stop" disabled={phase !== 'ready' && phase !== 'starting'} onclick={() => void api.engineStop()}>Stop</button>
          {#if phase === 'stopped'}
            <button type="button" class="btn" data-testid="translate-engine-start" onclick={() => void api.engineStart()}>Start</button>
          {:else}
            <button type="button" class="btn" disabled={phase === 'absent' || phase === 'stopping'} onclick={() => void api.engineRestart()}>Restart</button>
          {/if}
        </span>
      {/if}
    </div>

    <span class="lbl">Models</span>
    <!-- An external server runs its own model: elecdex's list would choose nothing (user's request 2026-11-07). -->
    {#if external}
    <div class="val" data-testid="translate-server-models">
      {#if board.engine.phase === 'external-ready' && board.engine.serverModels.length > 0}
        <span class="small">The server runs its own model:</span>
        <div class="models">
          {#each board.engine.serverModels as model (model.name)}
            <i class="rd on"></i>
            <span class="served">{model.name}</span>
            <span class="mono muted">{serverModelFacts(model)}</span>
            <span></span>
          {/each}
        </div>
      {:else if board.engine.serverProblem}
        <span class="problem">{board.engine.serverProblem}</span>
      {:else if board.engine.phase === 'external-unreachable'}
        <span class="small">The server at {board.engine.externalHost} does not answer.</span>
      {:else}
        <span class="small">Test the server to see the model it runs.</span>
      {/if}
    </div>
    {:else}
    <div class="val">
      <div class="models">
        {#each MODELS as model (model.id)}
          {@const state = board.models.find((m) => m.id === model.id)}
          {@const fit = modelFit(model, board.machine.ramGB, board.machine.vramGB)}
          <i class="rd" class:on={model.id === chosen}></i>
          <button type="button" class="name" onclick={() => onpick(model.id)}>{model.params} {model.quant}</button>
          <span class="mono muted">{formatBytes(model.bytes)}{#if fit !== 'fits'} · <span class:warn={fit === 'too-big'}>{FIT_WORD[fit]}</span>{/if}</span>
          {#if state?.installed}
            <span class="acts">
              {#if model.id === inUse}<span class="tag" data-testid="translate-in-use">in use</span>{/if}
              {#if state.update}
                <button type="button" class="btn lit" data-testid="translate-update" disabled={board.fetch !== null && board.fetchingModel !== null && board.fetchingModel !== model.id} onclick={() => onupdate(model.id)}>Update</button>
                <span class="small">newer, {state.update.date?.slice(0, 10) ?? 'out now'}</span>
              {/if}
              <!-- Gigabytes, and the model in use stops the engine: a second press removes it. -->
              <button type="button" class="btn" class:warn={deleting === model.id} data-testid="translate-delete" onclick={() => remove(model.id)} onblur={() => { if (deleting === model.id) deleting = null }}>{deleting === model.id ? (model.id === inUse ? 'Delete, stopping the engine?' : `Delete ${formatBytes(model.bytes)}?`) : 'Delete'}</button>
            </span>
          {:else}
            <span class="small">{state && state.partialBytes > 0 ? `${formatBytes(state.partialBytes)} fetched` : model.id === chosen ? 'not fetched' : ''}</span>
          {/if}
        {/each}
      </div>
      <!-- One download at a time: another model's left is finished or cancelled before any other is
           set up or updated (review 2026-11-07), and said here, with the way to it. -->
      {#if leftFetch !== null}
        <span class="small pending" data-testid="translate-fetch-left">{modelName(leftFetch.model)}'s download is {leftFetch.word}: setting up or updating another model waits until it is finished or cancelled.</span>
        <button type="button" class="btn" data-testid="translate-fetch-left-open" onclick={() => onsetup(4)}>See the download ›</button>
      {/if}
      <!-- The choice waits for DONE (user's request 2026-11-06): said, so it is not taken for made. -->
      {#if chosen !== inUse}
        <span class="small pending" data-testid="translate-model-pending">{modelName(chosen)} is chosen: {selectedInPlace ? 'Done switches to it' : 'Set up this model › fetches it'}; leaving otherwise keeps {modelName(inUse)}.</span>
      {/if}
      <button type="button" class="btn" onclick={() => onsetup('another')}>Set up a model…</button>
    </div>
    {/if}

    <span class="lbl">Run</span>
    <!-- The server's own options decide how it runs: these settings never reach it. -->
    {#if external}
    <div class="val" data-testid="translate-server-run">
      <span class="small">Set by the server’s own options{board.engine.phase === 'external-ready' ? ` · context ${board.engine.ctx}` : ''}.</span>
    </div>
    {:else}
    <div class="val runs">
      <label>Context
        <select value={settings.ctx} onchange={(e) => patch({ ctx: Number(e.currentTarget.value) })}>
          {#each CTX_SIZES as size (size)}<option value={size}>{size}</option>{/each}
        </select>
      </label>
      <label>Device
        <select value={settings.device} onchange={(e) => patch({ device: e.currentTarget.value === 'cpu' ? 'cpu' : 'auto' })}>
          <option value="auto">auto (GPU, CPU if it fails)</option><option value="cpu">CPU only</option>
        </select>
      </label>
      <label>Stop when idle
        <select value={settings.idleMinutes} onchange={(e) => patch({ idleMinutes: Number(e.currentTarget.value) })}>
          {#each IDLE_MINUTES as minutes (minutes)}<option value={minutes}>{minutes === 0 ? 'never' : `${minutes} min`}</option>{/each}
        </select>
      </label>
      <span class="small note" data-testid="translate-run-note">Context and Device restart the engine and stop any translation under way; Stop when idle applies at once.</span>
    </div>
    {/if}

    <span class="lbl">Log</span>
    <div class="val">
      <pre class="log" data-testid="translate-log">{logs.join('\n')}</pre>
      {#if logs.length > 0}<button type="button" class="btn" onclick={copyLog}>Copy log</button>{/if}
    </div>

    <span class="lbl">Licence</span>
    <div class="val">
      <span>Model: PLaMo Community License · Built with PLaMo · <button data-press="off" type="button" class="link" onclick={() => void api.openLicence('plamo')}>read it ↗</button></span>
      <!-- §3: the agreement recorded for each model in place (its log is translate/licence-consents.txt). -->
      {#if !external}
        {#each board.models.filter((m) => m.installed && m.consentAt) as model (model.id)}
          <span class="small" data-testid="translate-consent">{modelName(model.id)}: agreed {model.consentAt?.slice(0, 10)}</span>
        {/each}
      {/if}
      {#if external}
        <span class="small">Engine: the server’s own build; its licences are its own.</span>
      {:else}
        <span>Engine: llama.cpp, MIT · <button data-press="off" type="button" class="link" onclick={() => void api.openLicence('llama')}>read it ↗</button> · its licences and those of the code built into it are kept beside it</span>
      {/if}
    </div>
  </div>
</div>

<style>
.engine { display: flex; flex-direction: column; gap: var(--space-2); height: 100%; min-height: 0; }
.bar { display: flex; align-items: center; gap: var(--space-2); padding-right: 1.7rem; }
.spacer { flex: 1; }
.grid { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: 5.6rem minmax(0, 1fr); gap: var(--space-3) var(--space-4); align-content: start; padding: var(--space-1) var(--space-2); scrollbar-width: thin; scrollbar-color: var(--accent-dim) transparent; }
.lbl { font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); padding-top: var(--space-1); border-top: 1px solid var(--panel-rule); }
.bar .lbl { border: 0; padding: 0; }
.val { border-top: 1px solid var(--panel-rule); padding-top: var(--space-1); display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; font-size: var(--step--1); }
.opt { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.1rem var(--space-2); text-align: left; background: transparent; border: 0; padding: 0; color: var(--text); font: inherit; cursor: pointer; }
.opt > :not(.rd) { grid-column: 2; }
.opt b { font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; }
div.opt { cursor: default; }
/* The row's own selector: the diamond and the name, a button where choosing it switches at once. */
.pick { grid-column: 1 / -1 !important; display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 0; padding: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; }
span.pick { cursor: default; }
.pick .rd { margin-top: 0; }
.opt.on .pick .rd { background: var(--accent); border-color: var(--accent); }
.tag { font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--accent-strong); border: 1px solid var(--accent); padding: 0 0.3rem; }
.warn { color: var(--warn); }
.btn.warn { color: var(--warn); border-color: var(--warn); }
.pending { color: var(--accent-strong); }
.note { flex-basis: 100%; }
.rd { width: 0.55rem; height: 0.55rem; margin-top: 0.3rem; border: 1px solid var(--panel-border); transform: rotate(45deg); }
.rd.on, .opt.on .rd { background: var(--accent); border-color: var(--accent); }
.mono { font-family: var(--font-mono); font-size: var(--step--1); }
.muted, .small { color: var(--text-muted); font-size: var(--step--2); }
.row { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }
.field { flex: 0 1 16rem; min-width: 0; padding: 0.1rem var(--space-2); border: 1px solid var(--panel-border); background: var(--app-bg); color: var(--text); font-family: var(--font-mono); font-size: var(--step--1); outline: none; }
.btn { align-self: flex-start; background: transparent; border: 1px solid var(--panel-border); padding: 0.05rem var(--space-2); color: var(--text-muted); font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; cursor: pointer; }
.btn:not(:disabled):hover { color: var(--accent); border-color: var(--accent); }
.btn:disabled { opacity: 0.45; cursor: default; }
.btn.lit { border-color: var(--accent); color: var(--accent-strong); background: var(--accent-faint); }
.lamp { display: inline-block; width: 0.5rem; height: 0.5rem; margin-right: var(--space-2); transform: rotate(45deg); border: 1px solid var(--text-muted); }
.lamp.ok { background: var(--ok); border-color: var(--ok); }
.lamp.warn { border-color: var(--warn); }
.lamp.bad { background: var(--danger); border-color: var(--danger); }
.lamp.busy { background: var(--accent); border-color: var(--accent); }
.models { display: grid; grid-template-columns: auto auto auto minmax(0, 1fr); gap: 0.15rem var(--space-3); align-items: center; }
/* In a row of the list: the diamond on the text's middle, not where an option's first line sits;
   DELETE as wide as its word. */
.models .rd { margin-top: 0; justify-self: center; }
.models .btn { justify-self: start; align-self: center; }
.models .small { margin: 0; }
.models .acts { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.served { font-family: var(--font-mono); font-size: var(--step--1); overflow-wrap: anywhere; }
.name { background: transparent; border: 0; padding: 0; color: var(--text); font-family: var(--font-mono); font-size: var(--step--1); text-align: left; cursor: pointer; }
.runs { flex-direction: row; flex-wrap: wrap; gap: var(--space-2) var(--space-4); }
.runs label { display: flex; flex-direction: column; gap: 0.1rem; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
select { background: var(--app-bg); color: var(--text); border: 1px solid var(--panel-border); font-family: var(--font-mono); font-size: var(--step--2); }
.log { margin: 0; padding: var(--space-1) var(--space-2); border-left: 1px solid var(--panel-rule); font-family: var(--font-mono); font-size: var(--step--2); line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--text-muted); max-height: 9rem; overflow-y: auto; user-select: text; }
.link { background: transparent; border: 0; padding: 0; color: var(--accent-strong); text-decoration: underline; font: inherit; cursor: pointer; }
.problem { margin: 0; color: var(--danger); font-size: var(--step--1); }
</style>
