/**
 * The autostart entry Linux desktops read: `~/.config/autostart/<app>.desktop`.
 *
 * Electron has no login item on Linux (`setLoginItemSettings` is Windows and
 * macOS only), so elecdex writes the file itself. The format is the freedesktop
 * Desktop Entry spec, and the parts worth getting exactly right - how an `Exec`
 * line is quoted, and what "turned off" looks like - are here as pure functions
 * so they can be read and tested without a filesystem or a desktop.
 */

/** The file elecdex owns under the autostart folder. */
export const AUTOSTART_FILE = 'elecdex.desktop'

/**
 * Characters the spec reserves inside `Exec`. A value holding any of them has
 * to be quoted, which every ordinary install path avoids and "/home/Ana María"
 * does not.
 */
const RESERVED = / |\t|\n|"|'|\\|>|<|~|\||&|;|\$|\*|\?|#|\(|\)|`/
/** Inside double quotes these four keep their meaning and must be escaped. */
const ESCAPE_IN_QUOTES = /(["`$\\])/g

/** One `Exec` argument, quoted only when it has to be. */
export function quoteExecArg(value: string): string {
  if (!RESERVED.test(value)) return value
  return `"${value.replace(ESCAPE_IN_QUOTES, '\\$1')}"`
}

export interface AutostartEntry {
  /** The program to run. */
  exec: string
  args: string[]
  /**
   * Turned off while the entry stays: `Hidden=true` is what the spec says, and
   * what a desktop's own "startup applications" switch writes.
   */
  disabled?: boolean
}

/**
 * The file's text. `X-GNOME-Autostart-enabled` is written alongside `Hidden`
 * because GNOME's own tools read that one, and a file they cannot turn back on
 * is a file the user cannot manage.
 */
export function desktopEntry(entry: AutostartEntry): string {
  const command = [entry.exec, ...entry.args].map(quoteExecArg).join(' ')
  return [
    '[Desktop Entry]',
    'Type=Application',
    'Name=elecdex',
    'Comment=Science-fiction terminal and system monitor',
    `Exec=${command}`,
    'Terminal=false',
    'Icon=elecdex',
    `Hidden=${entry.disabled === true}`,
    `X-GNOME-Autostart-enabled=${entry.disabled !== true}`,
    '',
  ].join('\n')
}

/**
 * What an autostart file says, or null when it is not one at all.
 *
 * Only the keys elecdex acts on are read; anything else a desktop wrote is left
 * alone, since this is asked of a file the user may also have edited.
 */
export function parseDesktopEntry(text: string): { args: string[]; disabled: boolean } | null {
  const values = new Map<string, string>()
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('[')) continue
    const at = trimmed.indexOf('=')
    if (at <= 0) continue
    const key = trimmed.slice(0, at).trim()
    if (!values.has(key)) values.set(key, trimmed.slice(at + 1).trim())
  }
  const exec = values.get('Exec')
  if (exec === undefined) return null
  const disabled =
    values.get('Hidden') === 'true' || values.get('X-GNOME-Autostart-enabled') === 'false'
  return { args: execArgs(exec), disabled }
}

/** A quoted argument (with its escapes), or a run of characters that is not one. */
const EXEC_TOKEN = /"((?:\\.|[^"\\])*)"|(\S+)/g

/**
 * The arguments of an `Exec` line, without the program: the quoting undone, so
 * that what was written as `"--hidden"` reads back as `--hidden`.
 */
function execArgs(exec: string): string[] {
  const parts = [...exec.matchAll(EXEC_TOKEN)].map(([, quoted, bare]) =>
    quoted === undefined ? (bare ?? '') : quoted.replaceAll(/\\(.)/g, '$1'),
  )
  // The first part is the program itself.
  return parts.slice(1)
}
