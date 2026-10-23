import { expect, test } from '@playwright/test'
import { JMA_QUAKE_PAGE } from '../../../src/shared/quakes.js'
import { JMA_FORECAST_URL } from '../../../src/shared/weather.js'
import { launch, paneById, type ServiceStub, serviceStub, single } from '../support.js'

/**
 * The attribution contract (docs/e2e-design.md, section 3.2; CLAUDE.md, Publishing >
 * Attribution): the credits the data's terms ask for are on screen where the data is shown -
 * JMA's 出典 line in the weather pane on a JMA place and in the quakes pane, the GeoIP data's
 * CC BY 4.0 (NRO) in the globe and connections panes, CelesTrak and the Space Defense
 * Squadrons and the time zone lines' ODbL in ORBIT, Yahoo marked unofficial, possibly delayed
 * and not investment advice in markets; and every earthquake and tsunami alert names its
 * source and says what it is not. JMA is a local stand-in: no test asks the real service.
 */

/** Marks every made-up place, so a watched run is never taken for a real earthquake. */
const TEST = '[TEST] '

const JMA_QUAKES = '/bosai/quake/data/list.json'
const JMA_TSUNAMI = '/bosai/tsunami/data/list.json'

/** A JMA list entry: a strong earthquake a few minutes ago, which an alert announces. */
function strongQuake() {
  const at = new Date(Date.now() - 3 * 60_000).toISOString()
  return {
    ctt: 'strong',
    eid: 'strong',
    rdt: at,
    ttl: '震源・震度情報',
    ift: '発表',
    ser: '1',
    at,
    anm: `${TEST}翠浜県沖`,
    en_anm: `${TEST}Off the Coast of Suihama Prefecture`,
    cod: '+31.2+146.8-40000/',
    mag: '5.1',
    maxi: '5+',
  }
}

/** A JMA tsunami warning for one made-up area. */
const tsunamiWarning = () =>
  JSON.stringify({
    Head: { Headline: { Text: `${TEST}津波警報を発表しました。` } },
    Body: {
      Tsunami: {
        Forecast: {
          Item: [
            {
              Area: { Name: `${TEST}霞野県` },
              Category: { Kind: { Code: '51' } },
              FirstHeight: { Condition: 'ただちに津波来襲と予測' },
              MaxHeight: { TsunamiHeight: '3' },
            },
          ],
        },
      },
    },
  })

let stub: ServiceStub

test.beforeAll(async () => {
  stub = await serviceStub()
  stub.routes = {
    [JMA_QUAKES]: JSON.stringify([strongQuake()]),
    [JMA_TSUNAMI]: JSON.stringify([
      { eid: 'tsunami', json: 'warning_VTSE41_0.json', rdt: new Date().toISOString(), ift: '発表' },
    ]),
    '/bosai/tsunami/data/warning_VTSE41_0.json': tsunamiWarning(),
  }
})

test.afterAll(async () => {
  await stub?.close()
})

/** Settings with JMA chosen, so what is credited does not depend on the machine's time zone. */
const japan = (notify: boolean) => ({
  sound: { enabled: false },
  quakes: { source: 'jma', notify },
})

/** What each pane must credit, every piece of it. */
const CREDITS: Record<string, string[]> = {
  weather: [`出典：気象庁ホームページ（${JMA_FORECAST_URL}）を加工して作成`],
  quakes: [
    `出典：気象庁ホームページ（${JMA_QUAKE_PAGE}）を加工して作成`,
    'not an earthquake early warning',
  ],
  globe: ['GeoIP: NRO, CC BY 4.0'],
  connections: ['published by the NRO (CC BY 4.0)'],
  orbit: [
    'Orbital elements: CelesTrak, from the 18th / 19th Space Defense Squadrons',
    'timezone-boundary-builder, © OpenStreetMap contributors (ODbL)',
  ],
  markets: ['Yahoo Finance', 'unofficial', 'may be delayed', 'not investment advice'],
}

/** Where each pane says it: its credit line. */
const creditOf = (widget: string) =>
  widget === 'weather'
    ? '[data-testid=weather-attribution]'
    : widget === 'quakes'
      ? '[data-testid=quakes-credit]'
      : '.credit'

test('every pane showing data whose terms ask for credit gives it', async () => {
  // Each pane a tab of the window's whole size, so no credit is left out for want of room.
  const widgets = Object.keys(CREDITS)
  const layout = {
    version: 1,
    root: {
      kind: 'tabs',
      id: 'credits',
      activeIndex: 0,
      children: widgets.map((widget) => ({
        kind: 'pane',
        id: widget,
        widget,
        // Tokyo: a JMA place, credited whether or not a forecast has arrived.
        ...(widget === 'weather'
          ? { state: { location: { source: 'jma', office: '130000', name: '東京都' } } }
          : {}),
      })),
    },
  }
  const { page, close } = await launch(undefined, {
    layout,
    settings: japan(false),
    jmaBaseUrl: `${stub.origin}/bosai`,
    args: ['--lang=en-US'],
  })
  try {
    const failed: Record<string, string> = {}
    for (const widget of widgets) {
      try {
        await page.locator(`[data-testid=tab][data-pane-id="${widget}"]`).click()
        const credit = paneById(page, widget).locator(creditOf(widget))
        // The quakes pane credits the source of its list, so only once it has one.
        await expect(credit).toBeVisible({ timeout: widget === 'quakes' ? 20_000 : 10_000 })
        for (const words of CREDITS[widget] ?? []) await expect(credit).toContainText(words)
      } catch (error) {
        failed[widget] = String((error as Error).message).split('\n')[0] ?? ''
      }
    }
    expect(failed).toEqual({})
  } finally {
    await close()
  }
})

test('an earthquake alert and a tsunami card name their source and say what they are not', async () => {
  const { page, close } = await launch(undefined, {
    layout: single('clock'),
    settings: japan(true),
    jmaBaseUrl: `${stub.origin}/bosai`,
    args: ['--lang=en-US'],
  })
  try {
    const quake = page.getByTestId('quake-alert')
    await expect(quake).toHaveCount(1, { timeout: 20_000 })
    await expect(quake).toContainText('Source: JMA · not an earthquake early warning')
    // A tsunami card is a warning, not a forecast of the user's own coast: it sends them to
    // their local authorities.
    const tsunami = page.getByTestId('tsunami-alert')
    await expect(tsunami).toBeVisible({ timeout: 20_000 })
    await expect(tsunami).toContainText('Source: JMA · follow local authorities')
  } finally {
    await close()
  }
})
