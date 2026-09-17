import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POWER_OFF_MS } from '../../src/renderer/lib/crt-motion.ts'
import { backdropShade, crtPower, dialogDelay } from '../../src/renderer/lib/crt-transitions.ts'
import { appearance } from '../../src/renderer/stores/appearance.svelte.ts'
import { ui } from '../../src/renderer/stores/ui.svelte.ts'
import { tracked } from './tracked.svelte.ts'

/**
 * Dialogs power off as they close, and one opening while another closes powers on
 * out of the other's line. The transitions are driven here the way Svelte drives
 * them: css(t, u) for frames, tick(t) per frame, and tick(1) when an outro is
 * cancelled because the dialog opened again.
 */

let now = 1000

beforeEach(() => {
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  appearance.settings = { ...appearance.settings, motion: 'full' }
  ui.closePanePicker()
  ui.closeSettings()
  ui.closeLocationPicker()
  ui.closedAt = Number.NEGATIVE_INFINITY
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

const location = { current: { kind: 'jma', office: '130000' }, choose: () => {} } as never

describe('ui.closedAt', () => {
  it('is set when a dialog closes, and not when one opens over nothing', () => {
    ui.openPanePicker()
    expect(ui.closedAt).toBe(Number.NEGATIVE_INFINITY)
    now = 1200
    ui.closePanePicker()
    expect(ui.closedAt).toBe(1200)
  })

  it('is set when a dialog replaces another', () => {
    ui.openSettings()
    now = 1300
    ui.openPanePicker()
    expect(ui.closedAt).toBe(1300)
    now = 1400
    ui.pickLocation(location)
    expect(ui.closedAt).toBe(1400)
    now = 1500
    ui.openSettings()
    expect(ui.closedAt).toBe(1500)
    now = 1600
    ui.closeSettings()
    expect(ui.closedAt).toBe(1600)
  })

  it('is not set by closing what is not open, or by a new location request for the open picker', () => {
    ui.closeSettings()
    ui.closePanePicker()
    ui.closeLocationPicker()
    expect(ui.closedAt).toBe(Number.NEGATIVE_INFINITY)
    ui.pickLocation(location)
    now = 1700
    ui.pickLocation(location)
    expect(ui.closedAt).toBe(Number.NEGATIVE_INFINITY)
    ui.closeLocationPicker()
    expect(ui.closedAt).toBe(1700)
  })
})

describe('dialogDelay', () => {
  it('delays a dialog opening just after another began to close', () => {
    ui.openSettings()
    ui.openPanePicker()
    expect(dialogDelay()).toBe('112ms')
    now += 100
    expect(dialogDelay()).toBe('12ms')
    now += 100
    expect(dialogDelay()).toBeUndefined()
  })

  it('is worked out once, not again when a setting changes while the dialog is open', () => {
    ui.openSettings()
    ui.openPanePicker()
    const delay = tracked(dialogDelay)
    flushSync()
    expect(delay.value()).toBe('112ms')
    now += 1000
    appearance.settings = { ...appearance.settings, theme: 'amber' }
    flushSync()
    expect(delay.runs()).toBe(1)
    expect(delay.value()).toBe('112ms')
    delay.stop()
  })

  it('does not delay the first dialog, or any with motion reduced', () => {
    expect(dialogDelay()).toBeUndefined()
    appearance.settings = { ...appearance.settings, motion: 'reduced' }
    ui.openSettings()
    ui.openPanePicker()
    expect(dialogDelay()).toBeUndefined()
  })
})

/** A dialog or backdrop as Svelte leaves it when it asks for a close: inert. */
const leavingNode = () => {
  const node = document.createElement('div')
  node.style.background = 'rgba(0, 0, 0, 0.5)'
  node.inert = true
  document.body.append(node)
  return node
}
/** One opening: Svelte has made it (or made it again) not inert. */
const openingNode = () => {
  const node = leavingNode()
  node.inert = false
  return node
}
/** What Svelte does when a leaving dialog is opened again: it is no longer inert, and the close plays back. */
const reopen = (node: HTMLElement, tick: ((t: number, u: number) => void) | undefined) => {
  node.inert = false
  tick?.(0.7, 0.3)
  tick?.(1, 0)
}

describe('crtPower', () => {
  it('leaves an opening to the CSS power-on', () => {
    const node = openingNode()
    expect(crtPower(node)).toEqual({ duration: 0 })
    expect(node.className).toBe('')
  })

  it('plays the power-off with the beam, from its start', () => {
    const node = leavingNode()
    node.style.setProperty('--crt-delay', '112ms')
    const config = crtPower(node)
    expect(config.duration).toBe(POWER_OFF_MS)
    expect(node.classList.contains('crt-beam')).toBe(true)
    expect(node.style.getPropertyValue('--crt-duration')).toBe(`${POWER_OFF_MS}ms`)
    expect(node.style.getPropertyValue('--crt-delay')).toBe('0ms')
    // Svelte counts t down from 1 in an outro; u is the progress.
    expect(config.css?.(1, 0)).toContain('scale(1, 1)')
    expect(config.css?.(0, 1)).toContain('opacity: 0;')
  })

  it('is asked afresh for a second close, with the beam again', () => {
    const node = leavingNode()
    crtPower(node)
    node.inert = false
    crtPower(node)
    node.inert = true
    const config = crtPower(node)
    expect(config.duration).toBe(POWER_OFF_MS)
    expect(node.classList.contains('crt-beam')).toBe(true)
  })

  it('keeps the place a leaving toast is held at', () => {
    const node = leavingNode()
    node.style.transform = 'translate(0px, 80px)'
    expect(crtPower(node).css?.(1, 0)).toContain('transform: translate(0px, 80px) scale(1, 1);')
  })

  it('drops the beam once a cancelled close has played back, and not before', () => {
    const node = leavingNode()
    const config = crtPower(node)
    // Svelte's first frame of the close passes t = 1 too, while the node is inert.
    config.tick?.(1, 0)
    expect(node.classList.contains('crt-beam')).toBe(true)
    reopen(node, config.tick)
    expect(node.classList.contains('crt-beam')).toBe(false)
  })

  it('does nothing with motion reduced', () => {
    appearance.settings = { ...appearance.settings, motion: 'reduced' }
    const node = leavingNode()
    expect(crtPower(node)).toEqual({ duration: 0 })
    expect(node.className).toBe('')
  })
})

describe('backdropShade', () => {
  it('fades its shade, and is whole again if the dialog opens again', () => {
    const node = leavingNode()
    const config = backdropShade(node)
    expect(config.duration).toBe(POWER_OFF_MS)
    config.tick?.(1, 0)
    expect(node.style.background).toBe('')
    config.tick?.(0.5, 0.5)
    expect(node.style.background).toBe('rgba(0, 0, 0, 0.25)')
    expect(node.style.zIndex).toBe('')
    reopen(node, config.tick)
    expect(node.style.background).toBe('')
  })

  it('clears at once and stays on top when another dialog has opened', () => {
    ui.openSettings()
    ui.openPanePicker()
    const node = leavingNode()
    const config = backdropShade(node)
    expect(node.style.background).toContain('transparent')
    expect(node.style.zIndex).toBe('901')
    // Svelte's first frame passes t = 1; the handover holds.
    config.tick?.(1, 0)
    config.tick?.(0.4, 0.6)
    expect(node.style.background).toContain('transparent')
    expect(node.style.zIndex).toBe('901')
  })

  it('clears as soon as another dialog opens part-way through, before the next frame', () => {
    const node = leavingNode()
    const config = backdropShade(node)
    config.tick?.(0.8, 0.2)
    expect(node.style.zIndex).toBe('')
    expect(backdropShade(openingNode())).toEqual({ duration: 0 })
    expect(node.style.background).toContain('transparent')
    expect(node.style.zIndex).toBe('901')
    config.tick?.(0.6, 0.4)
    expect(node.style.background).toContain('transparent')
  })

  it('is handed over only while it is leaving', () => {
    const ended = leavingNode()
    backdropShade(ended).tick?.(0, 1)
    const reopened = leavingNode()
    reopen(reopened, backdropShade(reopened).tick)
    backdropShade(openingNode())
    expect(ended.style.zIndex).toBe('')
    expect(reopened.style.zIndex).toBe('')
    expect(reopened.style.background).toBe('')
  })

  it('forgets a backdrop destroyed before its fade ended', () => {
    const gone = leavingNode()
    backdropShade(gone)
    gone.remove()
    backdropShade(openingNode())
    expect(gone.style.zIndex).toBe('')
    // Reattached, it is no longer on the list to be handed over.
    document.body.append(gone)
    backdropShade(openingNode())
    expect(gone.style.zIndex).toBe('')
  })

  it('a handed-over backdrop opened again is whole and back in its place', () => {
    const node = leavingNode()
    const config = backdropShade(node)
    backdropShade(openingNode())
    expect(node.style.zIndex).toBe('901')
    reopen(node, config.tick)
    expect(node.style.zIndex).toBe('')
    expect(node.style.background).toBe('')
  })

  it('does nothing with motion reduced', () => {
    appearance.settings = { ...appearance.settings, motion: 'reduced' }
    ui.openSettings()
    const node = leavingNode()
    expect(backdropShade(node)).toEqual({ duration: 0 })
    expect(node.style.zIndex).toBe('')
  })
})
