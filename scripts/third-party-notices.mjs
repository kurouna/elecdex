import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * The third-party notices shipped with the app: THIRD_PARTY_NOTICES.txt, beside
 * the executable in a packaged build (electron-builder.yml, extraFiles).
 *
 * The packages are the ones actually in the app: every package a build bundled
 * (read from the bundler as it builds the main process, preload and page -
 * `bundledPackages`), and every package shipped as it is in app.asar (the
 * production dependencies). Each is listed with the licence text it carries.
 * The data files made from other people's data are listed from DATA_SOURCES.
 * `npm run build` writes the file (scripts/gen-notices.mjs).
 */

/** Where each build writes the packages it bundled, for gen-notices to gather. */
export const BUNDLED_DIR = path.join('out', '.notices')

/** The package a module belongs to (its folder under the last node_modules), or null for ours. */
export function packageRootOf(id) {
  if (typeof id !== 'string' || id.startsWith('\0')) return null
  const file = id.split('?')[0].replaceAll('\\', '/')
  const at = file.lastIndexOf('/node_modules/')
  if (at < 0) return null
  const rest = file.slice(at + '/node_modules/'.length).split('/')
  const name = rest[0]?.startsWith('@') ? rest.slice(0, 2) : rest.slice(0, 1)
  if (name.length === 0 || name.some((part) => part === undefined || part === '')) return null
  return path.normalize(`${file.slice(0, at)}/node_modules/${name.join('/')}`)
}

/**
 * A Vite plugin that records the packages a build bundled. `target` names the
 * build (main, preload, renderer); the list goes to out/.notices/<target>.json.
 */
export function bundledPackages(target) {
  return {
    name: 'elecdex:bundled-packages',
    apply: 'build',
    generateBundle() {
      const roots = new Set()
      for (const id of this.getModuleIds()) {
        const root = packageRootOf(id)
        // Relative to the project: the build machine's own folders are nobody's business.
        if (root !== null) roots.add(path.relative(process.cwd(), root).replaceAll('\\', '/'))
      }
      mkdirSync(BUNDLED_DIR, { recursive: true })
      writeFileSync(
        path.join(BUNDLED_DIR, `${target}.json`),
        `${JSON.stringify([...roots].sort(), null, 2)}\n`,
      )
    },
  }
}

const LICENCE_FILE = /^(licen[cs]e|copying|notice|nro_license)(\.[a-z]+)?$/i

/** What the notices say of a package: its name, version, licence and the licence files it carries. */
export function readPackage(root) {
  const manifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  const licence =
    typeof manifest.license === 'string'
      ? manifest.license
      : typeof manifest.license?.type === 'string'
        ? manifest.license.type
        : Array.isArray(manifest.licenses)
          ? manifest.licenses.map((l) => l.type).join(' OR ')
          : 'UNKNOWN'
  const repository =
    typeof manifest.repository === 'string' ? manifest.repository : manifest.repository?.url
  const author =
    typeof manifest.author === 'string' ? manifest.author : (manifest.author?.name ?? '')
  const texts = readdirSync(root)
    .filter((file) => LICENCE_FILE.test(file))
    .sort()
    .map((file) => ({ file, text: readFileSync(path.join(root, file), 'utf8').trim() }))
  return {
    name: manifest.name,
    version: manifest.version,
    license: licence,
    url: manifest.homepage ?? repository ?? '',
    repository: repositoryKey(repository),
    author,
    texts,
    borrowed: null,
  }
}

/** A repository as owner/name on its host, so the packages of one monorepo compare equal. */
function repositoryKey(url) {
  if (typeof url !== 'string') return null
  const match = /(github\.com|gitlab\.com)[/:]([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/#?]|$)/i.exec(url)
  return match ? `${match[1]}/${match[2]}/${match[3]}`.toLowerCase() : null
}

/**
 * A package that carries no licence file takes the text of another package
 * from its repository that does (the xterm.js addons, the headless build), and
 * says whose it is. One with nothing to borrow keeps none.
 */
export function withBorrowedTexts(packages) {
  return packages.map((pkg) => {
    if (pkg.texts.length > 0 || pkg.repository === null) return pkg
    const lender = packages.find(
      (other) => other !== pkg && other.repository === pkg.repository && other.texts.length > 0,
    )
    return lender ? { ...pkg, texts: lender.texts, borrowed: lender.name } : pkg
  })
}

/** The MIT terms, for the packages that declare MIT and carry no text of it. */
const MIT = `The MIT License

Copyright (c) the authors named with each package above

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

/**
 * Data made from other people's data and bundled with the app, which no
 * package carries a notice for. Kept in step with the README's "Third-party
 * assets" and the credits the panes show.
 */
export const DATA_SOURCES = [
  {
    name: 'GeoNames',
    use: 'the weather picker and the globe: cities of 500,000 people or more, and capitals (src/shared/geo/cities.json)',
    licence:
      'Creative Commons Attribution 4.0 (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/',
    credit: 'Data from GeoNames, https://www.geonames.org/',
  },
  {
    name: 'Natural Earth',
    use: "the globe's land and country shapes, and the ORBIT map's land (via world-atlas)",
    licence: 'Public domain, https://www.naturalearthdata.com/about/terms-of-use/',
    credit: 'Made with Natural Earth.',
  },
  {
    name: 'timezone-boundary-builder',
    use: "the ORBIT map's time zone lines (src/renderer/widgets/orbit/tz-lines.json), derived from its 2026d release",
    licence:
      'Open Database License 1.0 (ODbL), https://opendatacommons.org/licenses/odbl/1-0/. The derived lines are under the ODbL too.',
    credit: '© OpenStreetMap contributors. https://github.com/evansiroky/timezone-boundary-builder',
  },
  {
    name: 'NRO delegated statistics (IP geolocation)',
    use: 'placing connections by country, from @ip-location-db/geo-whois-asn-country-mmdb (its NRO_LICENSE is below)',
    licence:
      'Creative Commons Attribution 4.0 (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/',
    credit: 'Data by the Number Resource Organization, https://www.nro.net/',
  },
  {
    name: 'i18n-iso-countries and countries-and-timezones',
    use: 'country codes, centroids and time zones (src/shared/geo/country-centroids.json, timezone-countries.json); their MIT licences are below',
    licence: 'MIT',
    credit:
      'https://github.com/michaelwittig/node-i18n-iso-countries, https://github.com/manuelmhtr/countries-and-timezones',
  },
  {
    name: 'elecxzy calculator',
    use: "the calculator's expression evaluator, copied unmodified into src/shared/calc/vendor (its licence is below)",
    licence: 'MIT',
    credit: 'https://github.com/kurouna/elecxzy',
  },
]

/** Packages whose data, not code, is in the app: made into the data files at build time. */
export const DATA_PACKAGES = ['world-atlas', 'i18n-iso-countries', 'countries-and-timezones']

const rule = (char) => char.repeat(78)

/** One package's entry: who and what it is, then the licence text it carries. */
function packageBlock(pkg) {
  const lines = [rule('-'), `${pkg.name}@${pkg.version}`, `Licence: ${pkg.license}`]
  if (pkg.author) lines.push(`Author: ${pkg.author}`)
  if (pkg.url) lines.push(pkg.url)
  lines.push(rule('-'), '')
  if (pkg.borrowed)
    lines.push(
      `(No licence file in the package; the text from ${pkg.borrowed}, of the same repository.)`,
    )
  if (pkg.texts.length === 0) {
    const terms = pkg.license === 'MIT' ? ' - its terms are at the end of this file' : ''
    lines.push(`(The package carries no licence file; its licence is ${pkg.license}${terms}.)`, '')
  }
  for (const { file, text } of pkg.texts) lines.push(`[${file}]`, text, '')
  return lines
}

/** The notices file, from the packages it lists. */
export function renderNotices(packages, extra = []) {
  const sorted = [...packages].sort(
    (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
  )
  const lines = [
    'elecdex - third-party notices',
    '',
    'elecdex is free software under the GNU General Public License v3.0 (LICENSE).',
    'It includes the third-party software and data listed below, each under its',
    'own licence, whose text follows. Electron and Chromium ship their own',
    'notices beside the executable (LICENSE.electron.txt, LICENSES.chromium.html).',
    '',
    rule('='),
    'Data',
    rule('='),
    '',
  ]
  for (const source of DATA_SOURCES) {
    lines.push(source.name, `  Used for: ${source.use}`, `  Licence: ${source.licence}`)
    lines.push(`  ${source.credit}`, '')
  }
  for (const block of extra) lines.push(rule('-'), block.title, rule('-'), '', block.text, '')
  lines.push(rule('='), `Software (${sorted.length} packages)`, rule('='), '')
  for (const pkg of sorted) lines.push(...packageBlock(pkg))
  if (sorted.some((pkg) => pkg.texts.length === 0 && pkg.license === 'MIT'))
    lines.push(rule('='), 'MIT License terms', rule('='), '', MIT, '')
  return `${lines.join('\n').trimEnd()}\n`
}

/** The production dependencies installed, from the lockfile: what electron-builder puts in app.asar. */
export function shippedPackages(root) {
  const lock = JSON.parse(readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
  return Object.entries(lock.packages ?? {})
    .filter(([key, entry]) => key.startsWith('node_modules/') && !entry.dev && !entry.devOptional)
    .map(([key]) => path.join(root, key))
    .filter((dir) => existsSync(path.join(dir, 'package.json')))
}
