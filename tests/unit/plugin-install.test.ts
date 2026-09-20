import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
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
 * What is copied is the plugin: the entry, and what it imports, and what those
 * import. A folder kept in a repository holds more than the plugin - tests
 * beside the code, a README, a package.json, a .git, often a node_modules - and
 * the worker loads none of it. Copying the rest would fill the plugins folder
 * with what elecdex never reads, and checking the rest would refuse a plugin
 * for a test file that imports node:assert.
 */

/** A folder as a listing with contents, so the rules can be read without a disk. */
function tree(entries: Record<string, string | null>): SourceTree {
  // null marks a directory; a string is a file with that source.
  const kindOf = (value: string | null): EntryKind => (value === null ? 'dir' : 'file')
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
    size: (relative) => (entries[relative] ?? '').length,
    read: (relative) => entries[relative] ?? '',
  }
}

const PLUGIN = 'export default { id: "p", name: "P" }'

describe('what is taken out of the folder', () => {
  it('takes the entry and what it imports, and nothing else', () => {
    const plan = planInstall(
      tree({
        'index.ts': "import { t } from './lib/timer'\nexport default { t }",
        lib: null,
        'lib/timer.ts': 'export const t = 1',
        'old.ts': 'export default {}',
        'README.md': '# hello',
        'package.json': '{}',
        '.git': null,
        '.git/config': 'x',
        node_modules: null,
        'node_modules/left-pad': null,
        'node_modules/left-pad/index.js': 'x',
      }),
    )
    expect(plan).toEqual({ files: ['index.ts', 'lib/timer.ts'], bytes: expect.any(Number) })
  })

  it('leaves the tests beside a plugin alone, and does not judge them', () => {
    // The case that found this: a plugin kept with its tests, where a test
    // imports node:assert. The worker never loads it, so nothing about it can
    // stop the plugin being installed.
    const plan = planInstall(
      tree({
        'index.ts': PLUGIN,
        tests: null,
        'tests/usage.test.ts': "import assert from 'node:assert/strict'\nassert.ok(true)",
      }),
    )
    expect(plan).toEqual({ files: ['index.ts'], bytes: PLUGIN.length })
  })

  it('follows an import through the files it reaches, once each', () => {
    const plan = planInstall(
      tree({
        'index.ts': "import './a'\nimport './b'",
        'a.ts': "import './shared'\nexport const a = 1",
        'b.ts': "import './shared'\nexport const b = 1",
        'shared.ts': 'export const s = 1',
        'unused.ts': 'export const u = 1',
      }),
    )
    expect('files' in plan && plan.files).toEqual(['a.ts', 'b.ts', 'index.ts', 'shared.ts'])
  })

  it('finds a file the way the worker does: the name, .ts, .js, or an index in it', () => {
    for (const [specifier, target] of [
      ['./timer', 'timer.ts'],
      ['./timer', 'timer.js'],
      ['./lib', 'lib/index.ts'],
      ['./lib/', 'lib/index.js'],
    ] as const) {
      const dir = target.includes('/') ? { lib: null } : {}
      const plan = planInstall(
        tree({ 'index.ts': `import '${specifier}'`, ...dir, [target]: 'export const t = 1' }),
      )
      expect('files' in plan && plan.files, specifier).toEqual(['index.ts', target])
    }
  })

  it('needs an index at its root, and says which folder is the plugin when one is', () => {
    expect(planInstall(tree({ 'index.js': PLUGIN }))).toEqual({
      files: ['index.js'],
      bytes: PLUGIN.length,
    })
    // The plugin is one folder down: say which, rather than "not a plugin".
    expect(planInstall(tree({ 'plugin.ts': 'x', src: null, 'src/index.ts': PLUGIN }))).toEqual({
      error: expect.stringContaining('"src" inside it is'),
    })
    expect(
      planInstall(
        tree({ a: null, 'a/index.ts': PLUGIN, b: null, 'b/index.js': PLUGIN, 'README.md': 'x' }),
      ),
    ).toEqual({ error: expect.stringContaining('2 plugins') })
    // Nothing that looks like a plugin anywhere: the plain answer.
    expect(planInstall(tree({ 'notes.md': 'x' }))).toEqual({
      error: expect.stringContaining('no index.ts or index.js'),
    })
  })

  it('refuses a plugin of too many files, or of too much source', () => {
    const many: Record<string, string | null> = {
      'index.ts': Array.from({ length: PLUGIN_LIMITS.files }, (_, i) => `import './f${i}'`).join(
        '\n',
      ),
    }
    for (let i = 0; i < PLUGIN_LIMITS.files; i += 1) many[`f${i}.ts`] = 'export const x = 1'
    expect(planInstall(tree(many))).toEqual({ error: expect.stringContaining('source files') })

    expect(planInstall(tree({ 'index.ts': 'x'.repeat(PLUGIN_LIMITS.sourceBytes + 1) }))).toEqual({
      error: expect.stringContaining('kB of source'),
    })
  })
})

describe('whether the plugin would load at all', () => {
  it('says which file will not compile, before anything is copied', () => {
    expect(planInstall(tree({ 'index.ts': 'export default { name: ' }))).toEqual({
      error: expect.stringContaining('index.ts'),
    })
  })

  it('refuses a plugin that imports a package, since there is no npm in a worker', () => {
    const plan = planInstall(tree({ 'index.ts': "import x from 'lodash'\nexport default { x }" }))
    expect(plan).toEqual({ error: expect.stringContaining('lodash') })
    expect(plan).toEqual({ error: expect.stringContaining('its own files') })
  })

  it('refuses an import of a file that did not come with it', () => {
    expect(planInstall(tree({ 'index.ts': "import './lib/timer'" }))).toEqual({
      error: expect.stringContaining('not in the folder'),
    })
  })

  it('refuses an import that climbs out of the plugin', () => {
    expect(planInstall(tree({ 'index.ts': "import '../../secrets'" }))).toEqual({
      error: expect.stringContaining('outside the folder'),
    })
  })

  it('refuses an import of something that is not code, which the worker cannot load', () => {
    expect(planInstall(tree({ 'index.ts': "import './data.json'", 'data.json': '{}' }))).toEqual({
      error: expect.stringContaining('not in the folder'),
    })
  })

  it('says nothing about a type-only import, which the transform removes', () => {
    const plan = planInstall(
      tree({ 'index.ts': "import type { Plugin } from './elecdex-plugin'\nexport default {}" }),
    )
    expect('files' in plan && plan.files).toEqual(['index.ts'])
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
    mkdirSync(path.join(source, 'tests'), { recursive: true })
    writeFileSync(path.join(source, 'index.ts'), "import './lib/timer'\nexport default {}")
    writeFileSync(path.join(source, 'lib', 'timer.ts'), 'export const t = 1')
    writeFileSync(path.join(source, 'README.md'), '# hello')
    writeFileSync(
      path.join(source, 'tests', 'timer.test.ts'),
      "import assert from 'node:assert/strict'\nassert.ok(true)",
    )
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  const installed = () => readdirSync(path.join(plugins, 'pomodoro')).sort()

  it('copies the plugin, and not the repository around it', () => {
    const result = installFromFolder({ pluginsDir: plugins, source })
    expect(result).toEqual({ status: 'installed', name: 'pomodoro', files: 2 })
    expect(installed()).toEqual(['index.ts', 'lib'])
    expect(readdirSync(path.join(plugins, 'pomodoro', 'lib'))).toEqual(['timer.ts'])
    expect(readFileSync(path.join(plugins, 'pomodoro', 'index.ts'), 'utf8')).toContain(
      'export default',
    )
    // Nothing is left behind from the copy.
    expect(readdirSync(plugins)).toEqual(['pomodoro'])
  })

  it('asks before replacing one of the same name, and replaces it when told to', () => {
    installFromFolder({ pluginsDir: plugins, source })
    writeFileSync(path.join(source, 'index.ts'), "import './lib/timer'\nexport default { v: 2 }")
    expect(installFromFolder({ pluginsDir: plugins, source })).toEqual({
      status: 'exists',
      name: 'pomodoro',
    })
    // Refusing to replace leaves the old one exactly as it was.
    expect(readFileSync(path.join(plugins, 'pomodoro', 'index.ts'), 'utf8')).not.toContain('v: 2')

    expect(installFromFolder({ pluginsDir: plugins, source, replace: true })).toEqual({
      status: 'installed',
      name: 'pomodoro',
      files: 2,
    })
    expect(readFileSync(path.join(plugins, 'pomodoro', 'index.ts'), 'utf8')).toContain('v: 2')
  })

  it('leaves no file behind from a plugin that got smaller', () => {
    installFromFolder({ pluginsDir: plugins, source })
    writeFileSync(path.join(source, 'index.ts'), 'export default {}')
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
