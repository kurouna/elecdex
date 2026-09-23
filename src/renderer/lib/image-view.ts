/**
 * Where an image sits in a viewer that zooms and pans it: its top-left corner
 * in the viewer (`x`, `y`, in CSS pixels) and its scale. Pure, so the arithmetic
 * of zooming about the pointer and keeping the picture in reach is tested on
 * its own (tests/unit/image-view.test.ts).
 */

export interface View {
  x: number
  y: number
  scale: number
}

export interface Size {
  w: number
  h: number
}

/** The most the viewer magnifies: a pixel as a 32-pixel square is enough to read it. */
export const MAX_SCALE = 32
/** How much of the picture always stays in the viewer, however far it is dragged. */
const KEEP = 32

/** The whole picture, as large as the viewer allows, in its middle. */
export function fitView(image: Size, box: Size): View {
  if (image.w <= 0 || image.h <= 0 || box.w <= 0 || box.h <= 0) return { x: 0, y: 0, scale: 1 }
  const scale = Math.min(box.w / image.w, box.h / image.h, MAX_SCALE)
  return centred(image, box, scale)
}

/** The picture at its own size (one image pixel to one CSS pixel), in the middle. */
export const actualView = (image: Size, box: Size): View => centred(image, box, 1)

const centred = (image: Size, box: Size, scale: number): View => ({
  x: (box.w - image.w * scale) / 2,
  y: (box.h - image.h * scale) / 2,
  scale,
})

/** The least scale: a quarter of the fitted one, or of the image's own size if that is smaller. */
export const minScale = (image: Size, box: Size): number =>
  Math.min(fitView(image, box).scale, 1) / 4

/**
 * Zooms by `factor` about a point of the viewer (the pointer, or the middle),
 * so what is under that point stays under it.
 */
export function zoomAt(
  view: View,
  factor: number,
  at: { x: number; y: number },
  image: Size,
  box: Size,
): View {
  const scale = Math.min(MAX_SCALE, Math.max(minScale(image, box), view.scale * factor))
  const k = scale / view.scale
  return clampView(
    { x: at.x - (at.x - view.x) * k, y: at.y - (at.y - view.y) * k, scale },
    image,
    box,
  )
}

/** Moves the picture, never so far that it leaves the viewer. */
export const panBy = (view: View, dx: number, dy: number, image: Size, box: Size): View =>
  clampView({ ...view, x: view.x + dx, y: view.y + dy }, image, box)

/** Keeps at least a strip of the picture in the viewer on each axis. */
export function clampView(view: View, image: Size, box: Size): View {
  const clamp = (value: number, length: number, room: number): number => {
    const keep = Math.min(KEEP, length)
    return Math.min(room - keep, Math.max(keep - length, value))
  }
  return {
    scale: view.scale,
    x: clamp(view.x, image.w * view.scale, box.w),
    y: clamp(view.y, image.h * view.scale, box.h),
  }
}

/** A wheel turn as a zoom factor: a notch of a mouse wheel is about 1.2, a trackpad smoother. */
export function wheelFactor(deltaY: number, deltaMode: number): number {
  const pixels = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY
  return Math.exp(-Math.max(-600, Math.min(600, pixels)) * 0.0015)
}
