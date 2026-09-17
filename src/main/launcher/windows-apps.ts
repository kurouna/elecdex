import { type PowerShellRunner, runPowerShell } from './windows-icons.js'

/**
 * What the Windows Start Menu shows that its folders do not say.
 *
 * Packaged apps (MSIX and Store apps such as the new Teams, Outlook, Terminal or
 * Calculator, and web apps installed from Edge) have no shortcut in either Start
 * Menu folder: the shell lists them in its Applications folder
 * (`shell:AppsFolder`) by their Application User Model ID, and they start
 * through it. And shortcuts carry the English file name where the Start Menu
 * shows a localized one ("Command Prompt.lnk" is コマンド プロンプト), which
 * the folder's desktop.ini supplies to the shell.
 *
 * One PowerShell run answers both. It reads one base64 UTF-8 path per line on
 * stdin (shortcuts and group folders, so no path is ever on a command line) and
 * writes `n <base64 name>` per path, or `n -` when the shell has no name for it,
 * then `a <base64 name> <base64 id>` per packaged app. Everything else in the
 * Applications folder comes from the shortcuts already listed.
 */

export const APPS_FOLDER = 'shell:AppsFolder\\'

/**
 * A packaged app's Application User Model ID: the package family name (name,
 * underscore, 13-character publisher id), `!`, and the app's id in its manifest.
 * Nothing else is ever put after `shell:AppsFolder\`.
 */
const PACKAGED_APP_ID = /^[A-Za-z0-9.-]{1,100}_[a-z0-9]{13}![A-Za-z][A-Za-z0-9.]{0,99}$/

export function isPackagedAppId(id: string): boolean {
  return PACKAGED_APP_ID.test(id)
}

/** The packaged app a launcher target names, or null when it names anything else. */
export function packagedAppIdOf(target: string): string | null {
  if (!target.startsWith(APPS_FOLDER)) return null
  const id = target.slice(APPS_FOLDER.length)
  return isPackagedAppId(id) ? id : null
}

export interface PackagedApp {
  name: string
  appId: string
}

export interface WindowsShellView {
  /** The shell's display name for each path asked about, in order; null where it has none. */
  names: Array<string | null>
  apps: PackagedApp[]
}

const SCRIPT = `
$ErrorActionPreference = 'Stop'
$shell = New-Object -ComObject Shell.Application
$utf8 = [Text.Encoding]::UTF8
function Encode([string]$text) { [Convert]::ToBase64String($utf8.GetBytes($text)) }
while ($null -ne ($line = [Console]::In.ReadLine())) {
  try {
    $path = $utf8.GetString([Convert]::FromBase64String($line))
    $item = $shell.NameSpace([IO.Path]::GetDirectoryName($path)).ParseName([IO.Path]::GetFileName($path))
    if ($null -eq $item -or [string]::IsNullOrWhiteSpace($item.Name)) { [Console]::Out.WriteLine('n -') }
    else { [Console]::Out.WriteLine('n ' + (Encode $item.Name)) }
  } catch {
    [Console]::Out.WriteLine('n -')
  }
}
try {
  foreach ($app in @($shell.NameSpace('shell:AppsFolder').Items())) {
    $id = [string]$app.Path
    if ($id.Contains('!') -and -not [string]::IsNullOrWhiteSpace($app.Name)) {
      [Console]::Out.WriteLine('a ' + (Encode $app.Name) + ' ' + (Encode $id))
    }
  }
} catch {
  # No Applications folder: the shortcuts alone are listed.
}
`

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/

function decode(text: string): string | null {
  if (text === '-' || !BASE64.test(text)) return null
  const value = Buffer.from(text, 'base64').toString('utf8').trim()
  return value === '' ? null : value
}

function parseApp(line: string): PackagedApp | null {
  const [, rawName = '', rawId = ''] = line.split(' ')
  const name = decode(rawName)
  const appId = decode(rawId)
  if (name === null || appId === null || !isPackagedAppId(appId)) return null
  return { name, appId }
}

/**
 * The script's output. Names for a different number of paths are no names at
 * all, since they could no longer be matched to the paths; the apps stand on
 * their own. Lines the script would not write are ignored.
 */
export function parseShellView(stdout: string, count: number): WindowsShellView {
  const names: Array<string | null> = []
  const apps: PackagedApp[] = []
  for (const line of stdout.split(/\r?\n/)) {
    if (line.startsWith('n ')) names.push(decode(line.slice(2)))
    else if (line.startsWith('a ')) {
      const app = parseApp(line)
      if (app !== null) apps.push(app)
    }
  }
  return {
    names: names.length === count ? names : Array.from({ length: count }, () => null),
    apps,
  }
}

/** The shell's names for `paths` and its packaged apps. */
export async function readWindowsShell(
  paths: readonly string[],
  run: PowerShellRunner = runPowerShell,
): Promise<WindowsShellView> {
  const input = paths.map((p) => `${Buffer.from(p, 'utf8').toString('base64')}\n`).join('')
  return parseShellView(await run(SCRIPT, input), paths.length)
}
