/**
 * The source language of a text, when its letters make it certain (docs/translate.md §6.5).
 * PLaMo 3 Translate does not say what it read, and the request leaves `source` out on AUTO (the
 * model judges); this is for the pane: the "≈ EN" beside AUTO, a swap from AUTO, ROUND TRIP and
 * the history's label. Main runs the same function on the request's text for the history.
 *
 * Certain only where the script decides (kana, hangul, Thai, Hebrew, Georgian, Armenian), or where
 * Latin text has clearly more of one language's commonest words than of any other. Han alone
 * (simplified or traditional), Cyrillic, Arabic script, Devanagari and short text are not certain.
 */

/** Below this many letters nothing is certain. */
export const MIN_DETECT_CHARS = 20

const SCRIPTS: readonly [RegExp, string][] = [
  [/[\p{Script=Hiragana}\p{Script=Katakana}]/u, 'ja'],
  [/\p{Script=Hangul}/u, 'ko'],
  [/\p{Script=Thai}/u, 'th'],
  [/\p{Script=Hebrew}/u, 'he'],
  [/\p{Script=Georgian}/u, 'ka'],
  [/\p{Script=Armenian}/u, 'hy'],
]

/** Each language's commonest short words: what Latin text is told apart by. */
const COMMON: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  Object.entries({
    en: 'the and of to is in that it for with this are was on you not be have',
    fr: 'le la les et des est une un du que pour dans pas sur au avec ce qui',
    de: 'der die und das ist nicht ein eine zu den mit von sich auf für auch dem es',
    es: 'el los las y es que una por con para del se no como pero su al lo',
    it: 'il che di e è non una per con gli della sono del si come ma anche questo',
    nl: 'de het een en van is niet dat op met voor zijn ook te aan maar wordt naar',
    id: 'yang dan di ini itu dengan untuk tidak dari dalam akan pada adalah ke juga saya bisa ada',
    pl: 'nie się jest i w na że z do to jak ale co tak czy dla od po',
  }).map(([lang, words]) => [lang, words.split(' ')]),
)

const WORD = /\p{Script=Latin}+/gu

/** The language the text is certainly in, or null when its letters do not settle it. */
export function detectLanguage(text: string): string | null {
  const letters = text.replace(/[\s\p{P}\p{S}\p{N}]/gu, '')
  if ([...letters].length < MIN_DETECT_CHARS) return null
  for (const [script, lang] of SCRIPTS) if (script.test(text)) return lang
  return latinLanguage(text)
}

function latinLanguage(text: string): string | null {
  const words = (text.toLowerCase().match(WORD) ?? []) as string[]
  if (words.length < 4) return null
  const scores = Object.entries(COMMON).map(([lang, common]) => ({
    lang,
    hits: words.filter((word) => common.includes(word)).length,
  }))
  scores.sort((a, b) => b.hits - a.hits)
  const [first, second] = scores
  if (!first || first.hits < 3) return null
  // Clearly more: twice the next, and a fair share of the words.
  if (second && first.hits < second.hits * 2) return null
  return first.hits * 6 >= words.length ? first.lang : null
}
