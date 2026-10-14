import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildInjection,
  defaultShell,
  detectShellKind,
  outsideAsar,
  POWERSHELL_INIT_ENV,
  removeShellStaging,
  terminalEnv,
} from '../../src/main/pty/shell-integration.js'

describe('detectShellKind', () => {
  it.each([
    ['/bin/bash', 'bash'],
    ['/usr/local/bin/bash', 'bash'],
    ['C:\\Program Files\\Git\\bin\\bash.exe', 'bash'],
    ['/bin/zsh', 'zsh'],
    ['/usr/bin/fish', 'fish'],
    ['pwsh', 'pwsh'],
    ['C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', 'powershell'],
    ['POWERSHELL.EXE', 'powershell'],
  ] as const)('identifies %s as %s', (input, expected) => {
    expect(detectShellKind(input)).toBe(expected)
  })

  it.each(['/bin/sh', '/bin/dash', '/usr/bin/nu', '/bin/csh', 'cmd.exe'])(
    'does not claim to support %s',
    (shell) => {
      expect(detectShellKind(shell)).toBe('unknown')
    },
  )
})

describe('buildInjection', () => {
  it('points bash at our init file', () => {
    const injection = buildInjection('/bin/bash', {})
    expect(injection.supported).toBe(true)
    expect(injection.args[0]).toBe('--init-file')
    expect(injection.args[1]).toMatch(/elecdex\.bash$/)
  })

  it('redirects ZDOTDIR for zsh and remembers the real one', () => {
    const injection = buildInjection('/bin/zsh', { ZDOTDIR: '/home/me/.config/zsh' })
    expect(injection.supported).toBe(true)
    expect(injection.args).toEqual([])
    expect(injection.env.ZDOTDIR).toBeTruthy()
    expect(injection.env.ZDOTDIR).not.toBe('/home/me/.config/zsh')
    // The script needs the original in order to source the user's own rc back.
    expect(injection.env.ELECDEX_USER_ZDOTDIR).toBe('/home/me/.config/zsh')
  })

  it('stages zsh once a run, and removes it at quit', () => {
    // Found in review: a folder a zsh, never removed - one left in the temp folder per tab.
    const first = buildInjection('/bin/zsh', { HOME: '/home/me' }).env.ZDOTDIR ?? ''
    const second = buildInjection('/bin/zsh', { HOME: '/home/me' }).env.ZDOTDIR ?? ''
    expect(second).toBe(first)
    expect(existsSync(path.join(first, '.zshrc'))).toBe(true)
    removeShellStaging()
    expect(existsSync(first)).toBe(false)
    // A zsh after that gets a folder again.
    const third = buildInjection('/bin/zsh', { HOME: '/home/me' }).env.ZDOTDIR ?? ''
    expect(existsSync(path.join(third, '.zshrc'))).toBe(true)
    removeShellStaging()
  })

  it('falls back to HOME when zsh has no ZDOTDIR', () => {
    const injection = buildInjection('/bin/zsh', { HOME: '/home/me' })
    expect(injection.env.ELECDEX_USER_ZDOTDIR).toBe('/home/me')
  })

  it('prepends to XDG_DATA_DIRS for fish rather than replacing it', () => {
    const existing = '/usr/local/share:/usr/share'
    const injection = buildInjection('/usr/bin/fish', { XDG_DATA_DIRS: existing })
    expect(injection.supported).toBe(true)
    expect(injection.env.XDG_DATA_DIRS?.endsWith(existing)).toBe(true)
    expect(injection.env.XDG_DATA_DIRS).not.toBe(existing)
  })

  it('sets XDG_DATA_DIRS for fish when the user has none', () => {
    const injection = buildInjection('/usr/bin/fish', {})
    expect(injection.env.XDG_DATA_DIRS).toMatch(/shell-integration$/)
  })

  it('passes PowerShell the script inline, not as a file path', () => {
    // Windows ships with an ExecutionPolicy that refuses to run script FILES,
    // so dot-sourcing a .ps1 silently yields no integration on a default
    // install. A command is not governed by ExecutionPolicy.
    const injection = buildInjection('powershell.exe', {})
    expect(injection.supported).toBe(true)
    expect(injection.args.join(' ')).not.toMatch(/\.ps1/)

    // The script travels in the environment, and it must be our script.
    const script = injection.env[POWERSHELL_INIT_ENV]
    expect(script).toContain('ELECDEX_SHELL_INTEGRATION')
    expect(script).toContain('133;A')
    expect(script).toContain('9;9;')
  })

  it('keeps the PowerShell script off the command line', () => {
    // Windows scans a new process's command line while CreateProcess waits, in
    // main: -EncodedCommand held it for 1.4 s, and with it the window's first
    // frames. The command line only names the variable that carries the code.
    const injection = buildInjection('powershell.exe', {})
    expect(injection.args).toEqual([
      '-NoExit',
      '-Command',
      `Invoke-Expression $env:${POWERSHELL_INIT_ENV}`,
    ])
    expect(injection.args.join(' ')).not.toMatch(/EncodedCommand/i)
  })

  it('has the PowerShell script take its own text out of the environment', () => {
    // Otherwise every program started from the shell would inherit the script.
    const script = buildInjection('powershell.exe', {}).env[POWERSHELL_INIT_ENV] ?? ''
    const removal = script.indexOf(`Remove-Item Env:${POWERSHELL_INIT_ENV}`)
    expect(removal).toBeGreaterThanOrEqual(0)
    // Before the guard that returns early in a nested shell.
    expect(removal).toBeLessThan(script.indexOf('if ($env:ELECDEX_SHELL_INTEGRATION)'))
  })

  it('treats pwsh the same as powershell', () => {
    expect(buildInjection('pwsh', {})).toEqual(buildInjection('powershell.exe', {}))
  })

  it('reports an unsupported shell rather than guessing', () => {
    const injection = buildInjection('/bin/dash', {})
    expect(injection).toEqual({ args: [], env: {}, supported: false })
  })
})

describe('terminalEnv', () => {
  it('identifies the terminal to the shell', () => {
    const env = terminalEnv({ PATH: '/usr/bin' }, '1.2.3')
    expect(env.TERM).toBe('xterm-256color')
    expect(env.COLORTERM).toBe('truecolor')
    expect(env.TERM_PROGRAM).toBe('elecdex')
    expect(env.TERM_PROGRAM_VERSION).toBe('1.2.3')
    expect(env.PATH).toBe('/usr/bin')
  })

  it('drops undefined entries so node-pty gets a clean string map', () => {
    const env = terminalEnv({ SET: 'yes', UNSET: undefined }, '1.0.0')
    expect(env.SET).toBe('yes')
    expect('UNSET' in env).toBe(false)
  })

  it('keeps proxy variables, which no longer interfere', () => {
    // The original project had to delete these because it tunnelled the pty
    // over a local socket (its issue #222). We use a MessagePort, so they are
    // just part of the user's environment.
    const env = terminalEnv({ http_proxy: 'http://proxy:8080' }, '1.0.0')
    expect(env.http_proxy).toBe('http://proxy:8080')
  })
})

describe('outsideAsar', () => {
  it('maps a path inside app.asar to its unpacked twin (windows)', () => {
    expect(
      outsideAsar('C:\\Apps\\elecdex\\resources\\app.asar\\resources\\shell-integration'),
    ).toBe('C:\\Apps\\elecdex\\resources\\app.asar.unpacked\\resources\\shell-integration')
  })

  it('maps a path inside app.asar to its unpacked twin (posix)', () => {
    expect(outsideAsar('/Applications/elecdex.app/Contents/Resources/app.asar/resources/x')).toBe(
      '/Applications/elecdex.app/Contents/Resources/app.asar.unpacked/resources/x',
    )
  })

  it('leaves a dev path alone', () => {
    expect(outsideAsar('/home/me/elecdex/resources/shell-integration')).toBe(
      '/home/me/elecdex/resources/shell-integration',
    )
  })

  it('does not touch a directory that merely starts with app.asar', () => {
    expect(outsideAsar('/srv/app.asar-backups/x')).toBe('/srv/app.asar-backups/x')
  })

  it('is idempotent', () => {
    const once = outsideAsar('/r/app.asar/resources')
    expect(outsideAsar(once)).toBe(once)
  })
})

describe('defaultShell', () => {
  const pwsh = 'C:\\Program Files\\PowerShell\\7\\pwsh.exe'

  it('takes PowerShell 7 on Windows where it is installed, else Windows PowerShell', () => {
    const env = { ProgramFiles: 'C:\\Program Files' }
    expect(defaultShell(env, 'win32', (file) => file === pwsh)).toBe(pwsh)
    expect(defaultShell(env, 'win32', () => false)).toBe('powershell.exe')
    // Where ProgramFiles is not set, its usual place.
    expect(defaultShell({}, 'win32', (file) => file === pwsh)).toBe(pwsh)
  })

  it('takes the Microsoft Store alias when PowerShell 7 came from the Store', () => {
    // Found by the user: the Store's copy is not under Program Files, and its alias in the
    // user's WindowsApps is a link existsSync cannot follow.
    const alias = 'C:\\Users\\me\\AppData\\Local\\Microsoft\\WindowsApps\\pwsh.exe'
    const env = { ProgramFiles: 'C:\\Program Files', LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local' }
    expect(defaultShell(env, 'win32', (file) => file === alias)).toBe(alias)
    // The installer's copy first, where both are there.
    expect(defaultShell(env, 'win32', () => true)).toBe(pwsh)
  })

  it("takes a copy of the user's own and the .NET tool, before the Store's alias", () => {
    // Issue 19: a zip unpacked into the user's programs, or the dotnet global tool, was missed.
    const env = {
      ProgramFiles: 'C:\\Program Files',
      LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local',
      USERPROFILE: 'C:\\Users\\me',
    }
    const own = 'C:\\Users\\me\\AppData\\Local\\Programs\\PowerShell\\7\\pwsh.exe'
    const tool = 'C:\\Users\\me\\.dotnet\\tools\\pwsh.exe'
    const alias = 'C:\\Users\\me\\AppData\\Local\\Microsoft\\WindowsApps\\pwsh.exe'
    expect(defaultShell(env, 'win32', (file) => file === own)).toBe(own)
    expect(defaultShell(env, 'win32', (file) => file === tool)).toBe(tool)
    expect(defaultShell(env, 'win32', (file) => file === own || file === alias)).toBe(own)
  })

  it('takes a ComSpec that names PowerShell as it is, and SHELL elsewhere', () => {
    const comspec = 'C:\\Tools\\powershell.exe'
    expect(defaultShell({ ComSpec: comspec }, 'win32', () => true)).toBe(comspec)
    expect(defaultShell({ SHELL: '/bin/zsh' }, 'darwin', () => true)).toBe('/bin/zsh')
    expect(defaultShell({}, 'linux', () => true)).toBe('/bin/bash')
  })
})
