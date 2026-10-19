import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { sparkPath, unwatchedRuns } from '../../src/renderer/widgets/wifi/draw'
import {
  type HintContext,
  hintFor,
  liveFor,
  shortAdapter,
} from '../../src/renderer/widgets/wifi/hints'
import { bucketize, diagnose, pathFigures, WIFI_LIMITS, type WifiLink } from '../../src/shared/wifi'

/**
 * The Wi-Fi pane's explanations (hints.ts) and the drawing helpers that are
 * pure: every figure the pane marks with `data-hint` has a card, a card quotes
 * the limits the pane really judges by, and its NOW line reads the figures.
 */

const DIR = path.join(import.meta.dirname, '../../src/renderer/widgets/wifi')
/** The parts it shares with the Ethernet pane, whose markup carries its keys too. */
const SHARED = path.join(import.meta.dirname, '../../src/renderer/widgets/netpath')

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
    'station-': ['pc', 'radio', 'gateway', 'internet'],
    'lane-': ['signal', 'retry', 'rtt', 'loss', 'traffic', 'events'],
    'event-': [
      'connected',
      'failed',
      'disconnected',
      'handover',
      'upstream-lost',
      'upstream-back',
      'sign-in',
    ],
    'c-': [
      'txFrames',
      'rxFrames',
      'retries',
      'multiRetries',
      'ackFailures',
      'failed',
      'fcsErrors',
      'decryptFailures',
      'handshakeFailures',
    ],
  }
  for (const m of text.matchAll(/data-hint="([a-z]+-)\{/g)) {
    for (const rest of expand[m[1] ?? ''] ?? []) keys.add(`${m[1]}${rest}`)
  }
  for (const m of text.matchAll(/key: '([a-z-]+)'/g)) if (m[1]) keys.add(m[1])
  for (const m of text.matchAll(/'([a-z ]+)': 'f-([a-z]+)'/g)) keys.add(`f-${m[2]}`)
  return [...keys]
}

const link = (over: Partial<WifiLink> = {}): WifiLink =>
  ({
    id: 'g1',
    adapter: 'Intel(R) Wi-Fi 6E AX211 160MHz',
    state: 'connected',
    ssid: 'LAB',
    standard: 'ax',
    freqMhz: 5300,
    channel: 60,
    widthMhz: 160,
    rssi: -57,
    noise: null,
    quality: 85,
    rxMbps: 1922,
    txMbps: 1922,
    radios: [],
    security: 'WPA2-Personal',
    cipher: 'CCMP',
    internet: 'internet',
    metered: false,
    backgroundScan: true,
    streamingMode: false,
    counters: {
      txFrames: 1000,
      rxFrames: 3000,
      retries: 90,
      multiRetries: 0,
      failed: 0,
      ackFailures: 0,
      fcsErrors: 0,
      decryptFailures: 0,
      handshakeFailures: 0,
    },
    ...over,
  }) as WifiLink

function context(): HintContext {
  const points = Array.from({ length: 30 }, (_, i) => ({
    at: i * 1000,
    state: 'connected' as const,
    rssi: -57,
    quality: 85,
    rxMbps: 1922,
    txMbps: 1922,
    retry: null,
    frames: 20,
    retries: 10,
    gateway: 2,
    internet: 18,
    up: 1000,
    down: 5000,
    freqMhz: 5300,
    channel: 60,
    internetState: 'internet' as const,
  }))
  const figures = pathFigures(points, 29_000)
  return {
    link: link(),
    figures,
    diagnosis: diagnose(link(), figures),
    mos: 4.4,
    rates: null,
    host: '1.1.1.1',
  }
}

describe('the cards', () => {
  it('cover every figure the pane marks', () => {
    const keys = keysInMarkup()
    expect(keys.length).toBeGreaterThan(30)
    expect(keys.filter((key) => hintFor(key) === null)).toEqual([])
    expect(hintFor('nonsense')).toBeNull()
  })

  it('quote the limits the pane judges by', () => {
    expect(hintFor('station-radio')?.limits).toContain(String(WIFI_LIMITS.rssi.warn))
    expect(hintFor('station-internet')?.limits).toContain(`${WIFI_LIMITS.internetRtt.bad} ms`)
    expect(hintFor('c-retries')?.limits).toContain(`${WIFI_LIMITS.retry.bad} %`)
  })

  it('read what the pane holds now', () => {
    const c = context()
    expect(liveFor('station-internet', c)).toContain('1.1.1.1: median 18 ms')
    expect(liveFor('station-gateway', c)).toContain('median 2 ms')
    expect(liveFor('mos', c)).toContain('4.40')
    // An idle link's retries are not judged, and the card says why.
    expect(liveFor('station-radio', c)).toContain('too few frames')
    expect(liveFor('channel', c)).toContain('a DFS channel')
    expect(liveFor('c-retries', c)).toBe('90 since the adapter came up')
    expect(liveFor('cause', c)).toMatch(/^CLEAR/)
    expect(liveFor('legend', c)).toBeNull()
  })

  it('name an adapter by its model', () => {
    expect(shortAdapter('Intel(R) Wi-Fi 6E AX211 160MHz')).toBe('AX211')
    expect(shortAdapter('Realtek RTL8821CU Wireless LAN 802.11ac USB NIC')).toBe('RTL8821CU')
    expect(shortAdapter('wlan0')).toBe('wlan0')
    expect(shortAdapter('USB Wireless Adapter (stub)')).toBe('USB Wireless …')
  })
})

describe('drawing', () => {
  it('draws a sparkline broken where a reading is missing', () => {
    expect(sparkPath([0, 10], 0, 10, 100, 20)).toBe('M0.0 20.0L100.0 0.0')
    expect(sparkPath([0, null, 10], 0, 10, 100, 20)).toBe('M0.0 20.0M100.0 0.0')
    expect(sparkPath([50], 0, 10, 100, 20)).toBe('M0.0 0.0')
    expect(sparkPath([], 0, 10, 100, 20)).toBe('')
  })

  it('finds the stretches nobody watched', () => {
    const buckets = bucketize(
      [4000, 5000].map((t) => ({
        at: t,
        state: 'connected' as const,
        rssi: -50,
        quality: null,
        rxMbps: null,
        txMbps: null,
        retry: null,
        frames: null,
        retries: null,
        gateway: undefined,
        internet: 10,
        up: null,
        down: null,
        freqMhz: null,
        channel: null,
        internetState: null,
      })),
      0,
      8000,
      8,
    )
    expect(unwatchedRuns(buckets)).toEqual([
      { from: 0, to: 4 },
      { from: 6, to: 8 },
    ])
  })
})

describe('the cards, as the verdict says a round trip', () => {
  it('a hop under a millisecond is <1 ms on its card too', () => {
    const c = context()
    const gateway = {
      ...c.figures.gateway,
      sent: 60,
      received: 60,
      median: 0.4,
      jitter: 0.1,
      max: 0.8,
      loss: 0,
    }
    const live = liveFor('station-gateway', { ...c, figures: { ...c.figures, gateway } })
    expect(live).toContain('<1 ms')
    expect(live).not.toMatch(/\b0 ms/)
  })
})
