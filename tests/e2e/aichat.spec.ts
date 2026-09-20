import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createServer, type IncomingHttpHeaders, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { launch } from './support'

/**
 * The AI chat pane against providers served from this machine: one that speaks
 * the OpenAI dialect (what Ollama, LM Studio and llama.cpp speak) and one that
 * speaks Anthropic's. No test asks a real model; providers are the user's own
 * addresses, so listing a local server is all it takes.
 */

interface Seen {
  path: string
  headers: IncomingHttpHeaders
  body: { model?: string; messages?: Array<{ role: string; content: string }> } | null
}

let server: Server
let origin: string
const seen: Seen[] = []
/** Answers held open by the 'slow' model, for the tests to finish or abandon. */
const held: ServerResponse[] = []

const chunk = (delta: object, extra: object = {}): string =>
  `data: ${JSON.stringify({ choices: [{ delta, ...extra }] })}\n\n`

const ANSWER = 'Here you go:\n\n```js\nconsole.log("hi")\n```\n\nThat is **all**.'

function openaiAnswer(entry: Seen, res: ServerResponse): void {
  res.writeHead(200, { 'content-type': 'text/event-stream' })
  if (entry.body?.messages?.[0]?.content.startsWith('You are compacting')) {
    res.write(chunk({ content: 'They asked two long questions.' }))
    res.end('data: [DONE]\n\n')
    return
  }
  if (entry.body?.model === 'slow') {
    res.write(chunk({ content: 'The first half' }))
    held.push(res)
    return
  }
  res.write(chunk({ reasoning_content: 'They want a greeting.' }))
  for (const piece of ANSWER.match(/[\s\S]{1,7}/g) ?? []) res.write(chunk({ content: piece }))
  res.write(
    `data: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 11, completion_tokens: 22 } })}\n\n`,
  )
  res.end('data: [DONE]\n\n')
}

const event = (type: string, data: object): string =>
  `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`

function anthropicAnswer(res: ServerResponse): void {
  res.writeHead(200, { 'content-type': 'text/event-stream' })
  res.write(
    event('message_start', {
      message: {
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: 'claude-test',
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 5, output_tokens: 1 },
      },
    }),
  )
  res.write(event('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }))
  res.write(
    event('content_block_delta', { index: 0, delta: { type: 'text_delta', text: 'Bonjour.' } }),
  )
  res.write(event('content_block_stop', { index: 0 }))
  res.write(
    event('message_delta', {
      delta: { stop_reason: 'end_turn', stop_sequence: null },
      usage: { output_tokens: 3 },
    }),
  )
  res.end(event('message_stop', {}))
}

/** What each provider's model list answers; `/many` has more than a screen holds (Gemini lists about a hundred). */
const MODEL_LISTS: Record<string, string[]> = {
  '/v1/models': ['tiny', 'slow'],
  '/many/v1/models': Array.from({ length: 150 }, (_, i) => `models/number-${i}`),
}

test.beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = ''
    req.on('data', (piece) => {
      raw += piece
    })
    req.on('end', () => {
      const entry: Seen = {
        path: req.url ?? '',
        headers: req.headers,
        body: raw === '' ? null : JSON.parse(raw),
      }
      seen.push(entry)
      const listed = MODEL_LISTS[entry.path]
      if (listed !== undefined) {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ data: listed.map((id) => ({ id })) }))
      } else if (entry.path === '/v1/chat/completions') {
        openaiAnswer(entry, res)
      } else if (entry.path === '/claude/v1/messages') {
        anthropicAnswer(res)
      } else {
        res.writeHead(404, { 'content-type': 'application/json' }).end('{}')
      }
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

test.afterAll(async () => {
  for (const res of held) res.destroy()
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
})

test.beforeEach(() => {
  seen.length = 0
})

const pane = (page: Page) => page.locator('[data-testid=pane][data-widget=aichat]')
const active = (page: Page) => page.evaluate(() => window.elecdex.ai.active())
const single = (state?: Record<string, unknown>) => ({
  version: 1,
  root: { kind: 'pane', id: 'p', widget: 'aichat', ...(state ? { state } : {}) },
})
const withProviders = () => ({
  sound: { enabled: false },
  ai: {
    systemPrompt: 'Answer briefly.',
    providers: [
      { id: 'local', name: 'Local', kind: 'openai', baseUrl: `${origin}/v1`, model: 'tiny' },
      {
        id: 'claude',
        name: 'Claude',
        kind: 'anthropic',
        baseUrl: `${origin}/claude`,
        model: 'claude-test',
      },
    ],
  },
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
  await page.waitForTimeout(250)
  await page.mouse.up()
}

async function say(page: Page, text: string): Promise<void> {
  await pane(page).getByTestId('aichat-input').fill(text)
  await pane(page).getByTestId('aichat-input').press('Enter')
}

test('with no provider the pane asks for one, and nothing is touched', async () => {
  const { page, userData, close } = await launch(undefined, { layout: single() })
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
  const { page, userData, close } = await launch(undefined, { layout: single() })
  try {
    await pane(page).getByTestId('aichat-open-settings').click()
    await page.getByTestId('ai-preset').selectOption('custom')
    await page.getByTestId('ai-add').click()
    const provider = page.locator('[data-testid=ai-provider][data-provider=custom]')
    await provider.getByTestId('ai-address').fill(`${origin}/v1`)
    await provider.getByTestId('ai-address').press('Tab')

    // What main will not keep is said, not swallowed: it would look saved and fail at "test".
    await provider.getByTestId('ai-key').fill('x'.repeat(600))
    await provider.getByTestId('ai-key-save').click()
    await expect(provider.getByTestId('ai-key-refused')).toContainText('not kept')
    await expect(provider.getByTestId('ai-key-state')).toHaveCount(0)

    await provider.getByTestId('ai-key').fill('sk-e2e-secret')
    await provider.getByTestId('ai-key-save').click()
    await expect(provider.getByTestId('ai-key-refused')).toHaveCount(0)
    await expect(provider.getByTestId('ai-key-state')).toContainText('key held')
    // The field is emptied the moment the key is handed over.
    await expect(provider.getByTestId('ai-key')).toHaveValue('')

    await provider.getByTestId('ai-test').click()
    await expect(provider.getByTestId('ai-test-result')).toHaveText('ok · 2 models')
    expect(seen.at(-1)?.headers.authorization).toBe('Bearer sk-e2e-secret')

    // Nowhere the page can read, and not in the file people copy around.
    const status = await page.evaluate(() => window.elecdex.ai.providers())
    expect(status).toEqual([{ id: 'custom', key: 'stored' }])
    expect(await page.content()).not.toContain('sk-e2e-secret')
    expect(readFileSync(path.join(userData, 'settings.json'), 'utf8')).not.toContain('sk-e2e')
    expect(readFileSync(path.join(userData, 'ai-keys.json'), 'utf8')).not.toContain('sk-e2e')

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

test('a key typed and not saved is the key "test" uses, and a hosted service asked without one says so', async () => {
  const settings = withProviders()
  const { page, close } = await launch(undefined, {
    layout: single(),
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
  const launched = await launch(undefined, { layout: single(), settings: withProviders() })
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

test('a conversation past the window of its model stays whole, and is sent from where it fits', async () => {
  const settings = withProviders()
  const launched = await launch(undefined, {
    layout: single(),
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

test('with summaries on, what stays behind is summarised once and sent along from then on', async () => {
  const settings = withProviders()
  const launched = await launch(undefined, {
    layout: single(),
    settings: {
      ...settings,
      ai: {
        ...settings.ai,
        compact: true,
        // 3072 tokens may go, 600 of them kept for the summary; a cut leaves 2048.
        providers: settings.ai.providers.map((p) =>
          p.id === 'local' ? { ...p, contextTokens: 4096 } : p,
        ),
      },
    },
  })
  try {
    const { page } = launched
    // About seven hundred tokens a question.
    const long = (n: number): string => `Question ${n}: ${'word '.repeat(556)}`.trim()
    const answers = pane(page).locator('[data-testid=aichat-message][data-role=assistant]')
    for (const n of [1, 2, 3, 4, 5]) {
      await say(page, long(n))
      await expect(answers).toHaveCount(n)
      await expect(answers.nth(n - 1)).toContainText('That is all.')
    }
    const asked = seen.filter((entry) => entry.path === '/v1/chat/completions')
    const compactions = asked.filter((e) => e.body?.messages?.[0]?.content.startsWith('You are'))
    // One summary, at the fourth question - of the first two, which is what stayed behind.
    expect(compactions).toHaveLength(1)
    expect(asked.indexOf(compactions[0] as Seen)).toBe(3)
    expect(compactions[0]?.body?.messages?.[1]?.content).toContain('User: Question 1:')
    expect(compactions[0]?.body?.messages?.[1]?.content).toContain('User: Question 2:')
    expect(compactions[0]?.body?.messages?.[1]?.content).not.toContain('Question 3:')

    for (const entry of asked.slice(4)) {
      expect(entry.body?.messages?.[0]?.content).toBe(
        'Answer briefly.\n\nSummary of the earlier part of this conversation, which you no longer see in full:\nThey asked two long questions.',
      )
      expect(entry.body?.messages?.[1]?.content).toBe(long(3))
    }
    expect(asked).toHaveLength(6)

    // The log says so where it happened, and what the model is told can be read there.
    const cut = pane(page).getByTestId('aichat-cut')
    await expect(cut).toHaveText(/summarised · 4 above/i)
    await cut.click()
    await expect(pane(page).getByTestId('aichat-summary')).toContainText(
      'They asked two long questions.',
    )
    await expect(pane(page).getByTestId('aichat-message')).toHaveCount(10)
  } finally {
    await launched.close()
  }
})

test("a provider's window goes by its address until a figure is typed", async () => {
  const { page, userData, close } = await launch(undefined, { layout: single() })
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
  const { page, userData, close } = await launch(undefined, { layout: single() })
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

test('an answer can be stopped, and what was written is kept', async () => {
  const { page, close } = await launch(undefined, {
    layout: single({ provider: 'local', model: 'slow' }),
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
  const { page, close } = await launch(undefined, {
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
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 700)))

    await page.reload()
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
    await expect(pane(page).getByTestId('aichat-run')).toContainText('The first half')
    expect(await active(page)).toHaveLength(1)

    // The model goes on, and the reloaded page follows it from where it was.
    held.at(-1)?.write(chunk({ content: ' and the second.' }))
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

test('the Anthropic dialect sends its key as x-api-key', async () => {
  const { page, close } = await launch(undefined, {
    layout: single({ provider: 'claude' }),
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

test('a key is refused for an address it would cross the internet to in the clear', async () => {
  const settings = withProviders()
  const first = settings.ai.providers[0]
  if (first) first.baseUrl = 'http://llm.example.test/v1'
  const { page, close } = await launch(undefined, { layout: single(), settings })
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
