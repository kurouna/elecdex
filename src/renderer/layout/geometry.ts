/**
 * Boxes on screen, in CSS pixels, as the layout's effects and gestures use them:
 * a `Frame` by its edges, for what is compared side by side (a close's clip, the
 * zoom's flight), and a `Box` by its corner and size, for what is divided up (the
 * drop zones). Both are plain objects: a DOMRect keeps its fields as prototype
 * getters, so it cannot be spread or compared as one.
 */

/** A box by its edges. */
export interface Frame {
  top: number
  right: number
  bottom: number
  left: number
}

/** A box by its top-left corner and its size. */
export interface Box {
  left: number
  top: number
  width: number
  height: number
}

/** Where an element is drawn now, by its edges. */
export function frameOf(element: Element): Frame {
  const { top, right, bottom, left } = element.getBoundingClientRect()
  return { top, right, bottom, left }
}

/** Where an element is drawn now, by its corner and size. */
export function boxOf(element: Element): Box {
  const { left, top, width, height } = element.getBoundingClientRect()
  return { left, top, width, height }
}

/** A length for a style, in whole pixels. */
export const px = (n: number): string => `${Math.round(n)}px`
