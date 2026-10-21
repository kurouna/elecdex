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

  it('never starts on a network share, and says it fell back (review)', () => {
    // Found in review: the setting, which a page can write, was looked at with a synchronous
    // stat on main - an offer of the user's NTLM hash, and a hold if the share does not answer.
    const looked: string[] = []
    const look = (dir: string) => {
      looked.push(dir)
      return true
    }
    for (const share of ['\\\\server\\share', '//server/share']) {
      // Said as a share, so the settings do not call an existing share "not a folder".
      expect(resolveStartDirectory(share, home, look)).toEqual({
        path: home,
        fellBack: true,
        share: true,
      })
    }
    expect(looked).toEqual([])
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

    it('starts a pane in the folder it asked for only while that is a folder', async () => {
      const settings = () => home
      expect(await resolveShellDirectory(dir, settings)).toBe(dir)
      expect(await resolveShellDirectory(file, settings)).toBe(home)
      expect(await resolveShellDirectory(path.join(dir, 'gone'), settings)).toBe(home)
    })
  })
})

describe('resolveShellDirectory', () => {
  const settings = () => path.resolve('/work')
  const answers = async (dir: string) => isDirectory(dir)

  it('starts a new pane, which asks for none, where the settings say', async () => {
    expect(await resolveShellDirectory(undefined, settings, answers)).toBe(path.resolve('/work'))
  })

  it('starts a pane brought back in its last folder', async () => {
    expect(await resolveShellDirectory(path.join(home, 'dev'), settings, answers)).toBe(
      path.join(home, 'dev'),
    )
  })

  it('falls back to the settings when the folder has gone or is relative', async () => {
    expect(await resolveShellDirectory(path.join(home, 'gone'), settings, answers)).toBe(
      path.resolve('/work'),
    )
    expect(await resolveShellDirectory('dev', settings, answers)).toBe(path.resolve('/work'))
  })

  it('never looks at a network share it was left in', async () => {
    // Found in a security review: the folder came from what the shell printed, so a share
    // named in any output was looked at again on every start, offering the user's NTLM hash.
    const looked: string[] = []
    const look = async (dir: string) => {
      looked.push(dir)
      return true
    }
    for (const share of ['\\\\server\\share', '//server/share', '\\\\?\\UNC\\server\\share']) {
      expect(await resolveShellDirectory(share, settings, look)).toBe(path.resolve('/work'))
    }
    expect(looked).toEqual([])
  })

  it('does not wait on a folder that never answers, nor fail on one that throws', async () => {
    // A share whose server has gone: the look neither ends nor fails.
    const never = () => new Promise<boolean>(() => {})
    const started = Date.now()
    expect(await resolveShellDirectory(path.join(home, 'dev'), settings, never, 50)).toBe(
      path.resolve('/work'),
    )
    expect(Date.now() - started).toBeLessThan(1000)
    const throws = () => Promise.reject(new Error('EIO'))
    expect(await resolveShellDirectory(path.join(home, 'dev'), settings, throws)).toBe(
      path.resolve('/work'),
    )
  })
})
