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
})
