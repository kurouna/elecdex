<script lang="ts">
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import type { WidgetProps } from '../registry.ts'

/**
 * eDEX-UI's network status: connection state, the interface's IPv4 address and
 * the round-trip time to the ping host.
 *
 * ONLINE means the interface is up AND the ping host answered - an interface can
 * be up on a network with no route out, and the original reported that as
 * offline too.
 */
const { paneId }: WidgetProps = $props()

const iface = $derived(metrics.get('net.interface'))
const ping = $derived(metrics.get('net.ping'))

const state = $derived.by(() => {
  if (iface === null && ping === null) return 'UNKNOWN'
  const up = iface?.state === 'up' || iface?.state === 'unknown'
  return up && ping?.ms !== null && ping?.ms !== undefined ? 'ONLINE' : 'OFFLINE'
})

$effect(() => {
  paneMeta.set(paneId, { subtitle: iface?.iface ? `Interface: ${iface.iface}` : '' })
})
</script>

<div class="hud-cells netstat" data-testid="netstat">
  <div class="hud-cell">
    <span class="label">state</span>
    <span class="value" class:offline={state === 'OFFLINE'} data-testid="net-state">{state}</span>
  </div>
  <div class="hud-cell wide">
    <span class="label">ipv4</span>
    <span class="value">{iface?.ip4 ?? '--.--.--.--'}</span>
  </div>
  <div class="hud-cell">
    <span class="label">ping</span>
    <span class="value">{ping?.ms != null ? `${Math.round(ping.ms)}ms` : '--ms'}</span>
  </div>
</div>

<style>
.netstat {
  grid-auto-flow: row;
  grid-template-columns: 1fr 2fr 1fr;
  align-content: start;
  height: 100%;
}

.offline {
  color: var(--danger);
}
</style>
