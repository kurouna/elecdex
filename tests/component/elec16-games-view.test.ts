import type { Elec16Game } from '@shared/elec16-units'
import { cleanup, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GamesView from '../../src/renderer/widgets/elec16/GamesView.svelte'

/**
 * GAMES (widgets/elec16/GamesView.svelte): the shelf as main last said it - an answer to an
 * older ask, coming after a newer one, never puts back the list it replaced - and a slot
 * naming a game the shelf no longer holds shown empty.
 */

const game = (id: string): Elec16Game => ({
  id,
  name: id,
  banks: 1,
  saveBanks: 0,
  bundled: true,
  about: '',
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('GAMES', () => {
  it('shows the newest list when two asks are answered out of order', async () => {
    const answers: ((list: Elec16Game[]) => void)[] = []
    let changed = () => {}
    vi.stubGlobal('elecdex', {
      elec16: {
        games: () => new Promise<Elec16Game[]>((resolve) => answers.push(resolve)),
        onGamesChange: (fn: () => void) => {
          changed = fn
          return () => {}
        },
      },
    })
    const dev = { status: 'idle', builds: 0, folder: null, problems: [], report: null }
    render(GamesView, { inSlot: undefined, running: true, oninsert: () => {}, dev: dev as never })
    // The shelf changed (a game imported) before the first list came: a second ask.
    changed()
    expect(answers).toHaveLength(2)
    answers[1]?.([game('NEW')])
    await vi.waitFor(() => expect(screen.getAllByTestId('elec16-game')).toHaveLength(1))
    // The first ask's answer, from before the change, comes last.
    answers[0]?.([game('OLD-A'), game('OLD-B')])
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.getAllByTestId('elec16-game').map((e) => e.textContent)).toEqual([
      expect.stringContaining('NEW'),
    ])
  })

  it('shows a slot naming a game no longer on the shelf as empty, with nothing to take out', async () => {
    // A unit that had DEMO in its slot before DEMO left the shelf (2026-10-06).
    vi.stubGlobal('elecdex', {
      elec16: {
        games: async () => [{ ...game('ELECLANCE'), name: 'ELECLANCE' }],
        onGamesChange: () => () => {},
      },
    })
    const dev = { status: 'idle', builds: 0, folder: null, problems: [], report: null }
    const view = render(GamesView, {
      inSlot: 'DEMO',
      running: true,
      oninsert: () => {},
      dev: dev as never,
    })
    await vi.waitFor(() => expect(screen.getByTestId('elec16-game-slot').textContent).toBe('empty'))
    expect(screen.getByTestId('elec16-game-eject')).toHaveProperty('disabled', true)
    expect(screen.getAllByTestId('elec16-game').map((e) => e.getAttribute('aria-pressed'))).toEqual(
      ['false'],
    )
    // A game the shelf has is shown by its name, and can be taken out.
    await view.rerender({
      inSlot: 'ELECLANCE',
      running: true,
      oninsert: () => {},
      dev: dev as never,
    })
    expect(screen.getByTestId('elec16-game-slot').textContent).toBe('ELECLANCE')
    expect(screen.getByTestId('elec16-game-eject')).toHaveProperty('disabled', false)
  })
})
