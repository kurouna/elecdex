import type { AiModel, ChatStop } from '@shared/ai'

/**
 * What the chat service needs of a provider, whatever dialect it speaks. One
 * adapter per dialect (openai.ts, anthropic.ts); each is loaded the first time a
 * provider of its kind is used, so an app with no chat pane loads neither.
 */

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>

export interface AdapterTarget {
  /** Canonical (`aiBaseUrl`). */
  baseUrl: string
  /** Null for a server that asks for none. */
  key: string | null
  signal: AbortSignal
}

/**
 * An image or a document going with a question, as base64. Each dialect puts it in its own part
 * (openai.ts, anthropic.ts); a text file is already part of the text (`composeText`).
 */
export type Media =
  | { kind: 'image'; mime: 'image/png' | 'image/jpeg'; data: string }
  | { kind: 'pdf'; name: string; data: string }

export interface WireMessage {
  role: 'user' | 'assistant'
  text: string
  /** Sent ahead of the text, as the services advise for images and documents. */
  media?: readonly Media[]
}

export interface StreamRequest extends AdapterTarget {
  model: string
  /** Empty for none. */
  system: string
  messages: readonly WireMessage[]
  /** At most this many tokens of answer (LINK's short ones); unset: as much as the model gives. */
  maxTokens?: number
  /** No reasoning, even from a model that has it (LINK: a short answer, soon, cheaply). */
  noThinking?: boolean
  /**
   * Let the provider search the web on its own side (LINK's SEARCH and WEATHER). Nothing runs
   * here; a provider that cannot refuses the request, or ignores it.
   */
  webSearch?: boolean
}

export interface StreamSink {
  text(piece: string): void
  thinking(piece: string): void
}

export interface StreamResult {
  /** Unset when the answer simply finished. */
  stop?: ChatStop
  /** Said with a stop that needs explaining (a refusal's reason). */
  note?: string
  usage?: { input: number; output: number }
  /** The model that answered, when the service names another than the one asked for. */
  model?: string
  /**
   * After a search: only the text written after the last result, the answer itself, where the
   * text streamed also has what the model said while it searched.
   */
  answer?: string
}

export interface ProviderAdapter {
  stream(request: StreamRequest, sink: StreamSink): Promise<StreamResult>
  models(target: AdapterTarget): Promise<AiModel[]>
}

/** A failure worded for the pane. Anything else thrown is worded by `describeFailure`. */
export class ProviderError extends Error {}

const STATUS_WORDS: Record<number, string> = {
  400: 'the request was not accepted',
  401: 'the key was refused',
  403: 'the key may not do this',
  404: 'no such model or address',
  413: 'the conversation is too long for this model',
  429: 'rate limited - try again in a moment',
  500: 'the provider failed',
  502: 'the provider is unreachable',
  503: 'the provider is overloaded',
  529: 'the provider is overloaded',
}

/** Nobody answered at the address: not running, not there, no network. */
export class UnreachableError extends ProviderError {}

const UNREACHABLE =
  /ECONNREFUSED|EHOSTUNREACH|ENETUNREACH|ETIMEDOUT|ERR_CONNECTION_REFUSED|ERR_CONNECTION_TIMED_OUT|ERR_ADDRESS_UNREACHABLE/i
const UNRESOLVED = /ENOTFOUND|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED/i

/** Every message a failed fetch may carry: its own, and its cause's (Node says "fetch failed" and puts why below). */
function messagesOf(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const cause = error.cause instanceof Error ? ` ${error.cause.message}` : ''
  return `${error.message}${cause}`
}

/** Whether a failure is the link itself, which the pane words as NO CARRIER. */
export function isUnreachable(error: unknown): boolean {
  if (error instanceof UnreachableError) return true
  if (error instanceof ProviderError) return false
  const message = messagesOf(error)
  return UNREACHABLE.test(message) || UNRESOLVED.test(message)
}

/** "the key was refused (401): invalid x-api-key", with the service's own words when it gave any. */
export function statusFailure(status: number, detail: string | null): ProviderError {
  const words = STATUS_WORDS[status] ?? 'the request failed'
  const said = detail === null || detail === '' ? '' : `: ${detail.slice(0, 300)}`
  return new ProviderError(`${words} (${status})${said}`)
}

/** What to show for anything an adapter threw. The key is never part of an error. */
export function describeFailure(error: unknown, baseUrl: string): string {
  if (error instanceof ProviderError) return error.message
  const host = hostOf(baseUrl)
  const message = messagesOf(error)
  if (UNRESOLVED.test(message)) return `could not find ${host}`
  if (UNREACHABLE.test(message)) return `could not reach ${host} - is it running?`
  if (/redirect/i.test(message)) return `${host} answered with a redirect, which is not followed`
  return message.slice(0, 300)
}

const hostOf = (baseUrl: string): string => {
  try {
    return new URL(baseUrl).host
  } catch {
    return 'the provider'
  }
}
