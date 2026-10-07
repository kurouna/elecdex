// Node's side of the bitmap renderer: writes the jobs to a file, runs render-main.mjs in
// Electron (three.js's WebGLRenderer in a hidden window) and reads the indices back, each
// sprite cleaned of isolated points.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { despeck, isolated } from './pixels.mjs'

const electron = createRequire(import.meta.url)('electron')
const MAIN = fileURLToPath(new URL('./render-main.mjs', import.meta.url))

function finish(s) {
  const px = Uint8Array.from(s.px)
  const before = isolated(px, s.w, s.h)
  despeck(px, s.w, s.h)
  return { ...s, px, isolatedBefore: before, isolated: isolated(px, s.w, s.h) }
}

/** Renders { id: job } and returns { renderer, results: { id: sprite | [sprite] } }. */
export function renderBitmaps(jobs) {
  const dir = mkdtempSync(join(tmpdir(), 'elecfighter-'))
  const jobsPath = join(dir, 'jobs.json')
  const outPath = join(dir, 'out.json')
  writeFileSync(jobsPath, JSON.stringify(jobs))
  const r = spawnSync(electron, [MAIN, jobsPath, outPath], { stdio: ['ignore', 'inherit', 'pipe'] })
  if (r.status !== 0) {
    rmSync(dir, { recursive: true, force: true })
    throw new Error(`the renderer failed (${r.status}): ${String(r.stderr).slice(0, 2000)}`)
  }
  const out = JSON.parse(readFileSync(outPath, 'utf8'))
  rmSync(dir, { recursive: true, force: true })
  for (const [id, v] of Object.entries(out.results))
    out.results[id] = Array.isArray(v) ? v.map(finish) : finish(v)
  return out
}
