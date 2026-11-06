import { z } from 'zod'

/**
 * The llama.cpp build elecdex fetches to run the model (docs/translate.md §4.1): one release,
 * pinned with every archive's size and sha256 as GitHub publishes them. b12110 is the build of
 * llama.cpp v0.9.0 (commit cd959bae), the one the PLaMo test app was tried with.
 */

export const ENGINE_BUILD = 'b12110'
export const ENGINE_COMMIT = 'cd959bae99ff4bed22bef2604f45241c09bbb8c8'
/** The first build that reads PLaMo 3 (llama.cpp PR #17304), for a llama-server of the user's own. */
export const MIN_OWN_BUILD = 7563

export const RELEASES_BASE_URL = 'https://github.com/ggml-org/llama.cpp/releases/download'
/** llama.cpp's licence at the build's commit, opened from ENGINE and SETUP. */
export const LICENSE_URL = `https://github.com/ggml-org/llama.cpp/blob/${ENGINE_COMMIT}/LICENSE`

export type EngineBackend = 'vulkan' | 'metal' | 'cpu'

export interface EngineAsset {
  /** The folder the build is put in: `<platform>-<arch>-<backend>`. */
  target: string
  platform: string
  arch: string
  backend: EngineBackend
  asset: string
  bytes: number
  sha256: string
}

function asset(
  platform: string,
  arch: string,
  backend: EngineBackend,
  name: string,
  bytes: number,
  sha256: string,
): EngineAsset {
  return {
    target: `${platform}-${arch}-${backend}`,
    platform,
    arch,
    backend,
    asset: `llama-${ENGINE_BUILD}-bin-${name}`,
    bytes,
    sha256,
  }
}

/** GPU builds first: a platform's first backend is tried first and the CPU one is the fallback. */
export const ENGINES: readonly EngineAsset[] = [
  asset(
    'win32',
    'x64',
    'vulkan',
    'win-vulkan-x64.zip',
    37_661_146,
    '9732a5e48887ca54d0bfe4af4324dc85fd56cd8cda19b52df3542fa6ebe6874f',
  ),
  asset(
    'win32',
    'x64',
    'cpu',
    'win-cpu-x64.zip',
    24_708_445,
    '98901e327c252875accaf2d1bf364e10e868843b0b63468baad1aa945cdc5da2',
  ),
  asset(
    'win32',
    'arm64',
    'cpu',
    'win-cpu-arm64.zip',
    13_197_637,
    'f8d20fb07d0b499988ced8963afcd5ded2d2cdd9983b757fbc7e51c4abd722e8',
  ),
  asset(
    'darwin',
    'arm64',
    'metal',
    'macos-arm64.tar.gz',
    16_650_691,
    '4f5b8de12e0b9516658ca6a5764c6ffb3d7c659c3dd538556b1413c7b4050662',
  ),
  asset(
    'darwin',
    'x64',
    'cpu',
    'macos-x64.tar.gz',
    12_388_601,
    'c8094268b6bf62f4998f0e45656fd9f5e2d4afb6b1cd0044d761db64be1dd47d',
  ),
  asset(
    'linux',
    'x64',
    'vulkan',
    'ubuntu-vulkan-x64.tar.gz',
    35_858_360,
    'a5d741940956ec62e8783aee7e5a4c7c761af867d6f027c3277a51e1a3ac59b0',
  ),
  asset(
    'linux',
    'x64',
    'cpu',
    'ubuntu-x64.tar.gz',
    23_051_958,
    '368227edcc229be5f9bed16a2223d79b5e41d0ac2e19bcf5825e82291c060e55',
  ),
]

/** The builds for a platform, in the order they are tried. */
export function enginesFor(
  engines: readonly EngineAsset[],
  platform: string,
  arch: string,
): EngineAsset[] {
  return engines.filter((engine) => engine.platform === platform && engine.arch === arch)
}

export function engineUrl(base: string, engine: Pick<EngineAsset, 'asset'>): string {
  return `${base.replace(/\/+$/, '')}/${ENGINE_BUILD}/${engine.asset}`
}

/**
 * The build number `llama-server --version` prints, or null when the output is not llama.cpp's.
 * Builds since the v0.9 tags write "version: 0.9.0-dev (build 12110, commit cd959bae9)" (read
 * from b12110 itself); older ones "version: 7123 (a1b2c3d)".
 */
export function parseBuild(output: string): number | null {
  const tagged = /^version:\s*\S+\s*\(build\s+(\d+)\b/m.exec(output)
  if (tagged?.[1]) return Number(tagged[1])
  const plain = /^version:\s*(\d+)\s*\(/m.exec(output)
  return plain?.[1] ? Number(plain[1]) : null
}

/**
 * Whether a chunk of llama-server's output shows the load going on: every line but the server's
 * own log of a `/health` request, which the 250 ms check writes while the model is still loading
 * (counting it would keep a stalled load alive for ever). The dots tensor loading prints without
 * a line break count.
 */
export function showsProgress(chunk: string): boolean {
  return chunk
    .split('\n')
    .some((line) => line.trim() !== '' && !/log_server_r\b.*\/health\b/.test(line))
}

/** The time to wait for a model to load: two minutes and a minute a gigabyte (docs/translate.md §4.2). */
export function bootLimitMs(modelBytes: number): number {
  return 120_000 + Math.ceil(modelBytes / 1e9) * 60_000
}

/**
 * How long an answer may send nothing before the server is taken as wedged (§4.3): the stall time,
 * or longer for a big model. llama-server reads a prompt in batches of 2,048 tokens and says so
 * after each (`return_progress`); on the CPU build one batch took about 30 s for the 2B model of
 * 1.5 GB (12 threads, 2026-11-06), so a minute per GB leaves twice that again for a slower machine.
 */
export function answerStallMs(stallMs: number, modelBytes: number): number {
  return Math.max(stallMs, Math.ceil((modelBytes / 1e9) * 60_000))
}

export const EngineAssetSchema = z.object({
  target: z.string().regex(/^[a-z0-9]+-[a-z0-9]+-[a-z]+$/),
  platform: z.string().max(16),
  arch: z.string().max(16),
  backend: z.enum(['vulkan', 'metal', 'cpu']),
  asset: z.string().regex(/^[\w.-]+\.(zip|tar\.gz)$/),
  bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
})
