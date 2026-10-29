import { cleanup, render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LibraryView from '../../src/renderer/widgets/chip8/LibraryView.svelte'
import { themePalette } from '../../src/renderer/widgets/chip8/palette.ts'
import { stubMatchMedia, stubResizeObserver } from './support/dom.ts'

/**
 * The CHIP-8 library's attract mode rests after half a minute with nobody at it. The half minute
 * counts only while the library is seen: a library behind a tab changed its own state thirty
 * seconds after it mounted, which the lifecycle contract caught as a pane changing unseen.
 */

const props = (seen: boolean) => ({
  programs: [],
  loaded: true,
  filter: 'all' as const,
  selected: null,
  paletteOf: () => themePalette({}),
  glow: false,
  dots: false,
  seen,
  listShare: 0.5,
  onlistshare: () => {},
  onfilter: () => {},
  onselect: () => {},
  onload: () => {},
})

const awake = (container: HTMLElement) =>
  container.querySelector('[data-testid=chip8-library]')?.getAttribute('data-awake')

beforeEach(() => {
  vi.useFakeTimers()
  stubResizeObserver()
  stubMatchMedia(() => false)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the library dozing', () => {
  it('rests after half a minute seen', () => {
    const { container } = render(LibraryView, { props: props(true) })
    flushSync()
    expect(awake(container)).toBe('true')
    vi.advanceTimersByTime(30_000)
    flushSync()
    expect(awake(container)).toBe('false')
  })

  it('changes nothing of itself while it is not seen, and starts counting once it is', async () => {
    const { container, rerender } = render(LibraryView, { props: props(false) })
    flushSync()
    vi.advanceTimersByTime(60_000)
    flushSync()
    expect(awake(container)).toBe('true')
    await rerender(props(true))
    vi.advanceTimersByTime(29_000)
    flushSync()
    expect(awake(container)).toBe('true')
    vi.advanceTimersByTime(1_000)
    flushSync()
    expect(awake(container)).toBe('false')
  })
})
