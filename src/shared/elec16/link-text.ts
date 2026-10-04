/**
 * The AI behind LINK, as text (docs/elec16.md section 12): whether an answer is in English or
 * in kana, what the model is asked, and its answer made into the ELEC-16's characters. Pure:
 * main runs it, and the tests hold it.
 *
 * The LCD has ASCII (20-7E) and the half-width kana (A1-DF), nothing else - no kanji. A
 * question with kana in it is answered in kana, one without in English (TRANS the other way
 * round). The model is asked for kana only and for spaces between phrases, as pocket computers
 * wrote Japanese; what it sends anyway is made to fit here: hiragana and katakana to
 * half-width kana, full-width letters to ASCII, Markdown and line breaks out, control
 * characters dropped (a 0x0C would clear the screen), anything else a `?`.
 */

import { AI_TYPES, type AiType } from './link-services.js'

export type Script = 'english' | 'kana'

export interface AiTypeTraits {
  /** The conversation goes on (false: every question on its own). */
  remembers: boolean
  /** The model searches the web, on the provider's side. */
  search: boolean
  /** The answer in the other script from the question (translation). */
  crosses: boolean
}

const TRAITS: Readonly<Record<AiType, AiTypeTraits>> = {
  NORMAL: { remembers: true, search: false, crosses: false },
  TUTOR: { remembers: true, search: false, crosses: false },
  BASIC: { remembers: true, search: false, crosses: false },
  QUIZ: { remembers: true, search: false, crosses: false },
  STORY: { remembers: true, search: false, crosses: false },
  POET: { remembers: true, search: false, crosses: false },
  FORTUNE: { remembers: true, search: false, crosses: false },
  DICT: { remembers: false, search: false, crosses: false },
  TRANS: { remembers: false, search: false, crosses: true },
  SEARCH: { remembers: false, search: true, crosses: false },
  WEATHER: { remembers: false, search: true, crosses: false },
}

export const aiTypeOf = (type: number): AiType => AI_TYPES[type] ?? 'NORMAL'
export const aiTraits = (type: number): AiTypeTraits => TRAITS[aiTypeOf(type)]

/** A kana letter of the machine's (ｦ to ﾟ); its punctuation ｡｢｣､･ alone is not Japanese. */
const isKanaByte = (b: number): boolean => b >= 0xa6 && b <= 0xdf

/** The script an answer to this question is written in. */
export function answerScript(type: number, query: Uint8Array): Script {
  const kana = query.some(isKanaByte)
  return kana !== aiTraits(type).crosses ? 'kana' : 'english'
}

/* ---------------- kana: half-width and full-width ---------------- */

/** The half-width block U+FF61-FF9F and the full-width character each stands for. */
const HALF = '｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ'
const FULL =
  '。「」、・ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン゛゜'
const VOICED = 'ガギグゲゴザジズゼゾダヂヅデドバビブベボヴ'
const VOICED_BASE = 'カキクケコサシスセソタチツテトハヒフヘホウ'
const SEMI = 'パピプペポ'
const SEMI_BASE = 'ハヒフヘホ'

const toHalf = new Map<string, string>()
const toFull = new Map<string, string>()
for (let k = 0; k < HALF.length; k++) {
  toHalf.set(FULL[k] ?? '', HALF[k] ?? '')
  toFull.set(HALF[k] ?? '', FULL[k] ?? '')
}
for (let k = 0; k < VOICED.length; k++) {
  toHalf.set(VOICED[k] ?? '', `${toHalf.get(VOICED_BASE[k] ?? '')}ﾞ`)
  toFull.set(`${toHalf.get(VOICED_BASE[k] ?? '')}ﾞ`, VOICED[k] ?? '')
}
for (let k = 0; k < SEMI.length; k++) {
  toHalf.set(SEMI[k] ?? '', `${toHalf.get(SEMI_BASE[k] ?? '')}ﾟ`)
  toFull.set(`${toHalf.get(SEMI_BASE[k] ?? '')}ﾟ`, SEMI[k] ?? '')
}
// Katakana the half-width block has no letter for, by the nearest it has.
for (const [full, half] of [
  ['ヮ', 'ﾜ'],
  ['ヰ', 'ｲ'],
  ['ヱ', 'ｴ'],
  ['ヵ', 'ｶ'],
  ['ヶ', 'ｹ'],
  ['ヷ', 'ﾜﾞ'],
  ['『', '｢'],
  ['』', '｣'],
  ['〜', '~'],
  ['～', '~'],
] as const) {
  toHalf.set(full, half)
}

/** The question as the model reads it best: the machine's half-width kana made full-width. */
export function queryText(query: Uint8Array): string {
  let half = ''
  for (const b of query) {
    if (b >= 0x20 && b <= 0x7e) half += String.fromCharCode(b)
    else if (b >= 0xa1 && b <= 0xdf) half += String.fromCharCode(b - 0xa1 + 0xff61)
  }
  let out = ''
  for (let k = 0; k < half.length; k++) {
    const pair = toFull.get(half.slice(k, k + 2))
    if (pair !== undefined && (half[k + 1] === 'ﾞ' || half[k + 1] === 'ﾟ')) {
      out += pair
      k++
      continue
    }
    const ch = half[k] ?? ''
    out += toFull.get(ch) ?? ch
  }
  return out
}

/* ---------------- what the model is asked ---------------- */

/**
 * What a model that cannot search answers to SEARCH and WEATHER, rather than make the news or
 * the weather up: main shows it as the failure it is.
 */
export const NO_SEARCH = 'NO SEARCH'
const ONLY_IF_SEARCHED = ` If you cannot search the web, answer only: ${NO_SEARCH}`

/** What each type asks of the model; TRANS says which way by the script of the answer. */
function typeInstruction(type: AiType, script: Script): string {
  switch (type) {
    case 'NORMAL':
      return 'Answer the user helpfully.'
    case 'TUTOR':
      return 'You are a kind teacher. Explain simply, as to a curious child, with one small example when it helps.'
    case 'BASIC':
      return (
        "You help with the ELEC-16's BASIC (line numbers, PRINT, INPUT, IF THEN, FOR NEXT, GOTO, GOSUB, " +
        'DIM, CLS, LOCATE, PSET, LINE, CIRCLE, BEEP, WAIT, INKEY$, ASK) and its machine code, the E16, ' +
        'a 16-bit RISC like RISC-V. Give a short hint, or one or two short lines of code.'
      )
    case 'QUIZ':
      return (
        'You are a quiz master. Given a topic, or asked for a quiz, ask one short question. When the ' +
        'user answers, say whether it is right and give the answer, then ask the next question.'
      )
    case 'STORY':
      return (
        'You narrate a text adventure. Describe the scene in one or two sentences and end with two or ' +
        "three numbered choices. Go on from the user's choice."
      )
    case 'POET':
      return "You are a poet. Answer with a short poem on the user's theme - a haiku, a senryu or a few short lines - with ' / ' between its lines."
    case 'FORTUNE':
      return 'You are a playful fortune teller. Tell the user a short, kind fortune, for fun only.'
    case 'DICT':
      return 'You are a dictionary. Give the meaning of the word or phrase the user writes in one or two sentences, with its part of speech.'
    case 'TRANS':
      return script === 'english'
        ? "Translate the user's Japanese into natural English. Answer with the translation only."
        : "Translate the user's English into natural Japanese. Answer with the translation only."
    case 'SEARCH':
      return `Search the web for the user's question and answer with a short summary of what you find, naming the site it came from in a word or two.${ONLY_IF_SEARCHED}`
    case 'WEATHER':
      return (
        'Search the web for the weather forecast for the place the user names, for today and ' +
        'tomorrow, and give the weather, the high and low temperatures in C, and the chance of rain.' +
        ONLY_IF_SEARCHED
      )
  }
}

/** How long, in the model's characters, a kana answer of `max` bytes may be: ｶﾞ is two. */
export const kanaRoom = (max: number): number => Math.max(8, Math.floor(max * 0.7))

/**
 * The system prompt: what the type asks, then the ELEC-16's rules, which hold whatever the
 * type says - the script, the length, plain text. `today` is the date (for the searches).
 */
export function aiSystemPrompt(type: number, script: Script, max: number, today: string): string {
  const which = aiTypeOf(type)
  const rules =
    script === 'english'
      ? [
          'Answer in plain English using only ASCII characters.',
          `Keep the whole answer within ${max} characters: one to three short sentences.`,
          'No Markdown, lists, tables, code blocks, emoji or line breaks.',
        ]
      : [
          '日本語で答えてください。漢字は使わず、ひらがなかカタカナだけで書いてください。',
          '文節と文節の間には半角スペースを入れてください（分かち書き）。英数字は使ってかまいません。',
          `全部で ${kanaRoom(max)} 文字以内、1〜3 文にしてください。`,
          'マークダウン、箇条書き、表、絵文字、改行は使わないでください。',
        ]
  return [
    'You are the AI inside the ELEC-16, a small pocket computer whose LCD shows only a few short lines of text.',
    typeInstruction(which, script),
    ...rules,
    `Today is ${today}.`,
  ].join('\n')
}

/* ---------------- the answer, in the machine's characters ---------------- */

/** Markdown and line breaks out: what a model writes despite being asked not to. */
function plain(text: string): string {
  return text
    .replace(/```[^\n]*\n?/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** ASCII for the typography a model likes. */
const ASCII_FOR: Readonly<Record<string, string>> = {
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  '―': '-',
  '−': '-',
  '…': '...',
  '°': ' ',
  ' ': ' ',
  '　': ' ',
}

/** One character as the machine's: a string of them, or null when it has none. */
function machineChars(ch: string, script: Script): string | null {
  const code = ch.codePointAt(0) ?? 0
  if (code >= 0x20 && code <= 0x7e) return ch
  // Control characters go without a mark: a 0x0C would clear the screen.
  if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) return ''
  const ascii = ASCII_FOR[ch]
  if (ascii !== undefined) return ascii
  if (code >= 0xff01 && code <= 0xff5e) return String.fromCharCode(code - 0xfee0)
  return script === 'kana' ? kanaChars(ch, code) : null
}

/** A Japanese character as the half-width kana; null for one it has none for (kanji). */
function kanaChars(ch: string, code: number): string | null {
  if (code >= 0xff61 && code <= 0xff9f) return ch
  // Hiragana as katakana (ゔ as ヴ too), then as the half-width block has it.
  const kata = code >= 0x3041 && code <= 0x3096 ? String.fromCharCode(code + 0x60) : ch
  return toHalf.get(kata) ?? null
}

/** The text in the machine's characters, as bytes; a run of what it cannot show is one `?`. */
function toMachine(text: string, script: Script): number[] {
  const out: number[] = []
  let missing = false
  for (const ch of text) {
    const got = machineChars(ch, script)
    if (got === null) {
      if (!missing) out.push(0x3f)
      missing = true
      continue
    }
    missing = false
    for (const c of got) {
      const code = c.codePointAt(0) ?? 0
      out.push(code >= 0xff61 ? code - 0xff61 + 0xa1 : code)
    }
  }
  return out
}

const SENTENCE_END = new Set([0x2e, 0x21, 0x3f])
/** ｡ ends a sentence wherever it is; . ! ? only before a space (not 3.14 or a URL). */
const KUTEN = 0xa1
const ELLIPSIS = [0x2e, 0x2e, 0x2e]

/** Where the last whole sentence at or before `last` ends (one past it); 0 when none does. */
function sentenceEnd(bytes: number[], last: number): number {
  for (let k = Math.min(last, bytes.length - 1); k > 0; k--) {
    const next = bytes[k + 1]
    const b = bytes[k] ?? 0
    if (b === KUTEN || (SENTENCE_END.has(b) && (next === 0x20 || next === undefined))) {
      return k + 1
    }
  }
  return 0
}

/** `...` at the end of what fits in `max`, at a space when there is one in its second half. */
function marked(bytes: number[], max: number): number[] {
  const room = Math.max(0, Math.min(max, bytes.length + ELLIPSIS.length) - ELLIPSIS.length)
  const space = bytes.length > room ? bytes.lastIndexOf(0x20, room) : -1
  const end = space > room / 2 ? space : room
  return [...bytes.slice(0, end), ...ELLIPSIS].slice(0, max)
}

/**
 * At most `max` bytes: whole sentences when they fit, else cut at a space with `...`, else
 * cut where it must with `...`.
 */
function cut(bytes: number[], max: number): number[] {
  if (bytes.length <= max) return bytes
  const end = sentenceEnd(bytes, max - 1)
  return end > 0 ? bytes.slice(0, end) : marked(bytes, max)
}

/**
 * A model's answer as the bytes the machine shows: its characters, plain, at most `max`.
 * `unfinished`: the model was stopped at its length limit, mid-sentence - the sentence it was
 * in goes, or `...` marks the cut when it had not finished one.
 */
export function lcdReply(
  text: string,
  script: Script,
  max: number,
  unfinished = false,
): Uint8Array {
  const bytes = toMachine(plain(text), script)
  let end = bytes.length
  while (end > 0 && bytes[end - 1] === 0x20) end--
  let kept = bytes.slice(0, end)
  if (unfinished && kept.length > 0) {
    const whole = sentenceEnd(kept, kept.length - 1)
    kept = whole > 0 ? kept.slice(0, whole) : marked(kept, kept.length + ELLIPSIS.length)
  }
  return new Uint8Array(cut(kept, max))
}
