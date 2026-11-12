<script lang="ts">
import { backdropShade, crtPower, dialogDelay } from '../lib/crt-transitions.ts'
import { focusStart, type Question, questionKey } from '../lib/question-keys.ts'
import { ui } from '../stores/ui.svelte.ts'

/**
 * The question Ctrl+Shift+Q asks before elecdex quits (user decision 2026-10-31). Q lies under
 * 1 and 2, so a slip while switching layouts with Ctrl+Shift+1..9 ended the app and every shell
 * in it. The keyboard starts on no, and Enter presses the answer it is on (lib/question-keys.ts):
 * a stray Enter, typed for the shell a moment before, stays rather than quits; → then Enter quits.
 */

const request = $derived(ui.quit)
let box = $state<HTMLDivElement | null>(null)
let no = $state<HTMLButtonElement | null>(null)
let yes = $state<HTMLButtonElement | null>(null)

const question = (): Question => ({
  box,
  row: [no, yes],
  start: no,
  cancel: () => ui.answerQuit(false),
})

$effect(() => {
  if (request === null) return
  focusStart(question)
})

function onKeydown(event: KeyboardEvent): void {
  if (request === null) return
  questionKey(event, question())
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
      bind:this={box}
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
        <span>← → choose · esc stay</span>
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
          <button
            bind:this={yes}
            type="button"
            class="go"
            onclick={() => ui.answerQuit(true)}
            data-testid="quit-yes"
          >
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

button:hover {
  background: var(--surface-2);
}

.go {
  border-color: var(--accent-strong);
  color: var(--accent-strong);
}

/* The answer the keyboard is on, which Enter presses: filled, not a hairline round it. */
.buttons button:focus {
  border-color: var(--accent-strong);
  background: var(--accent-strong);
  color: var(--text-inverse);
  outline: none;
}
</style>
