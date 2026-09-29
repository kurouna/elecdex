<script lang="ts">
import type { GuessReason } from '@shared/chip8/platform'
import { maxProgramSize, PLATFORMS, type Platform } from '@shared/chip8/types'
import type { Chip8Program } from '@shared/chip8-library'
import { untrack } from 'svelte'
import { fade } from 'svelte/transition'
import { POWER_OFF_MS } from '../../lib/crt-motion.ts'
import { crtPower } from '../../lib/crt-transitions.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { GUESS_WORDS, PLATFORM_NAMES } from './labels.ts'
import type { Palette } from './palette.ts'
import Thumb from './Thumb.svelte'

/**
 * An imported program's sheet (docs/architecture.md section 5.18), over the library: shown
 * after an IMPORT - with the machine main guessed and why - and from an imported program's
 * EDIT. Its title and machine can be changed; a new machine forgets the program's saves,
 * as they were another machine's. REMOVE asks once more, and takes the program, its file
 * and its saves out of the library.
 */
interface Props {
  program: Chip8Program
  /** Why main took it for its machine, right after an import; null from EDIT. */
  guess: GuessReason | null
  /** The same file was imported before. */
  already: boolean
  palette: Palette
  onclose: () => void
}

const { program, guess, already, palette, onclose }: Props = $props()

// The draft starts from the program as it came; the library's later copies do not reset it.
let title = $state(untrack(() => program.title))
let platform = $state<Platform>(untrack(() => program.platform))
let problem = $state<string | null>(null)
const size = $derived(program.source?.size ?? 0)
const changed = $derived(title.trim() !== program.title || platform !== program.platform)

async function done(): Promise<void> {
  if (!changed) {
    onclose()
    return
  }
  const change = {
    ...(title.trim() !== program.title && title.trim() !== '' ? { title: title.trim() } : {}),
    ...(platform !== program.platform ? { platform } : {}),
  }
  const ok = await window.elecdex.chip8.update(program.id, change).catch(() => false)
  if (!ok) {
    problem = 'That change could not be kept.'
    sfx.play('glitch')
    return
  }
  sfx.play('granted')
  onclose()
}

/** REMOVE asks once more: the first press arms it for a few seconds. */
let armed = $state(false)
let armTimer: ReturnType<typeof setTimeout> | undefined
$effect(() => () => clearTimeout(armTimer))

async function remove(): Promise<void> {
  clearTimeout(armTimer)
  if (!armed) {
    armed = true
    armTimer = setTimeout(() => {
      armed = false
    }, 3000)
    return
  }
  armed = false
  sfx.play('collapse')
  await window.elecdex.chip8.remove(program.id).catch(() => false)
  onclose()
}

function onkeydown(event: KeyboardEvent): void {
  // The sheet's own keys, kept from the library under it.
  event.stopPropagation()
  if (event.key === 'Escape') {
    event.preventDefault()
    onclose()
  } else if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') {
    event.preventDefault()
    void done()
  }
}
</script>

<!-- The shade keeps to the library: the sheet is the pane's, not the workspace's. -->
<div class="shade" transition:fade={{ duration: appearance.reducedMotion ? 0 : POWER_OFF_MS }}></div>
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="sheet crt-on"
  role="dialog"
  aria-label="imported program"
  tabindex="-1"
  transition:crtPower
  {onkeydown}
  data-testid="chip8-import-sheet"
  data-program={program.id}
>
  <div class="head">
    <span class="kicker">{already ? 'already in the library' : 'imported'}</span>
    <span class="file">{program.source?.name ?? ''} · {size.toLocaleString('en-US')} bytes</span>
  </div>
  <div class="body">
    <Thumb preview={program.preview} {palette} rotation={program.rotation} width={128} height={64} />
    <div class="fields">
      <label class="field">
        <span class="label">title</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          type="text"
          maxlength="80"
          spellcheck="false"
          autofocus
          bind:value={title}
          data-testid="chip8-import-title"
        />
      </label>
      <div class="field">
        <span class="label">machine</span>
        <div class="chips" role="radiogroup" aria-label="machine">
          {#each PLATFORMS as p (p)}
            <button
              type="button"
              class="c8-chip"
              role="radio"
              aria-checked={platform === p}
              disabled={size > maxProgramSize(p)}
              onclick={() => (platform = p)}
              data-testid="chip8-import-machine"
              data-platform={p}>{PLATFORM_NAMES[p]}</button
            >
          {/each}
        </div>
      </div>
      {#if guess !== null && platform === program.platform}
        <p class="why" data-testid="chip8-import-guess">Taken for {PLATFORM_NAMES[program.platform]}: {GUESS_WORDS[guess]}.</p>
      {/if}
      {#if platform !== program.platform}
        <p class="why warn">Its saved machines are forgotten: they were {PLATFORM_NAMES[program.platform]}.</p>
      {/if}
      {#if problem !== null}
        <p class="why warn">{problem}</p>
      {/if}
    </div>
  </div>
  <div class="actions">
    <button
      type="button"
      class="c8-btn"
      class:armed
      aria-label={armed ? 'press again to remove it from the library' : 'remove it from the library'}
      onclick={remove}
      data-testid="chip8-import-remove">{armed ? 'remove?' : 'remove'}</button
    >
    <button type="button" class="c8-btn primary" onclick={done} data-testid="chip8-import-done"
      >done</button
    >
  </div>
</div>

<style>
.shade {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: color-mix(in srgb, var(--app-bg) 60%, transparent);
}

.sheet {
  position: absolute;
  inset: 0;
  margin: auto;
  width: min(34rem, calc(100% - 2 * var(--space-2)));
  height: max-content;
  max-height: calc(100% - 2 * var(--space-2));
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--app-bg) 94%, transparent);
  z-index: 3;
  outline: none;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--space-2);
  border-bottom: 1px solid var(--panel-rule);
  padding-bottom: 2px;
}

.kicker {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent-strong);
}

.file {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

.body {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.fields {
  flex: 1;
  min-width: 12rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field {
  display: grid;
  gap: 2px;
}

.label {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

input {
  border: 0;
  border-bottom: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  padding: 1px var(--space-1);
  outline: none;
}

input:focus {
  border-bottom-color: var(--accent);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.why {
  margin: 0;
  font-size: var(--step--1);
  color: var(--text-muted);
}

.why.warn {
  color: var(--warn);
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.armed {
  color: var(--warn);
  border-color: var(--warn);
}
</style>
