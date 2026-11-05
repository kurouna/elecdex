import { z } from 'zod'
import { EASY_JAPANESE, isSourceLang } from './languages.js'

/**
 * Glossaries (docs/translate.md §6.3): named lists of terms, each for one target language or for
 * any. Only the terms a block contains go with it, longest first, fifty at most. Ported from the
 * PLaMo test app (word boundaries, the target language), as pure functions both sides use.
 */

export const MAX_GLOSSARIES = 50
export const MAX_TERMS = 5000
/** Terms that go with one request: the template's own room is not unlimited. */
export const MAX_TERMS_PER_REQUEST = 50
export const MAX_CONTEXT_CHARS = 2000

export const TermSchema = z.object({
  source: z.string().trim().min(1).max(200),
  target: z.string().trim().min(1).max(200),
})

export const GlossarySchema = z.object({
  id: z.string().regex(/^[\w-]{1,40}$/),
  name: z.string().trim().min(1).max(60),
  /**
   * The language its translations are in; null: any. One of the 53, never Easy Japanese alone:
   * a Japanese glossary serves both (§6.3).
   */
  targetLang: z.string().refine(isSourceLang).nullable(),
  terms: z.array(TermSchema).max(MAX_TERMS),
})

export type Glossary = z.infer<typeof GlossarySchema>
export type Term = z.infer<typeof TermSchema>

export const GlossaryFileSchema = z.object({
  version: z.literal(1).default(1),
  glossaries: z.array(z.unknown()).default([]),
})

/** The glossaries a file holds: a broken one is dropped alone, never the file. */
export function readGlossaries(raw: unknown): Glossary[] {
  const parsed = GlossaryFileSchema.safeParse(raw)
  if (!parsed.success) return []
  // Each read alone, and the first fifty kept: a hand edit past the limit loses no file.
  return parsed.data.glossaries
    .flatMap((g) => {
      const one = GlossarySchema.safeParse(g)
      return one.success ? [one.data] : []
    })
    .slice(0, MAX_GLOSSARIES)
}

/**
 * Whether a glossary is for this target: one given a language is used only into it (a Japanese
 * one into Easy Japanese too); one for any language always.
 */
export function glossaryApplies(glossaryLang: string | null, targetLang: string): boolean {
  if (glossaryLang === null || glossaryLang === targetLang) return true
  return glossaryLang === 'ja' && targetLang === EASY_JAPANESE
}

const WORD_CHAR = /[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}\p{N}_]/u

/**
 * Whether the text holds the term, ignoring case. A term that ends in a letter of a spaced script
 * is not found inside a longer word ("pane" is not in "panel"); one in a script written without
 * spaces is found anywhere (「ペイン」 is in 「ペインは」).
 */
export function containsTerm(text: string, term: string): boolean {
  const needle = term.trim().toLowerCase()
  if (needle === '') return false
  const hay = text.toLowerCase()
  const checkLeft = WORD_CHAR.test(needle.at(0) ?? '')
  const checkRight = WORD_CHAR.test(needle.at(-1) ?? '')
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + 1)) {
    const before = hay[i - 1]
    const after = hay[i + needle.length]
    const leftOk = !checkLeft || before === undefined || !WORD_CHAR.test(before)
    const rightOk = !checkRight || after === undefined || !WORD_CHAR.test(after)
    if (leftOk && rightOk) return true
  }
  return false
}

/** The terms that go with a text: those it holds, longest first, at most `max`. */
export function selectTerms<T extends { source: string }>(
  terms: readonly T[],
  text: string,
  max = MAX_TERMS_PER_REQUEST,
): T[] {
  return terms
    .filter((term) => containsTerm(text, term.source))
    .sort((a, b) => b.source.length - a.source.length)
    .slice(0, max)
}

/** Terms pasted as TSV or CSV, one a line; a line without both sides is left out. */
export function parseTermLines(text: string): Term[] {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const sep = line.includes('\t') ? '\t' : ','
      const at = line.indexOf(sep)
      if (at < 0) return null
      return { source: line.slice(0, at).trim(), target: line.slice(at + 1).trim() }
    })
    .filter((term): term is Term => term !== null && term.source !== '' && term.target !== '')
    .slice(0, MAX_TERMS)
}

/** Terms merged: a pasted term replaces one of the same source (case ignored), the rest are added. */
export function mergeTerms(current: readonly Term[], added: readonly Term[]): Term[] {
  const bySource = new Map(current.map((term) => [term.source.toLowerCase(), term]))
  for (const term of added) bySource.set(term.source.toLowerCase(), term)
  return [...bySource.values()].slice(0, MAX_TERMS)
}
