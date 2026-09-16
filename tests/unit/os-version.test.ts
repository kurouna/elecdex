import { describe, expect, it } from 'vitest'
import { parseWindowsVersion } from '../../src/services/metrics/os-version.js'

/** The shape `reg query` prints, trimmed to a few values (CRLF, as on Windows). */
const reg = (...values: string[]): string =>
  [
    '',
    String.raw`HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion`,
    ...values,
    '',
  ].join('\r\n')

describe('parseWindowsVersion', () => {
  it('reads the display version and the build with its update revision', () => {
    const out = reg(
      String.raw`    SystemRoot    REG_SZ    C:\WINDOWS`,
      '    CurrentBuild    REG_SZ    26200',
      '    CurrentBuildNumber    REG_SZ    26200',
      '    DisplayVersion    REG_SZ    25H2',
      // Windows 11 still says 10 here, which is why the name is not taken from it.
      '    ProductName    REG_SZ    Windows 10 Pro',
      '    UBR    REG_DWORD    0x24f1',
    )
    expect(parseWindowsVersion(out)).toEqual({ displayVersion: '25H2', build: '26200.9457' })
  })

  it('falls back to CurrentBuild and leaves the revision out when it is missing', () => {
    const out = reg('    CurrentBuild    REG_SZ    17763')
    expect(parseWindowsVersion(out)).toEqual({ displayVersion: '', build: '17763' })
  })

  it('ignores a malformed revision', () => {
    const out = reg('    CurrentBuildNumber    REG_SZ    26200', '    UBR    REG_SZ    x')
    expect(parseWindowsVersion(out).build).toBe('26200')
  })

  it('does not invent a build from a revision alone', () => {
    expect(parseWindowsVersion(reg('    UBR    REG_DWORD    0x1'))).toEqual({
      displayVersion: '',
      build: '',
    })
  })

  it('returns empty values for empty output', () => {
    expect(parseWindowsVersion('')).toEqual({ displayVersion: '', build: '' })
  })
})
