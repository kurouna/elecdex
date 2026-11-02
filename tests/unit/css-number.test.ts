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

/**
 * A number read with `||` after it: straight from `getPropertyValue`, or through a reader of a
 * widget's own that is handed the variable's name (`read('--accent-h')`).
 */
const OR_READS = [
  /parseFloat\((?:[^()]|\([^()]*\))*getPropertyValue[^\n]*\|\|/g,
  /parseFloat\([^;\n]*--[a-z-]+[^;\n]*\)\s*\|\|/g,
]
const orReads = (text: string): string[] =>
  OR_READS.flatMap((pattern) => [...text.matchAll(pattern)].map((m) => m[0]))

describe('a theme variable read as a number', () => {
  it('is 0 where the theme says 0, and the fallback only where it says nothing', () => {
    const paper = style({ '--accent-h': '0', '--accent-s': '0%', '--glow': ' 0.4 ' })
    expect(cssNumber(paper, '--accent-h', 183)).toBe(0)
    expect(cssNumber(paper, '--accent-s', 22)).toBe(0)
    expect(cssNumber(paper, '--glow', 0)).toBe(0.4)
    expect(cssNumber(paper, '--accent-l', 74)).toBe(74)
    expect(cssNumber(style({ '--accent-l': 'auto' }), '--accent-l', 74)).toBe(74)
  })

  it('finds every way it was once read with `||`', () => {
    // The globe's, the terminal's and the network path's, as they were.
    expect(orReads('Number.parseFloat(style.getPropertyValue(name)) || fallback')).toHaveLength(1)
    expect(orReads("hue: Number.parseFloat(read('--accent-h')) || 183,")).toHaveLength(1)
    expect(orReads("glow: Number.parseFloat(read('--glow', '0')) || 0,")).toHaveLength(1)
    // A colour read with `||` is a string's fallback, where an empty one is what is missing.
    expect(orReads("foreground: read('--text') || '#aacfd1',")).toEqual([])
  })

  it('is never read with `||`, which takes a 0 for a missing variable', () => {
    const found = files(RENDERER).flatMap((file) =>
      orReads(readFileSync(file, 'utf8')).map((m) => `${path.relative(RENDERER, file)}: ${m}`),
    )
    expect(found).toEqual([])
  })
})
