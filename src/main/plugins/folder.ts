import { createHash } from 'node:crypto'
import {
  type Dirent,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { PLUGIN_LIMITS, type PluginSource } from '@shared/plugins'
import { transform } from 'sucrase'

/**
 * The plugins folder: finding plugins and turning their source into something a worker
 * can run (docs/plugins.md section 3).
 *
 * Main only ever transforms text here. Plugin code is never executed in this process -
 * it runs in a worker in the renderer.
 */

export const TYPES_FILE = 'elecdex-plugin.d.ts'

export interface PluginFolderOptions {
  dir: string
  /** The contents of elecdex-plugin.d.ts for this build. */
  types: string
  /** Files written once, when the folder is created: path relative to the folder -> text. */
  sample: Readonly<Record<string, string>>
}

interface SourceFile {
  /** Relative to the plugin: "index.ts", "lib/timer.ts". */
  path: string
  source: string
}

const isCode = (name: string) => /\.(ts|js)$/.test(name) && !name.endsWith('.d.ts')

function writeAtomic(file: string, text: string): void {
  mkdirSync(path.dirname(file), { recursive: true })
  const temp = `${file}.tmp`
  writeFileSync(temp, text)
  renameSync(temp, file)
}

export class PluginFolder {
  readonly dir: string
  private readonly types: string
  private readonly sample: Readonly<Record<string, string>>

  constructor(options: PluginFolderOptions) {
    this.dir = options.dir
    this.types = options.types
    this.sample = options.sample
  }

  /**
   * Creates the folder with the sample on first run, and keeps the type definitions in step
   * with this build. The sample is the user's once written: a folder that exists, even an
   * empty one, is never filled again - deleting the folder is how to get the sample back.
   */
  prepare(): void {
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true })
      for (const [name, text] of Object.entries(this.sample)) {
        writeAtomic(path.join(this.dir, name), text)
      }
    }
    const typesFile = path.join(this.dir, TYPES_FILE)
    let current: string | null = null
    try {
      current = readFileSync(typesFile, 'utf8')
    } catch {
      // Missing: written below.
    }
    if (current !== this.types) writeAtomic(typesFile, this.types)
  }

  /** Every plugin in the folder, each read and transformed on its own. */
  scan(): PluginSource[] {
    let entries: Dirent[]
    try {
      entries = readdirSync(this.dir, { withFileTypes: true })
    } catch {
      return []
    }
    const found: PluginSource[] = []
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      if (entry.isFile() && isCode(entry.name)) {
        found.push(this.read(entry.name, () => this.single(entry.name)))
      } else if (entry.isDirectory()) {
        found.push(this.read(entry.name, () => this.folder(entry.name)))
      }
      // Symbolic links and anything else are not followed.
    }
    return found
  }

  private read(key: string, collect: () => SourceFile[]): PluginSource {
    try {
      const files = collect()
      const hash = hashFiles(files)
      const entry = files.find((f) => f.path === 'index.ts' || f.path === 'index.js') ?? files[0]
      if (entry === undefined) throw new Error('no source files')
      try {
        return { key, hash, code: bundle(files), entry: entry.path, error: null }
      } catch (error) {
        return { key, hash, code: null, entry: null, error: message(error) }
      }
    } catch (error) {
      return { key, hash: '', code: null, entry: null, error: message(error) }
    }
  }

  private single(name: string): SourceFile[] {
    const file = path.join(this.dir, name)
    const size = lstatSync(file).size
    if (size > PLUGIN_LIMITS.sourceBytes) throw new Error(tooLarge(size))
    return [{ path: name, source: readFileSync(file, 'utf8') }]
  }

  private folder(name: string): SourceFile[] {
    const root = path.join(this.dir, name)
    if (!['index.ts', 'index.js'].some((f) => isRegularFile(path.join(root, f)))) {
      throw new Error('a plugin folder needs an index.ts or index.js')
    }
    const found: string[] = []
    collectCode(root, 1, found)
    if (found.length > PLUGIN_LIMITS.files) {
      throw new Error(`more than ${PLUGIN_LIMITS.files} source files`)
    }
    const total = found.reduce((sum, file) => sum + lstatSync(file).size, 0)
    if (total > PLUGIN_LIMITS.sourceBytes) throw new Error(tooLarge(total))
    return found
      .map((file) => ({
        path: path.relative(root, file).split(path.sep).join('/'),
        source: readFileSync(file, 'utf8'),
      }))
      .sort((a, b) => a.path.localeCompare(b.path))
  }
}

/**
 * The source files under a plugin folder, down to the depth limit. Stops once past the
 * file limit, so a folder of thousands is not walked to the end just to be refused.
 */
function collectCode(dir: string, depth: number, found: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (found.length > PLUGIN_LIMITS.files) return
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory() && depth < PLUGIN_LIMITS.depth) collectCode(full, depth + 1, found)
    else if (entry.isFile() && isCode(entry.name)) found.push(full)
  }
}

const isRegularFile = (file: string): boolean => {
  try {
    return lstatSync(file).isFile()
  } catch {
    return false
  }
}

const tooLarge = (bytes: number) =>
  `too large: ${Math.ceil(bytes / 1024)} KiB, the limit is ${PLUGIN_LIMITS.sourceBytes / 1024} KiB`

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error))

function hashFiles(files: readonly SourceFile[]): string {
  const hash = createHash('sha256')
  for (const file of files) hash.update(file.path).update('\0').update(file.source).update('\0')
  return hash.digest('hex').slice(0, 16)
}

/**
 * The module table: each file as CommonJS inside a function, keyed by its path. Type-only
 * imports disappear in the transform; value imports become require calls, which the worker
 * resolves among these keys alone.
 */
export function bundle(files: readonly SourceFile[]): string {
  const entries = files.map((file) => {
    const transforms: Array<'typescript' | 'imports'> = file.path.endsWith('.ts')
      ? ['typescript', 'imports']
      : ['imports']
    let code: string
    try {
      code = transform(file.source, { transforms, filePath: file.path }).code
    } catch (error) {
      throw new Error(`${file.path}: ${message(error)}`)
    }
    return `${JSON.stringify(file.path)}: function (module, exports, require) {\n${code}\n}`
  })
  return `{\n${entries.join(',\n')}\n}`
}
