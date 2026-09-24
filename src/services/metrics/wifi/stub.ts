import type {
  NetWifi,
  NetWifiEvents,
  WifiCounters,
  WifiEvent,
  WifiLink,
  WifiProbe,
} from '@shared/wifi'

/**
 * A made-up Wi-Fi link, for the tests and the README screenshots, so neither
 * reads - or publishes - this machine's network, its addresses or where it has
 * connected. `ELECDEX_WIFI_STUB`:
 *
 *  - `1`: a steady link with fixed figures, for asserting on.
 *  - `demo`: a lively one for screenshots and recordings.
 *  - `train`: a trip. Every 40 seconds the way out goes for 8 (a tunnel, the
 *    gateway still answering), the channel changes every 30 (a new car's access
 *    point), and the signal swings.
 *
 * Pure functions of the time since the collector started, so a spec can wait
 * for a phase rather than race one. The addresses are documentation ranges.
 */

export type WifiStub = 'steady' | 'demo' | 'train'

export function wifiStubFrom(value: string | undefined): WifiStub | null {
  if (value === '1') return 'steady'
  if (value === 'demo') return 'demo'
  if (value === 'train') return 'train'
  return null
}

const SSID: Record<WifiStub, string> = {
  steady: 'ELECDEX-LAB',
  demo: 'ELECDEX-LAB',
  train: 'TRAIN_FREE_WiFi',
}

/** Frames a second the stub link sends: a call's worth, so its retry share counts. */
const FRAMES_PER_SECOND = 300

/**
 * The counters after `seconds`, each second's retries at that second's share -
 * summed, so they only ever climb, as a driver's do.
 */
function counters(kind: WifiStub, seconds: number): WifiCounters {
  let retries = 40_000
  for (let s = 1; s <= seconds; s++)
    retries += Math.round(FRAMES_PER_SECOND * motion(kind, s).retry)
  return {
    txFrames: 400_000 + seconds * FRAMES_PER_SECOND,
    rxFrames: 1_200_000 + seconds * 900,
    retries,
    multiRetries: 9000 + seconds * 20,
    failed: 12,
    ackFailures: 80_000 + seconds * 40,
    fcsErrors: 0,
    decryptFailures: 0,
    handshakeFailures: 0,
  }
}

/** The figures that move: fixed for `steady`, swinging for the others. */
function motion(kind: WifiStub, seconds: number) {
  const wave = Math.sin(seconds / 7)
  const noise = Math.sin(seconds * 1.7) * 2
  if (kind === 'steady')
    return { wave: 0, rssi: -55, channel: 60, retry: 0.04, rx: 250_000, tx: 50_000 }
  const train = kind === 'train'
  return {
    wave,
    rssi: Math.round((train ? -64 : -52) + wave * (train ? 9 : 4) + noise),
    // A new car's access point every half minute.
    channel: train ? (Math.floor(seconds / 30) % 2 === 0 ? 36 : 149) : 60,
    retry: train ? 0.14 + Math.max(0, -wave) * 0.2 : 0.05,
    rx: Math.max(0, 400_000 + wave * 350_000),
    tx: Math.max(0, 60_000 + Math.cos(seconds / 5) * 50_000),
  }
}

function link(kind: WifiStub, seconds: number): WifiLink {
  const { wave, rssi, channel, rx, tx } = motion(kind, seconds)
  const freq = 5000 + channel * 5
  return {
    id: 'stub-wlan0',
    adapter: 'Wireless Adapter (stub)',
    state: 'connected',
    ssid: SSID[kind],
    standard: 'ax',
    freqMhz: freq,
    channel,
    widthMhz: kind === 'train' ? 80 : 160,
    rssi,
    noise: null,
    quality: Math.max(0, Math.min(100, Math.round(2 * (rssi + 100)))),
    rxMbps: Math.round(1201 + wave * 300),
    txMbps: Math.round(960 + wave * 200),
    radios: [],
    security: 'WPA3-Personal',
    cipher: 'GCMP256',
    internet: 'internet',
    metered: false,
    backgroundScan: true,
    streamingMode: false,
    mac: '02:00:5e:10:00:01',
    ip4: '192.0.2.23',
    prefix4: 24,
    ip6: [],
    gateway: '192.0.2.1',
    dns: ['192.0.2.1'],
    mtu: 1500,
    dhcp: true,
    leaseSeconds: 86_400 - (seconds % 86_400),
    rxSec: rx,
    txSec: tx,
    counters: counters(kind, seconds),
  }
}

function probe(kind: WifiStub, seconds: number, at: number): WifiProbe {
  const gateway = kind === 'steady' ? 2 : Math.round(2 + Math.abs(Math.sin(seconds)) * 3)
  let internet: number | null =
    kind === 'steady' ? 18 : Math.round(24 + Math.abs(Math.sin(seconds / 3)) * 16)
  if (kind === 'train') {
    internet = Math.round(70 + Math.abs(Math.sin(seconds / 2)) * 90)
    const phase = seconds % 40
    if (phase >= 20 && phase < 28) internet = null
    else if (seconds % 9 === 0) internet = null
  }
  return { at, host: '192.0.2.53', internet, gatewayAddress: '192.0.2.1', gateway }
}

export function stubWifi(kind: WifiStub, startedAt: number, now: number): NetWifi {
  const seconds = Math.floor((now - startedAt) / 1000)
  const at = Math.floor(now / 1000) * 1000
  return {
    links: [link(kind, seconds)],
    probe: probe(kind, seconds, at),
    limits: ['bssid-location'],
  }
}

export function stubWifiEvents(kind: WifiStub, startedAt: number): NetWifiEvents {
  const minute = 60_000
  const event = (ago: number, e: Omit<WifiEvent, 'key' | 'at'>): WifiEvent => ({
    key: `stub:${ago}`,
    at: startedAt - ago,
    ...e,
  })
  const ssid = SSID[kind]
  const drop = 'The network was disconnected by the driver.'
  const events: WifiEvent[] =
    kind === 'train'
      ? [
          event(3 * minute, { kind: 'connected', ssid, code: null, reason: '' }),
          event(3 * minute + 14_000, { kind: 'disconnected', ssid, code: 0, reason: drop }),
          event(33 * minute, { kind: 'connected', ssid, code: null, reason: '' }),
          event(33 * minute + 9000, { kind: 'disconnected', ssid, code: 0, reason: drop }),
          event(63 * minute, { kind: 'connected', ssid, code: null, reason: '' }),
          event(63 * minute + 11_000, { kind: 'disconnected', ssid, code: 0, reason: drop }),
          event(93 * minute, { kind: 'connected', ssid, code: null, reason: '' }),
        ]
      : [
          event(12 * minute, { kind: 'connected', ssid, code: null, reason: '' }),
          event(12 * minute + 6000, {
            kind: 'disconnected',
            ssid,
            code: 0,
            reason: 'The network was disconnected by the driver.',
          }),
          event(4 * 60 * minute, {
            kind: 'failed',
            ssid,
            code: 163_841,
            reason: 'The network is not available.',
          }),
        ]
  return { events: events.sort((a, b) => b.at - a.at) }
}
