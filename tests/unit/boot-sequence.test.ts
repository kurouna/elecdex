import type { AppInfo, MachineFacts } from '@shared/api'
import { defaultLayoutNode } from '@shared/default-layout'
import { collectPanes, pane, split, tabs } from '@shared/layout-ops'
import { describe, expect, it } from 'vitest'
import {
  type BootFacts,
  type BootLine,
  bootLog,
  CPU_LINES_MAX,
  DEFAULT_REVEAL,
  fallbackMachine,
  kernelStamp,
  lineDelay,
  printedText,
  revealDelays,
  unameDate,
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
    home: '/home/someone',
    hostname: 'HOST-1',
    osRelease: 'Windows_NT 10.0.26200',
    cpuModel: 'Test CPU',
    cpuThreads: 12,
    totalMemory: 16 * 1024 ** 3,
  },
}

const machine: MachineFacts = {
  kernel: { name: 'Windows 11 Pro', release: '10.0.26200', machine: 'x86_64' },
  cpuSpeedMhz: 2496,
  freeMemory: 8 * 1024 ** 3,
  pid: 4242,
  startedAt: Date.parse('2026-09-13T09:59:58Z'),
  switches: ['--windowed'],
  volume: { root: 'C:\\', total: 512 * 1024 ** 3, free: 128 * 1024 ** 3 },
  network: ['Wi-Fi'],
  gpus: [
    {
      vendorId: 0x8086,
      deviceId: 0xa7a1,
      name: 'Intel(R) Iris(R) Xe Graphics',
      driver: '32.0.101.7088',
    },
    { vendorId: 0x1414, deviceId: 0x8c, name: 'Microsoft Basic Render Driver', driver: '10.0' },
  ],
  displays: [{ width: 2560, height: 1600, hz: 60, scale: 1.5, internal: true }],
}

const facts: BootFacts = {
  info,
  machine,
  now: new Date('2026-09-13T10:00:00Z'),
  panes: [
    { widget: 'clock', title: 'clock' },
    { widget: 'terminal', title: 'shell' },
    { widget: 'terminal', title: 'shell' },
    { widget: 'weather', title: 'weather' },
  ],
  widgets: ['terminal', 'clock', 'weather'],
  metricSources: 14,
  csp: "default-src 'none'; script-src 'self'",
  online: true,
  alerts: false,
  updateCheck: true,
}

const texts = (f: BootFacts = facts) => bootLog(f).map((l) => l.text)

describe('bootLog', () => {
  it('prints a Linux boot in its shape, filled with this machine and app', () => {
    const text = texts()
    expect(text[0]).toBe(
      'Linux version 10.0.26200-elecdex-1.2.3 (someone@HOST-1) (electron 44.3.0, chromium 140.0.0.0, node 24.1.0, V8 14.0) #1 SMP PREEMPT_DYNAMIC Sun Sep 13 10:00:00 UTC 2026',
    )
    expect(text).toContain(
      'Command line: BOOT_IMAGE=/boot/elecdex-1.2.3 root=C:\\ ro quiet splash --windowed',
    )
    expect(text).toContain('DMI: HOST-1/Windows 11 Pro, BIOS 10.0.26200')
    expect(text).toContain('tsc: Detected 2496.000 MHz processor')
    expect(text).toContain(`Memory: ${8 * 1024 ** 2}K/${16 * 1024 ** 2}K available`)
    expect(text).toContain('BIOS-e820: [mem 0x0000000000100000-0x00000003ffffffff] usable')
    expect(text).toContain('smpboot: CPU0: Test CPU')
    expect(text).toContain('smpboot: Total of 12 processors activated (59904.00 BogoMIPS)')
    expect(text).toContain("csp: default-src 'none'; script-src 'self'")
    expect(text).toContain(
      'EXT4-fs (C:\\): re-mounted r/w. 512.0 GiB, 128.0 GiB free. Quota mode: none.',
    )
    expect(text).toContain('IPv6: ADDRCONF(NETDEV_CHANGE): Wi-Fi: link becomes ready')
    expect(text).toContain('Run /usr/lib/elecdex/elecdex (pid 4242) as init process')
    expect(text).toContain('systemd[1]: Detected architecture x86_64.')
    expect(text).toContain('systemd[1]: Hostname set to <HOST-1>.')
    expect(text).toContain('Welcome to elecdex 1.2.3!')
    expect(text.at(-1)).toBe('HOST-1 login: someone (automatic login)')
    expect(bootLog(facts).at(-1)?.final).toBe(true)
  })

  it('names the GPUs by PCI id and driver, leaving out software renderers, and the displays', () => {
    const text = texts()
    expect(text).toContain(
      'pci 0000:00:02.0: [8086:a7a1] type 00 class 0x030000 Intel(R) Iris(R) Xe Graphics',
    )
    expect(text).toContain(
      'i915 0000:00:02.0: [drm] Initialized i915 32.0.101.7088 for 0000:00:02.0 on minor 0',
    )
    expect(text.some((t) => t.includes('Basic Render'))).toBe(false)
    expect(text).toContain(
      'fbcon: elecdexdrmfb (fb0) is primary device: 2560x1600@60Hz, scale 1.5, internal panel',
    )
  })

  it('starts the services of the panes in the layout, and leaves the others on demand', () => {
    const lines = bootLog(facts).filter((l) => l.kind === 'unit')
    const text = lines.map((l) => l.text)
    expect(lines.every((l) => l.status === 'ok')).toBe(true)
    expect(text).toContain('Created slice panes.slice - Workspace Panes (4 panes, 2 terminals).')
    expect(text).toContain('Started pty.service - Terminal Backend (ConPTY).')
    expect(text).toContain('Started weather.service - Weather Forecasts (JMA, NWS, MET Norway).')
    expect(text).toContain('Listening on quakes.socket - Earthquakes and Tsunamis (on demand).')
    expect(text).toContain('Started update-check.timer - Daily Release Check (GitHub).')
    // One instance per pane, numbered per widget.
    expect(text).toContain('Started pane@terminal-1.service - shell.')
    expect(text).toContain('Started pane@terminal-2.service - shell.')
    expect(text.at(-1)).toBe('Reached target graphical.target - Graphical Interface.')

    // Alerts run the earthquake service without a pane; no update check, no timer.
    const other = texts({ ...facts, alerts: true, updateCheck: false })
    expect(other).toContain('Started quakes.service - Earthquakes and Tsunamis.')
    expect(other.some((t) => t.includes('update-check'))).toBe(false)
  })

  it('reports an offline machine as a failed unit', () => {
    const failed = bootLog({ ...facts, online: false }).find((l) => l.status === 'failed')
    expect(failed?.text).toBe('Failed to start network-online.target - Network is Online.')
  })

  it('lists one processor line per thread, capped so a big machine does not stall the boot', () => {
    const count = (threads: number) =>
      texts({ ...facts, info: { ...info, host: { ...info.host, cpuThreads: threads } } }).filter(
        (t) => t.startsWith('smpboot: Booting Node 0 Processor'),
      ).length
    expect(count(4)).toBe(3)
    expect(count(128)).toBe(CPU_LINES_MAX - 1)
  })

  it('leaves out what main could not tell rather than inventing it', () => {
    const lean = fallbackMachine(info, 0)
    const text = texts({ ...facts, machine: lean })
    expect(lean.kernel).toEqual({ name: 'Windows_NT', release: '10.0.26200', machine: 'x64' })
    expect(
      text.some((t) => t.startsWith('tsc:') || t.startsWith('Memory:') || t.includes('BogoMIPS')),
    ).toBe(false)
    expect(
      text.some((t) => t.startsWith('pci ') || t.startsWith('fbcon:') || t.startsWith('EXT4-fs')),
    ).toBe(false)
    expect(text.at(-1)).toBe('HOST-1 login: someone (automatic login)')
  })

  it('prints kernel lines with the seconds since start, and the startup time when it is printed', () => {
    expect(kernelStamp(0)).toBe('[    0.000000]')
    expect(kernelStamp(12.3456789)).toBe('[   12.345679]')
    const finished = bootLog(facts).find((l) => l.elapsed) as BootLine
    expect(printedText(finished, 2.5)).toBe(
      '[    2.500000] systemd[1]: Startup finished in 2.500s.',
    )
    const unitLine = bootLog(facts).find((l) => l.kind === 'unit') as BootLine
    expect(printedText(unitLine, 2.5)).toBe(unitLine.text)
  })

  it('writes the date as uname does', () => {
    expect(unameDate(new Date('2026-09-14T04:05:06Z'))).toBe('Mon Sep 14 04:05:06 UTC 2026')
  })
})

describe('lineDelay', () => {
  it('honours an explicit pause', () => {
    expect(lineDelay({ kind: 'kernel', text: '', pause: 420 }, 5, 10)).toBe(420)
  })

  it('accelerates towards the end of the log', () => {
    const total = 60
    const early = lineDelay({ kind: 'kernel', text: '' }, 2, total)
    const late = lineDelay({ kind: 'kernel', text: '' }, 55, total)
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
    expect(byWidget.get('globe')).toBe(modulesAt)
    expect(byWidget.get('sysinfo')).toBe(modulesAt + step)
    expect(byWidget.get('markets')).toBe(modulesAt + step)
    expect(byWidget.get('disk')).toBe(modulesAt + 4 * step)
    expect(byWidget.get('toplist')).toBe(modulesAt + 5 * step)
    expect(byWidget.get('throughput')).toBe(modulesAt + 7 * step)
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
