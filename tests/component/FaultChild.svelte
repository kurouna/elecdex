<script lang="ts">
// A widget stand-in that throws from an effect, as the Ethernet pane once could,
// while `fault.on` says so.
import { fault } from './fault-switch.svelte.ts'

$effect(() => {
  if (fault.on) throw new TypeError('a made-up fault')
})
</script>

<p data-testid="fault-child">drawn</p>
