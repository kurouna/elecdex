import { Terminal } from '@xterm/headless'
import { describe, expect, it } from 'vitest'
import { ScreenMirror } from '../../src/main/pty/screen-mirror.js'

const bytes = (s: string) => new TextEncoder().encode(s)

/** Writes into a fresh terminal of the given size, as a reattaching pane would. */
async function renderInto(data: string, cols: number, rows: number): Promise<string[]> {
  const term = new Terminal({ cols, rows, scrollback: 1000, allowProposedApi: true })
  await new Promise<void>((resolve) => term.write(data, resolve))
  const buffer = term.buffer.active
  const lines: string[] = []
  for (let i = 0; i < buffer.length; i++)
    lines.push(buffer.getLine(i)?.translateToString(true) ?? '')
  term.dispose()
  return trimTrailing(lines)
}

const trimTrailing = (lines: string[]) => {
  const out = [...lines]
  while (out.length > 0 && out[out.length - 1] === '') out.pop()
  return out
}

/**
 * What ConPTY sends: it redraws the viewport with absolute cursor positions
 * rather than streaming lines, so the bytes only make sense on a screen of the
 * size they were produced for.
 */
const CONPTY_REDRAW = [
  '\u001b[H\u001b[2J',
  '\u001b[1;1HPS C:\\> echo one',
  '\u001b[2;1Hone',
  '\u001b[3;1HPS C:\\> echo two',
  '\u001b[4;1Htwo',
  '\u001b[5;1HPS C:\\> ',
].join('')

describe('ScreenMirror', () => {
  it('snapshots a cursor-addressed redraw so it renders the same elsewhere', async () => {
    const mirror = new ScreenMirror(40, 5)
    mirror.write(bytes(CONPTY_REDRAW))
    const snapshot = await mirror.snapshot()

    const expected = ['PS C:\\> echo one', 'one', 'PS C:\\> echo two', 'two', 'PS C:\\>']
    // Into a pane taller than the session was, as after a remount into a tab group.
    const lines = await renderInto(snapshot, 40, 12)
    expect(lines.map((line) => line.trimEnd())).toEqual(expected)
    mirror.dispose()
  })

  it('keeps scrollback, not just the visible screen', async () => {
    const mirror = new ScreenMirror(20, 3)
    for (let i = 0; i < 10; i++) mirror.write(bytes(`line ${i}\r\n`))
    const lines = await renderInto(await mirror.snapshot(), 20, 3)
    expect(lines).toEqual(Array.from({ length: 10 }, (_, i) => `line ${i}`))
    mirror.dispose()
  })

  it('covers every chunk written before the snapshot was requested', async () => {
    const mirror = new ScreenMirror(20, 5)
    // No await between the write and the snapshot: the parser has not run yet.
    mirror.write(bytes('just arrived'))
    expect(await renderInto(await mirror.snapshot(), 20, 5)).toEqual(['just arrived'])
    mirror.dispose()
  })

  it('reflows long lines into a narrower pane instead of cutting them', async () => {
    const mirror = new ScreenMirror(40, 5)
    mirror.write(bytes('abcdefghijklmnopqrstuvwxyz0123456789'))
    const lines = await renderInto(await mirror.snapshot(), 20, 5)
    expect(lines.join('')).toBe('abcdefghijklmnopqrstuvwxyz0123456789')
    mirror.dispose()
  })

  it('follows resizes', async () => {
    const mirror = new ScreenMirror(80, 24)
    mirror.resize(30, 10)
    mirror.write(bytes('\u001b[10;1Hbottom'))
    const lines = await renderInto(await mirror.snapshot(), 30, 10)
    expect(lines[9]).toBe('bottom')
    mirror.dispose()
  })

  it('restores a full-screen application on the alternate screen', async () => {
    const mirror = new ScreenMirror(20, 4)
    mirror.write(bytes('shell history\r\n\u001b[?1049h\u001b[H\u001b[2Jeditor view'))
    const snapshot = await mirror.snapshot()
    expect(await renderInto(snapshot, 20, 4)).toEqual(['editor view'])
    // And leaving it goes back to the shell's screen, as it would have.
    expect(await renderInto(`${snapshot}\u001b[?1049l`, 20, 4)).toEqual(['shell history'])
    mirror.dispose()
  })

  it('settles a pending snapshot when the session ends first', async () => {
    const mirror = new ScreenMirror(20, 5)
    mirror.write(bytes('bye'))
    const pending = mirror.snapshot()
    mirror.dispose()
    await expect(pending).resolves.toBeTypeOf('string')
    await expect(mirror.snapshot()).resolves.toBe('')
    // Late output from a dead session is ignored rather than throwing.
    expect(() => mirror.write(bytes('late'))).not.toThrow()
  })
})
