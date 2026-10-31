import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every animation that overexposes a picture does it `--crt-glare` strong, which a light theme
 * sets to 0 (tokens.css).
 *
 * Brightness on a pale ground is no glow: a tab brought forward turned its pane white for
 * 200 ms on Paper, and so did a fresh digit, a diff line, an agent's step and ORBIT's reading,
 * each with a `brightness()` of its own written into its keyframes.
 */

const RENDERER = path.join(import.meta.dirname, '../../src/renderer')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    // Not .svelte-check, the type checker's copies of the components.
    if (name.startsWith('.')) return []
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return files(full)
    return /\.(svelte|css)$/.test(name) ? [full] : []
  })
}

/** The bodies of the @keyframes rules in a stylesheet, brace-matched. */
function keyframes(text: string): { name: string; body: string }[] {
  const found: { name: string; body: string }[] = []
  for (const m of text.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
    let depth = 1
    let i = (m.index ?? 0) + m[0].length
    const start = i
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth += 1
      else if (text[i] === '}') depth -= 1
      i += 1
    }
    found.push({ name: m[1] ?? '', body: text.slice(start, i - 1) })
  }
  return found
}

describe('overexposure in animations', () => {
  it('finds the keyframes it reads', () => {
    const crt = keyframes(readFileSync(path.join(RENDERER, 'styles/crt.css'), 'utf8'))
    expect(crt.map((k) => k.name)).toContain('crt-flicker')
    expect(crt.find((k) => k.name === 'crt-flicker')?.body).toContain('brightness(')
  })

  it('is --crt-glare strong in every keyframe that brightens', () => {
    const literal: string[] = []
    for (const file of files(RENDERER)) {
      for (const { name, body } of keyframes(readFileSync(file, 'utf8'))) {
        for (const m of body.matchAll(/brightness\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)) {
          const value = m[1] ?? ''
          // A darkening (below 1) whitens nothing; a glare scaled by the token is what is wanted.
          if (value.includes('var(--crt-glare') || Number(value) <= 1) continue
          literal.push(`${path.relative(RENDERER, file)} @keyframes ${name}: brightness(${value})`)
        }
      }
    }
    expect(literal).toEqual([])
  })

  it('is none on a light theme', () => {
    const tokens = readFileSync(path.join(RENDERER, 'styles/tokens.css'), 'utf8')
    const light = /:root\[data-mode="light"\]\s*\{([^}]*)\}/.exec(tokens)?.[1] ?? ''
    expect(light).toMatch(/--crt-glare:\s*0;/)
  })
})
