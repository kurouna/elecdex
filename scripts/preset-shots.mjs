/**
 * The layout presets for the README shots (scripts/gen-screenshots.mjs).
 *
 * The trees are the app's own: a script cannot import the TypeScript source,
 * so it asks the built app. A first start writes every preset into
 * layouts.json (shared/layout-presets.ts); that file is read and the profile
 * thrown away. A shot then puts on top only the state its panes need - a
 * repository, a feed - so the README shows exactly what the presets are.
 *
 * The media shot must not show someone else's pages: YouTube and X are stood in
 * for by pages served here that look like them without copying them
 * (media-standins.mjs), and the feed by a made-up one.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron } from '@playwright/test'
import { standInPage } from './media-standins.mjs'

/** Every preset's tree, by preset id, as the built app makes them. */
export async function presetTrees(main) {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-presets-'))
  const app = await electron.launch({
    args: [main, '--windowed', '--no-intro', `--user-data-dir=${dir}`],
    env: { ...process.env, ELECDEX_SEED_LAYOUTS: '1' },
  })
  await app.firstWindow()
  await app.close()
  const { items } = JSON.parse(readFileSync(path.join(dir, 'layouts.json'), 'utf8'))
  rmSync(dir, { recursive: true, force: true })
  return new Map(items.map((item) => [item.preset, item.tree]))
}

/**
 * The tree with state given to the panes of some widgets, and a tab group put on
 * the tab of a given widget: `{ git: { repo } }`, `{ tab: 'rss' }`.
 */
export function withState(tree, states, tab) {
  const visit = (node) => {
    if (node.kind === 'split') return { ...node, children: node.children.map(visit) }
    if (node.kind === 'tabs') {
      const children = node.children.map(visit)
      const at = tab === undefined ? -1 : children.findIndex((c) => c.widget === tab)
      return { ...node, children, activeIndex: at >= 0 ? at : node.activeIndex }
    }
    const state = states[node.widget]
    return state === undefined ? node : { ...node, state: { ...node.state, ...state } }
  }
  return { ...tree, root: visit(tree.root) }
}

const HEADLINES = [
  ['Open-source terminal emulators see a renaissance of retro interfaces', 1],
  ['A new SGP4 library brings satellite tracking to the browser', 3],
  ['Small language models now run comfortably on a laptop GPU', 5],
  ['Why every desk still needs a good countdown timer', 8],
  ['CRT shaders: how to fake a tube on a flat panel', 11],
  ['Weather services agree on a common alert format', 14],
  ['The quiet return of the system monitor as a desktop centrepiece', 19],
  ['Ten years of GPU-accelerated terminals, measured', 26],
]

function feed() {
  const now = Date.now()
  const items = HEADLINES.map(
    ([title, hours], i) =>
      `<item><title>${title}</title><link>https://example.com/demo/${i}</link><pubDate>${new Date(now - hours * 3_600_000).toUTCString()}</pubDate></item>`,
  ).join('')
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>Demo Wire</title>${items}</channel></rss>`
}

/** The media shot's stand-ins: the television pane's page, X's, and a feed. */
export function mediaStandIn() {
  const server = createServer((req, res) => {
    if (req.url?.startsWith('/feed.xml')) {
      res.writeHead(200, { 'content-type': 'application/rss+xml' })
      res.end(feed())
      return
    }
    const page = standInPage(req.url ?? '')
    res.writeHead(page === null ? 404 : 200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(page ?? '')
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const base = `http://127.0.0.1:${server.address().port}`
      resolve({
        server,
        homes: `youtubetv=${base}/tv/,x=${base}/x/`,
        feedUrl: `${base}/feed.xml`,
      })
    })
  })
}

/** Notes and tasks for the desk shot, written into the profile as main keeps them. */
export function deskFiles(dir) {
  const now = Date.now()
  const hour = 3_600_000
  const note = (id, body, ago) => ({
    id,
    body,
    createdAt: now - ago,
    updatedAt: now - ago,
    rev: 1,
  })
  writeFileSync(
    path.join(dir, 'notes.json'),
    JSON.stringify({
      version: 1,
      notes: [
        note(
          'n1',
          [
            'Release checklist',
            '',
            '- run the whole e2e suite',
            '- bump the version in package.json',
            '- push the tag, let the workflow build',
            '- read the notes once more before promoting',
            '',
            'Ideas',
            '- a preset for the evening: media and a timer',
            '- quieter scanlines on the White theme',
          ].join('\n'),
          20 * 60_000,
        ),
        note('n2', 'Call back about the office move\nThursday, after the stand-up', 26 * hour),
        note('n3', 'Groceries\ncoffee beans, oat milk, rice', 50 * hour),
      ],
    }),
  )
  const task = (id, title, dueIn, extra = {}) => ({
    id,
    listId: 'inbox',
    title,
    ...(dueIn === null ? {} : { due: now + dueIn }),
    allDay: false,
    repeat: 'none',
    done: false,
    order: Number(id.slice(1)),
    createdAt: now - 3 * 24 * hour,
    updatedAt: now - hour,
    ...extra,
  })
  writeFileSync(
    path.join(dir, 'tasks.json'),
    JSON.stringify({
      version: 1,
      lists: [{ id: 'inbox', name: 'tasks' }],
      tasks: [
        task('t1', 'Review the pull request for the orbit map', 2 * hour),
        task('t2', 'Write the release notes', 26 * hour),
        task('t3', 'Book the meeting room for Friday', 50 * hour),
        task('t4', 'Renew the domain', 9 * 24 * hour),
        task('t5', 'Water the plants', 5 * hour, { repeat: 'weekly' }),
        task('t6', 'Back up the photo library', null),
        task('t7', 'Send the invoice', -2 * hour, { done: true, completedAt: now - 3 * hour }),
      ],
    }),
  )
}
