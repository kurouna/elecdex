import { describe, expect, it, vi } from 'vitest'

/**
 * The folder a session reports, as the pane learns it. A share is never followed (5710f0ec);
 * found in review: the report was dropped, so the session went on saying the folder the shell
 * had left, and the pane showed and saved it. It is now said as no folder.
 */

const emitters: ((data: string) => void)[] = []

vi.mock('node-pty', () => ({
  spawn: () => {
    let listener: (data: string) => void = () => {}
    emitters.push((data) => listener(data))
    return {
      onData: (handler: (data: string) => void) => {
        listener = handler
        return { dispose() {} }
      },
      onExit: () => ({ dispose() {} }),
      pause() {},
      resume() {},
      write() {},
      resize() {},
      kill() {},
    }
  },
}))

const { PtyManager } = await import('../../src/main/pty/pty-manager.js')

const osc = (payload: string) => `\u001b]${payload}\u0007`

describe("a session's folder", () => {
  it('becomes none when the shell goes onto a share, and comes back with a local one', async () => {
    const said: (string | null)[] = []
    const manager = new PtyManager({
      onData() {},
      onExit() {},
      onCwd: (_id, cwd) => said.push(cwd),
      onCommandEnd() {},
      onIntegrationUnavailable() {},
    })
    const { id } = manager.create({ shell: 'fake-shell' })
    const emit = emitters.at(-1)
    if (emit === undefined) throw new Error('no pty')
    emit(osc('9;9;"C:\\work"'))
    emit(osc('9;9;"\\\\server\\share"'))
    emit(osc('9;9;"\\\\server\\other"'))
    // A share, not a shell without integration: a pane attaching later is told the same.
    expect(manager.stateFor(id)).toMatchObject({ cwd: null, onShare: true })
    emit(osc('9;9;"C:\\work"'))
    expect(manager.stateFor(id)).toMatchObject({ cwd: 'C:\\work', onShare: false })
    // OSC 7 (bash, zsh, fish) the same.
    emit(osc('7;file:////server/share'))
    expect(manager.stateFor(id)).toMatchObject({ cwd: null, onShare: true })
    expect(said).toEqual(['C:\\work', null, 'C:\\work', null])
    manager.disposeAll()
  })
})
