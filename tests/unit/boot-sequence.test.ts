import type { AppInfo } from '@shared/api'
import { defaultLayoutNode } from '@shared/default-layout'
import { collectPanes, pane, split, tabs } from '@shared/layout-ops'
import { describe, expect, it } from 'vitest'
import {
  bootLog,
  DEFAULT_REVEAL,
  lineDelay,
  revealDelays,
} from '../../src/renderer/lib/boot-sequence.js'

const info: AppInfo = {
  name: 'elecdex',
  version: '1.2.3',
  platform: 'win32',
  arch: 'x64',
  isPackaged: false,
  versions: { electron: '44.3.0', chrome: '140.0.0.0', node: '24.1.0', v8: '14.0' },
  intro: true,
  host: {
    user: 'someone',
    hostname: 'HOST-1',
    osRelease: 'Windows_NT 10.0.26200',
    cpuModel: 'Test CPU',
    cpuThreads: 12,
    totalMemory: 16 * 1024 ** 3,
  },
}

const facts = {
  info,
  now: new Date('2026-09-13T10:00:00Z'),
  panes: ['clock', 'terminal', 'cpu'],
  widgets: ['terminal', 'clock', 'cpu'],
  metricSources: 14,
}

describe('bootLog', () => {
  it('reports what is actually running, not a canned log', () => {
    const text = bootLog(facts).map((l) => l.text)
    expect(text[0]).toBe('Welcome to elecdex 1.2.3')
    expect(text).toContain('electron 44.3.0 / chromium 140.0.0.0')
    expect(text).toContain('cpu: Test CPU')
    expect(text).toContain('cpu: 12 logical processors online')
    expect(text).toContain('pty: ConPTY backend ready')
    expect(text).toContain('layout: restoring 3 panes, 1 terminal(s)')
    expect(text.at(-1)).toBe('Boot Complete')
  })

  it('lists one processor line per thread, capped so a big machine does not stall the boot', () => {
    const count = (threads: number) =>
      bootLog({ ...facts, info: { ...info, host: { ...info.host, cpuThreads: threads } } }).filter(
        (l) => l.text.startsWith('elecdexCPU:'),
      ).length
    expect(count(4)).toBe(4)
    expect(count(128)).toBe(16)
  })

  it('maps every widget at a stable address', () => {
    const a = bootLog(facts).filter((l) => l.text.startsWith('widget:'))
    const b = bootLog(facts).filter((l) => l.text.startsWith('widget:'))
    expect(a).toHaveLength(3)
    expect(a).toEqual(b)
  })
})

describe('lineDelay', () => {
  it('honours an explicit pause', () => {
    expect(lineDelay({ text: '', pause: 420 }, 5, 10)).toBe(420)
  })

  it('accelerates towards the end of the log', () => {
    const total = 60
    const early = lineDelay({ text: '' }, 2, total)
    const late = lineDelay({ text: '' }, 55, total)
    expect(early).toBeGreaterThan(late)
    expect(late).toBeGreaterThanOrEqual(6)
  })

  it('keeps a whole log short', () => {
    const lines = bootLog(facts)
    const total = lines.reduce((ms, line, i) => ms + lineDelay(line, i, lines.length), 0)
    expect(total).toBeLessThan(4000)
  })
})

describe('revealDelays', () => {
  const isShell = (widget: string) => widget === 'terminal'

  it('reproduces eDEX-UI: the shell first, then both columns row by row', () => {
    const root = defaultLayoutNode()
    const delays = revealDelays(root, isShell)
    const byWidget = new Map(collectPanes(root).map((p) => [p.widget, delays.get(p.id)]))
    const { shellAt, modulesAt, step } = DEFAULT_REVEAL

    expect(byWidget.get('terminal')).toBe(shellAt)
    // Row 0 of each column together, then row 1 together, and so on.
    expect(byWidget.get('clock')).toBe(modulesAt)
    expect(byWidget.get('netstat')).toBe(modulesAt)
    expect(byWidget.get('sysinfo')).toBe(modulesAt + step)
    expect(byWidget.get('globe')).toBe(modulesAt + step)
    expect(byWidget.get('toplist')).toBe(modulesAt + 4 * step)
  })

  it('gives every pane a delay, including background tabs', () => {
    const root = split('column', [
      tabs([pane('terminal'), pane('cpu')]),
      split('row', [pane('clock'), pane('memory')]),
    ])
    const delays = revealDelays(root, isShell)
    expect(delays.size).toBe(4)
    const timing = DEFAULT_REVEAL
    const [terminal, cpu, clock, memory] = collectPanes(root).map((p) => delays.get(p.id))
    expect(terminal).toBe(timing.shellAt)
    expect(cpu).toBe(timing.modulesAt)
    // Side by side in a row: same moment.
    expect(clock).toBe(timing.modulesAt + timing.step)
    expect(memory).toBe(clock)
  })
})
