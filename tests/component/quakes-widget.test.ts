import type { QuakeState } from '@shared/quakes'
import { cleanup, render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { inertDom } from './support/dom.ts'
import { stubElecdex } from './support/elecdex.ts'
import { settle } from './support/settle.ts'

const { default: QuakesWidget } = await import(
  '../../src/renderer/widgets/quakes/QuakesWidget.svelte'
)
const { windowState } = await import('../../src/renderer/stores/window-state.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The quakes pane keeps main's list current only while it is seen. Found by the e2e lifecycle
 * contract (2026-10-23): it subscribed whenever it was mounted, so behind another tab or in a
 * minimised window main went on asking JMA or the USGS every minute with alerts off.
 */

let subscriptions = 0

const EMPTY: QuakeState = {
  source: 'jma',
  active: true,
  fetchedAt: null,
  quakes: [],
  tsunami: null,
  error: null,
} as unknown as QuakeState

beforeEach(() => {
  subscriptions = 0
  windowState.onScreen = true
  inertDom()
  stubElecdex({
    quakes: {
      subscribe: (handler: (state: QuakeState) => void) => {
        subscriptions += 1
        // The state at once, as main sends it: over IPC, so after the subscribing effect.
        queueMicrotask(() => handler(structuredClone(EMPTY)))
        return () => {
          subscriptions -= 1
        }
      },
    },
  })
})

afterEach(async () => {
  cleanup()
  windowState.onScreen = true
  await layout.flush()
  vi.unstubAllGlobals()
})

async function mount(visible: boolean) {
  const view = render(QuakesWidget, {
    props: { paneId: 'q1', title: 'quakes', props: {}, state: {}, active: true, visible },
  })
  await settle()
  return view
}

describe('QuakesWidget', () => {
  it('keeps the list current only while it is shown in its tab group', async () => {
    const view = await mount(false)
    expect(subscriptions).toBe(0)
    await view.rerender({ visible: true })
    await settle()
    expect(subscriptions).toBe(1)
    await view.rerender({ visible: false })
    await settle()
    expect(subscriptions).toBe(0)
  })

  it('lets the list go while the window is minimised, and takes it up again when it is back', async () => {
    await mount(true)
    expect(subscriptions).toBe(1)
    windowState.onScreen = false
    await settle()
    expect(subscriptions).toBe(0)
    windowState.onScreen = true
    await settle()
    expect(subscriptions).toBe(1)
  })
})
