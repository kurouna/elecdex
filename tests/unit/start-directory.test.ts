import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { resolveShellDirectory, resolveStartDirectory } from '../../src/main/pty/start-directory.js'

const home = path.resolve('/home/user')
const folders = new Set([home, path.resolve('/work'), path.join(home, 'dev')])
const isDirectory = (dir: string) => folders.has(path.normalize(dir))

describe('resolveStartDirectory', () => {
  it('starts at home when nothing is set, blanks included', () => {
    expect(resolveStartDirectory('', home, isDirectory)).toEqual({ path: home, fellBack: false })
    expect(resolveStartDirectory('   ', home, isDirectory)).toEqual({ path: home, fellBack: false })
  })

  it('starts in the folder set, trimmed', () => {
    expect(resolveStartDirectory(` ${path.resolve('/work')} `, home, isDirectory)).toEqual({
      path: path.resolve('/work'),
      fellBack: false,
    })
  })

  it('reads "~" at the start as home, with either slash', () => {
    const dev = { path: path.join(home, 'dev'), fellBack: false }
    expect(resolveStartDirectory('~/dev', home, isDirectory)).toEqual(dev)
    expect(resolveStartDirectory('~\\dev', home, isDirectory)).toEqual(
      path.sep === '\\' ? dev : { path: home, fellBack: true },
    )
    expect(resolveStartDirectory('~', home, isDirectory)).toEqual({ path: home, fellBack: false })
    // Only a "~" of its own: "~user" is not this user's home.
    expect(resolveStartDirectory('~dev', home, isDirectory)).toEqual({ path: home, fellBack: true })
  })

  it('falls back to home, saying so, for a missing folder or a relative path', () => {
    const fallback = { path: home, fellBack: true }
    expect(resolveStartDirectory(path.resolve('/gone'), home, isDirectory)).toEqual(fallback)
    expect(resolveStartDirectory('work', home, isDirectory)).toEqual(fallback)
  })

  describe('on the real file system', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'elecdex-start-'))
    const file = path.join(dir, 'not-a-folder.txt')
    writeFileSync(file, '')
    afterAll(() => rmSync(dir, { recursive: true, force: true }))

    it('takes a folder, and not a file', () => {
      expect(resolveStartDirectory(dir, home)).toEqual({ path: dir, fellBack: false })
      expect(resolveStartDirectory(file, home)).toEqual({ path: home, fellBack: true })
    })

    it('starts a pane in the folder it asked for only while that is a folder', () => {
      const settings = () => home
      expect(resolveShellDirectory(dir, settings)).toBe(dir)
      expect(resolveShellDirectory(file, settings)).toBe(home)
      expect(resolveShellDirectory(path.join(dir, 'gone'), settings)).toBe(home)
    })
  })
})

describe('resolveShellDirectory', () => {
  const settings = () => path.resolve('/work')

  it('starts a new pane, which asks for none, where the settings say', () => {
    expect(resolveShellDirectory(undefined, settings, isDirectory)).toBe(path.resolve('/work'))
  })

  it('starts a pane brought back in its last folder', () => {
    expect(resolveShellDirectory(path.join(home, 'dev'), settings, isDirectory)).toBe(
      path.join(home, 'dev'),
    )
  })

  it('falls back to the settings when the folder has gone or is relative', () => {
    expect(resolveShellDirectory(path.join(home, 'gone'), settings, isDirectory)).toBe(
      path.resolve('/work'),
    )
    expect(resolveShellDirectory('dev', settings, isDirectory)).toBe(path.resolve('/work'))
  })
})
