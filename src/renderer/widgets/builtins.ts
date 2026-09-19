import type { MetricSourceId } from '@shared/metrics'
import { WEB_PRESETS, webWidgetId } from '@shared/web'
import MixerWidget from './audio/MixerWidget.svelte'
import SpectrumWidget from './audio/SpectrumWidget.svelte'
import CalcWidget from './calc/CalcWidget.svelte'
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
import NotesWidget from './notes/NotesWidget.svelte'
import QuakesWidget from './quakes/QuakesWidget.svelte'
import { registerBuiltin } from './registry.ts'
import RssWidget from './rss/RssWidget.svelte'
import TerminalWidget from './terminal/TerminalWidget.svelte'
import TimerWidget from './timer/TimerWidget.svelte'
import TodoWidget from './todo/TodoWidget.svelte'
import WeatherWidget from './weather/WeatherWidget.svelte'
import WebWidget from './web/WebWidget.svelte'

/**
 * Registers the built-in widgets.
 *
 * `zoom` says whether a widget is brought to the front of the workspace and how
 * big it is then (layout/pane-zoom.ts). It is left out for the system strip and
 * the network status on purpose: both are a handful of figures on one or two
 * rows, and a pane of nothing around them is worse than the pane they came from.
 *
 * Imported once for its side effect, before the layout is rendered. Each
 * monitoring widget declares the metric sources it reads; PaneHost subscribes to
 * those - all of them while it is visible, only `keepWhileHidden` while it is a
 * tab behind another - which is what lets the collector stop polling anything no
 * visible widget needs.
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
  zoom: 'full',
})

registerBuiltin({
  id: 'clock',
  title: 'clock',
  description: 'The time, large.',
  headless: true,
  component: ClockWidget,
  minSize: { w: 120, h: 40 },
  zoom: 'full',
})

registerBuiltin({
  id: 'sysinfo',
  title: 'system',
  description: 'Date, uptime, OS, power and hardware.',
  headless: true,
  component: SysinfoWidget,
  metrics: sources('os.uptime', 'os.info', 'power.battery', 'hardware.system'),
  keepWhileHidden: sources('os.info', 'hardware.system'),
  minSize: { w: 160, h: 60 },
})

registerBuiltin({
  id: 'cpu',
  // Like memory and disk: the pane shows usage, the title need not say so.
  title: 'cpu',
  description: 'Per-core load charts, speed and task count.',
  component: CpuWidget,
  metrics: sources('cpu.info', 'cpu.load', 'cpu.speed', 'cpu.temperature', 'proc.list'),
  keepWhileHidden: sources('cpu.info', 'cpu.load'),
  minSize: { w: 160, h: 100 },
  zoom: 'full',
})

registerBuiltin({
  id: 'memory',
  title: 'memory',
  description: 'Memory and swap in use over the last minute, and now.',
  component: MemoryWidget,
  metrics: sources('mem.usage', 'mem.swap'),
  // The swap line carries mem.swap forward on mem.usage's clock: both are charted.
  keepWhileHidden: sources('mem.usage', 'mem.swap'),
  minSize: { w: 160, h: 80 },
  zoom: 'full',
})

registerBuiltin({
  id: 'disk',
  title: 'disk',
  description: 'How full each volume is, and disk read, write and busy time.',
  component: DiskWidget,
  metrics: sources('disk.volumes', 'disk.io'),
  minSize: { w: 160, h: 80 },
  zoom: 'panel',
})

registerBuiltin({
  id: 'toplist',
  title: 'top processes',
  description: 'The busiest processes.',
  component: ToplistWidget,
  metrics: sources('proc.list'),
  minSize: { w: 160, h: 80 },
  zoom: 'panel',
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
  keepWhileHidden: sources('net.throughput'),
  minSize: { w: 160, h: 100 },
  zoom: 'full',
})

registerBuiltin({
  id: 'filesystem',
  title: 'filesystem',
  description: "The followed terminal's directory; click to cd or insert a path.",
  component: FilesystemWidget,
  minSize: { w: 200, h: 100 },
  zoom: 'full',
})

registerBuiltin({
  id: 'weather',
  title: 'weather',
  description: 'JMA forecast for a chosen area (出典：気象庁ホームページ).',
  component: WeatherWidget,
  minSize: { w: 200, h: 120 },
  multiple: true,
  zoom: 'full',
})

registerBuiltin({
  id: 'globe',
  title: 'world view',
  description:
    'Where network connections go, on a globe. GeoIP is bundled; nothing is looked up online.',
  component: GlobeWidget,
  metrics: sources('net.connections', 'net.ping'),
  minSize: { w: 160, h: 160 },
  zoom: 'full',
})

registerBuiltin({
  id: 'launcher',
  title: 'launcher',
  description:
    'Start applications: the Start Menu (or /Applications, .desktop files) plus your own entries.',
  component: LauncherWidget,
  minSize: { w: 200, h: 120 },
  zoom: 'full',
})

registerBuiltin({
  id: 'markets',
  title: 'markets',
  description:
    'Indices, currencies and more from Yahoo Finance, every minute, as sparklines or bars.',
  component: MarketsWidget,
  minSize: { w: 240, h: 160 },
  multiple: true,
  zoom: 'full',
})

registerBuiltin({
  id: 'rss',
  title: 'rss',
  description:
    'Headlines from RSS and Atom feeds you list, newest first, checked every 15 minutes.',
  component: RssWidget,
  minSize: { w: 220, h: 120 },
  multiple: true,
  zoom: 'full',
})

registerBuiltin({
  id: 'quakes',
  title: 'quakes',
  description:
    'Recent earthquakes in and around Japan from JMA, checked every minute. Alerts are set in settings.',
  component: QuakesWidget,
  minSize: { w: 220, h: 120 },
  zoom: 'full',
})

registerBuiltin({
  id: 'calendar',
  title: 'calendar',
  description:
    'The month with today and weekends marked, and optionally Japanese holidays. Scroll to change month.',
  component: CalendarWidget,
  minSize: { w: 180, h: 140 },
  zoom: 'full',
})

registerBuiltin({
  id: 'spectrum',
  title: 'spectrum',
  description:
    "A spectrum analyser of the computer's sound, like a car stereo's display. Capture runs only while it shows.",
  component: SpectrumWidget,
  minSize: { w: 200, h: 120 },
  zoom: 'full',
})

registerBuiltin({
  id: 'mixer',
  title: 'mixer',
  description: 'The system volume and each app playing sound, with faders, mute and meters.',
  component: MixerWidget,
  minSize: { w: 160, h: 160 },
  zoom: 'panel',
})

registerBuiltin({
  id: 'calc',
  title: 'calculator',
  description:
    'A calculator you type into: full-width digits, 3百万, units and constants, with a tape - and a tally for a column of numbers.',
  component: CalcWidget,
  minSize: { w: 200, h: 160 },
  multiple: true,
  zoom: 'panel',
})

registerBuiltin({
  id: 'notes',
  title: 'notes',
  description:
    'Plain text that saves itself, kept in notes.json. Ctrl+= works out the sum under the caret.',
  component: NotesWidget,
  minSize: { w: 200, h: 140 },
  multiple: true,
  zoom: 'full',
})

registerBuiltin({
  id: 'todo',
  title: 'tasks',
  description:
    'A list with deadlines drawn as meters. Reminders are scheduled in the app, so they arrive with the pane closed.',
  component: TodoWidget,
  minSize: { w: 240, h: 180 },
  multiple: true,
  zoom: 'full',
})

registerBuiltin({
  id: 'timer',
  title: 'timer',
  description:
    'A stopwatch whose laps stack up like a spectrum, and a countdown that burns down a ladder.',
  component: TimerWidget,
  minSize: { w: 180, h: 140 },
  multiple: true,
  zoom: 'panel',
})

// A web pane per preset (shared/web.ts): the browser, and a pane per site.
for (const preset of WEB_PRESETS) {
  registerBuiltin({
    id: webWidgetId(preset),
    title: preset.title,
    description: preset.description,
    component: WebWidget,
    minSize: { w: 240, h: 160 },
    multiple: true,
    zoom: 'full',
    ...(preset.unlisted === true ? { unlisted: true } : {}),
  })
}
