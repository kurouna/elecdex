import { EventEmitter } from 'node:events'
import { WEB_PRESETS, type WebPreset } from '@shared/web'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * main's web views against a fake Electron: who may place a view, what a page may
 * navigate to, how the tint follows the theme, and which keys go back to the app.
 */

const hoisted = vi.hoisted(() => ({
  opened: [] as string[],
  menus: [] as unknown[],
  theme: { themeSource: 'system' },
  helpers: [] as unknown[],
}))

class FakeContents extends EventEmitter {
  static next = 1
  id = FakeContents.next++
  url = ''
  title = ''
  destroyed = false
  focused = false
  zoom = 1
  css = new Map<string, string>()
  cssCount = 0
  sent: Array<[string, unknown]> = []
  openHandler: ((details: { url: string; disposition: string }) => unknown) | null = null
  history = {
    back: false,
    forward: false,
    canGoBack: () => this.history.back,
    canGoForward: () => this.history.forward,
    goBack: vi.fn(),
    goForward: vi.fn(),
  }
  get navigationHistory() {
    return this.history
  }
  loadURL = vi.fn(async (url: string) => {
    this.url = url
  })
  getURL = () => this.url
  getTitle = () => this.title
  isLoading = () => false
  isDestroyed = () => this.destroyed
  isFocused = () => this.focused
  focus = vi.fn(() => {
    this.focused = true
  })
  close = vi.fn(() => {
    this.destroyed = true
    this.emit('destroyed')
  })
  reload = vi.fn()
  stop = vi.fn()
  getZoomFactor = () => this.zoom
  send = (channel: string, payload: unknown) => this.sent.push([channel, payload])
  insertCSS = vi.fn(async (css: string) => {
    const key = `k${++this.cssCount}`
    this.css.set(key, css)
    return key
  })
  removeInsertedCSS = vi.fn(async (key: string) => {
    this.css.delete(key)
  })
  capturePage = vi.fn(async () => ({
    isEmpty: () => false,
    toJPEG: () => Buffer.from('jpeg'),
  }))
  setWindowOpenHandler = (handler: FakeContents['openHandler']) => {
    this.openHandler = handler
  }
}

class FakeView {
  webContents = new FakeContents()
  visible = true
  bounds = { x: 0, y: 0, width: 0, height: 0 }
  background = ''
  setVisible = (visible: boolean) => {
    this.visible = visible
  }
  getVisible = () => this.visible
  setBounds = (bounds: FakeView['bounds']) => {
    this.bounds = bounds
  }
  setBackgroundColor = (colour: string) => {
    this.background = colour
  }
}

class FakeWindow extends EventEmitter {
  static byContents = new Map<FakeContents, FakeWindow>()
  children: FakeView[] = []
  size = [800, 600]
  getContentSize = () => this.size
  contentView = {
    addChildView: (view: FakeView) => {
      this.children = [...this.children.filter((v) => v !== view), view]
    },
    removeChildView: (view: FakeView) => {
      this.children = this.children.filter((v) => v !== view)
    },
  }
  readonly webContents: FakeContents
  constructor(webContents: FakeContents) {
    super()
    this.webContents = webContents
    FakeWindow.byContents.set(webContents, this)
  }
  static fromWebContents(contents: FakeContents) {
    return FakeWindow.byContents.get(contents) ?? null
  }
}

vi.mock('electron', () => ({
  app: { isPackaged: false },
  BrowserWindow: FakeWindow,
  WebContentsView: FakeView,
  Menu: { buildFromTemplate: (items: unknown) => ({ popup: () => hoisted.menus.push(items) }) },
  nativeTheme: hoisted.theme,
  clipboard: { writeText: vi.fn() },
  shell: {
    openExternal: async (url: string) => {
      hoisted.opened.push(url)
    },
  },
}))
vi.mock('../../src/main/web/partition.js', () => ({ webSession: () => ({}) }))
vi.mock('../../src/main/app-windows.js', () => ({
  markHelperWindow: (win: unknown) => hoisted.helpers.push(win),
}))

const { WebViews } = await import('../../src/main/web/views.js')

const preset = (id: string): WebPreset => {
  const found = WEB_PRESETS.find((p) => p.id === id)
  if (!found) throw new Error(id)
  return found
}

const RECT = { x: 10, y: 20, width: 300, height: 200 }
const look = (accent: string) => ({ accent, tint: true, dark: true, background: '#010203' })
let owner: FakeContents
let win: FakeWindow
let views: InstanceType<typeof WebViews>
const keymap = new Map([['Ctrl+Shift+KeyA', 'pane.add']])

const asOwner = (contents: FakeContents) => contents as unknown as Electron.WebContents
const view = (index = 0) => win.children[index] as FakeView
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  hoisted.opened.length = 0
  hoisted.menus.length = 0
  hoisted.helpers.length = 0
  owner = new FakeContents()
  win = new FakeWindow(owner)
  views = new WebViews({ keymap: () => keymap })
})

describe('WebViews', () => {
  it('creates a hidden view in the page window, at the preset home or the saved page', () => {
    views.open(asOwner(owner), 'p', 'a', preset('youtube'), 'https://www.youtube.com/watch?v=1')
    views.open(asOwner(owner), 'q', 'b', preset('youtube'), 'https://example.com/')
    views.open(asOwner(owner), 'r', 'c', preset('browser'), null)
    expect(win.children.map((v) => v.webContents.url)).toEqual([
      'https://www.youtube.com/watch?v=1',
      // A saved page off the preset's site is not opened: the home is.
      'https://www.youtube.com/',
      // The browser without a page opens nothing.
      '',
    ])
    expect(win.children.every((v) => !v.visible)).toBe(true)
  })

  it('shows at the rectangle, scaled by the page zoom', () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    owner.zoom = 1.5
    views.show(asOwner(owner), 'p', 'a', RECT)
    expect(view().visible).toBe(true)
    expect(view().bounds).toEqual({ x: 15, y: 30, width: 450, height: 300 })
  })

  it('ignores placing from an older mount of the pane, and from another page', () => {
    views.open(asOwner(owner), 'p', 'old', preset('x'), null)
    // The pane moved: the new mount takes the view and shows it...
    views.open(asOwner(owner), 'p', 'new', preset('x'), null)
    views.show(asOwner(owner), 'p', 'new', RECT)
    // ...and the old mount's last word changes nothing.
    void views.hide(asOwner(owner), 'p', 'old', false)
    views.show(asOwner(owner), 'p', 'old', { ...RECT, x: 99 })
    views.close(asOwner(owner), 'p', 'old')
    expect(win.children).toHaveLength(1)
    expect(view().visible).toBe(true)
    expect(view().bounds.x).toBe(10)

    const stranger = new FakeContents()
    new FakeWindow(stranger)
    views.show(asOwner(stranger), 'p', 'new', { ...RECT, x: 5 })
    views.close(asOwner(stranger), 'p', null)
    expect(view().bounds.x).toBe(10)
    expect(views.list(asOwner(stranger))).toEqual([])
    expect(views.list(asOwner(owner))).toEqual(['p'])
  })

  it('keeps the page when the pane remounts, and replaces it when the preset changes', () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    const first = view().webContents
    views.open(asOwner(owner), 'p', 'b', preset('x'), null)
    expect(view().webContents).toBe(first)
    expect(first.loadURL).toHaveBeenCalledTimes(1)
    views.open(asOwner(owner), 'p', 'c', preset('youtube'), null)
    expect(first.destroyed).toBe(true)
    expect(win.children).toHaveLength(1)
    expect(view().webContents.url).toBe('https://www.youtube.com/')
  })

  it('hides with a picture, unless shown again while the picture was taken', async () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    views.show(asOwner(owner), 'p', 'a', RECT)
    const picture = await views.hide(asOwner(owner), 'p', 'a', true)
    expect(picture).toBe(`data:image/jpeg;base64,${Buffer.from('jpeg').toString('base64')}`)
    expect(view().visible).toBe(false)

    views.show(asOwner(owner), 'p', 'a', RECT)
    const hiding = views.hide(asOwner(owner), 'p', 'a', true)
    views.show(asOwner(owner), 'p', 'a', RECT)
    await hiding
    expect(view().visible).toBe(true)
  })

  it('gives the keyboard back to the workspace when a focused page is hidden', async () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    views.show(asOwner(owner), 'p', 'a', RECT)
    views.focus(asOwner(owner), 'p')
    expect(view().webContents.focused).toBe(true)
    await views.hide(asOwner(owner), 'p', 'a', false)
    expect(owner.focus).toHaveBeenCalled()
  })

  it('hides the views of a page that reloads, and destroys those of a page that goes', () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    views.show(asOwner(owner), 'p', 'a', RECT)
    owner.emit('did-start-navigation', { isMainFrame: true, isSameDocument: true })
    expect(view().visible).toBe(true)
    owner.emit('did-start-navigation', { isMainFrame: true, isSameDocument: false })
    expect(view().visible).toBe(false)
    const contents = view().webContents
    owner.emit('destroyed')
    expect(contents.destroyed).toBe(true)
    expect(win.children).toEqual([])
  })

  it('keeps a preset page on its site and sends other hosts to the browser', async () => {
    views.open(asOwner(owner), 'p', 'a', preset('youtube'), null)
    const contents = view().webContents
    const navigate = (event: string, url: string, isMainFrame = true) => {
      const details = { url, isMainFrame, preventDefault: vi.fn() }
      contents.emit(event, details)
      return details.preventDefault
    }
    expect(navigate('will-navigate', 'https://m.youtube.com/')).not.toHaveBeenCalled()
    expect(navigate('will-navigate', 'https://example.com/')).toHaveBeenCalled()
    expect(navigate('will-navigate', 'file:///C:/')).toHaveBeenCalled()
    expect(navigate('will-redirect', 'https://evil.test/')).toHaveBeenCalled()
    // A frame inside the page may go where it likes; only the page itself is kept.
    expect(navigate('will-redirect', 'https://ads.test/', false)).not.toHaveBeenCalled()
    await flush()
    expect(hoisted.opened).toEqual(['https://example.com/', 'https://evil.test/'])
  })

  it('opens new windows by the preset: a sign-in popup, the pane itself, the browser or nothing', async () => {
    views.open(asOwner(owner), 'p', 'a', preset('youtube'), null)
    const contents = view().webContents
    const open = (url: string, disposition: string) => contents.openHandler?.({ url, disposition })
    const popup = open('https://accounts.google.com/signin', 'new-window') as {
      action: string
      overrideBrowserWindowOptions: { webPreferences: Record<string, unknown> }
    }
    expect(popup.action).toBe('allow')
    expect(popup.overrideBrowserWindowOptions.webPreferences).toMatchObject({
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    })
    expect(popup.overrideBrowserWindowOptions.webPreferences).not.toHaveProperty('preload')

    expect(open('https://www.youtube.com/watch?v=9', 'foreground-tab')).toEqual({ action: 'deny' })
    expect(contents.url).toBe('https://www.youtube.com/watch?v=9')
    expect(open('https://example.com/', 'new-window')).toEqual({ action: 'deny' })
    expect(open('javascript:alert(1)', 'new-window')).toEqual({ action: 'deny' })
    await flush()
    expect(hoisted.opened).toEqual(['https://example.com/'])

    // The popup is a helper window, and opens nothing further itself.
    const child = new FakeContents()
    contents.emit('did-create-window', { webContents: child })
    expect(hoisted.helpers).toHaveLength(1)
    expect(child.openHandler?.({ url: 'https://a.test/', disposition: 'new-window' })).toEqual({
      action: 'deny',
    })
    const blocked = { url: 'file:///C:/', preventDefault: vi.fn() }
    child.emit('will-navigate', blocked)
    expect(blocked.preventDefault).toHaveBeenCalled()
  })

  it('opens typed addresses only when they are web pages', async () => {
    views.open(asOwner(owner), 'p', 'a', preset('browser'), null)
    const contents = view().webContents
    views.command(asOwner(owner), 'p', { t: 'address', input: 'example.com' })
    expect(contents.url).toBe('https://example.com/')
    views.command(asOwner(owner), 'p', { t: 'address', input: 'file:///C:/Windows' })
    expect(contents.url).toBe('https://example.com/')
    const [channel, state] = owner.sent.at(-1) ?? []
    expect(channel).toBe('web:state')
    expect((state as { error: string }).error).toMatch(/not a web address/)

    // A preset sends an address off its site to the browser.
    views.open(asOwner(owner), 'q', 'b', preset('x'), null)
    views.command(asOwner(owner), 'q', { t: 'address', input: 'https://example.org/' })
    await flush()
    expect(hoisted.opened).toEqual(['https://example.org/'])
  })

  it('tints each document in the theme, and takes the tint out again', async () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    const contents = view().webContents
    views.setAppearance(look('#00ffff'))
    await flush()
    expect(hoisted.theme.themeSource).toBe('dark')
    expect(view().background).toBe('#010203')
    expect([...contents.css.values()]).toEqual([expect.stringContaining('feColorMatrix')])

    // The same tint twice changes nothing; a new document gets it again.
    views.setAppearance(look('#00ffff'))
    await flush()
    expect(contents.insertCSS).toHaveBeenCalledTimes(1)
    contents.css.clear()
    contents.emit('dom-ready')
    await flush()
    expect(contents.css.size).toBe(1)

    // Quick changes run in order and leave one tint, the last.
    views.setAppearance(look('#ff0000'))
    views.setAppearance(look('#00ff00'))
    await flush()
    await flush()
    expect(contents.css.size).toBe(1)

    // A new document while a change is under way still ends up tinted.
    let finish: (key: string) => void = () => {}
    contents.insertCSS.mockImplementationOnce(
      (css: string) =>
        new Promise((resolve) => {
          finish = (key) => {
            contents.css.set(key, css)
            resolve(key)
          }
        }),
    )
    views.setAppearance(look('#0000ff'))
    await flush()
    contents.emit('dom-ready')
    // The old document's CSS went with it.
    finish('old-document')
    contents.css.clear()
    await flush()
    await flush()
    expect([...contents.css.values()]).toEqual([expect.stringContaining('feColorMatrix')])

    views.setAppearance({ accent: null, tint: true, dark: false, background: '#ffffff' })
    await flush()
    expect(contents.css.size).toBe(0)
    expect(hoisted.theme.themeSource).toBe('light')
  })

  it('lets a pane answer the tint for itself, and go back to following the setting', async () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    views.open(asOwner(owner), 'q', 'b', preset('youtube'), null)
    const [one, two] = win.children.map((v) => v.webContents)
    views.setAppearance(look('#00ffff'))
    await flush()
    expect([one?.css.size, two?.css.size]).toEqual([1, 1])

    // One pane off: the other keeps its colour.
    views.command(asOwner(owner), 'p', { t: 'tint', on: false })
    await flush()
    expect([one?.css.size, two?.css.size]).toEqual([0, 1])

    // The setting goes off: the pane that said "on" keeps it.
    views.command(asOwner(owner), 'q', { t: 'tint', on: true })
    views.setAppearance({ accent: '#00ffff', tint: false, dark: true, background: '#010203' })
    await flush()
    await flush()
    expect([one?.css.size, two?.css.size]).toEqual([0, 1])

    // Following the setting again: off like it.
    views.command(asOwner(owner), 'q', { t: 'tint', on: null })
    await flush()
    expect(two?.css.size).toBe(0)
  })

  it('sends a fresh picture when a hidden view changes colour under a dialog', async () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    views.show(asOwner(owner), 'p', 'a', RECT)
    const contents = view().webContents
    // A dialog: the pane holds a picture of the view.
    await views.hide(asOwner(owner), 'p', 'a', true)
    owner.sent.length = 0

    contents.capturePage.mockResolvedValueOnce({
      isEmpty: () => false,
      toJPEG: () => Buffer.from('tinted'),
    })
    views.setAppearance(look('#00ffff'))
    await flush()
    await flush()
    const picture = owner.sent.find(([channel]) => channel === 'web:snapshot')
    expect(picture?.[1]).toEqual({
      paneId: 'p',
      image: `data:image/jpeg;base64,${Buffer.from('tinted').toString('base64')}`,
    })

    // Nothing to refresh while the view is on screen: the pane sees it itself.
    views.show(asOwner(owner), 'p', 'a', RECT)
    owner.sent.length = 0
    views.setAppearance(look('#ff00ff'))
    await flush()
    await flush()
    expect(owner.sent.filter(([channel]) => channel === 'web:snapshot')).toEqual([])
  })

  it('takes app shortcuts from the page and leaves every other key to it', () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    const contents = view().webContents
    const press = (input: Record<string, unknown>) => {
      const event = { preventDefault: vi.fn() }
      contents.emit('before-input-event', event, {
        type: 'keyDown',
        control: false,
        meta: false,
        alt: false,
        shift: false,
        ...input,
      })
      return event.preventDefault
    }
    expect(press({ code: 'KeyA' })).not.toHaveBeenCalled()
    expect(press({ code: 'KeyA', shift: true })).not.toHaveBeenCalled()
    expect(press({ code: 'KeyA', control: true })).not.toHaveBeenCalled()
    expect(
      press({ code: 'KeyA', control: true, shift: true, type: 'keyUp' }),
    ).not.toHaveBeenCalled()
    expect(press({ code: 'KeyA', control: true, shift: true })).toHaveBeenCalled()
    expect(owner.sent).toContainEqual(['web:shortcut', 'pane.add'])

    contents.emit('focus')
    expect(owner.sent).toContainEqual(['web:focused', 'p'])
    owner.sent.length = 0
    contents.emit('input-event', {}, { type: 'mouseMove' })
    expect(owner.sent).toEqual([])
    contents.emit('input-event', {}, { type: 'mouseDown' })
    expect(owner.sent).toEqual([['web:focused', 'p']])
  })

  it('reports load failures, but not loads replaced by another', () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    const contents = view().webContents
    contents.emit('did-fail-load', {}, -3, 'ERR_ABORTED', 'https://x.com/', true)
    contents.emit('did-fail-load', {}, -105, 'ERR_NAME_NOT_RESOLVED', 'https://ads.test/', false)
    expect(owner.sent.filter(([, s]) => (s as { error: unknown }).error !== null)).toEqual([])
    contents.emit('did-fail-load', {}, -105, 'ERR_NAME_NOT_RESOLVED', 'https://x.com/', true)
    expect(owner.sent.at(-1)?.[1]).toMatchObject({ error: 'ERR_NAME_NOT_RESOLVED' })
    // A new page clears it.
    contents.emit('did-start-navigation', { isMainFrame: true, isSameDocument: false })
    contents.emit('did-navigate')
    expect(owner.sent.at(-1)?.[1]).toMatchObject({ error: null })
  })

  it('offers copy, paste and the link in its context menu', () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    view().webContents.emit(
      'context-menu',
      {},
      { isEditable: true, editFlags: { canCut: true, canCopy: true }, linkURL: 'https://x.com/a' },
    )
    const items = hoisted.menus[0] as Array<{ label?: string; role?: string }>
    expect(items.map((i) => i.label ?? i.role).filter(Boolean)).toEqual([
      'Back',
      'Forward',
      'Reload',
      'cut',
      'paste',
      'copy',
      'selectAll',
      'Copy Link Address',
      'Open Link in Browser',
    ])
  })

  it('covers the window while its page is fullscreen, and goes back to its pane after', () => {
    views.open(asOwner(owner), 'p', 'a', preset('youtube'), null)
    views.open(asOwner(owner), 'q', 'b', preset('x'), null)
    views.show(asOwner(owner), 'p', 'a', RECT)
    const contents = view(0).webContents
    contents.emit('enter-html-full-screen')
    expect(win.children.at(-1)?.webContents).toBe(contents)
    expect(win.children.at(-1)?.bounds).toEqual({ x: 0, y: 0, width: 800, height: 600 })

    // The pane moves meanwhile, and the window resizes: still the whole window.
    views.show(asOwner(owner), 'p', 'a', { ...RECT, x: 40 })
    expect(win.children.at(-1)?.bounds).toEqual({ x: 0, y: 0, width: 800, height: 600 })
    win.size = [1024, 768]
    win.emit('resize')
    expect(win.children.at(-1)?.bounds).toEqual({ x: 0, y: 0, width: 1024, height: 768 })

    contents.emit('leave-html-full-screen')
    expect(win.children.at(-1)?.bounds).toEqual({ ...RECT, x: 40 })
  })

  it('destroys every view on dispose', () => {
    views.open(asOwner(owner), 'p', 'a', preset('x'), null)
    views.open(asOwner(owner), 'q', 'b', preset('youtube'), null)
    const contents = win.children.map((v) => v.webContents)
    views.dispose()
    expect(contents.every((c) => c.destroyed)).toBe(true)
    expect(win.children).toEqual([])
  })
})
