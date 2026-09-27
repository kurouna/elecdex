import { z } from 'zod'
import {
  CLIP_MAX_CHARS,
  CLIP_PREVIEW_CHARS,
  type ClipFormat,
  type ClipKind,
  classifyClip,
  countLines,
} from './clipboard.js'

/**
 * Snippets (architecture.md §5.14): texts the user chose to keep, beside the
 * clipboard history, to put on the clipboard again with one press.
 *
 * The history is main's memory and ends with the app; a snippet is kept only
 * because the user pressed for it, in snippets.json under userData, as notes
 * are. Main keeps the whole text and the HTML and RTF copied with it; the page
 * is given previews, as it is for the history, and names a snippet by its id.
 * The decisions are here, pure: what a new one is, whether it is already kept,
 * where one moves to, what an edit leaves of its formatting, what a row shows.
 */

export const SNIPPETS_VERSION = 1

export const SNIPPET_LIMITS = {
  /** How many snippets the file holds. */
  snippets: 100,
  /** A snippet's text: as much as the history keeps whole. */
  text: CLIP_MAX_CHARS,
  /** A name given by hand. */
  name: 60,
} as const

const ID_PATTERN = /^s[0-9a-z]{1,16}$/

export function isSnippetId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

export const SnippetSchema = z.object({
  id: z.string().regex(ID_PATTERN),
  /** A name given by hand; empty for one named by its first line. */
  name: z.string().max(SNIPPET_LIMITS.name).default(''),
  text: z.string().min(1).max(SNIPPET_LIMITS.text),
  /**
   * The formatting copied with it, put back with the text. No limit of its own:
   * what the history kept, it passes on (user decision 2026-09-27).
   */
  html: z.string().nullable().default(null),
  rtf: z.string().nullable().default(null),
  /** Epoch milliseconds. */
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  /** How many times it has been put on the clipboard, and when last. */
  copies: z.number().int().nonnegative().default(0),
  usedAt: z.number().int().nonnegative().nullable().default(null),
})
export type Snippet = z.infer<typeof SnippetSchema>

export const SnippetsFileSchema = z.object({
  version: z.literal(SNIPPETS_VERSION).default(SNIPPETS_VERSION),
  snippets: z.array(SnippetSchema).max(SNIPPET_LIMITS.snippets).default([]),
})
export type SnippetsFile = z.infer<typeof SnippetsFileSchema>

export const emptySnippets = (): SnippetsFile => ({ version: SNIPPETS_VERSION, snippets: [] })

/** What a new snippet is made of: a history entry's whole content, or a text written by hand. */
export interface SnippetContent {
  text: string
  html: string | null
  rtf: string | null
}

/** A snippet as the page sees it: a preview, never the whole text or its formatting. */
export interface SnippetView {
  id: string
  /** The name given by hand, or ''. */
  name: string
  /** What its row is called: the name, or its first line. */
  title: string
  preview: string
  chars: number
  lines: number
  kind: ClipKind
  rich: boolean
  formats: ClipFormat[]
  createdAt: number
  updatedAt: number
  copies: number
  usedAt: number | null
}

/** What the editor is given to change: the name and the whole text, never the formatting. */
export interface SnippetDraft {
  name: string
  text: string
  /** It carries formatting, which a change of its text drops. */
  rich: boolean
}

/** How keeping one went: its id, and whether it was already there. */
export type SnippetAdded =
  | { id: string; added: boolean }
  | { error: 'full' | 'missing' | 'not-kept' | 'invalid' }

/** Whether a text is already kept, and as which snippet. */
export function findSnippet(file: SnippetsFile, text: string): Snippet | undefined {
  return file.snippets.find((snippet) => snippet.text === text)
}

/**
 * The file with a new snippet at its end, or the one already holding the same
 * text (it is not kept twice, and its place and formatting stay as they were).
 */
export function withSnippet(
  file: SnippetsFile,
  content: SnippetContent,
  id: string,
  now: number,
  name = '',
): { file: SnippetsFile; result: SnippetAdded } {
  if (content.text === '' || content.text.length > SNIPPET_LIMITS.text)
    return { file, result: { error: 'invalid' } }
  const found = findSnippet(file, content.text)
  if (found !== undefined) return { file, result: { id: found.id, added: false } }
  if (file.snippets.length >= SNIPPET_LIMITS.snippets) return { file, result: { error: 'full' } }
  const snippet: Snippet = {
    id,
    name: cleanName(name),
    text: content.text,
    html: content.html,
    rtf: content.rtf,
    createdAt: now,
    updatedAt: now,
    copies: 0,
    usedAt: null,
  }
  return { file: { ...file, snippets: [...file.snippets, snippet] }, result: { id, added: true } }
}

/** A name on one line, trimmed and cut to its limit. */
export function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, SNIPPET_LIMITS.name)
}

/**
 * The file with one snippet renamed or rewritten. A new text drops the HTML and
 * RTF it was copied with: they would put back words the text no longer says. A
 * new name alone leaves them. An empty text is refused, as is a text another
 * snippet already holds.
 */
export function withEdit(
  file: SnippetsFile,
  id: string,
  change: { name?: string; text?: string },
  now: number,
): SnippetsFile | null {
  const current = file.snippets.find((snippet) => snippet.id === id)
  if (current === undefined) return null
  const name = change.name === undefined ? current.name : cleanName(change.name)
  const text = change.text ?? current.text
  if (text === '' || text.length > SNIPPET_LIMITS.text) return null
  const rewritten = text !== current.text
  if (rewritten && findSnippet(file, text) !== undefined) return null
  if (!rewritten && name === current.name) return file
  const next: Snippet = {
    ...current,
    name,
    text,
    ...(rewritten ? { html: null, rtf: null } : {}),
    updatedAt: now,
  }
  return { ...file, snippets: file.snippets.map((s) => (s.id === id ? next : s)) }
}

/** The file with a snippet moved to `index` (clamped to the list), the others keeping their order. */
export function withMove(file: SnippetsFile, id: string, index: number): SnippetsFile {
  const from = file.snippets.findIndex((snippet) => snippet.id === id)
  if (from < 0) return file
  const to = Math.max(0, Math.min(file.snippets.length - 1, Math.trunc(index)))
  if (to === from) return file
  const rest = file.snippets.filter((_, i) => i !== from)
  const moved = file.snippets[from] as Snippet
  return { ...file, snippets: [...rest.slice(0, to), moved, ...rest.slice(to)] }
}

export function withoutSnippet(file: SnippetsFile, id: string): SnippetsFile {
  if (!file.snippets.some((snippet) => snippet.id === id)) return file
  return { ...file, snippets: file.snippets.filter((snippet) => snippet.id !== id) }
}

/** The file once a snippet has been put on the clipboard: counted, and when. */
export function withUse(file: SnippetsFile, id: string, now: number): SnippetsFile {
  if (!file.snippets.some((snippet) => snippet.id === id)) return file
  return {
    ...file,
    snippets: file.snippets.map((s) =>
      s.id === id ? { ...s, copies: s.copies + 1, usedAt: now } : s,
    ),
  }
}

/** What a snippet's row is called: its name, or its first line with something on it. */
export function snippetTitle(snippet: Pick<Snippet, 'name' | 'text'>): string {
  if (snippet.name !== '') return snippet.name
  for (const line of snippet.text.split('\n', 20)) {
    const text = line.trim()
    if (text !== '') return text.slice(0, SNIPPET_LIMITS.name)
  }
  return 'blank'
}

export function snippetView(snippet: Snippet): SnippetView {
  return {
    id: snippet.id,
    name: snippet.name,
    title: snippetTitle(snippet),
    preview: snippet.text.slice(0, CLIP_PREVIEW_CHARS),
    chars: snippet.text.length,
    lines: countLines(snippet.text),
    kind: classifyClip(snippet.text),
    rich: snippet.html !== null || snippet.rtf !== null,
    formats: [
      ...(snippet.html !== null ? (['html'] as const) : []),
      ...(snippet.rtf !== null ? (['rtf'] as const) : []),
    ],
    createdAt: snippet.createdAt,
    updatedAt: snippet.updatedAt,
    copies: snippet.copies,
    usedAt: snippet.usedAt,
  }
}

/** A new snippet's id: an `s` and twelve letters or digits. */
export function makeSnippetId(random: () => number = Math.random): string {
  let id = 's'
  for (let i = 0; i < 12; i += 1) id += Math.floor(random() * 36).toString(36)
  return id
}

// ---------------------------------------------------------------------------
// What the page decides
// ---------------------------------------------------------------------------

/**
 * The snippets a filter leaves: every word must appear in the name or the
 * preview, in any case.
 */
export function filterSnippets<T extends Pick<SnippetView, 'preview' | 'name'>>(
  snippets: readonly T[],
  query: string,
): T[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return [...snippets]
  return snippets.filter((snippet) => {
    const text = `${snippet.name}\n${snippet.preview}`.toLowerCase()
    return words.every((word) => text.includes(word))
  })
}

/**
 * Where a dragged row lands: the place among the rows whose middles the pointer
 * has passed. `middles` are the rows' vertical middles in order, the dragged
 * one's included, and the answer is the index it takes in the list without
 * itself - what `withMove` wants.
 */
export function dropIndex(middles: readonly number[], y: number, from: number): number {
  let before = 0
  for (const [i, middle] of middles.entries()) if (i !== from && y > middle) before += 1
  return before
}

/** A slot's number, as the row shows it: 01, 02, … 100. */
export function slotNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}
