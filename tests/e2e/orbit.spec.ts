import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { propagate, twoline2satrec } from '../../src/renderer/lib/sgp4.js'
import { serviceStub } from './support/stubs/services.js'
import { beside, launch, quietFor, single, watching } from './support.js'

/**
 * The ORBIT pane against a stand-in for CelesTrak serving the elements it
 * served on 2026-09-23. What only the running app can show: that main asks for
 * the stations once, and for Starlink only when the pane turns it on; that a
 * restart asks again for nothing (the copy on disk is fresh); that a refusal is
 * not asked again; that the pane works the stations' positions out and draws
 * them; and that main lets go of the sets when the pane goes.
 */

const STATIONS = readFileSync('tests/fixtures/orbits/stations.json', 'utf8')
const STARLINK = readFileSync('tests/fixtures/orbits/starlink-60.tle', 'utf8')

/**
 * How many of the stand-in's Starlink satellites SGP4 can place at `at`. The elements are
 * 2026-09-23's and grow older with every run: one that has come down by then has no
 * position, and the pane rightly leaves it out - STARLINK-1068 did from 2026-10-08, and
 * a test that wanted all 60 failed on every run after. Fewer each year (58 at the end of
 * 2026, 30 at the end of 2027, still ten or so in 2030).
 */
function placeable(at: Date): number {
  const lines = STARLINK.split(/\r?\n/)
  let n = 0
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const r = propagate(twoline2satrec(lines[i + 1] ?? '', lines[i + 2] ?? ''), at)?.position
    if (r && typeof r !== 'boolean') n += 1
  }
  return n
}

interface Stand {
  url: string
  /** The paths asked for, in order. */
  readonly asked: string[]
  status: number
  close(): Promise<void>
}

/** CelesTrak's stand-in: the stations' set as JSON, Starlink's as TLE, or `status` refused. */
async function celestrak(): Promise<Stand> {
  let status = 200
  const stub = await serviceStub(({ url }) => {
    if (status !== 200) {
      return {
        status,
        body: 'GP data has not updated since your last successful download',
      }
    }
    const starlink = url.includes('GROUP=starlink')
    return {
      status: 200,
      headers: { 'content-type': starlink ? 'text/plain' : 'application/json' },
      body: starlink ? STARLINK : STATIONS,
    }
  })
  return {
    url: stub.origin,
    get asked() {
      return stub.requests.map((request) => request.url)
    },
    get status() {
      return status
    },
    set status(value: number) {
      status = value
    },
    close: () => stub.close(),
  }
}

const layout = (state?: Record<string, unknown>) =>
  single('orbit', state === undefined ? { id: 'o' } : { id: 'o', state })

test('draws the stations from one download, and asks for Starlink only when shown', async () => {
  const stand = await celestrak()
  let launched = await launch(undefined, { layout: layout(), celestrakBaseUrl: stand.url })
  try {
    const { page } = launched
    await expect(page.getByTestId('orbit-gmt')).toHaveText(/^\d{3}\/\d{2}:\d{2}:\d{2}$/)
    await expect(page.getByTestId('orbit-pos')).toHaveText(/°[NS] .*°[EW]/, { timeout: 15_000 })
    await expect(page.getByTestId('orbit-pass')).not.toHaveText('—')
    expect(stand.asked).toEqual(['/NORAD/elements/gp.php?GROUP=stations&FORMAT=json'])

    await page.locator('[data-testid="orbit-toggle"][data-toggle="starlink"]').click()
    await expect.poll(() => stand.asked.length).toBe(2)
    expect(stand.asked[1]).toContain('GROUP=starlink&FORMAT=tle')
    // The dots are drawn: a worker once left them missing where the page could not start it.
    const map = page.getByTestId('orbit-map')
    const expected = placeable(new Date())
    expect(expected, 'every stand-in satellite has come down: take new elements').toBeGreaterThan(0)
    await expect
      .poll(async () => Number(await map.getAttribute('data-starlink')), { timeout: 10_000 })
      .toBe(expected)

    // The ISS tells its details to the pointer.
    const marks = JSON.parse((await map.getAttribute('data-stations')) ?? '{}') as Record<
      string,
      [number, number]
    >
    const [x, y] = marks.ISS ?? [0, 0]
    await map.hover({ position: { x, y } })
    await expect(page.getByTestId('orbit-tip')).toContainText('International Space Station')
    await expect(page.getByTestId('orbit-tip')).toContainText('NORAD 25544')
    await expect(page.getByTestId('orbit-tip')).toContainText('PERIOD')
    // A station's card powers on and off like every detail card; a Starlink dot's does not.
    await expect(page.getByTestId('orbit-tip')).toHaveAttribute('data-kind', 'station')
    await expect(page.getByTestId('orbit-tip')).toHaveClass(/crt-on/)
    await page.mouse.move(2, 2)
    await expect(page.getByTestId('orbit-tip')).toHaveCount(0)

    // The Sun's mark tells what it is: where it stands overhead, and how it stands for the observer.
    const [sx, sy] = JSON.parse((await map.getAttribute('data-sun')) ?? '[0,0]') as [number, number]
    await map.hover({ position: { x: sx, y: sy } })
    await expect(page.getByTestId('orbit-tip')).toHaveAttribute('data-kind', 'sun')
    await expect(page.getByTestId('orbit-tip')).toContainText('SUN · overhead here')
    await expect(page.getByTestId('orbit-tip')).toContainText('DECLINATION')
    await expect(page.getByTestId('orbit-tip')).toHaveClass(/crt-on/)
    await page.mouse.move(2, 2)
    await expect(page.getByTestId('orbit-tip')).toHaveCount(0)

    // Tiangong can be followed instead, from the same download.
    await page.locator('[data-testid="orbit-focus"][data-code="CSS"]').click()
    await expect(page.getByTestId('orbit-telemetry')).toContainText('CSS LAT / LON')

    // A restart finds both copies fresh on disk and asks for nothing.
    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('orbit-pos')).toHaveText(/°[NS]/, { timeout: 15_000 })
    await quietFor(1500, async () => stand.asked.length, 'the requests to CelesTrak')
    expect(stand.asked).toHaveLength(2)
  } finally {
    await launched.close()
    await stand.close()
  }
})

test('asks no more after a refusal, and keeps nothing once the pane is gone', async () => {
  const stand = await celestrak()
  stand.status = 403
  const { page, close } = await launch(undefined, {
    layout: beside('orbit', { id: 'o', sizes: [60, 40] }),
    celestrakBaseUrl: stand.url,
  })
  try {
    await expect(page.getByTestId('orbit')).toContainText('CelesTrak answered 403', {
      timeout: 15_000,
    })
    // Moving the pane remounts it; the refusal still stands.
    await page.reload()
    await expect(page.getByTestId('orbit')).toContainText('CelesTrak answered 403', {
      timeout: 15_000,
    })
    expect(stand.asked).toHaveLength(1)

    expect(await watching(page, 'orbits')).toEqual(['stations'])
    await page.getByTestId('pane-close').first().click()
    await expect(page.getByTestId('orbit')).toHaveCount(0)
    await expect.poll(() => watching(page, 'orbits')).toEqual([])
  } finally {
    await close()
    await stand.close()
  }
})

test("chooses the observer from the city list, as the pane's own", async () => {
  const stand = await celestrak()
  const { page, close } = await launch(undefined, { layout: layout(), celestrakBaseUrl: stand.url })
  try {
    await page.getByTestId('orbit-observer').click()
    await page.getByTestId('orbit-picker-input').fill('Reykja')
    await page.getByTestId('orbit-picker-city').first().click()
    await expect(page.getByTestId('orbit-observer')).toContainText('Reykjav')
    await expect(page.getByTestId('orbit-telemetry')).toContainText('NEXT PASS · REYKJAV')
  } finally {
    await close()
    await stand.close()
  }
})
