import { realpathSync } from 'node:fs'
import path from 'node:path'
import { looksBinary } from '@shared/logwatch/encoding'
import { isPattern, patternFor } from '@shared/logwatch/files'
import type { LogFileRef } from '@shared/logwatch/types'
import type { LogCatalog } from './catalog.js'
import { nodeFs } from './node-fs.js'

/**
 * What the picker answered, checked before it is followed (docs/logwatch.md §3.1): a file that
 * exists, this user may read and is text, and - to follow the newest like it - a name with
 * something in it that changes from file to file. Free of Electron, so a test chooses the file.
 */

export type Pick = { file: LogFileRef } | { problem: string } | null

/** Checks a chosen file, and adds it (or its folder and pattern) to the catalog. */
export async function registerChosen(
  catalog: LogCatalog,
  chosen: string,
  newest: boolean,
  now: number,
): Promise<Pick> {
  let file: string
  try {
    file = realpathSync.native(chosen)
  } catch {
    return { problem: 'that file cannot be found' }
  }
  const facts = await nodeFs.stat(file)
  if ('denied' in facts) return { problem: 'this user may not read that file' }
  if (!('size' in facts)) return { problem: 'that file cannot be read' }
  try {
    if (looksBinary(await nodeFs.read(file, 0, 8192))) {
      return { problem: 'that is not a text file' }
    }
  } catch {
    return { problem: 'that file cannot be read' }
  }
  const pattern = newest ? patternFor(path.basename(file)) : null
  if (pattern !== null && !isPattern(pattern)) {
    return { problem: 'its name has nothing that changes from file to file: watch it alone' }
  }
  const entry =
    pattern === null ? catalog.add(file, null, now) : catalog.add(path.dirname(file), pattern, now)
  return { file: catalog.ref(entry) }
}
