import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The exports' save dialog is owned by the asking page's window (issue 20): the notes, the AI
 * chat and the council's exports opened theirs without one, unlike every other dialog.
 */

const hoisted = vi.hoisted(() => ({
  window: null as object | null,
  calls: [] as unknown[][],
}))

vi.mock('electron', () => ({
  BrowserWindow: { fromWebContents: () => hoisted.window },
  dialog: {
    showSaveDialog: async (...args: unknown[]) => {
      hoisted.calls.push(args)
      return { canceled: true, filePath: '' }
    },
  },
}))

const { showSaveDialogFor } = await import('../../src/main/save-dialog.js')

const page = {} as Electron.WebContents
const options = { defaultPath: 'note.md' }

beforeEach(() => {
  hoisted.calls.length = 0
  hoisted.window = null
})

describe('showSaveDialogFor', () => {
  it("opens the dialog over the asking page's window", async () => {
    const win = { name: 'elecdex' }
    hoisted.window = win
    await expect(showSaveDialogFor(page, options)).resolves.toEqual({
      canceled: true,
      filePath: '',
    })
    expect(hoisted.calls).toEqual([[win, options]])
  })

  it('opens it on its own when the page has no window (it is going)', async () => {
    await showSaveDialogFor(page, options)
    expect(hoisted.calls).toEqual([[options]])
  })
})
