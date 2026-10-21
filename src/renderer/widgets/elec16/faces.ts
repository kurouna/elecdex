/**
 * The typefaces the ELEC-16's skins print their keys in (docs/elec16.md section 7): the app's
 * own three, and the faces of the skins that have one of their own. All OFL, bundled (the page
 * loads fonts only from itself). A face's Latin comes from its Fontsource stylesheet; the カナ
 * key's two letters from the Japanese face that suits it, one subset file each, so the key is
 * not set in whatever the system has.
 */

import '@fontsource/barlow-condensed/latin-500.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/ibm-plex-sans-condensed/latin-500.css'
import '@fontsource/ibm-plex-sans-condensed/latin-600.css'
import '@fontsource/ibm-plex-sans-condensed/latin-700.css'
import '@fontsource/inter-tight/latin-500.css'
import '@fontsource/inter-tight/latin-600.css'
import '@fontsource/m-plus-rounded-1c/latin-500.css'
import '@fontsource/m-plus-rounded-1c/latin-700.css'
import '@fontsource/m-plus-rounded-1c/latin-800.css'
import '@fontsource/albert-sans/latin-500.css'
import '@fontsource/albert-sans/latin-600.css'
// Subset 119 holds the kana: カ (U+30AB) and ナ (U+30CA) are all that is taken from it.
import bizKana from '@fontsource/biz-udpgothic/files/biz-udpgothic-119-700-normal.woff2?url'
import plexKana from '@fontsource/ibm-plex-sans-jp/files/ibm-plex-sans-jp-119-500-normal.woff2?url'
import mplusKana from '@fontsource/m-plus-rounded-1c/files/m-plus-rounded-1c-119-700-normal.woff2?url'
import notoKana from '@fontsource/noto-sans-jp/files/noto-sans-jp-119-500-normal.woff2?url'

export type Face = 'ui' | 'display' | 'mono' | 'barlow' | 'plex' | 'interTight' | 'mplus' | 'albert'

/** Each face's own family, as a canvas names it to measure a label (no CSS variables there). */
const FAMILY: Readonly<Record<Face, string>> = {
  ui: '"Saira Condensed"',
  display: '"Chakra Petch"',
  mono: '"JetBrains Mono Variable"',
  barlow: '"Barlow Condensed"',
  plex: '"IBM Plex Sans Condensed"',
  interTight: '"Inter Tight"',
  mplus: '"M PLUS Rounded 1c"',
  albert: '"Albert Sans"',
}

/** The カナ letters' family for each face that brings its own. */
const KANA: Partial<Readonly<Record<Face, { family: string; url: string; weight: string }>>> = {
  barlow: { family: 'E16 Kana BIZ', url: bizKana, weight: '700' },
  plex: { family: 'E16 Kana Plex', url: plexKana, weight: '500' },
  interTight: { family: 'E16 Kana Noto', url: notoKana, weight: '500' },
  albert: { family: 'E16 Kana Noto', url: notoKana, weight: '500' },
  // M PLUS Rounded's own kana, under its own name: its Latin and kana are one family.
  mplus: { family: 'M PLUS Rounded 1c', url: mplusKana, weight: '700' },
}

/** A face as CSS sets it: the face, its kana, then the app's stack. */
export function faceStack(face: Face): string {
  if (face === 'ui') return 'var(--font-ui)'
  if (face === 'display') return 'var(--font-display)'
  if (face === 'mono') return 'var(--font-mono)'
  const kana = KANA[face]
  return kana === undefined || kana.family === 'M PLUS Rounded 1c'
    ? `${FAMILY[face]}, var(--font-ui)`
    : `${FAMILY[face]}, "${kana.family}", var(--font-ui)`
}

/** A face as a canvas's font names it, for measuring. */
export const faceFamily = (face: Face): string => FAMILY[face]

let kanaAdded = false

/**
 * The kana faces, added to the page once, the first time a skin needs one: each is two
 * letters wide (unicode-range), so nothing else ever falls to it.
 */
function addKana(): void {
  if (kanaAdded || typeof FontFace === 'undefined') return
  kanaAdded = true
  const seen = new Set<string>()
  for (const kana of Object.values(KANA)) {
    if (kana === undefined || seen.has(kana.url)) continue
    seen.add(kana.url)
    document.fonts.add(
      new FontFace(kana.family, `url(${kana.url})`, {
        weight: kana.weight,
        unicodeRange: 'U+30AB, U+30CA',
      }),
    )
  }
}

/**
 * Resolves once a face is ready at the weights asked, so labels are measured in it, not in the
 * fallback it shows meanwhile. A face of the app's own is always ready.
 */
export function faceReady(face: Face, weights: readonly number[]): Promise<void> {
  if (face === 'ui' || face === 'display' || face === 'mono') return Promise.resolve()
  // A page without the font loading API (a test's DOM) measures in what it has.
  if (typeof document === 'undefined' || document.fonts === undefined) return Promise.resolve()
  addKana()
  return Promise.all(
    weights.map((w) => document.fonts.load(`${w} 10px ${FAMILY[face]}`, 'MODEカナ')),
  ).then(
    () => undefined,
    () => undefined,
  )
}
