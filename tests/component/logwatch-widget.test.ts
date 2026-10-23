import type {
  LogExplainRequest,
  LogFileRef,
  LogLine,
  LogSubscribeRequest,
  LogWatchEvent,
} from '@shared/logwatch/types'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { finishAnimations, inertDom } from './support/dom.ts'
import { stubElecdex } from './support/elecdex.ts'
import { settle } from './support/settle.ts'

const { default: LogWatchWidget } = await import(
  '../../src/renderer/widgets/logwatch/LogWatchWidget.svelte'
)
const { default: LogExplain } = await import(
  '../../src/renderer/widgets/logwatch/LogExplain.svelte'
)
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')
const { defaultSettings } = await import('@shared/settings')

/**
 * The LOG WATCH pane over a stand-in for main: it follows a file only while seen, adds what is
 * delivered to what it shows, and offers EXPLAIN only with a provider in the AI settings.
 */

const ID = '0123456789abcdef'
const FILE: LogFileRef = {
  id: ID,
  name: 'app.log',
  folder: '~/logs',
  path: '/home/dev/logs/app.log',
  pattern: null,
  format: null,
}

let deliver: ((event: LogWatchEvent) => void) | null = null
let requests: LogSubscribeRequest[] = []
let subscriptions = 0
let describeAs: LogFileRef = FILE
let picks: boolean[] = []
let pickAnswer: unknown = null
let copies: string[] = []
let previews: LogExplainRequest[] = []

let seq = 0
const line = (text: string, level: LogLine['level'] = 'INF'): LogLine => ({
  kind: 'line',
  seq: seq++,
  at: Date.now(),
  timed: true,
  zoned: true,
  level,
  source: '',
  text,
  fields: [],
  more: [],
  moreCut: 0,
  raw: text,
  sig: `${level} ${text}`,
  fresh: false,
  cut: false,
})

const status = {
  state: 'reading' as const,
  problem: null,
  file: 'app.log',
  format: 'generic' as const,
  encoding: 'utf-8' as const,
  garbled: false,
  read: 100,
}

beforeEach(() => {
  copies = []
  previews = []
  deliver = null
  requests = []
  subscriptions = 0
  describeAs = FILE
  picks = []
  pickAnswer = null
  inertDom()
  // Cards power on and off through animate(): finished at once here, as in the Docker pane's tests.
  finishAnimations()
  stubElecdex({
    logwatch: {
      subscribe: (request: LogSubscribeRequest, handler: (event: LogWatchEvent) => void) => {
        subscriptions += 1
        requests.push(structuredClone(request))
        deliver = handler
        return () => {
          subscriptions -= 1
          deliver = null
        }
      },
      describe: async () => describeAs,
      pick: async (newest: boolean) => {
        picks.push(newest)
        return pickAnswer
      },
      recent: async () => [],
      onExplained: () => () => {},
      preview: async (request: LogExplainRequest) => {
        previews.push(structuredClone(request))
        return { text: 'the text', fits: true }
      },
    },
    system: { platform: 'win32' },
    utility: {
      copy: async (request: { text: string }) => {
        copies.push(request.text)
        return true
      },
    },
  })
})

afterEach(async () => {
  cleanup()
  Reflect.deleteProperty(Element.prototype, 'animate')
  vi.useRealTimers()
  vi.restoreAllMocks()
  await layout.flush()
  vi.unstubAllGlobals()
})

const texts = () =>
  screen.queryAllByTestId('logwatch-row').map((row) => row.querySelector('.msg')?.textContent)

describe('LogWatchWidget', () => {
  it('shows the whole path on the name of the file, and chooses another on a click', async () => {
    render(LogWatchWidget, {
      props: {
        paneId: `f${seq}`,
        title: 'log watch',
        props: {},
        state: { file: ID },
        active: true,
      },
    })
    await settle()
    deliver?.({ key: `${ID}/auto`, reset: true, items: [line('x')], status })
    await settle()
    const name = screen.getByTestId('logwatch-file')
    expect(name.textContent).toBe('app.log')
    // The card's timers on a fake clock (lib/hover-card.ts), the rest real.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    name.focus()
    await settle()
    expect(screen.getByTestId('logwatch-file-card').textContent).toContain('/home/dev/logs/app.log')
    pickAnswer = { problem: 'that is not a text file' }
    name.click()
    await settle()
    expect(picks).toEqual([false])
    expect(screen.getByTestId('logwatch-problem').textContent).toBe('that is not a text file')
    // A card closes a moment after it is left (lib/hover-card.ts), then powers off.
    await vi.advanceTimersByTimeAsync(400)
    await settle()
    expect(screen.queryByTestId('logwatch-file-card')).toBeNull()
  })

  it('chooses the newest like it again for a pane that follows a pattern', async () => {
    describeAs = {
      ...FILE,
      name: 'app-*.log',
      path: '/home/dev/logs/app-*.log',
      pattern: 'app-*.log',
    }
    render(LogWatchWidget, {
      props: {
        paneId: `g${seq}`,
        title: 'log watch',
        props: {},
        state: { file: ID },
        active: true,
      },
    })
    await settle()
    deliver?.({
      key: `${ID}/auto`,
      reset: true,
      items: [line('x')],
      status: { ...status, file: 'app-2.log' },
    })
    await settle()
    expect(screen.getByTestId('logwatch-file').textContent).toBe('app-2.log')
    screen.getByTestId('logwatch-file').click()
    await settle()
    expect(picks).toEqual([true])
  })

  it('lights ERROR BURST only once errors have come fast for two seconds, and lets it go', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    vi.setSystemTime(new Date(2026, 9, 12, 12, 0, 0, 100))
    try {
      render(LogWatchWidget, {
        props: {
          paneId: `b${seq}`,
          title: 'log watch',
          props: {},
          state: { file: ID },
          active: true,
        },
      })
      await settle()
      const errors = Array.from({ length: 8 }, (_, i) => ({
        ...line(`boom ${i}`, 'ERR'),
        at: Date.now(),
      }))
      deliver?.({ key: `${ID}/auto`, reset: true, items: errors, status })
      await settle()
      const lampText = () => screen.getByTestId('logwatch-lamp').textContent ?? ''
      expect(lampText()).toContain('LIVE')
      vi.advanceTimersByTime(1000)
      await settle()
      expect(lampText()).toContain('LIVE')
      vi.advanceTimersByTime(1000)
      await settle()
      expect(lampText()).toContain('ERROR BURST')
      // Fifteen seconds on, they are no longer recent: the lamp goes out at once.
      vi.advanceTimersByTime(16_000)
      await settle()
      expect(lampText()).toContain('LIVE')
    } finally {
      vi.useRealTimers()
    }
  })

  it('draws what is delivered, and what is added after', async () => {
    render(LogWatchWidget, {
      props: {
        paneId: `p${seq}`,
        title: 'log watch',
        props: {},
        state: { file: ID },
        active: true,
      },
    })
    await settle()
    expect(subscriptions).toBe(1)
    deliver?.({ key: `${ID}/auto`, reset: true, items: [line('first')], status })
    await settle()
    expect(texts()).toEqual(['first'])
    // Found in the running app: lines added to the held array in place were never drawn.
    deliver?.({ key: `${ID}/auto`, reset: false, items: [line('second', 'ERR')], status })
    await settle()
    expect(texts()).toEqual(['first', 'second'])
    expect(screen.getByTestId('logwatch-err').textContent).toBe('1')
  })

  it('follows the file only while it is seen, asking after what it holds', async () => {
    const view = render(LogWatchWidget, {
      props: {
        paneId: `q${seq}`,
        title: 'log watch',
        props: {},
        state: { file: ID, encoding: 'shift_jis' },
        active: true,
        visible: true,
      },
    })
    await settle()
    const held = line('held')
    deliver?.({ key: `${ID}/shift_jis`, reset: true, items: [held], status })
    await settle()
    await view.rerender({ visible: false })
    await settle()
    expect(subscriptions).toBe(0)
    await view.rerender({ visible: true })
    await settle()
    expect(subscriptions).toBe(1)
    expect(requests.at(-1)).toEqual({ id: ID, encoding: 'shift_jis', since: held.seq })
  })

  it('offers COPY for a chosen line, and EXPLAIN only with an AI provider', async () => {
    render(LogWatchWidget, {
      props: {
        paneId: `r${seq}`,
        title: 'log watch',
        props: {},
        state: { file: ID },
        active: true,
      },
    })
    await settle()
    deliver?.({ key: `${ID}/auto`, reset: true, items: [line('pick me')], status })
    await settle()
    screen.getByTestId('logwatch-row').click()
    await settle()
    expect(screen.getByTestId('logwatch-copy')).toBeTruthy()
    expect(screen.queryByTestId('logwatch-explain-open')).toBeNull()
    // Without a provider it says where one is set up, rather than not being there at all.
    expect(screen.getByTestId('logwatch-explain-setup').textContent).toContain('SET UP AI')
  })

  it('chooses several lines, copies only those, and clears the choice', async () => {
    render(LogWatchWidget, {
      props: {
        paneId: `m${seq}`,
        title: 'log watch',
        props: {},
        state: { file: ID },
        active: true,
      },
    })
    await settle()
    deliver?.({
      key: `${ID}/auto`,
      reset: true,
      items: [line('one'), line('two'), line('three'), line('four')],
      status,
    })
    await settle()
    const rows = () => screen.getAllByTestId('logwatch-row')
    await fireEvent.click(rows()[0] as HTMLElement)
    await fireEvent.click(rows()[2] as HTMLElement, { ctrlKey: true })
    expect(screen.getByTestId('logwatch-chosen').textContent).toContain('2 lines chosen')
    screen.getByTestId('logwatch-copy').click()
    await settle()
    expect(copies.at(-1)).toBe('one\nthree')
    await fireEvent.click(rows()[3] as HTMLElement, { shiftKey: true })
    expect(screen.getByTestId('logwatch-chosen').textContent).toContain('2 lines chosen')
    screen.getByTestId('logwatch-copy').click()
    await settle()
    expect(copies.at(-1)).toBe('three\nfour')
    screen.getByTestId('logwatch-clear').click()
    await settle()
    expect(screen.queryByTestId('logwatch-chosen')).toBeNull()
    expect(rows().some((row) => row.classList.contains('selected'))).toBe(false)
  })

  it('asks EXPLAIN of the provider the pane chose, leaving the fallback to main', async () => {
    // Found in review: the page sent the first provider when the pane's was gone, and main then
    // sent it the pane's model, meant for the other.
    appearance.settings = {
      ...defaultSettings(),
      sound: { enabled: false, volume: 0 },
      ai: {
        ...defaultSettings().ai,
        providers: [
          { id: 'p1', name: 'One', kind: 'openai', baseUrl: 'http://localhost:1/v1', model: 'm1' },
        ],
      },
    }
    try {
      render(LogWatchWidget, {
        props: {
          paneId: `e${seq}`,
          title: 'log watch',
          props: {},
          state: { file: ID, provider: 'gone', model: 'custom' },
          active: true,
        },
      })
      await settle()
      deliver?.({ key: `${ID}/auto`, reset: true, items: [line('ask me')], status })
      await settle()
      screen.getByTestId('logwatch-row').click()
      await settle()
      screen.getByTestId('logwatch-explain-open').click()
      await settle()
      expect(previews.at(-1)).toMatchObject({ provider: 'gone', model: 'custom' })
      // Named as main will ask: the first provider, with its own model, not the pane's.
      expect(screen.getByTestId('logwatch-explain').textContent).toContain('One · m1')
    } finally {
      appearance.settings = defaultSettings()
    }
  })

  it('holds the stream on PAUSE, counting what is held, and lets it all go after', async () => {
    render(LogWatchWidget, {
      props: {
        paneId: `s${seq}`,
        title: 'log watch',
        props: {},
        state: { file: ID },
        active: true,
      },
    })
    await settle()
    deliver?.({ key: `${ID}/auto`, reset: true, items: [line('before')], status })
    await settle()
    screen.getByTestId('logwatch-pause').click()
    await settle()
    deliver?.({ key: `${ID}/auto`, reset: false, items: [line('during'), line('also')], status })
    await settle()
    expect(texts()).toEqual(['before'])
    expect(screen.getByTestId('logwatch-lamp').textContent).toContain('PAUSED · 2 HELD')
    screen.getByTestId('logwatch-pause').click()
    await settle()
    expect(texts()).toEqual(['before', 'during', 'also'])
  })
})

describe('LogWatchWidget, from the review', () => {
  const mount = (id: string) =>
    render(LogWatchWidget, {
      props: { paneId: id, title: 'log watch', props: {}, state: { file: ID }, active: true },
    })

  it('says it waits for a file that is not there yet', async () => {
    mount(`w${seq}`)
    await settle()
    deliver?.({
      key: `${ID}/auto`,
      reset: true,
      items: [],
      status: { ...status, state: 'waiting' },
    })
    await settle()
    expect(screen.getByTestId('logwatch-empty').textContent).toContain('waiting for the file')
  })

  it('empties the filter on Escape', async () => {
    mount(`f${seq}`)
    await settle()
    deliver?.({ key: `${ID}/auto`, reset: true, items: [line('one'), line('two')], status })
    await settle()
    const filter = screen.getByTestId('logwatch-filter') as HTMLInputElement
    await fireEvent.input(filter, { target: { value: 'one' } })
    await settle()
    expect(screen.getAllByTestId('logwatch-row')).toHaveLength(1)
    await fireEvent.keyDown(filter, { key: 'Escape' })
    await settle()
    expect(filter.value).toBe('')
    expect(screen.getAllByTestId('logwatch-row')).toHaveLength(2)
  })

  it('takes the garbled notice to the encoding itself', async () => {
    mount(`g${seq}`)
    await settle()
    deliver?.({
      key: `${ID}/auto`,
      reset: true,
      items: [line('Ã©')],
      status: { ...status, garbled: true },
    })
    await settle()
    screen.getByTestId('logwatch-garbled').click()
    await settle()
    expect(document.activeElement).toBe(screen.getByTestId('logwatch-encoding'))
  })

  it('reads the file again when the dialect main reads it in changes', async () => {
    // Found in review: a format set by hand in another pane left this one saying "detected".
    let asked = 0
    const before = describeAs
    describeAs = { ...FILE, format: null }
    const counting = window.elecdex.logwatch.describe
    window.elecdex.logwatch.describe = async (id: string) => {
      asked++
      return counting(id)
    }
    mount(`h${seq}`)
    await settle()
    deliver?.({ key: `${ID}/auto`, reset: true, items: [line('one')], status })
    await settle()
    const first = asked
    describeAs = { ...FILE, format: 'jsonl' }
    deliver?.({
      key: `${ID}/auto`,
      reset: true,
      items: [line('one')],
      status: { ...status, format: 'jsonl' },
    })
    await settle()
    expect(asked).toBeGreaterThan(first)
    screen.getByTestId('logwatch-settings-toggle').click()
    await settle()
    expect((screen.getByTestId('logwatch-format') as HTMLSelectElement).value).toBe('jsonl')
    describeAs = before
  })
})

describe('LogWatchWidget, what the running app once showed', () => {
  /** The state the pane is given, and every change it asks the layout for. */
  const mount = (id: string, state: Record<string, unknown> = { file: ID }) => {
    const patches: Record<string, unknown>[] = []
    vi.spyOn(layout, 'patchPaneState').mockImplementation((_pane, change) => {
      patches.push(change as Record<string, unknown>)
    })
    const view = render(LogWatchWidget, {
      props: { paneId: id, title: 'log watch', props: {}, state, active: true },
    })
    return { view, patches }
  }

  it('asks for the file again for an id this machine does not know, and follows nothing', async () => {
    describeAs = null as unknown as LogFileRef
    mount(`u${seq}`, { file: 'abcdefabcdefabcd' })
    await settle()
    expect(screen.getByTestId('logwatch-choose').textContent).toContain('not known on this machine')
    expect(subscriptions).toBe(0)
  })

  it('a click on the name of the file follows the one chosen, and nothing changes without one', async () => {
    const { patches } = mount(`n${seq}`)
    await settle()
    deliver?.({ key: `${ID}/auto`, reset: true, items: [line('x')], status })
    await settle()
    // Closed without a choice.
    pickAnswer = null
    screen.getByTestId('logwatch-file').click()
    await settle()
    expect(picks).toEqual([false])
    expect(patches).toEqual([])
    expect(screen.queryByTestId('logwatch-problem')).toBeNull()
    pickAnswer = { file: { ...FILE, id: 'fedcba9876543210', name: 'other.log' } }
    screen.getByTestId('logwatch-file').click()
    await settle()
    expect(patches.at(-1)).toStrictEqual({ file: 'fedcba9876543210', muted: undefined })
  })

  it('follows the file in the encoding chosen after the garbled notice', async () => {
    const { view, patches } = mount(`k${seq}`, { file: ID, encoding: 'utf-8' })
    await settle()
    expect(requests.at(-1)?.encoding).toBe('utf-8')
    deliver?.({
      key: `${ID}/utf-8`,
      reset: true,
      items: [line('Ú')],
      status: { ...status, garbled: true },
    })
    await settle()
    screen.getByTestId('logwatch-garbled').click()
    await settle()
    const encoding = screen.getByTestId('logwatch-encoding') as HTMLSelectElement
    await fireEvent.change(encoding, { target: { value: 'auto' } })
    expect(patches.at(-1)).toStrictEqual({ encoding: undefined })
    // The layout gives the pane its new state: it follows the file afresh, in that encoding.
    await view.rerender({ state: { file: ID } })
    await settle()
    expect(requests.at(-1)?.encoding).toBe('auto')
    deliver?.({
      key: `${ID}/auto`,
      reset: true,
      items: [line('接続に失敗しました')],
      status: { ...status, encoding: 'shift_jis' },
    })
    await settle()
    expect(texts()).toEqual(['接続に失敗しました'])
    expect(screen.getByTestId('logwatch-where').textContent).toContain('auto · Shift_JIS')
    expect(screen.queryByTestId('logwatch-garbled')).toBeNull()
  })

  it('reads in a dialect set by hand, and shows times as asked', async () => {
    const setFormat = vi.fn(async () => true)
    window.elecdex.logwatch.setFormat = setFormat
    const { view, patches } = mount(`d${seq}`)
    await settle()
    deliver?.({ key: `${ID}/auto`, reset: true, items: [line('one')], status })
    await settle()
    screen.getByTestId('logwatch-settings-toggle').click()
    await settle()
    await fireEvent.change(screen.getByTestId('logwatch-format'), { target: { value: 'plain' } })
    expect(setFormat).toHaveBeenCalledWith(ID, 'plain')
    ;(document.querySelector('[data-testid=logwatch-time][data-value=rel]') as HTMLElement).click()
    expect(patches.at(-1)).toEqual({ time: 'rel' })
    await view.rerender({ state: { file: ID, time: 'rel' } })
    await settle()
    expect(screen.getByTestId('logwatch-row').querySelector('.t')?.textContent).toContain('ago')
  })

  it('chooses a run with Shift, and copies and explains only the chosen lines still shown', async () => {
    appearance.settings = {
      ...defaultSettings(),
      sound: { enabled: false, volume: 0 },
      ai: {
        ...defaultSettings().ai,
        providers: [
          { id: 'p', name: 'P', kind: 'openai', baseUrl: 'http://localhost:1/v1', model: 'm' },
        ],
      },
    }
    try {
      const { view, patches } = mount(`v${seq}`)
      await settle()
      const items = [line('one'), line('two', 'ERR'), line('three'), line('four')]
      deliver?.({ key: `${ID}/auto`, reset: true, items, status })
      await settle()
      const row = (text: string) =>
        screen
          .getAllByTestId('logwatch-row')
          .find((r) => r.querySelector('.msg')?.textContent === text) as HTMLElement
      await fireEvent.click(row('one'))
      await fireEvent.click(row('three'), { shiftKey: true })
      expect(screen.getByTestId('logwatch-chosen').textContent).toContain('3 lines chosen')
      // ERR switched off: the chosen line it hides is neither copied nor sent.
      ;(
        screen
          .getAllByTestId('logwatch-level')
          .find((b) => b.textContent?.includes('ERR')) as HTMLElement
      ).click()
      const hidden = patches.at(-1)?.hidden
      expect(hidden).toContain('ERR')
      await view.rerender({ state: { file: ID, hidden } })
      await settle()
      expect(screen.getByTestId('logwatch-chosen').textContent).toContain('2 lines chosen')
      screen.getByTestId('logwatch-copy').click()
      await settle()
      expect(copies.at(-1)).toBe('one\nthree')
      screen.getByTestId('logwatch-explain-open').click()
      await settle()
      expect(previews.at(-1)?.seqs).toEqual([items[0]?.seq, items[2]?.seq])
    } finally {
      appearance.settings = defaultSettings()
    }
  })

  it('EXPLAIN on another line while the panel is open asks about that one alone', async () => {
    appearance.settings = {
      ...defaultSettings(),
      sound: { enabled: false, volume: 0 },
      ai: {
        ...defaultSettings().ai,
        providers: [
          { id: 'p', name: 'P', kind: 'openai', baseUrl: 'http://localhost:1/v1', model: 'm' },
        ],
      },
    }
    try {
      mount(`x${seq}`)
      await settle()
      const first = line('first trouble', 'ERR')
      const second = line('second trouble', 'WRN')
      deliver?.({ key: `${ID}/auto`, reset: true, items: [first, second], status })
      await settle()
      const row = (n: number) => screen.getAllByTestId('logwatch-row')[n] as HTMLElement
      await fireEvent.click(row(0))
      screen.getByTestId('logwatch-explain-open').click()
      await settle()
      expect(previews.at(-1)?.seqs).toEqual([first.seq])
      await fireEvent.click(row(1))
      screen.getByTestId('logwatch-explain-open').click()
      await settle()
      // A plain click chose that line alone: the first is no longer sent.
      expect(previews.at(-1)?.seqs).toEqual([second.seq])
      expect(screen.getAllByTestId('logwatch-explain')).toHaveLength(1)
    } finally {
      appearance.settings = defaultSettings()
    }
  })
})

describe('LogExplain', () => {
  it('says a choice is too long before SEND, and offers no SEND', async () => {
    // Found in review: the refusal came only from main, after SEND was pressed.
    vi.stubGlobal('elecdex', {
      logwatch: {
        preview: async () => ({ text: 'x'.repeat(20), fits: false }),
        onExplained: () => () => {},
        explain: vi.fn(),
        cancelExplain: () => {},
      },
    })
    render(LogExplain, {
      props: {
        request: { id: ID, encoding: 'auto', seqs: [1, 2], provider: '', model: '', mask: true },
        to: 'Local · m',
        onclose: () => {},
      },
    })
    await settle()
    expect(screen.getByTestId('logwatch-explain-too-long').textContent).toContain(
      'too long to send',
    )
    expect(screen.queryByTestId('logwatch-explain-send')).toBeNull()
  })

  it('keeps an answer that ends before the press is answered', async () => {
    // Found in review: a provider failing at once could send its last word before main's answer
    // to SEND, and the panel then said WRITING for ever.
    let hear: ((event: unknown) => void) | null = null
    vi.stubGlobal('elecdex', {
      logwatch: {
        preview: async () => ({ text: 'the text', fits: true }),
        onExplained: (handler: (event: unknown) => void) => {
          hear = handler
          return () => {}
        },
        explain: async () => {
          hear?.({
            token: 'tok-1',
            text: '',
            done: true,
            failure: 'no carrier: refused',
            provider: 'Local',
            model: 'm',
          })
          return { token: 'tok-1' }
        },
        cancelExplain: () => {},
      },
    })
    render(LogExplain, {
      props: {
        request: { id: ID, encoding: 'auto', seqs: [1], provider: '', model: '', mask: false },
        to: 'Local · m',
        onclose: () => {},
      },
    })
    await settle()
    screen.getByTestId('logwatch-explain-send').click()
    await settle()
    expect(screen.getByTestId('logwatch-explain-failure').textContent).toContain(
      'no carrier: refused',
    )
    expect(screen.queryByTestId('logwatch-explain-stop')).toBeNull()
  })
})
