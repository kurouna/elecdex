import { describe, expect, it } from 'vitest'
import {
  type EngineConfig,
  type EngineDeps,
  type EngineLaunch,
  type ServerProcess,
  TranslateEngine,
} from '../../src/main/translate/engine'

/** A llama-server that answers /health after `loadPolls` polls, and can be made to crash. */
class FakeServer implements ServerProcess {
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
  } = {},
) {
  const servers: FakeServer[] = []
  const timers = new Map<number, () => void>()
  let nextTimer = 1
  let clock = 0
  const changes: string[] = []
  const deps: EngineDeps = {
    spawn: (l, args, env) => {
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
    stallMs: 60_000,
    pollMs: 250,
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
  return { engine, servers, changes, fireTimers, timers, advance: (ms: number) => (clock += ms) }
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
    h.engine.configure({
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

  it('probes an external server once and marks it unreachable when it does not answer', async () => {
    const h = harness({ source: 'external', origin: 'http://192.168.1.20:8080', launches: [] })
    expect(h.engine.phase).toBe('external-untested')
    // No server process exists, so the fake health answers null: unreachable.
    await expect(h.engine.ensure()).rejects.toThrow(/does not answer/)
    expect(h.engine.phase).toBe('external-unreachable')
    expect(h.servers).toHaveLength(0)
  })
})
