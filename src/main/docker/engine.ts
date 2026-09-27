import http from 'node:http'
import {
  chooseApi,
  compareApi,
  controlResult,
  DOCKER_API_ONE_SHOT,
  DOCKER_CONTROL_TIMEOUT_MS,
  DOCKER_STOP_GRACE_S,
  DOCKER_TIMEOUT_MS,
  type DockerAction,
  type DockerControlResult,
  type DockerEndpoint,
  type DockerEngineInfo,
  type DockerLink,
  type EndpointAnswer,
  isListEvent,
  LIST_EVENTS,
  linkOfFailure,
  MAX_RESPONSE_BYTES,
} from '@shared/docker'

/** A request that failed, with how the link stands after it. */
export class EngineError extends Error {
  readonly link: DockerLink
  constructor(link: DockerLink, message: string) {
    super(message)
    this.link = link
  }
}

/** What the watcher asks of an engine (engine.ts, the real one; stub.ts, the tests'). */
export interface DockerEngine {
  /** Finds the engine and says hello (`/_ping`, `/version`); throws an EngineError. */
  link(): Promise<{ endpoint: string; engine: DockerEngineInfo }>
  /** `GET /containers/json?all=1`, as the engine answered. */
  list(): Promise<unknown>
  /**
   * Follows the engine's events: `onChange` for each one that changes the list,
   * `onEnd` once when the stream ends (the engine went, or it was closed).
   * Returns what closes it.
   */
  events(onChange: () => void, onEnd: () => void): () => void
  control(fullId: string, action: DockerAction): Promise<DockerControlResult>
  /** One reading of what a container uses, or null where the engine is too old for a quick one. */
  stats(fullId: string): Promise<unknown>
  /** Drops whatever is open. */
  close(): void
}

interface Answer {
  status: number
  headers: http.IncomingHttpHeaders
  body: string
}

function target(endpoint: DockerEndpoint): http.RequestOptions {
  return endpoint.kind === 'socket'
    ? { socketPath: endpoint.path }
    : { host: endpoint.host, port: endpoint.port }
}

function failure(error: unknown): EngineError {
  if (error instanceof EngineError) return error
  const code = (error as NodeJS.ErrnoException | undefined)?.code
  const link = linkOfFailure(code)
  return new EngineError(
    link,
    code ? `the engine could not be reached (${code})` : 'the engine could not be reached',
  )
}

/**
 * One request over the engine's socket (or loopback TCP), its answer held to
 * `MAX_RESPONSE_BYTES` and `timeout`. No redirect is followed: node's http does
 * not, and an engine does not send one.
 */
function request(
  endpoint: DockerEndpoint,
  method: 'GET' | 'POST',
  path: string,
  timeout: number,
): Promise<Answer> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { ...target(endpoint), method, path, agent: false, headers: { Host: 'docker' } },
      (res) => {
        const chunks: Buffer[] = []
        let size = 0
        res.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > MAX_RESPONSE_BYTES) {
            req.destroy(new EngineError('error', 'the engine answered more than the pane reads'))
            return
          }
          chunks.push(chunk)
        })
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          }),
        )
        res.on('error', (error) => reject(failure(error)))
      },
    )
    req.setTimeout(timeout, () =>
      req.destroy(new EngineError('error', `no answer from the engine in ${timeout / 1000} s`)),
    )
    req.on('error', (error) => reject(failure(error)))
    req.end()
  })
}

function json(answer: Answer): unknown {
  if (answer.status >= 400) throw new EngineError('error', `the engine answered ${answer.status}`)
  try {
    return JSON.parse(answer.body) as unknown
  } catch {
    throw new EngineError('error', 'the engine answered something that is not JSON')
  }
}

/** The longest line of the event stream kept whole; an event is a few hundred bytes. */
const MAX_EVENT_LINE = 256 * 1024

/**
 * Takes the event stream's chunks - one JSON event a line, split anywhere - and
 * calls `onChange` for each event that changes the list. Answers false when a
 * line has grown past any event's size.
 */
export function eventLines(onChange: () => void): (chunk: string) => boolean {
  let rest = ''
  return (chunk) => {
    const lines = (rest + chunk).split('\n')
    rest = lines.pop() ?? ''
    for (const line of lines) {
      if (line.trim() === '') continue
      try {
        if (isListEvent(JSON.parse(line))) onChange()
      } catch {
        // Not an event: skipped.
      }
    }
    return rest.length <= MAX_EVENT_LINE
  }
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value.slice(0, 40) : null
}

/**
 * The Docker Engine API over its socket - a Unix socket, a Windows named pipe,
 * or TCP on this machine - with node's own http: no CLI is run for a reading
 * (starting one per look would cost a process each time, and its text is not an
 * interface), and no client library is needed for the four requests made.
 *
 * `find` is asked where the engine is at each link, so a context switched
 * meanwhile is followed.
 */
export function createEngine(find: () => EndpointAnswer): DockerEngine {
  let endpoint: DockerEndpoint | null = null
  let prefix = ''
  let oneShot = true
  const streams = new Set<http.ClientRequest>()

  const current = (): DockerEndpoint => {
    if (endpoint === null) throw new EngineError('standby', 'not linked')
    return endpoint
  }

  return {
    async link() {
      const found = find()
      if ('unsupported' in found)
        throw new EngineError('unsupported', `not used: ${found.unsupported}`)
      endpoint = found.endpoint
      const ping = await request(found.endpoint, 'GET', '/_ping', DOCKER_TIMEOUT_MS)
      // Docker Desktop's pipe answers while its engine is stopped, with a 500 naming the VM's pipe.
      if (ping.status >= 500) throw new EngineError('no-daemon', 'the engine is not running')
      if (ping.status >= 400) throw new EngineError('error', `the engine answered ${ping.status}`)
      const header = ping.headers['api-version']
      const api = chooseApi(typeof header === 'string' ? header : null)
      if (api === null)
        throw new EngineError('unsupported', `the engine is too old (API ${String(header)})`)
      prefix = `/v${api}`
      oneShot = compareApi(api, DOCKER_API_ONE_SHOT) >= 0
      let version: string | null = null
      let os: string | null = null
      try {
        const facts = json(
          await request(found.endpoint, 'GET', `${prefix}/version`, DOCKER_TIMEOUT_MS),
        )
        const record = facts as Record<string, unknown>
        version = text(record.Version)
        os = text(record.Os)
      } catch {
        // The version is for the footer only; the list does not need it.
      }
      return { endpoint: found.endpoint.label, engine: { version, api, os } }
    },

    async list() {
      return json(
        await request(current(), 'GET', `${prefix}/containers/json?all=1`, DOCKER_TIMEOUT_MS),
      )
    },

    events(onChange, onEnd) {
      const filters = encodeURIComponent(
        JSON.stringify({ type: ['container'], event: [...LIST_EVENTS] }),
      )
      let ended = false
      const end = (): void => {
        if (ended) return
        ended = true
        streams.delete(req)
        onEnd()
      }
      const req = http.request(
        {
          ...target(current()),
          method: 'GET',
          path: `${prefix}/events?filters=${filters}`,
          agent: false,
          headers: { Host: 'docker' },
        },
        (res) => {
          // Only the answer's start is timed: a quiet engine sends nothing for hours.
          req.setTimeout(0)
          if ((res.statusCode ?? 0) >= 400) {
            res.resume()
            req.destroy()
            end()
            return
          }
          const lines = eventLines(onChange)
          res.setEncoding('utf8')
          res.on('data', (chunk: string) => {
            // A line no event would make is not kept: the stream is dropped and linked again.
            if (!lines(chunk)) req.destroy()
          })
          res.on('end', end)
          res.on('close', end)
          res.on('error', end)
        },
      )
      streams.add(req)
      req.setTimeout(DOCKER_TIMEOUT_MS, () => req.destroy())
      req.on('error', end)
      req.on('close', end)
      req.end()
      return () => {
        req.destroy()
        end()
      }
    },

    async control(fullId, action) {
      const grace = action === 'stop' || action === 'restart' ? `?t=${DOCKER_STOP_GRACE_S}` : ''
      try {
        const answer = await request(
          current(),
          'POST',
          `${prefix}/containers/${fullId}/${action}${grace}`,
          DOCKER_CONTROL_TIMEOUT_MS,
        )
        return controlResult(answer.status)
      } catch (error) {
        const link = failure(error).link
        return link === 'no-daemon' ? 'no-daemon' : link === 'denied' ? 'denied' : 'failed'
      }
    },

    async stats(fullId) {
      // Without one-shot the engine waits a second for a second reading of its own.
      if (!oneShot) return null
      return json(
        await request(
          current(),
          'GET',
          `${prefix}/containers/${fullId}/stats?stream=false&one-shot=true`,
          DOCKER_TIMEOUT_MS,
        ),
      )
    },

    close() {
      for (const req of [...streams]) req.destroy()
      streams.clear()
    },
  }
}
