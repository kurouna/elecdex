import { rmSync } from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createEngine, EngineError } from '../../src/main/docker/engine'
import type { DockerEndpoint } from '../../src/shared/docker'

/**
 * The engine client against a made-up Engine API served on a real socket - a
 * named pipe on Windows, a Unix socket elsewhere - as Docker serves its own:
 * what is asked, over what, and how each failure reads.
 */

let count = 0
function socketPath(): string {
  count += 1
  const name = `elecdex-docker-test-${process.pid}-${count}`
  return process.platform === 'win32'
    ? `\\\\.\\pipe\\${name}`
    : path.join(os.tmpdir(), `${name}.sock`)
}

interface Served {
  endpoint: DockerEndpoint
  requests: string[]
  events: http.ServerResponse[]
  close(): Promise<void>
}

const servers: Served[] = []

afterEach(async () => {
  for (const server of servers.splice(0)) await server.close()
})

async function serve(
  route: (req: http.IncomingMessage, res: http.ServerResponse, served: Served) => void,
): Promise<Served> {
  const where = socketPath()
  const served: Served = {
    endpoint: { kind: 'socket', path: where, label: 'test' },
    requests: [],
    events: [],
    close: () =>
      new Promise((resolve) => {
        for (const res of served.events) res.destroy()
        server.closeAllConnections()
        server.close(() => resolve())
        if (process.platform !== 'win32') rmSync(where, { force: true })
      }),
  }
  const server = http.createServer((req, res) => {
    served.requests.push(`${req.method} ${req.url}`)
    route(req, res, served)
  })
  await new Promise<void>((resolve) => server.listen(where, resolve))
  servers.push(served)
  return served
}

const CONTAINER = {
  Id: 'c'.repeat(64),
  Names: ['/web'],
  Image: 'nginx',
  State: 'running',
  Status: 'Up 1 hour',
  Ports: [],
  Labels: {},
  Created: 1,
}

/** A well engine speaking API 1.45. */
function engineRoute(req: http.IncomingMessage, res: http.ServerResponse, served: Served): void {
  const url = req.url ?? ''
  if (url === '/_ping') {
    res.writeHead(200, { 'Api-Version': '1.45', 'Content-Type': 'text/plain' }).end('OK')
  } else if (url === '/v1.45/version') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ Version: '26.1.0', Os: 'linux' }))
  } else if (url === '/v1.45/containers/json?all=1') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify([CONTAINER]))
  } else if (url.startsWith('/v1.45/events?')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.flushHeaders()
    served.events.push(res)
  } else if (req.method === 'POST' && url.startsWith(`/v1.45/containers/${CONTAINER.Id}/`)) {
    res.writeHead(url.includes('/pause') ? 409 : 204).end()
  } else if (url.startsWith(`/v1.45/containers/${CONTAINER.Id}/stats`)) {
    res.writeHead(200).end(JSON.stringify({ cpu_stats: { cpu_usage: { total_usage: 1 } } }))
  } else {
    res.writeHead(404).end()
  }
}

const until = async (check: () => boolean): Promise<void> => {
  for (let i = 0; i < 200 && !check(); i++) await new Promise((r) => setTimeout(r, 10))
}

describe('the engine client', () => {
  it('links, speaking the engine API version, and lists every container', async () => {
    const served = await serve(engineRoute)
    const engine = createEngine(() => ({ endpoint: served.endpoint }))
    expect(await engine.link()).toEqual({
      endpoint: 'test',
      engine: { version: '26.1.0', api: '1.45', os: 'linux' },
    })
    expect(await engine.list()).toEqual([CONTAINER])
    expect(served.requests).toEqual([
      'GET /_ping',
      'GET /v1.45/version',
      'GET /v1.45/containers/json?all=1',
    ])
  })

  it('follows the events that change the list, filtered at the engine', async () => {
    const served = await serve(engineRoute)
    const engine = createEngine(() => ({ endpoint: served.endpoint }))
    await engine.link()
    let changes = 0
    let ended = 0
    const close = engine.events(
      () => {
        changes += 1
      },
      () => {
        ended += 1
      },
    )
    await until(() => served.events.length === 1)
    const filter = decodeURIComponent(served.requests.at(-1)?.split('filters=')[1] ?? '')
    expect(JSON.parse(filter)).toMatchObject({ type: ['container'] })
    expect(JSON.parse(filter).event).toContain('health_status')
    const stream = served.events[0] as http.ServerResponse
    stream.write(`${JSON.stringify({ Type: 'container', Action: 'start' })}\n`)
    stream.write(`${JSON.stringify({ Type: 'container', Action: 'exec_start: sh' })}\n`)
    await until(() => changes === 1)
    expect(changes).toBe(1)
    // The engine went: the stream ends, once.
    stream.destroy()
    await until(() => ended === 1)
    expect(ended).toBe(1)
    close()
    expect(ended).toBe(1)
  })

  it('presses with a grace for stop and restart, and reads the answer', async () => {
    const served = await serve(engineRoute)
    const engine = createEngine(() => ({ endpoint: served.endpoint }))
    await engine.link()
    expect(await engine.control(CONTAINER.Id, 'stop')).toBe('ok')
    expect(await engine.control(CONTAINER.Id, 'pause')).toBe('refused')
    expect(await engine.control('d'.repeat(64), 'start')).toBe('not-found')
    expect(served.requests.slice(-3)).toEqual([
      `POST /v1.45/containers/${CONTAINER.Id}/stop?t=10`,
      `POST /v1.45/containers/${CONTAINER.Id}/pause`,
      `POST /v1.45/containers/${'d'.repeat(64)}/start`,
    ])
  })

  it('asks for one quick stats reading', async () => {
    const served = await serve(engineRoute)
    const engine = createEngine(() => ({ endpoint: served.endpoint }))
    await engine.link()
    await engine.stats(CONTAINER.Id)
    expect(served.requests.at(-1)).toBe(
      `GET /v1.45/containers/${CONTAINER.Id}/stats?stream=false&one-shot=true`,
    )
  })

  it('reads a missing socket as no daemon', async () => {
    const engine = createEngine(() => ({
      endpoint: { kind: 'socket', path: socketPath(), label: 'nothing' },
    }))
    await expect(engine.link()).rejects.toMatchObject({ link: 'no-daemon' })
  })

  it("reads Docker Desktop's pipe answering with its engine stopped as no daemon", async () => {
    const served = await serve((_req, res) => res.writeHead(500).end('pipe not found'))
    const engine = createEngine(() => ({ endpoint: served.endpoint }))
    await expect(engine.link()).rejects.toMatchObject({ link: 'no-daemon' })
  })

  it('refuses an engine too old, and an address it does not use', async () => {
    const served = await serve((_req, res) => res.writeHead(200, { 'Api-Version': '1.12' }).end())
    await expect(createEngine(() => ({ endpoint: served.endpoint })).link()).rejects.toMatchObject({
      link: 'unsupported',
    })
    await expect(
      createEngine(() => ({ unsupported: 'an engine over ssh' })).link(),
    ).rejects.toMatchObject({ link: 'unsupported', message: 'not used: an engine over ssh' })
  })

  it('gives up on an engine that does not answer', async () => {
    const served = await serve((req, res) => {
      if (req.url === '/_ping') res.writeHead(200, { 'Api-Version': '1.45' }).end()
      // Every other request is left hanging.
    })
    const engine = createEngine(() => ({ endpoint: served.endpoint }))
    await engine.link()
    const error = await engine.list().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(EngineError)
    expect(error).toMatchObject({ link: 'error', message: 'no answer from the engine in 2 s' })
  }, 10_000)

  it('reads no answer past its size', async () => {
    const served = await serve((req, res) => {
      if (req.url === '/_ping') {
        res.writeHead(200, { 'Api-Version': '1.45' }).end()
        return
      }
      res.writeHead(200)
      res.end(Buffer.alloc(5 * 1024 * 1024, 32))
    })
    const engine = createEngine(() => ({ endpoint: served.endpoint }))
    await engine.link()
    await expect(engine.list()).rejects.toMatchObject({
      message: 'the engine answered more than the pane reads',
    })
  })
})
