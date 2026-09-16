/**
 * The Windows version, read from the registry in one process.
 *
 * systeminformation's osInfo() starts five PowerShells on Windows (one of them
 * loads Windows Forms) and still leaves out the update revision (UBR), the part
 * after the dot in "Build 26200.9457". `reg query` prints every value we need.
 * ProductName is deliberately not used: Windows 11 still reports "Windows 10"
 * there, so the name comes from os.version(), which corrects it.
 */

export interface WindowsVersion {
  /** "25H2"; empty on releases before DisplayVersion existed. */
  displayVersion: string
  /** "26200.9457", or "26200" when the update revision is missing. */
  build: string
}

/** Parses `reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion"`. */
export function parseWindowsVersion(stdout: string): WindowsVersion {
  const values = new Map<string, string>()
  for (const line of stdout.split(/\r?\n/)) {
    const match = /^\s+(\S+)\s+REG_(?:SZ|DWORD)\s+(.*?)\s*$/.exec(line)
    if (match?.[1] && match[2] !== undefined) values.set(match[1], match[2])
  }
  const build = values.get('CurrentBuildNumber') || values.get('CurrentBuild') || ''
  const ubrRaw = values.get('UBR') ?? ''
  const ubr = /^0x[0-9a-f]+$/i.test(ubrRaw) ? Number.parseInt(ubrRaw, 16) : Number.NaN
  return {
    displayVersion: values.get('DisplayVersion') ?? '',
    build: build !== '' && Number.isFinite(ubr) ? `${build}.${ubr}` : build,
  }
}
