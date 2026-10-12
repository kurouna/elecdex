import type {
  LogFileRef,
  LogLine,
  LogSubscribeRequest,
  LogWatchEvent,
} from '@shared/logwatch/types'
import { cleanup, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: LogWatchWidget } = await import(
  '../../src/renderer/widgets/logwatch/LogWatchWidget.svelte'
)
const { default: LogExplain } = await import(
  '../../src/renderer/widgets/logwatch/LogExplain.svelte'
)
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The LOG WATCH pane over a stand-in for main: it follows a file only while seen, adds what is
 * delivered to what it shows, and offers EXPLAIN only with a provider in the AI settings.
 */

const ID = '0123456789abcdef'
const FILE: LogFileRef = { id: ID, name: 'app.log', folder: '~/logs', pattern: null, format: null }

let deliver: ((event: LogWatchEvent) => void) | null = null
let requests: LogSubscribeRequest[] = []
let subscriptions = 0

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
  deliver = null
  requests = []
  subscriptions = 0
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
      describe: async () => FILE,
      recent: async () => [],
      onExplained: () => () => {},
    },
    layout: { save: vi.fn(async () => {}) },
  })
})

afterEach(async () => {
  cleanup()
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
        request: { id: ID, encoding: 'auto', seq: 1, provider: '', model: '', mask: false },
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
