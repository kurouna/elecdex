import type { LinkAnswer, LinkRequest } from '@shared/elec16/link'
import { LINK_QUERY_MAX, LINK_STATUS, linkServiceOf } from '@shared/elec16/link-services'
import { z } from 'zod'

/**
 * LINK's side in main (docs/elec16.md section 12): a request a unit's machine made, passed on
 * by the page that runs it, given to the service it names. The hub knows no service: each is
 * a `LinkService` (the AI is ai.ts), and another is one more in the list. What the hub does is
 * the same for all - one request at a time a unit, a time limit, dropping one the machine let
 * go, and nothing at all while LINK is off in TUNE. Free of Electron, everything passed in.
 */

/** What a service gets beside the request. */
export interface LinkContext {
  unit: string
  /** Aborted when the machine lets the request go, or it took too long. */
  signal: AbortSignal
}

export interface LinkService {
  /** Its SERVICE number (link-services.ts). */
  readonly service: number
  ask(request: LinkRequest, context: LinkContext): Promise<LinkAnswer>
  /** The unit's conversation, or whatever it keeps for one, forgotten. */
  forget(unit: string): void
}

export interface LinkHubDeps {
  services: readonly LinkService[]
  /** LINK is on in TUNE. */
  enabled(): boolean
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
}

/** A request with no answer by then is given up: FAILED. */
export const LINK_TIMEOUT_MS = 60_000

/** A request as the page passes it on, checked: the page is not trusted to have. */
const RequestSchema = z.object({
  serial: z.number().int().min(0).max(0xffff),
  service: z.number().int().min(0).max(0xffff),
  type: z.number().int().min(0).max(0xffff),
  query: z.instanceof(Uint8Array).refine((q) => q.length >= 1 && q.length <= LINK_QUERY_MAX),
  max: z.number().int().min(1).max(0xffff),
  fresh: z.boolean(),
})

interface Out {
  serial: number
  abort: AbortController
}

export class LinkHub {
  readonly #deps: LinkHubDeps
  /** The request out for each unit. */
  readonly #out = new Map<string, Out>()

  constructor(deps: LinkHubDeps) {
    this.#deps = deps
  }

  /** A unit's request, answered; the one it had out before is dropped. */
  async ask(unit: string, raw: unknown): Promise<LinkAnswer> {
    const checked = this.#check(raw)
    if ('status' in checked) return checked
    const { request, service } = checked
    if (!this.#deps.enabled()) {
      // Off is a fresh start: what was said before is not taken up again when it comes on.
      for (const s of this.#deps.services) s.forget(unit)
      return { status: LINK_STATUS.off, note: 'LINK is off: turn it on in TUNE' }
    }
    this.#out.get(unit)?.abort.abort()
    const out: Out = { serial: request.serial, abort: new AbortController() }
    this.#out.set(unit, out)
    let late = false
    const timer = this.#deps.setTimer(() => {
      late = true
      out.abort.abort()
    }, LINK_TIMEOUT_MS)
    try {
      return await service.ask(request, { unit, signal: out.abort.signal })
    } catch (error) {
      if (late) return { status: LINK_STATUS.failed, note: 'no answer within a minute' }
      if (out.abort.signal.aborted) return { status: LINK_STATUS.cancelled }
      const said = error instanceof Error ? error.message : String(error)
      return { status: LINK_STATUS.failed, note: said.slice(0, 300) }
    } finally {
      this.#deps.clearTimer(timer)
      if (this.#out.get(unit) === out) this.#out.delete(unit)
    }
  }

  /** A request as the page passed it, checked, and its service; or the status refusing it. */
  #check(raw: unknown): { request: LinkRequest; service: LinkService } | LinkAnswer {
    const parsed = RequestSchema.safeParse(raw)
    if (!parsed.success) return { status: LINK_STATUS.badRequest }
    const request = parsed.data
    const info = linkServiceOf(request.service)
    const service = this.#deps.services.find((s) => s.service === request.service)
    if (info === null || service === undefined) return { status: LINK_STATUS.noService }
    if (request.type >= info.types.length || request.max > info.max) {
      return { status: LINK_STATUS.badRequest }
    }
    return { request, service }
  }

  /** The machine let this request go (CANCEL, BRK, RESET, the power): stop asking for it. */
  drop(unit: string, serial: unknown): void {
    const out = this.#out.get(unit)
    if (out !== undefined && out.serial === serial) out.abort.abort()
  }

  /** The unit is let go (its pane closed, its page gone): whatever it had out is dropped. */
  dropUnit(unit: string): void {
    this.#out.get(unit)?.abort.abort()
    this.#out.delete(unit)
  }

  /** The units with a request out, sorted (the `watching` diagnostic). */
  watching(): string[] {
    return [...this.#out.keys()].sort()
  }

  dispose(): void {
    for (const out of this.#out.values()) out.abort.abort()
    this.#out.clear()
  }
}
