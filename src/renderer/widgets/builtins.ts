import type { MetricSourceId } from '@shared/metrics'
import MixerWidget from './audio/MixerWidget.svelte'
import SpectrumWidget from './audio/SpectrumWidget.svelte'
import CalendarWidget from './calendar/CalendarWidget.svelte'
import FilesystemWidget from './filesystem/FilesystemWidget.svelte'
import GlobeWidget from './globe/GlobeWidget.svelte'
import LauncherWidget from './launcher/LauncherWidget.svelte'
import MarketsWidget from './markets/MarketsWidget.svelte'
import ClockWidget from './monitor/ClockWidget.svelte'
import CpuWidget from './monitor/CpuWidget.svelte'
import DiskWidget from './monitor/DiskWidget.svelte'
import MemoryWidget from './monitor/MemoryWidget.svelte'
import NetstatWidget from './monitor/NetstatWidget.svelte'
import SysinfoWidget from './monitor/SysinfoWidget.svelte'
import ThroughputWidget from './monitor/ThroughputWidget.svelte'
import ToplistWidget from './monitor/ToplistWidget.svelte'
import QuakesWidget from './quakes/QuakesWidget.svelte'
import { registerBuiltin } from './registry.ts'
import RssWidget from './rss/RssWidget.svelte'
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
  // Like memory and disk: the pane shows usage, the title need not say so.
  title: 'cpu',
  description: 'Per-core load charts, speed and task count.',
  component: CpuWidget,
  metrics: sources('cpu.info', 'cpu.load', 'cpu.speed', 'cpu.temperature', 'proc.list'),
  minSize: { w: 160, h: 100 },
})

registerBuiltin({
  id: 'memory',
  title: 'memory',
  description: 'Memory and swap in use over the last minute, and now.',
  component: MemoryWidget,
  metrics: sources('mem.usage', 'mem.swap'),
  minSize: { w: 160, h: 80 },
})

registerBuiltin({
  id: 'disk',
  title: 'disk',
  description: 'How full each volume is, and disk read, write and busy time.',
  component: DiskWidget,
  metrics: sources('disk.volumes', 'disk.io'),
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

registerBuiltin({
  id: 'launcher',
  title: 'launcher',
  description:
    'Start applications: the Start Menu (or /Applications, .desktop files) plus your own entries.',
  component: LauncherWidget,
  minSize: { w: 200, h: 120 },
})

registerBuiltin({
  id: 'markets',
  title: 'markets',
  description:
    'Indices, currencies and more from Yahoo Finance, every minute, as sparklines or bars.',
  component: MarketsWidget,
  minSize: { w: 240, h: 160 },
  multiple: true,
})

registerBuiltin({
  id: 'rss',
  title: 'rss',
  description:
    'Headlines from RSS and Atom feeds you list, newest first, checked every 15 minutes.',
  component: RssWidget,
  minSize: { w: 220, h: 120 },
  multiple: true,
})

registerBuiltin({
  id: 'quakes',
  title: 'quakes',
  description:
    'Recent earthquakes in and around Japan from JMA, checked every minute. Alerts are set in settings.',
  component: QuakesWidget,
  minSize: { w: 220, h: 120 },
})

registerBuiltin({
  id: 'calendar',
  title: 'calendar',
  description:
    'The month with today and weekends marked, and optionally Japanese holidays. Scroll to change month.',
  component: CalendarWidget,
  minSize: { w: 180, h: 140 },
})

registerBuiltin({
  id: 'spectrum',
  title: 'spectrum',
  description:
    "A spectrum analyser of the computer's sound, like a car stereo's display. Capture runs only while it shows.",
  component: SpectrumWidget,
  minSize: { w: 200, h: 120 },
})

registerBuiltin({
  id: 'mixer',
  title: 'mixer',
  description: 'The system volume and each app playing sound, with faders, mute and meters.',
  component: MixerWidget,
  minSize: { w: 160, h: 160 },
})
