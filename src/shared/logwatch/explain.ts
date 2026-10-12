import { maskText } from './text.js'
import { FORMAT_NAMES, LOG_LIMITS, type LogFormat, type LogLine } from './types.js'

/**
 * What EXPLAIN sends (docs/logwatch.md §7): the chosen line, with its continuation lines, and
 * the lines before it, put together by main from what it read - never text the page wrote.
 * Pure, so the preview the pane shows and what is sent are the same string.
 */

export const EXPLAIN_SYSTEM = [
  'You explain one entry of a log file to the developer reading it.',
  'Say what the entry means, its likely causes, how to confirm which, and what to change or check.',
  'Use the lines before it as context. Be concise and concrete.',
  'If the log does not say enough to know, say so rather than guess.',
].join(' ')

/** EXPLAIN's instructions, then the user's own of the AI settings (their language, their stack). */
export function explainSystem(userPrompt: string): string {
  const own = userPrompt.trim()
  return own === '' ? EXPLAIN_SYSTEM : `${EXPLAIN_SYSTEM}\n\n${own}`
}

function lineText(line: LogLine): string {
  const more = line.more.length === 0 ? '' : `\n${line.more.join('\n')}`
  const cut = line.moreCut > 0 ? `\n... ${line.moreCut} more lines` : ''
  return `${line.raw}${more}${cut}`
}

/**
 * The question: the file and how it was read, the context, then the entry. Context lines are
 * dropped from the oldest while the whole is over `explainChars`; the entry is never dropped.
 */
export function explainText(
  target: LogLine,
  before: readonly LogLine[],
  about: { file: string; format: LogFormat },
  mask: boolean,
): string {
  const shown = (text: string): string => (mask ? maskText(text) : text)
  // Cut before masking: masking is a pass over all it is given, and a trace can be long.
  const cut = (line: LogLine): string => shown(lineText(line).slice(0, LOG_LIMITS.explainChars))
  const entry = cut(target)
  const head = `Log file: ${about.file} (${FORMAT_NAMES[about.format]})${mask ? ', values masked as •••' : ''}`
  const context = before.slice(-LOG_LIMITS.explainBefore).map(cut)
  const build = (lines: readonly string[]): string =>
    [
      head,
      '',
      ...(lines.length > 0 ? ['Lines before it:', '```', ...lines, '```', ''] : []),
      'Explain this entry:',
      '```',
      entry,
      '```',
    ].join('\n')
  let kept = context
  let text = build(kept)
  while (text.length > LOG_LIMITS.explainChars && kept.length > 0) {
    kept = kept.slice(1)
    text = build(kept)
  }
  return text
}
