<script lang="ts">
import type { AppInfo } from '@shared/api'
import TerminalWidget from './widgets/terminal/TerminalWidget.svelte'

let info = $state<AppInfo | null>(null)

$effect(() => {
  window.elecdex.system.info().then((result) => {
    info = result
  })
})
</script>

<main>
  <!--
    Phase 1 gives the terminal the whole window. Phase 2 replaces this with the
    layout tree, at which point the terminal becomes one PaneNode among many.
  -->
  <TerminalWidget />

  <footer>
    <span>elecdex{info === null ? '' : ` ${info.version}`}</span>
    <span class="hint">ctrl+shift+t new · ctrl+shift+w close · ctrl+tab cycle</span>
  </footer>
</main>

<style>
main {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
  gap: var(--space-2);
  padding: var(--space-3);
}

footer {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.hint {
  font-family: var(--font-mono);
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.6;
}
</style>
