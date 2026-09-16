<script lang="ts">
import type { Block } from '@shared/plugin-api'
import ChartBlock from './ChartBlock.svelte'
import TimeBlock from './TimeBlock.svelte'

/**
 * Draws a plugin's blocks (docs/plugins.md section 6). They arrive checked, so every field
 * here has its type; text is always text - nothing a plugin sends is read as markup.
 */
interface Props {
  blocks: readonly Block[]
  onaction: (action: string, item?: string) => void
  onsignin: (host: string) => void
  onlink: (href: string) => void
}

const { blocks, onaction, onsignin, onlink }: Props = $props()

const lit = (value: number, segments: number) => Math.round(value * segments)
</script>

<div class="blocks" data-testid="plugin-blocks">
  {#each blocks as block, index (index)}
    {#if block.t === 'heading'}
      <h4 class="heading">{block.text}</h4>
    {:else if block.t === 'text'}
      <p class="text size-{block.size ?? 'md'} tone-{block.tone ?? 'none'}">{block.text}</p>
    {:else if block.t === 'big'}
      <div class="big">
        {#if block.label}<span class="label">{block.label}</span>{/if}
        <span class="value tone-{block.tone ?? 'none'}"
          >{block.value}{#if block.unit}<small>{block.unit}</small>{/if}</span
        >
      </div>
    {:else if block.t === 'time'}
      <TimeBlock at={block.at} style={block.style} label={block.label} tone={block.tone} size={block.size} />
    {:else if block.t === 'rows'}
      <dl class="rows">
        {#each block.rows as row, r (r)}
          <dt>{row.label}</dt>
          <dd class="tone-{row.tone ?? 'none'}">{row.value}</dd>
        {/each}
      </dl>
    {:else if block.t === 'bar'}
      <div class="bar-block">
        {#if block.label || block.text}
          <div class="bar-caption"><span>{block.label ?? ''}</span><span>{block.text ?? ''}</span></div>
        {/if}
        {#if block.segments}
          <div class="cells tone-{block.tone ?? 'accent'}" data-testid="plugin-bar" data-value={block.value}>
            {#each { length: block.segments }, cell (cell)}
              <span class="cell" class:on={cell < lit(block.value, block.segments)}></span>
            {/each}
          </div>
        {:else}
          <div class="meter tone-{block.tone ?? 'accent'}" data-testid="plugin-bar" data-value={block.value}>
            <span class="fill" style:transform={`scaleX(${block.value})`}></span>
          </div>
        {/if}
      </div>
    {:else if block.t === 'steps'}
      <div class="steps">
        {#if block.label}<span class="label">{block.label}</span>{/if}
        <span class="marks tone-{block.tone ?? 'accent'}" data-testid="plugin-steps">
          {#each { length: block.count }, step (step)}
            <span class="mark" class:on={step < block.done}></span>
          {/each}
        </span>
      </div>
    {:else if block.t === 'spark'}
      {@const lo = block.min ?? Math.min(...block.values)}
      {@const hi = block.max ?? Math.max(...block.values)}
      <div class="spark">
        {#if block.label}<span class="label">{block.label}</span>{/if}
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            points={block.values
              .map((v, i) => `${(i / Math.max(1, block.values.length - 1)) * 100},${24 - ((v - lo) / (hi - lo || 1)) * 22 - 1}`)
              .join(' ')}
          />
        </svg>
      </div>
    {:else if block.t === 'chart'}
      <ChartBlock height={block.height} x={block.x} y={block.y} series={block.series} rules={block.rules} labels={block.labels} />
    {:else if block.t === 'table'}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              {#each block.columns as column, c (c)}
                <th class:right={block.align?.[c] === 'right'}>{column}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each block.rows as row, r (r)}
              <tr>
                {#each row as cell, c (c)}
                  <td class:right={block.align?.[c] === 'right'}>{cell}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if block.t === 'list'}
      {@const action = block.action}
      <ul class="list">
        {#each block.items as item (item.id)}
          <li class="tone-{item.tone ?? 'none'}">
            {#if action}
              <button type="button" onclick={() => onaction(action, item.id)}>
                <span>{item.text}</span>{#if item.sub}<small>{item.sub}</small>{/if}
              </button>
            {:else}
              <span>{item.text}</span>{#if item.sub}<small>{item.sub}</small>{/if}
            {/if}
          </li>
        {/each}
      </ul>
    {:else if block.t === 'buttons'}
      <div class="buttons">
        {#each block.items as button, b (b)}
          <button
            type="button"
            class:primary={button.primary}
            disabled={button.disabled}
            onclick={() => onaction(button.action)}
            data-testid="plugin-button"
            data-action={button.action}>{button.text}</button
          >
        {/each}
      </div>
    {:else if block.t === 'link'}
      <!-- The site it opens is always shown, whatever the text says. -->
      <button type="button" class="link" title={block.href} onclick={() => onlink(block.href)} data-testid="plugin-link"
        >{block.text}<small class="site">{new URL(block.href).hostname}</small></button
      >
    {:else if block.t === 'signin'}
      <button type="button" class="signin" onclick={() => onsignin(block.host)} data-testid="plugin-signin"
        >{block.text ?? `sign in to ${block.host}`}</button
      >
    {:else if block.t === 'notice'}
      <p class="notice tone-{block.tone ?? 'dim'}">{block.text}</p>
    {:else if block.t === 'divider'}
      <hr class="hud-dashed" />
    {/if}
  {/each}
</div>

<style>
.blocks {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 0;
  padding: var(--space-1);
  container-type: inline-size;
  font-family: var(--font-ui);
  font-size: var(--step-0);
  color: var(--text);
}

.blocks :global(.tone-ok) {
  --tone: var(--ok);
  color: var(--ok);
}
.blocks :global(.tone-warn) {
  --tone: var(--warn);
  color: var(--warn);
}
.blocks :global(.tone-danger) {
  --tone: var(--danger);
  color: var(--danger);
}
.blocks :global(.tone-dim) {
  --tone: var(--text-muted);
  color: var(--text-muted);
}
.blocks :global(.tone-accent) {
  --tone: var(--accent-strong);
  color: var(--accent-strong);
}

.heading,
.label,
dt,
th,
.bar-caption {
  font-family: var(--font-ui);
  font-size: var(--step--1);
  font-weight: 300;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.heading {
  margin: 0;
  color: var(--text);
}

.text {
  margin: 0;
  overflow-wrap: anywhere;
}
.text.size-sm {
  font-size: var(--step--1);
}
.text.size-lg {
  font-family: var(--font-display);
  font-size: var(--step-1);
}

.big {
  display: flex;
  flex-direction: column;
  line-height: 1;
}
.big .value {
  font-family: var(--font-display);
  font-size: clamp(var(--step-2), 18cqi, var(--step-4));
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}
.big small {
  margin-left: 0.2em;
  font-size: 0.4em;
  color: var(--text-muted);
}

.rows {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.15rem var(--space-3);
  margin: 0;
}
dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-caption {
  display: flex;
  justify-content: space-between;
}

/* A VFD meter: lit cells in the tone, unlit ones a faint ghost of the accent. */
.cells {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 2px;
  height: 0.55rem;
}
.cell {
  background: var(--accent-faint);
}
.cell.on {
  background: var(--tone, var(--accent));
  box-shadow: 0 0 calc(var(--glow) * 0.4rem) var(--tone, var(--accent));
}

.meter {
  position: relative;
  height: 0.4rem;
  border-right: 1px solid var(--panel-border);
}
.meter::before {
  content: '';
  position: absolute;
  inset: 50% 0 auto;
  height: 1px;
  background: var(--accent-dim);
}
.fill {
  position: absolute;
  inset: 25% 0;
  background: var(--tone, var(--accent));
  transform-origin: left;
}

.steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.marks {
  display: flex;
  gap: 0.35rem;
}
.mark {
  width: 0.5rem;
  height: 0.5rem;
  border: 1px solid var(--tone, var(--accent));
  transform: rotate(45deg);
}
.mark.on {
  background: var(--tone, var(--accent));
}

.spark svg {
  display: block;
  width: 100%;
  height: 1.5rem;
}
.spark polyline {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}

.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--step--1);
}
th,
td {
  padding: 0.1rem 0.3rem;
  text-align: left;
  white-space: nowrap;
}
td {
  border-top: 1px dashed var(--panel-rule);
}
.right {
  text-align: right;
}

.list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.list li {
  border-top: 1px dashed var(--panel-rule);
}
.list li > button,
.list li > span {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  padding: 0.15rem 0.2rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}
.list li > button {
  cursor: pointer;
}
.list li > button:hover {
  background: var(--accent-faint);
}
.list small {
  color: var(--text-muted);
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.buttons button,
.signin {
  padding: 0.15rem 0.7rem;
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}
.buttons button:hover:not(:disabled),
.signin:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}
.buttons button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}
.buttons button.primary:hover {
  background: var(--accent-strong);
  color: var(--text-inverse);
}
.buttons button:disabled {
  opacity: 0.4;
  cursor: default;
}

.link {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent-strong);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.link .site {
  margin-left: 0.4em;
  color: var(--text-muted);
  text-decoration: none;
  display: inline-block;
}

.notice {
  margin: 0;
  padding-left: var(--space-2);
  border-left: 2px solid var(--tone, var(--text-muted));
  font-size: var(--step--1);
  overflow-wrap: anywhere;
}

hr {
  width: 100%;
  margin: 0;
  border: 0;
}
</style>
