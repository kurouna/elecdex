/** Contract for `@calc/numbers`; implemented in ../vendor/numbers.ts. */

/**
 * Every number in a piece of text, in the order they appear. Dates are not torn
 * into signed parts, digits inside identifiers are not counted, and a trailing
 * Japanese magnitude (3百万) is read as part of its number.
 */
export declare function parseNumbersInText(text: string): number[]
