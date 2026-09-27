import {
  type ContainerState,
  type DockerAction,
  type DockerBoard,
  type DockerContainer,
  type DockerControlResult,
  type DockerFilter,
  type DockerLink,
  formatBytes,
  formatCpu,
  portLabel,
  statusAge,
} from '@shared/docker'
import type { CardRow } from '../../lib/hover-card.ts'

/**
 * What the DOCKER pane says, decided apart from how it is drawn: the words, the
 * tones, the card's rows and the pane's own choices. Pure, so a unit test reads
 * every case.
 */

export type Tone = 'ok' | 'info' | 'warn' | 'danger' | 'muted'

/** The pane's choices, kept in pane state: the filter, and the Compose projects folded. */
export interface DockerPaneState {
  filter: DockerFilter
  /** Folded projects; '' is the group of containers of their own. */
  folded: string[]
}

export function readDockerPane(state: Record<string, unknown> | undefined): DockerPaneState {
  const folded = Array.isArray(state?.folded)
    ? state.folded.filter((name): name is string => typeof name === 'string' && name.length <= 64)
    : []
  return { filter: state?.filter === 'running' ? 'running' : 'all', folded: folded.slice(0, 100) }
}

/** The key a group is folded under. */
export function groupKey(project: string | null): string {
  return project ?? ''
}

const STATE_WORDS: Record<ContainerState, string> = {
  running: 'UP',
  paused: 'PAUSED',
  restarting: 'RESTARTING',
  created: 'CREATED',
  exited: 'EXITED',
  dead: 'DEAD',
  removing: 'REMOVING',
  unknown: 'UNKNOWN',
}

/**
 * The state a row says, in one word: the health in place of UP when the image
 * has a check, and the code beside EXITED when it did not end well.
 */
export function stateWord(container: DockerContainer): string {
  if (container.state === 'running' && container.health !== null)
    return container.health === 'healthy'
      ? 'HEALTHY'
      : container.health === 'unhealthy'
        ? 'UNHEALTHY'
        : 'STARTING'
  if (container.state === 'exited' && container.exitCode !== null && container.exitCode !== 0)
    return `EXITED ${container.exitCode}`
  return STATE_WORDS[container.state]
}

export function stateTone(container: DockerContainer): Tone {
  switch (container.state) {
    case 'running':
      return container.health === 'unhealthy'
        ? 'warn'
        : container.health === 'starting'
          ? 'info'
          : 'ok'
    case 'paused':
      return 'info'
    case 'restarting':
      return 'warn'
    case 'dead':
      return 'danger'
    case 'exited':
      return container.exitCode !== null && container.exitCode !== 0 ? 'warn' : 'muted'
    default:
      return 'muted'
  }
}

/** How long it has been up, or since it ended, from the engine's own words. */
export function ageOf(container: DockerContainer): string | null {
  return statusAge(container.status)
}

/** What the row says while a press is on its way. */
export const PENDING_WORDS: Record<DockerAction, string> = {
  start: 'STARTING…',
  stop: 'STOPPING…',
  restart: 'RESTARTING…',
  pause: 'PAUSING…',
  unpause: 'RESUMING…',
}

/** The buttons' words; a press that asks twice says the second time what it will do. */
export const ACTION_WORDS: Record<DockerAction, string> = {
  start: 'START',
  stop: 'STOP',
  restart: 'RESTART',
  pause: 'PAUSE',
  unpause: 'RESUME',
}

export const ACTION_GLYPHS: Record<DockerAction, string> = {
  start: '▶',
  stop: '■',
  restart: '↻',
  pause: '❚❚',
  unpause: '▶',
}

/** Why a press was not done, for the pane's foot. */
export function controlProblem(
  result: DockerControlResult,
  action: DockerAction,
  name: string,
): string | null {
  const what = `${ACTION_WORDS[action].toLowerCase()} ${name}`
  switch (result) {
    case 'ok':
      return null
    case 'not-found':
      return `${what}: the engine no longer has it`
    case 'refused':
      return `${what}: refused - it is not in a state that takes it`
    case 'no-daemon':
      return `${what}: the engine is not there`
    case 'denied':
      return `${what}: this user may not`
    case 'unsupported':
      return `${what}: the pane is not linked`
    default:
      return `${what}: the engine did not do it`
  }
}

export interface LinkView {
  word: string
  tone: Tone
}

const LINK_VIEWS: Record<DockerLink, LinkView> = {
  standby: { word: 'STANDBY', tone: 'muted' },
  linking: { word: 'LINKING', tone: 'muted' },
  linked: { word: 'LINKED', tone: 'ok' },
  'no-daemon': { word: 'NO DAEMON', tone: 'warn' },
  denied: { word: 'DENIED', tone: 'danger' },
  unsupported: { word: 'UNSUPPORTED', tone: 'warn' },
  error: { word: 'LINK ERROR', tone: 'warn' },
}

export function linkView(link: DockerLink): LinkView {
  return LINK_VIEWS[link]
}

/** What to do about a link that is down, said under its word. */
export function linkHint(board: DockerBoard, platform: string): string | null {
  switch (board.link) {
    case 'no-daemon':
      return platform === 'linux'
        ? 'start the docker service, or Docker Desktop'
        : 'start Docker Desktop: the pane links when the engine answers'
    case 'denied':
      return platform === 'linux'
        ? 'add this user to the docker group, then sign in again'
        : 'this user may not open the engine socket'
    default:
      return null
  }
}

/** The facts of a container the row has no room for, for its card; `time` writes a moment. */
export function containerRows(container: DockerContainer, time: (at: number) => string): CardRow[] {
  const rows: CardRow[] = [{ label: 'image', value: container.image }]
  if (container.project !== null)
    rows.push({
      label: 'compose',
      value:
        container.service === null
          ? container.project
          : `${container.project} · service ${container.service}`,
    })
  if (container.composeDir !== null) rows.push({ label: 'folder', value: container.composeDir })
  rows.push({ label: 'status', value: container.status || stateWord(container).toLowerCase() })
  const published = container.ports.map(
    (port) =>
      `${port.ip === null ? '' : `${port.ip.includes(':') ? `[${port.ip}]` : port.ip}:`}${portLabel(port)}`,
  )
  if (published.length > 0) rows.push({ label: 'ports', value: published.join('  ') })
  if (container.cpu !== null) rows.push({ label: 'cpu', value: formatCpu(container.cpu) })
  if (container.mem !== null)
    rows.push({
      label: 'memory',
      value:
        container.memLimit === null
          ? formatBytes(container.mem)
          : `${formatBytes(container.mem)} of ${formatBytes(container.memLimit)}`,
    })
  if (container.created > 0) rows.push({ label: 'created', value: time(container.created) })
  rows.push({ label: 'id', value: container.id, muted: true })
  return rows
}

/** A fill for a figure's bar, 0 to 1: CPU against one core, memory against its limit. */
export function cpuFill(cpu: number | null): number {
  return cpu === null ? 0 : Math.max(0, Math.min(1, cpu / 100))
}

export function memFill(container: DockerContainer): number {
  if (container.mem === null || container.memLimit === null || container.memLimit <= 0) return 0
  return Math.max(0, Math.min(1, container.mem / container.memLimit))
}
