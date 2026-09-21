<script lang="ts">
import type { AiModel } from '@shared/ai'
import { type ElecSeat, resolveSeat, UNIT_INDICES, type UnitIndex, unitLabel } from '@shared/elec'
import { appearance } from '../../stores/appearance.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'
import ModelField from '../aichat/ModelField.svelte'

/**
 * Who sits in each of the three seats: a provider of the AI settings and a model.
 * Kept in the settings (`elec.seats`), not in the pane, so every ELEC pane is the
 * same council; a deliberation keeps its own copy of the seats it was put to.
 *
 * As in the chat pane, a provider's models are asked for when a model field is
 * entered, never on mount.
 */
const providers = $derived(appearance.settings.ai.providers)
const seats = $derived(appearance.settings.elec.seats)

function write(unit: UnitIndex, seat: ElecSeat): void {
  const next = UNIT_INDICES.map((u) =>
    u === unit ? seat : { ...(seats[u] ?? { provider: '', model: '' }) },
  )
  void appearance.patch({ elec: { seats: next } })
}

function chooseProvider(unit: UnitIndex, id: string): void {
  write(unit, { provider: id, model: '' })
}

function chooseModel(unit: UnitIndex, model: string): void {
  const resolved = resolveSeat(seats[unit], providers)
  const next = model.trim()
  if (resolved.provider === null || next === '' || next === resolved.model) return
  write(unit, { provider: resolved.provider.id, model: next })
}

/** One link for the whole council: the three seats take this one's provider and model. */
function sameForAll(unit: UnitIndex): void {
  const resolved = resolveSeat(seats[unit], providers)
  if (resolved.provider === null) return
  const seat = { provider: resolved.provider.id, model: resolved.model }
  void appearance.patch({ elec: { seats: UNIT_INDICES.map(() => ({ ...seat })) } })
}

/** Model lists by provider, read when a field is entered; a failed read is asked again next time. */
let lists = $state<Record<string, { models: AiModel[]; error: string | null; loading: boolean }>>(
  {},
)

async function loadModels(providerId: string): Promise<void> {
  const known = lists[providerId]
  if (known !== undefined && (known.loading || known.error === null)) return
  lists = { ...lists, [providerId]: { models: [], error: null, loading: true } }
  const result = await window.elecdex.ai.models(providerId)
  lists = { ...lists, [providerId]: { models: result.models, error: result.error, loading: false } }
}
</script>

<div class="seats" data-testid="elec-seats">
  {#each UNIT_INDICES as unit (unit)}
    {@const resolved = resolveSeat(seats[unit], providers)}
    {@const list = resolved.provider === null ? undefined : lists[resolved.provider.id]}
    <div class="seat fx-rise" style:--fx-delay={`${unit * 50}ms`} data-testid="elec-seat" data-unit={unit}>
      <span class="label">{unitLabel(unit)}</span>
      <select
        value={resolved.provider?.id ?? ''}
        onchange={(e) => chooseProvider(unit, e.currentTarget.value)}
        aria-label={`${unitLabel(unit)} provider`}
        data-testid="elec-seat-provider"
      >
        {#each providers as p (p.id)}
          <option value={p.id}>{p.name}</option>
        {/each}
      </select>
      <span class="field">
        <ModelField
          value={resolved.model}
          models={list?.models ?? []}
          title={list?.error ?? 'the model this unit asks; the list is read from the provider when you open it'}
          wanting={resolved.model === ''}
          onopen={() => resolved.provider !== null && void loadModels(resolved.provider.id)}
          onchoose={(model) => chooseModel(unit, model)}
          testid={`elec-seat-model-${unit}`}
        />
        {#if list?.loading}
          <span class="tag">querying</span>
        {:else if list?.error != null}
          <span class="tag warn" title={list.error}>no list</span>
        {/if}
      </span>
      <button
        type="button"
        class="cmd"
        onclick={() => sameForAll(unit)}
        title="seat this provider and model in all three units"
        data-testid="elec-same"
      >
        all
      </button>
    </div>
  {/each}
  <p class="note">
    The same model may sit in every seat: each unit is given its own standpoint.
    <button type="button" class="link" onclick={() => ui.openSettings('ai')} data-testid="elec-standpoints">standpoints › settings</button>
  </p>
</div>

<style>
.seats {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-1);
  position: relative;
  /*
   * Above what follows it - the motion band (its clip-path makes it a layer of its own) and the
   * stage - so a model list dropping out of the panel is drawn over them, whatever layers the
   * rows' entrance leaves on the way.
   */
  z-index: 3;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg-raised);
}

/*
 * The cut corner the panels have, drawn over the corner rather than cut with clip-path: a clip
 * would cut the model list too, which drops out of the panel and over the stage below.
 */
.seats::before {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  width: 0.6rem;
  height: 0.6rem;
  background: linear-gradient(
    to bottom left,
    var(--app-bg) calc(50% - 0.5px),
    var(--panel-border) calc(50% - 0.5px) calc(50% + 0.5px),
    transparent calc(50% + 0.5px)
  );
  pointer-events: none;
}

.seat {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: var(--space-1);
  min-height: 1.4rem;
}

.label {
  flex: 0 0 7.5rem;
  align-self: center;
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--accent-strong);
}

select {
  flex: 0 1 9rem;
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

.field {
  position: relative;
  display: flex;
  flex: 1 1 8rem;
  min-width: 0;
}

.tag {
  position: absolute;
  top: 1px;
  right: 1px;
  bottom: 1px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-1);
  background: var(--app-bg);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent);
  pointer-events: none;
}

.tag.warn {
  color: var(--warn);
  pointer-events: auto;
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

.cmd:hover,
.cmd:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
  outline: none;
}

.note {
  margin: 0;
  font-size: var(--step--2);
  color: var(--text-muted);
}

.link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  font: inherit;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.link:hover,
.link:focus-visible {
  color: var(--accent-strong);
  outline: none;
}
</style>
