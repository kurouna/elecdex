import type { Elec16Game } from '@shared/elec16-units'
import { cleanup, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GamesView from '../../src/renderer/widgets/elec16/GamesView.svelte'

/**
 * GAMES (widgets/elec16/GamesView.svelte): the shelf as main last said it - an answer to an
 * older ask, coming after a newer one, never puts back the list it replaced.
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
})
