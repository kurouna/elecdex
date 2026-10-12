import { type FSWatcher, watch } from 'node:fs'
import { open, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import type { LogFs, StatResult } from './service.js'

/** The file system as LogWatchService reads it: every read opens, reads and closes. */
export const nodeFs: LogFs = {
  async stat(file): Promise<StatResult> {
    try {
      const s = await stat(file)
      if (!s.isFile()) return { failed: 'not a file' }
      return { size: s.size, ino: s.ino, birth: s.birthtimeMs, mtime: s.mtimeMs }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'ENOENT' || code === 'ENOTDIR') return { missing: true }
      if (code === 'EACCES' || code === 'EPERM') return { denied: true }
      return { failed: (error as Error).message }
    }
  },
  async read(file, start, length) {
    if (length <= 0) return new Uint8Array()
    const handle = await open(file, 'r')
    try {
      const buffer = Buffer.alloc(length)
      const { bytesRead } = await handle.read(buffer, 0, length, start)
      return new Uint8Array(buffer.buffer, buffer.byteOffset, bytesRead)
    } finally {
      await handle.close()
    }
  },
  async list(folder) {
    try {
      return await readdir(folder)
    } catch {
      return null
    }
  },
  join: (folder, name) => path.join(folder, name),
  dirname: (file) => path.dirname(file),
  basename: (file) => path.basename(file),
  watch(folder, onChange) {
    let watcher: FSWatcher
    try {
      watcher = watch(folder, { persistent: false }, (_event, name) => {
        onChange(typeof name === 'string' ? name : null)
      })
    } catch {
      return null
    }
    // A folder gone or unreadable: the look each second carries on, and says so.
    watcher.on('error', () => watcher.close())
    return watcher
  },
}
