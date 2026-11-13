import { expect, type Locator, type Page } from '@playwright/test'
import { popUp } from '../support/cloud.js'
import { test } from '../support/shared.js'
import { aiSettings, openaiProvider } from '../support/stubs/ai.js'
import { launch, paneById, single } from '../support.js'

/**
 * Ctrl+Shift+= and Ctrl+Shift+- size the reading text of the pane that has the keyboard when it
 * is AI CHAT, ELEC or TRANSLATE - every pane of that kind, and nothing else - and the shells'
 * type otherwise (settings.reading, settings.terminal.fontSize). TRANSLATE's text is checked in
 * panes/translate.spec.ts, where its engine is stood in for.
 */

// A provider no test asks: a pane asks only on send, and nothing is sent here.
const SETTINGS = aiSettings([openaiProvider('http://127.0.0.1:9')])

const LAYOUT = {
  version: 1,
  root: {
    kind: 'split',
    id: 'row',
    direction: 'row',
    sizes: [35, 35, 30],
    children: [
      { kind: 'pane', id: 'chat', widget: 'aichat' },
      { kind: 'pane', id: 'council', widget: 'elec' },
      { kind: 'pane', id: 'sh', widget: 'terminal' },
    ],
  },
}

const settings = (page: Page) =>
  page.evaluate(async () => {
    const s = await window.elecdex.settings.get()
    return { reading: s.reading, shell: s.terminal.fontSize }
  })

const px = (target: Locator) =>
  target.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))

test('the type keys size the focused reading pane’s text, per kind, and the shells otherwise', async () => {
  const { page, close } = await launch(undefined, { layout: LAYOUT, settings: SETTINGS })
  try {
    const chatInput = paneById(page, 'chat').getByTestId('aichat-input')
    const elecInput = paneById(page, 'council').getByTestId('elec-input')
    const before = { chat: await px(chatInput), elec: await px(elecInput) }

    await chatInput.click()
    await page.keyboard.press('Control+Shift+Equal')
    await page.keyboard.press('Control+Shift+Equal')
    await expect
      .poll(() => settings(page))
      .toEqual({ reading: { aichat: 120, elec: 100, translate: 100 }, shell: 13 })
    await expect.poll(() => px(chatInput)).toBeCloseTo(before.chat * 1.2, 1)
    expect(await px(elecInput)).toBeCloseTo(before.elec, 1)

    await elecInput.click()
    await page.keyboard.press('Control+Shift+Minus')
    await expect
      .poll(() => settings(page))
      .toEqual({ reading: { aichat: 120, elec: 90, translate: 100 }, shell: 13 })
    await expect.poll(() => px(elecInput)).toBeCloseTo(before.elec * 0.9, 1)

    // From a shell, the shells' type, as before.
    await paneById(page, 'sh').locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+Equal')
    await expect
      .poll(() => settings(page))
      .toEqual({ reading: { aichat: 120, elec: 90, translate: 100 }, shell: 14 })
  } finally {
    await close()
  }
})

test('the type keys reach a reading pane popped up over the workspace', async () => {
  const { page, close } = await launch(undefined, {
    layout: single('terminal'),
    settings: SETTINGS,
  })
  try {
    const popup = await popUp(page, 'aichat')
    const input = popup.getByTestId('aichat-input')
    const before = await px(input)
    await input.click()
    await page.keyboard.press('Control+Shift+Equal')
    await expect
      .poll(() => settings(page))
      .toEqual({ reading: { aichat: 110, elec: 100, translate: 100 }, shell: 13 })
    await expect.poll(() => px(input)).toBeCloseTo(before * 1.1, 1)
  } finally {
    await close()
  }
})
