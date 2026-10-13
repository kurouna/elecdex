import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The page's Content-Security-Policy is what really holds a plugin in its worker (docs/plugins.md
 * §4.2): no network but the page's own origin, no eval, workers only from blobs. Relaxing it means
 * auditing the plugins again, so it is held here, word for word.
 */
describe('the page CSP', () => {
  it('is exactly what the plugins were audited against', () => {
    const html = readFileSync('src/renderer/index.html', 'utf8')
    const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html)?.[1]
    expect(csp).toBe(
      "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src blob:",
    )
  })
})
