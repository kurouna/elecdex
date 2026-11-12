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

const { ceEstimate, credentialLines, money, NO_REPORT, refusedPolicy, regionShort } = await import(
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
let last: AwsBoard | null = null
async function boardOf(mode = 'demo'): Promise<AwsBoard> {
  last = null
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

/** The board main published last: after a KEEP, say. */
async function boardAgain(): Promise<AwsBoard> {
  for (let i = 0; i < 100; i++) await Promise.resolve()
  if (last === null) throw new Error('no board')
  return last
}

let deliver: ((board: AwsBoard) => void) | null = null
let subscribed: string[] = []
const costExplorer = vi.fn(async (_key: string, _answer: unknown) => true)
const keep = vi.fn(async (key: string, id: string, on: boolean) => service.keep(key, id, on))
const sweep = vi.fn(async (_key: string, _what?: string) => 30_000)
const metricData = vi.fn(async (_key: string, _answer: unknown) => true)
const copy = vi.fn(async (_what: { kind: string; text: string }) => true)
const open = vi.fn(async (_key: string, _id: string) => true)
const item = vi.fn(async (key: string, which: string, id: string, region?: string) =>
  service.item(key, which, id, region),
)
const refresh = vi.fn(async (_key: string) => 30_000)
let held: Record<string, unknown> = {}

beforeEach(() => {
  deliver = null
  subscribed = []
  held = {}
  costExplorer.mockClear()
  keep.mockClear()
  sweep.mockClear()
  metricData.mockClear()
  copy.mockClear()
  open.mockClear()
  item.mockClear()
  refresh.mockClear()
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
      refresh: (key: string) => refresh(structuredClone(key)),
      drill: async (key: string, which: string) => service.drill(key, which),
      item: (key: string, which: string, id: string, region?: string) =>
        item(
          structuredClone(key),
          structuredClone(which),
          structuredClone(id),
          structuredClone(region),
        ),
      history: async () => [],
      open: (key: string, id: string) => open(structuredClone(key), structuredClone(id)),
      costExplorer: (key: string, answer: unknown) =>
        costExplorer(structuredClone(key), structuredClone(answer)),
      quota: async () => true,
      keep: (key: string, id: string, on: boolean) =>
        keep(structuredClone(key), structuredClone(id), structuredClone(on)),
      sweep: (key: string, what?: string) => sweep(structuredClone(key), structuredClone(what)),
      metricData: (key: string, answer: unknown) =>
        metricData(structuredClone(key), structuredClone(answer)),
      profiles: async () => ['default'],
      watching: async () => [],
    },
    utility: { copy: (what: { kind: string; text: string }) => copy(structuredClone(what)) },
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

/**
 * The focus as Tab gives it. jsdom has no Tab between elements, and a row focused by a script
 * is not `:focus-visible` there, so the element says it is, as Chromium's would.
 */
function keyFocus(el: HTMLElement): void {
  const own = el.matches.bind(el)
  Object.defineProperty(el, 'matches', {
    value: (selector: string) => selector === ':focus-visible' || own(selector),
  })
  el.focus()
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
    await mount({ tab: 'attention' })
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

  it('lists a name two regions share twice, and opens the one pressed in its own region', async () => {
    // The rows were keyed by service and id only: two CDKToolkit stacks threw, a pane fault.
    const row = (region: string) => ({
      id: 'CDKToolkit',
      region,
      name: 'CDKToolkit',
      weight: null,
      cells: { name: 'CDKToolkit', status: 'CREATE_COMPLETE' },
    })
    const elecdex = window.elecdex as unknown as { aws: { drill: unknown } }
    elecdex.aws.drill = async () => [row('ap-northeast-1'), row('us-east-1')]
    const view = await mount({
      tab: 'active',
      drill: { service: 'stacks', filters: {}, sort: null, item: null },
    })
    await push(await boardOf())
    await vi.waitFor(() => expect(screen.getAllByTestId('aws-drill-row')).toHaveLength(2))
    // The list shows no region column: the second row is us-east-1's by main's order (the rows
    // tie on the sort), and the place's region below says which one was pressed.
    await fireEvent.click(screen.getAllByTestId('aws-drill-row')[1] as HTMLElement)
    expect(held.drill).toMatchObject({ item: 'CDKToolkit', region: 'us-east-1' })
    // And main is asked for that region's copy, not the first one it has.
    await view.rerender({ state: { regions: REGIONS, tab: 'active', ...held } })
    await settle()
    await vi.waitFor(() =>
      expect(item).toHaveBeenCalledWith(expect.any(String), 'stacks', 'CDKToolkit', 'us-east-1'),
    )
  })

  it('opens an item at its top, and brings the list back where it was left', async () => {
    // A list and its items share the pane's scroller: an item once opened scrolled past its
    // header when its row was near the bottom of a long list.
    const view = await mount({
      tab: 'active',
      drill: { service: 'ec2', filters: {}, sort: null, item: null },
    })
    await push(await boardOf())
    await vi.waitFor(() => expect(screen.getAllByTestId('aws-drill-row').length).toBeGreaterThan(0))
    const scroller = screen.getByTestId('aws-drill-list').closest('.view') as HTMLElement
    scroller.scrollTop = 480
    await fireEvent.click(screen.getAllByTestId('aws-drill-row')[0] as HTMLElement)
    await view.rerender({ state: { regions: REGIONS, tab: 'active', ...held } })
    await settle()
    await vi.waitFor(() => expect(screen.getByTestId('aws-drill-item')).toBeTruthy())
    expect(scroller.scrollTop).toBe(0)
    await fireEvent.click(screen.getByRole('button', { name: 'back a step' }))
    await view.rerender({ state: { regions: REGIONS, tab: 'active', ...held } })
    await settle()
    await vi.waitFor(() => expect(screen.getByTestId('aws-drill-list')).toBeTruthy())
    expect(scroller.scrollTop).toBe(480)
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

  it('blinks REFRESH three beats before it asks, as every other button does', async () => {
    await mount()
    await push(await boardOf())
    const button = screen.getByTestId('aws-refresh')
    await fireEvent.click(button)
    expect(button.classList.contains('blinking')).toBe(true)
    expect(refresh).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    expect(button.classList.contains('blinking')).toBe(false)
  })

  it('says the command to sign in with, and to press REFRESH after it', async () => {
    await mount()
    await push(await boardOf('signedout'))
    const notice = screen.getByTestId('aws-signin').textContent
    expect(notice).toContain('aws login --profile=default')
    // The board reads nothing until REFRESH: signed in from a shell, the pane went on saying
    // SIGNED OUT, and the old words only said it "reads again at REFRESH" (found by hand).
    expect(notice).toContain('then press REFRESH above')
  })

  it('copies an IAM policy of exactly the refused reads, and names the services once on RESOURCES', async () => {
    await mount()
    const board = await boardOf('partial')
    expect(board.denied.length).toBeGreaterThan(0)
    await push(board)
    const button = screen.getByTestId('aws-copy-policy')
    await fireEvent.click(button)
    // The press blinks its three beats first, as every other button does, then copies.
    expect(button.classList.contains('blinking')).toBe(true)
    expect(copy).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(button.textContent).toBe('COPIED'))
    expect(button.classList.contains('blinking')).toBe(false)
    const policy = JSON.parse(copy.mock.calls[0]?.[0].text ?? '{}')
    expect(policy.Statement[0].Action).toEqual([...board.denied].sort((a, b) => a.localeCompare(b)))
    expect(policy.Statement[0].Effect).toBe('Allow')
    // ↗ IAM opens the signed-in identity's permissions, where the policy is pasted, after its blink.
    const iam = screen.getByTestId('aws-open-iam')
    await fireEvent.click(iam)
    expect(iam.classList.contains('blinking')).toBe(true)
    expect(open).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(open).toHaveBeenCalledWith(KEY, 'account:permissions'))
    // The operations are PARTIAL's list; RESOURCES says only which services, not them again.
    const line = screen.queryByTestId('aws-res-denied')
    for (const op of board.denied) expect(line?.textContent ?? '').not.toContain(op)
  })
})

/** Lays the tiles or cards out as a grid of four, in their order, for the arrows (jsdom draws nothing). */
function tileBoxes(testid = 'aws-tile'): HTMLElement[] {
  const tiles = screen.getAllByTestId(testid)
  tiles.forEach((tile, i) => {
    const box = { left: (i % 4) * 200, top: Math.floor(i / 4) * 80, width: 190, height: 70 }
    tile.getBoundingClientRect = () =>
      ({ ...box, right: box.left + box.width, bottom: box.top + box.height }) as DOMRect
  })
  return tiles
}

describe('RESOURCES (aws.md §14)', () => {
  it('is the tab a pane opens on, with its four figures', async () => {
    await mount()
    const board = await boardOf()
    await push(board)
    expect(screen.getByTestId('aws-tab-resources').getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('aws-view-resources')).toBeTruthy()
    const figures = screen.getByTestId('aws-res-figures').textContent ?? ''
    expect(figures).toContain(String(board.resources.figures.services))
    expect(screen.getByTestId('aws-res-forgotten').textContent).toContain(
      String(board.resources.figures.forgotten.billed),
    )
    expect(screen.getByTestId('aws-res-newest').textContent).toContain('pt-claude-batch')
    // The figures that lead somewhere are buttons: BILLED BY THE HOUR is ACTIVE, the next two lists.
    await fireEvent.click(screen.getByTestId('aws-res-hourly'))
    expect(held.tab).toBe('active')
    await fireEvent.click(screen.getByTestId('aws-res-forgotten'))
    expect(held).toMatchObject({ from: 'resources', drill: { service: 'forgotten', item: null } })
    await fireEvent.click(screen.getByTestId('aws-res-new'))
    expect(held.drill).toMatchObject({ service: 'new' })
  })

  it("takes a tile's card away as the tile is pressed into its list", async () => {
    const view = await mount({ resView: 'detail' })
    await push(await boardOf())
    const tile = screen.getAllByTestId('aws-tile')[0] as HTMLElement
    await fireEvent.pointerEnter(tile, { clientX: 40 })
    await vi.waitFor(() => expect(screen.getByTestId('aws-card')).toBeTruthy())
    await fireEvent.click(tile)
    expect(held).toMatchObject({ from: 'resources', drill: { service: tile.dataset.tile } })
    // RESOURCES goes for the list, and an element taken away sends no pointerleave.
    await view.rerender({ state: { regions: REGIONS, resView: 'detail', ...held } })
    await settle()
    await vi.waitFor(() => expect(screen.getAllByTestId('aws-drill-row').length).toBeGreaterThan(0))
    await vi.waitFor(() => expect(screen.queryByTestId('aws-card')).toBeNull())
  })

  it("says GetMetricData's month in dollars on the ledger's card", async () => {
    await mount()
    await push(await boardOf())
    await fireEvent.pointerEnter(screen.getByTestId('aws-foot'), { clientX: 40 })
    await vi.waitFor(() => expect(screen.getByTestId('aws-card')).toBeTruthy())
    expect(screen.getByTestId('aws-card').textContent).toMatch(
      /[\d,]+ of 100,000 metrics this month · \$\d+\.\d\d/,
    )
  })

  it('lists five that look forgotten, dearest first, and KEEP sends the row key', async () => {
    await mount()
    const board = await boardOf()
    await push(board)
    const rows = screen.getAllByTestId('aws-forgotten-row')
    expect(rows).toHaveLength(5)
    expect(rows[0]?.textContent).toContain(board.resources.forgotten[0]?.name)
    expect(screen.getByTestId('aws-forgotten-head').textContent).toContain(
      `${board.resources.figures.forgotten.billed} billing`,
    )
    expect(screen.getByTestId('aws-forgotten-all').textContent).toContain(
      `all ${board.resources.forgottenTotal}`,
    )
    // Arrow keys between the rows.
    rows[0]?.focus()
    await fireEvent.keyDown(rows[0] as HTMLElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(rows[1])
    const button = screen.getAllByRole('button', { name: 'keep: I meant to leave it' })[1]
    await fireEvent.click(button as HTMLElement)
    // KEEP takes the row off the list: it blinks before it goes, and opens nothing.
    expect(keep).not.toHaveBeenCalled()
    await vi.waitFor(() =>
      expect(keep).toHaveBeenCalledWith(KEY, board.resources.forgotten[1]?.key, true),
    )
    expect(held.drill).toBeUndefined()
    expect(await keep.mock.results[0]?.value).toBe(true)
  })

  it('opens a LOOKS FORGOTTEN row as its resource, and Back goes straight to RESOURCES', async () => {
    const view = await mount()
    const board = await boardOf()
    await push(board)
    const first = board.resources.forgotten[0] as (typeof board.resources.forgotten)[number]
    await fireEvent.keyDown(screen.getAllByTestId('aws-forgotten-row')[0] as HTMLElement, {
      key: 'Enter',
    })
    expect(held.drill).toEqual({
      service: first.service,
      filters: {},
      sort: null,
      item: first.id,
      region: first.region,
      direct: true,
    })
    await view.rerender({ state: { regions: REGIONS, ...held } })
    await settle()
    await vi.waitFor(() =>
      expect(screen.getByTestId('aws-item-quiet').textContent).toContain(first.quietFor),
    )
    expect(screen.getByTestId('aws-crumbs').textContent).toContain('RESOURCES')
    await fireEvent.click(screen.getByRole('button', { name: 'back a step' }))
    expect(held.drill).toBeUndefined()
    await view.rerender({ state: { regions: REGIONS, ...held } })
    await settle()
    expect((document.activeElement as HTMLElement | null)?.dataset.focus).toBe(`row:${first.key}`)
  })

  it('moves between the tiles with the arrows, opens one with Enter, and comes back to it', async () => {
    const view = await mount({ resView: 'detail' })
    await push(await boardOf())
    const tiles = tileBoxes()
    tiles[0]?.focus()
    await fireEvent.keyDown(tiles[0] as HTMLElement, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tiles[1])
    await fireEvent.keyDown(tiles[1] as HTMLElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(tiles[5])
    await fireEvent.keyDown(tiles[5] as HTMLElement, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(tiles[4])
    // Nothing that way: the focus stays.
    await fireEvent.keyDown(tiles[4] as HTMLElement, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(tiles[4])
    const service = tiles[4]?.dataset.tile
    await fireEvent.keyDown(tiles[4] as HTMLElement, { key: 'Enter' })
    expect(held).toMatchObject({ from: 'resources', drill: { service, item: null } })
    await view.rerender({ state: { regions: REGIONS, resView: 'detail', ...held } })
    await settle()
    await vi.waitFor(() => expect(screen.getAllByTestId('aws-drill-row').length).toBeGreaterThan(0))
    await fireEvent.keyDown(screen.getByTestId('aws-drill-list'), { key: 'Escape' })
    expect(held.drill).toBeUndefined()
    expect(held.tab).toBeUndefined()
    await view.rerender({ state: { regions: REGIONS, resView: 'detail', ...held } })
    await settle()
    expect((document.activeElement as HTMLElement | null)?.dataset.tile).toBe(service)
  })

  it('shows the services as cards by default, in use of all, and remembers DETAIL', async () => {
    const view = await mount()
    const board = await boardOf()
    await push(board)
    expect(screen.queryAllByTestId('aws-tile')).toHaveLength(0)
    const cards = screen.getAllByTestId('aws-rcard')
    const tiles = board.resources.groups.flatMap((g) => g.tiles)
    expect(cards).toHaveLength(tiles.length)
    const ec2 = tiles.find((t) => t.service === 'ec2')
    const card = cards.find((c) => c.dataset.card === 'ec2') as HTMLElement
    expect(card.textContent).toContain(`${ec2?.use.inUse}/ ${ec2?.use.total}`)
    expect(card.getAttribute('aria-label')).toMatch(/^EC2: \d+ of \d+ instances running, not idle/)
    expect(screen.getByTestId('aws-services-head').textContent).toContain(
      String(board.resources.figures.services),
    )
    // The lines under the services stay in both views.
    // Its parts keep their separators and spaces: Svelte trims a span's own edge spaces, and the
    // line once read "2 VPCs1 certificates3 stacks(1 failed)".
    expect(screen.getByTestId('aws-also-here').textContent).toMatch(/VPCs? · \d+ certificates?/)
    expect(screen.getByTestId('aws-also-here').textContent).toMatch(/stacks? \(\d+ failed\)/)
    expect(screen.getByTestId('aws-elsewhere')).toBeTruthy()
    // DETAIL: the press blinks, the choice is the pane's, and the focus stays on the switch.
    const detail = screen.getByTestId('aws-res-view-detail')
    expect(detail.getAttribute('aria-pressed')).toBe('false')
    detail.focus()
    await fireEvent.click(detail)
    expect(detail.classList.contains('blinking')).toBe(true)
    await vi.waitFor(() => expect(held.resView).toBe('detail'))
    await view.rerender({ state: { regions: REGIONS, ...held } })
    await settle()
    expect(screen.getAllByTestId('aws-tile').length).toBe(tiles.length)
    expect(screen.queryAllByTestId('aws-rcard')).toHaveLength(0)
    expect(document.activeElement).toBe(screen.getByTestId('aws-res-view-detail'))
    expect(screen.getByTestId('aws-also-here')).toBeTruthy()
    expect(screen.getByTestId('aws-elsewhere')).toBeTruthy()
    // CARDS again: the default, so the state keeps nothing.
    await fireEvent.click(screen.getByTestId('aws-res-view-cards'))
    await vi.waitFor(() => expect('resView' in held).toBe(false))
  })

  it('moves between the cards with the arrows, opens one with Enter, and comes back to it', async () => {
    const view = await mount()
    await push(await boardOf())
    const cards = tileBoxes('aws-rcard')
    cards[0]?.focus()
    await fireEvent.keyDown(cards[0] as HTMLElement, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cards[1])
    await fireEvent.keyDown(cards[1] as HTMLElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cards[5])
    const service = cards[5]?.dataset.card
    await fireEvent.keyDown(cards[5] as HTMLElement, { key: 'Enter' })
    expect(held).toMatchObject({ from: 'resources', drill: { service, item: null } })
    await view.rerender({ state: { regions: REGIONS, ...held } })
    await settle()
    await vi.waitFor(() => expect(screen.getAllByTestId('aws-drill-row').length).toBeGreaterThan(0))
    await fireEvent.keyDown(screen.getByTestId('aws-drill-list'), { key: 'Escape' })
    await view.rerender({ state: { regions: REGIONS, ...held } })
    await settle()
    expect((document.activeElement as HTMLElement | null)?.dataset.card).toBe(service)
  })

  it("puts on a card's card its states and regions, and says a press opens the list", async () => {
    await mount()
    await push(await boardOf())
    const card = screen
      .getAllByTestId('aws-rcard')
      .find((c) => c.dataset.card === 'ec2') as HTMLElement
    await fireEvent.pointerEnter(card, { clientX: 40 })
    await vi.waitFor(() => expect(screen.getByTestId('aws-card')).toBeTruthy())
    const text = screen.getByTestId('aws-card').textContent ?? ''
    expect(text).toContain('states')
    expect(text).toContain('ap-northeast-1')
    expect(text).toContain('A press opens the list.')
  })

  it('has a foot only where something is not in use', async () => {
    await mount()
    const board = await boardOf()
    await push(board)
    for (const tile of board.resources.groups.flatMap((g) => g.tiles)) {
      const card = screen
        .getAllByTestId('aws-rcard')
        .find((c) => c.dataset.card === tile.service) as HTMLElement
      const foot = card.querySelector('[data-testid="aws-rcard-foot"]')
      expect(foot === null, tile.service).toBe(tile.use.inUse === tile.use.total)
    }
    const tidy = screen.getAllByTestId('aws-rcard').find((c) => c.dataset.card === 'eks')
    expect(tidy?.textContent).toContain('1/ 1')
  })

  it('draws a card being read and a card refused, and leaves the empty kinds in their line', async () => {
    await mount()
    const board = await boardOf()
    board.resources.pending = ['opensearch']
    board.resources.none = board.resources.none.filter(
      (s) => s !== 'opensearch' && s !== 'redshift',
    )
    board.resources.denied = [{ service: 'redshift', actions: ['redshift:DescribeClusters'] }]
    await push(board)
    const reading = screen.getByTestId('aws-rcard-pending')
    expect(reading.textContent).toContain('OpenSearch')
    expect(reading.textContent).toContain('–')
    expect(reading.textContent).toContain('reading…')
    expect(reading.textContent).toContain('first read ≤ 10 min')
    // A service refused with nothing read has no card, as it has no tile in DETAIL: the Denied
    // line names it once.
    expect(
      screen.queryAllByTestId('aws-rcard').some((c) => c.textContent?.includes('Redshift')),
    ).toBe(false)
    expect(screen.getByTestId('aws-res-denied').textContent).toContain('Redshift')
    expect(screen.getByTestId('aws-res-none').textContent).toContain('Transit Gateway')
  })

  it('MASK names no resource on RESOURCES, in its lists or its cards', async () => {
    const view = await mount({ mask: true })
    const board = await boardOf()
    await push(board)
    const text = screen.getByTestId('aws-resources').textContent ?? ''
    for (const row of board.resources.forgotten.slice(0, 5)) {
      expect(text).not.toContain(row.name)
      // The reason keeps its numbers.
      expect(text).toContain(row.quietFor)
    }
    expect(screen.getByTestId('aws-res-newest').textContent).not.toContain('pt-claude-batch')
    // The list across services masks its names too.
    await fireEvent.click(screen.getByTestId('aws-res-forgotten'))
    await view.rerender({ state: { regions: REGIONS, mask: true, ...held } })
    await settle()
    await vi.waitFor(() => expect(screen.getAllByTestId('aws-drill-row').length).toBeGreaterThan(5))
    const list = screen.getByTestId('aws-drill-list').textContent ?? ''
    for (const row of board.resources.forgotten) expect(list).not.toContain(row.name)
  })

  it('opens the forgotten list from ATTENTION, whose one line stands for them all', async () => {
    await mount({ tab: 'attention' })
    await push(await boardOf())
    const rows = screen.getAllByTestId('aws-attention-row')
    const line = rows.filter((row) => row.textContent?.includes('look forgotten'))
    // One line, never a row a resource (user decision 2026-11-08).
    expect(line).toHaveLength(1)
    expect(
      rows.filter((row) => /not attached|low use|stopped \d+ d/.test(row.textContent ?? '')),
    ).toEqual([])
    expect(line[0]?.getAttribute('role')).toBe('link')
    await fireEvent.click(line[0] as HTMLElement)
    expect(held).toMatchObject({ from: 'resources', drill: { service: 'forgotten', item: null } })
    expect(held.tab).toBeUndefined()
  })

  it('ELSEWHERE opens the list of the other regions, which reads them again on a press', async () => {
    const view = await mount()
    await push(await boardOf())
    expect(screen.getByTestId('aws-elsewhere').textContent).toContain('us-west-2')
    await fireEvent.click(screen.getByTestId('aws-elsewhere'))
    expect(held.drill).toMatchObject({ service: 'elsewhere', item: null })
    await view.rerender({ state: { regions: REGIONS, ...held } })
    await settle()
    await vi.waitFor(() => expect(screen.getAllByTestId('aws-drill-row')).toHaveLength(3))
    await fireEvent.click(screen.getByTestId('aws-sweep-now'))
    await vi.waitFor(() => expect(sweep).toHaveBeenCalledWith(KEY, 'now'))
  })

  it('⚙ sets ELSEWHERE and GetMetricData for the account, and lists what is kept', async () => {
    await mount()
    const board = await boardOf()
    const row = board.resources.forgotten[0] as (typeof board.resources.forgotten)[number]
    expect(service.keep(KEY, row.key, true)).toBe(true)
    for (let i = 0; i < 50; i++) await Promise.resolve()
    await push(await boardAgain())
    await fireEvent.click(screen.getByTestId('aws-settings-toggle'))
    await fireEvent.click(screen.getByTestId('aws-sweep-off'))
    expect(sweep).toHaveBeenCalledWith(KEY, 'off')
    await fireEvent.click(screen.getByTestId('aws-gmd-cap-25000'))
    expect(metricData).toHaveBeenCalledWith(KEY, { on: true, cap: 25_000 })
    await fireEvent.click(screen.getByTestId('aws-gmd-off'))
    expect(metricData).toHaveBeenLastCalledWith(KEY, { on: false, cap: 100_000 })
    expect(screen.getByTestId('aws-kept').textContent).toContain(row.name)
    await fireEvent.click(screen.getByTestId('aws-unkeep'))
    await vi.waitFor(() => expect(keep).toHaveBeenCalledWith(KEY, row.key, false))
  })
})

describe('the drill-down', () => {
  const EC2 = { service: 'ec2', filters: {}, sort: null }

  it('says an item is gone since the last reading, back on its list', async () => {
    const board = await boardOf()
    const view = await mount({ tab: 'active', drill: { ...EC2, item: 'i-gone' } })
    await push(board)
    await vi.waitFor(() => expect(held.drill).toMatchObject({ item: null }))
    // The pane state follows; the list must still say why it came back.
    await view.rerender({ state: { regions: REGIONS, tab: 'active', ...held } })
    await settle()
    expect(screen.getByTestId('aws-drill-list').textContent).toMatch(/gone since \d\d:\d\d/)
  })

  it('asks main for its list once a list and its item away, and again when main reads more', async () => {
    const board = await boardOf()
    const drill = vi.spyOn(window.elecdex.aws, 'drill')
    const view = await mount({ tab: 'active', drill: { ...EC2, item: null } })
    await push(board)
    await vi.waitFor(() => expect(screen.getAllByTestId('aws-drill-row')).toHaveLength(6))
    const asked = drill.mock.calls.length
    for (const item of ['i-0a1b2c3d4e5f60003', null]) {
      await view.rerender({ state: { regions: REGIONS, tab: 'active', drill: { ...EC2, item } } })
      await settle()
    }
    expect(drill.mock.calls.length).toBe(asked)
    // A probe settled, or a KEEP or the sweep changed the account: the same sign-in time, a new
    // revision.
    await push({ ...board, revision: `${board.revision}+1` })
    expect(drill.mock.calls.length).toBe(asked + 1)
  })

  it('goes back from an ATTENTION item to ATTENTION, and shows the estimate line there', async () => {
    const board = await boardOf()
    const view = await mount({ tab: 'attention' })
    await push(board)
    const row = screen
      .getAllByTestId('aws-attention-row')
      .find((r) => r.textContent?.includes('orders-db-cpu-high')) as HTMLElement
    await fireEvent.click(row)
    expect(held).toMatchObject({ from: 'attention', drill: { item: expect.any(String) } })
    expect((held.drill as { direct?: boolean }).direct).toBe(true)
    await view.rerender({ state: { regions: REGIONS, ...held } })
    await settle()
    expect(screen.getByTestId('aws-estimate')).toBeTruthy()
  })

  it("MASK names no resource in ACTIVE's service card, nor the budget on COST", async () => {
    const board = await boardOf()
    const view = await mount({ tab: 'active', mask: true })
    await push(board)
    // ACTIVE's card once masked only S3 and Elastic IPs: EC2's own names showed.
    const ec2 = screen.getAllByTestId('aws-active-row').find((r) => r.textContent?.includes('EC2'))
    await fireEvent.pointerEnter(ec2 as HTMLElement, { clientX: 40 })
    await vi.waitFor(() => expect(screen.getByTestId('aws-card')).toBeTruthy())
    const card = screen.getByTestId('aws-card').textContent ?? ''
    for (const name of ['ml-train', 'web-1', 'dev-box', 'bastion'])
      expect(card, name).not.toContain(name)
    await view.rerender({ state: { regions: REGIONS, mask: true, tab: 'cost' } })
    await settle()
    expect(screen.getByTestId('aws-budget').textContent).not.toContain('monthly')
    // ATTENTION's line for it masks the name and keeps the money, with its dollar signs.
    await view.rerender({ state: { regions: REGIONS, mask: true, tab: 'attention' } })
    await settle()
    const budget = screen
      .getAllByTestId('aws-attention-row')
      .find((r) => r.textContent?.includes('BUDGET'))
    expect(budget?.textContent).toContain('forecast $1102 over $1000')
    expect(budget?.textContent).not.toContain('monthly')
  })

  it('MASK names no resource of an ATTENTION row, an item step or the changes line', async () => {
    const board = await boardOf()
    const view = await mount({ tab: 'attention', mask: true })
    await push(board)
    const attention = screen.getByTestId('aws-view-attention').textContent ?? ''
    for (const name of ['orders-db-cpu-high', 'bastion-ssh', 'payments', 'ci-bot', 'legacy-cron'])
      expect(attention).not.toContain(name)
    // The finding's words stay.
    expect(attention).toMatch(/stopped|open|ALARM/)
    await view.rerender({
      state: {
        regions: REGIONS,
        mask: true,
        tab: 'active',
        drill: { ...EC2, item: 'i-0a1b2c3d4e5f60003' },
      },
    })
    await settle()
    await vi.waitFor(() => expect(screen.getByTestId('aws-drill-item')).toBeTruthy())
    const item = screen.getByTestId('aws-drill-item').textContent ?? ''
    for (const text of ['i-0a1b2c3d4e5f60003', 'vpc-', 'subnet-', 'dev-box'])
      expect(item, text).not.toContain(text)
    await view.rerender({ state: { regions: REGIONS, mask: true, tab: 'active' } })
    await push({
      ...board,
      changes: {
        since: board.readAt ?? 0,
        parts: [{ service: 'ec2', added: ['i-0new'], removed: ['i-0old'] }],
      },
    })
    expect(screen.getByTestId('aws-changes').textContent).not.toContain('i-0new')
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

  it('writes a policy of the refused reads alone, sorted and once each', () => {
    const policy = JSON.parse(
      refusedPolicy(['sqs:ListQueues', 'acm:ListCertificates', 'sqs:ListQueues']),
    )
    expect(policy).toEqual({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'ElecdexAwsStatusReads',
          Effect: 'Allow',
          Action: ['acm:ListCertificates', 'sqs:ListQueues'],
          Resource: '*',
        },
      ],
    })
  })

  it('says "—" without the credential report, and "never" and "none" only with it', () => {
    const view = {
      rootMfa: true,
      rootKeys: false,
      credentialReport: false,
      rootUsedAt: null,
      users: 3,
      roles: 9,
      mfaLessUsers: null,
      oldKeys: null,
      guardduty: null,
    }
    expect(credentialLines(view, false, Date.now())).toEqual({
      rootUsed: NO_REPORT,
      mfaLess: '—',
      oldKeys: '—',
    })
    const read = { ...view, credentialReport: true, mfaLessUsers: [], oldKeys: [] }
    expect(credentialLines(read, false, Date.now())).toEqual({
      rootUsed: 'never',
      mfaLess: 'none',
      oldKeys: 'none',
    })
    const some = { ...read, mfaLessUsers: ['ci-bot'], oldKeys: [{ user: 'ops', days: 120 }] }
    expect(credentialLines(some, true, Date.now())).toEqual({
      rootUsed: 'never',
      mfaLess: '1 users',
      oldKeys: '••••• 120d',
    })
  })
})

describe('found in review (2026-11-08)', () => {
  const EC2 = { service: 'ec2', filters: {}, sort: null }
  const ITEM = 'i-0a1b2c3d4e5f60003'

  it('waits for an item not read yet, without "gone since", and shows it once it is read', async () => {
    // A drill kept over a restart asked before the first reading, was told null, said "gone
    // since" and went up a step.
    const board = await boardOf()
    let read = false
    item.mockImplementation(async (key, which, id, region) =>
      read ? service.item(key, which, id, region) : 'unread',
    )
    await mount({ tab: 'active', drill: { ...EC2, item: ITEM } })
    await push(board)
    await vi.waitFor(() =>
      expect(screen.getByTestId('aws-item-waiting').textContent).toContain('not read yet'),
    )
    expect(held.drill).toBeUndefined()
    read = true
    await push({ ...board, revision: `${board.revision}+1` })
    await vi.waitFor(() => expect(screen.getByTestId('aws-drill-item')).toBeTruthy())
    expect(screen.queryByText(/gone since/)).toBeNull()
    expect(held.drill).toBeUndefined()
    item.mockImplementation(async (key, which, id, region) => service.item(key, which, id, region))
  })

  it('says HISTORY has nothing to ask while ACTIVITY is off, instead of a press that fails', async () => {
    const board = await boardOf()
    await mount({ tab: 'active', drill: { ...EC2, item: ITEM } })
    await push({ ...board, activity: null })
    await vi.waitFor(() => expect(screen.getByTestId('aws-drill-item')).toBeTruthy())
    expect(screen.getByTestId('aws-history-off').textContent).toContain('ACTIVITY is off')
    expect(screen.queryByTestId('aws-history')).toBeNull()
  })

  it('says "—", never "billing alerts off", for a billing metric not read', async () => {
    const board = await boardOf()
    const view = await mount()
    await push({ ...board, cost: { ...board.cost, billing: null, mtd: null } })
    expect(screen.getByTestId('aws-mtd').textContent).not.toContain('billing alerts off')
    expect(screen.getByTestId('aws-mtd').textContent).toContain('—')
    await view.rerender({ state: { regions: REGIONS, tab: 'cost' } })
    await settle()
    expect(screen.getByTestId('aws-view-cost').textContent).not.toContain('BILLING ALERTS ARE OFF')
    expect(screen.getByTestId('aws-billing-unread')).toBeTruthy()
    await push({ ...board, cost: { ...board.cost, billing: false, mtd: null } })
    expect(screen.getByTestId('aws-view-cost').textContent).toContain('BILLING ALERTS ARE OFF')
  })

  it('says the credential lines are not read without the report, never "never" or "none"', async () => {
    const board = await boardOf()
    await mount({ tab: 'account' })
    await push({
      ...board,
      accountView: {
        ...board.accountView,
        credentialReport: false,
        rootUsedAt: null,
        mfaLessUsers: null,
        oldKeys: null,
      },
    })
    expect(screen.getByTestId('aws-root-used').textContent).toContain('credential report not read')
    for (const id of ['aws-root-used', 'aws-mfa-less', 'aws-old-keys'])
      expect(screen.getByTestId(id).textContent, id).not.toMatch(/never|none/)
  })

  it("sends ⚙'s Monthly cap alone, so an account not asked yet is not answered KEEP OFF", async () => {
    await mount()
    await push(await boardOf())
    await fireEvent.click(screen.getByTestId('aws-settings-toggle'))
    await settle()
    const select = screen.getByTestId('aws-ce-cap') as HTMLSelectElement
    const last = select.options[select.options.length - 1] as HTMLOptionElement
    select.value = last.value
    await fireEvent.change(select)
    expect(costExplorer).toHaveBeenLastCalledWith(KEY, { cap: Number(last.value) })
  })

  it("shows a CLI's words in the foot at a size to read, under MASK only their kind", async () => {
    const board = await boardOf()
    const view = await mount()
    const problem = 'Stack with id prod-billing does not exist'
    await push({ ...board, link: 'error', problem })
    expect(screen.getByTestId('aws-problem').classList.contains('problem')).toBe(true)
    expect(screen.getByTestId('aws-problem').textContent).toBe(problem)
    await view.rerender({ state: { regions: REGIONS, mask: true } })
    await settle()
    expect(screen.getByTestId('aws-foot').textContent).not.toContain('prod-billing')
    // elecdex's own words say nothing of the account: shown under MASK too.
    const words = 'a reading took over 20 s and was stopped: tried again later'
    await push({ ...board, link: 'partial', problem: words })
    expect(screen.getByTestId('aws-problem').textContent).toBe(words)
  })

  it('gives the focus back to the ACTIVE or ATTENTION row a drill-down was opened from', async () => {
    // Back from a drill-down opened from ACTIVE or ATTENTION left the focus on the page's body.
    const board = await boardOf()
    const view = await mount({ tab: 'active' })
    await push(board)
    const row = screen.getAllByTestId('aws-active-row')[1] as HTMLElement
    const label = row.querySelector('.title')?.textContent ?? ''
    row.focus()
    await fireEvent.keyDown(row, { key: 'Enter' })
    await view.rerender({ state: { regions: REGIONS, ...held } })
    await settle()
    await fireEvent.click(screen.getByRole('button', { name: 'back a step' }))
    await view.rerender({ state: { regions: REGIONS, ...held } })
    await settle()
    await vi.waitFor(() =>
      expect((document.activeElement as HTMLElement).querySelector('.title')?.textContent).toBe(
        label,
      ),
    )
    await view.rerender({ state: { regions: REGIONS, tab: 'attention' } })
    await settle()
    const alarm = screen
      .getAllByTestId('aws-attention-row')
      .find((r) => r.textContent?.includes('orders-db-cpu-high')) as HTMLElement
    await fireEvent.click(alarm)
    await view.rerender({ state: { regions: REGIONS, ...held } })
    await settle()
    await fireEvent.click(screen.getByRole('button', { name: 'back a step' }))
    await view.rerender({ state: { regions: REGIONS, ...held } })
    await settle()
    await vi.waitFor(() =>
      expect(document.activeElement?.textContent).toContain('orders-db-cpu-high'),
    )
  })

  it("gives the focus back after a mouse Back without opening the row's card", async () => {
    // The ACTIVE and ATTENTION rows' cards opened on any focus, so the focus given back after a
    // click on Back put a card up that nobody asked for.
    const board = await boardOf()
    const view = await mount({ tab: 'active' })
    await push(board)
    const back = async () => {
      await view.rerender({ state: { regions: REGIONS, ...held } })
      await settle()
      await fireEvent.click(screen.getByRole('button', { name: 'back a step' }))
      await view.rerender({ state: { regions: REGIONS, ...held } })
      await settle()
    }
    const row = screen.getAllByTestId('aws-active-row')[1] as HTMLElement
    const label = row.querySelector('.title')?.textContent ?? ''
    await fireEvent.click(row)
    await back()
    await vi.waitFor(() =>
      expect((document.activeElement as HTMLElement).querySelector('.title')?.textContent).toBe(
        label,
      ),
    )
    await settle()
    expect(screen.queryByTestId('aws-card')).toBeNull()
    await view.rerender({ state: { regions: REGIONS, tab: 'attention' } })
    await settle()
    const alarm = screen
      .getAllByTestId('aws-attention-row')
      .find((r) => r.textContent?.includes('orders-db-cpu-high')) as HTMLElement
    await fireEvent.click(alarm)
    await back()
    await vi.waitFor(() =>
      expect(document.activeElement?.textContent).toContain('orders-db-cpu-high'),
    )
    await settle()
    expect(screen.queryByTestId('aws-card')).toBeNull()
  })

  it("gives an ACTIVE row's card to the keyboard, and an ATTENTION card says what its row does not", async () => {
    const board = await boardOf()
    const view = await mount({ tab: 'active' })
    await push(board)
    keyFocus(screen.getAllByTestId('aws-active-row')[0] as HTMLElement)
    await vi.waitFor(() => expect(screen.getByTestId('aws-card')).toBeTruthy())
    await view.rerender({ state: { regions: REGIONS, tab: 'attention' } })
    await settle()
    const row = screen.getAllByTestId('aws-attention-row')[0] as HTMLElement
    const tag = row.querySelector('.tag')?.textContent ?? ''
    keyFocus(row)
    await vi.waitFor(() => expect(screen.getByTestId('aws-card')).toBeTruthy())
    // The head was the row's tag again; it says since when, which the row has only as an age.
    const head = screen.getByTestId('aws-card').querySelector('.chead')?.textContent ?? ''
    expect(head).not.toContain(tag)
    expect(head).toMatch(/^since /)
  })

  it('marks the pulse when CloudTrail gave as many writes as were asked for', async () => {
    const board = await boardOf()
    await mount()
    await push({ ...board, activityCapped: true })
    expect(screen.getByTestId('aws-pulse-capped').textContent).toContain('50')
  })

  it("waits out REFRESH's 30 s on the seconds' boundaries, with no timer of its own", async () => {
    // REFRESH armed a setTimeout of its own (30 s and 50 ms), never cleared on unmount.
    await mount()
    await push(await boardOf())
    const timeout = vi.spyOn(globalThis, 'setTimeout')
    await fireEvent.click(screen.getByTestId('aws-refresh'))
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    await settle()
    expect((screen.getByTestId('aws-refresh') as HTMLButtonElement).disabled).toBe(true)
    expect(timeout.mock.calls.filter(([, ms]) => (ms ?? 0) > 1000)).toEqual([])
  })
})
