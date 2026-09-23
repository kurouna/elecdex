/**
 * The red, green and blue of a colour as getComputedStyle resolves it: the
 * night side's glow is drawn in the theme's accent, pixel by pixel.
 */
export function rgbOf(color: string): [number, number, number] {
  // A colour made with color-mix() computes to `color(srgb 0.1 0.8 0.9)`, in 0-1; rgb() is in 0-255.
  const scale = color.startsWith('color(') ? 255 : 1
  const [r = 0, g = 0, b = 0] = (color.match(/[\d.]+(?:e-?\d+)?/g) ?? []).map(
    (n) => Number(n) * scale,
  )
  return [r, g, b]
}
