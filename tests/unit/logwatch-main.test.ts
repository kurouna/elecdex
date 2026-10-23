import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { displayFolder, LogCatalog } from '../../src/main/logwatch/catalog.js'
import { nodeFs } from '../../src/main/logwatch/node-fs.js'
import { registerChosen } from '../../src/main/logwatch/register.js'

/**
 * Main's side of choosing a file: the catalog in log-files.json (ids only ever reach the page),
 * the checks a chosen file passes, and the file system as the service reads it - on real files
 * in a temporary folder.
 */

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'logwatch-main-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const catalog = (home = dir) => new LogCatalog(path.join(dir, 'log-files.json'), home)

describe('LogCatalog', () => {
  it('gives a file one id, and a folder with a pattern another', () => {
    const c = catalog()
    const file = path.join(dir, 'app.log')
    const a = c.add(file, null, 1)
    expect(a.id).toMatch(/^[0-9a-f]{16}$/)
    expect(c.add(file, null, 2).id).toBe(a.id)
    const b = c.add(dir, '*-debug-*.log', 3)
    expect(b.id).not.toBe(a.id)
    expect(c.get(a.id)).toMatchObject({ path: file, pattern: null, format: null })
    expect(c.get('0000000000000000')).toBeNull()
  })

  it('lists the most recently used first, and keeps forty', () => {
    const c = catalog()
    for (let i = 0; i < 45; i++) c.add(path.join(dir, `f${i}.log`), null, i)
    const recent = c.recent()
    expect(recent).toHaveLength(40)
    expect(recent[0]?.name).toBe('f44.log')
    expect(recent.at(-1)?.name).toBe('f5.log')
  })

  it('describes a file for the eye only: name, folder with home as ~, pattern and format', () => {
    const c = catalog(dir)
    const sub = path.join(dir, 'logs')
    const entry = c.add(path.join(sub, 'app.log'), null, 1)
    expect(c.ref(entry)).toEqual({
      id: entry.id,
      name: 'app.log',
      folder: `~${path.sep}logs`,
      path: path.join(sub, 'app.log'),
      pattern: null,
      format: null,
    })
    const followed = c.ref(c.add(sub, 'app-*.log', 2))
    expect(followed).toMatchObject({
      name: 'app-*.log',
      folder: `~${path.sep}logs`,
      path: path.join(sub, 'app-*.log'),
    })
    expect(displayFolder('/elsewhere', dir)).toBe('/elsewhere')
    expect(displayFolder(`${dir}x${path.sep}y`, dir)).toBe(`${dir}x${path.sep}y`)
  })

  it('remembers a format set by hand, and forgets it again', () => {
    const c = catalog()
    const entry = c.add(path.join(dir, 'a.log'), null, 1)
    expect(c.setFormat(entry.id, 'syslog')?.format).toBe('syslog')
    expect(catalog().get(entry.id)?.format).toBe('syslog')
    expect(c.setFormat(entry.id, null)?.format).toBeNull()
    expect(c.setFormat('ffffffffffffffff', 'plain')).toBeNull()
  })

  it('starts empty from a broken file, and drops a broken entry alone', () => {
    writeFileSync(path.join(dir, 'log-files.json'), '{not json')
    expect(catalog().recent()).toEqual([])
    writeFileSync(
      path.join(dir, 'log-files.json'),
      JSON.stringify({
        version: 1,
        files: [
          {
            id: '0123456789abcdef',
            path: path.join(dir, 'a.log'),
            pattern: null,
            format: 'nope',
            lastUsed: 1,
          },
          { id: 'zz', path: 'x', pattern: null, format: null, lastUsed: 2 },
        ],
      }),
    )
    const listed = catalog().recent()
    expect(listed.map((ref) => [ref.id, ref.format])).toEqual([['0123456789abcdef', null]])
  })

  it('writes no log content, only where files are', () => {
    const c = catalog()
    c.add(path.join(dir, 'a.log'), null, 1)
    const written = JSON.parse(readFileSync(path.join(dir, 'log-files.json'), 'utf8'))
    expect(Object.keys(written.files[0]).sort()).toEqual([
      'format',
      'id',
      'lastUsed',
      'path',
      'pattern',
    ])
  })
})

describe('registerChosen', () => {
  it('takes a text file, and follows the newest like it by its name', async () => {
    const file = path.join(dir, '2026-10-12T09_08_16_117Z-debug-0.log')
    writeFileSync(file, 'hello\n')
    const c = catalog()
    const one = await registerChosen(c, file, false, 1)
    expect(one).toMatchObject({ file: { name: path.basename(file), pattern: null } })
    const newest = await registerChosen(c, file, true, 2)
    expect(newest).toMatchObject({ file: { name: '*-debug-*.log', pattern: '*-debug-*.log' } })
  })

  it('refuses what cannot be followed, saying why', async () => {
    const c = catalog()
    expect(await registerChosen(c, path.join(dir, 'none.log'), false, 1)).toEqual({
      problem: 'that file cannot be found',
    })
    const binary = path.join(dir, 'tool.exe')
    writeFileSync(binary, Buffer.from([0x4d, 0x5a, 0, 0, 1, 2, 3]))
    expect(await registerChosen(c, binary, false, 1)).toEqual({
      problem: 'that is not a text file',
    })
    const plain = path.join(dir, 'app.log')
    writeFileSync(plain, 'x\n')
    expect(await registerChosen(c, plain, true, 1)).toEqual({
      problem: 'its name has nothing that changes from file to file: watch it alone',
    })
    expect(await registerChosen(c, dir, false, 1)).toEqual({ problem: 'that file cannot be read' })
    expect(c.recent()).toEqual([])
  })

  it('takes UTF-16 for text, though it has NULs', async () => {
    const file = path.join(dir, 'wide.log')
    writeFileSync(file, Buffer.from('﻿hello\n', 'utf16le'))
    expect(await registerChosen(catalog(), file, false, 1)).toHaveProperty('file')
  })

  it('records the real path, not a link to it', async () => {
    const real = path.join(dir, 'real')
    mkdirSync(real)
    writeFileSync(path.join(real, 'a.log'), 'x\n')
    // A junction needs no privilege on Windows; elsewhere it is a link to the folder. As the
    // system names it: on GitHub's Windows runners the temp folder itself comes as a short 8.3 name.
    const link = path.join(dir, 'link')
    symlinkSync(real, link, 'junction')
    const c = catalog()
    const result = await registerChosen(c, path.join(link, 'a.log'), false, 1)
    if (!result || !('file' in result)) throw new Error('not taken')
    expect(c.get(result.file.id)?.path).toBe(realpathSync.native(path.join(real, 'a.log')))
    expect(result.file.path).toBe(realpathSync.native(path.join(real, 'a.log')))
  })
})

describe('nodeFs', () => {
  it('says what a stat found: a file, nothing, or not a file', async () => {
    const file = path.join(dir, 'a.log')
    writeFileSync(file, 'abc')
    expect(await nodeFs.stat(file)).toMatchObject({ size: 3 })
    expect(await nodeFs.stat(path.join(dir, 'none'))).toEqual({ missing: true })
    expect(await nodeFs.stat(path.join(file, 'below'))).toEqual({ missing: true })
    expect(await nodeFs.stat(dir)).toEqual({ failed: 'not a file' })
  })

  it.skipIf(process.platform === 'win32')(
    'says a file this user may not read is denied',
    async () => {
      const file = path.join(dir, 'secret.log')
      writeFileSync(file, 'x')
      chmodSync(dir, 0o000)
      try {
        const result = await nodeFs.stat(file)
        // root reads anything: then it is simply a file.
        expect('denied' in result || 'size' in result).toBe(true)
      } finally {
        chmodSync(dir, 0o755)
      }
    },
  )

  it('reads a range, fewer bytes at the end, none for nothing', async () => {
    const file = path.join(dir, 'a.log')
    writeFileSync(file, '0123456789')
    expect(new TextDecoder().decode(await nodeFs.read(file, 2, 3))).toBe('234')
    expect(new TextDecoder().decode(await nodeFs.read(file, 8, 10))).toBe('89')
    expect(await nodeFs.read(file, 0, 0)).toHaveLength(0)
    expect(await nodeFs.read(file, 20, 5)).toHaveLength(0)
  })

  it('lists a folder, or says it cannot', async () => {
    writeFileSync(path.join(dir, 'a.log'), '')
    expect(await nodeFs.list(dir)).toEqual(['a.log'])
    expect(await nodeFs.list(path.join(dir, 'none'))).toBeNull()
  })

  it('watches a folder, and gives no watch for one that is not there', async () => {
    const heard: (string | null)[] = []
    const watch = nodeFs.watch(dir, (name) => heard.push(name))
    expect(watch).not.toBeNull()
    writeFileSync(path.join(dir, 'b.log'), 'x')
    for (let i = 0; i < 100 && heard.length === 0; i++) await new Promise((r) => setTimeout(r, 10))
    watch?.close()
    expect(heard).toContain('b.log')
    expect(nodeFs.watch(path.join(dir, 'none'), () => {})).toBeNull()
  })
})
