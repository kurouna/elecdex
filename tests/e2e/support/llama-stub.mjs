// A stand-in for llama.cpp's llama-server in the e2e tests (docs/translate.md §11). Main starts it
// as it would the real one: with node (ELECTRON_RUN_AS_NODE), the server's own arguments and the
// key in LLAMA_API_KEY. It loads nothing and never leaves 127.0.0.1. A translation is made up
// from the input, so a spec can tell what came back for what it sent: `[lang] text`, then the
// glossary terms the prompt carried (` {pane=ペイン}`) and ` {ctx}` when it carried a context.
//
// ELECDEX_LLAMA_STUB_MODE=demo (the README's shot): the made-up release notes of DEMO in real
// Japanese, and their round trips back into English, a little reworded.
// ELECDEX_LLAMA_STUB_MODE: slow-boot (503 for 1.5 s), silent-boot (writes only /health request
// lines and never becomes ready), crash-mid (ends while writing), no-stop (the stream ends with no
// stop chunk), limit (stop_type limit), wedge-once (the first /completion of a test is taken and
// never answered, as a server wedged in its GPU is: alive, /health 200, nothing more; the server
// main starts after it answers. ELECDEX_LLAMA_STUB_FLAG names the file that says it happened).
import { existsSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'

const args = process.argv.slice(2)
const arg = (name) => {
  const at = args.indexOf(name)
  return at >= 0 ? args[at + 1] : undefined
}
const port = Number(arg('--port'))
const model = arg('-m') ?? 'model.gguf'
const key = process.env.LLAMA_API_KEY ?? ''
const mode = process.env.ELECDEX_LLAMA_STUB_MODE ?? ''
const started = Date.now()

const ready = () => mode !== 'silent-boot' && (mode !== 'slow-boot' || Date.now() - started > 1500)

/** The last input of a PFML3 prompt, and the language asked for. */
function lastInput(prompt) {
  const inputs = prompt.split('<|plamo:tag|>input')
  const last = inputs[inputs.length - 1] ?? ''
  const text = last.split('<|plamo:msg|>')[1]?.split('<|plamo:tag|>')[0] ?? ''
  const lang = /output<\|plamo:key\|>lang<\|plamo:val\|>([^<]+)/.exec(last)?.[1] ?? 'ja'
  return { text, lang }
}

/** The glossary's terms in the prompt, as `source=target`, and whether a context came. */
function extras(prompt) {
  const glossary = prompt.split('<|plamo:tag|>glossary')[1]?.split('<|plamo:tag|>')[0] ?? ''
  const terms = [...glossary.matchAll(/<\|plamo:index\|>([^<]*)<\|plamo:item\|>([^<]*)/g)].map(
    (m) => `${m[1]}=${m[2]}`,
  )
  const context = prompt.includes('<|plamo:tag|>context<|plamo:msg|>')
  return `${terms.length ? ` {${terms.join(',')}}` : ''}${context ? ' {ctx}' : ''}`
}

/** The demo's sentences and what they come back as: made up, for the screenshots only. */
const DEMO = {
  'Release notes': 'リリースノート',
  'The metrics collector now runs in its own process, so a slow disk never holds up the window.':
    'メトリクスの収集は独立したプロセスで動くようになり、ディスクが遅くてもウィンドウが止まらなくなりました。',
  'Panes behind a tab stop reading what they do not chart, and take it up again as soon as they are shown.':
    'タブの裏にあるペインは、グラフにしないものを読むのをやめ、表示されるとすぐに読み直します。',
  'Translation runs on this PC: nothing you translate leaves this machine.':
    '翻訳はこの PC で動きます。訳した文がこのマシンの外に出ることはありません。',
  リリースノート: 'Release notes',
  'メトリクスの収集は独立したプロセスで動くようになり、ディスクが遅くてもウィンドウが止まらなくなりました。':
    'Metrics collection now runs in a separate process, so a slow disk no longer stops the window.',
  'タブの裏にあるペインは、グラフにしないものを読むのをやめ、表示されるとすぐに読み直します。':
    'Panes behind a tab stop reading what they do not graph, and read it again as soon as they are shown.',
  '翻訳はこの PC で動きます。訳した文がこのマシンの外に出ることはありません。':
    'Translation runs on this PC: text you translate never leaves this machine.',
}

function translate(prompt) {
  const { text, lang } = lastInput(prompt)
  if (mode === 'demo' && DEMO[text]) return DEMO[text]
  if (text === 'Good morning.') return lang === 'ja' ? 'おはようございます。' : 'Good morning.'
  return `[${lang}] ${text}${extras(prompt)}`
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

const server = createServer((req, res) => {
  if (req.url === '/health') {
    if (mode === 'silent-boot')
      process.stderr.write('srv  log_server_r: request: GET /health 127.0.0.1 503\n')
    send(
      res,
      ready() ? 200 : 503,
      ready() ? { status: 'ok' } : { error: { message: 'Loading model' } },
    )
    return
  }
  if (key && req.headers.authorization !== `Bearer ${key}`) {
    send(res, 401, { error: { message: 'Invalid API Key' } })
    return
  }
  if (req.url === '/props') {
    send(res, 200, { model_path: model, total_slots: 1 })
    return
  }
  let raw = ''
  req.on('data', (chunk) => {
    raw += chunk
  })
  req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {}
    if (req.url === '/tokenize') {
      const content = String(body.content ?? '')
      send(res, 200, { tokens: Array.from({ length: Math.ceil(content.length / 3) }, (_, i) => i) })
      return
    }
    if (req.url !== '/completion') {
      send(res, 404, { error: { message: 'not here' } })
      return
    }
    const flag = process.env.ELECDEX_LLAMA_STUB_FLAG
    if (mode === 'wedge-once' && flag && !existsSync(flag)) {
      writeFileSync(flag, String(process.pid))
      // Taken, never answered: the socket stays open until main gives up on it.
      return
    }
    const out = translate(String(body.prompt ?? ''))
    const timings = { predicted_per_second: 88, predicted_ms: 120 }
    if (!body.stream) {
      send(res, 200, {
        content: out,
        stop: true,
        stop_type: 'eos',
        tokens_predicted: out.length,
        timings,
      })
      return
    }
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    const pieces = out.match(/.{1,3}/gsu) ?? []
    let at = 0
    const timer = setInterval(() => {
      if (mode === 'crash-mid' && at === 2) process.exit(139)
      if (at < pieces.length) {
        res.write(`data: ${JSON.stringify({ content: pieces[at], stop: false })}\n\n`)
        at++
        return
      }
      clearInterval(timer)
      if (mode !== 'no-stop') {
        const stopType = mode === 'limit' ? 'limit' : 'eos'
        res.write(
          `data: ${JSON.stringify({ content: '', stop: true, stop_type: stopType, tokens_predicted: pieces.length, timings })}\n\n`,
        )
      }
      res.end()
    }, 15)
    // The response's close: the request's comes as soon as its body has been read.
    res.on('close', () => clearInterval(timer))
  })
})

server.listen(port, '127.0.0.1', () => {
  process.stderr.write(`srv    load_model: loading model '${model}'\n`)
  if (ready()) process.stderr.write(`srv  server_on_li: listening on http://127.0.0.1:${port}\n`)
})
