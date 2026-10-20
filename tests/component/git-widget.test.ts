import { emptyState, type GitRepoRef, type GitState } from '@shared/git'
import type { GitSyncAction, GitSyncResult } from '@shared/git-sync'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: GitWidget } = await import('../../src/renderer/widgets/git/GitWidget.svelte')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { widgetState } = await import('../../src/renderer/stores/widget-state.svelte.ts')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')

/**
 * The git pane around its list, graph and diff (widgets/git/GitWidget.svelte):
 * choosing a repository - the recent ones, the picker, what a problem says -
 * and the header - the branch and how far it is from its upstream, a half-done
 * operation, the stash, the receive lamp, and FETCH, PULL and PUSH on two presses
 * each, with what each says while armed and how it ended. Main is a stand-in:
 * git.spec.ts runs real git. Written before the chooser and the header left the
 * widget, so they keep what the pane showed.
 */

const ID = '0123456789abcdef'
const OTHER = 'fedcba9876543210'
const REPO: GitRepoRef = { id: ID, name: 'elecdex', path: '/home/dev/elecdex' }

let deliver: ((state: GitState) => void) | null = null
let subscriptions = 0
let recentList: GitRepoRef[] = []
const pick = vi.fn(async (): Promise<{ repo: GitRepoRef } | { problem: string } | null> => null)
const sync = vi.fn(
  async (_id: string, _action: GitSyncAction): Promise<GitSyncResult | null> => null,
)

const state = (
  over: Partial<GitState> = {},
  branch: Partial<GitState['branch']> = {},
): GitState => ({
  ...emptyState(ID),
  repo: REPO,
  readAt: 1,
  historyAt: 1,
  head: {
    oid: 'a'.repeat(40),
    short: 'aaaaaaa',
    subject: 'feat: the first',
    author: 'dev',
    time: 1,
  },
  ...over,
  branch: {
    head: 'main',
    oid: 'a'.repeat(40),
    upstream: 'origin/main',
    ahead: 2,
    behind: 0,
    ...branch,
  },
})

beforeEach(() => {
  deliver = null
  subscriptions = 0
  recentList = []
  pick.mockReset()
  pick.mockResolvedValue(null)
  sync.mockReset()
  sync.mockResolvedValue(null)
  toasts.clear()
  vi.spyOn(widgetState, 'patch')
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
  Element.prototype.getAnimations ??= () => []
  vi.stubGlobal('elecdex', {
    git: {
      subscribe: (_id: string, handler: (next: GitState) => void) => {
        subscriptions += 1
        deliver = handler
        return () => {
          subscriptions -= 1
          deliver = null
        }
      },
      recent: async () => structuredClone(recentList),
      pick: () => pick(),
      sync: (id: string, action: GitSyncAction) => sync(id, action),
      commit: async () => [],
      diff: async () => null,
      log: async () => null,
      open: async () => ({ ok: true, message: '' }),
      reveal: async () => {},
    },
    layout: { save: vi.fn(async () => {}) },
  })
})

afterEach(async () => {
  cleanup()
  toasts.clear()
  vi.restoreAllMocks()
  await layout.flush()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 6; i++) await tick()
  flushSync()
}

async function mount(paneState: Record<string, unknown> = { repo: ID }) {
  const view = render(GitWidget, {
    props: { paneId: 'g1', title: 'git', props: {}, state: paneState, active: true, visible: true },
  })
  await settle()
  return view
}

async function push(next: GitState): Promise<void> {
  deliver?.(structuredClone(next))
  await settle()
}

const text = (testid: string): string =>
  (screen.getByTestId(testid).textContent ?? '').replace(/\s+/g, ' ').trim()
const patched = () => vi.mocked(widgetState.patch).mock.calls

describe('choosing a repository', () => {
  it('offers the picker and the recent ones, and takes a recent one', async () => {
    recentList = [REPO, { id: OTHER, name: 'notes', path: '/home/dev/notes' }]
    await mount({})
    expect(screen.getByTestId('git-select').textContent).toBe('SELECT REPOSITORY')
    const recent = screen.getAllByTestId('git-recent')
    expect(recent.map((r) => r.textContent)).toEqual([
      'elecdex/home/dev/elecdex',
      'notes/home/dev/notes',
    ])
    expect(screen.getByTestId('git-choose').textContent).toContain('RECENT')
    // No repository yet: nothing to go back to.
    expect(screen.queryByText('BACK')).toBeNull()
    await fireEvent.click(recent[1] as HTMLElement)
    expect(patched().at(-1)).toEqual(['g1', { repo: OTHER, chosen: null, commit: null }])
  })

  it('names no recent list when there is none', async () => {
    await mount({})
    expect(screen.getByTestId('git-choose').textContent).not.toContain('RECENT')
    expect(screen.queryAllByTestId('git-recent')).toEqual([])
  })

  it('takes what the picker chose, and says why one would not do', async () => {
    await mount({})
    pick.mockResolvedValueOnce({ problem: 'not a git repository' })
    await fireEvent.click(screen.getByTestId('git-select'))
    await settle()
    expect(text('git-problem')).toBe('not a git repository')
    expect(patched()).toEqual([])
    pick.mockResolvedValueOnce(null)
    await fireEvent.click(screen.getByTestId('git-select'))
    await settle()
    expect(patched()).toEqual([])
    pick.mockResolvedValueOnce({ repo: { id: OTHER, name: 'notes', path: '/home/dev/notes' } })
    await fireEvent.click(screen.getByTestId('git-select'))
    await settle()
    expect(patched().at(-1)).toEqual(['g1', { repo: OTHER, chosen: null, commit: null }])
    expect(screen.queryByTestId('git-problem')).toBeNull()
  })

  it('goes back to the chooser from the header, and back again', async () => {
    recentList = [REPO]
    await mount()
    await push(state())
    const switcher = screen.getByTestId('git-switch')
    expect(switcher.getAttribute('title')).toBe('/home/dev/elecdex - choose another repository')
    await fireEvent.click(switcher)
    await settle()
    expect(screen.getByTestId('git-choose')).toBeTruthy()
    expect(screen.getAllByTestId('git-recent')).toHaveLength(1)
    await fireEvent.click(screen.getByText('BACK'))
    await settle()
    expect(screen.queryByTestId('git-choose')).toBeNull()
    expect(screen.getByTestId('git-head')).toBeTruthy()
  })

  it('says what is wrong with the repository, and offers another', async () => {
    await mount()
    await push({ ...emptyState(ID, 'unknown'), readAt: 1 })
    expect(text('git-problem')).toBe('This repository is not known on this machine.')
    await push({ ...emptyState(ID, 'failed'), readAt: 2, message: 'fatal: bad object HEAD' })
    expect(text('git-problem')).toBe('fatal: bad object HEAD')
    await push({ ...emptyState(ID, 'missing'), readAt: 3 })
    expect(text('git-problem')).toBe('missing')
    await fireEvent.click(screen.getByText('CHOOSE A REPOSITORY'))
    await settle()
    expect(screen.getByTestId('git-select')).toBeTruthy()
  })
})

describe('the header', () => {
  it('follows the repository only while it is seen', async () => {
    const view = await mount()
    expect(subscriptions).toBe(1)
    await view.rerender({ visible: false })
    await settle()
    expect(subscriptions).toBe(0)
    await view.rerender({ visible: true })
    await settle()
    expect(subscriptions).toBe(1)
  })

  it('names the branch, how far it is from its upstream, the commit and the stash', async () => {
    await mount()
    await push(state({ stash: 2 }))
    expect(text('git-branch')).toBe('⎇ main')
    expect(screen.getByTestId('git-branch').getAttribute('title')).toBe('origin/main')
    const head = screen.getByTestId('git-head')
    expect(head.textContent).toContain('↑2 ↓0')
    expect(head.querySelector('.hash')?.textContent).toBe('aaaaaaa')
    expect(head.querySelector('.subject')?.textContent).toBe('feat: the first')
    expect(head.textContent).toContain('stash 2')
    expect(screen.queryByTestId('git-operation')).toBeNull()
  })

  it('says a detached HEAD, a branch with no upstream and no stash', async () => {
    await mount()
    await push(state({ stash: 0 }, { head: null, upstream: null }))
    expect(text('git-branch')).toBe('⎇ DETACHED')
    expect(screen.getByTestId('git-branch').getAttribute('title')).toBe('no upstream')
    const head = screen.getByTestId('git-head')
    expect(head.textContent).not.toContain('↑')
    expect(head.textContent).not.toContain('stash')
  })

  it('names a merge or rebase left half done', async () => {
    await mount()
    await push(state({ operation: 'rebase' }))
    expect(text('git-operation')).toBe('REBASE')
  })

  it('lights its lamp for a change, not for the first reading', async () => {
    await mount()
    await push(state({ readAt: 1 }))
    expect(screen.getByTestId('git-lamp').dataset.received).toBe('0')
    await push(state({ readAt: 2, stash: 1 }))
    expect(screen.getByTestId('git-lamp').dataset.received).toBe('1')
    expect(screen.getByTestId('git-lamp').classList.contains('rx')).toBe(true)
  })
})

describe('FETCH, PULL and PUSH', () => {
  it('say what each does, and why one cannot be pressed', async () => {
    await mount()
    await push(state())
    const button = (action: string) => screen.getByTestId(`git-${action}`) as HTMLButtonElement
    expect(['fetch', 'pull', 'push'].map((a) => button(a).textContent?.trim())).toEqual([
      'FETCH',
      'PULL',
      'PUSH',
    ])
    expect(button('fetch').title).toBe(
      'Fetch from the remote of origin/main, leaving the working tree as it is',
    )
    expect(button('pull').title).toBe(
      'Pull origin/main into this branch, fast-forward only (no merge, no rebase, no hooks)',
    )
    expect(button('push').title).toBe(
      'Push this branch onto origin/main, never forced. No hooks run: pre-push checks are skipped',
    )
    expect(['fetch', 'pull', 'push'].map((a) => button(a).disabled)).toEqual([false, false, false])
    await push(state({ readAt: 2 }, { ahead: 0 }))
    expect(button('push').disabled).toBe(true)
    expect(button('push').title).toBe('Cannot push: nothing to push')
  })

  it('arm on the first press, saying what will go where', async () => {
    await mount()
    await push(state())
    await fireEvent.click(screen.getByTestId('git-push'))
    expect(text('git-push')).toBe('click again to push ↑2 to origin/main · no hooks')
    await fireEvent.click(screen.getByTestId('git-fetch'))
    expect(text('git-fetch')).toBe('click again to fetch')
    expect(sync).not.toHaveBeenCalled()
  })

  it('run on the second, busy meanwhile, and say how it ended', async () => {
    await mount()
    await push(state())
    let finish: (result: GitSyncResult | null) => void = () => {}
    sync.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)))
    await fireEvent.click(screen.getByTestId('git-push'))
    await fireEvent.click(screen.getByTestId('git-push'))
    await settle()
    expect(sync).toHaveBeenCalledWith(ID, 'push')
    expect(text('git-push-busy')).toBe('PUSHING')
    expect((screen.getByTestId('git-fetch') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByTestId('git-pull') as HTMLButtonElement).disabled).toBe(true)
    finish({ action: 'push', code: 'pushed', commits: 2, message: 'abc1234..def5678' })
    await settle()
    expect(screen.queryByTestId('git-push-busy')).toBeNull()
    expect(toasts.items.map((t) => [t.title, t.body, t.tone])).toEqual([
      ['PUSHED 2 COMMITS', 'elecdex · main — abc1234..def5678', 'ok'],
    ])
  })

  it('colour a refusal to fast-forward as a warning, a failure as one, and main’s no as a warning', async () => {
    await mount()
    await push(state())
    const run = async (action: GitSyncAction, result: GitSyncResult | null) => {
      sync.mockResolvedValueOnce(result)
      await fireEvent.click(screen.getByTestId(`git-${action}`))
      await fireEvent.click(screen.getByTestId(`git-${action}`))
      await settle()
    }
    await run('pull', { action: 'pull', code: 'diverged', commits: 0, message: '' })
    await run('fetch', { action: 'fetch', code: 'failed', commits: 0, message: 'fatal: no remote' })
    await run('fetch', null)
    expect(toasts.items.map((t) => [t.title, t.body, t.tone])).toEqual([
      ['DIVERGED', 'elecdex · main', 'warn'],
      ['FETCH FAILED', 'elecdex · main — fatal: no remote', 'danger'],
      ['CANNOT FETCH', 'elecdex · main', 'warn'],
    ])
  })
  it('still say one is under way after a trip to the chooser and back', async () => {
    await mount()
    await push(state())
    let finish: (result: GitSyncResult | null) => void = () => {}
    sync.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)))
    await fireEvent.click(screen.getByTestId('git-fetch'))
    await fireEvent.click(screen.getByTestId('git-fetch'))
    await settle()
    await fireEvent.click(screen.getByTestId('git-switch'))
    await settle()
    await fireEvent.click(screen.getByText('BACK'))
    await settle()
    expect(text('git-fetch-busy')).toBe('FETCHING')
    expect((screen.getByTestId('git-push') as HTMLButtonElement).disabled).toBe(true)
    finish({ action: 'fetch', code: 'fetched', commits: 0, message: '' })
    await settle()
    expect(screen.queryByTestId('git-fetch-busy')).toBeNull()
  })
})
