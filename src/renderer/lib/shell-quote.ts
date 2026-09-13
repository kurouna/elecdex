/**
 * Quoting a path for the shell it will be typed into.
 *
 * The filesystem widget types `cd <dir>` or a file's path into the followed
 * terminal. eDEX-UI wrapped the path in double quotes for every shell, which
 * breaks on a name containing `"`, `$` or a backtick - and in PowerShell and the
 * POSIX shells a double-quoted `$` still expands. Single quotes are literal in
 * all of them; only the escape for a quote inside differs.
 */

export type ShellKind = 'powershell' | 'posix' | 'fish' | 'cmd'

/** Classifies a shell by the executable name the session store reports. */
export function shellKindOf(shell: string): ShellKind {
  const name = shell.toLowerCase()
  if (name === 'powershell' || name === 'pwsh') return 'powershell'
  if (name === 'fish') return 'fish'
  if (name === 'cmd') return 'cmd'
  return 'posix'
}

/** Leaves simple paths alone, so what gets typed stays readable. */
const PLAIN = /^[A-Za-z0-9_\-./:\\~+,@]+$/

export function quotePath(path: string, kind: ShellKind): string {
  switch (kind) {
    case 'powershell':
      // Single-quoted strings are literal; a quote is doubled.
      return PLAIN.test(path) ? path : `'${path.replace(/'/g, "''")}'`
    case 'fish':
      // fish honours \\ and \' inside single quotes.
      return PLAIN.test(path) ? path : `'${path.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
    case 'cmd':
      // cmd has no escape for a double quote in a path, and none is legal in one.
      return /[\s&()^|<>]/.test(path) ? `"${path}"` : path
    case 'posix':
      // Close the quote, add an escaped quote, reopen.
      return PLAIN.test(path) ? path : `'${path.replace(/'/g, "'\\''")}'`
  }
}

/** The command that changes into `dir`, for a shell. */
export function cdCommand(dir: string, kind: ShellKind): string {
  // cmd's cd does not switch drives without /d.
  return kind === 'cmd' ? `cd /d ${quotePath(dir, kind)}` : `cd ${quotePath(dir, kind)}`
}
