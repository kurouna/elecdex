/**
 * Filesystem types shared by main and the renderer.
 *
 * The renderer never touches the filesystem: it asks main for a listing of a
 * directory, the usage of the volume holding it, or the list of drives, and it
 * can watch a directory for changes. It cannot read file contents - eDEX-UI's
 * built-in file viewer is out of scope - so nothing here returns data from
 * inside a file.
 */

export type EntryKind = 'dir' | 'file' | 'symlink' | 'other'

export interface DirEntry {
  name: string
  kind: EntryKind
  /** For a symlink: whether it points at a directory, so it can be entered. */
  targetIsDir: boolean
  /** Bytes, for files; 0 otherwise. */
  size: number
  /** Last modification, ms since epoch; 0 when it could not be read. */
  mtime: number
  /** A dotfile. Windows' hidden attribute is not consulted. */
  hidden: boolean
}

export interface DirListing {
  /** The directory, normalised. */
  path: string
  /** Its parent, or null at a filesystem root. */
  parent: string | null
  /** Directories first, then links, files and the rest; each group by name. */
  entries: DirEntry[]
  /** True when the directory held more entries than are returned. */
  truncated: boolean
}

export type DirResult = { ok: true; listing: DirListing } | { ok: false; error: string }

export interface DriveInfo {
  /** Where to cd to: `C:\` on Windows, a mount point elsewhere. */
  path: string
  label: string
  total: number
  free: number
}

/** Most entries returned for one directory; a listing of node_modules stays cheap. */
export const MAX_DIR_ENTRIES = 1000

/**
 * A path that starts with two separators: on Windows a UNC share (`\\host\share`) or a device
 * path (`\\?\`, `\\.\`), either of which can make Windows connect to another machine and offer
 * it the user's credentials (an NTLM hash) the moment it is listed, watched or looked at. A
 * shell's folder is learnt from whatever the terminal prints, a file a user only `cat`s
 * included, so such a path is never followed there (found in a security review). POSIX has no
 * use for a leading `//`.
 */
export function isNetworkPath(value: string): boolean {
  return /^[\\/]{2}/.test(value)
}
