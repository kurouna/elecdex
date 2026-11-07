import { spawn } from 'node:child_process'

/** What ending a process tree needs: a way to start taskkill, and to signal a group. */
export interface TreeKillDeps {
  platform: NodeJS.Platform
  spawn(command: string, args: readonly string[]): void
  kill(pid: number, signal: NodeJS.Signals): void
}

const TREE_KILL: TreeKillDeps = {
  platform: process.platform,
  spawn: (command, args) => {
    spawn(command, [...args], { windowsHide: true, stdio: 'ignore' }).on('error', () => {})
  },
  kill: (pid, signal) => process.kill(pid, signal),
}

/**
 * Ends a process and everything it started. Stopping git alone left its helpers behind - on Windows
 * git-remote-https, ssh, or Git Credential Manager's window still asking for a password after
 * the pane had said TIMED OUT (found in review). Windows has no process groups: taskkill /T
 * walks the tree. Elsewhere git leads a group of its own (`detached`), signalled whole.
 */
export function killTree(pid: number, deps: TreeKillDeps = TREE_KILL): void {
  if (deps.platform === 'win32') {
    deps.spawn('taskkill', ['/pid', String(pid), '/T', '/F'])
    return
  }
  try {
    deps.kill(-pid, 'SIGKILL')
  } catch {
    try {
      deps.kill(pid, 'SIGKILL')
    } catch {
      // Gone already.
    }
  }
}
