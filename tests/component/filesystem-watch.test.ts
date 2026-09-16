import type { DirListing } from '@shared/fs'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: FilesystemWidget } = await import(
  '../../src/renderer/widgets/filesystem/FilesystemWidget.svelte'
)

/**
 * The filesystem pane's directory watch. A change in the directory re-reads it,
 * which hands the pane a new listing object for the same path; the watch must
 * stay as it is, because main drops a pending change when a watch closes.
 */

let changed: () => void = () => {}
const watch = vi.fn()
const unwatch = vi.fn()
const readDir = vi.fn()

const listing = (path: string): DirListing => ({
  path,
  parent: null,
  entries: [],
  truncated: false,
})

beforeEach(() => {
  watch.mockReset()
  unwatch.mockReset()
  readDir.mockReset()
  watch.mockImplementation((_dir: string, handler: () => void) => {
    changed = handler
    return unwatch
  })
  // A fresh object on every read, as the IPC round trip gives.
  readDir.mockImplementation(async (dir: string) => ({ ok: true, listing: listing(dir) }))
  vi.stubGlobal('elecdex', {
    system: { info: async () => ({ host: { home: '/home/demo' } }) },
    fs: { readDir, watch, drives: async () => [] },
    pty: { write: vi.fn() },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const props = { paneId: 'p', title: 'filesystem', props: undefined, state: undefined, active: true }

describe('FilesystemWidget directory watch', () => {
  it('keeps one watch while the directory changes', async () => {
    render(FilesystemWidget, { props })
    await vi.waitFor(() => expect(watch).toHaveBeenCalledTimes(1))
    expect(watch.mock.calls[0]?.[0]).toBe('/home/demo')

    for (let i = 0; i < 3; i++) {
      changed()
      flushSync()
      await vi.waitFor(() => expect(readDir).toHaveBeenCalledTimes(i + 2))
      await Promise.resolve()
      flushSync()
    }
    expect(watch).toHaveBeenCalledTimes(1)
    expect(unwatch).not.toHaveBeenCalled()
  })

  it('still drops the watch when the pane goes away', async () => {
    const { unmount } = render(FilesystemWidget, { props })
    await vi.waitFor(() => expect(watch).toHaveBeenCalledTimes(1))
    unmount()
    expect(unwatch).toHaveBeenCalledTimes(1)
  })
})
