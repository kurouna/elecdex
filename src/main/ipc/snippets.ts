import path from 'node:path'
import { CH } from '@shared/channels'
import { isClipId } from '@shared/clipboard'
import {
  emptySnippets,
  isSnippetId,
  makeSnippetId,
  SNIPPET_LIMITS,
  type SnippetAdded,
  type SnippetDraft,
  type SnippetsFile,
  SnippetsFileSchema,
  type SnippetView,
} from '@shared/snippets'
import { app } from 'electron'
import { z } from 'zod'
import { appWindows } from '../app-windows.js'
import { SnippetShelf } from '../clipboard/snippets.js'
import type { ClipboardWatcher } from '../clipboard/watcher.js'
import { JsonStore } from '../store/json-store.js'
import { watchUserFile } from '../store/watch-user-file.js'
import { registerTable } from './table.js'

/**
 * The clipboard pane's snippets: snippets.json, main's, like notes. Nothing is
 * polled or fetched - a snippet is a file on disk - so every window is told of
 * every change, and a pane listens only while it is seen.
 *
 * A snippet is made from a history entry by its id (its whole text and
 * formatting never pass through the page), or from a text written by hand; it
 * is put on the clipboard through the watcher, so the history neither takes it
 * for a copy nor is fooled by a look that overlapped the write.
 */

const NameSchema = z.string().max(SNIPPET_LIMITS.name * 4)
const TextSchema = z.string().min(1).max(SNIPPET_LIMITS.text)
const ChangeSchema = z.object({ name: NameSchema.optional(), text: TextSchema.optional() }).strict()

export function openSnippetShelf(changed: () => void): {
  shelf: SnippetShelf
  close: () => void
} {
  const file = path.join(app.getPath('userData'), 'snippets.json')
  const store = new JsonStore<SnippetsFile>({
    file,
    schema: SnippetsFileSchema,
    makeDefault: emptySnippets,
    // The user's own texts: a file that will not parse is left where it is, and
    // copied aside before anything overwrites it.
    keepInvalid: true,
  })
  const shelf = new SnippetShelf({
    load: () => store.read(),
    save: (next) => store.write(next),
    now: () => Date.now(),
    makeId: () => makeSnippetId(),
    changed,
  })
  // A hand edit while the app runs takes effect; our own save comes back here too.
  const watcher = watchUserFile(file, () => {
    if (store.unchangedOnDisk()) return
    store.invalidate()
    shelf.reload(store.read())
  })
  return { shelf, close: () => watcher.close() }
}

export function registerSnippetsIpc(
  shelf: SnippetShelf,
  clipboard: ClipboardWatcher,
): { dispose: () => void } {
  const unregister = registerTable({
    handle: {
      [CH.snippets.list]: (): SnippetView[] => shelf.views(),

      [CH.snippets.fromClip]: (_event, id: unknown): SnippetAdded => {
        if (!isClipId(id)) return { error: 'missing' }
        const entry = clipboard.entry(id)
        if (entry === undefined) return { error: 'missing' }
        if (!entry.kept) return { error: 'not-kept' }
        return shelf.add({ text: entry.text, html: entry.html, rtf: entry.rtf })
      },

      [CH.snippets.create]: (_event, name: unknown, text: unknown): SnippetAdded => {
        const parsedName = NameSchema.safeParse(name)
        const parsedText = TextSchema.safeParse(text)
        if (!parsedName.success || !parsedText.success) return { error: 'invalid' }
        return shelf.add({ text: parsedText.data, html: null, rtf: null }, parsedName.data)
      },

      [CH.snippets.read]: (_event, id: unknown): SnippetDraft | null => {
        const snippet = isSnippetId(id) ? shelf.get(id) : undefined
        if (snippet === undefined) return null
        return {
          name: snippet.name,
          text: snippet.text,
          rich: snippet.html !== null || snippet.rtf !== null,
        }
      },

      [CH.snippets.update]: (_event, id: unknown, change: unknown): boolean => {
        const parsed = ChangeSchema.safeParse(change)
        if (!isSnippetId(id) || !parsed.success) return false
        const { name, text } = parsed.data
        return shelf.edit(id, {
          ...(name !== undefined ? { name } : {}),
          ...(text !== undefined ? { text } : {}),
        })
      },

      [CH.snippets.move]: (_event, id: unknown, index: unknown): boolean =>
        isSnippetId(id) && Number.isInteger(index) ? shelf.move(id, index as number) : false,

      [CH.snippets.remove]: (_event, id: unknown): boolean =>
        isSnippetId(id) ? shelf.remove(id) : false,

      [CH.snippets.copy]: async (_event, id: unknown): Promise<'ok' | 'missing' | 'failed'> => {
        const snippet = isSnippetId(id) ? shelf.get(id) : undefined
        if (snippet === undefined) return 'missing'
        const result = await clipboard.put(snippet)
        if (result === 'ok') shelf.used(snippet.id)
        return result
      },
    },
  })

  return {
    dispose: () => {
      unregister()
    },
  }
}

/** Tells every window the snippets as they are now. */
export function broadcastSnippets(views: SnippetView[]): void {
  for (const win of appWindows()) {
    if (!win.webContents.isDestroyed()) win.webContents.send(CH.snippets.changed, views)
  }
}
