import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { cssNumber } from '../../src/renderer/lib/css-number.js'

const RENDERER = path.join(import.meta.dirname, '../../src/renderer')

const style = (vars: Record<string, string>) =>
  ({ getPropertyValue: (name: string) => vars[name] ?? '' }) as unknown as CSSStyleDeclaration

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    // Not .svelte-check, the type checker's copies of the components.
    if (name.startsWith('.')) return []
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return files(full)
    return /\.(svelte|ts)$/.test(name) ? [full] : []
  })
}

describe('a theme variable read as a number', () => {
  it('is 0 where the theme says 0, and the fallback only where it says nothing', () => {
    const paper = style({ '--accent-h': '0', '--accent-s': '0%', '--glow': ' 0.4 ' })
    expect(cssNumber(paper, '--accent-h', 183)).toBe(0)
    expect(cssNumber(paper, '--accent-s', 22)).toBe(0)
    expect(cssNumber(paper, '--glow', 0)).toBe(0.4)
    expect(cssNumber(paper, '--accent-l', 74)).toBe(74)
    expect(cssNumber(style({ '--accent-l': 'auto' }), '--accent-l', 74)).toBe(74)
  })

  it('is never read with `||`, which takes a 0 for a missing variable', () => {
    const found: string[] = []
    for (const file of files(RENDERER)) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/parseFloat\((?:[^()]|\([^()]*\))*getPropertyValue[^\n]*\|\|/g))
        found.push(`${path.relative(RENDERER, file)}: ${m[0]}`)
    }
    expect(found).toEqual([])
  })
})
