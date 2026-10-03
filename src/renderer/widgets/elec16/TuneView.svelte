<script lang="ts">
import { MODEL_IDS, MODELS, type ModelId } from '@shared/elec16/map'
import { sfx } from '../../stores/sound.svelte.ts'
import { BODY_MODES, type BodyMode, CLOCKS, type Clock, type Elec16Pane } from './pane-state.ts'
import { SKIN_IDS, SKINS, type SkinId } from './skins.ts'

/**
 * TUNE (docs/elec16.md section 7): the unit's clock, its LCD (fitting another one restarts
 * the machine, its RAM kept and the screen empty), how the body is drawn, the skin, the
 * LCD's slow fade and its contrast.
 */
interface Props {
  pane: Elec16Pane
  onchange: (change: Partial<Elec16Pane>) => void
  /** Another LCD fitted: the machine restarts on it. */
  onmodel: (model: ModelId) => void
}

const { pane, onchange, onmodel }: Props = $props()

const clockWords = (c: Clock): string => (c === 'max' ? 'MAX' : `${c} MHz`)
const modelWords = (id: ModelId): string => {
  const m = MODELS[id]
  return `${m.width}×${m.height}${m.depth === 2 ? ' ·4' : ''}`
}
const BODY_WORDS: Record<BodyMode, string> = {
  auto: 'auto',
  full: 'full',
  compact: 'compact',
  lcd: 'lcd',
}

function pick<T>(now: T, next: T, apply: () => void): void {
  if (now === next) return
  sfx.play('panel')
  apply()
}
</script>

<div class="tune" data-testid="elec16-tune">
  <section>
    <h3>clock</h3>
    <div class="chips" role="radiogroup" aria-label="clock">
      {#each CLOCKS as c (c)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          aria-checked={pane.clock === c}
          onclick={() => pick(pane.clock, c, () => onchange({ clock: c }))}
          data-testid="elec16-clock"
          data-clock={c}>{clockWords(c)}</button
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
          aria-checked={pane.model === id}
          onclick={() => pick(pane.model, id, () => onmodel(id))}
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

.note {
  margin: 2px 0 0;
  font-size: var(--step--1);
  color: var(--text-muted);
}
</style>
