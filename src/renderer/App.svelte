<script lang="ts">
import type { AppInfo } from '@shared/api'
import Workspace from './layout/Workspace.svelte'

let info = $state<AppInfo | null>(null)

$effect(() => {
  window.elecdex.system.info().then((result) => {
    info = result
  })
})
</script>

<main>
  <Workspace />

  <footer>
    <span>elecdex{info === null ? '' : ` ${info.version}`}</span>
    <span class="hint">
      ctrl+shift+ e split · o split down · t tab · w close · [ ] focus · backspace reset
    </span>
  </footer>
</main>

<style>
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

.hint {
  font-family: var(--font-mono);
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.55;
}
</style>
