import { isSealed, SEALED_PREFIX } from '@shared/utility'
import type { KeyCodec } from '../ai/keys.js'

/**
 * A secret the page keeps without being able to read it: sealed by the
 * system's encryption (the AI keys' codec), prefixed with its format, and
 * opened by main again when the page shows what it belongs to.
 *
 * Where the system cannot encrypt well enough (a Linux desktop with no
 * keyring) nothing is sealed: null, and the page says the secret is not saved,
 * rather than keeping it where it could be read.
 */
export function seal(codec: KeyCodec, plain: string): string | null {
  if (!codec.available()) return null
  try {
    return `${SEALED_PREFIX}${codec.encrypt(plain).toString('base64')}`
  } catch {
    return null
  }
}

/** The secret again; null for anything not sealed here, or sealed on another machine or account. */
export function unseal(codec: KeyCodec, sealed: unknown): string | null {
  if (!isSealed(sealed)) return null
  try {
    return codec.decrypt(Buffer.from(sealed.slice(SEALED_PREFIX.length), 'base64'))
  } catch {
    return null
  }
}
