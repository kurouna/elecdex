import { execFile } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import type { CliCall, CliResult, CliTool } from '@shared/cloud-cli/probe'
import { killTree } from '../process/kill-tree.js'

/**
 * Starts the AWS and GitHub CLIs for the CLI panes (docs/cloud-cli.md §2).
 *
 * Directly, never through a shell or PowerShell (user decision 2026-11-08, measured in §2.1): the
 * arguments are an array no shell reads, `shell` is false and a `.cmd` is never started. The
 * program is found by its absolute path - the absolute entries of PATH, then the folders the
 * installers use - and never in the current folder, which Windows would search first. It runs in
 * a fixed empty folder, so gh reads no repository's `{owner}`/`{repo}` from wherever elecdex was
 * started.
 */

const MAX_OUTPUT = 4 * 1024 * 1024
const TIMEOUT_MS = 20_000

const EXECUTABLE: Record<CliTool, { win: string; posix: string }> = {
  aws: { win: 'aws.exe', posix: 'aws' },
  gh: { win: 'gh.exe', posix: 'gh' },
}

/** Where the installers put them, for a PATH that elecdex started before the install (§2.2). */
function knownFolders(tool: CliTool, env: NodeJS.ProcessEnv, platform: NodeJS.Platform): string[] {
  if (platform === 'win32') {
    const local = env.LOCALAPPDATA ?? ''
    const programs = env.ProgramFiles ?? 'C:\\Program Files'
    return tool === 'aws'
      ? [
          path.win32.join(local, 'Programs', 'Amazon', 'AWSCLIV2'),
          path.win32.join(programs, 'Amazon', 'AWSCLIV2'),
        ]
      : [path.win32.join(programs, 'GitHub CLI'), path.win32.join(local, 'Programs', 'GitHub CLI')]
  }
  return ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin']
}

/**
 * The CLI's absolute path, or null. Only absolute PATH entries count: a relative one ("." or
 * "bin") would make the folder elecdex runs in a place to plant a program.
 */
export function findExecutable(
  tool: CliTool,
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
  exists: (file: string) => boolean = existsSync,
): string | null {
  const p = platform === 'win32' ? path.win32 : path.posix
  const name = platform === 'win32' ? EXECUTABLE[tool].win : EXECUTABLE[tool].posix
  const rawPath = env.PATH ?? env.Path ?? ''
  const entries = rawPath
    .split(platform === 'win32' ? ';' : ':')
    .map((entry) => entry.trim().replace(/^"(.*)"$/, '$1'))
    .filter((entry) => entry !== '' && p.isAbsolute(entry))
  for (const folder of [...entries, ...knownFolders(tool, env, platform)]) {
    const file = p.join(folder, name)
    if (exists(file)) return file
  }
  return null
}

/**
 * The environment a CLI runs with: the process's own, with prompts, pagers, colour and update
 * checks off. AWS's region variables go: every call names its region. gh is held to github.com,
 * whatever GH_HOST says (v1 reads github.com only).
 */
export function cliEnv(tool: CliTool, env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (tool === 'aws') {
    const { AWS_REGION: _region, AWS_DEFAULT_REGION: _default, ...rest } = env
    return {
      ...rest,
      AWS_PAGER: '',
      AWS_CLI_AUTO_PROMPT: 'off',
      AWS_RETRY_MODE: 'standard',
      AWS_MAX_ATTEMPTS: '2',
      // Japanese Windows pipes Python's output as cp932 otherwise: Japanese Name tags break.
      PYTHONUTF8: '1',
      PYTHONIOENCODING: 'utf-8',
    }
  }
  return {
    ...env,
    GH_PROMPT_DISABLED: '1',
    GH_NO_UPDATE_NOTIFIER: '1',
    GH_PAGER: '',
    NO_COLOR: '1',
    GH_SPINNER_DISABLED: '1',
    GH_HOST: 'github.com',
  }
}

/** The flags every call of a tool carries, before its own. */
export function fixedFlags(tool: CliTool): string[] {
  return tool === 'aws'
    ? [
        '--output',
        'json',
        '--no-cli-pager',
        '--color',
        'off',
        '--cli-connect-timeout',
        '5',
        '--cli-read-timeout',
        '15',
      ]
    : []
}

export interface CliRunner {
  run(call: CliCall): Promise<CliResult>
  /** The program found for a tool, for the ledger's card; null when there is none. */
  executable(tool: CliTool): string | null
}

/**
 * The runner: looks each program up once (again after a miss, so an install is seen without a
 * restart when the installer put it in a known folder), and starts it in `cwd`.
 */
export function createCliRunner(cwd: string, env: NodeJS.ProcessEnv = process.env): CliRunner {
  mkdirSync(cwd, { recursive: true })
  const found = new Map<CliTool, string>()
  const locate = (tool: CliTool): string | null => {
    const known = found.get(tool)
    if (known !== undefined) return known
    const file = findExecutable(tool, env, process.platform)
    if (file !== null) found.set(tool, file)
    return file
  }
  return {
    executable: locate,
    run: (call) => {
      const file = locate(call.tool)
      if (file === null) return Promise.resolve(missing())
      return execute(
        file,
        [...fixedFlags(call.tool), ...call.argv],
        call.stdin,
        cwd,
        cliEnv(call.tool, env),
      )
    },
  }
}

const missing = (): CliResult => ({
  ok: false,
  code: null,
  stdout: '',
  stderr: '',
  missing: true,
  timedOut: false,
  tooLarge: false,
})

function execute(
  file: string,
  args: string[],
  stdin: string | undefined,
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<CliResult> {
  return new Promise((resolve) => {
    let timedOut = false
    let timer: NodeJS.Timeout | undefined
    const child = execFile(
      file,
      args,
      {
        cwd,
        env,
        encoding: 'utf8',
        maxBuffer: MAX_OUTPUT,
        windowsHide: true,
        shell: false,
        // Its own process group off Windows, so a timeout ends its helpers too (killTree).
        ...({ detached: process.platform !== 'win32' } as object),
      },
      (error, stdout, stderr) => {
        if (timer !== undefined) clearTimeout(timer)
        const err = error as (NodeJS.ErrnoException & { code?: unknown }) | null
        const code = typeof err?.code === 'number' ? err.code : err === null ? 0 : null
        resolve({
          ok: err === null,
          code,
          stdout: String(stdout ?? ''),
          stderr: String(stderr ?? ''),
          missing: err?.code === 'ENOENT',
          timedOut,
          tooLarge: err?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
        })
      },
    )
    if (stdin !== undefined) child.stdin?.end(stdin)
    else child.stdin?.end()
    timer = setTimeout(() => {
      timedOut = true
      if (child.pid !== undefined) killTree(child.pid)
      else child.kill()
    }, TIMEOUT_MS)
  })
}
