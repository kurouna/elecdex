import chakraPetch from '@fontsource/chakra-petch/files/chakra-petch-latin-600-normal.woff2?inline'
import sairaCondensed500 from '@fontsource/saira-condensed/files/saira-condensed-latin-500-normal.woff2?inline'
import sairaCondensed700 from '@fontsource/saira-condensed/files/saira-condensed-latin-700-normal.woff2?inline'
import jetbrainsMono from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?inline'
import type { PluginFontFace } from '@shared/plugins'

/**
 * The app's own faces for plugin canvases (docs/plugins.md section 13).
 *
 * A worker has a font set of its own, and the page's @font-face rules do not reach it. It
 * cannot fetch the files either: the page is a file:// document, and CSP holds fonts to
 * 'self'. So the faces travel as bytes and the worker makes FontFaces of them, which no
 * policy stands between. They are inlined in this module, which the host imports only
 * when a plugin first shows a canvas: a plugin-free app never loads them.
 */

const FACES: readonly { family: string; weight: string; url: string }[] = [
  { family: 'Chakra Petch', weight: '600', url: chakraPetch },
  { family: 'Saira Condensed', weight: '500', url: sairaCondensed500 },
  { family: 'Saira Condensed', weight: '700', url: sairaCondensed700 },
  { family: 'JetBrains Mono Variable', weight: '100 800', url: jetbrainsMono },
]

let decoded: PluginFontFace[] | null = null

/** The faces as bytes, decoded once; each worker gets its own copy when they are posted. */
export function appFaces(): readonly PluginFontFace[] {
  decoded ??= FACES.map((face) => {
    const text = atob(face.url.slice(face.url.indexOf(',') + 1))
    const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0))
    return { family: face.family, weight: face.weight, style: 'normal', data: bytes.buffer }
  })
  return decoded
}
