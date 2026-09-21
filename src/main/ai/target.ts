import { type AiProvider, aiBaseUrl, keyMayTravel } from '@shared/ai'

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
  keyFor: (providerId: string) => string | null,
  providerId: string,
): Target | string {
  const provider = providers.find((p) => p.id === providerId)
  if (provider === undefined) return 'that provider is no longer listed in the settings'
  const baseUrl = aiBaseUrl(provider.baseUrl)
  if (baseUrl === null) return `${provider.name}: the address is not a usable http(s) URL`
  const key = keyFor(provider.id)
  if (key !== null && !keyMayTravel(baseUrl)) {
    return `${provider.name}: the key is not sent over plain http to another network - use https`
  }
  return { provider, baseUrl, key }
}
