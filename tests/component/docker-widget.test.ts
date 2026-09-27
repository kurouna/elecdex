import {
  type DockerAction,
  type DockerBoard,
  type DockerContainer,
  EMPTY_DOCKER_BOARD,
} from '@shared/docker'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: DockerWidget } = await import(
  '../../src/renderer/widgets/docker/DockerWidget.svelte'
)
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { widgetState } = await import('../../src/renderer/stores/widget-state.svelte.ts')

/**
 * The DOCKER pane: it follows main's list only while seen, groups by Compose
 * project and never moves a row by its state, says how the link stands, asks
 * twice before it stops, restarts or pauses, and copies and opens through main.
 */

let deliver: ((board: DockerBoard) => void) | null = null
let subscriptions = 0
const control = vi.fn(async (_id: string, _action: DockerAction) => 'ok' as string)
const copy = vi.fn(async (_what: unknown) => true)
const openExternal = vi.fn(async (_url: string) => {})

const container = (over: Partial<DockerContainer> = {}): DockerContainer => ({
  id: '0123456789ab',
  name: 'shop-api-1',
  image: 'node:22-alpine',
  state: 'running',
  status: 'Up 2 hours',
  health: null,
  exitCode: null,
  ports: [{ ip: null, private: 3000, public: 3000, proto: 'tcp' }],
  project: 'shop',
  service: 'api',
  composeDir: '/home/dev/shop',
  created: 1_790_000_000_000,
  cpu: 3.2,
  mem: 212 * 1024 * 1024,
  memLimit: null,
  ...over,
})

const API = container()
const WORKER = container({
  id: '111111111111',
  name: 'shop-worker-1',
  service: 'worker',
  state: 'exited',
  status: 'Exited (137) 5 minutes ago',
  exitCode: 137,
  ports: [],
  cpu: null,
  mem: null,
})
const REDIS = container({
  id: '222222222222',
  name: 'redis',
  image: 'redis:7',
  project: null,
  service: null,
  composeDir: null,
  status: 'Up 5 minutes (unhealthy)',
  health: 'unhealthy',
  ports: [{ ip: null, private: 6379, public: 6379, proto: 'tcp' }],
})

const board = (over: Partial<DockerBoard> = {}): DockerBoard => ({
  ...EMPTY_DOCKER_BOARD,
  watching: true,
  link: 'linked',
  endpoint: 'stub',
  engine: { version: '27.3.1', api: '1.47', os: 'linux' },
  containers: [REDIS, WORKER, API],
  total: 3,
  sampledAt: 1,
  ...over,
})

beforeEach(() => {
  deliver = null
  subscriptions = 0
  control.mockClear()
  control.mockResolvedValue('ok')
  copy.mockClear()
  openExternal.mockClear()
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
  Element.prototype.getAnimations ??= () => []
  Element.prototype.animate = function animate(_frames, options) {
    const animation = { onfinish: null as (() => void) | null, cancel() {}, currentTime: 0 }
    const length = typeof options === 'number' ? options : Number(options?.duration ?? 0)
    setTimeout(() => animation.onfinish?.(), length)
    return animation as unknown as Animation
  }
  vi.stubGlobal('elecdex', {
    docker: {
      subscribe: (handler: (board: DockerBoard) => void) => {
        subscriptions += 1
        deliver = handler
        return () => {
          subscriptions -= 1
          deliver = null
        }
      },
      control: (id: string, action: DockerAction) => control(structuredClone(id), action),
    },
    utility: { copy: (what: unknown) => copy(structuredClone(what)) },
    system: { platform: 'linux', openExternal },
    layout: { save: vi.fn(async () => {}) },
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

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

async function mount(state: Record<string, unknown> = {}, visible = true) {
  const view = render(DockerWidget, {
    props: { paneId: 'p1', title: 'docker', props: {}, state, active: true, visible },
  })
  await settle()
  return view
}

async function push(next: DockerBoard): Promise<void> {
  deliver?.(structuredClone(next))
  await settle()
}

const names = () => screen.getAllByTestId('docker-row').map((row) => row.dataset.name)
const row = (name: string) =>
  screen.getAllByTestId('docker-row').find((r) => r.dataset.name === name) as HTMLElement
const within = (el: HTMLElement, testid: string) =>
  el.querySelector(`[data-testid="${testid}"]`) as HTMLElement

describe('DockerWidget', () => {
  it('follows the engine only while it is seen', async () => {
    const view = await mount({}, false)
    expect(subscriptions).toBe(0)
    await view.rerender({ visible: true })
    await settle()
    expect(subscriptions).toBe(1)
    await view.rerender({ visible: false })
    await settle()
    expect(subscriptions).toBe(0)
  })

  it('groups by project, the loose ones last, and names a service by its service', async () => {
    await mount()
    await push(board())
    expect(screen.getAllByTestId('docker-group').map((group) => group.dataset.project)).toEqual([
      'shop',
      '',
    ])
    expect(names()).toEqual(['shop-api-1', 'shop-worker-1', 'redis'])
    expect(within(row('shop-api-1'), 'docker-name').textContent).toBe('api')
    expect(within(row('redis'), 'docker-name').textContent).toBe('redis')
    expect(screen.getByTestId('docker-link').textContent).toContain('LINKED')
    expect(screen.getByTestId('docker-count').textContent?.replace(/\s+/g, ' ')).toContain('2UP')
  })

  it('says the state in a word, with the health and a bad exit code', async () => {
    await mount()
    await push(board())
    expect(within(row('shop-api-1'), 'docker-state').textContent).toContain('UP')
    expect(within(row('shop-api-1'), 'docker-state').textContent).toContain('2h')
    expect(within(row('redis'), 'docker-state').textContent).toContain('UNHEALTHY')
    expect(within(row('shop-worker-1'), 'docker-state').textContent).toContain('EXITED 137')
    expect(row('redis').dataset.tone).toBe('warn')
    expect(within(row('shop-api-1'), 'docker-cpu').textContent).toContain('3.2%')
    expect(within(row('shop-worker-1'), 'docker-cpu').textContent?.trim()).toBe('')
  })

  it('lights only a container made while it watched, not the first list after linking', async () => {
    await mount()
    await push({ ...EMPTY_DOCKER_BOARD, watching: true, link: 'linking' })
    await push(board())
    expect(document.querySelectorAll('li.fx-fresh')).toHaveLength(0)
    const made = container({ id: '333333333333', name: 'shop-web-1', service: 'web' })
    await push(board({ containers: [REDIS, WORKER, API, made], sampledAt: 2 }))
    const lit = [...document.querySelectorAll('li.fx-fresh')].map(
      (li) => (li.querySelector('[data-testid=docker-row]') as HTMLElement).dataset.name,
    )
    expect(lit).toEqual(['shop-web-1'])
  })

  it('does not move a row when its container stops', async () => {
    await mount()
    await push(board())
    const before = names()
    await push(
      board({
        containers: [REDIS, WORKER, { ...API, state: 'exited', status: 'Exited (0) 1 second ago' }],
      }),
    )
    expect(names()).toEqual(before)
  })

  it('keeps only what is up for RUN, from its own state', async () => {
    const patch = vi.spyOn(widgetState, 'patch')
    const view = await mount()
    await push(board())
    await fireEvent.click(screen.getByTestId('docker-filter-running'))
    expect(patch).toHaveBeenCalledWith('p1', { filter: 'running' })
    await view.rerender({ state: { filter: 'running' } })
    await settle()
    expect(names()).toEqual(['shop-api-1', 'redis'])
    await fireEvent.click(screen.getByTestId('docker-filter-all'))
    expect(patch).toHaveBeenLastCalledWith('p1', { filter: undefined })
  })

  it('folds a project', async () => {
    const patch = vi.spyOn(widgetState, 'patch')
    const view = await mount()
    await push(board())
    await fireEvent.click(screen.getAllByTestId('docker-group-head')[0] as HTMLElement)
    expect(patch).toHaveBeenCalledWith('p1', { folded: ['shop'] })
    await view.rerender({ state: { folded: ['shop'] } })
    await settle()
    expect(names()).toEqual(['redis'])
  })

  it('offers only the presses a state takes, and asks twice before a stop', async () => {
    await mount()
    await push(board())
    expect(within(row('shop-worker-1'), 'docker-start')).not.toBeNull()
    expect(within(row('shop-worker-1'), 'docker-stop')).toBeNull()
    expect(within(row('shop-api-1'), 'docker-start')).toBeNull()
    const stop = within(row('shop-api-1'), 'docker-stop')
    await fireEvent.click(stop)
    await settle()
    expect(control).not.toHaveBeenCalled()
    expect(within(row('shop-api-1'), 'docker-stop').textContent).toBe('STOP?')
    await fireEvent.click(within(row('shop-api-1'), 'docker-stop'))
    await settle()
    expect(control).toHaveBeenCalledWith(API.id, 'stop')
  })

  it('starts at once, says so while it is on its way, and why when it was not done', async () => {
    let finish: (result: string) => void = () => {}
    control.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    await mount()
    await push(board())
    await fireEvent.click(within(row('shop-worker-1'), 'docker-start'))
    await settle()
    expect(control).toHaveBeenCalledWith(WORKER.id, 'start')
    expect(within(row('shop-worker-1'), 'docker-state').textContent).toContain('STARTING…')
    finish('refused')
    await settle()
    expect(within(row('shop-worker-1'), 'docker-state').textContent).toContain('EXITED 137')
    expect(screen.getByTestId('docker-problem').textContent).toContain('start shop-worker-1')
  })

  it('copies the name and the shell command through main, and opens a port in the browser', async () => {
    await mount()
    await push(board())
    await fireEvent.click(within(row('shop-api-1'), 'docker-name'))
    await settle()
    expect(copy).toHaveBeenCalledWith({ kind: 'text', text: 'shop-api-1' })
    expect(within(row('shop-api-1'), 'docker-name').textContent).toBe('COPIED')
    await fireEvent.click(within(row('redis'), 'docker-exec'))
    expect(copy).toHaveBeenLastCalledWith({ kind: 'text', text: 'docker exec -it redis sh' })
    await fireEvent.click(within(row('shop-api-1'), 'docker-port'))
    expect(openExternal).toHaveBeenCalledWith('http://localhost:3000/')
  })

  it('says there is no daemon, and what to do', async () => {
    await mount()
    await push(
      board({ link: 'no-daemon', problem: 'nothing answers', containers: [], engine: null }),
    )
    expect(screen.getByTestId('docker-link').textContent).toContain('NO DAEMON')
    expect(screen.getByTestId('docker-down').textContent).toContain('start the docker service')
    await push(board({ link: 'denied', containers: [], engine: null }))
    expect(screen.getByTestId('docker-down').textContent).toContain('docker group')
  })

  it('says there are none, and that RUN hides those down', async () => {
    const view = await mount()
    await push(board({ containers: [] }))
    expect(screen.getByTestId('docker-empty').textContent).toContain('NO CONTAINERS')
    await view.rerender({ state: { filter: 'running' } })
    await push(board({ containers: [WORKER] }))
    expect(screen.getByTestId('docker-empty').textContent).toContain('NOTHING RUNNING')
  })

  it('opens the card from the name only, never from the rest of the row or its presses', async () => {
    vi.useFakeTimers()
    await mount()
    await push(board())
    // A card opened by the whole row covered the presses of the rows below (user report).
    for (const part of ['docker-image', 'docker-ports', 'docker-state', 'docker-actions']) {
      await fireEvent.pointerEnter(row('shop-api-1'), { clientX: 400 })
      await fireEvent.pointerEnter(within(row('shop-api-1'), part), { clientX: 400 })
      vi.advanceTimersByTime(400)
      await settle()
      expect(screen.queryByTestId('docker-card'), part).toBeNull()
    }
  })

  it('opens the card on a name with what the row has no room for', async () => {
    vi.useFakeTimers()
    await mount()
    await push(board())
    await fireEvent.pointerEnter(within(row('shop-api-1'), 'docker-name'), { clientX: 40 })
    vi.advanceTimersByTime(400)
    await settle()
    const card = screen.getByTestId('docker-card')
    expect(card.textContent).toContain('shop-api-1')
    expect(card.textContent).toContain('/home/dev/shop')
    expect(card.textContent).toContain('shop · service api')
  })
})
