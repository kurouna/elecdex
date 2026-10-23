import { createServer, type IncomingHttpHeaders, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * A local stand-in for a data service (JMA, the USGS, NOAA, a feed's site, CelesTrak): every
 * request logged, bodies served from a map a test changes as it goes - with an ETag, answered
 * 304 when the app sends it back - or from the spec's own answer where a route needs more. No
 * test reaches the real service.
 */

/** A request the stand-in received, in order. */
export interface StubRequest {
  url: string
  headers: IncomingHttpHeaders
}

export interface StubReply {
  status: number
  body?: string
  headers?: Record<string, string>
}

export interface ServiceStub {
  /** `http://127.0.0.1:<port>`. */
  readonly origin: string
  /** Every request, in order; a test empties it (`requests.length = 0`) to start afresh. */
  readonly requests: StubRequest[]
  /**
   * Bodies by path (with the query), each served with an ETag made from the body and answered
   * 304 when the request carries it; replaced or changed as the test goes. A path neither here
   * nor answered by the spec's own function is a 404.
   */
  routes: Record<string, string>
  close(): Promise<void>
}

/** The ETag a body is served with: it changes when the body does. */
export const etagOf = (body: string): string =>
  `"${body.length}-${Buffer.from(body).toString('base64').slice(-12)}"`

/**
 * Starts the stand-in on a free port of 127.0.0.1. `answer`, when given, is asked first and
 * answers a request it returns a reply for; anything else goes to `routes`.
 */
export async function serviceStub(
  answer?: (request: StubRequest) => StubReply | undefined,
): Promise<ServiceStub> {
  const requests: StubRequest[] = []
  const stub = { routes: {} as Record<string, string> }
  const server: Server = createServer((req, res) => {
    const request: StubRequest = { url: req.url ?? '', headers: req.headers }
    requests.push(request)
    const reply = answer?.(request)
    if (reply !== undefined) {
      res.writeHead(reply.status, reply.headers).end(reply.body)
      return
    }
    const body = stub.routes[request.url]
    if (body === undefined) {
      res.writeHead(404).end()
      return
    }
    const etag = etagOf(body)
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304).end()
      return
    }
    res.writeHead(200, { etag }).end(body)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return Object.assign(stub, {
    origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    requests,
    close: async () => {
      server.closeAllConnections()
      await new Promise((resolve) => server.close(resolve))
    },
  })
}
