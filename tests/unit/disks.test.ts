import { describe, expect, it } from 'vitest'
import {
  diskIoBetween,
  parseDiskstats,
  posixVolumes,
  windowsDiskIo,
  windowsVolumes,
} from '../../src/services/metrics/disks.js'

describe('volumes', () => {
  it('maps Windows drives and skips ones without media', () => {
    expect(
      windowsVolumes([
        { n: 'C:\\', label: 'OS', fs: 'NTFS', type: 'Fixed', total: 1000, free: 400 },
        { n: 'D:\\', label: '', fs: '', type: 'CDRom', total: 0, free: 0 },
        { n: 'E:\\', label: 'USB', fs: 'exFAT', type: 'Removable', total: 64, free: 60 },
      ]),
    ).toEqual([
      { mount: 'C:\\', label: 'OS', fs: 'NTFS', kind: 'fixed', total: 1000, used: 600 },
      { mount: 'E:\\', label: 'USB', fs: 'exFAT', kind: 'removable', total: 64, used: 4 },
    ])
  })

  it('keeps real Linux filesystems only', () => {
    const volumes = posixVolumes(
      [
        { fs: '/dev/nvme0n1p2', type: 'ext4', size: 500, used: 200, mount: '/' },
        { fs: 'tmpfs', type: 'tmpfs', size: 16, used: 1, mount: '/run' },
        { fs: '/dev/loop3', type: 'squashfs', size: 1, used: 1, mount: '/snap/core/1' },
        { fs: '/dev/nvme0n1p1', type: 'vfat', size: 1, used: 0, mount: '/boot/efi' },
        { fs: '/dev/sdb1', type: 'exfat', size: 64, used: 10, mount: '/media/me/USB' },
        { fs: '//nas/share', type: 'cifs', size: 900, used: 450, mount: '/mnt/nas' },
      ],
      'linux',
    )
    expect(volumes.map((v) => [v.mount, v.kind])).toEqual([
      ['/', 'fixed'],
      ['/media/me/USB', 'removable'],
      ['/mnt/nas', 'network'],
    ])
  })

  it('shows one macOS APFS container once', () => {
    const volumes = posixVolumes(
      [
        { fs: '/dev/disk3s1s1', type: 'apfs', size: 500, used: 300, mount: '/' },
        { fs: '/dev/disk3s5', type: 'apfs', size: 500, used: 300, mount: '/System/Volumes/Data' },
        { fs: '/dev/disk3s6', type: 'apfs', size: 500, used: 2, mount: '/System/Volumes/VM' },
        { fs: '/dev/disk5s1', type: 'apfs', size: 2000, used: 100, mount: '/Volumes/Backup' },
      ],
      'darwin',
    )
    expect(volumes.map((v) => v.mount)).toEqual(['/', '/Volumes/Backup'])
  })
})

describe('disk activity', () => {
  const stats = (read: number, write: number, io: number) =>
    [
      `   8       0 sda 100 0 ${read} 0 100 0 ${write} 0 0 ${io} 0 0 0 0`,
      `   8       1 sda1 100 0 ${read} 0 100 0 ${write} 0 0 ${io} 0 0 0 0`,
      '   7       0 loop0 1 0 999 0 0 0 0 0 0 5 0 0 0 0',
    ].join('\n')

  it('counts whole disks only and turns counters into rates', () => {
    const a = parseDiskstats(stats(1000, 2000, 100), 0)
    expect(a).toMatchObject({ readBytes: 512_000, writeBytes: 1_024_000, disks: 1 })
    const b = parseDiskstats(stats(3000, 2000, 600), 2000)
    expect(diskIoBetween(a, b)).toEqual({ readSec: 512_000, writeSec: 0, busy: 25 })
    expect(diskIoBetween(null, b)).toEqual({ readSec: 0, writeSec: 0, busy: null })
  })

  it('reads Windows counters as rates, busy from idle time', () => {
    expect(windowsDiskIo({ r: 1024, w: -1, idle: 97.5 })).toEqual({
      readSec: 1024,
      writeSec: 0,
      busy: 2.5,
    })
    expect(windowsDiskIo({ r: 0, w: 0, idle: null }).busy).toBeNull()
  })
})
