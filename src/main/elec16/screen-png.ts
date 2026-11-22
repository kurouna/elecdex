import path from 'node:path'
import { MODEL_IDS, type ModelId } from '@shared/elec16/map'
import { isPngData } from '@shared/utility'

/**
 * SAVE PNG from an ELEC-16 pane (docs/elec16.md section 7): what main takes from the page and
 * the name it gives the file. The page sends the picture and its model, nothing more: main
 * checks the PNG as it checks one for the clipboard (`isPngData`), and names the file itself
 * from its own clock, so no name the page makes is ever written.
 */
export function isScreenPng(data: unknown, model: unknown): data is Uint8Array {
  return isPngData(data) && MODEL_IDS.includes(model as ModelId)
}

const two = (n: number): string => String(n).padStart(2, '0')

/** `elec16-<model>-<YYYYMMDD-HHMMSS>.png`, in local time. */
export function screenPngName(model: ModelId, at: Date): string {
  const day = `${at.getFullYear()}${two(at.getMonth() + 1)}${two(at.getDate())}`
  const time = `${two(at.getHours())}${two(at.getMinutes())}${two(at.getSeconds())}`
  return `elec16-${model}-${day}-${time}.png`
}

/**
 * The picked path ending in `.png`: a save dialog that does not add its filter's extension
 * (GTK's) leaves it off, and a PNG is never written under another file's extension.
 */
export const withPngExtension = (file: string): string =>
  path.extname(file).toLowerCase() === '.png' ? file : `${file}.png`
