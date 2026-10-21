import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { APP_ORIGIN, appPage, appResponse, rendererFile } from '../../src/main/app-scheme.js'

/**
 * The page served from a scheme of its own (issue 29): as a file:// document, its CSP's 'self'
 * was the whole file scheme, and a plugin's worker could load any file on the disk. Only the
 * built renderer's own files are answered, by path inside its folder.
 */

let root = ''
beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), 'elecdex-scheme-'))
  mkdirSync(path.join(root, 'assets'))
  writeFileSync(path.join(root, 'index.html'), '<!doctype html><title>elecdex</title>')
  writeFileSync(path.join(root, 'assets', 'index-abc.js'), 'export {}')
  writeFileSync(path.join(root, 'assets', 'mono.woff2'), Buffer.from([0x77, 0x4f, 0x46, 0x32]))
  writeFileSync(path.join(root, 'assets', 'notes.txt'), 'plain')
  writeFileSync(path.join(root, '..', `${path.basename(root)}-outside.json`), '{"secret":1}')
})
afterAll(() => {
  rmSync(root, { recursive: true, force: true })
  rmSync(path.join(root, '..', `${path.basename(root)}-outside.json`), { force: true })
})

describe('the app scheme', () => {
  it('names the pages by one origin', () => {
    expect(APP_ORIGIN).toBe('app://elecdex')
    expect(appPage('index.html')).toBe('app://elecdex/index.html')
    expect(appPage('audio-capture.html', { stub: 'tone' })).toBe(
      'app://elecdex/audio-capture.html?stub=tone',
    )
  })

  it("finds the renderer's own files, by path", () => {
    expect(rendererFile('app://elecdex/index.html', root)).toBe(path.join(root, 'index.html'))
    expect(rendererFile('app://elecdex/assets/index-abc.js?v=1#x', root)).toBe(
      path.join(root, 'assets', 'index-abc.js'),
    )
    expect(rendererFile('app://elecdex/', root)).toBe(path.join(root, 'index.html'))
  })

  it('finds nothing outside the folder, however it is written', () => {
    // The URL parser itself resolves `..`, plain or encoded, and keeps it at the origin: what
    // it names is a file inside, never one out.
    for (const url of [
      'app://elecdex/../outside.json',
      'app://elecdex/%2e%2e/outside.json',
      'app://elecdex/assets/../../../outside.json',
    ]) {
      const file = rendererFile(url, root)
      expect(file === null || !path.relative(root, file).startsWith('..'), url).toBe(true)
    }
    for (const url of [
      'app://elecdex/assets/%2e%2e%2f%2e%2e%2foutside.json',
      'app://elecdex/assets/..%5C..%5Coutside.json',
      'app://elecdex/C:/Windows/win.ini',
      'app://elecdex//etc/passwd',
      'app://elecdex/a%00b',
      'app://other/index.html',
      'file:///C:/Windows/win.ini',
      'app://elecdex/%E0%A4%A',
    ]) {
      expect(rendererFile(url, root), url).toBeNull()
    }
  })

  it('answers a file with its type, and anything else with nothing', async () => {
    const html = await appResponse('app://elecdex/index.html', root)
    expect(html.status).toBe(200)
    expect(html.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(await html.text()).toContain('<title>elecdex</title>')
    const js = await appResponse('app://elecdex/assets/index-abc.js', root)
    expect(js.headers.get('content-type')).toBe('text/javascript; charset=utf-8')
    expect(
      (await appResponse('app://elecdex/assets/mono.woff2', root)).headers.get('content-type'),
    ).toBe('font/woff2')
    // A kind the page never loads, a file not there, a way out: all the same 404.
    for (const url of [
      'app://elecdex/assets/notes.txt',
      'app://elecdex/assets/gone.js',
      `app://elecdex/../${path.basename(root)}-outside.json`,
      'app://elecdex/assets',
    ]) {
      expect((await appResponse(url, root)).status, url).toBe(404)
    }
  })
})
