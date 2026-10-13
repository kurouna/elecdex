import { cleanup, render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { default: Lamps } = await import('../../src/renderer/widgets/cluster/Lamps.svelte')
const { pulse } = await import('../../src/renderer/lib/pulse.svelte.ts')

/** CLUSTER's lamps: a red one breathes on the shared pulse only while the pane can be seen. */

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const props = (visible: boolean) => ({
  lamps: [{ id: 'cpu' as const, state: 'crit' as const, text: 'CPU AT 99%' }],
  message: { text: 'CPU AT 99%', level: 'crit' as const, more: 0, all: ['CPU AT 99%'] },
  wrap: false,
  visible,
  onhover: () => {},
})

describe('Lamps', () => {
  it('holds the pulse for a red lamp in sight, and lets it go out of sight', async () => {
    // Found in review: behind a tab or minimised, a red lamp kept the pulse - four writes a second.
    const release = vi.fn()
    const use = vi.spyOn(pulse, 'use').mockImplementation(() => release)
    const { rerender } = render(Lamps, { props: props(true) })
    flushSync()
    expect(use).toHaveBeenCalledTimes(1)
    await rerender(props(false))
    flushSync()
    expect(release).toHaveBeenCalledTimes(1)
    expect(use).toHaveBeenCalledTimes(1)
  })

  it('takes nothing when it is out of sight from the start', () => {
    const use = vi.spyOn(pulse, 'use').mockImplementation(() => () => {})
    render(Lamps, { props: props(false) })
    flushSync()
    expect(use).not.toHaveBeenCalled()
  })
})
