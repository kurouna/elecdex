import { cleanup, render } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Keyboard from '../../src/renderer/widgets/elec16/Keyboard.svelte'
import { Elec16Runner } from '../../src/renderer/widgets/elec16/runner.svelte.ts'
import { SKINS } from '../../src/renderer/widgets/elec16/skins.ts'
import { browserLoop } from '../../src/renderer/widgets/emu/runner.svelte.ts'

/**
 * The ELEC-16's keys (widgets/elec16/Keyboard.svelte): the arrows drawn, never typed (no
 * bundled face has all four); the keypad's keys marked for the skins that colour them apart;
 * a label wider than its key narrowed sideways to fit, never below the skin's floor.
 */

const newRunner = () =>
  new Elec16Runner({
    ...browserLoop,
    clock: () => ({ second: 0, minute: 0, hour: 0, day: 1, month: 1, year: 2026, weekday: 4 }),
  })

beforeEach(() => {
  // A canvas that measures every letter at 0.6 em (jsdom has none).
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    font: '',
    measureText: (text: string) => ({ width: [...text].length * 60 }),
  } as unknown as CanvasRenderingContext2D)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const props = (width: number, skin = SKINS.neo) => ({
  runner: newRunner(),
  mode: 'full' as const,
  legends: false,
  big: false,
  rowHeight: 24,
  width,
  skin,
})

describe("the ELEC-16's keys", () => {
  it('draws the four arrows, with no text, and names them for a screen reader', () => {
    const { container } = render(Keyboard, props(900))
    for (const id of ['left', 'up', 'down', 'right']) {
      const key = container.querySelector(`[data-key=${id}]`)
      expect(key?.querySelector('svg path'), id).not.toBeNull()
      expect(key?.textContent?.trim(), id).toBe('')
      expect(key?.getAttribute('aria-label'), id).not.toBe('')
    }
  })

  it('marks the keypad, not its arrows or the letter keys', () => {
    const { container } = render(Keyboard, props(900))
    const pad = [...container.querySelectorAll('.key.pad')].map((k) => k.getAttribute('data-key'))
    expect(pad).toEqual(expect.arrayContaining(['7', '0', 'kp.', '=', '(', 'kp/']))
    expect(pad).not.toContain('left')
    expect(pad).not.toContain('q')
    expect(pad).toHaveLength(18)
  })

  it('leaves labels as they are where they fit', async () => {
    const { container } = render(Keyboard, props(900))
    await tick()
    expect(container.querySelector<HTMLElement>('[data-key=mode] .cap')?.style.transform).toBe('')
  })

  it("narrows a label wider than its key in a narrow body, to the skin's floor at most", async () => {
    const { container } = render(Keyboard, props(500))
    await tick()
    const mode = container.querySelector<HTMLElement>('[data-key=mode] .cap')?.style.transform ?? ''
    const scale = Number(/scaleX\(([\d.]+)\)/.exec(mode)?.[1])
    expect(scale).toBeLessThan(1)
    expect(scale).toBeGreaterThanOrEqual(SKINS.neo.body.fitFloor)
    // A single letter fits as it is.
    expect(container.querySelector<HTMLElement>('[data-key=q] .cap')?.style.transform).toBe('')
  })

  it('narrows round letters less: MOCHI stops at its own floor', async () => {
    const { container } = render(Keyboard, props(300, SKINS.mochi))
    await tick()
    const mode = container.querySelector<HTMLElement>('[data-key=mode] .cap')?.style.transform ?? ''
    expect(mode).toBe(`scaleX(${SKINS.mochi.body.fitFloor.toFixed(3)})`)
  })
})
