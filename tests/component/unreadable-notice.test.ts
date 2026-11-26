import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A file of the user's that main could not read (held open by another program) used to be shown
 * as its default without a word: an empty notes pane looked like every note gone. The page now
 * says which file, keeps saying it while it cannot be read, and says when it has been.
 */

const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')
const { watchUnreadableFiles } = await import('../../src/renderer/lib/unreadable-notice.ts')

let current: string[]
let push: (files: string[]) => void
let stop: () => void

beforeEach(() => {
  current = []
  push = () => {}
  for (const item of toasts.items) toasts.dismiss(item.id)
  vi.stubGlobal('elecdex', {
    system: {
      unreadableFiles: async () => current,
      onUnreadableFiles: (handler: (files: string[]) => void) => {
        push = handler
        return () => {
          push = () => {}
        }
      },
    },
  })
})

afterEach(() => {
  stop()
  vi.unstubAllGlobals()
})

const titles = () => toasts.items.map((item) => `${item.tone}: ${item.title}`)

describe('the notice of a file that could not be read', () => {
  it('says a file main could not read before the page was there', async () => {
    current = ['notes.json']
    stop = watchUnreadableFiles()
    await vi.waitFor(() => expect(titles()).toEqual(['danger: could not read notes.json']))
    // Up until it has been read: not timed out.
    expect(toasts.items[0]?.timeoutMs).toBe(0)
  })

  it('says each file once, and when it has been read again', async () => {
    stop = watchUnreadableFiles()
    await Promise.resolve()
    push(['tasks.json'])
    push(['tasks.json'])
    expect(titles()).toEqual(['danger: could not read tasks.json'])
    push([])
    expect(titles()).toEqual(['ok: tasks.json read again'])
  })

  it('stops listening when told to', async () => {
    stop = watchUnreadableFiles()
    await Promise.resolve()
    stop()
    push(['alarms.json'])
    expect(titles()).toEqual([])
  })
})
