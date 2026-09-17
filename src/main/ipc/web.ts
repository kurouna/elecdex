import { CH } from '@shared/channels'
import { keymap } from '@shared/keybindings'
import type { Settings } from '@shared/settings'
import {
  presetOfWidget,
  WEB_PRESETS,
  WebAppearanceSchema,
  WebClaimSchema,
  WebCommandSchema,
  WebPaneIdSchema,
  WebRectSchema,
  type WebState,
  withHomes,
} from '@shared/web'
import { ipcMain } from 'electron'
import { z } from 'zod'
import { clearWebData } from '../web/partition.js'
import { WebViews } from '../web/views.js'
import type { SettingsHandle } from './settings.js'

/**
 * The web panes' IPC (docs/architecture.md section 5.4). Every input is checked
 * here; a pane id only reaches a view the asking page owns (WebViews).
 */

const UrlSchema = z.string().max(8192).nullable()

export function registerWebIpc(settings: SettingsHandle): { dispose: () => void } {
  // Tests point the presets at a local stub (tests/e2e/support.ts).
  const presets = withHomes(WEB_PRESETS, process.env.ELECDEX_WEB_HOMES)
  let bindings: { from: Settings['keybindings']; map: ReadonlyMap<string, string> } | null = null
  const views = new WebViews({
    keymap: () => {
      const current = settings.current().keybindings
      if (bindings?.from !== current) {
        bindings = { from: current, map: keymap(current, process.platform) }
      }
      return bindings.map
    },
  })

  ipcMain.handle(
    CH.web.open,
    (
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
  )

  ipcMain.on(CH.web.show, (event, rawPane: unknown, rawClaim: unknown, rawRect: unknown) => {
    const paneId = WebPaneIdSchema.safeParse(rawPane)
    const claim = WebClaimSchema.safeParse(rawClaim)
    const rect = WebRectSchema.safeParse(rawRect)
    if (paneId.success && claim.success && rect.success) {
      views.show(event.sender, paneId.data, claim.data, rect.data)
    }
  })

  ipcMain.handle(CH.web.hide, (event, rawPane: unknown, rawClaim: unknown, snapshot: unknown) => {
    const paneId = WebPaneIdSchema.safeParse(rawPane)
    const claim = WebClaimSchema.safeParse(rawClaim)
    if (!paneId.success || !claim.success) return null
    return views.hide(event.sender, paneId.data, claim.data, snapshot === true)
  })

  ipcMain.on(CH.web.command, (event, rawPane: unknown, rawCommand: unknown) => {
    const paneId = WebPaneIdSchema.safeParse(rawPane)
    const command = WebCommandSchema.safeParse(rawCommand)
    if (paneId.success && command.success) views.command(event.sender, paneId.data, command.data)
  })

  ipcMain.on(CH.web.close, (event, rawPane: unknown, rawClaim: unknown) => {
    const paneId = WebPaneIdSchema.safeParse(rawPane)
    const claim = WebClaimSchema.nullable().safeParse(rawClaim)
    if (paneId.success && claim.success) views.close(event.sender, paneId.data, claim.data)
  })

  ipcMain.handle(CH.web.list, (event) => views.list(event.sender))

  ipcMain.on(CH.web.appearance, (_event, raw: unknown) => {
    const appearance = WebAppearanceSchema.safeParse(raw)
    if (appearance.success) views.setAppearance(appearance.data)
  })

  ipcMain.on(CH.web.focus, (event, rawPane: unknown) => {
    const paneId = WebPaneIdSchema.safeParse(rawPane)
    if (paneId.success) views.focus(event.sender, paneId.data)
  })

  // Only ever the asking page itself.
  ipcMain.on(CH.web.focusWorkspace, (event) => event.sender.focus())

  ipcMain.handle(CH.web.clearData, () => clearWebData())

  return {
    dispose: () => {
      for (const channel of [CH.web.open, CH.web.hide, CH.web.list, CH.web.clearData]) {
        ipcMain.removeHandler(channel)
      }
      for (const channel of [
        CH.web.show,
        CH.web.command,
        CH.web.close,
        CH.web.appearance,
        CH.web.focus,
        CH.web.focusWorkspace,
      ]) {
        ipcMain.removeAllListeners(channel)
      }
      views.dispose()
    },
  }
}
