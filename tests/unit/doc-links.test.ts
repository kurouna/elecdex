import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The READMEs and the user guide (docs/guide) link to each other, to the design documents and to
 * the screenshots by relative paths and #anchors: every one must lead somewhere, in all three
 * languages, so a page moved or a heading renamed breaks a test rather than a reader's click.
 */

const ROOT = path.resolve('.')
const GUIDE = path.join(ROOT, 'docs', 'guide')
const pages = [
  ...['README.md', 'README.ja.md', 'README.zh-CN.md'].map((f) => path.join(ROOT, f)),
  ...readdirSync(GUIDE)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(GUIDE, f)),
]

/** A heading's anchor as GitHub makes it: lower case, punctuation gone, spaces as hyphens. */
const slug = (text: string): string =>
  text
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-')

/** A Markdown file's text with its fenced blocks taken out, line by line (``` or ~~~ fences). */
function unfenced(file: string): string {
  let fence = ''
  const kept: string[] = []
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const mark = /^\s*(`{3,}|~{3,})/.exec(line)?.[1]
    if (mark !== undefined && (fence === '' || mark.startsWith(fence))) {
      fence = fence === '' ? mark : ''
      continue
    }
    if (fence === '') kept.push(line)
  }
  return kept.join('\n')
}

/** Every anchor a Markdown file has: its headings (repeats numbered) and its HTML ids. */
function anchorsOf(file: string): Set<string> {
  const text = unfenced(file)
  const found = new Set<string>()
  const seen = new Map<string, number>()
  for (const m of text.matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
    const base = slug(m[1] ?? '')
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    found.add(n === 0 ? base : `${base}-${n}`)
  }
  for (const m of text.matchAll(/\bid="([^"]+)"/g)) found.add(m[1] ?? '')
  return found
}

/** Relative links and images of a page: Markdown's ( ) targets and HTML's href and src. */
function linksOf(file: string): string[] {
  const text = unfenced(file).replace(/`[^`\n]*`/g, '')
  const out: string[] = []
  for (const m of text.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) out.push(m[1] ?? '')
  for (const m of text.matchAll(/\b(?:href|src)="([^"]+)"/g)) out.push(m[1] ?? '')
  return out.filter((l) => !/^(?:[a-z]+:|\/\/)/i.test(l))
}

/** Whether a link from `file` leads somewhere: its file, and its heading in a Markdown file. */
function leads(file: string, link: string): boolean {
  const [target = '', anchor] = link.split('#')
  const to = target === '' ? file : path.resolve(path.dirname(file), decodeURI(target))
  if (!existsSync(to)) return false
  if (anchor === undefined || anchor === '' || !to.endsWith('.md')) return true
  return anchorsOf(to).has(decodeURIComponent(anchor).toLowerCase())
}

describe('the READMEs and the user guide', () => {
  it('has a page per guide topic in all three languages', () => {
    const md = readdirSync(GUIDE).filter((f) => f.endsWith('.md'))
    const topics = md.filter((f) => !/\.(ja|zh-CN)\.md$/.test(f)).map((f) => f.slice(0, -3))
    expect(topics.length).toBeGreaterThan(10)
    for (const t of topics) {
      expect(md, t).toContain(`${t}.ja.md`)
      expect(md, t).toContain(`${t}.zh-CN.md`)
    }
  })

  it('heads every guide page with the switch to its own three languages', () => {
    for (const file of readdirSync(GUIDE).filter((f) => f.endsWith('.md'))) {
      const topic = file.replace(/\.(ja|zh-CN)\.md$|\.md$/, '')
      const first = readFileSync(path.join(GUIDE, file), 'utf8').split(/\r?\n/)[0] ?? ''
      const links = [...first.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1])
      const own = file.endsWith('.ja.md') ? 'ja' : file.endsWith('.zh-CN.md') ? 'zh-CN' : 'en'
      const want = { en: `${topic}.md`, ja: `${topic}.ja.md`, 'zh-CN': `${topic}.zh-CN.md` }
      const others = (['en', 'ja', 'zh-CN'] as const).filter((l) => l !== own).map((l) => want[l])
      expect(links, file).toEqual(others)
    }
  })

  it.each(pages.map((p) => [path.relative(ROOT, p), p]))(
    '%s links only to what exists',
    (_, file) => {
      expect(linksOf(file).filter((link) => !leads(file, link))).toEqual([])
    },
  )
})
