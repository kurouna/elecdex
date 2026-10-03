import { sourceToMachine } from '@shared/elec16/charset'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LevelResult } from '../../src/renderer/widgets/elec16/code/protocol.ts'

/**
 * CODE's view (widgets/elec16/CodeView.svelte) against a compiler the test answers by hand:
 * a build is for the file it was asked for, and one that comes back after the view moved to
 * another file is not shown there - nor run by RUN.
 */

let answer: ((levels: LevelResult[]) => void) | null = null

vi.mock('../../src/renderer/widgets/elec16/code/compiler.ts', () => ({
  holdCompiler: () => () => {},
  compileCode: () =>
    new Promise<LevelResult[]>((resolve) => {
      answer = resolve
    }),
}))

const { default: CodeView } = await import('../../src/renderer/widgets/elec16/CodeView.svelte')

const SOURCES: Record<string, string> = {
  'MAIN.TS': 'export function main(): void { cls() }',
  'OTHER.TS': 'export function main(): void { putc(65) }',
}

const built = (asm: string): LevelResult[] =>
  ([0, 1, 2] as const).map((level) => ({
    level,
    asm,
    errors: [],
    image: new Uint8Array([1, 2, 3]),
    measured: { cycles: 10, end: 'returned' as const },
  }))

beforeEach(() => {
  answer = null
  // Motion reduced: a press acts at once, without its blink.
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  vi.stubGlobal('elecdex', {
    elec16: {
      files: vi.fn(async () =>
        Object.keys(SOURCES).map((name) => ({ name, size: 1, modified: 0 })),
      ),
      readFile: vi.fn(async (_unit: string, name: string) => {
        const made = sourceToMachine(SOURCES[name] ?? '')
        return 'bytes' in made ? made.bytes : null
      }),
      writeFile: vi.fn(async () => 0),
    },
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const props = (file: string) => ({
  unit: 'u1',
  rom: new Uint8Array(4),
  file,
  level: 0 as const,
  onfile: () => {},
  onlevel: () => {},
  ongive: vi.fn(),
})

async function settle(): Promise<void> {
  for (let k = 0; k < 6; k++) await tick()
}

describe("CODE's view", () => {
  it('drops a build that comes back after another file was opened', async () => {
    const view = render(CodeView, props('MAIN.TS'))
    await settle()
    await fireEvent.click(screen.getByTestId('elec16-compile'))
    // The press blinks before it acts.
    await vi.waitFor(() => expect(answer).not.toBeNull())
    await view.rerender(props('OTHER.TS'))
    await settle()
    answer?.(built('; MAIN.TS built'))
    await settle()
    expect(screen.getByTestId('elec16-asm').textContent).not.toContain('MAIN.TS built')
    expect(screen.queryByTestId('elec16-levels')).toBeNull()
    expect((screen.getByTestId('elec16-run') as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows a build that comes back for the file still open', async () => {
    render(CodeView, props('MAIN.TS'))
    await settle()
    await fireEvent.click(screen.getByTestId('elec16-compile'))
    await vi.waitFor(() => expect(answer).not.toBeNull())
    answer?.(built('; MAIN.TS built'))
    await settle()
    expect(screen.getByTestId('elec16-asm').textContent).toContain('MAIN.TS built')
    expect((screen.getByTestId('elec16-run') as HTMLButtonElement).disabled).toBe(false)
  })
})
