import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { finishAnimations, stubMatchMedia } from './support/dom.ts'
import { settle } from './support/settle.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { ui } = await import('../../src/renderer/stores/ui.svelte.ts')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')
const { default: PasteDialog } = await import(
  '../../src/renderer/widgets/terminal/PasteDialog.svelte'
)
const { default: TerminalSearch } = await import(
  '../../src/renderer/widgets/terminal/TerminalSearch.svelte'
)

/**
 * The terminal's parts outside xterm: the question before a paste of several lines, and the
 * search bar's switches.
 */

beforeEach(() => {
  stubMatchMedia()
  // Dialogs power on and off through animate(): finished at once here, as in the other tests.
  finishAnimations()
})

afterEach(async () => {
  ui.answerPaste(false)
  cleanup()
  // Past any power-off still running, before animate() is taken away.
  await settle()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(Element.prototype, 'animate')
  vi.restoreAllMocks()
})

describe('PasteDialog', () => {
  it('asks before several lines go in, and answers by Enter, Escape or its buttons', async () => {
    render(PasteDialog)
    const first = ui.askPaste({ lines: 3, preview: 'ls\nrm -rf build\necho done', more: 0 })
    await tick()
    expect(screen.getByTestId('paste-lines').textContent).toContain('3 lines')
    expect(screen.getByTestId('paste-preview').textContent).toContain('rm -rf build')
    await fireEvent.keyDown(window, { key: 'Enter' })
    expect(await first).toBe(true)
    const second = ui.askPaste({ lines: 2, preview: 'a\nb', more: 0 })
    await tick()
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(await second).toBe(false)
    // Gone once it has powered off.
    await settle()
    expect(screen.queryByTestId('paste-dialog')).toBeNull()
  })

  it('is answered no by any other dialog opening, never left waiting', async () => {
    render(PasteDialog)
    const asked = ui.askPaste({ lines: 2, preview: 'a\nb', more: 0 })
    expect(ui.dialogOpen).toBe(true)
    ui.openSettings()
    expect(await asked).toBe(false)
    ui.settingsOpen = false
  })

  it('takes Enter on a focused button as that button, and says what the preview leaves out', async () => {
    // Found in review: Enter on "don't paste" pasted.
    render(PasteDialog)
    const asked = ui.askPaste({ lines: 20, preview: 'a\nb', more: 18 })
    await tick()
    expect(screen.getByTestId('paste-more').textContent).toContain('18 more lines')
    const cancel = screen.getByTestId('paste-cancel')
    cancel.focus()
    await fireEvent.keyDown(cancel, { key: 'Enter' })
    expect(ui.paste).not.toBeNull()
    cancel.click()
    expect(await asked).toBe(false)
  })

  it('stops asking when told to, and pastes this once', async () => {
    const patch = vi.spyOn(appearance, 'patch').mockResolvedValue(undefined as never)
    render(PasteDialog)
    const asked = ui.askPaste({ lines: 2, preview: 'a\nb', more: 0 })
    await tick()
    screen.getByTestId('paste-always').click()
    expect(await asked).toBe(true)
    expect(patch).toHaveBeenCalledWith({ terminal: { confirmPaste: false } })
  })
})

describe('TerminalSearch, with a pattern half typed', () => {
  it('says it is not a pattern rather than searching', async () => {
    // Found in review: "(" with .* on threw out of the search on every key.
    const find = vi.fn((_term: string, _back: boolean, how: { regex: boolean }) => !how.regex)
    const addon = { onDidChangeResults: () => ({ dispose() {} }), clearDecorations: vi.fn() }
    render(TerminalSearch, {
      props: { addon: addon as never, find, focusToken: 0, onclose: () => {} },
    })
    await fireEvent.click(screen.getByTestId('terminal-search-regex'))
    await fireEvent.input(screen.getByTestId('terminal-search-box'), { target: { value: '(' } })
    expect(screen.getByTestId('terminal-search-tally').textContent).toBe('not a pattern')
  })
})

describe('TerminalSearch', () => {
  it('searches again with a switch turned, by case, word or regular expression', async () => {
    const find = vi.fn(() => true)
    const addon = { onDidChangeResults: () => ({ dispose() {} }), clearDecorations: vi.fn() }
    render(TerminalSearch, {
      props: { addon: addon as never, find, focusToken: 0, onclose: () => {} },
    })
    const box = screen.getByTestId('terminal-search-box') as HTMLInputElement
    await fireEvent.input(box, { target: { value: 'err.r' } })
    expect(find).toHaveBeenLastCalledWith('err.r', false, {
      caseSensitive: false,
      regex: false,
      wholeWord: false,
    })
    await fireEvent.click(screen.getByTestId('terminal-search-regex'))
    await fireEvent.click(screen.getByTestId('terminal-search-case'))
    await fireEvent.click(screen.getByTestId('terminal-search-word'))
    expect(find).toHaveBeenLastCalledWith('err.r', false, {
      caseSensitive: true,
      regex: true,
      wholeWord: true,
    })
    expect(screen.getByTestId('terminal-search-regex').getAttribute('aria-pressed')).toBe('true')
    await fireEvent.keyDown(box, { key: 'Enter', shiftKey: true })
    expect(find).toHaveBeenLastCalledWith('err.r', true, {
      caseSensitive: true,
      regex: true,
      wholeWord: true,
    })
  })
})
