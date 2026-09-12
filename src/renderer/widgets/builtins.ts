import PlaceholderWidget from './PlaceholderWidget.svelte'
import { registerBuiltin } from './registry.ts'
import TerminalWidget from './terminal/TerminalWidget.svelte'

/**
 * Registers the built-in widgets.
 *
 * Imported once for its side effect, before the layout is rendered. The
 * monitoring entries are placeholders whose real implementations arrive in
 * phase 3; the layout engine treats them identically either way, which is the
 * point of the registry.
 */

registerBuiltin({
  id: 'terminal',
  title: 'terminal',
  component: TerminalWidget,
  minSize: { w: 240, h: 120 },
  multiple: true,
})

const pending: Array<{ id: string; title: string; metrics: readonly string[] }> = [
  { id: 'clock', title: 'clock', metrics: [] },
  { id: 'sysinfo', title: 'system', metrics: ['os.uptime', 'power.battery'] },
  { id: 'cpu', title: 'cpu usage', metrics: ['cpu.load', 'cpu.temperature'] },
  { id: 'memory', title: 'memory', metrics: ['mem.usage'] },
  { id: 'toplist', title: 'top processes', metrics: ['proc.list'] },
  { id: 'netstat', title: 'network status', metrics: ['net.interface', 'net.ping'] },
  { id: 'throughput', title: 'network traffic', metrics: ['net.throughput'] },
  { id: 'globe', title: 'world view', metrics: ['net.connections'] },
  { id: 'filesystem', title: 'filesystem', metrics: [] },
]

for (const entry of pending) {
  registerBuiltin({
    id: entry.id,
    title: entry.title,
    component: PlaceholderWidget,
    metrics: entry.metrics,
    minSize: { w: 120, h: 60 },
  })
}
