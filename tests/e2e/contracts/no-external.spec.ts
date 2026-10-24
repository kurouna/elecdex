import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import {
  externalRequests,
  netLogArgs,
  netLogHosts,
  netLogUrls,
  recordExternalRequests,
} from '../support/net-watch.js'
import { launch, quietFor, removeDir, SINGLE_CLOCK } from '../support.js'
import { PANES } from './panes.js'
import { contractPane, footprint, launchContracts, missing, tabOf } from './world.js'

/**
 * Nothing leaves the machine (CLAUDE.md, Tests: "Tests never contact external services, and
 * never touch the machine"; docs/e2e-design.md, section 3.2): with every service pointed at a
 * closed local port (STUB_ENV), no request goes to a host that is not this one - on the default
 * layout from the first request on (Chromium's net log, and main's own requests once watched),
 * and with every built-in pane shown and put to work (support/net-watch.ts). A failure lists what
 * went where.
 */

/**
 * How long the default layout is left to do what it does on its own: the update check runs 15 s
 * after the start (updates/checker.ts), the panes fetch as they are first watched.
 */
const SETTLE_MS = 18_000

test('on the default layout, nothing goes to another host, from the first request on', async () => {
  test.setTimeout(90_000)
  const logDir = mkdtempSync(path.join(tmpdir(), 'elecdex-netlog-'))
  const netLog = path.join(logDir, 'net-log.json')
  const launched = await launch(undefined, { args: netLogArgs(netLog) })
  let seen: string[] = []
  try {
    await recordExternalRequests(launched.app)
    // A window in which nothing may leave is the point: quietFor names it, and fails at the first.
    seen = await quietFor(
      SETTLE_MS,
      () => externalRequests(launched.app),
      'requests to other hosts',
    )
  } finally {
    await launched.close()
  }
  try {
    expect(seen, 'main, once watched').toEqual([])
    const hosts = netLogHosts(netLog)
    if (hosts.length > 0) {
      // What was asked for, in the failure and in the report: the hosts alone do not say why.
      await test
        .info()
        .attach('net-log.json', { body: readFileSync(netLog), contentType: 'application/json' })
    }
    expect(hosts, `Chromium's net log, from the start: ${netLogUrls(netLog).join(' ')}`).toEqual([])
  } finally {
    removeDir(logDir)
  }
})

test('with every built-in pane shown and at work, nothing goes to another host', async () => {
  test.setTimeout(300_000)
  const ctx = await launchContracts()
  try {
    await recordExternalRequests(ctx.app)
    const { page } = ctx
    for (const row of PANES) {
      await tabOf(page, row.widget).click()
      await expect(contractPane(page, row.widget)).toBeVisible()
      if (row.work) await row.work(ctx.app, page, ctx.world)
      if (row.seen !== undefined) {
        // At work, so whatever it asks for has been asked; a pane that never gets there is the
        // lifecycle contract's to report, not this one's.
        await expect
          .poll(async () => missing(row, await footprint(ctx.app, page)), { timeout: 20_000 })
          .toEqual([])
          .catch(() => undefined)
      }
      expect(await externalRequests(ctx.app), `after ${row.widget}`).toEqual([])
    }
    // And a while with the last of them in front, for the requests that come after the first.
    await quietFor(5_000, () => externalRequests(ctx.app), 'requests to other hosts')
    expect(await externalRequests(ctx.app)).toEqual([])
  } finally {
    await ctx.dispose()
  }
})

test('the internet echo of the network panes goes to no host outside the machine', async () => {
  // The collector echoes 1.1.1.1 for net.ping unless ELECDEX_PING_HOST names a loopback address
  // (services/metrics/ping-host.ts), which STUB_ENV does: no echo leaves the machine whenever a
  // network status, globe, throughput or CLUSTER pane is seen in a test.
  const launched = await launch(undefined, {
    layout: { version: 1, root: { kind: 'pane', id: 'n', widget: 'netstat' } },
  })
  try {
    const host = await launched.page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          const off = window.elecdex.metrics.subscribe('net.ping', (sample) => {
            resolve(sample.data.host)
            queueMicrotask(() => off())
          })
        }),
    )
    expect(host).toMatch(/^(127\.\d+\.\d+\.\d+|::1)$/)
  } finally {
    await launched.close()
  }
})

test('the page itself reaches no host: its CSP refuses a fetch before it is made', async () => {
  // A closed port on this machine, not another host: were the CSP ever loosened, the fetch still
  // would not leave the machine (CLAUDE.md, tests never contact external services).
  const { page, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    const refused = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          document.addEventListener(
            'securitypolicyviolation',
            (e) => resolve(e.effectiveDirective),
            {
              once: true,
            },
          )
          fetch('http://127.0.0.1:9/').catch(() => {})
        }),
    )
    expect(refused).toBe('connect-src')
  } finally {
    await close()
  }
})

test('no session checks spelling, so none fetches a dictionary', async () => {
  // On Linux a session's spell checker fetched its Hunspell dictionaries from Google's CDN as the
  // app started (redirector.gvt1.com in the net log on CI, 2026-10-24); Windows and macOS use the
  // system's checker, so this is checked by the switch on every platform.
  const { app, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    const enabled = await app.evaluate(({ session }) => ({
      default: session.defaultSession.isSpellCheckerEnabled(),
      web: session.fromPartition('persist:web').isSpellCheckerEnabled(),
      another: session.fromPartition('e2e-any').isSpellCheckerEnabled(),
    }))
    expect(enabled).toEqual({ default: false, web: false, another: false })
  } finally {
    await close()
  }
})
