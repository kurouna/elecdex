// Checks the asset generators make before they trust what they read (issue 33).
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, renameSync, rmSync } from 'node:fs'

/**
 * The program ids of a chip8Archive checkout's programs.json, each of which becomes a file name
 * in resources/chip8/archive: refused, all of them, when one is not a plain name, so a crafted
 * checkout cannot have the copy write outside that folder.
 */
export function archiveIds(programs) {
  const ids = Object.keys(programs)
  const bad = ids.find((id) => !/^[\w-]+$/.test(id))
  if (bad !== undefined) throw new Error(`not a program id: ${JSON.stringify(bad)}`)
  return ids
}

/** Throws unless the file's SHA-256 is `expected` (hex): a download is the release, or nothing. */
export function checkSha256(file, expected) {
  const got = createHash('sha256').update(readFileSync(file)).digest('hex')
  if (got !== expected.toLowerCase()) {
    throw Object.assign(new Error(`${file}: expected ${expected}, got ${got}`), { mismatch: true })
  }
}

/**
 * `file`, downloaded once by `download(to)` and kept only when it is the release: the download
 * goes beside it and is put in place only after its SHA-256 is checked, and a file that is not
 * the release - a 404 page, a cut download, one left by a run from before - is deleted, so the
 * next run tries again (found in review: it stayed, and every run failed the same way).
 */
export function fetchChecked(file, expected, download) {
  if (!existsSync(file)) {
    const part = `${file}.part`
    rmSync(part, { force: true })
    try {
      download(part)
      checkSha256(part, expected)
    } catch (error) {
      rmSync(part, { force: true })
      throw error
    }
    renameSync(part, file)
    return
  }
  try {
    checkSha256(file, expected)
  } catch (error) {
    // Only a file that is not the release goes: one a scanner holds a moment is kept.
    if (error?.mismatch === true) rmSync(file, { force: true })
    throw error
  }
}
