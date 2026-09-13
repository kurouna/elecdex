import type { Dirent } from 'node:fs'
import { promises as fsp } from 'node:fs'
import path from 'node:path'
import {
  type DirEntry,
  type DirResult,
  type DiskUsage,
  type DriveInfo,
  type EntryKind,
  MAX_DIR_ENTRIES,
} from '@shared/fs'

/**
 * Directory listings, volume usage and drives, for the filesystem widget.
 *
 * eDEX-UI asked systeminformation's fsSize() for disk usage on every directory
 * change, which on Windows starts a PowerShell each time. `fs.statfs` answers
 * the same question from a single syscall.
 */

/** Rejects anything that is not a plain absolute path. Returns it normalised. */
export function validatePath(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 4096) return null
  if (raw.includes('\0')) return null
  if (!path.isAbsolute(raw)) return null
  return path.resolve(raw)
}

const ORDER: Record<EntryKind, number> = { dir: 0, symlink: 1, file: 2, other: 3 }

export function sortEntries(entries: DirEntry[]): DirEntry[] {
  return entries.sort(
    (a, b) =>
      ORDER[a.kind] - ORDER[b.kind] ||
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
  )
}

function kindOf(dirent: Dirent): EntryKind {
  if (dirent.isSymbolicLink()) return 'symlink'
  if (dirent.isDirectory()) return 'dir'
  if (dirent.isFile()) return 'file'
  return 'other'
}

export async function readDirectory(dir: string): Promise<DirResult> {
  let dirents: Dirent[]
  try {
    dirents = await fsp.readdir(dir, { withFileTypes: true })
  } catch (cause) {
    return { ok: false, error: errorCode(cause) }
  }

  // Sort on the cheap dirent data first, so a huge directory is truncated to the
  // entries that would have been shown anyway before any of them is stat-ed.
  const skeleton = sortEntries(
    dirents.map((d) => ({
      name: d.name,
      kind: kindOf(d),
      targetIsDir: false,
      size: 0,
      mtime: 0,
      hidden: d.name.startsWith('.'),
    })),
  )
  const kept = skeleton.slice(0, MAX_DIR_ENTRIES)

  const entries = await Promise.all(
    kept.map(async (entry) => {
      const full = path.join(dir, entry.name)
      try {
        const st = await fsp.lstat(full)
        entry.mtime = st.mtimeMs
        if (entry.kind === 'file') entry.size = st.size
        if (entry.kind === 'symlink') {
          entry.targetIsDir = (await fsp.stat(full)).isDirectory()
        }
      } catch {
        // Locked system files (pagefile.sys) and dangling links: list them anyway.
      }
      return entry
    }),
  )

  const parent = path.dirname(dir)
  return {
    ok: true,
    listing: {
      path: dir,
      parent: parent === dir ? null : parent,
      entries,
      truncated: skeleton.length > kept.length,
    },
  }
}

export interface MountEntry {
  mount: string
  fstype: string
}

/** Filesystems that are not storage a user would cd into. */
const PSEUDO_FS = new Set([
  'proc',
  'sysfs',
  'devtmpfs',
  'devpts',
  'tmpfs',
  'cgroup',
  'cgroup2',
  'securityfs',
  'pstore',
  'bpf',
  'debugfs',
  'tracefs',
  'configfs',
  'fusectl',
  'mqueue',
  'hugetlbfs',
  'autofs',
  'binfmt_misc',
  'efivarfs',
  'overlay',
  'squashfs',
  'nsfs',
  'ramfs',
  'rpc_pipefs',
])

/** Parses /proc/self/mounts, decoding the octal escapes it uses for spaces. */
export function parseProcMounts(text: string): MountEntry[] {
  const decode = (s: string) =>
    s.replace(/\\([0-7]{3})/g, (_, oct: string) => String.fromCharCode(Number.parseInt(oct, 8)))
  return text
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
    .filter((f) => f.length >= 3)
    .map(([, mount, fstype]) => ({ mount: decode(mount ?? ''), fstype: fstype ?? '' }))
    .filter((m) => m.mount.startsWith('/'))
}

/** The longest mount point containing `target`; `/` when nothing more specific matches. */
export function mountFor(target: string, mounts: readonly string[]): string {
  let best = '/'
  for (const mount of mounts) {
    const contains =
      target === mount || target.startsWith(mount.endsWith('/') ? mount : `${mount}/`)
    if (contains && mount.length > best.length) best = mount
  }
  return best
}

async function mountPoint(target: string): Promise<string> {
  if (process.platform === 'win32') return path.parse(target).root
  if (process.platform === 'linux') {
    try {
      const mounts = parseProcMounts(await fsp.readFile('/proc/self/mounts', 'utf8'))
      return mountFor(
        target,
        mounts.map((m) => m.mount),
      )
    } catch {
      return '/'
    }
  }
  // macOS: external volumes live under /Volumes; everything else is the root volume.
  const match = /^\/Volumes\/[^/]+/.exec(target)
  return match ? match[0] : '/'
}

export async function diskUsage(target: string): Promise<DiskUsage | null> {
  try {
    const st = await fsp.statfs(target)
    const total = st.blocks * st.bsize
    const free = st.bavail * st.bsize
    return { mount: await mountPoint(target), total, free, used: Math.max(0, total - free) }
  } catch {
    return null
  }
}

/** Resolves null if `fn` has not settled in time: a disconnected network drive can hang. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

async function driveAt(root: string, label: string): Promise<DriveInfo | null> {
  const st = await withTimeout(
    fsp.statfs(root).catch(() => null),
    1500,
  )
  if (st === null || st.blocks === 0) return null
  return { path: root, label, total: st.blocks * st.bsize, free: st.bavail * st.bsize }
}

export async function listDrives(): Promise<DriveInfo[]> {
  let candidates: Array<{ root: string; label: string }>

  if (process.platform === 'win32') {
    candidates = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      .split('')
      .map((l) => ({ root: `${l}:\\`, label: `${l}:` }))
  } else if (process.platform === 'linux') {
    let mounts: MountEntry[] = []
    try {
      mounts = parseProcMounts(await fsp.readFile('/proc/self/mounts', 'utf8'))
    } catch {
      mounts = [{ mount: '/', fstype: 'unknown' }]
    }
    const roots = mounts
      .filter((m) => !PSEUDO_FS.has(m.fstype))
      .filter((m) => !/^\/(proc|sys|dev|run(?!\/media)|snap|boot\/efi)(\/|$)/.test(m.mount))
      .map((m) => m.mount)
    candidates = [...new Set(roots)].map((root) => ({
      root,
      label: root === '/' ? '/' : path.basename(root),
    }))
  } else {
    let volumes: string[] = []
    try {
      volumes = await fsp.readdir('/Volumes')
    } catch {
      // No /Volumes: just the root.
    }
    candidates = [
      { root: '/', label: '/' },
      ...volumes.map((v) => ({ root: `/Volumes/${v}`, label: v })),
    ]
  }

  const drives = await Promise.all(candidates.map((c) => driveAt(c.root, c.label)))
  return drives.filter((d): d is DriveInfo => d !== null)
}

function errorCode(cause: unknown): string {
  if (typeof cause === 'object' && cause !== null && 'code' in cause) {
    return String((cause as { code: unknown }).code)
  }
  return cause instanceof Error ? cause.message : String(cause)
}
