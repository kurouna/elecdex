import type { KeybindingAction } from '@shared/keybindings'
import { pane, split } from '@shared/layout-ops'
import { LAYOUT_VERSION } from '@shared/schemas/layout'
import { render } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

// The real dispatch, with the stores' side of it (switching layouts, writing settings)
// replaced: what each row reaches is checked here, what those then do is theirs.
const targets = vi.hoisted(() => ({
  action: vi.fn(),
  layout: vi.fn(),
  theme: vi.fn(),
  pane: vi.fn(),
  settings: vi.fn(),
}))
vi.mock('../../src/renderer/palette/run.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/renderer/palette/run.ts')>()),
  storeTargets: targets,
}))

const { default: ActionPalette } = await import('../../src/renderer/palette/ActionPalette.svelte')
const { ui } = await import('../../src/renderer/stores/ui.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { commands } = await import('../../src/renderer/lib/commands.ts')
const { registerBuiltin } = await import('../../src/renderer/widgets/registry.ts')
const { dispatch } = await import('../../src/renderer/palette/run.ts')

/**
 * The action palette (docs/palette.md sections 2 and 5): typed, chosen and run from the
 * keyboard, as the add-pane picker is, with what it runs behind `commands` and the stores.
 */

// jsdom lays nothing out, and has no way to scroll a row into view.
Element.prototype.scrollIntoView = () => {}

registerBuiltin({ id: 'clock', title: 'Clock', description: 'the time', popup: true } as never)

const ran: Array<{ action: KeybindingAction; dialogOpen: boolean }> = []
let release: () => void = () => {}
let moveFocusTo: HTMLElement | null = null
let before: HTMLButtonElement

beforeEach(() => {
  vi.stubGlobal('elecdex', { system: { platform: 'win32' } })
  // Motion reduced, so the palette goes as soon as it closes: its power-off is motion.spec's.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  layout.tree = {
    version: LAYOUT_VERSION,
    root: split('row', [pane('terminal'), pane('clock')]),
  }
  layout.savedLayouts = [
    { id: 'l1', name: 'Work', active: true, preset: null, shape: [] },
    { id: 'l2', name: 'Night', active: false, preset: null, shape: [] },
  ]
  ran.length = 0
  moveFocusTo = null
  // Actions go through `commands`, as the real target sends them.
  targets.action.mockImplementation((action: KeybindingAction) => commands.run(action))
  release = commands.provide({
    run: (action) => {
      ran.push({ action, dialogOpen: ui.dialogOpen })
      moveFocusTo?.focus()
      return true
    },
    applies: (action) => action !== 'tab.next',
  })
  before = document.createElement('button')
  before.textContent = 'before'
  document.body.append(before)
  before.focus()
})

afterEach(() => {
  ui.closePalette()
  flushSync()
  release()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

async function open(): Promise<HTMLInputElement> {
  render(ActionPalette)
  ui.openPalette()
  await settle()
  const input = document.querySelector<HTMLInputElement>('[data-testid=action-palette-filter]')
  expect(input).not.toBeNull()
  return input as HTMLInputElement
}

function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  ;(document.activeElement ?? document.body).dispatchEvent(event)
  flushSync()
  return event
}

async function type(input: HTMLInputElement, text: string): Promise<void> {
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await settle()
}

const rows = () =>
  [...document.querySelectorAll<HTMLElement>('[data-testid=action-palette-row]')].map(
    (row) => row.dataset.key,
  )
const selected = () =>
  document.querySelector<HTMLElement>('[data-testid=action-palette-row][aria-selected=true]')
const footer = () => document.querySelector('[data-testid=action-palette-footer]')?.textContent

describe('opening and closing', () => {
  it('opens with the keyboard in the filter, and gives it back on Escape', async () => {
    const input = await open()
    expect(document.querySelector('[data-testid=action-palette]')).not.toBeNull()
    expect(document.activeElement).toBe(input)
    press('Escape')
    await settle()
    expect(ui.paletteOpen).toBe(false)
    expect(document.activeElement).toBe(before)
  })

  it('closes on a press of the backdrop, not of the palette', async () => {
    await open()
    const palette = document.querySelector('[data-testid=action-palette]') as HTMLElement
    palette.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    flushSync()
    expect(ui.paletteOpen).toBe(true)
    palette.parentElement?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    flushSync()
    expect(ui.paletteOpen).toBe(false)
  })

  it('keeps the keyboard where an action put it, rather than giving it back after', async () => {
    const input = await open()
    moveFocusTo = document.createElement('textarea')
    document.body.append(moveFocusTo)
    await type(input, 'focus the shell')
    press('Enter')
    await settle()
    expect(ran.map((r) => r.action)).toEqual(['shell.focus'])
    expect(document.activeElement).toBe(moveFocusTo)
  })

  it('stops the keys it takes, so nothing under it sees them', async () => {
    await open()
    const seen: string[] = []
    const listener = (event: KeyboardEvent) => seen.push(event.key)
    document.addEventListener('keydown', listener)
    for (const key of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Tab', 'Escape']) press(key)
    document.removeEventListener('keydown', listener)
    expect(seen).toEqual([])
  })
})

describe('finding', () => {
  it('narrows the rows as words are typed, underlining what matched', async () => {
    const input = await open()
    const all = rows().length
    await type(input, 'split right')
    expect(rows()[0]).toBe('action:pane.splitRight')
    expect(rows().length).toBeLessThan(all)
    expect(selected()?.querySelectorAll('mark').length).toBeGreaterThan(0)
    expect(footer()).toContain('a new pane right of the focused one')
  })

  it('heads the rows by kind with nothing typed, and goes round the kinds on Tab', async () => {
    const input = await open()
    const headings = () =>
      [...document.querySelectorAll('[data-testid=action-palette-heading]')].map(
        (h) => h.textContent,
      )
    expect(headings()).toEqual(['action', 'layout', 'preset', 'theme', 'pane', 'settings'])
    press('ArrowDown')
    press('Tab')
    expect(
      document.querySelector('[data-testid=action-palette-kind][aria-checked=true]')?.textContent,
    ).toMatch(/^action/)
    expect(headings()).toEqual([])
    expect(selected()?.dataset.key).toBe(rows()[0])
    press('Tab', { shiftKey: true })
    press('Tab', { shiftKey: true })
    expect(rows().every((key) => key?.startsWith('settings:'))).toBe(true)
    expect(document.activeElement).toBe(input)
  })

  it('keeps the keyboard in the filter when a kind is clicked', async () => {
    const input = await open()
    const kind = document.querySelector<HTMLElement>(
      '[data-testid=action-palette-kind][data-kind=theme]',
    )
    kind?.click()
    await settle()
    expect(rows().every((key) => key?.startsWith('theme:'))).toBe(true)
    expect(document.activeElement).toBe(input)
  })

  it('moves round the ends with the arrows, and by pages', async () => {
    await open()
    const keys = rows()
    expect(selected()?.dataset.key).toBe(keys[0])
    press('ArrowUp')
    expect(selected()?.dataset.key).toBe(keys.at(-1))
    press('ArrowDown')
    press('PageDown')
    expect(selected()?.dataset.key).toBe(keys[8])
    press('PageUp')
    expect(selected()?.dataset.key).toBe(keys[0])
  })

  it('says when nothing matches, and Enter then does nothing', async () => {
    const input = await open()
    await type(input, 'zzzz')
    expect(document.querySelector('[data-testid=action-palette-empty]')?.textContent).toContain(
      'zzzz',
    )
    press('Enter')
    expect(ui.paletteOpen).toBe(true)
    expect(ran).toEqual([])
  })
})

describe('running', () => {
  it('runs the chosen action once, after the palette has closed', async () => {
    const input = await open()
    await type(input, 'split right')
    press('Enter')
    await settle()
    expect(ran).toEqual([{ action: 'pane.splitRight', dialogOpen: false }])
    expect(ui.paletteOpen).toBe(false)
  })

  it('does nothing for a row that cannot run now or is in use, and says why', async () => {
    const input = await open()
    await type(input, 'next tab')
    expect(selected()?.dataset.key).toBe('action:tab.next')
    expect(selected()?.textContent).toContain('not in a tab group')
    expect(footer()).toContain('not in a tab group')
    press('Enter')
    await type(input, 'work')
    expect(selected()?.dataset.key).toBe('layout:l1')
    press('Enter')
    expect(ui.paletteOpen).toBe(true)
    expect(ran).toEqual([])
    expect(targets.layout).not.toHaveBeenCalled()
  })

  it('arms what cannot be undone, and runs it on the second Enter', async () => {
    const input = await open()
    await type(input, 'quit')
    press('Enter')
    expect(ran).toEqual([])
    expect(selected()?.textContent).toContain('enter again to quit')
    // Moving off disarms it.
    press('ArrowDown')
    press('ArrowUp')
    expect(selected()?.textContent).not.toContain('enter again')
    press('Enter')
    press('Enter')
    await settle()
    expect(ran.map((r) => r.action)).toEqual(['app.quit'])
  })

  it('takes the first Escape back from an armed row, and closes on the second', async () => {
    const input = await open()
    await type(input, 'quit')
    press('Enter')
    press('Escape')
    expect(ui.paletteOpen).toBe(true)
    expect(selected()?.textContent).not.toContain('enter again')
    press('Escape')
    expect(ui.paletteOpen).toBe(false)
  })

  it('leaves the keys alone while a word is being composed', async () => {
    const input = await open()
    await type(input, 'split right')
    const enter = press('Enter', { isComposing: true })
    const down = press('ArrowDown', { keyCode: 229 } as KeyboardEventInit)
    expect(enter.defaultPrevented).toBe(false)
    expect(down.defaultPrevented).toBe(false)
    expect(ui.paletteOpen).toBe(true)
    expect(ran).toEqual([])
  })

  it('remembers what ran, at the top next time', async () => {
    const input = await open()
    await type(input, 'split down')
    press('Enter')
    await settle()
    ui.openPalette()
    await settle()
    expect(document.querySelector('[data-testid=action-palette-heading]')?.textContent).toBe(
      'recent',
    )
    expect(rows()[0]).toBe('action:pane.splitDown')
  })
})

describe('dispatch', () => {
  const item = (key: string, kind: string) => ({ key, kind }) as never

  it('sends each kind where it goes', () => {
    dispatch(item('action:pane.close', 'action'), targets)
    dispatch(item('preset:dev', 'preset'), targets)
    dispatch(item('layout:l2', 'layout'), targets)
    dispatch(item('theme:amber', 'theme'), targets)
    dispatch(item('pane:plugin:pomodoro', 'pane'), targets)
    dispatch(item('settings:keyboard', 'settings'), targets)
    expect(targets.action.mock.calls).toEqual([['pane.close'], ['layout.preset.dev']])
    expect(targets.layout).toHaveBeenCalledWith('l2')
    expect(targets.theme).toHaveBeenCalledWith('amber')
    expect(targets.pane).toHaveBeenCalledWith('plugin:pomodoro')
    expect(targets.settings).toHaveBeenCalledWith('keyboard')
  })

  it('reaches each from the palette', async () => {
    const input = await open()
    for (const [words, check] of [
      ['night', () => expect(targets.layout).toHaveBeenCalledWith('l2')],
      ['amber', () => expect(targets.theme).toHaveBeenCalledWith('amber')],
      ['clock', () => expect(targets.pane).toHaveBeenCalledWith('clock')],
      ['settings keyboard', () => expect(targets.settings).toHaveBeenCalledWith('keyboard')],
    ] as const) {
      if (!ui.paletteOpen) {
        ui.openPalette()
        await settle()
      }
      const filter = document.querySelector<HTMLInputElement>(
        '[data-testid=action-palette-filter]',
      ) as HTMLInputElement
      await type(filter, words)
      press('Enter')
      await settle()
      check()
    }
    expect(input).toBeDefined()
  })
})
