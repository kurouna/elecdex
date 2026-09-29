/**
 * How big an emulated screen is drawn in the room a pane gives it (docs/architecture.md
 * section 5.18). Pure and machine-agnostic.
 *
 * Everything is in device pixels, never CSS pixels: at 125% a whole number of CSS pixels
 * is not a whole number of screen pixels, and dots of one size would come out in two.
 *
 * `integer` scales by whole device pixels, measured in the machine's finest dot (`unit`,
 * for CHIP-8 its 128 x 64 hires screen). A coarser mode is drawn at the matching multiple,
 * so a program that switches resolution keeps its picture the same size. `fit` fills the
 * room at any ratio, keeping the aspect. A room too small for one whole unit dot falls
 * back to `fit` rather than drawing nothing.
 *
 * A screen turned by 90 or 270 degrees swaps the room's sides before it is measured.
 */

export interface Size {
  w: number
  h: number
}

export type FitMode = 'integer' | 'fit'
export type Rotation = 0 | 90 | 180 | 270

export interface FitOptions {
  /** The machine's finest resolution: the one a whole device pixel is counted in. */
  unit: Size
  mode: FitMode
  rotation?: Rotation
}

export interface Fit {
  /** Device pixels per dot of the current resolution. */
  scale: number
  /** The picture in device pixels, before rotation. */
  width: number
  height: number
  /** Whether `scale` is a whole number (dots all the same size). */
  whole: boolean
}

const turned = (room: Size, rotation: Rotation): Size =>
  rotation === 90 || rotation === 270 ? { w: room.h, h: room.w } : room

function fitAny(room: Size, screen: Size): number {
  return Math.max(0, Math.min(room.w / screen.w, room.h / screen.h))
}

function fitWhole(room: Size, screen: Size, unit: Size): number | null {
  const ratio = unit.w / screen.w
  // A resolution that is not a whole multiple of the unit is scaled on its own.
  const step = Number.isInteger(ratio) && ratio >= 1 && unit.h / screen.h === ratio ? ratio : 1
  const base = step === 1 ? screen : unit
  const dots = Math.floor(Math.min(room.w / base.w, room.h / base.h))
  return dots >= 1 ? dots * step : null
}

export function fitScreen(room: Size, screen: Size, options: FitOptions): Fit {
  const inRoom = turned(room, options.rotation ?? 0)
  const whole = options.mode === 'integer' ? fitWhole(inRoom, screen, options.unit) : null
  const scale = whole ?? fitAny(inRoom, screen)
  return {
    scale,
    width: screen.w * scale,
    height: screen.h * scale,
    whole: Number.isInteger(scale) && scale > 0,
  }
}
