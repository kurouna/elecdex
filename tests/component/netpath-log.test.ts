import type { EtherEvent, EtherPoint } from '@shared/ethernet'
import type { Stretch, TrackEvent } from '@shared/wifi'
import { cleanup, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it } from 'vitest'

const { default: WifiLog } = await import('../../src/renderer/widgets/wifi/EventLog.svelte')
const { default: EtherLog } = await import('../../src/renderer/widgets/ethernet/EventLog.svelte')

/**
 * The two panes' logs (widgets/wifi/EventLog.svelte, widgets/ethernet/EventLog.svelte),
 * row by row and bar by bar: what each row says and is marked with, the line
 * above the list, the strip of the day (Wi-Fi) or the hour watched (Ethernet),
 * and what an empty log says. Written before the two were put on one frame, so
 * the frame keeps what each one showed.
 */

const AT = 1_790_000_000_000
const clock = (at: number): string => new Date(at).toTimeString().slice(0, 8)

afterEach(cleanup)

const track = (
  kind: TrackEvent['kind'],
  at: number,
  over: Partial<TrackEvent> = {},
): TrackEvent => ({
  key: `${kind}:${at}`,
  at,
  kind,
  detail: `${kind} words`,
  code: null,
  ssid: null,
  downFor: null,
  ...over,
})

const wired = (
  kind: EtherEvent['kind'],
  at: number,
  over: Partial<EtherEvent> = {},
): EtherEvent => ({
  key: `${kind}:${at}`,
  at,
  kind,
  detail: `${kind} words`,
  downFor: null,
  ...over,
})

const wifiProps = (over: Record<string, unknown> = {}) => ({
  events: [] as TrackEvent[],
  mask: false,
  dropEvery: null,
  spikeEvery: null,
  noLog: false,
  ...over,
})

/** The parts of a row, in the order they stand. */
function cells(row: HTMLElement): string[] {
  return [...row.children].map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim())
}

describe('the Wi-Fi log', () => {
  it('writes a row as its time, glyph, name, words, how long it was down and since its kind', () => {
    const events = [
      track('connected', AT + 20_000),
      track('disconnected', AT + 6000, { downFor: 14, code: 8, ssid: 'LAB' }),
      track('disconnected', AT, { code: 0 }),
    ]
    render(WifiLog, { props: wifiProps({ events }) })
    const rows = screen.getAllByTestId('wifi-event')
    expect(rows.map(cells)).toEqual([
      [clock(AT + 20_000), '▲', 'CONNECTED', 'connected words', '', ''],
      [
        clock(AT + 6000),
        '▼',
        'LINK LOST',
        expect.stringMatching(/^disconnected words ?\[8\] ?· LAB$/),
        'down 14s',
        '+6s',
      ],
      [clock(AT), '▼', 'LINK LOST', 'disconnected words', '', ''],
    ])
    expect(rows.map((r) => [r.dataset.kind, r.dataset.tone, r.dataset.hint])).toEqual([
      ['connected', 'ok', 'event-connected'],
      ['disconnected', 'danger', 'event-disconnected'],
      ['disconnected', 'danger', 'event-disconnected'],
    ])
    expect(rows.map((r) => r.lastElementChild?.getAttribute('data-hint'))).toEqual([
      'since',
      'since',
      'since',
    ])
  })

  it('masks the network’s name when MASK is on', () => {
    const events = [track('connected', AT, { ssid: 'HOME-NETWORK' })]
    render(WifiLog, { props: wifiProps({ events, mask: true }) })
    const words = cells(screen.getByTestId('wifi-event'))[3] ?? ''
    expect(words).not.toContain('HOME-NETWORK')
    expect(words).toContain('·')
  })

  it('counts the day’s events, titled unless under a tab', () => {
    render(WifiLog, { props: wifiProps({ events: [track('connected', AT)] }) })
    const header = screen.getByTestId('wifi-log').querySelector('header')
    expect(header?.textContent).toContain('LOG')
    expect(header?.textContent).toContain('1 event, last 24 h')
    cleanup()
    const two = [track('connected', AT + 1), track('failed', AT)]
    render(WifiLog, { props: wifiProps({ events: two, titled: false }) })
    const bare = screen.getByTestId('wifi-log').querySelector('header')
    expect(bare?.textContent).not.toContain('LOG')
    expect(bare?.textContent).toContain('2 events, last 24 h')
  })

  it('names a steady beat of drops before one of delay spikes', () => {
    render(WifiLog, { props: wifiProps({ dropEvery: 1_800_000, spikeEvery: 60_000 }) })
    expect(screen.getByTestId('wifi-drop-beat').textContent).toBe(
      'drops every ~30 min — a session limit?',
    )
    expect(screen.queryByTestId('wifi-spike-beat')).toBeNull()
    cleanup()
    render(WifiLog, { props: wifiProps({ spikeEvery: 61_000 }) })
    expect(screen.getByTestId('wifi-spike-beat').textContent).toBe(
      'delay spikes every ~61 s — a scan?',
    )
    cleanup()
    render(WifiLog, { props: wifiProps() })
    expect(screen.queryByTestId('wifi-drop-beat')).toBeNull()
    expect(screen.queryByTestId('wifi-spike-beat')).toBeNull()
  })

  it('draws the day from the system’s log, with the way out lost marked on it', () => {
    const from = AT - 86_400_000
    const day: Stretch[] = [
      { from, to: from + 43_200_000, state: 'unknown' },
      { from: from + 43_200_000, to: from + 64_800_000, state: 'up' },
      { from: from + 64_800_000, to: AT, state: 'down' },
    ]
    const events = [track('upstream-lost', from + 21_600_000), track('upstream-lost', from - 1000)]
    render(WifiLog, { props: wifiProps({ day, events }) })
    const bar = screen.getByTestId('wifi-day')
    expect(bar.dataset.hint).toBe('uptime')
    const stretches = screen.getAllByTestId('wifi-day-stretch')
    expect(stretches.map((s) => [s.dataset.state, s.style.left, s.style.width])).toEqual([
      ['unknown', '0%', '50%'],
      ['up', '50%', '25%'],
      ['down', '75%', '25%'],
    ])
    expect(
      stretches.map((s) => ['unknown', 'up', 'down'].find((c) => s.classList.contains(c))),
    ).toEqual(['unknown', 'up', 'down'])
    // Only the loss inside the day is marked on it.
    const marks = [...bar.querySelectorAll('b')].map((b) => (b as HTMLElement).style.left)
    expect(marks).toEqual(['25%'])
    expect(bar.textContent?.trim()).toBe('−24 h−18−12−6now')
  })

  it('draws no day bar without a log, or with nothing in it', () => {
    const day: Stretch[] = [{ from: AT - 1000, to: AT, state: 'up' }]
    render(WifiLog, { props: wifiProps({ day, noLog: true }) })
    expect(screen.queryByTestId('wifi-day')).toBeNull()
    cleanup()
    render(WifiLog, { props: wifiProps() })
    expect(screen.queryByTestId('wifi-day')).toBeNull()
  })

  it('says why it is empty', () => {
    render(WifiLog, { props: wifiProps() })
    expect(screen.getByTestId('wifi-log').querySelector('li')?.textContent?.trim()).toBe(
      'no events in the last day',
    )
    cleanup()
    render(WifiLog, { props: wifiProps({ noLog: true }) })
    expect(screen.getByTestId('wifi-log').querySelector('li')?.textContent?.trim()).toBe(
      'nothing seen yet — this system keeps no connection log elecdex can read',
    )
  })

  it('shows the newest 120 rows, the 120th still told the time since its kind', () => {
    const events = Array.from({ length: 130 }, (_, i) => track('failed', AT - i * 1000))
    render(WifiLog, { props: wifiProps({ events }) })
    const rows = screen.getAllByTestId('wifi-event')
    expect(rows).toHaveLength(120)
    expect(cells(rows[119] as HTMLElement)[5]).toBe('+1s')
    expect(screen.getByTestId('wifi-log').querySelector('header')?.textContent).toContain(
      '130 events',
    )
  })
})

/** A second of the wired history, up unless said otherwise. */
const second = (at: number, over: Partial<EtherPoint> = {}): EtherPoint => ({
  at,
  state: 'up',
  speed: 1000,
  duplex: 'full',
  up: null,
  down: null,
  rxPackets: null,
  errors: null,
  broadcast: null,
  multicast: null,
  gateway: undefined,
  internet: undefined,
  internetState: 'internet',
  route: 'default',
  carrierDowns: 0,
  ...over,
})

const etherProps = (over: Record<string, unknown> = {}) => ({
  events: [] as EtherEvent[],
  points: [] as EtherPoint[],
  now: AT,
  dropEvery: null,
  ...over,
})

describe('the Ethernet log', () => {
  it('writes a row as its time, glyph, name, words, how long it was down and since its kind', () => {
    const events = [
      wired('connected', AT - 10_000, { downFor: 3 }),
      wired('crc', AT - 20_000),
      wired('link-lost', AT - 13_000),
      wired('connected', AT - 200_000),
    ]
    render(EtherLog, { props: etherProps({ events }) })
    const rows = screen.getAllByTestId('ether-event')
    expect(rows.map(cells)).toEqual([
      [clock(AT - 10_000), '▲', 'CONNECTED', 'connected words', 'down 3s', '+3m'],
      [clock(AT - 20_000), '◆', 'CRC ERRORS', 'crc words', '', ''],
      [clock(AT - 13_000), '▼', 'LINK LOST', 'link-lost words', '', ''],
      [clock(AT - 200_000), '▲', 'CONNECTED', 'connected words', '', ''],
    ])
    expect(rows.map((r) => [r.dataset.kind, r.dataset.tone, r.dataset.hint])).toEqual([
      ['connected', 'ok', 'event-connected'],
      ['crc', 'danger', 'event-crc'],
      ['link-lost', 'danger', 'event-link-lost'],
      ['connected', 'ok', 'event-connected'],
    ])
    expect(rows[0]?.lastElementChild?.getAttribute('data-hint')).toBe('since')
  })

  it('says how long the link was down where it saw it end', () => {
    render(EtherLog, { props: etherProps({ events: [wired('connected', AT, { downFor: 3 })] }) })
    expect(cells(screen.getByTestId('ether-event'))[4]).toBe('down 3s')
  })

  it('counts what it saw while watched, titled unless under a tab', () => {
    render(EtherLog, { props: etherProps({ events: [wired('crc', AT)] }) })
    const header = screen.getByTestId('ether-log').querySelector('header')
    expect(header?.textContent).toContain('LOG')
    expect(header?.textContent).toContain('1 event, while watched')
    expect(header?.querySelector('[data-hint=watched]')).not.toBeNull()
    cleanup()
    const two = [wired('crc', AT), wired('speed', AT - 1)]
    render(EtherLog, { props: etherProps({ events: two, titled: false }) })
    const bare = screen.getByTestId('ether-log').querySelector('header')
    expect(bare?.textContent).not.toContain('LOG')
    expect(bare?.textContent).toContain('2 events, while watched')
  })

  it('names a steady beat of drops', () => {
    render(EtherLog, { props: etherProps({ dropEvery: 120_000 }) })
    expect(screen.getByTestId('ether-drop-beat').textContent).toBe(
      'drops every ~2 min — power saving?',
    )
    cleanup()
    render(EtherLog, { props: etherProps() })
    expect(screen.queryByTestId('ether-drop-beat')).toBeNull()
  })

  it('draws the hour watched, split at a gap, red where the link was down', () => {
    const from = AT - 3_600_000
    const at = (minute: number) => from + minute * 60_000
    const points = [
      second(from - 60_000),
      second(at(6)),
      second(at(6) + 1000, { state: 'no-carrier' }),
      second(at(12)),
      second(at(30)),
      second(at(30) + 1000),
      // A drop inside a second: up both times, the system's count risen.
      second(at(30) + 2000, { carrierDowns: 1 }),
      second(at(45)),
    ]
    // Points a few seconds apart count as watched throughout; more is a gap.
    const watched = [second(at(6)), second(at(6) + 1000), second(at(6) + 5000)]
    render(EtherLog, { props: etherProps({ points: [...points.slice(0, 1), ...watched] }) })
    const one = screen.getByTestId('ether-hour')
    expect(one.dataset.hint).toBe('watched')
    expect([...one.querySelectorAll('.bar i')]).toHaveLength(1)
    cleanup()
    render(EtherLog, { props: etherProps({ points }) })
    const bar = screen.getByTestId('ether-hour')
    const stretches = [...bar.querySelectorAll('.bar i')].map((i) => (i as HTMLElement).style.left)
    expect(stretches).toHaveLength(4)
    expect(stretches[0]).toBe('10%')
    const down = [...bar.querySelectorAll('.bar b')].map((b) =>
      Number.parseFloat((b as HTMLElement).style.left),
    )
    expect(down).toHaveLength(2)
    expect(down[0]).toBeCloseTo(10.03, 1)
    expect(down[1]).toBeCloseTo(50.06, 1)
    expect(bar.textContent?.trim()).toBe('−60 m−45−30−15now')
  })

  it('draws a stretch of one second wide enough to see', () => {
    render(EtherLog, { props: etherProps({ points: [second(AT - 1000)] }) })
    const [stretch] = [...screen.getByTestId('ether-hour').querySelectorAll('.bar i')]
    expect((stretch as HTMLElement).style.width).toBe('0.2%')
  })

  it('says the hour was quiet', () => {
    render(EtherLog, { props: etherProps() })
    expect(screen.getByTestId('ether-log-empty').textContent).toBe(
      'nothing happened in the hour watched',
    )
  })

  it('shows the newest 120 rows', () => {
    const events = Array.from({ length: 125 }, (_, i) => wired('crc', AT - i * 1000))
    render(EtherLog, { props: etherProps({ events }) })
    expect(screen.getAllByTestId('ether-event')).toHaveLength(120)
  })
})
