import type { AgentBoard } from '@shared/agents'
import { parseAgentDiffRequest } from '@shared/agents'
import { CH } from '@shared/channels'
import { ClaudeCodeSource } from '../agents/claude/source.js'
import { AgentHub } from '../agents/hub.js'
import type { SettingsHandle } from './settings.js'
import { PageSubscribers, registerTable } from './table.js'

/**
 * Agents IPC: the AI AGENT pane subscribes to one board; the hub (agents/hub.ts)
 * gathers it from the sources the settings turn on. While no page is
 * subscribed no source watches anything, and a page's subscription goes with
 * its reload or its end.
 */
export function registerAgentsIpc(settings: SettingsHandle): { dispose: () => void } {
  const subscribers = new PageSubscribers((anyone) => hub.sync(anyone))

  const hub = new AgentHub({
    sources: { 'claude-code': new ClaudeCodeSource() },
    enabled: () => settings.current().agents.sources,
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish: (board: AgentBoard) => subscribers.send(CH.agents.update, board),
  })

  const unregister = registerTable({
    on: {
      [CH.agents.subscribe]: (event) => {
        // The hub starts its sources first, so the board sent at once already lists them.
        subscribers.add(event.sender)
        event.sender.send(CH.agents.update, hub.board())
      },
      [CH.agents.unsubscribe]: (event) => subscribers.drop(event.sender),
    },
    handle: {
      [CH.agents.diff]: async (_event, raw) => {
        const request = parseAgentDiffRequest(raw)
        return request === null ? null : hub.diff(request)
      },
      // Whether any source still watches, not merely whether a page is subscribed.
      [CH.agents.watching]: () => (hub.active ? ['records'] : []),
    },
  })

  // Turning a source on or off in settings takes effect for an open pane at once.
  settings.onChange(() => hub.sync(subscribers.size > 0))

  return {
    dispose: () => {
      hub.sync(false)
      unregister()
    },
  }
}
