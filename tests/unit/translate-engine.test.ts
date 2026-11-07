import { describe, expect, it } from 'vitest'
import {
  type EngineConfig,
  type EngineDeps,
  type EngineLaunch,
  type ServerProcess,
  TranslateEngine,
} from '../../src/main/translate/engine'

/** A llama-server that answers /health after `loadPolls` polls, and can be made to crash. */
let nextPid = 1000

class FakeServer implements ServerProcess {
  readonly pid = nextPid++
  output: ((chunk: string) => void)[] = []
  exits: ((code: number | null) => void)[] = []
  killed = 0
  ended = false
  readonly launch: EngineLaunch
  readonly args: string[]
  readonly env: Record<string, string>
  constructor(launch: EngineLaunch, args: string[], env: Record<string, string>) {
    this.launch = launch
    this.args = args
    this.env = env
  }
  onOutput(listener: (chunk: string) => void): void {
    this.output.push(listener)
  }
  onExit(listener: (code: number | null) => void): void {
    this.exits.push(listener)
  }
  kill(): void {
    this.killed++
    this.exit(0)
  }
  write(chunk: string): void {
    for (const listener of this.output) listener(chunk)
  }
  exit(code: number | null): void {
    if (this.ended) return
    this.ended = true
    queueMicrotask(() => {
      for (const listener of this.exits) listener(code)
    })
  }
}

const launch = (backend: 'vulkan' | 'cpu'): EngineLaunch => ({
  exe: `/engine/${backend}/llama-server`,
  prefix: [],
  cwd: `/engine/${backend}`,
  env: {},
  backend,
  build: 'b12110',
})

function harness(
  over: Partial<EngineConfig> = {},
  behaviour: {
    failBackend?: string
    devices?: string[]
    silent?: boolean
    healthLog?: boolean
    /** Health checks answer 503 until this many have been asked. */
    loadPolls?: number
    /** Health checks answer 503 while this is set. */
    hold?: boolean
    /** An external server's answer to "can it be used": null when it can. */
    probe?: () => string | null
  } = {},
) {
  const servers: FakeServer[] = []
  const pids: (number | null)[] = []
  /** How many servers were still alive as each one was started: never more than none. */
  const aliveAtSpawn: number[] = []
  let polls = 0
  const timers = new Map<number, () => void>()
  let nextTimer = 1
  let clock = 0
  const changes: string[] = []
  const deps: EngineDeps = {
    spawn: (l, args, env) => {
      aliveAtSpawn.push(servers.filter((s) => !s.ended).length)
      const server = new FakeServer(l, args, env)
      servers.push(server)
      if (!behaviour.silent) server.write('srv  load_model: loading model\n')
      if (behaviour.failBackend === l.backend) server.exit(1)
      return server
    },
    health: async () => {
      const server = servers.at(-1)
      if (!server || server.ended) return null
      if (behaviour.healthLog)
        server.write('srv  log_server_r: request: GET /health 127.0.0.1 503\n')
      if (behaviour.failBackend === 'cpu-loading') return 503
      if (behaviour.loadPolls !== undefined && polls++ < behaviour.loadPolls) return 503
      if (behaviour.hold) return 503
      return server.launch.backend === behaviour.failBackend ? 503 : 200
    },
    listDevices: async () => behaviour.devices ?? ['Vulkan0: Test GPU'],
    freePort: async () => 40000 + servers.length,
    randomKey: () => `key${servers.length}`,
    setTimer: (fn) => {
      const id = nextTimer++
      timers.set(id, fn)
      return id
    },
    clearTimer: (id) => timers.delete(id as number),
    sleep: async (ms) => {
      clock += ms
      await new Promise((resolve) => setTimeout(resolve, 0))
    },
    now: () => clock,
    onChange: () => changes.push(engine.phase),
    onPid: (pid) => pids.push(pid),
    stallMs: 60_000,
    pollMs: 250,
    ...(behaviour.probe ? { probeExternal: async () => behaviour.probe?.() ?? null } : {}),
  }
  const config: EngineConfig = {
    source: 'fetched',
    launches: [launch('vulkan'), launch('cpu')],
    modelPath: '/models/m.gguf',
    modelBytes: 1.8e9,
    ctx: 16384,
    idleMinutes: 10,
    origin: null,
    ...over,
  }
  const engine = new TranslateEngine(config, deps)
  const fireTimers = () => {
    for (const [id, fn] of [...timers]) {
      timers.delete(id)
      fn()
    }
  }
  return {
    engine,
    config,
    servers,
    pids,
    aliveAtSpawn,
    changes,
    fireTimers,
    timers,
    advance: (ms: number) => (clock += ms),
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('TranslateEngine', () => {
  it('starts on demand with the key in the environment, never the command line', async () => {
    const { engine, servers } = harness()
    expect(engine.phase).toBe('stopped')
    const endpoint = await engine.ensure()
    expect(engine.phase).toBe('ready')
    expect(endpoint).toEqual({ origin: 'http://127.0.0.1:40000', key: 'key0' })
    const server = servers[0]
    if (!server) throw new Error('nothing was started')
    expect(server.env.LLAMA_API_KEY).toBe('key0')
    expect(server.args.join(' ')).not.toContain('key0')
    expect(server.args).toEqual(
      expect.arrayContaining(['--host', '127.0.0.1', '--no-webui', '-np', '1', '-c', '16384']),
    )
    expect(engine.device).toBe('Vulkan0: Test GPU')
  })

  it('is absent without a model, and refuses to start', async () => {
    const { engine } = harness({ modelPath: null })
    expect(engine.phase).toBe('absent')
    await expect(engine.ensure()).rejects.toThrow(/No engine or model/)
  })

  it('falls back to the CPU build when the GPU one fails, and says why', async () => {
    const { engine, servers } = harness({}, { failBackend: 'vulkan' })
    await engine.ensure()
    expect(engine.phase).toBe('ready')
    expect(engine.backend).toBe('cpu')
    expect(servers.at(-1)?.args).toEqual(expect.arrayContaining(['-ngl', '0']))
    expect(engine.fallback).toMatch(/vulkan build did not start/)
  })

  it('skips the GPU build when no GPU is found', async () => {
    const { engine, servers } = harness({}, { devices: [] })
    await engine.ensure()
    expect(servers).toHaveLength(1)
    expect(engine.backend).toBe('cpu')
  })

  it('faults when the last build fails too, and waits for RESTART', async () => {
    const { engine } = harness({ launches: [launch('cpu')] }, { failBackend: 'cpu' })
    await expect(engine.ensure()).rejects.toThrow()
    expect(engine.phase).toBe('fault')
    await expect(engine.ensure()).rejects.toThrow()
    expect(engine.phase).toBe('fault')
  })

  it('shares one start between requests that come while it starts', async () => {
    const { engine, servers } = harness()
    const [a, b] = await Promise.all([engine.ensure(), engine.ensure()])
    expect(a).toEqual(b)
    expect(servers).toHaveLength(1)
  })

  it('stops on its idle clock, not while a translation runs', async () => {
    const { engine, fireTimers } = harness()
    await engine.ensure()
    engine.begin()
    fireTimers()
    await settle()
    expect(engine.phase).toBe('ready')
    engine.end()
    fireTimers()
    await settle()
    await settle()
    expect(engine.phase).toBe('stopped')
  })

  it('never arms the idle clock when it is set to never stop', async () => {
    const { engine, timers } = harness({ idleMinutes: 0 })
    await engine.ensure()
    expect(timers.size).toBe(0)
  })

  it('restarts once after a crash, then faults on the next within ten minutes', async () => {
    const { engine, servers } = harness({ launches: [launch('cpu')] })
    await engine.ensure()
    servers[0]?.exit(139)
    await settle()
    await settle()
    expect(engine.phase).toBe('ready')
    expect(servers).toHaveLength(2)
    servers[1]?.exit(139)
    await settle()
    await settle()
    expect(engine.phase).toBe('fault')
    expect(engine.error).toMatch(/ended again/)
  })

  it('gives up when the load writes nothing but its own /health log for the stall time', async () => {
    // The CPU build "fails" its health checks (503) and logs each one: those lines must not count.
    const h = harness(
      { launches: [launch('cpu')] },
      { silent: true, failBackend: 'cpu-loading', healthLog: true },
    )
    await expect(h.engine.ensure()).rejects.toThrow(/stopped loading/)
    expect(h.engine.phase).toBe('fault')
  })

  it('a stop while ready ends the process and rests', async () => {
    const { engine, servers } = harness()
    await engine.ensure()
    await engine.stop()
    expect(servers[0]?.killed).toBe(1)
    expect(engine.phase).toBe('stopped')
  })

  it('a change of model restarts a running server', async () => {
    const h = harness()
    await h.engine.ensure()
    await h.engine.configure({
      ...{
        source: 'fetched',
        launches: [launch('vulkan'), launch('cpu')],
        modelBytes: 1.8e9,
        ctx: 16384,
        idleMinutes: 10,
        origin: null,
      },
      modelPath: '/models/other.gguf',
    })
    for (let i = 0; i < 6; i++) await settle()
    expect(h.servers).toHaveLength(2)
    expect(h.servers[1]?.args).toEqual(expect.arrayContaining(['/models/other.gguf']))
    expect(h.engine.phase).toBe('ready')
  })

  it('reports the pid of each server it starts, and none once it ends', async () => {
    const h = harness()
    await h.engine.ensure()
    const first = h.servers[0]?.pid
    expect(h.pids).toEqual([first])
    await h.engine.stop()
    expect(h.pids).toEqual([first, null])
    await h.engine.ensure()
    h.servers[1]?.exit(139)
    await settle()
    await settle()
    // The crash said the pid was gone, and the restart named its own.
    expect(h.pids).toEqual([first, null, h.servers[1]?.pid, null, h.servers[2]?.pid])
  })

  it('a request while it stops waits for the stop, then starts a new server', async () => {
    const h = harness()
    await h.engine.ensure()
    const stopping = h.engine.stop()
    const again = h.engine.ensure()
    await stopping
    const endpoint = await again
    expect(h.servers).toHaveLength(2)
    expect(h.servers[0]?.killed).toBe(1)
    expect(h.aliveAtSpawn).toEqual([0, 0])
    expect(endpoint.origin).toBe('http://127.0.0.1:40001')
    expect(h.engine.phase).toBe('ready')
  })

  it('a change of model while it starts calls that start off and starts with the new model', async () => {
    const h = harness({}, { loadPolls: 3 })
    const first = h.engine.ensure()
    await settle()
    const changed = h.engine.configure({ ...h.config, modelPath: '/models/other.gguf' })
    await expect(first).rejects.toThrow(/called off/)
    await changed
    for (let i = 0; i < 10; i++) await settle()
    expect(h.engine.phase).toBe('ready')
    expect(h.servers.at(-1)?.args).toEqual(expect.arrayContaining(['/models/other.gguf']))
    // Every server but the last was ended: never two at once.
    expect(h.servers.slice(0, -1).every((s) => s.ended)).toBe(true)
  })

  it('RESTART while it starts waits for that start to end, then starts once', async () => {
    const h = harness({ launches: [launch('cpu')] }, { loadPolls: 3 })
    const first = h.engine.ensure()
    await settle()
    await h.engine.restart()
    await expect(first).rejects.toThrow()
    expect(h.engine.phase).toBe('ready')
    expect(h.servers.filter((s) => !s.ended)).toHaveLength(1)
  })

  it('an idle clock armed before a crash does not stop the restart under way', async () => {
    const behaviour: { hold?: boolean } = {}
    const h = harness({ launches: [launch('cpu')] }, behaviour)
    await h.engine.ensure()
    expect(h.timers.size).toBe(1)
    // The server crashes, and its restart is still loading when the old idle clock would ring.
    behaviour.hold = true
    h.servers[0]?.exit(139)
    await settle()
    await settle()
    expect(h.engine.phase).toBe('starting')
    h.fireTimers()
    behaviour.hold = false
    for (let i = 0; i < 6; i++) await settle()
    expect(h.engine.phase).toBe('ready')
    expect(h.servers[1]?.ended).toBe(false)
  })

  it('a change of settings is the way out of a fault', async () => {
    const h = harness({ launches: [launch('cpu')] }, { failBackend: 'cpu' })
    await expect(h.engine.ensure()).rejects.toThrow()
    expect(h.engine.phase).toBe('fault')
    await h.engine.configure({ ...h.config, launches: [launch('vulkan')] })
    for (let i = 0; i < 6; i++) await settle()
    expect(h.engine.phase).toBe('ready')
    expect(h.engine.backend).toBe('vulkan')
  })

  it('after a failed request, waits for a crashed server to be heard, so the retry finds the restart', async () => {
    const h = harness({ launches: [launch('cpu')] })
    await h.engine.ensure()
    const server = h.servers[0]
    // The socket closed first; the process's end is heard a moment later.
    const settled = h.engine.settle()
    server?.exit(139)
    await settled
    const again = await h.engine.ensure()
    expect(h.servers).toHaveLength(2)
    expect(again.origin).toBe('http://127.0.0.1:40001')
  })

  it('waits on one promise for a process, however often it is asked to settle', async () => {
    const h = harness()
    await h.engine.ensure()
    const before = h.servers[0]?.exits.length ?? 0
    for (let i = 0; i < 3; i++) await h.engine.settle(1)
    expect(h.servers[0]?.exits.length).toBe(before)
  })

  it('does not wait long for a server that is still running', async () => {
    const h = harness()
    await h.engine.ensure()
    await h.engine.settle(5)
    expect(h.servers).toHaveLength(1)
    expect(h.engine.phase).toBe('ready')
  })

  it('probes an external server once and marks it unreachable when it does not answer', async () => {
    const h = harness({ source: 'external', origin: 'http://192.168.1.20:8080', launches: [] })
    expect(h.engine.phase).toBe('external-untested')
    // No server process exists, so the fake health answers null: unreachable.
    await expect(h.engine.ensure()).rejects.toThrow(/does not answer/)
    expect(h.engine.phase).toBe('external-unreachable')
    expect(h.servers).toHaveLength(0)
  })

  it('asks an external server what it runs before it is ready again, and refuses one not PLaMo', async () => {
    // Review 2026-11-07: /health alone let text go to a server restarted with another model.
    let answer: string | null = 'That server does not run a PLaMo 3 Translate model.'
    const h = harness(
      { source: 'external', origin: 'http://127.0.0.1:8210', launches: [] },
      { probe: () => answer },
    )
    await expect(h.engine.ensure()).rejects.toThrow(/does not run a PLaMo/)
    expect(h.engine.phase).toBe('external-unreachable')
    answer = null
    await expect(h.engine.ensure()).resolves.toMatchObject({ origin: 'http://127.0.0.1:8210' })
    expect(h.engine.phase).toBe('external-ready')
  })

  it('an external server is not restarted by a local model or context changing', async () => {
    // Review 2026-11-07: a model fetched in the background marked the server untested.
    const h = harness({ source: 'external', origin: 'http://127.0.0.1:8210', launches: [] })
    h.engine.tested(true)
    await h.engine.configure({ ...h.config, modelPath: '/models/other.gguf', ctx: 4096 })
    expect(h.engine.phase).toBe('external-ready')
    await h.engine.configure({ ...h.config, origin: 'http://127.0.0.1:8211' })
    expect(h.engine.phase).toBe('external-untested')
  })

  it('two changes in a row restart once, and the board says it starts while it does', async () => {
    // Review 2026-11-07: the second change's end marked the first one's start "stopped".
    const behaviour: { hold?: boolean } = {}
    const h = harness({ launches: [launch('cpu')] }, behaviour)
    await h.engine.ensure()
    // The next server keeps loading until let go.
    behaviour.hold = true
    const one = h.engine.configure({ ...h.config, launches: [launch('cpu')], ctx: 8192 })
    const two = h.engine.configure({ ...h.config, launches: [launch('cpu')], ctx: 4096 })
    await Promise.all([one, two])
    for (let i = 0; i < 4; i++) await settle()
    expect(h.engine.phase).toBe('starting')
    behaviour.hold = false
    for (let i = 0; i < 10; i++) await settle()
    expect(h.engine.phase).toBe('ready')
    expect(h.servers.filter((s) => !s.ended)).toHaveLength(1)
    expect(h.servers.at(-1)?.args).toEqual(expect.arrayContaining(['4096']))
  })

  it('stops a server that stopped answering, and starts the CPU build in its place', async () => {
    const { engine, servers } = harness()
    await engine.ensure()
    expect(engine.backend).toBe('vulkan')
    await engine.stalled()
    expect(servers[0]?.killed).toBe(1)
    expect(engine.phase).toBe('stopped')
    await engine.ensure()
    expect(engine.backend).toBe('cpu')
    expect(engine.fallback).toMatch(/vulkan build stopped answering/)
    expect(engine.logs().join('\n')).toMatch(/stopped answering; stopping it/)
    // RESTART tries the GPU build again.
    await engine.restart()
    expect(engine.backend).toBe('vulkan')
  })

  it('counts a server that stops answering as a crash: at fault when it keeps happening', async () => {
    const { engine } = harness({ launches: [launch('cpu')] })
    await engine.ensure()
    await engine.stalled()
    await engine.ensure()
    expect(engine.phase).toBe('ready')
    await engine.stalled()
    expect(engine.phase).toBe('fault')
    expect(engine.error).toMatch(/stopped answering again/)
  })

  it('a translation asked while a wedged server is stopped waits for the stop, and the server it starts is kept', async () => {
    const { engine, servers, pids } = harness()
    await engine.ensure()
    const wedged = servers[0]
    if (!wedged) throw new Error('no server')
    // Caught in its driver: killed, it does not end until it is told to.
    wedged.kill = () => {
      wedged.killed++
    }
    const stopping = engine.stalled()
    const asked = engine.ensure()
    expect(engine.phase).toBe('stopping')
    await stopping
    await asked
    expect(engine.phase).toBe('ready')
    expect(servers).toHaveLength(2)
    // The wedged one ends at last: the new server's state and pid stay.
    wedged.exit(0)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(engine.phase).toBe('ready')
    await engine.ensure()
    expect(servers).toHaveLength(2)
    expect(pids.at(-1)).toBe(servers[1]?.pid)
  })

  it('gives an answer longer to send nothing for a bigger model', () => {
    const { engine } = harness({ modelBytes: 5.3e9 })
    expect(engine.answerStallMs()).toBe(318_000)
  })
})
