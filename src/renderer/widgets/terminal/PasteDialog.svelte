<script lang="ts">
import { backdropShade, crtPower, dialogDelay } from '../../lib/crt-transitions.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'

/**
 * The question asked before text of several lines is pasted into a shell. Each line break is an
 * Enter: a clipboard holding more than was meant runs every line of it. It carries the way to
 * stop asking (settings.terminal.confirmPaste), as the layout switch's question does.
 */

const request = $derived(ui.paste)
let dialog = $state<HTMLDivElement | null>(null)

$effect(() => {
  if (request === null) return
  queueMicrotask(() => dialog?.focus())
})

function always(): void {
  void appearance.patch({ terminal: { confirmPaste: false } })
  ui.answerPaste(true)
}

function onKeydown(event: KeyboardEvent): void {
  if (request === null) return
  if (event.key === 'Escape' || event.key === 'Enter') {
    event.preventDefault()
    event.stopPropagation()
    ui.answerPaste(event.key === 'Enter')
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
    onpointerdown={(e) => e.target === e.currentTarget && ui.answerPaste(false)}
  >
    <div
      bind:this={dialog}
      class="dialog crt-on"
      style:--crt-delay={dialogDelay()}
      transition:crtPower
      role="alertdialog"
      aria-modal="true"
      aria-label="Paste several lines"
      tabindex="-1"
      data-testid="paste-dialog"
    >
      <header class="hud-label">
        <span>paste</span>
        <span>enter paste · esc stop</span>
      </header>
      <div class="shell-frame body">
        <p class="cost" data-testid="paste-lines">
          {request.lines} lines: each line break runs what is before it in the shell.
        </p>
        <pre class="preview" data-testid="paste-preview">{request.preview}</pre>
        <div class="buttons">
          <button type="button" onclick={() => ui.answerPaste(false)} data-testid="paste-cancel">
            don't paste
          </button>
          <button type="button" class="go" onclick={() => ui.answerPaste(true)} data-testid="paste-go">
            paste
          </button>
        </div>
        <button type="button" class="always" onclick={always} data-testid="paste-always">
          paste, and stop asking
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
  width: min(34rem, 90vw);
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

.preview {
  max-height: 10lh;
  margin: 0;
  overflow: auto;
  padding: var(--space-2);
  border: 1px solid var(--panel-rule);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
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
