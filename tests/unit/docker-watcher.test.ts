import { describe, expect, it } from 'vitest'
import { type DockerEngine, EngineError } from '../../src/main/docker/engine'
import { stubEngine } from '../../src/main/docker/stub'
import { DockerWatcher } from '../../src/main/docker/watcher'
import {
  DOCKER_RECONCILE_MS,
  DOCKER_SETTLE_MS,
  DOCKER_STATS_MS,
  type DockerBoard,
} from '../../src/shared/docker'
import { nextBoundary } from '../../src/shared/wall-clock'

interface Hooks {
  set(containers: unknown[]): void
  change(name: string, patch: Record<string, unknown>): void
  link(state: 'up' | 'down' | 'denied'): void
  presses(): string[]
  lists(): number
  streams(): number
  statsReads(): number
}

const hooks = (): Hooks => (globalThis as unknown as { __elecdexDocker: Hooks }).__elecdexDocker

/** A watcher on a fake clock, whose timers are run by hand, over the stand-in engine or another. */
function rig(engine?: DockerEngine, start = 10_100) {
  let now = start
  const timers = new Map<number, { at: number; fn: () => void }>()
  let nextTimer = 1
  const boards: DockerBoard[] = []
  const used = engine ?? stubEngine('1', () => now)
  const watcher = new DockerWatcher({
    engine: used,
    now: () => now,
    setTimer: (fn, ms) => {
      const id = nextTimer++
      timers.set(id, { at: now + ms, fn })
      return id
    },
    clearTimer: (id) => {
      timers.delete(id as number)
    },
    publish: (board) => boards.push(board),
  })
  const flush = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve()
  }
  return {
    watcher,
    boards,
    timers,
    flush,
    last: () => boards.at(-1),
    now: () => now,
    async advance(ms: number) {
      await flush()
      const end = now + ms
      for (;;) {
        const due = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0]
        if (due === undefined || due[1].at > end) break
        timers.delete(due[0])
        now = due[1].at
        due[1].fn()
        await flush()
      }
      now = end
      await flush()
    },
  }
}

describe('the Docker watcher', () => {
  it('asks the engine nothing until a pane wants it, then links and lists at once', async () => {
    const r = rig()
    await r.advance(30_000)
    expect(hooks().lists()).toBe(0)
    expect(hooks().streams()).toBe(0)
    r.watcher.sync(true)
    await r.flush()
    expect(hooks().lists()).toBe(1)
    expect(hooks().streams()).toBe(1)
    expect(r.last()).toMatchObject({ watching: true, link: 'linked', endpoint: 'stub' })
    expect(r.last()?.containers.map((c) => c.name)).toEqual([
      'shop-api-1',
      'shop-db-1',
      'shop-worker-1',
      'redis',
    ])
  })

  it('lists again at the next quarter second after events, once for many', async () => {
    const r = rig()
    r.watcher.sync(true)
    await r.flush()
    const before = hooks().lists()
    hooks().change('redis', { state: 'exited', status: 'Exited (0) 1 second ago' })
    hooks().change('shop-db-1', { state: 'exited', status: 'Exited (0) 1 second ago' })
    await r.flush()
    expect(hooks().lists()).toBe(before)
    const settle = [...r.timers.values()].find(
      (t) => t.at === nextBoundary(r.now(), DOCKER_SETTLE_MS),
    )
    expect(settle).toBeDefined()
    await r.advance(DOCKER_SETTLE_MS)
    expect(hooks().lists()).toBe(before + 1)
    expect(r.last()?.containers.find((c) => c.name === 'redis')?.state).toBe('exited')
  })

  it('lists on the ten seconds without events, and publishes only what changed', async () => {
    const r = rig(undefined, 10_100)
    r.watcher.sync(true)
    await r.flush()
    // Nothing running, so no figures change either.
    hooks().set([
      { name: 'old', image: 'busybox', state: 'exited', status: 'Exited (0) 2 days ago' },
    ])
    await r.advance(DOCKER_SETTLE_MS)
    const lists = hooks().lists()
    const published = r.boards.length
    await r.advance(nextBoundary(r.now(), DOCKER_RECONCILE_MS) - r.now())
    expect(hooks().lists()).toBe(lists + 1)
    expect(r.boards.length).toBe(published)
    hooks().set([
      { name: 'old', image: 'busybox', state: 'exited', status: 'Exited (0) 3 days ago' },
    ])
    await r.advance(DOCKER_SETTLE_MS)
    expect(r.boards.length).toBe(published + 1)
  })

  it('reads what running containers use on the five seconds, and CPU from the second reading', async () => {
    const r = rig(undefined, 10_100)
    r.watcher.sync(true)
    await r.flush()
    await r.advance(nextBoundary(r.now(), DOCKER_STATS_MS) - r.now())
    // Three running: api, db, redis.
    expect(hooks().statsReads()).toBe(3)
    const first = r.last()?.containers.find((c) => c.name === 'shop-api-1')
    expect(first?.cpu).toBeNull()
    expect(first?.mem).toBe(212 * 1024 * 1024)
    expect(first?.memLimit).toBe(2 * 1024 ** 3)
    await r.advance(DOCKER_STATS_MS)
    expect(r.last()?.containers.find((c) => c.name === 'shop-api-1')?.cpu).toBeCloseTo(3.2)
    // Not running: never read.
    expect(r.last()?.containers.find((c) => c.name === 'shop-worker-1')?.mem).toBeNull()
  })

  it('closes the stream and stops every timer when the last pane goes, keeping the list', async () => {
    const r = rig()
    r.watcher.sync(true)
    await r.flush()
    r.watcher.sync(false)
    expect(hooks().streams()).toBe(0)
    expect(r.timers.size).toBe(0)
    expect(r.last()).toMatchObject({ watching: false, link: 'standby' })
    expect(r.last()?.containers).toHaveLength(4)
    const lists = hooks().lists()
    hooks().change('redis', { state: 'exited' })
    await r.advance(60_000)
    expect(hooks().lists()).toBe(lists)
    expect(hooks().statsReads()).toBe(0)
  })

  it('says no daemon at once, and links again on the ten seconds when it is back', async () => {
    const engine = stubEngine('down')
    const r = rig(engine)
    r.watcher.sync(true)
    await r.flush()
    expect(r.last()).toMatchObject({ link: 'no-daemon', containers: [] })
    expect(r.last()?.problem).toContain('Docker running')
    hooks().link('up')
    await r.advance(DOCKER_RECONCILE_MS)
    expect(r.last()?.link).toBe('linked')
    expect(r.last()?.containers).toHaveLength(4)
  })

  it('says so when the engine goes: its stream ends, and the link is tried at once', async () => {
    const r = rig()
    r.watcher.sync(true)
    await r.advance(5000)
    hooks().link('down')
    await r.flush()
    expect(r.last()).toMatchObject({ link: 'no-daemon', containers: [] })
    expect(r.watcher.linked).toBe(false)
  })

  it('tells a socket it may not open apart from none', async () => {
    const r = rig(stubEngine('denied'))
    r.watcher.sync(true)
    await r.flush()
    expect(r.last()?.link).toBe('denied')
    expect(await r.watcher.control('0123456789ab', 'start')).toBe('denied')
  })

  it('keeps the last list when the engine is only slow', async () => {
    let slow = false
    const base = stubEngine('1')
    const engine: DockerEngine = {
      ...base,
      list: async () => {
        if (slow) throw new EngineError('error', 'no answer from the engine in 2 s')
        return base.list()
      },
    }
    const r = rig(engine)
    r.watcher.sync(true)
    await r.flush()
    slow = true
    await r.advance(DOCKER_RECONCILE_MS)
    expect(r.last()).toMatchObject({ link: 'error', problem: 'no answer from the engine in 2 s' })
    expect(r.last()?.containers).toHaveLength(4)
    slow = false
    await r.advance(DOCKER_RECONCILE_MS)
    expect(r.last()?.link).toBe('linked')
  })

  it('does not read the list twice at once', async () => {
    let calls = 0
    let release: () => void = () => {}
    const base = stubEngine('1')
    const engine: DockerEngine = {
      ...base,
      list: async () => {
        calls += 1
        await new Promise<void>((resolve) => {
          release = resolve
        })
        return base.list()
      },
    }
    const r = rig(engine)
    r.watcher.sync(true)
    await r.flush()
    expect(calls).toBe(1)
    hooks().change('redis', { status: 'Up 6 minutes' })
    await r.advance(DOCKER_SETTLE_MS)
    expect(calls).toBe(1)
    release()
    await r.flush()
    // The one asked for meanwhile follows.
    expect(calls).toBe(2)
  })

  it('passes a press on only for a container of the list, in a state that takes it', async () => {
    const r = rig()
    expect(await r.watcher.control('0123456789ab', 'stop')).toBe('unsupported')
    r.watcher.sync(true)
    await r.flush()
    const board = r.last()
    const api = board?.containers.find((c) => c.name === 'shop-api-1')
    const worker = board?.containers.find((c) => c.name === 'shop-worker-1')
    if (api === undefined || worker === undefined) throw new Error('fixture')
    expect(await r.watcher.control('0123456789ab', 'stop')).toBe('not-found')
    expect(await r.watcher.control(worker.id, 'stop')).toBe('refused')
    expect(await r.watcher.control(api.id, 'unpause')).toBe('refused')
    expect(hooks().presses()).toEqual([])
    expect(await r.watcher.control(api.id, 'stop')).toBe('ok')
    expect(hooks().presses()).toEqual(['stop shop-api-1'])
    await r.advance(DOCKER_SETTLE_MS)
    expect(r.last()?.containers.find((c) => c.name === 'shop-api-1')?.state).toBe('exited')
    expect(await r.watcher.control(worker.id, 'start')).toBe('ok')
  })

  it('drops the figures of a container that stopped', async () => {
    const r = rig(undefined, 10_100)
    r.watcher.sync(true)
    await r.flush()
    await r.advance(nextBoundary(r.now(), DOCKER_STATS_MS) - r.now())
    expect(r.last()?.containers.find((c) => c.name === 'redis')?.mem).not.toBeNull()
    hooks().change('redis', { state: 'exited', status: 'Exited (0) 1 second ago' })
    await r.advance(DOCKER_SETTLE_MS)
    expect(r.last()?.containers.find((c) => c.name === 'redis')?.mem).toBeNull()
  })
})
