import { isSourceLang, isTargetLang, takesForm } from './languages.js'

/**
 * The PFML3 prompt of PLaMo 3 Translate (docs/translate.md §2, §6.2), in the order of the model's
 * own chat_template.jinja: dataset, context, earlier pairs, glossary, input, output with its
 * language and form. BOS is llama.cpp's to add. Ported from the PLaMo test app, whose output was
 * checked byte for byte against the template as llama-server expands it.
 */

export const PFML_STOP = ['<|plamo:tag|>', '<|plamo:bos|>'] as const

const TAG = '<|plamo:tag|>'
const MSG = '<|plamo:msg|>'
const KEY = '<|plamo:key|>'
const VAL = '<|plamo:val|>'
const INDEX = '<|plamo:index|>'
const ITEM = '<|plamo:item|>'

export type Form = 'plain' | 'polite'

export interface TranslationPrompt {
  text: string
  target: string
  /** Left out, the model judges the source itself. */
  source?: string
  /** Only for Japanese; ignored for any other target, which the template would refuse. */
  form?: Form
  context?: string
  glossary?: readonly { source: string; target: string }[]
  /** Earlier source and translation pairs, oldest first. */
  history?: readonly { source: string; target: string }[]
}

const ZWSP = '​'
const RESERVED = '<|plamo:'
const DEFUSED = `<|${ZWSP}plamo:`

/**
 * llama-server parses special-token text inside the prompt, so `<|plamo:tag|>` typed by the user
 * would be a real tag and could rewrite the prompt. A zero-width space breaks it into plain text.
 * The template refuses such input; elecdex lets it through defused.
 */
export function defuse(text: string): string {
  return text.replaceAll(RESERVED, DEFUSED)
}

/**
 * Undoes `defuse` in what the model writes back, where it copies the defused text. A translation
 * that held `<|`, a zero-width space and `plamo:` of its own is changed too: never met in practice.
 */
export function restore(text: string): string {
  return text.replaceAll(DEFUSED, RESERVED)
}

export function buildPrompt(request: TranslationPrompt): string {
  check(request)
  const input = request.source ? `${TAG}input${KEY}lang${VAL}${request.source}` : `${TAG}input`
  const output = `${TAG}output${KEY}lang${VAL}${request.target}`
  const form = request.form && takesForm(request.target) ? `${KEY}form${VAL}${request.form}` : ''
  const context = request.context?.trim() ? `${TAG}context${MSG}${defuse(request.context)}` : ''
  return (
    `${TAG}dataset${MSG}translation${context}` +
    pairs(request.history ?? [], input, output) +
    glossary(request.glossary ?? []) +
    `${input}${MSG}${defuse(request.text)}${output}${form}${MSG}`
  )
}

/** What the template refuses is refused here, before anything is sent. */
function check(request: TranslationPrompt): void {
  if (request.text.trim() === '') throw new Error('nothing to translate')
  if (!isTargetLang(request.target)) throw new Error(`not a target language: ${request.target}`)
  if (request.source !== undefined && !isSourceLang(request.source)) {
    throw new Error(`not a source language: ${request.source}`)
  }
}

/** Earlier pairs, each an input and its output; a pair with an empty side is left out. */
function pairs(
  history: TranslationPrompt['history'] & object,
  input: string,
  output: string,
): string {
  return history
    .filter((pair) => pair.source.trim() && pair.target.trim())
    .map((pair) => `${input}${MSG}${defuse(pair.source)}${output}${MSG}${defuse(pair.target)}`)
    .join('')
}

function glossary(entries: NonNullable<TranslationPrompt['glossary']>): string {
  const terms = entries.filter((term) => term.source.trim() && term.target.trim())
  if (terms.length === 0) return ''
  return `${TAG}glossary${terms.map((term) => `${INDEX}${defuse(term.source)}${ITEM}${defuse(term.target)}`).join('')}`
}

/** Easy Japanese takes no form; anything else but Japanese neither. */
export function formFor(target: string, form: Form | undefined): Form | undefined {
  return takesForm(target) ? form : undefined
}
