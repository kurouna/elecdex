import { describe, expect, it } from 'vitest'
import {
  buildInjection,
  detectShellKind,
  outsideAsar,
  POWERSHELL_INIT_ENV,
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
    expect(script).toContain('7;file://')
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
