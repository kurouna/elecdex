import type { ITerminalAddon } from '@xterm/xterm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  WEBGL_MAX_LOSSES,
  WEBGL_RETRY_MS,
  WebglKeeper,
} from '../../src/renderer/widgets/terminal/webgl-keeper.js'

/** A stand-in addon that remembers whether it was disposed. */
class FakeAddon implements ITerminalAddon {
  disposed = false
  activate(): void {}
  dispose(): void {
    this.disposed = true
  }
}

function harness(options: { failCreate?: boolean; hidden?: boolean } = {}) {
  const element = new EventTarget()
  const made: FakeAddon[] = []
  const loaded: ITerminalAddon[] = []
  let visible = options.hidden !== true
  const changed = vi.fn()
  const keeper = new WebglKeeper({
    element,
    create: () => {
      if (options.failCreate) throw new Error('WebGL2 not supported')
      const addon = new FakeAddon()
      made.push(addon)
      return addon
    },
    load: (addon) => loaded.push(addon),
    visible: () => visible,
    changed,
  })
  const lose = async (): Promise<void> => {
    element.dispatchEvent(new Event('webglcontextlost'))
    await Promise.resolve()
  }
  const setVisible = (on: boolean): void => {
    visible = on
  }
  return { keeper, made, loaded, changed, lose, setVisible, element }
}

describe('WebglKeeper', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('takes no context for a pane mounted out of sight, and one when it is shown', () => {
    // Found in review: every shell tab took a WebGL context at mount, hidden ones too, and a
    // dozen of them pushed the shown pane off WebGL (Chromium keeps about sixteen).
    const h = harness({ hidden: true })
    expect(h.loaded).toHaveLength(0)
    expect(h.keeper.active).toBe(false)
    h.setVisible(true)
    h.keeper.resume()
    expect(h.loaded).toHaveLength(1)
    expect(h.changed).toHaveBeenCalledTimes(1)
  })

  it('loads WebGL at once, without telling of a change', () => {
    const h = harness()
    expect(h.loaded).toHaveLength(1)
    expect(h.keeper.active).toBe(true)
    expect(h.changed).not.toHaveBeenCalled()
  })

  it('stays on the DOM renderer where WebGL cannot be had, and never tries again', () => {
    const h = harness({ failCreate: true })
    expect(h.keeper.active).toBe(false)
    h.keeper.resume()
    vi.advanceTimersByTime(WEBGL_RETRY_MS * 3)
    expect(h.loaded).toHaveLength(0)
  })

  it('drops a lost context at once, without waiting for it to come back, and refits', async () => {
    const h = harness()
    await h.lose()
    expect(h.made[0]?.disposed).toBe(true)
    expect(h.keeper.active).toBe(false)
    expect(h.changed).toHaveBeenCalledTimes(1)
  })

  it('takes a fresh addon after the retry delay, and refits again', async () => {
    const h = harness()
    await h.lose()
    // A fit in the meantime does not jump the delay: the GPU process is still restarting.
    h.keeper.resume()
    expect(h.loaded).toHaveLength(1)
    vi.advanceTimersByTime(WEBGL_RETRY_MS)
    expect(h.loaded).toHaveLength(2)
    expect(h.loaded[1]).not.toBe(h.loaded[0])
    expect(h.keeper.active).toBe(true)
    expect(h.changed).toHaveBeenCalledTimes(2)
  })

  it('waits until the pane is shown before trying WebGL again', async () => {
    const h = harness()
    h.setVisible(false)
    await h.lose()
    vi.advanceTimersByTime(WEBGL_RETRY_MS * 3)
    expect(h.loaded).toHaveLength(1)
    h.setVisible(true)
    h.keeper.resume()
    expect(h.loaded).toHaveLength(2)
  })

  it(`gives up on WebGL after ${WEBGL_MAX_LOSSES} losses`, async () => {
    const h = harness()
    for (let i = 0; i < WEBGL_MAX_LOSSES; i++) {
      await h.lose()
      vi.advanceTimersByTime(WEBGL_RETRY_MS)
    }
    expect(h.loaded).toHaveLength(WEBGL_MAX_LOSSES)
    expect(h.keeper.active).toBe(false)
    h.keeper.resume()
    expect(h.loaded).toHaveLength(WEBGL_MAX_LOSSES)
  })

  it('takes a context let go on unmount, after dispose, for no loss', async () => {
    const h = harness()
    h.keeper.dispose()
    await h.lose()
    vi.advanceTimersByTime(WEBGL_RETRY_MS)
    expect(h.made[0]?.disposed).toBe(false)
    expect(h.changed).not.toHaveBeenCalled()
    expect(h.loaded).toHaveLength(1)
  })

  it('ignores a loss while already on the DOM renderer', async () => {
    const h = harness()
    await h.lose()
    await h.lose()
    expect(h.changed).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(WEBGL_RETRY_MS)
    expect(h.loaded).toHaveLength(2)
  })
})
