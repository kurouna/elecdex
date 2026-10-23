import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, type Page, test } from '@playwright/test'
import {
  type AiStub,
  aiSettings,
  aiStub,
  firstOf,
  isChat,
  openaiProvider,
  piecesOf,
} from './support/stubs/ai.js'
import { launch, saveDialogAnswers, single } from './support.js'

/**
 * The ELEC system pane against a provider served from this machine, speaking the
 * OpenAI dialect. Which way a unit votes is the stub's to say, by model: `yes`,
 * `no`, `slow` (never finishes), and `split`, where LOGOS and PATHOS approve and
 * ETHOS rejects - until the second round, when all three approve.
 */

interface Seen {
  model: string
  system: string
  user: string
}

let stub: AiStub
let origin: string

/** The chat requests the stand-in received, as the units asked them (model lists apart). */
const seen = (): Seen[] =>
  stub.seen.filter(isChat).map((entry) => ({
    model: entry.body?.model ?? '',
    system: firstOf(entry, 'system'),
    user: firstOf(entry, 'user'),
  }))

function answerFor(entry: Seen): string | null {
  const unit = /You are (UNIT-\d \w+)/.exec(entry.system)?.[1] ?? ''
  const secondRound = entry.user.includes('in the first round')
  switch (entry.model) {
    case 'yes':
      return `${unit} finds it sound.\nVERDICT: APPROVE\nCONFIDENCE: 75`
    case 'no':
      return `${unit} finds it wanting.\nVERDICT: REJECT\nCONFIDENCE: 60`
    case 'split':
      if (secondRound || unit !== 'UNIT-2 ETHOS') {
        return `${unit} agrees.\n**VERDICT:** APPROVE\nCONFIDENCE: 90`
      }
      return `${unit} objects.\nVERDICT: REJECT\nCONFIDENCE: 55`
    default:
      return null
  }
}

test.beforeAll(async () => {
  stub = await aiStub({
    openai: (entry) => {
      const text = answerFor({
        model: entry.body?.model ?? '',
        system: firstOf(entry, 'system'),
        user: firstOf(entry, 'user'),
      })
      if (text === null) return { hold: 'Thinking it over' }
      return { pieces: piecesOf(text, 9), usage: { prompt_tokens: 40, completion_tokens: 12 } }
    },
    models: { '/v1/models': Array.from({ length: 40 }, (_, i) => `models/number-${i}`) },
  })
  origin = stub.origin
})

test.afterAll(async () => {
  await stub.close()
})

test.beforeEach(() => {
  stub.seen.length = 0
})

const pane = (page: Page) => page.locator('[data-testid=pane][data-widget=elec]')
const layout = () => single('elec', { id: 'e' })
const withProviders = (model: string, elec: object = {}) => ({
  ...aiSettings([
    openaiProvider(origin, { model }),
    openaiProvider(origin, { id: 'other', name: 'Other', model: 'no' }),
  ]),
  elec,
})

async function submit(page: Page, motion: string): Promise<void> {
  await pane(page).getByTestId('elec-input').fill(motion)
  await pane(page).getByTestId('elec-input').press('Enter')
}

const unit = (page: Page, n: number) =>
  pane(page).locator(`[data-testid=elec-unit][data-unit="${n}"]`)
const ballot = (page: Page, n: number) =>
  pane(page).locator(`[data-testid=elec-ballot][data-unit="${n}"]`)

test('with no provider the pane asks for one, and nothing is touched', async () => {
  const { page, userData, close } = await launch(undefined, { layout: layout() })
  try {
    await expect(pane(page).getByTestId('elec-setup')).toBeVisible()
    await pane(page).getByTestId('elec-open-settings').click()
    await expect(page.getByTestId('settings-ai')).toBeVisible()
    // The standpoints are set beside the providers they are put to.
    await expect(page.getByTestId('elec-persona')).toHaveCount(3)
    expect(seen()).toEqual([])
    expect(existsSync(path.join(userData, 'elec'))).toBe(false)
  } finally {
    await close()
  }
})

test('a motion is voted by three units, resolved, and is there after a restart', async () => {
  const launched = await launch(undefined, { layout: layout(), settings: withProviders('split') })
  const { page, userData } = launched
  try {
    // A pane in a layout asks no one.
    await expect(pane(page).getByTestId('elec-resolution')).toContainText('awaiting motion')
    await expect(unit(page, 0)).toHaveAttribute('data-state', 'standby')
    expect(seen()).toEqual([])

    await expect(pane(page).getByTestId('elec-motion')).toContainText('awaiting motion')
    // Before a motion the units sit powered off, and the console says so.
    await expect(pane(page).getByTestId('elec-stage')).not.toHaveClass(/powered/)
    await expect(pane(page).getByTestId('elec-log')).toContainText(
      'UNIT-1 LOGOS · split · POWER OFF',
    )
    await submit(page, 'Adopt the four-day week?')
    // What the council answers stands over it, in the same view as the plates.
    await expect(pane(page).getByTestId('elec-motion-text')).toHaveText('Adopt the four-day week?')
    await expect(pane(page).getByTestId('elec-outcome')).toHaveText('approved')
    await expect(pane(page).getByTestId('elec-stage')).toHaveClass(/powered/)
    const log = pane(page).getByTestId('elec-log')
    await expect(log).toContainText('POWER ON · 3 UNITS')
    await expect(log).toContainText('UNIT-2 ETHOS · VOTE REJECT 55%')
    await expect(log).toContainText('RESOLUTION · APPROVED 2·1·0·0')
    await expect(pane(page).getByTestId('elec-resolution')).toHaveAttribute(
      'data-outcome',
      'approved',
    )
    // Like every notice here, the resolution powers on as a tube does.
    await expect(pane(page).getByTestId('elec-outcome')).toHaveClass(/crt-on/)

    await expect(unit(page, 0)).toHaveAttribute('data-state', 'approve')
    await expect(unit(page, 1)).toHaveAttribute('data-state', 'reject')
    await expect(unit(page, 2)).toHaveAttribute('data-state', 'approve')
    await expect(unit(page, 0)).toContainText('90%')
    // The statement is shown; the lines the vote was read from are not.
    await expect(ballot(page, 1)).toContainText('UNIT-2 ETHOS objects.')
    await expect(ballot(page, 1)).not.toContainText('VERDICT')

    // Each unit was told who it is and how to answer; one local server, one unit at a time.
    expect(seen().map((s) => /You are (UNIT-\d \w+)/.exec(s.system)?.[1])).toEqual([
      'UNIT-1 LOGOS',
      'UNIT-2 ETHOS',
      'UNIT-3 PATHOS',
    ])
    expect(seen()[0]?.system).toContain('VERDICT: APPROVE or REJECT or ABSTAIN')
    expect(seen()[0]?.user).toBe('MOTION:\nAdopt the four-day week?')
    await expect.poll(() => page.evaluate(() => window.elecdex.elec.active())).toEqual([])

    const files = readdirSync(path.join(userData, 'elec'))
    expect(files).toHaveLength(1)

    // Exported as markdown through a save dialog owned by the window (issue 20).
    const exportTo = path.join(userData, 'exported-motion.md')
    const dialogs = await saveDialogAnswers(launched.app, exportTo)
    const sessionId = (await page.evaluate(() => window.elecdex.elec.sessions()))[0]?.id ?? ''
    expect(await page.evaluate((id) => window.elecdex.elec.export(id), sessionId)).toBe(exportTo)
    expect(readFileSync(exportTo, 'utf8')).toContain('Adopt the four-day week?')
    expect(await dialogs()).toEqual([{ owned: true }])

    await launched.quit()
  } catch (error) {
    await launched.close()
    throw error
  }

  // Read from disk: reopening a deliberation asks the provider nothing.
  stub.seen.length = 0
  const relaunched = await launch(userData)
  try {
    const again = relaunched.page
    await expect(pane(again).getByTestId('elec-outcome')).toHaveText('approved')
    await expect(ballot(again, 0)).toContainText('UNIT-1 LOGOS agrees.')
    await pane(again).getByTestId('elec-log-toggle').click()
    await expect(pane(again).getByTestId('elec-log-item')).toHaveCount(1)
    await expect(pane(again).getByTestId('elec-log-item')).toContainText('approved')
    expect(seen()).toEqual([])
  } finally {
    await relaunched.close()
  }
})

test('the seats are chosen in the pane and kept in the settings', async () => {
  const { page, userData, close } = await launch(undefined, {
    layout: layout(),
    settings: withProviders('yes'),
  })
  try {
    await pane(page).getByTestId('elec-seats-toggle').click()
    const second = pane(page).locator('[data-testid=elec-seat][data-unit="1"]')
    await second.getByTestId('elec-seat-provider').selectOption('other')
    await expect(unit(page, 1)).toContainText('no')
    await second.getByTestId('elec-same').click()

    const settings = () => JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8'))
    await expect
      .poll(() => settings().elec.seats)
      .toEqual([
        { provider: 'other', model: 'no' },
        { provider: 'other', model: 'no' },
        { provider: 'other', model: 'no' },
      ])

    await submit(page, 'Ship on Friday?')
    await expect(pane(page).getByTestId('elec-outcome')).toHaveText('rejected')
    expect(seen().map((s) => s.model)).toEqual(['no', 'no', 'no'])
  } finally {
    await close()
  }
})

test('a second round lets each unit hear the others, and shows who changed its vote', async () => {
  const { page, close } = await launch(undefined, {
    layout: layout(),
    settings: withProviders('split'),
  })
  try {
    await pane(page).getByTestId('elec-rounds').selectOption('2')
    await submit(page, 'Adopt the plan?')
    await expect(pane(page).getByTestId('elec-outcome')).toHaveText('approved')
    await expect(unit(page, 1)).toHaveAttribute('data-state', 'approve')
    await expect(unit(page, 1).getByTestId('elec-unit-state')).toHaveText(/reject ›\s*approve/)
    expect(seen()).toHaveLength(6)
    expect(seen()[4]?.user).toContain('[UNIT-1 LOGOS · APPROVE]')
    expect(seen()[4]?.user).toContain('[UNIT-3 PATHOS · APPROVE]')
    await expect(pane(page).getByTestId('elec-resolution')).toContainText('3·0·0·0')
  } finally {
    await close()
  }
})

test('stop ends the deliberation, and closing the pane stops one nobody reads', async () => {
  const { page, close } = await launch(undefined, {
    layout: layout(),
    settings: withProviders('slow'),
  })
  try {
    await submit(page, 'Wait forever?')
    await expect(unit(page, 0)).toHaveAttribute('data-state', 'rx')
    await expect(unit(page, 1)).toHaveAttribute('data-state', 'queued')
    // While the council sits, light runs round the one plate being asked, and round the ring.
    await expect(pane(page).getByTestId('elec-trace')).toHaveCount(1)
    await expect(pane(page).locator('.comet')).toHaveCount(2)
    // The first piece of its answer has come: the spoke has blinked, and the floor runs.
    await expect(pane(page).getByTestId('elec-lock')).toHaveCount(1)
    const floor = () =>
      pane(page)
        .locator('.lines')
        .evaluate((el) => {
          const style = getComputedStyle(el)
          const cell = 2.5 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
          const ty = Number(/^matrix\(([^)]+)\)$/.exec(style.transform)?.[1]?.split(',')[5])
          return {
            animation: style.animationName,
            part: ty / cell,
            held: el.style.getPropertyValue('--floor-at'),
          }
        })
    // Svelte scopes a keyframe's name.
    expect((await floor()).animation).toMatch(/elec-floor$/)
    await expect(page.getByTestId('pane-badge')).toHaveText('deliberating')
    await pane(page).getByTestId('elec-stop-button').click()
    await expect(pane(page).getByTestId('elec-outcome')).toHaveText('quorum not met')
    // The lights go out rather than vanish, and they are gone once the resolution is up.
    await expect(pane(page).locator('.comet')).toHaveCount(0)
    await expect(pane(page).getByTestId('elec-trace')).toHaveCount(0)
    // The floor stops where it is - not back at its start, which was a jump of up to a cell -
    // and nothing is left running (or paused, which would keep its layer) while the council waits.
    const stopped = await floor()
    expect(stopped.animation).toBe('none')
    expect(stopped.held).not.toBe('')
    expect(stopped.part).toBeGreaterThanOrEqual(0)
    expect(stopped.part).toBeLessThanOrEqual(1)
    expect(stopped.part).toBeCloseTo(Number(stopped.held), 2)
    // Nobody carried a decision: all three step back alike.
    await expect(pane(page).locator('[data-testid=elec-unit].back')).toHaveCount(3)
    await expect(unit(page, 0)).toContainText('stopped')
    await expect(unit(page, 2)).toContainText('stopped')
    expect(await page.evaluate(() => window.elecdex.elec.active())).toEqual([])

    await submit(page, 'Wait forever, again?')
    await expect(unit(page, 0)).toHaveAttribute('data-state', 'rx')
    expect(await page.evaluate(() => window.elecdex.elec.active())).toHaveLength(1)
    // Nobody follows the deliberation any more: main stops asking.
    await pane(page).hover()
    await pane(page).getByTestId('pane-close').click()
    await expect(pane(page)).toHaveCount(0)
    await expect
      .poll(() => page.evaluate(() => window.elecdex.elec.active()), { timeout: 10_000 })
      .toEqual([])
  } finally {
    await close()
  }
})

test('back on standby the units power off in their own colours, never through another', async () => {
  const { page, close } = await launch(undefined, {
    layout: layout(),
    settings: withProviders('yes'),
  })
  try {
    await submit(page, 'Ship on Friday?')
    await expect(pane(page).getByTestId('elec-outcome')).toHaveText('approved')
    // The power-off animated the plates' colours as well as their opacity, and what Chromium
    // drew on the way from the accent to a colour mixed with transparent was a black plate
    // with a yellow rim. Watched a frame at a time, for longer than the power-off lasts - from
    // before the press: on a slow runner (macOS CI) the power-off was over before a watch
    // begun after it, and no frame of it was seen.
    await page.evaluate(() => {
      const stage = document.querySelector('[data-testid=elec-stage]')
      const plate = document.querySelector('[data-testid=elec-stage] .plate')
      const strokes = new Set<string>()
      const fills = new Set<string>()
      let flickered = false
      let began = -1
      const watch = new Promise((resolve) => {
        /** One frame of the plate, once the council is on standby (the press), not before. */
        const record = (style: CSSStyleDeclaration): void => {
          if (began < 0) began = performance.now()
          strokes.add(style.stroke)
          fills.add(style.fill)
          if (Number(style.opacity) < 1) flickered = true
        }
        const look = (): void => {
          if (stage === null || plate === null) {
            resolve({ strokes: [], fills: [], flickered })
            return
          }
          if (!stage.classList.contains('powered')) record(getComputedStyle(plate))
          const watching = began < 0 || performance.now() - began < 1200
          if (watching) requestAnimationFrame(look)
          else resolve({ strokes: [...strokes], fills: [...fills], flickered })
        }
        look()
      })
      ;(window as unknown as { __plateWatch: Promise<unknown> }).__plateWatch = watch
    })
    await pane(page).getByTestId('elec-new').click()
    await expect(pane(page).getByTestId('elec-stage')).toHaveClass(/was-on/)
    await expect(pane(page).getByTestId('elec-stage')).not.toHaveClass(/powered/)
    const seen = (await page.evaluate(
      () => (window as unknown as { __plateWatch: Promise<unknown> }).__plateWatch,
    )) as { strokes: string[]; fills: string[]; flickered: boolean }
    expect(seen.flickered).toBe(true)
    expect(seen.strokes).toHaveLength(1)
    expect(seen.fills).toHaveLength(1)
  } finally {
    await close()
  }
})

test('with motion reduced the council draws no light, and still decides', async () => {
  const { page, close } = await launch(undefined, {
    layout: layout(),
    settings: { ...withProviders('split'), motion: 'reduced' },
  })
  try {
    await submit(page, 'Adopt the plan?')
    await expect(pane(page).getByTestId('elec-outcome')).toHaveText('approved')
    await expect(pane(page).locator('.effects')).toHaveCount(0)
    const floor = await pane(page)
      .locator('.lines')
      .evaluate((el) => getComputedStyle(el).animationName)
    expect(floor).toBe('none')
  } finally {
    await close()
  }
})

test("a seat's model list drops out of the seats panel, over the stage, and can be read whole", async () => {
  const { page, close } = await launch(undefined, {
    layout: layout(),
    settings: withProviders('yes'),
  })
  try {
    await pane(page).getByTestId('elec-seats-toggle').click()
    const field = pane(page).getByTestId('elec-seat-model-2')
    await field.click()
    const list = pane(page).getByTestId('elec-seat-model-2-list')
    await expect(list.getByRole('option')).toHaveCount(40)
    // Not cut at the panel's edge (it was, by the clip-path that drew the panel's corner): the
    // rows well below the panel are the ones under the pointer, not the stage behind them.
    // Measured and probed in one step: the list may scroll to keep its selection in view.
    const probe = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid=elec-seats]')?.getBoundingClientRect()
      const list = document
        .querySelector('[data-testid=elec-seat-model-2-list]')
        ?.getBoundingClientRect()
      const rows = [
        ...document.querySelectorAll('[data-testid=elec-seat-model-2-list] [role=option]'),
      ]
      // A row in the list's own view (it scrolls), and below the panel it drops out of.
      const below = rows.find((r) => {
        const box = r.getBoundingClientRect()
        return (
          panel !== undefined &&
          list !== undefined &&
          box.top > panel.bottom + 4 &&
          box.bottom < list.bottom - 2
        )
      })
      if (panel === undefined || below === undefined) return null
      const box = below.getBoundingClientRect()
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      return { row: below.textContent, hit: hit?.closest('[role=option]')?.textContent ?? null }
    })
    expect(probe).not.toBeNull()
    expect(probe?.hit).toBe(probe?.row)
  } finally {
    await close()
  }
})
