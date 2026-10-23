import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * A fixed wait in an e2e test either waits for something that has a signal - a file written, a
 * pane drawn, a counter moved - and should wait on that instead, or proves that nothing happens,
 * which `quietFor` (tests/e2e/support/quiet.ts) names. What is left is a wait with a reason no
 * signal serves (a frame of the 10 fps loop, a debounce the page cannot see), and each one says
 * so: a `// wait:` comment on its line or within the two above (docs/e2e-design.md, section 4).
 */

const E2E = fileURLToPath(new URL('../e2e/', import.meta.url))

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sources(full)
    return entry.name.endsWith('.ts') ? [full] : []
  })
}

/** `page.waitForTimeout(…)`, and a promise that only sleeps: `setTimeout(resolve, …)`. */
const FIXED_WAIT =
  /\.waitForTimeout\(|setTimeout\(\s*(?:resolve|res|r|done)\s*,|setTimeout\(\s*\(\)\s*=>\s*(?:resolve|res|r|done)\(\)\s*,/

/** Every fixed wait in the e2e sources with no reason given, as `file:line`. */
function unexplainedWaits(files: { name: string; text: string }[]): string[] {
  const found: string[] = []
  for (const { name, text } of files) {
    const lines = text.split(/\r?\n/)
    lines.forEach((line, i) => {
      if (!FIXED_WAIT.test(line)) return
      const near = lines.slice(Math.max(0, i - 2), i + 1)
      if (!near.some((l) => /\/\/ wait: \S/.test(l))) found.push(`${name}:${i + 1}`)
    })
  }
  return found
}

describe('fixed waits in the e2e tests', () => {
  it('each say why no signal serves', () => {
    const files = sources(E2E).map((file) => ({
      name: path.relative(E2E, file).replaceAll('\\', '/'),
      text: readFileSync(file, 'utf8'),
    }))
    expect(files.length).toBeGreaterThan(40)
    expect(unexplainedWaits(files)).toEqual([])
  })

  it('are found in every form a test sleeps', () => {
    const text = [
      'await page.waitForTimeout(500)',
      'await new Promise((resolve) => setTimeout(resolve, 200))',
      'await new Promise((r) => setTimeout(() => r(), 50))',
      '// wait: a frame of the 10 fps loop',
      'await page.waitForTimeout(120)',
      'const timer = setTimeout(() => reject(new Error("timeout")), 25_000)',
    ].join('\n')
    expect(unexplainedWaits([{ name: 'x.ts', text }])).toEqual(['x.ts:1', 'x.ts:2', 'x.ts:3'])
  })
})
