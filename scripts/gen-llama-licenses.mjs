/**
 * The licences of the llama.cpp build TRANSLATE fetches, and of the code built into it, into
 * resources/translate/llama.cpp-licenses.txt (docs/translate.md §4.1). The release archives carry
 * none of them but LLVM's OpenMP; elecdex bundles this file and writes it beside llama-server as
 * LICENSE-llama.cpp, so an engine in place always has its licences, with no request to make.
 *
 * Read from the llama.cpp repository at the commit of ENGINE_BUILD (src/shared/translate/engines.ts).
 * Run it again whenever that build changes: `npm run gen:llama-licenses`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const engines = readFileSync(path.join(root, 'src/shared/translate/engines.ts'), 'utf8')
const BUILD = /ENGINE_BUILD = '([^']+)'/.exec(engines)?.[1]
const COMMIT = /ENGINE_COMMIT = '([0-9a-f]{40})'/.exec(engines)?.[1]
if (!BUILD || !COMMIT) throw new Error('engines.ts names no build and commit')
const RAW = `https://raw.githubusercontent.com/ggml-org/llama.cpp/${COMMIT}`

/** A whole licence file. */
const whole = (text) => text.trim()
/** From the line that starts the licence statement to the end of the file, less a closing comment. */
const fromLine = (start) => (text) => {
  const at = text.lastIndexOf(start)
  if (at < 0) throw new Error(`no "${start}"`)
  return text
    .slice(at)
    .replace(/\*\/\s*$/, '')
    .trim()
}
/** The first block comment holding `marker`, its comment marks taken off. */
const comment = (marker) => (text) => {
  for (const block of text.matchAll(/\/\*([\s\S]*?)\*\//g)) {
    const body = block[1] ?? ''
    if (body.includes(marker)) return body.replace(/^ {0,3}/gm, '').trim()
  }
  throw new Error(`no comment with "${marker}"`)
}

/** What llama-server and the libraries kept beside it are built from (tools/server, vendor/). */
const PARTS = [
  { name: 'llama.cpp and ggml', file: 'LICENSE', take: whole },
  { name: 'nlohmann/json (vendor/nlohmann)', file: 'licenses/LICENSE-jsonhpp', take: whole },
  { name: 'cpp-httplib (vendor/cpp-httplib)', file: 'vendor/cpp-httplib/LICENSE', take: whole },
  { name: 'xxHash (vendor/hash/xxhash)', file: 'vendor/hash/xxhash/LICENSE', take: whole },
  { name: 'sha256 (vendor/hash/sha256)', file: 'vendor/hash/sha256/LICENSE', take: whole },
  {
    name: 'rotate-bits (vendor/hash/rotate-bits)',
    file: 'vendor/hash/rotate-bits/LICENSE.md',
    take: whole,
  },
  {
    name: 'SHA-1 in C (vendor/hash/sha1)',
    file: 'vendor/hash/sha1/sha1.c',
    take: comment('Public Domain'),
  },
  {
    name: 'miniaudio (vendor/miniaudio)',
    file: 'vendor/miniaudio/miniaudio.h',
    take: fromLine('This software is available as a choice of the following licenses'),
  },
  {
    name: 'stb_image (vendor/stb)',
    file: 'vendor/stb/stb_image.h',
    take: fromLine('This software is available under 2 licenses'),
  },
  {
    name: 'subprocess.h (vendor/sheredom)',
    file: 'vendor/sheredom/subprocess.h',
    take: comment('free and unencumbered'),
  },
]

const rule = '='.repeat(78)
const sections = []
for (const part of PARTS) {
  const response = await fetch(`${RAW}/${part.file}`)
  if (!response.ok) throw new Error(`${part.file}: HTTP ${response.status}`)
  sections.push(
    `${rule}\n${part.name}\n${part.file}\n${rule}\n\n${part.take(await response.text())}\n`,
  )
}

const head = `llama.cpp ${BUILD} (https://github.com/ggml-org/llama.cpp, commit ${COMMIT})

The licences of llama.cpp, which TRANSLATE fetches from its GitHub releases to run the model, and
of the code built into llama-server and the libraries beside it, as the llama.cpp repository holds
them at that commit. LLVM's OpenMP runtime (libomp), where the release has it, comes with its own
LICENSE-LLVM-OpenMP. The web page llama-server serves is built from llama.cpp's tools/ui; its
packages are listed in the repository.

Written by elecdex's npm run gen:llama-licenses.
`
const out = path.join(root, 'resources', 'translate', 'llama.cpp-licenses.txt')
writeFileSync(out, `${head}\n${sections.join('\n')}`)
console.log(`${path.relative(root, out)}: ${PARTS.length} licences for ${BUILD}`)
