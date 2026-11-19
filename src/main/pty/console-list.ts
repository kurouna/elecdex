import { fileURLToPath } from 'node:url'
import { utilityProcess } from 'electron'
import type { IPty } from 'node-pty'

/**
 * Ending what runs in a shell when its pane closes.
 *
 * node-pty's ConPTY kill fetches the console's process list - the shell and what it started,
 * a dev server for one - and kills each process on it. It fetches the list by forking an agent
 * with `child_process.fork`, which Electron refuses once the runAsNode fuse is off, as it is in
 * the packaged app: every close was an unhandled rejection, and the list never came. (Windows
 * 11's ConPTY ended a node started in the shell as it closed even so - packaged-smoke checks
 * both - so what is left for the list is what a console's close does not end.)
 * The agent's one method is given a utilityProcess to ask instead (services/console-list.worker),
 * so node-pty's kill goes on as it was written. A node-pty without that method (another
 * platform, winpty, a later version that changed it) is left alone.
 */

const WORKER = fileURLToPath(new URL('./console-list.worker.js', import.meta.url))

/** As node-pty's agent: past this the shell alone is killed, which is its own answer then. */
const ANSWER_MS = 5000

interface ConsoleAgent {
  _innerPid: number
  _getConsoleProcessList: () => Promise<number[]>
}

/** Points a ConPTY session's console-list lookup at the utilityProcess. */
export function listConsoleOutOfProcess(pty: IPty): void {
  const agent = (pty as unknown as { _agent?: Partial<ConsoleAgent> })._agent
  if (typeof agent?._getConsoleProcessList !== 'function') return
  agent._getConsoleProcessList = () => consoleProcessList(agent._innerPid ?? pty.pid)
}

/**
 * Set once the app quits (`listConsolesNoMore`): every shell is closed on the way out, and a
 * utility process started then held the quit up and was left behind. The shell alone is
 * killed then, as node-pty does when no list comes; ConPTY's close ends what is on its console.
 */
let quitting = false

/** The utility processes still asked for a list. */
const running = new Set<Electron.UtilityProcess>()

/**
 * From now on, a console's list is its shell alone: the app is quitting. A list still being asked
 * is ended, and the quit waits for it to go (null when none runs): shells closed by a layout
 * switch a moment before left one unanswered on a CI runner, and the app crashed after node's
 * exit with it still running (0xC0000409, found 2026-11-19 by a trace of the quit).
 */
export function listConsolesNoMore(): Promise<void> | null {
  quitting = true
  if (running.size === 0) return null
  const gone = [...running].map(
    (child) => new Promise<void>((resolve) => child.once('exit', () => resolve())),
  )
  for (const child of running) child.kill()
  return Promise.all(gone).then(() => {})
}

/** The shells asked about in this turn: closed together, as a layout switch closes them. */
let batch: { pids: number[]; answered: Promise<Map<number, number[]>> } | null = null

/** A shell's console process list, asked with the others closed in the same turn. */
export function consoleProcessList(pid: number): Promise<number[]> {
  if (quitting) return Promise.resolve([pid])
  if (batch === null) {
    const pids: number[] = []
    const answered = new Promise<Map<number, number[]>>((resolve) => {
      queueMicrotask(() => {
        batch = null
        void ask(pids).then(resolve)
      })
    })
    batch = { pids, answered }
  }
  batch.pids.push(pid)
  return batch.answered.then((lists) => lists.get(pid) ?? [pid])
}

/** Asks one utility process for every shell's list; each shell alone when it cannot answer. */
function ask(pids: readonly number[]): Promise<Map<number, number[]>> {
  const alone = new Map(pids.map((pid) => [pid, [pid]]))
  return new Promise((resolve) => {
    let child: Electron.UtilityProcess
    try {
      child = utilityProcess.fork(WORKER, [], { serviceName: 'elecdex console list' })
    } catch {
      resolve(alone)
      return
    }
    running.add(child)
    child.once('exit', () => running.delete(child))
    const timer = setTimeout(() => {
      child.kill()
      resolve(alone)
    }, ANSWER_MS)
    child.once('message', (lists: Record<number, number[]>) => {
      clearTimeout(timer)
      resolve(new Map(pids.map((pid) => [pid, lists[pid] ?? [pid]])))
    })
    // Gone without a word (it failed to load the native module): the shell alone.
    child.once('exit', () => {
      clearTimeout(timer)
      resolve(alone)
    })
    child.postMessage({ pids })
  })
}
