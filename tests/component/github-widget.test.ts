import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { concurrencyLimit } from '../../src/main/cloud-cli/scheduler'
import { stubGithub } from '../../src/main/cloud-cli/stub-github'
import { GithubService } from '../../src/main/github/service'
import { boardKey } from '../../src/shared/github/board'
import type { GithubBoard } from '../../src/shared/github/types'
import { finishAnimations, inertDom } from './support/dom.ts'
import { mergePatch, stubElecdex } from './support/elecdex.ts'
import { settle } from './support/settle.ts'

const { default: GithubWidget } = await import(
  '../../src/renderer/widgets/github/GithubWidget.svelte'
)
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { widgetState } = await import('../../src/renderer/stores/widget-state.svelte.ts')

/**
 * GITHUB STATUS (docs/github.md): it follows its board only while seen, shows main's QUEUE, opens
 * a row by its id through main, says the way out when signed out or without gh, and MASK hides
 * private names. The boards are main's own, built on the stand-in gh.
 */

const AUTO = boardKey({ repos: 'auto', inbox: 'all' })

/** What the service builds on the stand-in gh in `mode`, once every probe has answered. */
async function boardOf(mode: string): Promise<GithubBoard> {
  let last: GithubBoard | null = null
  const github = new GithubService({
    cli: stubGithub(mode),
    limit: concurrencyLimit(2),
    stars: { note: () => {}, history: () => ({}) },
    now: () => Date.now(),
    setTimer: () => 0,
    clearTimer: () => {},
    publish: (board) => {
      last = board
    },
    incidents: () => [],
    ghVersion: () => '2.83.0',
    executable: () => 'stub',
  })
  github.watch(AUTO)
  for (let i = 0; i < 400; i++) await Promise.resolve()
  github.dispose()
  if (last === null) throw new Error('no board')
  return last
}

let deliver: ((board: GithubBoard) => void) | null = null
let subscribed: string[] = []
const open = vi.fn(async (_key: string, _id: string) => true)
const copy = vi.fn(async (_what: unknown) => true)
const refresh = vi.fn(async (_key: string) => 30_000)
let held: Record<string, unknown> = {}

beforeEach(() => {
  deliver = null
  subscribed = []
  held = {}
  open.mockClear()
  copy.mockClear()
  refresh.mockClear()
  inertDom()
  finishAnimations()
  stubElecdex({
    github: {
      subscribe: (key: string, handler: (board: GithubBoard) => void) => {
        subscribed.push(key)
        deliver = handler
        return () => {
          subscribed = subscribed.filter((k) => k !== key)
          deliver = null
        }
      },
      refresh: (key: string) => refresh(structuredClone(key)),
      detail: async () => null,
      open: (key: string, id: string) => open(structuredClone(key), structuredClone(id)),
      watching: async () => [],
    },
    utility: { copy: (what: unknown) => copy(structuredClone(what)) },
  })
  vi.spyOn(widgetState, 'patch').mockImplementation((_id, change) => {
    held = mergePatch(held, change)
  })
})

afterEach(async () => {
  cleanup()
  Reflect.deleteProperty(Element.prototype, 'animate')
  vi.restoreAllMocks()
  await layout.flush()
  vi.unstubAllGlobals()
})

async function mount(state: Record<string, unknown> = {}, visible = true) {
  const view = render(GithubWidget, {
    props: { paneId: 'p1', title: 'github', props: {}, state, active: true, visible },
  })
  await settle()
  return view
}

async function push(board: GithubBoard): Promise<void> {
  deliver?.(structuredClone(board))
  await settle()
}

describe('GithubWidget', () => {
  it('follows its board only while seen', async () => {
    const view = await mount({}, false)
    expect(subscribed).toEqual([])
    await view.rerender({ visible: true })
    await settle()
    expect(subscribed).toEqual([AUTO])
    await view.rerender({ visible: false })
    await settle()
    expect(subscribed).toEqual([])
  })

  it('subscribes to the pinned repositories as one canonical key', async () => {
    await mount({ repos: ['octo-aki/tern', 'octo-aki/tern', '../x'] })
    expect(subscribed).toEqual([boardKey({ repos: ['octo-aki/tern'], inbox: 'all' })])
  })

  it("shows main's QUEUE and opens a row by its id, never by a URL", async () => {
    await mount({ tab: 'queue' })
    const board = await boardOf('demo')
    await push(board)
    expect(screen.getByTestId('github-link').textContent).toContain('LINKED')
    const rows = screen.getAllByTestId('github-queue-row')
    expect(rows.length).toBe(board.queue.length)
    expect(screen.getByTestId('github-red').textContent).toMatch(/1/)
    await fireEvent.click(rows[0] as HTMLElement)
    expect(open).toHaveBeenCalledWith(AUTO, board.queue[0]?.id)
  })

  it('switches tabs through the pane state', async () => {
    await mount()
    await push(await boardOf('demo'))
    // REPOS at the left, and the tab a pane opens on (the user's decision 2026-11-08).
    expect(screen.getAllByRole('tab').map((t) => t.dataset.testid)).toEqual([
      'github-tab-repos',
      'github-tab-queue',
      'github-tab-inbox',
      'github-tab-events',
    ])
    expect(screen.getByTestId('github-tab-repos').getAttribute('aria-selected')).toBe('true')
    expect(screen.getAllByTestId('github-tile').length).toBeGreaterThan(0)
    // QUEUE is stored, REPOS (the default) is not.
    await fireEvent.click(screen.getByTestId('github-tab-queue'))
    expect(held.tab).toBe('queue')
    await fireEvent.click(screen.getByTestId('github-tab-repos'))
    expect(held.tab).toBeUndefined()
  })

  it("takes a repository's card away as its tile is pressed into the runs", async () => {
    const view = await mount({ tab: 'repos' })
    const board = await boardOf('demo')
    await push(board)
    const tile = screen.getAllByTestId('github-tile')[0] as HTMLElement
    await fireEvent.pointerEnter(tile, { clientX: 40 })
    await vi.waitFor(() => expect(screen.getByTestId('github-card')).toBeTruthy())
    await fireEvent.click(tile)
    expect(held.drill).toBe(board.repos[0]?.name)
    // The tile goes with the list, and an element taken away sends no pointerleave.
    await view.rerender({ state: { tab: 'repos', ...held } })
    await settle()
    expect(screen.queryAllByTestId('github-tile')).toEqual([])
    await vi.waitFor(() => expect(screen.queryByTestId('github-card')).toBeNull())
  })

  it('MASK hides the login and private repositories', async () => {
    const board = await boardOf('demo')
    await mount({ tab: 'repos', mask: true })
    await push(board)
    const text = screen.getByTestId('github-view-repos').textContent ?? ''
    expect(board.repos.some((tile) => tile.name === 'octo-aki/infra-notes' && tile.private)).toBe(
      true,
    )
    expect(text).not.toContain('infra-notes')
    expect(text).toContain('tern')
  })

  it('blinks REFRESH three beats before it asks, as every other button does', async () => {
    await mount()
    await push(await boardOf('demo'))
    const button = screen.getByTestId('github-refresh')
    await fireEvent.click(button)
    expect(button.classList.contains('blinking')).toBe(true)
    expect(refresh).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    expect(button.classList.contains('blinking')).toBe(false)
  })

  it('says the command to sign in with, and copies it', async () => {
    await mount()
    await push(await boardOf('signedout'))
    const notice = screen.getByTestId('github-signin')
    expect(notice.textContent).toContain('gh auth login')
    const button = notice.querySelector('button') as HTMLButtonElement
    await fireEvent.click(button)
    // The press blinks its three beats first, as every other button does, then copies.
    expect(button.classList.contains('blinking')).toBe(true)
    expect(copy).not.toHaveBeenCalled()
    await vi.waitFor(() =>
      expect(copy).toHaveBeenCalledWith({ kind: 'text', text: 'gh auth login' }),
    )
    await vi.waitFor(() => expect(button.textContent).toBe('COPIED'))
    expect(button.classList.contains('blinking')).toBe(false)
  })

  it('says there is no gh, without a sign-in', async () => {
    await mount()
    await push(await boardOf('nocli'))
    expect(screen.getByTestId('github-nocli')).toBeTruthy()
    expect(screen.queryByTestId('github-signin')).toBeNull()
  })
})
