import { safeStorage } from 'electron'
import { type KeyCodec, stubCodec } from '../ai/keys.js'

/** Secrets encrypted by the system, where it can do better than a fixed password. */
const systemCodec: KeyCodec = {
  available: () =>
    safeStorage.isEncryptionAvailable() &&
    (process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text'),
  encrypt: (plain) => safeStorage.encryptString(plain),
  decrypt: (data) => safeStorage.decryptString(data),
}

/**
 * The codec for secrets main keeps or seals: the system's, or with
 * ELECDEX_AI_KEYS_STUB=1 (the tests) a reversible stand-in, so no run opens
 * the Keychain or a keyring.
 */
export function secretCodec(): KeyCodec {
  return process.env.ELECDEX_AI_KEYS_STUB === '1' ? stubCodec : systemCodec
}
