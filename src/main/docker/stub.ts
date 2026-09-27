import { createHash } from 'node:crypto'
import type { DockerAction, DockerControlResult } from '@shared/docker'
import { type DockerEngine, EngineError } from './engine.js'

/**
 * A stand-in engine (ELECDEX_DOCKER_STUB=1, the tests; =demo, the screenshots;
 * =down and =denied, an engine that is not there or not ours): a run never
 * reaches this machine's Docker, and never starts or stops its containers.
 *
 * It answers in the engine's own shapes, so what main reads of them is what it
 * reads of a real engine. The end-to-end tests change it through
 * `globalThis.__elecdexDocker`, and read back what was pressed and asked.
 */
export interface StubContainer {
  name: string
  image: string
  state: string
  status: string
  ports?: { IP?: string; PrivatePort: number; PublicPort?: number; Type: string }[]
  project?: string
  service?: string
  dir?: string
  /** Percent of one core it uses while running. */
  cpu?: number
  /** Bytes. */
  mem?: number
  memLimit?: number
  /** Minutes ago it was made. */
  age?: number
}

export interface DockerHooks {
  /** Replaces the containers, and says so as an event would. */
  set(containers: StubContainer[]): void
  /** Changes one container by name, and says so as an event would. */
  change(name: string, patch: Partial<StubContainer>): void
  /** The engine goes away ('down'), refuses this user ('denied'), or is back ('up'). */
  link(state: 'up' | 'down' | 'denied'): void
  /** The presses passed on, in order, as `<action> <name>`. */
  presses(): string[]
  /** How many times the list has been read. */
  lists(): number
  /** How many event streams are open now. */
  streams(): number
  /** How many stats readings were made. */
  statsReads(): number
}

const CPUS = 8

const port = (host: number | null, inside: number, type = 'tcp') =>
  host === null
    ? { PrivatePort: inside, Type: type }
    : [
        { IP: '0.0.0.0', PrivatePort: inside, PublicPort: host, Type: type },
        { IP: '::', PrivatePort: inside, PublicPort: host, Type: type },
      ]

const TEST: StubContainer[] = [
  {
    name: 'shop-api-1',
    image: 'node:22-alpine',
    state: 'running',
    status: 'Up 2 hours (healthy)',
    ports: [port(3000, 3000)].flat(),
    project: 'shop',
    service: 'api',
    dir: '/home/dev/shop',
    cpu: 3.2,
    mem: 212 * 1024 * 1024,
    memLimit: 2 * 1024 ** 3,
    age: 130,
  },
  {
    name: 'shop-db-1',
    image: 'postgres:16',
    state: 'running',
    status: 'Up 2 hours',
    ports: [port(5432, 5432)].flat(),
    project: 'shop',
    service: 'db',
    dir: '/home/dev/shop',
    cpu: 0.4,
    mem: 88 * 1024 * 1024,
    age: 130,
  },
  {
    name: 'shop-worker-1',
    image: 'shop-worker:latest',
    state: 'exited',
    status: 'Exited (137) 5 minutes ago',
    project: 'shop',
    service: 'worker',
    dir: '/home/dev/shop',
    age: 130,
  },
  {
    name: 'redis',
    image: 'redis:7',
    state: 'running',
    status: 'Up 5 minutes',
    ports: [port(6379, 6379)].flat(),
    cpu: 0.2,
    mem: 9 * 1024 * 1024,
    age: 6,
  },
]

const DEMO: StubContainer[] = [
  ...TEST.slice(0, 2),
  {
    name: 'shop-web-1',
    image: 'nginx:1.27-alpine',
    state: 'running',
    status: 'Up 2 hours',
    ports: [port(8080, 80), port(null, 443)].flat(),
    project: 'shop',
    service: 'web',
    dir: '/home/dev/shop',
    cpu: 0.1,
    mem: 14 * 1024 * 1024,
    age: 130,
  },
  {
    name: 'shop-search-1',
    image: 'opensearchproject/opensearch:2.17.0',
    state: 'running',
    status: 'Up 12 seconds (health: starting)',
    ports: [port(9200, 9200)].flat(),
    project: 'shop',
    service: 'search',
    dir: '/home/dev/shop',
    cpu: 86,
    mem: 1.3 * 1024 ** 3,
    memLimit: 4 * 1024 ** 3,
    age: 130,
  },
  TEST[2] as StubContainer,
  {
    name: 'ledger-app-1',
    image: 'ledger-app:dev',
    state: 'running',
    status: 'Up 40 minutes (unhealthy)',
    ports: [port(4000, 4000)].flat(),
    project: 'ledger',
    service: 'app',
    dir: '/home/dev/ledger',
    cpu: 1.8,
    mem: 164 * 1024 * 1024,
    age: 41,
  },
  {
    name: 'ledger-queue-1',
    image: 'rabbitmq:4-management',
    state: 'paused',
    status: 'Up 40 minutes (Paused)',
    ports: [port(5672, 5672), port(15672, 15672)].flat(),
    project: 'ledger',
    service: 'queue',
    dir: '/home/dev/ledger',
    age: 41,
  },
  TEST[3] as StubContainer,
  {
    name: 'registry',
    image: 'registry:2',
    state: 'running',
    status: 'Up 3 days',
    ports: [{ IP: '127.0.0.1', PrivatePort: 5000, PublicPort: 5000, Type: 'tcp' }],
    cpu: 0,
    mem: 6 * 1024 * 1024,
    age: 4400,
  },
  {
    name: 'old-build',
    image: 'golang:1.23',
    state: 'exited',
    status: 'Exited (0) 2 days ago',
    age: 3000,
  },
]

function fullId(name: string): string {
  return createHash('sha256').update(`elecdex-stub:${name}`).digest('hex')
}

function listed(container: StubContainer, now: number): unknown {
  const labels: Record<string, string> = { 'org.opencontainers.image.title': container.image }
  if (container.project !== undefined) labels['com.docker.compose.project'] = container.project
  if (container.service !== undefined) labels['com.docker.compose.service'] = container.service
  if (container.dir !== undefined) labels['com.docker.compose.project.working_dir'] = container.dir
  return {
    Id: fullId(container.name),
    Names: [`/${container.name}`],
    Image: container.image,
    Command: 'docker-entrypoint.sh',
    Created: Math.floor((now - (container.age ?? 10) * 60_000) / 1000),
    Ports: container.ports ?? [],
    Labels: labels,
    State: container.state,
    Status: container.status,
  }
}

const AFTER: Record<DockerAction, { from: string[]; state: string; status: string }> = {
  start: { from: ['exited', 'created'], state: 'running', status: 'Up Less than a second' },
  stop: {
    from: ['running', 'paused', 'restarting'],
    state: 'exited',
    status: 'Exited (0) Less than a second ago',
  },
  restart: { from: ['running'], state: 'running', status: 'Up Less than a second' },
  pause: { from: ['running'], state: 'paused', status: 'Up Less than a second (Paused)' },
  unpause: { from: ['paused'], state: 'running', status: 'Up Less than a second' },
}

export function stubEngine(mode: string, now: () => number = Date.now): DockerEngine {
  let containers = (mode === 'demo' ? DEMO : TEST).map((c) => ({ ...c }))
  let state: 'up' | 'down' | 'denied' =
    mode === 'down' ? 'down' : mode === 'denied' ? 'denied' : 'up'
  const listeners = new Set<{ onChange: () => void; onEnd: () => void }>()
  const presses: string[] = []
  const counters = new Map<string, { cpu: number; system: number }>()
  let lists = 0
  let statsReads = 0
  /** When the containers' ages count from: a container's creation does not move. */
  const born = now()

  const announce = (): void => {
    for (const listener of [...listeners]) listener.onChange()
  }
  const reachable = (): void => {
    if (state === 'down')
      throw new EngineError('no-daemon', 'the engine could not be reached (ENOENT)')
    if (state === 'denied')
      throw new EngineError('denied', 'the engine could not be reached (EACCES)')
  }
  const byId = (id: string) => containers.find((c) => fullId(c.name) === id)

  const hooks: DockerHooks = {
    set: (next) => {
      containers = next.map((c) => ({ ...c }))
      announce()
    },
    change: (name, patch) => {
      containers = containers.map((c) => (c.name === name ? { ...c, ...patch } : c))
      announce()
    },
    link: (next) => {
      state = next
      if (next !== 'up')
        for (const listener of [...listeners]) {
          listeners.delete(listener)
          listener.onEnd()
        }
    },
    presses: () => [...presses],
    lists: () => lists,
    streams: () => listeners.size,
    statsReads: () => statsReads,
  }
  ;(globalThis as { __elecdexDocker?: DockerHooks }).__elecdexDocker = hooks

  return {
    link: async () => {
      reachable()
      return {
        endpoint: mode === 'demo' ? 'context desktop-linux' : 'stub',
        engine: { version: '27.3.1', api: '1.47', os: 'linux' },
      }
    },
    list: async () => {
      reachable()
      lists += 1
      return containers.map((c) => listed(c, born))
    },
    events: (onChange, onEnd) => {
      const listener = { onChange, onEnd }
      listeners.add(listener)
      return () => {
        if (listeners.delete(listener)) onEnd()
      }
    },
    control: async (id, action): Promise<DockerControlResult> => {
      if (state !== 'up') return state === 'down' ? 'no-daemon' : 'denied'
      const container = byId(id)
      if (container === undefined) return 'not-found'
      presses.push(`${action} ${container.name}`)
      const after = AFTER[action]
      if (!after.from.includes(container.state)) return 'refused'
      hooks.change(container.name, { state: after.state, status: after.status })
      return 'ok'
    },
    stats: async (id) => {
      reachable()
      statsReads += 1
      const container = byId(id)
      if (container === undefined) throw new EngineError('error', 'the engine answered 404')
      const before = counters.get(id) ?? { cpu: 0, system: 0 }
      const system = before.system + CPUS * 1e9
      const cpu = before.cpu + ((container.cpu ?? 0) / 100) * 1e9
      counters.set(id, { cpu, system })
      return {
        cpu_stats: { cpu_usage: { total_usage: cpu }, system_cpu_usage: system, online_cpus: CPUS },
        memory_stats: {
          usage: (container.mem ?? 0) + 4096,
          limit: container.memLimit ?? 32 * 1024 ** 3,
          stats: { inactive_file: 4096 },
        },
      }
    },
    close: () => {
      for (const listener of [...listeners]) {
        listeners.delete(listener)
        listener.onEnd()
      }
    },
  }
}
