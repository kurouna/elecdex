<script lang="ts">
import type { EngineSourceKind, TranslateBoard } from '@shared/translate/board'
import { ENGINE_BUILD } from '@shared/translate/engines'
import { MODELS, type ModelEntry, QUANTS, recommendedModel } from '@shared/translate/models'
import { afterBlink } from '../../lib/blink.ts'
import {
  etaText,
  FIT_WORD,
  fetchPercent,
  fitCells,
  formatBytes,
  modelFit,
  modelName,
  shownModel,
  TIER_NAME,
  TIER_NOTE,
  tiers,
} from './translate-view.ts'

/**
 * SETUP (docs/translate.md §3): ENGINE, MODEL, LICENCE, FETCH, READY. The engine's source and the
 * consent go to main at once, so a pane closed half way finds them where they were left. The model
 * chosen is fetched beside the one in use, which goes on translating (user's choice 2026-11-07),
 * and becomes the settings' only at READY, once it is in place. The fetch goes on with the pane
 * closed.
 */
interface Props {
  board: TranslateBoard
  step: number
  onstep: (step: number) => void
  /** The model chosen in SETUP: written to the settings only at READY, once it is in place. */
  chosen: string
  onselect: (modelId: string) => void
  oncommit: () => Promise<void>
  ondone: () => void
}

const { board, step, chosen, onstep, onselect, oncommit, ondone }: Props = $props()
const api = window.elecdex.translate

const STEPS = ['Engine', 'Model', 'Licence', 'Fetch', 'Ready']
const selected = $derived(MODELS.find((m) => m.id === chosen))
const consented = $derived(board.models.find((m) => m.id === chosen)?.consentAt != null)
/** A model in place and in use beside the one fetched: it translates until READY. */
const inUseNow = $derived(
  board.selectedModel !== chosen &&
    board.models.some((m) => m.id === board.selectedModel && m.installed),
)
const recommended = $derived(recommendedModel(MODELS, board.machine.ramGB, board.machine.vramGB))
let agreed = $state(false)
/** The fetch agreed to as well (user's request 2026-11-06): what AGREE AND FETCH downloads. */
let fetchAgreed = $state(false)
/**
 * The commit agreed to in this setup, as main answered it: FETCH goes on to READY only once that
 * commit is in place, never on the file before it (an update replaces one in place).
 */
let agreedRevision = $state<string | null>(null)
/**
 * The licence's page opened from here for the agreement to come: the summary is a guide, the page
 * is the text that holds and may change, so it is opened before the licence can be agreed to (user's
 * request 2026-11-06). A model agreed to before needs no new opening; each new agreement does.
 */
let clicked = $state(false)
const opened = $derived(consented || clicked)
let address = $state('')
let problem = $state<string | null>(null)
let selfTest = $state<{ text: string; tokensPerSecond: number } | { problem: string } | null>(null)

$effect(() => {
  // The licence step opens agreed when this model was agreed to before.
  if (step !== 3) return
  agreed = consented
  fetchAgreed = consented
})

/** The chosen model in place at the commit agreed to: until an update is placed, the file before it is. */
const placed = $derived.by(() => {
  const model = board.models.find((m) => m.id === chosen)
  return model?.installed === true && (agreedRevision === null || model.revision === agreedRevision)
})

/**
 * FETCH saw its fetch on the board. Until then a fetch just asked for may not be there yet; once
 * it was, a board with none and the model not in place means it ended without it (cancelled in
 * another pane, or dropped).
 */
let fetchSeen = $state(false)
$effect(() => {
  if (step === 4 && board.fetchingModel === chosen) fetchSeen = true
})
const fetchGone = $derived(
  step === 4 && fetchSeen && board.fetchingModel !== chosen && board.fetch === null && !placed,
)

$effect(() => {
  // A fetch that has finished moves on to READY by itself.
  if (step === 4 && board.fetch === null && placed) onstep(5)
})

/** READY's self test, asked once: of the chosen model, made the settings' first. */
let testing = false
$effect(() => {
  if (step !== 5 || testing) return
  testing = true
  void readyTest()
})

async function readyTest(): Promise<void> {
  // Only a model in place becomes the settings' (review 2026-11-07): one not fetched would leave
  // every pane without the model that was translating. Awaited: main has the new settings, and the
  // engine their model, before the test is sent - the engine before it would answer for the model
  // it ran (2026-11-07). An external server runs its own model: nothing is chosen for it.
  if (board.engine.source !== 'external' && board.models.find((m) => m.id === chosen)?.installed)
    await oncommit()
  selfTest = await api.selfTest()
}

async function setSource(kind: EngineSourceKind): Promise<void> {
  problem = null
  if (kind === 'own' && !board.engine.own) {
    const picked = await api.pickOwn()
    if (picked && 'problem' in picked) problem = picked.problem
    return
  }
  const answer = await api.setSource(kind)
  if (answer) problem = answer.problem
}

async function openLicence(): Promise<void> {
  await api.openLicence('plamo')
  clicked = true
}

async function test(): Promise<void> {
  problem = null
  // Nothing typed: the saved server again, as ENGINE does.
  const answer = await api.testExternal(address || board.engine.externalOrigin || '')
  if (!answer.ok) problem = answer.problem
}

function quantOf(model: ModelEntry | undefined, quant: string): ModelEntry | undefined {
  return model ? MODELS.find((m) => m.params === model.params && m.quant === quant) : undefined
}

async function next(): Promise<void> {
  problem = null
  if (step === 3) {
    if (!selected) return
    const agreed = await api.consent(selected.id)
    if (!agreed || 'problem' in agreed) {
      problem = agreed?.problem ?? 'No such model.'
      return
    }
    agreedRevision = agreed.revision
    // Spent: another model agreed to later in this setup asks for the page again.
    clicked = false
    // Fetched beside the model in use, which goes on translating: READY makes it the settings'.
    const answer = await api.fetch(selected.id)
    if (answer) {
      problem = answer.problem
      return
    }
    onstep(4)
    return
  }
  if (step === 5) {
    ondone()
    return
  }
  // A tested external server runs its own model: nothing to choose, agree to or fetch here.
  if (step === 1 && board.engine.source === 'external') {
    onstep(5)
    return
  }
  onstep(step + 1)
}

const nextLabel = $derived(
  ['Next', 'Next', 'Agree and fetch', 'Next', 'Start translating'][step - 1],
)
const nextDisabled = $derived(
  (step === 1 &&
    board.engine.source === 'external' &&
    board.engine.phase === 'external-untested') ||
    (step === 2 && !selected) ||
    (step === 3 && !(agreed && fetchAgreed)) ||
    // FETCH goes on by itself once the model is in place; never to READY without it.
    (step === 4 && !placed),
)
</script>

<div class="setup" data-testid="translate-setup">
  <ol class="steps">
    {#each STEPS as name, i (name)}
      <li class:done={i + 1 < step} class:now={i + 1 === step}><b>0{i + 1}</b>{name}</li>
    {/each}
  </ol>

  {#key step}
    <div class="body crt-on">
      {#if step === 1}
        <div class="head"><h2>Engine</h2><p>llama.cpp’s llama-server runs the model on this PC.</p></div>
        <div class="options">
          <button type="button" class="opt" class:on={board.engine.source === 'fetched'} onclick={() => void setSource('fetched')}>
            <i class="rd"></i><b>Fetched by elecdex</b>
            <span class="mono">llama.cpp {ENGINE_BUILD} · MIT · {board.engine.fetched ? 'in place' : 'fetched from github.com with the model, by Agree and fetch'}</span>
            <span class="small">The build elecdex is tested with: checked against its sha256, kept with elecdex’s data, its licences beside it.</span>
          </button>
          <button type="button" class="opt" class:on={board.engine.source === 'own'} onclick={() => void setSource('own')}>
            <i class="rd"></i><b>My own llama-server</b>
            <span class="mono">{board.engine.own ? `${board.engine.own.name} · b${board.engine.own.build}` : 'choose the file…'}</span>
            <span class="small">b7563 or later (PLaMo 3 support).</span>
          </button>
          <div class="opt" class:on={board.engine.source === 'external'}>
            <i class="rd"></i><b>A server already running</b>
            <span class="row">
              <input class="field" bind:value={address} placeholder={board.engine.externalOrigin ?? 'http://192.168.1.20:8080'} aria-label="Server address" data-testid="translate-external" />
              <button type="button" class="btn" onclick={() => void test()}>Test</button>
            </span>
            <span class="small">elecdex starts nothing, and what you translate is sent to this address.</span>
          </div>
        </div>
      {:else if step === 2}
        <div class="head"><h2>Model</h2><p>PLaMo 3 Translate by Preferred Networks · 53 languages.</p></div>
        <div class="pc">This PC<b>RAM {board.machine.ramGB} GB</b>{#if board.machine.gpu}<b>{board.machine.gpu}</b>{/if}{#if board.machine.freeBytes !== null}<b>free {formatBytes(board.machine.freeBytes)}</b>{/if}</div>
        <div class="models" role="radiogroup" aria-label="Model">
          {#each tiers(MODELS) as group (group.tier)}
            {@const base = group.entries.find((m) => m.quant === 'Q4_K_M') ?? group.entries[0]}
            {@const fit = base ? modelFit(base, board.machine.ramGB, board.machine.vramGB) : 'fits'}
            {@const chosen = selected?.tier === group.tier}
            {#if base}
              <button
                type="button"
                class="mcard"
                role="radio"
                aria-checked={chosen}
                data-testid={`translate-model-${group.tier}`}
                onclick={(e) => afterBlink(e.currentTarget, () => onselect((chosen && selected ? selected : base).id))}
              >
                <span class="top">{TIER_NAME[group.tier]}{#if recommended?.tier === group.tier}<span class="rec">for this PC</span>{/if}</span>
                <span class="size">{group.params}<small>{formatBytes((chosen && selected ? selected : base).bytes)}</small></span>
                <span class="spec">RAM {base.ramGB} GB+{base.vramGB ? ` · VRAM ${base.vramGB} GB+` : ''}</span>
                <span class="desc">{TIER_NOTE[group.tier]}</span>
                <span class="fit {fit}"><span class="cells">{#each Array(10) as _, j (j)}<i class:on={j < fitCells(base, board.machine.ramGB)}></i>{/each}</span><b>{FIT_WORD[fit]}</b></span>
              </button>
            {/if}
          {/each}
        </div>
        <div class="quant">
          <span class="lbl">Quantisation</span>
          {#each QUANTS as quant (quant)}
            {@const entry = quantOf(selected, quant)}
            <button type="button" class="chip" aria-pressed={selected?.quant === quant} disabled={!entry} onclick={() => entry && onselect(entry.id)}>
              {quant}<small>{entry ? formatBytes(entry.bytes) : 'none'}</small>
            </button>
          {/each}
          <span class="small">How finely the model’s weights are stored: fewer bits make the file smaller and the engine faster, at some cost in quality. Q4_K_M is the model card’s default; Q2_K loses noticeably.</span>
        </div>
      {:else if step === 3}
        <div class="head"><h2>Licence</h2><p>{selected?.repo} · {selected?.quant} · {selected ? formatBytes(selected.bytes) : ''}</p></div>
        <div class="lic">
          <h3>PLaMo Community License</h3>
          <p>Preferred Networks publishes PLaMo 3 Translate under its PLaMo Community License. Downloading and using the model is under its terms.</p>
          <dl>
            <dt>Personal</dt><dd>Free, including non-commercial and academic use. No registration.</dd>
            <dt>Commercial</dt><dd>Free when revenue is ¥1 billion a year or less, after <button data-press="off" type="button" class="link" onclick={() => void api.openLicence('register')}>registering the use ↗</button> with Preferred Networks. Use at work, in an organisation, or in making a product or service is commercial.</dd>
            <dt>Larger</dt><dd>Over ¥1 billion: a separate licence agreement.</dd>
          </dl>
          <p class="note">This is a summary. The licence on Preferred Networks’ site is the one that holds, and it may change: open it and read it before you agree.</p>
          <button data-press="off" type="button" class="link" data-testid="translate-licence-open" onclick={() => void openLicence()}>Read the licence on Preferred Networks’ site ↗</button>
        </div>
        <button type="button" class="agree" class:on={agreed} role="checkbox" aria-checked={agreed} disabled={!opened} data-testid="translate-agree" onclick={() => (agreed = !agreed)}>
          <span class="box"></span><span>I have read the PLaMo Community License on Preferred Networks’ site and will use the model under its terms.{#if !opened}<em>{' Open the licence above first.'}</em>{/if}</span>
        </button>
        <div class="lic gets">
          <h3>Agree and fetch downloads</h3>
          <dl>
            <dt>Model</dt><dd><span class="mono">{selected?.file} · about {selected ? formatBytes(selected.bytes) : ''} · huggingface.co</span> · its newest version, asked of Hugging Face as you agree</dd>
            {#if board.engine.toFetchBytes > 0}
              <dt>Engine</dt><dd><span class="mono">llama.cpp {ENGINE_BUILD} · {formatBytes(board.engine.toFetchBytes)} · github.com</span> · MIT (<button data-press="off" type="button" class="link" onclick={() => void api.openLicence('llama')}>licence ↗</button>)</dd>
            {/if}
          </dl>
          <p class="small">Each file is checked against its sha256. The licences of llama.cpp and of the code built into it are written beside the engine. This agreement is recorded with its time in licence-consents.txt, in elecdex’s translate folder.</p>
        </div>
        <button type="button" class="agree" class:on={fetchAgreed} role="checkbox" aria-checked={fetchAgreed} data-testid="translate-agree-fetch" onclick={() => (fetchAgreed = !fetchAgreed)}>
          <span class="box"></span><span>I agree that elecdex downloads these files to this PC.</span>
        </button>
      {:else if step === 4}
        {@const fetch = board.fetch}
        <div class="head"><h2>Fetch</h2><p>{fetch?.kind === 'engine' ? 'llama.cpp from github.com' : 'the model from huggingface.co'}</p></div>
        {#if fetchGone}
          <p class="problem" data-testid="translate-fetch-gone">The download ended without {modelName(chosen)} in place: it was cancelled or stopped.</p>
          <div class="row"><button type="button" class="btn lit" onclick={() => onstep(2)}>Back to models</button></div>
        {/if}
        {#if fetch}
          <div class="fetch">
            <div class="pct" data-testid="translate-fetch-percent">{fetchPercent(fetch)}<small>%</small></div>
            <div>
              <div class="meter" class:paused={fetch.phase === 'paused'}>{#each Array(48) as _, j (j)}<i class:on={j < Math.floor((fetchPercent(fetch) / 100) * 48)}></i>{/each}</div>
              <div class="rate"><span>{formatBytes(fetch.received)} / {formatBytes(fetch.total)}</span><span>{fetch.phase}</span><span>{etaText(fetch)}</span></div>
            </div>
          </div>
          {#if fetch.error}<p class="problem">{fetch.error}</p>{/if}
          <div class="row">
            {#if fetch.phase === 'paused' || fetch.phase === 'failed'}
              <button type="button" class="btn lit" onclick={() => void api.fetch(board.fetchingModel ?? chosen)}>Resume</button>
            {:else}
              <button type="button" class="btn" onclick={() => void api.pause()}>Pause</button>
            {/if}
            <button type="button" class="btn" onclick={() => void api.cancelFetch().then(() => onstep(2))}>Cancel</button>
            <span class="small">Picks up where it stopped after a pause, a lost connection or a restart.</span>
          </div>
          {#if inUseNow}
            <p class="small" data-testid="translate-fetch-in-use">{modelName(board.selectedModel)} goes on translating meanwhile; {modelName(chosen)} takes over at Ready.</p>
          {/if}
        {/if}
      {:else}
        <div class="ready">
          <div class="plate">READY</div>
          <div class="selftest" data-testid="translate-selftest">
            <span class="k">Model</span><span>{shownModel(board, selected?.file ?? '')}</span>
            <span class="k">Engine</span><span>{board.engine.build ?? ''} · {board.engine.backend ?? '…'}{board.engine.device ? ` · ${board.engine.device}` : ''}</span>
            <span class="k">Self test</span>
            <span>
              {#if selfTest === null}starting the engine…{:else if 'problem' in selfTest}{selfTest.problem}{:else}Good morning. → {selfTest.text} · {selfTest.tokensPerSecond.toFixed(0)} t/s{/if}
            </span>
          </div>
        </div>
      {/if}
      {#if problem}<p class="problem" data-testid="translate-problem">{problem}</p>{/if}
    </div>
  {/key}

  <div class="foot">
    <button type="button" class="btn" disabled={step === 1 || step >= 4} onclick={() => onstep(step - 1)}>Back</button>
    <span class="spacer"></span>
    <button type="button" class="btn lit" disabled={nextDisabled} data-testid="translate-next" onclick={(e) => afterBlink(e.currentTarget, () => void next())}>{nextLabel}</button>
  </div>
</div>

<style>
/* A column of its own, the buttons right under the step: a wizard filling a whole screen would
   leave NEXT a long way off from what it follows (user's report 2026-11-06). */
.setup { display: flex; flex-direction: column; gap: var(--space-2); height: 100%; min-height: 0; width: 100%; max-width: 64rem; margin: 0 auto; }
.steps { list-style: none; margin: var(--space-1) 0 0; padding: 0 1.9rem 0 var(--space-2); display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--space-2); isolation: isolate; }
.steps li { position: relative; display: flex; justify-content: center; align-items: center; gap: var(--space-1); height: 1.5rem; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); white-space: nowrap; overflow: hidden; }
.steps li::before { content: ''; position: absolute; inset: 0; z-index: -1; border: 1px solid var(--panel-rule); transform: skewX(-35deg); }
.steps li.done { color: var(--text); }
.steps li.done::before { background: var(--accent-dim); border-color: var(--accent-dim); }
.steps li.now { color: var(--accent-strong); }
.steps li.now::before { border-color: var(--accent); background: var(--accent-faint); }
.body { flex: 0 1 auto; min-height: 0; overflow-y: auto; padding: var(--space-2); display: flex; flex-direction: column; gap: var(--space-3); scrollbar-width: thin; scrollbar-color: var(--accent-dim) transparent; }
.head { display: flex; align-items: baseline; gap: var(--space-3); flex-wrap: wrap; }
h2 { margin: 0; font-family: var(--font-display); font-weight: 500; font-size: var(--step-2); letter-spacing: 0.05em; text-transform: uppercase; color: var(--accent-strong); }
.head p, .small { margin: 0; font-size: var(--step--1); color: var(--text-muted); }
.options { display: flex; flex-direction: column; gap: var(--space-3); }
.opt { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.1rem var(--space-2); text-align: left; background: transparent; border: 0; padding: 0; color: var(--text); font: inherit; cursor: pointer; }
.opt > :not(.rd) { grid-column: 2; }
.opt b { font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; }
.rd { width: 0.6rem; height: 0.6rem; margin-top: 0.25rem; border: 1px solid var(--panel-border); transform: rotate(45deg); }
.opt.on .rd { background: var(--accent); border-color: var(--accent); }
.mono { font-family: var(--font-mono); font-size: var(--step--1); }
.row { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.field { flex: 0 1 18rem; min-width: 0; padding: 0.1rem var(--space-2); border: 1px solid var(--panel-border); background: var(--app-bg); color: var(--text); font-family: var(--font-mono); font-size: var(--step--1); outline: none; }
.field:focus { border-color: var(--accent); }
.btn, .chip { background: transparent; border: 1px solid var(--panel-border); padding: 0.05rem var(--space-2); color: var(--text-muted); font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; cursor: pointer; }
.btn:not(:disabled):hover, .chip:not(:disabled):hover { color: var(--accent); border-color: var(--accent); }
.btn:disabled, .chip:disabled { opacity: 0.45; cursor: default; }
.btn.lit:not(:disabled) { border-color: var(--accent); color: var(--accent-strong); background: var(--accent-faint); }
/* A choice that is read, not a label: the reading size (§7's type roles). */
.chip { font-family: var(--font-mono); font-size: var(--step--1); text-transform: none; letter-spacing: 0; }
.chip small { margin-left: var(--space-1); color: var(--text-muted); }
.chip[aria-pressed='true'] { color: var(--text); border-color: var(--accent-dim); background: var(--accent-faint); }
.pc { display: flex; gap: var(--space-4); flex-wrap: wrap; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
.pc b { font-family: var(--font-mono); font-weight: 500; color: var(--text); text-transform: none; letter-spacing: 0; margin-left: var(--space-1); }
.models { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: var(--space-2); }
.mcard { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-2) var(--space-3); text-align: left; background: transparent; border: 1px solid var(--panel-rule); color: var(--text); font: inherit; cursor: pointer; clip-path: polygon(0 0, calc(100% - 0.6rem) 0, 100% 0.6rem, 100% 100%, 0.6rem 100%, 0 calc(100% - 0.6rem)); }
.mcard:hover { border-color: var(--panel-border); }
.mcard[aria-checked='true'] { border-color: var(--accent); background: var(--accent-faint); }
.top { display: flex; gap: var(--space-1); align-items: center; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
.rec { color: var(--text-inverse); background: var(--accent); padding: 0 var(--space-1); font-weight: 600; }
.size { font-family: var(--font-display); font-size: var(--step-3); line-height: 1; color: var(--accent-strong); }
.size small { font-size: var(--step--1); color: var(--text-muted); margin-left: var(--space-1); font-family: var(--font-mono); }
.spec { font-family: var(--font-mono); font-size: var(--step--2); }
.desc { font-size: var(--step--1); line-height: 1.45; color: var(--text-muted); }
.fit { display: flex; align-items: center; gap: var(--space-1); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; }
.cells { display: inline-flex; gap: 2px; }
.cells i { width: 0.36rem; height: 0.55rem; background: var(--accent-faint); }
.fit.fits b { color: var(--ok); } .fit.fits .cells i.on { background: var(--ok); }
.fit.tight b { color: var(--warn); } .fit.tight .cells i.on { background: var(--warn); }
.fit.too-big b { color: var(--danger); } .fit.too-big .cells i.on { background: var(--danger); }
.quant { display: flex; align-items: center; gap: var(--space-1); flex-wrap: wrap; }
.lbl { font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
.lic { padding: var(--space-3); border: 1px solid var(--panel-rule); display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--step--1); line-height: 1.6; max-width: 48rem; }
.lic h3 { margin: 0; font-family: var(--font-display); font-weight: 500; font-size: var(--step-0); }
.lic p { margin: 0; }
.lic dl { margin: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.2rem var(--space-4); }
.lic dt { font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); text-transform: uppercase; }
.lic dd { margin: 0; }
.lic .note { color: var(--text-muted); }
.agree em { font-style: normal; color: var(--warn); }
.agree:disabled { cursor: default; color: var(--text-muted); }
.lic .link { display: inline; }
.link { align-self: flex-start; background: transparent; border: 0; padding: 0; color: var(--accent-strong); text-decoration: underline; font: inherit; cursor: pointer; }
.agree { display: flex; align-items: flex-start; gap: var(--space-2); padding: var(--space-2) var(--space-3); border: 1px dashed var(--panel-border); background: transparent; color: var(--text); font: inherit; font-size: var(--step--1); text-align: left; max-width: 48rem; cursor: pointer; }
.agree.on { border-style: solid; border-color: var(--accent); background: var(--accent-faint); }
.box { flex: none; width: 0.85rem; height: 0.85rem; margin-top: 0.2rem; border: 1px solid var(--panel-border); }
.agree.on .box { background: var(--accent); border-color: var(--accent); }
.fetch { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--space-3) var(--space-5); align-items: center; }
.pct { font-family: var(--font-display); font-size: var(--step-4); line-height: 1; color: var(--accent-strong); font-variant-numeric: tabular-nums; }
.pct small { font-size: var(--step-1); color: var(--text-muted); margin-left: var(--space-1); }
.meter { display: flex; gap: 2px; height: 0.9rem; }
.meter i { flex: 1; background: var(--accent-faint); }
.meter i.on { background: var(--accent); }
.meter.paused i.on { background: var(--warn); }
.rate { margin-top: var(--space-1); display: flex; gap: var(--space-4); flex-wrap: wrap; font-family: var(--font-mono); font-size: var(--step--1); color: var(--text-muted); }
.ready { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding-top: var(--space-4); }
.plate { padding: var(--space-1) var(--space-6); font-family: var(--font-display); font-size: var(--step-4); letter-spacing: 0.32em; color: var(--ok); border: 1px solid var(--ok); background: color-mix(in srgb, var(--ok) 10%, transparent); clip-path: polygon(0 0, calc(100% - 0.75rem) 0, 100% 0.75rem, 100% 100%, 0.75rem 100%, 0 calc(100% - 0.75rem)); }
.selftest { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--space-1) var(--space-3); font-family: var(--font-mono); font-size: var(--step--1); padding: var(--space-2) var(--space-3); border-left: 1px solid var(--panel-rule); }
.k { font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); text-transform: uppercase; }
.problem { margin: 0; color: var(--danger); font-size: var(--step--1); }
.foot { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-2) 0; border-top: 1px solid var(--panel-rule); }
.spacer { flex: 1; }
/* The press that blinks is the pane's (TranslateWidget.svelte), for every view. */
</style>
