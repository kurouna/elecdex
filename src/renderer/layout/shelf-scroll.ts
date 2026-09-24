/**
 * The preset shelf in the LAYOUTS dialog scrolls sideways, so presets can be
 * added without the dialog growing. A mouse wheel only turns up and down, so a
 * vertical turn over the shelf is taken as a sideways scroll - but only while
 * there is somewhere to go, so that at either end, and on a shelf that fits,
 * the wheel is left alone.
 */

/** A wheel turn as the DOM reports it. */
export interface WheelLike {
  deltaX: number
  deltaY: number
  /** 0 pixels, 1 lines, 2 pages (WheelEvent.DOM_DELTA_*). */
  deltaMode: number
}

/** The shelf's scroll position and extent. */
export interface ScrollBox {
  scrollLeft: number
  scrollWidth: number
  clientWidth: number
}

const LINE_PX = 16

/**
 * How far to scroll the shelf sideways for a wheel turn, in pixels; null when
 * the turn is not the shelf's to take - it is already sideways (a trackpad
 * scrolls the shelf by itself), or there is no room in that direction.
 */
export function shelfScrollFor(wheel: WheelLike, box: ScrollBox): number | null {
  if (Math.abs(wheel.deltaX) >= Math.abs(wheel.deltaY)) return null
  const unit = wheel.deltaMode === 1 ? LINE_PX : wheel.deltaMode === 2 ? box.clientWidth : 1
  const delta = wheel.deltaY * unit
  const room = box.scrollWidth - box.clientWidth
  if (room <= 0) return null
  if (delta < 0 && box.scrollLeft <= 0) return null
  if (delta > 0 && box.scrollLeft >= room - 0.5) return null
  return delta
}
