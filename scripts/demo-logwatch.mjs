/**
 * The LOG WATCH pane at work, for a short landscape video (X, YouTube): a log file followed as
 * it grows, with English captions at the bottom.
 *
 * The take:
 *   OPEN     SELECT LOG FILE: the last lines of a made-up shop API's log, its dialect told,
 *            five minutes of lines by level along the top
 *   FOLLOW   lines arriving: levels in colour, repeats folded into ×n, a kind of line never seen
 *            before marked NEW
 *   BURST    errors coming fast light ERROR BURST and are marked down the right; one's stack
 *            trace unfolds under it
 *   FILTER   /ECONNRESET|deadlock/, then cleared
 *   PATTERNS every kind of line counted; the noisiest muted
 *   MASK     addresses, e-mail and keys hidden at a press
 *   EXPLAIN  two lines chosen (a click, Ctrl+click): the preview is exactly what goes - those
 *            lines, nothing around them, no file name - SEND, and the answer arrives
 *
 * Everything shown is made up: the log is written here, line by line, from a fixed seed (the
 * same take every time) into the demo home; the picker is answered in main with that file; the
 * AI is the stand-in of the other takes (no model, no key). The window is 1280x720 at a zoom of
 * 1, a 16:9 frame; record the window. The take starts after the lead (`--lead`, 6 s) and ends by
 * itself; pass `--exit` to close the window then. Windows only, like the other takes. Run
 * `npm run build` first, then `npm run demo:logwatch`. The options are demo-take.mjs's
 * (`takeOptions`): `--pace`, `--theme`, `--shots=<dir>`, `--no-captions`.
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { startCouncil } from './demo-beats.mjs'
import { HOME } from './demo-fixtures.mjs'
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1280, height: 720, zoom: 1, lead: 6 })
const exit = process.argv.includes('--exit')

/* ---- The made-up log ---- */

const LOG = path.join(HOME, 'logs', 'shop-api.log')

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
  [10, 'INFO', 'worker', () => `job mail-${hex(6)} done in ${n(80, 900)}ms queue="emails"`],
  [6, 'INFO', 'auth', () => `login ok user="${pick(USERS)}@example.com" from ${ip()}`],
  [3, 'WARN', 'db', () => `slow query ${n(500, 2400)}ms table="orders" rows=${n(1000, 90000)}`],
  [2, 'WARN', 'api', () => `rate limit near ${n(80, 99)}% client=${ip()}`],
  [1, 'INFO', 'api', () => `token issued api_key=sk_live_${hex(24)} for partner="acme"`],
]
const WEIGHT = EVENTS.reduce((sum, e) => sum + e[0], 0)
const PAYMENT_FAILED = () => ({
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
const DEADLOCK = () => ({
  level: 'ERROR',
  source: 'db',
  text: `deadlock detected on table="stock" tx=${hex(10)}`,
  trace: [],
})

function everyday() {
  let r = random() * WEIGHT
  for (const [weight, level, source, make] of EVENTS) {
    r -= weight
    if (r < 0) return { level, source, text: make(), trace: [] }
  }
  return { level: 'INFO', source: 'api', text: 'GET /health 200 1ms', trace: [] }
}

function stamp(t) {
  const d = new Date(t)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

const written = (entry, at) =>
  `${stamp(at)} [${entry.level}] [${entry.source}] ${entry.text}\n${entry.trace.map((l) => `${l}\n`).join('')}`

/** Five minutes before the take: about two lines a second, an error now and then. */
function history() {
  const now = Date.now()
  let text = ''
  for (let at = now - 300_000; at < now - 2000; at += n(250, 700)) {
    text += written(random() < 0.006 ? PAYMENT_FAILED() : everyday(), at)
  }
  mkdirSync(path.dirname(LOG), { recursive: true })
  writeFileSync(LOG, text)
}

/**
 * The live end: a line every 150 ms or so, and what the take asks for on top - a run of the
 * health check repeated (folded ×n), a kind of line not seen before, a burst of errors.
 */
const live = {
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
  stop() {
    clearTimeout(this.timer)
  },
}

/* ---- The window ---- */

const council = await startCouncil({
  chat: [
    '**Two separate problems, one likely cause.**',
    '',
    '1. `ECONNRESET` from **payments**: the payment service closed the connection mid-request. Bursts like this usually mean it restarted, or its load balancer dropped idle sockets.',
    '2. The **deadlock on `stock`**: two transactions lock rows in a different order - likely charge retries overlapping with stock updates.',
    '',
    '**Check** the payment service’s restarts at that time; retry with backoff, and lock `stock` rows in one order (by id) in both paths.',
  ].join('\n'),
})
const tree = { version: 1, root: { kind: 'pane', id: 'p-log', widget: 'logwatch' } }
const { standIn } = await prepareData()
const { app, page, wait, settled, run, caption } = await openTake({
  items: [{ id: 'logwatch', name: 'logwatch', tree }],
  options,
  standIn,
  settings: council.settings,
})

/** Presses a button the way a hand does: held for a moment (CLAUDE.md, test craft). */
const press = (locator) => locator.click({ delay: 20 })
const rows = () => page.getByTestId('logwatch-row')
/** The pointer out of the way: over the window's top, where it opens no card (the bottom edge brings up the status bar). */
const away = () => page.mouse.move(640, 16)

async function open() {
  say('open')
  await caption('LOG WATCH follows a log file as it grows')
  await app.evaluate(({ dialog }, file) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] })
  }, LOG)
  // Written now, up to the moment the file is chosen: the lanes run without a gap to now.
  history()
  await wait(1400)
  await press(page.getByTestId('logwatch-select'))
  await page.getByTestId('logwatch-lamp').filter({ hasText: 'LIVE' }).waitFor({ timeout: 15_000 })
  live.start()
  await wait(3200)
}

async function follow() {
  say('follow')
  await caption('Levels in colour, repeats folded into ×n, a new kind of line marked NEW')
  for (let i = 0; i < 6; i++)
    live.queue.push({ level: 'INFO', source: 'api', text: 'GET /health 200 1ms', trace: [] })
  await wait(2200)
  live.queue.push(DEADLOCK())
  await page
    .getByTestId('logwatch-new')
    .last()
    .waitFor({ timeout: 5000 })
    .catch(() => {})
  await wait(3200)
}

async function burst() {
  say('burst')
  await caption('Errors coming fast light ERROR BURST, marked down the right')
  live.burstUntil = Date.now() + 7000
  await page
    .getByTestId('logwatch-lamp')
    .filter({ hasText: 'ERROR BURST' })
    .waitFor({ timeout: 12_000 })
    .catch(() => {})
  await wait(2600)
  await caption('Stack traces fold under their line')
  await press(page.getByTestId('logwatch-pause'))
  await wait(500)
  const more = await middle(page.getByTestId('logwatch-more'))
  await more.hover()
  await wait(500)
  await press(more)
  await wait(2600)
  await press(page.getByTestId('logwatch-pause'))
  await away()
  await wait(800)
}

/**
 * Of the buttons, the lowest in the upper two thirds of the pane: one at the bottom unfolds out
 * of sight, under the caption.
 */
async function middle(buttons) {
  const count = await buttons.count()
  for (let i = count - 1; i >= 0; i--) {
    const box = await buttons.nth(i).boundingBox()
    if (box !== null && box.y < options.height * 0.62) return buttons.nth(i)
  }
  return buttons.last()
}

async function filter() {
  say('filter')
  await caption('Filter by text or /regex/')
  const field = page.getByTestId('logwatch-filter')
  await field.click()
  await page.keyboard.type('/ECONNRESET|deadlock/', { delay: 55 })
  await wait(2800)
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Backspace')
  await wait(900)
}

async function patterns() {
  say('patterns')
  await caption('PATTERNS counts every kind of line - mute the noise')
  await press(page.getByTestId('logwatch-tab-patterns'))
  await wait(2000)
  // The everyday product page reads, the most of all: muted, what matters stands out.
  const noisy = page.getByTestId('logwatch-pattern').filter({ hasText: 'GET /products' }).first()
  await noisy.hover()
  await wait(600)
  await press(noisy.getByTestId('logwatch-mute'))
  await wait(1300)
  await press(page.getByTestId('logwatch-tab-stream'))
  await away()
  await wait(1800)
}

async function mask() {
  say('mask')
  await caption('MASK hides addresses, e-mail and keys')
  await press(page.getByTestId('logwatch-mask'))
  await wait(3000)
}

async function explain() {
  say('explain')
  await caption('Choose lines - only those go to the AI')
  // Two lines worth asking about, then the stream held still while they are chosen: the rows
  // would move on under the pointer.
  live.queue.push(DEADLOCK(), everyday(), everyday(), PAYMENT_FAILED(), everyday())
  await wait(1600)
  await press(page.getByTestId('logwatch-pause'))
  await wait(600)
  await press(rows().filter({ hasText: 'deadlock' }).last())
  await wait(900)
  await rows()
    .filter({ hasText: 'ECONNRESET' })
    .last()
    .click({ delay: 20, modifiers: ['Control'] })
  await wait(1400)
  await press(page.getByTestId('logwatch-explain-open'))
  await away()
  await caption('EXPLAIN shows exactly what will be sent, and sends it on SEND')
  await page
    .getByTestId('logwatch-explain-preview')
    .waitFor({ timeout: 5000 })
    .catch(() => {})
  await wait(3200)
  await press(page.getByTestId('logwatch-explain-send'))
  await away()
  await caption(null)
  await page
    .getByTestId('logwatch-explain-answer')
    .filter({ hasText: 'one order' })
    .waitFor({ timeout: 30_000 })
    .catch(() => {})
  await wait(4200)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await away()
  await open()
  await follow()
  await burst()
  await filter()
  await patterns()
  await mask()
  await explain()
  await caption('elecdex · LOG WATCH')
  await wait(2500)
  live.stop()
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) {
    council.close()
    await app.close().catch(() => {})
  }
})
live.stop()
council.close()
