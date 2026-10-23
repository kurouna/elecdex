import type { AiProvider } from '@shared/ai'
import type { LogLine } from '@shared/logwatch/types'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { inertDom } from './support/dom.ts'
import { settle } from './support/settle.ts'

const { default: LogStream } = await import('../../src/renderer/widgets/logwatch/LogStream.svelte')
const { default: LogPatterns } = await import(
  '../../src/renderer/widgets/logwatch/LogPatterns.svelte'
)
const { default: LogSettings } = await import(
  '../../src/renderer/widgets/logwatch/LogSettings.svelte'
)
const { default: LogLineCard } = await import(
  '../../src/renderer/widgets/logwatch/LogLineCard.svelte'
)
const view = await import('../../src/renderer/widgets/logwatch/view.ts')

/**
 * LOG WATCH's parts on their own: the stream (rows, traces, following and what came below,
 * the error bar), the PATTERNS tab, the settings and the card - what each draws and what each
 * press asks for.
 */

let seq = 0
const NOW = Date.UTC(2026, 9, 12, 3, 0, 0)
const line = (text: string, extra: Partial<LogLine> = {}): LogLine => ({
  kind: 'line',
  seq: seq++,
  at: NOW,
  timed: true,
  zoned: true,
  level: 'INF',
  source: 'api',
  text,
  fields: [],
  more: [],
  moreCut: 0,
  raw: text,
  sig: `INF api ${text}`,
  fresh: false,
  cut: false,
  ...extra,
})

const ALL = { hidden: new Set<never>(), muted: new Set<string>(), match: null, fold: true }
const rows = (lines: LogLine[]) => view.buildRows(lines, ALL)

beforeEach(() => {
  inertDom()
  Element.prototype.getAnimations ??= () => []
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const streamProps = (overrides: Record<string, unknown> = {}) => ({
  rows: rows([
    line('GET /a 200'),
    line('mail to rin@example.com failed', {
      level: 'ERR',
      more: ['  at a', '  at b'],
      moreCut: 3,
    }),
  ]),
  time: 'abs' as const,
  now: NOW,
  wrap: false,
  errorBar: true,
  mask: false,
  match: null,
  chosen: new Set<number>(),
  onselect: vi.fn(),
  onhover: vi.fn(),
  ...overrides,
})

describe('LogStream', () => {
  it('draws each row with its level, and masks what MASK hides', async () => {
    render(LogStream, { props: streamProps({ mask: true }) })
    await settle()
    const drawn = screen.getAllByTestId('logwatch-row')
    expect(drawn.map((row) => row.dataset.level)).toEqual(['INF', 'ERR'])
    expect(drawn[1]?.textContent).toContain('mail to ••• failed')
    expect(drawn[1]?.textContent).not.toContain('example.com')
  })

  it('marks what the filter matched', async () => {
    render(LogStream, { props: streamProps({ match: /mail/ }) })
    await settle()
    expect(screen.getAllByTestId('logwatch-row')[1]?.querySelector('mark')?.textContent).toBe(
      'mail',
    )
  })

  it('opens a trace with the lines past those kept counted, and closes it again', async () => {
    render(LogStream, { props: streamProps({ mask: true }) })
    await settle()
    const more = screen.getByTestId('logwatch-more')
    expect(more.textContent).toContain('+5')
    await fireEvent.click(more)
    expect(screen.getByTestId('logwatch-trace').textContent).toBe('  at a\n  at b\n… 3 more lines')
    await fireEvent.click(screen.getByTestId('logwatch-more'))
    expect(screen.queryByTestId('logwatch-trace')).toBeNull()
  })

  it('chooses rows by a click or Enter, adding with Ctrl or ⌘, a run with Shift', async () => {
    const props = streamProps()
    const { rerender } = render(LogStream, { props })
    await settle()
    const [first] = screen.getAllByTestId('logwatch-row')
    const row = first as HTMLElement
    await fireEvent.click(row)
    await fireEvent.keyDown(row, { key: 'Enter' })
    await fireEvent.click(row, { ctrlKey: true })
    await fireEvent.click(row, { metaKey: true })
    await fireEvent.click(row, { shiftKey: true })
    await fireEvent.keyDown(row, { key: ' ', shiftKey: true })
    expect(props.onselect.mock.calls.map((call) => call[1])).toEqual([
      'one',
      'one',
      'toggle',
      'toggle',
      'range',
      'range',
    ])
    await rerender({ chosen: new Set([props.rows[0]?.item.seq ?? -1]) })
    expect(screen.getAllByTestId('logwatch-row')[0]?.classList.contains('selected')).toBe(true)
  })

  it('counts what came below while the pointer is over it, and goes to the end on a press', async () => {
    const first = rows([line('one')])
    const { rerender } = render(LogStream, { props: streamProps({ rows: first }) })
    await settle()
    await fireEvent.pointerEnter(screen.getByTestId('logwatch-stream'))
    await settle()
    await rerender({
      rows: rows([
        ...first.map((r) => r.item as LogLine),
        line('two'),
        line('three', { level: 'ERR' }),
      ]),
    })
    await settle()
    const follow = screen.getByTestId('logwatch-follow')
    expect(follow.textContent).toContain('2 NEW')
    expect(follow.textContent).toContain('1 ERR')
    await fireEvent.click(follow)
    await settle()
    expect(screen.queryByTestId('logwatch-follow')).toBeNull()
  })

  it('draws the error bar only when asked, a mark for each error or warning', async () => {
    const { rerender } = render(LogStream, { props: streamProps() })
    await settle()
    expect(screen.getByTestId('logwatch-errorbar').querySelectorAll('i')).toHaveLength(1)
    await rerender({ errorBar: false })
    expect(screen.queryByTestId('logwatch-errorbar')).toBeNull()
  })

  it('folds repeats into ×n and says NEW for a first sighting', async () => {
    render(LogStream, {
      props: streamProps({
        rows: rows([line('same', { fresh: true }), line('same'), line('same')]),
      }),
    })
    await settle()
    expect(screen.getByTestId('logwatch-reps').textContent).toBe('×3')
    expect(screen.getByTestId('logwatch-new')).toBeTruthy()
  })
})

describe('LogPatterns', () => {
  it('lists patterns, mutes one by its signature, and says when there are none', async () => {
    const ontoggle = vi.fn()
    const patterns = view.tallyPatterns(
      [
        line('GET /a 200', { sig: 'INF api GET {path} {n}' }),
        line('boom', { level: 'ERR', sig: 'ERR worker boom' }),
      ],
      NOW,
    )
    const { rerender } = render(LogPatterns, {
      props: { patterns, muted: new Set<string>(), now: NOW, mask: false, ontoggle },
    })
    const listed = screen.getAllByTestId('logwatch-pattern')
    expect(listed).toHaveLength(2)
    expect(listed[0]?.textContent).toContain('boom')
    await fireEvent.click(screen.getAllByTestId('logwatch-mute')[1] as HTMLElement)
    expect(ontoggle).toHaveBeenCalledWith('INF api GET {path} {n}')
    await rerender({ muted: new Set(['ERR worker boom']) })
    expect(screen.getAllByTestId('logwatch-pattern')[0]?.classList.contains('muted')).toBe(true)
    expect(screen.getAllByTestId('logwatch-mute')[0]?.textContent).toBe('UNMUTE')
    await rerender({ patterns: [] })
    expect(screen.getByText('no lines held yet')).toBeTruthy()
  })

  it('masks the source too while MASK is on', () => {
    // Found in review: the stream and the card masked a source, this tab did not.
    const patterns = view.tallyPatterns(
      [line('sent', { source: 'mailer rin@example.com', sig: 'INF mailer sent' })],
      NOW,
    )
    render(LogPatterns, {
      props: { patterns, muted: new Set<string>(), now: NOW, mask: true, ontoggle: vi.fn() },
    })
    expect(screen.getByTestId('logwatch-pattern').textContent).not.toContain('example.com')
  })
})

describe('LogSettings', () => {
  const providers = [
    { id: 'p1', name: 'Local', kind: 'openai', baseUrl: 'http://127.0.0.1/v1', model: 'small' },
    { id: 'p2', name: 'Other', kind: 'openai', baseUrl: 'http://127.0.0.1/v1', model: 'big' },
  ] as AiProvider[]
  const settings = (overrides: Record<string, unknown> = {}) => {
    const props = {
      file: {
        id: '0123456789abcdef',
        name: 'app.log',
        folder: '~/logs',
        path: '/home/dev/logs/app.log',
        pattern: null,
        format: null,
      },
      choices: view.readLogPane({}),
      format: null,
      detected: 'jsonl' as const,
      keepLines: 5000,
      initialLines: 500,
      providers: [] as AiProvider[],
      onpane: vi.fn(),
      onformat: vi.fn(),
      onapp: vi.fn(),
      onchoose: vi.fn(),
      onsetupai: vi.fn(),
      ...overrides,
    }
    render(LogSettings, { props })
    return props
  }

  it('changes the pane’s own choices, writing nothing for a default', async () => {
    const props = settings()
    const time = (value: string) =>
      screen.getAllByTestId('logwatch-time').find((b) => b.dataset.value === value) as HTMLElement
    await fireEvent.click(time('rel'))
    await fireEvent.click(time('abs'))
    await fireEvent.click(screen.getByTestId('logwatch-chart-off'))
    await fireEvent.click(screen.getByTestId('logwatch-errorBar-on'))
    await fireEvent.change(screen.getByTestId('logwatch-encoding'), {
      target: { value: 'shift_jis' },
    })
    await fireEvent.change(screen.getByTestId('logwatch-encoding'), { target: { value: 'auto' } })
    expect(props.onpane.mock.calls.map((c) => c[0])).toEqual([
      { time: 'rel' },
      { time: undefined },
      { chart: false },
      { errorBar: undefined },
      { encoding: 'shift_jis' },
      { encoding: undefined },
    ])
  })

  it('sets the file’s dialect, every pane’s settings, and asks for another file', async () => {
    const props = settings()
    expect(
      (screen.getByTestId('logwatch-format') as HTMLSelectElement).options[0]?.textContent,
    ).toBe('auto · JSON lines')
    await fireEvent.change(screen.getByTestId('logwatch-format'), { target: { value: 'syslog' } })
    await fireEvent.change(screen.getByTestId('logwatch-format'), { target: { value: 'auto' } })
    expect(props.onformat.mock.calls.map((c) => c[0])).toEqual(['syslog', null])
    await fireEvent.click(
      screen
        .getAllByTestId('logwatch-keep')
        .find((b) => b.dataset.value === '20000') as HTMLElement,
    )
    await fireEvent.click(
      screen
        .getAllByTestId('logwatch-initial')
        .find((b) => b.dataset.value === '2000') as HTMLElement,
    )
    expect(props.onapp.mock.calls.map((c) => c[0])).toEqual([
      { keepLines: 20000 },
      { initialLines: 2000 },
    ])
    // The whole path beside ANOTHER FILE, which file it is never in doubt.
    expect(screen.getByTestId('logwatch-settings-path').textContent).toBe('/home/dev/logs/app.log')
    await fireEvent.click(screen.getByTestId('logwatch-change'))
    expect(props.onchoose).toHaveBeenCalled()
  })

  it('offers EXPLAIN’s provider and model only with providers', async () => {
    const bare = settings()
    expect(screen.queryByTestId('logwatch-provider')).toBeNull()
    // Without a provider, it says where one is set up.
    await fireEvent.click(screen.getByTestId('logwatch-setup-ai'))
    expect(bare.onsetupai).toHaveBeenCalled()
    cleanup()
    const props = settings({ providers })
    expect((screen.getByTestId('logwatch-model') as HTMLInputElement).placeholder).toBe('small')
    await fireEvent.change(screen.getByTestId('logwatch-provider'), { target: { value: 'p2' } })
    await fireEvent.change(screen.getByTestId('logwatch-model'), { target: { value: '  big-2 ' } })
    await fireEvent.change(screen.getByTestId('logwatch-model'), { target: { value: '' } })
    // The pane's choices are not given back here, so the first provider is still the one shown:
    // a model is kept with the provider shown, which is the only one main sends it to.
    expect(props.onpane.mock.calls.map((c) => c[0])).toEqual([
      { provider: 'p2', model: undefined },
      { provider: 'p1', model: 'big-2' },
      { provider: 'p1', model: undefined },
    ])
  })

  it('shows a model typed for another provider as nothing, as main would not send it', () => {
    // Found in review: a model kept with a provider since removed was shown with the first.
    settings({ providers, choices: view.readLogPane({ provider: 'gone', model: 'custom' }) })
    const model = screen.getByTestId('logwatch-model') as HTMLInputElement
    expect(model.value).toBe('')
    expect(model.placeholder).toBe('small')
  })
})

describe('LogLineCard', () => {
  it('shows what the row has no room for, masked when MASK is on', () => {
    const [row] = rows([
      line('login', {
        raw: '{"msg":"login","user":"rin@example.com","token":"abc"}',
        fields: [
          ['user', 'rin@example.com'],
          ['token', 'abc'],
        ],
      }),
    ])
    render(LogLineCard, {
      props: {
        row: row as NonNullable<typeof row>,
        mask: true,
        anchor: { x: 0, top: 0, bottom: 10 },
        bounds: { width: 800, height: 600 },
      },
    })
    const card = screen.getByTestId('logwatch-card')
    expect(card.textContent).not.toContain('example.com')
    expect(card.textContent).not.toContain('"abc"')
    expect(card.textContent).toContain('click to choose it')
  })
})
