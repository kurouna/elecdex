/**
 * The RSS pane at work, for a landscape video (X, the release notes), in the eDEX-like standard
 * preset: the shells' tab group in the middle is swapped for one RSS pane, so the system column,
 * the launcher and file browser below and the globe, markets, weather and calendar beside it
 * frame it as the shell does.
 *
 *   add        the pane's first look (ADD and the starter packs); a site pasted, its feeds found
 *              from its page, one added, then three more through the settings' ADD
 *   list       the four made-up feeds' headlines, each with its mark in its own hue
 *   article    a click opens the article: picture, summary, author; ↓ steps to the next
 *   translate  TRANSLATE hands the article to the TRANSLATE pane, which pops up and translates it
 *              with PLaMo 3 Translate on this PC
 *   card       CARD: the same headlines with their pictures
 *   chips      one feed's chip, then ALL; the find box lighting what it finds
 *   ticker     TICKER: one headline at a time, stepping on its own
 *   read       UNREAD and MARK ALL READ
 *
 * The feeds, the site and the pictures are made up, served by this script on 127.0.0.1 (the
 * pictures drawn here as PNGs); nothing reaches a real site, and the starter packs, real
 * publishers' feeds, are shown and never pressed. The translation is real (user's choice
 * 2026-11-15): the engine and the 2B model this PC's elecdex has set up (%APPDATA%\elecdex\
 * translate) are put in the take's own profile - the model as a hard link where the disk allows -
 * with only that model's consent; nothing is fetched. The rest is the other takes' stand-ins
 * (demo-take.mjs).
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:rss`.
 * The window is 1600x900, a 16:9 frame; record the window. The take starts after the lead
 * (`--lead`, 8 s) and ends by itself, its length depending on how fast the model translates;
 * pass `--exit` to close the window when it is over. The options are demo-take.mjs's
 * (`takeOptions`): `--pace`, `--theme`, `--shots=<dir>`, `--no-captions`.
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { deflateSync } from 'node:zlib'
import { beats } from './demo-beats.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8 })
const exit = process.argv.includes('--exit')

/* ---- Pictures, drawn here: a gradient plate with a few lines, in a hue per story ---- */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (bytes) => {
  let c = 0xffffffff
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}
const hsl = (h, s, l) => {
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return [f(0), f(8), f(4)]
}

/** A 480x270 PNG: a dark plate lit from one side in `hue`, scan lines, a wave and a ring. */
function picture(hue, seed) {
  const width = 480
  const height = 270
  const raw = Buffer.alloc((width * 3 + 1) * height)
  const gx = 0.25 + (seed % 5) * 0.12
  const gy = 0.3 + (seed % 3) * 0.15
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0
    for (let x = 0; x < width; x++) {
      const dx = x / width - gx
      const dy = y / height - gy
      const glow = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 1.6)
      const wave = Math.abs(y - height * (0.62 + 0.12 * Math.sin(x / 38 + seed))) < 1.4 ? 0.35 : 0
      const r = Math.hypot(x - width * 0.7, y - height * 0.4)
      const ring = Math.abs(r - 46 - (seed % 4) * 6) < 1.2 ? 0.3 : 0
      const scan = y % 3 === 0 ? 0.82 : 1
      const [cr, cg, cb] = hsl(hue, 0.4, Math.min(0.62, 0.05 + glow * 0.26 + wave + ring))
      const at = y * (width * 3 + 1) + 1 + x * 3
      raw[at] = cr * scan
      raw[at + 1] = cg * scan
      raw[at + 2] = cb * scan
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, 2, 0, 0, 0], 8)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---- The made-up feeds and the site ---- */

const FEEDS = {
  '/wire.xml': {
    title: 'Demo Wire',
    hue: 190,
    stories: [
      ['Open-source terminals see a renaissance of retro interfaces', 0.4, 'culture'],
      ['Weather services agree on a common alert format', 3.2, 'science'],
      ['Regional grid operators publish outages in one open format', 7.5, 'energy'],
      ['City libraries extend night hours for exam season', 26, 'city'],
    ],
  },
  '/kernel.xml': {
    title: 'Kernel Notes',
    hue: 330,
    stories: [
      ['Why a 10 fps frame loop is enough for a dashboard that never sleeps', 1.1, 'performance'],
      ['CRT shaders: how to fake a tube on a flat panel', 4.6, 'graphics'],
      ['Reading a feed in Shift_JIS without guessing', 9.4, 'encoding'],
      ['A WebGL context budget, and what happens when you run out', 30, 'gpu'],
    ],
  },
  '/orbit.xml': {
    title: 'Orbit Weekly',
    hue: 45,
    stories: [
      ['Satellite operators share a conjunction data feed', 2.1, 'space'],
      ['Starlink shells, mapped by inclination', 6.3, 'space'],
      ['ISS reboost window moves to Thursday', 28, 'space'],
    ],
  },
  '/digest.xml': {
    title: 'Dev Digest',
    hue: 120,
    stories: [
      ['Svelte runes in a year of production: what held up', 0.8, 'frontend'],
      ['Local translation models now fit on a laptop', 5.4, 'ai'],
      ['Your status line belongs on a wall-clock grid', 12, 'ux'],
    ],
  },
  '/retro.xml': {
    title: 'Retro Terminals',
    hue: 270,
    stories: [
      ['Phosphor colours, measured: green, amber and white', 1.7, 'hardware'],
      ['A 1989 amber monitor, restored', 8.2, 'hardware'],
    ],
  },
}

const now = Date.now()
const pictures = new Map()

function feedXml(path, origin) {
  const feed = FEEDS[path]
  const items = feed.stories
    .map(([title, hours, category], i) => {
      const at = new Date(now - hours * 3_600_000).toUTCString()
      const picturePath = `/pic${path.replace('.xml', '')}-${i}.png`
      pictures.set(picturePath, () => picture(feed.hue + i * 12, i + title.length))
      const summary = `A made-up story for the demo. ${title}, in a few lines: what happened, why it matters, and what comes next.`
      return `<item><title>${title}</title><link>https://example.com${path.replace('.xml', '')}/${i}</link><pubDate>${at}</pubDate><description>${summary}</description><author>desk@example.com (${feed.title} desk)</author><category>${category}</category><media:thumbnail url="${origin}${picturePath}"/></item>`
    })
    .join('')
  return `<?xml version="1.0"?><rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>${feed.title}</title>${items}</channel></rss>`
}

const site = createServer((req, res) => {
  const origin = `http://127.0.0.1:${site.address().port}`
  const url = req.url ?? ''
  if (FEEDS[url] !== undefined) {
    res.writeHead(200, { 'content-type': 'application/rss+xml' })
    res.end(feedXml(url, origin))
    return
  }
  const draw = pictures.get(url)
  if (draw !== undefined) {
    res.writeHead(200, { 'content-type': 'image/png' })
    res.end(draw())
    return
  }
  if (url === '/' || url === '/blog/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(
      `<html><head><title>Demo Network</title>${['wire', 'kernel', 'orbit', 'digest'].map((f) => `<link rel="alternate" type="application/rss+xml" title="${FEEDS[`/${f}.xml`].title}" href="/${f}.xml">`).join('')}</head><body></body></html>`,
    )
    return
  }
  res.writeHead(404).end()
})
await new Promise((resolve) => site.listen(0, '127.0.0.1', resolve))

/* ---- TRANSLATE, set up already: this PC's engine and model (user's choice 2026-11-15) ---- */

const FROM = path.join(process.env.APPDATA ?? '', 'elecdex', 'translate')
const MODEL_ID = 'plamo3-2b-q4km'
const MODEL_FILE = 'plamo-3-translate-2b-Q4_K_M.gguf'
for (const needed of [
  path.join(FROM, 'models', MODEL_ID, MODEL_FILE),
  path.join(FROM, 'engine'),
  path.join(FROM, 'engine.json'),
]) {
  if (!existsSync(needed)) {
    console.error(`demo-rss: ${needed} is not there. Set TRANSLATE up once in elecdex first.`)
    process.exit(1)
  }
}

/**
 * The take's profile given what a set-up TRANSLATE keeps: the engine's folder, the 2B model (a
 * hard link where the disk allows, else a copy) and engine.json with only that model's consent
 * and installation - never this PC's devices or other models. Nothing is fetched.
 */
function translateInPlace(profile) {
  const root = path.join(profile, 'translate')
  cpSync(path.join(FROM, 'engine'), path.join(root, 'engine'), { recursive: true })
  const models = path.join(root, 'models', MODEL_ID)
  mkdirSync(models, { recursive: true })
  const from = path.join(FROM, 'models', MODEL_ID, MODEL_FILE)
  try {
    linkSync(from, path.join(models, MODEL_FILE))
  } catch {
    copyFileSync(from, path.join(models, MODEL_FILE))
  }
  const engine = JSON.parse(readFileSync(path.join(FROM, 'engine.json'), 'utf8'))
  const only = (record) =>
    record?.[MODEL_ID] === undefined ? {} : { [MODEL_ID]: record[MODEL_ID] }
  writeFileSync(
    path.join(root, 'engine.json'),
    JSON.stringify({
      ...engine,
      source: 'fetched',
      own: null,
      devices: {},
      consents: only(engine.consents),
      installed: only(engine.installed),
    }),
  )
}

/* ---- The standard preset, its shells swapped for RSS ---- */

const { standIn } = await prepareData()
const trees = await presetTrees(MAIN)
const standard = trees.get('standard')
if (standard === undefined) throw new Error('no preset standard in the built app')

/** No feeds yet: the take starts on the pane's first look and adds them. A highlight word set. */
const RSS_STATE = { highlight: ['CRT'] }

/** The tab group of shells becomes one RSS pane, in the same place and the same share. */
function shellsToRss(node) {
  if (node.kind === 'split') return { ...node, children: node.children.map(shellsToRss) }
  if (node.kind === 'tabs' && node.children.every((c) => c.widget === 'terminal')) {
    const first = node.children[0]
    return { kind: 'pane', id: first.id, widget: 'rss', state: RSS_STATE }
  }
  return node
}

const demoTree = withDemoState(standard, standIn)
const items = [
  {
    id: 'rssstandard',
    name: 'standard',
    preset: 'standard',
    tree: { ...demoTree, root: shellsToRss(demoTree.root) },
  },
]

const { app, page, wait, settled, run, caption } = await openTake({
  items,
  options,
  standIn,
  settings: { translate: { live: true } },
  env: {
    // Nothing is asked of Hugging Face or GitHub: the model and the engine are in place.
    ELECDEX_HF_BASE_URL: 'http://127.0.0.1:9',
    ELECDEX_LLAMA_RELEASES_URL: 'http://127.0.0.1:9',
  },
  prepare: (profile) => translateInPlace(profile),
})
const beat = beats({ app, page, wait, settled, theme: options.theme })
const { paneOf, press, away } = beat
const rss = paneOf('rss')
const items$ = () => rss.getByTestId('rss-item')

/* ---- The take ---- */

const siteUrl = () => `http://127.0.0.1:${site.address().port}/`

async function addFeeds() {
  await rss.getByTestId('rss-empty').waitFor({ timeout: 30_000 })
  await caption(
    'RSS where the shell was. A new pane starts with a way in: a site, or a starter pack',
  )
  await wait(3600)
  await caption('Paste a site: its feeds are found from its page')
  const input = rss.getByTestId('rss-add-input')
  await input.click()
  await input.pressSequentially(siteUrl(), { delay: 45 })
  await wait(400)
  await press(rss.getByTestId('rss-find'))
  await rss.getByTestId('rss-candidate').first().waitFor({ timeout: 10_000 })
  await wait(2000)
  await press(rss.getByTestId('rss-candidate-add').first())
  // The first added, the pane turns to its headlines: the rest through ADD in the settings.
  await items$().first().waitFor({ timeout: 15_000 })
  await wait(1400)
  await caption('Add as many as you like - github:owner/repo and youtube:@handle work too')
  await press(rss.getByTestId('rss-settings-toggle'))
  await wait(700)
  await press(rss.getByTestId('rss-tab-add'))
  await wait(500)
  const again = rss.getByTestId('rss-add-input')
  await again.fill('')
  await again.pressSequentially(siteUrl(), { delay: 20 })
  await press(rss.getByTestId('rss-find'))
  await rss.getByTestId('rss-candidate-add').first().waitFor({ timeout: 10_000 })
  await wait(900)
  for (let i = 0; i < 3; i++) {
    await press(rss.getByTestId('rss-candidate-add').first())
    await wait(700)
  }
  await press(rss.getByTestId('rss-settings-toggle'))
  await wait(1000)
}

async function list() {
  await caption('Four feeds, one list: each with a mark in its own hue, newest first')
  await wait(3600)
}

async function article() {
  await caption('A click opens the article: picture, summary, author - and marks it read')
  await press(items$().nth(1))
  await wait(3200)
  await caption('↑ ↓ step through the articles')
  await page.keyboard.press('ArrowDown')
  await wait(1800)
}

async function translate() {
  await caption('TRANSLATE hands the article to the TRANSLATE pane, translated on this PC')
  await press(rss.getByTestId('rss-translate'))
  const popup = page.getByTestId('popup-pane')
  await popup.waitFor({ timeout: 10_000 })
  // The engine starts with the first translation, then writes block by block.
  await page
    .locator('[data-testid=translate-block][data-st=done]')
    .first()
    .waitFor({ timeout: 180_000 })
  await page
    .locator('[data-testid=translate-block]:not([data-st=done])')
    .first()
    .waitFor({ state: 'detached', timeout: 180_000 })
    .catch(() => {})
  await caption('PLaMo 3 Translate, running here: nothing leaves the computer')
  await wait(5200)
  await press(popup.getByTestId('popup-close'))
  await wait(900)
  await rss.getByTestId('rss-article').focus()
  await page.keyboard.press('Escape')
  await wait(1000)
}

async function cards() {
  await caption('CARD: the same headlines, with their pictures')
  await press(rss.getByTestId('rss-view-card'))
  await wait(2600)
  await rss.getByTestId('rss-cards').evaluate((el) => el.scrollBy({ top: 260, behavior: 'smooth' }))
  await wait(2200)
}

async function chipsAndFind() {
  await caption('A chip narrows the list to one feed')
  await press(rss.getByTestId('rss-chip').filter({ hasText: 'Orbit Weekly' }))
  await wait(2400)
  await press(rss.getByTestId('rss-chip').filter({ hasText: 'all' }))
  await wait(1000)
  await caption('Find lights what it finds, beside the words you chose to highlight')
  const find = rss.getByTestId('rss-search')
  await find.click()
  await find.pressSequentially('feed', { delay: 120 })
  await wait(2600)
  await rss.getByTestId('rss-search-clear').click()
  await wait(700)
}

async function ticker() {
  await caption('TICKER: one headline at a time, for a short pane or a status strip')
  await press(rss.getByTestId('rss-view-ticker'))
  await away()
  await wait(7000)
}

async function readMarks() {
  await press(rss.getByTestId('rss-view-list'))
  await wait(1200)
  await caption('UNREAD shows only what you have not read; MARK ALL READ clears the rest')
  await press(rss.getByTestId('rss-unread-only'))
  await wait(2400)
  await press(rss.getByTestId('rss-unread-only'))
  await wait(800)
  await press(rss.getByTestId('rss-mark-all-read'))
  await wait(2600)
  await caption(null)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await addFeeds()
  await list()
  await article()
  await translate()
  await cards()
  await chipsAndFind()
  await ticker()
  await readMarks()
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  site.close()
  if (exit) await app.close().catch(() => {})
})
