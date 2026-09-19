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
    layout: single('timer', { mode: 'timer', durationMs: 2000 }),
  })
  try {
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
