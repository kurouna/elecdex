/**
 * The GITHUB STATUS pane at work, for a landscape video (X, YouTube): one pane on a made-up user,
 * with English captions at the bottom.
 *
 * The take:
 *   OPEN     REPOS, the tab a pane opens on: a tile per repository (stars and their 7-day change,
 *            runs, the latest release, views); one opened: its runs, pull requests and releases
 *   QUEUE    what waits on you, grouped as broken or blocked, waiting too long, for you and
 *            triage; the top row's QUEUE, REVIEW and MAIN RED
 *   CARD     a row's card: what it is and how long it has waited
 *   FILTERS  REVIEW, SECURITY, TRIAGE, then ALL
 *   BAND     the contribution grid of the last year, its count and streak
 *   INCIDENT githubstatus.com's open incident as a band at the top
 *   INBOX    the raw notifications, filtered; nothing is marked read
 *   EVENTS   the last 24 hours in the watched repositories, folded
 *   MASK     names hidden at a press
 *   SETTINGS ⚙: AUTO or PINNED repositories, the band, the incident toasts
 *   FOOT     the ledger: requests, 304s that cost nothing, the rate limit
 *
 * Everything shown is made up: gh is main's stand-in (`ELECDEX_CLOUD_STUB=demo`, the user
 * octo-aki and made-up repositories), so no account, token or network is touched. GitHub's public
 * status is a stand-in served here on 127.0.0.1 with one made-up incident. Nothing is pressed that
 * would open a browser (↗). The window is 1600x900 at a zoom of 1, a 16:9 frame; record the
 * window. The take starts after the lead (`--lead`, 6 s) and ends by itself; pass `--exit` to
 * close the window then. Windows only, like the other takes. Run `npm run build` first, then
 * `npm run demo:github`. The options are demo-take.mjs's (`takeOptions`): `--pace`, `--theme`,
 * `--shots=<dir>`, `--no-captions`.
 */
import { createServer } from 'node:http'
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'
import { starHistory } from './github-stars.mjs'

const options = takeOptions({ width: 1600, height: 900, zoom: 1, lead: 6 })
const exit = process.argv.includes('--exit')

/* ---- GitHub's public status, a stand-in ---- */

const started = new Date(Date.now() - 38 * 60_000).toISOString()
const INCIDENTS = {
  incidents: [
    {
      id: 'dm0actns7q2x',
      name: 'Delays in starting Actions jobs',
      impact: 'minor',
      status: 'investigating',
      created_at: started,
      updated_at: new Date(Date.now() - 6 * 60_000).toISOString(),
      components: [{ name: 'Actions' }],
    },
  ],
}
const status = createServer((req, res) => {
  const body = req.url?.includes('scheduled-maintenances')
    ? { scheduled_maintenances: [] }
    : INCIDENTS
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
})
await new Promise((resolve) => status.listen(0, '127.0.0.1', resolve))
const statusUrl = `http://127.0.0.1:${status.address().port}/api/v2/incidents/unresolved.json`

/* ---- The window ---- */

const tree = { version: 1, root: { kind: 'pane', id: 'p-github', widget: 'github' } }

const { standIn } = await prepareData()
const { app, page, wait, settled, run, caption } = await openTake({
  items: [{ id: 'github', name: 'github', tree }],
  options,
  standIn,
  prepare: starHistory,
  env: {
    ELECDEX_CLOUD_STUB: 'demo',
    ELECDEX_GITHUB_STATUS_URL: statusUrl,
    ELECDEX_AWS_STATUS_URL: 'http://127.0.0.1:9/aws',
  },
})

/** Presses a button the way a hand does: held for a moment (CLAUDE.md, test craft). */
const press = (locator) => locator.click({ delay: 20 })
const pane = () => page.getByTestId('github')
const tab = (id) => press(page.getByTestId(`github-tab-${id}`))
const chip = (name) =>
  press(
    pane()
      .locator('button.chip')
      .filter({ hasText: new RegExp(`^${name}`, 'i') })
      .first(),
  )
/** The pointer out of the way: over the window's top, where it opens no card. */
const away = () => page.mouse.move(options.width / 2, 8)

async function open() {
  say('open')
  await caption('GITHUB STATUS reads github.com through your own gh - read only')
  await page.getByTestId('github-tile').first().waitFor({ timeout: 30_000 })
  await wait(3000)
}

async function queue() {
  say('queue')
  await tab('queue')
  await page.getByTestId('github-queue-row').first().waitFor()
  await caption('QUEUE: what waits on you - broken or blocked first, then waiting too long')
  await wait(3400)
}

async function card() {
  say('card')
  await caption('Each row says what it is and how long it has waited')
  const rows = page.getByTestId('github-queue-row')
  await rows.nth(0).hover()
  await wait(2600)
  await rows.nth(4).hover()
  await wait(2400)
  await away()
}

async function filters() {
  say('filters')
  await caption('Filter: reviews waiting on you, security reports, issues nobody has answered')
  for (const name of ['review', 'security', 'triage']) {
    await chip(name)
    await wait(1900)
  }
  await chip('all')
  await wait(900)
}

async function band() {
  say('band')
  await caption('The last year of contributions, with the streak')
  const grid = page.getByTestId('github-contrib-grid')
  const box = await grid.boundingBox()
  if (box !== null) {
    await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.5)
    await wait(1800)
    await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.35)
    await wait(1800)
  }
  await away()
}

async function incident() {
  say('incident')
  const band = page.getByTestId('cloud-incident')
  if ((await band.count()) === 0) return
  await caption('githubstatus.com is read while the pane is shown: an open incident is a band')
  await band.first().hover()
  await wait(3600)
  await away()
}

async function inbox() {
  say('inbox')
  await caption('INBOX: the raw notifications - the pane never marks anything read')
  await tab('inbox')
  await wait(2200)
  for (const name of ['review', 'mention']) {
    await chip(name)
    await wait(1500)
  }
  await chip('all')
  await wait(800)
}

async function events() {
  say('events')
  await caption('EVENTS: the last 24 hours in your repositories, folded by kind')
  await tab('events')
  await away()
  await wait(3600)
}

async function repos() {
  say('repos')
  await caption('REPOS: stars and their 7-day change, runs, the latest release, views')
  await wait(1600)
  const tiles = page.getByTestId('github-tile')
  await tiles.first().hover()
  await wait(2600)
  await caption('A repository opens its runs, open pull requests and releases')
  await press(tiles.first())
  await page.getByTestId('github-crumbs').waitFor()
  await away()
  await wait(3600)
  await page.keyboard.press('Escape')
  await wait(1000)
}

async function mask() {
  say('mask')
  await caption('MASK hides names for a screenshot')
  await press(page.getByTestId('github-mask'))
  await away()
  await wait(3000)
  await press(page.getByTestId('github-mask'))
  await wait(800)
}

async function settings() {
  say('settings')
  await caption('⚙: your top repositories or a pinned list, the band, incident toasts')
  await press(page.getByTestId('github-settings-toggle'))
  await page.getByTestId('github-settings').waitFor()
  await wait(3600)
  await press(page.getByTestId('github-settings-toggle'))
  await caption('Read only while shown; an unchanged answer (304) costs no rate limit')
  await page.getByTestId('github-foot').hover()
  await wait(3200)
  await away()
}

await run(async () => {
  await settled()
  const begun = Date.now()
  await away()
  await open()
  await repos()
  await queue()
  await card()
  await filters()
  await band()
  await incident()
  await inbox()
  await events()
  await mask()
  await settings()
  await caption('elecdex · GITHUB STATUS')
  await wait(2500)
  say(`take: ${((Date.now() - begun) / 1000).toFixed(1)} s`)
  if (exit) {
    status.close()
    await app.close().catch(() => {})
  }
})
