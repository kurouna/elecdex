import { existsSync } from 'node:fs'
import path from 'node:path'
import { sniffImage } from '@shared/git'

/**
 * How the command the user set for opening a file is started.
 *
 * It is started as a program with its arguments, never as a line for a shell,
 * so nothing in a file name can run. Windows is the exception that has to be
 * handled: the commands people set most (`code`, `cursor`) are `.cmd` files,
 * and Node refuses to start a batch file without a shell (CVE-2024-27980). Such
 * a command goes through `cmd.exe /d /s /c` with every argument quoted - and
 * only when no argument holds a character cmd.exe would still act on inside
 * quotes. A file whose name has one is refused with a message saying to point
 * the command at the program's .exe instead, rather than being passed on.
 */

export type LaunchPlan =
  | { kind: 'spawn'; program: string; args: string[] }
  | { kind: 'cmd'; line: string }
  | { kind: 'refused'; message: string }

/** Characters cmd.exe acts on even inside double quotes, or that end the quotes. */
const CMD_UNSAFE = /["%^&|<>!\r\n]/

/** Finds a bare command on PATH the way Windows does, trying each PATHEXT. */
export function resolveOnPath(
  program: string,
  env: { PATH?: string; PATHEXT?: string },
  exists: (file: string) => boolean = existsSync,
): string {
  if (/[\\/]/.test(program)) return program
  const extensions = (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
  const hasExtension = path.extname(program) !== ''
  for (const folder of (env.PATH ?? '').split(';').filter(Boolean)) {
    if (hasExtension && exists(path.win32.join(folder, program))) {
      return path.win32.join(folder, program)
    }
    for (const extension of extensions) {
      const candidate = path.win32.join(folder, program + extension.toLowerCase())
      if (exists(candidate)) return candidate
    }
  }
  return program
}

export function launchPlan(
  program: string,
  args: readonly string[],
  platform: NodeJS.Platform,
  resolve: (program: string) => string,
): LaunchPlan {
  if (platform !== 'win32') return { kind: 'spawn', program, args: [...args] }
  const resolved = resolve(program)
  if (!/\.(cmd|bat)$/i.test(resolved)) return { kind: 'spawn', program: resolved, args: [...args] }
  const parts = [resolved, ...args]
  if (parts.some((part) => CMD_UNSAFE.test(part))) {
    return {
      kind: 'refused',
      message:
        'The command is a .cmd, and this path has a character cmd.exe would act on. Set the command to the program itself (its .exe).',
    }
  }
  // /s strips the outer quotes and leaves each quoted argument as it is.
  return { kind: 'cmd', line: `"${parts.map((part) => `"${part}"`).join(' ')}"` }
}

/**
 * Files the system's own "open" would run rather than show: programs, scripts,
 * shortcuts and installers. With no command set, the pane opens a file the way
 * a double-click in the file manager would, and in a repository just cloned
 * that could be `setup.bat`; such a file is shown in its folder instead, so a
 * pane that only reads never starts one.
 */
const RUNS_ON: Record<string, readonly string[]> = {
  win32: [
    '.exe',
    '.com',
    '.bat',
    '.cmd',
    '.ps1',
    '.psm1',
    '.vbs',
    '.vbe',
    '.js',
    '.jse',
    '.wsf',
    '.wsh',
    '.msc',
    '.msi',
    '.msp',
    '.scr',
    '.pif',
    '.lnk',
    '.url',
    '.hta',
    '.cpl',
    '.reg',
    '.jar',
    '.appref-ms',
    '.application',
    '.scf',
    '.inf',
    '.settingcontent-ms',
    // What an installer associates with its interpreter: Git for Windows runs .sh in Git Bash
    // on a double-click, the Python launcher .py, and Ruby, Perl and AutoHotkey theirs.
    '.sh',
    '.py',
    '.pyw',
    '.pyz',
    '.pyzw',
    '.rb',
    '.rbw',
    '.pl',
    '.ahk',
    // Text the shell acts on when it is opened (issue 26): saved searches and libraries reach
    // for a share (and offer the user's NTLM hash), themes and shortcuts name what to load,
    // scriptlets and package installers run.
    '.library-ms',
    '.search-ms',
    '.searchconnector-ms',
    '.website',
    '.theme',
    '.themepack',
    '.sct',
    '.wsc',
    '.ws',
    '.appinstaller',
    '.diagcab',
  ],
  darwin: [
    '.app',
    '.command',
    '.tool',
    '.terminal',
    '.workflow',
    '.action',
    '.pkg',
    '.mpkg',
    '.jar',
    // Finder's links to a file, a page or a server: opened, they go there (issue 26).
    '.fileloc',
    '.webloc',
    '.inetloc',
  ],
  linux: ['.desktop', '.appimage', '.run', '.sh', '.jar', '.deb', '.rpm'],
}

/**
 * A file's extension as the platform it opens on reads its name - Windows' separators on
 * Windows whatever runs this (on Linux, `C:\w\.gitignore` read as one name gave it the
 * extension `.gitignore`, and CI saw what Windows never does).
 */
const extensionOn = (file: string, platform: NodeJS.Platform): string =>
  (platform === 'win32' ? path.win32 : path.posix).extname(file).toLowerCase()

export function runsWhenOpened(file: string, platform: NodeJS.Platform): boolean {
  const extension = extensionOn(file, platform)
  return extension !== '' && (RUNS_ON[platform] ?? RUNS_ON.linux ?? []).includes(extension)
}

/**
 * What OPEN does with a file of the working tree when no command is set (issue 26): opens it
 * only when its first bytes are text, a picture or a PDF, and it is neither a kind the system
 * would run nor, off Windows, marked executable; anything else is shown in its folder. A
 * repository is anyone's: a file's name says nothing of what it is (`README.md` may be a
 * compiled help file, `README` a script Finder runs in Terminal).
 *
 * On Windows the program is picked by the name alone, so text named `.doc`, `.xls` or `.iqy`
 * opens in Office with its macros and links (found in review): there a file opens only when its
 * kind is one of `OPENS_ON_WINDOWS`, or it has none.
 *
 * `head`: the file's first bytes (a few kilobytes); `mode`: its permission bits.
 */
export function openVerdict(
  file: string,
  platform: NodeJS.Platform,
  head: Uint8Array,
  mode: number,
): 'open' | 'reveal' {
  if (runsWhenOpened(file, platform)) return 'reveal'
  if (platform === 'win32') {
    const extension = extensionOn(file, platform)
    if (extension !== '' && !OPENS_ON_WINDOWS.has(extension)) return 'reveal'
  } else if ((mode & 0o111) !== 0) {
    return 'reveal'
  }
  return looksText(head) || sniffImage(head) !== null || isPdf(head) ? 'open' : 'reveal'
}

/**
 * The kinds Windows opens in an editor, a picture viewer or a PDF reader: source, text and
 * configuration, pictures, PDFs. Not what Office takes (csv, xml, rtf and the rest), nor a
 * page archive, a disk image (`vhd` mounts, past the mark of the web), nor what an installer
 * may hand to its interpreter (lua, hs, groovy; py, rb and the rest run, `RUNS_ON`). A name
 * with no extension of its own - `.env`, `.editorconfig`, `Makefile` - opens as text.
 */
const OPENS_ON_WINDOWS: ReadonlySet<string> = new Set(
  [
    // Text and documentation.
    'txt text md markdown mdx rst adoc asciidoc org tex bib log diff patch',
    // Configuration and data.
    'json jsonc json5 jsonl ndjson yaml yml toml ini cfg conf properties lock mod sum sample',
    // Source.
    'ts tsx mts cts jsx mjs cjs c h cc cpp cxx hh hpp hxx cs java kt kts scala go rs swift m mm',
    'php dart r jl ex exs erl hrl ml mli fs fsi clj cljs elm zig nim v sv vhdl pyi',
    'sql graphql gql proto thrift tf hcl nix cmake mk gradle bzl sbt cabal s asm http',
    'glsl hlsl wgsl map snap',
    'vue svelte astro css scss sass less styl html htm svg hbs ejs pug j2',
    'ipynb',
    // Pictures and PDFs.
    'png jpg jpeg gif webp bmp ico avif pdf',
  ]
    .join(' ')
    .split(' ')
    .map((kind) => `.${kind}`),
)

const isPdf = (head: Uint8Array): boolean =>
  head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46 // %PDF

/**
 * Text: no NUL in the first bytes (git's own test for binary), in whatever encoding - Shift_JIS
 * and EUC-JP too (found in review: only UTF-8 was taken) - or UTF-16 by its byte order mark.
 */
function looksText(head: Uint8Array): boolean {
  if ((head[0] === 0xff && head[1] === 0xfe) || (head[0] === 0xfe && head[1] === 0xff)) return true
  return !head.includes(0)
}
