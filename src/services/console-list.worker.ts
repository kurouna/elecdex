/**
 * The processes attached to a shell's console, run as an Electron utilityProcess.
 *
 * node-pty's ConPTY kill finds what a shell started - to end it with the shell - by
 * attaching to the shell's console, which only a process with no console of its own can do.
 * It forks node-pty's agent for that, but the packaged app turns the runAsNode fuse off and
 * Electron then refuses `child_process.fork` (main/pty/console-list.ts). This does the
 * agent's work in a utility process instead, with node-pty's own native module.
 *
 * Protocol, over process.parentPort, once:
 *   parent -> child  { pids }                       the shells' process ids
 *   child -> parent  { [pid]: number[] }            each shell's console process list
 */
import { createRequire } from 'node:module'

interface ConsoleList {
  getConsoleProcessList(pid: number): number[]
}

const port = process.parentPort
if (!port) {
  throw new Error('console-list.worker must be started with utilityProcess.fork()')
}

const require = createRequire(import.meta.url)
const { loadNativeModule } = require('node-pty/lib/utils') as {
  loadNativeModule(name: string): { module: ConsoleList }
}

port.once('message', ({ data }: { data: { pids: number[] } }) => {
  const native = loadNativeModule('conpty_console_list').module
  const lists: Record<number, number[]> = {}
  for (const pid of data.pids) {
    try {
      lists[pid] = native.getConsoleProcessList(pid)
    } catch {
      // A console that has gone already: the shell alone, as node-pty's agent answers then.
      lists[pid] = [pid]
    }
  }
  port.postMessage(lists)
  process.exit(0)
})
