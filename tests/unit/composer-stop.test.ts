import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * STOP in a composer - the AI chat's, ELEC's, CODE's WRITE - is said in the warning colour's
 * words alone: its rule down the left stays the composer's own. A yellow rule there read as a
 * stray line (the user, 2026-11-23). The three stay alike.
 */

const COMPOSERS = [
  'widgets/aichat/AiChatWidget.svelte',
  'widgets/elec/ElecWidget.svelte',
  'widgets/elec16/WriteLine.svelte',
]

describe('STOP in a composer', () => {
  it('changes the colour of its words, never of its rule', () => {
    for (const file of COMPOSERS) {
      const text = readFileSync(path.resolve(__dirname, '../../src/renderer', file), 'utf8')
      const rule = /\.cmd\.stop\s*\{([^}]*)\}/.exec(text)?.[1] ?? ''
      expect(rule, file).toMatch(/color:\s*var\(--warn\)/)
      expect(rule, file).not.toMatch(/border|box-shadow|outline/)
    }
  })
})
