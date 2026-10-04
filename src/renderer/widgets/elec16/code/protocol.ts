import type { CodeBuild, Measured } from '@shared/e16c/program'

/** A game's files for a kit build (docs/elec16-play.md section 11), as main read them. */
export interface KitFiles {
  meta: string
  texts: Record<string, string>
  pictures: Record<string, Uint8Array>
}

/**
 * What the page asks CODE's worker: the ROM to measure CODE's builds on (whenever it
 * changes), a CODE build, or a game built from its folder with the game kit.
 */
export type CodeRequest =
  | { kind: 'rom'; rom: Uint8Array }
  | { kind: 'build'; id: number; file: string; source: string }
  | { kind: 'kit'; id: number; files: KitFiles; romTrap: number }

/** A kit build's outcome: the cartridge and what to write back, or the errors. */
export type KitOutcome =
  | {
      ok: true
      image: Uint8Array
      assets: string
      compiled: string
      banks: number
      ramCode: number
      tiles: number
    }
  | { ok: false; errors: { file: string; line: number; message: string }[] }

export interface KitReply {
  id: number
  kit: KitOutcome
}

/** One level's build, and its run measured (none when it did not build). */
export interface LevelResult extends CodeBuild {
  measured: Measured | null
}

export interface CodeReply {
  id: number
  levels: LevelResult[]
}
