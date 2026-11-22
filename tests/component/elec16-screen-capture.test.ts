import { glyphColumns } from '@shared/elec16/font'
import { MODELS } from '@shared/elec16/map'
import { createState } from '@shared/elec16/state'
import type { UtilityCopy } from '@shared/utility'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type Capturable,
  type CaptureDeps,
  ScreenCapture,
} from '../../src/renderer/widgets/elec16/screen-capture.svelte.ts'

/**
 * TUNE's SCREEN (widgets/elec16/screen-capture.svelte.ts): one capture at a time, the model it
 * started on kept to the end, what it says when nothing could be done, and nothing done or said
 * once the pane is gone.
 */

const LOOK = {
  colours: { ground: [200, 200, 200], dot: [0, 0, 0], shadow: [0, 0, 0] } as const,
  paneContrast: 0,
  lcd: { gap: true, unlit: 0 },
}
const look = () => ({
  ...LOOK,
  colours: {
    ground: [...LOOK.colours.ground] as [number, number, number],
    dot: [...LOOK.colours.dot] as [number, number, number],
    shadow: [...LOOK.colours.shadow] as [number, number, number],
  },
})

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])

/** A machine whose screen says `text` (or nothing) on model `id`. */
function machine(id: 'pocket-48' | 'sci-128' = 'pocket-48', empty = false): Capturable {
  const state = createState(id)
  if (!empty) state.vram.set(glyphColumns('A'.charCodeAt(0))) // in the top-left cell
  return {
    model: MODELS[id],
    state,
    pixels: () => new Uint8Array(MODELS[id].width * MODELS[id].height),
  }
}

function deps(over: Partial<CaptureDeps> = {}): CaptureDeps & { copies: UtilityCopy[] } {
  const copies: UtilityCopy[] = []
  return {
    copies,
    copy: async (what) => {
      copies.push(what)
      return true
    },
    savePng: async () => 'saved',
    png: async () => PNG,
    done: vi.fn(),
    ...over,
  }
}

let made: ScreenCapture[] = []
const capture = (d: CaptureDeps) => {
  const c = new ScreenCapture(d)
  made.push(c)
  return c
}
afterEach(() => {
  for (const c of made) c.dispose()
  made = []
})

describe("TUNE's SCREEN", () => {
  it("copies the screen's text and says so", async () => {
    const d = deps()
    const c = capture(d)
    await c.take('text', machine(), look())
    expect(d.copies).toEqual([{ kind: 'text', text: 'A' }])
    expect(c.flag.key).toBe('text')
    expect(d.done).toHaveBeenCalledTimes(1)
    expect(c.note).toBe('')
  })

  it('says why when there is no text, and writes nothing', async () => {
    const d = deps()
    const c = capture(d)
    await c.take('text', machine('pocket-48', true), look())
    expect(d.copies).toEqual([])
    expect(c.note).toBe('there is no text on the screen')
    expect(d.done).not.toHaveBeenCalled()
  })

  it('takes one capture at a time: a press while a save waits on its dialog does nothing', async () => {
    let answer: (v: 'saved') => void = () => {}
    const savePng = vi.fn(
      () =>
        new Promise<'saved'>((resolve) => {
          answer = resolve
        }),
    )
    const d = deps({ savePng })
    const c = capture(d)
    const first = c.take('png', machine(), look())
    await vi.waitFor(() => expect(savePng).toHaveBeenCalledTimes(1))
    expect(c.busy).toBe(true)
    await c.take('png', machine(), look())
    await c.take('text', machine(), look())
    expect(savePng).toHaveBeenCalledTimes(1)
    expect(d.copies).toEqual([])
    answer('saved')
    await first
    expect(c.busy).toBe(false)
    expect(c.flag.key).toBe('png')
  })

  it('saves under the model it was pressed on, whatever the machine is by the time the PNG is made', async () => {
    let made: (v: Uint8Array) => void = () => {}
    const savePng = vi.fn(async () => 'saved' as const)
    const d = deps({
      png: () =>
        new Promise<Uint8Array>((resolve) => {
          made = resolve
        }),
      savePng,
    })
    const c = capture(d)
    const m = machine('pocket-48')
    const done = c.take('png', m, look())
    // The pane goes on to another model while the picture is being made.
    ;(m as { model: unknown }).model = MODELS['sci-128']
    made(PNG)
    await done
    expect(savePng).toHaveBeenCalledWith(PNG, 'pocket-48')
  })

  it('says nothing when the save was called off, and why when it was not written', async () => {
    const c1 = capture(deps({ savePng: async () => 'canceled' }))
    await c1.take('png', machine(), look())
    expect(c1.note).toBe('')
    const c2 = capture(deps({ savePng: async () => 'failed' }))
    await c2.take('png', machine(), look())
    expect(c2.note).toBe('the picture could not be saved')
    const c3 = capture(deps({ copy: async () => false }))
    await c3.take('image', machine(), look())
    expect(c3.note).toBe('the clipboard could not be written')
    const c4 = capture(deps({ png: async () => null }))
    await c4.take('image', machine(), look())
    expect(c4.note).toBe('the picture could not be made')
  })

  it('does and says nothing once the pane is gone', async () => {
    let answer: (v: 'failed') => void = () => {}
    const d = deps({
      savePng: () =>
        new Promise<'failed'>((resolve) => {
          answer = resolve
        }),
    })
    const c = capture(d)
    const done = c.take('png', machine(), look())
    await vi.waitFor(() => expect(c.busy).toBe(true))
    c.dispose()
    answer('failed')
    await done
    expect(c.note).toBe('')
    expect(d.done).not.toHaveBeenCalled()
  })
})
