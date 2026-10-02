import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { default: SessionLog } = await import('../../src/renderer/widgets/common/SessionLog.svelte')
const { default: CodeLine } = await import('../../src/renderer/widgets/common/CodeLine.svelte')

/**
 * The parts the AI chat and the ELEC council draw alike: the session log and the code line. Drawn
 * once, so the two panes cannot drift apart - the chat's log had come to show "how long ago" a
 * step smaller than the council's, below the size a time is read at.
 */

afterEach(() => cleanup())

const NOW = Date.UTC(2026, 9, 3, 12, 0)
const testids = { list: 'log', item: 'log-item', delete: 'log-delete' }

function log(over: Record<string, unknown> = {}) {
  const calls = { open: vi.fn(), export: vi.fn(), delete: vi.fn() }
  render(SessionLog, {
    props: {
      entries: [
        { id: 'a', title: 'Say hi', updatedAt: NOW - 2 * 3_600_000 },
        { id: 'b', title: '', updatedAt: NOW },
      ],
      current: 'b',
      openedAt: NOW,
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

describe('the session log', () => {
  it('numbers each entry, names an untitled one, and says how long ago', () => {
    log({ suffix: (entry: { id: string }) => (entry.id === 'a' ? '12' : undefined) })
    const items = screen.getAllByTestId('log-item')
    expect(items.map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '01 Say hi 2h · 12',
      '02 untitled now',
    ])
    expect(items[1]?.closest('li')?.classList.contains('current')).toBe(true)
  })

  it('opens and exports by id', async () => {
    const calls = log()
    await fireEvent.click(screen.getAllByTestId('log-item')[0] as HTMLElement)
    expect(calls.open).toHaveBeenCalledWith('a')
    await fireEvent.click(screen.getAllByTitle('save as markdown')[1] as HTMLElement)
    expect(calls.export).toHaveBeenCalledWith('b')
  })

  it('says so when there is nothing', () => {
    log({ entries: [] })
    expect(screen.getByTestId('log').textContent?.trim()).toBe('Nothing yet.')
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
