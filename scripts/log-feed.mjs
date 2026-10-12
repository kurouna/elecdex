#!/usr/bin/env node
/**
 * Writes a made-up log for trying the LOG WATCH pane by hand (docs/logwatch.md §13): lines in a
 * dialect, at a rate, now and then an error with a stack trace, a burst, a pattern not seen
 * before, a line written in two halves, and a rotation.
 *
 *   node scripts/log-feed.mjs [file] [--format=jsonl|logfmt|generic|syslog|clf|plain]
 *     [--rate=20] [--encoding=utf-8|utf-16le|shift_jis] [--rotate=60] [--burst=45]
 *
 * The file defaults to log-feed.log in the system's temp folder. Stop it with Ctrl+C. Nothing
 * here is anyone's: the users, addresses and jobs are invented.
 */
import { appendFileSync, existsSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const args = process.argv.slice(2)
const option = (name, fallback) =>
  args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback
const file = args.find((a) => !a.startsWith('--')) ?? path.join(tmpdir(), 'log-feed.log')
const format = option('format', 'generic')
const rate = Math.max(1, Number(option('rate', '20')))
const encoding = option('encoding', 'utf-8')
const rotateEvery = Number(option('rotate', '0')) * 1000
const burstEvery = Number(option('burst', '45')) * 1000

const pick = (list) => list[Math.floor(Math.random() * list.length)]
const n = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const hex = (k) => Array.from({ length: k }, () => n(0, 15).toString(16)).join('')
const uuid = () => `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}`
const ip = () => `10.${n(0, 9)}.${n(0, 255)}.${n(1, 254)}`
const pad = (v, w = 2) => String(v).padStart(w, '0')

const EVENTS = [
  [30, 'INFO', 'api', () => `GET /users/${n(1, 9999)} 200 ${n(3, 40)}ms`],
  [10, 'INFO', 'api', () => `POST /orders 201 ${n(20, 140)}ms order=${hex(8)}`],
  [15, 'DEBUG', 'cache', () => `hit key="session:${hex(6)}" ttl=${n(10, 600)}s`],
  [8, 'INFO', 'worker', () => `job ${uuid()} done in ${n(80, 900)}ms queue="emails"`],
  [
    5,
    'INFO',
    'auth',
    () => `login ok user="${pick(['aki', 'mika', 'rin', 'sora'])}@example.com" from ${ip()}`,
  ],
  [3, 'WARN', 'db', () => `slow query ${n(500, 2400)}ms table="orders" rows=${n(1000, 90000)}`],
  [2, 'WARN', 'api', () => `rate limit near ${n(80, 99)}% client=${ip()}`],
  [1, 'ERROR', 'worker', () => `job ${uuid()} failed: ECONNRESET upstream="payments"`, true],
]
const RARE = [
  ['ERROR', 'db', () => `deadlock detected on table="stock" tx=${hex(10)}`, true],
  ['WARN', 'auth', () => `token refresh retried ${n(2, 5)} times for user="rin@example.com"`],
  ['INFO', 'api', () => 'config reloaded from /etc/shop/api.yaml'],
]
const STACK = [
  'Error: read ECONNRESET',
  '    at TLSWrap.onStreamRead (node:internal/stream_base_commons:216:20)',
  '    at PaymentClient.charge (/srv/shop/src/payments/client.ts:88:13)',
  '    at async Job.run (/srv/shop/src/worker/job.ts:41:7)',
]
const JAPANESE = ['接続に失敗しました', '再試行しています', '処理が完了しました']
const WEIGHT = EVENTS.reduce((sum, e) => sum + e[0], 0)

let burstUntil = 0
function event() {
  if (Date.now() < burstUntil && Math.random() < 0.6) return EVENTS[EVENTS.length - 1].slice(1)
  if (Math.random() < 0.01) return pick(RARE)
  let r = Math.random() * WEIGHT
  for (const e of EVENTS) {
    r -= e[0]
    if (r < 0) return e.slice(1)
  }
  return EVENTS[0].slice(1)
}

function stamp(t) {
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}.${pad(t.getMilliseconds(), 3)}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function line() {
  const [level, source, make, traced] = event()
  let text = make()
  if (encoding !== 'utf-8' && Math.random() < 0.2) text = `${pick(JAPANESE)} ${text}`
  const t = new Date()
  const trace = traced ? `\n${STACK.join('\n')}` : ''
  switch (format) {
    case 'jsonl':
      return JSON.stringify({
        time: t.toISOString(),
        level: level.toLowerCase(),
        name: source,
        pid: process.pid,
        msg: text,
        ...(traced ? { stack: STACK.join('\n') } : {}),
      })
    case 'logfmt':
      return `time=${t.toISOString()} level=${level.toLowerCase()} logger=${source} msg="${text.replace(/"/g, "'")}"`
    case 'syslog':
      return `${MONTHS[t.getMonth()]} ${String(t.getDate()).padStart(2)} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())} devbox ${source}[${process.pid}]: ${level} ${text}${trace}`
    case 'clf': {
      const status = level === 'ERROR' ? 503 : level === 'WARN' ? 429 : 200
      return `${ip()} - - [${pad(t.getDate())}/${MONTHS[t.getMonth()]}/${t.getFullYear()}:${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())} +0900] "GET /api/${source} HTTP/1.1" ${status} ${n(100, 9000)} "-" "feed/1.0"`
    }
    case 'plain':
      return `${level}: ${text}${trace}`
    default:
      return `${stamp(t)} [${level}] [${source}] ${text}${trace}`
  }
}

function encode(text) {
  if (encoding === 'utf-16le') return Buffer.from(text, 'utf16le')
  if (encoding === 'shift_jis') {
    // Node writes no Shift_JIS: the Japanese phrases are spelled out, the rest is ASCII.
    const SJIS = {
      接続に失敗しました: [
        0x90, 0xda, 0x91, 0xb1, 0x82, 0xc9, 0x8e, 0xb8, 0x94, 0x73, 0x82, 0xb5, 0x82, 0xdc, 0x82,
        0xb5, 0x82, 0xbd,
      ],
      再試行しています: [
        0x8d, 0xc4, 0x8e, 0x8e, 0x8d, 0x73, 0x82, 0xb5, 0x82, 0xc4, 0x82, 0xa2, 0x82, 0xdc, 0x82,
        0xb7,
      ],
      処理が完了しました: [
        0x8f, 0x88, 0x97, 0x9d, 0x82, 0xaa, 0x8a, 0xae, 0x97, 0xb9, 0x82, 0xb5, 0x82, 0xdc, 0x82,
        0xb5, 0x82, 0xbd,
      ],
    }
    const parts = text.split(/(接続に失敗しました|再試行しています|処理が完了しました)/)
    return Buffer.concat(
      parts.map((part) => (SJIS[part] ? Buffer.from(SJIS[part]) : Buffer.from(part, 'latin1'))),
    )
  }
  return Buffer.from(text, 'utf8')
}

if (!existsSync(file)) writeFileSync(file, encoding === 'utf-16le' ? Buffer.from([0xff, 0xfe]) : '')
let lastRotate = Date.now()
let lastBurst = Date.now()
console.log(`writing ${format} at ${rate} lines/s in ${encoding} to ${file} - Ctrl+C to stop`)

setInterval(() => {
  const now = Date.now()
  if (burstEvery > 0 && now - lastBurst > burstEvery) {
    burstUntil = now + 8000
    lastBurst = now
  }
  if (rotateEvery > 0 && now - lastRotate > rotateEvery) {
    rmSync(`${file}.1`, { force: true })
    renameSync(file, `${file}.1`)
    writeFileSync(file, '')
    lastRotate = now
    console.log('rotated')
  }
  const count = Math.max(1, Math.round(rate / 10))
  let text = ''
  for (let i = 0; i < count; i++) text += `${line()}\n`
  // Now and then a line is written in two halves, as a buffered writer may.
  if (Math.random() < 0.05) {
    const cut = Math.floor(text.length / 2)
    appendFileSync(file, encode(text.slice(0, cut)))
    setTimeout(() => appendFileSync(file, encode(text.slice(cut))), 40)
  } else {
    appendFileSync(file, encode(text))
  }
}, 100)
