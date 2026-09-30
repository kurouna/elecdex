import { emptyState, type GitState } from '@shared/git'
import { type GitSyncResult, parseLeftRight, syncBlocked, syncHeadline } from '@shared/git-sync'
import { describe, expect, it } from 'vitest'
import type { GitResult } from '../../src/main/git/run.js'
import { GitSync } from '../../src/main/git/sync.js'

/**
 * The git pane's FETCH and PULL: when they may run, what git is asked, and how
 * each way of ending is told. git itself is made up here; git.spec.ts runs the
 * real one against a real remote.
 */

const ID = '0123456789abcdef'

const readState = (branch: Partial<GitState['branch']> = {}, extra: Partial<GitState> = {}) => ({
  ...emptyState(ID),
  readAt: 1,
  branch: {
    head: 'main',
    oid: 'a'.repeat(40),
    upstream: 'origin/main',
    ahead: 0,
    behind: 0,
    ...branch,
  },
  ...extra,
})

const answer = (stdout = '', ok = true, extra: Partial<GitResult> = {}): GitResult => ({
  ok,
  stdout,
  stderr: '',
  missing: false,
  tooLarge: false,
  ...extra,
})

function harness(state: GitState, replies: (args: readonly string[]) => GitResult) {
  const calls: { args: readonly string[]; timeoutMs: number | undefined }[] = []
  const moved: string[] = []
  const sync = new GitSync({
    run: async (_cwd, args, options) => {
      calls.push({ args, timeoutMs: options?.timeoutMs })
      return replies(args)
    },
    target: (id) => (id === ID ? { path: '/repo', guard: ['-c', 'filter.x.clean='], state } : null),
    moved: (id) => moved.push(id),
    hooksDir: () => '/app/git-no-hooks',
  })
  return { sync, calls, moved }
}

describe('syncBlocked', () => {
  it('lets a branch with an upstream fetch and pull', () => {
    expect(syncBlocked(readState(), 'fetch')).toBeNull()
    expect(syncBlocked(readState({ behind: 3 }), 'pull')).toBeNull()
    expect(syncBlocked(readState({ ahead: 2 }), 'pull')).toBeNull()
  })

  it('says why it cannot, from the state main read', () => {
    expect(syncBlocked(null, 'pull')).toBe('not read yet')
    expect(syncBlocked({ ...readState(), readAt: 0 }, 'pull')).toBe('not read yet')
    expect(syncBlocked(readState({}, { problem: 'missing' }), 'fetch')).toMatch(/cannot be read/)
    expect(syncBlocked(readState({}, { operation: 'rebase' }), 'fetch')).toBe(
      'a rebase is in progress',
    )
    expect(syncBlocked(readState({ head: null }), 'pull')).toBe('HEAD is detached')
    expect(syncBlocked(readState({ upstream: null }), 'fetch')).toMatch(/no upstream/)
  })

  it('refuses a pull known to have diverged before going to the network, but not a fetch', () => {
    const diverged = readState({ ahead: 1, behind: 2 })
    expect(syncBlocked(diverged, 'pull')).toMatch(/terminal/)
    expect(syncBlocked(diverged, 'fetch')).toBeNull()
  })
})

describe('the words it ends with', () => {
  const result = (code: GitSyncResult['code'], commits = 0, action: 'fetch' | 'pull' = 'pull') =>
    syncHeadline({ action, code, commits, message: '' })

  it('leads with a short code', () => {
    expect(result('pulled', 1)).toBe('PULLED 1 COMMIT')
    expect(result('pulled', 3)).toBe('PULLED 3 COMMITS')
    expect(result('current')).toBe('ALREADY UP TO DATE')
    expect(result('fetched', 0, 'fetch')).toBe('FETCHED · UP TO DATE')
    expect(result('fetched', 2, 'fetch')).toBe('FETCHED · 2 COMMITS BEHIND')
    expect(result('diverged')).toBe('DIVERGED')
    expect(result('refused', 0, 'fetch')).toBe('CANNOT FETCH')
    expect(result('failed')).toBe('PULL FAILED')
  })

  it('reads the two sides of a left-right count', () => {
    expect(parseLeftRight('3\t5\n')).toEqual({ left: 3, right: 5 })
    expect(parseLeftRight('nonsense')).toBeNull()
  })
})

describe('GitSync', () => {
  it('pulls fast-forward only, with no hooks, no merge and nothing of submodules or signatures', async () => {
    const { sync, calls, moved } = harness(readState({ behind: 2 }), (args) =>
      args.includes('rev-list') ? answer('2\n') : answer(),
    )
    const result = await sync.run(ID, 'pull')
    expect(result).toEqual({ action: 'pull', code: 'pulled', commits: 2, message: '' })

    const pull = calls[0]
    expect(pull?.args).toEqual([
      '-c',
      'filter.x.clean=',
      '-c',
      'core.hooksPath=/app/git-no-hooks',
      'pull',
      '--ff-only',
      '--no-rebase',
      '--no-autostash',
      '--no-verify-signatures',
      '--no-recurse-submodules',
    ])
    // A network round trip is given far longer than a reading.
    expect(pull?.timeoutMs).toBe(120_000)
    // Counted from the commit main last read HEAD at.
    expect(calls[1]?.args).toContain(`${'a'.repeat(40)}..HEAD`)
    expect(moved).toEqual([ID])
  })

  it('says a pull that took nothing is up to date', async () => {
    const { sync } = harness(readState(), (args) =>
      args.includes('rev-list') ? answer('0\n') : answer(),
    )
    expect((await sync.run(ID, 'pull')).code).toBe('current')
  })

  it('fetches with the same guards, and says how far behind the branch now is', async () => {
    const { sync, calls } = harness(readState(), (args) =>
      args.includes('rev-list') ? answer('4\n') : answer(),
    )
    expect(await sync.run(ID, 'fetch')).toEqual({
      action: 'fetch',
      code: 'fetched',
      commits: 4,
      message: '',
    })
    expect(calls[0]?.args).toContain('core.hooksPath=/app/git-no-hooks')
    expect(calls[0]?.args.slice(4)).toEqual(['fetch', '--no-recurse-submodules'])
    expect(calls[1]?.args).toContain('HEAD..@{upstream}')
  })

  it('tells a pull that could not fast-forward from one that failed otherwise', async () => {
    const diverged = harness(readState(), (args) => {
      if (args.includes('pull'))
        return { ...answer('', false), stderr: 'fatal: Not possible to fast-forward, aborting.' }
      return answer('1\t2\n')
    })
    expect(await diverged.sync.run(ID, 'pull')).toMatchObject({ code: 'diverged' })

    const failed = harness(readState(), (args) => {
      if (args.includes('pull'))
        return { ...answer('', false), stderr: 'error: Your local changes would be overwritten' }
      return answer('0\t2\n')
    })
    expect(await failed.sync.run(ID, 'pull')).toMatchObject({
      code: 'failed',
      message: 'Your local changes would be overwritten',
    })
  })

  it('stops waiting on a transport that never answers', async () => {
    const { sync } = harness(readState(), () => answer('', false, { timedOut: true }))
    expect(await sync.run(ID, 'fetch')).toMatchObject({ code: 'timeout' })
  })

  it('runs nothing for a repository no pane shows, or one in no state to take it', async () => {
    const unknown = harness(readState(), () => answer())
    expect(await unknown.sync.run('ffffffffffffffff', 'pull')).toMatchObject({ code: 'refused' })
    expect(unknown.calls).toEqual([])

    const detached = harness(readState({ head: null }), () => answer())
    expect(await detached.sync.run(ID, 'pull')).toMatchObject({
      code: 'refused',
      message: 'HEAD is detached',
    })
    expect(detached.calls).toEqual([])
  })

  it('runs one at a time per repository', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const slow = new GitSync({
      run: async (_cwd, args) => {
        if (args.includes('fetch')) await gate
        return answer('0\n')
      },
      target: () => ({ path: '/repo', guard: [], state: readState() }),
      moved: () => {},
      hooksDir: () => '/app/git-no-hooks',
    })
    const first = slow.run(ID, 'fetch')
    expect(await slow.run(ID, 'pull')).toMatchObject({ code: 'busy' })
    release()
    expect(await first).toMatchObject({ code: 'fetched' })
    // Free again once it has ended.
    expect(await slow.run(ID, 'pull')).toMatchObject({ code: 'current' })
  })
})
