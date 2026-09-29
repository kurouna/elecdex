/**
 * Which quirks each machine has, and how chip8Archive's settings name them
 * (docs/architecture.md section 5.18).
 *
 * The profiles follow what Timendus's chip8-test-suite expects of each platform - the
 * COSMAC VIP for `chip8`, the "modern" SUPER-CHIP that Octo runs for `schip`, and Octo's
 * XO-CHIP - so the suite's quirks test passes on each (tests/unit/chip8-suite.test.ts).
 */

import { type Platform, QUIRK_NAMES, type Quirks } from './types.js'

export const QUIRK_PROFILES: Readonly<Record<Platform, Readonly<Quirks>>> = {
  chip8: {
    vfReset: true,
    memIncrement: true,
    shiftVx: false,
    jumpVx: false,
    clip: true,
    displayWait: true,
    vfOrder: false,
  },
  schip: {
    vfReset: false,
    memIncrement: false,
    shiftVx: true,
    jumpVx: true,
    clip: true,
    displayWait: false,
    vfOrder: false,
  },
  xochip: {
    vfReset: false,
    memIncrement: true,
    shiftVx: false,
    jumpVx: false,
    clip: false,
    displayWait: false,
    vfOrder: false,
  },
}

export const quirksFor = (platform: Platform): Quirks => ({ ...QUIRK_PROFILES[platform] })

/** The profile a set of quirks matches exactly, or null for a mix of one's own. */
export function profileOf(quirks: Quirks): Platform | null {
  for (const platform of ['chip8', 'schip', 'xochip'] as const) {
    const profile = QUIRK_PROFILES[platform]
    if (QUIRK_NAMES.every((name) => profile[name] === quirks[name])) return platform
  }
  return null
}

/**
 * chip8Archive keeps Octo's option names. Octo's flags do not all point the way ours do:
 * `loadStoreQuirks` on means I is *not* moved. A flag the program does not set keeps the
 * platform's own value.
 */
const OCTO_FLAGS: Readonly<Record<string, { quirk: keyof Quirks; invert: boolean }>> = {
  shiftQuirks: { quirk: 'shiftVx', invert: false },
  loadStoreQuirks: { quirk: 'memIncrement', invert: true },
  jumpQuirks: { quirk: 'jumpVx', invert: false },
  logicQuirks: { quirk: 'vfReset', invert: false },
  clipQuirks: { quirk: 'clip', invert: false },
  vBlankQuirks: { quirk: 'displayWait', invert: false },
  vfOrderQuirks: { quirk: 'vfOrder', invert: false },
}

export function quirksFromOcto(
  platform: Platform,
  options: Readonly<Record<string, unknown>>,
): Quirks {
  const quirks = quirksFor(platform)
  for (const [flag, { quirk, invert }] of Object.entries(OCTO_FLAGS)) {
    const value = options[flag]
    if (typeof value === 'boolean') quirks[quirk] = value !== invert
  }
  return quirks
}
