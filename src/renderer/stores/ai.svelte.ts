import type { AiKeyStorage, AiProviderStatus, ChatSummary } from '@shared/ai'
import { refCounted } from '../lib/ref-counted.ts'

/**
 * What every chat pane and the settings' AI section share: the list of
 * conversations, and whether a key is held for each provider (never the key).
 * The providers themselves are settings, read from the appearance store.
 *
 * Reference-counted like the notes: a window with neither open listens for nothing.
 */
class AiStore {
  // Replaced whole with each change from main, never changed in place: no deep proxy.
  chats = $state.raw<ChatSummary[]>([])
  keys = $state.raw<Record<string, AiKeyStorage>>({})

  /** Called while a chat pane or the AI settings are mounted; returns the release. */
  readonly use = refCounted(() => this.start())

  /** Follows main's file and answers the first reading; returns how to stop. */
  private start(): () => void {
    const api = window.elecdex.ai
    const status = (list: AiProviderStatus[]): void => {
      this.keys = Object.fromEntries(list.map((entry) => [entry.id, entry.key]))
    }
    const offChats = api.onChats((list) => {
      this.chats = list
    })
    const offProviders = api.onProviders(status)
    const stop = () => {
      offChats()
      offProviders()
    }
    void api.providers().then(status)
    void api.chats().then((list) => {
      this.chats = list
    })
    return stop
  }
}

export const ai = new AiStore()
