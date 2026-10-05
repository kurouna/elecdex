import { parseRgb, type Rgb } from '@shared/qr'

/**
 * Reads CSS colours - a theme's variables, `color-mix()`, any colour CSS takes - as RGB, in
 * `el`'s place in the page, for a canvas to paint with. The value is resolved by CSS (a custom
 * property set on `el` for the moment and read back computed) and turned into numbers by a 2D
 * context's fillStyle. A colour that does not resolve gives `fallback`.
 */
export function colourReader(el: HTMLElement): (css: string, fallback: Rgb) => Rgb {
  const probe = document.createElement('canvas').getContext('2d')
  return (css, fallback) => {
    el.style.setProperty('--colour-probe', css)
    const value = getComputedStyle(el).getPropertyValue('--colour-probe').trim()
    el.style.removeProperty('--colour-probe')
    if (probe === null || value === '') return fallback
    probe.fillStyle = '#000'
    probe.fillStyle = value
    return parseRgb(String(probe.fillStyle)) ?? fallback
  }
}
