import type { CodeBuild, Measured } from '@shared/e16c/program'

/** What the page asks CODE's worker: the ROM to measure on, once, then builds. */
export type CodeRequest =
  | { kind: 'rom'; rom: Uint8Array }
  | { kind: 'build'; id: number; file: string; source: string }

/** One level's build, and its run measured (none when it did not build). */
export interface LevelResult extends CodeBuild {
  measured: Measured | null
}

export interface CodeReply {
  id: number
  levels: LevelResult[]
}
