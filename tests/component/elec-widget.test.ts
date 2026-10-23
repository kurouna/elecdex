import type { Ballot, ElecEvent, Session } from '@shared/elec'
import { defaultSettings } from '@shared/settings'
import { cleanup, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: ElecWidget } = await import('../../src/renderer/widgets/elec/ElecWidget.svelte')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The ELEC system pane over a hand-driven main: how it shows a deliberation main has resolved.
 * How votes are read and counted is shared/elec.ts's (elec.test.ts, elec-service.test.ts).
 */

const SESSION_ID = '11111111-2222-4333-8444-555555555555'

const ballot = (unit: 0 | 1 | 2, text: string, verdict: Ballot['verdict']): Ballot => ({
  id: `b${unit}`,
  unit,
  round: 1,
  text,
  verdict,
  at: 1,
  model: 'm',
})

const session = (ballots: Ballot[]): Session => ({
  version: 1,
  id: SESSION_ID,
  title: 'Is it time?',
  motion: 'Is it time?',
  createdAt: 1,
  updatedAt: 2,
  rule: 'majority',
  rounds: 1,
  seats: [0, 1, 2].map(() => ({ providerId: 'local', provider: 'Local', model: 'm' })),
  ballots,
})

let handlers: Array<(event: ElecEvent) => void>

beforeEach(() => {
  handlers = []
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('elecdex', {
    elec: {
      sessions: vi.fn(async () => []),
      onSessions: vi.fn(() => () => {}),
      active: vi.fn(async () => []),
      subscribe: vi.fn((_id: string, handler: (event: ElecEvent) => void) => {
        handlers.push(handler)
        return () => {
          handlers = handlers.filter((h) => h !== handler)
        }
      }),
    },
    ai: { models: vi.fn(async () => ({ models: [], error: null })) },
  })
  vi.spyOn(layout, 'patchPaneState').mockImplementation(() => {})
  appearance.settings = {
    ...defaultSettings(),
    sound: { enabled: false, volume: 0 },
    ai: {
      ...defaultSettings().ai,
      providers: [
        {
          id: 'local',
          name: 'Local',
          kind: 'openai',
          baseUrl: 'http://localhost:1/v1',
          model: 'm',
        },
      ],
    },
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  appearance.settings = defaultSettings()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

describe('ElecWidget', () => {
  it('shows an answer with no verdict as a vote that does not count, and too few as no quorum', async () => {
    render(ElecWidget, { props: { paneId: 'e', state: { session: SESSION_ID } } as never })
    await settle()
    const resolved = session([
      ballot(0, 'LOGOS would rather not say.', null),
      ballot(1, 'ETHOS finds it sound.\nVERDICT: APPROVE', 'approve'),
      ballot(2, 'PATHOS would rather not say.', null),
    ])
    for (const handler of handlers) {
      handler({ type: 'snapshot', sessionId: SESSION_ID, session: resolved, live: null })
    }
    await settle()

    expect(screen.getByTestId('elec-outcome').textContent?.trim()).toBe('quorum not met')
    const unit = (n: number) =>
      document.querySelector(`[data-testid=elec-unit][data-unit="${n}"]`) as HTMLElement
    expect(unit(0).dataset.state).toBe('invalid')
    expect(unit(0).textContent).toContain('no verdict')
    expect(unit(1).dataset.state).toBe('approve')
    const stop = document.querySelector(
      '[data-testid=elec-ballot][data-unit="0"] [data-testid=elec-ballot-stop]',
    )
    expect(stop?.textContent).toContain('no verdict')
    expect(stop?.textContent).toContain('does not count')
  })
})
