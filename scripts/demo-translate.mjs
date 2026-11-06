/**
 * The TRANSLATE pane at work, for a short landscape video (X, YouTube), with English captions at
 * the bottom: set up from nothing, then translating with PLaMo 3 Translate on this PC.
 *
 * The take:
 *   OPEN     the pane with no model: "> set up translation"
 *   SETUP    ENGINE (in place), MODEL (2B, fits this PC), LICENCE (its page opened, the licence and
 *            the download agreed to), FETCH (the progress and
 *            the sha256 check), READY (one sentence through the engine)
 *   LIVE     release notes pasted in, translated as they land, block by block, joined on the spine
 *   EASY     the target turned to Easy Japanese: LIVE asks again
 *   TRIP     ROUND TRIP: every block put back into English and scored
 *   HISTORY  the translations kept, one opened again
 *   SUMMON   Ctrl+Shift+Y: a copied sentence brought to the pane and translated
 *
 * The model is real and so is the engine (user's request 2026-11-06): the ones already fetched
 * into this PC's elecdex (%APPDATA%\elecdex\translate, or `--from=<that folder>`). The engine's
 * folder is copied into the take's fresh profile; the model is never fetched from Hugging Face.
 * FETCH pretends: a server on 127.0.0.1 stands in for Hugging Face, answers its revision API with
 * this PC's model file's size and sha256 (read at the start, a few seconds), and hands the file out
 * at a download's pace (`--mbps`, 160 MB/s), so the progress, the sha256 check and the file put in
 * place are the app's own. Everything else is the other takes' stand-ins (demo-take.mjs);
 * the machine's RAM, GPU and free space show in MODEL, as this PC's values do in every take.
 *
 * The window is 1600x900 at a zoom of 1, a 16:9 frame; record the window. The take starts after
 * the lead (`--lead`, 6 s) and ends by itself; pass `--exit` to close the window then. Windows
 * only, like the other takes. Run `npm run build` first, then `npm run demo:translate`. The
 * options are demo-take.mjs's (`takeOptions`): `--pace`, `--theme`, `--shots=<dir>`,
 * `--no-captions`.
 */
import { createHash } from 'node:crypto'
import { cpSync, createReadStream, existsSync, mkdirSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1600, height: 900, zoom: 1, lead: 6 })
const exit = process.argv.includes('--exit')
const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback

/* ---- What this PC has fetched already ---- */

const FROM = arg('from', path.join(process.env.APPDATA ?? '', 'elecdex', 'translate'))
const MODEL_ID = 'plamo3-2b-q4km'
const MODEL_FILE = 'plamo-3-translate-2b-Q4_K_M.gguf'
const MODEL = path.join(FROM, 'models', MODEL_ID, MODEL_FILE)
const ENGINE = path.join(FROM, 'engine')
for (const needed of [MODEL, ENGINE]) {
  if (!existsSync(needed)) {
    console.error(`demo-translate: ${needed} is not there. Set the pane up once in elecdex first.`)
    process.exit(1)
  }
}
const MBPS = Number(arg('mbps', '160'))

/** The model file's sha256, read once: the stand-in's revision API gives it, as Hugging Face's does. */
function sha256Of(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    createReadStream(file)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')))
      .on('error', reject)
  })
}

/** The commit the stand-in names as the newest: any 40 hex digits do. */
const COMMIT = 'de30de30'.padEnd(40, '0')

/**
 * Hugging Face's stand-in: its revision API for the model's repository (the newest commit, with
 * this PC's file's size and sha256), and this PC's model file at a download's pace, whatever path
 * is asked. Ranged requests are answered too, as the fetcher resumes with them.
 */
async function modelServer() {
  const size = statSync(MODEL).size
  const sha256 = await sha256Of(MODEL)
  const server = createServer((req, res) => {
    if (req.url?.startsWith('/api/models/')) {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          sha: COMMIT,
          lastModified: new Date().toISOString(),
          siblings: [{ rfilename: MODEL_FILE, lfs: { sha256, size } }],
        }),
      )
      return
    }
    const range = /bytes=(\d+)-/.exec(req.headers.range ?? '')
    const start = range ? Number(range[1]) : 0
    res.writeHead(range ? 206 : 200, {
      'content-length': String(size - start),
      ...(range ? { 'content-range': `bytes ${start}-${size - 1}/${size}` } : {}),
    })
    const stream = createReadStream(MODEL, { start, highWaterMark: 4 * 1024 * 1024 })
    const perChunkMs = ((4 * 1024 * 1024) / (MBPS * 1024 * 1024)) * 1000
    stream.on('data', (chunk) => {
      stream.pause()
      const ok = res.write(chunk)
      const go = () => setTimeout(() => stream.resume(), perChunkMs)
      if (ok) go()
      else res.once('drain', go)
    })
    stream.on('end', () => res.end())
    req.on('close', () => stream.destroy())
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () =>
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` }),
    )
  })
}

/* ---- The window ---- */

const hf = await modelServer()
const tree = { version: 1, root: { kind: 'pane', id: 'p-translate', widget: 'translate' } }
const { standIn } = await prepareData()
const { app, page, wait, settled, run, caption } = await openTake({
  items: [{ id: 'translate', name: 'translate', tree }],
  options,
  standIn,
  settings: { translate: { live: true } },
  env: {
    ELECDEX_HF_BASE_URL: hf.base,
    // The engine is in place already: nothing is asked of GitHub.
    ELECDEX_LLAMA_RELEASES_URL: 'http://127.0.0.1:9',
  },
  prepare: (profile) => {
    // The engine fetched before, as elecdex keeps it; the model comes through FETCH.
    cpSync(ENGINE, path.join(profile, 'translate', 'engine'), { recursive: true })
    mkdirSync(path.join(profile, 'translate', 'models'), { recursive: true })
  },
})

/** Presses a button the way a hand does: held for a moment (CLAUDE.md, test craft). */
const press = (locator) => locator.click({ delay: 20 })
const next = () => press(page.getByTestId('translate-next'))
const blocks = () => page.getByTestId('translate-block')
/** The pointer out of the way: over the window's top, where it opens no card. */
const away = () => page.mouse.move(800, 16)
/** A new run under way: one of its blocks not yet written (the last run's are all done). */
async function asked() {
  await page
    .locator('[data-testid=translate-block]:not([data-st=done])')
    .first()
    .waitFor({ timeout: 10_000 })
    .catch(() => {})
}

/** Every block written (and every round trip back, when asked). */
async function written(count, trips = false) {
  await blocks()
    .nth(count - 1)
    .and(page.locator('[data-st=done]'))
    .waitFor({ timeout: 120_000 })
  if (trips)
    await page
      .getByTestId('translate-trip-score')
      .nth(count - 1)
      .waitFor({ timeout: 120_000 })
}

async function open() {
  say('open')
  await caption('TRANSLATE runs PLaMo 3 Translate on this PC, through llama.cpp')
  await wait(3200)
  await press(page.getByTestId('translate-setup-open'))
  await wait(1600)
}

async function setup() {
  say('setup')
  await caption('Set up once: the engine, then a model sized for this PC')
  await wait(2400)
  await next()
  await wait(1200)
  await press(page.getByTestId('translate-model-standard'))
  await wait(2600)
  await next()
  await caption('The model is used under the PLaMo Community License, read on its own site')
  await wait(2000)
  // The licence page opens in the browser: here the take keeps it from opening one.
  await app.evaluate(({ shell }) => {
    shell.openExternal = async () => {}
  })
  await press(page.getByTestId('translate-licence-open'))
  await wait(1000)
  await press(page.getByTestId('translate-agree'))
  await wait(900)
  await caption('Agreed with the download it brings, and kept with its time')
  await press(page.getByTestId('translate-agree-fetch'))
  await wait(2000)
  await next()
  await caption('Fetched once, then checked against its sha256')
  await page.getByTestId('translate-selftest').waitFor({ timeout: 180_000 })
  await caption('READY: one sentence through the engine')
  await page
    .getByTestId('translate-selftest')
    .filter({ hasText: '→' })
    .waitFor({ timeout: 120_000 })
  await wait(3200)
  await next()
  await wait(1400)
}

const NOTES = [
  'Translation now runs on your own computer.',
  'Paste a document and it is translated paragraph by paragraph, each one written as it arrives. Nothing you translate is sent to any server.',
  'Turn on Round trip to translate each paragraph back and see how much of the meaning survived.',
].join('\n\n')

async function live() {
  say('live')
  await caption('Pasted text is translated as it lands - block by block, joined on the spine')
  await page.getByTestId('translate-source').click()
  await page.getByTestId('translate-source').fill(NOTES)
  await written(3)
  await away()
  await wait(3600)
}

async function easy() {
  say('easy')
  await caption('53 languages, and Easy Japanese')
  await press(page.getByTestId('translate-tgt-lang'))
  await wait(900)
  await page
    .getByTestId('translate-lang-tgt')
    .getByLabel('Filter the languages')
    .pressSequentially('easy', { delay: 80 })
  await wait(700)
  await press(page.getByTestId('translate-lang-tgt').locator('[data-code="ja(easy)"]'))
  await asked()
  await written(3)
  await away()
  await wait(3600)
}

async function trip() {
  say('trip')
  await caption('ROUND TRIP puts each block back into English and scores how much came through')
  await press(page.getByTestId('translate-tgt-lang'))
  await wait(600)
  await press(page.getByTestId('translate-lang-tgt').locator('[data-code="ja"]').first())
  await asked()
  await written(3)
  // AUTO knows the source is English (the letters make it certain): the trips go back into it.
  await press(page.getByTestId('translate-trip-toggle'))
  await written(3, true)
  await away()
  await wait(4200)
}

async function history() {
  say('history')
  await caption('Every translation is kept in HISTORY, on this PC')
  await press(page.getByTestId('translate-view-history'))
  await wait(3200)
  // The Easy Japanese one, opened again in TEXT as it was.
  await press(
    page
      .getByTestId('translate-history-row')
      .filter({ hasText: 'EASY JA' })
      .first()
      .getByRole('button')
      .first(),
  )
  await wait(3000)
}

async function summon() {
  say('summon')
  await caption('Ctrl+Shift+Y brings what you copied, and translates it')
  await app.evaluate(() => {
    globalThis.__elecdexClipboard?.copy(
      'Could you send me the slides before the meeting on Friday?',
    )
  })
  await wait(800)
  await page.keyboard.press('Control+Shift+KeyY')
  await page
    .getByTestId('translate-source-blocks')
    .filter({ hasText: 'slides' })
    .waitFor({ timeout: 30_000 })
    .catch(() => {})
  await written(1)
  await away()
  await wait(4200)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await away()
  await open()
  await setup()
  await live()
  await easy()
  await trip()
  await history()
  await summon()
  await caption('elecdex · TRANSLATE')
  await wait(2500)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
hf.server.close()
