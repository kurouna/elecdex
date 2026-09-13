<script lang="ts">
import {
  batteryGauge,
  formatMonthDay,
  formatUptime,
  osLabel,
  powerLabel,
  trimHardware,
} from '../../lib/format.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import BatteryGauge from './BatteryGauge.svelte'

/**
 * eDEX-UI's system strip and hardware inspector, combined: the date, uptime,
 * OS type and power state on one row, manufacturer / model / chassis below.
 */
const { paneId }: WidgetProps = $props()

let today = $state(new Date())

$effect(() => {
  // The date only changes at midnight; once a minute is plenty.
  const timer = setInterval(() => {
    today = new Date()
  }, 60_000)
  return () => clearInterval(timer)
})

const uptime = $derived(metrics.get('os.uptime'))
const os = $derived(metrics.get('os.info'))
const battery = $derived(metrics.get('power.battery'))
const hardware = $derived(metrics.get('hardware.system'))
const gauge = $derived(battery ? batteryGauge(battery) : null)
</script>

<div class="sysinfo" data-testid="sysinfo" data-pane-id={paneId}>
  <div class="hud-cells">
    <div class="hud-cell">
      <span class="label">{today.getFullYear()}</span>
      <span class="value">{formatMonthDay(today)}</span>
    </div>
    <div class="hud-cell">
      <span class="label">uptime</span>
      <span class="value" data-testid="uptime">{uptime ? formatUptime(uptime.seconds) : '--'}</span>
    </div>
    <div class="hud-cell">
      <span class="label">type</span>
      <span class="value">{os ? osLabel(os.platform) : '--'}</span>
    </div>
    <div class="hud-cell">
      <span class="label">power</span>
      {#if gauge}
        <span class="value power" class:low={gauge.low} data-testid="power">
          {gauge.percent}%
          <BatteryGauge percent={gauge.percent} low={gauge.low} charging={gauge.charging} />
        </span>
      {:else}
        <span class="value" data-testid="power">{battery ? powerLabel(battery) : '--'}</span>
      {/if}
    </div>
  </div>

  <div class="hud-cells hardware">
    <div class="hud-cell">
      <span class="label">manufacturer</span>
      <span class="value">{hardware ? trimHardware(hardware.manufacturer, 2) : '--'}</span>
    </div>
    <div class="hud-cell">
      <span class="label">model</span>
      <span class="value"
        >{hardware ? trimHardware(hardware.model, 2, hardware.manufacturer, hardware.chassis) : '--'}</span
      >
    </div>
    <div class="hud-cell">
      <span class="label">chassis</span>
      <span class="value">{hardware?.chassis || '--'}</span>
    </div>
  </div>
</div>

<style>
.sysinfo {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 100%;
  gap: var(--space-1);
}

.power {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  color: var(--ok);
}

.power.low {
  color: var(--danger);
}

.hardware {
  padding-top: var(--space-1);
}

.hardware .value {
  font-size: var(--step--1);
  font-weight: 400;
}
</style>
