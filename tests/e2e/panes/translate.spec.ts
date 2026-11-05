import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, type Page } from '@playwright/test'
import { test } from '../support/shared.js'
import { launch, single, watching } from '../support.js'

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

interface ModelServer {
  server: Server
  base: string
  asked: string[]
  /** 'stall': half the file, then nothing, as a download under way when PAUSE or CANCEL comes. */
  mode: 'serve' | 'stall'
}

/** Serves the made-up model at its manifest path. */
async function modelServer(): Promise<ModelServer> {
  const state: ModelServer = { server: createServer(), base: '', asked: [], mode: 'serve' }
  state.server.on('request', (req, res) => {
    state.asked.push(req.url ?? '')
    if (!req.url?.endsWith(`/${FILE}`)) {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(200, { 'content-length': String(MODEL.length) })
    if (state.mode === 'stall') {
      res.write(MODEL.subarray(0, MODEL.length / 2))
      return
    }
    res.end(MODEL)
  })
  await new Promise<void>((resolve) => state.server.listen(0, '127.0.0.1', resolve))
  state.base = `http://127.0.0.1:${(state.server.address() as AddressInfo).port}`
  return state
}

const stopServer = (server: Server): void => {
  server.closeAllConnections()
  server.close()
}

/** SETUP up to its FETCH step with the 2B model, the licence agreed to. */
async function setupToFetch(page: Page): Promise<void> {
  await page.getByTestId('translate-setup-open').click()
  await page.getByTestId('translate-next').click()
  await page.getByTestId('translate-model-standard').click()
  await page.getByTestId('translate-next').click()
  await page.getByTestId('translate-agree').click()
  await page.getByTestId('translate-next').click()
}

/** The footer's engine lamp: its word. */
const lamp = (page: Page) => page.getByTestId('translate-pane').locator('.foot .lampw')

function manifest(): string {
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
      ],
    }),
  )
  return file
}

test('SETUP fetches the model, checks it, and READY translates through the engine', async () => {
  const hf = await modelServer()
  const { page, close, userData } = await launch(undefined, {
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
    // LICENCE: nothing goes before the licence is agreed to.
    await expect(page.getByTestId('translate-next')).toBeDisabled()
    await page.getByTestId('translate-agree').click()
    await page.getByTestId('translate-next').click()

    // FETCH, then READY by itself, with the self test through the engine.
    await expect(page.getByTestId('translate-selftest')).toContainText('おはようございます。', {
      timeout: 30_000,
    })
    expect(hf.asked).toEqual([`/pfnet/plamo-3-translate-2b-GGUF/resolve/abcdef1/${FILE}`])
    expect(existsSync(path.join(userData, 'translate', 'models', 'plamo3-2b-q4km', FILE))).toBe(
      true,
    )
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
  const { page, close, userData } = await launch(undefined, {
    layout: single('translate'),
    env: { ELECDEX_TRANSLATE_MANIFEST: manifest(), ELECDEX_HF_BASE_URL: hf.base },
  })
  const part = path.join(userData, 'translate', 'models', 'plamo3-2b-q4km', `${FILE}.part`)
  try {
    await setupToFetch(page)
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
  const { page, close, userData } = await launch(undefined, {
    layout: single('translate'),
    env: { ELECDEX_TRANSLATE_MANIFEST: manifest(), ELECDEX_HF_BASE_URL: hf.base },
  })
  const part = path.join(userData, 'translate', 'models', 'plamo3-2b-q4km', `${FILE}.part`)
  try {
    await setupToFetch(page)
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
