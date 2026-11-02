import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type DrawnIcon, ICON_MAX_AGE_MS, IconStore } from '../../src/main/launcher/icon-store.js'

/**
 * Launcher icons on disk: an icon drawn once is read back on the next start
 * without drawing it again, and only an icon drawn the platform's own way is
 * written down.
 */

const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const ICON = `data:image/png;base64,${PNG}`
const ID = '0123456789abcdef'
const OTHER = 'fedcba9876543210'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'elecdex-icons-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const drawing = (answer: DrawnIcon | Error) =>
  vi.fn(async (_target: string): Promise<DrawnIcon> => {
    if (answer instanceof Error) throw answer
    return answer
  })

/** A store as a new start of elecdex makes it: nothing in memory, the folder as it was left. */
const store = (draw: (target: string) => Promise<DrawnIcon>, now?: () => number) =>
  new IconStore(now === undefined ? { dir, draw } : { dir, draw, now })

describe('IconStore', () => {
  it('draws an icon once, writes it down, and the next start reads it without drawing', async () => {
    const draw = drawing({ icon: ICON, keep: true })
    expect(await store(draw).get(ID, 'C:\\a.lnk')).toBe(ICON)
    expect(draw).toHaveBeenCalledWith('C:\\a.lnk')
    expect(readdirSync(dir)).toEqual([`${ID}.png`])

    const again = drawing({ icon: null, keep: false })
    expect(await store(again).get(ID, 'C:\\a.lnk')).toBe(ICON)
    expect(again).not.toHaveBeenCalled()
  })

  it('asks once for requests arriving together, and then answers from memory', async () => {
    const draw = drawing({ icon: ICON, keep: true })
    const icons = store(draw)
    expect(await Promise.all([icons.get(ID, 't'), icons.get(ID, 't')])).toEqual([ICON, ICON])
    expect(await icons.get(ID, 't')).toBe(ICON)
    expect(draw).toHaveBeenCalledTimes(1)
  })

  it('keeps "no icon" and a fallback icon in memory only, so the next start asks again', async () => {
    const none = drawing({ icon: null, keep: false })
    const first = store(none)
    expect(await first.get(ID, 't')).toBeNull()
    expect(await first.get(ID, 't')).toBeNull()
    expect(none).toHaveBeenCalledTimes(1)

    const fallback = drawing({ icon: ICON, keep: false })
    expect(await store(fallback).get(OTHER, 't')).toBe(ICON)
    expect(readdirSync(dir)).toEqual([])

    const later = drawing({ icon: ICON, keep: true })
    expect(await store(later).get(ID, 't')).toBe(ICON)
    expect(later).toHaveBeenCalledTimes(1)
  })

  it('writes nothing for a drawing that failed, and tries again on the next request', async () => {
    const draw = vi
      .fn<(target: string) => Promise<DrawnIcon>>()
      .mockRejectedValueOnce(new Error('PowerShell blocked'))
      .mockResolvedValueOnce({ icon: ICON, keep: true })
    const icons = store(draw)
    expect(await icons.get(ID, 't')).toBeNull()
    expect(readdirSync(dir)).toEqual([])
    expect(await icons.get(ID, 't')).toBe(ICON)
  })

  it('draws again an icon older than a month, and one that is not a PNG', async () => {
    await store(drawing({ icon: ICON, keep: true })).get(ID, 't')
    const written = statSync(path.join(dir, `${ID}.png`)).mtimeMs

    const fresh = drawing({ icon: ICON, keep: true })
    await store(fresh, () => written + ICON_MAX_AGE_MS - 1000).get(ID, 't')
    expect(fresh).not.toHaveBeenCalled()

    const stale = drawing({ icon: ICON, keep: true })
    await store(stale, () => written + ICON_MAX_AGE_MS + 1000).get(ID, 't')
    expect(stale).toHaveBeenCalledTimes(1)

    writeFileSync(path.join(dir, `${OTHER}.png`), 'not a png')
    const broken = drawing({ icon: ICON, keep: true })
    expect(await store(broken).get(OTHER, 't')).toBe(ICON)
    expect(broken).toHaveBeenCalledTimes(1)
  })

  it('never names a file after an id that is not an entry id', async () => {
    const draw = drawing({ icon: ICON, keep: true })
    expect(await store(draw).get('..\\..\\x', 't')).toBe(ICON)
    expect(readdirSync(dir)).toEqual([])
  })

  it('deletes the icons of entries no longer listed, and nothing else', async () => {
    const icons = store(drawing({ icon: ICON, keep: true }))
    await icons.get(ID, 't')
    await icons.get(OTHER, 't')
    writeFileSync(path.join(dir, 'notes.txt'), 'kept')
    await icons.prune(new Set([ID]))
    expect(readdirSync(dir).sort()).toEqual([`${ID}.png`, 'notes.txt'])
  })

  it('still answers the icon when it cannot be written', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const file = path.join(dir, 'a-file')
    writeFileSync(file, '')
    const icons = new IconStore({ dir: file, draw: drawing({ icon: ICON, keep: true }) })
    expect(await icons.get(ID, 't')).toBe(ICON)
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
