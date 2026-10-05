import type { Elec16Api } from '@shared/api'
import type { Elec16Board, Elec16Claim, Elec16Unit } from '@shared/elec16-units'
import { describe, expect, it } from 'vitest'
import type { Elec16Runner } from '../../src/renderer/widgets/elec16/runner.svelte.ts'
import { UnitSession } from '../../src/renderer/widgets/elec16/unit-session.svelte.ts'

/**
 * A pane's hold on its unit (widgets/elec16/unit-session.svelte.ts) on stand-ins for main and
 * the runner: a game goes only into a slot a model has, and only into the unit that asked;
 * a claim that comes back after the pane went is let go; main not answering is said, not a
 * pane left loading for ever.
 */

const unitOf = (id: string, model: Elec16Unit['model']): Elec16Unit => ({
  id,
  name: id.toUpperCase(),
  clock: 4,
  model,
  autoOff: 10,
  xram: 128,
  created: 0,
})

const ROMS = { pocket: new Uint8Array(4), play: new Uint8Array(4) }

function fakeRunner() {
  const done: string[] = []
  const runner = {
    onCard: null,
    onLink: null,
    onLinkDrop: null,
    machine: null,
    boot: () => void done.push('boot'),
    adopt: () => void done.push('adopt'),
    detach: () => null,
    reset: () => void done.push('reset'),
    setHz: () => {},
  }
  return { done, runner: runner as unknown as Elec16Runner }
}

/** main as the session sees it: answers held until the test lets them go. */
function fakeApi(units: Elec16Unit[]) {
  const calls: string[] = []
  const later = new Map<string, (value: unknown) => void>()
  const wait = <T>(key: string) =>
    new Promise<T>((resolve) => {
      later.set(key, resolve as (value: unknown) => void)
    })
  const board: Elec16Board = { units, held: [] }
  const api = {
    board: async () => board,
    claim: (unit: string) => {
      calls.push(`claim ${unit}`)
      return wait<Elec16Claim>(`claim ${unit}`)
    },
    release: async (unit: string) => {
      calls.push(`release ${unit}`)
      return true
    },
    insertGame: (unit: string, _pane: string, id: string | null) => {
      calls.push(`insert ${unit} ${id}`)
      return wait<Elec16Unit | null>(`insert ${unit}`)
    },
    onChange: () => () => {},
    onGiveBack: () => () => {},
  }
  return {
    calls,
    answer: (key: string, value: unknown) => later.get(key)?.(value),
    api: api as unknown as Elec16Api,
    board,
  }
}

const settle = async () => {
  for (let k = 0; k < 50; k++) await Promise.resolve()
}

async function running(units: Elec16Unit[], pane = 'p1') {
  const main = fakeApi(units)
  const { runner, done } = fakeRunner()
  const session = new UnitSession(main.api, pane, runner, { keep: () => {} })
  const started = session.start(ROMS, units[0]?.id, {}, null, false)
  await settle()
  main.answer(`claim ${units[0]?.id}`, { ok: true, snapshot: null })
  await started
  return { main, runner, done, session }
}

describe("a pane's hold on its unit", () => {
  it('puts a game only into a model with a slot', async () => {
    const { main, session } = await running([unitOf('u1', 'pocket-48')])
    expect(session.phase).toBe('running')
    await expect(session.insertGame('SPACE')).resolves.toBe(false)
    expect(main.calls.filter((c) => c.startsWith('insert'))).toEqual([])
    session.dispose()
  })

  it("never takes main's answer for one unit as the unit it runs now", async () => {
    const play = unitOf('u1', 'play-320')
    const { main, session, done } = await running([play, unitOf('u2', 'play-320')])
    const inserted = session.insertGame('SPACE')
    await settle()
    // Another unit, as by switching, while main answered for the first.
    session.unit = unitOf('u2', 'play-320')
    main.answer('insert u1', { ...play, cart: 'SPACE' })
    await expect(inserted).resolves.toBe(false)
    expect(session.unit.id).toBe('u2')
    expect(done.filter((d) => d === 'reset')).toEqual([])
    session.dispose()
    await expect(session.insertGame('SPACE')).resolves.toBe(false)
    expect(main.calls.filter((c) => c.startsWith('insert'))).toEqual(['insert u1 SPACE'])
  })

  it('lets go of a unit whose claim came back after the pane went, unless the pane is mounted again', async () => {
    const unit = unitOf('u1', 'pocket-48')
    const main = fakeApi([unit])
    const closing = new UnitSession(main.api, 'gone', fakeRunner().runner, { keep: () => {} })
    const started = closing.start(ROMS, 'u1', {}, null, false)
    await settle()
    closing.dispose()
    main.answer('claim u1', { ok: true, snapshot: null })
    await started
    expect(main.calls).toEqual(['claim u1', 'release u1'])

    const other = fakeApi([unit])
    const moving = new UnitSession(other.api, 'moved', fakeRunner().runner, { keep: () => {} })
    const first = moving.start(ROMS, 'u1', {}, null, false)
    await settle()
    moving.dispose()
    // The pane's next mount is there: the unit is its now.
    const next = new UnitSession(other.api, 'moved', fakeRunner().runner, { keep: () => {} })
    other.answer('claim u1', { ok: true, snapshot: null })
    await first
    expect(other.calls).toEqual(['claim u1'])
    next.dispose()
  })

  it('says main could not be asked, rather than loading for ever', async () => {
    const main = fakeApi([unitOf('u1', 'pocket-48')])
    const failing = {
      ...(main.api as object),
      board: async () => {
        throw new Error('no main')
      },
    } as unknown as Elec16Api
    const session = new UnitSession(failing, 'p1', fakeRunner().runner, { keep: () => {} })
    await session.start(ROMS, 'u1', {}, null, false)
    expect(session.phase).toBe('failed')
    session.dispose()
  })
})
