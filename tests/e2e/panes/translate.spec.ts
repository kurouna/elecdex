import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect } from '@playwright/test'
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

/** Serves the made-up model at its manifest path, with Range as Hugging Face does. */
async function modelServer(): Promise<{ server: Server; base: string; asked: string[] }> {
  const asked: string[] = []
  const server = createServer((req, res) => {
    asked.push(req.url ?? '')
    if (!req.url?.endsWith(`/${FILE}`)) {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(200, { 'content-length': String(MODEL.length) })
    res.end(MODEL)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return { server, base: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, asked }
}

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
    hf.server.close()
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
