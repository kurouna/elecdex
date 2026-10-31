<script lang="ts">
import { backdropShade, crtPower, dialogDelay } from '../lib/crt-transitions.ts'
import { ui } from '../stores/ui.svelte.ts'

/**
 * The question Ctrl+Shift+Q asks before elecdex quits (user decision 2026-10-31). Q lies under
 * 1 and 2, so a slip while switching layouts with Ctrl+Shift+1..9 ended the app and every shell
 * in it. The keyboard starts on no, and Enter presses only the button it is on: a stray Enter,
 * typed for the shell a moment before, stays rather than quits.
 */

const request = $derived(ui.quit)
let no = $state<HTMLButtonElement | null>(null)

$effect(() => {
  if (request === null) return
  queueMicrotask(() => no?.focus())
})

function onKeydown(event: KeyboardEvent): void {
  if (request === null) return
  // Enter on a button presses that button; anywhere else in the dialog it is no.
  if (event.key === 'Enter' && event.target instanceof HTMLButtonElement) return
  if (event.key === 'Escape' || event.key === 'Enter') {
    event.preventDefault()
    event.stopPropagation()
    ui.answerQuit(false)
  }
}
</script>

<svelte:window onkeydowncapture={onKeydown} />

{#if request !== null}
  <!-- The backdrop answers no, as Escape does. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="backdrop"
    transition:backdropShade
    onpointerdown={(e) => e.target === e.currentTarget && ui.answerQuit(false)}
  >
    <div
      class="dialog crt-on"
      style:--crt-delay={dialogDelay()}
      transition:crtPower
      role="alertdialog"
      aria-modal="true"
      aria-label="Quit elecdex"
      tabindex="-1"
      data-testid="quit-dialog"
    >
      <header class="hud-label">
        <span>quit</span>
        <span>esc stay</span>
      </header>
      <div class="shell-frame body">
        <p class="what">Quit elecdex?</p>
        <p class="cost">Every shell ends, as it would if you closed its pane.</p>
        <div class="buttons">
          <button
            bind:this={no}
            type="button"
            onclick={() => ui.answerQuit(false)}
            data-testid="quit-no"
          >
            no
          </button>
          <button type="button" class="go" onclick={() => ui.answerQuit(true)} data-testid="quit-yes">
            yes
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 910;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 0.55);
}

.dialog {
  --crt-duration: 320ms;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(24rem, 90vw);
  background: var(--app-bg);
  outline: none;
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
}

p {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  line-height: 1.5;
}

.cost {
  color: var(--warn);
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

button {
  padding: 0.3rem var(--space-3);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

button:hover,
button:focus-visible {
  background: var(--surface-2);
}

.go {
  border-color: var(--accent-strong);
  color: var(--accent-strong);
}
</style>
