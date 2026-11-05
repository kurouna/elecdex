import { z } from 'zod'
import { isTargetLang } from './languages.js'

/**
 * The history (docs/translate.md §7): one entry per draft of the source, kept by main in
 * translate/history.json, two hundred at most and 4 MB, the oldest going first. What decides the
 * entries is here, pure, for the page and main alike.
 */

export const MAX_HISTORY = 200
export const MAX_HISTORY_BYTES = 4 * 1024 * 1024

const BlockSchema = z.object({
  lead: z.string().max(2000),
  source: z.string().max(20_000),
  text: z.string().max(80_000),
})

export const HistoryEntrySchema = z.object({
  id: z.string().regex(/^[\w-]{1,40}$/),
  draftId: z.string().regex(/^[\w-]{1,64}$/),
  /** When it was first written, and last. */
  at: z.number(),
  updatedAt: z.number(),
  /** What was asked for (`auto` too), and what the letters made certain on AUTO. */
  srcLang: z.string().max(16),
  detected: z.string().max(16).nullable(),
  tgtLang: z.string().refine(isTargetLang),
  form: z.enum(['plain', 'polite']).nullable(),
  blocks: z.array(BlockSchema).max(2000),
  tail: z.string().max(2000),
  /** Blocks written of all, when it was stopped before the end. */
  partial: z.object({ done: z.number().int(), total: z.number().int() }).nullable(),
  model: z.string().max(64),
})

export type HistoryEntry = z.infer<typeof HistoryEntrySchema>

export const HistoryFileSchema = z.object({
  version: z.literal(1).default(1),
  entries: z
    .array(z.unknown())
    .max(MAX_HISTORY * 2)
    .default([]),
})

/** The entries a file holds: a broken one is dropped alone. */
export function readHistory(raw: unknown): HistoryEntry[] {
  const parsed = HistoryFileSchema.safeParse(raw)
  if (!parsed.success) return []
  return parsed.data.entries.flatMap((entry) => {
    const one = HistoryEntrySchema.safeParse(entry)
    return one.success ? [one.data] : []
  })
}

/**
 * Whether an edit of the source is the same draft going on. Emptied, or half of what was there or
 * more deleted or replaced (select all and type, paste over it): a new draft. Typing on, a small
 * cut and an insertion in the middle go on. From the PLaMo test app, where a history merged by
 * "starts the same, within a minute" lost entries (§7).
 */
export function continuesDraft(prev: string, next: string): boolean {
  if (next.trim() === '') return false
  if (prev.trim() === '') return true
  let head = 0
  const max = Math.min(prev.length, next.length)
  while (head < max && prev[head] === next[head]) head++
  let tailLength = 0
  while (
    tailLength < max - head &&
    prev[prev.length - 1 - tailLength] === next[next.length - 1 - tailLength]
  )
    tailLength++
  const deleted = prev.length - head - tailLength
  return deleted * 2 <= prev.length
}

/** Same draft and the same languages and form: the newer translation takes the entry's place. */
function sameDraft(a: HistoryEntry, b: HistoryEntry): boolean {
  return (
    a.draftId === b.draftId &&
    a.srcLang === b.srcLang &&
    a.tgtLang === b.tgtLang &&
    a.form === b.form
  )
}

/**
 * The history with an entry recorded: it replaces the newest when that is the same draft in the
 * same languages, else it goes first; then the oldest go past the count and the size.
 */
export function recordEntry(
  entries: readonly HistoryEntry[],
  entry: HistoryEntry,
  limits = { count: MAX_HISTORY, bytes: MAX_HISTORY_BYTES },
): HistoryEntry[] {
  const newest = entries[0]
  const merged =
    newest && sameDraft(newest, entry)
      ? [{ ...entry, id: newest.id, at: newest.at }, ...entries.slice(1)]
      : [entry, ...entries]
  const kept = merged.slice(0, limits.count)
  let bytes = kept.reduce((sum, e) => sum + entryBytes(e), 0)
  while (kept.length > 1 && bytes > limits.bytes) {
    const dropped = kept.pop()
    bytes -= dropped ? entryBytes(dropped) : 0
  }
  return kept
}

/** About what an entry takes in the file: UTF-16 length is near enough for a limit. */
function entryBytes(entry: HistoryEntry): number {
  return JSON.stringify(entry).length
}

/** The source of an entry as one text. */
export function entrySource(entry: Pick<HistoryEntry, 'blocks' | 'tail'>): string {
  return entry.blocks.map((b) => b.lead + b.source).join('') + entry.tail
}

/** The translation of an entry as one text, laid out as the source was. */
export function entryTarget(entry: Pick<HistoryEntry, 'blocks' | 'tail'>): string {
  return entry.blocks.map((b) => b.lead + b.text).join('') + entry.tail
}

/** An entry as HISTORY lists it: the start of each side, never the whole of a long text. */
export interface HistoryRow {
  id: string
  at: number
  updatedAt: number
  srcLang: string
  detected: string | null
  tgtLang: string
  form: 'plain' | 'polite' | null
  source: string
  target: string
  chars: number
  partial: { done: number; total: number } | null
}

const PREVIEW_CHARS = 240

export function historyRow(entry: HistoryEntry): HistoryRow {
  const source = entrySource(entry)
  return {
    id: entry.id,
    at: entry.at,
    updatedAt: entry.updatedAt,
    srcLang: entry.srcLang,
    detected: entry.detected,
    tgtLang: entry.tgtLang,
    form: entry.form,
    source: source.slice(0, PREVIEW_CHARS),
    target: entryTarget(entry).slice(0, PREVIEW_CHARS),
    chars: source.length,
    partial: entry.partial,
  }
}
