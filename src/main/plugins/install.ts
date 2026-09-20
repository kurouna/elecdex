import {
  copyFileSync,
  type Dirent,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { PLUGIN_LIMITS } from '@shared/plugins'
import { transformFile } from './folder.js'

/**
 * Installing a plugin from a folder the user picks.
 *
 * What is copied is exactly what the scanner would read (folder.ts): the code
 * files, down to the same depth and under the same limits. A plugin kept in a
 * repository sits beside a README, a package.json, a .git and often a
 * node_modules; copying the folder as it stands would fill the plugins folder
 * with things elecdex never looks at, and could copy hundreds of megabytes for
 * a plugin of two files.
 *
 * Nothing here runs the plugin, and nothing it copies is trusted: the installed
 * files go through the same scan, the same transform and the same consent as a
 * plugin the user put there by hand (docs/plugins.md).
 */

/** Source files, at most this deep and this many - the scanner's own limits. */
const LIMITS = { files: PLUGIN_LIMITS.files, bytes: PLUGIN_LIMITS.sourceBytes, depth: 4 }

export type EntryKind = 'file' | 'dir' | 'other'

/**
 * The folder being installed from, as a listing rather than a disk: the rules
 * below are what is worth testing, and they should be testable without one.
 */
export interface SourceTree {
  /** Entries of `relative` ('' is the root), in any order. */
  list(relative: string): Array<{ name: string; kind: EntryKind }>
  /** Size in bytes of a file. */
  size(relative: string): number
  /** The text of a file; '' when it cannot be read. */
  read(relative: string): string
}

export interface InstallPlan {
  /** Paths relative to the chosen folder, with '/' separators. */
  files: string[]
  bytes: number
}

const hasIndex = (entries: ReadonlyArray<{ name: string; kind: EntryKind }>): boolean =>
  entries.some((entry) => entry.kind === 'file' && /^index\.(ts|js)$/.test(entry.name))

const isCode = (name: string) => /\.(ts|js)$/.test(name) && !name.endsWith('.d.ts')
/** Skipped wherever they appear, as the scanner skips them. */
const isNoise = (name: string) => name.startsWith('.') || name === 'node_modules'

/**
 * A folder name elecdex will find again: the scanner reads the plugins folder's
 * entries by name, and consent is bound to that name, so it has to be a plain
 * one - no separators, no dots leading anywhere else.
 */
export function installName(folder: string): string | null {
  const name = path.basename(folder).trim()
  if (name === '' || name.startsWith('.') || name === 'node_modules') return null
  if (name.length > 64 || /[\\/:*?"<>|]/.test(name)) return null
  // Windows keeps these for devices whatever the extension.
  if (/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(name.replace(/\..*$/, ''))) return null
  return name
}

/**
 * What would be copied, or why nothing would be.
 *
 * What is copied is the plugin: the entry, and the files it imports, and the
 * files those import. A folder kept in a repository holds more than the plugin -
 * tests beside the code, a scratch file, an old version - and the worker never
 * loads any of it: it resolves what is required from the entry and nothing
 * else. Copying the rest would put files in the plugins folder that elecdex
 * only ever stringifies into the worker unread, and checking the rest would
 * refuse a plugin for a test file that imports node:assert - which is what it
 * did, until a plugin with tests beside it was installed.
 *
 * The message is shown to the user as it is, so it says what to do about it
 * rather than which rule was broken.
 */
export function planInstall(tree: SourceTree): InstallPlan | { error: string } {
  const root = tree.list('')
  const entry = ['index.ts', 'index.js'].find((name) =>
    root.some((item) => item.kind === 'file' && item.name === name),
  )
  if (entry === undefined) return { error: notAPlugin(tree, root) }

  const files: string[] = []
  const seen = new Set<string>()
  const queue = [entry]
  let bytes = 0
  while (queue.length > 0) {
    const current = queue.shift() as string
    if (seen.has(current)) continue
    seen.add(current)

    const source = tree.read(current)
    bytes += tree.size(current)
    files.push(current)
    if (files.length > LIMITS.files) return { error: `more than ${LIMITS.files} source files` }
    if (bytes > LIMITS.bytes) {
      return { error: `more than ${Math.round(LIMITS.bytes / 1024)} kB of source` }
    }

    let code: string
    try {
      // The same transform the worker will see, so a file that cannot compile
      // is refused now rather than when the plugin is first opened.
      code = transformFile({ path: current, source })
    } catch (error) {
      return { error: message(error) }
    }
    for (const specifier of requires(code)) {
      const next = resolveImport(current, specifier, tree)
      if (typeof next !== 'string') return { error: `${current}: ${next.error}` }
      queue.push(next)
    }
  }
  return { files: files.sort(), bytes }
}

/** Why a folder with no index at its root is not a plugin. */
function notAPlugin(tree: SourceTree, root: ReturnType<SourceTree['list']>): string {
  // A folder of plugins - another elecdex's plugins folder, say - is a likely
  // mistake, and the answer to it is not "this is not a plugin".
  const inside = root.filter(
    (entry) => entry.kind === 'dir' && !isNoise(entry.name) && hasIndex(tree.list(entry.name)),
  )
  if (inside.length === 1) {
    return `that folder is not a plugin, but "${inside[0]?.name ?? ''}" inside it is - pick that one`
  }
  if (inside.length > 1) {
    return `that folder holds ${inside.length} plugins; install them one at a time`
  }
  return 'that folder has no index.ts or index.js, so it is not a plugin'
}

/** Every `require("...")` in transformed code, in order. */
function requires(code: string): string[] {
  const found: string[] = []
  for (const match of code.matchAll(/\brequire\(\s*(['"])([^'"]*)\1\s*\)/g)) {
    const specifier = match[2]
    if (specifier !== undefined) found.push(specifier)
  }
  return found
}

/**
 * The file a specifier names, or why it names none.
 *
 * This mirrors the worker's own resolution (shared/plugin-runtime.ts); change
 * one and change the other.
 */
function resolveImport(
  from: string,
  specifier: string,
  tree: SourceTree,
): string | { error: string } {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return { error: `imports "${specifier}", and a plugin can import only its own files` }
  }
  const parts = from.split('/').slice(0, -1)
  for (const segment of specifier.split('/').filter((part) => part !== '.' && part !== '')) {
    if (segment !== '..') parts.push(segment)
    else if (parts.pop() === undefined) {
      return { error: `imports "${specifier}", which is outside the folder` }
    }
  }
  const base = parts.join('/')
  const found = [base, `${base}.ts`, `${base}.js`, `${base}/index.ts`, `${base}/index.js`].find(
    (candidate) => isCodeFile(tree, candidate),
  )
  if (found === undefined) {
    return { error: `imports "${specifier}", which is not in the folder` }
  }
  return found
}

/**
 * Whether a path is a file the worker would have as a module.
 *
 * Which is not the same as "a file that is there": the scanner builds the
 * module table from the code files it walks, skipping dotted names and
 * node_modules at every depth and stopping at the depth limit
 * (main/plugins/folder.ts). A file it will not bundle is one the worker cannot
 * load, so importing it has to be refused here - copying it instead would
 * install a plugin that fails the moment it is opened. `import './data.json'`
 * is the same case: nothing but code is a module.
 */
function isCodeFile(tree: SourceTree, relative: string): boolean {
  const segments = relative.split('/')
  if (segments.length > PLUGIN_LIMITS.depth) return false
  if (segments.some((segment) => isNoise(segment))) return false
  const name = segments[segments.length - 1] ?? ''
  if (!isCode(name)) return false
  const parent = segments.slice(0, -1).join('/')
  return tree.list(parent).some((entry) => entry.kind === 'file' && entry.name === name)
}

/** The real folder on disk, for `planInstall` and the copy. */
export function diskTree(root: string): SourceTree {
  return {
    list: (relative) => {
      const dir = relative === '' ? root : path.join(root, relative)
      let entries: Dirent[]
      try {
        entries = readdirSync(dir, { withFileTypes: true })
      } catch {
        return []
      }
      return entries.map((entry) => ({
        name: entry.name,
        kind: entry.isFile() ? 'file' : entry.isDirectory() ? 'dir' : 'other',
      }))
    },
    size: (relative) => {
      try {
        return statSync(path.join(root, relative)).size
      } catch {
        return 0
      }
    },
    read: (relative) => {
      try {
        return readFileSync(path.join(root, relative), 'utf8')
      } catch {
        return ''
      }
    },
  }
}

export type InstallResult =
  | { status: 'installed'; name: string; files: number }
  /** The name is already taken; the caller asks the user and may try again with `replace`. */
  | { status: 'exists'; name: string }
  | { status: 'refused'; reason: string }

export interface InstallOptions {
  /** The plugins folder. */
  pluginsDir: string
  /** The folder the user picked. */
  source: string
  replace?: boolean
  /** Injected by the tests; the disk otherwise. */
  tree?: SourceTree
}

/**
 * Copies a plugin into the plugins folder.
 *
 * The copy is made beside the target and renamed into place, so a failure
 * half-way leaves the plugin that was there untouched rather than half
 * replaced.
 */
export function installFromFolder(options: InstallOptions): InstallResult {
  const { pluginsDir, source } = options
  const name = installName(source)
  if (name === null) return { status: 'refused', reason: 'that folder cannot be a plugin name' }

  const resolved = path.resolve(source)
  const plugins = path.resolve(pluginsDir)
  if (resolved === plugins || resolved.startsWith(`${plugins}${path.sep}`)) {
    return { status: 'refused', reason: 'that folder is already in the plugins folder' }
  }

  const tree = options.tree ?? diskTree(resolved)
  // The plan is the module graph from the entry, and making it is what says the
  // plugin compiles and that its imports are files that came with it.
  const plan = planInstall(tree)
  if ('error' in plan) return { status: 'refused', reason: plan.error }
  const sources = plan.files.map((file) => ({ path: file, source: tree.read(file) }))

  const target = path.join(plugins, name)
  const exists = readdirSync(plugins, { withFileTypes: true }).some((entry) => entry.name === name)
  if (exists && options.replace !== true) return { status: 'exists', name }

  const staging = path.join(plugins, `.installing-${name}`)
  try {
    rmSync(staging, { recursive: true, force: true })
    for (const file of sources) {
      const to = path.join(staging, file.path)
      mkdirSync(path.dirname(to), { recursive: true })
      writeFileSync(to, file.source, 'utf8')
    }
    rmSync(target, { recursive: true, force: true })
    // Renaming a directory over a path that no longer exists is atomic enough:
    // what matters is that the plugin is never half itself while it is scanned.
    mkdirSync(path.dirname(target), { recursive: true })
    renameInto(staging, target)
  } catch (error) {
    rmSync(staging, { recursive: true, force: true })
    return { status: 'refused', reason: message(error) }
  }
  return { status: 'installed', name, files: plan.files.length }
}

/**
 * `renameSync`, falling back to a copy. Both paths are inside the plugins
 * folder, so they are on one filesystem - but a folder being watched or indexed
 * can refuse a rename on Windows, and the plugin is worth having either way.
 */
function renameInto(from: string, to: string): void {
  try {
    renameSync(from, to)
  } catch {
    copyDir(from, to)
    rmSync(from, { recursive: true, force: true })
  }
}

function copyDir(from: string, to: string): void {
  mkdirSync(to, { recursive: true })
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name)
    const target = path.join(to, entry.name)
    if (entry.isDirectory()) copyDir(source, target)
    else if (entry.isFile()) copyFileSync(source, target)
  }
}

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error))
