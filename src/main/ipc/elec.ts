import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { AiProviderKind } from '@shared/ai'
import { CH } from '@shared/channels'
import {
  type ElecEvent,
  type ElecSubmitResult,
  elecMotion,
  SESSION_ID,
  type SessionSummary,
  sessionMarkdown,
} from '@shared/elec'
import { exportFileName } from '@shared/validate'
import { app, dialog, type WebContents } from 'electron'
import type { ProviderAdapter } from '../ai/adapter.js'
import { ElecService } from '../ai/elec.js'
import { SessionStore } from '../ai/store.js'
import { appWindows } from '../app-windows.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { whenPageGoes } from './page-gone.js'
import type { SettingsHandle } from './settings.js'
import { registerTable } from './table.js'

/**
 * The ELEC system pane's IPC (shared/elec.ts, docs/architecture.md section 5.8).
 *
 * It asks the providers of the AI settings through the chat pane's adapters and
 * keys (ipc/ai.ts hands them over), under the same rules: nothing runs until a
 * pane asks, and a deliberation nobody follows any more is stopped.
 */

/** A deliberation nobody is following is stopped after this long: a moved pane is back well within it. */
const ORPHAN_GRACE_MS = 3000

export interface ElecLinks {
  keyFor(providerId: string): string | null
  adapter(kind: AiProviderKind): Promise<ProviderAdapter>
}

export function registerElecIpc(
  settings: SettingsHandle,
  links: ElecLinks,
): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const orphans = new Map<string, NodeJS.Timeout>()

  const broadcast = (channel: string, payload: unknown): void => {
    for (const win of appWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(channel, payload)
    }
  }

  let service: ElecService | null = null
  const council = (): ElecService => {
    service ??= new ElecService({
      store: new SessionStore(path.join(app.getPath('userData'), 'elec')),
      providers: () => settings.current().ai.providers,
      settings: () => settings.current().elec,
      keyFor: links.keyFor,
      adapter: links.adapter,
      now: () => Date.now(),
      newId: () => crypto.randomUUID(),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
      publish: (event: ElecEvent) => {
        for (const sender of registry.subscribers(event.sessionId)) {
          if (!sender.isDestroyed()) sender.send(CH.elec.event, event)
        }
      },
      listChanged: (list: SessionSummary[]) => broadcast(CH.elec.sessionsChanged, list),
    })
    return service
  }

  /** A deliberation nobody shows any more stops being voted - unless a pane takes it up again in time. */
  const orphaned = (sessionId: string): void => {
    if (service === null || !service.active().includes(sessionId)) return
    clearTimeout(orphans.get(sessionId))
    orphans.set(
      sessionId,
      setTimeout(() => {
        orphans.delete(sessionId)
        if (!registry.activeSources().includes(sessionId)) service?.stop(sessionId)
      }, ORPHAN_GRACE_MS),
    )
  }

  const track = (sender: WebContents): void => {
    const drop = (): void => {
      const before = registry.activeSources()
      if (!registry.dropSubscriber(sender)) return
      const after = new Set(registry.activeSources())
      for (const sessionId of before) if (!after.has(sessionId)) orphaned(sessionId)
    }
    whenPageGoes(sender, registry, drop)
  }

  const asSession = (raw: unknown): string | null =>
    typeof raw === 'string' && SESSION_ID.test(raw) ? raw : null

  const unregister = registerTable({
    handle: {
      [CH.elec.sessions]: (): SessionSummary[] => council().list(),
      [CH.elec.submit]: (_event, raw): ElecSubmitResult => {
        const motion = elecMotion(raw)
        if (motion === null) return { ok: false, error: 'there is no motion to put' }
        const result = council().submit(motion)
        // A pane submits first and follows a moment later. One that never does - closed in
        // between - must not leave a deliberation running that nobody will read.
        if (result.ok && !registry.activeSources().includes(result.sessionId)) {
          orphaned(result.sessionId)
        }
        return result
      },
      [CH.elec.remove]: (_event, raw): boolean => {
        const sessionId = asSession(raw)
        return sessionId !== null && council().remove(sessionId)
      },
      [CH.elec.export]: async (_event, raw): Promise<string | null> => {
        const sessionId = asSession(raw)
        const session = sessionId === null ? null : council().get(sessionId)
        if (session === null) return null
        // The renderer has no filesystem; the path comes from the user's own dialog.
        const result = await dialog.showSaveDialog({
          defaultPath: exportFileName(session.title, 'motion'),
          filters: [{ name: 'Markdown', extensions: ['md'] }],
        })
        if (result.canceled || result.filePath === '') return null
        await writeFile(result.filePath, sessionMarkdown(session), 'utf8')
        return result.filePath
      },
      [CH.elec.snapshot]: (_event, raw): ElecEvent | null => {
        const sessionId = asSession(raw)
        return sessionId === null ? null : council().snapshot(sessionId)
      },
      [CH.elec.active]: (): string[] => service?.active() ?? [],
    },
    on: {
      [CH.elec.subscribe]: (event, raw) => {
        const sessionId = asSession(raw)
        if (sessionId === null) return
        track(event.sender)
        registry.subscribe(event.sender, sessionId)
        clearTimeout(orphans.get(sessionId))
        orphans.delete(sessionId)
        if (!event.sender.isDestroyed())
          event.sender.send(CH.elec.event, council().snapshot(sessionId))
      },
      [CH.elec.unsubscribe]: (event, raw) => {
        const sessionId = asSession(raw)
        if (sessionId !== null && registry.unsubscribe(event.sender, sessionId)) orphaned(sessionId)
      },
      [CH.elec.stop]: (_event, raw) => {
        const sessionId = asSession(raw)
        if (sessionId !== null) service?.stop(sessionId)
      },
    },
  })

  return {
    dispose: () => {
      for (const timer of orphans.values()) clearTimeout(timer)
      service?.dispose()
      unregister()
    },
  }
}
