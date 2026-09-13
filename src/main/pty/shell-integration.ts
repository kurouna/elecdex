import { copyFileSync, existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Works out how to make a given shell load our integration script.
 *
 * Each shell needs a different lever, and two of them (bash, zsh) suppress the
 * user's own startup files when we pull it - which is why the scripts in
 * resources/shell-integration source those files back. See docs/architecture.md
 * section 6.2.
 */

export type ShellKind = 'bash' | 'zsh' | 'fish' | 'pwsh' | 'powershell' | 'unknown'

export interface Injection {
  /** Extra arguments to pass to the shell, prepended to the user's own. */
  args: string[]
  /** Environment overrides to merge in. */
  env: Record<string, string>
  /** False when we have no way to instrument this shell. */
  supported: boolean
}

/**
 * Locates `resources/shell-integration`.
 *
 * This module runs from three different depths - `src/main/pty/` under vitest,
 * `out/main/` after a build, and the app directory once packaged - so a fixed
 * number of `..` segments is wrong in at least two of them. Walking up until the
 * directory is found is correct in all three, and fails loudly if it is absent.
 */
/**
 * Maps a path inside `app.asar` to its twin in `app.asar.unpacked`.
 *
 * Electron patches Node's fs so the main process can read inside the archive,
 * which is why the walk-up below finds the scripts either way. But the paths are
 * handed to a *shell* - bash reads `--init-file`, fish scans `XDG_DATA_DIRS` -
 * and a separate process sees only the real filesystem, where an asar path does
 * not exist. The scripts are listed in electron-builder's `asarUnpack`, so the
 * real copies live under `app.asar.unpacked`.
 */
export function outsideAsar(p: string): string {
  return p.replace(/([\\/])app\.asar([\\/])/, '$1app.asar.unpacked$2')
}

let cachedScriptsDir: string | null = null
function scriptsDir(): string {
  if (cachedScriptsDir !== null) return cachedScriptsDir

  let dir = path.dirname(fileURLToPath(import.meta.url))
  // Bounded so a missing resources/ directory cannot loop to the filesystem root.
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'resources', 'shell-integration')
    if (existsSync(path.join(candidate, 'elecdex.ps1'))) {
      cachedScriptsDir = outsideAsar(candidate)
      return cachedScriptsDir
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  throw new Error(
    'Could not locate resources/shell-integration. This is a packaging bug: ' +
      'the shell-integration scripts must ship alongside the app.',
  )
}

/**
 * Identifies a shell from its executable path.
 *
 * Matches on the basename only, so /usr/local/bin/bash, /bin/bash and
 * C:\Program Files\Git\bin\bash.exe all resolve the same way.
 */
export function detectShellKind(shellPath: string): ShellKind {
  // Split on both separators: path.basename on Linux and macOS leaves a Windows
  // path whole, and the tests run everywhere.
  const base = (shellPath.split(/[\\/]/).pop() ?? '').toLowerCase().replace(/\.exe$/, '')
  switch (base) {
    case 'bash':
    case 'sh': // usually bash in posix mode; the script is bash-only, so treat with care
      return base === 'bash' ? 'bash' : 'unknown'
    case 'zsh':
      return 'zsh'
    case 'fish':
      return 'fish'
    case 'pwsh':
      return 'pwsh'
    case 'powershell':
      return 'powershell'
    default:
      return 'unknown'
  }
}

/**
 * Builds the args and env that load the integration script for `shellPath`.
 *
 * `env` is the environment the PTY will get; we read the user's ZDOTDIR and
 * XDG_DATA_DIRS from it so we can chain rather than clobber.
 */
export function buildInjection(shellPath: string, env: Record<string, string>): Injection {
  const dir = scriptsDir()
  const kind = detectShellKind(shellPath)

  switch (kind) {
    case 'bash':
      // --init-file replaces the user's rc; elecdex.bash sources it back.
      return {
        args: ['--init-file', path.join(dir, 'elecdex.bash')],
        env: {},
        supported: true,
      }

    case 'zsh': {
      // zsh only reads .zshrc from $ZDOTDIR, so hand it a directory containing
      // ours and tell the script where the real one was.
      const staging = mkdtempSync(path.join(tmpdir(), 'elecdex-zsh-'))
      copyFileSync(path.join(dir, 'elecdex.zsh'), path.join(staging, '.zshrc'))
      const userZdotdir = env.ZDOTDIR ?? env.HOME ?? ''
      return {
        args: [],
        env: { ZDOTDIR: staging, ELECDEX_USER_ZDOTDIR: userZdotdir },
        supported: true,
      }
    }

    case 'fish': {
      // fish auto-loads <datadir>/fish/vendor_conf.d/*.fish from every
      // XDG_DATA_DIRS entry, after the user's own config - so no sourcing back
      // is needed. `dir` IS the datadir; the script lives at
      // resources/shell-integration/fish/vendor_conf.d/elecdex.fish.
      const existing = env.XDG_DATA_DIRS
      return {
        args: [],
        env: { XDG_DATA_DIRS: existing ? `${dir}${path.delimiter}${existing}` : dir },
        supported: true,
      }
    }

    case 'pwsh':
    case 'powershell': {
      // Do NOT dot-source the .ps1 from disk: Windows ships with an
      // ExecutionPolicy that refuses to run script *files*, so on a default
      // install that silently yields no shell integration at all. Passing the
      // same code as a command is not governed by ExecutionPolicy, so this
      // works everywhere without asking the user to weaken a security setting.
      //
      // -EncodedCommand takes base64 of UTF-16LE, which also sidesteps every
      // quoting hazard in handing a multi-line script through a command line.
      //
      // Deliberately not wrapped in a try/catch: a missing or unreadable script
      // is a broken build, and reporting it as "this shell is unsupported"
      // would hide the bug behind a plausible-looking degraded mode.
      const script = readFileSync(path.join(dir, 'elecdex.ps1'), 'utf8')
      const encoded = Buffer.from(script, 'utf16le').toString('base64')
      // PowerShell has already run the user's profile by the time this executes,
      // so it is purely additive; -NoExit keeps the session interactive.
      return {
        args: ['-NoExit', '-EncodedCommand', encoded],
        env: {},
        supported: true,
      }
    }

    default:
      return { args: [], env: {}, supported: false }
  }
}

/**
 * The default shell for this platform, used when the user has not configured one.
 */
export function defaultShell(env: Record<string, string>): string {
  if (process.platform === 'win32') {
    return env.ComSpec?.toLowerCase().includes('powershell') ? env.ComSpec : 'powershell.exe'
  }
  return env.SHELL ?? '/bin/bash'
}

/**
 * The base environment for a PTY: the inherited env plus the terminal
 * identification a well-behaved shell expects.
 */
export function terminalEnv(
  base: Record<string, string | undefined>,
  version: string,
): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(base)) {
    if (value !== undefined) env[key] = value
  }

  // Proxy variables break nothing now that the PTY is not tunnelled over a
  // local socket (the original project had to delete them - see its issue #222),
  // so they are left alone and simply inherited.

  env.TERM = 'xterm-256color'
  env.COLORTERM = 'truecolor'
  env.TERM_PROGRAM = 'elecdex'
  env.TERM_PROGRAM_VERSION = version
  return env
}
