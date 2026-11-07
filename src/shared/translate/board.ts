import { z } from 'zod'
import { type EngineBackend, LICENSE_URL } from './engines.js'
import type { ServerModel } from './external.js'

/**
 * What a TRANSLATE pane is shown of the engine, the models and a fetch (docs/translate.md §8.3,
 * §8.4): main's board, sent whole on every change to the pages subscribed. The page never learns
 * the server's key; it learns the port only to show it.
 */

export type EngineSourceKind = 'fetched' | 'own' | 'external'

/**
 * What a choice of engine (TEST, an own llama-server) answers when a later choice cut it off: it took
 * nothing, and the page shows nothing of it - the later choice says how it went.
 */
export const CHOSEN_MEANWHILE = 'Another engine was chosen meanwhile.'

/** The engine's state (§8.4). The external-* states replace the others for a server elecdex did not start. */
export type EnginePhase =
  | 'absent'
  | 'stopped'
  | 'starting'
  | 'ready'
  | 'stopping'
  | 'fault'
  | 'external-untested'
  | 'external-ready'
  | 'external-unreachable'

export interface EngineView {
  phase: EnginePhase
  source: EngineSourceKind
  /** The build that runs or would run ("b12110"), null when none is known yet. */
  build: string | null
  backend: EngineBackend | null
  /** The GPU llama-server named, when it runs on one. */
  device: string | null
  port: number | null
  ctx: number
  /** Why it stopped or could not start: the last error line of its log, or ours. */
  error: string | null
  /** Why the GPU build gave way to the CPU one. */
  fallback: string | null
  /** The lines of the boot so far, for BOOT (§3). */
  bootLines: string[]
  /** The external server's host, and whether it is this machine (§3's footer). */
  externalHost: string | null
  externalLoopback: boolean
  /**
   * The external server's origin as saved (scheme, host, port): what TEST asks again when nothing
   * is typed, so an https server is never tried as http.
   */
  externalOrigin: string | null
  /**
   * What the external server runs, read when TEST passes, when ENGINE opens and when the server
   * answers again: empty for elecdex's own engines, and until TEST passes.
   */
  serverModels: ServerModel[]
  /** Why the external server cannot be used, as last heard (not PLaMo, a key, no answer). */
  serverProblem: string | null
  /** The user's own llama-server: its file name and build, once chosen. */
  own: { name: string; build: number } | null
  /** Whether the engine elecdex fetches is in place. */
  fetched: boolean
  /** Bytes of the llama.cpp builds a fetch would bring: 0 when they are in place or not elecdex's. */
  toFetchBytes: number
}

export interface ModelView {
  id: string
  installed: boolean
  /** The commit of the file in place, or null. */
  revision: string | null
  /** A newer commit than the one in place, found by ENGINE's daily check (§5); null when none. */
  update: { revision: string; date: string | null } | null
  /** Bytes of an unfinished fetch, kept to resume. */
  partialBytes: number
  /**
   * When the licence and the fetch were agreed to for this model's newest commit known, or null:
   * an agreement to an older commit, or one made before commits were followed, is asked again.
   */
  consentAt: string | null
}

export interface FetchView {
  kind: 'engine' | 'model'
  /** The model's id, or the engine's target. */
  id: string
  phase: 'downloading' | 'verifying' | 'placing' | 'paused' | 'failed'
  received: number
  total: number
  /** Bytes a second, smoothed. */
  speed: number
  error: string | null
}

export interface MachineView {
  ramGB: number
  vramGB: number | null
  gpu: string | null
  freeBytes: number | null
}

export interface TranslateBoard {
  engine: EngineView
  models: ModelView[]
  fetch: FetchView | null
  /**
   * The model the fetch (under way, paused or failed) is for, or null: not always the model in use,
   * which goes on translating until the new one is in place and chosen (2026-11-07).
   */
  fetchingModel: string | null
  selectedModel: string
  /** Grows with every change of the glossaries or the history: a pane showing either asks again. */
  library: number
  machine: MachineView
}

/** What main keeps of the engine in translate/engine.json (§8.1): never reachable from settings.patch. */
export const EngineFileSchema = z.object({
  source: z.enum(['fetched', 'own', 'external']).catch('fetched').default('fetched'),
  own: z
    .object({ path: z.string().min(1).max(1000), build: z.number().int().nonnegative() })
    .nullable()
    .catch(null)
    .default(null),
  external: z
    .object({ origin: z.string().max(300) })
    .nullable()
    .catch(null)
    .default(null),
  /** `--list-devices` of each build, asked once (§4.2). */
  devices: z
    .record(z.string(), z.array(z.string().max(200)).max(16))
    .catch({})
    .default({}),
  /**
   * Each agreement, with the file it is for: the newest commit when it was made, its size and
   * sha256 (§5). One made before commits were followed has no size: it is asked again.
   */
  consents: z
    .record(
      z.string(),
      z.object({
        at: z.string().max(40),
        revision: z.string().max(64),
        licence: z.string().max(300),
        bytes: z.number().int().positive().optional(),
        sha256: z
          .string()
          .regex(/^[0-9a-f]{64}$/)
          .optional(),
      }),
    )
    .catch({})
    .default({}),
  /** The file each model has in place, once fetched: what it is checked against (§5). */
  installed: z
    .record(
      z.string(),
      z.object({
        revision: z.string().max(64),
        bytes: z.number().int().positive(),
        sha256: z.string().regex(/^[0-9a-f]{64}$/),
        at: z.string().max(40),
      }),
    )
    .catch({})
    .default({}),
  /** Each repository's newest commit, as last heard (an agreement, or ENGINE's daily check). */
  latest: z
    .record(
      z.string(),
      z.object({
        revision: z.string().max(64),
        date: z.string().max(40).nullable(),
        /** Each GGUF file at that commit: an update is a file that changed, not a commit. */
        files: z
          .record(
            z.string(),
            z.object({
              bytes: z.number().int().positive(),
              sha256: z.string().regex(/^[0-9a-f]{64}$/),
            }),
          )
          .catch({})
          .default({}),
      }),
    )
    .catch({})
    .default({}),
  /** When ENGINE last asked for newer commits: at most once a day (user's request 2026-11-06). */
  checkedAt: z.string().max(40).nullable().catch(null).default(null),
})

export type EngineFile = z.infer<typeof EngineFileSchema>

export const PLAMO_LICENSE_URL = 'https://plamo.preferredai.jp/info/plamo-community-license-ja'

/**
 * The pages SETUP and ENGINE open in the browser, by name: the page names one, main opens only
 * these. The registration form is the one the licence itself gives (Article 3).
 */
export const LICENCE_PAGES = {
  plamo: PLAMO_LICENSE_URL,
  register: 'https://forms.gle/mTL8tBLrMYXKNZD56',
  llama: LICENSE_URL,
} as const
export type LicencePage = keyof typeof LICENCE_PAGES
export const isLicencePage = (raw: unknown): raw is LicencePage =>
  typeof raw === 'string' && Object.hasOwn(LICENCE_PAGES, raw)
