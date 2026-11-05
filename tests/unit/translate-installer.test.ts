import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  installEngine,
  keeps,
  nodeInstallDeps,
  sweepTemps,
  tarPath,
} from '../../src/main/translate/installer'

let dir = ''
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-install-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

/** A small archive shaped like llama.cpp's: a folder with the server, other tools and libraries. */
function archive(): string {
  const src = path.join(dir, 'src', 'build', 'bin')
  mkdirSync(src, { recursive: true })
  const server = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server'
  for (const name of [
    server,
    'llama-cli.exe',
    'llama-cli',
    'llama.dll',
    'ggml-vulkan.dll',
    'llama-server-impl.dll',
    'mtmd-impl.dll',
    'libggml.so',
  ]) {
    writeFileSync(path.join(src, name), name)
  }
  const file = path.join(dir, 'engine.tar.gz')
  execFileSync(tarPath(), ['-czf', file, '-C', path.join(dir, 'src'), 'build'])
  return file
}

describe('installEngine', () => {
  it('unpacks, keeps the server and its libraries, writes the licence, and renames into place', async () => {
    const dest = path.join(dir, 'translate', 'engine', 'b12110', 'win32-x64-cpu')
    await installEngine(archive(), path.join(dir, 'translate'), dest, 'MIT License')
    const names = readdirSync(dest).sort()
    expect(names).toContain(process.platform === 'win32' ? 'llama-server.exe' : 'llama-server')
    expect(names).toEqual(
      expect.arrayContaining([
        'llama.dll',
        'ggml-vulkan.dll',
        'llama-server-impl.dll',
        'libggml.so',
        'LICENSE-llama.cpp',
      ]),
    )
    expect(names).not.toContain('llama-cli.exe')
    expect(names).not.toContain('mtmd-impl.dll')
    expect(readFileSync(path.join(dest, 'LICENSE-llama.cpp'), 'utf8')).toBe('MIT License')
    // No temporary folder is left behind.
    expect(
      readdirSync(path.join(dir, 'translate')).filter((n) => n.startsWith('engine-tmp-')),
    ).toEqual([])
  })

  it('leaves nothing at the destination when the archive has no server', async () => {
    const src = path.join(dir, 'empty')
    mkdirSync(src)
    writeFileSync(path.join(src, 'readme.txt'), 'x')
    const file = path.join(dir, 'empty.tar.gz')
    execFileSync(tarPath(), ['-czf', file, '-C', src, 'readme.txt'])
    const dest = path.join(dir, 'translate', 'engine', 'x')
    await expect(
      installEngine(file, path.join(dir, 'translate'), dest, 'L', nodeInstallDeps),
    ).rejects.toThrow(/llama-server/)
    expect(existsSync(dest)).toBe(false)
  })
})

describe('keeps', () => {
  it('keeps the server, libraries and licences; drops other programs and tool libraries', () => {
    expect(
      [
        'llama-server.exe',
        'llama-server',
        'llama-server-impl.dll',
        'ggml-base.dll',
        'libllama.dylib',
        'LICENSE-curl',
      ].every(keeps),
    ).toBe(true)
    expect(['llama-cli.exe', 'llama-quantize', 'mtmd-impl.dll'].some(keeps)).toBe(false)
  })
})

describe('sweepTemps', () => {
  it('removes leftover temporary folders only', async () => {
    mkdirSync(path.join(dir, 'engine-tmp-abc'))
    mkdirSync(path.join(dir, 'engine'))
    await sweepTemps(dir)
    expect(readdirSync(dir)).toEqual(['engine'])
  })
})
