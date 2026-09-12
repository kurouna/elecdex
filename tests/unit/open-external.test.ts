import { describe, expect, it, vi } from 'vitest'

const openExternal = vi.fn<(url: string) => Promise<void>>(() => Promise.resolve())

vi.mock('electron', () => ({
  shell: { openExternal },
  BrowserWindow: class {},
  screen: { getAllDisplays: () => [], getPrimaryDisplay: () => ({ bounds: {} }) },
}))

const { openExternalIfSafe } = await import('../../src/main/window.js')

describe('openExternalIfSafe', () => {
  it('opens http and https urls', async () => {
    openExternal.mockClear()
    await openExternalIfSafe('https://github.com/kurouna/elecdex')
    await openExternalIfSafe('http://localhost:5173/')
    expect(openExternal).toHaveBeenCalledTimes(2)
  })

  it.each([
    'file:///etc/passwd',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox',
    'not a url at all',
    '',
  ])('refuses %s', async (url) => {
    openExternal.mockClear()
    await openExternalIfSafe(url)
    expect(openExternal).not.toHaveBeenCalled()
  })
})
