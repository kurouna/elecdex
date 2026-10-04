import { readFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { expect, type Page, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The ELEC-16's LINK (docs/elec16.md section 12) in the running app: off until TUNE turns it
 * on, a BASIC ASK put to the provider chosen there - a local stand-in speaking the OpenAI
 * dialect - and its answer on the LCD; BRK letting go of a question still out, which main
 * then stops asking; and a provider's refusal said in TUNE in its own words.
 */

interface Seen {
  model: string
  system: string
  user: string
  maxTokens: number | undefined
  search: boolean
}

let server: Server
let origin: string
const seen: Seen[] = []
/** Requests held open (model `slow`), and whether each was closed by the asker. */
const held: { res: ServerResponse; closed: boolean }[] = []

const chunk = (content: string): string =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`

function answer(req: IncomingMessage, res: ServerResponse, raw: string): void {
  const body = JSON.parse(raw) as {
    model: string
    max_tokens?: number
    web_search_options?: object
    messages: { role: string; content: string }[]
  }
  seen.push({
    model: body.model,
    system: body.messages.find((m) => m.role === 'system')?.content ?? '',
    user: body.messages.filter((m) => m.role === 'user').at(-1)?.content ?? '',
    maxTokens: body.max_tokens,
    search: body.web_search_options !== undefined,
  })
  if (body.model === 'refuses') {
    res.writeHead(401, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: { message: 'invalid api key' } }))
    return
  }
  res.writeHead(200, { 'content-type': 'text/event-stream' })
  if (body.model === 'slow') {
    const entry = { res, closed: false }
    req.on('close', () => {
      entry.closed = true
    })
    held.push(entry)
    return
  }
  res.write(chunk('A **pulsar** is a\nspinning star. '))
  res.write(chunk('It blinks.'))
  res.end('data: [DONE]\n\n')
}

test.beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = ''
    req.on('data', (piece) => {
      raw += piece
    })
    req.on('end', () => {
      if (req.url !== '/v1/chat/completions') {
        res.writeHead(404, { 'content-type': 'application/json' }).end('{}')
        return
      }
      answer(req, res, raw)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

test.afterAll(async () => {
  for (const h of held) h.res.destroy()
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
})

test.beforeEach(() => {
  seen.length = 0
})

const LAYOUT = {
  version: 1,
  root: { kind: 'pane', id: 'e16', widget: 'elec16', state: { panel: true, tab: 'tune' } },
}

const settingsWith = (model: string, link: object) => ({
  sound: { enabled: false },
  ai: {
    providers: [
      { id: 'local', name: 'Local', kind: 'openai', baseUrl: `${origin}/v1`, model },
      { id: 'other', name: 'Other', kind: 'openai', baseUrl: `${origin}/v1`, model: 'refuses' },
    ],
  },
  elec16: { volume: 0.5, skin: 'elec', link },
})

const lcdLines = async (page: Page): Promise<string[]> =>
  ((await page.getByTestId('elec16-text').textContent()) ?? '').split('\n').map((l) => l.trimEnd())

async function booted(page: Page): Promise<void> {
  await expect.poll(() => lcdLines(page), { timeout: 15_000 }).toContain('ELEC-16 BASIC 1.0')
  await expect(page.getByTestId('elec16')).toHaveAttribute('data-asleep', 'true')
}

async function typeLine(page: Page, line: string): Promise<void> {
  await page.getByTestId('elec16').focus()
  await page.keyboard.type(line, { delay: 15 })
  await page.keyboard.press('Enter')
}

const linkMark = (page: Page) => page.locator('[data-mark=LINK]')

test('ASK is refused while LINK is off; on in TUNE, the answer comes back to the LCD', async () => {
  const { page, userData, close } = await launch(undefined, {
    layout: LAYOUT,
    settings: settingsWith('m1', { on: false, ai: { provider: '' } }),
  })
  try {
    await booted(page)
    await expect(linkMark(page)).not.toHaveClass(/\bon\b/)
    await typeLine(page, 'DIM A$*60')
    await typeLine(page, 'ASK "WHAT IS A PULSAR?",A$')
    await expect.poll(() => lcdLines(page)).toContain('ERR:LINK OFF')
    expect(seen).toHaveLength(0)

    const link = page.getByTestId('elec16-link')
    await link.locator('[data-testid=elec16-link-on][data-on=true]').click()
    await link.locator('[data-testid=elec16-link-provider][data-provider=local]').click()
    // Neither provider holds a key here: both may be chosen, and say so.
    await expect(link.locator('[data-provider=local]')).toContainText('no key')
    const settings = () =>
      JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8')).elec16.link
    await expect.poll(settings).toEqual({ on: true, ai: { provider: 'local' } })
    await expect(linkMark(page)).toHaveClass(/\bon\b/)

    await typeLine(page, 'ASK "WHAT IS A PULSAR?",A$')
    await typeLine(page, 'PRINT A$')
    await expect
      .poll(async () => (await lcdLines(page)).join(' '))
      .toContain('A pulsar is a spinning star. It blinks.')
    expect(seen).toHaveLength(1)
    expect(seen[0]?.user).toBe('WHAT IS A PULSAR?')
    expect(seen[0]?.system).toContain('within 60 characters')
    expect(seen[0]?.maxTokens).toBeLessThanOrEqual(1000)
    expect(seen[0]?.search).toBe(false)
    await expect(page.getByTestId('elec16-link-sent')).toHaveText('1 sent.')
  } finally {
    await close()
  }
})

test('WEATHER asks the provider to search; BRK lets go of a question still out', async () => {
  const { page, close } = await launch(undefined, {
    layout: LAYOUT,
    settings: settingsWith('slow', { on: true, ai: { provider: 'local' } }),
  })
  try {
    await booted(page)
    await typeLine(page, 'ASK TYPE "WEATHER"')
    await typeLine(page, 'ASK "TOKYO",A$')
    await expect.poll(() => seen.length).toBe(1)
    expect(seen[0]?.search).toBe(true)
    expect(seen[0]?.system).toContain('weather forecast')
    // Waiting: LINK's mark blinks on and off with the shared pulse.
    await expect(linkMark(page)).toHaveClass(/\bon\b/)
    await expect(linkMark(page)).not.toHaveClass(/\bon\b/)
    await page.keyboard.press('Pause')
    await expect.poll(() => lcdLines(page)).toContain('BREAK')
    // main stops asking: the request to the provider is closed.
    await expect.poll(() => held.at(-1)?.closed, { timeout: 10_000 }).toBe(true)
  } finally {
    await close()
  }
})

test("a provider's refusal stops the program with ERR:LINK, its words in TUNE", async () => {
  const { page, close } = await launch(undefined, {
    layout: LAYOUT,
    settings: settingsWith('m1', { on: true, ai: { provider: 'other' } }),
  })
  try {
    await booted(page)
    await typeLine(page, 'ASK "HI",A$')
    await expect.poll(() => lcdLines(page)).toContain('ERR:LINK')
    await expect(page.getByTestId('elec16-link-note')).toContainText('invalid api key')
  } finally {
    await close()
  }
})
