import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every step of the type scale the renderer names is one tokens.css defines.
 *
 * A step that does not exist is not an error anywhere: `var()` falls back to
 * the inherited size, and the text comes out larger than meant. The
 * connections pane's credit named `--step--3` and was drawn at its parent's
 * size, larger than every other pane's credit.
 */

const RENDERER = path.join(import.meta.dirname, '../../src/renderer')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return files(full)
    return /\.(svelte|css|ts)$/.test(name) ? [full] : []
  })
}

describe('the type scale', () => {
  it('is only named by the steps tokens.css defines', () => {
    const tokens = readFileSync(path.join(RENDERER, 'styles/tokens.css'), 'utf8')
    const defined = new Set([...tokens.matchAll(/(--step-[-\d]+):/g)].map((m) => m[1]))
    expect(defined.size).toBeGreaterThan(5)
    const unknown: string[] = []
    for (const file of files(RENDERER)) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/var\((--step-[-\d]+)\)/g)) {
        if (!defined.has(m[1] ?? '')) unknown.push(`${path.relative(RENDERER, file)}: ${m[1]}`)
      }
    }
    expect(unknown).toEqual([])
  })

  it('is followed in em only where the parent is a size of its own choosing', () => {
    // Each of these sits in text whose size varies: a clock's or a readout's digits, a plugin
    // block's clamp, code in prose, the ELEC stage's plates. Under a fixed parent a size is a
    // step of the scale instead: the connections pane's 0.85em of --step--1 was --step--2 by
    // another name, and nothing stopped it going below the floor.
    const allowed = new Set([
      'plugins/Blocks.svelte',
      'widgets/aichat/Markdown.svelte',
      'widgets/common/DiffView.svelte',
      'widgets/common/Readout.svelte',
      'widgets/elec/Stage.svelte',
      'widgets/monitor/ClockWidget.svelte',
      'widgets/weather/WeatherWidget.svelte',
    ])
    const relative = files(RENDERER)
      .filter((file) => /font-size:\s*[\d.]+em\b/.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(RENDERER, file).split(path.sep).join('/'))
      .filter((file) => !allowed.has(file))
    expect(relative).toEqual([])
  })
})
