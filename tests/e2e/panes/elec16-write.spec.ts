import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, type Page } from '@playwright/test'
import { booted, lcdLines } from '../support/elec16.js'
import { test } from '../support/shared.js'
import { launch, single } from '../support.js'

/**
 * CODE's WRITE (docs/elec16-write.md) in the running app, against a local stand-in for a
 * provider speaking the OpenAI dialect: words to a program in the editor that RUN runs, a
 * compile error given back and its fix taken, the question before code of one's own is
 * replaced, a SEND that never builds failing with UNDO to put the code back, STOP letting go of
 * the request in main, and the line saying so when the settings have no provider.
 */

const GOOD = [
  "const W = str('MADE BY AI')",
  'export function main(): void {',
  '  puts(W)',
  '  newline()',
  '}',
].join('\n')
const BAD = 'export function main(): void { putnum(7 / 2) }'

interface Seen {
  model: string
  system: string
  users: string[]
}

let server: Server
let origin: string
const seen: Seen[] = []
const held: { closed: boolean }[] = []
/** Answers held half written (LATER), finished when the test calls them. */
const later: (() => void)[] = []

const chunk = (content: string): string =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`

function answer(req: IncomingMessage, res: ServerResponse, raw: string): void {
  const body = JSON.parse(raw) as { model: string; messages: { role: string; content: string }[] }
  const users = body.messages.filter((m) => m.role === 'user').map((m) => m.content)
  seen.push({
    model: body.model,
    system: body.messages.find((m) => m.role === 'system')?.content ?? '',
    users,
  })
  const first = users[0] ?? ''
  res.writeHead(200, { 'content-type': 'text/event-stream' })
  if (first.includes('SLOW')) {
    const entry = { closed: false }
    req.on('close', () => {
      entry.closed = true
    })
    held.push(entry)
    res.write(chunk('```ts\nexport function main'))
    return
  }
  const fixing = (users.at(-1) ?? '').includes('did not compile')
  const code = first.includes('NEVER') || (first.includes('BROKEN') && !fixing) ? BAD : GOOD
  if (first.includes('LATER')) {
    // The start now, the rest when the test says.
    res.write(chunk(`\`\`\`ts\n${code.slice(0, 20)}`))
    later.push(() => {
      res.write(chunk(`${code.slice(20)}\n\`\`\``))
      res.end('data: [DONE]\n\n')
    })
    return
  }
  // In pieces, as a model writes.
  res.write(chunk('```ts\n'))
  res.write(chunk(code.slice(0, 20)))
  res.write(chunk(`${code.slice(20)}\n\`\`\``))
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
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
})

test.beforeEach(() => {
  seen.length = 0
})

const LAYOUT = single('elec16', { id: 'e16', state: { panel: false } })

const settings = (providers: boolean) => ({
  sound: { enabled: false },
  ai: {
    providers: providers
      ? [{ id: 'local', name: 'Local', kind: 'openai', baseUrl: `${origin}/v1`, model: 'm1' }]
      : [],
  },
})

async function openCode(page: Page): Promise<void> {
  await booted(page)
  await page.getByTestId('elec16-view-toggle').click()
  await expect(page.getByTestId('elec16-source')).toHaveValue(/export function main/)
}

async function send(page: Page, words: string): Promise<void> {
  await page.getByTestId('elec16-write-words').fill(words)
  await page.getByTestId('elec16-write-send').click()
}

const line = (page: Page) => page.getByTestId('elec16-write-line')

test('WRITE writes a program from words over the sample, RUN runs it, and CODE keeps what it did', async () => {
  const { page, close } = await launch(undefined, { layout: LAYOUT, settings: settings(true) })
  try {
    await openCode(page)
    await expect(line(page)).toContainText('to Local · m1')
    await send(page, 'show MADE BY AI')
    await expect(line(page)).toContainText('ready', { timeout: 60_000 })
    await expect(page.getByTestId('elec16-source')).toHaveValue(GOOD)
    expect(seen).toHaveLength(1)
    expect(seen[0]?.model).toBe('m1')
    expect(seen[0]?.system).toMatch(/ELEC-16 POCKET/)
    expect(seen[0]?.users[0]).toContain('show MADE BY AI')
    await expect(page.getByTestId('elec16-write-steps')).toContainText('ready')
    await expect(page.getByTestId('elec16-levels')).toBeVisible()
    await page.getByTestId('elec16-run').click()
    await expect
      .poll(async () => (await lcdLines(page)).join('\n'), { timeout: 15_000 })
      .toMatch(/MADE BY AI/)
    // Back in CODE, what WRITE did is still there: its builds and UNDO.
    await page.getByTestId('elec16-view-toggle').click()
    await expect(page.getByTestId('elec16-source')).toHaveValue(GOOD)
    await expect(page.getByTestId('elec16-write-undo')).toBeVisible()
    await expect(page.getByTestId('elec16-levels')).toBeVisible()
  } finally {
    await close()
  }
})

test('a SEND goes on while the pane shows the machine, and CODE shows what it wrote on return', async () => {
  const { page, close } = await launch(undefined, { layout: LAYOUT, settings: settings(true) })
  try {
    await openCode(page)
    await send(page, 'LATER please')
    await expect(page.getByTestId('elec16-source-writing')).toBeVisible({ timeout: 30_000 })
    await page.getByTestId('elec16-view-toggle').click()
    await expect(page.getByTestId('elec16-code-view')).toHaveCount(0)
    await expect.poll(() => later.length).toBe(1)
    later.shift()?.()
    await expect.poll(() => page.evaluate(() => window.elecdex.elec16.writing())).toEqual([])
    await page.getByTestId('elec16-view-toggle').click()
    await expect(page.getByTestId('elec16-source')).toHaveValue(GOOD, { timeout: 30_000 })
    await expect(line(page)).toContainText('ready')
    await expect(page.getByTestId('elec16-levels')).toBeVisible()
  } finally {
    await close()
  }
})

test('a compile error goes back to the model, and its fix is taken', async () => {
  const { page, close } = await launch(undefined, { layout: LAYOUT, settings: settings(true) })
  try {
    await openCode(page)
    await send(page, 'BROKEN at first')
    await expect(line(page)).toContainText('ready', { timeout: 60_000 })
    await expect(page.getByTestId('elec16-write-result')).toContainText('after 1 fix')
    expect(seen).toHaveLength(2)
    expect(seen[1]?.users.at(-1)).toMatch(
      /did not compile[\s\S]*MAIN\.TS:1:\d+ \/ gives a fraction/,
    )
    await expect(page.getByTestId('elec16-source')).toHaveValue(GOOD)
  } finally {
    await close()
  }
})

test('code of one’s own is asked about first; a SEND that never builds fails after two fixes, and UNDO puts the code back', async () => {
  const { page, close } = await launch(undefined, { layout: LAYOUT, settings: settings(true) })
  try {
    await openCode(page)
    const mine = 'export function main(): void { cls() }'
    await page.getByTestId('elec16-source').fill(mine)
    await send(page, 'NEVER builds')
    await expect(line(page)).toContainText('replace?')
    await expect(page.getByTestId('elec16-write-replace')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(line(page)).not.toContainText('replace?')
    expect(seen).toHaveLength(0)
    await expect(page.getByTestId('elec16-source')).toHaveValue(mine)

    await page.getByTestId('elec16-write-send').click()
    await page.getByTestId('elec16-write-replace').click()
    await expect(line(page)).toContainText('failed', { timeout: 60_000 })
    expect(seen).toHaveLength(3)
    await expect(page.getByTestId('elec16-write-steps')).toContainText('fix 2/2')
    await expect(page.getByTestId('elec16-source')).toHaveValue(BAD)
    await page.getByTestId('elec16-write-undo').click()
    await expect(page.getByTestId('elec16-source')).toHaveValue(mine)
    await expect(line(page)).toContainText('undone')
  } finally {
    await close()
  }
})

test('STOP lets go of the request in main and keeps what came; with no provider the line says so', async () => {
  const withOne = await launch(undefined, { layout: LAYOUT, settings: settings(true) })
  try {
    const { page } = withOne
    await openCode(page)
    await send(page, 'SLOW please')
    await expect(page.getByTestId('elec16-source-writing')).toContainText('export function main', {
      timeout: 30_000,
    })
    await expect.poll(() => page.evaluate(() => window.elecdex.elec16.writing())).toHaveLength(1)
    await page.getByTestId('elec16-write-words').press('Escape')
    await expect(line(page)).toContainText('stopped')
    await expect.poll(() => page.evaluate(() => window.elecdex.elec16.writing())).toEqual([])
    await expect.poll(() => held.at(-1)?.closed).toBe(true)
    await expect(page.getByTestId('elec16-source')).toHaveValue('export function main')
  } finally {
    await withOne.close()
  }
  const none = await launch(undefined, { layout: LAYOUT, settings: settings(false) })
  try {
    await openCode(none.page)
    await expect(line(none.page)).toContainText('No AI provider is set')
    await expect(none.page.getByTestId('elec16-write-words')).toBeDisabled()
  } finally {
    await none.close()
  }
})
