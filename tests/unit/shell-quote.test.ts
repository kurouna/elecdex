import { describe, expect, it } from 'vitest'
import { cdCommand, quotePath, shellKindOf } from '../../src/renderer/lib/shell-quote.js'

describe('shellKindOf', () => {
  it.each([
    ['powershell', 'powershell'],
    ['pwsh', 'powershell'],
    ['bash', 'posix'],
    ['zsh', 'posix'],
    ['sh', 'posix'],
    ['fish', 'fish'],
    ['cmd', 'cmd'],
  ] as const)('%s is %s', (shell, kind) => {
    expect(shellKindOf(shell)).toBe(kind)
  })
})

describe('quotePath', () => {
  it('leaves plain paths readable', () => {
    expect(quotePath('/home/me/src', 'posix')).toBe('/home/me/src')
    expect(quotePath('C:\\Users\\me', 'powershell')).toBe('C:\\Users\\me')
  })

  it('quotes spaces and shell metacharacters literally', () => {
    expect(quotePath('/tmp/my dir', 'posix')).toBe("'/tmp/my dir'")
    expect(quotePath('/tmp/$HOME', 'posix')).toBe("'/tmp/$HOME'")
    expect(quotePath('C:\\Program Files', 'powershell')).toBe("'C:\\Program Files'")
    expect(quotePath('C:\\a$b', 'powershell')).toBe("'C:\\a$b'")
  })

  it('escapes a quote inside the name, per shell', () => {
    expect(quotePath("/tmp/it's", 'posix')).toBe("'/tmp/it'\\''s'")
    expect(quotePath("C:\\it's", 'powershell')).toBe("'C:\\it''s'")
    expect(quotePath("/tmp/it's", 'fish')).toBe("'/tmp/it\\'s'")
  })

  it('uses double quotes for cmd, which has no single-quote syntax', () => {
    expect(quotePath('C:\\Program Files', 'cmd')).toBe('"C:\\Program Files"')
    expect(quotePath('C:\\Windows', 'cmd')).toBe('C:\\Windows')
  })
})

describe('cdCommand', () => {
  it('changes drive too under cmd', () => {
    expect(cdCommand('D:\\data', 'cmd')).toBe('cd /d D:\\data')
    expect(cdCommand('D:\\data', 'powershell')).toBe('cd D:\\data')
  })
})
