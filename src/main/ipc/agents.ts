import type { AgentBoard } from '@shared/agents'
import { parseAgentDiffRequest } from '@shared/agents'
import { CH } from '@shared/channels'
import { ipcMain, type WebContents } from 'electron'
import { ClaudeCodeSource } from '../agents/claude/source.js'
import { AgentHub } from '../agents/hub.js'
import { whenPageGoes } from './page-gone.js'
import type { SettingsHandle } from './settings.js'

/**
 * Agents IPC: the AGENT pane subscribes to one board; the hub (agents/hub.ts)
 * gathers it from the sources the settings turn on. While no page is
 * subscribed no source watches anything, and a page's subscription goes with
 * its reload or its end.
 */
export function registerAgentsIpc(settings: SettingsHandle): { dispose: () => void } {
  const subscribers = new Set<WebContents>()

  const hub = new AgentHub({
    sources: { 'claude-code': new ClaudeCodeSource() },
    enabled: () => settings.current().agents.sources,
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish: (board: AgentBoard) => {
      for (const sender of subscribers)
        if (!sender.isDestroyed()) sender.send(CH.agents.update, board)
    },
  })

  const drop = (sender: WebContents): void => {
    if (subscribers.delete(sender)) hub.sync(subscribers.size > 0)
  }

  const track = (sender: WebContents): void => {
    whenPageGoes(sender, subscribers, () => drop(sender))
  }

  ipcMain.on(CH.agents.subscribe, (event) => {
    track(event.sender)
    const first = subscribers.size === 0
    subscribers.add(event.sender)
    if (first) hub.sync(true)
    event.sender.send(CH.agents.update, hub.board())
  })

  ipcMain.on(CH.agents.unsubscribe, (event) => drop(event.sender))

  ipcMain.handle(CH.agents.diff, async (_event, raw: unknown) => {
    const request = parseAgentDiffRequest(raw)
    return request === null ? null : hub.diff(request)
  })

  // Whether any source still watches, not merely whether a page is subscribed.
  ipcMain.handle(CH.agents.watching, () => hub.active)

  // Turning a source on or off in settings takes effect for an open pane at once.
  settings.onChange(() => hub.sync(subscribers.size > 0))

  return {
    dispose: () => {
      hub.sync(false)
      ipcMain.removeAllListeners(CH.agents.subscribe)
      ipcMain.removeAllListeners(CH.agents.unsubscribe)
      ipcMain.removeHandler(CH.agents.diff)
      ipcMain.removeHandler(CH.agents.watching)
    },
  }
}
