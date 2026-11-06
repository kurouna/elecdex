import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { type ElectronApplication, expect, type Locator, type Page } from '@playwright/test'
import { test } from '../support/shared.js'
import { openedExternally, stubOpenExternal } from '../support/stubs/external.js'
import {
  closePane,
  launch,
  reloadWorkspace,
  SINGLE_TERMINAL,
  single,
  stubOf,
  watching,
} from '../support.js'

/**
 * The TRANSLATE pane's phase 1 (docs/translate.md §12): SETUP fetches a model and READY's self
 * test goes through the engine. Nothing reaches Hugging Face, GitHub or a real llama-server:
 * the model is a few kilobytes a local server here hands out under a test manifest
 * (ELECDEX_TRANSLATE_MANIFEST), and support.ts makes llama-server the stand-in
 * tests/e2e/support/llama-stub.mjs.
 */

const MODEL = Buffer.from(Array.from({ length: 64 * 1024 }, (_, i) => (i * 7) % 256))
const SHA = createHash('sha256').update(MODEL).digest('hex')
const FILE = 'plamo-3-translate-2b-Q4_K_M.gguf'
/** The 0.8B model's file, for a test that sets up a second model. */
const LITE_FILE = 'plamo-3-translate-0.8b-Q4_K_M.gguf'

/** The repositories' newest commit, as the stand-in for Hugging Face tells it. */
const COMMIT = 'abcdef1'.padEnd(40, '0')

interface ModelServer {
  server: Server
  base: string
  asked: string[]
  /** 'stall': half the file, then nothing, as a download under way when PAUSE or CANCEL comes. */
  mode: 'serve' | 'stall'
  /** The newest commit the revision API tells, and the file served at it. */
  commit: string
  body: Buffer
}

/** What a test asked of the stand-in's files (the revision API left out). */
const files = (hf: ModelServer) => hf.asked.filter((url) => !url.startsWith('/api/'))

/** Serves the made-up model at any commit, and Hugging Face's revision API for its repositories. */
async function modelServer(): Promise<ModelServer> {
  const state: ModelServer = {
    server: createServer(),
    base: '',
    asked: [],
    mode: 'serve',
    commit: COMMIT,
    body: MODEL,
  }
  state.server.on('request', (req, res) => {
    state.asked.push(req.url ?? '')
    if (req.url?.startsWith('/api/models/')) {
      const sha256 = createHash('sha256').update(state.body).digest('hex')
      const lfs = { sha256, size: state.body.length }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          sha: state.commit,
          lastModified: '2026-11-06T00:49:00.000Z',
          siblings: [
            { rfilename: FILE, lfs },
            { rfilename: LITE_FILE, lfs },
          ],
        }),
      )
      return
    }
    if (!req.url?.endsWith(`/${FILE}`) && !req.url?.endsWith(`/${LITE_FILE}`)) {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(200, { 'content-length': String(state.body.length) })
    if (state.mode === 'stall') {
      res.write(state.body.subarray(0, state.body.length / 2))
      return
    }
    res.end(state.body)
  })
  await new Promise<void>((resolve) => state.server.listen(0, '127.0.0.1', resolve))
  state.base = `http://127.0.0.1:${(state.server.address() as AddressInfo).port}`
  return state
}

const stopServer = (server: Server): void => {
  server.closeAllConnections()
  server.close()
}

/**
 * LICENCE as a person goes through it: the licence's page opened (the browser stubbed, so nothing
 * leaves the machine), the licence agreed to, and the fetch.
 */
async function agree(page: Page, app: ElectronApplication): Promise<void> {
  await stubOpenExternal(app)
  await page.getByTestId('translate-licence-open').click()
  await page.getByTestId('translate-agree').click()
  await page.getByTestId('translate-agree-fetch').click()
}

/** SETUP up to its FETCH step with the 2B model, the licence agreed to. */
async function setupToFetch(page: Page, app: ElectronApplication): Promise<void> {
  await page.getByTestId('translate-setup-open').click()
  await page.getByTestId('translate-next').click()
  await page.getByTestId('translate-model-standard').click()
  await page.getByTestId('translate-next').click()
  await agree(page, app)
  await page.getByTestId('translate-next').click()
}

/** The footer's engine lamp: its word. */
const lamp = (page: Page) => page.getByTestId('translate-pane').locator('.foot .lampw')

/** The stand-in manifest: the 2B model, and with `lite` the 0.8B as well. */
function manifest(lite = false): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-translate-'))
  const file = path.join(dir, 'manifest.json')
  writeFileSync(
    file,
    JSON.stringify({
      models: [
        {
          id: 'plamo3-2b-q4km',
          tier: 'standard',
          params: '2B',
          quant: 'Q4_K_M',
          repo: 'pfnet/plamo-3-translate-2b-GGUF',
          revision: 'abcdef1',
          file: FILE,
          bytes: MODEL.length,
          sha256: SHA,
          ramGB: 1,
          vramGB: null,
        },
        ...(lite
          ? [
              {
                id: 'plamo3-0.8b-q4km',
                tier: 'lite',
                params: '0.8B',
                quant: 'Q4_K_M',
                repo: 'pfnet/plamo-3-translate-0.8b-GGUF',
                revision: 'abcdef2',
                file: LITE_FILE,
                bytes: MODEL.length,
                sha256: SHA,
                ramGB: 1,
                vramGB: null,
              },
            ]
          : []),
      ],
    }),
  )
  return file
}

test('SETUP fetches the model, checks it, and READY translates through the engine', async () => {
  const hf = await modelServer()
  const { app, page, close, userData } = await launch(undefined, {
    layout: single('translate'),
    env: { ELECDEX_TRANSLATE_MANIFEST: manifest(), ELECDEX_HF_BASE_URL: hf.base },
  })
  try {
    // No model yet: the pane says so and offers SETUP; nothing is fetched by itself.
    await expect(page.getByTestId('translate-standby')).toContainText('No model')
    expect(hf.asked).toEqual([])
    expect(await watching(page, 'translate')).toEqual(['board'])

    await page.getByTestId('translate-setup-open').click()
    await expect(page.getByTestId('translate-setup')).toBeVisible()
    await page.getByTestId('translate-next').click() // ENGINE: fetched by elecdex (the stand-in)
    await page.getByTestId('translate-model-standard').click()
    await page.getByTestId('translate-next').click() // MODEL
    // LICENCE: nothing goes before the licence is agreed to, and it cannot be agreed to before its
    // page, the text that holds, is opened.
    await expect(page.getByTestId('translate-next')).toBeDisabled()
    await expect(page.getByTestId('translate-agree')).toBeDisabled()
    await expect(page.getByTestId('translate-agree')).toContainText('Open the licence above first')
    await stubOpenExternal(app)
    await page.getByTestId('translate-licence-open').click()
    await expect
      .poll(() => openedExternally(app))
      .toEqual(['https://plamo.preferredai.jp/info/plamo-community-license-ja'])
    await page.getByTestId('translate-agree').click()
    // The licence alone is not enough: the fetch is agreed to as well.
    await expect(page.getByTestId('translate-next')).toBeDisabled()
    await expect(page.getByTestId('translate-setup')).toContainText('Agree and fetch downloads')
    await expect(page.getByTestId('translate-setup')).toContainText(`${FILE}`)
    await page.getByTestId('translate-agree-fetch').click()
    await page.getByTestId('translate-next').click()
    // Kept in the consent log, with when the page was opened and what is fetched.
    const log = path.join(userData, 'translate', 'licence-consents.txt')
    await expect.poll(() => existsSync(log)).toBe(true)
    const entry = readFileSync(log, 'utf8')
    expect(entry).toMatch(/^\d{4}-\d\d-\d\dT[\d:.]+Z {2}agreed {2}plamo3-2b-q4km$/m)
    expect(entry).toMatch(/opened from elecdex \d{4}-/)
    expect(entry).toContain(`pfnet/plamo-3-translate-2b-GGUF@${COMMIT} ${FILE}`)

    // FETCH, then READY by itself, with the self test through the engine.
    await expect(page.getByTestId('translate-selftest')).toContainText('おはようございます。', {
      timeout: 30_000,
    })
    // The newest commit, asked of the revision API as the licence was agreed to.
    expect(hf.asked[0]).toBe('/api/models/pfnet/plamo-3-translate-2b-GGUF/revision/main?blobs=true')
    expect(files(hf)).toEqual([`/pfnet/plamo-3-translate-2b-GGUF/resolve/${COMMIT}/${FILE}`])
    expect(existsSync(path.join(userData, 'translate', 'models', 'plamo3-2b-q4km', FILE))).toBe(
      true,
    )
    // Once fetched (an agreement is refused while its model is written): an opening goes with one
    // agreement; the next, with no page opened for it, says so rather than repeating the time.
    await page.evaluate(() => window.elecdex.translate.consent('plamo3-2b-q4km'))
    const entries = readFileSync(log, 'utf8').split(/\n(?=\d{4}-)/)
    expect(entries).toHaveLength(2)
    expect(entries[1]).toContain('opened from elecdex (not opened for this agreement)')
    await page.getByTestId('translate-next').click()
    await expect(page.getByTestId('translate-standby')).toContainText('Ready')
    await expect(page.getByTestId('translate-where')).toContainText('local, nothing leaves this PC')
  } finally {
    await close()
    stopServer(hf.server)
  }
})

test('PAUSE keeps what was fetched and stops the watch; RESUME finishes it', async () => {
  const hf = await modelServer()
  hf.mode = 'stall'
  const { app, page, close, userData } = await launch(undefined, {
    layout: single('translate'),
    env: { ELECDEX_TRANSLATE_MANIFEST: manifest(), ELECDEX_HF_BASE_URL: hf.base },
  })
  const part = path.join(userData, 'translate', 'models', 'plamo3-2b-q4km', `${FILE}.part`)
  try {
    await setupToFetch(page, app)
    await expect(page.getByTestId('translate-fetch-percent')).toContainText('50')
    expect(await watching(page, 'translate')).toEqual(['board', 'fetch'])
    await page.getByRole('button', { name: 'Pause' }).click()
    await expect(page.getByTestId('translate-setup')).toContainText('paused')
    await expect.poll(() => watching(page, 'translate')).toEqual(['board'])
    expect(existsSync(part)).toBe(true)
    hf.mode = 'serve'
    await page.getByRole('button', { name: 'Resume' }).click()
    await expect(page.getByTestId('translate-selftest')).toContainText('おはようございます。', {
      timeout: 30_000,
    })
  } finally {
    await close()
    stopServer(hf.server)
  }
})

test('CANCEL removes what was fetched and goes back to the models', async () => {
  const hf = await modelServer()
  hf.mode = 'stall'
  const { app, page, close, userData } = await launch(undefined, {
    layout: single('translate'),
    env: { ELECDEX_TRANSLATE_MANIFEST: manifest(), ELECDEX_HF_BASE_URL: hf.base },
  })
  const part = path.join(userData, 'translate', 'models', 'plamo3-2b-q4km', `${FILE}.part`)
  try {
    await setupToFetch(page, app)
    await expect(page.getByTestId('translate-fetch-percent')).toContainText('50')
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByTestId('translate-model-standard')).toBeVisible()
    await expect.poll(() => existsSync(part)).toBe(false)
    await expect.poll(() => watching(page, 'translate')).toEqual(['board'])
  } finally {
    await close()
    stopServer(hf.server)
  }
})

test('TEST of an external server that runs PLaMo 3 makes it the engine', async () => {
  // A server elsewhere, here on loopback: /props names the model, /health is ready.
  const external = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(
      JSON.stringify(
        req.url === '/props'
          ? { model_path: '/models/plamo-3-translate-8b-Q4_K_M.gguf', total_slots: 1 }
          : { status: 'ok' },
      ),
    )
  })
  await new Promise<void>((resolve) => external.listen(0, '127.0.0.1', resolve))
  const port = (external.address() as AddressInfo).port
  const { page, close, userData } = await launch(undefined, { layout: single('translate') })
  try {
    await page.getByTestId('translate-settings-toggle').click()
    const engine = page.getByTestId('translate-engine')
    await engine.getByLabel('Server address').fill(`http://127.0.0.1:${port}`)
    await engine.getByRole('button', { name: 'Test' }).click()
    await expect(page.getByTestId('translate-where')).toContainText(`sent to 127.0.0.1:${port}`)
    // Ready at once: the restart the change of source brings does not mark it untested again.
    await expect(lamp(page)).toContainText('Ready')
    // Kept in main's own file, never settings.json.
    const file = JSON.parse(readFileSync(path.join(userData, 'translate', 'engine.json'), 'utf8'))
    expect(file.source).toBe('external')
  } finally {
    await close()
    stopServer(external)
  }
})

test('a llama-server that writes nothing while it loads is given up as a FAULT', async () => {
  const { page, close } = await launch(undefined, {
    layout: single('translate'),
    // The model is in place (its size is not checked to start), so the engine can be started.
    files: { [`translate/models/plamo3-2b-q4km/${FILE}`]: 'x' },
    env: {
      ELECDEX_TRANSLATE_MANIFEST: manifest(),
      ELECDEX_LLAMA_STUB_MODE: 'silent-boot',
      ELECDEX_LLAMA_STALL_MS: '1500',
    },
  })
  try {
    await page.getByTestId('translate-settings-toggle').click()
    const engine = page.getByTestId('translate-engine')
    await engine.getByRole('button', { name: 'Restart' }).click()
    await expect(engine).toContainText('stopped loading', { timeout: 15_000 })
    await expect(lamp(page)).toContainText('Fault')
  } finally {
    await close()
  }
})

test('ENGINE refuses an external address that is not one, before asking the network', async () => {
  const { page, close } = await launch(undefined, { layout: single('translate') })
  try {
    await page.getByTestId('translate-settings-toggle').click()
    const engine = page.getByTestId('translate-engine')
    await expect(engine).toBeVisible()
    await engine.getByLabel('Server address').fill('file:///C:/x')
    await engine.getByRole('button', { name: 'Test' }).click()
    await expect(engine).toContainText('Only http and https addresses.')
    await engine.getByLabel('Server address').fill('http://user:pw@127.0.0.1:1')
    await engine.getByRole('button', { name: 'Test' }).click()
    await expect(engine).toContainText('No user name or password in the address.')
    await expect(page.getByTestId('translate-where')).toContainText('local')
  } finally {
    await close()
  }
})

/* ---- TEXT (phase 2): block by block through the stand-in engine ---- */

/** A pane with a model in place (its size is not checked to start) and the stand-in engine. */
/**
 * A pane with a model in place (its size is not checked to start) and the stand-in engine. LIVE
 * is off unless a test turns it on: a test types, and only TRANSLATE should ask then.
 */
function withModel(mode = '', live = false) {
  return {
    layout: single('translate'),
    settings: { translate: { live } },
    files: { [`translate/models/plamo3-2b-q4km/${FILE}`]: 'x'.repeat(MODEL.length) },
    env: { ELECDEX_TRANSLATE_MANIFEST: manifest(), ELECDEX_LLAMA_STUB_MODE: mode },
  }
}

async function translate(page: Page, text: string): Promise<void> {
  const source = page.getByTestId('translate-source')
  await source.fill(text)
  await source.press('Control+Enter')
}

const blocks = (page: Page) => page.getByTestId('translate-block')

test('TRANSLATE writes every block, with the source laid out on the spine', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    await translate(page, 'Hello.\n\nThe second block\nkeeps its line.\n\nThird.')
    await expect(blocks(page)).toHaveCount(3)
    await expect(blocks(page).nth(2)).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    await expect(blocks(page).nth(0)).toContainText('[ja] Hello.')
    await expect(blocks(page).nth(1)).toContainText('[ja] The second block\nkeeps its line.')
    // The source is shown as the same blocks, each joined to its translation on the spine.
    await expect(page.getByTestId('translate-source-blocks').locator('.seg')).toHaveCount(3)
    await expect(page.getByTestId('translate-node')).toHaveCount(3)
    await expect(page.getByTestId('translate-node').first()).toHaveAttribute('data-st', 'done')
    // Done: main keeps the run only while the pane follows it.
    expect(await watching(page, 'translate')).toEqual(['board', 'run:translate'])
  } finally {
    await close()
  }
})

test('STOP (Ctrl+.) keeps the block being written and leaves the rest untranslated', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    const long = 'A long sentence that takes a while to write. '.repeat(12).trim()
    await translate(page, `${long}\n\nAfter it.`)
    await expect(blocks(page).first()).toHaveAttribute('data-st', 'running', { timeout: 15_000 })
    await expect(blocks(page).first()).toContainText('[ja] A long')
    // Straight after Ctrl+Enter, with nothing clicked: the pane kept the focus.
    await page.keyboard.press('Control+Period')
    await expect(blocks(page).first()).toHaveAttribute('data-st', 'stopped')
    await expect(blocks(page).nth(1)).toHaveAttribute('data-st', 'none')
    await expect(page.getByTestId('translate-reason')).toContainText('Stopped.')
    await expect(page.getByTestId('translate-go')).toBeVisible()
  } finally {
    await close()
  }
})

test('a translation goes on through a reload, and the page is given it back', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    const long = 'Written while the page goes away and comes back. '.repeat(10).trim()
    await translate(page, `${long}\n\nThe last one.`)
    await expect(blocks(page).first()).toHaveAttribute('data-st', 'running', { timeout: 15_000 })
    await reloadWorkspace(page)
    await expect(blocks(page).nth(1)).toHaveAttribute('data-st', 'done', { timeout: 20_000 })
    await expect(blocks(page).first()).toContainText(`[ja] ${long}`)
    // The source came back with it, from main.
    await expect(page.getByTestId('translate-source-blocks')).toContainText('The last one.')
  } finally {
    await close()
  }
})

test('closed, the pane leaves main holding nothing of its run', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    await translate(page, 'Something.')
    await expect(blocks(page).first()).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    await closePane(page.locator('[data-testid=pane]').first())
    await expect.poll(() => watching(page, 'translate'), { timeout: 10_000 }).toEqual([])
  } finally {
    await close()
  }
})

test('a stream that ends without its end mark fails the block and stops, never shown as done', async () => {
  const { page, close } = await launch(undefined, withModel('no-stop'))
  try {
    await translate(page, 'One.\n\nTwo.')
    await expect(page.getByTestId('translate-reason')).toContainText('end mark', {
      timeout: 15_000,
    })
    await expect(blocks(page).first()).toHaveAttribute('data-st', 'failed')
    await expect(blocks(page).nth(1)).toHaveAttribute('data-st', 'none')
  } finally {
    await close()
  }
})

test('a block cut at the length limit says so, and the rest goes on', async () => {
  const { page, close } = await launch(undefined, withModel('limit'))
  try {
    await translate(page, 'One.\n\nTwo.')
    await expect(blocks(page).nth(1)).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    await expect(blocks(page).first()).toContainText('Cut at the length limit.')
  } finally {
    await close()
  }
})

test('an engine that ends under a block twice stops the run and says so', async () => {
  const { page, close } = await launch(undefined, withModel('crash-mid'))
  try {
    await translate(page, 'A sentence long enough to be cut while it is written.')
    await expect(page.getByTestId('translate-reason')).toContainText('engine', {
      timeout: 20_000,
    })
    await expect(lamp(page)).toContainText('Fault')
  } finally {
    await close()
  }
})

test('the languages and the form are the pane’s, and Easy Japanese takes no form', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    await page.getByTestId('translate-tgt-lang').click()
    const picker = page.getByTestId('translate-lang-tgt')
    await picker.getByLabel('Filter the languages').fill('easy')
    await picker.locator('[data-code="ja(easy)"]').click()
    await expect(page.getByTestId('translate-tgt-lang')).toContainText('EASY JA')
    await expect(page.getByTestId('translate-form')).toHaveClass(/off/)
    await translate(page, 'Hello.')
    await expect(blocks(page).first()).toContainText('[ja(easy)] Hello.', { timeout: 15_000 })
    // The source side never offers Easy Japanese.
    await page.getByTestId('translate-src-lang').click()
    await expect(
      page.getByTestId('translate-lang-src').locator('[data-code="ja(easy)"]'),
    ).toHaveCount(0)
  } finally {
    await close()
  }
})

/* ---- phase 3: the glossary, the context, AUTO, HISTORY ---- */

test('a glossary made in the drawer goes with the blocks that hold its terms, and the context with all', async () => {
  const { page, close, userData } = await launch(undefined, withModel())
  try {
    await page.getByTestId('translate-glossary-toggle').click()
    const drawer = page.getByTestId('translate-glossary')
    await drawer.getByRole('button', { name: '+ New' }).click()
    await drawer.getByRole('button', { name: '+ Term' }).click()
    await drawer.getByLabel('Source term 1').fill('pane')
    await drawer.getByLabel('Target term 1').fill('ペイン')
    // Saved to main's own file a moment after the last edit.
    await expect
      .poll(() => {
        try {
          return readFileSync(path.join(userData, 'translate', 'glossaries.json'), 'utf8')
        } catch {
          return ''
        }
      })
      .toContain('ペイン')
    await page.getByTestId('translate-context-toggle').click()
    await page.getByTestId('translate-context').fill('Release notes of a system monitor.')
    await translate(page, 'The pane is here.\n\nNothing else.')
    await expect(blocks(page).nth(1)).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    await expect(blocks(page).first()).toContainText('{pane=ペイン} {ctx}')
    await expect(blocks(page).nth(1)).not.toContainText('pane=')
    await expect(blocks(page).nth(1)).toContainText('{ctx}')
    // Into French, the Japanese glossary is not used, and the pane says so.
    await page.getByTestId('translate-tgt-lang').click()
    await page.getByTestId('translate-lang-tgt').locator('[data-code="fr"]').click()
    await page.getByTestId('translate-source-blocks').click()
    await page.getByTestId('translate-source').press('Control+Enter')
    await expect(page.getByTestId('translate-glossary-unused')).toBeVisible({ timeout: 15_000 })
    await expect(blocks(page).first()).not.toContainText('pane=')
  } finally {
    await close()
  }
})

test('AUTO says the language the letters make certain, and then lets the languages be swapped', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    await expect(page.getByTestId('translate-swap')).toBeDisabled()
    await page
      .getByTestId('translate-source')
      .fill('The metrics collector now runs in its own process, and it is fast.')
    await expect(page.getByTestId('translate-source-info')).toContainText('AUTO ≈ EN')
    await page.getByTestId('translate-swap').click()
    await expect(page.getByTestId('translate-src-lang')).toContainText('JA')
    await expect(page.getByTestId('translate-tgt-lang')).toContainText('EN')
  } finally {
    await close()
  }
})

test('HISTORY keeps a translation, opens it again in TEXT, and forgets it', async () => {
  const { page, close, userData } = await launch(undefined, withModel())
  try {
    await translate(page, 'Kept in the history.')
    await expect(blocks(page).first()).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    // Written to main's file within its two seconds.
    await expect
      .poll(() => {
        try {
          return readFileSync(path.join(userData, 'translate', 'history.json'), 'utf8')
        } catch {
          return ''
        }
      })
      .toContain('Kept in the history.')
    await page.getByTestId('translate-source-blocks').click()
    await page.getByTestId('translate-source').fill('Something else entirely.')
    await page.getByTestId('translate-view-history').click()
    const rows = page.getByTestId('translate-history-row')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('Kept in the history.')
    await rows.first().getByRole('button').first().click()
    await expect(page.getByTestId('translate-source-blocks')).toContainText('Kept in the history.')
    await expect(blocks(page).first()).toContainText('[ja] Kept in the history.')
    await page.getByTestId('translate-view-history').click()
    // CLEAR asks by its second press.
    await page.getByTestId('translate-history-clear').click()
    await expect(rows).toHaveCount(1)
    await page.getByTestId('translate-history-clear').click()
    await expect(rows).toHaveCount(0)
  } finally {
    await close()
  }
})

/* ---- phase 4: LIVE, EDIT, RETRY, ROUND TRIP ---- */

test('LIVE translates as it is typed, and writes again only the block that changed', async () => {
  const { page, close } = await launch(undefined, withModel('', true))
  try {
    const source = page.getByTestId('translate-source')
    await source.fill('First block.\n\nSecond block.')
    await expect(blocks(page).nth(1)).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    await expect(blocks(page).first()).toContainText('[ja] First block.')
    // The typing goes on in the source; only the second block changes.
    await source.fill('First block.\n\nSecond block, changed.')
    await expect(blocks(page).nth(1)).toContainText('[ja] Second block, changed.', {
      timeout: 15_000,
    })
    await expect(source).toBeFocused()
    expect(await watching(page, 'translate')).toContain('run:translate')
  } finally {
    await close()
  }
})

test('EDIT mends a block by hand, and RETRY writes one again', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    await translate(page, 'One.\n\nTwo.')
    await expect(blocks(page).nth(1)).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    await blocks(page).first().hover()
    await blocks(page).first().getByTestId('translate-block-edit-open').click()
    const editor = page.getByTestId('translate-block-edit')
    await editor.fill('手で直した一。')
    await editor.press('Control+Enter')
    await expect(blocks(page).first()).toContainText('手で直した一。')
    await expect(blocks(page).first()).toHaveAttribute('data-edited', 'true')
    await blocks(page).nth(1).hover()
    await blocks(page).nth(1).getByTestId('translate-block-retry').click()
    await expect(blocks(page).nth(1)).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    await expect(blocks(page).nth(1)).toContainText('[ja] Two.')
    // The mended block stays as it was mended.
    await expect(blocks(page).first()).toContainText('手で直した一。')
  } finally {
    await close()
  }
})

test('ROUND TRIP puts each block back into the source language and scores it', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    await page.getByTestId('translate-src-lang').click()
    await page.getByTestId('translate-lang-src').locator('[data-code="en"]').click()
    await page.getByTestId('translate-trip-toggle').click()
    await translate(page, 'Round and round.\n\nAgain.')
    await expect(page.getByTestId('translate-trip-score')).toHaveCount(2, { timeout: 20_000 })
    // The stand-in writes "[en] [ja] Round and round.": close, but not the same.
    await expect(page.getByTestId('translate-trip').first()).toContainText(
      '[en] [ja] Round and round.',
    )
  } finally {
    await close()
  }
})

test('HISTORY keeps one entry a draft: typing on replaces it, a new text adds one', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    await translate(page, 'A draft that goes on.')
    await expect(blocks(page).first()).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    await page.getByTestId('translate-source-blocks').click()
    // Typed on at its end: the same draft.
    await page.getByTestId('translate-source').press('End')
    await page.getByTestId('translate-source').pressSequentially(' More.')
    await page.getByTestId('translate-source').press('Control+Enter')
    await expect(blocks(page).first()).toContainText('More.', { timeout: 15_000 })
    await expect(blocks(page).first()).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    // Replaced whole: a new draft.
    await page.getByTestId('translate-source-blocks').click()
    await translate(page, 'Something else entirely, and longer than that.')
    await expect(blocks(page).first()).toContainText('Something else', { timeout: 15_000 })
    await expect(blocks(page).first()).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    await page.getByTestId('translate-view-history').click()
    const rows = page.getByTestId('translate-history-row')
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(1)).toContainText('A draft that goes on. More.')
  } finally {
    await close()
  }
})

/* ---- phase 5: Ctrl+Shift+Y ---- */

test('Ctrl+Shift+Y brings TRANSLATE up with the clipboard’s text and translates it at once', async () => {
  const { page, app, close } = await launch(undefined, {
    ...withModel(),
    layout: SINGLE_TERMINAL,
  })
  try {
    await stubOf(app, 'clipboard').copy('Copied to translate.')
    await page.keyboard.press('Control+Shift+KeyY')
    const popup = page.getByTestId('popup-pane')
    await expect(popup).toHaveAttribute('data-widget', 'translate')
    await expect(popup.getByTestId('translate-block').first()).toContainText(
      '[ja] Copied to translate.',
      {
        timeout: 15_000,
      },
    )
    // A copy marked private is never read: the pane opens on an empty source.
    await page.keyboard.press('Escape')
    await expect(popup).toHaveCount(0)
    await stubOf(app, 'clipboard').copy('A password.', { private: true })
    await page.keyboard.press('Control+Shift+KeyY')
    // Answered: the call with no text opens the source for typing, focused - and empty.
    await expect(popup.getByTestId('translate-source')).toBeFocused()
    await expect(popup.getByTestId('translate-source')).toHaveValue('')
    expect(await watching(page, 'translate')).not.toContain('A password.')
  } finally {
    await close()
  }
})

/* ---- after the first try by hand (2026-11-06) ---- */

test('CLEAR clears the translation with the source', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    await translate(page, 'Something to clear.')
    await expect(blocks(page).first()).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.getByTestId('translate-source')).toHaveValue('')
    await expect(blocks(page)).toHaveCount(0)
    await expect(page.getByTestId('translate-standby')).toBeVisible()
    await expect.poll(() => watching(page, 'translate')).toEqual(['board'])
  } finally {
    await close()
  }
})

test('the spine joins each block as it is translated, while the source is still being typed', async () => {
  const { page, close } = await launch(undefined, withModel('', true))
  try {
    const source = page.getByTestId('translate-source')
    await source.fill('First block.\n\nSecond block.\n\nThird block.')
    await expect(blocks(page).nth(2)).toHaveAttribute('data-st', 'done', { timeout: 15_000 })
    // Still in the textarea, never clicked out of it: the links are drawn all the same.
    await expect(source).toBeFocused()
    await expect(page.getByTestId('translate-node')).toHaveCount(3)
    // Each link starts at its own block: lower blocks, lower links.
    const tops = await page
      .getByTestId('translate-node')
      .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).getBoundingClientRect().top))
    expect(tops[1] ?? 0).toBeGreaterThan(tops[0] ?? 0)
    expect(tops[2] ?? 0).toBeGreaterThan(tops[1] ?? 0)
  } finally {
    await close()
  }
})

test('an agreement that could not be written keeps the licence page’s opening for its retry', async () => {
  const hf = await modelServer()
  const { app, page, close, userData } = await launch(undefined, {
    ...withModel(),
    env: { ...withModel().env, ELECDEX_HF_BASE_URL: hf.base },
  })
  const log = path.join(userData, 'translate', 'licence-consents.txt')
  try {
    await stubOpenExternal(app)
    await page.evaluate(() => window.elecdex.translate.openLicence('plamo'))
    // A folder where the log goes: the agreement cannot be written.
    mkdirSync(log, { recursive: true })
    const failed = await page.evaluate(() => window.elecdex.translate.consent('plamo3-2b-q4km'))
    expect(failed).toEqual({ problem: expect.stringMatching(/could not be written down/) })
    rmSync(log, { recursive: true, force: true })
    const retried = await page.evaluate(() => window.elecdex.translate.consent('plamo3-2b-q4km'))
    expect(retried).toEqual({ revision: COMMIT })
    // The retry says when the page was opened for it, not that it was not.
    expect(readFileSync(log, 'utf8')).toMatch(/opened from elecdex \d{4}-/)
  } finally {
    await close()
    stopServer(hf.server)
  }
})

test('ENGINE offers a newer commit once a day, and UPDATE agrees to it and replaces the file', async () => {
  const hf = await modelServer()
  // The model in place is the first release (by its size); Hugging Face now has a newer commit.
  const NEWER = 'e'.repeat(40)
  hf.commit = NEWER
  hf.body = Buffer.from(MODEL.map((byte) => (byte + 1) % 256))
  const { app, page, close, userData } = await launch(undefined, {
    ...withModel(),
    env: { ...withModel().env, ELECDEX_HF_BASE_URL: hf.base },
  })
  const asks = () => hf.asked.filter((url) => url.startsWith('/api/')).length
  const model = path.join(userData, 'translate', 'models', 'plamo3-2b-q4km', FILE)
  try {
    await page.getByTestId('translate-settings-toggle').click()
    await expect(page.getByTestId('translate-update')).toBeVisible()
    await expect(page.getByTestId('translate-engine')).toContainText('newer, 2026-11-06')
    expect(asks()).toBe(1)
    // Opened again the same day: nothing asked.
    await page.getByTestId('translate-settings-toggle').click()
    await page.getByTestId('translate-settings-toggle').click()
    await expect(page.getByTestId('translate-update')).toBeVisible()
    expect(asks()).toBe(1)
    // UPDATE goes through the licence, for the newer commit, and fetches it.
    await page.getByTestId('translate-update').click()
    const setup = page.getByTestId('translate-setup')
    await expect(setup.locator('.steps li.now')).toContainText('Licence')
    await expect(page.getByTestId('translate-agree')).toBeDisabled()
    await agree(page, app)
    await page.getByTestId('translate-next').click()
    await expect(page.getByTestId('translate-selftest')).toContainText('おはようございます。', {
      timeout: 30_000,
    })
    expect(files(hf)).toEqual([`/pfnet/plamo-3-translate-2b-GGUF/resolve/${NEWER}/${FILE}`])
    expect(readFileSync(model).equals(hf.body)).toBe(true)
    const engine = JSON.parse(readFileSync(path.join(userData, 'translate', 'engine.json'), 'utf8'))
    expect(engine.installed['plamo3-2b-q4km'].revision).toBe(NEWER)
    // Up to date: no UPDATE any more.
    await page.getByTestId('translate-next').click()
    await page.getByTestId('translate-settings-toggle').click()
    await expect(page.getByTestId('translate-engine')).toBeVisible()
    await expect(page.getByTestId('translate-update')).toHaveCount(0)
  } finally {
    await close()
    stopServer(hf.server)
  }
})

test('ENGINE sends a model chosen and not fetched to its setup, not back to TEXT', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    await page.getByTestId('translate-settings-toggle').click()
    const engine = page.getByTestId('translate-engine')
    await expect(page.getByTestId('translate-engine-done')).toHaveText('Done')
    await engine.getByRole('button', { name: '0.8B Q4_K_M' }).click()
    await expect(page.getByTestId('translate-engine-done')).toContainText('Set up this model')
    await expect(engine).toContainText('not fetched')
    await page.getByTestId('translate-engine-done').click()
    await expect(page.getByTestId('translate-setup')).toBeVisible()
    await expect(page.getByTestId('translate-setup').locator('.steps li.now')).toContainText(
      'Model',
    )
  } finally {
    await close()
  }
})

test('a model chosen in ENGINE is put back when the view is left without DONE', async () => {
  const { page, close, userData } = await launch(undefined, withModel())
  try {
    const pane = page.locator('[data-testid=pane]').first()
    await expect(pane).toContainText('plamo-3-translate-2b-q4km')
    await page.getByTestId('translate-settings-toggle').click()
    await page.getByTestId('translate-engine').getByRole('button', { name: '0.8B Q4_K_M' }).click()
    await expect(page.getByTestId('translate-engine-done')).toContainText('Set up this model')
    // Left by the settings button, neither DONE nor a fetch: nothing was chosen.
    await page.getByTestId('translate-settings-toggle').click()
    await expect(page.getByTestId('translate-text')).toBeVisible()
    await expect(pane).toContainText('plamo-3-translate-2b-q4km')
    const settings = JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8'))
    expect(settings.translate?.modelId ?? 'plamo3-2b-q4km').toBe('plamo3-2b-q4km')
    await page.getByTestId('translate-settings-toggle').click()
    await expect(page.getByTestId('translate-engine-done')).toHaveText('Done')
    await expect(page.getByTestId('translate-engine')).not.toContainText('not fetched')
  } finally {
    await close()
  }
})

test('DONE makes a model chosen in ENGINE, and fetched, the settings’', async () => {
  const given = withModel()
  const { page, close, userData } = await launch(undefined, {
    ...given,
    files: {
      ...given.files,
      [`translate/models/plamo3-0.8b-q4km/${LITE_FILE}`]: 'x'.repeat(MODEL.length),
    },
    env: { ...given.env, ELECDEX_TRANSLATE_MANIFEST: manifest(true) },
  })
  try {
    const pane = page.locator('[data-testid=pane]').first()
    await page.getByTestId('translate-settings-toggle').click()
    await page.getByTestId('translate-engine').getByRole('button', { name: '0.8B Q4_K_M' }).click()
    // In place: DONE, not its setup.
    await expect(page.getByTestId('translate-engine-done')).toHaveText('Done')
    await page.getByTestId('translate-engine-done').click()
    await expect(page.getByTestId('translate-text')).toBeVisible()
    await expect(pane).toContainText('plamo-3-translate-0.8b-q4km')
    await expect
      .poll(
        () =>
          JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8')).translate?.modelId,
      )
      .toBe('plamo3-0.8b-q4km')
  } finally {
    await close()
  }
})

test('a model chosen for SETUP becomes the settings’ only when its fetch starts', async () => {
  // The fetch stalls half way, so SETUP must stay on FETCH: the model before it is in place, and
  // a board not yet naming the new one once took that for the fetch done and opened READY.
  const hf = await modelServer()
  hf.mode = 'stall'
  const { app, page, close } = await launch(undefined, {
    ...withModel(),
    env: { ELECDEX_TRANSLATE_MANIFEST: manifest(true), ELECDEX_HF_BASE_URL: hf.base },
  })
  try {
    const pane = page.locator('[data-testid=pane]').first()
    await page.getByTestId('translate-settings-toggle').click()
    await page.getByTestId('translate-engine').getByRole('button', { name: '0.8B Q4_K_M' }).click()
    await page.getByTestId('translate-engine-done').click()
    await expect(page.getByTestId('translate-setup').locator('.steps li.now')).toContainText(
      'Model',
    )
    await page.getByTestId('translate-next').click()
    await expect(pane).toContainText('plamo-3-translate-2b-q4km')
    await agree(page, app)
    await page.getByTestId('translate-next').click()
    // Agreed and fetching: now it is the pane's model, and SETUP shows its fetch.
    await expect(pane).toContainText('plamo-3-translate-0.8b-q4km')
    const setup = page.getByTestId('translate-setup')
    await expect(setup.locator('.steps li.now')).toContainText('Fetch')
    await expect(setup).toContainText('downloading')
    await expect(page.getByTestId('translate-selftest')).toHaveCount(0)
    expect(files(hf)).toEqual([`/pfnet/plamo-3-translate-0.8b-GGUF/resolve/${COMMIT}/${LITE_FILE}`])
  } finally {
    await close()
    stopServer(hf.server)
  }
})

/** The source as blocks, scrolled to block 25 as a reader would be: its `.seg`. */
async function scrolledTo25(page: Page) {
  const many = Array.from({ length: 40 }, (_, i) => `Block ${i + 1} of the source.`).join('\n\n')
  await translate(page, many)
  await expect(blocks(page).nth(39)).toHaveAttribute('data-st', 'done', { timeout: 30_000 })
  const shown = page.getByTestId('translate-source-blocks')
  await expect(shown).toBeVisible()
  const seg = shown.locator('.seg[data-i="24"]')
  const top = await seg.evaluate((el) => (el as HTMLElement).offsetTop - 120)
  await page.locator('.side.src .text').evaluate((el, at) => {
    el.scrollTop = at
  }, top)
  return seg
}

/** Where a block's first line of text is on screen, in the blocks. */
const lineOf = (seg: Locator) =>
  seg.evaluate((el) => {
    // The first glyph's top, as it is drawn.
    const range = document.createRange()
    range.setStart(el.firstChild as Text, 0)
    range.setEnd(el.firstChild as Text, 1)
    return range.getClientRects()[0]?.top ?? Number.NaN
  })

/**
 * The editor: its selection, and where a block's first glyph is drawn: the mirror lays the text
 * out as the textarea does, so its glyph's place in the mirror, less the scroll, is the textarea's.
 */
const editorAt = (page: Page, index: number) =>
  page.getByTestId('translate-source').evaluate((el, i) => {
    const area = el as HTMLTextAreaElement
    const mirror = area.parentElement?.querySelector('.mirror') as HTMLElement
    const span = mirror.querySelector(`.mseg[data-i="${i}"]`) as HTMLElement
    const glyph = (span.getClientRects()[0]?.top ?? Number.NaN) - mirror.getBoundingClientRect().top
    return {
      start: area.selectionStart,
      end: area.selectionEnd,
      length: area.value.length,
      value: area.value,
      line: area.getBoundingClientRect().top + glyph - area.scrollTop,
    }
  }, index)

test('a click in the source opens the editor where it landed, the text not moving', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    const seg = await scrolledTo25(page)
    const before = await lineOf(seg)
    const rect = await seg.boundingBox()
    if (!rect) throw new Error('block 25 is not laid out')
    // On "Block 2|5 of …", well inside the text.
    await page.mouse.click(rect.x + 60, rect.y + rect.height / 2)
    await expect(page.getByTestId('translate-source')).toBeFocused()
    const at = await editorAt(page, 24)
    const blockStart = at.value.indexOf('Block 25 ')
    // The caret is in block 25, not at the end of the source.
    expect(at.start).toBe(at.end)
    expect(at.start).toBeGreaterThan(blockStart)
    expect(at.start).toBeLessThan(blockStart + 'Block 25 of the source.'.length)
    expect(at.start).not.toBe(at.length)
    // And its text is drawn where it was, to half a pixel.
    expect(Math.abs(at.line - before)).toBeLessThan(0.5)
  } finally {
    await close()
  }
})

test('a drag across two blocks keeps its selection, and the block it ended on stays put', async () => {
  const { page, close } = await launch(undefined, withModel())
  try {
    const from = await scrolledTo25(page)
    const to = page.getByTestId('translate-source-blocks').locator('.seg[data-i="25"]')
    const before = await lineOf(to)
    const a = await from.boundingBox()
    const b = await to.boundingBox()
    if (!a || !b) throw new Error('blocks 25 and 26 are not laid out')
    // From inside block 25 to inside block 26: the click goes to the blocks' box, not to a block.
    await page.mouse.move(a.x + 60, a.y + a.height / 2)
    await page.mouse.down()
    await page.mouse.move(b.x + 60, b.y + b.height / 2, { steps: 6 })
    await page.mouse.up()
    await expect(page.getByTestId('translate-source')).toBeFocused()
    const at = await editorAt(page, 25)
    expect(at.value.slice(at.start, at.end)).toMatch(/^\S* of the source\.\n\nBlock 2/)
    expect(Math.abs(at.line - before)).toBeLessThan(0.5)
  } finally {
    await close()
  }
})

test('the source being typed scrolls in its textarea alone, and the spine follows it', async () => {
  const { page, close } = await launch(undefined, withModel('', true))
  try {
    const source = page.getByTestId('translate-source')
    const many = Array.from({ length: 40 }, (_, i) => `Block ${i + 1}.`).join('\n\n')
    await source.fill(many)
    await expect(blocks(page).nth(39)).toHaveAttribute('data-st', 'done', { timeout: 30_000 })
    await expect(source).toBeFocused()
    // The mirror the spine measures is as tall as the text: the box around it must not scroll.
    const box = page.getByTestId('translate-text').locator('.text').first()
    const scroll = await box.evaluate((el) => el.scrollHeight - el.clientHeight)
    expect(scroll).toBeLessThanOrEqual(1)
    // Scrolled to its end, the textarea shows the last blocks, and their links sit inside it.
    await source.evaluate((el) => {
      el.scrollTop = el.scrollHeight
      el.dispatchEvent(new Event('scroll'))
    })
    const area = await source.boundingBox()
    const last = page.getByTestId('translate-node').last()
    await expect(last).toBeVisible()
    const node = await last.boundingBox()
    expect(node && area && node.y >= area.y - 4 && node.y <= area.y + area.height).toBe(true)
  } finally {
    await close()
  }
})
