import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter'

/**
 * When a test fails, says whether an elecdex is running outside the tests - the installed app
 * or `npm run dev` - since one holds the system-wide shortcut, the window focus and the CPU,
 * and has made launches and drags fail before (2026-10-10: a failed `electron.launch` and a
 * lost tab drag, both passing once that elecdex was closed). The process list is read once a
 * run, at the first failure; every failure is logged with it to test-results/elecdex-running.log.
 */

export interface ProcessRow {
  pid: number
  name: string
  command: string
}

/** The elecdex instances among `rows` that no test launched (a test's has an elecdex-e2e- profile). */
export function foreignElecdex(rows: readonly ProcessRow[]): ProcessRow[] {
  return rows.filter((row) => {
    const name = row.name.toLowerCase()
    const command = row.command.toLowerCase()
    if (command.includes('elecdex-e2e-')) return false
    if (name === 'elecdex.exe' || name === 'elecdex') return true
    // A development run: Electron started on this project's main bundle or by electron-vite.
    return (name === 'electron.exe' || name === 'electron') && command.includes('elecdex')
  })
}

function listProcesses(): ProcessRow[] {
  if (process.platform === 'win32') {
    const script =
      "Get-CimInstance Win32_Process -Filter \"Name='elecdex.exe' or Name='electron.exe'\" | " +
      'Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress'
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      {
        encoding: 'utf8',
        timeout: 15_000,
      },
    ).trim()
    if (out === '') return []
    const parsed = JSON.parse(out) as
      | { ProcessId: number; Name: string; CommandLine: string | null }
      | { ProcessId: number; Name: string; CommandLine: string | null }[]
    return (Array.isArray(parsed) ? parsed : [parsed]).map((p) => ({
      pid: p.ProcessId,
      name: p.Name,
      command: p.CommandLine ?? '',
    }))
  }
  const out = execFileSync('ps', ['-axo', 'pid=,comm=,args='], {
    encoding: 'utf8',
    timeout: 15_000,
  })
  return out
    .split('\n')
    .map((line) => line.trim().match(/^(\d+)\s+(\S+)\s+(.*)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ pid: Number(m[1]), name: path.basename(m[2] ?? ''), command: m[3] ?? '' }))
}

export default class ElecdexRunningReporter implements Reporter {
  #found: ProcessRow[] | string | null = null

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'passed' || result.status === 'skipped') return
    if (this.#found === null) {
      try {
        this.#found = foreignElecdex(listProcesses())
      } catch (error) {
        this.#found = `could not read the process list: ${String(error)}`
      }
    }
    const found = this.#found
    const said =
      typeof found === 'string'
        ? found
        : found.length === 0
          ? 'no elecdex is running outside the tests'
          : `an elecdex is running outside the tests - close it and run the failed tests again: ${found
              .map((p) => `${p.name} (pid ${p.pid})`)
              .join(', ')}`
    if (typeof found !== 'string' && found.length > 0) console.warn(`[e2e] ${said}`)
    const dir = path.join(process.cwd(), 'test-results')
    mkdirSync(dir, { recursive: true })
    appendFileSync(
      path.join(dir, 'elecdex-running.log'),
      `${new Date().toISOString()} ${test.titlePath().filter(Boolean).join(' > ')} [${result.status}]: ${said}\n`,
    )
  }
}
