import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import type { ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, type Locator, type Page } from '@playwright/test'
import { test } from '../support/shared.js'
import {
  type AiRequest,
  type AiStub,
  aiSettings,
  aiStub,
  anthropicProvider,
  openaiChunk,
  openaiProvider,
  piecesOf,
} from '../support/stubs/ai.js'
import { launch, saveDialogAnswers, single, waitForSaved } from '../support.js'

/**
 * The AI chat pane against providers served from this machine: one that speaks
 * the OpenAI dialect (what Ollama, LM Studio and llama.cpp speak) and one that
 * speaks Anthropic's. No test asks a real model; providers are the user's own
 * addresses, so listing a local server is all it takes.
 */

const ANSWER = 'Here you go:\n\n```js\nconsole.log("hi")\n```\n\nThat is **all**.'

/**
 * The stand-in: the `slow` model holds its answer open, Anthropic's dialect answers "Bonjour.",
 * and `/many` lists more models than a screen holds (Gemini lists about a hundred).
 */
let stub: AiStub
let origin: string
let seen: AiRequest[]
let held: ServerResponse[]

test.beforeAll(async () => {
  stub = await aiStub({
    openai: (entry) => {
      if (entry.body?.model === 'slow') return { hold: 'The first half' }
      return {
        reasoning: 'They want a greeting.',
        pieces: piecesOf(ANSWER, 7),
        usage: { prompt_tokens: 11, completion_tokens: 22 },
      }
    },
    anthropic: () => 'Bonjour.',
    models: {
      '/v1/models': ['tiny', 'slow'],
      '/many/v1/models': Array.from({ length: 150 }, (_, i) => `models/number-${i}`),
    },
  })
  ;({ origin, seen, held } = stub)
})

test.afterAll(async () => {
  await stub.close()
})

test.beforeEach(() => {
  seen.length = 0
})

const pane = (page: Page) => page.locator('[data-testid=pane][data-widget=aichat]')
const active = (page: Page) => page.evaluate(() => window.elecdex.ai.active())
const layout = (state?: Record<string, unknown>) =>
  single('aichat', state === undefined ? { id: 'p' } : { id: 'p', state })
const withProviders = () =>
  aiSettings([openaiProvider(origin), anthropicProvider(origin)], {
    systemPrompt: 'Answer briefly.',
  })

/**
 * A press as a hand makes it: down, a moment, up. Playwright's own click is over before the page
 * has reacted to the press, so it cannot see a button that moves away under the pointer.
 */
async function pressSlowly(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  if (box === null) throw new Error('nothing to press')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  // wait: the hold itself is what is imitated - a hand keeps the button down a moment.
  await page.waitForTimeout(250)
  await page.mouse.up()
}

async function say(page: Page, text: string): Promise<void> {
  await pane(page).getByTestId('aichat-input').fill(text)
  await pane(page).getByTestId('aichat-input').press('Enter')
}

test('with no provider the pane asks for one, and nothing is touched', async () => {
  const { page, userData, close } = await launch(undefined, { layout: layout() })
  try {
    await expect(pane(page).getByTestId('aichat-setup')).toBeVisible()
    await pane(page).getByTestId('aichat-open-settings').click()
    await expect(page.getByTestId('settings-ai')).toBeVisible()

    expect(seen).toEqual([])
    expect(existsSync(path.join(userData, 'chats'))).toBe(false)
    expect(existsSync(path.join(userData, 'ai-keys.json'))).toBe(false)
  } finally {
    await close()
  }
})

test('a provider is added in the settings; its key goes to main and never comes back', async () => {
  const { page, userData, close } = await launch(undefined, { layout: layout() })
  try {
    await pane(page).getByTestId('aichat-open-settings').click()
    // Not "ai chat": the providers are there for whatever asks a model, not for one pane.
    await expect(page.locator('[data-testid=settings-section][data-section=ai]')).toHaveText(
      /^ai$/i,
    )
    await page.getByTestId('ai-preset').selectOption('custom')
    await page.getByTestId('ai-add').click()
    const provider = page.locator('[data-testid=ai-provider][data-provider=custom]')
    await provider.getByTestId('ai-address').fill(`${origin}/v1`)
    await provider.getByTestId('ai-address').press('Tab')

    // What main will not keep is said, not swallowed: it would look saved and fail at "test".
    const key = provider.getByTestId('ai-key')
    const reveal = provider.getByTestId('ai-key-reveal')
    await key.fill('x'.repeat(600))
    await key.press('Enter')
    await expect(provider.getByTestId('ai-key-refused')).toContainText('not kept')
    await expect(provider.getByTestId('ai-key-state')).toHaveCount(0)

    // What is typed is dots until asked for: a paste that went in three times over looked like
    // any other, was kept, and was refused by the service with words about something else.
    await expect(reveal).toBeDisabled()
    await key.fill('sk-e2e-secret')
    await expect(key).toHaveAttribute('type', 'password')
    await reveal.click()
    await expect(key).toHaveAttribute('type', 'text')
    await expect(key).toBeFocused()
    await expect(reveal).toHaveText('hide')

    // Kept on Enter (or on leaving), like every other field here.
    await key.press('Enter')
    await expect(provider.getByTestId('ai-key-refused')).toHaveCount(0)
    await expect(provider.getByTestId('ai-key-state')).toContainText('key held')
    // The field is emptied the moment the key is handed over, and hidden again. A key that is
    // held reads as one - dots - which are not its value: there is nothing to show or to copy.
    await expect(key).toHaveValue('')
    await expect(key).toHaveAttribute('type', 'password')
    await expect(key).toHaveAttribute('placeholder', /^•+$/)
    await expect(reveal).toBeDisabled()

    await provider.getByTestId('ai-test').click()
    await expect(provider.getByTestId('ai-test-result')).toHaveText('ok · 2 models')
    expect(seen.at(-1)?.headers.authorization).toBe('Bearer sk-e2e-secret')

    // Nowhere the page can read, and not in the file people copy around.
    const status = await page.evaluate(() => window.elecdex.ai.providers())
    expect(status).toEqual([{ id: 'custom', key: 'stored', moved: false }])
    expect(await page.content()).not.toContain('sk-e2e-secret')
    expect(readFileSync(path.join(userData, 'settings.json'), 'utf8')).not.toContain('sk-e2e')
    expect(readFileSync(path.join(userData, 'ai-keys.json'), 'utf8')).not.toContain('sk-e2e')

    // Given another address, the provider is sent no key until it is typed again there (found
    // in review: the key went to whatever host the address then named).
    const elsewhere = origin.replace('127.0.0.1', 'localhost')
    await provider.getByTestId('ai-address').fill(`${elsewhere}/v1`)
    await provider.getByTestId('ai-address').press('Tab')
    await expect(provider.getByTestId('ai-key-state')).toContainText('another address')
    // And asking says why, rather than going without the key to be refused as if it were wrong
    // (issue 18).
    const before = seen.length
    await provider.getByTestId('ai-test').click()
    await expect(provider.getByTestId('ai-test-result')).toContainText('another address')
    expect(seen.length).toBe(before)
    await key.fill('sk-e2e-secret')
    await key.press('Enter')
    await expect(provider.getByTestId('ai-key-state')).toContainText('key held')
    await provider.getByTestId('ai-test').click()
    await expect.poll(() => seen.at(-1)?.headers.authorization).toBe('Bearer sk-e2e-secret')

    // Removing the provider forgets its key with it.
    await provider.getByTestId('ai-remove').click()
    await provider.getByTestId('ai-remove').click()
    await expect(provider).toHaveCount(0)
    await expect
      .poll(() => JSON.parse(readFileSync(path.join(userData, 'ai-keys.json'), 'utf8')).keys)
      .toEqual({})
  } finally {
    await close()
  }
})

test('a key typed and not saved is the key "test" uses, and a hosted service asked without one says so', async ({
  shared,
}) => {
  const settings = withProviders()
  const { page, close } = await shared({
    layout: layout(),
    settings: {
      ...settings,
      ai: {
        ...settings.ai,
        providers: [
          // Counted as hosted (https), yet nothing leaves this machine: nobody listens there.
          {
            id: 'hosted',
            name: 'Hosted',
            kind: 'openai',
            baseUrl: 'https://127.0.0.1:9/v1',
            model: '',
          },
          ...settings.ai.providers,
        ],
      },
    },
  })
  try {
    await page.keyboard.press('Control+Shift+Period')
    await page.locator('[data-testid=settings-section][data-section=ai]').click()

    // No key, and the service's own words do not say that is what is missing (Gemini: a 404).
    const hosted = page.locator('[data-testid=ai-provider][data-provider=hosted]')
    await hosted.getByTestId('ai-test').click()
    await expect(hosted.getByTestId('ai-test-result')).toContainText(
      'no key is held for this provider',
    )

    // Typed, and straight to "test" - as every other field here is saved as you go.
    const local = page.locator('[data-testid=ai-provider][data-provider=local]')
    // Pressed as a hand does. Leaving the field keeps the key while the button is still held down:
    // once that made a line appear above the button, which moved from under the pointer and was
    // never clicked - no result, and no sign of why.
    await local.getByTestId('ai-key').fill('sk-typed-only')
    // Where the button is within its provider: the dialog may scroll, the button must not move.
    const within = async (): Promise<number> =>
      ((await local.getByTestId('ai-test').boundingBox())?.y ?? 0) -
      ((await local.boundingBox())?.y ?? 0)
    const before = await within()
    await pressSlowly(page, local.getByTestId('ai-test'))
    await expect(local.getByTestId('ai-test-result')).toHaveText('ok · 2 models')
    expect(await within()).toBe(before)
    expect(seen.at(-1)?.headers.authorization).toBe('Bearer sk-typed-only')
    await expect(local.getByTestId('ai-key-state')).toContainText('key held')
    await expect(local.getByTestId('ai-key')).toHaveValue('')

    // Leaving the field keeps the key too.
    const claude = page.locator('[data-testid=ai-provider][data-provider=claude]')
    await claude.getByTestId('ai-key').fill('sk-left-behind')
    await claude.getByTestId('ai-key').press('Tab')
    await expect(claude.getByTestId('ai-key-state')).toContainText('key held')
    expect(await page.content()).not.toContain('sk-left-behind')

    // A provider removed takes its result with it: the next one added gets the same id.
    await local.getByTestId('ai-remove').click()
    await local.getByTestId('ai-remove').click()
    await expect(local).toHaveCount(0)
    await page.getByTestId('ai-preset').selectOption('custom')
    await page.getByTestId('ai-add').click()
    const first = page.locator('[data-testid=ai-provider][data-provider=custom]')
    await first.getByTestId('ai-address').fill(`${origin}/v1`)
    await first.getByTestId('ai-address').press('Tab')
    await first.getByTestId('ai-test').click()
    await expect(first.getByTestId('ai-test-result')).toHaveText('ok · 2 models')
    await first.getByTestId('ai-remove').click()
    await first.getByTestId('ai-remove').click()
    await expect(first).toHaveCount(0)
    await page.getByTestId('ai-add').click()
    await expect(first).toHaveCount(1)
    await expect(first.getByTestId('ai-test-result')).toHaveCount(0)
    await expect(first.getByTestId('ai-key-state')).toHaveText('no key held')
  } finally {
    await close()
  }
})

test('an answer streams in, is drawn as markdown, and is there after a restart', async () => {
  const launched = await launch(undefined, { layout: layout(), settings: withProviders() })
  const { userData } = launched
  try {
    const { page } = launched
    await expect(pane(page).getByTestId('aichat-empty')).toContainText(/Local\s·\stiny/i)
    // A pane in a layout calls nobody by itself.
    expect(seen).toEqual([])

    await say(page, 'Say hi in JavaScript')
    const answer = pane(page).locator('[data-testid=aichat-message][data-role=assistant]')
    await expect(answer).toContainText('That is all.')
    await expect(answer.getByTestId('chat-code')).toContainText('console.log("hi")')
    await expect(answer.locator('strong')).toHaveText('all')
    await expect(answer).toContainText('11 › 22 tok')
    await expect(answer.locator('details.thinking')).toContainText('reasoning')

    const request = seen.find((entry) => entry.path === '/v1/chat/completions')
    expect(request?.body?.messages).toEqual([
      { role: 'system', content: 'Answer briefly.' },
      { role: 'user', content: 'Say hi in JavaScript' },
    ])
    // No key was set, so none is sent.
    expect(request?.headers.authorization).toBeUndefined()
    expect(await active(page)).toEqual([])
    await expect(pane(page).getByTestId('pane-subtitle')).toContainText(/Say hi in JavaScript/i)

    // Exported as markdown through a save dialog owned by the window (issue 20).
    const exportTo = path.join(userData, 'exported-chat.md')
    const dialogs = await saveDialogAnswers(launched.app, exportTo)
    const chatId = (await page.evaluate(() => window.elecdex.ai.chats()))[0]?.id ?? ''
    expect(await page.evaluate((id) => window.elecdex.ai.export(id), chatId)).toBe(exportTo)
    expect(readFileSync(exportTo, 'utf8')).toContain('Say hi in JavaScript')
    expect(await dialogs()).toEqual([{ owned: true }])

    expect(readdirSync(path.join(userData, 'chats'))).toHaveLength(1)
    await launched.quit()
  } catch (error) {
    await launched.close()
    throw error
  }

  const again = await launch(userData)
  try {
    const answer = pane(again.page).locator('[data-testid=aichat-message][data-role=assistant]')
    await expect(answer).toContainText('That is all.')
    // Read from disk: reopening a conversation asks the provider nothing.
    expect(seen.filter((entry) => entry.path === '/v1/chat/completions')).toHaveLength(1)

    // The history lists it; a new conversation starts empty and the old one can be reopened.
    await pane(again.page).getByTestId('aichat-new').click()
    await expect(pane(again.page).getByTestId('aichat-message')).toHaveCount(0)
    await pane(again.page).getByTestId('aichat-history-toggle').click()
    await pane(again.page).getByTestId('aichat-history-item').click()
    await expect(answer).toContainText('That is all.')
  } finally {
    await again.close()
  }
})

test('a conversation past the window of its model stays whole, and is sent from where it fits', async ({
  shared,
}) => {
  const settings = withProviders()
  const launched = await shared({
    layout: layout(),
    settings: {
      ...settings,
      ai: {
        ...settings.ai,
        // The smallest window there is: 768 tokens may go, and a cut leaves 512.
        providers: settings.ai.providers.map((p) =>
          p.id === 'local' ? { ...p, contextTokens: 1024 } : p,
        ),
      },
    },
  })
  try {
    const { page } = launched
    // About three hundred tokens a question.
    const long = (n: number): string => `Question ${n}: ${'word '.repeat(236)}`.trim()
    const answers = pane(page).locator('[data-testid=aichat-message][data-role=assistant]')
    for (const n of [1, 2, 3]) {
      await say(page, long(n))
      await expect(answers).toHaveCount(n)
      await expect(answers.nth(n - 1)).toContainText('That is all.')
    }
    const sent = seen
      .filter((entry) => entry.path === '/v1/chat/completions')
      .map((entry) => entry.body?.messages?.map((m) => m.role))
    expect(sent).toEqual([
      ['system', 'user'],
      ['system', 'user', 'assistant', 'user'],
      // Seven would not fit: it begins again at the third question, system prompt intact.
      ['system', 'user'],
    ])
    expect(seen.at(-1)?.body?.messages?.at(-1)?.content).toBe(long(3))

    // Nothing left the log, and it says where the model's view of it begins.
    await expect(pane(page).getByTestId('aichat-message')).toHaveCount(6)
    const cut = pane(page).getByTestId('aichat-cut')
    await expect(cut).toHaveText(/not sent · 4 above/i)
    await expect(cut.locator('xpath=following-sibling::*[1]')).toContainText('Question 3')

    // The line is the conversation's, so it is there for the next pane to open it.
    await page.reload()
    await expect(pane(page).getByTestId('aichat-cut')).toHaveText(/not sent · 4 above/i)
  } finally {
    await launched.close()
  }
})

test("a provider's window goes by its address until a figure is typed", async () => {
  const { page, userData, close } = await launch(undefined, { layout: layout() })
  const saved = () =>
    JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8')).ai.providers[0]
  try {
    await pane(page).getByTestId('aichat-open-settings').click()
    await page.getByTestId('ai-preset').selectOption('ollama')
    await page.getByTestId('ai-add').click()
    const provider = page.locator('[data-testid=ai-provider][data-provider=ollama]')
    await expect(provider.getByTestId('ai-context-note')).toContainText('up to 6144 tokens')

    await provider.getByTestId('ai-context').fill('32768')
    await provider.getByTestId('ai-context').press('Tab')
    await expect(provider.getByTestId('ai-context-note')).toContainText('up to 24576 tokens')
    await expect.poll(() => saved().contextTokens).toBe(32768)

    await provider.getByTestId('ai-context').fill('0')
    await provider.getByTestId('ai-context').press('Tab')
    await expect(provider.getByTestId('ai-context-note')).toContainText('sent whole')

    // Not a figure: the field goes back to what is held. Emptied, the address decides again.
    await provider.getByTestId('ai-context').fill('lots')
    await provider.getByTestId('ai-context').press('Tab')
    await expect(provider.getByTestId('ai-context')).toHaveValue('0')
    await provider.getByTestId('ai-context').fill('')
    await provider.getByTestId('ai-context').press('Tab')
    await expect(provider.getByTestId('ai-context-note')).toContainText('up to 6144 tokens')
    await expect.poll(() => 'contextTokens' in saved()).toBe(false)

    // Summaries are a request nobody typed: off until turned on.
    await expect(page.getByTestId('ai-compact')).not.toBeChecked()
    await page.getByTestId('ai-compact').check()
    await expect
      .poll(() => JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8')).ai.compact)
      .toBe(true)

    // A hosted service is left to itself.
    await provider.getByTestId('ai-address').fill('https://api.example.test/v1')
    await provider.getByTestId('ai-address').press('Tab')
    await expect(provider.getByTestId('ai-context-note')).toContainText('sent whole')
    expect(seen).toEqual([])
  } finally {
    await close()
  }
})

test('a provider with more models than fit is scrolled through, in the settings and in the pane', async () => {
  const { page, userData, close } = await launch(undefined, { layout: layout() })
  const saved = () =>
    JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8')).ai.providers[0]
  try {
    await pane(page).getByTestId('aichat-open-settings').click()
    await page.getByTestId('ai-preset').selectOption('custom')
    await page.getByTestId('ai-add').click()
    const provider = page.locator('[data-testid=ai-provider][data-provider=custom]')
    await provider.getByTestId('ai-address').fill(`${origin}/many/v1`)
    await provider.getByTestId('ai-address').press('Tab')
    await provider.getByTestId('ai-test').click()
    await expect(provider.getByTestId('ai-test-result')).toHaveText('ok · 150 models')

    await provider.getByTestId('ai-model').click()
    const list = provider.getByTestId('ai-model-list')
    await expect(list.getByTestId('ai-model-option')).toHaveCount(150)
    // The page's own list: taller inside than out, and the wheel moves it.
    const room = await list.evaluate((el) => [el.scrollHeight, el.clientHeight])
    expect(room[0]).toBeGreaterThan((room[1] ?? 0) * 3)
    await list.hover()
    await page.mouse.wheel(0, 600)
    await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    // Its last model (the list is sorted) can be reached and chosen - pressing in the list does not close it first.
    await list.getByTestId('ai-model-option').last().click()
    await expect(provider.getByTestId('ai-model')).toHaveValue('models/number-99')
    await expect(list).toHaveCount(0)
    await expect.poll(() => saved().model).toBe('models/number-99')

    await page.keyboard.press('Escape')
    const field = pane(page).getByTestId('aichat-model')
    await field.click()
    const inPane = pane(page).getByTestId('aichat-model-list')
    await expect(inPane.getByTestId('aichat-model-option')).toHaveCount(150)
    // Typing narrows it; the arrow keys and Enter choose without the pointer.
    await field.fill('number-7')
    await expect(inPane.getByTestId('aichat-model-option')).toHaveCount(11)
    await field.press('ArrowDown')
    await field.press('ArrowDown')
    await field.press('Enter')
    await expect(field).toHaveValue('models/number-70')
    await expect(pane(page).getByTestId('aichat-empty')).toContainText(/number-70/i)
  } finally {
    await close()
  }
})

test('"send" is seen to come alive when there is something to send, in every theme', async ({
  shared,
}) => {
  const { page, close } = await shared({
    layout: layout(),
    settings: { ...withProviders(), motion: 'reduced' },
  })
  try {
    const send = pane(page).getByTestId('aichat-send')
    const look = () =>
      send.evaluate((el) => {
        const style = getComputedStyle(el)
        return { color: style.color, ground: style.backgroundColor, opacity: style.opacity }
      })
    for (const theme of ['tron', 'amber', 'phosphor', 'white', 'business-dark', 'business-light']) {
      await page.evaluate((id) => window.elecdex.settings.patch({ theme: id }), theme)
      await pane(page).getByTestId('aichat-input').fill('')
      await expect(send).toBeDisabled()
      const idle = await look()
      await pane(page).getByTestId('aichat-input').fill('something to send')
      await expect(send).toBeEnabled()
      const armed = await look()
      // Lit, not merely un-dimmed: on Tron the muted text of an enabled button was hardly
      // brighter than a disabled one, and the button did not look as if it had woken up.
      expect(armed.color, theme).not.toBe(idle.color)
      expect(armed.ground, theme).not.toBe(idle.ground)
      expect(armed.opacity, theme).toBe('1')
      expect(idle.opacity, theme).toBe('0.5')
    }
  } finally {
    await close()
  }
})

test('an answer can be stopped, and what was written is kept', async ({ shared }) => {
  const { page, close } = await shared({
    layout: layout({ provider: 'local', model: 'slow' }),
    settings: withProviders(),
  })
  try {
    await say(page, 'Take your time')
    await expect(pane(page).getByTestId('aichat-run')).toContainText('The first half')
    expect(await active(page)).toHaveLength(1)

    await pane(page).getByTestId('aichat-stop-button').click()
    const answer = pane(page).locator('[data-testid=aichat-message][data-role=assistant]')
    await expect(answer).toContainText('The first half')
    // The code is drawn in capitals by the stylesheet; which of the two a matcher sees is not ours to say.
    await expect(answer.getByTestId('aichat-stop')).toHaveText(/^stopped$/i)
    await expect(pane(page).getByTestId('aichat-run')).toHaveCount(0)
    expect(await active(page)).toEqual([])

    // "again" asks for the same question anew.
    const before = seen.length
    await answer.hover()
    await answer.getByTestId('aichat-regenerate').click()
    await expect.poll(() => seen.length).toBe(before + 1)
    expect(seen.at(-1)?.body?.messages?.at(-1)).toEqual({ role: 'user', content: 'Take your time' })
  } finally {
    await close()
  }
})

test('an answer survives a reload of the page, and ends when its pane is closed', async () => {
  const { page, userData, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'split',
        id: 's',
        direction: 'row',
        sizes: [50, 50],
        children: [
          { kind: 'pane', id: 'c', widget: 'clock' },
          { kind: 'pane', id: 'p', widget: 'aichat', state: { provider: 'local', model: 'slow' } },
        ],
      },
    },
    settings: withProviders(),
  })
  try {
    await say(page, 'Keep going')
    await expect(pane(page).getByTestId('aichat-run')).toContainText('The first half')
    // The pane state with the conversation's id has to be on disk before the reload.
    await waitForSaved(userData, (text) => text.replace(/\s/g, '').includes('"chat":"'))

    await page.reload()
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
    await expect(pane(page).getByTestId('aichat-run')).toContainText('The first half')
    expect(await active(page)).toHaveLength(1)

    // The model goes on, and the reloaded page follows it from where it was.
    held.at(-1)?.write(openaiChunk({ content: ' and the second.' }))
    await expect(pane(page).getByTestId('aichat-run')).toContainText(
      'The first half and the second.',
    )

    // Nobody follows the conversation any more: main stops asking.
    await pane(page).hover()
    await pane(page).getByTestId('pane-close').click()
    await expect(pane(page)).toHaveCount(0)
    await expect.poll(() => active(page), { timeout: 10_000 }).toEqual([])
  } finally {
    await close()
  }
})

test('the Anthropic dialect sends its key as x-api-key', async ({ shared }) => {
  const { page, close } = await shared({
    layout: layout({ provider: 'claude' }),
    settings: withProviders(),
  })
  try {
    expect(await page.evaluate(() => window.elecdex.ai.setKey('claude', 'sk-ant-e2e'))).toBe(
      'stored',
    )
    await say(page, 'Bonjour ?')
    const answer = pane(page).locator('[data-testid=aichat-message][data-role=assistant]')
    await expect(answer).toContainText('Bonjour.')

    const request = seen.find((entry) => entry.path === '/claude/v1/messages')
    expect(request?.headers['x-api-key']).toBe('sk-ant-e2e')
    expect(request?.body).toMatchObject({
      model: 'claude-test',
      system: 'Answer briefly.',
      messages: [{ role: 'user', content: 'Bonjour ?' }],
    })
  } finally {
    await close()
  }
})

test('a key is refused for an address it would cross the internet to in the clear', async ({
  shared,
}) => {
  const settings = withProviders()
  const first = settings.ai.providers[0]
  if (first) first.baseUrl = 'http://llm.example.test/v1'
  const { page, close } = await shared({ layout: layout(), settings })
  try {
    await page.evaluate(() => window.elecdex.ai.setKey('local', 'sk-plain'))
    await say(page, 'hello')
    await expect(pane(page).getByTestId('aichat-problem')).toContainText('plain http')
    await expect(pane(page).getByTestId('aichat-message')).toHaveCount(0)
    // The draft is still there to send once the address is fixed.
    await expect(pane(page).getByTestId('aichat-input')).toHaveValue('hello')
  } finally {
    await close()
  }
})

/** A part of a message's content, as a dialect that takes files sends it. */
type Part = Record<string, unknown> & { type: string }

/** An image part's data URL. */
const imageUrl = (part: Part | undefined): string =>
  (part?.image_url as { url?: string } | undefined)?.url ?? ''

const lastContent = (entry: AiRequest | undefined): Part[] => {
  const messages = entry?.body?.messages ?? []
  return messages.at(-1)?.content as unknown as Part[]
}

/**
 * A photograph with what a camera writes into one: an EXIF segment naming where it was taken,
 * put in right after the JPEG's first marker.
 */
function photoWithPlace(): Buffer {
  const photo = readFileSync(path.join('docs', 'screenshots', 'elecdex-ai.jpg'))
  const exif = Buffer.from('Exif\0\0GPS-SECRET 35.6812N 139.7671E', 'latin1')
  const segment = Buffer.alloc(4)
  segment.writeUInt16BE(0xffe1, 0)
  segment.writeUInt16BE(exif.length + 2, 2)
  return Buffer.concat([photo.subarray(0, 2), segment, exif, photo.subarray(2)])
}

test('files go with a question: picked, dropped and pasted, as bytes, made small, and never by path', async () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'secret-folder-e2e-'))
  const notes = path.join(folder, 'notes.md')
  const photo = path.join(folder, 'photo.jpg')
  writeFileSync(notes, '# Plan\n- ship it')
  writeFileSync(photo, photoWithPlace())
  const launched = await launch(undefined, { layout: layout(), settings: withProviders() })
  const { page, userData } = launched
  try {
    const chips = pane(page).getByTestId('aichat-payload').getByTestId('aichat-chip')
    await pane(page).getByTestId('aichat-attach-input').setInputFiles([notes, photo])
    await expect(chips).toHaveCount(2)

    // Dropped on the pane, and a picture pasted into the line: the same way in.
    await pane(page)
      .getByTestId('aichat')
      .evaluate((node) => {
        const files = new DataTransfer()
        files.items.add(new File(['dropped text'], 'dropped.txt', { type: 'text/plain' }))
        node.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: files }))
        node.dispatchEvent(
          new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: files }),
        )
      })
    await expect(chips).toHaveCount(3)
    await expect(pane(page).getByTestId('aichat-drop')).toHaveCount(0)
    await pane(page)
      .getByTestId('aichat-input')
      .evaluate(async (input) => {
        const canvas = new OffscreenCanvas(40, 30)
        const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D
        context.fillStyle = '#0f0'
        context.fillRect(0, 0, 40, 30)
        const blob = await canvas.convertToBlob({ type: 'image/png' })
        const data = new DataTransfer()
        data.items.add(new File([blob], 'image.png', { type: 'image/png' }))
        input.dispatchEvent(
          new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }),
        )
      })
    await expect(chips).toHaveCount(4)
    await expect(chips.nth(3)).toContainText(/pasted-\d{8}-\d{6}\.png/)
    await expect(pane(page).getByTestId('aichat-payload-total')).toContainText(/^4 files · /)

    // The page knows each file by its name alone.
    expect(await page.content()).not.toContain('secret-folder-e2e')

    await say(page, 'What are these?')
    const answer = pane(page).locator('[data-testid=aichat-message][data-role=assistant]')
    await expect(answer).toContainText('That is all.')
    await expect(pane(page).getByTestId('aichat-payload')).toHaveCount(0)
    const question = pane(page).locator('[data-testid=aichat-message][data-role=user]')
    await expect(question.getByTestId('aichat-chip')).toHaveCount(4)
    await expect(question.locator('img')).toHaveCount(2)

    const content = lastContent(seen.find((entry) => entry.path === '/v1/chat/completions'))
    expect(content.map((part) => part.type)).toEqual(['image_url', 'image_url', 'text'])
    const url = imageUrl(content[0])
    expect(url).toMatch(/^data:image\/jpeg;base64,/)
    const sent = Buffer.from(url.split(',')[1] ?? '', 'base64')
    // Drawn again in the page: smaller than the 1920 pixels it came at, and with nothing of the
    // camera's in it.
    expect(sent.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
    expect(sent.includes(Buffer.from('GPS-SECRET'))).toBe(false)
    expect(sent.length).toBeLessThan(photoWithPlace().length)
    expect(imageUrl(content[1])).toMatch(/^data:image\/png;base64,/)
    expect(content[2]?.text).toBe(
      '<file name="notes.md">\n# Plan\n- ship it\n</file>\n\n<file name="dropped.txt">\ndropped text\n</file>\n\nWhat are these?',
    )

    // Kept beside the conversation, named by their content; no path anywhere on disk either.
    const chats = path.join(userData, 'chats')
    const record = readdirSync(chats).find((name) => name.endsWith('.json')) as string
    expect(readFileSync(path.join(chats, record), 'utf8')).not.toContain('secret-folder-e2e')
    const kept = readdirSync(path.join(chats, record.replace(/\.json$/, '.files')))
    expect(kept.filter((name) => !name.endsWith('.thumb'))).toHaveLength(4)
    expect(kept.filter((name) => name.endsWith('.thumb'))).toHaveLength(2)
  } finally {
    await launched.close()
    rmSync(folder, { recursive: true, force: true })
  }
})

test('a PDF goes only to a provider that reads one, as a document', async ({ shared }) => {
  const folder = mkdtempSync(path.join(tmpdir(), 'elecdex-pdf-'))
  const paper = path.join(folder, 'paper.pdf')
  writeFileSync(paper, '%PDF-1.4\n<< /Type /Pages /Count 1 >>\n<< /Type /Page >>\n')
  const { page, close } = await shared({ layout: layout(), settings: withProviders() })
  try {
    await pane(page).getByTestId('aichat-attach-input').setInputFiles(paper)
    const chip = pane(page).getByTestId('aichat-payload').getByTestId('aichat-chip')
    await expect(chip).toHaveClass(/unsent/)
    await expect(pane(page).getByTestId('aichat-blocked')).toContainText(
      /no document.*Local is not sent PDF files/i,
    )
    await expect(pane(page).getByTestId('aichat-send')).toBeDisabled()

    await page.evaluate(() => window.elecdex.ai.setKey('claude', 'sk-ant-e2e'))
    await pane(page).getByTestId('aichat-provider').selectOption('claude')
    await expect(chip).not.toHaveClass(/unsent/)
    await say(page, 'Sum it up')
    await expect(
      pane(page).locator('[data-testid=aichat-message][data-role=assistant]'),
    ).toContainText('Bonjour.')
    const content = lastContent(seen.find((entry) => entry.path === '/claude/v1/messages'))
    expect(content[0]).toEqual({
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: readFileSync(paper).toString('base64'),
      },
      title: 'paper.pdf',
    })
    expect(content[1]).toEqual({ type: 'text', text: 'Sum it up' })
  } finally {
    await close()
    rmSync(folder, { recursive: true, force: true })
  }
})
