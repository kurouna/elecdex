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

/**
 * The focus as Tab gives it. jsdom has no Tab between elements, and a row focused by a script
 * is not `:focus-visible` there, so the element says it is, as Chromium's would.
 */
function keyFocus(el: HTMLElement): void {
  const own = el.matches.bind(el)
  Object.defineProperty(el, 'matches', {
    value: (selector: string) => selector === ':focus-visible' || own(selector),
  })
  el.focus()
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

  it("MASK hides a private repository's name, runs and pulls in its drill-down", async () => {
    const board = await boardOf('demo')
    const repo = 'octo-aki/infra-notes'
    const detail = vi.fn(async () => ({
      key: AUTO,
      repo,
      runs: [
        {
          id: `run:${repo}:1`,
          state: 'success' as const,
          workflow: 'ci',
          branch: 'main',
          title: 'Rotate the vault keys',
          event: 'push',
          seconds: 40,
          at: Date.now(),
        },
      ],
      pulls: [
        {
          id: `pull:${repo}#3`,
          number: 3,
          title: 'Move the backups bucket',
          by: 'octo-aki',
          verdict: 'Waiting',
          verdictWeight: 'quiet' as const,
          ci: 'none' as const,
          since: Date.now(),
        },
      ],
      releases: [],
      readAt: Date.now(),
    }))
    vi.mocked(window.elecdex.github).detail = detail
    await mount({ tab: 'repos', mask: true, drill: repo })
    await push(board)
    await vi.waitFor(() => expect(detail).toHaveBeenCalled())
    await settle()
    const text = `${screen.getByTestId('github-crumbs').textContent}${screen.getByTestId('github-view-repos').textContent}`
    for (const secret of ['infra-notes', 'Rotate the vault keys', 'Move the backups bucket'])
      expect(text, secret).not.toContain(secret)
    // What is no name stays: the pull's number.
    expect(text).toContain('#3')
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

describe('found in review (2026-11-08)', () => {
  const REPO = 'octo-aki/lumen-cli'
  const inside = (repo: string) => ({
    key: AUTO,
    repo,
    runs: [
      {
        id: `run:${repo}:1`,
        state: 'success' as const,
        workflow: 'deploy-vault',
        branch: 'rotate-keys',
        title: 'Rotate',
        event: 'push',
        seconds: 40,
        at: Date.now(),
      },
    ],
    pulls: [],
    releases: [
      {
        id: `release:${repo}:v9-secret`,
        tag: 'v9-secret',
        prerelease: false,
        at: Date.now(),
        downloads: 3,
        ahead: null,
      },
    ],
    readAt: Date.now(),
  })

  it('asks for a kept drill again as the repositories come, and goes up from one not watched', async () => {
    // Asked before the first repos reading, the drill-down showed "…" for good: it never asked again.
    const board = await boardOf('demo')
    let lists = false
    const detail = vi.fn(async (_key: string, repo: string) =>
      lists ? (repo === REPO ? inside(repo) : null) : ('waiting' as const),
    )
    vi.mocked(window.elecdex.github).detail = detail
    const view = await mount({ drill: REPO })
    await push({ ...board, repos: [] })
    const asked = detail.mock.calls.length
    expect(asked).toBeGreaterThan(0)
    expect(screen.getByTestId('github-view-repos').textContent).toContain('…')
    lists = true
    // The repositories come: asked again, without a press.
    await push(board)
    await vi.waitFor(() =>
      expect(screen.getByTestId('github-view-repos').textContent).toContain('deploy-vault'),
    )
    expect(detail.mock.calls.length).toBeGreaterThan(asked)
    // Once listed, a repository the board does not watch goes back to REPOS.
    await view.rerender({ state: { drill: 'someone/else' } })
    await settle()
    await vi.waitFor(() =>
      expect(widgetState.patch).toHaveBeenCalledWith('p1', { drill: undefined }),
    )
  })

  it("MASK hides a private repository's branches, workflows and release tags, and the login in the cards", async () => {
    const board = await boardOf('demo')
    const repo = 'octo-aki/infra-notes'
    vi.mocked(window.elecdex.github).detail = vi.fn(async () => inside(repo))
    const view = await mount({ mask: true, drill: repo })
    await push(board)
    await vi.waitFor(() =>
      expect(screen.getByTestId('github-view-repos').textContent).toContain('runs · the last 1'),
    )
    const text = screen.getByTestId('github-view-repos').textContent ?? ''
    for (const secret of ['deploy-vault', 'rotate-keys', 'v9-secret'])
      expect(text, secret).not.toContain(secret)
    // A tile's card named the user's own repository as octo-aki/…, the login the subtitle masks.
    await view.rerender({ state: { mask: true } })
    await settle()
    const tile = screen
      .getAllByTestId('github-tile')
      .find((t) => t.textContent?.includes('tern')) as HTMLElement
    await fireEvent.pointerEnter(tile, { clientX: 40 })
    await vi.waitFor(() => expect(screen.getByTestId('github-card')).toBeTruthy())
    expect(screen.getByTestId('github-card').textContent).not.toContain('octo-aki')
    // Without MASK the card says the whole name the tile has no room for.
    await view.rerender({ state: {} })
    await settle()
    const again = screen
      .getAllByTestId('github-tile')
      .find((t) => t.textContent?.includes('tern')) as HTMLElement
    await fireEvent.pointerLeave(again)
    await fireEvent.pointerEnter(again, { clientX: 40 })
    await vi.waitFor(() =>
      expect(screen.getByTestId('github-card').textContent).toContain('octo-aki/tern'),
    )
  })

  it("gives a tile's card to the keyboard too, and its focus back after the drill-down", async () => {
    const board = await boardOf('demo')
    vi.mocked(window.elecdex.github).detail = vi.fn(async (_key: string, repo: string) =>
      inside(repo),
    )
    const view = await mount()
    await push(board)
    const tile = screen.getAllByTestId('github-tile')[1] as HTMLElement
    keyFocus(tile)
    await vi.waitFor(() => expect(screen.getByTestId('github-card')).toBeTruthy())
    await fireEvent.click(tile)
    await view.rerender({ state: { ...held } })
    await settle()
    expect(screen.queryAllByTestId('github-tile')).toEqual([])
    await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' })
    await view.rerender({ state: { ...held } })
    await settle()
    // The tile pressed takes the focus again, not the page.
    await vi.waitFor(() =>
      expect((document.activeElement as HTMLElement | null)?.textContent).toContain(
        board.repos[1]?.name.split('/')[1] ?? '?',
      ),
    )
  })

  it('gives the focus back after a mouse Back without opening its card', async () => {
    // The tile's card opened on any focus, so the focus given back after a click on ‹ put a
    // card up that nobody asked for.
    const board = await boardOf('demo')
    vi.mocked(window.elecdex.github).detail = vi.fn(async (_key: string, repo: string) =>
      inside(repo),
    )
    const view = await mount()
    await push(board)
    await fireEvent.click(screen.getAllByTestId('github-tile')[1] as HTMLElement)
    await view.rerender({ state: { ...held } })
    await settle()
    await fireEvent.click(screen.getByRole('button', { name: 'back to the repositories' }))
    await view.rerender({ state: { ...held } })
    await settle()
    const name = board.repos[1]?.name.split('/')[1] ?? '?'
    await vi.waitFor(() =>
      expect((document.activeElement as HTMLElement | null)?.textContent).toContain(name),
    )
    await settle()
    expect(screen.queryByTestId('github-card')).toBeNull()
  })

  it('says in the foot what REFRESH reads while GitHub asked to wait or the limit runs low', async () => {
    // REFRESH read nothing then (the probes wait for the limit) yet looked pressed: nothing said so.
    const board = await boardOf('demo')
    await mount()
    await push(board)
    expect(screen.queryByTestId('github-refresh-note')).toBeNull()
    const reset = new Date(2026, 10, 8, 14, 5).getTime()
    await push({ ...board, heldUntil: reset })
    expect(screen.getByTestId('github-refresh-note').textContent).toBe(
      'GitHub asked to wait: REFRESH reads only the rate limit until 14:05',
    )
    const rate = { rest: 300, restLimit: 5000, gql: 4000, gqlLimit: 5000, reset, low: true }
    await push({ ...board, rate })
    expect(screen.getByTestId('github-refresh-note').textContent).toContain(
      'readings 4× apart until the reset at 14:05, and REFRESH reads only what is due',
    )
  })

  it('forgets the tile to go back to once another tab is chosen', async () => {
    // Leaving a repository by a tab and coming back to REPOS later put the focus on the old tile.
    const board = await boardOf('demo')
    vi.mocked(window.elecdex.github).detail = vi.fn(async (_key: string, repo: string) =>
      inside(repo),
    )
    const view = await mount()
    await push(board)
    await fireEvent.click(screen.getAllByTestId('github-tile')[1] as HTMLElement)
    await view.rerender({ state: { ...held } })
    await settle()
    await fireEvent.click(screen.getByTestId('github-tab-queue'))
    await view.rerender({ state: { ...held } })
    await settle()
    const tab = screen.getByTestId('github-tab-repos')
    await fireEvent.click(tab)
    tab.focus()
    await view.rerender({ state: { ...held } })
    await settle()
    expect(screen.getAllByTestId('github-tile').length).toBeGreaterThan(1)
    expect(document.activeElement).toBe(tab)
  })

  it("shows a CLI's words in the foot at a size to read, and under MASK only their kind", async () => {
    const board = await boardOf('demo')
    const problem = 'Could not resolve to a Repository with the name octo-aki/private-repo.'
    const view = await mount()
    await push({ ...board, link: 'error', problem })
    const shown = screen.getByTestId('github-problem')
    expect(shown.textContent).toBe(problem)
    expect(shown.classList.contains('problem')).toBe(true)
    await view.rerender({ state: { mask: true } })
    await settle()
    expect(screen.getByTestId('github-foot').textContent).not.toContain('private-repo')
    expect(screen.getByTestId('github-problem').textContent).toContain('LINK ERROR')
  })

  it("waits out REFRESH's 30 s on the seconds' boundaries, with no timer of its own", async () => {
    // REFRESH armed a setTimeout of its own for the wait (30 s and 50 ms), never cleared when
    // the pane unmounted.
    await mount()
    await push(await boardOf('demo'))
    const timeout = vi.spyOn(globalThis, 'setTimeout')
    await fireEvent.click(screen.getByTestId('github-refresh'))
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    await settle()
    expect((screen.getByTestId('github-refresh') as HTMLButtonElement).disabled).toBe(true)
    expect(timeout.mock.calls.filter(([, ms]) => (ms ?? 0) > 1000)).toEqual([])
  })
})
