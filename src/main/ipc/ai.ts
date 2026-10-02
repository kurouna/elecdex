import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  AI_PROVIDER_ID,
  type AiKeyStorage,
  type AiModelsResult,
  type AiProviderKind,
  type AiProviderStatus,
  ATTACH_LIMITS,
  CHAT_ID,
  type ChatEvent,
  type ChatSendResult,
  type ChatSummary,
  chatMarkdown,
  chatRequest,
  DRAFT_ID,
  fileSize,
} from '@shared/ai'
import {
  type AttachmentView,
  type AttachResult,
  type AttachUpload,
  refuse,
} from '@shared/ai-attach'
import { CH } from '@shared/channels'
import { app, dialog, net, type WebContents } from 'electron'
import type { FetchLike, ProviderAdapter } from '../ai/adapter.js'
import { ChatFiles, notAFile } from '../ai/files.js'
import { emptyKeyFile, KeyFileSchema, KeyVault } from '../ai/keys.js'
import { AiChatService } from '../ai/service.js'
import { ChatStore } from '../ai/store.js'
import { appWindows } from '../app-windows.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { secretCodec } from '../secrets/system.js'
import { cacheFile } from '../store/cache-file.js'
import { registerElecIpc } from './elec.js'
import { whenPageGoes } from './page-gone.js'
import type { SettingsHandle } from './settings.js'
import { registerTable } from './table.js'

/**
 * The AI chat pane's IPC (shared/ai.ts, docs/architecture.md section 5.7), and
 * through it the ELEC system's (ipc/elec.ts), which asks the same providers.
 *
 * Nothing here runs until a chat pane or the settings ask: the conversations
 * folder is read on the first question about it, a provider's client library is
 * loaded on the first request to a provider of its kind, and the system's
 * encryption is touched only when a key is stored or used.
 *
 * Providers are the user's own addresses, so tests list a local server and need
 * no switch to stay offline; ELECDEX_AI_KEYS_STUB keeps them out of the Keychain.
 */

/** The largest file of any kind: a PDF. Anything larger is refused before it is looked at. */
const ATTACH_MAX_BYTES = Math.max(ATTACH_LIMITS.pdf, ATTACH_LIMITS.image, ATTACH_LIMITS.text)

/** Bytes as IPC brings them: an ArrayBuffer, or a view of one. */
function asBytes(raw: unknown): ArrayBuffer | undefined {
  if (raw instanceof ArrayBuffer) return raw
  if (!(raw instanceof Uint8Array)) return undefined
  return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer
}

/** An image's size before the page made it small; main checks it again (`ChatFiles`). */
function asSize(raw: unknown): { width: number; height: number } | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const { width, height } = raw as Record<string, unknown>
  return typeof width === 'number' && typeof height === 'number' ? { width, height } : undefined
}

/** What the page handed over for one file, checked field by field. */
function asUpload(raw: unknown): AttachUpload | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const bytes = asBytes(r.bytes)
  if (typeof r.name !== 'string' || r.name.length > 1024 || bytes === undefined) return null
  const thumb = asBytes(r.thumb)
  const source = asSize(r.source)
  return {
    name: r.name,
    bytes,
    ...(thumb === undefined ? {} : { thumb }),
    ...(source === undefined ? {} : { source }),
  }
}

/** An answer nobody is following is stopped after this long: a moved pane is back well within it. */
const ORPHAN_GRACE_MS = 3000
const MODELS_TIMEOUT_MS = 20_000

/** Providers are asked with no cookies and no cache between the model and the pane. */
const providerFetch: FetchLike = (url, init) =>
  net.fetch(url, { ...init, credentials: 'omit', cache: 'no-store' })

export function registerAiIpc(settings: SettingsHandle): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const orphans = new Map<string, NodeJS.Timeout>()

  const keyFile = cacheFile(
    path.join(app.getPath('userData'), 'ai-keys.json'),
    KeyFileSchema,
    emptyKeyFile(),
  )
  const vault = new KeyVault({
    codec: secretCodec(),
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

  let files: ChatFiles | null = null
  const chatFiles = (): ChatFiles => {
    files ??= new ChatFiles(path.join(app.getPath('userData'), 'chats'), () => crypto.randomUUID())
    return files
  }

  let service: AiChatService | null = null
  const chats = (): AiChatService => {
    service ??= new AiChatService({
      store: new ChatStore(path.join(app.getPath('userData'), 'chats')),
      files: chatFiles(),
      providers: () => settings.current().ai.providers,
      systemPrompt: () => settings.current().ai.systemPrompt,
      compact: () => settings.current().ai.compact,
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
    const drop = (): void => {
      const before = registry.activeSources()
      if (!registry.dropSubscriber(sender)) return
      const after = new Set(registry.activeSources())
      for (const chatId of before) if (!after.has(chatId)) orphaned(chatId)
    }
    whenPageGoes(sender, registry, drop)
  }

  const asChat = (raw: unknown): string | null =>
    typeof raw === 'string' && CHAT_ID.test(raw) ? raw : null
  const asProvider = (raw: unknown): string | null =>
    typeof raw === 'string' && AI_PROVIDER_ID.test(raw) ? raw : null

  const asDraft = (raw: unknown): string | null =>
    typeof raw === 'string' && DRAFT_ID.test(raw) ? raw : null

  const unregister = registerTable({
    handle: {
      [CH.ai.providers]: (): AiProviderStatus[] => statuses(),
      [CH.ai.setKey]: (_event, rawId, rawKey): AiKeyStorage => {
        const id = asProvider(rawId)
        if (id === null || typeof rawKey !== 'string') return null
        // Only for a provider that is listed: a key with no address would be a key for anywhere.
        if (!settings.current().ai.providers.some((p) => p.id === id)) return null
        const storage = vault.set(id, rawKey)
        broadcast(CH.ai.providersChanged, statuses())
        return storage
      },
      [CH.ai.removeKey]: (_event, rawId): void => {
        const id = asProvider(rawId)
        if (id === null) return
        vault.remove(id)
        broadcast(CH.ai.providersChanged, statuses())
      },
      [CH.ai.models]: async (_event, rawId): Promise<AiModelsResult> => {
        const id = asProvider(rawId)
        if (id === null) return { models: [], error: 'no such provider' }
        return chats().models(id, AbortSignal.timeout(MODELS_TIMEOUT_MS))
      },
      [CH.ai.chats]: (): ChatSummary[] => chats().list(),
      [CH.ai.create]: (): string | null => chats().create(),
      [CH.ai.remove]: (_event, raw): boolean => {
        const chatId = asChat(raw)
        return chatId !== null && chats().remove(chatId)
      },
      [CH.ai.export]: async (_event, raw): Promise<string | null> => {
        const chatId = asChat(raw)
        const chat = chatId === null ? null : chats().get(chatId)
        if (chat === null) return null
        // The renderer has no filesystem; the path comes from the user's own dialog.
        const result = await dialog.showSaveDialog({
          defaultPath: `${(chat.title === '' ? 'chat' : chat.title).replace(/[/:*?"<>|]/g, '_').slice(0, 60)}.md`,
          filters: [{ name: 'Markdown', extensions: ['md'] }],
        })
        if (result.canceled || result.filePath === '') return null
        await writeFile(result.filePath, chatMarkdown(chat), 'utf8')
        return result.filePath
      },
      [CH.ai.snapshot]: (_event, raw): ChatEvent | null => {
        const chatId = asChat(raw)
        return chatId === null ? null : chats().snapshot(chatId)
      },
      [CH.ai.send]: (_event, rawChat, rawRequest): ChatSendResult => {
        const chatId = asChat(rawChat)
        const request = chatRequest(rawRequest)
        if (chatId === null || request === null) return { ok: false, error: 'not a valid request' }
        const result = chats().send(chatId, request)
        // A pane sends first and follows a moment later. One that never does - closed in
        // between - must not leave an answer running that nobody will read.
        if (result.ok && !registry.activeSources().includes(chatId)) orphaned(chatId)
        return result
      },
      [CH.ai.active]: (): string[] => service?.active() ?? [],
      // A file comes as bytes the page read from what the user picked, dropped or pasted; there is
      // no channel that takes a path. Its size is checked before anything else is done with it.
      [CH.ai.attach]: (_event, rawDraft, raw): AttachResult => {
        const draftId = asDraft(rawDraft)
        const upload = asUpload(raw)
        if (draftId === null || upload === null) return notAFile()
        if (upload.bytes.byteLength > ATTACH_MAX_BYTES) {
          return refuse('too large', `a file is attached up to ${fileSize(ATTACH_MAX_BYTES)}`)
        }
        return chatFiles().add(draftId, upload)
      },
      [CH.ai.pending]: (_event, raw): AttachmentView[] => {
        const draftId = asDraft(raw)
        return draftId === null ? [] : chatFiles().pending(draftId)
      },
      [CH.ai.detach]: (_event, rawDraft, rawId): AttachmentView[] => {
        const draftId = asDraft(rawDraft)
        if (draftId === null || typeof rawId !== 'string') return []
        return chatFiles().remove(draftId, rawId)
      },
      [CH.ai.discard]: (_event, raw): void => {
        const draftId = asDraft(raw)
        if (draftId !== null) chatFiles().forget(draftId)
      },
      [CH.ai.thumbs]: (_event, raw): Record<string, string> => {
        const chatId = asChat(raw)
        const chat = chatId === null ? null : chats().get(chatId)
        if (chatId === null || chat === null) return {}
        return chatFiles().thumbs(
          chatId,
          chat.messages.flatMap((m) => m.attachments ?? []),
        )
      },
    },
    on: {
      [CH.ai.subscribe]: (event, raw) => {
        const chatId = asChat(raw)
        if (chatId === null) return
        track(event.sender)
        registry.subscribe(event.sender, chatId)
        clearTimeout(orphans.get(chatId))
        orphans.delete(chatId)
        if (!event.sender.isDestroyed()) event.sender.send(CH.ai.event, chats().snapshot(chatId))
      },
      [CH.ai.unsubscribe]: (event, raw) => {
        const chatId = asChat(raw)
        if (chatId !== null && registry.unsubscribe(event.sender, chatId)) orphaned(chatId)
      },
      [CH.ai.stop]: (_event, raw) => {
        const chatId = asChat(raw)
        if (chatId !== null) service?.stop(chatId)
      },
    },
  })

  // The ELEC system asks the same providers, with the same keys and adapters.
  const elec = registerElecIpc(settings, { keyFor: (id) => vault.get(id), adapter: adapterFor })

  return {
    dispose: () => {
      elec.dispose()
      for (const timer of orphans.values()) clearTimeout(timer)
      service?.dispose()
      unregister()
    },
  }
}
