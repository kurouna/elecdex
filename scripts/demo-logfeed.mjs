/**
 * The made-up log the takes show in a LOG WATCH pane (demo:logwatch, the tours): a shop API's,
 * written from a fixed seed into the demo home, so every take shows the same lines. Nobody's:
 * the users, addresses, keys and jobs are invented.
 *
 * `LOG_ID` is the pane's id for it, put in the profile's log-files.json by `logFiles` (as
 * gitRepos does for the repository), so a layout's LOG WATCH pane opens on it at once.
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { HOME } from './demo-fixtures.mjs'

export const LOG = path.join(HOME, 'logs', 'shop-api.log')
export const LOG_ID = '5e0b1a6d2c4f8e90'

/** The catalog main reads (main/logwatch/catalog.ts): the made-up log under its id. */
export function logFiles(profile) {
  writeFileSync(
    path.join(profile, 'log-files.json'),
    JSON.stringify({
      version: 1,
      files: [{ id: LOG_ID, path: LOG, pattern: null, format: null, lastUsed: Date.now() }],
    }),
  )
}

/** A fixed seed: the same lines, in the same order, every take. */
let seed = 20261013
function random() {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (list) => list[Math.floor(random() * list.length)]
const n = (a, b) => a + Math.floor(random() * (b - a + 1))
const hex = (k) => Array.from({ length: k }, () => n(0, 15).toString(16)).join('')
const ip = () => `10.4.${n(0, 255)}.${n(1, 254)}`
const pad = (v, w = 2) => String(v).padStart(w, '0')
const USERS = ['aki', 'mika', 'rin', 'sora', 'kai']

/** What the shop's API writes, by weight: the everyday lines. */
const EVENTS = [
  [34, 'INFO', 'api', () => `GET /products/${n(100, 999)} 200 ${n(3, 40)}ms`],
  [12, 'INFO', 'api', () => `POST /orders 201 ${n(20, 140)}ms order=${hex(8)}`],
  [16, 'DEBUG', 'cache', () => `hit key="session:${hex(6)}" ttl=${n(10, 600)}s`],
  [10, 'INFO', 'worker', () => `job mail-${hex(8)} done in ${n(80, 900)}ms queue="emails"`],
  [6, 'INFO', 'auth', () => `login ok user="${pick(USERS)}@example.com" from ${ip()}`],
  [3, 'WARN', 'db', () => `slow query ${n(500, 2400)}ms table="orders" rows=${n(1000, 90000)}`],
  [2, 'WARN', 'api', () => `rate limit near ${n(80, 99)}% client=${ip()}`],
  [1, 'INFO', 'api', () => `token issued api_key=sk_live_${hex(24)} for partner="acme"`],
]
const WEIGHT = EVENTS.reduce((sum, e) => sum + e[0], 0)

/** A failed charge, with its stack trace. */
export const PAYMENT_FAILED = () => ({
  level: 'ERROR',
  source: 'worker',
  text: `charge ${hex(8)} failed: ECONNRESET upstream="payments"`,
  trace: [
    'Error: read ECONNRESET',
    '    at TLSWrap.onStreamRead (node:internal/stream_base_commons:216:20)',
    '    at PaymentClient.charge (/srv/shop/src/payments/client.ts:88:13)',
    '    at async Job.run (/srv/shop/src/worker/job.ts:41:7)',
  ],
})

/** A kind of line the log has not had before. */
export const DEADLOCK = () => ({
  level: 'ERROR',
  source: 'db',
  text: `deadlock detected on table="stock" tx=${hex(10)}`,
  trace: [],
})

/** The health check, the same line again and again (folded into ×n). */
export const HEALTH = () => ({
  level: 'INFO',
  source: 'api',
  text: 'GET /health 200 1ms',
  trace: [],
})

export function everyday() {
  let r = random() * WEIGHT
  for (const [weight, level, source, make] of EVENTS) {
    r -= weight
    if (r < 0) return { level, source, text: make(), trace: [] }
  }
  return HEALTH()
}

function stamp(t) {
  const d = new Date(t)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

const written = (entry, at) =>
  `${stamp(at)} [${entry.level}] [${entry.source}] ${entry.text}\n${entry.trace.map((l) => `${l}\n`).join('')}`

/** The five minutes before now: about two lines a second, an error now and then. */
export function history() {
  const now = Date.now()
  let text = ''
  for (let at = now - 300_000; at < now - 2000; at += n(250, 700)) {
    text += written(random() < 0.006 ? PAYMENT_FAILED() : everyday(), at)
  }
  mkdirSync(path.dirname(LOG), { recursive: true })
  writeFileSync(LOG, text)
}

/**
 * The live end: a line every 150 ms or so, and what a take asks for on top - lines queued
 * (`queue`), or errors coming fast for a while (`burst`).
 */
export const live = {
  timer: null,
  burstUntil: 0,
  queue: [],
  start() {
    const step = () => {
      const now = Date.now()
      const next =
        this.queue.shift() ??
        (now < this.burstUntil && random() < 0.55 ? PAYMENT_FAILED() : everyday())
      appendFileSync(LOG, written(next, now))
      this.timer = setTimeout(step, n(110, 220))
    }
    step()
  },
  /** Errors coming fast for `ms`: enough to light ERROR BURST after a few seconds. */
  burst(ms) {
    this.burstUntil = Date.now() + ms
  },
  stop() {
    clearTimeout(this.timer)
  },
}
