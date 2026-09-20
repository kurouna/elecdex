import { cleanup, render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, describe, expect, it } from 'vitest'

const { default: Readout } = await import('../../src/renderer/widgets/common/Readout.svelte')

/**
 * The big numeric readout.
 *
 * The rule it must keep is that it never takes a click. A digit rolls in from
 * half a line below, and the browser hit-tests where a transform puts a box, so
 * for a few frames every second the number lay over the buttons beneath it and
 * swallowed whatever was pressed there - the chrono's reset, most visibly.
 */

afterEach(() => cleanup())

describe('Readout', () => {
  it('rolls only the digits that changed, leaving the separators alone', async () => {
    const view = render(Readout, { props: { value: '01:23', testid: 'readout' } })
    flushSync()
    const before = [...screen.getByTestId('readout').querySelectorAll('span')]

    await view.rerender({ value: '01:24', testid: 'readout' })
    flushSync()
    const after = [...screen.getByTestId('readout').querySelectorAll('span')]

    expect(after).toHaveLength(before.length)
    // The last digit is a new element - that is what plays the roll - and the
    // ones that did not change are the very same nodes.
    expect(after.at(-1)).not.toBe(before.at(-1))
    expect(after[0]).toBe(before[0])
  })

  it('changes the tenths where they stand, without a roll', async () => {
    // The tail changes ten times a second, twice in the length of a roll: its
    // digit never landed, and an animation always running keeps the compositor
    // drawing at the display's rate. Measured with the stopwatch going on its
    // own: 33% of a core with the tail rolling, 11% with motion reduced.
    const view = render(Readout, { props: { value: '00:01', tail: '.3', testid: 'readout' } })
    flushSync()
    const tail = () => [...(screen.getByTestId('readout').querySelector('.tail')?.children ?? [])]
    const before = tail()

    await view.rerender({ value: '00:01', tail: '.4', testid: 'readout' })
    flushSync()
    const after = tail()

    expect(after.map((el) => el.textContent)).toEqual(['.', '4'])
    expect(after.at(-1)).toBe(before.at(-1))
    expect(after.at(-1)?.classList.contains('digit')).toBe(false)
  })
})
