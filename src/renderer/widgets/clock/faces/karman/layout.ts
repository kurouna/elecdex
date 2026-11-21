/**
 * Where KARMAN sets its digits, in pixels: the same place for the obstacle mask (scaled to the
 * grid) and the text drawn over it, so what is read is what the wind meets.
 */
export interface KarmanText {
  /** The digits' font size. */
  fs: number
  /** The left end of the text and its baseline. */
  x: number
  y: number
}

/** HH:MM:SS's width in ems, in the condensed face at weight 600, with a little to spare. */
const TEXT_EMS = 4.4

/**
 * The digits for a `width` x `height` pane. They stand a fifth or more of the tunnel in from the
 * left, so the wind has room to settle before it meets them and a wake behind them to shed
 * into; a low strip gives them most of its height, a tall pane half.
 */
export function karmanText(width: number, height: number): KarmanText {
  const tall = height >= 100
  const lead = tall ? 0.18 : 0.24
  const fs = Math.max(
    0,
    Math.min(tall ? height * 0.5 : height * 0.82, (width * (0.94 - lead)) / TEXT_EMS),
  )
  return { fs, x: width * lead, y: height / 2 + fs * 0.35 }
}
