import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from '@playwright/test'
import { launch, removeDir } from './support.js'

/**
 * What a plugin's worker could reach if code got past the transform (issue 29). A plugin runs in
 * a blob worker of the page, under the page's CSP; the page is a file:// document, so 'self' is
 * the file scheme. This looks from such a worker, made as the plugin host makes one, at what
 * the platform itself lets through - the transform aside.
 *
 * Measured 2026-10-21 (Electron 44): all three read the file. fetch is taken from a plugin's
 * worker (stripGlobals), but import() is syntax and cannot be: what keeps a plugin off the disk
 * is the transform turning every import() into require and `checkNoImport` refusing any left.
 * Serving the page from a scheme of its own (issue 29's last step) would turn these to refused.
 */

test("a blob worker of the page can load the disk's files, so plugins' code is checked", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-probe-'))
  const json = path.join(dir, 'secret.json')
  const js = path.join(dir, 'secret.mjs')
  writeFileSync(json, '{"secret":"json"}')
  writeFileSync(js, 'export const secret = "module"\n')
  const { page, close } = await launch()
  try {
    const answers = await page.evaluate(
      async ({ jsonUrl, jsUrl }) => {
        const source = `
          const tries = {
            json: () => import(${JSON.stringify(jsonUrl)}, { with: { type: 'json' } }).then((m) => m.default.secret),
            module: () => import(${JSON.stringify(jsUrl)}).then((m) => m.secret),
            fetch: () => fetch(${JSON.stringify(jsonUrl)}).then((r) => r.text()),
          }
          ;(async () => {
            const out = {}
            for (const [name, run] of Object.entries(tries)) {
              try { out[name] = 'read: ' + (await run()) } catch (e) { out[name] = 'refused: ' + (e && e.name) }
            }
            postMessage(out)
          })()
        `
        const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }))
        const worker = new Worker(url)
        try {
          return await new Promise<Record<string, string>>((resolve, reject) => {
            worker.onmessage = (event) => resolve(event.data as Record<string, string>)
            worker.onerror = (event) => reject(new Error(event.message))
            setTimeout(() => reject(new Error('no answer')), 10_000)
          })
        } finally {
          worker.terminate()
          URL.revokeObjectURL(url)
        }
      },
      { jsonUrl: pathToFileURL(json).href, jsUrl: pathToFileURL(js).href },
    )
    expect(answers).toEqual({
      json: 'read: json',
      module: 'read: module',
      fetch: 'read: {"secret":"json"}',
    })
  } finally {
    await close()
    removeDir(dir)
  }
})
