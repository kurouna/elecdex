import { CH } from '@shared/channels'
import { chordFromEvent } from '@shared/keybindings'
import {
  httpUrl,
  navigationVerdict,
  parseAddress,
  tintCss,
  type WebAppearance,
  type WebCommand,
  type WebPreset,
  type WebRect,
  type WebState,
  windowVerdict,
} from '@shared/web'
import {
  app,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  type ContextMenuParams,
  clipboard,
  Menu,
  type MenuItemConstructorOptions,
  nativeTheme,
  type Rectangle,
  type WebContents,
  WebContentsView,
} from 'electron'
import { markHelperWindow } from '../app-windows.js'
import { openExternalIfSafe } from '../window.js'
import { webSession } from './partition.js'

/**
 * The web panes' views, by pane id (docs/architecture.md section 5.4).
 *
 * A view outlives its pane's component, as a shell does: moving a pane remounts
 * it, and the page must not reload for that. The page that asked for a view last
 * owns it - the view sits in that page's window and only that page may place it.
 *
 * Each mount of a pane's component claims the view with a token of its own. While a
 * pane moves, the new component can mount before the old one has gone; the old one's
 * last word (hide) carries the old claim and is ignored, so it cannot hide the page
 * the new one has just shown.
 */

export interface WebViewsOptions {
  /** The chord -> action map in effect, for shortcuts pressed in a page. */
  keymap: () => ReadonlyMap<string, string>
}

interface Entry {
  paneId: string
  preset: WebPreset
  view: WebContentsView
  owner: WebContents
  /** The mount that placed the view last (see above). */
  claim: string
  /** Bumped by every show and hide, so a hide that waited for a snapshot does not undo a later show. */
  placement: number
  /** The key of the tint CSS in the current document, and the tint it draws. */
  css: { key: string; tint: string } | null
  /** The tint change under way: changes run one after another. */
  tinting: Promise<void>
  error: string | null
  snapshot: string | null
  /** Where the pane put the view last, in window pixels. */
  bounds: Rectangle | null
  /** The page asked for fullscreen (a video): the view covers the whole window meanwhile. */
  fullscreen: boolean
}

/** Chromium's code for a load that was replaced by another (a redirect, a new navigation). */
const ERR_ABORTED = -3
const SNAPSHOT_QUALITY = 85
const POPUP_SIZE = { width: 520, height: 720 }

const windowOf = (contents: WebContents): BrowserWindow | null =>
  contents.isDestroyed() ? null : BrowserWindow.fromWebContents(contents)

export class WebViews {
  private readonly entries = new Map<string, Entry>()
  private readonly owners = new WeakSet<WebContents>()
  private appearance: WebAppearance = { tint: null, dark: true, background: '#000000' }
  private readonly options: WebViewsOptions

  constructor(options: WebViewsOptions) {
    this.options = options
  }

  /**
   * Creates the pane's view, or moves the one it has to `owner`. A new view opens
   * `url` when the preset keeps it, else the preset's home.
   */
  open(
    owner: WebContents,
    paneId: string,
    claim: string,
    preset: WebPreset,
    url: string | null,
  ): WebState {
    const existing = this.entries.get(paneId)
    if (existing !== undefined && existing.preset.id === preset.id) {
      existing.claim = claim
      this.adopt(existing, owner)
      return this.stateOf(existing)
    }
    if (existing !== undefined) this.destroy(existing)
    const entry = this.create(owner, paneId, claim, preset)
    const start = url !== null && navigationVerdict(preset, url) === 'allow' ? url : preset.home
    if (start !== null && start !== 'about:blank') this.load(entry, start)
    return this.stateOf(entry)
  }

  show(owner: WebContents, paneId: string, claim: string, rect: WebRect): void {
    const entry = this.owned(owner, paneId, claim)
    if (entry === null) return
    entry.placement += 1
    const zoom = owner.getZoomFactor()
    entry.bounds = {
      x: Math.round(rect.x * zoom),
      y: Math.round(rect.y * zoom),
      width: Math.round(rect.width * zoom),
      height: Math.round(rect.height * zoom),
    }
    if (entry.fullscreen) this.fill(entry)
    else entry.view.setBounds(entry.bounds)
    entry.view.setVisible(true)
  }

  /**
   * Hides the view. With `snapshot`, a picture of it first, for the pane to show in
   * its place: the window's own capture does not include child views.
   */
  async hide(
    owner: WebContents,
    paneId: string,
    claim: string,
    snapshot: boolean,
  ): Promise<string | null> {
    const entry = this.owned(owner, paneId, claim)
    if (entry === null) return null
    const placement = ++entry.placement
    if (snapshot && entry.view.getVisible()) entry.snapshot = await this.capture(entry)
    if (placement === entry.placement && this.entries.get(paneId) === entry) this.conceal(entry)
    return snapshot ? entry.snapshot : null
  }

  command(owner: WebContents, paneId: string, command: WebCommand): void {
    const entry = this.owned(owner, paneId)
    if (entry === null) return
    const contents = entry.view.webContents
    const history = contents.navigationHistory
    switch (command.t) {
      case 'address':
        this.address(entry, command.input)
        return
      case 'back':
        if (history.canGoBack()) history.goBack()
        return
      case 'forward':
        if (history.canGoForward()) history.goForward()
        return
      case 'reload':
        if (contents.getURL() === '') return
        entry.error = null
        contents.reload()
        return
      case 'stop':
        contents.stop()
        return
      case 'home':
        if (entry.preset.home !== null) this.load(entry, entry.preset.home)
        return
      case 'external':
        void openExternalIfSafe(contents.getURL())
        return
    }
  }

  /** Destroys the view; without a claim, whichever mount has it (the pane is gone). */
  close(owner: WebContents, paneId: string, claim: string | null): void {
    const entry = this.owned(owner, paneId, claim ?? undefined)
    if (entry !== null) this.destroy(entry)
  }

  list(owner: WebContents): string[] {
    return [...this.entries.values()].filter((e) => e.owner === owner).map((e) => e.paneId)
  }

  focus(owner: WebContents, paneId: string): void {
    const entry = this.owned(owner, paneId)
    if (entry?.view.getVisible()) entry.view.webContents.focus()
  }

  setAppearance(appearance: WebAppearance): void {
    this.appearance = appearance
    nativeTheme.themeSource = appearance.dark ? 'dark' : 'light'
    for (const entry of this.entries.values()) {
      entry.view.setBackgroundColor(appearance.background)
      this.tint(entry)
    }
  }

  dispose(): void {
    for (const entry of [...this.entries.values()]) this.destroy(entry)
  }

  private owned(owner: WebContents, paneId: string, claim?: string): Entry | null {
    const entry = this.entries.get(paneId)
    if (entry === undefined || entry.owner !== owner) return null
    return claim === undefined || claim === entry.claim ? entry : null
  }

  private create(owner: WebContents, paneId: string, claim: string, preset: WebPreset): Entry {
    const view = new WebContentsView({
      webPreferences: {
        session: webSession(),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        spellcheck: false,
        devTools: !app.isPackaged,
      },
    })
    view.setBackgroundColor(this.appearance.background)
    view.setVisible(false)
    const entry: Entry = {
      paneId,
      preset,
      view,
      owner,
      claim,
      placement: 0,
      css: null,
      tinting: Promise.resolve(),
      error: null,
      snapshot: null,
      bounds: null,
      fullscreen: false,
    }
    this.entries.set(paneId, entry)
    this.watchPolicy(entry)
    this.watchState(entry)
    this.watchInput(entry)
    this.watchFullscreen(entry)
    this.adopt(entry, owner)
    return entry
  }

  /** Puts the view in `owner`'s window, hidden until that page places it. */
  private adopt(entry: Entry, owner: WebContents): void {
    const from = windowOf(entry.owner)
    const to = windowOf(owner)
    entry.placement += 1
    this.conceal(entry)
    if (from !== to) from?.contentView.removeChildView(entry.view)
    entry.owner = owner
    // Added again, a child view moves to the top: above the views of panes opened since.
    to?.contentView.addChildView(entry.view)
    this.watchOwner(owner)
  }

  /** A page that reloads or goes away leaves its views hidden or destroyed. */
  private watchOwner(owner: WebContents): void {
    if (this.owners.has(owner)) return
    this.owners.add(owner)
    owner.on('did-start-navigation', (details) => {
      if (!details.isMainFrame || details.isSameDocument) return
      for (const entry of this.entries.values()) {
        if (entry.owner === owner) this.conceal(entry)
      }
    })
    owner.once('destroyed', () => {
      for (const entry of [...this.entries.values()]) {
        if (entry.owner === owner) this.destroy(entry)
      }
    })
    windowOf(owner)?.on('resize', () => {
      for (const entry of this.entries.values()) {
        if (entry.owner === owner && entry.fullscreen) this.fill(entry)
      }
    })
  }

  /**
   * A page in fullscreen covers the window, above the other views. Electron has
   * already made the window fullscreen for it, and puts the window back after.
   */
  private fill(entry: Entry): void {
    const win = windowOf(entry.owner)
    if (win === null) return
    const [width = 0, height = 0] = win.getContentSize()
    win.contentView.addChildView(entry.view)
    entry.view.setBounds({ x: 0, y: 0, width, height })
  }

  private watchFullscreen(entry: Entry): void {
    const contents = entry.view.webContents
    contents.on('enter-html-full-screen', () => {
      entry.fullscreen = true
      this.fill(entry)
    })
    contents.on('leave-html-full-screen', () => {
      entry.fullscreen = false
      if (entry.bounds !== null) entry.view.setBounds(entry.bounds)
    })
  }

  private conceal(entry: Entry): void {
    const contents = entry.view.webContents
    // The keyboard goes back to the workspace rather than to a page nobody sees.
    const focused = !contents.isDestroyed() && contents.isFocused()
    entry.view.setVisible(false)
    if (focused && !entry.owner.isDestroyed()) entry.owner.focus()
  }

  private destroy(entry: Entry): void {
    if (this.entries.get(entry.paneId) === entry) this.entries.delete(entry.paneId)
    this.conceal(entry)
    windowOf(entry.owner)?.contentView.removeChildView(entry.view)
    if (!entry.view.webContents.isDestroyed()) entry.view.webContents.close()
  }

  private async capture(entry: Entry): Promise<string | null> {
    try {
      const image = await entry.view.webContents.capturePage()
      if (image.isEmpty()) return entry.snapshot
      return `data:image/jpeg;base64,${image.toJPEG(SNAPSHOT_QUALITY).toString('base64')}`
    } catch {
      return entry.snapshot
    }
  }

  private load(entry: Entry, url: string): void {
    entry.error = null
    // A load replaced by a redirect or another navigation rejects; did-fail-load reports real failures.
    entry.view.webContents.loadURL(url).catch(() => {})
  }

  private address(entry: Entry, input: string): void {
    const url = parseAddress(input)
    const verdict = url === null ? 'block' : navigationVerdict(entry.preset, url)
    if (url !== null && verdict === 'allow') {
      this.load(entry, url)
    } else if (url !== null && verdict === 'external') {
      void openExternalIfSafe(url)
    } else {
      entry.error = `not a web address: ${input.trim().slice(0, 200)}`
      this.sendState(entry)
    }
  }

  /** Where a page may go: only http(s), and only the preset's hosts in the pane. */
  private watchPolicy(entry: Entry): void {
    const contents = entry.view.webContents
    const guard = (event: { url: string; preventDefault: () => void }): void => {
      const verdict = navigationVerdict(entry.preset, event.url)
      if (verdict === 'allow') return
      event.preventDefault()
      if (verdict === 'external') void openExternalIfSafe(event.url)
    }
    contents.on('will-navigate', guard)
    contents.on('will-redirect', (event) => {
      if (event.isMainFrame) guard(event)
    })
    contents.setWindowOpenHandler(({ url, disposition }) => {
      switch (windowVerdict(entry.preset, url, disposition)) {
        case 'popup':
          return { action: 'allow', overrideBrowserWindowOptions: this.popupOptions(entry) }
        case 'same-pane':
          this.load(entry, url)
          return { action: 'deny' }
        case 'external':
          void openExternalIfSafe(url)
          return { action: 'deny' }
        case 'block':
          return { action: 'deny' }
      }
    })
    contents.on('did-create-window', (popup) => watchPopup(popup))
  }

  private popupOptions(entry: Entry): BrowserWindowConstructorOptions {
    const parent = windowOf(entry.owner)
    return {
      ...POPUP_SIZE,
      autoHideMenuBar: true,
      backgroundColor: this.appearance.background,
      // Kept above a fullscreen workspace; macOS gives a child of a fullscreen window its own space.
      ...(parent !== null && process.platform !== 'darwin' ? { parent } : {}),
      webPreferences: {
        session: webSession(),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        spellcheck: false,
      },
    }
  }

  private watchState(entry: Entry): void {
    const contents = entry.view.webContents
    const send = (): void => this.sendState(entry)
    contents.on('did-start-loading', send)
    contents.on('did-stop-loading', send)
    contents.on('did-navigate', send)
    contents.on('did-navigate-in-page', send)
    contents.on('page-title-updated', send)
    contents.on('did-start-navigation', (details) => {
      if (details.isMainFrame && !details.isSameDocument) entry.error = null
    })
    contents.on('did-fail-load', (_event, code, description, _url, isMainFrame) => {
      if (!isMainFrame || code === ERR_ABORTED) return
      entry.error = description || `error ${code}`
      send()
    })
    contents.on('render-process-gone', (_event, details) => {
      entry.error = `the page stopped (${details.reason}); reload to start it again`
      send()
    })
    // A new document has none of the old one's CSS.
    contents.on('dom-ready', () => this.tint(entry, true))
  }

  private watchInput(entry: Entry): void {
    const contents = entry.view.webContents
    contents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return
      const chord = chordFromEvent({
        code: input.code,
        ctrlKey: input.control,
        metaKey: input.meta,
        altKey: input.alt,
        shiftKey: input.shift,
      })
      const action = chord === null ? undefined : this.options.keymap().get(chord)
      if (action === undefined) return
      event.preventDefault()
      send(entry.owner, 'shortcut', action)
    })
    // A press in the page focuses its pane. The focus event alone is not enough: a
    // WebContentsView does not always report it (seen on Windows, Electron 44).
    const focused = (): void => send(entry.owner, 'focused', entry.paneId)
    contents.on('focus', focused)
    contents.on('input-event', (_event, input) => {
      if (input.type === 'mouseDown' || input.type === 'touchStart') focused()
    })
    contents.on('context-menu', (_event, params) => {
      Menu.buildFromTemplate(contextMenu(entry, params)).popup()
    })
  }

  /**
   * Puts the page in the theme's colour, or takes it out, once the changes before have
   * run - `fresh` for a new document, which has none of the CSS a change before it put
   * in (queued too, so a change still under way cannot record its key after).
   */
  private tint(entry: Entry, fresh = false): void {
    entry.tinting = entry.tinting.then(() => {
      if (fresh) entry.css = null
      return this.retint(entry)
    })
  }

  /** Puts the page in the theme's colour, or takes it out, when that differs from what it has. */
  private async retint(entry: Entry): Promise<void> {
    const contents = entry.view.webContents
    const wanted = this.appearance.tint
    if (contents.isDestroyed() || (entry.css?.tint ?? null) === wanted) return
    const previous = entry.css
    entry.css = null
    if (wanted !== null) {
      try {
        entry.css = { key: await contents.insertCSS(tintCss(wanted)), tint: wanted }
      } catch {
        // The page went away meanwhile; its next document gets the tint on dom-ready.
      }
    }
    if (previous !== null) await contents.removeInsertedCSS(previous.key).catch(() => {})
  }

  private stateOf(entry: Entry): WebState {
    const contents = entry.view.webContents
    const url = contents.getURL()
    const title = contents.getTitle()
    return {
      paneId: entry.paneId,
      url: url === 'about:blank' ? '' : url,
      title: title === url ? '' : title,
      loading: contents.isLoading(),
      canGoBack: contents.navigationHistory.canGoBack(),
      canGoForward: contents.navigationHistory.canGoForward(),
      error: entry.error,
    }
  }

  private sendState(entry: Entry): void {
    if (entry.view.webContents.isDestroyed() || this.entries.get(entry.paneId) !== entry) return
    send(entry.owner, 'state', this.stateOf(entry))
  }
}

function send(owner: WebContents, kind: 'state' | 'shortcut' | 'focused', payload: unknown): void {
  if (!owner.isDestroyed()) owner.send(CH.web[kind], payload)
}

/**
 * A sign-in popup: a helper window (never "the elecdex window"), which may go to
 * any http(s) page of the sign-in and opens nothing further itself.
 */
function watchPopup(popup: BrowserWindow): void {
  markHelperWindow(popup)
  popup.webContents.setWindowOpenHandler(({ url }) => {
    void openExternalIfSafe(url)
    return { action: 'deny' }
  })
  popup.webContents.on('will-navigate', (event) => {
    if (httpUrl(event.url) === null) event.preventDefault()
  })
}

function contextMenu(entry: Entry, params: ContextMenuParams): MenuItemConstructorOptions[] {
  const contents = entry.view.webContents
  const history = contents.navigationHistory
  const items: MenuItemConstructorOptions[] = [
    { label: 'Back', enabled: history.canGoBack(), click: () => history.goBack() },
    { label: 'Forward', enabled: history.canGoForward(), click: () => history.goForward() },
    { label: 'Reload', click: () => contents.reload() },
    { type: 'separator' },
  ]
  if (params.isEditable) {
    items.push({ role: 'cut', enabled: params.editFlags.canCut }, { role: 'paste' })
  }
  items.push({ role: 'copy', enabled: params.editFlags.canCopy }, { role: 'selectAll' })
  if (params.linkURL !== '') {
    items.push(
      { type: 'separator' },
      { label: 'Copy Link Address', click: () => clipboard.writeText(params.linkURL) },
      { label: 'Open Link in Browser', click: () => void openExternalIfSafe(params.linkURL) },
    )
  }
  return items
}
