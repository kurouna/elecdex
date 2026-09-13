import type { MetricSourceId } from '@shared/metrics'
import ClockWidget from './monitor/ClockWidget.svelte'
import CpuWidget from './monitor/CpuWidget.svelte'
import MemoryWidget from './monitor/MemoryWidget.svelte'
import NetstatWidget from './monitor/NetstatWidget.svelte'
import SysinfoWidget from './monitor/SysinfoWidget.svelte'
import ThroughputWidget from './monitor/ThroughputWidget.svelte'
import ToplistWidget from './monitor/ToplistWidget.svelte'
import PlaceholderWidget from './PlaceholderWidget.svelte'
import { registerBuiltin } from './registry.ts'
import TerminalWidget from './terminal/TerminalWidget.svelte'

/**
 * Registers the built-in widgets.
 *
 * Imported once for its side effect, before the layout is rendered. Each
 * monitoring widget declares the metric sources it reads; PaneHost subscribes to
 * exactly those for as long as the pane exists, which is what lets the collector
 * stop polling anything no visible widget needs.
 */

const sources = (...ids: MetricSourceId[]): readonly MetricSourceId[] => ids

registerBuiltin({
  id: 'terminal',
  title: 'terminal',
  chrome: 'shell',
  component: TerminalWidget,
  minSize: { w: 240, h: 120 },
  multiple: true,
})

registerBuiltin({
  id: 'clock',
  title: 'clock',
  headless: true,
  component: ClockWidget,
  minSize: { w: 120, h: 40 },
})

registerBuiltin({
  id: 'sysinfo',
  title: 'system',
  headless: true,
  component: SysinfoWidget,
  metrics: sources('os.uptime', 'os.info', 'power.battery', 'hardware.system'),
  minSize: { w: 160, h: 60 },
})

registerBuiltin({
  id: 'cpu',
  title: 'cpu usage',
  component: CpuWidget,
  metrics: sources('cpu.info', 'cpu.load', 'cpu.speed', 'cpu.temperature', 'proc.list'),
  minSize: { w: 160, h: 100 },
})

registerBuiltin({
  id: 'memory',
  title: 'memory',
  component: MemoryWidget,
  metrics: sources('mem.usage', 'mem.swap'),
  minSize: { w: 160, h: 80 },
})

registerBuiltin({
  id: 'toplist',
  title: 'top processes',
  component: ToplistWidget,
  metrics: sources('proc.list'),
  minSize: { w: 160, h: 80 },
})

registerBuiltin({
  id: 'netstat',
  title: 'network status',
  component: NetstatWidget,
  metrics: sources('net.interface', 'net.ping'),
  minSize: { w: 160, h: 50 },
})

registerBuiltin({
  id: 'throughput',
  title: 'network traffic',
  component: ThroughputWidget,
  metrics: sources('net.throughput', 'net.ping'),
  minSize: { w: 160, h: 100 },
})

// Placeholders for widgets whose phases have not landed yet: the globe arrives
// with GeoIP in phase 6, the filesystem browser in phase 4.
registerBuiltin({ id: 'globe', title: 'world view', component: PlaceholderWidget })
registerBuiltin({ id: 'filesystem', title: 'filesystem', component: PlaceholderWidget })
