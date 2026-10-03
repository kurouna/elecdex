<script lang="ts">
import { MODEL_IDS, MODELS, type ModelId } from '@shared/elec16/map'
import {
  ELEC16_AUTO_OFF,
  ELEC16_CLOCKS,
  type Elec16AutoOff,
  type Elec16Clock,
  type Elec16Unit,
  type Elec16UnitChange,
} from '@shared/elec16-units'
import { sfx } from '../../stores/sound.svelte.ts'
import { BODY_MODES, type BodyMode, type Elec16Pane } from './pane-state.ts'
import { SKIN_IDS, SKINS, type SkinId } from './skins.ts'

/**
 * TUNE (docs/elec16.md section 7): PASTE, which unit the pane runs (or a new one), the unit's
 * clock, auto power-off and its LCD (fitting another one restarts the machine, its RAM kept
 * and the screen empty) - the unit's own, kept by main - then this pane's: how the body is
 * drawn, the skin, the LCD's slow fade and its contrast.
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
const modelWords = (id: ModelId): string => {
  const m = MODELS[id]
  return `${m.width}×${m.height}${m.depth === 2 ? ' ·4' : ''}`
}
const offWords = (m: Elec16AutoOff): string => (m === 0 ? 'never' : `${m} min`)
const BODY_WORDS: Record<BodyMode, string> = {
  auto: 'auto',
  full: 'full',
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

<div class="tune" data-testid="elec16-tune">
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
      PASTE types the clipboard's text on the machine's keys, kana in KANA mode{#if pasteSkipped > 0}<span
          data-testid="elec16-paste-skipped"
        >; {pasteSkipped} {pasteSkipped === 1 ? 'character' : 'characters'} it has no key for left out</span
        >{/if}.
    </p>
  </section>
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
  <section>
    <h3>lcd</h3>
    <div class="chips" role="radiogroup" aria-label="LCD">
      {#each MODEL_IDS as id (id)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          disabled={unit === null}
          aria-checked={unit?.model === id}
          onclick={() => pick(unit?.model, id, () => onunit({ model: id }))}
          data-testid="elec16-model"
          data-model={id}>{modelWords(id)}</button
        >
      {/each}
    </div>
    <p class="note">Another LCD restarts the machine: its RAM stays, its screen is cleared.</p>
  </section>
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
