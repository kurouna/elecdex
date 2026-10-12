import { maskText } from './text.js'
import { LOG_LIMITS, type LogLine } from './types.js'

/**
 * What EXPLAIN sends (docs/logwatch.md §7): the lines the user chose, each with the continuation
 * lines under it (its stack trace), and nothing else - no line around them, no file name, nothing
 * of how they were read (user decision 2026-10-12: nothing goes to a model the user did not
 * choose). Put together by main from what it read, never text the page wrote. Pure, so the
 * preview the pane shows and what is sent are the same string.
 */

export const EXPLAIN_SYSTEM = [
  'You explain lines of a log file to the developer reading them.',
  'Say what they mean, their likely causes, how to confirm which, and what to change or check.',
  'Be concise and concrete.',
  'If the lines do not say enough to know, say so rather than guess.',
].join(' ')

/** EXPLAIN's instructions, then the user's own of the AI settings (their language, their stack). */
export function explainSystem(userPrompt: string): string {
  const own = userPrompt.trim()
  return own === '' ? EXPLAIN_SYSTEM : `${EXPLAIN_SYSTEM}\n\n${own}`
}

/** A line as EXPLAIN sends it and COPY copies it: the line, its trace, and how much was left out. */
export function lineText(line: LogLine): string {
  const more = line.more.length === 0 ? '' : `\n${line.more.join('\n')}`
  const left = line.moreCut > 0 ? `\n... ${line.moreCut} more lines` : ''
  // Kept shorter than written: said, so neither a model nor a paste takes it for the whole line.
  const cut = line.cut ? '\n... (cut: longer than what is kept)' : ''
  return `${line.raw}${more}${left}${cut}`
}

/**
 * The question: the chosen lines in the order they were written, masked when asked. Nothing is
 * cut to fit - leaving out part of what was chosen would send something other than the choice -
 * so a choice too long is said to be so (`explainFits`) and not sent.
 */
export function explainText(lines: readonly LogLine[], mask: boolean): string {
  const shown = (text: string): string => (mask ? maskText(text) : text)
  const ordered = [...lines].sort((a, b) => a.seq - b.seq)
  const asked =
    ordered.length === 1 ? 'Explain this log line' : `Explain these ${ordered.length} log lines`
  return [
    `${asked}${mask ? ' (values masked as •••)' : ''}:`,
    '```',
    // Masked a line at a time, each cut first to what could be sent at all: masking is a pass
    // over all it is given, and a trace can be long.
    ...ordered.map((line) => shown(lineText(line).slice(0, LOG_LIMITS.explainChars + 1))),
    '```',
  ].join('\n')
}

/**
 * Whether a question may be sent: within `explainChars`, and no line cut to make it so - masking
 * shortens a line after it was cut to what could be sent, so the text alone may fit when a line
 * did not.
 */
export const explainFits = (lines: readonly LogLine[], text: string): boolean =>
  text.length <= LOG_LIMITS.explainChars &&
  lines.every((line) => lineText(line).length <= LOG_LIMITS.explainChars)
