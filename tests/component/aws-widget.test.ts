import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { billingStore } from '../../src/main/aws/billing-store'
import { AwsService } from '../../src/main/aws/service'
import { concurrencyLimit } from '../../src/main/cloud-cli/scheduler'
import { stubAws } from '../../src/main/cloud-cli/stub-aws'
import { awsBoardKey } from '../../src/shared/aws/board'
import type { AwsBoard } from '../../src/shared/aws/types'
import { finishAnimations, inertDom } from './support/dom.ts'
import { mergePatch, stubElecdex } from './support/elecdex.ts'
import { settle } from './support/settle.ts'

const { ceEstimate, money, regionShort } = await import(
  '../../src/renderer/widgets/aws/aws-view.ts'
)
const { default: AwsWidget } = await import('../../src/renderer/widgets/aws/AwsWidget.svelte')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { widgetState } = await import('../../src/renderer/stores/widget-state.svelte.ts')

/**
 * AWS STATUS (docs/aws.md): it follows its board only while seen, asks about Cost Explorer with
 * two equal buttons, drills into a service by main's list, and MASK hides the account. The
 * boards are main's own, built on the stand-in AWS CLI.
 */

const REGIONS = ['ap-northeast-1', 'us-east-1']
const KEY = awsBoardKey({ profile: 'default', regions: REGIONS, activity: true, slow: false })

let service: AwsService
async function boardOf(mode = 'demo'): Promise<AwsBoard> {
  let last: AwsBoard | null = null
  let file = {}
  service = new AwsService({
    cli: stubAws(mode),
    limit: concurrencyLimit(2),
    billing: billingStore({ load: () => file, save: (next) => (file = next) }, () => Date.now()),
    now: () => Date.now(),
    setTimer: () => 0,
    clearTimer: () => {},
    publish: (board) => {
      last = board
    },
    incidents: () => [],
    alert: () => {},
    cliVersion: () => '2.39.6',
    executable: () => 'stub',
    startedAt: Date.now(),
  })
  service.watch(KEY)
  for (let i = 0; i < 3000; i++) await Promise.resolve()
  if (last === null) throw new Error('no board')
  return last
}

let deliver: ((board: AwsBoard) => void) | null = null
let subscribed: string[] = []
const costExplorer = vi.fn(async (_key: string, _answer: unknown) => true)
let held: Record<string, unknown> = {}

beforeEach(() => {
  deliver = null
  subscribed = []
  held = {}
  costExplorer.mockClear()
  inertDom()
  finishAnimations()
  stubElecdex({
    aws: {
      subscribe: (key: string, handler: (board: AwsBoard) => void) => {
        subscribed.push(key)
        deliver = handler
        return () => {
          subscribed = subscribed.filter((k) => k !== key)
          deliver = null
        }
      },
      refresh: async () => 30_000,
      drill: async (key: string, which: string) => service.drill(key, which),
      item: async (key: string, which: string, id: string) => service.item(key, which, id),
      history: async () => [],
      open: async () => true,
      costExplorer: (key: string, answer: unknown) =>
        costExplorer(structuredClone(key), structuredClone(answer)),
      quota: async () => true,
      profiles: async () => ['default'],
      watching: async () => [],
    },
    utility: { copy: async () => true },
    settings: { patch: async () => ({}) },
  })
  vi.spyOn(widgetState, 'patch').mockImplementation((_id, change) => {
    held = mergePatch(held, change)
  })
})

afterEach(async () => {
  service?.dispose()
  cleanup()
  Reflect.deleteProperty(Element.prototype, 'animate')
  vi.restoreAllMocks()
  await layout.flush()
  vi.unstubAllGlobals()
})

async function mount(state: Record<string, unknown> = {}, visible = true) {
  const view = render(AwsWidget, {
    props: {
      paneId: 'p1',
      title: 'aws',
      props: {},
      state: { regions: REGIONS, ...state },
      active: true,
      visible,
    },
  })
  await settle()
  return view
}

async function push(board: AwsBoard): Promise<void> {
  deliver?.(structuredClone(board))
  await settle()
}

describe('AwsWidget', () => {
  it('follows its board only while seen', async () => {
    const view = await mount({}, false)
    expect(subscribed).toEqual([])
    await view.rerender({ visible: true })
    await settle()
    expect(subscribed).toEqual([KEY])
    await view.rerender({ visible: false })
    await settle()
    expect(subscribed).toEqual([])
  })

  it('shows ATTENTION, heaviest first, and the alarm in the top row', async () => {
    await mount()
    await push(await boardOf())
    expect(screen.getByTestId('aws-link').textContent).toContain('LINKED')
    expect(screen.getByTestId('aws-alarms').textContent).toContain('1')
    expect(screen.getAllByTestId('aws-attention-row')[0]?.textContent).toContain('ALARM')
  })

  it('asks about Cost Explorer with TURN ON and KEEP OFF alike, and sends the answer', async () => {
    await mount()
    await push(await boardOf())
    const on = screen.getByTestId('aws-ce-on')
    const off = screen.getByTestId('aws-ce-off')
    expect(on.className).toBe(off.className)
    await fireEvent.click(off)
    await vi.waitFor(() => expect(costExplorer).toHaveBeenCalledWith(KEY, { state: 'off' }))
    await fireEvent.click(on)
    await vi.waitFor(() =>
      expect(costExplorer).toHaveBeenLastCalledWith(KEY, { state: 'on', every: 'day', cap: 100 }),
    )
  })

  it('blinks an answer to the Cost Explorer question before it takes the question away', async () => {
    await mount()
    await push(await boardOf())
    for (const id of ['aws-ce-on', 'aws-ce-off', 'aws-ce-later']) {
      costExplorer.mockClear()
      const button = screen.getByTestId(id)
      await fireEvent.click(button)
      // The answer waits for the blink: a click shorter than a beat showed nothing before.
      expect(button.classList.contains('blinking')).toBe(true)
      expect(costExplorer).not.toHaveBeenCalled()
      await vi.waitFor(() => expect(costExplorer).toHaveBeenCalledTimes(1))
      expect(button.classList.contains('blinking')).toBe(false)
    }
  })

  it("drills from an ACTIVE row into main's list for that service", async () => {
    await mount({ tab: 'active' })
    await push(await boardOf())
    await fireEvent.click(screen.getAllByTestId('aws-active-row')[0] as HTMLElement)
    expect(held.drill).toEqual({ service: 'ec2', filters: {}, sort: null, item: null })
  })

  it('lists the drilled service and cross-filters by a facet bar', async () => {
    const board = await boardOf()
    await mount({ tab: 'active', drill: { service: 'ec2', filters: {}, sort: null, item: null } })
    await push(board)
    await settle()
    expect(screen.getAllByTestId('aws-drill-row')).toHaveLength(6)
    const idle = screen
      .getAllByTestId('aws-facet-bar')
      .find((bar) => bar.textContent?.includes('idle'))
    await fireEvent.click(idle as HTMLElement)
    expect(held.drill).toMatchObject({ filters: { activity: 'idle' } })
  })

  it('MASK hides the account in the ACCOUNT tab', async () => {
    await mount({ tab: 'account', mask: true })
    await push(await boardOf())
    const text = screen.getByTestId('aws-view-account').textContent ?? ''
    expect(text).not.toContain('482913507216')
    expect(text).not.toContain('acme-prod')
  })

  it('says the command to sign in with', async () => {
    await mount()
    await push(await boardOf('signedout'))
    expect(screen.getByTestId('aws-signin').textContent).toContain('aws login --profile=default')
  })
})

describe('aws-view', () => {
  it('words money, regions and the Cost Explorer estimate', () => {
    expect(money(1234.5)).toBe('≈ $1,235')
    expect(money(9.271, false)).toBe('$9.27')
    expect(regionShort('ap-northeast-1')).toBe('ap-ne-1')
    expect(regionShort('us-east-1')).toBe('us-e-1')
    expect(ceEstimate('day', 100)).toEqual({ requests: 60, usd: 0.6, stopsOn: null })
    expect(ceEstimate('12h', 100)).toMatchObject({ requests: 120, stopsOn: 25 })
  })
})
