/** Contract for `@calc/normalize`; implemented in ../vendor/normalize.ts. */

/**
 * Pulls full-width characters and the arithmetic look-alikes to ASCII, so an
 * expression typed with a Japanese IME evaluates. Long vowel marks and dashes
 * are deliberately not read as minus.
 */
export declare function normalizeCalcInput(input: string): string
