<script lang="ts">
import type { Settings } from '@shared/settings'
import type { TranslateBoard } from '@shared/translate/board'
import { MODELS } from '@shared/translate/models'
import { CTX_SIZES, IDLE_MINUTES } from '@shared/translate/settings'
import { appearance } from '../../stores/appearance.svelte.ts'
import { formatBytes, phaseLamp } from './translate-view.ts'

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
  /** Opens SETUP, at a step when one is given. */
  onsetup: (step?: number) => void
  ondone: () => void
}

const { board, settings, chosen, onpick, onsetup, ondone }: Props = $props()
const api = window.elecdex.translate
/** Whether the chosen model is fetched: a model only listed has nothing to run. */
const selectedInPlace = $derived(
  board.engine.source === 'external' ||
    (board.models.find((m) => m.id === chosen)?.installed ?? false),
)
let logs = $state<string[]>([])
let address = $state('')
let problem = $state<string | null>(null)

$effect(() => {
  void board.engine.phase
  void api.logs().then((lines) => {
    logs = lines.slice(-12)
  })
})

const lamp = $derived(phaseLamp(board.engine.phase))
const external = $derived(board.engine.source === 'external')

function patch(change: Partial<Settings['translate']>): void {
  void appearance.patch({ translate: change })
}

async function setSource(kind: 'fetched' | 'own' | 'external'): Promise<void> {
  problem = null
  if (kind === 'own') {
    const picked = await api.pickOwn()
    if (picked && 'problem' in picked) problem = picked.problem
    return
  }
  if (kind === 'external') {
    const answer = await api.testExternal(address || `http://${board.engine.externalHost ?? ''}`)
    if (!answer.ok) problem = answer.problem
    return
  }
  const answer = await api.setSource(kind)
  if (answer) problem = answer.problem
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
      <button type="button" class="opt" class:on={board.engine.source === 'own'} onclick={() => void setSource('own')}>
        <i class="rd"></i><b>My own llama-server</b>
        <span class="mono">{board.engine.own ? `${board.engine.own.name} · b${board.engine.own.build}` : 'choose the file…'}</span>
      </button>
      <div class="opt" class:on={external}>
        <i class="rd"></i><b>A server already running</b>
        <span class="row">
          <input class="field" bind:value={address} placeholder={board.engine.externalHost ?? 'http://192.168.1.20:8080'} aria-label="Server address" />
          <button type="button" class="btn" onclick={() => void setSource('external')}>Test</button>
        </span>
      </div>
      {#if problem}<p class="problem">{problem}</p>{/if}
    </div>

    <span class="lbl">State</span>
    <div class="val">
      <span class="mono"><i class="lamp {lamp.kind}"></i>{lamp.word}{board.engine.backend ? ` · ${board.engine.backend}` : ''}{board.engine.device ? ` · ${board.engine.device}` : ''}{board.engine.port ? ` · 127.0.0.1:${board.engine.port}` : ''}</span>
      {#if board.engine.fallback}<span class="small">{board.engine.fallback}</span>{/if}
      {#if board.engine.error}<span class="problem">{board.engine.error}</span>{/if}
      {#if !external}
        <span class="row">
          <button type="button" class="btn" disabled={board.engine.phase !== 'ready'} onclick={() => void api.engineStop()}>Stop</button>
          <button type="button" class="btn" disabled={board.engine.phase === 'absent'} onclick={() => void api.engineRestart()}>Restart</button>
        </span>
      {/if}
    </div>

    <span class="lbl">Models</span>
    <div class="val">
      <div class="models">
        {#each MODELS as model (model.id)}
          {@const state = board.models.find((m) => m.id === model.id)}
          <i class="rd" class:on={model.id === chosen}></i>
          <button type="button" class="name" onclick={() => onpick(model.id)}>{model.params} {model.quant}</button>
          <span class="mono muted">{formatBytes(model.bytes)}</span>
          {#if state?.installed}
            <button type="button" class="btn" onclick={() => void api.removeModel(model.id)}>Delete</button>
          {:else}
            <span class="small">{state && state.partialBytes > 0 ? `${formatBytes(state.partialBytes)} fetched` : model.id === chosen ? 'not fetched' : ''}</span>
          {/if}
        {/each}
      </div>
      <button type="button" class="btn" onclick={() => onsetup()}>Set up a model…</button>
    </div>

    <span class="lbl">Run</span>
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
    </div>

    <span class="lbl">Log</span>
    <div class="val"><pre class="log">{logs.join('\n')}</pre></div>

    <span class="lbl">Licence</span>
    <div class="val">
      <span>Model: PLaMo Community License · Built with PLaMo · <button type="button" class="link" onclick={() => void api.openLicence('plamo')}>read it ↗</button></span>
      <span>Engine: llama.cpp, MIT · <button type="button" class="link" onclick={() => void api.openLicence('llama')}>read it ↗</button> · its licences and those of the code built into it are kept beside it</span>
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
.name { background: transparent; border: 0; padding: 0; color: var(--text); font-family: var(--font-mono); font-size: var(--step--1); text-align: left; cursor: pointer; }
.runs { flex-direction: row; flex-wrap: wrap; gap: var(--space-2) var(--space-4); }
.runs label { display: flex; flex-direction: column; gap: 0.1rem; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
select { background: var(--app-bg); color: var(--text); border: 1px solid var(--panel-border); font-family: var(--font-mono); font-size: var(--step--2); }
.log { margin: 0; padding: var(--space-1) var(--space-2); border-left: 1px solid var(--panel-rule); font-family: var(--font-mono); font-size: var(--step--2); line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--text-muted); max-height: 9rem; overflow-y: auto; user-select: text; }
.link { background: transparent; border: 0; padding: 0; color: var(--accent-strong); text-decoration: underline; font: inherit; cursor: pointer; }
.problem { margin: 0; color: var(--danger); font-size: var(--step--1); }
</style>
