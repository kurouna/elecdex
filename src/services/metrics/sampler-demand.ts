/**
 * What the Windows sampler is asked for, so it reads only that.
 *
 * The sampler is one long-lived PowerShell that used to read everything on
 * its own clock - the process table, the socket table with its owners, a ping,
 * the disk counters - whatever the panes showed, as long as any source kept it
 * alive: with the window put away, the charts' samples alone kept all of it
 * going. Each reading the collector asks for now marks its kind wanted; a kind
 * not asked for within its window lapses. The wanted set goes to the script as
 * one line on its standard input whenever it changes (windows-sampler.ts).
 *
 * Pure and clocked from outside, so it is unit-tested on its own.
 */

export const SAMPLER_KINDS = [
  'net',
  'iface',
  'proc',
  'tcp',
  'ping',
  'dio',
  'power',
  'swap',
  'drives',
] as const
export type SamplerKind = (typeof SAMPLER_KINDS)[number]

/**
 * How long a kind stays wanted after it was last asked for: a few of its
 * sources' periods (1-5 s for the quick ones, 10-30 s for the slow ones), so a
 * source polling on its own clock never sees its kind lapse between two reads.
 */
export const WANTED_FOR_MS: Record<SamplerKind, number> = {
  net: 15_000,
  iface: 15_000,
  proc: 15_000,
  tcp: 15_000,
  ping: 15_000,
  dio: 15_000,
  power: 75_000,
  swap: 75_000,
  drives: 75_000,
}

export class SamplerDemand {
  private readonly asked = new Map<SamplerKind, number>()
  private sent = ''

  /** Marks kinds asked for now. */
  want(kinds: readonly SamplerKind[], now: number): void {
    for (const kind of kinds) this.asked.set(kind, now)
  }

  /** The kinds wanted now, in a fixed order. */
  wanted(now: number): SamplerKind[] {
    return SAMPLER_KINDS.filter((kind) => {
      const at = this.asked.get(kind)
      return at !== undefined && now - at < WANTED_FOR_MS[kind]
    })
  }

  /**
   * The line to send when the wanted set differs from the one last sent, and
   * the kinds that lapsed since - whose last readings are stale from now on.
   */
  change(now: number): { line: string; lapsed: SamplerKind[] } | null {
    const wanted = this.wanted(now)
    const line = wanted.join(',')
    if (line === this.sent) return null
    const before = this.sent === '' ? [] : this.sent.split(',')
    this.sent = line
    return {
      line,
      lapsed: before.filter((kind): kind is SamplerKind => !wanted.includes(kind as SamplerKind)),
    }
  }

  /** A new sampler has heard nothing yet: the next change sends the whole set again. */
  restart(): void {
    this.sent = ''
  }
}
