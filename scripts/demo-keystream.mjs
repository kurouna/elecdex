/**
 * KEYSTREAM, the sample plugin, for a video: its menu heard, a track played through while the
 * instrument changes under it, and the result.
 *
 * The take:
 *   MENU    the pane takes the keys; the cursor goes round the genre tabs and rests on a few
 *           tracks, each heard as the menu previews it (`--previews`, ids from songs/)
 *   CHOOSE  the track to play (`--song`) on its tab, its instrument picked on the menu (the
 *           first of `--instruments`), its levels opened and one chosen (`--level`)
 *   PLAY    every note typed on time, the instrument changing every few bars through the rest
 *           of `--instruments` (the number row's keys: 1 E.PIANO, 2 PIANO, 3 GUITAR, 4 SYNTH LEAD,
 *           5 CHIP, 6 ORGAN, 7 MARIMBA, 8 E.BASS, 9 PAD, 0 PLUCK, - SYNTH BASS)
 *   RESULT  the score counted up and the rank, left on screen (`--result` seconds)
 *
 * How the notes are typed on time: the plugin's guide melody (a setting) sends the player's
 * notes to the host a few seconds ahead, each with the moment it is heard. The page catches
 * those messages from the worker before the host does, drops them - so the guide is never
 * heard - and presses each note's key at its moment, a few milliseconds either way
 * (`--jitter`) as a hand would. The keys go through the pane as typed ones do, so the host
 * plays them and the game judges them. The track itself is read here, from the plugin's own
 * files, for the menu's route and the bars where the instrument changes.
 *
 * The window is 1280x720, a 16:9 frame, holding the one pane; record the window, and leave it
 * in front: the game pauses when the window loses the keyboard. Nothing of this machine is
 * shown (the profile is new, the plugin copied into it from examples/). The take starts after
 * the lead (`--lead`, 6 s); close the window to end, or pass `--exit` to close it when the take
 * is over. Windows only, like the other takes. Run `npm run build` first, then
 * `npm run demo:keystream`. demo-take.mjs has the other options: `--probe`, `--theme`,
 * `--pace`, `--shots=<dir>` to look the take over; `--volume` is the plugin's (80), `--jitter` how
 * far from each note a key may land (8 ms; HARD counts 30 as SYNC).
 */
import { cpSync } from 'node:fs'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1280, height: 720, zoom: 1, lead: 6 })
const option = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const exit = process.argv.includes('--exit')
const SONG = option('song') ?? 'turkish-march'
const LEVEL = option('level') ?? 'hard'
const PREVIEWS = (option('previews') ?? 'sakura-signal,zero-gravity,pixel-rush').split(',')
const INSTRUMENT_KEYS = (option('instruments') ?? '2,3,5,6,7,4,2').split(',')
const LISTEN_S = Number(option('listen') ?? 6)
const RESULT_S = Number(option('result') ?? 10)
const JITTER_MS = Number(option('jitter') ?? 8)
/** The plugin's volume setting: the guide's notes are told apart by their level, a share of it. */
const VOLUME = Number(option('volume') ?? 80)

/*
 * The plugin's own modules, read as Node reads TypeScript (its syntax is erasable only): the
 * imports name no extension, as the worker's resolution allows, so one is tried.
 */
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context)
    } catch (error) {
      if (!specifier.startsWith('.')) throw error
      return next(`${specifier}.ts`, context)
    }
  },
})
const PLUGIN = path.resolve('examples/plugins/keystream')
const load = (file) => import(pathToFileURL(path.join(PLUGIN, file)).href)
const { SONGS } = await load('songs/index.ts')
const { readSong } = await load('notation.ts')
const { barTimes, buildChart, LEVELS } = await load('chart.ts')
const { onShelf, settle, SHELVES, stepShelf } = await load('genres.ts')
const { INSTRUMENTS } = await load('instruments.ts')
const { NOTE_KEYS } = await load('keyboard.ts')

/** The tracks as the menu lists them: the ones that read without a problem, in order. */
const scores = SONGS.map(readSong).filter((score) => score.problems.length === 0)
const placeOf = (id) => {
  const at = scores.findIndex((score) => score.source.id === id)
  if (at < 0) throw new Error(`no track "${id}": ${scores.map((s) => s.source.id).join(', ')}`)
  return at
}
if (!LEVELS.includes(LEVEL)) throw new Error(`--level is one of ${LEVELS.join(', ')}`)
const instrumentCode = (key) => {
  const found = INSTRUMENTS.find((i) => i.key === key)
  if (found === undefined) throw new Error(`no instrument on key "${key}"`)
  return found.code
}
const [firstInstrument, ...changes] = INSTRUMENT_KEYS.map(instrumentCode)

/**
 * Where the instrument changes, in song time: at bars spread evenly over the melody, a moment
 * before the first note of each, so the new sound starts a phrase.
 */
function changesOf(chart, codes) {
  const notes = chart.notes
  const first = notes[0]?.time ?? 0
  const last = notes.at(-1)?.time ?? first
  const bars = barTimes(chart)
  return codes.map((code, i) => {
    const aim = first + ((last - first) * (i + 1)) / (codes.length + 1)
    const bar = bars.reduce((best, time) =>
      Math.abs(time - aim) < Math.abs(best - aim) ? time : best,
    )
    const next = notes.findIndex((note) => note.time >= bar - 1)
    const before = notes[next - 1]?.time ?? Number.NEGATIVE_INFINITY
    const at = Math.max(before + 60, (notes[next]?.time ?? bar) - 350)
    return { at, code }
  })
}

const chart = buildChart(scores[placeOf(SONG)], LEVEL)
const plan = {
  // As the game works it out (schedule.ts: 0.16 of the volume), to the same bits.
  guideLevel: 0.16 * Math.min(1, Math.max(0, VOLUME / 100)),
  firstNote: chart.notes[0]?.time ?? 0,
  end: chart.duration,
  changes: changesOf(chart, changes),
  jitter: JITTER_MS,
}

/** Pitch to key, as the keyboard plays them. */
const KEYS = Object.fromEntries(NOTE_KEYS.map((k) => [k.pitch, { code: k.code, key: k.char }]))

/**
 * In the page, before the plugin's worker is made: the worker's messages pass through here on
 * their way to the host. While armed, the guide's notes are taken out of a sound message and
 * their keys pressed at their moments; the first of them tells when the song began, and the
 * instrument changes are timed from it. Everything else goes through untouched.
 */
function autoplay(keys) {
  const demo = { armed: false, plan: null, start: null, pressed: 0, done: false }
  window.__keystreamDemo = demo
  const now = () => performance.timeOrigin + performance.now()
  let seed = 7
  const jitter = () => {
    seed = (seed * 16807) % 2147483647
    return ((seed / 2147483647) * 2 - 1) * demo.plan.jitter
  }
  const send = (type, code, key) => {
    const pane = document.querySelector('[data-testid=plugin-pane][data-plugin=keystream]')
    pane?.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true, cancelable: true }))
  }
  const tap = (code, key, hold) => {
    send('keydown', code, key)
    setTimeout(() => send('keyup', code, key), hold)
  }
  // A timer lands a few milliseconds late, always late, and the result would then advise an
  // offset: it wakes a little early and waits out the rest.
  const at = (moment, fn) =>
    setTimeout(
      () => {
        while (now() < moment) {}
        fn()
      },
      Math.max(0, moment - now() - 6),
    )
  const started = (start) => {
    demo.start = start
    for (const change of demo.plan.changes) at(start + change.at, () => tap(change.code, '', 60))
    at(start + demo.plan.end + 400, () => {
      demo.armed = false
      demo.done = true
    })
  }
  const isGuide = (note) =>
    note !== null &&
    typeof note === 'object' &&
    !('pan' in note) &&
    typeof note.pitch === 'number' &&
    typeof note.level === 'number' &&
    Math.abs(note.level - demo.plan.guideLevel) < 1e-9
  const filter = (event) => {
    const data = event.data
    if (!demo.armed || data?.t !== 'sound' || !Array.isArray(data.notes)) return event
    const guide = data.notes.filter(isGuide)
    if (guide.length === 0) return event
    if (demo.start === null) started(guide[0].at - demo.plan.firstNote)
    for (const note of guide) {
      const key = keys[note.pitch]
      if (key === undefined) continue
      at(note.at + jitter(), () => {
        tap(key.code, key.key, Math.min(70, note.length * 0.5))
        demo.pressed += 1
      })
    }
    return { data: { ...data, notes: data.notes.filter((note) => !isGuide(note)) } }
  }
  let proto = Worker.prototype
  let native = Object.getOwnPropertyDescriptor(proto, 'onmessage')
  while (native === undefined && proto !== null) {
    proto = Object.getPrototypeOf(proto)
    native = proto === null ? undefined : Object.getOwnPropertyDescriptor(proto, 'onmessage')
  }
  Object.defineProperty(Worker.prototype, 'onmessage', {
    configurable: true,
    enumerable: true,
    get() {
      return native.get.call(this)
    },
    set(handler) {
      native.set.call(
        this,
        typeof handler === 'function' ? (event) => handler(filter(event)) : handler,
      )
    },
  })
}

const tree = {
  version: 1,
  root: {
    kind: 'pane',
    id: 'p-keystream',
    widget: 'plugin:keystream',
    // A first start: every track, the list's first, NORMAL, E.PIANO.
    state: { plugin: { shelf: 'all', level: 'normal', speed: 5, instrument: 'epiano' } },
  },
}

const { standIn } = await prepareData()
const { app, page, wait, settled, run } = await openTake({
  items: [{ id: 'keystream', name: 'keystream', tree }],
  options,
  standIn,
  settings: {
    plugins: {
      keystream: {
        enabled: true,
        key: 'keystream',
        granted: { keys: true, sound: true },
        values: { volume: VOLUME, guide: true, offset: 0 },
      },
    },
  },
  prepare: (profile) =>
    cpSync(PLUGIN, path.join(profile, 'plugins', 'keystream'), { recursive: true }),
})

// The worker's messages are caught from its first: the page is loaded again with the catch in.
await app.context().addInitScript(autoplay, KEYS)
await page.reload()
const pane = page.locator('[data-testid=plugin-pane][data-plugin=keystream]')
await page
  .locator('[data-testid=plugin-pane][data-plugin=keystream][data-status=ready]')
  .waitFor({ timeout: 20_000 })

/** Where the menu stands, followed as the game moves it (genres.ts: the same decisions). */
const menu = { shelf: 'all', selected: 0 }
const rowsOf = (shelf) => [
  ...onShelf(
    scores.map((s) => s.source.genre),
    shelf,
  ),
  scores.length,
]

const key = async (code, pause = 0) => {
  await page.keyboard.press(code)
  if (pause > 0) await wait(pause)
}

/** The tab a track is filed under, taken the short way round. */
async function toShelf(shelf) {
  const from = SHELVES.indexOf(menu.shelf)
  const steps = (SHELVES.indexOf(shelf) - from + SHELVES.length) % SHELVES.length
  const by = steps <= SHELVES.length / 2 ? 1 : -1
  for (let i = 0; i < (by === 1 ? steps : SHELVES.length - steps); i++) {
    await key(by === 1 ? 'ArrowRight' : 'ArrowLeft', 420)
    menu.shelf = stepShelf(menu.shelf, by)
    menu.selected = settle(rowsOf(menu.shelf), menu.selected)
  }
}

/** Down or up the tab to a track, the short way round, the cursor sweeping past the rows. */
async function toTrack(id) {
  const place = placeOf(id)
  await toShelf(scores[place].source.genre)
  const rows = rowsOf(menu.shelf)
  const down = (rows.indexOf(place) - rows.indexOf(menu.selected) + rows.length) % rows.length
  const up = rows.length - down
  for (let i = 0; i < Math.min(down, up); i++) await key(down <= up ? 'ArrowDown' : 'ArrowUp', 170)
  menu.selected = place
}

async function browse() {
  say('menu: the pane takes the keys')
  await pane.getByTestId('plugin-canvas').click({ delay: 20 })
  await wait(2500)
  for (const id of PREVIEWS) {
    say(`menu: ${id}`)
    await toTrack(id)
    await wait(LISTEN_S * 1000)
  }
}

async function choose() {
  say(`menu: ${SONG}, ${LEVEL}`)
  await toTrack(SONG)
  await wait(1800)
  // The instrument it starts on: the menu plays it as a chord, and the preview goes on in it.
  await key(firstInstrument, 2600)
  await key('Enter', 1100)
  const steps = LEVELS.indexOf(LEVEL) - LEVELS.indexOf('normal')
  for (let i = 0; i < Math.abs(steps); i++) await key(steps > 0 ? 'ArrowDown' : 'ArrowUp', 600)
  await wait(900)
  await page.evaluate((p) => Object.assign(window.__keystreamDemo, { plan: p, armed: true }), plan)
  await key('Enter')
}

await run(async () => {
  await settled()
  const started = Date.now()
  await browse()
  await choose()
  say(`play: ${SONG} (${chart.notes.length} notes, ${(chart.duration / 1000).toFixed(0)} s)`)
  await page.waitForFunction(() => window.__keystreamDemo.done, null, {
    timeout: chart.duration + 30_000,
    polling: 500,
  })
  const pressed = await page.evaluate(() => window.__keystreamDemo.pressed)
  say(`result: ${pressed} of ${chart.notes.length} notes typed`)
  await wait(RESULT_S * 1000)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
