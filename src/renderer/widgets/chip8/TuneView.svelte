<script lang="ts">
import { profileOf, quirksFor } from '@shared/chip8/quirks'
import { PLATFORMS, QUIRK_NAMES, type Quirks } from '@shared/chip8/types'
import { PROFILE_NAMES, QUIRK_LABELS } from './labels.ts'
import type { Chip8Pane } from './pane-state.ts'
import type { Chip8Runner } from './runner.svelte.ts'

/**
 * TUNE (docs/architecture.md section 5.18): how fast and with which quirks the machine
 * runs, and how the screen is drawn. Speed and quirks act on the machine at once; the
 * drawing choices are the pane's.
 */
interface Props {
  runner: Chip8Runner
  pane: Chip8Pane
  /** Whether the program brings colours of its own (ORIGINAL). */
  hasOriginal: boolean
  onchange: (change: Partial<Chip8Pane>) => void
}

const { runner, pane, hasOriginal, onchange }: Props = $props()

const SPEEDS = [7, 15, 30, 100, 200, 500, 1000, 10000]

let revision = $state(0)
const config = $derived.by(() => {
  void revision
  void runner.program
  return runner.machine?.state.config ?? null
})
const profile = $derived(config === null ? null : profileOf(config.quirks))

function tune(change: Parameters<Chip8Runner['tune']>[0]): void {
  runner.tune(change)
  revision++
}

function setQuirk(name: keyof Quirks, on: boolean): void {
  const quirks: Partial<Quirks> = {}
  quirks[name] = on
  tune({ quirks })
}
</script>

{#if config !== null}
  <div class="tune" data-testid="chip8-tune">
    <span class="label">speed</span>
    <div class="chips" role="radiogroup" aria-label="instructions a frame">
      {#each SPEEDS as speed (speed)}
        <button
          type="button"
          class="c8-chip"
          role="radio"
          aria-checked={config.ipf === speed}
          onclick={() => tune({ ipf: speed })}
          data-testid="chip8-ipf"
          data-ipf={speed}>{speed}</button
        >
      {/each}
    </div>

    <span class="label">quirks</span>
    <div class="chips" role="radiogroup" aria-label="quirk profile">
      {#each PLATFORMS as platform (platform)}
        <button
          type="button"
          class="c8-chip"
          role="radio"
          aria-checked={profile === platform}
          onclick={() => tune({ quirks: quirksFor(platform) })}
          data-testid="chip8-profile"
          data-profile={platform}>{PROFILE_NAMES[platform]}</button
        >
      {/each}
    </div>
    <span></span>
    <div class="flags">
      {#each QUIRK_NAMES as name (name)}
        <label class="flag">
          <input
            type="checkbox"
            checked={config.quirks[name]}
            onchange={(e) => setQuirk(name, e.currentTarget.checked)}
            data-testid="chip8-quirk"
            data-quirk={name}
          />
          {QUIRK_LABELS[name]}
        </label>
      {/each}
    </div>

    <span class="label">colours</span>
    <div class="chips">
      <button type="button" class="c8-chip" aria-pressed={pane.palette === 'theme'} onclick={() => onchange({ palette: 'theme' })}
        >theme</button
      >
      <button
        type="button"
        class="c8-chip"
        aria-pressed={pane.palette === 'original'}
        disabled={!hasOriginal}
        title={hasOriginal ? undefined : 'this program brings no colours of its own'}
        onclick={() => onchange({ palette: 'original' })}
        data-testid="chip8-original">original</button
      >
    </div>

    <span class="label">screen</span>
    <div class="chips">
      <button type="button" class="c8-chip" aria-pressed={pane.phosphor} onclick={() => onchange({ phosphor: !pane.phosphor })}
        data-testid="chip8-phosphor">phosphor</button
      >
      <button type="button" class="c8-chip" aria-pressed={pane.dots} onclick={() => onchange({ dots: !pane.dots })}
        data-testid="chip8-dots">dots</button
      >
      <button
        type="button"
        class="c8-chip"
        aria-pressed={pane.scale === 'fit'}
        onclick={() => onchange({ scale: pane.scale === 'fit' ? 'integer' : 'fit' })}
        data-testid="chip8-fit">fit</button
      >
    </div>

    <span class="label">sound</span>
    <div class="chips">
      <button type="button" class="c8-chip" aria-pressed={!pane.muted} onclick={() => onchange({ muted: !pane.muted })}
        data-testid="chip8-sound">{pane.muted ? 'muted' : 'on'}</button
      >
    </div>
  </div>
{/if}

<style>
.tune {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-1) var(--space-2);
  font-size: var(--step--1);
}

.label {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.flags {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.flag {
  display: flex;
  align-items: center;
  gap: 0.4em;
  color: var(--text);
  cursor: pointer;
}

.flag input {
  accent-color: var(--accent);
  margin: 0;
}
</style>
