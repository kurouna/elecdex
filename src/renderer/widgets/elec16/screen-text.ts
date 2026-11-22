import { dotText, screenText } from '@shared/elec16/font'
import type { Model } from '@shared/elec16/map'
import type { Elec16State } from '@shared/elec16/state'
import { playText, screenShows } from './play-painter.js'

/**
 * The text a screen shows, read back through the font: what a screen reader is told
 * (Lcd.svelte, PlayScreen.svelte) and what COPY TEXT puts on the clipboard, read the model's
 * way - the pocket models by character cells, SCI-128 on any dot row with its big digits,
 * PLAY-320 from its bitmap. Nothing from a screen that shows nothing: the machine off, the
 * LCD out, PLAY-320's tile engine (its tiles are pictures, not the font).
 */
export function screenLines(model: Model, s: Elec16State): string[] {
  if (model.video) {
    return screenShows(s.video, s.off) === 'bitmap' ? playText(s.video?.mem ?? []) : []
  }
  if (!s.lcd.on || s.off) return []
  // The calculator sets its text on any dot row and its answers in big digits: read by dots.
  const read = model.rom === 'sci' ? dotText : screenText
  return read(s.vram, model.width, model.height)
}

/**
 * The lines as COPY TEXT gives them: each without the spaces at its end, and without the
 * empty lines above and below the text; '' when there is no text at all.
 */
export function copyText(lines: readonly string[]): string {
  const trimmed = lines.map((line) => line.trimEnd())
  const first = trimmed.findIndex((line) => line !== '')
  if (first < 0) return ''
  const last = trimmed.findLastIndex((line) => line !== '')
  return trimmed.slice(first, last + 1).join('\n')
}
