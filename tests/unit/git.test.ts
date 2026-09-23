import {
  addedFileDiff,
  changedSpan,
  commitFiles,
  isImagePath,
  isRepoPath,
  LOG_MAX,
  LOG_PAGE,
  looksBinary,
  MAX_BODY,
  MAX_DIFF_LINES,
  openCommand,
  pairChanges,
  parseDiff,
  parseDiffRequest,
  parseGraphLog,
  parseLog,
  parseLogRequest,
  parseNameStatus,
  parseNumstat,
  parseRefs,
  parseStatus,
  sniffImage,
  withCounts,
} from '@shared/git'
import { applySettingsPatch, defaultSettings, SettingsSchema } from '@shared/settings'
import { describe, expect, it } from 'vitest'

/**
 * The git pane's reading of git's own output. The fixtures are what git 2.x
 * printed for a scratch repository: a staged edit edited again, a staged
 * rename with a space in both names, a deletion and an untracked file.
 */

const H = '4cb29ea38f70d7c61b2a3a25b02e3bdf44905402'
const STATUS = [
  '# branch.oid 15e193e1231df1cd7e57cc6cab1979ca6ddc46bd',
  '# branch.head main',
  '# branch.upstream origin/main',
  '# branch.ab +2 -1',
  '# stash 3',
  `1 MM N... 100644 100644 100644 ${H} ${H} a.txt`,
  `1 .D N... 100644 100644 000000 ${H} ${H} gone.txt`,
  `2 R. N... 100644 100644 100644 ${H} ${H} R100 new name.txt`,
  'old name.txt',
  `u UU N... 100644 100644 100644 100644 ${H} ${H} ${H} both.txt`,
  '? new file.md',
  '',
].join('\0')

describe('git status', () => {
  const parsed = parseStatus(STATUS)

  it('reads the branch, where it stands against its upstream, and the stash', () => {
    expect(parsed.branch).toEqual({
      head: 'main',
      oid: '15e193e1231df1cd7e57cc6cab1979ca6ddc46bd',
      upstream: 'origin/main',
      ahead: 2,
      behind: 1,
    })
    expect(parsed.stash).toBe(3)
  })

  it('puts a file edited after staging in both lists', () => {
    const a = parsed.files.filter((file) => file.path === 'a.txt')
    expect(a.map((file) => [file.area, file.code])).toEqual([
      ['staged', 'M'],
      ['unstaged', 'M'],
    ])
  })

  it('keeps a rename with the old name, spaces and all', () => {
    expect(parsed.files.find((file) => file.code === 'R')).toMatchObject({
      path: 'new name.txt',
      from: 'old name.txt',
      area: 'staged',
    })
    // The old name is a field of its own, not an entry: nothing else follows from it.
    expect(parsed.files.some((file) => file.path === 'old name.txt')).toBe(false)
  })

  it('sorts conflicts and untracked files into their own lists', () => {
    expect(parsed.files.find((file) => file.path === 'both.txt')).toMatchObject({
      area: 'conflicted',
      code: 'U',
    })
    expect(parsed.files.find((file) => file.path === 'new file.md')).toMatchObject({
      area: 'untracked',
      code: '?',
    })
    expect(parsed.files.find((file) => file.path === 'gone.txt')).toMatchObject({
      area: 'unstaged',
      code: 'D',
    })
  })

  it('reads a repository with no commits and a detached HEAD', () => {
    expect(parseStatus('# branch.oid (initial)\0# branch.head main\0').branch.oid).toBeNull()
    expect(parseStatus('# branch.oid abc\0# branch.head (detached)\0').branch.head).toBeNull()
  })
})

describe('git diff --numstat', () => {
  it('reads counts, binaries and renames', () => {
    const rows = parseNumstat('1\t1\ta.txt\x000\t0\t\0old name.txt\0new name.txt\0-\t-\timg.png\0')
    expect(rows).toEqual([
      { path: 'a.txt', added: 1, deleted: 1, binary: false },
      { path: 'new name.txt', added: 0, deleted: 0, binary: false },
      { path: 'img.png', added: null, deleted: null, binary: true },
    ])
  })

  it('puts the counts on the files of one list only', () => {
    const files = withCounts(parseStatus(STATUS).files, 'staged', parseNumstat('1\t1\ta.txt\0'))
    const a = files.filter((file) => file.path === 'a.txt')
    expect(a.map((file) => file.added)).toEqual([1, null])
  })
})

describe('git log and commits', () => {
  it('reads commits apart by NUL, fields apart by US', () => {
    const log = parseLog(
      'dfb20b41642382d208df875ea96b7a4beb7212ad\x1fdfb20b4\x1fTester\x1f1790126720\x1fsecond: rename\0' +
        '15e193e1231df1cd7e57cc6cab1979ca6ddc46bd\x1f15e193e\x1fTester\x1f1790126710\x1ffirst\0',
    )
    expect(log.map((commit) => [commit.short, commit.subject, commit.time])).toEqual([
      ['dfb20b4', 'second: rename', 1_790_126_720],
      ['15e193e', 'first', 1_790_126_710],
    ])
    expect(parseLog('')).toEqual([])
  })

  it('reads the graph: parents, the names on each commit, and a message body', () => {
    // As git 2.54 printed it for a merge of a branch with a tag on the merge (--decorate=full, -z).
    const output =
      'eca456646bdb530f5fc886a5a15ce7d9cac7095a\x1feca4566\x1fba6e110db88bf49abddaa731fab2f02f0303204 18baaf06e1c17975c725b2fda3b4ae1f0888d250\x1fT\x1f1790174061\x1fHEAD -> refs/heads/main, tag: refs/tags/v1\x1fMerge f\x1f\0' +
      '18baaf06e1c17975c725b2fda3b4ae1f0888d250\x1f18baaf0\x1fba6e110db88bf49abddaa731fab2f02f0303204\x1fT\x1f1790174061\x1frefs/heads/f\x1ffeat: on f\x1fThe body line one.\nLine two.\n\0' +
      'ba6e110db88bf49abddaa731fab2f02f0303204\x1fba6e110\x1f\x1fT\x1f1790174061\x1f\x1ffirst\x1f\0'
    const commits = parseGraphLog(output)
    expect(commits.map((c) => [c.short, c.parents.length, c.subject])).toEqual([
      ['eca4566', 2, 'Merge f'],
      ['18baaf0', 1, 'feat: on f'],
      ['ba6e110', 0, 'first'],
    ])
    expect(commits[0]?.refs).toEqual([
      { name: 'main', kind: 'branch', current: true },
      { name: 'v1', kind: 'tag', current: false },
    ])
    expect(commits[1]?.refs).toEqual([{ name: 'f', kind: 'branch', current: false }])
    expect(commits[1]?.body).toBe('The body line one.\nLine two.')
    expect(parseGraphLog('')).toEqual([])
  })

  it('tells a local branch from a remote one by its full name, and leaves out a remote HEAD', () => {
    expect(
      parseRefs(
        'refs/remotes/origin/main, refs/remotes/origin/HEAD, tag: refs/tags/v0.0.14, refs/heads/feature/x',
      ),
    ).toEqual([
      { name: 'feature/x', kind: 'branch', current: false },
      { name: 'origin/main', kind: 'remote', current: false },
      { name: 'v0.0.14', kind: 'tag', current: false },
    ])
    expect(parseRefs('HEAD, refs/heads/main')[0]).toEqual({
      name: 'HEAD',
      kind: 'head',
      current: true,
    })
  })

  it('cuts a long message body, which is drawn as text', () => {
    const body = 'x'.repeat(MAX_BODY + 50)
    const [commit] = parseGraphLog(
      `ba6e110db88bf49abddaa731fab2f02f0303204\x1fba6e110\x1f\x1fT\x1f1\x1f\x1fs\x1f${body}\0`,
    )
    expect(commit?.body).toHaveLength(MAX_BODY)
  })

  it('takes a graph request for one of its repositories, in whole pages', () => {
    const ok = { repoId: '0123456789abcdef', scope: 'all', count: 100 }
    expect(parseLogRequest(ok)).toEqual(ok)
    expect(parseLogRequest({ ...ok, count: 250 })?.count).toBe(300)
    expect(parseLogRequest({ ...ok, count: 1 })?.count).toBe(LOG_PAGE)
    expect(parseLogRequest({ ...ok, count: 10 ** 9 })?.count).toBe(LOG_MAX)
    expect(parseLogRequest({ ...ok, scope: '--all' })).toBeNull()
    expect(parseLogRequest({ ...ok, repoId: '../x' })).toBeNull()
    expect(parseLogRequest({ ...ok, count: 1.5 })).toBeNull()
    expect(parseLogRequest(null)).toBeNull()
  })

  it('gives a commit its files with their real codes', () => {
    const names = parseNameStatus('M\0a.txt\0R100\0old name.txt\0new name.txt\0A\0x\0')
    expect(names).toEqual([
      { code: 'M', path: 'a.txt' },
      { code: 'R', from: 'old name.txt', path: 'new name.txt' },
      { code: 'A', path: 'x' },
    ])
    const files = commitFiles(names, parseNumstat('3\t1\ta.txt\0'))
    expect(files[0]).toMatchObject({ code: 'M', added: 3, deleted: 1 })
    expect(files[1]).toMatchObject({ code: 'R', from: 'old name.txt', added: null })
  })
})

describe('a diff', () => {
  const base = { repoId: '0123456789abcdef', path: 'a.txt' }

  it('numbers each line on the side it is on', () => {
    const diff = parseDiff(
      'diff --git a/a.txt b/a.txt\nindex 4cb29ea..6addb9b 100644\n--- a/a.txt\n+++ b/a.txt\n' +
        '@@ -1,3 +1,4 @@ function top()\n one\n-two\n+TWO\n three\n+four\n',
      base,
    )
    expect(diff.hunks).toHaveLength(1)
    expect(diff.hunks[0]?.context).toBe('function top()')
    expect(diff.hunks[0]?.lines).toEqual([
      { kind: 'ctx', text: 'one', old: 1, new: 1 },
      { kind: 'del', text: 'two', old: 2, new: null },
      { kind: 'add', text: 'TWO', old: null, new: 2 },
      { kind: 'ctx', text: 'three', old: 3, new: 3 },
      { kind: 'add', text: 'four', old: null, new: 4 },
    ])
  })

  it('says binary for a binary file, and drops the no-newline marker', () => {
    expect(parseDiff('diff --git a/x b/x\nBinary files a/x and b/x differ\n', base).binary).toBe(
      true,
    )
    const diff = parseDiff('@@ -1 +1 @@\n-a\n\\ No newline at end of file\n+b\n', base)
    expect(diff.hunks[0]?.lines.map((line) => line.kind)).toEqual(['del', 'add'])
  })

  it('cuts a diff too long to draw, and says so', () => {
    const long = `@@ -0,0 +1,${MAX_DIFF_LINES + 5} @@\n${'+x\n'.repeat(MAX_DIFF_LINES + 5)}`
    const diff = parseDiff(long, base)
    expect(diff.cut).toBe(true)
    expect(diff.hunks[0]?.lines).toHaveLength(MAX_DIFF_LINES)
  })

  it('shows an untracked file as all added, and tells binary text', () => {
    const diff = addedFileDiff('a\r\nb\n', base)
    expect(diff.hunks[0]?.lines).toEqual([
      { kind: 'add', text: 'a', old: null, new: 1 },
      { kind: 'add', text: 'b', old: null, new: 2 },
    ])
    expect(looksBinary('PNG\0\0')).toBe(true)
    expect(looksBinary('plain')).toBe(false)
  })

  it('lights only the part of a line that changed', () => {
    expect(changedSpan('const a = 1', 'const a = 42')).toEqual({ old: [10, 11], new: [10, 12] })
    const lines = parseDiff("@@ -1,2 +1,2 @@\n-let x = 'a'\n-same\n+let x = 'b'\n+other\n", base)
      .hunks[0]?.lines
    const spans = pairChanges(lines ?? [])
    expect(spans.get(0)).toEqual([9, 10])
    expect(spans.get(2)).toEqual([9, 10])
    // Rewritten end to end: nothing to set it against, so nothing is lit.
    expect(spans.has(1)).toBe(false)
  })
})

describe('what the page may ask for', () => {
  it('takes only a path inside the repository', () => {
    expect(isRepoPath('src/a b.ts')).toBe(true)
    for (const bad of ['', '/etc/passwd', 'C:/x', '..\\x', 'a/../../x', 'a//b', './a', 'a\0b']) {
      expect(isRepoPath(bad)).toBe(false)
    }
  })

  it('takes a diff of a listed area or of a commit, and nothing else', () => {
    const repoId = '0123456789abcdef'
    expect(parseDiffRequest({ repoId, path: 'a', area: 'staged' })).toEqual({
      repoId,
      path: 'a',
      area: 'staged',
    })
    expect(parseDiffRequest({ repoId, path: 'a', commit: 'dfb20b4' })).toMatchObject({
      commit: 'dfb20b4',
    })
    expect(parseDiffRequest({ repoId, path: 'a', area: 'everything' })).toBeNull()
    expect(parseDiffRequest({ repoId, path: 'a', commit: 'HEAD; rm -rf' })).toBeNull()
    expect(parseDiffRequest({ repoId: 'x', path: 'a', area: 'staged' })).toBeNull()
    // A rename in a commit names where it came from, held to the same rules as the path.
    expect(parseDiffRequest({ repoId, path: 'b', commit: 'dfb20b4', from: 'a' })).toMatchObject({
      from: 'a',
    })
    expect(parseDiffRequest({ repoId, path: 'b', commit: 'dfb20b4', from: '../x' })).toBeNull()
  })
})

describe('the command that opens a file', () => {
  const target = { file: 'C:\\w\\my repo\\a.ts', line: 12, dir: 'C:\\w\\my repo' }

  it('fills the placeholders in each argument, never through a shell', () => {
    expect(openCommand('code -g "{file}:{line}"', target)).toEqual({
      program: 'code',
      args: ['-g', 'C:\\w\\my repo\\a.ts:12'],
    })
    // A name with a space stays one argument; nothing in it is ever run.
    expect(openCommand('"C:\\Program Files\\Sublime Text\\subl.exe"', target)).toEqual({
      program: 'C:\\Program Files\\Sublime Text\\subl.exe',
      args: ['C:\\w\\my repo\\a.ts'],
    })
  })

  it('opens at the first line when there is no line, and is off when empty', () => {
    expect(openCommand('zed {file}:{line}', { ...target, line: null })?.args).toEqual([
      'C:\\w\\my repo\\a.ts:1',
    ])
    expect(openCommand('   ', target)).toBeNull()
  })

  it('fills in one pass: a placeholder inside a file name stays as it is', () => {
    const odd = { file: 'C:\\w\\a{dir}{line}.txt', line: 3, dir: 'C:\\w' }
    expect(openCommand('ed {file}', odd)?.args).toEqual(['C:\\w\\a{dir}{line}.txt'])
  })
})

describe('who may set the open command', () => {
  it('is set in settings.json only: a patch from the page cannot name a program', () => {
    const current = defaultSettings()
    const next = applySettingsPatch(current, { git: { openCommand: 'calc.exe' }, theme: 'amber' })
    expect(next?.theme).toBe('amber')
    expect(next?.git.openCommand).toBe('')
    // A hand edit that is not a string costs only the command, not the file.
    expect(SettingsSchema.parse({ git: { openCommand: 42 } }).git.openCommand).toBe('')
  })
})

describe('telling an image by its bytes', () => {
  it('knows the raster formats by their first bytes, not their names', () => {
    const bytes = (...values: number[]) => new Uint8Array(values)
    const text = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)))
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png')
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
    expect(sniffImage(text('GIF89a...'))).toBe('image/gif')
    expect(sniffImage(text('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp')
    expect(sniffImage(text('<svg onload="alert(1)">'))).toBeNull()
    expect(sniffImage(text('not an image'))).toBeNull()
    expect(isImagePath('docs/shot.PNG')).toBe(true)
    expect(isImagePath('icon.svg')).toBe(false)
  })
})
