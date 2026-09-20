<script lang="ts">
import { crtPower } from './lib/crt-transitions.ts'
import { toasts } from './stores/toasts.svelte.ts'
import { coverWeb } from './stores/web.svelte.ts'

/**
 * Where everything transient says its piece: reminders, a finished timer, an
 * undo for something just deleted.
 *
 * Each card powers on like the rest of the HUD and powers off when it goes, and
 * the whole stack registers with `coverWeb` - a web pane's view is native and
 * sits over the DOM, so a toast drawn above one has to say so or it is simply
 * not there.
 */
</script>

{#if toasts.items.length > 0}
  <div
    class="stack"
    role="region"
    aria-label="Notices"
    data-testid="toasts"
    onpointerenter={() => toasts.hold(true)}
    onpointerleave={() => toasts.hold(false)}
    {@attach coverWeb()}
  >
    {#each toasts.items as toast (toast.id)}
      <div
        class="toast crt-on {toast.tone}"
        transition:crtPower|global
        role="status"
        data-testid="toast"
        data-tone={toast.tone}
      >
        {#if toast.timeoutMs > 0}
          <!-- How long it will stay, as a fuse burning down the edge of the card.
               It stops with the rest of the stack while the pointer is over it.
               In steps, ten a second like everything else drawn here: burning
               smoothly, it kept the compositor drawing at the display's rate for as
               long as a toast showed (measured beside a clock: 19.7% of one core
               with a toast up, 11.6% stepped; the clock alone is 4.7%). -->
          <span
            class="fuse"
            style:animation-duration="{toast.timeoutMs}ms"
            style:animation-timing-function="steps({Math.max(1, Math.round(toast.timeoutMs / 100))}, end)"
            aria-hidden="true"
          ></span>
        {/if}
        <div class="text">
          <span class="title">{toast.title}</span>
          {#if toast.body}<span class="body">{toast.body}</span>{/if}
        </div>
        <div class="actions">
          {#each toast.actions as action (action.label)}
            <button
              type="button"
              class:primary={action.primary}
              onclick={() => toasts.run(toast.id, action)}
              data-testid="toast-action"
              data-action={action.label}
            >
              {action.label}
            </button>
          {/each}
          <button
            type="button"
            class="close"
            aria-label="dismiss"
            onclick={() => toasts.dismiss(toast.id)}
            data-testid="toast-dismiss">×</button
          >
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
.stack {
  position: fixed;
  right: var(--space-4);
  /* Above the status bar's resting place, clear of the update notice's corner. */
  bottom: calc(var(--space-6) + var(--space-4));
  z-index: 900;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  max-width: min(26rem, 60vw);
}

.toast {
  --crt-duration: 320ms;
  position: relative;
  --toast-tone: var(--accent);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--toast-tone);
  /* The ground is opaque: a card over a web pane's snapshot must not let it through. */
  background: var(--app-bg);
  box-shadow: 0 0 14px color-mix(in srgb, var(--toast-tone) 40%, transparent);
  font-family: var(--font-ui);
  letter-spacing: var(--tracking-wide);
}

.fuse {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 100%;
  transform-origin: left;
  background: var(--toast-tone);
  opacity: 0.55;
  animation-name: burn;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  /* Ten or twenty seconds is long enough to matter: a window put away paints
     nothing (tokens.css). A reminder is raised precisely when nobody is looking,
     so this is the usual case, not the rare one. The stack's own timer is
     wall-clock, so a toast raised while the window was away has gone by the time
     it is back; a shorter absence leaves the fuse a little behind, on a rule two
     pixels tall. The hover rule below is more specific, so it still wins. */
  animation-play-state: var(--ambient-play-state);
}

.stack:hover .fuse {
  animation-play-state: paused;
}

@keyframes burn {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

.toast.warn { --toast-tone: var(--warn); }
.toast.danger { --toast-tone: var(--danger); }
.toast.ok { --toast-tone: var(--ok); }

.text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.title {
  font-size: var(--step-0);
  color: var(--toast-tone);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.body {
  font-size: var(--step--1);
  color: var(--text-muted);
  text-transform: uppercase;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-1);
}

button {
  padding: 2px var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: var(--step--1);
  letter-spacing: inherit;
  text-transform: uppercase;
  cursor: pointer;
}

button:hover {
  background: var(--accent-faint);
  color: var(--accent-strong);
}

button.primary {
  border-color: var(--toast-tone);
  color: var(--toast-tone);
}

button.close {
  border: 0;
  padding: 2px var(--space-1);
  color: var(--text-muted);
  font-size: var(--step-0);
}
</style>
