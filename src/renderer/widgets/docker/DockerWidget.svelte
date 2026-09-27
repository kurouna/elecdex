<script lang="ts">
import {
  asksTwice,
  type ContainerGroup,
  type DockerAction,
  type DockerBoard,
  type DockerContainer,
  dockerCounts,
  execCommand,
  filterContainers,
  groupContainers,
} from '@shared/docker'
import { flip } from 'svelte/animate'
import { carryFresh, FreshTracker } from '../../lib/fresh.ts'
import { anchorOf, type CardAnchor, type CardSize, HoverRest } from '../../lib/hover-card.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import ContainerCard from './ContainerCard.svelte'
import ContainerRow from './ContainerRow.svelte'
import { controlProblem, groupKey, linkHint, linkView, readDockerPane } from './docker-view.ts'

/**
 * The local Docker engine's containers (architecture.md §5.17).
 *
 * Main follows the engine only while a pane like this is seen - one event
 * stream, and the list read after each change and every ten seconds - so this
 * one subscribes only then: behind another tab or with the window put away,
 * nothing is asked of the engine. The page knows a container by its short id,
 * and presses go to main by that id; main passes on only what the container's
 * state takes. Nothing here removes or kills a container.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))
const choices = $derived(readDockerPane(paneState))
const platform = window.elecdex.system.platform

let board = $state.raw<DockerBoard | null>(null)

/** Containers that arrived while the pane was watching, lit until their highlight ends. */
let fresh = $state.raw<ReadonlySet<string>>(new Set())
const tracker = new FreshTracker()

function receive(next: DockerBoard): void {
  // A board before any listing (the engine not yet linked) says nothing of what is known: taken
  // as the first reading, it would make every container of the first list new.
  if (next.sampledAt > 0) {
    const ids = next.containers.map((container) => container.id)
    fresh = carryFresh(fresh, tracker.next(ids), ids)
  }
  board = next
}

$effect(() => (visible ? window.elecdex.docker.subscribe(receive) : undefined))

const containers = $derived(board?.containers ?? [])
const counts = $derived(dockerCounts(containers))
const groups = $derived(groupContainers(filterContainers(containers, choices.filter)))
/** Headed by project only when there is a project: a list of loose containers needs no heading. */
const headed = $derived(groups.some((group) => group.project !== null))
const link = $derived(linkView(board?.link ?? 'standby'))

$effect(() => {
  const b = board
  const badge =
    b?.link === 'no-daemon'
      ? { badge: 'no daemon', badgeKind: 'warn' as const }
      : b?.link === 'denied'
        ? { badge: 'denied', badgeKind: 'danger' as const }
        : counts.unhealthy > 0
          ? { badge: `${counts.unhealthy} unhealthy`, badgeKind: 'warn' as const }
          : {}
  paneMeta.set(paneId, {
    subtitle: `${counts.up} up · ${containers.length} ${containers.length === 1 ? 'container' : 'containers'}`,
    ...badge,
  })
})

function setFilter(filter: 'all' | 'running'): void {
  widgetState.patch(paneId, { filter: filter === 'all' ? undefined : filter })
}

function toggleFold(group: ContainerGroup): void {
  const key = groupKey(group.project)
  const folded = choices.folded.includes(key)
    ? choices.folded.filter((name) => name !== key)
    : [...choices.folded, key]
  sfx.play(folded.includes(key) ? 'collapse' : 'expand')
  widgetState.patch(paneId, { folded: folded.length === 0 ? undefined : folded })
}

/* ---- Presses ---- */

let pending = $state.raw<Readonly<Record<string, DockerAction>>>({})
let armed = $state.raw<{ id: string; action: DockerAction } | null>(null)
let armTimer: ReturnType<typeof setTimeout> | undefined
let problem = $state<string | null>(null)

async function press(container: DockerContainer, action: DockerAction): Promise<void> {
  clearTimeout(armTimer)
  if (asksTwice(action) && (armed?.id !== container.id || armed.action !== action)) {
    armed = { id: container.id, action }
    armTimer = setTimeout(() => {
      armed = null
    }, 3000)
    return
  }
  armed = null
  sfx.play(action === 'start' || action === 'unpause' ? 'expand' : 'collapse')
  pending = { ...pending, [container.id]: action }
  const result = await window.elecdex.docker.control(container.id, action)
  const { [container.id]: _, ...rest } = pending
  pending = rest
  problem = controlProblem(result, action, container.name)
  if (result !== 'ok') sfx.play('glitch')
}

/** The row just copied from, and what, said for a moment. */
let copied = $state.raw<{ id: string; what: 'name' | 'exec' } | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copy(container: DockerContainer, what: 'name' | 'exec'): Promise<void> {
  const text = what === 'name' ? container.name : execCommand(container)
  if (text === null) return
  // Through main, as the utility pane copies: the tests' stand-in clipboard catches it.
  if (!(await window.elecdex.utility.copy({ kind: 'text', text }))) {
    problem = 'the clipboard is busy: try again'
    return
  }
  sfx.play('folder')
  copied = { id: container.id, what }
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied = null
  }, 1500)
}

function open(url: string): void {
  sfx.play('panel')
  void window.elecdex.system.openExternal(url)
}

$effect(() => () => {
  clearTimeout(armTimer)
  clearTimeout(copiedTimer)
})

function settled(id: string, event: AnimationEvent): void {
  if (event.animationName !== 'fx-fresh' || !fresh.has(id)) return
  fresh = new Set([...fresh].filter((key) => key !== id))
}

/** Up and down move between the names. */
function onListKey(event: KeyboardEvent): void {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  const target = event.target as HTMLElement | null
  if (target?.dataset.testid !== 'docker-name' || rootEl === null) return
  const names = [...rootEl.querySelectorAll<HTMLElement>('[data-testid="docker-name"]')]
  const at = names.indexOf(target)
  const next = names[at + (event.key === 'ArrowDown' ? 1 : -1)]
  if (next === undefined) return
  event.preventDefault()
  next.focus()
}

/* ---- The card ---- */

let rootEl = $state<HTMLElement | null>(null)
let hover = $state.raw<{ id: string; anchor: CardAnchor; bounds: CardSize } | null>(null)
const resting = new HoverRest<string>(() => (hover = null))

function onhover(id: string, event: { row: DOMRect; x: number | null } | null): void {
  if (event === null) {
    resting.leave(id)
    return
  }
  const show = (): void => {
    if (rootEl === null) return
    const box = rootEl.getBoundingClientRect()
    hover = {
      id,
      anchor: anchorOf(box, event.row, event.x),
      bounds: { width: box.width, height: box.height },
    }
  }
  resting.enter(id, show, event.x === null)
}

const hovered = $derived(
  hover === null ? null : (containers.find((container) => container.id === hover?.id) ?? null),
)

$effect(() => {
  if (!visible) resting.leave()
})
$effect(() => () => resting.dispose())

const hint = $derived(board === null ? null : linkHint(board, platform))
const down = $derived(
  board !== null && board.link !== 'linked' && board.link !== 'linking' && containers.length === 0,
)
</script>

<div class="docker" data-testid="docker" data-pane-id={paneId} bind:this={rootEl}>
  <header class="top">
    <span class="link" data-tone={link.tone} data-testid="docker-link"><i></i>{link.word}</span>
    {#if containers.length > 0}
      <span class="count" data-testid="docker-count">
        <b>{counts.up}</b><span class="unit">UP</span>
        {#if counts.down > 0}<span class="sep">·</span><b class="down">{counts.down}</b><span class="unit">DOWN</span>{/if}
      </span>
    {/if}
    <span class="filter" role="group" aria-label="which containers">
      <button
        type="button"
        class="chip"
        class:on={choices.filter === 'all'}
        aria-pressed={choices.filter === 'all'}
        onclick={() => setFilter('all')}
        data-testid="docker-filter-all">ALL</button
      ><button
        type="button"
        class="chip"
        class:on={choices.filter === 'running'}
        aria-pressed={choices.filter === 'running'}
        title="only the containers that are up"
        onclick={() => setFilter('running')}
        data-testid="docker-filter-running">RUN</button
      >
    </span>
  </header>

  {#if board === null || (board.link === 'linking' && containers.length === 0)}
    <p class="empty">…</p>
  {:else if down}
    <div class="empty" data-testid="docker-down">
      <b>{link.word}</b>
      {#if board.problem !== null}<span>{board.problem}</span>{/if}
      {#if hint !== null}<span class="hint">{hint}</span>{/if}
      {#if board.endpoint !== null}<span class="where">at {board.endpoint}</span>{/if}
    </div>
  {:else if containers.length === 0}
    <div class="empty" data-testid="docker-empty">
      <b>NO CONTAINERS</b>
      <span>the engine has none: they appear here as they are made</span>
    </div>
  {:else if groups.length === 0}
    <div class="empty" data-testid="docker-empty">
      <b>NOTHING RUNNING</b>
      <span>{counts.down} {counts.down === 1 ? 'container is' : 'containers are'} down: ALL shows them</span>
    </div>
  {:else}
    <div class="frame">
      <div class="cols">
        <div class="heads" aria-hidden="true">
          <span></span><span>NAME</span><span class="h-image">IMAGE</span><span class="h-ports">PORTS</span><span class="h-fig">CPU</span><span class="h-fig">MEM</span><span class="h-state">STATE</span>
        </div>
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div class="list" role="list" onkeydown={onListKey} onscroll={() => resting.leave()} data-testid="docker-list">
          {#each groups as group (groupKey(group.project))}
            {@const folded = choices.folded.includes(groupKey(group.project))}
            <section class="group" data-testid="docker-group" data-project={group.project ?? ''}>
              {#if headed}
                <button
                  type="button"
                  class="group-head"
                  aria-expanded={!folded}
                  onclick={() => toggleFold(group)}
                  data-testid="docker-group-head"
                >
                  <span class="caret">{folded ? '▸' : '▾'}</span>
                  <span class="project">{group.project ?? 'standalone'}</span>
                  <span class="tally"><b>{group.up}</b>/{group.containers.length} up</span>
                </button>
              {/if}
              {#if !folded}
                <ul>
                  {#each group.containers as container (container.id)}
                    <li
                      class:fx-fresh={fresh.has(container.id)}
                      animate:flip={{ duration: appearance.reducedMotion ? 0 : 280 }}
                      onanimationend={(e) => settled(container.id, e)}
                    >
                      <ContainerRow
                        {container}
                        grouped={headed && group.project !== null}
                        pending={pending[container.id] ?? null}
                        armed={armed?.id === container.id ? armed.action : null}
                        copied={copied?.id === container.id ? copied.what : null}
                        onpress={(action) => void press(container, action)}
                        oncopy={(what) => void copy(container, what)}
                        onopen={open}
                        onhover={(event) => onhover(container.id, event)}
                      />
                    </li>
                  {/each}
                </ul>
              {/if}
            </section>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if hovered !== null && hover !== null}
    <ContainerCard container={hovered} anchor={hover.anchor} bounds={hover.bounds} />
  {/if}

  <footer class="foot" data-testid="docker-foot">
    {#if problem !== null}
      <span class="problem" data-testid="docker-problem">{problem}</span>
    {:else if board?.link === 'error' && board.problem !== null}
      <span class="problem">{board.problem}</span>
    {:else if board?.engine}
      <span data-testid="docker-engine"
        >engine {board.engine.version ?? '?'} · api {board.engine.api}{board.engine.os ? ` · ${board.engine.os}` : ''}{board.endpoint ? ` · ${board.endpoint}` : ''}</span
      >
    {:else}
      <span>linked only while shown</span>
    {/if}
    {#if board?.truncated}
      <span class="truncated" data-testid="docker-truncated">{board.containers.length} of {board.total} shown</span>
    {/if}
  </footer>
</div>

<style>
.docker {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  height: 100%;
  min-height: 0;
  padding: var(--space-1);
  font-family: var(--font-ui);
}

.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: 0.3rem;
  gap: 0.8rem;
  min-width: 0;
}

.link {
  --tone: var(--text-muted);
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  color: var(--tone);
}

.link[data-tone="ok"] {
  --tone: var(--ok);
}

.link[data-tone="warn"] {
  --tone: var(--warn);
}

.link[data-tone="danger"] {
  --tone: var(--danger);
}

.link i {
  width: 0.45rem;
  height: 0.45rem;
  transform: rotate(45deg);
  background: var(--tone);
  box-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--tone);
}

.count {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
}

.count b {
  font-family: var(--font-display);
  font-size: var(--step-0);
  font-weight: 400;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.count b.down {
  color: var(--text-muted);
}

.unit,
.sep {
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
}

.filter {
  display: flex;
  margin-left: auto;
}

.chip {
  padding: 0.1rem 0.45rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  cursor: pointer;
}

.chip + .chip {
  border-left: 0;
}

.chip:hover {
  color: var(--text);
}

.chip.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--text);
}

/* The columns, narrowed in this order: the image, the figures, the ports. */
.frame {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  container: docker / inline-size;
}

.cols {
  --docker-figure: 3.8rem;
  --docker-state: 7.6rem;
  --docker-cols: 0.5rem minmax(5rem, 1.1fr) minmax(0, 1fr) minmax(0, 0.9fr) var(--docker-figure)
    var(--docker-figure) var(--docker-state);
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

@container docker (max-width: 38rem) {
  .cols {
    --docker-cols: 0.5rem minmax(5rem, 1.1fr) minmax(0, 0.9fr) var(--docker-figure)
      var(--docker-figure) var(--docker-state);
    --docker-image: none;
  }
}

@container docker (max-width: 29rem) {
  .cols {
    --docker-cols: 0.5rem minmax(5rem, 1.1fr) minmax(0, 0.9fr) var(--docker-state);
    --docker-image: none;
    --docker-figures: none;
  }
}

@container docker (max-width: 21rem) {
  .cols {
    --docker-cols: 0.5rem minmax(0, 1fr) var(--docker-state);
    --docker-image: none;
    --docker-figures: none;
    --docker-ports: none;
  }
}

.heads {
  display: grid;
  grid-template-columns: var(--docker-cols);
  gap: var(--space-2);
  padding: 0 var(--space-1) 0.15rem 0.3rem;
  border-bottom: 1px solid var(--panel-rule);
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: 0.12em;
}

.h-image {
  display: var(--docker-image, block);
}

.h-ports {
  display: var(--docker-ports, block);
}

.h-fig {
  display: var(--docker-figures, block);
  text-align: right;
}

.h-state {
  text-align: right;
}

.list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.list li + li {
  border-top: 1px solid color-mix(in srgb, var(--panel-rule) 50%, transparent);
}

.group-head {
  display: flex;
  width: 100%;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.35rem;
  padding: 0.1rem 0.3rem;
  border: 0;
  border-bottom: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  text-align: left;
  cursor: pointer;
}

.group:first-child .group-head {
  margin-top: 0.15rem;
}

.group-head:hover .project {
  color: var(--accent);
}

.group-head:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: -1px;
}

.caret {
  width: 0.7rem;
  color: var(--text-muted);
  font-size: var(--step--2);
}

.project {
  font-family: var(--font-display);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.tally {
  margin-left: auto;
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: 0.08em;
}

.tally b {
  color: var(--text);
  font-weight: 400;
}

.empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0;
  color: var(--text-muted);
  font-size: var(--step--1);
  text-align: center;
}

.empty b {
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-weight: 400;
  letter-spacing: var(--tracking-wider);
}

[data-testid="docker-down"] b {
  color: var(--warn);
}

.empty .hint {
  color: var(--text);
}

.empty .where {
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0 var(--space-2);
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: 0.04em;
}

.foot .problem {
  color: var(--warn);
}

.truncated {
  color: var(--text);
}
</style>
