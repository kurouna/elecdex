<script lang="ts">
import type { AppInfo } from '@shared/api'
import BootPanel from './boot/BootPanel.svelte'

let info = $state<AppInfo | null>(null)
let error = $state<string | null>(null)

$effect(() => {
  window.elecdex.system
    .info()
    .then((result) => {
      info = result
    })
    .catch((cause: unknown) => {
      error = cause instanceof Error ? cause.message : String(cause)
    })
})
</script>

<main>
  <BootPanel {info} {error} />
</main>

<style>
main {
  display: grid;
  place-items: center;
  height: 100%;
  padding: var(--space-6);
}
</style>
