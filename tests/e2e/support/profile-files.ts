import { createHash } from 'node:crypto'
import { type Dirent, existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

/**
 * The files main keeps in a profile, hashed, for the shared app's check that a test left
 * nothing behind (shared.ts).
 */

/** Chromium's own folders and files in a profile: none of them is main's. */
const CHROMIUM =
  /^(Cache|Code Cache|GPUCache|GPUPersistentCache|GrShaderCache|ShaderCache|Dawn\w*|Local Storage|Session Storage|Network|blob_storage|Shared Dictionary|SharedStorage|IndexedDB|Partitions|WebStorage|Crashpad|Service Worker|Extension State|VideoDecodeStats|shared_proto_db|databases|Dictionaries|Trust Tokens|Local State|Preferences|DIPS.*|DevToolsActivePort|lockfile|declarative_performance_observer.*|.*\.log|Cookies.*|Network Persistent State|TransportSecurity)$/

/** Files main manages through APIs the reset checks directly, or rewrites as it runs. */
const CHECKED_ELSEWHERE = new Set(['layout.json', 'layouts.json', 'settings.json'])

/**
 * A write in flight: main writes a file whole beside it (`<file>.<pid>.tmp`, json-store.ts;
 * `<file>.tmp`, cache-file.ts) and renames it over the file, so it is never what main keeps.
 */
const IN_FLIGHT = /\.tmp$/

/** Whether an error is a file that went between being listed and being read. */
const gone = (error: unknown): boolean => (error as { code?: string }).code === 'ENOENT'

/** Whether an entry of the profile is not main's to keep, or not kept yet. */
function skipped(name: string, top: boolean): boolean {
  if (top && (CHROMIUM.test(name) || CHECKED_ELSEWHERE.has(name))) return true
  return IN_FLIGHT.test(name)
}

/** One entry's files into `found`: a folder's, or the file's own hash. */
function addEntry(found: Record<string, string>, entry: Dirent, full: string, name: string): void {
  try {
    if (entry.isDirectory()) Object.assign(found, profileFiles(full, name))
    else if (entry.isFile() && statSync(full).size < 8_000_000) {
      found[name] = createHash('sha1').update(readFileSync(full)).digest('hex')
    }
  } catch (error) {
    // Main renamed or removed it as the folder was read: what it is now is read next time.
    if (!gone(error)) throw error
  }
}

/** Every file main keeps in the profile, with a hash of what it holds. */
export function profileFiles(dir: string, under = ''): Record<string, string> {
  const found: Record<string, string> = {}
  if (!existsSync(dir)) return found
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skipped(entry.name, under === '')) continue
    const name = under === '' ? entry.name : `${under}/${entry.name}`
    addEntry(found, entry, path.join(dir, entry.name), name)
  }
  return found
}
