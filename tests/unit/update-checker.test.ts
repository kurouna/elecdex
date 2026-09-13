import { describe, expect, it } from 'vitest'
import {
  CHECK_INTERVAL_MS,
  FIRST_CHECK_DELAY_MS,
  type ReleaseResponse,
  UpdateChecker,
} from '../../src/main/updates/checker.js'

function harness(response: () => Promise<ReleaseResponse>, currentVersion = '0.1.0') {
  const timers: { fn: () => void; ms: number }[] = []
  const published: string[] = []
  let requests = 0
  const checker = new UpdateChecker({
    currentVersion,
    fetchLatest: () => {
      requests += 1
      return response()
    },
    now: () => 1000,
    setTimer: (fn, ms) => {
      const timer = { fn, ms }
      timers.push(timer)
      return timer
    },
    clearTimer: (handle) => {
      const i = timers.indexOf(handle as (typeof timers)[number])
      if (i >= 0) timers.splice(i, 1)
    },
    publish: (status) => published.push(status.state),
  })
  return { checker, timers, published, requests: () => requests }
}

const release = (tag: string): ReleaseResponse => ({
  status: 200,
  json: { tag_name: tag, html_url: `https://github.com/kurouna/elecdex/releases/tag/${tag}` },
})

describe('UpdateChecker', () => {
  it('checks shortly after being enabled, then daily', async () => {
    const h = harness(async () => release('v0.2.0'))
    h.checker.setEnabled(true)
    expect(h.timers.map((t) => t.ms)).toEqual([FIRST_CHECK_DELAY_MS])
    expect(h.requests()).toBe(0)

    await h.checker.check()
    expect(h.checker.status()).toEqual({
      state: 'available',
      checkedAt: 1000,
      latest: '0.2.0',
      url: 'https://github.com/kurouna/elecdex/releases/tag/v0.2.0',
    })
    expect(h.timers.map((t) => t.ms)).toEqual([CHECK_INTERVAL_MS])
  })

  it('reports the same or an older release as current, and no release yet as current', async () => {
    expect(await harness(async () => release('v0.1.0')).checker.check()).toMatchObject({
      state: 'current',
      latest: '0.1.0',
    })
    expect(await harness(async () => ({ status: 404, json: null })).checker.check()).toMatchObject({
      state: 'current',
      latest: null,
    })
  })

  it('reports failures without throwing', async () => {
    const offline = harness(async () => {
      throw new Error('fetch failed')
    })
    expect(await offline.checker.check()).toMatchObject({ state: 'error', error: 'fetch failed' })
    expect(await harness(async () => ({ status: 403, json: {} })).checker.check()).toMatchObject({
      state: 'error',
    })
  })

  it('stops scheduling when disabled, and shares one request between concurrent checks', async () => {
    const h = harness(async () => release('v0.1.0'))
    h.checker.setEnabled(true)
    h.checker.setEnabled(false)
    expect(h.timers).toHaveLength(0)
    expect(h.checker.status().state).toBe('disabled')

    await Promise.all([h.checker.check(), h.checker.check()])
    expect(h.requests()).toBe(1)
    expect(h.timers).toHaveLength(0)
  })
})
