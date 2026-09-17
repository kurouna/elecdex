import type { LauncherEntry } from '@shared/launcher'
import { render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: LauncherWidget } = await import(
  '../../src/renderer/widgets/launcher/LauncherWidget.svelte'
)

/**
 * The launcher pane against a hand-driven main: the tiles on screen stay while a
 * list is being fetched, and a background rescan that changed the list is picked up.
 */

const entry = (name: string): LauncherEntry => ({
  id: name.toLowerCase(),
  name,
  group: null,
  source: 'system',
  launches: 0,
})

let changed: () => void = () => {}
let list: ReturnType<typeof vi.fn<() => Promise<LauncherEntry[]>>>
const unsubscribe = vi.fn()

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  list = vi.fn<() => Promise<LauncherEntry[]>>()
  unsubscribe.mockClear()
  vi.stubGlobal('elecdex', {
    launcher: {
      list,
      icon: vi.fn(async () => null),
      launch: vi.fn(),
      onChange: (handler: () => void) => {
        changed = handler
        return unsubscribe
      },
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const names = () => screen.queryAllByTestId('launcher-entry').map((el) => el.textContent?.trim())

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

describe('LauncherWidget', () => {
  it('asks again when main reports a changed list, keeping the tiles until the answer', async () => {
    let answer: (entries: LauncherEntry[]) => void = () => {}
    list
      .mockResolvedValueOnce([entry('Code')])
      .mockReturnValueOnce(new Promise((resolve) => (answer = resolve)))
    const view = render(LauncherWidget, { props: { paneId: 'p' } as never })
    await settle()
    expect(names()).toEqual([expect.stringContaining('Code')])

    changed()
    await settle()
    expect(list).toHaveBeenCalledTimes(2)
    // The rescan has not answered yet: the old tiles stay, nothing says "scanning".
    expect(names()).toEqual([expect.stringContaining('Code')])

    answer([entry('Code'), entry('Microsoft Teams')])
    await settle()
    expect(names()).toEqual([
      expect.stringContaining('Code'),
      expect.stringContaining('Microsoft Teams'),
    ])

    view.unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })
})
