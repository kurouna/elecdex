/**
 * Handing text from one pane to another (docs/architecture.md §5.27): the RSS pane's
 * TRANSLATE and ASK AI give an article's headline and summary to the TRANSLATE pane or the
 * AI chat. The text waits here, the widget is called up as its shortcut would call it
 * (layout/summon.ts: its pane in the layout focused, or popped up), and the called widget
 * takes the text when it hears the call (`onSummoned`). Never the clipboard: a hand-over
 * must not overwrite what the person copied.
 *
 * Only the workspace can call a widget up; it hands over its `summon` while it is mounted,
 * as it does its shortcuts through lib/commands.ts.
 */

/** Widgets that take a hand-over. */
export type HandOverTarget = 'translate' | 'aichat'

/** A hand-over older than this is not for a pane that mounts now (a layout reset, a move). */
const FRESH_MS = 2000

let summoner: ((widget: string) => void) | null = null
const waiting = new Map<HandOverTarget, { text: string; at: number }>()

/** The workspace's summon; the function returned takes it back, if it is still this one. */
export function provideSummoner(summon: (widget: string) => void): () => void {
  summoner = summon
  return () => {
    if (summoner === summon) summoner = null
  }
}

/** Gives `text` to the widget and calls it up; false when there is no workspace to do it. */
export function handOver(widget: HandOverTarget, text: string): boolean {
  if (summoner === null) return false
  waiting.set(widget, { text, at: Date.now() })
  summoner(widget)
  return true
}

/** The text handed to this widget just now, once; null when none is waiting. */
export function takeHandOver(widget: HandOverTarget): string | null {
  const handed = waiting.get(widget)
  waiting.delete(widget)
  if (handed === undefined || Date.now() - handed.at > FRESH_MS) return null
  return handed.text
}
