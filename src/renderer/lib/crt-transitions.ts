import { untrack } from 'svelte'
import type { TransitionConfig } from 'svelte/transition'
import { appearance } from '../stores/appearance.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'
import { fadeShade, handoffDelay, POWER_OFF_MS, powerOffStyle } from './crt-motion.ts'

/**
 * How dialogs and notices go: `transition:crtPower` on anything that powers on
 * with `crt-on` (a dialog, a toast), `transition:backdropShade` on a dialog's
 * backdrop, and `dialogDelay()` for the `--crt-delay` of a dialog opening.
 * Where the element leaves with a block around it (a toast in a list that goes
 * when its last item does), use `|global`.
 *
 * Both ways rather than `out:` only, for two reasons. Svelte keeps an out-only
 * transition's first config for good once a close has been cancelled (the dialog
 * opened again while leaving), so the next close would replay stale state; a
 * bidirectional one is asked afresh after every intro. And a cancelled close then
 * plays back from where it was, the picture opening out again.
 *
 * Svelte makes a leaving element inert before asking for its config, and takes
 * that back before an intro: that is how these tell a close from an open. The
 * open itself is the CSS power-on (`crt-on`), so an intro here does nothing.
 * While inert, clicks already reach the page below.
 */

const STILL: TransitionConfig = { duration: 0 }

const closing = (node: HTMLElement) => node.inert && !appearance.reducedMotion

/** The picture powers off, its closing edges glowing as the opening ones did. */
export function crtPower(node: HTMLElement): TransitionConfig {
  if (!closing(node)) return STILL
  // The beam reads these too; a handover's delay was for the power-on only.
  node.style.setProperty('--crt-duration', `${POWER_OFF_MS}ms`)
  node.style.setProperty('--crt-delay', '0ms')
  // Restart the beam: a dialog opened again while leaving keeps the class it was given.
  node.classList.remove('crt-beam')
  void node.offsetWidth
  node.classList.add('crt-beam')
  // Asked after animate:flip has lifted a leaving toast out of the flow, translated back to its place.
  const base = node.style.transform
  return {
    duration: POWER_OFF_MS,
    css: (_t, u) => powerOffStyle(u, base),
    // A cancelled close has played back to the whole picture: the beam is spent, and
    // its class would otherwise hold a GPU layer (will-change) for as long as it shows.
    tick: (t) => {
      if (t >= 1 && !node.inert) node.classList.remove('crt-beam')
    },
  }
}

/** Backdrops still fading, each with a way to hand the page over to a new dialog at once. */
const leaving = new Set<() => void>()

/**
 * The backdrop fades with its dialog - unless another dialog opens, whose
 * backdrop then darkens the page: this one turns clear at once, so the page is
 * not darkened twice, and stays above the new dialog, so the leaving picture is
 * seen collapsing into the line the new one opens from. A backdrop opening takes
 * the page over from any still fading, in the same update, before a frame shows
 * two shades.
 */
export function backdropShade(node: HTMLElement): TransitionConfig {
  if (!node.inert) {
    for (const handOver of [...leaving]) handOver()
    return STILL
  }
  if (!closing(node)) return STILL
  const shade = getComputedStyle(node).backgroundColor
  let handedOver = ui.dialogOpen
  // Painted per frame rather than as keyframes: only the shade fades (an opacity
  // would dim the dialog's power-off with it), and a handover must be able to
  // clear it part-way, which an animation would override.
  const paint = (t: number) => {
    // Opened again: the close plays back with the backdrop as it was.
    if (!node.inert) handedOver = false
    let background = ''
    if (handedOver) background = 'transparent'
    else if (node.inert && t < 1) background = fadeShade(shade, t)
    node.style.background = background
    node.style.zIndex = handedOver ? '901' : ''
    if (!node.inert || t <= 0) leaving.delete(handOver)
  }
  const handOver = () => {
    // A backdrop destroyed mid-fade (the page reloading) never reaches its last frame.
    if (!node.isConnected) {
      leaving.delete(handOver)
      return
    }
    handedOver = true
    paint(0)
  }
  leaving.add(handOver)
  paint(1)
  return { duration: POWER_OFF_MS, tick: paint }
}

/**
 * The `--crt-delay` for a dialog opening now: a handover from one closing, or
 * nothing. Untracked, so a settings change while the dialog is open (the settings
 * dialog makes them) does not work it out again against a later time.
 */
export function dialogDelay(): string | undefined {
  return untrack(() => {
    if (appearance.reducedMotion) return undefined
    const delay = handoffDelay(performance.now() - ui.closedAt)
    return delay > 0 ? `${delay}ms` : undefined
  })
}
