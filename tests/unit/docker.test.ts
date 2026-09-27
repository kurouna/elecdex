import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findEndpoint } from '../../src/main/docker/endpoint'
import { eventLines } from '../../src/main/docker/engine'
import {
  containerRows,
  controlProblem,
  linkHint,
  readDockerPane,
  stateTone,
  stateWord,
} from '../../src/renderer/widgets/docker/docker-view'
import {
  actionsFor,
  asksTwice,
  chooseApi,
  contextName,
  controlResult,
  cpuPercent,
  type DockerContainer,
  defaultEndpoints,
  dockerCounts,
  execCommand,
  filterContainers,
  formatBytes,
  formatCpu,
  groupContainers,
  isListEvent,
  isShortId,
  linkOfFailure,
  MAX_CONTAINERS,
  parseDockerHost,
  portLabel,
  portUrl,
  readContainer,
  readExitCode,
  readHealth,
  readListing,
  readStats,
  statusAge,
  tidyPorts,
} from '../../src/shared/docker'

const ID = 'a'.repeat(64)

function raw(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    Id: ID,
    Names: ['/shop-api-1'],
    Image: 'node:22-alpine',
    Command: 'node server.js --token=hunter2',
    Created: 1_790_000_000,
    Ports: [
      { IP: '0.0.0.0', PrivatePort: 3000, PublicPort: 3000, Type: 'tcp' },
      { IP: '::', PrivatePort: 3000, PublicPort: 3000, Type: 'tcp' },
    ],
    Labels: {
      'com.docker.compose.project': 'shop',
      'com.docker.compose.service': 'api',
      'com.docker.compose.project.working_dir': '/home/dev/shop',
      'com.docker.compose.project.config_files': '/home/dev/shop/compose.yaml',
      secret: 'hunter2',
    },
    State: 'running',
    Status: 'Up 2 hours (healthy)',
    Mounts: [{ Source: '/home/dev/.ssh' }],
    ...over,
  }
}

function container(over: Partial<DockerContainer> = {}): DockerContainer {
  const read = readContainer(raw())
  if (read === null) throw new Error('fixture')
  return { ...read.container, ...over }
}

describe('reading a container', () => {
  it('takes what the pane shows, and the full id apart', () => {
    const read = readContainer(raw())
    expect(read?.fullId).toBe(ID)
    expect(read?.container).toMatchObject({
      id: 'a'.repeat(12),
      name: 'shop-api-1',
      image: 'node:22-alpine',
      state: 'running',
      status: 'Up 2 hours (healthy)',
      health: 'healthy',
      exitCode: null,
      ports: [{ ip: null, private: 3000, public: 3000, proto: 'tcp' }],
      project: 'shop',
      service: 'api',
      composeDir: '/home/dev/shop',
      created: 1_790_000_000_000,
      cpu: null,
    })
  })

  it('passes on neither the command, the mounts nor any other label', () => {
    const text = JSON.stringify(readContainer(raw())?.container)
    expect(text).not.toContain('hunter2')
    expect(text).not.toContain('.ssh')
    expect(text).not.toContain('compose.yaml')
  })

  it('refuses an item without a proper id, and names one without a name by its id', () => {
    expect(readContainer(raw({ Id: 'nope' }))).toBeNull()
    expect(readContainer(null)).toBeNull()
    expect(readContainer(raw({ Names: [] }))?.container.name).toBe('a'.repeat(12))
  })

  it('reads an unknown state as unknown, and an image by digest by its short form', () => {
    expect(readContainer(raw({ State: 'weird' }))?.container.state).toBe('unknown')
    expect(readContainer(raw({ Image: `sha256:${'b'.repeat(64)}` }))?.container.image).toBe(
      'b'.repeat(12),
    )
  })

  it('cuts long names and takes control characters out', () => {
    const name = readContainer(raw({ Names: [`/${'x'.repeat(200)}`] }))?.container.name ?? ''
    expect([...name]).toHaveLength(64)
    expect(readContainer(raw({ Status: 'Up\n2 hours' }))?.container.status).toBe('Up 2 hours')
  })

  it('reads the health and the exit code from the status', () => {
    expect(readHealth('Up 2 hours (unhealthy)')).toBe('unhealthy')
    expect(readHealth('Up 3 seconds (health: starting)')).toBe('starting')
    expect(readHealth('Up 2 hours')).toBeNull()
    expect(readExitCode('Exited (137) 5 minutes ago')).toBe(137)
    expect(readExitCode('Up 2 hours')).toBeNull()
    const exited = readContainer(raw({ State: 'exited', Status: 'Exited (1) 2 days ago' }))
    expect(exited?.container.exitCode).toBe(1)
  })

  it('says how long in a few letters', () => {
    expect(statusAge('Up 2 hours (healthy)')).toBe('2h')
    expect(statusAge('Up About a minute')).toBe('1m')
    expect(statusAge('Up About an hour')).toBe('1h')
    expect(statusAge('Up Less than a second')).toBe('<1s')
    expect(statusAge('Up 3 days')).toBe('3d')
    expect(statusAge('Up 2 weeks (Paused)')).toBe('2w')
    expect(statusAge('Exited (0) 3 minutes ago')).toBe('3m')
    expect(statusAge('Restarting (1) 5 seconds ago')).toBe('5s')
    expect(statusAge('Up 4 months')).toBe('4mo')
    expect(statusAge('Created')).toBeNull()
    expect(statusAge('')).toBeNull()
  })
})

describe('the ports', () => {
  it('lists a port published on both families once, and keeps a specific address', () => {
    expect(
      tidyPorts([
        { IP: '0.0.0.0', PrivatePort: 80, PublicPort: 8080, Type: 'tcp' },
        { IP: '::', PrivatePort: 80, PublicPort: 8080, Type: 'tcp' },
        { IP: '127.0.0.1', PrivatePort: 5000, PublicPort: 5000, Type: 'tcp' },
        { PrivatePort: 443, Type: 'tcp' },
        { IP: '0.0.0.0', PrivatePort: 53, PublicPort: 53, Type: 'udp' },
        { PrivatePort: 0, Type: 'tcp' },
        'junk',
      ]),
    ).toEqual([
      { ip: null, private: 53, public: 53, proto: 'udp' },
      { ip: '127.0.0.1', private: 5000, public: 5000, proto: 'tcp' },
      { ip: null, private: 80, public: 8080, proto: 'tcp' },
      { ip: null, private: 443, public: null, proto: 'tcp' },
    ])
    expect(tidyPorts(null)).toEqual([])
  })

  it('writes a port as a row says it', () => {
    expect(portLabel({ ip: null, private: 80, public: 8080, proto: 'tcp' })).toBe('8080→80')
    expect(portLabel({ ip: null, private: 53, public: 53, proto: 'udp' })).toBe('53→53/udp')
    expect(portLabel({ ip: null, private: 443, public: null, proto: 'tcp' })).toBe('443')
  })

  it('opens only a published TCP port of this machine', () => {
    expect(portUrl({ ip: null, private: 80, public: 8080, proto: 'tcp' })).toBe(
      'http://localhost:8080/',
    )
    expect(portUrl({ ip: '127.0.0.1', private: 80, public: 8080, proto: 'tcp' })).toBe(
      'http://localhost:8080/',
    )
    expect(portUrl({ ip: '::1', private: 80, public: 8080, proto: 'tcp' })).toBe(
      'http://[::1]:8080/',
    )
    expect(portUrl({ ip: '192.168.1.5', private: 80, public: 8080, proto: 'tcp' })).toBeNull()
    expect(portUrl({ ip: null, private: 53, public: 53, proto: 'udp' })).toBeNull()
    expect(portUrl({ ip: null, private: 80, public: null, proto: 'tcp' })).toBeNull()
  })
})

describe('the list', () => {
  const many = (n: number, running: number) =>
    Array.from({ length: n }, (_, i) =>
      raw({
        Id: i.toString(16).padStart(64, '0'),
        Names: [`/c${i}`],
        State: i < running ? 'running' : 'exited',
        Created: 1000 + i,
      }),
    )

  it('keeps everything under the limit', () => {
    const listing = readListing(many(3, 1))
    expect(listing).toMatchObject({ total: 3, truncated: false })
    expect(listing.listed).toHaveLength(3)
  })

  it('past the limit keeps those up, then the newest', () => {
    const listing = readListing(many(MAX_CONTAINERS + 50, 5))
    expect(listing.total).toBe(MAX_CONTAINERS + 50)
    expect(listing.truncated).toBe(true)
    expect(listing.listed).toHaveLength(MAX_CONTAINERS)
    const names = listing.listed.map((l) => l.container.name)
    for (let i = 0; i < 5; i++) expect(names).toContain(`c${i}`)
    expect(names).toContain(`c${MAX_CONTAINERS + 49}`)
    expect(names).not.toContain('c5')
  })

  it('groups by Compose project, the loose ones last, by service - never by state', () => {
    const groups = groupContainers([
      container({ id: '1', name: 'redis', project: null, service: null }),
      container({ id: '2', name: 'shop-web-1', service: 'web', state: 'exited' }),
      container({ id: '3', name: 'shop-api-1', service: 'api' }),
      container({ id: '4', name: 'ledger-app-1', project: 'ledger', service: 'app' }),
      container({ id: '5', name: 'adminer', project: null, service: null, state: 'exited' }),
    ])
    expect(groups.map((g) => g.project)).toEqual(['ledger', 'shop', null])
    expect(groups[1]?.containers.map((c) => c.id)).toEqual(['3', '2'])
    expect(groups[1]?.up).toBe(1)
    expect(groups[2]?.containers.map((c) => c.name)).toEqual(['adminer', 'redis'])
  })

  it('keeps what is up for RUN: running, paused and restarting', () => {
    const list = ['running', 'paused', 'restarting', 'exited', 'created', 'dead'].map((state, i) =>
      container({ id: String(i), state: state as DockerContainer['state'] }),
    )
    expect(filterContainers(list, 'running').map((c) => c.state)).toEqual([
      'running',
      'paused',
      'restarting',
    ])
    expect(filterContainers(list, 'all')).toHaveLength(6)
    expect(dockerCounts(list)).toEqual({ up: 3, down: 3, unhealthy: 0 })
    expect(dockerCounts([container({ health: 'unhealthy' })]).unhealthy).toBe(1)
  })
})

describe('the presses', () => {
  it('offers only what the state takes, and nothing that removes or kills', () => {
    expect(actionsFor('running')).toEqual(['pause', 'restart', 'stop'])
    expect(actionsFor('paused')).toEqual(['unpause', 'stop'])
    expect(actionsFor('restarting')).toEqual(['stop'])
    expect(actionsFor('exited')).toEqual(['start'])
    expect(actionsFor('created')).toEqual(['start'])
    expect(actionsFor('dead')).toEqual([])
    expect(actionsFor('removing')).toEqual([])
  })

  it('asks twice before it ends or interrupts what a container does', () => {
    expect(asksTwice('stop')).toBe(true)
    expect(asksTwice('restart')).toBe(true)
    expect(asksTwice('pause')).toBe(true)
    expect(asksTwice('start')).toBe(false)
    expect(asksTwice('unpause')).toBe(false)
  })

  it('knows a container by its short id only', () => {
    expect(isShortId('0123456789ab')).toBe(true)
    expect(isShortId(ID)).toBe(false)
    expect(isShortId('../../etc')).toBe(false)
    expect(isShortId(12)).toBe(false)
  })

  it("reads the engine's answer: 304 is what was asked", () => {
    expect(controlResult(204)).toBe('ok')
    expect(controlResult(304)).toBe('ok')
    expect(controlResult(404)).toBe('not-found')
    expect(controlResult(409)).toBe('refused')
    expect(controlResult(500)).toBe('failed')
  })

  it('gives a shell command only for a name a shell cannot misread', () => {
    expect(execCommand(container({ name: 'shop-api-1' }))).toBe('docker exec -it shop-api-1 sh')
    expect(execCommand(container({ name: 'a;rm -rf /' }))).toBeNull()
    expect(execCommand(container({ name: '$(boom)' }))).toBeNull()
  })
})

describe('what a container uses', () => {
  const sample = (cpu: number, system: number, extra: Record<string, unknown> = {}) => ({
    cpu_stats: { cpu_usage: { total_usage: cpu }, system_cpu_usage: system, online_cpus: 4 },
    memory_stats: { usage: 300, limit: 1000, stats: { inactive_file: 100 } },
    ...extra,
  })

  it('counts memory as docker stats does, less the file cache', () => {
    expect(readStats(sample(0, 0))).toMatchObject({ mem: 200, memLimit: 1000, cpus: 4 })
    const v1 = readStats(
      sample(0, 0, { memory_stats: { usage: 500, limit: 2000, stats: { cache: 50 } } }),
    )
    expect(v1?.mem).toBe(450)
  })

  it('says no limit when the engine reports none', () => {
    const none = readStats(sample(0, 0, { memory_stats: { usage: 5, limit: 2 ** 63, stats: {} } }))
    expect(none?.memLimit).toBeNull()
    expect(readStats({})).toBeNull()
  })

  it('works out the CPU between two readings, and nothing from one', () => {
    const a = readStats(sample(1e9, 100e9))
    const b = readStats(sample(1.5e9, 104e9))
    if (a === null || b === null) throw new Error('fixture')
    expect(cpuPercent(undefined, a)).toBeNull()
    // Half a second of CPU in a second of four cores' time: 50% of one core.
    expect(cpuPercent(a, b)).toBeCloseTo(50)
    // A restart set the counter back.
    expect(cpuPercent(b, a)).toBeNull()
  })

  it('writes the figures short', () => {
    expect(formatBytes(512)).toBe('512B')
    expect(formatBytes(9 * 1024 * 1024)).toBe('9.0M')
    expect(formatBytes(212 * 1024 * 1024)).toBe('212M')
    expect(formatBytes(1.3 * 1024 ** 3)).toBe('1.3G')
    expect(formatCpu(0.42)).toBe('0.4%')
    expect(formatCpu(86.4)).toBe('86%')
  })
})

describe('where the engine is', () => {
  it('uses a unix socket and a named pipe as they are', () => {
    expect(parseDockerHost('unix:///var/run/docker.sock')).toEqual({
      endpoint: {
        kind: 'socket',
        path: '/var/run/docker.sock',
        label: 'unix:///var/run/docker.sock',
      },
    })
    expect(parseDockerHost('npipe:////./pipe/docker_engine')).toMatchObject({
      endpoint: { kind: 'socket', path: '\\\\.\\pipe\\docker_engine' },
    })
    expect(parseDockerHost('npipe:////./pipe/../x y')).toHaveProperty('unsupported')
  })

  it('uses TCP only to this machine and without TLS', () => {
    expect(parseDockerHost('tcp://127.0.0.1:2375')).toMatchObject({
      endpoint: { kind: 'tcp', host: '127.0.0.1', port: 2375 },
    })
    expect(parseDockerHost('tcp://[::1]:2376')).toMatchObject({
      endpoint: { kind: 'tcp', host: '::1', port: 2376 },
    })
    expect(parseDockerHost('tcp://localhost')).toMatchObject({ endpoint: { port: 2375 } })
    expect(parseDockerHost('tcp://10.0.0.5:2375')).toEqual({
      unsupported: 'an engine on another machine',
    })
    expect(parseDockerHost('tcp://127.0.0.1:2376', 'x', true)).toEqual({
      unsupported: 'an engine over TLS',
    })
    expect(parseDockerHost('ssh://me@box')).toEqual({ unsupported: 'an engine over ssh' })
    expect(parseDockerHost('fd://')).toHaveProperty('unsupported')
  })

  it('looks where Docker puts its socket, per system', () => {
    expect(defaultEndpoints('win32', 'C:\\Users\\me', null).map((e) => e.label)).toEqual([
      'docker_engine',
    ])
    expect(defaultEndpoints('darwin', '/Users/me', null).map((e) => e.label)).toEqual([
      '/Users/me/.docker/run/docker.sock',
      '/var/run/docker.sock',
    ])
    expect(defaultEndpoints('linux', '/home/me', '/run/user/1000').map((e) => e.label)).toEqual([
      '/var/run/docker.sock',
      '/run/user/1000/docker.sock',
      '/home/me/.docker/desktop/docker.sock',
    ])
  })

  it("takes the context the CLI would: DOCKER_CONTEXT, then the config's; default is none", () => {
    expect(contextName(undefined, { currentContext: 'colima' })).toBe('colima')
    expect(contextName('orbstack', { currentContext: 'colima' })).toBe('orbstack')
    expect(contextName(undefined, { currentContext: 'default' })).toBeNull()
    expect(contextName(undefined, undefined)).toBeNull()
  })

  it('speaks the engine version, no newer than it knows, and refuses one too old', () => {
    expect(chooseApi('1.43')).toBe('1.43')
    expect(chooseApi('1.51')).toBe('1.47')
    expect(chooseApi('1.12')).toBeNull()
    expect(chooseApi(null)).toBe('1.47')
  })

  it('reads a failure as the link it leaves', () => {
    expect(linkOfFailure('ENOENT')).toBe('no-daemon')
    expect(linkOfFailure('ECONNREFUSED')).toBe('no-daemon')
    expect(linkOfFailure('EACCES')).toBe('denied')
    expect(linkOfFailure('ETIMEDOUT')).toBe('error')
  })
})

describe('finding the engine from the environment and the files', () => {
  const home = path.join('/home', 'me')
  const files = (json: Record<string, unknown>, present: string[] = []) => ({
    exists: (file: string) => present.includes(file),
    readJson: (file: string) => json[file],
  })

  it('follows DOCKER_HOST first', () => {
    expect(
      findEndpoint({ DOCKER_HOST: 'unix:///tmp/d.sock' }, 'linux', home, files({})),
    ).toMatchObject({ endpoint: { path: '/tmp/d.sock' } })
    expect(
      findEndpoint(
        { DOCKER_HOST: 'tcp://127.0.0.1:2376', DOCKER_TLS_VERIFY: '1' },
        'linux',
        home,
        files({}),
      ),
    ).toEqual({ unsupported: 'an engine over TLS' })
  })

  it("then the current context's address, by the hash of its name", () => {
    const config = path.join(home, '.docker', 'config.json')
    const digest = createHash('sha256').update('colima').digest('hex')
    const meta = path.join(home, '.docker', 'contexts', 'meta', digest, 'meta.json')
    const found = findEndpoint(
      {},
      'darwin',
      home,
      files({
        [config]: { currentContext: 'colima' },
        [meta]: { Endpoints: { docker: { Host: 'unix:///Users/me/.colima/default/docker.sock' } } },
      }),
    )
    expect(found).toEqual({
      endpoint: {
        kind: 'socket',
        path: '/Users/me/.colima/default/docker.sock',
        label: 'context colima',
      },
    })
  })

  it('says so for a context with no address', () => {
    const config = path.join(home, '.docker', 'config.json')
    expect(
      findEndpoint({}, 'linux', home, files({ [config]: { currentContext: 'gone' } })),
    ).toEqual({
      unsupported: 'the context "gone" has no engine address',
    })
  })

  it('then the first default socket that is there, or the first one', () => {
    expect(findEndpoint({}, 'linux', home, files({}))).toMatchObject({
      endpoint: { path: '/var/run/docker.sock' },
    })
    const desktop = `${home}/.docker/desktop/docker.sock`
    expect(findEndpoint({}, 'linux', home, files({}, [desktop]))).toMatchObject({
      endpoint: { path: desktop },
    })
    expect(findEndpoint({}, 'win32', 'C:\\Users\\me', files({}))).toMatchObject({
      endpoint: { path: '\\\\.\\pipe\\docker_engine' },
    })
  })
})

describe('the event stream', () => {
  it('lists again for what changes a row, not for an exec or a health check run', () => {
    expect(isListEvent({ Type: 'container', Action: 'start' })).toBe(true)
    expect(isListEvent({ Type: 'container', Action: 'health_status: unhealthy' })).toBe(true)
    expect(isListEvent({ Type: 'container', Action: 'exec_start: sh -c curl' })).toBe(false)
    expect(isListEvent({ Type: 'container', Action: 'attach' })).toBe(false)
    expect(isListEvent({ Type: 'image', Action: 'pull' })).toBe(false)
  })

  it('reads events split anywhere, one a line', () => {
    let changes = 0
    const take = eventLines(() => {
      changes += 1
    })
    const one = JSON.stringify({ Type: 'container', Action: 'die' })
    const two = JSON.stringify({ Type: 'container', Action: 'exec_die' })
    expect(take(`${one}\n${two.slice(0, 5)}`)).toBe(true)
    expect(changes).toBe(1)
    expect(take(`${two.slice(5)}\nnot json\n\n${one}`)).toBe(true)
    expect(changes).toBe(1)
    take('\n')
    expect(changes).toBe(2)
  })

  it('gives up a line longer than any event', () => {
    const take = eventLines(() => {})
    expect(take('x'.repeat(300 * 1024))).toBe(false)
  })
})

describe("the pane's words", () => {
  it('says the health in place of UP, and a bad exit code', () => {
    expect(stateWord(container())).toBe('HEALTHY')
    expect(stateWord(container({ health: null }))).toBe('UP')
    expect(stateWord(container({ health: 'unhealthy' }))).toBe('UNHEALTHY')
    expect(stateWord(container({ state: 'exited', exitCode: 137 }))).toBe('EXITED 137')
    expect(stateWord(container({ state: 'exited', exitCode: 0 }))).toBe('EXITED')
    expect(stateTone(container({ health: 'unhealthy' }))).toBe('warn')
    expect(stateTone(container({ state: 'exited', exitCode: 0 }))).toBe('muted')
    expect(stateTone(container({ state: 'dead' }))).toBe('danger')
  })

  it('reads its own choices, and nothing else', () => {
    expect(readDockerPane(undefined)).toEqual({ filter: 'all', folded: [] })
    expect(readDockerPane({ filter: 'running', folded: ['shop', 3, ''] })).toEqual({
      filter: 'running',
      folded: ['shop', ''],
    })
    expect(readDockerPane({ filter: 'odd' }).filter).toBe('all')
  })

  it("puts on the card what the row has no room for, and never the row's words again", () => {
    const rows = containerRows(
      container({ cpu: 3.2, mem: 1024 * 1024, memLimit: 2 * 1024 ** 3 }),
      () => 'then',
    )
    const labels = rows.map((row) => row.label)
    expect(labels).toEqual([
      'image',
      'compose',
      'folder',
      'status',
      'ports',
      'cpu',
      'memory',
      'created',
      'id',
    ])
    expect(rows.find((row) => row.label === 'memory')?.value).toBe('1.0M of 2.0G')
    expect(rows.find((row) => row.label === 'compose')?.value).toBe('shop · service api')
  })

  it('says why a press was not done, and what to do about a link that is down', () => {
    expect(controlProblem('ok', 'stop', 'db')).toBeNull()
    expect(controlProblem('refused', 'pause', 'db')).toContain('pause db')
    const board = {
      watching: true,
      link: 'denied' as const,
      problem: null,
      endpoint: null,
      engine: null,
      containers: [],
      total: 0,
      truncated: false,
      sampledAt: 0,
    }
    expect(linkHint(board, 'linux')).toContain('docker group')
    expect(linkHint({ ...board, link: 'no-daemon' }, 'win32')).toContain('Docker Desktop')
    expect(linkHint({ ...board, link: 'linked' }, 'win32')).toBeNull()
  })
})

describe('the boundary', () => {
  it('is out of the plugin API', () => {
    const api = readFileSync(path.join('src', 'shared', 'plugin-api.ts'), 'utf8')
    expect(api.toLowerCase()).not.toContain('docker')
  })

  it('never runs the Docker CLI', () => {
    for (const file of ['engine.ts', 'endpoint.ts', 'watcher.ts']) {
      const text = readFileSync(path.join('src', 'main', 'docker', file), 'utf8')
      expect(text, file).not.toMatch(/child_process|spawn|execFile/)
    }
  })
})
