import { CODEC_OPS } from '@shared/codec'
import {
  AWAKE_DURATIONS,
  AWAKE_EXTEND_MS,
  AWAKE_MAX_MS,
  type AwakeHold,
  awakeLine,
  blockerKind,
  clockAt,
  extendHold,
  holdExpired,
  holdFor,
  holdFraction,
  isAwakeRequest,
  isSealed,
  isUtilityCopy,
  RELEASED,
  readUtilityPane,
  restoreHold,
  SEALED_PREFIX,
  tMinus,
  UTILITY_LIMITS,
  UTILITY_MODULES,
} from '@shared/utility'
import { describe, expect, it } from 'vitest'

const NOW = new Date(2026, 8, 27, 14, 0, 0).getTime()
const MIN = 60_000

describe('the pane state', () => {
  it('reads an empty pane as AWAKE with the defaults', () => {
    expect(readUtilityPane(undefined)).toEqual({
      module: 'awake',
      awakeFor: null,
      qrKind: 'text',
      qrText: '',
      qrUrl: '',
      qrEcc: 'M',
      wifiSsid: '',
      wifiAuth: 'WPA',
      wifiHidden: false,
      wifiSealed: null,
      codecOp: 'b64',
    })
  })

  it('keeps what is in shape and drops what is not', () => {
    const pane = readUtilityPane({
      module: 'codec',
      awakeFor: 60 * MIN,
      qrKind: 'wifi',
      qrEcc: 'H',
      wifiAuth: 'nopass',
      wifiHidden: true,
      wifiSealed: `${SEALED_PREFIX}c3R1YjpzZWNyZXQ=`,
      codecOp: 'sha256',
    })
    expect(pane).toMatchObject({
      module: 'codec',
      awakeFor: 60 * MIN,
      qrKind: 'wifi',
      qrEcc: 'H',
      wifiAuth: 'nopass',
      wifiHidden: true,
      wifiSealed: `${SEALED_PREFIX}c3R1YjpzZWNyZXQ=`,
      codecOp: 'sha256',
    })
    const odd = readUtilityPane({
      module: 'docker',
      awakeFor: 7 * MIN,
      qrKind: 'vcard',
      qrEcc: 'X',
      wifiAuth: 'WPA3',
      wifiHidden: 'yes',
      wifiSealed: 'my password',
      codecOp: 'rot13',
      qrText: 42,
    })
    expect(odd).toEqual(readUtilityPane({}))
  })

  it('cuts what is too long rather than keeping it', () => {
    const pane = readUtilityPane({ qrText: 'x'.repeat(10_000), wifiSsid: 'n'.repeat(100) })
    expect(pane.qrText).toHaveLength(UTILITY_LIMITS.qrText)
    expect(pane.wifiSsid).toHaveLength(UTILITY_LIMITS.ssid)
  })

  it('knows every CODEC operation and every module', () => {
    for (const op of CODEC_OPS) expect(readUtilityPane({ codecOp: op.id }).codecOp).toBe(op.id)
    for (const module of UTILITY_MODULES) expect(readUtilityPane({ module }).module).toBe(module)
  })
})

describe('a sealed secret', () => {
  it('is the prefix and base64, within bounds', () => {
    expect(isSealed(`${SEALED_PREFIX}AAAA`)).toBe(true)
    expect(isSealed(`${SEALED_PREFIX}AA==`)).toBe(true)
    expect(isSealed('AAAA')).toBe(false)
    expect(isSealed(`${SEALED_PREFIX}not base64!`)).toBe(false)
    expect(isSealed(`${SEALED_PREFIX}`)).toBe(false)
    expect(isSealed(`${SEALED_PREFIX}${'A'.repeat(UTILITY_LIMITS.sealed)}`)).toBe(false)
    expect(isSealed(42)).toBe(false)
  })
})

describe('AWAKE requests', () => {
  it('take only the levels and lengths offered', () => {
    expect(isAwakeRequest({ level: 'off' })).toBe(true)
    for (const forMs of AWAKE_DURATIONS) {
      expect(isAwakeRequest({ level: 'system', forMs })).toBe(true)
      expect(isAwakeRequest({ level: 'display', forMs })).toBe(true)
    }
    expect(isAwakeRequest({ level: 'system', forMs: 5 * MIN })).toBe(false)
    expect(isAwakeRequest({ level: 'system' })).toBe(false)
    expect(isAwakeRequest({ level: 'screen', forMs: null })).toBe(false)
    expect(isAwakeRequest(null)).toBe(false)
    expect(isAwakeRequest('off')).toBe(false)
  })

  it('make a hold from now', () => {
    expect(holdFor({ level: 'off' }, NOW)).toEqual(RELEASED)
    expect(holdFor({ level: 'system', forMs: null }, NOW)).toEqual({
      level: 'system',
      until: null,
      since: NOW,
    })
    expect(holdFor({ level: 'display', forMs: 30 * MIN }, NOW)).toEqual({
      level: 'display',
      until: NOW + 30 * MIN,
      since: NOW,
    })
  })
})

describe('extending a hold', () => {
  const timed: AwakeHold = { level: 'system', until: NOW + 10 * MIN, since: NOW - 20 * MIN }

  it('adds to its end, keeping where the arc began', () => {
    expect(extendHold(timed, AWAKE_EXTEND_MS, NOW)).toEqual({
      ...timed,
      until: NOW + 40 * MIN,
    })
  })

  it('adds to now when the end has already passed', () => {
    const late = { ...timed, until: NOW - MIN }
    expect(extendHold(late, AWAKE_EXTEND_MS, NOW).until).toBe(NOW + 30 * MIN)
  })

  it('never goes further than a day from now', () => {
    let hold = timed
    for (let i = 0; i < 100; i += 1) hold = extendHold(hold, AWAKE_EXTEND_MS, NOW)
    expect(hold.until).toBe(NOW + AWAKE_MAX_MS)
  })

  it('leaves a hold with no end, and none, as they were', () => {
    const endless: AwakeHold = { level: 'display', until: null, since: NOW }
    expect(extendHold(endless, AWAKE_EXTEND_MS, NOW)).toBe(endless)
    expect(extendHold(RELEASED, AWAKE_EXTEND_MS, NOW)).toBe(RELEASED)
  })
})

describe('the end of a hold', () => {
  it('comes at its until, never for one with no end', () => {
    const timed: AwakeHold = { level: 'system', until: NOW, since: NOW - MIN }
    expect(holdExpired(timed, NOW - 1)).toBe(false)
    expect(holdExpired(timed, NOW)).toBe(true)
    expect(holdExpired({ level: 'system', until: null, since: NOW }, NOW + 1e12)).toBe(false)
    expect(holdExpired(RELEASED, NOW)).toBe(false)
  })
})

describe('restoring the saved hold', () => {
  it('takes up one with no end, and one still running', () => {
    const endless: AwakeHold = { level: 'display', until: null, since: NOW - 3_600_000 }
    expect(restoreHold(endless, NOW)).toEqual(endless)
    const running: AwakeHold = { level: 'system', until: NOW + MIN, since: NOW - MIN }
    expect(restoreHold(running, NOW)).toEqual(running)
  })

  it('lets go of one that ended while elecdex was not running', () => {
    expect(restoreHold({ level: 'system', until: NOW - 1, since: NOW - MIN }, NOW)).toEqual(
      RELEASED,
    )
    expect(restoreHold({ level: 'system', until: NOW, since: NOW - MIN }, NOW)).toEqual(RELEASED)
  })

  it('lets go of one that does not hang together', () => {
    const far = { level: 'system' as const, until: NOW + AWAKE_MAX_MS + 1, since: NOW }
    expect(restoreHold(far, NOW)).toEqual(RELEASED)
    expect(restoreHold({ level: 'system', until: Number.NaN, since: NOW }, NOW)).toEqual(RELEASED)
  })

  it('puts a start in the future, or a missing one, at now', () => {
    expect(restoreHold({ level: 'system', until: null, since: NOW + MIN }, NOW).since).toBe(NOW)
    expect(restoreHold({ level: 'system', until: null, since: null }, NOW).since).toBe(NOW)
  })

  it('reads off as off', () => {
    expect(restoreHold({ level: 'off', until: NOW + MIN, since: NOW }, NOW)).toEqual(RELEASED)
  })
})

describe('what the system is asked for', () => {
  it('is none, the app kept from suspension, or the display kept on', () => {
    expect(blockerKind('off')).toBeNull()
    expect(blockerKind('system')).toBe('prevent-app-suspension')
    expect(blockerKind('display')).toBe('prevent-display-sleep')
  })
})

describe('the ring', () => {
  it('is the share still to run of a timed hold', () => {
    const hold: AwakeHold = { level: 'system', until: NOW + 30 * MIN, since: NOW - 30 * MIN }
    expect(holdFraction(hold, NOW)).toBeCloseTo(0.5)
    expect(holdFraction(hold, NOW + 60 * MIN)).toBe(0)
    expect(holdFraction(hold, NOW - 60 * MIN)).toBe(1)
  })

  it('is whole with no end, and empty when off', () => {
    expect(holdFraction({ level: 'display', until: null, since: NOW }, NOW)).toBe(1)
    expect(holdFraction(RELEASED, NOW)).toBe(0)
  })
})

describe('the words for a hold', () => {
  it('count down as the tasks do', () => {
    expect(tMinus(0)).toBe('00:00:00')
    expect(tMinus(1)).toBe('00:00:01')
    expect(tMinus((1 * 3600 + 24 * 60 + 8) * 1000)).toBe('01:24:08')
    expect(tMinus((26 * 3600 + 5 * 60) * 1000)).toBe('1d 02:05')
    expect(tMinus(-5000)).toBe('00:00:00')
  })

  it('name the level and the end, with the weekday when it is not today', () => {
    expect(awakeLine(RELEASED, NOW)).toBeNull()
    expect(awakeLine({ level: 'display', until: null, since: NOW }, NOW)).toBe('display · ∞')
    expect(awakeLine({ level: 'system', until: NOW + 102 * MIN, since: NOW }, NOW)).toBe(
      'system · until 15:42',
    )
    const tomorrow = new Date(2026, 8, 28, 9, 5).getTime()
    expect(clockAt(tomorrow, NOW)).toBe('mon 09:05')
  })
})

describe('a copy asked for', () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])

  it('is text within bounds, or a PNG by its signature', () => {
    expect(isUtilityCopy({ kind: 'text', text: 'hello' })).toBe(true)
    expect(isUtilityCopy({ kind: 'text', text: 'x'.repeat(1_000_001) })).toBe(false)
    expect(isUtilityCopy({ kind: 'png', data: png })).toBe(true)
    expect(isUtilityCopy({ kind: 'png', data: Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]) })).toBe(
      false,
    )
    expect(isUtilityCopy({ kind: 'png', data: [...png] })).toBe(false)
    expect(isUtilityCopy({ kind: 'html', text: '<b>' })).toBe(false)
    expect(isUtilityCopy(null)).toBe(false)
  })
})
