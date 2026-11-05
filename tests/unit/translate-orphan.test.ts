import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  endOrphan,
  PID_FILE,
  parseProcessName,
  readLeftPid,
  writePid,
} from '../../src/main/translate/orphan'

/** The llama-server a crashed elecdex left behind (docs/translate.md §4.2). */

let dir = ''
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-orphan-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('the pid file', () => {
  it('is written for a running server and removed when none runs', () => {
    const root = path.join(dir, 'translate')
    writePid(root, 1234)
    expect(readFileSync(path.join(root, PID_FILE), 'utf8')).toBe('1234')
    expect(readLeftPid(root)).toBe(1234)
    writePid(root, null)
    expect(readLeftPid(root)).toBeNull()
  })

  it('reads nothing from a file that holds no pid', () => {
    writeFileSync(path.join(dir, PID_FILE), 'not a pid')
    expect(readLeftPid(dir)).toBeNull()
    writeFileSync(path.join(dir, PID_FILE), '-5')
    expect(readLeftPid(dir)).toBeNull()
  })
})

describe('endOrphan', () => {
  it('ends a llama-server, by its name on each platform', async () => {
    for (const name of ['llama-server.exe', 'llama-server', 'LLAMA-SERVER.EXE']) {
      const killed: number[] = []
      const ended = await endOrphan(7, {
        processName: async () => name,
        kill: (p) => killed.push(p),
      })
      expect(ended).toBe(true)
      expect(killed).toEqual([7])
    }
  })

  it('leaves anything else alone: the number may have been given to another process', async () => {
    for (const name of [null, 'notepad.exe', 'llama-server-helper', 'electron.exe']) {
      const killed: number[] = []
      expect(
        await endOrphan(7, { processName: async () => name, kill: (p) => killed.push(p) }),
      ).toBe(false)
      expect(killed).toEqual([])
    }
  })

  it('does nothing without a pid, and survives a question that fails', async () => {
    const ask = async (): Promise<string> => {
      throw new Error('tasklist failed')
    }
    expect(await endOrphan(null, { processName: ask, kill: () => {} })).toBe(false)
    expect(await endOrphan(9, { processName: ask, kill: () => {} })).toBe(false)
  })
})

describe('parseProcessName', () => {
  it('reads tasklist CSV and ps', () => {
    expect(
      parseProcessName('"llama-server.exe","1234","Console","1","1,234,560 K"\r\n', 'win32'),
    ).toBe('llama-server.exe')
    expect(parseProcessName('INFO: No tasks are running which match the criteria.', 'win32')).toBe(
      null,
    )
    expect(parseProcessName('/opt/llama/llama-server\n', 'linux')).toBe('llama-server')
    expect(parseProcessName('', 'darwin')).toBeNull()
  })
})
