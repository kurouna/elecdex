/** Contract for `@calc/format`; implemented in ../vendor/format.ts. */

/** The result as a plain string, rounded to 12 significant digits (0.1 + 0.2 is "0.3"). */
export declare function formatCalcNumber(value: number): string

/** The same, with thousands separators. Exponent notation is left ungrouped. */
export declare function formatGrouped(value: number): string

/** "1234 (0x4D2, 0b10011010010)" - hex and binary only for integers of 10 or more. */
export declare function describeCalcValue(value: number): string

/** "3 numbers" / "1 number". */
export declare function pluralize(count: number, word: string): string
