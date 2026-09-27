/**
 * The DOCKER pane (architecture.md §5.17): the containers of the local Docker
 * engine - their state, name, image, published ports, Compose project, health
 * and what they use - and the few presses that start, stop, restart, pause and
 * unpause one. Main talks to the engine (main/docker/), only while a pane is
 * seen, and owns the decisions below; the page only draws them.
 *
 * Pure, and shared by main (reading what the engine answered) and the page
 * (grouping, filtering, how a figure is written).
 */

export const CONTAINER_STATES = [
  'running',
  'paused',
  'restarting',
  'created',
  'exited',
  'dead',
  'removing',
  'unknown',
] as const
export type ContainerState = (typeof CONTAINER_STATES)[number]

export type ContainerHealth = 'healthy' | 'unhealthy' | 'starting'

export interface DockerPort {
  /** The host address it is published on, when it is not every address. */
  ip: string | null
  /** The container's port. */
  private: number
  /** The host's port, or null when the port is exposed but not published. */
  public: number | null
  proto: 'tcp' | 'udp' | 'sctp'
}

export interface DockerContainer {
  /** The short id, twelve hex digits, as `docker ps` writes it. */
  id: string
  name: string
  image: string
  state: ContainerState
  /** The engine's own words ("Up 2 hours (healthy)"), cut: the card says it. */
  status: string
  health: ContainerHealth | null
  /** The code it exited with, for an exited one. */
  exitCode: number | null
  ports: DockerPort[]
  /** Compose's project and service, from its labels; null for a container of its own. */
  project: string | null
  service: string | null
  /** The folder the Compose project was started in, from its label. */
  composeDir: string | null
  /** When it was made (epoch ms). */
  created: number
  /** Percent of one core's worth times the cores, as `docker stats` says it; null until measured. */
  cpu: number | null
  /** Bytes in use (less the file cache, as `docker stats` counts it), and its limit. */
  mem: number | null
  memLimit: number | null
}

/**
 * The link to the engine. `standby`: no pane is seen, so nothing is asked;
 * `linking`: the first answer is on its way; `no-daemon`: nothing answers at the
 * address (Docker is not running, or not installed); `denied`: the socket is
 * there and this user may not open it; `unsupported`: an address the pane will
 * not use (a remote engine, TLS, ssh) or an engine too old.
 */
export type DockerLink =
  | 'standby'
  | 'linking'
  | 'linked'
  | 'no-daemon'
  | 'denied'
  | 'unsupported'
  | 'error'

export interface DockerEngineInfo {
  version: string | null
  /** The API version spoken, the lower of the engine's and the newest this pane knows. */
  api: string
  os: string | null
}

export interface DockerBoard {
  /** Whether main is linked or trying to link now (a pane is seen). */
  watching: boolean
  link: DockerLink
  /** What went wrong, in a few words, when the link is not up; never a secret. */
  problem: string | null
  /** Where the engine is looked for: the context's name, or the address. */
  endpoint: string | null
  engine: DockerEngineInfo | null
  /** Up to `MAX_CONTAINERS`; the last listing stays while unseen or unlinked. */
  containers: DockerContainer[]
  /** How many the engine has, beyond those listed. */
  total: number
  truncated: boolean
  /** When the list was read (epoch ms), or 0 before it ever was. */
  sampledAt: number
}

/** What the pane can ask of a container: nothing that removes or kills. */
export const DOCKER_ACTIONS = ['start', 'stop', 'restart', 'pause', 'unpause'] as const
export type DockerAction = (typeof DOCKER_ACTIONS)[number]

/** How a press ended: said beside the row when it was not done. */
export type DockerControlResult =
  | 'ok'
  | 'not-found'
  | 'refused'
  | 'no-daemon'
  | 'denied'
  | 'failed'
  | 'unsupported'

/**
 * The list is read again at the next quarter second after the engine says a
 * container changed (a stop and a die come together, and a Compose project
 * brings a dozen at once: they are read as one), and every ten seconds to put
 * right what an event cannot say - "Up 2 minutes" going on to 3 - and to link
 * again when the engine went away (user decision 2026-09-27: events and ten
 * seconds, not a poll every second).
 */
export const DOCKER_SETTLE_MS = 250
export const DOCKER_RECONCILE_MS = 10_000
/** What the running containers use is read every five seconds, on its own grid. */
export const DOCKER_STATS_MS = 5000
/** A read the engine has not answered in this long counts as no answer. */
export const DOCKER_TIMEOUT_MS = 2000
/** A stop waits for the container's own grace (ten seconds by default), and a restart for both. */
export const DOCKER_CONTROL_TIMEOUT_MS = 35_000
export const DOCKER_STOP_GRACE_S = 10

export const MAX_CONTAINERS = 100
export const MAX_NAME_CHARS = 64
export const MAX_IMAGE_CHARS = 160
export const MAX_STATUS_CHARS = 80
export const MAX_PATH_CHARS = 260
export const MAX_PORTS = 32
/** How many running containers have their use read, and how many at a time. */
export const MAX_STATS = 24
export const STATS_PARALLEL = 4
/** No answer from the engine is taken past this size. */
export const MAX_RESPONSE_BYTES = 4 * 1024 * 1024

/** The API version asked for is the engine's, up to this; below the least, the engine is too old. */
export const DOCKER_API_MAX = '1.47'
export const DOCKER_API_MIN = '1.24'
/** `one-shot` stats (a reading without the engine's second's wait) came with this version. */
export const DOCKER_API_ONE_SHOT = '1.41'

export const EMPTY_DOCKER_BOARD: DockerBoard = {
  watching: false,
  link: 'standby',
  problem: null,
  endpoint: null,
  engine: null,
  containers: [],
  total: 0,
  truncated: false,
  sampledAt: 0,
}

export function isDockerAction(value: unknown): value is DockerAction {
  return typeof value === 'string' && (DOCKER_ACTIONS as readonly string[]).includes(value)
}

/** A short id as the page knows a container. */
export function isShortId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{12}$/.test(value)
}

/** The presses that make sense for a container in `state`, in the order the row shows them. */
export function actionsFor(state: ContainerState): DockerAction[] {
  switch (state) {
    case 'running':
      return ['pause', 'restart', 'stop']
    case 'paused':
      return ['unpause', 'stop']
    case 'restarting':
      return ['stop']
    case 'created':
    case 'exited':
      return ['start']
    default:
      return []
  }
}

/** Presses that end or interrupt what a container is doing ask once more. */
export function asksTwice(action: DockerAction): boolean {
  return action === 'stop' || action === 'restart' || action === 'pause'
}

/** Up: running, or held there (paused, restarting) - what the RUN filter keeps. */
export function isUp(state: ContainerState): boolean {
  return state === 'running' || state === 'paused' || state === 'restarting'
}

/** A text to show, control characters made spaces, cut to `max` characters. */
export function cutText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.replace(/[\p{Cc}\p{Cf}]+/gu, ' ').trim()
  if (text === '') return null
  const chars = [...text]
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join('')}…`
}

function readState(value: unknown): ContainerState {
  return typeof value === 'string' && (CONTAINER_STATES as readonly string[]).includes(value)
    ? (value as ContainerState)
    : 'unknown'
}

/** The health the engine writes into the status: "(healthy)", "(unhealthy)", "(health: starting)". */
export function readHealth(status: string): ContainerHealth | null {
  if (/\(unhealthy\)/i.test(status)) return 'unhealthy'
  if (/\(healthy\)/i.test(status)) return 'healthy'
  if (/\(health: starting\)/i.test(status)) return 'starting'
  return null
}

/** The exit code in "Exited (137) 3 minutes ago". */
export function readExitCode(status: string): number | null {
  const match = /^Exited \((-?\d{1,4})\)/i.exec(status)
  return match?.[1] === undefined ? null : Number(match[1])
}

const UNITS: readonly (readonly [RegExp, string])[] = [
  [/^seconds?$/, 's'],
  [/^minutes?$/, 'm'],
  [/^hours?$/, 'h'],
  [/^days?$/, 'd'],
  [/^weeks?$/, 'w'],
  [/^months?$/, 'mo'],
  [/^years?$/, 'y'],
]

/**
 * How long, in the few letters a row has room for: "Up 2 hours" is 2h,
 * "Exited (0) 3 minutes ago" 3m, "Up About a minute" 1m, "Up Less than a
 * second" <1s. Null when the status says no time ("Created").
 */
export function statusAge(status: string): string | null {
  const match =
    /^(?:Up|Exited \(-?\d+\)|Restarting \(-?\d+\)|Dead|Removal In Progress)\s+(.+?)(?:\s+ago)?(?:\s+\(.*\))?$/i.exec(
      status,
    )
  const span = match?.[1]?.toLowerCase()
  if (span === undefined) return null
  if (span.startsWith('less than a second')) return '<1s'
  const about = /^about an? (\w+)$/.exec(span)
  const count = about ? 1 : Number(/^(\d+)\s/.exec(span)?.[1] ?? Number.NaN)
  const word = about ? about[1] : /^\d+\s+(\w+)$/.exec(span)?.[1]
  if (word === undefined || !Number.isFinite(count)) return null
  const unit = UNITS.find(([pattern]) => pattern.test(word))?.[1]
  return unit === undefined ? null : `${count}${unit}`
}

function portNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 65_535
    ? value
    : null
}

/** Every address, in either family: said by leaving the address out. */
const ANY_ADDRESS = new Set(['0.0.0.0', '::', ''])

/**
 * The published and exposed ports, each once: the engine lists a port published
 * on every address twice, once per family (0.0.0.0 and ::). A specific address
 * (127.0.0.1) is kept. Published ones first, by the host's port.
 */
export function tidyPorts(raw: unknown): DockerPort[] {
  if (!Array.isArray(raw)) return []
  const ports = new Map<string, DockerPort>()
  for (const item of raw) {
    const port = readPort(item)
    if (port === null) continue
    const key = `${port.ip ?? '*'}|${port.public ?? '-'}|${port.private}|${port.proto}`
    if (!ports.has(key)) ports.set(key, port)
  }
  return [...ports.values()].sort(byPort).slice(0, MAX_PORTS)
}

function readPort(item: unknown): DockerPort | null {
  if (typeof item !== 'object' || item === null) return null
  const { IP, PrivatePort, PublicPort, Type } = item as Record<string, unknown>
  const inside = portNumber(PrivatePort)
  if (inside === null) return null
  return {
    ip: typeof IP === 'string' && !ANY_ADDRESS.has(IP) ? IP.slice(0, 45) : null,
    private: inside,
    public: portNumber(PublicPort),
    proto: Type === 'udp' || Type === 'sctp' ? Type : 'tcp',
  }
}

const byPort = (a: DockerPort, b: DockerPort): number =>
  (a.public === null ? 1 : 0) - (b.public === null ? 1 : 0) ||
  (a.public ?? a.private) - (b.public ?? b.private) ||
  a.private - b.private ||
  a.proto.localeCompare(b.proto)

/** A port as a row writes it: 8080→80, 53→53/udp, or just 80 when it is not published. */
export function portLabel(port: DockerPort): string {
  const proto = port.proto === 'tcp' ? '' : `/${port.proto}`
  return port.public === null ? `${port.private}${proto}` : `${port.public}→${port.private}${proto}`
}

/** Where a published TCP port answers on this machine, for the browser; null otherwise. */
export function portUrl(port: DockerPort): string | null {
  if (port.public === null || port.proto !== 'tcp') return null
  const host = port.ip === null || port.ip === '127.0.0.1' ? 'localhost' : port.ip
  // Only this machine's own addresses: a port published on another interface is still local,
  // but an address the page cannot check is not opened.
  if (host !== 'localhost' && host !== '::1') return null
  return `http://${host === '::1' ? '[::1]' : host}:${port.public}/`
}

function label(labels: unknown, key: string, max: number): string | null {
  return cutText(field(labels, key), max)
}

/** The first of a container's names, without the slash the engine puts before it. */
function firstName(names: unknown): string | null {
  const first = (Array.isArray(names) ? names : []).find(
    (name): name is string => typeof name === 'string',
  )
  return cutText(first?.replace(/^\//, ''), MAX_NAME_CHARS)
}

/** An image since removed or retagged is named by its digest: its short form is enough. */
function imageName(image: unknown): string {
  const name = typeof image === 'string' ? image : ''
  return cutText(name.startsWith('sha256:') ? name.slice(7, 19) : name, MAX_IMAGE_CHARS) ?? ''
}

/** One container of the engine's list, as the page is given it, with the full id main keeps. */
export interface ListedContainer {
  fullId: string
  container: DockerContainer
}

/**
 * One item of `GET /containers/json`, read into what the pane shows - and only
 * that: of the labels only Compose's project, service and folder are read, and
 * neither the command nor the mounts are, since either may carry a secret.
 */
export function readContainer(raw: unknown): ListedContainer | null {
  if (typeof raw !== 'object' || raw === null) return null
  const item = raw as Record<string, unknown>
  const fullId = typeof item.Id === 'string' && /^[0-9a-f]{64}$/.test(item.Id) ? item.Id : null
  if (fullId === null) return null
  const labels = field(item, 'Labels')
  const status = cutText(item.Status, MAX_STATUS_CHARS) ?? ''
  const state = readState(item.State)
  return {
    fullId,
    container: {
      id: fullId.slice(0, 12),
      name: firstName(item.Names) ?? fullId.slice(0, 12),
      image: imageName(item.Image),
      state,
      status,
      health: readHealth(status),
      exitCode: state === 'exited' ? readExitCode(status) : null,
      ports: tidyPorts(item.Ports),
      project: label(labels, 'com.docker.compose.project', MAX_NAME_CHARS),
      service: label(labels, 'com.docker.compose.service', MAX_NAME_CHARS),
      composeDir: label(labels, 'com.docker.compose.project.working_dir', MAX_PATH_CHARS),
      created:
        typeof item.Created === 'number' && Number.isFinite(item.Created) ? item.Created * 1000 : 0,
      cpu: null,
      mem: null,
      memLimit: null,
    },
  }
}

export interface Listing {
  listed: ListedContainer[]
  total: number
  truncated: boolean
}

/**
 * The engine's list, read. Past `MAX_CONTAINERS` the ones kept are those up,
 * then the newest: a machine with hundreds of old exited containers still shows
 * what is running.
 */
export function readListing(raw: unknown, limit: number = MAX_CONTAINERS): Listing {
  const all = (Array.isArray(raw) ? raw : [])
    .map(readContainer)
    .filter((item): item is ListedContainer => item !== null)
  if (all.length <= limit) return { listed: all, total: all.length, truncated: false }
  const kept = [...all]
    .sort(
      (a, b) =>
        Number(isUp(b.container.state)) - Number(isUp(a.container.state)) ||
        b.container.created - a.container.created,
    )
    .slice(0, limit)
  return { listed: kept, total: all.length, truncated: true }
}

export interface ContainerGroup {
  /** The Compose project, or null for the containers of their own. */
  project: string | null
  containers: DockerContainer[]
  up: number
}

const byName = (a: DockerContainer, b: DockerContainer): number =>
  (a.service ?? a.name).localeCompare(b.service ?? b.name) || a.name.localeCompare(b.name)

/**
 * The containers as the pane lays them out: by Compose project, the projects by
 * name and the containers of their own last, each by service and name. Never
 * by state: a row does not move when its container stops, so the one just
 * pressed stays under the pointer.
 */
export function groupContainers(containers: readonly DockerContainer[]): ContainerGroup[] {
  const groups = new Map<string | null, DockerContainer[]>()
  for (const container of containers) {
    const list = groups.get(container.project) ?? []
    list.push(container)
    groups.set(container.project, list)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a.localeCompare(b)))
    .map(([project, list]) => {
      const sorted = [...list].sort(byName)
      return { project, containers: sorted, up: sorted.filter((c) => isUp(c.state)).length }
    })
}

export type DockerFilter = 'all' | 'running'

export function filterContainers(
  containers: readonly DockerContainer[],
  filter: DockerFilter,
): DockerContainer[] {
  return filter === 'running' ? containers.filter((c) => isUp(c.state)) : [...containers]
}

/** The counts the header gives: how many are up, and how many are not. */
export function dockerCounts(containers: readonly DockerContainer[]): {
  up: number
  down: number
  unhealthy: number
} {
  let up = 0
  let unhealthy = 0
  for (const container of containers) {
    if (isUp(container.state)) up += 1
    if (container.health === 'unhealthy') unhealthy += 1
  }
  return { up, down: containers.length - up, unhealthy }
}

/** A name the engine accepts is also safe in a command line: nothing a shell acts on. */
const SAFE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/

/** The command that opens a shell in the container, for a terminal; null for a name it cannot hold. */
export function execCommand(container: DockerContainer): string | null {
  return SAFE_NAME.test(container.name) ? `docker exec -it ${container.name} sh` : null
}

/* ---- What a container uses ---- */

/** The figures of one `GET /containers/{id}/stats` reading that the pane uses. */
export interface StatsSample {
  cpuTotal: number
  systemTotal: number
  cpus: number
  mem: number | null
  memLimit: number | null
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function field(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined
}

/**
 * The figures of a stats reading. Memory is counted as `docker stats` counts
 * it: the usage less the file cache the kernel can drop (`inactive_file` on
 * cgroup v2, `total_inactive_file` or `cache` on v1).
 */
export function readStats(raw: unknown): StatsSample | null {
  const cpu = field(raw, 'cpu_stats')
  const cpuTotal = num(field(field(cpu, 'cpu_usage'), 'total_usage'))
  if (cpuTotal === null) return null
  const systemTotal = num(field(cpu, 'system_cpu_usage')) ?? 0
  const perCpu = field(field(cpu, 'cpu_usage'), 'percpu_usage')
  const cpus =
    num(field(cpu, 'online_cpus')) ||
    (Array.isArray(perCpu) && perCpu.length > 0 ? perCpu.length : 1)
  const memory = field(raw, 'memory_stats')
  const usage = num(field(memory, 'usage'))
  const detail = field(memory, 'stats')
  const cache =
    num(field(detail, 'inactive_file')) ??
    num(field(detail, 'total_inactive_file')) ??
    num(field(detail, 'cache')) ??
    0
  const limit = num(field(memory, 'limit'))
  return {
    cpuTotal,
    systemTotal,
    cpus,
    mem: usage === null ? null : Math.max(0, usage - (cache < usage ? cache : 0)),
    // A container without a limit reports the host's memory, or a number near 2^63.
    memLimit: limit === null || limit <= 0 || limit > 2 ** 52 ? null : limit,
  }
}

/**
 * The CPU used between two readings, in percent of one core (so up to 100 times
 * the cores), as `docker stats` says it. Null when there is nothing to compare
 * (the first reading, a restart that set the counters back).
 */
export function cpuPercent(before: StatsSample | undefined, after: StatsSample): number | null {
  if (before === undefined) return null
  const used = after.cpuTotal - before.cpuTotal
  const system = after.systemTotal - before.systemTotal
  if (used < 0 || system <= 0) return null
  return Math.min(100 * after.cpus, (used / system) * after.cpus * 100)
}

/** Bytes as a row writes them: 212M, 1.4G, 980K. */
export function formatBytes(bytes: number): string {
  const units = ['B', 'K', 'M', 'G', 'T'] as const
  let value = bytes
  let unit = 0
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(unit > 0 && value < 10 ? 1 : 0)}${units[unit]}`
}

/** A CPU figure as a row writes it: 0.4%, 12%, 230%. */
export function formatCpu(percent: number): string {
  return `${percent < 10 ? percent.toFixed(1) : Math.round(percent)}%`
}

/* ---- Where the engine is ---- */

export type DockerEndpoint =
  | { kind: 'socket'; path: string; label: string }
  | { kind: 'tcp'; host: string; port: number; label: string }

export type EndpointAnswer = { endpoint: DockerEndpoint } | { unsupported: string }

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

/**
 * `DOCKER_HOST` (or a context's address), read. A Unix socket and a Windows
 * named pipe are used as they are; TCP only to this machine and without TLS -
 * a remote engine is someone's server, and TLS wants certificates the pane does
 * not handle. ssh would start a process, and fd:// is for the daemon itself.
 */
export function parseDockerHost(value: string, label: string = value, tls = false): EndpointAnswer {
  const host = value.trim()
  if (host.startsWith('unix://')) {
    const path = host.slice('unix://'.length)
    return path.startsWith('/')
      ? { endpoint: { kind: 'socket', path, label } }
      : { unsupported: 'a unix socket address without a path' }
  }
  if (host.startsWith('npipe://')) {
    const path = host.slice('npipe://'.length).replaceAll('/', '\\')
    return /^\\\\\.\\pipe\\[\w.-]+$/.test(path)
      ? { endpoint: { kind: 'socket', path, label } }
      : { unsupported: 'a named pipe address it cannot read' }
  }
  if (host.startsWith('tcp://') || host.startsWith('http://')) return parseTcp(host, label, tls)
  if (host.startsWith('ssh://')) return { unsupported: 'an engine over ssh' }
  return { unsupported: 'an address it does not use' }
}

function parseTcp(host: string, label: string, tls: boolean): EndpointAnswer {
  let url: URL
  try {
    url = new URL(host.replace(/^tcp:/, 'http:'))
  } catch {
    return { unsupported: 'an address it cannot read' }
  }
  if (!LOOPBACK.has(url.hostname)) return { unsupported: 'an engine on another machine' }
  if (tls) return { unsupported: 'an engine over TLS' }
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  return { endpoint: { kind: 'tcp', host: hostname, port: Number(url.port || 2375), label } }
}

/**
 * Where an engine is usually found when nothing names one, in order: the one
 * Docker Desktop and the daemon make, then the rootless daemon's and Docker
 * Desktop's own on Linux and macOS. Main tries the first socket file that is
 * there; on Windows the pipe is tried as it is.
 */
export function defaultEndpoints(
  platform: string,
  home: string,
  runtimeDir: string | null,
): DockerEndpoint[] {
  if (platform === 'win32') {
    return [{ kind: 'socket', path: '\\\\.\\pipe\\docker_engine', label: 'docker_engine' }]
  }
  const socket = (path: string): DockerEndpoint => ({ kind: 'socket', path, label: path })
  const list: DockerEndpoint[] = []
  if (platform === 'darwin') list.push(socket(`${home}/.docker/run/docker.sock`))
  list.push(socket('/var/run/docker.sock'))
  if (platform !== 'darwin') {
    if (runtimeDir !== null) list.push(socket(`${runtimeDir}/docker.sock`))
    list.push(socket(`${home}/.docker/desktop/docker.sock`))
  }
  return list
}

/** The name of the context the Docker CLI would use: `DOCKER_CONTEXT`, else the config's. */
export function contextName(envContext: string | undefined, config: unknown): string | null {
  const fromEnv = envContext?.trim()
  const chosen = fromEnv || cutText(field(config, 'currentContext'), 200)
  return chosen && chosen !== 'default' ? chosen : null
}

/** A context's address, from its meta.json; null when it has none for Docker. */
export function contextHost(meta: unknown): string | null {
  const host = field(field(field(meta, 'Endpoints'), 'docker'), 'Host')
  return typeof host === 'string' && host !== '' ? host : null
}

/* ---- Speaking to the engine ---- */

function versionParts(version: string): [number, number] | null {
  const match = /^(\d+)\.(\d+)$/.exec(version.trim())
  return match ? [Number(match[1]), Number(match[2])] : null
}

/** Negative, zero or positive as `a` is older than, the same as or newer than `b`. */
export function compareApi(a: string, b: string): number {
  const x = versionParts(a)
  const y = versionParts(b)
  if (x === null || y === null) return 0
  return x[0] - y[0] || x[1] - y[1]
}

/**
 * The API version to speak: the engine's (from `/_ping`'s `Api-Version`), no
 * newer than the newest this pane knows. Null for an engine older than the
 * least it can use; the newest it knows when the engine did not say.
 */
export function chooseApi(engine: string | null): string | null {
  if (engine === null || versionParts(engine) === null) return DOCKER_API_MAX
  if (compareApi(engine, DOCKER_API_MIN) < 0) return null
  return compareApi(engine, DOCKER_API_MAX) < 0 ? engine : DOCKER_API_MAX
}

/** How the link stands after a request failed with a Node error code or an HTTP status. */
export function linkOfFailure(code: string | number | undefined): DockerLink {
  if (code === 'ENOENT' || code === 'ECONNREFUSED' || code === 'ECONNRESET') return 'no-daemon'
  if (code === 'EACCES' || code === 'EPERM') return 'denied'
  return 'error'
}

/** The problem a failed link is shown with, in a few words. */
export function linkProblem(link: DockerLink, detail: string | null): string | null {
  switch (link) {
    case 'no-daemon':
      return 'nothing answers at the engine address: is Docker running?'
    case 'denied':
      return 'this user may not open the engine socket'
    case 'error':
      return detail ?? 'the engine did not answer'
    case 'unsupported':
      return detail
    default:
      return null
  }
}

/**
 * The events that change what the list shows. The engine also reports every
 * exec - a health check is one, every few seconds - and attaches, resizes and
 * copies; none of those changes a row.
 */
export const LIST_EVENTS = [
  'create',
  'start',
  'restart',
  'stop',
  'die',
  'kill',
  'pause',
  'unpause',
  'destroy',
  'rename',
  'update',
  'oom',
  'health_status',
] as const

export function isListEvent(raw: unknown): boolean {
  if (field(raw, 'Type') !== 'container') return false
  const action = field(raw, 'Action')
  if (typeof action !== 'string') return false
  // A health change comes as "health_status: healthy".
  const name = action.split(':')[0]?.trim() ?? ''
  return (LIST_EVENTS as readonly string[]).includes(name)
}

/** How a control request's status reads: 304 is "already so", which is what was asked. */
export function controlResult(status: number): DockerControlResult {
  if (status >= 200 && status < 300) return 'ok'
  if (status === 304) return 'ok'
  if (status === 404) return 'not-found'
  if (status === 409) return 'refused'
  return 'failed'
}
