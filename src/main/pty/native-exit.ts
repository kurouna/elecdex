import type { IPty } from 'node-pty'

/**
 * When node-pty's native exit notice for a ConPTY shell has reached JS.
 *
 * node-pty's addon waits for each shell's process on a thread of its own and hands the exit to
 * JS through a thread-safe function (conpty.cc, SetupExitCallback). A notice still queued as
 * the app quits is delivered while node frees its environment, when JS can no longer run: the
 * addon's call fails, node-addon-api raises it as a C++ exception that nothing catches, and the
 * app ends in abort (0xC0000409). Seen in crash dumps from the Windows CI runners (2026-11-20),
 * where a shell killed at the quit took long enough to end that its notice came after node's
 * exit. The quit waits for these notices (PtyManager.disposeAll).
 *
 * node-pty's `onExit` is no use for this: it is driven by the output socket closing, not by the
 * native notice. The notice reaches the agent as `_$onProcessExit`, looked up on the agent when
 * it fires, so wrapping it there sees every one. Null where there is no such agent (winpty,
 * other platforms, a node-pty that changed it): there is nothing of this kind to wait for there.
 */
export function nativeExit(pty: IPty): Promise<void> | null {
  const agent = (pty as unknown as { _agent?: { _$onProcessExit?: unknown } })._agent
  const original = agent?._$onProcessExit
  if (agent === undefined || typeof original !== 'function') return null
  return new Promise<void>((resolve) => {
    agent._$onProcessExit = function (this: unknown, ...args: unknown[]) {
      try {
        return (original as (...a: unknown[]) => unknown).apply(this, args)
      } finally {
        resolve()
      }
    }
  })
}
