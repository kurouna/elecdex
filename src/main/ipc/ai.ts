import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  AI_PROVIDER_ID,
  type AiKeyStorage,
  type AiModelsResult,
  type AiProviderKind,
  type AiProviderStatus,
  CHAT_ID,
  type ChatEvent,
  type ChatSendResult,
  type ChatSummary,
  chatMarkdown,
  chatRequest,
} from '@shared/ai'
import { CH } from '@shared/channels'
import { app, dialog, ipcMain, net, safeStorage, type WebContents } from 'electron'
import type { FetchLike, ProviderAdapter } from '../ai/adapter.js'
import { emptyKeyFile, type KeyCodec, KeyFileSchema, KeyVault, stubCodec } from '../ai/keys.js'
import { AiChatService } from '../ai/service.js'
import { ChatStore } from '../ai/store.js'
import { appWindows } from '../app-windows.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { cacheFile } from '../store/cache-file.js'
import type { SettingsHandle } from './settings.js'

/**
 * The AI chat pane's IPC (shared/ai.ts, docs/architecture.md section 5.7).
 *
 * Nothing here runs until a chat pane or the settings ask: the conversations
 * folder is read on the first question about it, a provider's client library is
 * loaded on the first request to a provider of its kind, and the system's
 * encryption is touched only when a key is stored or used.
 *
 * Providers are the user's own addresses, so tests list a local server and need
 * no switch to stay offline; ELECDEX_AI_KEYS_STUB keeps them out of the Keychain.
 */

/** An answer nobody is following is stopped after this long: a moved pane is back well within it. */
const ORPHAN_GRACE_MS = 3000
const MODELS_TIMEOUT_MS = 20_000

/** Keys encrypted by the system, where it can do better than a fixed password. */
const systemCodec: KeyCodec = {
  available: () =>
    safeStorage.isEncryptionAvailable() &&
    (process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text'),
  encrypt: (plain) => safeStorage.encryptString(plain),
  decrypt: (data) => safeStorage.decryptString(data),
}

/** Providers are asked with no cookies and no cache between the model and the pane. */
const providerFetch: FetchLike = (url, init) =>
  net.fetch(url, { ...init, credentials: 'omit', cache: 'no-store' })

export function registerAiIpc(settings: SettingsHandle): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const tracked = new WeakSet<WebContents>()
  const orphans = new Map<string, NodeJS.Timeout>()

  const keyFile = cacheFile(
    path.join(app.getPath('userData'), 'ai-keys.json'),
    KeyFileSchema,
    emptyKeyFile(),
  )
  const vault = new KeyVault({
    codec: process.env.ELECDEX_AI_KEYS_STUB === '1' ? stubCodec : systemCodec,
    load: keyFile.load,
    save: keyFile.save,
  })

  const broadcast = (channel: string, payload: unknown): void => {
    for (const win of appWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(channel, payload)
    }
  }

  const adapters = new Map<AiProviderKind, Promise<ProviderAdapter>>()
  const adapterFor = (kind: AiProviderKind): Promise<ProviderAdapter> => {
    let adapter = adapters.get(kind)
    if (adapter === undefined) {
      adapter =
        kind === 'anthropic'
          ? import('../ai/anthropic.js').then((m) => m.anthropicAdapter(providerFetch))
          : import('../ai/openai.js').then((m) => m.openaiAdapter(providerFetch))
      adapters.set(kind, adapter)
    }
    return adapter
  }

  let service: AiChatService | null = null
  const chats = (): AiChatService => {
    service ??= new AiChatService({
      store: new ChatStore(path.join(app.getPath('userData'), 'chats')),
      providers: () => settings.current().ai.providers,
      systemPrompt: () => settings.current().ai.systemPrompt,
      keyFor: (id) => vault.get(id),
      adapter: adapterFor,
      now: () => Date.now(),
      newId: () => crypto.randomUUID(),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
      publish: (event: ChatEvent) => {
        for (const sender of registry.subscribers(event.chatId)) {
          if (!sender.isDestroyed()) sender.send(CH.ai.event, event)
        }
      },
      listChanged: (list: ChatSummary[]) => broadcast(CH.ai.chatsChanged, list),
    })
    return service
  }

  const statuses = (): AiProviderStatus[] =>
    settings.current().ai.providers.map((p) => ({ id: p.id, key: vault.storage(p.id) }))

  // A provider added or removed, in the dialog or by hand, changes the answer too.
  let listed = settings
    .current()
    .ai.providers.map((p) => p.id)
    .join(',')
  settings.onChange((next) => {
    const ids = next.ai.providers.map((p) => p.id).join(',')
    if (ids === listed) return
    listed = ids
    broadcast(CH.ai.providersChanged, statuses())
  })

  /** A conversation nobody shows any more stops being answered - unless a pane takes it up again in time. */
  const orphaned = (chatId: string): void => {
    if (service === null || !service.active().includes(chatId)) return
    clearTimeout(orphans.get(chatId))
    orphans.set(
      chatId,
      setTimeout(() => {
        orphans.delete(chatId)
        if (!registry.activeSources().includes(chatId)) service?.stop(chatId)
      }, ORPHAN_GRACE_MS),
    )
  }

  const track = (sender: WebContents): void => {
    if (tracked.has(sender)) return
    tracked.add(sender)
    const drop = (): void => {
      const before = registry.activeSources()
      if (!registry.dropSubscriber(sender)) return
      const after = new Set(registry.activeSources())
      for (const chatId of before) if (!after.has(chatId)) orphaned(chatId)
    }
    sender.once('destroyed', drop)
    sender.on('did-start-navigation', (details) => {
      if (details.isMainFrame && !details.isSameDocument) drop()
    })
  }

  const asChat = (raw: unknown): string | null =>
    typeof raw === 'string' && CHAT_ID.test(raw) ? raw : null
  const asProvider = (raw: unknown): string | null =>
    typeof raw === 'string' && AI_PROVIDER_ID.test(raw) ? raw : null

  ipcMain.handle(CH.ai.providers, (): AiProviderStatus[] => statuses())

  ipcMain.handle(CH.ai.setKey, (_event, rawId: unknown, rawKey: unknown): AiKeyStorage => {
    const id = asProvider(rawId)
    if (id === null || typeof rawKey !== 'string') return null
    // Only for a provider that is listed: a key with no address would be a key for anywhere.
    if (!settings.current().ai.providers.some((p) => p.id === id)) return null
    const storage = vault.set(id, rawKey)
    broadcast(CH.ai.providersChanged, statuses())
    return storage
  })

  ipcMain.handle(CH.ai.removeKey, (_event, rawId: unknown): void => {
    const id = asProvider(rawId)
    if (id === null) return
    vault.remove(id)
    broadcast(CH.ai.providersChanged, statuses())
  })

  ipcMain.handle(CH.ai.models, async (_event, rawId: unknown): Promise<AiModelsResult> => {
    const id = asProvider(rawId)
    if (id === null) return { models: [], error: 'no such provider' }
    return chats().models(id, AbortSignal.timeout(MODELS_TIMEOUT_MS))
  })

  ipcMain.handle(CH.ai.chats, (): ChatSummary[] => chats().list())
  ipcMain.handle(CH.ai.create, (): string | null => chats().create())
  ipcMain.handle(CH.ai.remove, (_event, raw: unknown): boolean => {
    const chatId = asChat(raw)
    return chatId !== null && chats().remove(chatId)
  })

  ipcMain.handle(CH.ai.export, async (_event, raw: unknown): Promise<string | null> => {
    const chatId = asChat(raw)
    const chat = chatId === null ? null : chats().get(chatId)
    if (chat === null) return null
    // The renderer has no filesystem; the path comes from the user's own dialog.
    const result = await dialog.showSaveDialog({
      defaultPath: `${(chat.title === '' ? 'chat' : chat.title).replace(/[\\/:*?"<>|]/g, '_').slice(0, 60)}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    })
    if (result.canceled || result.filePath === '') return null
    await writeFile(result.filePath, chatMarkdown(chat), 'utf8')
    return result.filePath
  })

  ipcMain.on(CH.ai.subscribe, (event, raw: unknown) => {
    const chatId = asChat(raw)
    if (chatId === null) return
    track(event.sender)
    registry.subscribe(event.sender, chatId)
    clearTimeout(orphans.get(chatId))
    orphans.delete(chatId)
    if (!event.sender.isDestroyed()) event.sender.send(CH.ai.event, chats().snapshot(chatId))
  })

  ipcMain.on(CH.ai.unsubscribe, (event, raw: unknown) => {
    const chatId = asChat(raw)
    if (chatId !== null && registry.unsubscribe(event.sender, chatId)) orphaned(chatId)
  })

  ipcMain.handle(CH.ai.snapshot, (_event, raw: unknown): ChatEvent | null => {
    const chatId = asChat(raw)
    return chatId === null ? null : chats().snapshot(chatId)
  })

  ipcMain.handle(CH.ai.send, (_event, rawChat: unknown, rawRequest: unknown): ChatSendResult => {
    const chatId = asChat(rawChat)
    const request = chatRequest(rawRequest)
    if (chatId === null || request === null) return { ok: false, error: 'not a valid request' }
    return chats().send(chatId, request)
  })

  ipcMain.on(CH.ai.stop, (_event, raw: unknown) => {
    const chatId = asChat(raw)
    if (chatId !== null) service?.stop(chatId)
  })

  ipcMain.handle(CH.ai.active, (): string[] => service?.active() ?? [])

  return {
    dispose: () => {
      for (const timer of orphans.values()) clearTimeout(timer)
      service?.dispose()
      for (const channel of [CH.ai.subscribe, CH.ai.unsubscribe, CH.ai.stop]) {
        ipcMain.removeAllListeners(channel)
      }
      for (const channel of [
        CH.ai.providers,
        CH.ai.setKey,
        CH.ai.removeKey,
        CH.ai.models,
        CH.ai.chats,
        CH.ai.create,
        CH.ai.remove,
        CH.ai.export,
        CH.ai.snapshot,
        CH.ai.send,
        CH.ai.active,
      ]) {
        ipcMain.removeHandler(channel)
      }
    },
  }
}
