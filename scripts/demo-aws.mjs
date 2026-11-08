/**
 * The AWS STATUS pane at work, for a landscape video (X, YouTube): one pane on a made-up account,
 * with English captions at the bottom.
 *
 * The take:
 *   OPEN       RESOURCES, the first tab: services, what bills by the hour, what looks forgotten,
 *              what is new in seven days
 *   FORGOTTEN  the forgotten rows, dearest first; a row's card says what it was judged by; one
 *              kept with KEEP ("I meant to leave it")
 *   TILES      the service tiles walked with the arrow keys; EC2 opened: facets, the idle one
 *              filtered and opened, with how long it has been quiet and KEEP; back with Escape
 *   ALL        the whole forgotten list across services, filtered by a reason
 *   ELSEWHERE  what runs in regions the pane does not show, from the weekly sweep; checked now
 *   ATTENTION  alarms, expiries, security and cost, and the one line of what looks forgotten
 *   ACTIVE     ≈ $ an hour and a month at list prices, IDLE and WASTE
 *   COST       the month by service, budgets and the QUOTA gauge
 *   ACTIVITY   CloudTrail's write events and sign-ins; ACCOUNT, the account's security
 *   MASK       every name and the account hidden at a press
 *   COSTS      Cost Explorer asked once per account (▸ more: frequency, cap, estimate), and ⚙'s
 *              GetMetricData cap; the ledger of what was called
 *
 * Everything shown is made up: the AWS CLI is main's stand-in (`ELECDEX_CLOUD_STUB=demo`, the
 * account acme-prod), so no account, CLI or network is touched, and AWS's public status points at
 * a closed port. Nothing is pressed that would open a browser (↗ CONSOLE). The window is 1600x900
 * at a zoom of 1, a 16:9 frame; record the window. The take starts after the lead (`--lead`, 6 s)
 * and ends by itself; pass `--exit` to close the window then. Windows only, like the other takes.
 * Run `npm run build` first, then `npm run demo:aws`. The options are demo-take.mjs's
 * (`takeOptions`): `--pace`, `--theme`, `--shots=<dir>`, `--no-captions`.
 */
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1600, height: 900, zoom: 1, lead: 6 })
const exit = process.argv.includes('--exit')

/* ---- The window ---- */

const tree = {
  version: 1,
  root: {
    kind: 'pane',
    id: 'p-aws',
    widget: 'aws',
    state: { regions: ['ap-northeast-1', 'us-east-1'] },
  },
}
const { standIn } = await prepareData()
const { app, page, wait, settled, run, caption } = await openTake({
  items: [{ id: 'aws', name: 'aws', tree }],
  options,
  standIn,
  env: {
    ELECDEX_CLOUD_STUB: 'demo',
    // AWS's public status at a closed port: no incident from the real feed in the take.
    ELECDEX_AWS_STATUS_URL: 'http://127.0.0.1:9/aws',
    ELECDEX_GITHUB_STATUS_URL: 'http://127.0.0.1:9/github',
  },
})

/** Presses a button the way a hand does: held for a moment (CLAUDE.md, test craft). */
const press = (locator) => locator.click({ delay: 20 })
const pane = () => page.getByTestId('aws')
const tab = (id) => press(page.getByTestId(`aws-tab-${id}`))
/** The pointer out of the way: over the window's top, where it opens no card. */
const away = () => page.mouse.move(options.width / 2, 8)
/** A step up the drill-down, from the keyboard, as a hand would. */
const back = async () => {
  await page.keyboard.press('Escape')
  await wait(900)
}

async function open() {
  say('open')
  await caption('AWS STATUS reads your account through your own AWS CLI - read only')
  await page.getByTestId('aws-forgotten-row').first().waitFor({ timeout: 30_000 })
  await wait(3200)
  await caption('RESOURCES: what is there, what bills by the hour, what was made and forgotten')
  await page.getByTestId('aws-res-hourly').hover()
  await wait(2600)
  await away()
  await wait(900)
}

async function forgotten() {
  say('forgotten')
  await caption('LOOKS FORGOTTEN: billed and quiet, dearest first, with why in plain words')
  const rows = page.getByTestId('aws-forgotten-row')
  await rows.nth(1).hover()
  await wait(2800)
  await rows.nth(2).hover()
  await wait(2400)
  await caption('KEEP - "I meant to leave it" - takes it off the list for this account')
  const row = rows.nth(4)
  await row.hover()
  await wait(900)
  await press(row.getByTestId('aws-keep'))
  await away()
  await wait(3200)
}

async function tiles() {
  say('tiles')
  await caption('Every service as a tile, the groups with the most forgotten money first')
  const first = page.getByTestId('aws-tile').first()
  await first.focus()
  await wait(1200)
  for (const key of ['ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) {
    await page.keyboard.press(key)
    await wait(700)
  }
  await wait(900)
  await caption('A tile opens its service: facets that filter each other, and a list')
  await press(page.getByTestId('aws-tile').filter({ hasText: 'EC2' }).first())
  await page.getByTestId('aws-drill-list').waitFor()
  await away()
  await wait(2400)
  await press(page.getByTestId('aws-facet-bar').filter({ hasText: 'idle' }).first())
  await wait(2200)
  await caption('One resource: its state, how long it has been quiet, and what that was judged by')
  const idle = page.getByTestId('aws-drill-row').filter({ hasText: 'dev-box' }).first()
  await press((await idle.count()) > 0 ? idle : page.getByTestId('aws-drill-row').first())
  await page.getByTestId('aws-drill-item').waitFor()
  await wait(3600)
  await back()
  await back()
}

async function all() {
  say('all')
  await caption('The whole list across services, filtered by reason, service or region')
  await press(page.getByTestId('aws-forgotten-all'))
  await page.getByTestId('aws-drill-list').waitFor()
  await away()
  await wait(2200)
  await press(page.getByTestId('aws-facet-bar').filter({ hasText: 'unattached' }).first())
  await wait(2600)
  await back()
}

async function elsewhere() {
  say('elsewhere')
  const line = page.getByTestId('aws-elsewhere')
  if ((await line.count()) === 0) return
  await caption('ELSEWHERE: what runs in regions this pane does not show, swept once a week')
  await line.scrollIntoViewIfNeeded()
  await wait(900)
  await press(line)
  await page.getByTestId('aws-drill-list').waitFor()
  await away()
  await wait(2200)
  await press(page.getByTestId('aws-sweep-now'))
  await wait(2400)
  await back()
}

async function tabs() {
  say('attention')
  await caption('ATTENTION: alarms, expiries, security and cost, heaviest first')
  await tab('attention')
  await away()
  await wait(3800)
  say('active')
  await caption('ACTIVE: what runs and bills now, at list prices, with IDLE and WASTE')
  await tab('active')
  await wait(3800)
  say('cost')
  await caption('COST: the month by service, the budget forecast and your own QUOTA')
  await tab('cost')
  await wait(3800)
  say('activity')
  await caption('ACTIVITY: who changed what, from CloudTrail · ACCOUNT: root, MFA, old keys')
  await tab('activity')
  await wait(2800)
  await tab('account')
  await wait(2800)
  await tab('resources')
  await wait(1200)
}

async function mask() {
  say('mask')
  await caption('MASK hides every resource name and the account, for a screenshot')
  await press(page.getByTestId('aws-mask'))
  await away()
  await wait(3400)
  await press(page.getByTestId('aws-mask'))
  await wait(900)
}

async function costs() {
  say('costs')
  await caption('Paid calls are asked once per account, with the month’s estimate and a cap')
  const more = pane().getByRole('button', { name: /more/ })
  if ((await more.count()) > 0) {
    await press(more.first())
    await wait(3200)
    await press(more.first())
    await wait(600)
  }
  await caption('⚙: GetMetricData under a monthly cap, ELSEWHERE, and what you keep')
  await press(page.getByTestId('aws-settings-toggle'))
  await page.getByTestId('aws-settings').waitFor()
  await wait(3600)
  await press(page.getByTestId('aws-settings-toggle'))
  await caption(
    'The foot counts every call: free, free tier and paid - read only, only while shown',
  )
  await page.getByTestId('aws-foot').hover()
  await wait(3200)
  await away()
}

await run(async () => {
  await settled()
  const started = Date.now()
  await away()
  await open()
  await forgotten()
  await tiles()
  await all()
  await elsewhere()
  await tabs()
  await mask()
  await costs()
  await caption('elecdex · AWS STATUS')
  await wait(2500)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
