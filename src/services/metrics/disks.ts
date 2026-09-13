import type { DiskIo, DiskVolume, VolumeKind } from '@shared/metrics'

/**
 * Disk volumes and disk activity, from what each platform offers. Pure, so the
 * filtering and the rates are unit-tested.
 */

// ---------------------------------------------------------------------------
// Volumes
// ---------------------------------------------------------------------------

/** A drive as the Windows sampler reports it (System.IO.DriveInfo). */
export interface RawDrive {
  n: string
  label: string
  fs: string
  /** DriveType: Fixed, Removable, Network, CDRom, Ram, NoRootDirectory, Unknown. */
  type: string
  total: number
  free: number
}

const WINDOWS_KIND: Record<string, VolumeKind> = {
  Fixed: 'fixed',
  Removable: 'removable',
  Network: 'network',
}

export function windowsVolumes(drives: readonly RawDrive[]): DiskVolume[] {
  return drives
    .filter((d) => d.total > 0)
    .map((d) => ({
      mount: d.n,
      label: d.label,
      fs: d.fs,
      kind: WINDOWS_KIND[d.type] ?? 'other',
      total: d.total,
      used: Math.max(0, d.total - d.free),
    }))
}

/** A row of systeminformation's fsSize() (df on Linux and macOS). */
export interface FsSizeRow {
  fs: string
  type: string
  size: number
  used: number
  mount: string
}

/** Filesystems that hold no user data: memory-backed, virtual or packaging. */
const PSEUDO_FS =
  /^(tmpfs|devtmpfs|devfs|overlay|squashfs|proc|sysfs|cgroup2?|autofs|fuse\.snapfuse|efivarfs|ramfs|nullfs|map .*)$/i

/** Mounts that are the system's plumbing rather than places files are kept. */
const SYSTEM_MOUNT =
  /^\/(snap|run(?!\/media)|dev|sys|proc|boot\/efi|System\/Volumes\/(VM|Preboot|Update|xarts|iSCPreboot|Hardware)|private\/var\/vm)(\/|$)/

/**
 * The volumes worth showing from df. On macOS the sealed system volume "/" and
 * its data volume share one APFS container, so the same space would be listed
 * twice; volumes on the same device are shown once, the shortest mount winning.
 */
export function posixVolumes(rows: readonly FsSizeRow[], platform: NodeJS.Platform): DiskVolume[] {
  const byDevice = new Map<string, DiskVolume>()
  for (const row of rows) {
    if (row.size <= 0 || PSEUDO_FS.test(row.type) || SYSTEM_MOUNT.test(row.mount)) continue
    // disk3s1s1 and disk3s5 are volumes of the same container, disk3.
    const device = platform === 'darwin' ? row.fs.replace(/(disk\d+)s\d+(s\d+)?$/, '$1') : row.fs
    const volume: DiskVolume = {
      mount: row.mount,
      label: '',
      fs: row.type,
      kind: kindOf(row),
      total: row.size,
      used: Math.max(0, row.used),
    }
    const existing = byDevice.get(device)
    if (!existing || volume.mount.length < existing.mount.length) byDevice.set(device, volume)
  }
  return [...byDevice.values()].sort((a, b) => a.mount.localeCompare(b.mount))
}

function kindOf(row: FsSizeRow): VolumeKind {
  if (/^(nfs|cifs|smbfs|afpfs|sshfs|fuse\.sshfs|9p)/i.test(row.type) || row.fs.startsWith('//')) {
    return 'network'
  }
  if (/^\/(media|run\/media|Volumes)\//.test(row.mount)) return 'removable'
  return 'fixed'
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

/** Cumulative counters for all whole disks, from /proc/diskstats. */
export interface DiskCounters {
  at: number
  readBytes: number
  writeBytes: number
  /** Milliseconds spent doing I/O, summed over disks. */
  ioMs: number
  disks: number
}

/** Partitions, loop and RAM devices would count the same bytes twice, or are not disks. */
const NOT_A_DISK =
  /^((loop|ram|zram|dm-|md|sr|fd)\d+|(sd|hd|vd|xvd)[a-z]+\d+|(nvme\d+n\d+|mmcblk\d+)p\d+)$/

export function parseDiskstats(text: string, at: number): DiskCounters {
  const counters: DiskCounters = { at, readBytes: 0, writeBytes: 0, ioMs: 0, disks: 0 }
  for (const line of text.split('\n')) {
    const f = line.trim().split(/\s+/)
    const name = f[2]
    if (!name || f.length < 14 || NOT_A_DISK.test(name)) continue
    // Sectors are always 512 bytes in this file, whatever the device's own size.
    counters.readBytes += Number(f[5]) * 512
    counters.writeBytes += Number(f[9]) * 512
    counters.ioMs += Number(f[12])
    counters.disks += 1
  }
  return counters
}

export function diskIoBetween(previous: DiskCounters | null, current: DiskCounters): DiskIo {
  if (previous === null) return { readSec: 0, writeSec: 0, busy: null }
  const seconds = (current.at - previous.at) / 1000
  if (seconds <= 0) return { readSec: 0, writeSec: 0, busy: null }
  const rate = (now: number, then: number) => (now < then ? 0 : (now - then) / seconds)
  const busy =
    current.disks > 0 && current.ioMs >= previous.ioMs
      ? Math.min(100, (current.ioMs - previous.ioMs) / (seconds * 10 * current.disks))
      : null
  return {
    readSec: rate(current.readBytes, previous.readBytes),
    writeSec: rate(current.writeBytes, previous.writeBytes),
    busy,
  }
}

/** A Windows performance-counter reading: already rates, busy from % idle time. */
export function windowsDiskIo(raw: { r: number; w: number; idle: number | null }): DiskIo {
  const clamp = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)
  return {
    readSec: clamp(raw.r),
    writeSec: clamp(raw.w),
    busy: raw.idle === null ? null : Math.max(0, Math.min(100, 100 - raw.idle)),
  }
}
