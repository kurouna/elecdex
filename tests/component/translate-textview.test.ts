import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../../src/shared/settings'
import type { TranslateBoard } from '../../src/shared/translate/board'
import type { RunEvent, RunView } from '../../src/shared/translate/run'
import { stubMatchMedia, stubResizeObserver } from './support/dom.ts'
import { settle } from './support/settle.ts'

const { default: TextView } = await import('../../src/renderer/widgets/translate/TextView.svelte')
const { RunFollower } = await import('../../src/renderer/widgets/translate/run-follower.svelte.ts')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')

/**
 * TEXT mounted (docs/translate.md §3): what its effects do with the source and the run, and the
 * keys - Clear stays clear, a reloaded page gets its source back once, Ctrl+. right after
 * Ctrl+Enter reaches the pane.
 */

let handler: ((event: RunEvent) => void) | null = null
let translate: Record<string, ReturnType<typeof vi.fn>>

const board = {
  engine: { phase: 'ready', bootLines: [], build: 'b1', backend: 'cpu', error: null },
  models: [],
  fetch: null,
  selectedModel: 'm',
} as unknown as TranslateBoard

const runOf = (source: string, state: RunView['state'] = 'done'): RunView => ({
  paneId: 'x',
  draftId: 'd-run',
  version: 1,
  mode: 'translate',
  srcLang: 'en',
  tgtLang: 'ja',
  form: 'polite',
  state,
  reason: null,
  blocks: [
    {
      index: 0,
      lead: '',
      source,
      text: state === 'done' ? '訳' : '',
      state: state === 'done' ? 'done' : 'running',
      note: null,
      tokens: null,
      ms: null,
      history: 0,
      terms: 0,
      edited: false,
      trip: null,
    },
  ],
  tail: '',
  detected: null,
  context: '',
  glossary: null,
})

let pane = 0
function mount(
  paneState: Record<string, unknown> = {},
  visible = true,
  summon: { seq: number; text: string } | null = null,
  given: InstanceType<typeof RunFollower> | null = null,
) {
  const paneId = given?.paneId ?? `tv-${++pane}`
  const follower = given ?? new RunFollower(paneId)
  const view = render(TextView, {
    props: {
      paneId,
      board,
      paneState,
      visible,
      follower,
      onsetup: () => {},
      onengine: () => {},
      onhistory: () => {},
      summon,
    },
  })
  follower.follow()
  const send = async (run: RunView | null, seq = 1) => {
    handler?.({ paneId, seq, kind: 'snapshot', run: run && { ...run, paneId } })
    await settle()
  }
  return { paneId, send, view, follower }
}

beforeEach(() => {
  stubMatchMedia()
  stubResizeObserver()
  handler = null
  translate = {
    run: vi.fn(async () => ({ version: 1 })),
    stop: vi.fn(),
    roundTrip: vi.fn(async () => undefined),
    cancelLive: vi.fn(),
    follow: vi.fn((_paneId: string, h: (event: RunEvent) => void) => {
      handler = h
      return () => {}
    }),
  }
  vi.stubGlobal('elecdex', { translate })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('TEXT', () => {
  it('brings a reloaded page its source back from the run, once', async () => {
    const { send } = mount()
    await send(runOf('Hello.'))
    expect(screen.getByTestId('translate-source-blocks').textContent).toContain('Hello.')
  })

  it('keeps the source clear after Clear, though the run still has it', async () => {
    const { send } = mount()
    await send(runOf('Hello.'))
    await fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    await settle()
    expect((screen.getByTestId('translate-source') as HTMLTextAreaElement).value).toBe('')
    // A later snapshot of the same run does not bring it back either.
    await send(runOf('Hello.'), 2)
    expect((screen.getByTestId('translate-source') as HTMLTextAreaElement).value).toBe('')
  })

  it('keeps focus in the pane after Ctrl+Enter, so Ctrl+. stops at once', async () => {
    const { paneId, send } = mount()
    const source = screen.getByTestId('translate-source') as HTMLTextAreaElement
    await fireEvent.input(source, { target: { value: 'Hello.' } })
    await fireEvent.keyDown(source, { key: 'Enter', ctrlKey: true })
    await settle()
    expect(translate.run).toHaveBeenCalledWith(
      expect.objectContaining({ paneId, text: 'Hello.', tgtLang: 'ja', mode: 'translate' }),
    )
    expect(document.activeElement).toBe(screen.getByTestId('translate-text'))
    await send({ ...runOf('Hello.', 'running'), draftId: 'd' })
    await fireEvent.keyDown(document.activeElement as Element, { key: '.', ctrlKey: true })
    expect(translate.stop).toHaveBeenCalledWith(paneId)
  })

  it('does not turn the source back into the editor on focus alone', async () => {
    const { send } = mount()
    await send(runOf('Hello.'))
    const blocks = screen.getByTestId('translate-source-blocks')
    blocks.focus()
    await settle()
    expect(screen.queryByTestId('translate-source')).toBeNull()
    await fireEvent.keyDown(blocks, { key: 'Enter' })
    await settle()
    expect(screen.getByTestId('translate-source')).toBeTruthy()
  })
})

describe('TEXT with LIVE and ROUND TRIP', () => {
  const withLive = (live: boolean) => {
    const settings = defaultSettings()
    appearance.settings = { ...settings, translate: { ...settings.translate, live } }
  }

  it('asks LIVE 0.6 s after the typing stops, and Ctrl+Enter takes its place', async () => {
    vi.useFakeTimers()
    try {
      withLive(true)
      mount()
      const source = screen.getByTestId('translate-source') as HTMLTextAreaElement
      await fireEvent.input(source, { target: { value: 'Hello.' } })
      vi.advanceTimersByTime(500)
      expect(translate.run).not.toHaveBeenCalled()
      vi.advanceTimersByTime(100)
      expect(translate.run).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'live' }))
      translate.run?.mockClear()
      await fireEvent.input(source, { target: { value: 'Hello again.' } })
      await fireEvent.keyDown(source, { key: 'Enter', ctrlKey: true })
      vi.advanceTimersByTime(1000)
      expect((translate.run?.mock.calls ?? []).map((c) => (c[0] as { mode: string }).mode)).toEqual(
        ['translate'],
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('asks nothing while LIVE is off', async () => {
    vi.useFakeTimers()
    try {
      withLive(false)
      mount()
      await fireEvent.input(screen.getByTestId('translate-source'), { target: { value: 'Hello.' } })
      vi.advanceTimersByTime(2000)
      expect(translate.run).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('asks for the round trips of a finished run once, only while the pane is seen', async () => {
    withLive(false)
    const hidden = mount({ srcLang: 'en', roundTrip: true }, false)
    await hidden.send(runOf('Hello.'))
    expect(translate.roundTrip).not.toHaveBeenCalled()
    await hidden.view.rerender({ visible: true })
    await settle()
    expect(translate.roundTrip).toHaveBeenCalledTimes(1)
    expect(translate.roundTrip).toHaveBeenCalledWith(hidden.paneId, 'en')
    await hidden.send(runOf('Hello.'), 2)
    expect(translate.roundTrip).toHaveBeenCalledTimes(1)
  })

  it('says so when AUTO cannot tell what to go back into', async () => {
    withLive(false)
    const { send } = mount({ roundTrip: true })
    await send(runOf('Hi.'))
    expect(screen.getByTestId('translate-trip-needs-lang')).toBeTruthy()
    expect(translate.roundTrip).not.toHaveBeenCalled()
  })
})

describe('TEXT answering Ctrl+Shift+Y', () => {
  it('translates the clipboard’s text once, though TEXT mounts again with the same call', async () => {
    const first = mount({}, true, { seq: 1, text: 'Hi.' })
    await settle()
    expect(translate.run).toHaveBeenCalledTimes(1)
    expect(translate.run).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Hi.', mode: 'translate' }),
    )
    cleanup()
    // HISTORY and back: TEXT mounts afresh, the call is the same one.
    mount({}, true, { seq: 1, text: 'Hi.' }, first.follower)
    await settle()
    expect(translate.run).toHaveBeenCalledTimes(1)
  })

  it('opens an empty source for typing when the clipboard has no text', async () => {
    mount({}, true, { seq: 1, text: '' })
    await settle()
    expect(translate.run).not.toHaveBeenCalled()
    await settle()
    expect(document.activeElement).toBe(screen.getByTestId('translate-source'))
  })
})
