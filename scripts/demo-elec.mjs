/**
 * The ELEC system pane, driven for a screen recording: the README's layout in the demo
 * profile (scripts/gen-screenshots.mjs), a motion typed at a person's pace, three units voting
 * through a stand-in served from here (no model, no key), the 2-1 approval held on screen, then
 * "+ new" and the same again - a few takes in one run. Close the window to end it.
 *
 * Windows only, like the screenshots. Run `npm run build` first, then
 * `node scripts/demo-elec.mjs` (`--alone` for the pane by itself, with nothing of the machine
 * in the picture; `--takes=5`, `--lead=20` seconds before the first take).
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron } from '@playwright/test'

const MAIN = path.resolve('out/main/index.js')
const HOME = 'C:\\Users\\Public\\Documents\\elecdex-demo'
const flag = (name, fallback) => {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`))
  return found === undefined ? fallback : Number(found.split('=')[1])
}
const ALONE = process.argv.includes('--alone')
const TAKES = flag('takes', 3)
const LEAD = flag('lead', 25)
const W = 1600
const H = 900

let nextId = 0
const pane = (widget) => ({ kind: 'pane', id: `p${nextId++}`, widget })
const split = (direction, children, sizes) => ({
  kind: 'split',
  id: `s${nextId++}`,
  direction,
  children,
  sizes,
})
const layout = {
  version: 1,
  root: ALONE
    ? pane('elec')
    : split(
        'row',
        [
          split(
            'column',
            ['clock', 'sysinfo', 'cpu', 'memory', 'disk', 'toplist', 'netstat', 'throughput'].map(
              pane,
            ),
            [0.04, 0.125, 0.19, 0.12, 0.116, 0.189, 0.055, 0.165],
          ),
          pane('elec'),
          split(
            'column',
            ['globe', 'markets', 'weather', 'calendar'].map(pane),
            [0.3, 0.25, 0.22, 0.23],
          ),
        ],
        [0.18, 0.64, 0.18],
      ),
}

const MOTION = 'Should we move the team to a four-day working week next quarter?'
const VOTES = {
  'UNIT-1':
    'The trials we have point one way: output per hour rose and costs fell with the office days. The risk is in customer hours, which a rota can cover.\nVERDICT: APPROVE\nCONFIDENCE: 78',
  'UNIT-2':
    'Those on hourly contracts would lose pay unless the change protects them, and **nothing in the motion does**. Fairness first, then the long weekend.\nVERDICT: REJECT\nCONFIDENCE: 64',
  'UNIT-3':
    'People are tired. A long weekend is the kind of promise that makes a team want to stay - it feels right, and it would be felt.\nVERDICT: APPROVE\nCONFIDENCE: 85',
}

/** Answers as a local model would stream them: a pause to think, then a few words at a time. */
const server = createServer((req, res) => {
  let raw = ''
  req.on('data', (piece) => {
    raw += piece
  })
  req.on('end', () => {
    const system = JSON.parse(raw).messages?.[0]?.content ?? ''
    const answer = VOTES[/UNIT-\d/.exec(system)?.[0] ?? 'UNIT-1']
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    const pieces = answer.match(/.{1,8}/gs) ?? []
    const step = () => {
      const piece = pieces.shift()
      if (piece === undefined) {
        const usage = { prompt_tokens: 214, completion_tokens: 71 }
        res.write(`data: ${JSON.stringify({ choices: [], usage })}\n\n`)
        res.end('data: [DONE]\n\n')
        return
      }
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`)
      setTimeout(step, 110)
    }
    setTimeout(step, 900)
  })
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

mkdirSync(HOME, { recursive: true })
const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-demo-'))
writeFileSync(path.join(dir, 'layout.json'), JSON.stringify(layout))
writeFileSync(
  path.join(dir, 'settings.json'),
  JSON.stringify({
    theme: 'tron',
    sound: { enabled: true },
    updates: { check: false },
    launcher: { showSystem: false, items: [] },
    ai: {
      providers: [
        {
          id: 'ollama',
          name: 'Ollama',
          kind: 'openai',
          baseUrl: `http://127.0.0.1:${server.address().port}/v1`,
          model: 'qwen3:14b',
        },
      ],
    },
  }),
)

const app = await electron.launch({
  args: [MAIN, '--windowed', '--no-intro', `--user-data-dir=${dir}`, '--lang=en-US'],
  cwd: HOME,
  env: {
    ...process.env,
    USERPROFILE: HOME,
    HOMEPATH: '\\Users\\Public\\Documents\\elecdex-demo',
    HOME,
  },
})
const page = await app.firstWindow()
await app.evaluate(
  ({ BrowserWindow }, [w, h]) => {
    const win = BrowserWindow.getAllWindows()[0]
    win.setContentSize(w, h)
    win.center()
  },
  [W, H],
)
const closed = new Promise((resolve) => app.on('close', resolve))
const wait = (ms) => Promise.race([page.waitForTimeout(ms).catch(() => {}), closed])
const say = (text) => console.log(`${new Date().toTimeString().slice(0, 8)} ${text}`)

async function take(n) {
  const elec = page.locator('[data-testid=pane][data-widget=elec]')
  const input = elec.getByTestId('elec-input')
  say(`take ${n}: typing the motion`)
  await input.click()
  await page.keyboard.type(MOTION, { delay: 55 })
  await wait(700)
  await page.keyboard.press('Enter')
  say(`take ${n}: submitted`)
  await elec.getByTestId('elec-outcome').waitFor({ timeout: 60_000 })
  say(`take ${n}: resolved - holding 8 s`)
  await wait(8000)
  await elec.getByTestId('elec-new').click()
  say(`take ${n}: back on standby`)
  await wait(6000)
}

say(`window up - the first take starts in ${LEAD} s`)
await wait(LEAD * 1000)
try {
  for (let n = 1; n <= TAKES; n++) await take(n)
  say('done - close the window to end')
  await closed
} catch (error) {
  say(`ended: ${error.message.split('\n')[0]}`)
}
await app.close().catch(() => {})
server.close()
