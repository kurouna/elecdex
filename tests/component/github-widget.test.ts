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
let held: Record<string, unknown> = {}

beforeEach(() => {
  deliver = null
  subscribed = []
  held = {}
  open.mockClear()
  copy.mockClear()
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
      refresh: async () => 30_000,
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
    await mount()
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
    await fireEvent.click(screen.getByTestId('github-tab-repos'))
    expect(held.tab).toBe('repos')
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

  it('says the command to sign in with, and copies it', async () => {
    await mount()
    await push(await boardOf('signedout'))
    const notice = screen.getByTestId('github-signin')
    expect(notice.textContent).toContain('gh auth login')
    const button = notice.querySelector('button') as HTMLButtonElement
    await fireEvent.click(button)
    expect(copy).toHaveBeenCalledWith({ kind: 'text', text: 'gh auth login' })
  })

  it('says there is no gh, without a sign-in', async () => {
    await mount()
    await push(await boardOf('nocli'))
    expect(screen.getByTestId('github-nocli')).toBeTruthy()
    expect(screen.queryByTestId('github-signin')).toBeNull()
  })
})
