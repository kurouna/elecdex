import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Where each kind of palette row goes in the stores (docs/palette.md section 5.3), and that it
 * says whether it went. The stores are stand-ins: what they then do is their own tests'.
 */

const stores = vi.hoisted(() => ({
  layout: {
    paneWith: vi.fn((_widget: string): string | null => null),
    focus: vi.fn(),
    addPane: vi.fn(),
    switchTo: vi.fn(async (_id: string) => true),
  },
  ui: { openPopup: vi.fn(), openSettings: vi.fn() },
  appearance: { patch: vi.fn(async () => ({})) },
  sfx: { play: vi.fn() },
  commands: { run: vi.fn((_action: string) => true) },
}))
vi.mock('../../src/renderer/stores/layout.svelte.ts', () => ({ layout: stores.layout }))
vi.mock('../../src/renderer/stores/ui.svelte.ts', () => ({ ui: stores.ui }))
vi.mock('../../src/renderer/stores/appearance.svelte.ts', () => ({ appearance: stores.appearance }))
vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: stores.sfx }))
vi.mock('../../src/renderer/lib/commands.ts', () => ({ commands: stores.commands }))

const { storeTargets } = await import('../../src/renderer/palette/run.ts')
const { registerBuiltin } = await import('../../src/renderer/widgets/registry.ts')

registerBuiltin({ id: 'clock', title: 'Clock', popup: true } as never)
registerBuiltin({ id: 'terminal', title: 'Terminal', multiple: true } as never)
registerBuiltin({ id: 'filesystem', title: 'Files' } as never)

beforeEach(() => {
  vi.clearAllMocks()
  stores.layout.paneWith.mockReturnValue(null)
})

describe('storeTargets', () => {
  it('runs an action through the workspace, and says what it answered', () => {
    expect(storeTargets.action('pane.splitRight')).toBe(true)
    stores.commands.run.mockReturnValueOnce(false)
    expect(storeTargets.action('tab.next')).toBe(false)
    expect(stores.commands.run.mock.calls).toEqual([['pane.splitRight'], ['tab.next']])
  })

  it('switches a layout as its number key does, answering as the switch does', async () => {
    expect(await storeTargets.layout('l2')).toBe(true)
    stores.layout.switchTo.mockResolvedValueOnce(false)
    expect(await storeTargets.layout('l3')).toBe(false)
    expect(stores.layout.switchTo.mock.calls).toEqual([['l2'], ['l3']])
  })

  it('uses a theme, with its sound once the setting is written', async () => {
    expect(storeTargets.theme('amber')).toBe(true)
    expect(stores.appearance.patch).toHaveBeenCalledWith({ theme: 'amber' })
    await Promise.resolve()
    await Promise.resolve()
    expect(stores.sfx.play).toHaveBeenCalledWith('theme')
  })

  it('pops up a pane that can be, and adds one that cannot right of the focused pane', () => {
    expect(storeTargets.pane('clock')).toBe(true)
    expect(stores.ui.openPopup).toHaveBeenCalledWith('clock')
    expect(storeTargets.pane('filesystem')).toBe(true)
    expect(stores.layout.addPane).toHaveBeenCalledWith('filesystem', 'right')
  })

  it('focuses a single pane already on screen, and adds another of a widget that may repeat', () => {
    stores.layout.paneWith.mockReturnValue('p1')
    expect(storeTargets.pane('clock')).toBe(true)
    expect(stores.layout.focus).toHaveBeenCalledWith('p1')
    expect(stores.ui.openPopup).not.toHaveBeenCalled()
    expect(storeTargets.pane('terminal')).toBe(true)
    expect(stores.layout.addPane).toHaveBeenCalledWith('terminal', 'right')
  })

  it('does nothing for a widget no longer registered, and says so', () => {
    expect(storeTargets.pane('plugin:gone')).toBe(false)
    expect(stores.layout.addPane).not.toHaveBeenCalled()
    expect(stores.ui.openPopup).not.toHaveBeenCalled()
  })

  it('opens the settings at a section', () => {
    expect(storeTargets.settings('keyboard')).toBe(true)
    expect(stores.ui.openSettings).toHaveBeenCalledWith('keyboard')
  })
})
