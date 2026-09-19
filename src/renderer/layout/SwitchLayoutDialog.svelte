<script lang="ts">
import { backdropShade, crtPower, dialogDelay } from '../lib/crt-transitions.ts'
import { appearance } from '../stores/appearance.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'

/**
 * The question asked before a saved layout replaces a workspace with shells in
 * it.
 *
 * Applying a layout ends the shells of the panes it replaces - the same as
 * closing those panes - and a shortcut is one keystroke, so this stands between
 * a mistyped Ctrl+Shift+3 and a shell that was in the middle of something. It
 * carries the way to stop asking, since someone who switches all day should not
 * be asked all day.
 */

const request = $derived(ui.layoutSwitch)
let dialog = $state<HTMLDivElement | null>(null)

$effect(() => {
  if (request === null) return
  queueMicrotask(() => dialog?.focus())
})

function answer(go: boolean): void {
  ui.answerLayoutSwitch(go)
}

/** Stops the question being asked again, and lets this switch through. */
function always(): void {
  void appearance.patch({ layout: { confirmSwitch: false } })
  answer(true)
}

function onKeydown(event: KeyboardEvent): void {
  if (request === null) return
  if (event.key === 'Escape' || event.key === 'Enter') {
    event.preventDefault()
    event.stopPropagation()
    answer(event.key === 'Enter')
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
    onpointerdown={(e) => e.target === e.currentTarget && answer(false)}
  >
    <div
      bind:this={dialog}
      class="dialog crt-on"
      style:--crt-delay={dialogDelay()}
      transition:crtPower
      role="alertdialog"
      aria-modal="true"
      aria-label="Switch layout"
      tabindex="-1"
      data-testid="switch-layout-dialog"
    >
      <header class="hud-label">
        <span>switch layout</span>
        <span>enter go · esc stay</span>
      </header>
      <div class="shell-frame body">
        <p class="what">
          Going to <b data-testid="switch-layout-name">{request.name}</b> replaces the workspace.
        </p>
        <p class="cost" data-testid="switch-layout-cost">
          {request.shells === 1 ? 'One shell ends' : `${request.shells} shells end`}, as they would
          if you closed their panes.
        </p>
        <div class="buttons">
          <button type="button" onclick={() => answer(false)} data-testid="switch-layout-cancel">
            stay here
          </button>
          <button
            type="button"
            class="go"
            onclick={() => answer(true)}
            data-testid="switch-layout-go"
          >
            switch
          </button>
        </div>
        <button type="button" class="always" onclick={always} data-testid="switch-layout-always">
          switch, and stop asking
        </button>
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
  width: min(28rem, 90vw);
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

.always {
  align-self: flex-end;
  padding: 0;
  border: none;
  color: var(--text-muted);
  font-size: var(--step--2);
  text-decoration: underline;
}

.always:hover {
  background: transparent;
  color: var(--text);
}
</style>
