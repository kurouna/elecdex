import { chmodSync, existsSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

/**
 * Makes node-pty's macOS spawn-helper executable.
 *
 * node-pty 1.1.0 publishes its prebuilt darwin binaries with mode 0644, so on
 * macOS every shell fails to start ("posix_spawnp failed"). Run from this
 * project's postinstall; a no-op elsewhere and once the bit is set.
 */
if (process.platform === 'darwin') {
  const require = createRequire(import.meta.url)
  const root = path.dirname(require.resolve('node-pty/package.json'))
  for (const dir of ['prebuilds/darwin-arm64', 'prebuilds/darwin-x64', 'build/Release']) {
    const helper = path.join(root, dir, 'spawn-helper')
    if (!existsSync(helper)) continue
    const mode = statSync(helper).mode
    if ((mode & 0o111) !== 0o111) {
      chmodSync(helper, mode | 0o755)
      console.log(`[elecdex] made ${path.relative(process.cwd(), helper)} executable`)
    }
  }
}
