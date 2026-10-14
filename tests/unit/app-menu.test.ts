import { describe, expect, it } from 'vitest'
import { appMenuTemplate } from '../../src/main/app-menu.js'

/**
 * The application menu: none on Windows and Linux, and on macOS only the app and Edit menus
 * (issue 18: without Edit, Cmd+C and Cmd+V did nothing in a text field), never one that reloads
 * or zooms the workspace.
 */
describe('the application menu', () => {
  it('is none on Windows and Linux', () => {
    expect(appMenuTemplate('win32')).toBeNull()
    expect(appMenuTemplate('linux')).toBeNull()
  })

  it('is the app and Edit menus on macOS, nothing that reloads or zooms', () => {
    const template = appMenuTemplate('darwin')
    expect(template?.map((item) => item.role)).toEqual(['appMenu', 'editMenu'])
    expect(JSON.stringify(template)).not.toMatch(/reload|zoom|viewMenu|DevTools/i)
  })
})
