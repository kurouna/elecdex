import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The CHIP-8 core and the emulator helpers stand on their own (docs/architecture.md
 * section 5.18): the page runs them, main runs them for previews, and vitest runs them
 * as they are. So they import nothing but each other - shared/chip8 may use shared/emu,
 * shared/emu uses nothing - and they touch no DOM, no Node and no clock of their own.
 * A pane that wants more wraps them; it does not reach into them.
 */

const root = path.resolve(__dirname, '..', '..', 'src', 'shared')
const sources = (folder: string): [string, string][] =>
  readdirSync(path.join(root, folder))
    .filter((name) => name.endsWith('.ts'))
    .map((name) => [`${folder}/${name}`, readFileSync(path.join(root, folder, name), 'utf8')])

const specifiers = (text: string): string[] =>
  [...text.matchAll(/^\s*(?:import|export)\b[^'"]*?from\s+['"]([^'"]+)['"]/gm)].map(
    (m) => m[1] ?? '',
  )

/** Globals that would tie the core to a page, to Node or to the wall clock. */
const FORBIDDEN =
  /\b(window|document|globalThis|process|require|setTimeout|setInterval|requestAnimationFrame|performance|Date\.now|Math\.random)\b/

describe('the emulator core', () => {
  it('shared/chip8 imports only itself and shared/emu', () => {
    for (const [file, text] of sources('chip8')) {
      for (const spec of specifiers(text)) {
        expect(spec.startsWith('./') || spec.startsWith('../emu/'), `${file} imports ${spec}`).toBe(
          true,
        )
      }
    }
  })

  it('shared/emu imports nothing', () => {
    for (const [file, text] of sources('emu')) {
      for (const spec of specifiers(text))
        expect(spec.startsWith('./'), `${file} imports ${spec}`).toBe(true)
    }
  })

  it('touches no DOM, no Node, no timer and no clock or randomness of its own', () => {
    for (const [file, text] of [...sources('chip8'), ...sources('emu')]) {
      // Comments may name what the code does not use.
      const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      expect(code.match(FORBIDDEN)?.[0], file).toBeUndefined()
    }
  })
})
