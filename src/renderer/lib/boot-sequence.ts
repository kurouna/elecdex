import type { AppInfo } from '@shared/api'
import type { LayoutNode } from '@shared/schemas/layout'
import { formatBytes } from './format.js'

/**
 * The pure parts of the boot sequence: what the boot log says, how fast it
 * scrolls, and in what order the panes power on afterwards.
 *
 * eDEX-UI printed a canned macOS kernel log. elecdex prints what it actually
 * knows at startup - the runtime, the machine, the security posture of the
 * renderer and the layout it is about to show - at the same accelerating pace.
 */

export interface BootLine {
  text: string
  /** Delay before the next line, overriding the scrolling pace. */
  pause?: number
  /** Drawn brighter, like the original's section headers. */
  strong?: boolean
}

export interface BootFacts {
  info: AppInfo
  now: Date
  /** Widget ids of every pane in the layout being restored. */
  panes: string[]
  /** Every widget id the registry knows. */
  widgets: string[]
  metricSources: number
}

const hex = (n: number, width = 8): string => `0x${n.toString(16).padStart(width, '0')}`

/** A deterministic, plausible-looking address from a label, for the map lines. */
function addressOf(label: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return (h & 0x0fff_f000) | 0x1000_0000
}

export function bootLog(facts: BootFacts): BootLine[] {
  const { info, now, panes, widgets, metricSources } = facts
  const { host, versions } = info
  const terminals = panes.filter((w) => w === 'terminal').length

  const lines: BootLine[] = [
    { text: `Welcome to elecdex ${info.version}`, strong: true, pause: 500 },
    {
      text: `elecdex kernel ${info.version} boot at ${now.toString()}; ${info.platform}-${info.arch}`,
      pause: 500,
    },
    { text: `electron ${versions.electron} / chromium ${versions.chrome}` },
    { text: `node ${versions.node} / v8 ${versions.v8}` },
    { text: `${host.osRelease} on ${host.hostname}` },
    { text: `cpu: ${host.cpuModel}` },
    { text: `cpu: ${host.cpuThreads} logical processors online` },
    { text: `memory: ${formatBytes(host.totalMemory)} physical` },
    ...Array.from({ length: Math.min(host.cpuThreads, 16) }, (_, i) => ({
      text: `elecdexCPU: ProcessorId=${i + 1} LocalApicId=${i * 2} Enabled`,
    })),
    { text: 'renderer: sandbox=on contextIsolation=on nodeIntegration=off', pause: 400 },
    { text: "csp: default-src 'none'; script-src 'self'" },
    { text: 'bridge: window.elecdex exposed through contextBridge' },
    { text: `pty: ${info.platform === 'win32' ? 'ConPTY' : 'openpty'} backend ready` },
    { text: 'pty: output channel = MessagePort, no TCP listeners' },
    { text: 'shell integration: OSC 7 / OSC 133 armed' },
    { text: `metrics: ${metricSources} sources registered, 0 polling (subscription driven)` },
    { text: 'metrics: collector deferred until first subscriber' },
    ...widgets.map((id) => ({
      text: `widget: mapping ${id.padEnd(12)} at ${hex(addressOf(id))}`,
    })),
    { text: `layout: restoring ${panes.length} panes, ${terminals} terminal(s)`, pause: 300 },
    ...panes.map((widget, i) => ({
      text: `layout: pane ${String(i).padStart(2, '0')} <- ${widget}`,
    })),
    { text: 'fonts: Chakra Petch, Saira Condensed, JetBrains Mono' },
    { text: 'display: grid online, accent calibrated' },
    { text: 'Boot Complete', strong: true, pause: 300 },
  ]
  return lines
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
