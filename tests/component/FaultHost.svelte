<script lang="ts">
// PaneFault round the stand-in widget, as PaneHost mounts a widget, and something
// beside it that must survive the fault.
import PaneFault from '../../src/renderer/layout/PaneFault.svelte'
import FaultChild from './FaultChild.svelte'
</script>

<PaneFault source="ethernet"><FaultChild /></PaneFault>
<p data-testid="outside">still here</p>
