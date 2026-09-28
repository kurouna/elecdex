/**
 * What the takes that play KEYSTREAM share (demo-keystream.mjs, and the tours' beat in
 * demo-beats.mjs): the plugin's own tracks read from its files, the plan of a track typed on
 * time, the catch that types it, and the menu walked the way the game moves it.
 *
 * How the notes are typed on time: the plugin's guide melody (a setting) sends the player's
 * notes to the host a few seconds ahead, each with the moment it is heard. The page catches
 * those messages from the worker before the host does, drops them - so the guide is never
 * heard - and presses each note's key at its moment, a few milliseconds either way (`jitter`)
 * as a hand would. The keys go through the pane as typed ones do, so the host plays them and
 * the game judges them. The catch is laid on `Worker.prototype`, so it takes the workers made
 * after it: the plugin's worker is made when its pane is mounted (and again on a reload).
 */
import { cpSync } from 'node:fs'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/*
 * The plugin's own modules, read as Node reads TypeScript (the syntax is erasable only): the
 * plugin's imports name no extension, as the worker's resolution allows, and the app's name .js
 * for the .ts beside it, as Vite resolves them.
 */
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context)
    } catch (error) {
      if (!specifier.startsWith('.')) throw error
      const stem = specifier.endsWith('.js') ? specifier.slice(0, -3) : specifier
      return next(`${stem}.ts`, context)
    }
  },
})
const PLUGIN = path.resolve('examples/plugins/keystream')
const load = (file) => import(pathToFileURL(path.join(PLUGIN, file)).href)
const { SONGS } = await load('songs/index.ts')
const { readSong } = await load('notation.ts')
const { barTimes, buildChart, LEVELS } = await load('chart.ts')
const { rowsOf, settle, SHELVES, stepShelf } = await load('genres.ts')
const { INSTRUMENTS } = await load('instruments.ts')
const { NOTE_KEYS } = await load('keyboard.ts')

export { LEVELS }

/** The tracks as the menu lists them: the ones that read without a problem, in order. */
const scores = SONGS.map(readSong).filter((score) => score.problems.length === 0)
const placeOf = (id) => {
  const at = scores.findIndex((score) => score.source.id === id)
  if (at < 0) throw new Error(`no track "${id}": ${scores.map((s) => s.source.id).join(', ')}`)
  return at
}

/** An instrument by its key on the number row, as the key's code. */
export function instrumentCode(key) {
  const found = INSTRUMENTS.find((i) => i.key === key)
  if (found === undefined) throw new Error(`no instrument on key "${key}"`)
  return found.code
}

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

/**
 * A track typed on a level: its chart, and the plan the page's catch follows. `changes` are the
 * instrument keys pressed on the way; `volume` is the plugin's setting, by which the guide's
 * notes are told apart (a share of it).
 */
export function trackPlan({ song, level, changes = [], volume, jitter }) {
  if (!LEVELS.includes(level)) throw new Error(`the level is one of ${LEVELS.join(', ')}`)
  const chart = buildChart(scores[placeOf(song)], level)
  return {
    chart,
    plan: {
      // As the game works it out (schedule.ts: 0.16 of the volume), to the same bits.
      guideLevel: 0.16 * Math.min(1, Math.max(0, volume / 100)),
      firstNote: chart.notes[0]?.time ?? 0,
      end: chart.duration,
      changes: changesOf(chart, changes.map(instrumentCode)),
      jitter,
    },
  }
}

/** Pitch to key, as the keyboard plays them: the second argument of `autoplay`. */
export const KEYS = Object.fromEntries(
  NOTE_KEYS.map((k) => [k.pitch, { code: k.code, key: k.char }]),
)

/**
 * In the page, before the plugin's worker is made: the worker's messages pass through here on
 * their way to the host. While armed, the guide's notes are taken out of a sound message and
 * their keys pressed at their moments; the first of them tells when the song began, and the
 * instrument changes are timed from it. Everything else goes through untouched.
 */
export function autoplay(keys) {
  if (window.__keystreamDemo !== undefined) return
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
        if (demo.armed) fn()
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

/** The pane on a first start: every track, the list's first, NORMAL, E.PIANO. */
export const keystreamPane = (id) => ({
  kind: 'pane',
  id,
  widget: 'plugin:keystream',
  state: { plugin: { shelf: 'all', level: 'normal', speed: 5, instrument: 'epiano' } },
})

/** The plugin's grant and settings, for `openTake`'s settings: keys and sound, the guide on. */
export const keystreamSettings = (volume) => ({
  keystream: {
    enabled: true,
    key: 'keystream',
    granted: { keys: true, sound: true },
    values: { volume, guide: true, offset: 0 },
  },
})

/** The plugin copied into a take's profile, as installing it from its folder would. */
export const copyKeystream = (profile) =>
  cpSync(PLUGIN, path.join(profile, 'plugins', 'keystream'), { recursive: true })

/**
 * The menu, walked by keys from a first start (the list's first track on every tab), where the
 * game puts it (genres.ts: the same decisions). `wait` is the take's.
 */
export function keystreamMenu(page, wait) {
  const menu = { shelf: 'all', selected: 0 }
  const shelfRows = (shelf) =>
    rowsOf(
      scores.map((s) => s.source.genre),
      shelf,
      scores.length,
    )
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
      menu.selected = settle(shelfRows(menu.shelf), menu.selected)
    }
  }

  /** Down or up the tab to a track, the short way round, the cursor sweeping past the rows. */
  async function toTrack(id) {
    const place = placeOf(id)
    await toShelf(scores[place].source.genre)
    const rows = shelfRows(menu.shelf)
    const down = (rows.indexOf(place) - rows.indexOf(menu.selected) + rows.length) % rows.length
    const up = rows.length - down
    for (let i = 0; i < Math.min(down, up); i++)
      await key(down <= up ? 'ArrowDown' : 'ArrowUp', 170)
    menu.selected = place
  }

  /**
   * The track under the cursor started on a level, with `plan` armed in the page's catch: its
   * instrument picked on the menu, its levels opened, one chosen.
   */
  async function start(level, instrument, plan) {
    // The instrument it starts on: the menu plays it as a chord, and the preview goes on in it.
    await key(instrumentCode(instrument), 2600)
    await key('Enter', 1100)
    const steps = LEVELS.indexOf(level) - LEVELS.indexOf('normal')
    for (let i = 0; i < Math.abs(steps); i++) await key(steps > 0 ? 'ArrowDown' : 'ArrowUp', 600)
    await wait(900)
    await page.evaluate(
      (p) =>
        Object.assign(window.__keystreamDemo, {
          plan: p,
          armed: true,
          start: null,
          pressed: 0,
          done: false,
        }),
      plan,
    )
    await key('Enter')
  }

  return { key, toTrack, start }
}
