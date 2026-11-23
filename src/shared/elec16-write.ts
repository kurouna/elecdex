import { z } from 'zod'
import { isCardName } from './elec16/card.js'
import { WRITE_LIMITS } from './elec16/write-prompt.js'

/**
 * CODE's WRITE over IPC (docs/elec16-write.md section 5): a SEND's first request, a fix, the
 * text as it comes, and how a request ended. main checks every request against these.
 */

const serial = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

/** A SEND: the person's words and the program in the editor, to the provider and model chosen. */
export const WriteRequestSchema = z.object({
  serial,
  provider: z.string().min(1).max(64),
  model: z.string().trim().min(1).max(120),
  words: z.string().trim().min(1).max(WRITE_LIMITS.words),
  code: z.string().max(WRITE_LIMITS.code),
  file: z.string().refine(isCardName),
})
export type Elec16WriteRequest = z.infer<typeof WriteRequestSchema>

/** A fix: e16c's errors for the answer the SEND of this serial last got. */
export const WriteFixSchema = z.object({
  serial,
  errors: z
    .array(
      z.object({
        file: z.string().max(12),
        line: z.number().int().nonnegative().max(65535),
        column: z.number().int().nonnegative().max(65535),
        message: z.string().max(WRITE_LIMITS.error),
      }),
    )
    .min(1)
    .max(WRITE_LIMITS.errors),
})
export type Elec16WriteFix = z.infer<typeof WriteFixSchema>

/**
 * main -> page, about a hundred milliseconds apart: more of the answer of one request (`round`
 * 0 is the SEND's first, then each fix).
 */
export interface Elec16WritePiece {
  pane: string
  serial: number
  round: number
  text: string
}

export const WRITE_STOPS = ['stopped', 'failed', 'refused', 'timeout', 'too-long', 'spent'] as const
export type Elec16WriteStop = (typeof WRITE_STOPS)[number]

export type Elec16WriteResult =
  | {
      ok: true
      serial: number
      /** The whole answer. */
      text: string
      usage?: { input: number; output: number }
    }
  | { ok: false; serial: number; stop: Elec16WriteStop; note: string }
