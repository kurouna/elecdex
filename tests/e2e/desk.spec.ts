import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The desk panes: the calculator, the notes, the tasks and the chrono.
 *
 * What is checked here is what only the running app can show - that each one
 * keeps what it was given across a restart, and that it keeps it in the right
 * place. The split matters: a pane's own settings belong in layout.json, while
 * the user's words and deadlines belong in files of their own, so that closing a
 * pane does not throw them away.
 */

const single = (widget: string, state?: Record<string, unknown>) => ({
  version: 1,
  root: { kind: 'pane', id: 'p', widget, ...(state ? { state } : {}) },
})

const readJson = (dir: string, name: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path.join(dir, name), 'utf8')) as Record<string, unknown>

test('the calculator answers as you type, keeps a tape, and has it again after a restart', async () => {
  let launched = await launch(undefined, { layout: single('calc') })
  try {
    const { page } = launched
    const input = page.getByTestId('calc-input')

    // The answer is there before anything is committed.
    await input.fill('1920*1080')
    await expect(page.getByTestId('calc-preview')).toHaveText(/2,073,600/)

    await input.press('Enter')
    await expect(page.getByTestId('calc-tape-row')).toHaveCount(1)

    // Typed with a Japanese keyboard, and as a magnitude - the reason the
    // evaluator is elecxzy's rather than a fresh one.
    await input.fill('３百万÷12')
    await input.press('Enter')
    await expect(page.getByTestId('calc-tape-row').last()).toContainText('250,000')

    // A name goes into the register row and can be used by the next line.
    await input.fill('rate = 8 * percent')
    await input.press('Enter')
    await expect(page.getByTestId('calc-register')).toHaveAttribute('data-name', 'rate')
    await input.fill('4800 * rate')
    await expect(page.getByTestId('calc-preview')).toHaveText(/384/)
    await input.press('Enter')

    await page.waitForTimeout(1500) // let the layout save
    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('calc-tape-row')).toHaveCount(4)
    await expect(launched.page.getByTestId('calc-register')).toHaveAttribute('data-name', 'rate')
  } finally {
    await launched.close()
  }
})

test('a refused line stays where it was typed, and says why', async () => {
  const { page, close } = await launch(undefined, { layout: single('calc') })
  try {
    const input = page.getByTestId('calc-input')
    await input.fill('1/0')
    await input.press('Enter')
    await expect(page.getByTestId('calc-error')).toHaveText(/Division by zero/)
    await expect(input).toHaveValue('1/0')
    await expect(page.getByTestId('calc-tape-row')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('a note is written to notes.json, not into the layout, and survives its pane', async () => {
  let launched = await launch(undefined, { layout: single('notes') })
  try {
    const { page, userData } = launched
    await page.getByTestId('notes-new').click()
    const body = page.getByTestId('notes-body')
    await body.fill('release steps\n- push the tag')

    // The bar in the footer says a write is due, then that it happened.
    await expect(page.getByTestId('notes-status')).toContainText('writing')
    await expect(page.getByTestId('notes-status')).toContainText('wrote', { timeout: 5000 })

    await expect
      .poll(() => JSON.stringify(readJson(userData, 'notes.json')))
      .toContain('release steps')
    // The layout holds which note is shown, and nothing of what it says.
    await page.waitForTimeout(1500)
    expect(JSON.stringify(readJson(userData, 'layout.json'))).not.toContain('release steps')

    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('notes-body')).toHaveValue(/release steps/)
  } finally {
    await launched.close()
  }
})

test('the notes pane works out the sum the caret is in', async () => {
  const { page, close } = await launch(undefined, { layout: single('notes') })
  try {
    await page.getByTestId('notes-new').click()
    const body = page.getByTestId('notes-body')
    await body.fill('budget 1200*3')
    // Put the caret inside the expression rather than at the end of the line.
    await body.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(10, 10))
    await body.press('Control+=')
    await expect(body).toHaveValue('budget 1200*3 = 3,600')

    // And leaves prose alone.
    await body.fill('no sums here')
    await body.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(5, 5))
    await body.press('Control+=')
    await expect(body).toHaveValue('no sums here')
  } finally {
    await close()
  }
})

test('a task is read back before it is added, and kept in tasks.json', async () => {
  let launched = await launch(undefined, { layout: single('todo') })
  try {
    const { page, userData } = launched
    const input = page.getByTestId('todo-input')

    await input.fill('ask mon about the invoice')
    // Nothing was understood, so nothing is claimed.
    await expect(page.getByTestId('todo-decoded')).toHaveCount(0)

    await input.fill('歯医者 明日 9:00')
    await expect(page.getByTestId('todo-decoded')).toContainText('due')
    await input.press('Enter')
    await expect(page.getByTestId('todo-row')).toHaveCount(1)
    await expect(page.getByTestId('todo-next')).toContainText(/\d\d:\d\d/)

    await expect.poll(() => JSON.stringify(readJson(userData, 'tasks.json'))).toContain('歯医者')

    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('todo-row')).toHaveCount(1)
  } finally {
    await launched.close()
  }
})

test('a task due now is announced, with the pane closed and no reminder pane open', async () => {
  // Only a clock: nothing in this layout knows anything about tasks.
  const due = Date.now() + 2000
  const tasks = {
    version: 1,
    lists: [{ id: 'tasks', name: 'tasks' }],
    tasks: [
      {
        id: 'due-soon',
        listId: 'tasks',
        title: 'stand up',
        due,
        allDay: false,
        repeat: 'none',
        done: false,
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
  }
  const { page, close, userData } = await launch(undefined, {
    layout: single('clock'),
    env: {},
  })
  try {
    // Written after launch so main picks it up through its watcher, which is the
    // same path a hand edit takes.
    const { writeFileSync } = await import('node:fs')
    writeFileSync(path.join(userData, 'tasks.json'), JSON.stringify(tasks))

    const toast = page.getByTestId('toast')
    await expect(toast).toHaveCount(1, { timeout: 15_000 })
    await expect(toast).toContainText('stand up')

    // Done from the toast really ticks the task off.
    await toast.getByTestId('toast-action').filter({ hasText: 'done' }).click()
    await expect
      .poll(() => JSON.stringify(readJson(userData, 'tasks.json')), { timeout: 10_000 })
      .toContain('"done":true')
  } finally {
    await close()
  }
})

test('a note deleted from the switcher goes, and the pane shows what it fell back to', async () => {
  const { page, close } = await launch(undefined, { layout: single('notes') })
  try {
    await page.getByTestId('notes-new').click()
    await page.getByTestId('notes-body').fill('note one')
    await expect(page.getByTestId('notes-status')).toContainText('wrote', { timeout: 5000 })
    await page.getByTestId('notes-new').click()
    await page.getByTestId('notes-body').fill('note two')
    await expect(page.getByTestId('notes-status')).toContainText('wrote', { timeout: 5000 })

    await page.getByTestId('notes-switcher-toggle').click()
    await expect(page.getByTestId('notes-switcher-item')).toHaveCount(2)
    // The note being shown is deleted from the list it is listed in.
    await page.getByTestId('notes-switcher-delete').first().click()

    // It really goes, and the text on screen is the note that is left - not the
    // deleted one's, which the next keystroke would have written into it.
    await expect(page.getByTestId('notes-body')).toHaveValue('note one')
    // The list stays open, with one note left in it.
    await expect(page.getByTestId('notes-switcher-item')).toHaveCount(1)
  } finally {
    await close()
  }
})

test('a completed task is shown, not lost behind a heading', async () => {
  const { page, close } = await launch(undefined, { layout: single('todo') })
  try {
    await page.getByTestId('todo-input').fill('buy milk')
    await page.getByTestId('todo-input').press('Enter')
    await expect(page.getByTestId('todo-row')).toHaveCount(1)
    await page.getByTestId('todo-complete').click()

    await expect(page.getByTestId('todo-row-done')).toHaveCount(1)
    await expect(page.getByTestId('todo-row-done')).toContainText('buy milk')

    // And it can be hidden and brought back from the heading, which is a button.
    await page.getByTestId('todo-toggle-done').click()
    await expect(page.getByTestId('todo-row-done')).toHaveCount(0)
    await page.getByTestId('todo-toggle-done').click()
    await expect(page.getByTestId('todo-row-done')).toHaveCount(1)
  } finally {
    await close()
  }
})

test('the stopwatch and the countdowns run as separate machines', async () => {
  const { page, close } = await launch(undefined, { layout: single('timer') })
  try {
    await page.getByTestId('timer-start').click()
    await expect(page.getByTestId('timer')).toHaveAttribute('data-running', 'true')

    // Starting the stopwatch started no countdown.
    await page.getByTestId('timer-mode-timer').click()
    await expect(page.getByTestId('timer-card')).toHaveCount(1)
    await expect(page.locator('[data-testid=timer-card][data-running=true]')).toHaveCount(0)
    // The stopwatch says it is still going, from the timers mode.
    await expect(page.getByTestId('timer-stopwatch-aside')).toBeVisible()

    // A countdown runs beside it, and resetting one leaves the other alone.
    await page.getByTestId('timer-start').first().click()
    await expect(page.locator('[data-testid=timer-card][data-running=true]')).toHaveCount(1)
    await page.getByTestId('timer-reset').first().click()
    await expect(page.locator('[data-testid=timer-card][data-running=true]')).toHaveCount(0)

    await page.getByTestId('timer-mode-stopwatch').click()
    await expect
      .poll(async () => page.getByTestId('timer-readout').first().textContent())
      .not.toMatch(/^00:00/)
  } finally {
    await close()
  }
})

test('several countdowns can be kept, each with its own duration', async () => {
  let launched = await launch(undefined, { layout: single('timer', { mode: 'timer' }) })
  try {
    const { page } = launched
    await page.locator('[data-testid=timer-add-preset][data-minutes="3"]').click()
    await page.locator('[data-testid=timer-add-preset][data-minutes="10"]').click()
    await expect(page.getByTestId('timer-card')).toHaveCount(3)

    await page.getByTestId('timer-remove').first().click()
    await expect(page.getByTestId('timer-card')).toHaveCount(2)

    await page.waitForTimeout(1500) // let the layout save
    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('timer-card')).toHaveCount(2)
  } finally {
    await launched.close()
  }
})

test('the chrono keeps counting across a restart, and its laps with it', async () => {
  let launched = await launch(undefined, { layout: single('timer') })
  try {
    const { page } = launched
    await page.getByTestId('timer-start').click()
    await expect(page.getByTestId('timer')).toHaveAttribute('data-running', 'true')
    await page.waitForTimeout(1200)
    await page.getByTestId('timer-lap').click()
    await expect(page.getByTestId('timer-lap-row')).toHaveCount(1)

    await page.waitForTimeout(1500) // let the layout save
    launched = await launched.relaunch()

    // Still running, still counting from the moment it began - not from zero.
    await expect(launched.page.getByTestId('timer')).toHaveAttribute('data-running', 'true')
    await expect(launched.page.getByTestId('timer-lap-row')).toHaveCount(1)
    await expect
      .poll(async () => launched.page.getByTestId('timer-readout').textContent(), {
        timeout: 10_000,
      })
      .not.toMatch(/^00:0[01]/)
  } finally {
    await launched.close()
  }
})

test('a countdown reaching zero stops itself and says so once', async () => {
  const { page, close } = await launch(undefined, {
    // The shape a pane saved by the build where the two shared one clock has;
    // it opens with that duration as its countdown.
    layout: single('timer', { mode: 'timer', durationMs: 2000 }),
  })
  try {
    await expect(page.getByTestId('timer-card')).toHaveCount(1)
    await page.getByTestId('timer-start').click()
    await expect(page.getByTestId('toast')).toHaveCount(1, { timeout: 15_000 })
    await expect(page.getByTestId('timer-readout')).toHaveText(/00:00/)
    await expect(page.getByTestId('timer')).not.toHaveAttribute('data-running', 'true')
    // Not once per frame afterwards.
    await page.waitForTimeout(1000)
    await expect(page.getByTestId('toast')).toHaveCount(1)
  } finally {
    await close()
  }
})

test('a task is renamed and given a deadline where it is read', async () => {
  const { page, close } = await launch(undefined, { layout: single('todo') })
  try {
    await page.getByTestId('todo-input').fill('buy milk')
    await page.getByTestId('todo-input').press('Enter')
    await expect(page.getByTestId('todo-row')).toHaveCount(1)

    await page.getByTestId('todo-title').click()
    await page.getByTestId('todo-edit-title').fill('buy oat milk')
    await page.getByTestId('todo-edit-title').press('Enter')
    await expect(page.getByTestId('todo-title')).toHaveText('buy oat milk')

    // A deadline is typed the way it is typed when a task is added.
    await page.getByTestId('todo-when').click()
    await page.getByTestId('todo-edit-due').fill('明日 9:00')
    await page.getByTestId('todo-edit-due').press('Enter')
    await expect(page.getByTestId('todo-when')).toHaveText(/09:00|9 /)
    await expect(page.getByTestId('todo-next')).toContainText(/\d\d:\d\d/)

    // And an empty line takes it off again.
    await page.getByTestId('todo-when').click()
    await page.getByTestId('todo-edit-due').fill('')
    await page.getByTestId('todo-edit-due').press('Enter')
    await expect(page.getByTestId('todo-when')).toHaveText('—')
  } finally {
    await close()
  }
})

test('a countdown is built up by adding minutes, and set exactly by typing', async () => {
  const { page, close } = await launch(undefined, { layout: single('timer', { mode: 'timer' }) })
  try {
    const card = page.getByTestId('timer-card').first()
    await expect(card.getByTestId('timer-readout')).toHaveText('05:00')

    // The steps add to what is set, so the list is not a ceiling.
    await card.locator('[data-testid=timer-step][data-minutes="25"]').click()
    await expect(card.getByTestId('timer-readout')).toHaveText('30:00')
    await card.locator('[data-testid=timer-step][data-minutes="10"]').click()
    await card.locator('[data-testid=timer-step][data-minutes="1"]').click()
    await expect(card.getByTestId('timer-readout')).toHaveText('41:00')

    // And the field beside them sets an exact number of minutes.
    await card.getByTestId('timer-card-custom').fill('90')
    await card.getByTestId('timer-card-custom').press('Enter')
    await expect(card.getByTestId('timer-readout')).toHaveText('1:30:00')
  } finally {
    await close()
  }
})

test('an alarm goes off at its time, with the chrono pane closed', async () => {
  // An alarm is a time of day, so the shortest honest wait is the turn of the
  // next minute - which is the one thing in the suite worth waiting for: it is
  // what says an alarm rings with nothing of its pane on screen.
  test.setTimeout(180_000)
  // Only a clock in the layout: nothing on screen knows about alarms.
  const { page, close, userData } = await launch(undefined, { layout: single('clock') })
  try {
    // Far enough into the next minute that the write lands before it comes round.
    const soon = new Date(Date.now() + 65_000)
    soon.setSeconds(0, 0)
    const alarms = {
      version: 1,
      alarms: [
        {
          id: 'lunch',
          label: 'lunch break',
          hour: soon.getHours(),
          minute: soon.getMinutes(),
          days: [],
          enabled: true,
        },
      ],
    }
    // Written after launch, so main picks it up through its watcher - the same
    // path a hand edit takes.
    const { writeFileSync } = await import('node:fs')
    writeFileSync(path.join(userData, 'alarms.json'), JSON.stringify(alarms))

    const toast = page.getByTestId('toast')
    await expect(toast).toHaveCount(1, { timeout: 120_000 })
    await expect(toast).toContainText('lunch break')

    // A one-off has had its moment and switches itself off, as a phone's does.
    await expect
      .poll(() => JSON.stringify(readJson(userData, 'alarms.json')), { timeout: 10_000 })
      .toContain('"enabled":false')
  } finally {
    await close()
  }
})

test('an alarm is set, switched off and removed from the pane', async () => {
  let launched = await launch(undefined, { layout: single('timer') })
  try {
    const { page } = launched
    await page.getByTestId('timer-mode-alarm').click()
    await expect(page.getByTestId('alarm-next')).toContainText('nothing set')

    await page.getByTestId('alarm-time-input').fill('07:30')
    await page.getByTestId('alarm-label-input').fill('wake up')
    await page.getByTestId('alarm-add-button').click()

    const alarm = page.getByTestId('alarm')
    await expect(alarm).toHaveCount(1)
    await expect(alarm).toHaveAttribute('data-enabled', 'true')
    await expect(page.getByTestId('alarm-next')).toContainText('07:30')

    await page.getByTestId('alarm-toggle').click()
    await expect(alarm).not.toHaveAttribute('data-enabled', 'true')
    await expect(page.getByTestId('alarm-next')).toContainText('nothing set')

    // It outlives the pane: alarms are main's, not the layout's.
    await page.waitForTimeout(1500)
    launched = await launched.relaunch()
    await launched.page.getByTestId('timer-mode-alarm').click()
    await expect(launched.page.getByTestId('alarm')).toHaveCount(1)
    await launched.page.getByTestId('alarm-remove').click()
    await expect(launched.page.getByTestId('alarm')).toHaveCount(0)
  } finally {
    await launched.close()
  }
})

test('a rolling readout never takes a click meant for the controls under it', async () => {
  // A digit rolls in from half a line below, and the browser hit-tests where a
  // transform puts a box: the number used to lie over the buttons for a few
  // frames every second and swallow whatever was pressed there.
  const { page, close } = await launch(undefined, { layout: single('timer', { mode: 'timer' }) })
  try {
    await page.getByTestId('timer-start').first().click()
    await expect(page.locator('[data-testid=timer-card][data-running=true]')).toHaveCount(1)

    // Watch the point the reset button sits at for longer than a whole roll.
    const covered = await page.evaluate(async () => {
      const button = document.querySelector('[data-testid=timer-reset]') as HTMLElement
      const seen = new Set<string>()
      for (let i = 0; i < 40; i += 1) {
        const box = button.getBoundingClientRect()
        const at = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
        seen.add((at as HTMLElement | null)?.getAttribute('data-testid') ?? at?.className ?? 'none')
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      return [...seen]
    })
    expect(covered).toEqual(['timer-reset'])

    // And the click really lands, with the digits changing under it.
    await page.getByTestId('timer-reset').first().click()
    await expect(page.locator('[data-testid=timer-card][data-running=true]')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('the notes pane shows where the writing goes', async () => {
  const { page, close } = await launch(undefined, { layout: single('notes') })
  try {
    await page.getByTestId('notes-new').click()
    const sheet = page.getByTestId('notes-body')
    const ground = await page.evaluate(() => {
      const pane = document.querySelector('[data-testid=notes]') as HTMLElement
      return getComputedStyle(pane).backgroundColor
    })
    const fill = await sheet.evaluate((el) => getComputedStyle(el).backgroundColor)
    const border = await sheet.evaluate((el) => getComputedStyle(el).borderTopWidth)

    // The sheet is not the same surface as the margin around it: there was no
    // telling where typing would go when both were the pane's own ground.
    expect(fill).not.toBe(ground)
    expect(fill).not.toBe('rgba(0, 0, 0, 0)')
    expect(border).not.toBe('0px')
  } finally {
    await close()
  }
})

test('a wide pane keeps a measure instead of stretching its contents', async () => {
  // One pane filling the window is the width these panes look worst at: a line
  // of digits or a three-word task drawn across the whole screen.
  const { page, close } = await launch(undefined, { layout: single('calc') })
  try {
    const width = async (testid: string): Promise<number> =>
      (await page.getByTestId(testid).first().boundingBox())?.width ?? 0

    const pane = await width('calc')
    expect(pane).toBeGreaterThan(700)
    // The tape and the line it is typed on stay inside a readable column.
    expect(await width('calc-tape')).toBeLessThan(pane)
    expect(await width('calc-input')).toBeLessThan(pane)
  } finally {
    await close()
  }
})

test('every desk pane is in the picker and opens from it', async () => {
  const { page, close } = await launch(undefined, { layout: single('clock') })
  try {
    for (const widget of ['calc', 'notes', 'todo', 'timer']) {
      await page.keyboard.press('Control+Shift+A')
      await page.getByTestId('pane-picker').waitFor()
      await page.locator(`[data-testid=pane-picker-item][data-widget=${widget}]`).click()
      await expect(page.locator(`[data-testid=pane][data-widget=${widget}]`)).toHaveCount(1)
    }
  } finally {
    await close()
  }
})
