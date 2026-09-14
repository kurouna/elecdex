import type { AppInfo, MachineFacts } from '@shared/api'
import type { LayoutNode } from '@shared/schemas/layout'
import { formatBytes } from './format.js'

/**
 * The pure parts of the boot sequence: what the boot log says, how fast it
 * scrolls, and in what order the panes power on afterwards.
 *
 * eDEX-UI printed a canned macOS kernel log. elecdex prints a Linux boot in its
 * real shape - the kernel ring buffer with its timestamps, then systemd starting
 * units - but every fact in it is this machine's and this app's: the OS release,
 * the processor and its speed, memory, the GPUs with their PCI ids and drivers,
 * the displays, the system volume, the network interfaces, the renderer's
 * security settings and CSP, the services elecdex runs and the panes it restores.
 * What Linux would print and elecdex has no equivalent for is left out rather
 * than made up; the few fixed numbers are the ones a real log prints too (the
 * e820 low-memory map, PCI class codes).
 */

export type BootLineKind =
  /** A kernel message, printed after the seconds since start: "[    1.234567] ...". */
  | 'kernel'
  /** A systemd unit, printed after its status: "[  OK  ] Started ...". */
  | 'unit'
  /** Plain console output. */
  | 'console'

export interface BootLine {
  kind: BootLineKind
  text: string
  /** For a unit: how it went. */
  status?: 'ok' | 'failed'
  /** Delay before the next line, overriding the scrolling pace. */
  pause?: number
  /** Drawn brighter, like systemd's welcome line. */
  strong?: boolean
  /** "{elapsed}" in the text stands for the seconds since start when it is printed. */
  elapsed?: boolean
  /** The last line: the boot is complete. */
  final?: boolean
}

export interface BootFacts {
  info: AppInfo
  machine: MachineFacts
  now: Date
  /** The panes of the layout being restored, in order. */
  panes: Array<{ widget: string; title: string }>
  /** Every widget id the registry knows. */
  widgets: string[]
  metricSources: number
  /** The page's Content-Security-Policy, as its meta tag declares it. */
  csp: string
  online: boolean
  /** Earthquake alerts on: their service runs without a pane. */
  alerts: boolean
  /** The daily release check on. */
  updateCheck: boolean
}

/** The machine facts main could not give (an old main, a failed call): only what the page knows. */
export function fallbackMachine(info: AppInfo, startedAt: number): MachineFacts {
  const [name = info.platform, release = ''] = info.host.osRelease.split(' ')
  return {
    kernel: { name, release, machine: info.arch },
    cpuSpeedMhz: 0,
    freeMemory: 0,
    pid: 0,
    startedAt,
    switches: [],
    volume: null,
    network: [],
    gpus: [],
    displays: [],
  }
}

const kernel = (text: string, extra: Partial<BootLine> = {}): BootLine => ({
  kind: 'kernel',
  text,
  ...extra,
})
const unit = (text: string, status: 'ok' | 'failed' = 'ok'): BootLine => ({
  kind: 'unit',
  text,
  status,
})
const plain = (text: string, extra: Partial<BootLine> = {}): BootLine => ({
  kind: 'console',
  // An empty line still takes its height.
  text: text === '' ? ' ' : text,
  ...extra,
})

const hex = (n: number, width: number): string => n.toString(16).padStart(width, '0')

/** "Mon Sep 14 04:00:00 UTC 2026", as uname prints a build date. */
export function unameDate(date: Date): string {
  const [weekday, day, month, year, time] = date.toUTCString().replace(',', '').split(' ')
  return `${weekday} ${month} ${day} ${time} UTC ${year}`
}

/** "[    1.234567]": the kernel's timestamp, seconds since start in a field of twelve. */
export function kernelStamp(seconds: number): string {
  return `[${Math.max(0, seconds).toFixed(6).padStart(12)}]`
}

/** A line as it is printed `seconds` after start. */
export function printedText(line: BootLine, seconds: number): string {
  const text = line.elapsed
    ? line.text.replace('{elapsed}', `${Math.max(0, seconds).toFixed(3)}s`)
    : line.text
  return line.kind === 'kernel' ? `${kernelStamp(seconds)} ${text}` : text
}

/** Processor lines are capped, so a big machine does not stall the boot. */
export const CPU_LINES_MAX = 16

function versionLines({ info, machine, now }: BootFacts): BootLine[] {
  const { versions, host } = info
  const { kernel: os } = machine
  const switches = machine.switches.length > 0 ? ` ${machine.switches.join(' ')}` : ''
  const root = machine.volume?.root ?? host.home
  return [
    kernel(
      `Linux version ${os.release}-elecdex-${info.version} (${host.user ?? 'root'}@${host.hostname}) (electron ${versions.electron}, chromium ${versions.chrome}, node ${versions.node}, V8 ${versions.v8}) #1 SMP PREEMPT_DYNAMIC ${unameDate(now)}`,
      { pause: 300 },
    ),
    kernel(
      `Command line: BOOT_IMAGE=/boot/elecdex-${info.version} root=${root} ro quiet splash${switches}`,
    ),
    kernel(`DMI: ${host.hostname}/${os.name}, BIOS ${os.release}`),
  ]
}

function cpuVendor(model: string): string | null {
  if (/intel/i.test(model)) return 'Intel GenuineIntel'
  if (/\bamd\b|ryzen|epyc/i.test(model)) return 'AMD AuthenticAMD'
  return null
}

function memoryLines({ info, machine }: BootFacts): BootLine[] {
  const total = info.host.totalMemory
  const lines: BootLine[] = []
  const vendor = cpuVendor(info.host.cpuModel)
  if (vendor !== null && /^(x64|ia32)$/.test(info.arch)) {
    lines.push(kernel('KERNEL supported cpus:'), kernel(`  ${vendor}`))
  }
  lines.push(
    kernel('BIOS-provided physical RAM map:'),
    kernel('BIOS-e820: [mem 0x0000000000000000-0x000000000009ffff] usable'),
    kernel('BIOS-e820: [mem 0x00000000000a0000-0x00000000000fffff] reserved'),
    kernel(
      `BIOS-e820: [mem 0x0000000000100000-0x${hex(Math.max(total - 1, 0x100000), 16)}] usable`,
    ),
    kernel('NX (Execute Disable) protection: active'),
  )
  if (machine.cpuSpeedMhz > 0) {
    lines.push(kernel(`tsc: Detected ${machine.cpuSpeedMhz.toFixed(3)} MHz processor`))
  }
  lines.push(
    kernel(`last_pfn = 0x${hex(Math.floor(total / 4096), 6)} max_arch_pfn = 0x400000000`),
    kernel(`smpboot: Allowing ${info.host.cpuThreads} CPUs, 0 hotplug CPUs`),
  )
  if (machine.freeMemory > 0) {
    const kib = (bytes: number) => Math.floor(bytes / 1024)
    lines.push(kernel(`Memory: ${kib(machine.freeMemory)}K/${kib(total)}K available`))
  }
  return lines
}

function cpuLines({ info, machine }: BootFacts): BootLine[] {
  const threads = info.host.cpuThreads
  const bogomips = machine.cpuSpeedMhz * 2
  const lines: BootLine[] = []
  if (bogomips > 0) {
    lines.push(
      kernel(
        `Calibrating delay loop (skipped), value calculated using timer frequency.. ${bogomips.toFixed(2)} BogoMIPS`,
      ),
    )
  }
  lines.push(kernel(`smpboot: CPU0: ${info.host.cpuModel}`))
  for (let cpu = 1; cpu < Math.min(threads, CPU_LINES_MAX); cpu += 1) {
    lines.push(kernel(`smpboot: Booting Node 0 Processor ${cpu} APIC 0x${hex(cpu * 2, 1)}`))
  }
  lines.push(kernel(`smp: Brought up 1 node, ${threads} CPUs`))
  if (bogomips > 0) {
    lines.push(
      kernel(
        `smpboot: Total of ${threads} processors activated (${(bogomips * threads).toFixed(2)} BogoMIPS)`,
      ),
    )
  }
  lines.push(kernel('devtmpfs: initialized'))
  return lines
}

/** Software renderers (Microsoft's basic render driver, SwiftShader) are not devices on a bus. */
const SOFTWARE_VENDORS = new Set([0x1414, 0x1ae0])

const DRM_DRIVERS: Record<number, string> = {
  32902: 'i915',
  4318: 'nvidia',
  4098: 'amdgpu',
  4203: 'apple',
}

/** Where a GPU sits on the bus: an integrated one at 00:02.0, as Intel's are; the next on their own buses. */
const pciSlot = (index: number): string => (index === 0 ? '0000:00:02.0' : `0000:0${index}:00.0`)

function deviceLines({ machine }: BootFacts): BootLine[] {
  const gpus = machine.gpus.filter((gpu) => !SOFTWARE_VENDORS.has(gpu.vendorId))
  const lines: BootLine[] = []
  gpus.forEach((gpu, i) => {
    const slot = pciSlot(i)
    lines.push(
      kernel(
        `pci ${slot}: [${hex(gpu.vendorId, 4)}:${hex(gpu.deviceId, 4)}] type 00 class 0x030000${gpu.name ? ` ${gpu.name}` : ''}`,
      ),
      kernel(`pci ${slot}: vgaarb: VGA device added: decodes=io+mem,owns=io+mem,locks=none`),
    )
  })
  lines.push(kernel('clocksource: Switched to clocksource tsc'))
  gpus.forEach((gpu, i) => {
    const slot = pciSlot(i)
    const driver = DRM_DRIVERS[gpu.vendorId] ?? 'drm'
    lines.push(
      kernel(
        `${driver} ${slot}: [drm] Initialized ${driver} ${gpu.driver || '1.0.0'} for ${slot} on minor ${i}`,
      ),
    )
  })
  machine.displays.forEach((d, i) => {
    lines.push(
      kernel(
        `fbcon: elecdexdrmfb (fb${i}) is ${i === 0 ? 'primary' : 'secondary'} device: ${d.width}x${d.height}@${d.hz}Hz, scale ${d.scale}${d.internal ? ', internal panel' : ''}`,
      ),
    )
  })
  return lines
}

function securityLines({ widgets, csp }: BootFacts): BootLine[] {
  return [
    kernel('LSM: initializing lsm=capability,sandbox,context_isolation'),
    kernel('sandbox: renderer confined: sandbox=on contextIsolation=on nodeIntegration=off'),
    kernel(`csp: ${csp}`),
    kernel('elecdex-bridge: window.elecdex registered through contextBridge'),
    ...widgets.map((id) => kernel(`widgets: registered new widget driver ${id}`)),
  ]
}

function mountLines({ info, machine }: BootFacts): BootLine[] {
  const lines: BootLine[] = []
  const { volume } = machine
  if (volume !== null) {
    lines.push(
      kernel(`VFS: Mounted root (${volume.root}) readonly on device 259:2.`),
      kernel(
        `EXT4-fs (${volume.root}): re-mounted r/w. ${formatBytes(volume.total)}, ${formatBytes(volume.free)} free. Quota mode: none.`,
      ),
    )
  }
  for (const name of machine.network) {
    lines.push(kernel(`IPv6: ADDRCONF(NETDEV_CHANGE): ${name}: link becomes ready`))
  }
  lines.push(
    kernel(`Run /usr/lib/elecdex/elecdex (pid ${machine.pid || 1}) as init process`, {
      pause: 200,
    }),
    kernel(
      `systemd[1]: systemd ${info.versions.electron} running in system mode (+SANDBOX +CONTEXT_ISOLATION +CSP -NODE_INTEGRATION +PTY +OSC7 +OSC133 +MESSAGEPORT)`,
    ),
    kernel(`systemd[1]: Detected architecture ${machine.kernel.machine}.`),
    kernel(`systemd[1]: Hostname set to <${info.host.hostname}>.`),
  )
  return lines
}

/** The services that reach the network, and the widgets that start them. */
const NETWORK_SERVICES = [
  { widget: 'weather', unit: 'weather', description: 'Weather Forecasts (JMA, NWS, MET Norway)' },
  { widget: 'markets', unit: 'markets', description: 'Market Quotes (Yahoo Finance)' },
  { widget: 'rss', unit: 'feeds', description: 'RSS and Atom Feeds' },
  { widget: 'quakes', unit: 'quakes', description: 'Earthquakes and Tsunamis' },
] as const

function serviceLines(facts: BootFacts): BootLine[] {
  const { info, panes, metricSources, online, alerts, updateCheck } = facts
  const present = new Set(panes.map((p) => p.widget))
  const terminals = panes.filter((p) => p.widget === 'terminal').length
  const lines: BootLine[] = [
    plain(''),
    plain(`Welcome to elecdex ${info.version}!`, { strong: true, pause: 400 }),
    plain(''),
    unit(
      `Created slice panes.slice - Workspace Panes (${panes.length} panes, ${terminals} terminals).`,
    ),
    unit('Reached target local-fs.target - Local File Systems.'),
    unit('Started elecdex-bridge.service - contextBridge API (window.elecdex).'),
    unit(
      `Started pty.service - Terminal Backend (${info.platform === 'win32' ? 'ConPTY' : 'openpty'}).`,
    ),
    unit('Listening on pty.socket - Terminal Output over MessagePort (no TCP listeners).'),
    unit('Started shell-integration.service - Shell Integration (OSC 7, OSC 133).'),
    unit(`Listening on metrics.socket - Metrics Collector (${metricSources} sources, on demand).`),
    online
      ? unit('Reached target network-online.target - Network is Online.')
      : unit('Failed to start network-online.target - Network is Online.', 'failed'),
  ]
  for (const service of NETWORK_SERVICES) {
    const running = present.has(service.widget) || (service.unit === 'quakes' && alerts)
    lines.push(
      running
        ? unit(`Started ${service.unit}.service - ${service.description}.`)
        : unit(`Listening on ${service.unit}.socket - ${service.description} (on demand).`),
    )
  }
  if (updateCheck) lines.push(unit('Started update-check.timer - Daily Release Check (GitHub).'))
  const seen = new Map<string, number>()
  for (const { widget, title } of panes) {
    const n = (seen.get(widget) ?? 0) + 1
    seen.set(widget, n)
    lines.push(unit(`Started pane@${widget}-${n}.service - ${title}.`))
  }
  return lines
}

function loginLines({ info, machine }: BootFacts): BootLine[] {
  const { host } = info
  return [
    unit('Reached target graphical.target - Graphical Interface.'),
    kernel('systemd[1]: Startup finished in {elapsed}.', { elapsed: true, pause: 300 }),
    plain(''),
    plain(`${machine.kernel.name} ${machine.kernel.release} ${host.hostname} tty1`),
    plain(''),
    plain(`${host.hostname} login: ${host.user ?? 'root'} (automatic login)`, {
      strong: true,
      final: true,
      pause: 500,
    }),
  ]
}

export function bootLog(facts: BootFacts): BootLine[] {
  return [
    ...versionLines(facts),
    ...memoryLines(facts),
    ...cpuLines(facts),
    ...deviceLines(facts),
    ...securityLines(facts),
    ...mountLines(facts),
    ...serviceLines(facts),
    ...loginLines(facts),
  ]
}

/**
 * How long to wait after printing line `index` of `total`.
 *
 * A line's own pause wins; otherwise the log accelerates as it goes, the way
 * eDEX-UI's did, so the tail of a long log rushes past.
 */
export function lineDelay(line: BootLine, index: number, total: number): number {
  if (line.pause !== undefined) return line.pause
  const progress = total <= 1 ? 1 : index / (total - 1)
  return Math.max(6, Math.round(34 * (1 - progress) ** 2))
}

export interface RevealTiming {
  /** When shell panes power on. */
  shellAt: number
  /** When the first row of module panes powers on. */
  modulesAt: number
  /** Gap between successive rows of modules. */
  step: number
}

export const DEFAULT_REVEAL: RevealTiming = { shellAt: 0, modulesAt: 450, step: 200 }

/**
 * When each pane powers on, in milliseconds from the start of the reveal.
 *
 * eDEX-UI opened the main shell first, then faded the modules in one row at a
 * time with the left and right columns in step. The general rule that reproduces
 * that for any layout: shells first; then modules by their position from the
 * top, where only column splits count - panes side by side share a row and come
 * on together.
 */
export function revealDelays(
  root: LayoutNode,
  isShell: (widget: string) => boolean,
  timing: RevealTiming = DEFAULT_REVEAL,
): Map<string, number> {
  const delays = new Map<string, number>()

  const visit = (node: LayoutNode, row: number): void => {
    switch (node.kind) {
      case 'pane':
        delays.set(
          node.id,
          isShell(node.widget) ? timing.shellAt : timing.modulesAt + row * timing.step,
        )
        return
      case 'tabs':
        for (const child of node.children) visit(child, row)
        return
      case 'split':
        node.children.forEach((child, index) => {
          visit(child, node.direction === 'column' ? row + index : row)
        })
        return
    }
  }

  visit(root, 0)
  return delays
}
