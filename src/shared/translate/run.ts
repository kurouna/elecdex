import { z } from 'zod'
import { MAX_SOURCE_CHARS } from './blocks.js'
import { MAX_CONTEXT_CHARS } from './glossary.js'
import { isSourceLang, isTargetLang } from './languages.js'

/**
 * A pane's translation as main holds it (docs/translate.md §8.5), and what goes between main and
 * the page: a snapshot when a page follows, then patches gathered every 100 ms.
 */

/** A block put back into the source language (ROUND TRIP, §6.4), and how much it kept (chrF). */
export interface Trip {
  text: string
  state: 'queued' | 'running' | 'done' | 'failed'
  score: number | null
}

export interface TripPatch {
  text?: string
  append?: string
  state?: Trip['state']
  score?: number | null
}

/** queued: waits its turn; running: being written; done; stopped: STOP, or the run was stopped; failed; none: never translated. */
export type BlockState = 'queued' | 'running' | 'done' | 'stopped' | 'failed' | 'none'

export interface BlockView {
  index: number
  lead: string
  source: string
  text: string
  state: BlockState
  /** What the block has to say: cut at the limit, why it failed, too long. */
  note: string | null
  /** Tokens written and how long it took, once written. */
  tokens: number | null
  ms: number | null
  /** How many earlier blocks went with it as history. */
  history: number
  /** Glossary terms that went with it. */
  terms: number
  /** Changed by hand (EDIT): what later blocks take as history. */
  edited: boolean
  /** Its round trip, once asked for. */
  trip: Trip | null
}

/** waiting: behind another pane's; running; done; stopped (with a reason). */
export type RunState = 'waiting' | 'running' | 'done' | 'stopped'

export interface RunView {
  paneId: string
  draftId: string
  version: number
  /** TRANSLATE (Ctrl+Enter) or LIVE (as it is typed): recorded differently (§7). */
  mode: 'translate' | 'live'
  srcLang: string
  tgtLang: string
  form: 'plain' | 'polite' | null
  state: RunState
  reason: string | null
  blocks: BlockView[]
  tail: string
  /** On AUTO, the language the letters made certain (§6.5), else null. */
  detected: string | null
  /** The context sent with every block (§6.3). */
  context: string
  /** The glossary chosen, and whether it was used: one for another language is not (§6.3). */
  glossary: { name: string; used: boolean } | null
}

export interface BlockPatch {
  index: number
  /** The text as a whole, before `append`: '' when a block is asked again after a crash. */
  text?: string
  /** Text written since the last patch. */
  append?: string
  state?: BlockState
  note?: string | null
  tokens?: number | null
  ms?: number | null
  history?: number
  terms?: number
  edited?: boolean
  /** null takes the round trip away; a patch changes it. */
  trip?: TripPatch | null
}

export type RunEvent =
  | { paneId: string; seq: number; kind: 'snapshot'; run: RunView | null }
  | {
      paneId: string
      seq: number
      kind: 'patch'
      version: number
      blocks: BlockPatch[]
      state?: RunState
      reason?: string | null
    }

/** Pane ids are the layout's (`p1-x2y3z4`) or a popup's (`popup:translate`). */
export const PANE_ID = /^[\w:-]{1,80}$/
const DRAFT_ID = /^[\w-]{1,64}$/

export const RunRequestSchema = z.object({
  paneId: z.string().regex(PANE_ID),
  draftId: z.string().regex(DRAFT_ID),
  text: z.string().max(MAX_SOURCE_CHARS),
  srcLang: z.union([z.literal('auto'), z.string().refine(isSourceLang)]),
  tgtLang: z.string().refine(isTargetLang),
  form: z.enum(['plain', 'polite']).optional(),
  glossaryId: z
    .string()
    .regex(/^[\w-]{1,40}$/)
    .optional(),
  context: z.string().max(MAX_CONTEXT_CHARS).optional(),
  mode: z.enum(['translate', 'live']),
})

export type RunRequest = z.infer<typeof RunRequestSchema>

/** Applies a patch to a run as the page holds it; false when it does not fit (resync). */
export function applyPatch(run: RunView, event: Extract<RunEvent, { kind: 'patch' }>): boolean {
  if (event.version !== run.version) return false
  for (const patch of event.blocks) {
    const block = run.blocks[patch.index]
    if (!block) return false
    run.blocks[patch.index] = applyBlockPatch(block, patch)
  }
  if (event.state !== undefined) run.state = event.state
  if (event.reason !== undefined) run.reason = event.reason
  return true
}

/** A patch on one block: its whole text first, then what was appended. */
export function applyBlockPatch(block: BlockView, patch: BlockPatch): BlockView {
  return {
    ...block,
    text: (patch.text ?? block.text) + (patch.append ?? ''),
    ...(patch.state === undefined ? {} : { state: patch.state }),
    ...(patch.note === undefined ? {} : { note: patch.note }),
    ...(patch.tokens === undefined ? {} : { tokens: patch.tokens }),
    ...(patch.ms === undefined ? {} : { ms: patch.ms }),
    ...(patch.history === undefined ? {} : { history: patch.history }),
    ...(patch.terms === undefined ? {} : { terms: patch.terms }),
    ...(patch.edited === undefined ? {} : { edited: patch.edited }),
    ...(patch.trip === undefined ? {} : { trip: patchedTrip(block.trip, patch.trip) }),
  }
}

function patchedTrip(trip: Trip | null, patch: TripPatch | null): Trip | null {
  if (patch === null) return null
  const base = trip ?? { text: '', state: 'queued' as const, score: null }
  return {
    text: (patch.text ?? base.text) + (patch.append ?? ''),
    state: patch.state ?? base.state,
    score: patch.score === undefined ? base.score : patch.score,
  }
}

/** Two patches of one round trip as one: a whole text drops what was appended before it. */
export function mergeTripPatch(
  before: TripPatch | null | undefined,
  after: TripPatch | null,
): TripPatch | null {
  if (after === null || before === null || before === undefined) return after
  const append =
    after.text !== undefined ? (after.append ?? '') : (before.append ?? '') + (after.append ?? '')
  const merged: TripPatch = { ...before, ...after }
  if (after.text === undefined && before.text !== undefined) merged.text = before.text
  if (append) merged.append = append
  else delete merged.append
  return merged
}
