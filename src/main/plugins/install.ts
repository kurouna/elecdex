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
import { type SourceFile, transformFile } from './folder.js'

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
 * The message is shown to the user as it is, so it says what to do about it
 * rather than which rule was broken.
 */
export function planInstall(tree: SourceTree): InstallPlan | { error: string } {
  const root = tree.list('')
  if (!hasIndex(root)) {
    // A folder of plugins - another elecdex's plugins folder, say - is a likely
    // mistake, and the answer to it is not "this is not a plugin".
    const inside = root.filter(
      (entry) => entry.kind === 'dir' && !isNoise(entry.name) && hasIndex(tree.list(entry.name)),
    )
    if (inside.length === 1) {
      const only = inside[0]?.name ?? ''
      return { error: `that folder is not a plugin, but "${only}" inside it is - pick that one` }
    }
    if (inside.length > 1) {
      return { error: `that folder holds ${inside.length} plugins; install them one at a time` }
    }
    return { error: 'that folder has no index.ts or index.js, so it is not a plugin' }
  }

  const files: string[] = []
  collect(tree, '', 1, files)
  if (files.length > LIMITS.files) return { error: `more than ${LIMITS.files} source files` }

  const bytes = files.reduce((sum, file) => sum + tree.size(file), 0)
  if (bytes > LIMITS.bytes) {
    return { error: `more than ${Math.round(LIMITS.bytes / 1024)} kB of source` }
  }
  return { files, bytes }
}

/**
 * The code files under `relative`, down to the depth limit. Stops once past the
 * file limit, so a folder of thousands is not walked to the end just to be
 * refused - the same shape as the scanner's own walk (folder.ts).
 *
 * Symbolic links and everything else are left where they are, as the scanner
 * leaves them: a plugin is the code in front of you.
 */
function collect(tree: SourceTree, relative: string, depth: number, out: string[]): void {
  if (out.length > LIMITS.files) return
  for (const entry of tree.list(relative).sort((a, b) => a.name.localeCompare(b.name))) {
    if (isNoise(entry.name)) continue
    const child = relative === '' ? entry.name : `${relative}/${entry.name}`
    if (entry.kind === 'dir') {
      if (depth < LIMITS.depth) collect(tree, child, depth + 1, out)
    } else if (entry.kind === 'file' && isCode(entry.name)) {
      out.push(child)
    }
  }
}

/**
 * Whether the files would load at all, said before anything is copied.
 *
 * A plugin that does not compile, or that imports a package, fails when the
 * worker loads it - which is after it has been installed, turned on and given
 * a pane, and the reason is then a line in a settings row rather than an answer
 * to what the user just did. The two things that can be known without running
 * it are checked here instead: the code parses, and every import it makes is a
 * file that came with it.
 *
 * The resolution below mirrors the worker's (shared/plugin-runtime.ts); change
 * one and change the other.
 */
export function checkSources(files: readonly SourceFile[]): string | null {
  const byPath = new Map(files.map((file) => [file.path, file]))
  for (const file of files) {
    let code: string
    try {
      // Sucrase turns every value import into a require call, so the specifiers
      // can be read off the result rather than parsed out of the source.
      code = transformFile(file)
    } catch (error) {
      return message(error)
    }
    for (const specifier of requires(code)) {
      const problem = resolves(file.path, specifier, byPath)
      if (problem !== null) return `${file.path}: ${problem}`
    }
  }
  return null
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

/** Why a specifier would not resolve, or null when it would. */
function resolves(from: string, specifier: string, files: Map<string, SourceFile>): string | null {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return `imports "${specifier}", and a plugin can import only its own files`
  }
  const parts = from.split('/').slice(0, -1)
  for (const segment of specifier.split('/').filter((part) => part !== '.' && part !== '')) {
    if (segment !== '..') parts.push(segment)
    else if (parts.pop() === undefined) return `imports "${specifier}", which is outside the folder`
  }
  const base = parts.join('/')
  const candidates = [base, `${base}.ts`, `${base}.js`, `${base}/index.ts`, `${base}/index.js`]
  if (candidates.some((candidate) => files.has(candidate))) return null
  return `imports "${specifier}", which is not in the folder`
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
  /** Injected by the tests; `checkSources` otherwise. */
  check?: (files: readonly SourceFile[]) => string | null
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

  const plan = planInstall(options.tree ?? diskTree(resolved))
  if ('error' in plan) return { status: 'refused', reason: plan.error }

  // Read once: the check needs the source, and the limits above bound it.
  let sources: SourceFile[]
  try {
    sources = plan.files.map((file) => ({
      path: file,
      source: readFileSync(path.join(resolved, file), 'utf8'),
    }))
  } catch (error) {
    return { status: 'refused', reason: message(error) }
  }
  const problem = options.check?.(sources) ?? checkSources(sources)
  if (problem !== null) return { status: 'refused', reason: problem }

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
