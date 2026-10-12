import type {
  LogExplainRequest,
  LogFileRef,
  LogLine,
  LogSubscribeRequest,
  LogWatchEvent,
} from '@shared/logwatch/types'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  // Cards power on and off through animate(): finished at once here, as in the Docker pane's tests.
  Element.prototype.getAnimations ??= () => []
  Element.prototype.animate = function animate(_frames, options) {
    const animation = { onfinish: null as (() => void) | null, cancel() {}, currentTime: 0 }
    const length = typeof options === 'number' ? options : Number(options?.duration ?? 0)
    setTimeout(() => animation.onfinish?.(), length)
    return animation as unknown as Animation
  }
  vi.stubGlobal('elecdex', {
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
        return 'the text'
      },
    },
    layout: { save: vi.fn(async () => {}) },
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
  vi.restoreAllMocks()
  await layout.flush()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
}

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
    name.focus()
    await settle()
    expect(screen.getByTestId('logwatch-file-card').textContent).toContain('/home/dev/logs/app.log')
    pickAnswer = { problem: 'that is not a text file' }
    name.click()
    await settle()
    expect(picks).toEqual([false])
    expect(screen.getByTestId('logwatch-problem').textContent).toBe('that is not a text file')
    // A card closes a moment after it is left (lib/hover-card.ts), then powers off.
    await new Promise((resolve) => setTimeout(resolve, 400))
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

describe('LogExplain', () => {
  it('keeps an answer that ends before the press is answered', async () => {
    // Found in review: a provider failing at once could send its last word before main's answer
    // to SEND, and the panel then said WRITING for ever.
    let hear: ((event: unknown) => void) | null = null
    vi.stubGlobal('elecdex', {
      logwatch: {
        preview: async () => 'the text',
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
