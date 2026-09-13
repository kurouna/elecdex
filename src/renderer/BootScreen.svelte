<script lang="ts">
import { boot } from './stores/boot.svelte.ts'

/**
 * The boot log and the title card that precede the workspace.
 *
 * Any key or click skips to the workspace. Keys are taken in the capture phase
 * and swallowed, so the key that skips the intro does not also reach the
 * terminal underneath.
 */

let log = $state<HTMLDivElement | null>(null)

// Keep the newest line in view, like a real console.
$effect(() => {
  void boot.lines.length
  if (log !== null) log.scrollTop = log.scrollHeight
})

function onSkip(event: Event): void {
  if (boot.phase !== 'log' && boot.phase !== 'title') return
  event.preventDefault()
  event.stopPropagation()
  boot.skip()
}
</script>

<svelte:window onkeydowncapture={onSkip} />

{#if boot.phase === 'log' || boot.phase === 'title'}
  <!-- Click-to-skip is a convenience; the keyboard path is the window listener above. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="boot" data-testid="boot-screen" data-phase={boot.phase} onpointerdown={onSkip}>
    {#if boot.phase === 'log'}
      <div class="log" bind:this={log} data-testid="boot-log">
        {#each boot.lines as line, index (index)}
          <div class:strong={line.strong}>{line.text}</div>
        {/each}
      </div>
    {:else}
      <div class="title-card" class:crt-on={!boot.title.off} class:crt-off={boot.title.off}>
        <h1 class:glitch={boot.title.glitch} data-text="ELECDEX">ELECDEX</h1>
        <p class="greeting" class:shown={boot.title.greet} data-testid="boot-greeting">
          {boot.greeting}
        </p>
      </div>
    {/if}
    <p class="hint">press any key to skip</p>
  </div>
{/if}

<style>
.boot {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  background: var(--app-bg);
  color: var(--text);
  overflow: hidden;
  cursor: default;
}

.boot[data-phase="title"] {
  align-items: center;
  justify-content: center;
}

.log {
  width: 100%;
  max-height: 100%;
  overflow: hidden;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.35;
  white-space: pre;
}

.log .strong {
  color: var(--accent-strong);
  font-weight: 600;
}

.title-card {
  --crt-duration: 700ms;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.title-card.crt-off {
  --crt-duration: 350ms;
}

/* The original's logo: the name over a heavy rule, set in the display face. */
h1 {
  position: relative;
  margin: 0;
  padding: 0.2em 0.25em 0.05em;
  font-family: var(--font-display);
  font-size: calc(var(--step-4) * 2.2);
  font-weight: 600;
  letter-spacing: 0.08em;
  line-height: 1;
  color: var(--accent);
  border-bottom: 0.45rem solid var(--accent);
}

/* Derezz: two offset slices of the name jitter against each other. */
h1::before,
h1::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  padding: inherit;
  opacity: 0;
  pointer-events: none;
}

h1::before {
  clip-path: polygon(0 0, 100% 0, 100% 42%, 0 42%);
  color: hsl(var(--accent-h) var(--accent-s) var(--accent-l) / 0.85);
}

h1::after {
  clip-path: polygon(0 42%, 100% 42%, 100% 100%, 0 100%);
  color: hsl(var(--accent-h) var(--accent-s) var(--accent-l) / 0.95);
}

h1.glitch {
  color: transparent;
  border-bottom-color: transparent;
}

h1.glitch::before {
  opacity: 1;
  animation: derezz-top 60ms linear infinite alternate-reverse;
}

h1.glitch::after {
  opacity: 1;
  animation: derezz-bottom 50ms linear infinite alternate-reverse;
}

@keyframes derezz-top {
  from {
    transform: translateX(-1%);
  }
  to {
    transform: translateX(-5%);
  }
}

@keyframes derezz-bottom {
  from {
    transform: translateX(1%);
  }
  to {
    transform: translateX(3%);
  }
}

.greeting {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--step-2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 300ms var(--ease-out);
}

.greeting.shown {
  opacity: 1;
}

.hint {
  position: absolute;
  right: var(--space-3);
  bottom: var(--space-2);
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
  opacity: 0.6;
}
</style>
