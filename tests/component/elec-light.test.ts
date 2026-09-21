import type { Ballot, ElecEvent, ElecLive, Session } from '@shared/elec'
import { defaultSettings } from '@shared/settings'
import { cleanup, render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: ElecWidget } = await import('../../src/renderer/widgets/elec/ElecWidget.svelte')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { HOLD_MS, PACKETS_PER_UNIT } = await import('../../src/renderer/widgets/elec/light.ts')

/**
 * The council's light against a hand-driven main: the packets an answer's pieces put on its
 * spoke, the hold between the last vote and the resolution, who steps back after it, and the
 * power-off when the pane goes back to standby.
 */

const ID = '3f3a0000-0000-4000-8000-000000000001'

const session = (ballots: Ballot[] = []): Session => ({
  version: 1,
  id: ID,
  title: 'Ship it?',
  motion: 'Ship it?',
  createdAt: 1000,
  updatedAt: 1000,
  rule: 'majority',
  rounds: 1,
  seats: [
    { providerId: 'local', provider: 'Local', model: 'a' },
    { providerId: 'local', provider: 'Local', model: 'b' },
    { providerId: 'local', provider: 'Local', model: 'c' },
  ],
  ballots,
})

const ballot = (unit: 0 | 1 | 2, verdict: Ballot['verdict']): Ballot => ({
  id: `b${unit}`,
  unit,
  round: 1,
  text: `So it is.\nVERDICT: ${String(verdict).toUpperCase()}\nCONFIDENCE: 70`,
  verdict,
  confidence: 70,
  at: 2000 + unit,
  ms: 500,
  model: 'a',
})

const DECIDED = [ballot(0, 'approve'), ballot(1, 'reject'), ballot(2, 'approve')]

const sitting = (text = ''): ElecLive => ({
  round: 1,
  runs: [
    {
      id: 'run-0',
      unit: 0,
      round: 1,
      text,
      thinking: '',
      provider: 'Local',
      model: 'a',
      startedAt: 1500,
    },
  ],
})

let handlers: Array<(event: ElecEvent) => void>
let setPaneState: ReturnType<typeof vi.spyOn>

const send = (event: ElecEvent): void => {
  for (const handler of [...handlers]) handler(event)
  flushSync()
}
const snapshot = (live: ElecLive | null, ballots: Ballot[] = []): void =>
  send({ type: 'snapshot', sessionId: ID, session: session(ballots), live })
let received = 0
const piece = (text: string): void => {
  send({
    type: 'delta',
    sessionId: ID,
    runId: 'run-0',
    textAt: received,
    text,
    thinkingAt: 0,
    thinking: '',
  })
  received += text.length
}

const props = (state: Record<string, unknown> = { session: ID }) => ({
  paneId: 'e',
  title: 'elec',
  props: undefined,
  state,
  active: true,
})

const stage = (): HTMLElement => screen.getByTestId('elec-stage')
const unit = (n: number): HTMLElement => {
  const found = screen.getAllByTestId('elec-unit').find((el) => el.dataset.unit === String(n))
  if (!found) throw new Error(`no unit ${n}`)
  return found
}

beforeEach(() => {
  vi.useFakeTimers()
  handlers = []
  received = 0
  // The light is drawn in the board's pixels: a board with a size, as a laid-out pane has.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private readonly report: ResizeObserverCallback
      constructor(report: ResizeObserverCallback) {
        this.report = report
      }
      observe(): void {
        const entry = { contentRect: { width: 900, height: 400 } } as ResizeObserverEntry
        this.report([entry], this as unknown as ResizeObserver)
      }
      disconnect(): void {}
    },
  )
  // jsdom has no Web Animations: enough of one for a transition to run its length and end.
  Element.prototype.animate = function animate(_frames, options) {
    const animation = { onfinish: null as (() => void) | null, cancel() {}, currentTime: 0 }
    const length = typeof options === 'number' ? options : Number(options?.duration ?? 0)
    setTimeout(() => animation.onfinish?.(), length)
    return animation as unknown as Animation
  }
  vi.stubGlobal('elecdex', {
    elec: {
      sessions: vi.fn(async () => []),
      onSessions: vi.fn(() => () => {}),
      active: vi.fn(async () => []),
      submit: vi.fn(async () => ({ ok: true, sessionId: ID })),
      stop: vi.fn(),
      remove: vi.fn(async () => true),
      export: vi.fn(async () => undefined),
      subscribe: vi.fn((_id: string, handler: (event: ElecEvent) => void) => {
        handlers.push(handler)
        return () => {
          handlers = handlers.filter((h) => h !== handler)
        }
      }),
    },
  })
  setPaneState = vi.spyOn(layout, 'setPaneState').mockImplementation(() => {})
  appearance.settings = {
    ...defaultSettings(),
    // Said outright, so the store does not ask the system (jsdom has no matchMedia).
    motion: 'full',
    sound: { enabled: false, volume: 0 },
    ai: {
      systemPrompt: '',
      compact: false,
      providers: [
        {
          id: 'local',
          name: 'Local',
          kind: 'openai',
          baseUrl: 'http://localhost:11434/v1',
          model: 'a',
        },
      ],
    },
  }
})

afterEach(() => {
  cleanup()
  setPaneState.mockRestore()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(Element.prototype, 'animate')
})

describe("the council's light", () => {
  it('puts a packet on the spoke for a piece of the answer, and only as many as the spoke carries', () => {
    render(ElecWidget, { props: props() })
    flushSync()
    snapshot(sitting())
    expect(unit(0).dataset.state).toBe('tx')
    expect(screen.queryAllByTestId('elec-packet')).toHaveLength(0)
    expect(screen.queryByTestId('elec-lock')).toBeNull()

    // The first piece: the carrier is caught, and the piece runs down the spoke.
    piece('So ')
    expect(unit(0).dataset.state).toBe('rx')
    expect(screen.getByTestId('elec-lock')).toBeTruthy()
    expect(screen.getAllByTestId('elec-packet')).toHaveLength(1)

    // Main sends ten a second; the spoke shows no more than it carries.
    for (let i = 0; i < 30; i++) {
      vi.advanceTimersByTime(100)
      piece('it ')
    }
    expect(screen.getAllByTestId('elec-packet').length).toBeLessThanOrEqual(PACKETS_PER_UNIT)

    // A packet is gone when its run ends.
    const [first] = screen.getAllByTestId('elec-packet')
    first?.dispatchEvent(new Event('animationend'))
    flushSync()
    expect(screen.queryAllByTestId('elec-packet')).not.toContain(first)
  })

  it("keeps the flash of a vote landing to its plate's outline, not the box around it", () => {
    render(ElecWidget, { props: props() })
    flushSync()
    snapshot(null, DECIDED)
    for (const n of [0, 1, 2]) {
      expect(unit(n).querySelector('.flash')).not.toBeNull()
      expect(unit(n).style.getPropertyValue('--plate-clip')).toMatch(/^polygon\(/)
    }
    // The lower plates lose the corner that faces the core: the clip is not the whole box.
    expect(unit(0).style.getPropertyValue('--plate-clip')).toContain('85% 0%')
  })

  it('shows no packet for an answer already under way when the pane is mounted', () => {
    render(ElecWidget, { props: props() })
    flushSync()
    snapshot(sitting('So it '))
    expect(unit(0).dataset.state).toBe('rx')
    expect(screen.queryAllByTestId('elec-packet')).toHaveLength(0)
  })

  it('holds a moment between the last vote and the resolution, then lets the minority step back', () => {
    render(ElecWidget, { props: props() })
    flushSync()
    snapshot(sitting())
    piece('So it is.')
    snapshot(null, DECIDED)

    // The hold: the votes are in, the lights are going out, and nothing says how it ended yet.
    expect(screen.queryByTestId('elec-outcome')).toBeNull()
    expect(screen.getByTestId('elec-resolution').dataset.outcome).toBe('pending')
    expect(screen.getByTestId('elec-resolution').textContent).not.toContain('deliberating')
    expect(screen.getAllByTestId('elec-log')[0]?.textContent).not.toContain('RESOLUTION')
    expect(unit(1).dataset.state).toBe('reject')
    expect(unit(1).classList.contains('back')).toBe(false)

    vi.advanceTimersByTime(HOLD_MS - 1)
    flushSync()
    expect(screen.queryByTestId('elec-outcome')).toBeNull()

    vi.advanceTimersByTime(1)
    flushSync()
    expect(screen.getByTestId('elec-outcome').textContent?.trim()).toBe('approved')
    expect(screen.getAllByTestId('elec-log')[0]?.textContent).toContain('RESOLUTION · APPROVED')
    expect(unit(0).classList.contains('back')).toBe(false)
    expect(unit(1).classList.contains('back')).toBe(true)
    expect(unit(2).classList.contains('back')).toBe(false)
  })

  it('does not hold a deliberation opened from the log, or one watched with motion reduced', () => {
    const { unmount } = render(ElecWidget, { props: props() })
    flushSync()
    snapshot(null, DECIDED)
    expect(screen.getByTestId('elec-outcome').textContent?.trim()).toBe('approved')
    unmount()

    appearance.settings = { ...appearance.settings, motion: 'reduced' }
    render(ElecWidget, { props: props() })
    flushSync()
    snapshot(sitting())
    snapshot(null, DECIDED)
    expect(screen.getByTestId('elec-outcome').textContent?.trim()).toBe('approved')
  })

  it('is not left holding when the view starts again from a snapshot that is already over', () => {
    render(ElecWidget, { props: props() })
    flushSync()
    snapshot(sitting())
    // A piece that does not fit: the pane lets go of what it has and asks again.
    send({
      type: 'delta',
      sessionId: ID,
      runId: 'run-0',
      textAt: 99,
      text: 'x',
      thinkingAt: 0,
      thinking: '',
    })
    send({ type: 'snapshot', sessionId: ID, session: null, live: null })
    expect(setPaneState).toHaveBeenCalled()
    snapshot(null, DECIDED)
    vi.advanceTimersByTime(HOLD_MS)
    flushSync()
    expect(screen.getByTestId('elec-outcome').textContent?.trim()).toBe('approved')
  })

  it('leaves no timer behind when the pane goes away during the hold', () => {
    const { unmount } = render(ElecWidget, { props: props() })
    flushSync()
    snapshot(sitting())
    const before = vi.getTimerCount()
    snapshot(null, DECIDED)
    expect(vi.getTimerCount()).toBeGreaterThan(before)
    unmount()
    vi.advanceTimersByTime(HOLD_MS)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('powers the units off when the pane goes back to standby, and has nothing to switch off when it opens there', async () => {
    const { rerender, unmount } = render(ElecWidget, { props: props() })
    flushSync()
    snapshot(null, DECIDED)
    expect(stage().classList.contains('powered')).toBe(true)
    await rerender({ state: {} })
    flushSync()
    expect(stage().classList.contains('powered')).toBe(false)
    expect(stage().classList.contains('was-on')).toBe(true)
    unmount()

    render(ElecWidget, { props: props({}) })
    flushSync()
    expect(stage().classList.contains('powered')).toBe(false)
    expect(stage().classList.contains('was-on')).toBe(false)
  })
})
