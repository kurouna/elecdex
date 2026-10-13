// @vitest-environment jsdom
import { ClipboardAddon } from '@xterm/addon-clipboard'
import type { Terminal } from '@xterm/xterm'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BellRate,
  CLIPBOARD_WRITE_ONLY,
  HeldInput,
  opensLink,
  pasteLines,
  pasteNeedsAsking,
  pastePreview,
  validPattern,
} from '../../src/renderer/widgets/terminal/input.js'

/**
 * What reaches the shell from the pane and the clipboard (widgets/terminal/input.ts): OSC 52
 * may set the clipboard but never read it, and keys typed before the shell is reached are kept.
 */

/** Enough of a terminal for the clipboard addon: its OSC handler, and what it types back. */
function fakeTerminal() {
  let osc: ((data: string) => boolean | Promise<boolean>) | null = null
  const typed: string[] = []
  const terminal = {
    parser: {
      registerOscHandler: (
        _code: number,
        handler: (data: string) => boolean | Promise<boolean>,
      ) => {
        osc = handler
        return { dispose() {} }
      },
    },
    input: (data: string) => typed.push(data),
  }
  return { terminal: terminal as unknown as Terminal, typed, osc: (data: string) => osc?.(data) }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('OSC 52', () => {
  it('answers a query with nothing: the clipboard is never handed to a program', async () => {
    // Found in review: the default provider answered with what was copied - a password just
    // copied, to any program that printed the query.
    const readText = vi.fn(async () => 'hunter2')
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', { clipboard: { readText, writeText } })
    const fake = fakeTerminal()
    new ClipboardAddon(undefined, CLIPBOARD_WRITE_ONLY).activate(fake.terminal)
    await fake.osc('c;?')
    expect(readText).not.toHaveBeenCalled()
    expect(fake.typed.join('')).not.toContain(btoa('hunter2'))
    // A yank still lands on the clipboard.
    await fake.osc(`c;${btoa('yanked')}`)
    expect(writeText).toHaveBeenCalledWith('yanked')
    // Only the clipboard, not the primary selection.
    await fake.osc(`p;${btoa('primary')}`)
    expect(writeText).toHaveBeenCalledTimes(1)
  })
})

describe('HeldInput', () => {
  it('keeps what is typed before the shell is reached, then sends it in order', () => {
    // Found in review: keys typed before the attach went to no port and were lost.
    const sent: string[] = []
    const send = (data: string) => sent.push(data)
    const held = new HeldInput()
    held.type('l', send)
    held.type('s', send)
    expect(sent).toEqual([])
    held.release(send)
    expect(sent).toEqual(['l', 's'])
    held.type('\r', send)
    expect(sent).toEqual(['l', 's', '\r'])
    held.release(send)
    expect(sent).toEqual(['l', 's', '\r'])
  })
})

describe('links', () => {
  it('open on Ctrl+click or ⌘+click, not on a plain click', () => {
    // Found in review: a click meant for focus or a selection opened the browser.
    expect(opensLink({ ctrlKey: false, metaKey: false })).toBe(false)
    expect(opensLink({ ctrlKey: true, metaKey: false })).toBe(true)
    expect(opensLink({ ctrlKey: false, metaKey: true })).toBe(true)
  })
})

describe('pasting several lines', () => {
  it('asks only for text with a line break, while the setting asks', () => {
    expect(pasteNeedsAsking('ls -la', true)).toBe(false)
    expect(pasteNeedsAsking('ls\nrm -rf build', true)).toBe(true)
    expect(pasteNeedsAsking('ls\r', true)).toBe(true)
    expect(pasteNeedsAsking('ls\nrm -rf build', false)).toBe(false)
  })

  it('counts the lines as they will run, a last line break making none', () => {
    expect(pasteLines('a')).toBe(1)
    expect(pasteLines('a\nb')).toBe(2)
    expect(pasteLines('a\r\nb\r\n')).toBe(2)
    expect(pasteLines('a\rb\rc')).toBe(3)
  })
})

describe('the paste question', () => {
  it('asks for other control keys a shell acts on too, not for a tab', () => {
    // Found in review: Ctrl+O runs the line in readline without a line break.
    expect(pasteNeedsAsking('ls\u000f', true)).toBe(true)
    expect(pasteNeedsAsking('a\tb', true)).toBe(false)
  })

  it('shows what it holds: control characters made visible, and how much is left out', () => {
    const text = Array.from({ length: 15 }, (_, i) => `line ${i}`).join('\n')
    const { preview, more } = pastePreview(text)
    expect(preview.split('\n')).toHaveLength(12)
    expect(more).toBe(3)
    expect(pastePreview('rm\u000frf').preview).toBe('rm^Orf')
    expect(pastePreview('a\u202eb').preview).toBe('a<U+202E>b')
    expect(pastePreview('x\u007f').preview).toBe('x^?')
  })
})

describe('validPattern', () => {
  it('says whether a regular expression can be made of what is typed', () => {
    expect(validPattern('err.r')).toBe(true)
    expect(validPattern('(')).toBe(false)
    expect(validPattern('[a-')).toBe(false)
  })
})

describe('BellRate', () => {
  it('takes a bell at most once in its gap', () => {
    const bells = new BellRate(500)
    expect(bells.ring(1000)).toBe(true)
    expect(bells.ring(1200)).toBe(false)
    expect(bells.ring(1499)).toBe(false)
    expect(bells.ring(1500)).toBe(true)
  })
})
