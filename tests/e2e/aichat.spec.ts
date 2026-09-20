import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createServer, type IncomingHttpHeaders, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { expect, type Page, test } from '@playwright/test'
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
      if (entry.path === '/v1/models') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ data: [{ id: 'tiny' }, { id: 'slow' }] }))
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

    await provider.getByTestId('ai-key').fill('sk-e2e-secret')
    await provider.getByTestId('ai-key-save').click()
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
