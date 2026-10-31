import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { finishAnimations, stubMatchMedia } from './support/dom.ts'
import { settle } from './support/settle.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { ui } = await import('../../src/renderer/stores/ui.svelte.ts')
const { default: QuitDialog } = await import('../../src/renderer/layout/QuitDialog.svelte')

/**
 * The question Ctrl+Shift+Q asks before elecdex quits: Q lies under 1 and 2, so a slip while
 * switching layouts with Ctrl+Shift+1..9 ended the app and every shell in it (user decision
 * 2026-10-31). No is where the keyboard starts, so a stray Enter does not quit either.
 */

beforeEach(() => {
  stubMatchMedia()
  finishAnimations()
})

afterEach(async () => {
  ui.answerQuit(false)
  cleanup()
  await settle()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(Element.prototype, 'animate')
  vi.restoreAllMocks()
})

describe('QuitDialog', () => {
  it('asks yes or no, with the keyboard on no, so Enter and Escape stay', async () => {
    render(QuitDialog)
    const asked = ui.askQuit()
    await tick()
    await Promise.resolve()
    expect(ui.dialogOpen).toBe(true)
    expect(screen.getByTestId('quit-dialog').textContent).toContain('Quit elecdex?')
    const no = screen.getByTestId('quit-no')
    expect(document.activeElement).toBe(no)
    await fireEvent.keyDown(no, { key: 'Enter' })
    no.click()
    expect(await asked).toBe(false)
    const again = ui.askQuit()
    await tick()
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(await again).toBe(false)
    await settle()
    expect(screen.queryByTestId('quit-dialog')).toBeNull()
  })

  it('quits on yes', async () => {
    render(QuitDialog)
    const asked = ui.askQuit()
    await tick()
    screen.getByTestId('quit-yes').click()
    expect(await asked).toBe(true)
  })

  it('takes Enter on the dialog itself as no, never as yes', async () => {
    render(QuitDialog)
    const asked = ui.askQuit()
    await tick()
    await fireEvent.keyDown(screen.getByTestId('quit-dialog'), { key: 'Enter' })
    expect(await asked).toBe(false)
  })

  it('is answered no by any other dialog opening, and a second ask keeps the first', async () => {
    render(QuitDialog)
    const first = ui.askQuit()
    expect(await ui.askQuit()).toBe(false)
    expect(ui.quit).not.toBeNull()
    ui.openSettings()
    expect(await first).toBe(false)
    ui.settingsOpen = false
  })

  it('answers another question on screen no as it opens', async () => {
    const paste = ui.askPaste({ lines: 2, preview: 'a\nb', more: 0 })
    const asked = ui.askQuit()
    expect(await paste).toBe(false)
    ui.answerQuit(false)
    expect(await asked).toBe(false)
  })
})
