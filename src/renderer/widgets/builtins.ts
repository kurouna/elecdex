import type { MetricSourceId } from '@shared/metrics'
import FilesystemWidget from './filesystem/FilesystemWidget.svelte'
import GlobeWidget from './globe/GlobeWidget.svelte'
import ClockWidget from './monitor/ClockWidget.svelte'
import CpuWidget from './monitor/CpuWidget.svelte'
import MemoryWidget from './monitor/MemoryWidget.svelte'
import NetstatWidget from './monitor/NetstatWidget.svelte'
import SysinfoWidget from './monitor/SysinfoWidget.svelte'
import ThroughputWidget from './monitor/ThroughputWidget.svelte'
import ToplistWidget from './monitor/ToplistWidget.svelte'
import { registerBuiltin } from './registry.ts'
import TerminalWidget from './terminal/TerminalWidget.svelte'
import WeatherWidget from './weather/WeatherWidget.svelte'

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
  description: 'An interactive shell. Any number can be open.',
  chrome: 'shell',
  component: TerminalWidget,
  minSize: { w: 240, h: 120 },
  multiple: true,
})

registerBuiltin({
  id: 'clock',
  title: 'clock',
  description: 'The time, large.',
  headless: true,
  component: ClockWidget,
  minSize: { w: 120, h: 40 },
})

registerBuiltin({
  id: 'sysinfo',
  title: 'system',
  description: 'Date, uptime, OS, power and hardware.',
  headless: true,
  component: SysinfoWidget,
  metrics: sources('os.uptime', 'os.info', 'power.battery', 'hardware.system'),
  minSize: { w: 160, h: 60 },
})

registerBuiltin({
  id: 'cpu',
  title: 'cpu usage',
  description: 'Per-core load charts, speed and task count.',
  component: CpuWidget,
  metrics: sources('cpu.info', 'cpu.load', 'cpu.speed', 'cpu.temperature', 'proc.list'),
  minSize: { w: 160, h: 100 },
})

registerBuiltin({
  id: 'memory',
  title: 'memory',
  description: 'Memory in use as a field of dots, and swap.',
  component: MemoryWidget,
  metrics: sources('mem.usage', 'mem.swap'),
  minSize: { w: 160, h: 80 },
})

registerBuiltin({
  id: 'toplist',
  title: 'top processes',
  description: 'The busiest processes.',
  component: ToplistWidget,
  metrics: sources('proc.list'),
  minSize: { w: 160, h: 80 },
})

registerBuiltin({
  id: 'netstat',
  title: 'network status',
  description: 'Connection state, address and ping.',
  component: NetstatWidget,
  metrics: sources('net.interface', 'net.ping'),
  minSize: { w: 160, h: 50 },
})

registerBuiltin({
  id: 'throughput',
  title: 'network traffic',
  description: 'Upload and download traffic over time.',
  component: ThroughputWidget,
  metrics: sources('net.throughput', 'net.ping'),
  minSize: { w: 160, h: 100 },
})

registerBuiltin({
  id: 'filesystem',
  title: 'filesystem',
  description: "The followed terminal's directory; click to cd or insert a path.",
  component: FilesystemWidget,
  minSize: { w: 200, h: 100 },
})

registerBuiltin({
  id: 'weather',
  title: 'weather',
  description: 'JMA forecast for a chosen area (出典：気象庁ホームページ).',
  component: WeatherWidget,
  minSize: { w: 200, h: 120 },
  multiple: true,
})

registerBuiltin({
  id: 'globe',
  title: 'world view',
  description:
    'Where network connections go, on a globe. GeoIP is bundled; nothing is looked up online.',
  component: GlobeWidget,
  metrics: sources('net.connections', 'net.ping'),
  minSize: { w: 160, h: 160 },
})
