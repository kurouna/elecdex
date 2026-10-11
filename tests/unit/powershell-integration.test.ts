import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { POWERSHELL_INIT_ENV } from '../../src/main/pty/shell-integration.js'

/**
 * Runs the PowerShell integration script after a stand-in for the user's
 * profile, in each PowerShell installed here.
 *
 * The script once took over Enter in PSReadLine to mark where a command
 * started. It runs after the profile, so an Enter binding of the user's own
 * was replaced, and a handler that failed kept Enter from running the line -
 * for a command duration nothing shows.
 */
const SCRIPT = readFileSync(path.resolve('resources/shell-integration/elecdex.ps1'), 'utf8')

const installed = (shell: string): boolean =>
  spawnSync(shell, ['-NoProfile', '-NonInteractive', '-Command', 'exit 0']).status === 0

const SHELLS = ['powershell.exe', 'pwsh'].filter(
  (shell) => (process.platform === 'win32' || shell === 'pwsh') && installed(shell),
)

function run(shell: string, command: string): string {
  const result = spawnSync(shell, ['-NoProfile', '-NonInteractive', '-Command', command], {
    env: { ...process.env, [POWERSHELL_INIT_ENV]: SCRIPT, ELECDEX_SHELL_INTEGRATION: '' },
    encoding: 'utf8',
    timeout: 30_000,
  })
  return `${result.stdout}${result.stderr}`
}

describe.skipIf(SHELLS.length === 0).each(SHELLS)('the %s integration script', (shell) => {
  it("leaves the profile's own Enter binding as it was", () => {
    // Get-PSReadLineKeyHandler has no -Chord in the PSReadLine Windows PowerShell ships (2.0.0).
    const out = run(
      shell,
      [
        'Import-Module PSReadLine',
        'Set-PSReadLineKeyHandler -Chord Enter -Function ValidateAndAcceptLine',
        `Invoke-Expression $env:${POWERSHELL_INIT_ENV}`,
        "'ENTER=' + (Get-PSReadLineKeyHandler | Where-Object Key -eq Enter).Function",
      ].join('; '),
    )
    expect(out).toContain('ENTER=ValidateAndAcceptLine')
  }, 60_000)

  it('still wraps the prompt to report the folder and the exit code', () => {
    const out = run(shell, `Invoke-Expression $env:${POWERSHELL_INIT_ENV}; prompt; prompt`)
    expect(out).toContain('\u001b]9;9;')
    expect(out).toContain('\u001b]133;D;0\u0007')
  }, 60_000)
})
