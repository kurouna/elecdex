import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  type EtherHintContext,
  etherHintFor,
  etherLiveFor,
  lookupEtherHint,
  shortWired,
} from '../../src/renderer/widgets/ethernet/hints'
import { stubEthernet } from '../../src/services/metrics/ethernet/stub'
import {
  diagnoseEthernet,
  ETHER_LIMITS,
  type EtherEventKind,
  type EtherLink,
  etherFigures,
  toEtherPoint,
} from '../../src/shared/ethernet'

/**
 * The Ethernet pane's explanations (hints.ts): every figure its markup marks
 * with `data-hint` has a card, a card quotes the limits the pane really judges
 * by, and its NOW line reads the figures.
 */

const DIR = path.join(import.meta.dirname, '../../src/renderer/widgets/ethernet')
const SHARED = path.join(import.meta.dirname, '../../src/renderer/widgets/netpath')

const KINDS: EtherEventKind[] = [
  'connected',
  'link-lost',
  'speed',
  'duplex',
  'upstream-lost',
  'upstream-back',
  'sign-in',
  'crc',
  'broadcast',
  'unseen',
  'conflict',
]

/** Every hint key the pane's markup can produce, templates expanded. */
function keysInMarkup(): string[] {
  const text = [DIR, SHARED]
    .flatMap((dir) =>
      readdirSync(dir)
        .filter((f) => f.endsWith('.svelte'))
        .map((f) => readFileSync(path.join(dir, f), 'utf8')),
    )
    .join('\n')
  const keys = new Set<string>()
  for (const m of text.matchAll(/data-hint="([a-z0-9-]+)"/g)) if (m[1]) keys.add(m[1])
  const expand: Record<string, string[]> = {
    // The shared strip's stations, as this pane fills them.
    'station-': ['pc', 'link', 'gateway', 'internet'],
    'lane-': ['link', 'l2', 'rtt', 'loss', 'traffic', 'events'],
    'event-': KINDS,
  }
  for (const m of text.matchAll(/data-hint="([a-z]+-)\{/g)) {
    for (const rest of expand[m[1] ?? ''] ?? []) keys.add(`${m[1]}${rest}`)
  }
  // Keys held in the parts' tables: the detail's facts and counters.
  for (const m of text.matchAll(/'((?:c|f)-[A-Za-z]+)'/g)) if (m[1]) keys.add(m[1])
  return [...keys]
}

function context(): EtherHintContext {
  const sample = stubEthernet('crc', 0, 60_000)
  const link = sample.links[0] as EtherLink
  const point = toEtherPoint(link, sample.probe, 60_000, null)
  const figures = etherFigures([point], 60_000, 1000)
  return { link, figures, diagnosis: diagnoseEthernet(link, figures), mos: 4.4, host: '192.0.2.53' }
}

describe('the Ethernet pane’s cards', () => {
  it('cover every figure the markup marks', () => {
    const keys = keysInMarkup()
    expect(keys.length).toBeGreaterThan(40)
    expect(keys.filter((k) => etherHintFor(k) === null)).toEqual([])
  })

  it('quote the limits the pane judges by, from ETHER_LIMITS', () => {
    const c = ETHER_LIMITS.crc
    expect(etherHintFor('crc')?.limits).toContain(`warn ${c.warnCount} errors and ${c.warnShare} %`)
    expect(etherHintFor('drops')?.limits).toContain(
      `warn ${ETHER_LIMITS.drops.warn}, bad ${ETHER_LIMITS.drops.bad}`,
    )
    expect(etherHintFor('broadcast')?.limits).toContain(`warn ${ETHER_LIMITS.broadcast.warn}/s`)
    expect(etherHintFor('station-gateway')?.limits).toContain(
      `warn ${ETHER_LIMITS.gatewayRtt.warn} ms`,
    )
  })

  it('read what the figures say now', () => {
    const c = context()
    expect(etherLiveFor('cause', c)).toMatch(/^(CLEAR|LINK|STANDBY)/)
    expect(etherLiveFor('station-link', c)).toContain('1 Gb/s full')
    expect(etherLiveFor('power', c)).toBe('on: GREEN, GIGA LITE, POWER SAVE')
    expect(etherLiveFor('f-echo', c)).toBe('192.0.2.53')
    expect(lookupEtherHint('made-up', c)).toBeNull()
  })

  it('a counter’s card says its total and its rate, as Wi-Fi’s do', () => {
    const c = { ...context(), rates: { rxErrors: 3, rxNonUnicast: 4920 } }
    const total = c.link?.counters?.rxErrors ?? 0
    expect(etherLiveFor('c-rxErrors', c)).toBe(
      `${Math.round(total).toLocaleString('en')} since the adapter came up, 3 a minute`,
    )
    expect(etherLiveFor('c-broadcast', c)).toContain('4,920 a minute')
    expect(etherLiveFor('c-txErrors', { ...c, rates: null })).toContain('since the adapter came up')
    expect(etherLiveFor('c-made-up', c)).toBeNull()
  })
})

describe('an adapter’s short name', () => {
  it('keeps the maker and the model or kind', () => {
    expect(shortWired('Realtek Gaming GbE Family Controller')).toBe('Realtek GbE')
    expect(shortWired('Intel(R) Ethernet Controller I225-V')).toBe('Intel I225-V')
    expect(shortWired('Realtek USB GbE Family Controller')).toBe('Realtek GbE')
    expect(shortWired('Gigabit Ethernet Adapter (stub)')).toBe('Gigabit Ethernet Adapter')
  })
})
