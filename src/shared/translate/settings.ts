import { z } from 'zod'
import { DEFAULT_MODEL_ID, MODELS } from './models.js'

/**
 * The `translate` section of settings.json (docs/translate.md §8.2). Six keys, and only these: a
 * zod object drops any other, so a patch from the page carrying an engine path or a server
 * address changes nothing (those live in main's translate/engine.json, §8.1).
 */

export const CTX_SIZES = [4096, 8192, 16384, 32768] as const
export const IDLE_MINUTES = [5, 10, 30, 0] as const

const MODEL_IDS = new Set(MODELS.map((model) => model.id))

export const TRANSLATE_DEFAULTS = {
  modelId: DEFAULT_MODEL_ID,
  ctx: 16384,
  device: 'auto' as 'auto' | 'cpu',
  idleMinutes: 10,
  live: true,
  saveHistory: true,
}

export const TranslateSettingsSchema = z.object({
  /** A model of the manifest; an unknown id falls back to the default. */
  modelId: z
    .string()
    .refine((id) => MODEL_IDS.has(id))
    .catch(DEFAULT_MODEL_ID)
    .default(DEFAULT_MODEL_ID),
  ctx: z
    .number()
    .refine((n) => (CTX_SIZES as readonly number[]).includes(n))
    .catch(TRANSLATE_DEFAULTS.ctx)
    .default(TRANSLATE_DEFAULTS.ctx),
  /** auto: the GPU build, the CPU one when it fails; cpu: the CPU only. */
  device: z.enum(['auto', 'cpu']).catch('auto').default('auto'),
  /** Minutes without a translation before the engine stops; 0 never stops it. */
  idleMinutes: z
    .number()
    .refine((n) => (IDLE_MINUTES as readonly number[]).includes(n))
    .catch(TRANSLATE_DEFAULTS.idleMinutes)
    .default(TRANSLATE_DEFAULTS.idleMinutes),
  live: z.boolean().catch(true).default(true),
  saveHistory: z.boolean().catch(true).default(true),
})

export type TranslateSettings = z.infer<typeof TranslateSettingsSchema>
