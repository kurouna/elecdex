/**
 * The clipboard pane's snippets, for a short landscape video (X): what is copied again and
 * again kept once, and put back with a click.
 *
 * The take:
 *   KEEP    a command lands in the history and is kept with SNIP (★); so is a reply copied
 *           earlier with its formatting (RICH)
 *   LIST    the switch to SNIPPETS; one more written by hand with + NEW, dragged by its number
 *           to the top; a card with the whole of the rich one
 *   USE     COPY puts a snippet on the clipboard (and not in the history), and it is pasted into
 *           the shell beside and run - twice, two snippets
 *   MASK    the texts hidden at a press, and back
 *
 * Everything shown is made up: the history is the screenshots' (ELECDEX_CLIPBOARD_STUB=demo),
 * the shell runs in the demo repository by a made-up author. The shell's own paste reads the
 * system clipboard, which the stand-in does not reach, so the take types the snippet's text
 * into the shell at once, as a paste lands, rather than pasting this machine's clipboard.
 *
 * The window is 1280x720 at a zoom of 1, a 16:9 frame; record the window. The take starts
 * after the lead (`--lead`, 6 s) and ends by itself; close the window to end, or pass `--exit`
 * to close it when the take is over. Windows only, like the other takes. Run `npm run build`
 * first, then `npm run demo:snippets`. The options are demo-take.mjs's (`takeOptions`):
 * `--pace=0.9` for a quicker take, `--theme`, `--shots=<dir>` to look it over.
 */
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1280, height: 720, zoom: 1, lead: 6 })
const exit = process.argv.includes('--exit')

/** What the take keeps and runs: commands that are safe in the demo repository. */
const LOG = 'git --no-pager log --oneline --graph -8'
const STATUS = 'git status --short --branch'

/** The shell on the left, where the snippets are pasted; the clipboard pane on the right. */
const tree = {
  version: 1,
  root: {
    kind: 'split',
    id: 's-root',
    direction: 'row',
    sizes: [0.56, 0.44],
    children: [
      { kind: 'pane', id: 'p-shell', widget: 'terminal' },
      { kind: 'pane', id: 'p-clip', widget: 'clipboard' },
    ],
  },
}

const { standIn } = await prepareData()
const { app, page, wait, settled, run } = await openTake({
  items: [{ id: 'snippets', name: 'snippets', tree }],
  options,
  standIn,
})

/** A copy made in another application. */
const copy = (text) =>
  app.evaluate((_electron, what) => globalThis.__elecdexClipboard.copy(what), text)

/** Presses a button the way a hand does: held for a moment (CLAUDE.md, test craft). */
const press = (locator) => locator.click({ delay: 20 })
const clip = page.getByTestId('clipboard')
const historyRow = (text) => clip.getByTestId('clip-row').filter({ hasText: text }).first()
const snippetRow = (text) => clip.getByTestId('snip-row').filter({ hasText: text }).first()

/** Types a line into a field as a hand would, a little unevenly. */
async function typeIn(text, delay = 45) {
  await page.keyboard.type(text, { delay })
}

async function keep() {
  say('keep: a command, then a reply with its formatting')
  await page.mouse.move(10, 700)
  await copy(LOG)
  await wait(1100)
  const command = historyRow(LOG)
  await command.hover()
  await wait(500)
  await press(command.getByTestId('clip-snip'))
  await wait(1000)
  const reply = historyRow('Thanks')
  await reply.hover()
  await wait(1300)
  await press(reply.getByTestId('clip-snip'))
  await wait(1100)
}

async function list() {
  say('list: the switch, + NEW, a drag, a card')
  await press(clip.getByTestId('clip-view-snippets'))
  await wait(1200)
  await press(clip.getByTestId('snip-new'))
  await wait(500)
  await clip.getByTestId('snip-editor-name').click()
  await typeIn('status')
  await clip.getByTestId('snip-editor-text').click()
  await typeIn(STATUS, 35)
  await wait(400)
  await page.keyboard.press('Control+Enter')
  await wait(1100)
  // By its slot number, from the bottom to the top.
  const handle = snippetRow(STATUS).getByTestId('snip-handle')
  const top = await clip.getByTestId('snip-row').first().boundingBox()
  const from = await handle.boundingBox()
  if (top === null || from === null) throw new Error('no snippet rows')
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2, { steps: 6 })
  await page.mouse.down()
  await page.mouse.move(from.x + from.width / 2, top.y + top.height * 0.2, { steps: 14 })
  await wait(250)
  await page.mouse.up()
  await wait(1000)
  await snippetRow('Thanks').hover()
  await wait(2400)
  await page.mouse.move(10, 700)
  await wait(400)
}

/** COPY on a snippet, then into the shell beside it, and run. */
async function use(text) {
  const row = snippetRow(text)
  await row.hover()
  await wait(350)
  await press(row.getByTestId('snip-copy'))
  await wait(900)
  await page.locator('[data-testid=pane][data-widget=terminal] .xterm-screen').first().click()
  await wait(300)
  await page.keyboard.insertText(text)
  await wait(600)
  await page.keyboard.press('Enter')
  await wait(1800)
}

async function mask() {
  say('mask')
  await press(clip.getByTestId('clip-mask'))
  await wait(1600)
  await press(clip.getByTestId('clip-mask'))
  await wait(900)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await keep()
  await list()
  say('use: two snippets into the shell')
  await use(LOG)
  await use(STATUS)
  await mask()
  await page.mouse.move(10, 700)
  await wait(1000)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
