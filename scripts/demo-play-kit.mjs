/**
 * The PLAY-320's games played by a script, for the README screenshots (gen-screenshots.mjs) and
 * the games' video (demo-games.mjs): ELECAIRCOMBAT, ELECLANCE and ELECDRILL started from the
 * start screen and played with the PC's keys, as a hand would - each key held for a few frames,
 * since the machine looks at the pad once a frame.
 *
 * ELECAIRCOMBAT is flown by what is on its screen: the HUD's arrow to an enemy out of sight, the
 * red box of a lock, the MISSILE warning. Read from the screen's canvas, the colours the game
 * draws them in, the way a player reads them; nothing of the machine's memory is looked at.
 *
 * Keys (docs/elec16-play-manual.md): arrows the d-pad, Z A, X B, S X, A Y, Q L, W R, Enter START.
 */

import { steps } from './elecaircombat/palettes.mjs'

/**
 * No gamepad reaches the page: a PLAY-320 reads every connected gamepad as its pad
 * (play-input.ts), and a controller on this machine - a stick resting off centre, a button
 * pressed - would steer a take or a shot, and is this machine's. Called once the window is up,
 * before anything is played; the page reads `navigator.getGamepads` at each look.
 */
export async function noGamepads(page) {
  // The workspace's own document, not the blank one a window opens on.
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] })
  })
}

/** The pad of the focused machine: `hold` presses for `ms`, `down`/`up` for long presses. */
export function padOf(page, wait) {
  const down = (key) => page.keyboard.down(key)
  const up = (key) => page.keyboard.up(key)
  const hold = async (key, ms = 120) => {
    await down(key)
    await wait(ms)
    await up(key)
  }
  return { down, up, hold }
}

/**
 * Hands off the pad while a take reaches for the pane's buttons or the status bar's theme: a
 * game's loop below looks at `off` before each move, lets go of what it holds and waits. A key
 * pressed while a select has the focus would change it. `aside(wait, move)` takes the hands off,
 * waits out a press already under way, runs the move, and gives the pad back.
 */
export function hands() {
  const state = { off: false }
  state.aside = async (wait, move) => {
    state.off = true
    await wait(450)
    try {
      await move()
    } finally {
      state.off = false
    }
  }
  return state
}

/** Every key the games use let go, so a key held when a script stops is not held on. */
export async function letGoAll(page) {
  for (const key of [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'KeyZ',
    'KeyX',
    'KeyS',
    'KeyA',
    'KeyQ',
    'KeyW',
  ]) {
    await page.keyboard.up(key)
  }
}

/* ---- ELECAIRCOMBAT ---- */

/**
 * From the start screen to the cockpit: START loads the game, A on its title (once the title has
 * flown in), on the controls and on the briefing. Resolves as the sortie begins, the first ace
 * ahead and closing head-on.
 */
export async function airTakeOff(
  page,
  wait,
  { title = 3500, controls = 2500, briefing = 3000 } = {},
) {
  const pad = padOf(page, wait)
  await pad.hold('Enter')
  await wait(title)
  await pad.hold('KeyZ')
  await wait(controls)
  await pad.hold('KeyZ')
  await wait(briefing)
  await pad.hold('KeyZ')
  // The cockpit powers in, wings level: what the dogfight reads the sky and the sea from.
  await wait(500)
}

/**
 * The first sortie's sky and sea (its time of day is day), every band of each as the screen's
 * canvas shows it: scripts/elecaircombat/palettes.mjs's `steps` between the day's colours there
 * (haze to zenith, sea haze to the deep), each RGB555 colour widened to 8 bits as the page
 * draws it. With them a look can tell which way is up and where the nose points.
 */
function dayColours() {
  const widen = ([r, g, b]) => {
    const w = (v) => ((v >> 3) << 3) | (v >> 5)
    return (w(r) << 16) | (w(g) << 8) | w(b)
  }
  return {
    sky: steps('#98c0e8', '#102868', 16).map(widen),
    sea: steps('#a8c8e0', '#204880', 15).map(widen),
  }
}

/**
 * What the HUD shows in its colours (the game's palette, docs/elec16-elecaircombat.md 3): the
 * arrow to an enemy out of sight, or a lock's box and name, in one red; the MISSILE warning in
 * a deeper one; the ALT lamp on the panel; how far left the HUD's altitude reaches (its number
 * is right-aligned under ALT, a digit six dots wide); and how much sky and sea there is along
 * the top of the screen, round the middle and along the bottom.
 */
function readHud(canvas, { sky, sea }) {
  const width = canvas.width
  const data = canvas.getContext('2d').getImageData(0, 0, width, canvas.height).data
  const rgb = (x, y) => {
    const i = (y * width + x) * 4
    return [data[i], data[i + 1], data[i + 2]]
  }
  const is = ([r, g, b], [R, G, B]) => r === R && g === G && b === B

  /** The red marks' count and middle, and the MISSILE warning's count. */
  function marks() {
    const found = { n: 0, sx: 0, sy: 0, warning: 0 }
    for (let y = 0; y < 224; y++) {
      for (let x = 0; x < width; x++) {
        const c = rgb(x, y)
        if (is(c, [255, 99, 82])) {
          found.n++
          found.sx += x
          found.sy += y
        } else if (is(c, [231, 33, 33])) found.warning++
      }
    }
    return found
  }

  /** The ALT lamp lit, under the panel's middle screen. */
  function lamp() {
    let lit = 0
    for (let y = 224; y < canvas.height; y++) {
      for (let x = 149; x < 184; x++) if (is(rgb(x, y), [255, 181, 49])) lit++
    }
    return lit > 40
  }

  /**
   * The altitude's leftmost dot: its rows are the ones reaching past the label's right edge
   * (a shake moves them), and the green of the HUD.
   */
  function altitudeLeft() {
    let left = 270
    for (let y = 98; y < 118; y++) {
      const xs = []
      for (let x = 228; x < 272; x++) {
        const [r, g, b] = rgb(x, y)
        if (g > r + 60 && g > b + 40) xs.push(x)
      }
      if (xs.length > 0 && xs[xs.length - 1] >= 264) left = Math.min(left, xs[0])
    }
    return left
  }

  /** Sky and sea in a band of rows, every other dot across the middle of the screen. */
  function band(from, to) {
    const skies = new Set(sky)
    const seas = new Set(sea)
    const found = { sky: 0, sea: 0 }
    for (let y = from; y < to; y++) {
      for (let x = 80; x < 240; x += 2) {
        const [r, g, b] = rgb(x, y)
        const colour = (r << 16) | (g << 8) | b
        if (skies.has(colour)) found.sky++
        else if (seas.has(colour)) found.sea++
      }
    }
    return found
  }

  const { n, sx, sy, warning } = marks()
  const where = n === 0 ? {} : { x: sx / n - 160, y: sy / n - 112 }
  return {
    n,
    ...where,
    warning,
    low: lamp(),
    altLeft: altitudeLeft(),
    top: band(0, 60),
    middle: band(97, 128),
    bottom: band(161, 216),
  }
}

/**
 * Flies the first sortie's dogfight for `ms`: an enemy out of sight is brought round by rolling
 * until the arrow points up and pulling, the pull held on a moment after it comes into sight (it
 * comes in at the top); one locked is held in the middle with the gun, and a missile goes;
 * flares when a missile is coming. Under 10,000 with the nose in the sea, or under 1,000, the
 * chase waits: the wings rolled until the sky is above, and the nose pulled up into it. Called
 * at the sortie's start, as the HUD's altitude has its five digits. While `gate.off` (`hands`)
 * the pad is let go of.
 */
export async function airDogfight(
  page,
  wait,
  ms,
  { missiles = true, gate = null, screen = page.getByTestId('elec16-play-screen') } = {},
) {
  // `screen`: the one to read where a layout has more than one PLAY-320 (the tour's retro).
  const pilot = airPilot(page, wait, missiles)
  const colours = dayColours()
  const until = Date.now() + ms
  while (Date.now() < until) {
    if (gate?.off) {
      await pilot.letGo()
      await wait(60)
      continue
    }
    const hud = await screen.evaluate(readHud, colours).catch(() => null)
    if (hud === null) break
    await pilot.fly(hud)
  }
  await pilot.letGo()
}

/** The dogfight's hands: what is held, and one move for each look at the HUD. */
function airPilot(page, wait, missiles) {
  const pad = padOf(page, wait)
  const held = new Set()
  const set = async (key, on) => {
    if (on === held.has(key)) return
    if (on) held.add(key)
    else held.delete(key)
    await (on ? pad.down(key) : pad.up(key))
  }
  const state = { lastMissile: 0, lastFlare: 0, lastArrow: 0, climbUntil: 0, fiveDigits: null }

  /** Up out of a dive: the sky rolled to the top, then the nose pulled into it (or, with no sky
   * on the screen at all - a steep dive - a pull, the way out either way up). */
  async function climb(hud) {
    await set('KeyZ', false)
    await set('ArrowUp', false)
    const skySeen = hud.top.sky + hud.middle.sky + hud.bottom.sky > 30
    if (skySeen && hud.top.sea > hud.top.sky) {
      await set('ArrowDown', false)
      await pad.hold('ArrowRight', 90)
    } else {
      await set('ArrowDown', true)
      await wait(70)
    }
  }

  /** Locked: a missile now and then, the gun, and small corrections towards the box. */
  async function attack(hud, now) {
    await set('KeyZ', true)
    await set('ArrowDown', hud.y < -10)
    await set('ArrowUp', hud.y > 14)
    if (missiles && now - state.lastMissile > 2500) {
      state.lastMissile = now
      await pad.hold('KeyX', 100)
    }
    if (Math.abs(hud.x) > 16) await pad.hold(hud.x > 0 ? 'ArrowRight' : 'ArrowLeft', 40)
    await wait(50)
  }

  /** Out of sight: roll until the arrow points up, then pull and keep pulling. */
  async function chase(hud, now) {
    state.lastArrow = now
    await set('KeyZ', false)
    await set('ArrowUp', false)
    const angle = (Math.atan2(hud.x, -hud.y) * 180) / Math.PI
    if (Math.abs(angle) > 30) {
      await set('ArrowDown', false)
      await pad.hold(angle > 0 ? 'ArrowRight' : 'ArrowLeft', Math.abs(angle) > 90 ? 140 : 70)
    } else {
      await set('ArrowDown', true)
      await wait(70)
    }
  }

  /** Whether to climb: under 1,000 (or the ALT lamp), or under 10,000 with the nose in the sea. */
  function mustClimb(hud, now) {
    // Where the five digits began: a digit fewer is under 10,000, two under 1,000.
    state.fiveDigits ??= hud.altLeft
    const digits = 5 - Math.round((hud.altLeft - state.fiveDigits) / 6)
    const noseDown = hud.middle.sea > hud.middle.sky
    if (hud.low || digits <= 3) state.climbUntil = now + 2500
    else if (digits <= 4 && noseDown) state.climbUntil = Math.max(state.climbUntil, now + 1000)
    return now < state.climbUntil
  }

  async function fly(hud) {
    const now = Date.now()
    if (hud.warning > 20 && now - state.lastFlare > 1500) {
      state.lastFlare = now
      await pad.hold('KeyS', 100)
    }
    if (mustClimb(hud, now)) return climb(hud)
    if (hud.n === 0) {
      // In sight, not locked yet: the gun, and the pull kept on a little while it comes down.
      await set('KeyZ', true)
      await set('ArrowDown', now - state.lastArrow < 500)
      return wait(70)
    }
    if (hud.n > 60 || Math.hypot(hud.x, hud.y) < 50) return attack(hud, now)
    return chase(hud, now)
  }

  const letGo = async () => {
    for (const key of [...held]) await set(key, false)
  }
  return { fly, letGo }
}

/* ---- ELECLANCE ---- */

/**
 * From the start screen into the stage: START loads the game, left on the title for EASY (the
 * ship lasts the take), START once the title's word has landed.
 */
export async function lanceStart(page, wait, { title = 2000, easy = true } = {}) {
  const pad = padOf(page, wait)
  await pad.hold('Enter')
  await wait(title)
  if (easy) {
    await pad.hold('ArrowLeft')
    await wait(400)
  }
  await pad.hold('KeyZ')
}

/**
 * The ship weaving left and right for `ms`, shooting in taps and now and then holding A for
 * the LANCE; a bomb (`bombAt`, ms from the start) once.
 */
export async function lanceWeave(
  page,
  wait,
  ms,
  { bombAt = null, lanceEvery = 6, gate = null } = {},
) {
  const pad = padOf(page, wait)
  const start = Date.now()
  let bombed = bombAt === null
  for (let k = 0; Date.now() - start < ms; k++) {
    if (gate?.off) {
      await wait(60)
      continue
    }
    if (!bombed && Date.now() - start > bombAt) {
      bombed = true
      await pad.hold('KeyX', 140)
    }
    const side = k % 8 < 4 ? 'ArrowLeft' : 'ArrowRight'
    if (k % lanceEvery === lanceEvery - 1) {
      // The LANCE: A held, the ship drifting slowly while it burns.
      await pad.down('KeyZ')
      await pad.hold(side, 300)
      await wait(900)
      await pad.up('KeyZ')
      continue
    }
    await pad.down(side)
    await pad.hold('KeyZ', 100)
    await wait(100)
    await pad.up(side)
  }
}

/* ---- ELECDRILL ---- */

/**
 * From the start screen into the well: START loads the game, left on the title for EASY, A on
 * the title and on the controls.
 */
export async function drillStart(page, wait, { title = 2500, controls = 2000, easy = true } = {}) {
  const pad = padOf(page, wait)
  await pad.hold('Enter')
  await wait(title)
  if (easy) {
    await pad.hold('ArrowLeft')
    await wait(400)
  }
  await pad.hold('KeyZ')
  await wait(controls)
  await pad.hold('KeyZ')
}

/**
 * Digging down for `ms`: down (B) most of the time, held for a moment so the drill goes on, and
 * now and then a dig to the right (A) or the left (Y), so blocks lose their footing and fall.
 */
export async function drillDig(page, wait, ms, { gate = null } = {}) {
  const pad = padOf(page, wait)
  const start = Date.now()
  const moves = ['KeyX', 'KeyX', 'KeyX', 'KeyZ', 'KeyX', 'KeyX', 'KeyX', 'KeyA']
  for (let k = 0; Date.now() - start < ms; k++) {
    if (gate?.off) {
      await wait(60)
      continue
    }
    const key = moves[k % moves.length]
    await pad.hold(key, key === 'KeyX' ? 300 : 160)
    await wait(250)
  }
}
