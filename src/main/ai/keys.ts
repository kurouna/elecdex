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
  /**
   * Provider id -> the origin its key was typed for. A key goes only there: a provider whose
   * address was changed since (in the dialog, or settings.json by hand) is sent none until it is
   * typed again (found in review: the key went to whatever https host the address then named).
   * A key written before there was such a thing takes its provider's address when main starts
   * (`KeyVault.adopt`).
   */
  origins: z.record(z.string().regex(AI_PROVIDER_ID), z.string().max(2048)).default({}),
  /**
   * Whether the keys from before addresses were kept have been given theirs: once, at the first
   * start of a version that keeps them. A key left without one then stays so (found in review:
   * a later start bound it to whatever address a page had set by then). Missing: a file from
   * before; a new file has nothing to adopt.
   */
  adopted: z.boolean().default(false),
})
export type KeyFile = z.infer<typeof KeyFileSchema>

export const emptyKeyFile = (): KeyFile => ({ version: 1, keys: {}, origins: {}, adopted: true })

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
  private readonly session = new Map<string, { key: string; origin: string | null }>()

  constructor(deps: { codec: KeyCodec; load: () => KeyFile; save: (file: KeyFile) => void }) {
    this.codec = deps.codec
    this.load = deps.load
    this.persist = deps.save
  }

  /** Where the key was put, or null when it is not one. `origin`: the address it is for. */
  set(id: string, key: string, origin: string | null = null): AiKeyStorage {
    const trimmed = key.trim()
    if (!AI_PROVIDER_ID.test(id) || trimmed === '' || trimmed.length > AI_LIMITS.key) return null
    if (!this.codec.available()) {
      this.session.set(id, { key: trimmed, origin })
      return 'session'
    }
    const file = this.read()
    const encrypted = this.codec.encrypt(trimmed).toString('base64')
    const { [id]: _was, ...origins } = file.origins
    this.write({
      ...file,
      keys: { ...file.keys, [id]: encrypted },
      origins: origin === null ? origins : { ...origins, [id]: origin },
    })
    this.session.delete(id)
    return 'stored'
  }

  remove(id: string): void {
    this.session.delete(id)
    const file = this.read()
    if (!(id in file.keys) && !(id in file.origins)) return
    const { [id]: _gone, ...keys } = file.keys
    const { [id]: _where, ...origins } = file.origins
    this.write({ ...file, keys, origins })
  }

  /**
   * Whether the key held for a provider was typed for another address than `origin` - or, a
   * stored key from before addresses were kept that `adopt` found none for, for no address at
   * all: either way it is not sent, and the request is refused in words rather than sent
   * without it to fail as a wrong key (found in review).
   */
  moved(id: string, origin: string | null): boolean {
    if (origin === null) return false
    const session = this.session.get(id)
    // One typed while the address was none is bound to none, as a stored one is (review).
    if (session !== undefined) return session.origin !== origin
    const file = this.read()
    if (!(id in file.keys)) return false
    const held = file.origins[id]
    return held === undefined || held !== origin
  }

  /** Without decrypting anything: asking whether a key is held must not open the Keychain. */
  storage(id: string): AiKeyStorage {
    if (this.session.has(id)) return 'session'
    return id in this.read().keys ? 'stored' : null
  }

  /**
   * The key itself, for main's own request to `origin` (left out: wherever, for the tests that
   * only hold keys). Null when none is held, it no longer decrypts, or it was typed for another
   * address.
   */
  get(id: string, origin: string | null = null): string | null {
    if (this.moved(id, origin)) return null
    const held = this.session.get(id)
    if (held !== undefined) return held.key
    const file = this.read()
    const stored = file.keys[id]
    if (stored === undefined) return null
    let key: string
    try {
      key = this.codec.decrypt(Buffer.from(stored, 'base64'))
    } catch {
      // Encrypted on another account or machine: as good as no key.
      return null
    }
    // A key from before addresses were kept that `adopt` found no address for goes nowhere
    // (`moved`): bound to the first it was sent to, it went wherever a page that had changed the
    // address first asked for it (issue 28).
    return key
  }

  /**
   * Binds each stored key kept before addresses were, with none yet, to its provider's address
   * as settings.json has it when main starts - before any page could change it. A key with no
   * address to take is kept, and sent to none until it is typed again.
   */
  adopt(providers: readonly { id: string; origin: string | null }[]): void {
    const file = this.read()
    if (file.adopted) return
    const adopted: Record<string, string> = {}
    for (const { id, origin } of providers) {
      if (origin !== null && id in file.keys && file.origins[id] === undefined) {
        adopted[id] = origin
      }
    }
    this.write({ ...file, origins: { ...file.origins, ...adopted }, adopted: true })
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

/**
 * The vault as main opens it at the start, before any page runs: the keys from before addresses
 * were kept take their providers' addresses from settings.json as it is now (`adopt`).
 */
export function openKeyVault(
  deps: ConstructorParameters<typeof KeyVault>[0],
  providers: readonly { id: string; origin: string | null }[],
): KeyVault {
  const vault = new KeyVault(deps)
  vault.adopt(providers)
  return vault
}
