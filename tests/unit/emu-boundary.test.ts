import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The emulators' cores and their shared helpers stand on their own (docs/emu.md): the page
 * runs them, main runs them for previews and checks, and vitest runs them as they are. So a
 * machine's core imports nothing but itself and shared/emu, shared/emu imports nothing, and
 * none of them touches the DOM, Node or a clock or randomness of its own. A pane that wants
 * more wraps them; it does not reach into them. The page's shared part (widgets/emu) knows
 * no machine: a machine's widgets build on it, never the other way round.
 */

/** Every machine with a core under src/shared. A new emulator adds its folder here. */
const MACHINES = ['chip8', 'elec16']

const shared = path.resolve(__dirname, '..', '..', 'src', 'shared')
const widgets = path.resolve(__dirname, '..', '..', 'src', 'renderer', 'widgets')

const sources = (root: string, folder: string): [string, string][] =>
  readdirSync(path.join(root, folder))
    .filter((name) => /\.(ts|svelte)$/.test(name))
    .map((name) => [`${folder}/${name}`, readFileSync(path.join(root, folder, name), 'utf8')])

const specifiers = (text: string): string[] =>
  [...text.matchAll(/^\s*(?:import|export)\b[^'"]*?from\s+['"]([^'"]+)['"]/gm)].map(
    (m) => m[1] ?? '',
  )

/** Globals that would tie a core to a page, to Node or to the wall clock. */
const FORBIDDEN =
  /\b(window|document|globalThis|process|require|setTimeout|setInterval|requestAnimationFrame|performance|Date\.now|Math\.random)\b/

describe('the emulator cores', () => {
  it.each(MACHINES)('shared/%s imports only itself and shared/emu', (machine) => {
    for (const [file, text] of sources(shared, machine)) {
      for (const spec of specifiers(text)) {
        expect(spec.startsWith('./') || spec.startsWith('../emu/'), `${file} imports ${spec}`).toBe(
          true,
        )
      }
    }
  })

  it('shared/emu imports nothing', () => {
    for (const [file, text] of sources(shared, 'emu')) {
      for (const spec of specifiers(text))
        expect(spec.startsWith('./'), `${file} imports ${spec}`).toBe(true)
    }
  })

  it('touches no DOM, no Node, no timer and no clock or randomness of its own', () => {
    for (const [file, text] of [
      ...MACHINES.flatMap((machine) => sources(shared, machine)),
      ...sources(shared, 'emu'),
    ]) {
      // Comments may name what the code does not use.
      const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      expect(code.match(FORBIDDEN)?.[0], file).toBeUndefined()
    }
  })

  it("the page's shared part, widgets/emu, knows no machine", () => {
    for (const [file, text] of sources(widgets, 'emu')) {
      for (const spec of specifiers(text)) {
        const machine = MACHINES.find(
          (name) => spec.includes(`/${name}/`) || spec.startsWith(`@shared/${name}`),
        )
        expect(machine, `${file} imports ${spec}`).toBeUndefined()
      }
    }
  })
})
