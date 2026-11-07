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
  fetchingModel: null,
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
    clear: vi.fn(),
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

  it('clears the translation with the source: main puts the run away and the page shows none', async () => {
    const { paneId, send } = mount()
    await send(runOf('Hello.'))
    expect(screen.getAllByTestId('translate-block')).toHaveLength(1)
    await fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(translate.clear).toHaveBeenCalledWith(paneId)
    // Main's answer: the run put away.
    handler?.({ paneId, seq: 2, kind: 'snapshot', run: null, cleared: true })
    await settle()
    expect(screen.queryAllByTestId('translate-block')).toHaveLength(0)
    expect(screen.getByTestId('translate-standby')).toBeTruthy()
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

  it('joins a block on the spine once it is translated, never while it waits', async () => {
    const { send } = mount()
    const run = runOf('One.\n\nTwo.')
    const first = run.blocks[0] as RunView['blocks'][number]
    const two = (state: 'queued' | 'done'): RunView => ({
      ...run,
      state: state === 'done' ? 'done' : 'running',
      blocks: [
        first,
        {
          ...first,
          index: 1,
          lead: '\n\n',
          source: 'Two.',
          text: state === 'done' ? '二' : '',
          state,
        },
      ],
    })
    // The spine is laid out on a timer of its own, after the DOM has the change.
    const laidOut = async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      await settle()
    }
    await send(two('queued'))
    await laidOut()
    expect(screen.getAllByTestId('translate-node')).toHaveLength(1)
    await send(two('done'), 2)
    await laidOut()
    expect(screen.getAllByTestId('translate-node')).toHaveLength(2)
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

describe('TEXT and what it offers (review 2026-11-07)', () => {
  it('offers the form only into Japanese', async () => {
    const { view } = mount({ tgtLang: 'ja' })
    expect(screen.queryByTestId('translate-form')).not.toBeNull()
    await view.rerender({ paneState: { tgtLang: 'en' } })
    expect(screen.queryByTestId('translate-form')).toBeNull()
  })

  it('offers RESTART, not Ctrl+Enter, when a run stopped and the engine is at fault', async () => {
    const restart = vi.fn(async () => undefined)
    translate.engineRestart = restart
    const faulted = {
      ...board,
      engine: { ...board.engine, phase: 'fault', error: 'crashed' },
    } as unknown as TranslateBoard
    const { send, view } = mount()
    await view.rerender({ board: faulted })
    await send({ ...runOf('A.'), state: 'stopped', reason: 'The engine stopped: crashed.' })
    const reason = screen.getByTestId('translate-reason')
    expect(reason.textContent).not.toContain('Ctrl+Enter')
    await fireEvent.click(screen.getByTestId('translate-reason-restart'))
    expect(restart).toHaveBeenCalled()
  })

  it('says a download under way at NO MODEL', async () => {
    const absent = {
      ...board,
      engine: { ...board.engine, phase: 'absent' },
      fetch: {
        kind: 'model',
        id: 'm',
        phase: 'paused',
        received: 3e9,
        total: 5.28e9,
        speed: 0,
        error: null,
      },
    } as unknown as TranslateBoard
    const { view } = mount()
    await view.rerender({ board: absent })
    expect(screen.getByTestId('translate-standby-fetch').textContent).toContain(
      'paused at 3.00 GB of 5.28 GB',
    )
    expect(screen.getByTestId('translate-setup-open').textContent).toContain(
      'go on with the download',
    )
  })

  it('does not swap the languages while a translation is written', async () => {
    const { send } = mount({ srcLang: 'en', tgtLang: 'ja' })
    await send(runOf('A.', 'running'))
    expect((screen.getByTestId('translate-swap') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('TEXT’s round trip score', () => {
  const scored = (score: number, lang: string): RunView => {
    const run = runOf('One.')
    const block = run.blocks[0] as RunView['blocks'][number]
    return { ...run, blocks: [{ ...block, trip: { text: 'back', state: 'done', score, lang } }] }
  }
  const low = () => screen.getByTestId('translate-trip-score').classList.contains('low')

  it('is said in the warning colour under its language’s line: 50, or 30 written without spaces', async () => {
    const { send } = mount()
    await send(scored(40, 'en'))
    expect(low()).toBe(true)
    await send(scored(40, 'ja'), 2)
    expect(low()).toBe(false)
    await send(scored(25, 'ja'), 3)
    expect(low()).toBe(true)
  })

  it('says numbers that changed, whatever the score', async () => {
    const { send } = mount()
    const run = runOf('予算は五千万円です')
    const block = run.blocks[0] as RunView['blocks'][number]
    const back = (text: string): RunView => ({
      ...run,
      blocks: [{ ...block, trip: { text, state: 'done', score: 74, lang: 'ja' } }],
    })
    await send(back('予算は500万円です'))
    expect(screen.getByTestId('translate-trip-numbers').textContent).toBe('numbers differ')
    expect(low()).toBe(true)
    await send(back('予算は5000万円です'), 2)
    expect(screen.queryByTestId('translate-trip-numbers')).toBeNull()
    expect(low()).toBe(false)
  })
})

describe('TEXT opening the editor from the blocks (user’s report 2026-11-06)', () => {
  const twoBlocks = (): RunView => {
    const run = runOf('First block.')
    const first = run.blocks[0] as RunView['blocks'][number]
    return {
      ...run,
      blocks: [first, { ...first, index: 1, lead: '\n\n', source: 'Second block.' }],
    }
  }
  const textNodeOf = (index: number): Text => {
    const seg = screen
      .getByTestId('translate-source-blocks')
      .querySelector(`.seg[data-i="${index}"]`) as HTMLElement
    return seg.firstChild as Text
  }
  const opened = async () => {
    await settle()
    return screen.getByTestId('translate-source') as HTMLTextAreaElement
  }

  it('puts the caret where the click landed, never at the end', async () => {
    const { send } = mount()
    await send(twoBlocks())
    // A click leaves a caret in the text where it landed: "Second |block."
    window.getSelection()?.collapse(textNodeOf(1), 7)
    await fireEvent.click(textNodeOf(1).parentElement as HTMLElement)
    const area = await opened()
    // "First block." + "\n\n" + "Second " = 21.
    expect(area.selectionStart).toBe(21)
    expect(area.selectionEnd).toBe(21)
    expect(document.activeElement).toBe(area)
  })

  it('keeps a selection dragged across blocks, and its direction', async () => {
    const { send } = mount()
    await send(twoBlocks())
    const selection = window.getSelection()
    selection?.setBaseAndExtent(textNodeOf(1), 6, textNodeOf(0), 6)
    await fireEvent.click(textNodeOf(1).parentElement as HTMLElement)
    const area = await opened()
    expect([area.selectionStart, area.selectionEnd]).toEqual([6, 20])
    expect(area.selectionDirection).toBe('backward')
  })

  it('opens at the start of the first block in view from the keyboard', async () => {
    const { send } = mount()
    await send(twoBlocks())
    await fireEvent.keyDown(screen.getByTestId('translate-source-blocks'), { key: 'Enter' })
    const area = await opened()
    expect(area.selectionStart).toBe(0)
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

  it('asks nothing LIVE once the pane is out of sight, though typed just before', async () => {
    // Review 2026-11-07: the 0.6 s wait went on unseen and asked, booting the engine.
    vi.useFakeTimers()
    try {
      withLive(true)
      const { view } = mount()
      await fireEvent.input(screen.getByTestId('translate-source'), { target: { value: 'Hello.' } })
      vi.advanceTimersByTime(300)
      await view.rerender({ visible: false })
      vi.advanceTimersByTime(1000)
      expect(translate.run).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('asks LIVE again for a new target language, whatever asked the last translation', async () => {
    vi.useFakeTimers()
    try {
      withLive(true)
      const { view, send } = mount({ tgtLang: 'ja' })
      await fireEvent.input(screen.getByTestId('translate-source'), { target: { value: 'Hello.' } })
      vi.advanceTimersByTime(600)
      // The last one was a TRANSLATE (Ctrl+Enter): LIVE still follows the language.
      await send(runOf('Hello.'))
      translate.run?.mockClear()
      await view.rerender({ paneState: { tgtLang: 'fr' } })
      vi.advanceTimersByTime(600)
      expect(translate.run).toHaveBeenLastCalledWith(expect.objectContaining({ tgtLang: 'fr' }))
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
