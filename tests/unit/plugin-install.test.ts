import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  checkSources,
  type EntryKind,
  installFromFolder,
  installName,
  planInstall,
  type SourceTree,
} from '../../src/main/plugins/install.js'
import { PLUGIN_LIMITS } from '../../src/shared/plugins.js'

/**
 * Installing a plugin from a folder the user picked.
 *
 * What is copied has to be what the scanner would read (main/plugins/folder.ts)
 * and nothing else: a plugin kept in a repository sits beside a README, a
 * package.json, a .git and often a node_modules, and copying the folder as it
 * stands would fill the plugins folder with what elecdex never looks at.
 */

/** A folder as a listing, so the rules can be read without a disk. */
function tree(entries: Record<string, number | null>): SourceTree {
  // null marks a directory; a number is a file of that many bytes.
  const kindOf = (value: number | null): EntryKind => (value === null ? 'dir' : 'file')
  return {
    list: (relative) => {
      const prefix = relative === '' ? '' : `${relative}/`
      const seen = new Map<string, EntryKind>()
      for (const [full, value] of Object.entries(entries)) {
        if (!full.startsWith(prefix)) continue
        const rest = full.slice(prefix.length)
        if (rest === '' || rest.includes('/')) continue
        seen.set(rest, kindOf(value))
      }
      return [...seen].map(([name, kind]) => ({ name, kind }))
    },
    size: (relative) => entries[relative] ?? 0,
  }
}

describe('what a folder has to be to be a plugin', () => {
  it('needs an index at its root', () => {
    expect(planInstall(tree({ 'index.ts': 10 }))).toEqual({ files: ['index.ts'], bytes: 10 })
    expect(planInstall(tree({ 'index.js': 10 }))).toEqual({ files: ['index.js'], bytes: 10 })
    // The plugin is one folder down: say which, rather than "not a plugin".
    const refused = planInstall(tree({ 'plugin.ts': 10, src: null, 'src/index.ts': 10 }))
    expect(refused).toEqual({ error: expect.stringContaining('"src" inside it is') })
    // Nothing that looks like a plugin anywhere: the plain answer.
    expect(planInstall(tree({ 'notes.md': 10 }))).toEqual({
      error: expect.stringContaining('no index.ts or index.js'),
    })
  })

  it('says so when the folder holds plugins rather than being one', () => {
    // Picking another elecdex's plugins folder is a likely mistake, and "this is
    // not a plugin" would not explain it.
    const plan = planInstall(
      tree({
        pomodoro: null,
        'pomodoro/index.ts': 1,
        clock: null,
        'clock/index.js': 1,
        'README.md': 1,
      }),
    )
    expect(plan).toEqual({ error: expect.stringContaining('2 plugins') })
  })

  it('takes the code and leaves everything else where it is', () => {
    const plan = planInstall(
      tree({
        'index.ts': 10,
        lib: null,
        'lib/timer.ts': 20,
        'README.md': 999,
        'package.json': 999,
        'icon.png': 999,
        'elecdex-plugin.d.ts': 999,
        '.git': null,
        '.git/config': 999,
        node_modules: null,
        'node_modules/left-pad': null,
        'node_modules/left-pad/index.js': 999,
        '.hidden.ts': 999,
      }),
    )
    expect(plan).toEqual({ files: ['index.ts', 'lib/timer.ts'], bytes: 30 })
  })

  it('stops at the depth the scanner reads to', () => {
    const plan = planInstall(
      tree({
        'index.ts': 1,
        a: null,
        'a/one.ts': 1,
        'a/b': null,
        'a/b/two.ts': 1,
        'a/b/c': null,
        'a/b/c/three.ts': 1,
        'a/b/c/d': null,
        'a/b/c/d/four.ts': 1,
      }),
    )
    expect('files' in plan && plan.files).toEqual([
      'a/b/c/three.ts',
      'a/b/two.ts',
      'a/one.ts',
      'index.ts',
    ])
  })

  it('refuses a folder of too many files, or of too much source', () => {
    const many: Record<string, number | null> = { 'index.ts': 1 }
    for (let i = 0; i < PLUGIN_LIMITS.files + 1; i += 1) many[`file${i}.ts`] = 1
    expect(planInstall(tree(many))).toEqual({ error: expect.stringContaining('source files') })

    expect(planInstall(tree({ 'index.ts': PLUGIN_LIMITS.sourceBytes + 1 }))).toEqual({
      error: expect.stringContaining('kB of source'),
    })
  })

  it('does not follow what is neither a file nor a folder', () => {
    const linked: SourceTree = {
      list: (relative) =>
        relative === ''
          ? [
              { name: 'index.ts', kind: 'file' },
              { name: 'elsewhere', kind: 'other' },
            ]
          : [],
      size: () => 1,
    }
    expect(planInstall(linked)).toEqual({ files: ['index.ts'], bytes: 1 })
  })
})

describe('whether the files would load at all', () => {
  const file = (path: string, source: string) => ({ path, source })

  it('passes a plugin that compiles and imports only its own files', () => {
    expect(
      checkSources([
        file('index.ts', "import { t } from './lib/timer'\nexport default { t }"),
        file('lib/timer.ts', 'export const t = 1'),
      ]),
    ).toBeNull()
  })

  it('finds a file the way the worker does: the name, .ts, .js, or an index in it', () => {
    for (const [specifier, target] of [
      ['./timer', 'timer.ts'],
      ['./timer', 'timer.js'],
      ['./lib', 'lib/index.ts'],
      ['./lib/', 'lib/index.js'],
      ['../shared/x', 'shared/x.ts'],
    ] as const) {
      const files = [
        file('app/index.ts', `import './x'\nimport '${specifier}'\nexport default {}`),
        file('app/x.ts', 'export {}'),
        file(target.startsWith('shared') ? target : `app/${target}`, 'export const t = 1'),
      ]
      expect(checkSources(files), specifier).toBeNull()
    }
  })

  it('says which file will not compile, before anything is copied', () => {
    const broken = checkSources([file('index.ts', 'export default { name: ')])
    expect(broken).toContain('index.ts')
  })

  it('refuses a plugin that imports a package, since there is no npm in a worker', () => {
    const reason = checkSources([file('index.ts', "import x from 'lodash'\nexport default { x }")])
    expect(reason).toContain('lodash')
    expect(reason).toContain('its own files')
  })

  it('refuses an import of a file that did not come with it', () => {
    const reason = checkSources([file('index.ts', "import './lib/timer'\nexport default {}")])
    expect(reason).toContain('./lib/timer')
    expect(reason).toContain('not in the folder')
  })

  it('refuses an import that climbs out of the plugin', () => {
    const reason = checkSources([file('index.ts', "import '../../secrets'\nexport default {}")])
    expect(reason).toContain('outside the folder')
  })

  it('says nothing about a type-only import, which the transform removes', () => {
    expect(
      checkSources([
        file('index.ts', "import type { Plugin } from './elecdex-plugin'\nexport default {}"),
      ]),
    ).toBeNull()
  })
})

describe('the name a plugin is installed under', () => {
  it('is the folder it came from', () => {
    expect(installName('/home/a/work/pomodoro')).toBe('pomodoro')
    expect(installName('C:\\work\\my plugin')).toBe('my plugin')
  })

  it('refuses names the scanner would skip, or a path could escape through', () => {
    expect(installName('/home/a/.hidden')).toBeNull()
    expect(installName('/home/a/node_modules')).toBeNull()
    expect(installName('/')).toBeNull()
    expect(installName(`/home/a/${'x'.repeat(65)}`)).toBeNull()
    // Reserved on Windows whatever the extension.
    expect(installName('/home/a/con')).toBeNull()
    expect(installName('/home/a/COM1')).toBeNull()
  })
})

describe('installing into the plugins folder', () => {
  let root: string
  let plugins: string
  let source: string

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'elecdex-install-'))
    plugins = path.join(root, 'plugins')
    source = path.join(root, 'pomodoro')
    mkdirSync(plugins, { recursive: true })
    mkdirSync(path.join(source, 'lib'), { recursive: true })
    writeFileSync(path.join(source, 'index.ts'), 'export default {}')
    writeFileSync(path.join(source, 'lib', 'timer.ts'), 'export const t = 1')
    writeFileSync(path.join(source, 'README.md'), '# hello')
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  const installed = () => readdirSync(path.join(plugins, 'pomodoro')).sort()

  it('copies the code and nothing else', () => {
    const result = installFromFolder({ pluginsDir: plugins, source })
    expect(result).toEqual({ status: 'installed', name: 'pomodoro', files: 2 })
    expect(installed()).toEqual(['index.ts', 'lib'])
    expect(readdirSync(path.join(plugins, 'pomodoro', 'lib'))).toEqual(['timer.ts'])
    expect(readFileSync(path.join(plugins, 'pomodoro', 'index.ts'), 'utf8')).toBe(
      'export default {}',
    )
    // Nothing is left behind from the copy.
    expect(readdirSync(plugins)).toEqual(['pomodoro'])
  })

  it('asks before replacing one of the same name, and replaces it when told to', () => {
    installFromFolder({ pluginsDir: plugins, source })
    writeFileSync(path.join(source, 'index.ts'), 'export default { v: 2 }')
    expect(installFromFolder({ pluginsDir: plugins, source })).toEqual({
      status: 'exists',
      name: 'pomodoro',
    })
    // Refusing to replace leaves the old one exactly as it was.
    expect(readFileSync(path.join(plugins, 'pomodoro', 'index.ts'), 'utf8')).toBe(
      'export default {}',
    )

    expect(installFromFolder({ pluginsDir: plugins, source, replace: true })).toEqual({
      status: 'installed',
      name: 'pomodoro',
      files: 2,
    })
    expect(readFileSync(path.join(plugins, 'pomodoro', 'index.ts'), 'utf8')).toBe(
      'export default { v: 2 }',
    )
  })

  it('leaves no file behind from a plugin that got smaller', () => {
    installFromFolder({ pluginsDir: plugins, source })
    rmSync(path.join(source, 'lib'), { recursive: true, force: true })
    installFromFolder({ pluginsDir: plugins, source, replace: true })
    expect(installed()).toEqual(['index.ts'])
  })

  it('refuses a plugin that would not load, and copies nothing', () => {
    // The point of the check: the reason arrives with the click, not later as a
    // line in a settings row after it has been installed and turned on.
    writeFileSync(path.join(source, 'index.ts'), "import x from 'lodash'\nexport default { x }")
    const result = installFromFolder({ pluginsDir: plugins, source })
    expect(result).toEqual({ status: 'refused', reason: expect.stringContaining('lodash') })
    expect(readdirSync(plugins)).toEqual([])
  })

  it('says why when the folder is not a plugin, and copies nothing', () => {
    const notOne = path.join(root, 'notes')
    mkdirSync(notOne)
    writeFileSync(path.join(notOne, 'README.md'), '# not a plugin')
    const result = installFromFolder({ pluginsDir: plugins, source: notOne })
    expect(result).toEqual({ status: 'refused', reason: expect.stringContaining('index.ts') })
    expect(readdirSync(plugins)).toEqual([])
  })

  it('refuses a folder that is already in the plugins folder', () => {
    installFromFolder({ pluginsDir: plugins, source })
    const inside = path.join(plugins, 'pomodoro')
    expect(installFromFolder({ pluginsDir: plugins, source: inside })).toEqual({
      status: 'refused',
      reason: expect.stringContaining('already in the plugins folder'),
    })
    expect(installFromFolder({ pluginsDir: plugins, source: plugins })).toEqual({
      status: 'refused',
      reason: expect.stringContaining('already in the plugins folder'),
    })
  })

  it('refuses a folder whose name could not be a plugin', () => {
    const hidden = path.join(root, '.secret')
    mkdirSync(hidden)
    writeFileSync(path.join(hidden, 'index.ts'), 'export default {}')
    expect(installFromFolder({ pluginsDir: plugins, source: hidden })).toEqual({
      status: 'refused',
      reason: expect.stringContaining('plugin name'),
    })
    expect(readdirSync(plugins)).toEqual([])
  })
})
