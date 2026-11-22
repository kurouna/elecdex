import { sciKeyCode } from '@shared/elec16/sci-keys'
import { cleanup, render } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BRK_SHOWN } from '../../src/renderer/widgets/elec16/machine-keys.svelte.ts'
import { Elec16Runner } from '../../src/renderer/widgets/elec16/runner.svelte.ts'
import SciDevice from '../../src/renderer/widgets/elec16/SciDevice.svelte'
import { browserLoop } from '../../src/renderer/widgets/emu/runner.svelte.ts'
import { canvasContext, stubCanvas, stubResizeObserver } from './support/dom.ts'

/**
 * SCI-128's body (widgets/elec16/SciDevice.svelte): the keys the PC holds are drawn pressed,
 * the cursor pad's ends and ON among them (docs/elec16-sci.md section 5.3).
 */

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mount(pcDown: ReadonlySet<number>) {
  vi.stubGlobal('devicePixelRatio', 1)
  stubResizeObserver({ width: 700, height: 1100 })
  stubCanvas(
    canvasContext(undefined, {
      measureText: (text: string) => ({ width: [...text].length * 60 }),
      createImageData: (w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h,
      }),
    }),
  )
  const runner = new Elec16Runner({
    ...browserLoop,
    clock: () => ({ second: 0, minute: 0, hour: 0, day: 1, month: 1, year: 2026, weekday: 4 }),
  })
  const colour = [0, 0, 0] as const
  const made = render(SciDevice, {
    runner,
    mode: 'full',
    skin: 'slate',
    lcdColours: { ground: [200, 200, 200], dot: [...colour], shadow: [...colour] },
    ghost: false,
    contrast: 0,
    seen: true,
    pcDown,
  })
  return { ...made, runner }
}

const down = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('[data-testid=elec16-sci-key].down')]
    .map((k) => k.getAttribute('data-key') ?? '')
    .sort()

describe("SCI-128's keys held from the PC", () => {
  it('draws pressed the keys the PC holds, the pad and ON among them', async () => {
    const { container, rerender, runner } = mount(
      new Set([sciKeyCode('sin'), sciKeyCode('shift'), sciKeyCode('up'), BRK_SHOWN]),
    )
    await tick()
    expect(down(container)).toEqual(['on', 'shift', 'sin', 'up'])
    await rerender({ pcDown: new Set<number>() })
    expect(down(container)).toEqual([])
    runner.dispose()
  })
})
