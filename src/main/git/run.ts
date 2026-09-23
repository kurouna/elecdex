import { execFile } from 'node:child_process'

/**
 * Runs git for the git pane, and only ever to read.
 *
 * A repository's own config can name programs for git to run - a file system
 * monitor (`core.fsmonitor`), an external diff, a text converter - so a
 * repository cloned from anywhere could run code the moment the pane looks at
 * it. Every call therefore turns the monitor off and signature checks (which
 * run `gpg.program`) off, and asks for no external diff and no conversion (the
 * diff commands add those); clean filters the repository itself defines are
 * emptied per repository (GitService), and none of the commands used here runs
 * a hook.
 *
 * `--no-optional-locks` keeps `git status` from writing the index to refresh
 * it: the write would take index.lock, which could fail the user's own git
 * command in the terminal beside the pane, and would wake our own watcher.
 * `--literal-pathspecs` makes a path a path: a file named `:(exclude)x` is not
 * a pattern.
 *
 * Measured (i5-1335U, Windows 11): the `spawn` itself holds main 3-13 ms, and
 * `git status` on this repository takes ~55 ms end to end. A refresh runs at
 * most once a second per repository, and only when something changed, so git
 * runs from main directly rather than from a utility process.
 */

export const GIT_FLAGS: readonly string[] = [
  '--no-optional-locks',
  '--literal-pathspecs',
  '-c',
  'core.fsmonitor=false',
  '-c',
  'core.quotepath=false',
  '-c',
  'color.ui=false',
  '-c',
  'log.showSignature=false',
]

/** A diff larger than this is not drawn; git's output is cut here. */
const MAX_OUTPUT = 16 * 1024 * 1024
/** Nothing the pane asks for should take this long; a hung git is stopped. */
const TIMEOUT_MS = 20_000

export interface GitResult {
  ok: boolean
  stdout: string
  stderr: string
  /** git itself could not be started: not installed, or not on PATH. */
  missing: boolean
  /** The output passed MAX_OUTPUT. */
  tooLarge: boolean
}

export type RunGit = (cwd: string, args: readonly string[]) => Promise<GitResult>

export const runGit: RunGit = (cwd, args) =>
  new Promise((resolve) => {
    execFile(
      'git',
      [...GIT_FLAGS, ...args],
      {
        cwd,
        encoding: 'utf8',
        maxBuffer: MAX_OUTPUT,
        timeout: TIMEOUT_MS,
        windowsHide: true,
        // Never stop to ask for a password or an editor: there is nobody to answer.
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_EDITOR: 'true', GIT_PAGER: 'cat' },
      },
      (error, stdout, stderr) => {
        const code = (error as NodeJS.ErrnoException | null)?.code
        resolve({
          ok: error === null,
          stdout: String(stdout ?? ''),
          stderr: String(stderr ?? ''),
          missing: code === 'ENOENT',
          tooLarge: code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
        })
      },
    )
  })

/** A file's bytes as git holds them (`git show <rev>:<path>`), or null when it has none there. */
export type GitBytes = (
  cwd: string,
  spec: string,
  max: number,
) => Promise<Buffer | 'too-large' | null>

export const gitBytes: GitBytes = (cwd, spec, max) =>
  new Promise((resolve) => {
    execFile(
      'git',
      [...GIT_FLAGS, 'show', spec],
      {
        cwd,
        encoding: 'buffer',
        maxBuffer: max,
        timeout: TIMEOUT_MS,
        windowsHide: true,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_PAGER: 'cat' },
      },
      (error, stdout) => {
        const code = (error as NodeJS.ErrnoException | null)?.code
        if (code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') resolve('too-large')
        else resolve(error === null ? Buffer.from(stdout) : null)
      },
    )
  })

/** The first line of what git said went wrong, for the pane to show. */
export const gitError = (result: GitResult): string =>
  (result.stderr.trim().split('\n')[0] ?? '').replace(/^(fatal|error): /, '').slice(0, 200)
