import { z } from 'zod'
import type { CatalogEntry } from './catalog.js'

/**
 * The platform's application list as the last scan found it, kept in
 * launcher-catalog.json so a start of elecdex shows the launcher's tiles at once
 * instead of after a scan (about 1.3 s on Windows); the scan runs behind it.
 *
 * Its targets are what the launcher starts, read from userData as settings.json's
 * `launcher.items` are, and launched through the same checks. The bounds keep a
 * file someone else wrote from being anything but a list of that shape.
 */

export const CATALOG_FILE_VERSION = 1

const EntrySchema = z.object({
  id: z.string().regex(/^[0-9a-f]{16}$/),
  name: z.string().min(1).max(512),
  group: z.string().max(512).nullable(),
  source: z.literal('system'),
  target: z.string().min(1).max(1024),
  args: z.array(z.string().max(1024)).max(32),
  exec: z.string().max(2048).optional(),
})

export const CatalogFileSchema = z.object({
  version: z.literal(CATALOG_FILE_VERSION),
  platform: z.string().max(32),
  entries: z.array(EntrySchema).max(2000),
})

export type CatalogFile = z.infer<typeof CatalogFileSchema>

export function emptyCatalogFile(platform: NodeJS.Platform = process.platform): CatalogFile {
  return { version: CATALOG_FILE_VERSION, platform, entries: [] }
}

export function catalogFileOf(
  entries: readonly CatalogEntry[],
  platform: NodeJS.Platform = process.platform,
): CatalogFile {
  return {
    version: CATALOG_FILE_VERSION,
    platform,
    entries: entries.map(({ id, name, group, target, args, exec }) => ({
      id,
      name,
      group,
      source: 'system',
      target,
      args,
      ...(exec === undefined ? {} : { exec }),
    })),
  }
}

/** The saved list, or null when there is none for this platform: the first scan is then waited for. */
export function savedCatalog(
  file: CatalogFile,
  platform: NodeJS.Platform = process.platform,
): CatalogEntry[] | null {
  if (file.platform !== platform || file.entries.length === 0) return null
  return file.entries.map(({ exec, ...entry }) => ({
    ...entry,
    ...(exec === undefined ? {} : { exec }),
  }))
}
