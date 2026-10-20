import { emptyState, type GitState } from '@shared/git'
import {
  type GitSyncResult,
  isBranchRef,
  isPushRemote,
  parseLeftRight,
  parsePushPorcelain,
  repoTransportPrograms,
  SYNC_BUSY,
  syncArmed,
  syncBlocked,
  syncHeadline,
  syncTitle,
  syncTone,
  TRANSPORT_PROGRAM_KEYS,
} from '@shared/git-sync'
import { describe, expect, it } from 'vitest'
import type { GitResult } from '../../src/main/git/run.js'
import { GitSync } from '../../src/main/git/sync.js'

/**
 * The git pane's FETCH, PULL and PUSH: when they may run, what git is asked, and how
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

/**
 * A made-up git. The look at the repository's transport programs, asked before every press,
 * is answered by `transport` (git's "no such key" by default) and kept apart from `calls`.
 */
function harness(
  state: GitState,
  replies: (args: readonly string[]) => GitResult,
  transport: GitResult = answer('', false),
) {
  const calls: { args: readonly string[]; timeoutMs: number | undefined }[] = []
  const looks: (readonly string[])[] = []
  const moved: string[] = []
  const sync = new GitSync({
    run: async (_cwd, args, options) => {
      if (args.includes(TRANSPORT_PROGRAM_KEYS)) {
        looks.push(args)
        return transport
      }
      calls.push({ args, timeoutMs: options?.timeoutMs })
      return replies(args)
    },
    target: (id) => (id === ID ? { path: '/repo', guard: ['-c', 'filter.x.clean='], state } : null),
    moved: (id) => moved.push(id),
    hooksDir: () => '/app/git-no-hooks',
  })
  return { sync, calls, looks, moved }
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
      args.includes('rev-list')
        ? answer('2\n')
        : args.includes('rev-parse')
          ? answer(`${'b'.repeat(40)}\n`)
          : answer(),
    )
    const result = await sync.run(ID, 'pull')
    expect(result).toEqual({ action: 'pull', code: 'pulled', commits: 2, message: '' })

    const pull = calls[1]
    expect(pull?.args).toEqual([
      '-c',
      'filter.x.clean=',
      '-c',
      'core.hooksPath=/app/git-no-hooks',
      '-c',
      'protocol.ext.allow=never',
      'pull',
      '--ff-only',
      '--no-rebase',
      '--no-autostash',
      '--no-verify-signatures',
      '--no-recurse-submodules',
    ])
    // A network round trip is given far longer than a reading.
    expect(pull?.timeoutMs).toBe(120_000)
    // Counted from HEAD read just before the pull, not main's last reading (found in review:
    // a commit made in the terminal a moment before was counted as pulled).
    expect(calls[0]?.args.slice(-4)).toEqual(['rev-parse', '--verify', '-q', 'HEAD'])
    expect(calls[2]?.args).toContain(`${'b'.repeat(40)}..HEAD`)
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
    expect(calls[0]?.args).toContain('protocol.ext.allow=never')
    expect(calls[0]?.args.slice(6)).toEqual(['fetch', '--no-recurse-submodules'])
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

  it("refuses a press while the repository's own config names a transport program", async () => {
    // Found in a security review: a repository handed over as a folder brings its .git/config,
    // and core.sshCommand, a `!` credential helper or remote.<name>.uploadpack there ran on the
    // press as the transport.
    const named = answer(
      [
        'global\tcredential.helper',
        'local\tcore.sshcommand',
        'local\tremote.origin.uploadpack',
        'worktree\tcredential.https://example.com.helper',
      ].join('\n'),
    )
    for (const action of ['fetch', 'pull', 'push'] as const) {
      const { sync, calls, looks } = harness(readState({ ahead: 1 }), () => answer('1\n'), named)
      const result = await sync.run(ID, action)
      expect(result.code).toBe('refused')
      expect(result.message).toContain(
        'core.sshcommand, credential.https://example.com.helper, remote.origin.uploadpack',
      )
      expect(result.message).not.toContain('credential.helper,')
      expect(looks).toHaveLength(1)
      expect(looks[0]).toEqual(expect.arrayContaining(['--show-scope', '--name-only']))
      expect(looks[0]).toContain('core.hooksPath=/app/git-no-hooks')
      expect(calls).toEqual([])
    }
  })

  it("goes ahead on the user's own transport, and refuses on a config git could not read", async () => {
    const own = harness(
      readState(),
      (args) => (args.includes('rev-list') ? answer('0\n') : answer()),
      answer('global\tcore.sshcommand\nsystem\tcredential.helper\n'),
    )
    expect((await own.sync.run(ID, 'fetch')).code).toBe('fetched')
    const broken = harness(readState(), () => answer(), {
      ...answer('', false),
      stderr: 'fatal: bad config line 3 in file .git/config',
    })
    expect(await broken.sync.run(ID, 'fetch')).toMatchObject({ code: 'refused' })
    expect(broken.calls).toEqual([])
    const slow = harness(readState(), () => answer(), answer('', false, { timedOut: true }))
    expect((await slow.sync.run(ID, 'fetch')).code).toBe('refused')
    expect(slow.calls).toEqual([])
  })

  it('reads the transport keys of the repository alone', () => {
    expect(
      repoTransportPrograms(
        'system\tcore.askpass\nlocal\tcore.gitproxy\r\nlocal\tcore.gitproxy\nworktree\tremote.a b.vcs\n',
      ),
    ).toEqual(['core.gitproxy', 'remote.a b.vcs'])
    const keys = new RegExp(TRANSPORT_PROGRAM_KEYS)
    for (const key of [
      'core.sshcommand',
      'core.gitproxy',
      'core.askpass',
      'credential.helper',
      'credential.https://example.com.helper',
      'remote.origin.uploadpack',
      'remote.origin.receivepack',
      'remote.my.remote.vcs',
    ]) {
      expect(keys.test(key)).toBe(true)
    }
    for (const key of [
      'core.editor',
      'credential.username',
      'remote.origin.url',
      'core.sshcommandx',
    ]) {
      expect(keys.test(key)).toBe(false)
    }
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

describe('PUSH', () => {
  // `git push --porcelain` as git 2.54 writes it (checked against a local bare remote).
  const porcelain = (flag: string, summary: string, to = 'refs/heads/main') =>
    `To C:/remote/o.git\n${flag}\trefs/heads/main:${to}\t${summary}\nDone\n`

  /** git as a push meets it: the branch's config, the count, then the push itself. */
  const pushing =
    (push: GitResult, config: Record<string, string> = {}, ahead = '2\n') =>
    (args: readonly string[]): GitResult => {
      if (args.includes('config')) {
        const key = args.at(-1) ?? ''
        const value = {
          'branch.main.remote': 'origin',
          'branch.main.merge': 'refs/heads/main',
          ...config,
        }[key]
        return value === undefined || value === '' ? answer('', false) : answer(`${value}\n`)
      }
      if (args.includes('rev-list')) return answer(ahead)
      return push
    }

  it('pushes only a branch ahead of its upstream and behind it in nothing', () => {
    expect(syncBlocked(readState({ ahead: 2 }), 'push')).toBeNull()
    expect(syncBlocked(readState(), 'push')).toBe('nothing to push')
    expect(syncBlocked(readState({ behind: 1 }), 'push')).toBe('behind its upstream: pull first')
    expect(syncBlocked(readState({ ahead: 1, behind: 1 }), 'push')).toMatch(/terminal/)
    expect(syncBlocked(readState({ ahead: 1, head: null }), 'push')).toBe('HEAD is detached')
  })

  it('leaves a branch with no upstream to the terminal, naming push -u', () => {
    expect(syncBlocked(readState({ ahead: 1, upstream: null }), 'push')).toBe(
      'the branch has no upstream: push -u in the terminal',
    )
  })

  it('reads the line for its own ref from the porcelain output', () => {
    expect(parsePushPorcelain(porcelain(' ', 'acbcea5..5d799bb'), 'refs/heads/main')).toEqual({
      flag: ' ',
      summary: 'acbcea5..5d799bb',
    })
    expect(
      parsePushPorcelain(porcelain('!', '[rejected] (fetch first)'), 'refs/heads/main'),
    ).toEqual({ flag: '!', summary: '[rejected] (fetch first)' })
    expect(
      parsePushPorcelain(porcelain('*', '[new branch]', 'refs/heads/x'), 'refs/heads/main'),
    ).toBeNull()
    expect(parsePushPorcelain('error: something\r\n', 'refs/heads/main')).toBeNull()
  })

  it('takes from the config only a remote and a branch a push may name', () => {
    expect(isPushRemote('origin')).toBe(true)
    expect(isPushRemote('my/fork')).toBe(true)
    for (const remote of ['', '.', '--receive-pack=evil', 'a b'])
      expect(isPushRemote(remote)).toBe(false)
    expect(isBranchRef('refs/heads/feature/x')).toBe(true)
    for (const ref of ['', 'main', 'refs/tags/v1', '+refs/heads/main', 'refs/heads/a:b'])
      expect(isBranchRef(ref)).toBe(false)
  })

  it('tells the ways it ends in short', () => {
    const line = (code: GitSyncResult['code'], commits = 0) =>
      syncHeadline({ action: 'push', code, commits, message: '' })
    expect(line('pushed', 1)).toBe('PUSHED 1 COMMIT')
    expect(line('pushed', 3)).toBe('PUSHED 3 COMMITS')
    expect(line('rejected')).toBe('REJECTED')
    expect(line('refused')).toBe('CANNOT PUSH')
    expect(line('failed')).toBe('PUSH FAILED')
  })

  it('names its one refspec onto the upstream, with no force, no hooks and nothing else', async () => {
    const { sync, calls, moved } = harness(
      readState({ ahead: 2 }),
      pushing(answer(porcelain(' ', 'acbcea5..5d799bb'))),
    )
    expect(await sync.run(ID, 'push')).toEqual({
      action: 'push',
      code: 'pushed',
      commits: 2,
      message: '',
    })
    const push = calls.at(-1)
    expect(push?.args).toEqual([
      '-c',
      'filter.x.clean=',
      '-c',
      'core.hooksPath=/app/git-no-hooks',
      '-c',
      'protocol.ext.allow=never',
      'push',
      '--porcelain',
      '--no-verify',
      '--no-follow-tags',
      '--no-signed',
      '--recurse-submodules=no',
      '--',
      'origin',
      'refs/heads/main:refs/heads/main',
    ])
    expect(push?.timeoutMs).toBe(120_000)
    expect(push?.args.some((arg) => arg.startsWith('+') || arg.startsWith('--force'))).toBe(false)
    // Counted just before, not from main's last reading, and of the branch pushed by name,
    // never of HEAD (found in review: HEAD may be another branch by the second press).
    expect(calls.some((call) => call.args.includes('main@{upstream}..refs/heads/main'))).toBe(true)
    expect(calls.some((call) => call.args.some((arg) => arg.includes('HEAD')))).toBe(false)
    expect(moved).toEqual([ID])
  })

  it('pushes onto the upstream the config names, whatever the remote is called', async () => {
    const { sync, calls } = harness(
      readState({ ahead: 1, upstream: 'my/fork/release' }),
      pushing(answer(porcelain(' ', 'a..b', 'refs/heads/release')), {
        'branch.main.remote': 'my/fork',
        'branch.main.merge': 'refs/heads/release',
      }),
    )
    expect(await sync.run(ID, 'push')).toMatchObject({ code: 'pushed', commits: 2 })
    expect(calls.at(-1)?.args.slice(-2)).toEqual(['my/fork', 'refs/heads/main:refs/heads/release'])
  })

  it('pushes nothing for an upstream in this repository or one the config does not name', async () => {
    for (const config of [{ 'branch.main.remote': '.' }, { 'branch.main.merge': '' }]) {
      const { sync, calls } = harness(readState({ ahead: 1 }), pushing(answer(), config))
      expect(await sync.run(ID, 'push')).toMatchObject({ code: 'refused' })
      expect(calls.some((call) => call.args.includes('push'))).toBe(false)
    }
  })

  it('pushes nothing when the branch has caught up since main last read it, and reads it again', async () => {
    const { sync, calls, moved } = harness(readState({ ahead: 1 }), pushing(answer(), {}, '0\n'))
    expect(await sync.run(ID, 'push')).toMatchObject({ code: 'current' })
    expect(calls.some((call) => call.args.includes('push'))).toBe(false)
    // Found in review: the pane went on showing ↑1, its PUSH pressable, until the watcher saw it.
    expect(moved).toEqual([ID])
  })

  it('tells a remote that has moved on from one that refused for its own reasons', async () => {
    const rejected = harness(
      readState({ ahead: 1 }),
      pushing({
        ...answer(porcelain('!', '[rejected] (fetch first)'), false),
        stderr: 'error: failed to push some refs',
      }),
    )
    expect(await rejected.sync.run(ID, 'push')).toMatchObject({
      code: 'rejected',
      message: 'the remote has commits this branch lacks: FETCH, then PULL',
    })

    const declined = harness(
      readState({ ahead: 1 }),
      pushing(answer(porcelain('!', '[remote rejected] (pre-receive hook declined)'), false)),
    )
    expect(await declined.sync.run(ID, 'push')).toMatchObject({
      code: 'failed',
      message: '[remote rejected] (pre-receive hook declined)',
    })

    const current = harness(
      readState({ ahead: 1 }),
      pushing(answer(porcelain('=', '[up to date]'))),
    )
    expect(await current.sync.run(ID, 'push')).toMatchObject({ code: 'current' })
  })

  it('says why when git writes no line for the ref, and stops on a transport that never answers', async () => {
    const failed = harness(
      readState({ ahead: 1 }),
      pushing({
        ...answer('', false),
        stderr: "fatal: 'origin' does not appear to be a git repository",
      }),
    )
    expect(await failed.sync.run(ID, 'push')).toMatchObject({
      code: 'failed',
      message: "'origin' does not appear to be a git repository",
    })

    const slow = harness(readState({ ahead: 1 }), pushing(answer('', false, { timedOut: true })))
    expect(await slow.sync.run(ID, 'push')).toMatchObject({ code: 'timeout' })
  })
})

describe('what the buttons say', () => {
  it('names the upstream each one works on, or why it cannot be pressed', () => {
    const ready = readState({ ahead: 2 })
    expect(syncTitle(ready, 'fetch')).toBe(
      'Fetch from the remote of origin/main, leaving the working tree as it is',
    )
    expect(syncTitle(ready, 'pull')).toBe(
      'Pull origin/main into this branch, fast-forward only (no merge, no rebase, no hooks)',
    )
    expect(syncTitle(ready, 'push')).toBe(
      'Push this branch onto origin/main, never forced. No hooks run: pre-push checks are skipped',
    )
    expect(syncTitle(readState({ ahead: 0 }), 'push')).toBe('Cannot push: nothing to push')
    expect(syncTitle(null, 'fetch')).toBe('Cannot fetch: not read yet')
  })

  it('says, armed, what a push sends where and that no hook runs', () => {
    expect(syncArmed(readState({ ahead: 3 }), 'push')).toBe('push ↑3 to origin/main · no hooks')
    expect(syncArmed(readState(), 'pull')).toBe('pull')
    expect(syncArmed(null, 'push')).toBe('push ↑0 to  · no hooks')
  })

  it('colours an ending: done, the terminal’s to sort out, or failed', () => {
    expect((['fetched', 'pulled', 'pushed', 'current'] as const).map(syncTone)).toEqual([
      'ok',
      'ok',
      'ok',
      'ok',
    ])
    expect((['diverged', 'rejected'] as const).map(syncTone)).toEqual(['warn', 'warn'])
    expect((['busy', 'refused', 'timeout', 'failed'] as const).map(syncTone)).toEqual([
      'danger',
      'danger',
      'danger',
      'danger',
    ])
    expect(SYNC_BUSY).toEqual({ fetch: 'FETCHING', pull: 'PULLING', push: 'PUSHING' })
  })
})
