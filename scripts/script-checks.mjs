// Checks the asset generators make before they trust what they read (issue 33).
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

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
    throw new Error(`${file}: expected ${expected}, got ${got}`)
  }
}
