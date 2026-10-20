<script lang="ts">
/**
 * The strip of time under a network pane's log header: stretches lit by what
 * held in them, marks where something happened, and the times below. The Wi-Fi
 * pane draws the system log's day on it (up, down, not known), the Ethernet pane
 * the hour it watched; each places its own stretches and marks, in percent.
 */
interface Stretch {
  key: number
  left: number
  width: number
  /** `up` is lit, `down` red, `unknown` left to the hatching. */
  state: 'up' | 'down' | 'unknown'
}

interface Props {
  testid: string
  hint: string
  stretches: readonly Stretch[]
  /** Each stretch's test id, where a test reads them one by one. */
  stretchTestid?: string
  marks: readonly { key: string | number; left: number }[]
  /** What the marks are: the way out lost (warn) or the link down (danger). */
  markTone: 'warn' | 'danger'
  /** The times under the strip, oldest first. */
  ticks: readonly string[]
}

const { testid, hint, stretches, stretchTestid, marks, markTone, ticks }: Props = $props()
</script>

<div class="strip" data-hint={hint} data-testid={testid}>
  <div class="bar" data-marks={markTone}>
    {#each stretches as stretch (stretch.key)}
      <i
        class={stretch.state}
        style:left="{stretch.left}%"
        style:width="{stretch.width}%"
        data-testid={stretchTestid}
        data-state={stretch.state}
      ></i>
    {/each}
    {#each marks as mark (mark.key)}<b style:left="{mark.left}%"></b>{/each}
  </div>
  <div class="ticks">{#each ticks as tick, i (i)}<span>{tick}</span>{/each}</div>
</div>

<style>
.strip {
  padding: 0.3rem 0.2rem 0.15rem;
}

.bar {
  position: relative;
  height: 0.55rem;
  background: repeating-linear-gradient(-45deg, var(--accent-faint) 0 2px, transparent 2px 5px);
}

.bar i {
  position: absolute;
  top: 0;
  bottom: 0;
}

.bar i.up {
  background: color-mix(in srgb, var(--accent) 70%, transparent);
}

.bar i.down {
  background: var(--danger);
}

.bar b {
  position: absolute;
  top: -0.15rem;
  bottom: -0.15rem;
  width: 2px;
  background: var(--warn);
}

.bar[data-marks='danger'] b {
  background: var(--danger);
}

.ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 0.1rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}
</style>
