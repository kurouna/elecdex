/**
 * LINK at FF70-FF7E (docs/elec16.md section 12): a program's way to main's services - the AI
 * first. It knows the services only by the table in link-services.ts.
 *
 * The core never reaches out. SEND is checked and captured here as a request (the question's
 * bytes, the service, its type, how much may come back) with LINK BUSY; the page takes the
 * request, main answers it, and `answerLink` writes the answer at REPLY and raises the LINK
 * line. A request carries a serial, so an answer to one cancelled is never taken for the next.
 *
 * Two things keep a program from running up someone's bill. A SEND goes only after a person
 * did something since the last one (`vouched`: a key of the machine, BRK/ON, RESET, the
 * pane's RUN and LOAD - never a key PASTE typed): otherwise HELD. And the conversation the
 * service keeps starts afresh (`fresh`) after NEW, a change of type, RESET or the power going
 * off - carried on the next request, so main needs no word of its own for it.
 */

import { LINK_CMD, LINK_QUERY_MAX, LINK_REG, LINK_STATUS, linkServiceOf } from './link-services.js'
import { RAM_SIZE } from './map.js'
import type { Elec16State } from './state.js'

export interface LinkRequest {
  /** Told apart from the request before it, which may still be answered late. */
  serial: number
  service: number
  type: number
  /** The question's bytes, without the zero. */
  query: Uint8Array
  /** The most bytes the answer may have. */
  max: number
  /** The conversation starts afresh with this one. */
  fresh: boolean
}

export interface LinkAnswer {
  status: number
  /** READY's bytes (a text answer without its zero); at most the request's max are taken. */
  data?: Uint8Array
  /** Why it failed, in the service's own words, for the pane to show (the machine never sees it). */
  note?: string
}

export interface LinkState {
  service: number
  type: number
  query: number
  reply: number
  max: number
  status: number
  length: number
  /** The LINK line: up from an answer (or a refusal) until STATUS is read or another SEND. */
  pending: boolean
  /** A request is out (taken or not) and not yet answered. */
  busy: boolean
  /** The request out for the page to take; null once taken, or none. */
  request: LinkRequest | null
  /** The serial of the last request. */
  serial: number
  /** A request the page should tell main to drop (cancelled, or the machine reset). */
  dropped: number | null
  /**
   * Where the request out was checked to answer, and how much: REPLY and MAX as SEND found
   * them - a program may write the registers while it waits. Not kept by a snapshot (a request
   * out comes back INTERRUPTED).
   */
  outReply: number
  outMax: number
  /** The request out carried NEW: dropped unanswered, the next SEND carries it again. */
  outFresh: boolean
  /** A person did something since the last SEND. */
  vouched: boolean
  /** The next SEND starts a new conversation. */
  fresh: boolean
}

export const createLinkState = (): LinkState => ({
  service: 0,
  type: 0,
  query: 0,
  reply: 0,
  max: 0,
  status: LINK_STATUS.ready,
  length: 0,
  pending: false,
  busy: false,
  request: null,
  serial: 0,
  dropped: null,
  outReply: 0,
  outMax: 0,
  outFresh: false,
  vouched: false,
  fresh: true,
})

/** The question at `at`: its bytes up to the zero; null when it is empty, too long or unended. */
function queryAt(ram: Uint8Array, at: number): Uint8Array | null {
  for (let k = 0; k <= LINK_QUERY_MAX && at + k < RAM_SIZE; k++) {
    if (ram[at + k] === 0) return k === 0 ? null : ram.slice(at, at + k)
  }
  return null
}

/** SEND checked: the request it makes, or the status that refuses it. */
function requestOf(s: Elec16State): LinkRequest | number {
  const link = s.link
  const info = linkServiceOf(link.service)
  if (info === null) return LINK_STATUS.noService
  if (link.type >= info.types.length) return LINK_STATUS.badRequest
  if (link.max < 1 || link.max > info.max || link.reply + link.max + 1 > RAM_SIZE) {
    return LINK_STATUS.badRequest
  }
  const query = queryAt(s.ram, link.query)
  if (query === null) return LINK_STATUS.badRequest
  if (!link.vouched) return LINK_STATUS.held
  return {
    serial: (link.serial + 1) & 0xffff,
    service: link.service,
    type: link.type,
    query,
    max: link.max,
    fresh: link.fresh,
  }
}

function send(s: Elec16State): void {
  const link = s.link
  if (link.busy) return
  link.pending = false
  const made = requestOf(s)
  if (typeof made === 'number') {
    link.status = made
    link.length = 0
    link.pending = true
    return
  }
  link.request = made
  link.serial = made.serial
  link.outReply = link.reply
  link.outMax = link.max
  link.outFresh = made.fresh
  link.busy = true
  link.vouched = false
  link.fresh = false
  link.status = LINK_STATUS.busy
  link.length = 0
}

/** The request out ends unanswered: main is told to drop it. */
function drop(s: Elec16State, status: number): void {
  const link = s.link
  if (!link.busy) return
  link.busy = false
  link.request = null
  link.dropped = link.serial
  // main may never have heard of the NEW it carried (the page had not taken it): kept.
  if (link.outFresh) link.fresh = true
  link.status = status
  link.length = 0
  link.pending = true
}

export function linkWrite(s: Elec16State, address: number, value: number): void {
  const link = s.link
  switch (address) {
    case LINK_REG.cmd:
      if (value === LINK_CMD.send) send(s)
      else if (value === LINK_CMD.fresh) link.fresh = true
      else if (value === LINK_CMD.cancel) drop(s, LINK_STATUS.cancelled)
      return
    // A byte each, as ROM service 8 passes them (a3 = service * 256 + type).
    case LINK_REG.service:
      if (link.service !== (value & 0xff)) link.fresh = true
      link.service = value & 0xff
      return
    case LINK_REG.type:
      if (link.type !== (value & 0xff)) link.fresh = true
      link.type = value & 0xff
      return
    case LINK_REG.query:
      link.query = value
      return
    case LINK_REG.reply:
      link.reply = value
      return
    case LINK_REG.max:
      link.max = value
      return
    default:
  }
}

/** A register read; STATUS (not a peek) drops the LINK line. */
export function linkRead(s: Elec16State, address: number, peek: boolean): number {
  const link = s.link
  switch (address) {
    case LINK_REG.service:
      return link.service
    case LINK_REG.type:
      return link.type
    case LINK_REG.query:
      return link.query
    case LINK_REG.reply:
      return link.reply
    case LINK_REG.max:
      return link.max
    case LINK_REG.status:
      if (!peek) link.pending = false
      return link.status
    case LINK_REG.length:
      return link.length
    default:
      return 0
  }
}

/** The request out, for the page to send to main; null when there is none (or it was taken). */
export function takeLinkRequest(s: Elec16State): LinkRequest | null {
  const request = s.link.request
  s.link.request = null
  return request
}

/** The serial of a request main should drop, once; null when there is none. */
export function takeLinkDrop(s: Elec16State): number | null {
  const serial = s.link.dropped
  s.link.dropped = null
  return serial
}

/**
 * main's answer: READY's bytes go to REPLY (at most MAX of them) with a zero after, the
 * status and LENGTH are set and the line goes up. An answer to a request no longer out - one
 * cancelled, or from before a reset - changes nothing.
 */
export function answerLink(s: Elec16State, serial: number, answer: LinkAnswer): void {
  const link = s.link
  if (!link.busy || serial !== link.serial) return
  link.busy = false
  link.pending = true
  link.status = answer.status
  link.length = 0
  if (answer.status !== LINK_STATUS.ready) return
  const bytes = (answer.data ?? new Uint8Array()).subarray(0, link.outMax)
  s.ram.set(bytes, link.outReply)
  s.ram[link.outReply + bytes.length] = 0
  link.length = bytes.length
}

/** A person did something: the next SEND may go. */
export function vouchLink(s: Elec16State): void {
  s.link.vouched = true
}

/**
 * RESET or the power going off: a request out is dropped (its answer is for a program that is
 * gone), and the conversation starts afresh.
 */
export function linkLetGo(s: Elec16State): void {
  drop(s, LINK_STATUS.cancelled)
  s.link.pending = false
  s.link.fresh = true
}

/** The machine put away while it waited (snapshot.ts): what it waited for is over. */
export function linkInterrupted(s: Elec16State): void {
  const link = s.link
  link.busy = false
  link.request = null
  link.status = LINK_STATUS.interrupted
  link.length = 0
  link.pending = true
}
