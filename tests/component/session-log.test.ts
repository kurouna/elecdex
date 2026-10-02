import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: SessionLog } = await import('../../src/renderer/widgets/common/SessionLog.svelte')
const { default: CodeLine } = await import('../../src/renderer/widgets/common/CodeLine.svelte')

/**
 * The parts the AI chat and the ELEC council draw alike: the session log and the code line. Drawn
 * once, so the two panes cannot drift apart - the chat's log had come to show "how long ago" a
 * step smaller than the council's, below the size a time is read at.
 */

const NOW = Date.UTC(2026, 9, 3, 12, 0)
const testids = { list: 'log', item: 'log-item', delete: 'log-delete' }

beforeEach(() => {
  // The log counts "how long ago" from when it is drawn.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

type Entry = { id: string; title: string; updatedAt: number; outcome?: string }

function log(over: Record<string, unknown> = {}) {
  const calls = { open: vi.fn(), export: vi.fn(), delete: vi.fn() }
  const entries: Entry[] = [
    { id: 'a', title: 'Say hi', updatedAt: NOW - 2 * 3_600_000, outcome: 'approved' },
    { id: 'b', title: '', updatedAt: NOW },
  ]
  render(SessionLog, {
    props: {
      entries,
      current: 'b',
      empty: 'Nothing yet.',
      deleteTitle: 'Delete this conversation',
      testids,
      onopen: calls.open,
      onexport: calls.export,
      ondelete: calls.delete,
      ...over,
    },
  })
  return calls
}

const rows = () =>
  screen.getAllByTestId('log-item').map((item) => item.textContent?.replace(/\s+/g, ' ').trim())

describe('the session log', () => {
  it('numbers each entry, names an untitled one, and says how long ago', () => {
    log({ suffix: (entry: Entry) => (entry.id === 'a' ? '12' : undefined) })
    expect(rows()).toEqual(['01 Say hi 2h · 12', '02 untitled now'])
    const items = screen.getAllByTestId('log-item')
    expect(items[1]?.closest('li')?.classList.contains('current')).toBe(true)
  })

  it('draws what a pane passes in between the title and the time (the council’s outcome)', () => {
    const badge = createRawSnippet((entry: () => Entry) => ({
      render: () => `<span class="outcome">${entry().outcome ?? '-'}</span>`,
    }))
    log({ badge })
    expect(rows()).toEqual(['01 Say hi approved 2h', '02 untitled - now'])
  })

  it('opens, exports, and deletes on the second press, each by id', async () => {
    const calls = log()
    await fireEvent.click(screen.getAllByTestId('log-item')[0] as HTMLElement)
    expect(calls.open).toHaveBeenCalledWith('a')
    await fireEvent.click(screen.getAllByTitle('save as markdown')[1] as HTMLElement)
    expect(calls.export).toHaveBeenCalledWith('b')
    const remove = screen.getAllByTestId('log-delete')[0] as HTMLElement
    await fireEvent.click(remove)
    expect(calls.delete).not.toHaveBeenCalled()
    await fireEvent.click(remove)
    expect(calls.delete).toHaveBeenCalledWith('a')
  })

  it('says so when there is nothing', () => {
    log({ entries: [] })
    expect(screen.getByTestId('log').textContent?.trim()).toBe('Nothing yet.')
  })

  it('says how long ago at the line’s own size, which is read text', () => {
    // jsdom lays nothing out, so the stylesheet is read: no step below the line's is set on it.
    const source = readFileSync('src/renderer/widgets/common/SessionLog.svelte', 'utf8')
    const rule = /\n\.index,\n\.when \{([^}]*)\}/.exec(source)?.[1]
    expect(rule).toBeDefined()
    expect(rule).not.toMatch(/font-size/)
  })
})

describe('the code line', () => {
  it('puts the words beside the code, and warns only when asked', () => {
    render(CodeLine, { props: { code: 'stopped', detail: 'by you', testid: 'line' } })
    const line = screen.getByTestId('line')
    expect(line.textContent).toBe('stoppedby you')
    expect(line.classList.contains('warn')).toBe(false)
    cleanup()
    render(CodeLine, { props: { code: 'no carrier', detail: '', warn: true, testid: 'line' } })
    expect(screen.getByTestId('line').textContent).toBe('no carrier')
    expect(screen.getByTestId('line').classList.contains('warn')).toBe(true)
  })
})
