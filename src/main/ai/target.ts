import { type AiProvider, aiBaseUrl, keyMayTravel } from '@shared/ai'

/**
 * What asking for a provider's key may answer besides the key or none: a key is held, but was
 * typed for another address than the provider has now, and goes nowhere else. Said apart, so a
 * request is refused in words rather than sent without the key and refused by the provider as
 * if the key were wrong (issue 18).
 */
export const KEY_MOVED: unique symbol = Symbol('key typed for another address')

/** A provider's key for a request to its address now. */
export type KeyLookup = (providerId: string) => string | null | typeof KEY_MOVED

/** A provider ready to be asked: its canonical address, and its key when one is held. */
export interface Target {
  provider: AiProvider
  baseUrl: string
  key: string | null
}

/**
 * Where a request for a provider goes, or why it cannot: the chat pane and the
 * ELEC system ask the same providers under the same rules - a listed provider,
 * a usable address, and no key sent over plain http beyond the local network.
 */
export function targetFor(
  providers: readonly AiProvider[],
  keyFor: KeyLookup,
  providerId: string,
): Target | string {
  const provider = providers.find((p) => p.id === providerId)
  if (provider === undefined) return 'that provider is no longer listed in the settings'
  const baseUrl = aiBaseUrl(provider.baseUrl)
  if (baseUrl === null) return `${provider.name}: the address is not a usable http(s) URL`
  const key = keyFor(provider.id)
  if (key === KEY_MOVED) {
    return `${provider.name}: its key was typed for another address - type it again in the AI settings to use it here`
  }
  if (key !== null && !keyMayTravel(baseUrl)) {
    return `${provider.name}: the key is not sent over plain http to another network - use https`
  }
  return { provider, baseUrl, key }
}
