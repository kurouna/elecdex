import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { z } from 'zod'
import { replaceFile } from './replace-file.js'

/**
 * A cache kept as one JSON file: read whole, validated, and written atomically.
 *
 * Unlike JsonStore (settings, layout) nothing here is the user's work, so an
 * unreadable or invalid file is simply treated as empty and later overwritten.
 */
export function cacheFile<T>(file: string, schema: z.ZodType<T>, empty: T) {
  return {
    load: (): T => {
      try {
        const parsed = schema.safeParse(JSON.parse(readFileSync(file, 'utf8')))
        return parsed.success ? parsed.data : empty
      } catch {
        return empty
      }
    },
    save: (value: T): void => {
      mkdirSync(path.dirname(file), { recursive: true })
      const temp = `${file}.tmp`
      writeFileSync(temp, JSON.stringify(value))
      replaceFile(temp, file)
    },
  }
}
