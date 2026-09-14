import { spawn } from 'node:child_process'

/**
 * Launcher icons on Windows, drawn by the Windows shell itself.
 *
 * Electron's `app.getFileIcon` gets many of them wrong. It files every icon that
 * is not an .exe, .dll or .ico under its extension, so all shortcuts without a
 * readable target (Office's advertised shortcuts, File Explorer) and all .msc
 * consoles share one generic icon. And for some executables (Task Manager,
 * Magnify, Git Bash, apps built with electron-builder) it returns Windows'
 * generic program icon. Asking the shell for the icon of the shortcut file itself
 * gives what the Start Menu shows: it resolves advertised shortcuts, icon
 * locations with an index or a resource id, and packaged icons.
 *
 * The icon comes from the system image list by index (`SHGFI_SYSICONINDEX`),
 * which leaves off the shortcut arrow that `SHGFI_ICON` would draw over it; 32
 * pixels, the size the launcher used before.
 *
 * One PowerShell runs per batch, reading one base64 UTF-8 path per line on stdin
 * (so no path is ever part of a command line) and writing one line back per
 * path: a base64 PNG, or `-` when there is no icon. Batches are rare - the first
 * time the launcher shows its tiles, and after its catalog changes - and the
 * icons are cached for the life of the app.
 */

/** Paths per PowerShell run: a Start Menu is a few hundred shortcuts; stdout stays small. */
export const ICON_BATCH_MAX = 64

/** How long requests are collected into one batch. */
export const ICON_BATCH_DELAY_MS = 20

/** A run that takes longer than this has hung (a network path, a stuck shell extension). */
export const ICON_RUN_TIMEOUT_MS = 20_000

const SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class ElecdexShellIcon {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct Info {
    public IntPtr hIcon;
    public int iIcon;
    public uint attributes;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string displayName;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 80)] public string typeName;
  }
  [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
  public static extern IntPtr SHGetFileInfo(string path, uint attributes, ref Info info, uint size, uint flags);
  [DllImport("comctl32.dll")]
  public static extern IntPtr ImageList_GetIcon(IntPtr list, int index, uint flags);
  [DllImport("user32.dll")]
  public static extern bool DestroyIcon(IntPtr icon);
}
'@
$size = [Runtime.InteropServices.Marshal]::SizeOf([type][ElecdexShellIcon+Info])
while ($null -ne ($line = [Console]::In.ReadLine())) {
  $icon = [IntPtr]::Zero
  try {
    $file = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($line))
    $info = New-Object ElecdexShellIcon+Info
    # SHGFI_SYSICONINDEX: the large system image list, and the icon's index in it.
    $list = [ElecdexShellIcon]::SHGetFileInfo($file, 0, [ref]$info, $size, 0x4000)
    # ILD_TRANSPARENT
    if ($list -ne [IntPtr]::Zero) { $icon = [ElecdexShellIcon]::ImageList_GetIcon($list, $info.iIcon, 1) }
    if ($icon -eq [IntPtr]::Zero) { [Console]::Out.WriteLine('-'); continue }
    $bitmap = [Drawing.Icon]::FromHandle($icon).ToBitmap()
    $stream = New-Object IO.MemoryStream
    $bitmap.Save($stream, [Drawing.Imaging.ImageFormat]::Png)
    [Console]::Out.WriteLine([Convert]::ToBase64String($stream.ToArray()))
  } catch {
    [Console]::Out.WriteLine('-')
  } finally {
    if ($icon -ne [IntPtr]::Zero) { [void][ElecdexShellIcon]::DestroyIcon($icon) }
  }
}
`

/** Runs PowerShell with `input` on stdin; resolves with its stdout. */
export type PowerShellRunner = (script: string, input: string) => Promise<string>

export const runPowerShell: PowerShellRunner = (script, input) =>
  new Promise((resolve, reject) => {
    // The script is passed as a command, never written to or run from a file,
    // so Windows' ExecutionPolicy does not apply to it.
    const child = spawn(
      'powershell.exe',
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script],
      {
        windowsHide: true,
      },
    )
    let stdout = ''
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error('icon extraction timed out'))
    }, ICON_RUN_TIMEOUT_MS)
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve(stdout)
      else reject(new Error(`icon extraction exited with code ${code}`))
    })
    child.stdin.end(input)
  })

const PNG_BASE64 = /^iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/

/**
 * The script's output as data URLs, one per path asked for. A line that is not a
 * base64 PNG is no icon; output for a different number of paths is no icons at
 * all, since the lines could no longer be matched to the paths.
 */
export function parseIconLines(stdout: string, count: number): Array<string | null> {
  const lines = stdout.split(/\r?\n/).filter((line) => line !== '')
  if (lines.length !== count) return Array.from({ length: count }, () => null)
  return lines.map((line) => (PNG_BASE64.test(line) ? `data:image/png;base64,${line}` : null))
}

/** The shell's icons for `files`, in order; null where there is none. */
export async function extractWindowsIcons(
  files: readonly string[],
  run: PowerShellRunner = runPowerShell,
): Promise<Array<string | null>> {
  if (files.length === 0) return []
  const input = `${files.map((file) => Buffer.from(file, 'utf8').toString('base64')).join('\n')}\n`
  return parseIconLines(await run(SCRIPT, input), files.length)
}

/**
 * Collects icon requests arriving together - the launcher asks for each tile's
 * icon separately - into batches, so a screenful of tiles costs one PowerShell
 * rather than one each. Batches run one at a time: requests that arrive during a
 * run, or that did not fit in it, go in the next. A failed batch answers null for
 * its files; the caller decides what to fall back to.
 */
export class IconBatcher {
  readonly #extract: (files: readonly string[]) => Promise<Array<string | null>>
  readonly #delayMs: number
  readonly #pending = new Map<string, Array<(icon: string | null) => void>>()
  #timer: ReturnType<typeof setTimeout> | null = null
  #running = false

  constructor(
    extract: (files: readonly string[]) => Promise<Array<string | null>> = extractWindowsIcons,
    delayMs = ICON_BATCH_DELAY_MS,
  ) {
    this.#extract = extract
    this.#delayMs = delayMs
  }

  get(file: string): Promise<string | null> {
    return new Promise((resolve) => {
      const waiting = this.#pending.get(file)
      if (waiting) waiting.push(resolve)
      else this.#pending.set(file, [resolve])
      this.#schedule()
    })
  }

  #schedule(): void {
    if (this.#running || this.#timer !== null || this.#pending.size === 0) return
    this.#timer = setTimeout(() => void this.#flush(), this.#delayMs)
  }

  async #flush(): Promise<void> {
    this.#timer = null
    this.#running = true
    const batch = [...this.#pending].slice(0, ICON_BATCH_MAX)
    for (const [file] of batch) this.#pending.delete(file)
    let icons: ReadonlyArray<string | null> = []
    try {
      icons = await this.#extract(batch.map(([file]) => file))
    } catch {
      // No icons from this batch; each file answers null below.
    }
    batch.forEach(([, waiting], i) => {
      for (const resolve of waiting) resolve(icons[i] ?? null)
    })
    this.#running = false
    this.#schedule()
  }
}
