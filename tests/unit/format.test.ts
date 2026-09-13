import { describe, expect, it } from 'vitest'
import {
  batteryGauge,
  fillLevel,
  formatBytes,
  formatClock,
  formatMonthDay,
  formatPercent,
  formatRate,
  formatTotal,
  formatUptime,
  formatWeekday,
  osLabel,
  powerLabel,
  toMegabytesPerSecond,
  trimHardware,
  zoneAbbreviation,
} from '../../src/renderer/lib/format.js'

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [-5, '0 B'],
    [Number.NaN, '0 B'],
    [512, '512 B'],
    [2048, '2.0 KiB'],
    [5 * 1024 ** 2, '5.0 MiB'],
    [7.7 * 1024 ** 3, '7.7 GiB'],
  ])('%s -> %s', (input, expected) => {
    expect(formatBytes(input)).toBe(expected)
  })
})

describe('formatTotal', () => {
  it.each([
    [0, '0 B'],
    [999, '999 B'],
    [158_000_000, '158 MB'],
    [1_320_000_000, '1.32 GB'],
    [2_500, '2.50 KB'],
  ])('%s -> %s', (input, expected) => {
    expect(formatTotal(input)).toBe(expected)
  })
})

describe('toMegabytesPerSecond', () => {
  it('converts and never returns negative or NaN', () => {
    expect(toMegabytesPerSecond(2_500_000)).toBe(2.5)
    expect(toMegabytesPerSecond(-1)).toBe(0)
    expect(toMegabytesPerSecond(Number.NaN)).toBe(0)
  })
})

describe('formatUptime', () => {
  it.each([
    [0, '0:00:00'],
    [59, '0:00:00'],
    [60, '0:00:01'],
    [3600 * 9 + 60 * 51 + 86_400, '1:09:51'], // the value in eDEX-UI's screenshot
    [-10, '0:00:00'],
  ])('%s s -> %s', (input, expected) => {
    expect(formatUptime(input)).toBe(expected)
  })
})

describe('formatPercent', () => {
  it.each([
    [0, '0%'],
    [0.44, '0.4%'],
    [9.96, '10%'],
    [55.4, '55%'],
    [Number.NaN, '0%'],
    [-3, '0%'],
  ])('%s -> %s', (input, expected) => {
    expect(formatPercent(input)).toBe(expected)
  })
})

describe('formatClock', () => {
  it('pads a 24-hour time', () => {
    expect(formatClock(new Date(2026, 8, 13, 7, 5, 9))).toEqual({
      hh: '07',
      mm: '05',
      ss: '09',
      suffix: null,
    })
  })

  it.each([
    [0, '12', 'AM'],
    [11, '11', 'AM'],
    [12, '12', 'PM'],
    [20, '08', 'PM'],
  ])('12-hour: %i h -> %s %s', (hour, hh, suffix) => {
    const r = formatClock(new Date(2026, 0, 1, hour, 0, 0), true)
    expect([r.hh, r.suffix]).toEqual([hh, suffix])
  })
})

describe('formatMonthDay', () => {
  it('matches the original cell', () => {
    expect(formatMonthDay(new Date(2019, 3, 29))).toBe('APR 29')
  })
})

describe('osLabel', () => {
  it.each([
    ['win32', 'win'],
    ['Windows', 'win'],
    ['darwin', 'macOS'],
    ['linux', 'linux'],
    ['', '--'],
  ])('%s -> %s', (input, expected) => {
    expect(osLabel(input)).toBe(expected)
  })
})

describe('batteryGauge', () => {
  const base = { hasBattery: true, percent: 84.6, isCharging: false }
  it('is green from 20% up and red below', () => {
    expect(batteryGauge(base)).toEqual({ percent: 85, low: false, charging: false })
    expect(batteryGauge({ ...base, percent: 20 })?.low).toBe(false)
    expect(batteryGauge({ ...base, percent: 19.4 })?.low).toBe(true)
  })
  it('shows the charge while charging too', () =>
    expect(batteryGauge({ ...base, isCharging: true })).toEqual({
      percent: 85,
      low: false,
      charging: true,
    }))
  it('has nothing to show without a battery or a reading', () => {
    expect(batteryGauge({ ...base, hasBattery: false })).toBeNull()
    expect(batteryGauge({ ...base, percent: null })).toBeNull()
  })
})

describe('powerLabel', () => {
  const base = { hasBattery: true, percent: 84.6, isCharging: false, acConnected: false }
  it('shows the percentage on battery', () => expect(powerLabel(base)).toBe('85%'))
  it('shows CHARGE while charging', () =>
    expect(powerLabel({ ...base, isCharging: true })).toBe('CHARGE'))
  it('shows WIRED with no battery on mains', () =>
    expect(powerLabel({ ...base, hasBattery: false, acConnected: true })).toBe('WIRED'))
  it('does not invent a value', () => expect(powerLabel({ ...base, percent: null })).toBe('--'))
})

describe('trimHardware', () => {
  it('keeps the first words and drops repeated context', () => {
    expect(trimHardware('HP EliteBook 630 13.3 inch G10', 2, 'HP')).toBe('EliteBook 630')
  })
  it('falls back to -- for nothing left', () => {
    expect(trimHardware('   ', 2)).toBe('--')
    expect(trimHardware('Notebook', 2, 'notebook')).toBe('--')
  })
})

describe('disk readouts', () => {
  it('formats rates and terabytes', () => {
    expect(formatRate(0)).toBe('0 B/s')
    expect(formatRate(5 * 1024 * 1024)).toBe('5.0 MiB/s')
    expect(formatBytes(2 * 1024 ** 4)).toBe('2.0 TiB')
  })
  it('warns as a volume fills', () => {
    expect(fillLevel(0.5)).toBe('ok')
    expect(fillLevel(0.9)).toBe('warn')
    expect(fillLevel(0.975)).toBe('full')
  })
})

describe('clock and date labels', () => {
  it('names the weekday', () => {
    expect(formatWeekday(new Date(2026, 8, 13))).toBe('SUN')
    expect(formatWeekday(new Date(2026, 8, 18))).toBe('FRI')
  })

  it('abbreviates time zones, falling back to the offset', () => {
    const summer = new Date(Date.UTC(2026, 6, 1, 12))
    const winter = new Date(Date.UTC(2026, 0, 15, 12))
    expect(zoneAbbreviation('UTC', summer)).toBe('UTC')
    expect(zoneAbbreviation('America/New_York', summer)).toBe('EDT')
    expect(zoneAbbreviation('America/New_York', winter)).toBe('EST')
    expect(zoneAbbreviation('Asia/Seoul', summer)).toBe('KST')
    expect(zoneAbbreviation('Asia/Kathmandu', summer)).toBe('UTC+5:45')
    expect(zoneAbbreviation('Not/AZone', summer)).toBe('')
  })
})
