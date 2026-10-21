import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from '@playwright/test'
import { launch, removeDir } from './support.js'

/**
 * What a plugin's worker could reach if code got past the transform (issue 29). A plugin runs in
 * a blob worker of the page, under the page's CSP. This looks from such a worker, made as the
 * plugin host makes one, at what the platform itself lets through - the transform aside.
 *
 * Measured 2026-10-21 (Electron 44): while the page was a file:// document, whose 'self' is the
 * file scheme, all three read the file - import() is syntax, which stripGlobals cannot take.
 * Served from app://elecdex, 'self' is the renderer's own files, and the disk is refused.
 */

test("a blob worker of the page cannot load the disk's files", async () => {
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
    expect(answers.json).toMatch(/^refused: /)
    expect(answers.module).toMatch(/^refused: /)
    expect(answers.fetch).toMatch(/^refused: /)
    // The page is its own origin, not a file.
    expect(page.url()).toBe('app://elecdex/index.html')
  } finally {
    await close()
    removeDir(dir)
  }
})
