import type { HLJSApi, LanguageFn } from 'highlight.js'

/**
 * Syntax colours for the diff view, from highlight.js.
 *
 * Only the core is loaded, when a diff first needs colours, and each language
 * when a file of it is first shown: a layout without a git pane never loads any
 * of it. A file's text is not ours - it is whatever the repository holds - so
 * highlight.js's answer is read back into plain tokens here and drawn as text,
 * never set as HTML: the answer is a small grammar (spans with a class, and
 * escaped text), and anything outside it drops the line back to plain text.
 *
 * The colours are the theme's (DiffView), not a highlight.js theme, so they
 * follow the theme like the rest of the app and hold their contrast on the
 * tinted rows of a diff.
 */

/** One run of text, and the kind of syntax it is ('' for plain). */
export interface Token {
  text: string
  kind: SyntaxKind
  /** Inside the part of the line that changed (DiffView lights it). */
  mark?: boolean
}

export type SyntaxKind = '' | 'keyword' | 'string' | 'number' | 'comment' | 'name' | 'meta'

const LOADERS: Record<string, () => Promise<{ default: LanguageFn }>> = {
  typescript: () => import('highlight.js/lib/languages/typescript'),
  javascript: () => import('highlight.js/lib/languages/javascript'),
  json: () => import('highlight.js/lib/languages/json'),
  xml: () => import('highlight.js/lib/languages/xml'),
  css: () => import('highlight.js/lib/languages/css'),
  scss: () => import('highlight.js/lib/languages/scss'),
  markdown: () => import('highlight.js/lib/languages/markdown'),
  python: () => import('highlight.js/lib/languages/python'),
  rust: () => import('highlight.js/lib/languages/rust'),
  go: () => import('highlight.js/lib/languages/go'),
  java: () => import('highlight.js/lib/languages/java'),
  kotlin: () => import('highlight.js/lib/languages/kotlin'),
  c: () => import('highlight.js/lib/languages/c'),
  cpp: () => import('highlight.js/lib/languages/cpp'),
  csharp: () => import('highlight.js/lib/languages/csharp'),
  bash: () => import('highlight.js/lib/languages/bash'),
  powershell: () => import('highlight.js/lib/languages/powershell'),
  yaml: () => import('highlight.js/lib/languages/yaml'),
  ini: () => import('highlight.js/lib/languages/ini'),
  sql: () => import('highlight.js/lib/languages/sql'),
  ruby: () => import('highlight.js/lib/languages/ruby'),
  php: () => import('highlight.js/lib/languages/php'),
  swift: () => import('highlight.js/lib/languages/swift'),
  lua: () => import('highlight.js/lib/languages/lua'),
  dockerfile: () => import('highlight.js/lib/languages/dockerfile'),
}

const BY_EXTENSION: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  jsonc: 'json',
  html: 'xml',
  htm: 'xml',
  xml: 'xml',
  svg: 'xml',
  // No Svelte grammar ships with highlight.js; its markup reads well enough as HTML.
  svelte: 'xml',
  vue: 'xml',
  css: 'css',
  scss: 'scss',
  md: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  ps1: 'powershell',
  psm1: 'powershell',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'ini',
  ini: 'ini',
  sql: 'sql',
  rb: 'ruby',
  php: 'php',
  swift: 'swift',
  lua: 'lua',
}

/** The language a file is highlighted as, or null for plain text. */
export function languageOf(path: string): string | null {
  const name = path.split('/').at(-1)?.toLowerCase() ?? ''
  if (name === 'dockerfile') return 'dockerfile'
  const extension = name.includes('.') ? (name.split('.').at(-1) ?? '') : ''
  return BY_EXTENSION[extension] ?? null
}

let core: Promise<HLJSApi> | null = null
const registered = new Map<string, Promise<boolean>>()

/** Loads highlight.js and the language, once; false when it cannot be had. */
export function loadLanguage(language: string): Promise<boolean> {
  const known = registered.get(language)
  if (known) return known
  const loader = LOADERS[language]
  const loading =
    loader === undefined
      ? Promise.resolve(false)
      : (async () => {
          core ??= import('highlight.js/lib/core').then((module) => module.default)
          const [hljs, grammar] = await Promise.all([core, loader()])
          hljs.registerLanguage(language, grammar.default)
          return true
        })().catch(() => false)
  registered.set(language, loading)
  return loading
}

/** Highlights each line on its own; a diff is lines out of context anyway. */
export async function highlightLines(
  lines: readonly string[],
  language: string | null,
): Promise<Token[][]> {
  const plain = (): Token[][] => lines.map((text) => [{ text, kind: '' }])
  if (language === null || !(await loadLanguage(language)) || core === null) return plain()
  const hljs = await core
  return lines.map((text) => {
    try {
      return (
        readHighlighted(hljs.highlight(text, { language, ignoreIllegals: true }).value) ?? [
          { text, kind: '' },
        ]
      )
    } catch {
      return [{ text, kind: '' }]
    }
  })
}

/** highlight.js's classes, folded into the few kinds the theme colours. */
const KINDS: [RegExp, SyntaxKind][] = [
  [/^hljs-(comment|quote|doctag)$/, 'comment'],
  [/^hljs-(string|regexp|symbol|char|template-tag|template-variable|link)/, 'string'],
  [/^hljs-(number)$/, 'number'],
  [/^hljs-(keyword|literal|built_in|type|selector-tag|operator)$/, 'keyword'],
  [
    /^hljs-(title|section|name|attr|attribute|property|function|class|selector-(id|class|attr|pseudo))/,
    'name',
  ],
  [/^hljs-(meta|tag|variable|params|subst|bullet)/, 'meta'],
]

function kindOf(classes: string): SyntaxKind {
  for (const cls of classes.split(/\s+/)) {
    for (const [pattern, kind] of KINDS) if (pattern.test(cls)) return kind
  }
  return ''
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
}

/** One piece of highlight.js's answer: an opening span, a closing one, or text. False if it is none. */
function readPart(part: string, stack: SyntaxKind[], tokens: Token[]): boolean {
  const open = /^<span class="([a-z0-9_ -]+)">$/i.exec(part)
  if (open) {
    const inner = kindOf(open[1] ?? '')
    stack.push(inner === '' ? (stack.at(-1) ?? '') : inner)
    return true
  }
  if (part === '</span>') return stack.pop() !== undefined
  if (part.includes('<') || part.includes('>')) return false
  const text = part.replace(/&(amp|lt|gt|quot|#x27|#39);/g, (entity) => ENTITIES[entity] ?? entity)
  tokens.push({ text, kind: stack.at(-1) ?? '' })
  return true
}

/**
 * highlight.js's HTML back into tokens. Returns null for anything but spans
 * with a class attribute and escaped text - the only things it writes.
 */
export function readHighlighted(html: string): Token[] | null {
  const tokens: Token[] = []
  const stack: SyntaxKind[] = []
  const parts = html.split(/(<span class="[a-z0-9_ -]+">|<\/span>)/i)
  for (const part of parts) {
    if (part !== '' && !readPart(part, stack, tokens)) return null
  }
  return stack.length === 0 ? tokens : null
}

/** Marks the characters in [start, end) of a line's tokens, splitting the runs at its edges. */
export function markSpan(
  tokens: readonly Token[],
  span: readonly [number, number] | undefined,
): Token[] {
  if (span === undefined || span[0] >= span[1]) return [...tokens]
  const [start, end] = span
  const out: Token[] = []
  let at = 0
  for (const token of tokens) {
    const from = at
    const to = at + token.text.length
    at = to
    const cuts = [from, Math.min(Math.max(start, from), to), Math.min(Math.max(end, from), to), to]
    for (let i = 0; i < 3; i += 1) {
      const a = cuts[i] as number
      const b = cuts[i + 1] as number
      if (b <= a) continue
      out.push({
        text: token.text.slice(a - from, b - from),
        kind: token.kind,
        ...(i === 1 ? { mark: true } : {}),
      })
    }
  }
  return out
}
