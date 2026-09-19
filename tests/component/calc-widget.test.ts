import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: CalcWidget } = await import('../../src/renderer/widgets/calc/CalcWidget.svelte')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The calculator pane.
 *
 * The arithmetic is tested where it lives (shared/calc); what is checked here is
 * the instrument around it - the ghost answer while typing, the tape a line
 * lands on, the register a name goes into, and a refused line leaving the input
 * where it was so nothing typed is lost to an error.
 */

let state: Record<string, unknown>

beforeEach(() => {
  state = {}
  // The tally draws its histogram on a canvas; jsdom has neither of these.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      readonly #callback: () => void
      constructor(callback: () => void) {
        this.#callback = callback
      }
      observe() {
        this.#callback()
      }
      disconnect() {}
    },
  )
  vi.stubGlobal('elecdex', {
    layout: { load: vi.fn(), save: vi.fn(async () => undefined) },
  })
  // The pane writes its state through the layout store; keep the last write.
  vi.spyOn(layout, 'setPaneState').mockImplementation((_id, next) => {
    // IPC cannot clone a $state proxy, so a mock must copy as IPC would.
    state = structuredClone(next)
  })
})

afterEach(async () => {
  cleanup()
  await layout.flush()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

const input = (): HTMLInputElement => screen.getByTestId('calc-input') as HTMLInputElement

async function type(text: string): Promise<void> {
  await fireEvent.input(input(), { target: { value: text } })
  await settle()
}

async function enter(): Promise<void> {
  await fireEvent.keyDown(input(), { key: 'Enter' })
  await settle()
}

describe('CalcWidget', () => {
  it('shows the answer as it is typed, before anything is committed', async () => {
    render(CalcWidget, { props: { paneId: 'p', state: {} } as never })
    await type('1920*1080')
    expect(screen.getByTestId('calc-preview').textContent?.replace(/\s/g, '')).toBe('2,073,600')
    expect(state.tape).toBeUndefined()
  })

  it('reads a line typed with a Japanese keyboard', async () => {
    render(CalcWidget, { props: { paneId: 'p', state: {} } as never })
    await type('３百万÷12')
    expect(screen.getByTestId('calc-preview').textContent?.replace(/\s/g, '')).toBe('250,000')
  })

  it('puts a committed line on the tape and keeps the answer as ans', async () => {
    render(CalcWidget, { props: { paneId: 'p', state: {} } as never })
    await type('2+2')
    await enter()
    expect(state.ans).toBe(4)
    expect(state.tape).toEqual([{ src: '2+2', text: '4', grouped: '4', described: '4' }])
    expect(input().value).toBe('')
  })

  it('keeps a refused line where it is, and says why', async () => {
    render(CalcWidget, { props: { paneId: 'p', state: {} } as never })
    await type('1/0')
    await enter()
    expect(screen.getByTestId('calc-error').textContent).toContain('Division by zero')
    expect(input().value).toBe('1/0')
    expect(state.tape).toBeUndefined()
  })

  it('keeps a named value in the register row', async () => {
    const view = render(CalcWidget, { props: { paneId: 'p', state: {} } as never })
    await type('rate = 8 * percent')
    await enter()
    expect(state.vars).toEqual({ rate: 0.08 })

    await view.rerender({ paneId: 'p', state } as never)
    await settle()
    expect(screen.getByTestId('calc-register').getAttribute('data-name')).toBe('rate')
  })

  it('draws the bits of an integer when asked, and only then', async () => {
    const view = render(CalcWidget, { props: { paneId: 'p', state: { hex: true } } as never })
    await type('276')
    expect(screen.getByTestId('calc-bits').textContent?.replace(/\s/g, '')).toBe(
      '00000000000000000000000100010100',
    )

    await view.rerender({ paneId: 'p', state: { hex: false } } as never)
    await settle()
    expect(screen.queryByTestId('calc-bits')).toBeNull()
  })

  it('walks back through the tape with the up arrow', async () => {
    const view = render(CalcWidget, { props: { paneId: 'p', state: {} } as never })
    await type('7*6')
    await enter()
    await view.rerender({ paneId: 'p', state } as never)
    await settle()

    await fireEvent.keyDown(input(), { key: 'ArrowUp' })
    await settle()
    expect(input().value).toBe('7*6')
  })

  it('summarises a column of numbers in the tally', async () => {
    render(CalcWidget, { props: { paneId: 'p', state: { mode: 'tally' } } as never })
    await settle()
    await fireEvent.input(screen.getByTestId('calc-tally-input'), {
      target: { value: '10\n20\n30' },
    })
    await settle()
    const report = screen.getByTestId('calc-tally-report')
    expect(report.getAttribute('data-count')).toBe('3')
    expect(report.textContent).toContain('60')
  })
})
