<script lang="ts">
import type { AppInfo } from '@shared/api'
import BootScreen from './BootScreen.svelte'
import Workspace from './layout/Workspace.svelte'
import { boot } from './stores/boot.svelte.ts'

let info = $state<AppInfo | null>(null)

/**
 * The exit button asks for a second click, so a stray click cannot end every
 * running shell. The confirmation lapses after a few seconds.
 */
const EXIT_CONFIRM_MS = 3000
let exitArmed = $state(false)
let exitTimer: ReturnType<typeof setTimeout> | null = null

function onExit(): void {
  if (exitArmed) {
    window.elecdex.system.quit()
    return
  }
  exitArmed = true
  if (exitTimer !== null) clearTimeout(exitTimer)
  exitTimer = setTimeout(() => {
    exitArmed = false
    exitTimer = null
  }, EXIT_CONFIRM_MS)
}

$effect(() => {
  window.elecdex.system.info().then((result) => {
    info = result
    void boot.run(result)
  })
})
</script>

<!--
  The workspace mounts immediately, even under the boot screen, so shells start
  and metrics flow while the intro plays. It is hidden with visibility rather
  than display so every pane already has its real size when it powers on.
-->
<main data-boot={boot.concealed ? 'concealed' : boot.phase} data-testid="app">
  <Workspace />

  <footer>
    <span>elecdex{info === null ? '' : ` ${info.version}`}</span>
    <span class="hint">
      ctrl+shift+ e split · o split down · t tab · w close · [ ] focus · backspace reset · q quit
      · f11 fullscreen
    </span>
    <button
      type="button"
      class="exit"
      class:armed={exitArmed}
      onclick={onExit}
      data-testid="exit"
      title="Quit elecdex (Ctrl+Shift+Q)"
    >
      {exitArmed ? 'click again to exit' : 'exit'}
    </button>
  </footer>
</main>

<BootScreen />

<style>
main[data-boot="concealed"] {
  visibility: hidden;
}

main[data-boot="reveal"] > footer {
  animation: footer-in 400ms var(--ease-out) 1200ms both;
}

@keyframes footer-in {
  from {
    opacity: 0;
  }
}

main {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
  gap: var(--space-2);
  padding: var(--space-2);
  min-height: 0;
}

footer {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0 var(--space-1);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.exit {
  flex: 0 0 auto;
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  letter-spacing: inherit;
  text-transform: uppercase;
  cursor: pointer;
}

.exit:hover,
.exit:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
  outline: none;
}

.exit.armed {
  color: var(--text-inverse);
  background: var(--danger);
  border-color: var(--danger);
}

.hint {
  flex: 1;
  text-align: right;
  font-family: var(--font-mono);
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.55;
}
</style>
