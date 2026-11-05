import { z } from 'zod'

/**
 * The PLaMo 3 Translate GGUF files elecdex may fetch (docs/translate.md §5). Each is pinned to a
 * revision of its repository, with its size and sha256 from that revision, so what is fetched is
 * what was tested and a file that does not match is never put in place. Read from Hugging Face's
 * API on 2026-11-05.
 */

export type ModelTier = 'lite' | 'standard' | 'pro' | 'max'
export type Quant = 'Q4_K_M' | 'Q4_0' | 'Q3_K_M' | 'Q2_K'

export const QUANTS: readonly Quant[] = ['Q4_K_M', 'Q4_0', 'Q3_K_M', 'Q2_K']

export interface ModelEntry {
  /** `plamo3-<params>-<quant>`, the value of settings' `translate.modelId`. */
  id: string
  tier: ModelTier
  /** Parameters as the model card writes them: 0.8B, 2B, 8B, 31B. */
  params: string
  quant: Quant
  repo: string
  revision: string
  file: string
  bytes: number
  sha256: string
  /** Memory the model wants, an estimate to be measured: the setup marks a PC short of it. */
  ramGB: number
  /** VRAM it wants to run on a GPU at a useful speed; null when the CPU is enough. */
  vramGB: number | null
}

const REPO = (params: string): string => `pfnet/plamo-3-translate-${params.toLowerCase()}-GGUF`
const REVISIONS: Record<string, string> = {
  '0.8B': '03891e907db8a43c97d3a7c75add125cc6d1f96a',
  '2B': 'f2b4599dff9b3e45c62567eac15e83186b4cb64e',
  '8B': 'c420296e9694ccb2455f038b3f29eee5a2200217',
  '31B': 'd0df961b923db3ff9fc325f4410d6f09005afcd6',
}
const TIERS: Record<string, { tier: ModelTier; ramGB: number; vramGB: number | null }> = {
  '0.8B': { tier: 'lite', ramGB: 4, vramGB: null },
  '2B': { tier: 'standard', ramGB: 8, vramGB: null },
  '8B': { tier: 'pro', ramGB: 16, vramGB: 8 },
  '31B': { tier: 'max', ramGB: 32, vramGB: 24 },
}

function entry(params: string, quant: Quant, bytes: number, sha256: string): ModelEntry {
  const tier = TIERS[params]
  const revision = REVISIONS[params]
  if (!tier || !revision) throw new Error(`no tier for ${params}`)
  return {
    id: `plamo3-${params.toLowerCase()}-${quant.toLowerCase().replaceAll('_', '')}`,
    params,
    quant,
    repo: REPO(params),
    revision,
    file: `plamo-3-translate-${params.toLowerCase()}-${quant}.gguf`,
    bytes,
    sha256,
    ...tier,
  }
}

export const MODELS: readonly ModelEntry[] = [
  entry(
    '0.8B',
    'Q4_K_M',
    573_116_288,
    '3dbb09295bfd3350231ba0dba92bc72cb14111ef1b034e37dad39d581bd86b9c',
  ),
  entry(
    '0.8B',
    'Q4_0',
    547_532_672,
    '2805c14de045d50f98e35e81aaf0fd23f6baa49aa8e06efcc11c46d44021bd05',
  ),
  entry(
    '0.8B',
    'Q3_K_M',
    486_375_296,
    'c6e6a9d0b05f3c0a7a4b70c6460a68dcf169d417984024b761c50e42e5713cdb',
  ),
  entry(
    '0.8B',
    'Q2_K',
    410_128_256,
    '30ae7b485e0f54980c4a5223d8415adbe04c382b36861687361b2b492929cc16',
  ),
  entry(
    '2B',
    'Q4_K_M',
    1_807_192_480,
    '2c288ecc7ebfe60c3561726580da3583767f3c41ca3ef5c6825bf6c4cc060787',
  ),
  entry(
    '2B',
    'Q4_0',
    1_698_566_560,
    '7a1839ed7f315b03176a7c7bb697629a95f8c3a61e669dfdf1cbeb6471551a66',
  ),
  entry(
    '2B',
    'Q3_K_M',
    1_495_876_000,
    'a940db3afd6749bc74e550e324cccf1beb639cbf2dfe449f9a7f143e696fbec5',
  ),
  entry(
    '2B',
    'Q2_K',
    1_225_601_440,
    'a2a02331f4922d2e283ac83c45cdbe2ab0faaf880e613078cde1299d7be78e2a',
  ),
  entry(
    '8B',
    'Q4_K_M',
    5_280_435_168,
    '6b429549113ce0a61281ac72be195697241f89266f4247efec4893e4f580cf10',
  ),
  entry(
    '8B',
    'Q3_K_M',
    4_310_207_456,
    '2413a3065f8666303d13b39161936786f2d8db9c4f1de4c2d2fcf80a72652fdc',
  ),
  entry(
    '8B',
    'Q2_K',
    3_450_735_584,
    '610bd828dfe6f372437eb35b9be61fefeaa1aaa7861bce8446009f09f1545d3c',
  ),
  entry(
    '31B',
    'Q4_K_M',
    19_526_583_392,
    'd1ed08149f888ef7a0da38e26bf394a13d0f079b592229c8778f5f1a91cf6457',
  ),
  entry(
    '31B',
    'Q3_K_M',
    15_863_120_992,
    'f7b5ff4ce1f893acf029a4b00360bb59898399162576c1d1bbcd587b13c9553a',
  ),
  entry(
    '31B',
    'Q2_K',
    12_609_913_952,
    '3565eb103a56cd7d8a3229f44a33b2bd601bcfa71018a4eed9f6648629ddaf03',
  ),
]

export const DEFAULT_MODEL_ID = 'plamo3-2b-q4km'

export const HF_BASE_URL = 'https://huggingface.co'

/** Where a model file is fetched from, at its pinned revision. */
export function modelUrl(
  base: string,
  model: Pick<ModelEntry, 'repo' | 'revision' | 'file'>,
): string {
  return `${base.replace(/\/+$/, '')}/${model.repo}/resolve/${model.revision}/${model.file}`
}

/** How well a model fits this PC, for the setup's meter: memory first, then the GPU's. */
export type ModelFit = 'fits' | 'tight' | 'too-big'

export function modelFit(model: ModelEntry, ramGB: number, vramGB: number | null): ModelFit {
  if (ramGB < model.ramGB) return ramGB * 2 <= model.ramGB ? 'too-big' : 'tight'
  if (model.vramGB !== null && (vramGB === null || vramGB < model.vramGB)) return 'tight'
  return 'fits'
}

/** The largest standard-quant model that fits this PC: the setup's "for this PC" mark. */
export function recommendedModel(
  models: readonly ModelEntry[],
  ramGB: number,
  vramGB: number | null,
): ModelEntry | undefined {
  return [...models]
    .filter((model) => model.quant === 'Q4_K_M' && modelFit(model, ramGB, vramGB) === 'fits')
    .sort((a, b) => b.bytes - a.bytes)[0]
}

export const ModelEntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9.-]{1,64}$/),
  tier: z.enum(['lite', 'standard', 'pro', 'max']),
  params: z.string().max(16),
  quant: z.enum(['Q4_K_M', 'Q4_0', 'Q3_K_M', 'Q2_K']),
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  revision: z.string().regex(/^[0-9a-f]{7,64}$/),
  file: z.string().regex(/^[\w.-]+\.gguf$/),
  bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  ramGB: z.number().nonnegative(),
  vramGB: z.number().nonnegative().nullable(),
})
