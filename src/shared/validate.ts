/**
 * The shapes several stores and messages accept, written once. Each module
 * keeps its own rules on top (a plugin's URL must be https, an AI address may
 * not carry a query); only the common core is here, so a fix to it reaches
 * every place that checks the same thing.
 */

/** An id a person may type: a lowercase letter or digit, then letters, digits and hyphens. */
export const SLUG_ID = /^[a-z0-9][a-z0-9-]{0,39}$/

/** A #rrggbb colour. */
export const HEX_COLOUR = /^#[0-9a-f]{6}$/i
