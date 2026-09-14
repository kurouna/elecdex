import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  extractWindowsIcons,
  ICON_BATCH_MAX,
  IconBatcher,
  parseIconLines,
} from '../../src/main/launcher/windows-icons.js'

const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

describe('parseIconLines', () => {
  it('turns each PNG line into a data URL, and "-" or anything else into no icon', () => {
    expect(parseIconLines(`${PNG}\r\n-\r\nnot base64 at all!\r\n`, 3)).toEqual([
      `data:image/png;base64,${PNG}`,
      null,
      null,
    ])
  })

  it('gives no icons when the lines no longer match the paths', () => {
    expect(parseIconLines(`${PNG}\n`, 2)).toEqual([null, null])
    expect(parseIconLines('', 1)).toEqual([null])
  })
})

describe('extractWindowsIcons', () => {
  it('sends each path as base64 UTF-8 on its own line, never in the script', async () => {
    const run = vi.fn(async (_script: string, _input: string) => `${PNG}\n-\n`)
    const files = ['C:\\Users\\テスト\\Start Menu\\Excel.lnk', 'C:\\x\\"; Remove-Item *; ".lnk']
    expect(await extractWindowsIcons(files, run)).toEqual([`data:image/png;base64,${PNG}`, null])
    const [script, input] = run.mock.calls[0] as [string, string]
    const lines = input.trimEnd().split('\n')
    expect(lines.map((line) => Buffer.from(line, 'base64').toString('utf8'))).toEqual(files)
    for (const file of files) expect(script).not.toContain(file)
  })

  it('runs nothing for no paths', async () => {
    const run = vi.fn(async () => '')
    expect(await extractWindowsIcons([], run)).toEqual([])
    expect(run).not.toHaveBeenCalled()
  })
})

describe('IconBatcher', () => {
  const settle = () => new Promise((resolve) => setTimeout(resolve, 5))

  it('answers requests arriving together from one run, asking once per file', async () => {
    const extract = vi.fn(async (files: readonly string[]) => files.map((f) => `icon:${f}`))
    const batcher = new IconBatcher(extract, 1)
    const answers = await Promise.all([batcher.get('a'), batcher.get('b'), batcher.get('a')])
    expect(answers).toEqual(['icon:a', 'icon:b', 'icon:a'])
    expect(extract).toHaveBeenCalledTimes(1)
    expect(extract).toHaveBeenCalledWith(['a', 'b'])
  })

  it('splits a large request into batches that run one at a time', async () => {
    let running = 0
    let most = 0
    const extract = vi.fn(async (files: readonly string[]) => {
      running += 1
      most = Math.max(most, running)
      await settle()
      running -= 1
      return files.map((f) => f)
    })
    const batcher = new IconBatcher(extract, 1)
    const files = Array.from({ length: ICON_BATCH_MAX * 2 + 1 }, (_, i) => `f${i}`)
    expect(await Promise.all(files.map((f) => batcher.get(f)))).toEqual(files)
    expect(extract.mock.calls.map(([batch]) => batch.length)).toEqual([
      ICON_BATCH_MAX,
      ICON_BATCH_MAX,
      1,
    ])
    expect(most).toBe(1)
  })

  it('a request arriving during a run goes in the next batch', async () => {
    const extract = vi.fn(async (files: readonly string[]) => {
      await settle()
      return files.map((f) => f)
    })
    const batcher = new IconBatcher(extract, 1)
    const first = batcher.get('a')
    await new Promise((resolve) => setTimeout(resolve, 2))
    const second = batcher.get('b')
    expect(await Promise.all([first, second])).toEqual(['a', 'b'])
    expect(extract.mock.calls).toEqual([[['a']], [['b']]])
  })

  it('a failed run answers null, and the next request tries again', async () => {
    const extract = vi
      .fn<(files: readonly string[]) => Promise<Array<string | null>>>()
      .mockRejectedValueOnce(new Error('PowerShell blocked'))
      .mockResolvedValueOnce(['icon'])
    const batcher = new IconBatcher(extract, 1)
    expect(await batcher.get('a')).toBeNull()
    expect(await batcher.get('a')).toBe('icon')
  })
})

describe.runIf(process.platform === 'win32')('the Windows shell (real PowerShell)', () => {
  const system32 = path.win32.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32')

  it('draws each program its own icon, where getFileIcon gave these two the same generic one', async () => {
    const [taskmgr, magnify, missing] = await extractWindowsIcons([
      path.win32.join(system32, 'taskmgr.exe'),
      path.win32.join(system32, 'magnify.exe'),
      path.win32.join(system32, 'no-such-program.exe'),
    ])
    expect(taskmgr).toMatch(/^data:image\/png;base64,iVBORw0KGgo/)
    expect(magnify).toMatch(/^data:image\/png;base64,iVBORw0KGgo/)
    expect(taskmgr).not.toBe(magnify)
    // A missing file has the generic program icon, not an error that loses the batch.
    expect(missing ?? 'data:image/png').toMatch(/^data:image\/png/)
  }, 30_000)
})
