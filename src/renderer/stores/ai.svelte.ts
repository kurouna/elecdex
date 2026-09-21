import type { AiKeyStorage, AiProviderStatus, ChatSummary } from '@shared/ai'

/**
 * What every chat pane and the settings' AI section share: the list of
 * conversations, and whether a key is held for each provider (never the key).
 * The providers themselves are settings, read from the appearance store.
 *
 * Reference-counted like the notes: a window with neither open listens for nothing.
 */
class AiStore {
  chats = $state<ChatSummary[]>([])
  keys = $state<Record<string, AiKeyStorage>>({})

  private users = 0
  private stop: (() => void) | null = null

  /** Called while a chat pane or the AI settings are mounted; returns the release. */
  use(): () => void {
    this.users += 1
    if (this.users === 1) this.start()
    return () => {
      this.users -= 1
      if (this.users === 0) {
        this.stop?.()
        this.stop = null
      }
    }
  }

  private start(): void {
    const api = window.elecdex.ai
    const status = (list: AiProviderStatus[]): void => {
      this.keys = Object.fromEntries(list.map((entry) => [entry.id, entry.key]))
    }
    const offChats = api.onChats((list) => {
      this.chats = list
    })
    const offProviders = api.onProviders(status)
    this.stop = () => {
      offChats()
      offProviders()
    }
    void api.providers().then(status)
    void api.chats().then((list) => {
      this.chats = list
    })
  }
}

export const ai = new AiStore()
