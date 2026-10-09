import { describe, expect, it } from 'vitest'
import { foreignElecdex } from '../e2e/reporter'

/**
 * The e2e reporter names an elecdex running outside the tests when one fails (2026-10-10: an
 * installed elecdex left open made a launch and a tab drag fail). Only the tests' own apps,
 * started on an elecdex-e2e- profile, are left out.
 */
describe('foreignElecdex', () => {
  it('names the installed app and a development run, not the tests’ own apps', () => {
    const rows = [
      {
        pid: 1,
        name: 'elecdex.exe',
        command: '"C:\\Users\\me\\AppData\\Local\\Programs\\elecdex\\elecdex.exe"',
      },
      {
        pid: 2,
        name: 'electron.exe',
        command: 'electron.exe C:\\src\\elecdex\\out\\main\\index.js',
      },
      {
        pid: 3,
        name: 'electron.exe',
        command: 'electron.exe out/main/index.js --user-data-dir=C:\\Temp\\elecdex-e2e-abc',
      },
      { pid: 4, name: 'electron.exe', command: 'electron.exe C:\\other\\app\\main.js' },
      { pid: 5, name: 'elecdex', command: '/opt/elecdex/elecdex' },
    ]
    expect(foreignElecdex(rows).map((r) => r.pid)).toEqual([1, 2, 5])
  })
})
