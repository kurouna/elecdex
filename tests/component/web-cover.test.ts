import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Box } from '../../src/renderer/stores/web.svelte.ts'
import { signal } from './signal.svelte.ts'
import { tracked } from './tracked.svelte.ts'

/**
 * Which overlays a web pane thinks are over it (docs/architecture.md section 5.4).
 *
 * A web pane's page is a native view above the DOM, so an overlay the store does
 * not notice is drawn behind the page. The test drives overlays the way the DOM
 * would: a resize wakes the ResizeObserver, a transition ends with its event, and
 * a move that changes neither size nor style wakes nothing at all - that last one
 * is seen only by the frame the store measures in, which the test runs on fake
 * timers with a stand-in requestAnimationFrame, as tests/component/frame-loop.test.ts does.
 */

/** The observers the store made, by the element each watches. */
const observers = new Map<Element, () => void>()

class FakeResizeObserver {
  private readonly callback: () => void
  constructor(callback: () => void) {
    this.callback = callback
  }
  observe(element: Element): void {
    observers.set(element, this.callback)
  }
  disconnect(): void {
    for (const [element, callback] of observers) {
      if (callback === this.callback) observers.delete(element)
    }
  }
}

const { web } = await import('../../src/renderer/stores/web.svelte.ts')

let release: () => void = () => {}

/** Lets the store's frame come round, as it does ten times a second. */
function frame(): void {
  vi.advanceTimersByTime(200)
  flushSync()
}

interface Overlay {
  element: HTMLElement
  box: Box
  /** Whether it is showing, followed as the stores the app passes here are. */
  shown: { get: () => boolean; set: (value: boolean) => void }
  detach: () => void
}

/** Every overlay this test made, so none is left registered for the next one. */
const made: Overlay[] = []

/** Puts an overlay in the page at `box` and registers it as the app's do. */
function overlay(box: Box, shown = true): Overlay {
  const element = document.createElement('div')
  document.body.append(element)
  const it: Overlay = { element, box: { ...box }, shown: signal(shown), detach: () => {} }
  element.getBoundingClientRect = () =>
    ({
      x: it.box.x,
      y: it.box.y,
      left: it.box.x,
      top: it.box.y,
      right: it.box.x + it.box.width,
      bottom: it.box.y + it.box.height,
      width: it.box.width,
      height: it.box.height,
    }) as DOMRect
  const cleanup = web.cover(() => it.shown.get())(element)
  it.detach = () => {
    cleanup?.()
    element.remove()
  }
  made.push(it)
  return it
}

const meets = (a: Box, b: Box): boolean =>
  b.width > 0 &&
  b.height > 0 &&
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height

/** What the pane should be told, worked out from the boxes alone. */
const truth = (pane: Box, overlays: Overlay[]): boolean =>
  overlays.some((o) => o.shown.get() && meets(pane, o.box))

/** A web pane watching the store, as WebWidget's `covered` does. */
function watcher(pane: () => Box): { covered: () => boolean; stop: () => void } {
  const seen = tracked(() => web.covered(pane()))
  flushSync()
  return { covered: () => seen.value(), stop: seen.stop }
}

/** Repeatable randomness, so a failing run can be replayed from its seed. */
function random(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 0x100000000
    return state / 0x100000000
  }
}

/**
 * One random change, driven the way the DOM would drive it, with a label for the
 * message a failing step prints.
 */
function step(
  roll: number,
  target: Overlay,
  pane: { get: () => Box; set: (box: Box) => void },
  next: () => number,
): string {
  const place = () => ({ x: Math.floor(next() * 900), y: Math.floor(next() * 600) })
  if (roll < 0.3) {
    // Moved only: no resize, no transition - the DOM says nothing.
    target.box = { ...target.box, ...place() }
    return `move ${target.box.x},${target.box.y}`
  }
  if (roll < 0.55) {
    target.box = {
      ...target.box,
      width: Math.floor(next() * 400),
      height: Math.floor(next() * 200),
    }
    observers.get(target.element)?.()
    return `resize ${target.box.width}x${target.box.height}`
  }
  if (roll < 0.75) {
    target.shown.set(!target.shown.get())
    return `show ${target.shown.get()}`
  }
  if (roll < 0.9) {
    // Slid into place: the app's overlays end such a move with a transition.
    target.box = { ...target.box, ...place() }
    target.element.dispatchEvent(new Event('transitionend'))
    return 'slide'
  }
  // The pane itself moved: WebWidget measures again and hands in a new box.
  pane.set({ ...pane.get(), x: Math.floor(next() * 500), y: Math.floor(next() * 300) })
  return 'pane'
}

beforeEach(() => {
  observers.clear()
  vi.useFakeTimers()
  // On the loop's wake phase, where a frame's boundary is also the end of every
  // `frame()` here: the case that left a frame queued at the end of a test. The
  // clock used to start wherever the real one was, so it failed about once a hundred runs.
  vi.setSystemTime(new Date('2026-09-18T00:00:00.005Z'))
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 0),
  )
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id as unknown as number))
  vi.stubGlobal('elecdex', { web: { setAppearance: () => {} } })
  // A mounted web pane: without one the store measures nothing.
  release = web.retain()
})

afterEach(() => {
  release()
  // The frame loop's state outlives the test. A frame it has asked for must come
  // now: the fake timers are about to be thrown away, and a request that never
  // answers would leave the loop waiting on it through every later test.
  vi.runOnlyPendingTimers()
  for (const it of made.splice(0)) it.detach()
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('what a web pane is told is over it', () => {
  it('notices an overlay that is shown, hidden, resized or taken away', () => {
    const pane = signal<Box>({ x: 0, y: 0, width: 400, height: 300 })
    const status = overlay({ x: 0, y: 280, width: 400, height: 20 })
    const watch = watcher(pane.get)
    expect(watch.covered()).toBe(true)

    status.shown.set(false)
    flushSync()
    expect(watch.covered()).toBe(false)

    status.shown.set(true)
    flushSync()
    expect(watch.covered()).toBe(true)

    // Shrunk to nothing where the pane is: the ResizeObserver says so.
    status.box = { x: 0, y: 280, width: 0, height: 0 }
    observers.get(status.element)?.()
    flushSync()
    expect(watch.covered()).toBe(false)

    status.detach()
    flushSync()
    expect(watch.covered()).toBe(false)
    watch.stop()
  })

  it('notices an overlay that moved without changing size', () => {
    const pane = signal<Box>({ x: 0, y: 0, width: 400, height: 300 })
    const notice = overlay({ x: 0, y: 400, width: 200, height: 40 })
    const watch = watcher(pane.get)
    expect(watch.covered()).toBe(false)

    // Slid up over the pane: same size, same style, so nothing in the DOM fires
    // and only the store's own frame can see it.
    notice.box = { ...notice.box, y: 100 }
    flushSync()
    frame()
    expect(watch.covered()).toBe(true)
    watch.stop()
  })

  it.each([20260918, 7, 424_242])(
    'agrees with the boxes through random changes (seed %i)',
    (seed) => {
      const next = random(seed)
      const pane = signal<Box>({ x: 100, y: 100, width: 400, height: 300 })
      const overlays: Overlay[] = [
        overlay({ x: 0, y: 560, width: 900, height: 24 }),
        overlay({ x: 700, y: 0, width: 200, height: 80 }, false),
      ]
      const watch = watcher(pane.get)
      const steps: string[] = []

      for (let i = 0; i < 300; i++) {
        const target = overlays[Math.floor(next() * overlays.length)]
        if (target === undefined) continue
        steps.push(step(next(), target, pane, next))
        flushSync()
        frame()
        expect(watch.covered(), `step ${i}: ${steps.slice(-3).join(' | ')}`).toBe(
          truth(pane.get(), overlays),
        )
      }
      watch.stop()
    },
  )
})
