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
  // The pane writes only what changed through the layout store; merge it into
  // what is held, as the store does, removing a key set to undefined.
  vi.spyOn(layout, 'patchPaneState').mockImplementation((_id, patch) => {
    // IPC cannot clone a $state proxy, so a mock must copy as IPC would.
    const next = { ...state, ...structuredClone(patch) }
    for (const [key, value] of Object.entries(patch)) if (value === undefined) delete next[key]
    state = next
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

  it('opens its help from the keyboard, but only on an empty line', async () => {
    render(CalcWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.keyDown(input(), { key: '?' })
    await settle()
    expect(screen.getByTestId('calc-help')).toBeTruthy()

    await fireEvent.keyDown(input(), { key: 'Escape' })
    await settle()
    expect(screen.queryByTestId('calc-help')).toBeNull()

    // Typed into an expression, "?" is a character like any other.
    await type('1+')
    await fireEvent.keyDown(input(), { key: '?' })
    await settle()
    expect(screen.queryByTestId('calc-help')).toBeNull()
  })

  it('clears the line, then the tape', async () => {
    const view = render(CalcWidget, { props: { paneId: 'p', state: {} } as never })
    await type('2+2')
    await enter()
    await view.rerender({ paneId: 'p', state } as never)
    await settle()

    await type('99')
    await fireEvent.click(screen.getByTestId('calc-clear'))
    await settle()
    expect(input().value).toBe('')
    expect((state.tape as unknown[]).length).toBe(1)

    // With nothing on the line, the same button clears the tape.
    await fireEvent.click(screen.getByTestId('calc-clear'))
    await settle()
    expect(state.tape).toEqual([])
  })

  it('takes a figure out of the tally into the calculator', async () => {
    render(CalcWidget, { props: { paneId: 'p', state: { mode: 'tally' } } as never })
    await settle()
    await fireEvent.input(screen.getByTestId('calc-tally-input'), {
      target: { value: ['10', '20', '30'].join(String.fromCharCode(10)) },
    })
    await settle()

    const sum = screen
      .getAllByTestId('calc-tally-figure')
      .find((el) => el.getAttribute('data-label') === 'sum')
    expect(sum).toBeTruthy()
    await fireEvent.click(sum as HTMLElement)
    await settle()
    expect(state.mode).toBe('calc')
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
