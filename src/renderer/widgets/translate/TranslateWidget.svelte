<script lang="ts">
import type { TranslateBoard } from '@shared/translate/board'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import EngineView from './EngineView.svelte'
import SetupView from './SetupView.svelte'
import { firstSetupStep, phaseLamp, whereTextGoes } from './translate-view.ts'

/**
 * TRANSLATE: PLaMo 3 Translate on this PC through llama-server (docs/translate.md). Main starts
 * the engine and fetches; this pane follows main's board only while it is seen, and never talks to
 * the engine itself. The text view's translation comes in phase 2: for now it says where the
 * engine stands.
 */
const { paneId, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))

let board = $state.raw<TranslateBoard | null>(null)
let view = $state<'text' | 'setup' | 'engine'>('text')
let step = $state(1)

$effect(() => (visible ? window.elecdex.translate.subscribe((next) => (board = next)) : undefined))

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

function openSetup(): void {
  if (board) step = firstSetupStep(board)
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
        {#if view === 'setup'}
          <SetupView
            {board}
            {step}
            onstep={(next) => (step = next)}
            onselect={(modelId) => void appearance.patch({ translate: { modelId } })}
            ondone={() => (view = 'text')}
          />
        {:else if view === 'engine'}
          <EngineView {board} {settings} onsetup={openSetup} ondone={() => (view = 'text')} />
        {:else}
          <div class="standby" data-testid="translate-standby">
            <span class="state"><i class="lamp {lamp?.kind}"></i>{lamp?.word}</span>
            <span class="big">PLaMo 3 Translate</span>
            {#if board.engine.phase === 'absent'}
              <span class="host">Runs on this PC through llama.cpp. Setting up fetches the engine and a model once; after that nothing you translate leaves this machine.</span>
              <button type="button" class="command" data-testid="translate-setup-open" onclick={openSetup}>&gt; set up translation</button>
            {:else}
              <span class="host">{board.selectedModel} · {board.engine.build ?? ''}{board.engine.backend ? ` · ${board.engine.backend}` : ''}</span>
              {#if board.engine.phase === 'fault'}<span class="problem">{board.engine.error}</span>{/if}
            {/if}
          </div>
        {/if}
      </div>
    {/key}
    <footer class="foot">
      <span class="lampw {lamp?.kind}"><i></i><b>{lamp?.word}</b></span>
      <span class="fig">{board.engine.build ?? ''}{board.engine.port ? ` · 127.0.0.1:${board.engine.port}` : ''} · ctx {board.engine.ctx}</span>
      <span class="spacer"></span>
      <span class="credit">PLaMo 3 Translate · PLaMo Community License</span>
      <span class:warn={where?.warn} data-testid="translate-where">· {where?.text}</span>
    </footer>
  {/if}
</div>

<style>
.translate { position: relative; display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 0 var(--space-1); font-family: var(--font-ui); color: var(--text); }
.view { flex: 1; min-height: 0; display: flex; flex-direction: column; padding-top: var(--space-1); }
.standby { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-1); height: 100%; text-align: center; padding: var(--space-4); }
.state { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--step--2); letter-spacing: var(--tracking-wider); text-transform: uppercase; color: var(--text-muted); }
.lamp { width: 0.5rem; height: 0.5rem; border: 1px solid var(--text-muted); }
.lamp.ok { background: var(--ok); border-color: var(--ok); }
.lamp.warn { border-color: var(--warn); }
.lamp.bad { background: var(--danger); border-color: var(--danger); }
.lamp.busy { background: var(--accent); border-color: var(--accent); }
.big { font-family: var(--font-display); font-size: var(--step-1); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--accent-strong); }
.host { max-width: 30rem; font-family: var(--font-mono); font-size: var(--step--1); color: var(--text-muted); overflow-wrap: anywhere; }
.command { margin-top: var(--space-2); padding: var(--space-1) var(--space-3); border: 1px solid var(--accent); background: transparent; color: var(--accent-strong); font-family: var(--font-mono); font-size: var(--step--1); cursor: pointer; }
.command:hover, .command:focus-visible { background: var(--accent-faint); outline: none; }
.problem { color: var(--danger); font-size: var(--step--1); }
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
.warn { color: var(--warn); }
</style>
