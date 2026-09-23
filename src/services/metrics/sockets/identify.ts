import { splitCommandLine } from '@shared/command-line'
import type { SocketOwner } from '@shared/metrics'

/**
 * What a listening process is, told from its command line.
 *
 * The socket table names a listener's process, and on a developer's machine that
 * name is mostly `node` - five of them, one per dev server, and nothing to tell
 * them apart. The command line does: `node …\elecdex\node_modules\vite\bin\vite.js`
 * is Vite, serving elecdex. So the collector reads the command line of each
 * listening process once (the platform readers cache it) and keeps only what
 * this function makes of it - a tool and a project - never the line itself,
 * which can carry a token or a password as an argument.
 *
 * Nothing is asked of the port: knowing what a server is by talking to it would
 * be a request the user did not make.
 */

/** The owner as the platform reader found it. */
export interface RawCommand {
  pid: number
  /** The executable's full path, or '' when the process is not ours to read. */
  exe: string
  /** The whole command line, as the OS holds it. */
  commandLine: string
  /** The working directory, where the platform tells it (Linux); '' elsewhere. */
  cwd: string
}

/** Script runtimes: the program that matters is their first argument, not them. */
const SCRIPT_RUNTIMES = new Set(['node', 'bun', 'deno', 'tsx', 'ts-node'])
const PYTHONS = /^(python|pythonw|py)(\d+(\.\d+)?)?$/
/** Folders that hold a project's tools rather than being the project. */
const TOOL_FOLDERS = new Set(['node_modules', '.venv', 'venv', 'env', 'site-packages', 'scripts'])

const LIMIT = 40

const segments = (path: string): string[] => path.split(/[\\/]+/).filter((part) => part !== '')

const baseName = (path: string): string => segments(path).at(-1) ?? ''

const stem = (path: string): string =>
  baseName(path).replace(/\.(exe|cmd|bat|m?[jt]s|cjs|py|jar|dll)$/i, '')

const clip = (text: string): string => (text.length > LIMIT ? `${text.slice(0, LIMIT - 1)}…` : text)

/**
 * The project a path belongs to: the folder above the first tool folder in it
 * (`…\elecdex\node_modules\vite\…` is elecdex's), else the folder the script
 * sits in.
 */
export function projectOf(path: string): string {
  const parts = segments(path)
  const tools = parts.findIndex((part) => TOOL_FOLDERS.has(part.toLowerCase()))
  if (tools > 0) return parts[tools - 1] ?? ''
  if (tools === 0) return ''
  return parts.length >= 2 ? (parts.at(-2) ?? '') : ''
}

/** The package a path inside node_modules runs: `vite`, `@angular/cli`, a `.bin` name. */
function packageOf(path: string): string {
  const parts = segments(path)
  const at = parts.map((part) => part.toLowerCase()).lastIndexOf('node_modules')
  if (at < 0) return ''
  const first = parts[at + 1] ?? ''
  if (first === '.bin') return stem(parts[at + 2] ?? '')
  return first.startsWith('@') ? `${first}/${parts[at + 2] ?? ''}` : first
}

/** A runtime's options that take the next argument as their value (`-r dotenv/config`). */
const NODE_VALUED = new Set([
  '-r',
  '--require',
  '--import',
  '--loader',
  '--experimental-loader',
  '--inspect-port',
  '--env-file',
  '-C',
  '--conditions',
  '--title',
  '--watch-path',
  '--input-type',
])
const PYTHON_VALUED = new Set(['-W', '-X', '--check-hash-based-pycs'])
/** Options whose value is code, not a file: there is no script, and the code is never shown. */
const NODE_INLINE = new Set(['-e', '--eval', '-p', '--print'])
const PYTHON_INLINE = new Set(['-c'])

/**
 * The first argument after the runtime that is not an option or an option's
 * value: the script. Null when the program is code on the command line
 * (`node -e`, `python -c`), which must not become a label.
 */
function firstOperand(
  args: readonly string[],
  valued: ReadonlySet<string>,
  inline: ReadonlySet<string>,
): string | null {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] ?? ''
    const option = arg.split('=')[0] ?? arg
    if (inline.has(option)) return null
    if (arg.startsWith('-')) {
      if (valued.has(arg)) i += 1
      continue
    }
    // `deno run main.ts`, `bun run dev`: the subcommand is not the script.
    if (arg === 'run') continue
    // `deno eval <code>`
    if (arg === 'eval') return null
    return arg
  }
  return null
}

function fromScript(script: string, cwd: string): SocketOwner {
  const pkg = packageOf(script)
  if (pkg !== '') return { tool: pkg, project: projectOf(script) }
  // `node server.js` is told apart by its folder: a relative script sits in the
  // working directory, which only Linux reports.
  return { tool: stem(script), project: projectOf(script) || baseName(cwd) }
}

function fromPython(args: readonly string[], cwd: string): SocketOwner {
  const module = args.indexOf('-m')
  const code = args.indexOf('-c')
  if (module >= 0 && args[module + 1] !== undefined && (code < 0 || module < code)) {
    return { tool: args[module + 1] ?? '', project: baseName(cwd) }
  }
  const script = firstOperand(args, PYTHON_VALUED, PYTHON_INLINE)
  return script === null ? { tool: '', project: '' } : fromScript(script, cwd)
}

function fromJava(args: readonly string[], cwd: string): SocketOwner {
  const jar = args.indexOf('-jar')
  if (jar >= 0 && args[jar + 1] !== undefined) {
    return {
      tool: stem(args[jar + 1] ?? ''),
      project: projectOf(args[jar + 1] ?? '') || baseName(cwd),
    }
  }
  return { tool: '', project: baseName(cwd) }
}

/** svchost says which service group, or which service, it is hosting. */
function fromSvchost(args: readonly string[]): SocketOwner {
  const service = args.indexOf('-s')
  if (service >= 0) return { tool: args[service + 1] ?? '', project: '' }
  const group = args.indexOf('-k')
  return { tool: group >= 0 ? (args[group + 1] ?? '') : '', project: '' }
}

/**
 * The tool and project a listening process is, or empty strings where its
 * command line says nothing its process name does not already say.
 */
export function identifyOwner(command: RawCommand): SocketOwner {
  const args = splitCommandLine(command.commandLine)
  const program = stem(command.exe || args[0] || '').toLowerCase()
  const rest = args.slice(1)
  let owner: SocketOwner = { tool: '', project: '' }
  if (SCRIPT_RUNTIMES.has(program)) {
    const script = firstOperand(rest, NODE_VALUED, NODE_INLINE)
    if (script !== null) owner = fromScript(script, command.cwd)
  } else if (PYTHONS.test(program)) owner = fromPython(rest, command.cwd)
  else if (program === 'java' || program === 'javaw') owner = fromJava(rest, command.cwd)
  else if (program === 'dotnet') {
    const dll = rest.find((arg) => /\.dll$/i.test(arg))
    owner = dll
      ? { tool: stem(dll), project: projectOf(dll) }
      : { tool: '', project: baseName(command.cwd) }
  } else if (program === 'svchost') owner = fromSvchost(rest)
  return { tool: clip(owner.tool), project: clip(owner.project) }
}

/** The owners of the listening processes, by pid, leaving out those with nothing to say. */
export function listenerOwners(commands: readonly RawCommand[]): Record<string, SocketOwner> {
  const owners: Record<string, SocketOwner> = {}
  for (const command of commands) {
    const owner = identifyOwner(command)
    if (owner.tool !== '' || owner.project !== '') owners[String(command.pid)] = owner
  }
  return owners
}
