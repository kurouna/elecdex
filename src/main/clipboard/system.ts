import {
  type ClipEntry,
  type ClipRead,
  HISTORY_FLAG_FORMAT,
  historyFlagSaysPrivate,
  privateMark,
  rawFormatType,
} from '@shared/clipboard'
import { ClipboardItem, clipboard } from 'electron'

/**
 * The system clipboard, through Electron's asynchronous API (Electron 44): a
 * look reads the list of formats, then the text, and holds main for
 * microseconds - the reading itself happens off its thread (measured,
 * architecture.md §16).
 *
 * A copy an application marked private (a password manager's) is recognised
 * from its formats alone: its text is never read.
 */
export async function readSystemClipboard(last: string | null): Promise<ClipRead> {
  const [item] = await clipboard.read()
  if (item === undefined) return { kind: 'other' }
  const mark = privateMark(item.types)
  if (mark === 'yes') return { kind: 'private' }
  if (mark === 'ask') {
    const flag = (await item.getType(rawFormatType(HISTORY_FLAG_FORMAT))) as Blob
    if (historyFlagSaysPrivate(new Uint8Array(await flag.arrayBuffer()))) return { kind: 'private' }
  }
  if (!item.types.includes('text/plain')) return { kind: 'other' }
  const text = await ((await item.getType('text/plain')) as Blob).text()
  // The same text as last time is not a new copy, and its HTML is not wanted.
  if (text === last || !item.types.includes('text/html')) return { kind: 'text', text, html: null }
  const html = await ((await item.getType('text/html')) as Blob).text()
  return { kind: 'text', text, html }
}

export async function writeSystemClipboard(entry: ClipEntry): Promise<void> {
  const data: Record<string, string> = { 'text/plain': entry.text }
  if (entry.html !== null) data['text/html'] = entry.html
  await clipboard.write([new ClipboardItem(data)])
}
