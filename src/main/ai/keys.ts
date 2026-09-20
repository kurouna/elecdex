import { AI_LIMITS, AI_PROVIDER_ID, type AiKeyStorage } from '@shared/ai'
import { z } from 'zod'

/**
 * API keys, by provider id.
 *
 * A key is encrypted by the operating system (Electron's safeStorage: DPAPI, the
 * Keychain, the desktop's secret service) before it is written, so the file is
 * useless on another account or machine, and it lives apart from settings.json,
 * which people copy around and paste into bug reports. Where the system cannot
 * encrypt - a Linux desktop with no keyring, where safeStorage would fall back to
 * a fixed password - the key is kept in memory until elecdex quits and the user
 * is told so, rather than written somewhere it could be read.
 *
 * Nothing touches the system's encryption until a key is stored or needed: on
 * macOS the first use is what creates the Keychain entry.
 */

export interface KeyCodec {
  /** Whether keys can be encrypted well enough to write them down. */
  available(): boolean
  encrypt(plain: string): Buffer
  decrypt(data: Buffer): string
}

export const KeyFileSchema = z.object({
  version: z.literal(1).default(1),
  /** Provider id -> the encrypted key, base64. */
  keys: z.record(z.string().regex(AI_PROVIDER_ID), z.string().max(8192)).default({}),
})
export type KeyFile = z.infer<typeof KeyFileSchema>

export const emptyKeyFile = (): KeyFile => ({ version: 1, keys: {} })

/**
 * The tests' codec: reversible and nothing to do with the machine, so no run
 * opens the Keychain or a keyring (and none waits on the prompt either may show).
 */
export const stubCodec: KeyCodec = {
  available: () => true,
  encrypt: (plain) => Buffer.from(`stub:${plain}`, 'utf8'),
  decrypt: (data) => data.toString('utf8').replace(/^stub:/, ''),
}

export class KeyVault {
  private readonly codec: KeyCodec
  private readonly load: () => KeyFile
  private readonly persist: (file: KeyFile) => void
  private file: KeyFile | null = null
  private readonly session = new Map<string, string>()

  constructor(deps: { codec: KeyCodec; load: () => KeyFile; save: (file: KeyFile) => void }) {
    this.codec = deps.codec
    this.load = deps.load
    this.persist = deps.save
  }

  /** Where the key was put, or null when it is not one. */
  set(id: string, key: string): AiKeyStorage {
    const trimmed = key.trim()
    if (!AI_PROVIDER_ID.test(id) || trimmed === '' || trimmed.length > AI_LIMITS.key) return null
    if (!this.codec.available()) {
      this.session.set(id, trimmed)
      return 'session'
    }
    const file = this.read()
    const encrypted = this.codec.encrypt(trimmed).toString('base64')
    this.write({ ...file, keys: { ...file.keys, [id]: encrypted } })
    this.session.delete(id)
    return 'stored'
  }

  remove(id: string): void {
    this.session.delete(id)
    const file = this.read()
    if (!(id in file.keys)) return
    const { [id]: _gone, ...keys } = file.keys
    this.write({ ...file, keys })
  }

  /** Without decrypting anything: asking whether a key is held must not open the Keychain. */
  storage(id: string): AiKeyStorage {
    if (this.session.has(id)) return 'session'
    return id in this.read().keys ? 'stored' : null
  }

  /** The key itself, for main's own request. Null when none is held or it no longer decrypts. */
  get(id: string): string | null {
    const held = this.session.get(id)
    if (held !== undefined) return held
    const stored = this.read().keys[id]
    if (stored === undefined) return null
    try {
      return this.codec.decrypt(Buffer.from(stored, 'base64'))
    } catch {
      // Encrypted on another account or machine: as good as no key.
      return null
    }
  }

  private read(): KeyFile {
    this.file ??= this.load()
    return this.file
  }

  private write(file: KeyFile): void {
    this.file = file
    this.persist(file)
  }
}
