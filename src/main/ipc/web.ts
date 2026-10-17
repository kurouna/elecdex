import { CH } from '@shared/channels'
import { keymap } from '@shared/keybindings'
import type { Settings } from '@shared/settings'
import { LeftToPageSchema } from '@shared/shortcut-applies'
import {
  presetOfWidget,
  WEB_PRESETS,
  WEB_URL_MAX,
  WebAppearanceSchema,
  WebClaimSchema,
  WebCommandSchema,
  WebPaneIdSchema,
  WebRectSchema,
  type WebState,
  withHomes,
} from '@shared/web'
import type { WebContents } from 'electron'
import { z } from 'zod'
import { clearWebData } from '../web/partition.js'
import { WebViews } from '../web/views.js'
import { whenPageGoes } from './page-gone.js'
import type { SettingsHandle } from './settings.js'
import { registerTable } from './table.js'

/**
 * The web panes' IPC (docs/architecture.md section 5.4). Every input is checked
 * here; a pane id only reaches a view the asking page owns (WebViews).
 */

const UrlSchema = z.string().max(WEB_URL_MAX).nullable()
const NOTHING: ReadonlySet<string> = new Set()

export function registerWebIpc(settings: SettingsHandle): { dispose: () => void } {
  // Tests point the presets at a local stub (tests/e2e/support.ts).
  const presets = withHomes(WEB_PRESETS, process.env.ELECDEX_WEB_HOMES)
  let bindings: { from: Settings['keybindings']; map: ReadonlyMap<string, string> } | null = null
  // Per page, as the page last said; a reloaded page starts again from nothing, as its own
  // record of what it sent does.
  const leftToPage = new WeakMap<WebContents, ReadonlySet<string>>()
  const leftToPageKey = {}
  const views = new WebViews({
    keymap: () => {
      const current = settings.current().keybindings
      if (bindings?.from !== current) {
        bindings = { from: current, map: keymap(current, process.platform) }
      }
      return bindings.map
    },
    leftToPage: (page) => leftToPage.get(page) ?? NOTHING,
  })

  const unregister = registerTable({
    handle: {
      [CH.web.open]: (
        event,
        rawPane: unknown,
        rawClaim: unknown,
        rawWidget: unknown,
        rawUrl: unknown,
      ): WebState | null => {
        const paneId = WebPaneIdSchema.safeParse(rawPane)
        const claim = WebClaimSchema.safeParse(rawClaim)
        const url = UrlSchema.safeParse(rawUrl)
        const preset = typeof rawWidget === 'string' ? presetOfWidget(rawWidget, presets) : null
        if (!paneId.success || !claim.success || !url.success || preset === null) return null
        return views.open(event.sender, paneId.data, claim.data, preset, url.data)
      },
      [CH.web.hide]: (event, rawPane: unknown, rawClaim: unknown, snapshot: unknown) => {
        const paneId = WebPaneIdSchema.safeParse(rawPane)
        const claim = WebClaimSchema.safeParse(rawClaim)
        if (!paneId.success || !claim.success) return null
        return views.hide(event.sender, paneId.data, claim.data, snapshot === true)
      },
      [CH.web.list]: (event) => views.list(event.sender),
      [CH.web.clearData]: () => clearWebData(),
    },
    on: {
      [CH.web.show]: (event, rawPane: unknown, rawClaim: unknown, rawRect: unknown) => {
        const paneId = WebPaneIdSchema.safeParse(rawPane)
        const claim = WebClaimSchema.safeParse(rawClaim)
        const rect = WebRectSchema.safeParse(rawRect)
        if (paneId.success && claim.success && rect.success) {
          views.show(event.sender, paneId.data, claim.data, rect.data)
        }
      },
      [CH.web.command]: (event, rawPane: unknown, rawCommand: unknown) => {
        const paneId = WebPaneIdSchema.safeParse(rawPane)
        const command = WebCommandSchema.safeParse(rawCommand)
        if (paneId.success && command.success)
          views.command(event.sender, paneId.data, command.data)
      },
      [CH.web.close]: (event, rawPane: unknown, rawClaim: unknown) => {
        const paneId = WebPaneIdSchema.safeParse(rawPane)
        const claim = WebClaimSchema.nullable().safeParse(rawClaim)
        if (paneId.success && claim.success) views.close(event.sender, paneId.data, claim.data)
      },
      [CH.web.appearance]: (_event, raw: unknown) => {
        const appearance = WebAppearanceSchema.safeParse(raw)
        if (appearance.success) views.setAppearance(appearance.data)
      },
      [CH.web.focus]: (event, rawPane: unknown) => {
        const paneId = WebPaneIdSchema.safeParse(rawPane)
        if (paneId.success) views.focus(event.sender, paneId.data)
      },
      // Only ever the asking page itself.
      [CH.web.focusWorkspace]: (event) => event.sender.focus(),
      [CH.web.leaveToPage]: (event, raw: unknown) => {
        const actions = LeftToPageSchema.safeParse(raw)
        if (!actions.success) return
        const page = event.sender
        whenPageGoes(page, leftToPageKey, () => leftToPage.delete(page))
        leftToPage.set(page, actions.data)
      },
    },
  })

  return {
    dispose: () => {
      unregister()
      views.dispose()
    },
  }
}
