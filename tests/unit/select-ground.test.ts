import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * A `<select>`'s list is drawn by the system from the select's and its options' backgrounds: a
 * transparent one (`transparent`, or `--panel-bg`, which tokens.css makes transparent) shows the
 * list white with the theme's light text on it, unreadable on every dark theme. Found in CODE's
 * WRITE line and its file list. Every component with a select whose ground is transparent gives
 * its options an opaque one, and no option is given a transparent one.
 */

const root = path.resolve(__dirname, '../../src/renderer')

function svelteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return svelteFiles(full)
    return name.endsWith('.svelte') ? [full] : []
  })
}

const TRANSPARENT = /background(-color)?\s*:\s*(transparent|var\(--panel-bg\))/
const OPAQUE = /background(-color)?\s*:\s*(?!transparent|var\(--panel-bg\))[^;]+/

/** The CSS rules of a component's style block, as selector and body. */
function rules(text: string): { selector: string; body: string }[] {
  const style = /<style[^>]*>([\s\S]*?)<\/style>/.exec(text)?.[1] ?? ''
  return [...style.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: (m[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '').trim(),
    body: m[2] ?? '',
  }))
}

describe('the ground of a select’s list', () => {
  it('is opaque wherever a select is drawn on a transparent one', () => {
    const wrong: string[] = []
    for (const file of svelteFiles(root)) {
      const text = readFileSync(file, 'utf8')
      if (!/<select\b/.test(text)) continue
      const all = rules(text)
      const options = all.filter((r) => /\boption\b/.test(r.selector))
      const name = path.relative(root, file).replace(/\\/g, '/')
      for (const r of options) {
        if (TRANSPARENT.test(r.body)) wrong.push(`${name}: ${r.selector} is transparent`)
      }
      const clearSelect = all.some(
        (r) => /(^|[\s,])select\b(?!\s*option)/.test(r.selector) && TRANSPARENT.test(r.body),
      )
      if (clearSelect && !options.some((r) => OPAQUE.test(r.body))) {
        wrong.push(`${name}: a transparent select with no opaque option`)
      }
    }
    expect(wrong).toEqual([])
  })
})
