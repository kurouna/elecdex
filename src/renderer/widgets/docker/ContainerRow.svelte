<script lang="ts">
import {
  actionsFor,
  asksTwice,
  type DockerAction,
  type DockerContainer,
  execCommand,
  formatBytes,
  formatCpu,
  portLabel,
  portUrl,
} from '@shared/docker'
import {
  ACTION_GLYPHS,
  ACTION_WORDS,
  ageOf,
  cpuFill,
  memFill,
  PENDING_WORDS,
  stateTone,
  stateWord,
} from './docker-view.ts'

/**
 * One container: its state lamp, its name (the Compose service's, inside its
 * project), its image, its published ports, what it uses, and its state and
 * age. The name copies itself when pressed; a published port opens in the
 * browser. The presses its state takes show on the row under the pointer or
 * the keyboard; stop, restart and pause ask a second time. Resting on it (or
 * the keyboard on its name) asks for the card, which the pane draws.
 */
interface Props {
  container: DockerContainer
  /** Inside a Compose project's group: the service's name says it. */
  grouped: boolean
  /** A press on its way. */
  pending: DockerAction | null
  /** A press waiting for its second time. */
  armed: DockerAction | null
  /** Just copied: which, said for a moment. */
  copied: 'name' | 'exec' | null
  onpress: (action: DockerAction) => void
  oncopy: (what: 'name' | 'exec') => void
  onopen: (url: string) => void
  onhover: (event: { row: DOMRect; x: number | null } | null) => void
}

const { container, grouped, pending, armed, copied, onpress, oncopy, onopen, onhover }: Props =
  $props()

let rowEl = $state<HTMLElement | null>(null)
const hovered = (x: number | null): void => {
  if (rowEl !== null) onhover({ row: rowEl.getBoundingClientRect(), x })
}

const label = $derived(grouped && container.service !== null ? container.service : container.name)
const actions = $derived(actionsFor(container.state))
const age = $derived(ageOf(container))
const published = $derived(container.ports.filter((port) => port.public !== null))
const shownPorts = $derived(published.slice(0, 3))
const exec = $derived(execCommand(container))
const running = $derived(container.state === 'running')
</script>

<div
  class="row"
  data-tone={stateTone(container)}
  data-state={container.state}
  data-testid="docker-row"
  data-id={container.id}
  data-name={container.name}
  role="presentation"
  bind:this={rowEl}
  onpointerenter={(event) => hovered(event.clientX)}
  onpointerleave={() => onhover(null)}
>
  <i class="lamp" aria-hidden="true"></i>
  <button
    type="button"
    class="name"
    title="copy the name"
    onclick={() => oncopy('name')}
    onfocus={(event) => {
      // The keyboard's focus, not the one a click leaves behind: the pointer has its own rest.
      if (event.currentTarget.matches(':focus-visible')) hovered(null)
    }}
    onblur={() => onhover(null)}
    data-testid="docker-name">{copied === 'name' ? 'COPIED' : label}</button
  >
  <span class="image" data-testid="docker-image">{container.image}</span>
  <span class="ports" data-testid="docker-ports">
    {#each shownPorts as port (portLabel(port))}
      {@const url = portUrl(port)}
      {#if url !== null}
        <button type="button" class="port link" title="open {url}" onclick={() => onopen(url)} data-testid="docker-port">{portLabel(port)}</button>
      {:else}
        <span class="port" data-testid="docker-port">{portLabel(port)}</span>
      {/if}
    {/each}
    {#if published.length > shownPorts.length}<span class="more">+{published.length - shownPorts.length}</span>{/if}
  </span>
  <span class="figure cpu" data-testid="docker-cpu">
    {#if running && container.cpu !== null}
      {formatCpu(container.cpu)}<i class="bar" style:--fill={cpuFill(container.cpu)}></i>
    {/if}
  </span>
  <span class="figure mem" data-testid="docker-mem">
    {#if running && container.mem !== null}
      {formatBytes(container.mem)}<i class="bar" style:--fill={memFill(container)}></i>
    {/if}
  </span>
  <span class="state" data-testid="docker-state">
    {#if pending !== null}
      <span class="word pending">{PENDING_WORDS[pending]}</span>
    {:else}
      <span class="word">{stateWord(container)}</span>{#if age !== null}<span class="age">{age}</span>{/if}
    {/if}
  </span>

  <span class="actions" data-testid="docker-actions">
    {#each actions as action (action)}
      <button
        type="button"
        class="act"
        class:armed={armed === action}
        class:danger={asksTwice(action)}
        disabled={pending !== null}
        title={ACTION_WORDS[action].toLowerCase()}
        aria-label="{ACTION_WORDS[action].toLowerCase()} {container.name}"
        onclick={() => onpress(action)}
        data-testid="docker-{action}"
        >{#if armed === action}{ACTION_WORDS[action]}?{:else}<span class="glyph">{ACTION_GLYPHS[action]}</span>{/if}</button
      >
    {/each}
    {#if exec !== null}
      <button
        type="button"
        class="act"
        title="copy: {exec}"
        aria-label="copy the command that opens a shell in {container.name}"
        onclick={() => oncopy('exec')}
        data-testid="docker-exec">{copied === 'exec' ? 'COPIED' : '›_'}</button
      >
    {/if}
  </span>
</div>

<style>
.row {
  --tone: var(--text-muted);
  position: relative;
  display: grid;
  /* The columns are the pane's (DockerWidget), so its heads line up and narrow with the rows. */
  grid-template-columns: var(--docker-cols);
  gap: var(--space-2);
  align-items: center;
  min-height: 1.7rem;
  padding: 0.15rem var(--space-1) 0.15rem 0.3rem;
  font-size: var(--step--1);
}

.row[data-tone="ok"] {
  --tone: var(--ok);
}

.row[data-tone="info"] {
  --tone: var(--info);
}

.row[data-tone="warn"] {
  --tone: var(--warn);
}

.row[data-tone="danger"] {
  --tone: var(--danger);
}

.row:hover {
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

.lamp {
  width: 0.42rem;
  height: 0.42rem;
  transform: rotate(45deg);
  border: 1px solid var(--tone);
}

/* Up: the lamp is lit; down: only its outline. */
.row[data-state="running"] .lamp,
.row[data-state="restarting"] .lamp {
  background: var(--tone);
  box-shadow: 0 0 calc(var(--glow) * 0.4rem) var(--tone);
}

.name {
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  text-align: left;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: copy;
}

.row[data-state="exited"] .name,
.row[data-state="created"] .name,
.row[data-state="dead"] .name {
  color: var(--text-muted);
}

.name:hover {
  color: var(--accent);
}

.name:focus-visible,
.act:focus-visible,
.port.link:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 1px;
}

.image {
  display: var(--docker-image, block);
  overflow: hidden;
  color: var(--text-muted);
  font-family: var(--font-mono);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ports {
  display: var(--docker-ports, flex);
  overflow: hidden;
  gap: 0.45rem;
  font-family: var(--font-mono);
  white-space: nowrap;
}

.port {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
}

.port.link {
  color: var(--text);
  cursor: pointer;
}

.port.link:hover {
  color: var(--accent);
  text-decoration: underline;
}

.more {
  color: var(--text-muted);
}

.figure {
  display: var(--docker-figures, block);
  position: relative;
  padding-bottom: 0.2rem;
  color: var(--text);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.bar {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  /* A faint track, so the figures do not read as underlined. */
  background: color-mix(in srgb, var(--panel-rule) 45%, transparent);
}

.bar::after {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: calc(var(--fill) * 100%);
  background: var(--accent);
}

.state {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
  overflow: hidden;
  white-space: nowrap;
}

.word {
  color: var(--tone);
  letter-spacing: 0.08em;
}

.word.pending {
  color: var(--text);
}

.age {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

/*
 * The presses lie over the figures, beside the state, on the row under the
 * pointer or the keyboard only: the state stays in sight while it changes.
 */
.actions {
  position: absolute;
  top: 0;
  right: calc(var(--docker-state) + var(--space-1) + var(--space-2));
  bottom: 0;
  display: flex;
  gap: 0.25rem;
  align-items: center;
  padding-left: 1.2rem;
  background: linear-gradient(to right, transparent, var(--app-bg) 1rem);
  opacity: 0;
  pointer-events: none;
}

.row:hover .actions,
.row:focus-within .actions {
  opacity: 1;
  pointer-events: auto;
}

.act {
  min-width: 1.6rem;
  padding: 0 0.35rem;
  border: 1px solid var(--panel-rule);
  background: var(--app-bg);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.08em;
  line-height: 1.35;
  cursor: pointer;
}

.act:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.act.danger:hover:not(:disabled) {
  border-color: var(--warn);
  color: var(--warn);
}

.act.armed {
  border-color: var(--danger);
  color: var(--danger);
}

.act:disabled {
  opacity: 0.45;
  cursor: default;
}

.glyph {
  display: inline-block;
  min-width: 0.8rem;
  text-align: center;
}
</style>
