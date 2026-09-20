import { pane, split } from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutTree } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { ui } = await import('../../src/renderer/stores/ui.svelte.ts')

/**
 * The question asked before a saved layout replaces a workspace with shells in
 * it.
 *
 * It is a promise the switch waits on, so the thing to get right is that it
 * always settles: a question left open with nothing to answer it would leave
 * the switch - and the layout the user asked for - hanging for good.
 */

const ONE: LayoutTree = { version: LAYOUT_VERSION, root: pane('clock') }
const WITH_SHELL: LayoutTree = {
  version: LAYOUT_VERSION,
  root: split('row', [pane('clock'), pane('terminal')]),
}

let applied: string[]

const stub = (): void => {
  vi.stubGlobal('elecdex', {
    layout: {
      load: async () => ONE,
      save: vi.fn(async () => ONE),
      saved: {
        list: async () => [
          { id: 'one', name: 'one', active: false },
          { id: 'two', name: 'two', active: true },
        ],
        apply: vi.fn(async (id: string) => {
          applied.push(id)
          return ONE
        }),
        save: vi.fn(async () => []),
        remove: vi.fn(async () => []),
        rename: vi.fn(async () => []),
        move: vi.fn(async () => []),
      },
    },
  })
}

beforeEach(() => {
  applied = []
  ui.answerLayoutSwitch(false)
  layout.loaded = false
  layout.tree = ONE
  stub()
})

afterEach(async () => {
  ui.answerLayoutSwitch(false)
  ui.closeSettings()
  ui.closeLayouts()
  ui.closePanePicker()
  layout.settle()
  await layout.flush()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('the question itself', () => {
  it('resolves with the answer, and counts as a dialog while it is open', async () => {
    const asked = ui.askLayoutSwitch({ name: 'one', shells: 2 })
    expect(ui.dialogOpen).toBe(true)
    ui.answerLayoutSwitch(true)
    expect(await asked).toBe(true)
    expect(ui.dialogOpen).toBe(false)
  })

  it('refuses a second question rather than replacing the one on screen', async () => {
    const first = ui.askLayoutSwitch({ name: 'one', shells: 1 })
    const second = ui.askLayoutSwitch({ name: 'two', shells: 1 })
    expect(await second).toBe(false)
    expect(ui.layoutSwitch?.name).toBe('one')
    ui.answerLayoutSwitch(true)
    expect(await first).toBe(true)
  })

  it('is answered when another dialog takes the screen, so nothing waits for ever', async () => {
    for (const open of [
      () => ui.openSettings(),
      () => ui.openPanePicker(),
      () => ui.openLayouts(),
    ]) {
      const asked = ui.askLayoutSwitch({ name: 'one', shells: 1 })
      open()
      expect(await asked).toBe(false)
      expect(ui.layoutSwitch).toBeNull()
    }
  })

  it('does nothing when answered with no question open', () => {
    expect(() => ui.answerLayoutSwitch(true)).not.toThrow()
    expect(ui.layoutSwitch).toBeNull()
  })
})

describe('switching', () => {
  it('asks before replacing a workspace that has a shell in it', async () => {
    await layout.load()
    layout.tree = WITH_SHELL
    await layout.loadSaved()

    const switched = layout.switchTo('one')
    await vi.waitFor(() => expect(ui.layoutSwitch).not.toBeNull())
    expect(ui.layoutSwitch?.shells).toBe(1)
    expect(applied).toEqual([])

    ui.answerLayoutSwitch(false)
    expect(await switched).toBe(false)
    expect(applied).toEqual([])
  })

  it('goes straight there when no shell would end by it', async () => {
    await layout.load()
    await layout.loadSaved()
    expect(await layout.switchTo('one')).toBe(true)
    expect(ui.layoutSwitch).toBeNull()
    expect(applied).toEqual(['one'])
  })

  it('does not re-apply the layout already being worked in', async () => {
    await layout.load()
    await layout.loadSaved()
    expect(await layout.switchTo('two')).toBe(false)
    expect(applied).toEqual([])
  })

  it('does nothing for a layout that is not in the list', async () => {
    await layout.load()
    await layout.loadSaved()
    expect(await layout.switchTo('no-such-layout')).toBe(false)
    expect(applied).toEqual([])
  })
})
