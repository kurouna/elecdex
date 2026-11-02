import type { LauncherEntry } from '@shared/launcher'
import { render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubIntersectionObserver } from './support/dom.ts'
import { settle } from './support/settle.ts'

const { default: LauncherWidget } = await import(
  '../../src/renderer/widgets/launcher/LauncherWidget.svelte'
)
const { forgetLauncherIcons } = await import('../../src/renderer/widgets/launcher/icons.svelte.ts')

/**
 * The launcher pane against a hand-driven main: the tiles on screen stay while a
 * list is being fetched, a background rescan that changed the list is picked up, and
 * an icon once given is drawn at once by every launcher the page mounts after.
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
let icon: ReturnType<typeof vi.fn<(id: string) => Promise<string | null>>>
const unsubscribe = vi.fn()

beforeEach(() => {
  stubIntersectionObserver('none')
  forgetLauncherIcons()
  list = vi.fn<() => Promise<LauncherEntry[]>>()
  icon = vi.fn(async (_id: string): Promise<string | null> => null)
  unsubscribe.mockClear()
  vi.stubGlobal('elecdex', {
    launcher: {
      list,
      icon,
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

  it('draws the icons it was given at once when mounted again, without asking main', async () => {
    stubIntersectionObserver('visible')
    const PNG = 'data:image/png;base64,iVBORw0KGgo='
    icon.mockImplementation(async (id) => (id === 'code' ? PNG : null))
    list.mockResolvedValue([entry('Code'), entry('Paint')])
    const first = render(LauncherWidget, { props: { paneId: 'p' } as never })
    await settle()
    expect(screen.getAllByTestId('launcher-icon')).toHaveLength(1)
    expect(icon.mock.calls.map(([id]) => id).sort()).toEqual(['code', 'paint'])
    first.unmount()

    // Popped up again, or moved: the icon is there with the first tiles.
    let answer: (entries: LauncherEntry[]) => void = () => {}
    list.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)))
    render(LauncherWidget, { props: { paneId: 'q' } as never })
    answer([entry('Code'), entry('Paint')])
    await Promise.resolve()
    await Promise.resolve()
    expect(screen.getAllByTestId('launcher-icon')).toHaveLength(1)
    await settle()
    expect(icon).toHaveBeenCalledTimes(2)
  })
})
