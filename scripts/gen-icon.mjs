/**
 * Renders the app icon from build/icon.svg.
 *
 *   build/icon.png            1024x1024 - electron-builder derives icon.ico,
 *                             icon.icns and the Linux icon set from it
 *   resources/icons/icon.png  256x256   - the window and taskbar icon at runtime
 *   resources/icons/tray-N.png N = 16, 20, 24, 32 - the notification-area icon
 *                             (Windows, Linux) at 100, 125, 150 and 200 % scaling
 *   resources/icons/trayTemplate.png, trayTemplate@2x.png - the macOS menu bar
 *                             mark, from build/tray-template.svg: a template
 *                             image is black plus alpha, so it cannot be the
 *                             colour icon shrunk
 *
 * build/icon.svg is the only hand-edited source; run this after changing it:
 *   npm run gen:icon
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(ROOT, 'build', 'icon.svg'))
const templateSvg = readFileSync(join(ROOT, 'build', 'tray-template.svg'))

const targets = [
  { out: join(ROOT, 'build', 'icon.png'), size: 1024 },
  { out: join(ROOT, 'resources', 'icons', 'icon.png'), size: 256 },
  ...[16, 20, 24, 32].map((size) => ({
    out: join(ROOT, 'resources', 'icons', `tray-${size}.png`),
    size,
  })),
  { out: join(ROOT, 'resources', 'icons', 'trayTemplate.png'), size: 16, source: templateSvg },
  { out: join(ROOT, 'resources', 'icons', 'trayTemplate@2x.png'), size: 32, source: templateSvg },
]

for (const { out, size, source = svg } of targets) {
  const png = new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng()
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, png)
  console.log(`wrote ${out} (${size}x${size}, ${(png.length / 1024).toFixed(1)} kB)`)
}
