<script lang="ts">
import {
  MODELS,
  type ModelId,
  modelName,
  UNIT_MODEL_IDS,
  type UnitModelId,
  XRAM_SIZES_KB,
} from '@shared/elec16/map'
import {
  ELEC16_AUTO_OFF,
  ELEC16_CLOCKS,
  type Elec16AutoOff,
  type Elec16Clock,
  type Elec16Unit,
  type Elec16UnitChange,
} from '@shared/elec16-units'
import { sfx } from '../../stores/sound.svelte.ts'
import { BODY_MODES, type Elec16Pane, SCI_BODY_MODES, type SciBodyMode } from './pane-state.ts'
import { PLAY_BODY_MODES, PLAY_SKINS } from './play-body.ts'
import { SCI_SKINS } from './sci-body.ts'
import { SKIN_IDS, SKINS, type SkinId } from './skins.ts'

/**
 * TUNE (docs/elec16.md section 7): PASTE, which unit the pane runs (or a new one), the unit's
 * clock, auto power-off (or on PLAY-320 its extended RAM) and its model (fitting another
 * restarts the machine, its RAM kept on the same ROM and the screen empty) - the unit's own,
 * kept by main - then this pane's: how the body is drawn, the skin, the LCD's slow fade and
 * its contrast.
 */
interface Props {
  pane: Elec16Pane
  unit: Elec16Unit | null
  units: readonly Elec16Unit[]
  onchange: (change: Partial<Elec16Pane>) => void
  /** The unit's clock or LCD (another LCD restarts the machine). */
  onunit: (change: Elec16UnitChange) => void
  /** Another unit in this pane. */
  onswitch: (id: string) => void
  /** A new unit for this pane. */
  onnew: () => void
  /** Another unit thrown away, with its RAM and card. */
  onremove: (id: string) => void
  /** Keys PASTE has still to press (0: none under way). */
  pasting: number
  /** Characters the last PASTE had no key for. */
  pasteSkipped: number
  /** Whether there is a machine on to type into. */
  canPaste: boolean
  /** PASTE, or its stop while it types. */
  onpaste: () => void
}

const {
  pane,
  unit,
  units,
  onchange,
  onunit,
  onswitch,
  onnew,
  onremove,
  pasting,
  pasteSkipped,
  canPaste,
  onpaste,
}: Props = $props()

const clockWords = (c: Elec16Clock): string => (c === 'max' ? 'MAX' : `${c} MHz`)
/** How the unit's machine is typed to: the pocket keyboard, PLAY-320's pad, SCI-128's keys. */
const input = $derived(unit === null ? 'keyboard' : MODELS[unit.model].input)
/** PLAY-320 (docs/elec16-play.md): extended RAM to choose, and no auto power-off. */
const play = $derived(input === 'pad')

/**
 * A model whose ROM is another clears the RAM (its BASIC, its game, its calculator's memory):
 * the first press arms it, a second within a few seconds makes it - as DELETE (docs/elec16-
 * sci.md section 8.1). Another LCD on the same ROM keeps the RAM and goes at once.
 */
let armedModel = $state<ModelId | null>(null)
let disarmModel: ReturnType<typeof setTimeout> | undefined
function pickModel(id: UnitModelId): void {
  if (unit === null || unit.model === id) return
  clearTimeout(disarmModel)
  if (MODELS[unit.model].rom !== MODELS[id].rom && armedModel !== id) {
    armedModel = id
    disarmModel = setTimeout(() => {
      armedModel = null
    }, 3000)
    return
  }
  armedModel = null
  pick(unit.model, id, () => onunit({ model: id }))
}
$effect(() => () => clearTimeout(disarmModel))
const offWords = (m: Elec16AutoOff): string => (m === 0 ? 'never' : `${m} min`)
const BODY_WORDS: Record<SciBodyMode, string> = {
  auto: 'auto',
  full: 'full',
  simple: 'simple',
  compact: 'compact',
  lcd: 'lcd',
}

/**
 * The unit DELETE is armed for: a second press within a few seconds throws it away (its RAM
 * and its card go with it, so one press never does).
 */
let armed = $state<string | null>(null)
let disarm: ReturnType<typeof setTimeout> | undefined

function remove(id: string): void {
  clearTimeout(disarm)
  if (armed !== id) {
    armed = id
    disarm = setTimeout(() => {
      armed = null
    }, 3000)
    return
  }
  armed = null
  onremove(id)
}

$effect(() => () => clearTimeout(disarm))

function pick<T>(now: T, next: T, apply: () => void): void {
  if (now === next) return
  sfx.play('panel')
  apply()
}
</script>

{#snippet lcdGlass()}
  <section>
    <h3>lcd glass</h3>
    <div class="chips">
      <button
        type="button"
        class="e16-chip"
        aria-pressed={pane.ghost}
        onclick={() => onchange({ ghost: !pane.ghost })}
        data-testid="elec16-ghost">slow fade</button
      >
      <button
        type="button"
        class="e16-chip"
        aria-label="less contrast"
        disabled={pane.contrast <= -7}
        onclick={() => onchange({ contrast: pane.contrast - 1 })}
        data-testid="elec16-contrast-down">−</button
      >
      <span class="e16-chip plain" data-testid="elec16-contrast">contrast {pane.contrast > 0 ? '+' : ''}{pane.contrast}</span>
      <button
        type="button"
        class="e16-chip"
        aria-label="more contrast"
        disabled={pane.contrast >= 7}
        onclick={() => onchange({ contrast: pane.contrast + 1 })}
        data-testid="elec16-contrast-up">+</button
      >
    </div>
  </section>
{/snippet}

<div class="tune" data-testid="elec16-tune">
  {#if input === 'keyboard'}
  <section>
    <h3>keys</h3>
    <div class="chips">
      <button
        type="button"
        class="e16-chip"
        disabled={!canPaste && pasting === 0}
        aria-pressed={pasting > 0}
        onclick={() => onpaste()}
        data-testid="elec16-paste">{pasting > 0 ? `stop paste · ${pasting}` : 'paste'}</button
      >
    </div>
    <p class="note">
      PASTE, or a right-click on the machine, types the clipboard's text on its keys, kana in KANA mode{#if pasteSkipped > 0}<span
          data-testid="elec16-paste-skipped"
        >; {pasteSkipped} {pasteSkipped === 1 ? 'character' : 'characters'} it has no key for left out</span
        >{/if}.
    </p>
  </section>
  {/if}
  <section>
    <h3>unit</h3>
    <div class="chips" role="radiogroup" aria-label="unit">
      {#each units as u (u.id)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          aria-checked={unit?.id === u.id}
          onclick={() => pick(unit?.id, u.id, () => onswitch(u.id))}
          data-testid="elec16-unit"
          data-unit={u.id}>{u.name}</button
        >
      {/each}
      <button type="button" class="e16-chip" onclick={() => onnew()} data-testid="elec16-unit-new">+ new</button>
    </div>
    {#if units.length > 1}
      <div class="chips">
        {#each units.filter((u) => u.id !== unit?.id) as u (u.id)}
          <button
            type="button"
            class="e16-chip"
            class:armed={armed === u.id}
            aria-label={`delete ${u.name}, its RAM and card`}
            onclick={() => remove(u.id)}
            data-testid="elec16-unit-delete"
            data-unit={u.id}>{armed === u.id ? `delete ${u.name}?` : `× ${u.name}`}</button
          >
        {/each}
      </div>
    {/if}
  </section>
  <section>
    <h3>clock</h3>
    <div class="chips" role="radiogroup" aria-label="clock">
      {#each ELEC16_CLOCKS as c (c)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          disabled={unit === null}
          aria-checked={unit?.clock === c}
          onclick={() => pick(unit?.clock, c, () => onunit({ clock: c }))}
          data-testid="elec16-clock"
          data-clock={c}>{clockWords(c)}</button
        >
      {/each}
    </div>
  </section>
  {#if play}
  <section>
    <h3>extended ram</h3>
    <div class="chips" role="radiogroup" aria-label="extended RAM">
      {#each XRAM_SIZES_KB as kb (kb)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          disabled={unit === null}
          aria-checked={unit?.xram === kb}
          onclick={() => pick(unit?.xram, kb, () => onunit({ xram: kb }))}
          data-testid="elec16-xram"
          data-kb={kb}>{kb === 0 ? 'none' : `${kb} KB`}</button
        >
      {/each}
    </div>
    <p class="note">Another size restarts the machine with its RAM cleared.</p>
  </section>
  {:else}
  <section>
    <h3>auto off</h3>
    <div class="chips" role="radiogroup" aria-label="auto power-off">
      {#each ELEC16_AUTO_OFF as m (m)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          disabled={unit === null}
          aria-checked={unit?.autoOff === m}
          onclick={() => pick(unit?.autoOff, m, () => onunit({ autoOff: m }))}
          data-testid="elec16-auto-off"
          data-minutes={m}>{offWords(m)}</button
        >
      {/each}
    </div>
  </section>
  {/if}
  <section>
    <h3>model</h3>
    <div class="chips" role="radiogroup" aria-label="model">
      {#each UNIT_MODEL_IDS as id (id)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          disabled={unit === null}
          aria-checked={unit?.model === id}
          class:armed={armedModel === id}
          onclick={() => pickModel(id)}
          data-testid="elec16-model"
          data-model={id}>{armedModel === id ? 'clear RAM?' : modelName(id)}</button
        >
      {/each}
    </div>
    <p class="note">
      Another LCD restarts the machine: its RAM stays, its screen is cleared. To or from PLAY-320,
      a game machine with no BASIC, or SCI-128, the calculator, its RAM is cleared too: press
      twice.
    </p>
  </section>
  <!-- The body, its colours and the LCD glass, each model its own. -->
  {#if input === 'keyboard'}
  <section>
    <h3>body</h3>
    <div class="chips" role="radiogroup" aria-label="body">
      {#each BODY_MODES as b (b)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          aria-checked={pane.body === b}
          onclick={() => pick(pane.body, b, () => onchange({ body: b }))}
          data-testid="elec16-body"
          data-body={b}>{BODY_WORDS[b]}</button
        >
      {/each}
    </div>
  </section>
  <section>
    <h3>skin</h3>
    <div class="chips" role="radiogroup" aria-label="skin">
      {#each SKIN_IDS as id (id)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          aria-checked={pane.skin === id}
          onclick={() => pick(pane.skin, id as SkinId, () => onchange({ skin: id }))}
          data-testid="elec16-skin"
          data-skin={id}>{SKINS[id].label}</button
        >
      {/each}
    </div>
  </section>
  {@render lcdGlass()}
  {:else if input === 'calc'}
  <section>
    <h3>body</h3>
    <div class="chips" role="radiogroup" aria-label="body">
      {#each SCI_BODY_MODES as b (b)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          aria-checked={pane.body === b}
          onclick={() => pick(pane.body, b, () => onchange({ body: b }))}
          data-testid="elec16-body"
          data-body={b}>{BODY_WORDS[b]}</button
        >
      {/each}
    </div>
  </section>
  <section>
    <h3>color</h3>
    <div class="chips" role="radiogroup" aria-label="color">
      {#each SCI_SKINS as c (c)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          disabled={pane.body === 'lcd'}
          aria-checked={pane.sciSkin === c}
          onclick={() => pick(pane.sciSkin, c, () => onchange({ sciSkin: c }))}
          data-testid="elec16-sci-skin"
          data-skin={c}>{c}</button
        >
      {/each}
    </div>
  </section>
  {@render lcdGlass()}
  <section>
    <h3>keys</h3>
    <p class="note" data-testid="elec16-sci-keys">
      Digits and + - * / ^ ( ) . as typed, Enter =, Backspace DEL, Delete AC, the arrows; s c t
      sin cos tan, l LN, g LOG, f a/b, e EXP, r √, ! x!; Pause ON - while the pane has the focus.
    </p>
  </section>
  {:else}
  <section>
    <h3>body</h3>
    <div class="chips" role="radiogroup" aria-label="body">
      {#each PLAY_BODY_MODES as b (b)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          aria-checked={pane.playBody === b}
          onclick={() => pick(pane.playBody, b, () => onchange({ playBody: b }))}
          data-testid="elec16-play-body-mode"
          data-body={b}>{b}</button
        >
      {/each}
    </div>
  </section>
  <section>
    <h3>color</h3>
    <div class="chips" role="radiogroup" aria-label="color">
      {#each PLAY_SKINS as c (c)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          disabled={pane.playBody === 'screen'}
          aria-checked={pane.playSkin === c}
          onclick={() => pick(pane.playSkin, c, () => onchange({ playSkin: c }))}
          data-testid="elec16-play-skin"
          data-skin={c}>{c}</button
        >
      {/each}
    </div>
  </section>
  <section>
    <h3>buttons</h3>
    <p class="note" data-testid="elec16-play-keys">
      Arrows the d-pad, Z A, X B, S X, A Y, Q L, W R, Enter START, right Shift SELECT, Pause
      BRK - while the pane has the focus. A gamepad with the standard layout presses them too.
    </p>
  </section>
  {/if}
</div>

<style>
.tune {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

h3 {
  margin: 0 0 2px;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.e16-chip.armed {
  color: var(--danger);
  border-color: var(--danger);
}

.note {
  margin: 2px 0 0;
  font-size: var(--step--1);
  color: var(--text-muted);
}
</style>
