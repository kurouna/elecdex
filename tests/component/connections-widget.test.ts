import type { MetricSample, NetSocket, NetSockets } from '@shared/metrics'
import { socketKey } from '@shared/sockets'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: ConnectionsWidget } = await import(
  '../../src/renderer/widgets/connections/ConnectionsWidget.svelte'
)
const { metrics } = await import('../../src/renderer/stores/metrics.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { GhostTracker } = await import('../../src/renderer/lib/ghosts.ts')

/**
 * The connections pane.
 *
 * What it has to get right is what a socket table cannot say for itself: a
 * connection that opened and closed between two readings must still be seen
 * (the ghost row), the two views must not overlap, and no address may reach the
 * screen when the pane is masked for a screenshot.
 */

let deliver: ((sample: MetricSample) => void) | null = null
let release: (() => void) | null = null

const socket = (over: Partial<NetSocket> = {}): NetSocket => ({
  family: 4,
  localAddress: '192.0.2.2',
  localPort: 4821,
  remoteAddress: '93.184.216.34',
  remotePort: 443,
  state: 'established',
  pid: 2140,
  process: 'firefox',
  country: 'US',
  publicPeer: true,
  ...over,
})

const table = (sockets: NetSocket[]): NetSockets => ({
  sockets,
  established: sockets.filter((entry) => entry.state === 'established').length,
  listening: sockets.filter((entry) => entry.state === 'listen').length,
  dropped: 0,
  ownersUnknown: false,
  owners: {},
})

beforeEach(() => {
  deliver = null
  release = null
  // The store applies a sample in the next shared frame; nothing drives a frame
  // loop here, so the stall timer is what delivers it (frame-loop.ts).
  vi.useFakeTimers()
  vi.stubGlobal('elecdex', {
    metrics: {
      subscribe: (_id: string, onSample: (sample: MetricSample) => void) => {
        deliver = onSample
        return () => {
          deliver = null
        }
      },
    },
    layout: { save: vi.fn(async () => {}) },
  })
})

afterEach(async () => {
  cleanup()
  // Releasing the last reader clears the sample, so the next test starts empty.
  release?.()
  vi.useRealTimers()
  await layout.flush()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

/** Past the frame loop's stall timer, which is what applies a waiting sample. */
async function frame(): Promise<void> {
  await vi.advanceTimersByTimeAsync(600)
  await settle()
}

/** Renders the pane and hands back a way to push readings into it. */
async function mount(
  state: Record<string, unknown> = {},
): Promise<(next: NetSockets) => Promise<void>> {
  release = metrics.retain('net.sockets')
  render(ConnectionsWidget, {
    props: {
      paneId: 'p1',
      title: 'connections',
      props: {},
      state,
      active: true,
      widget: 'connections',
    },
  })
  await settle()
  const push = async (next: NetSockets): Promise<void> => {
    // IPC cannot clone a $state proxy, and neither can this.
    deliver?.({ id: 'net.sockets', at: Date.now(), data: structuredClone(next) } as MetricSample)
    await frame()
  }
  return push
}

describe('ConnectionsWidget', () => {
  it('draws a socket with its peer, its service and its country', async () => {
    const push = await mount()
    await push(table([socket()]))
    expect(screen.getByTestId('connection-remote').textContent).toContain('93.184.216.34:443')
    expect(screen.getByTestId('connections-group-head').textContent).toContain('firefox')
    expect(screen.getByTestId('connections-country').dataset.code).toBe('US')
  })

  it('keeps a connection that came and went on screen for one more reading', async () => {
    const push = await mount()
    await push(table([socket(), socket({ localPort: 4822, remoteAddress: '203.0.113.9' })]))
    expect(screen.getAllByTestId('connection-row')).toHaveLength(2)

    // The second is gone: still drawn, marked, so a short-lived connection is
    // not invisible between two readings.
    await push(table([socket()]))
    const rows = screen.getAllByTestId('connection-row')
    expect(rows).toHaveLength(2)
    expect(rows.some((row) => row.classList.contains('gone'))).toBe(true)

    // And dropped at the reading after that.
    await push(table([socket()]))
    expect(screen.getAllByTestId('connection-row')).toHaveLength(1)
  })

  it('keeps the two views apart, so a socket is in exactly one', async () => {
    const both = table([socket(), socket({ localPort: 22, state: 'listen', process: 'sshd' })])
    const push = await mount()
    await push(both)
    expect(screen.getAllByTestId('connection-row')).toHaveLength(1)
    expect(screen.getByTestId('connection-remote').textContent).toContain('93.184.216.34')

    // The switch writes the choice to pane state, which is what brings it back
    // after a restart; the view itself comes from that state.
    const asked = vi.spyOn(layout, 'patchPaneState')
    await fireEvent.click(document.querySelector('[data-view="listening"]') as HTMLElement)
    expect(asked).toHaveBeenCalledWith('p1', { view: 'listening' })
    asked.mockRestore()

    cleanup()
    release?.()
    const again = await mount({ view: 'listening' })
    await again(both)
    expect(screen.getAllByTestId('connection-row')).toHaveLength(1)
    expect(screen.getByTestId('connection-row').dataset.state).toBe('listen')
  })

  it('gives a listening address the room of the peer it does not have', async () => {
    // `0.0.0.0:49664` sat in the column sized for a bare port and ran over the
    // word beside it. A listening row now draws its one end where the circuit
    // and the peer would be.
    const push = await mount({ view: 'listening' })
    await push(
      table([
        socket({
          state: 'listen',
          localAddress: '0.0.0.0',
          localPort: 49_664,
          remoteAddress: '',
          remotePort: 0,
          publicPeer: false,
          country: '',
        }),
      ]),
    )
    const row = screen.getByTestId('connection-row')
    expect(row.classList.contains('listen')).toBe(true)
    expect(screen.getByTestId('connection-local').textContent).toBe('0.0.0.0:49664')
    expect(row.querySelector('.link')).toBeNull()
    expect(screen.queryByTestId('connection-remote')).toBeNull()
  })

  it('filters on what a row shows', async () => {
    const push = await mount()
    await push(
      table([socket(), socket({ localPort: 6001, process: 'elecdex', remoteAddress: '1.1.1.1' })]),
    )
    await fireEvent.input(screen.getByTestId('connections-filter'), {
      target: { value: 'elecdex' },
    })
    await settle()
    expect(screen.getAllByTestId('connection-row')).toHaveLength(1)

    await fireEvent.input(screen.getByTestId('connections-filter'), {
      target: { value: 'nothing' },
    })
    await settle()
    expect(screen.getByTestId('connections-empty')).toBeTruthy()
  })

  it('shows no whole address once it is masked', async () => {
    const push = await mount({ mask: true })
    await push(table([socket()]))
    const shown = screen.getByTestId('connection-remote').textContent ?? ''
    expect(shown).toContain('93.184')
    expect(shown).not.toContain('216.34')
  })

  it('survives a reading that adds a socket, which is every reading on a busy machine', async () => {
    // The pane froze here: the effect that marks new rows both read and wrote
    // the same set, so the first reading that added anything ran it for ever
    // (svelte.dev/e/effect_update_depth_exceeded). A fixed table never showed it.
    const thrown: string[] = []
    const onError = (event: ErrorEvent): void => {
      thrown.push(event.message)
    }
    window.addEventListener('error', onError)
    try {
      const push = await mount()
      await push(table([socket()]))
      await push(table([socket(), socket({ localPort: 4822, remoteAddress: '203.0.113.9' })]))
      await push(table([socket(), socket({ localPort: 4823, remoteAddress: '198.51.100.7' })]))
      expect(thrown).toEqual([])
      expect(screen.getAllByTestId('connection-row').length).toBeGreaterThan(1)
    } finally {
      window.removeEventListener('error', onError)
    }
  })

  it('draws a service listening on both stacks as two rows, not one key twice', async () => {
    // A keyed list throws on a repeated key and stops drawing. sshd on 0.0.0.0:22
    // and on [::]:22 is the same pid and the same port with no peer to tell them
    // apart, so the key has to carry the address and the family.
    const push = await mount({ view: 'listening' })
    await push(
      table([
        socket({
          state: 'listen',
          pid: 812,
          process: 'sshd',
          localAddress: '0.0.0.0',
          localPort: 22,
          remoteAddress: '',
          remotePort: 0,
          publicPeer: false,
          country: '',
        }),
        socket({
          family: 6,
          state: 'listen',
          pid: 812,
          process: 'sshd',
          localAddress: '::',
          localPort: 22,
          remoteAddress: '',
          remotePort: 0,
          publicPeer: false,
          country: '',
        }),
      ]),
    )
    expect(screen.getAllByTestId('connection-row')).toHaveLength(2)
  })

  it('tells two node listeners apart by what they were started to serve', async () => {
    const push = await mount({ view: 'listening' })
    const listener = (pid: number, port: number): NetSocket =>
      socket({
        state: 'listen',
        pid,
        process: 'node',
        localAddress: '127.0.0.1',
        localPort: port,
        remoteAddress: '',
        remotePort: 0,
        publicPeer: false,
        country: '',
      })
    await push({
      ...table([listener(1502, 5173), listener(1600, 3000), listener(1700, 8081)]),
      owners: {
        '1502': { tool: 'vite', project: 'elecdex' },
        '1600': { tool: 'next', project: '' },
      },
    })
    const roles = screen.getAllByTestId('connections-role').map((role) => role.textContent)
    expect(roles.sort()).toEqual(['next', 'vite · elecdex'])
    // A process the collector had nothing to say about keeps a plain head.
    expect(screen.getAllByTestId('connections-group-head')).toHaveLength(3)
  })

  it('says what the platform could not tell it', async () => {
    const push = await mount()
    await push({ ...table([socket({ pid: 0, process: '' })]), ownersUnknown: true })
    expect(screen.getByTestId('connections-group-head').textContent).toContain('unknown')
  })
})

describe('GhostTracker', () => {
  it('reports what went, once, and forgets it at the next reading', () => {
    const ghosts = new GhostTracker<NetSocket>(socketKey)
    const a = socket()
    const b = socket({ localPort: 2 })

    expect(ghosts.update([a, b]).every((row) => !row.gone)).toBe(true)
    const second = ghosts.update([a])
    expect(second.filter((row) => row.gone).map((row) => row.item.localPort)).toEqual([2])
    expect(ghosts.update([a]).some((row) => row.gone)).toBe(false)
  })

  it('does not call a row new again when it comes back', () => {
    const ghosts = new GhostTracker<NetSocket>(socketKey)
    const a = socket()
    ghosts.update([a])
    ghosts.update([])
    expect(ghosts.update([a]).some((row) => row.gone)).toBe(false)
  })
})
