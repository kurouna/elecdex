#!/usr/bin/env node
/**
 * A small static server for the design scene: only this folder and three.js, on 127.0.0.1.
 * Run it to design in a browser:
 *
 *   node scripts/elecfighter/serve.mjs     then open the address it prints (viewer.html)
 *
 * render-main.mjs starts one of its own for the bitmap renderer.
 */
import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const ALLOWED = ['scripts/elecfighter/', 'node_modules/three/']
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.gltf': 'model/gltf+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
}

/** Starts the server; resolves to { url, close }. */
export function serve(port = 0) {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname))
    const rel = path.split(sep).join('/').replace(/^\/+/, '')
    const file = join(ROOT, rel)
    const ok = ALLOWED.some((a) => rel.startsWith(a)) && file.startsWith(ROOT + sep)
    let isFile = false
    try {
      isFile = ok && statSync(file).isFile()
    } catch {}
    if (!isFile) {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  })
  return new Promise((done) => {
    server.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${server.address().port}/scripts/elecfighter/`
      done({ url, close: () => server.close() })
    })
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await serve(Number(process.env.PORT ?? 5180))
  console.log(`ELECFIGHTER design viewer: ${url}viewer.html`)
}
