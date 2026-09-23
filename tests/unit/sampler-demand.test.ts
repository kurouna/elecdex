import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { SamplerDemand, WANTED_FOR_MS } from '../../src/services/metrics/sampler-demand.js'
import { WindowsSampler } from '../../src/services/metrics/windows-sampler.js'

/**
 * The Windows sampler reads only what the collector asks for: the wanted set,
 * and - on Windows - the real PowerShell sampler, which must emit no process
 * table, socket table or ping while nothing asks for them, and start them when
 * something does.
 */

describe('what the sampler is asked for', () => {
  it('sends the wanted set when it changes, and nothing when it does not', () => {
    const demand = new SamplerDemand()
    demand.want(['net', 'iface'], 0)
    expect(demand.change(0)).toEqual({ line: 'net,iface', lapsed: [] })
    demand.want(['net', 'iface'], 1000)
    expect(demand.change(1000)).toBeNull()
    demand.want(['proc', 'tcp'], 2000)
    expect(demand.change(2000)).toEqual({ line: 'net,iface,proc,tcp', lapsed: [] })
  })

  it('lets a kind lapse once it is no longer asked for, and says which', () => {
    const demand = new SamplerDemand()
    demand.want(['net', 'proc'], 0)
    demand.change(0)
    // The charts go on asking for the network; nothing asks for processes any more.
    demand.want(['net'], WANTED_FOR_MS.proc)
    expect(demand.change(WANTED_FOR_MS.proc)).toEqual({ line: 'net', lapsed: ['proc'] })
  })

  it('keeps a slow kind for its own longer window', () => {
    const demand = new SamplerDemand()
    demand.want(['swap'], 0)
    demand.change(0)
    expect(demand.wanted(30_000)).toEqual(['swap'])
    expect(demand.wanted(WANTED_FOR_MS.swap)).toEqual([])
  })

  it('tells a new sampler the whole set, since it has heard nothing', () => {
    const demand = new SamplerDemand()
    demand.want(['net'], 0)
    demand.change(0)
    demand.restart()
    expect(demand.change(0)?.line).toBe('net')
  })
})

describe.runIf(process.platform === 'win32')('the Windows sampler, for real', () => {
  it('reads no processes, sockets or ping until asked, and reads them once they are', async () => {
    const sampler = new WindowsSampler('127.0.0.1')
    try {
      // Only what the charts ask for with the window put away: the network throughput.
      for (let i = 0; i < 8; i += 1) {
        await sampler.throughput()
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      expect(sampler.readings.get('net') ?? 0).toBeGreaterThan(3)
      for (const kind of ['proc', 'tcp', 'ping', 'dio', 'drives'] as const) {
        expect(sampler.readings.get(kind) ?? 0, kind).toBe(0)
      }
      // A top list opens: processes are read, straight away and twice for the CPU share.
      const list = await sampler.processes({ cores: 4, totalMemory: 8e9, limit: 5 })
      expect(list.all).toBeGreaterThan(0)
      expect(sampler.readings.get('proc') ?? 0).toBeGreaterThanOrEqual(2)
      expect(sampler.readings.get('tcp') ?? 0).toBe(0)
    } finally {
      sampler.stop()
    }
  }, 60_000)

  it('serves nothing from before a stop, and names the owners on the first socket reading', async () => {
    const sampler = new WindowsSampler('127.0.0.1')
    try {
      // The battery pane, then the sampler stopped (as its idle limit does), then the pane again.
      await sampler.battery()
      const before = sampler.readings.get('power') ?? 0
      sampler.stop()
      await sampler.battery()
      expect(sampler.readings.get('power') ?? 0).toBe(before + 1)
      // The globe keeps the socket table read; the connections pane then opens and wants names.
      await sampler.tcpRemotes()
      const { names } = await sampler.tcpSockets()
      expect(names.size).toBeGreaterThan(0)
    } finally {
      sampler.stop()
    }
  }, 60_000)

  it('stops reading what nobody asks for any more, even while nothing asks at all', async () => {
    const sampler = new WindowsSampler('127.0.0.1')
    try {
      await sampler.processes({ cores: 4, totalMemory: 8e9, limit: 5 })
      // The list goes behind a tab and nothing else reads: the sampler stays up (its idle limit
      // is longer), and must drop processes on its own clock once their window has passed.
      await new Promise((resolve) => setTimeout(resolve, WANTED_FOR_MS.proc + 5000 + 5000))
      const settled = sampler.readings.get('proc') ?? 0
      await new Promise((resolve) => setTimeout(resolve, 11_000))
      expect(sampler.readings.get('proc') ?? 0).toBe(settled)
    } finally {
      sampler.stop()
    }
  }, 60_000)
})

describe('the Windows sampler, with a made-up PowerShell', () => {
  /** A child process that says what the test tells it to. */
  function fakeChild() {
    const child = Object.assign(new EventEmitter(), {
      stdout: new PassThrough(),
      stderr: new PassThrough(),
      stdin: new PassThrough(),
      killed: false,
      kill() {
        child.killed = true
        return true
      },
    })
    return child
  }
  const powerLine = `${JSON.stringify({ t: 'power', data: { pct: 0.5, line: 'Online', status: 8 } })}\n`

  it('reads nothing a stopped sampler still had on its way', async () => {
    const children: ReturnType<typeof fakeChild>[] = []
    const sampler = new WindowsSampler('127.0.0.1', () => {
      const child = fakeChild()
      children.push(child)
      return child as never
    })
    const first = sampler.battery()
    children[0]?.stdout.write(powerLine)
    await first
    sampler.stop()
    // Asked again at once: a new sampler. The old one's last line arrives only now.
    const second = sampler.battery()
    expect(children).toHaveLength(2)
    children[0]?.stdout.write(powerLine)
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(sampler.readings.get('power')).toBe(1)
    children[1]?.stdout.write(powerLine)
    await second
    expect(sampler.readings.get('power')).toBe(2)
    sampler.stop()
  })
})
