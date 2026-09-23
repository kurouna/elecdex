import path from 'node:path'
import type { GitState } from '@shared/git'
import { describe, expect, it } from 'vitest'
import { launchPlan, resolveOnPath, runsWhenOpened } from '../../src/main/git/open.js'
import { GIT_FLAGS, type GitResult } from '../../src/main/git/run.js'
import {
  filterGuard,
  GitService,
  MIN_GAP_MS,
  PARK_MS,
  RETRY_MS,
  SETTLE_MS,
} from '../../src/main/git/service.js'

/**
 * The git service against a made-up git, a made-up watcher and a made-up
 * clock: when it reads, how often, and what it answers the page.
 */

const ROOT = path.resolve('/work/app')
/** A one-pixel PNG, and text in a file named as an image. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)
const TEXT = Buffer.from('not an image at all')
const ID = '0123456789abcdef'

interface Harness {
  service: GitService
  published: GitState[]
  calls: string[][]
  fire(relative: string): void
  advance(ms: number): Promise<void>
  status: { output: string }
  /** Whether git can be found; false makes every call fail as a missing git does. */
  git: { present: boolean }
}

/** The git command in a call, past the `-c` pairs in front of it. */
const commandOf = (args: readonly string[]): string | undefined => {
  let i = 0
  while (args[i] === '-c') i += 2
  return args[i]
}

const LOCAL_FILTER = [
  'system\tfilter.lfs.clean git-lfs clean -- %f',
  'system\tfilter.lfs.process git-lfs filter-process',
  "local\tfilter.x.clean sh -c 'evil'",
  'local\tfilter.x.required true',
].join('\n')

function harness(options: { known?: boolean; config?: string } = {}): Harness {
  let now = 1_000_000
  const timers: { at: number; fn: () => void }[] = []
  const listeners: ((relative: string) => void)[] = []
  const published: GitState[] = []
  const calls: string[][] = []
  const status = { output: '# branch.oid aaaaaaa\0# branch.head main\0' }
  const git = { present: true }
  const ok = (stdout: string): GitResult => ({
    ok: true,
    stdout,
    stderr: '',
    missing: false,
    tooLarge: false,
  })
  const service = new GitService({
    run: async (_cwd, args) => {
      calls.push([...args])
      if (!git.present) return { ok: false, stdout: '', stderr: '', missing: true, tooLarge: false }
      const command = commandOf(args)
      if (command === 'rev-parse') return ok(`${path.join(ROOT, '.git')}\n`)
      if (command === 'config') return ok(options.config ?? '')
      if (command === 'status') return ok(status.output)
      if (command === 'log') return ok('aaaaaaaaaaaaaaaa\x1faaaaaaa\x1fme\x1f1\x1ffirst\0')
      return ok('')
    },
    repo: (id) => (id === ID && options.known !== false ? { id, name: 'app', path: ROOT } : null),
    watch: (_folder, onChange) => {
      listeners.push(onChange)
      return { close: () => listeners.splice(listeners.indexOf(onChange), 1) }
    },
    exists: () => true,
    readText: async () => 'hello\n',
    readBytes: async () => PNG,
    gitBytes: async (_cwd, spec) =>
      spec.startsWith('HEAD:') ? PNG : spec.startsWith(':') ? TEXT : null,
    realpath: (file) => path.resolve(file),
    now: () => now,
    setTimer: (fn, ms) => {
      const timer = { at: now + ms, fn }
      timers.push(timer)
      return timer
    },
    clearTimer: (handle) => {
      const i = timers.indexOf(handle as (typeof timers)[number])
      if (i >= 0) timers.splice(i, 1)
    },
    publish: (state) => published.push(state),
  })
  const flush = async (): Promise<void> => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve()
  }
  return {
    service,
    published,
    calls,
    status,
    git,
    fire: (relative) => {
      for (const listener of [...listeners]) listener(relative)
    },
    advance: async (ms) => {
      const until = now + ms
      await flush()
      for (;;) {
        timers.sort((a, b) => a.at - b.at)
        const next = timers[0]
        if (next === undefined || next.at > until) break
        timers.shift()
        now = next.at
        next.fn()
        await flush()
      }
      now = until
      await flush()
    },
  }
}

const statusCalls = (calls: string[][]): number =>
  calls.filter((args) => commandOf(args) === 'status').length

describe('the git service', () => {
  it('reads a repository once when a pane opens it, and publishes what it read', async () => {
    const h = harness()
    h.service.watch(ID)
    await h.advance(0)
    expect(statusCalls(h.calls)).toBe(1)
    expect(h.published.at(-1)).toMatchObject({
      repoId: ID,
      branch: { head: 'main' },
      problem: null,
    })
    expect(h.published.at(-1)?.log[0]?.subject).toBe('first')
  })

  it('says an id is unknown rather than guessing a folder', async () => {
    const h = harness({ known: false })
    h.service.watch(ID)
    await h.advance(0)
    expect(h.published.at(-1)?.problem).toBe('unknown')
    expect(h.calls).toEqual([])
  })

  it('reads after a quiet spell, once for a burst of changes', async () => {
    const h = harness()
    h.service.watch(ID)
    await h.advance(2000)
    for (let i = 0; i < 50; i += 1) h.fire(`src/file${i}.ts`)
    await h.advance(SETTLE_MS - 1)
    expect(statusCalls(h.calls)).toBe(1)
    await h.advance(1)
    expect(statusCalls(h.calls)).toBe(2)
  })

  it('reads at most once a second while changes keep coming', async () => {
    const h = harness()
    h.service.watch(ID)
    await h.advance(0)
    for (let t = 0; t < 5000; t += 100) {
      h.fire('out/bundle.js')
      await h.advance(100)
    }
    // A reading starts at 0, then the steady stream earns one a second at most.
    expect(statusCalls(h.calls)).toBeLessThanOrEqual(1 + Math.ceil(5000 / MIN_GAP_MS))
  })

  it('still reads once a second while changes never stop coming', async () => {
    const h = harness()
    h.service.watch(ID)
    await h.advance(2000)
    // A build in watch mode: a write every 100 ms, never the quiet spell a save ends with.
    for (let t = 0; t < 5000; t += 100) {
      h.fire('out/bundle.js')
      await h.advance(100)
    }
    expect(statusCalls(h.calls)).toBeGreaterThanOrEqual(1 + 4)
  })

  it('publishes again when a listed file is written with the same counts', async () => {
    const h = harness()
    h.status.output += `1 .M N... 100644 100644 100644 a a src/a.ts\0`
    h.service.watch(ID)
    await h.advance(0)
    const before = h.published.length
    // A changed line reworded: +1 -1 before and after, but the diff is another one.
    h.fire(path.join('src', 'a.ts'))
    await h.advance(2000)
    expect(h.published.length).toBe(before + 1)
    // A file that is not in the list changes nothing the pane shows.
    h.fire('notes.txt')
    await h.advance(2000)
    expect(h.published.length).toBe(before + 1)
  })

  it("empties the repository's own filters, and leaves the user's alone", async () => {
    expect(filterGuard(LOCAL_FILTER)).toEqual([
      '-c',
      'filter.x.clean=',
      '-c',
      'filter.x.smudge=',
      '-c',
      'filter.x.process=',
      '-c',
      'filter.x.required=false',
    ])
    const h = harness({ config: LOCAL_FILTER })
    h.status.output += `1 .M N... 100644 100644 100644 a a a.txt\0`
    h.service.watch(ID)
    await h.advance(0)
    await h.service.diff({ repoId: ID, path: 'a.txt', area: 'unstaged' })
    for (const args of h.calls.filter((a) => ['status', 'diff'].includes(commandOf(a) ?? ''))) {
      expect(args.slice(0, 2)).toEqual(['-c', 'filter.x.clean='])
    }
    expect(h.calls.filter((a) => commandOf(a) === 'status')).toHaveLength(1)
    // A submodule's working tree is never looked into: its own filters are not emptied here.
    for (const args of h.calls.filter((a) => ['status', 'diff'].includes(commandOf(a) ?? ''))) {
      expect(args).toContain('--ignore-submodules=dirty')
    }
    // And no signature check, which would run gpg.program, on any call.
    expect(GIT_FLAGS).toEqual(expect.arrayContaining(['log.showSignature=false']))
  })

  it('keeps a repository nobody shows for a while, so a return is one reading, not a start', async () => {
    const h = harness()
    h.service.watch(ID)
    await h.advance(0)
    const first = h.published.at(-1)
    const setup = (calls: string[][]) =>
      calls.filter((args) => ['rev-parse', 'config'].includes(commandOf(args) ?? '')).length
    expect(setup(h.calls)).toBe(2)
    // Behind a tab: the watches go, the reading stays.
    h.service.unwatch(ID)
    expect(h.service.watching()).toEqual([])
    h.fire('a.txt')
    await h.advance(5000)
    expect(statusCalls(h.calls)).toBe(1)
    expect(h.service.snapshot(ID)).toBe(first)
    // Back within the time: no git folder or filters asked again, one reading for what changed.
    h.service.watch(ID)
    await h.advance(0)
    expect(setup(h.calls)).toBe(2)
    expect(statusCalls(h.calls)).toBe(2)
    // And it follows changes again.
    h.fire('b.txt')
    await h.advance(2000)
    expect(statusCalls(h.calls)).toBe(3)
    // Away for longer: it starts over.
    h.service.unwatch(ID)
    await h.advance(PARK_MS)
    h.service.watch(ID)
    await h.advance(0)
    expect(setup(h.calls)).toBe(4)
  })

  it('tries again after a failure, so a pane mends itself once git is there', async () => {
    const h = harness()
    h.git.present = false
    h.service.watch(ID)
    await h.advance(0)
    expect(h.published.at(-1)?.problem).toBe('no-git')
    h.git.present = true
    await h.advance(RETRY_MS)
    expect(h.published.at(-1)?.problem).toBeNull()
    expect(h.published.at(-1)?.branch.head).toBe('main')
  })

  it("shows a commit's file against its first parent, under both names when renamed", async () => {
    const h = harness()
    h.service.watch(ID)
    await h.advance(0)
    await h.service.diff({ repoId: ID, path: 'new.ts', commit: 'abcdef1', from: 'old.ts' })
    const shown = h.calls.at(-1) ?? []
    expect(shown).toEqual(expect.arrayContaining(['show', '--diff-merges=first-parent']))
    expect(shown.slice(-3)).toEqual(['--', 'old.ts', 'new.ts'])
  })

  it('ignores git bookkeeping but follows the index, HEAD and refs', async () => {
    const h = harness()
    h.service.watch(ID)
    await h.advance(2000)
    for (const noise of [
      '.git/index.lock',
      '.git/objects/ab/cdef',
      '.git/logs/HEAD',
      '.git/FETCH_HEAD',
    ]) {
      h.fire(noise)
    }
    await h.advance(2000)
    expect(statusCalls(h.calls)).toBe(1)
    for (const signal of ['.git/index', '.git/HEAD', '.git/refs/heads/main']) {
      h.fire(signal)
      await h.advance(2000)
    }
    expect(statusCalls(h.calls)).toBe(4)
  })

  it('publishes only when what the pane shows changed', async () => {
    const h = harness()
    h.service.watch(ID)
    await h.advance(0)
    const before = h.published.length
    h.fire('README.md')
    await h.advance(2000)
    expect(h.published.length).toBe(before)
    h.status.output += `1 .M N... 100644 100644 100644 a a README.md\0`
    h.fire('README.md')
    await h.advance(2000)
    expect(h.published.length).toBe(before + 1)
    expect(h.published.at(-1)?.files[0]).toMatchObject({ path: 'README.md', area: 'unstaged' })
  })

  it('stops watching when the last pane goes, and reads nothing after', async () => {
    const h = harness()
    h.service.watch(ID)
    await h.advance(0)
    h.service.unwatch(ID)
    h.fire('a.txt')
    await h.advance(5000)
    expect(statusCalls(h.calls)).toBe(1)
    expect(h.service.watching()).toEqual([])
  })

  it('answers a diff only for a file the last reading listed, in that list', async () => {
    const h = harness()
    h.status.output += `1 .M N... 100644 100644 100644 a a a.txt\0? new.txt\0`
    h.service.watch(ID)
    await h.advance(0)
    expect((await h.service.diff({ repoId: ID, path: 'b.txt', area: 'unstaged' })).problem).toMatch(
      /no longer/,
    )
    expect((await h.service.diff({ repoId: ID, path: 'a.txt', area: 'staged' })).problem).toMatch(
      /no longer/,
    )
    await h.service.diff({ repoId: ID, path: 'a.txt', area: 'unstaged' })
    expect(h.calls.at(-1)).toEqual(
      expect.arrayContaining(['diff', '--no-ext-diff', '--no-textconv', '--', 'a.txt']),
    )
    const untracked = await h.service.diff({ repoId: ID, path: 'new.txt', area: 'untracked' })
    expect(untracked.hunks[0]?.lines[0]).toMatchObject({ kind: 'add', text: 'hello' })
  })

  it('shows an image as before and after, and never passes on bytes that are not one', async () => {
    const h = harness()
    h.status.output += `1 M. N... 100644 100644 100644 a a logo.png\0? new.png\0`
    h.service.watch(ID)
    await h.advance(0)
    // Staged: HEAD against the index; the index copy here is text named .png.
    const staged = await h.service.diff({ repoId: ID, path: 'logo.png', area: 'staged' })
    expect(staged.images?.before?.dataUrl).toMatch(/^data:image\/png;base64,/)
    expect(staged.images?.after).toBeNull()
    expect(staged.images?.note).toBe('after is not an image')
    expect(staged.hunks).toEqual([])
    // Untracked: nothing before, the file on disk after.
    const added = await h.service.diff({ repoId: ID, path: 'new.png', area: 'untracked' })
    expect(added.images?.before).toBeNull()
    expect(added.images?.after?.bytes).toBe(PNG.length)
    // Still only what the last reading listed.
    expect(
      (await h.service.diff({ repoId: ID, path: 'other.png', area: 'unstaged' })).problem,
    ).toMatch(/no longer/)
  })

  it('never locates a file outside the repository or in its git folder', async () => {
    const h = harness()
    h.service.watch(ID)
    await h.advance(0)
    expect(h.service.locate(ID, 'src/a.ts')).toBe(path.join(ROOT, 'src', 'a.ts'))
    expect(h.service.locate(ID, '.git/config')).toBeNull()
    expect(h.service.locate('ffffffffffffffff', 'src/a.ts')).toBeNull()
  })
})

describe('starting the open command', () => {
  it('never runs a program, script or shortcut when no command is set', () => {
    for (const file of ['setup.bat', 'tool.EXE', 'run.ps1', 'x.lnk', 'a.js', 'go.cmd']) {
      expect(runsWhenOpened(`C:\\w\\${file}`, 'win32')).toBe(true)
    }
    expect(runsWhenOpened('/w/Tool.app', 'darwin')).toBe(true)
    expect(runsWhenOpened('/w/start.command', 'darwin')).toBe(true)
    expect(runsWhenOpened('/w/app.desktop', 'linux')).toBe(true)
    for (const file of ['README.md', 'a.ts', 'logo.png', 'Makefile']) {
      expect(runsWhenOpened(`C:\\w\\${file}`, 'win32')).toBe(false)
    }
  })

  const exists = (known: string[]) => (file: string) => known.includes(file)

  it('finds a bare command on PATH through PATHEXT, as Windows does', () => {
    const env = { PATH: 'C:\\bin;C:\\code\\bin', PATHEXT: '.EXE;.CMD' }
    expect(resolveOnPath('code', env, exists(['C:\\code\\bin\\code.cmd']))).toBe(
      'C:\\code\\bin\\code.cmd',
    )
    expect(resolveOnPath('C:\\x\\zed.exe', env, exists([]))).toBe('C:\\x\\zed.exe')
  })

  it('starts a program as a program, and a .cmd through cmd.exe with each argument quoted', () => {
    const resolve = (program: string) => (program === 'code' ? 'C:\\code\\bin\\code.cmd' : program)
    expect(launchPlan('zed', ['a b.ts'], 'win32', resolve)).toEqual({
      kind: 'spawn',
      program: 'zed',
      args: ['a b.ts'],
    })
    expect(launchPlan('code', ['-g', 'C:\\w\\a b.ts:3'], 'win32', resolve)).toEqual({
      kind: 'cmd',
      line: '""C:\\code\\bin\\code.cmd" "-g" "C:\\w\\a b.ts:3""',
    })
  })

  it('refuses a .cmd for a file whose name cmd.exe would act on', () => {
    const resolve = () => 'C:\\code\\bin\\code.cmd'
    for (const name of ['a&calc.ts', 'a%PATH%.ts', 'a"b.ts', 'a^b.ts', 'a|b.ts']) {
      expect(launchPlan('code', [`C:\\w\\${name}`], 'win32', resolve).kind).toBe('refused')
    }
  })

  it('never goes near a shell on other systems', () => {
    expect(launchPlan('code', ['a&b.ts'], 'linux', (p) => p)).toEqual({
      kind: 'spawn',
      program: 'code',
      args: ['a&b.ts'],
    })
  })
})

describe('the recent repositories', () => {
  it('writes the list only when a use changes its order', async () => {
    const { mkdtempSync, rmSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const { RepoCatalog } = await import('../../src/main/git/repos.js')
    const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-repos-'))
    try {
      const catalog = new RepoCatalog(path.join(dir, 'git-repos.json'))
      const a = catalog.add(path.join(dir, 'a'), 1000)
      const b = catalog.add(path.join(dir, 'b'), 2000)
      const lastUsed = (id: string) =>
        (
          new RepoCatalog(path.join(dir, 'git-repos.json')) as unknown as {
            store: { read(): { repos: { id: string; lastUsed: number }[] } }
          }
        ).store
          .read()
          .repos.find((r) => r.id === id)?.lastUsed
      // A pane coming back to the repository already on top: nothing to write.
      catalog.touch(b.id, 3000)
      expect(lastUsed(b.id)).toBe(2000)
      // Another one used: it goes to the top.
      catalog.touch(a.id, 4000)
      expect(lastUsed(a.id)).toBe(4000)
      expect(catalog.recent().map((r) => r.id)).toEqual([a.id, b.id])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
