import { cleanup, render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Splitter from '../../src/renderer/widgets/common/Splitter.svelte'

/**
 * The handle between two parts of a widget (the CHIP-8 library's list and details, the git
 * pane's files and diff, the agents' lists). It moves the line by how far the pointer moves:
 * it once took the pointer's own place, so a press that did not move put the line where the
 * pointer was on the handle - half the band away - and the second press of a double-click then
 * landed beside the handle, leaving the line where the drag had put it.
 */

/** The element the two parts divide: 1000 wide from x 0. */
function within(): HTMLElement {
  const el = document.createElement('div')
  el.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 1000, height: 500, right: 1000, bottom: 500 }) as DOMRect
  return el
}

const pointer = (type: string, x: number) =>
  new PointerEvent(type, {
    bubbles: true,
    clientX: x,
    clientY: 10,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
  })

function mount(value: number) {
  const onmove = vi.fn()
  const ondone = vi.fn()
  const box = within()
  const { container } = render(Splitter, {
    props: {
      axis: 'x',
      value,
      min: 0.3,
      max: 0.75,
      reset: 0.5,
      label: 'Width',
      within: () => box,
      onmove,
      ondone,
      testid: 'split',
      edge: 'start',
    },
  })
  flushSync()
  const handle = container.querySelector<HTMLElement>('[data-testid=split]')
  if (handle === null) throw new Error('no handle')
  // jsdom has no pointer capture: recorded, not performed.
  handle.setPointerCapture = () => {}
  return { handle, onmove, ondone }
}

afterEach(() => {
  cleanup()
})

describe('Splitter', () => {
  it('leaves the line where it is at a press that does not move, wherever on the band it lands', () => {
    // The line at 600; the handle's band beside it, pressed 6 px past the line.
    const { handle, onmove, ondone } = mount(0.6)
    handle.dispatchEvent(pointer('pointerdown', 606))
    handle.dispatchEvent(pointer('pointermove', 606))
    handle.dispatchEvent(pointer('pointerup', 606))
    expect(onmove.mock.calls.map(([share]) => share)).toEqual([0.6])
    expect(ondone).toHaveBeenCalledWith(0.6)
  })

  it('moves the line by how far the pointer moves', () => {
    const { handle, onmove, ondone } = mount(0.6)
    handle.dispatchEvent(pointer('pointerdown', 606))
    handle.dispatchEvent(pointer('pointermove', 506))
    handle.dispatchEvent(pointer('pointerup', 506))
    expect(onmove).toHaveBeenLastCalledWith(0.5)
    expect(ondone).toHaveBeenCalledWith(0.5)
  })

  it('keeps the line within its bounds', () => {
    const { handle, onmove } = mount(0.6)
    handle.dispatchEvent(pointer('pointerdown', 606))
    handle.dispatchEvent(pointer('pointermove', 6))
    expect(onmove).toHaveBeenLastCalledWith(0.3)
    handle.dispatchEvent(pointer('pointermove', 996))
    expect(onmove).toHaveBeenLastCalledWith(0.75)
  })

  it('puts the line back at a double-click', () => {
    const { handle, ondone } = mount(0.7)
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    expect(ondone).toHaveBeenLastCalledWith(0.5)
  })
})
