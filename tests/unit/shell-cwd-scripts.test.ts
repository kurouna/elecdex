import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { OscParser } from '../../src/main/pty/osc-parser.js'

/**
 * Runs each shell's own integration script and reads what it reports with the
 * parser main uses: the folder a pane is restored in is whatever this says.
 *
 * A folder named outside ASCII once came back as another path from bash (code
 * points percent-encoded, not UTF-8 bytes), and zsh reported no folder at all
 * (its `path` is PATH's array). Only where the shell is installed: elecdex
 * starts these shells on Linux and macOS, never on Windows, whose Git Bash
 * calls C:\ /c.
 */
const SCRIPTS = path.resolve('resources/shell-integration')

interface Shell {
  name: string
  script: string
  args: (script: string, dir: string) => string[]
}

const SHELLS: Shell[] = [
  {
    name: 'bash',
    script: 'elecdex.bash',
    args: (script, dir) => [
      '--norc',
      '--noprofile',
      '-c',
      'source "$1"; cd "$2" && __elecdex_cwd',
      'bash',
      script,
      dir,
    ],
  },
  {
    name: 'zsh',
    script: 'elecdex.zsh',
    args: (script, dir) => [
      '-f',
      '-c',
      'source "$1"; cd "$2" && __elecdex_cwd',
      'zsh',
      script,
      dir,
    ],
  },
  {
    name: 'fish',
    script: 'fish/vendor_conf.d/elecdex.fish',
    args: (script, dir) => [
      '--no-config',
      '-c',
      'source $argv[1]; cd $argv[2]; and __elecdex_cwd',
      script,
      dir,
    ],
  },
]

const installed = (shell: string): boolean =>
  process.platform !== 'win32' && spawnSync(shell, ['-c', 'exit 0']).status === 0

const root = mkdtempSync(path.join(tmpdir(), 'elecdex-cwd-script-'))
// An empty home and ZDOTDIR: the scripts source the user's own startup files.
const home = path.join(root, 'home')
mkdirSync(home)
afterAll(() => rmSync(root, { recursive: true, force: true }))

function reported(shell: Shell, dir: string): string[] {
  const env: Record<string, string | undefined> = {
    ...process.env,
    HOME: home,
    ELECDEX_USER_ZDOTDIR: home,
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
  }
  delete env.ELECDEX_SHELL_INTEGRATION
  const run = spawnSync(shell.name, shell.args(path.join(SCRIPTS, shell.script), dir), {
    env,
    timeout: 10_000,
  })
  expect(run.status, String(run.stderr)).toBe(0)
  const { events } = new OscParser().write(new Uint8Array(run.stdout))
  return events.flatMap((event) => (event.cwd === undefined ? [] : [event.cwd]))
}

describe.each(SHELLS)('$name integration reports the folder', (shell) => {
  it.runIf(installed(shell.name))('for a plain name', () => {
    const dir = path.join(root, `${shell.name}-plain`)
    mkdirSync(dir)
    expect(reported(shell, dir)).toEqual([dir])
  })

  it.runIf(installed(shell.name))('for a name outside ASCII, with a space and a %', () => {
    const dir = path.join(root, `${shell.name} 日本語フォルダ é 100%`)
    mkdirSync(dir)
    expect(reported(shell, dir)).toEqual([dir])
  })
})
