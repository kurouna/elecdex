import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * The pane's development folder (widgets/elec16/dev-game.svelte.ts, docs/elec16-play.md
 * section 11) on stand-ins for main and CODE's worker: a build writes its two files back,
 * goes on the shelf and into the slot; a failure says where; a change builds again; the folder
 * is watched only while seen and open; closing lets go of everything and ends a build under
 * way; a pane mounted again keeps its folder.
 */

const built = {
  ok: true as const,
  image: new Uint8Array([7]),
  assets: 'A',
  compiled: 'C',
  banks: 3,
  ramCode: 1000,
  tiles: 40,
}
let outcome: unknown = built
/** When set, the next build waits for it. */
let gate: Promise<void> | null = null
let held = 0
vi.mock('../../src/renderer/widgets/elec16/code/compiler.ts', () => ({
  buildKit: async () => {
    if (gate !== null) await gate
    return outcome
  },
  holdCompiler: () => {
    held++
    return () => {
      held--
    }
  },
}))

const { DevGame, sameFiles } = await import('../../src/renderer/widgets/elec16/dev-game.svelte.ts')

afterEach(() => {
  outcome = built
  gate = null
})

function api(pane = 'p1') {
  const calls: string[] = []
  const changed = new Set<(pane: string) => void>()
  let gen = 0
  const main = {
    /** What main keeps for the pane. */
    state: null as { name: string; gen: number } | null,
    files: { meta: '{}', texts: { 'main.e16.ts': 'one' } as Record<string, string>, pictures: {} },
    written: true,
    folders: ['mygame', 'other'],
  }
  const opened = () => {
    gen++
    main.state = { name: main.folders[gen - 1] ?? 'more', gen }
    return { ok: true as const, ...main.state }
  }
  return {
    calls,
    main,
    change: (to = pane) => {
      for (const h of changed) h(to)
    },
    api: {
      devOpen: async (p: string) => {
        calls.push(`open ${p}`)
        return opened()
      },
      devNew: async () => ({ ok: false as const, problem: 'NEW GAME needs an empty folder' }),
      devState: async () => main.state,
      devRead: async (_p: string, g: number) => {
        calls.push(`read ${g}`)
        return { ok: true as const, files: structuredClone(main.files) }
      },
      devWrite: async (_p: string, g: number, a: string, c: string) => {
        calls.push(`write ${g} ${a} ${c}`)
        return main.written
      },
      devInstall: async (_p: string, g: number, image: Uint8Array) => {
        calls.push(`install ${g} ${image[0]}`)
        return { ok: true as const, id: 'MYGAME' }
      },
      devClose: async (p: string) => {
        calls.push(`close ${p}`)
        main.state = null
      },
      devWatch: (p: string, on: boolean) => {
        calls.push(`watch ${p} ${on}`)
      },
      onDevChange: (h: (pane: string) => void) => {
        changed.add(h)
        return () => {
          changed.delete(h)
        }
      },
    },
  }
}

/** Until no build is going (promises only, no timers). */
const settle = async () => {
  for (let k = 0; k < 200; k++) await Promise.resolve()
}

const inserting =
  (into: string[] = []) =>
  async (id: string) => {
    into.push(id)
    return true
  }

describe("the pane's development folder", () => {
  it('builds what it opens: the two files back, onto the shelf, into the slot', async () => {
    const a = api()
    const inserted: string[] = []
    const dev = new DevGame(a.api, 'p1', inserting(inserted), async () => 0x80e0)
    dev.setSeen(true)
    await dev.open()
    await settle()
    expect(dev.folder).toBe('mygame')
    expect([dev.status, dev.report, dev.builds]).toEqual([
      'built',
      { banks: 3, ramCode: 1000, tiles: 40 },
      1,
    ])
    expect(a.calls).toEqual(['open p1', 'watch p1 true', 'read 1', 'write 1 A C', 'install 1 7'])
    expect(inserted).toEqual(['MYGAME'])
    expect(held).toBe(1)
    dev.close()
  })

  it('says where a build failed, and builds again when the folder changes', async () => {
    outcome = { ok: false, errors: [{ file: 'main.e16.ts', line: 12, message: 'x is not a u16' }] }
    const a = api()
    const dev = new DevGame(a.api, 'p1', inserting(), async () => 0)
    await dev.open()
    await settle()
    expect(dev.status).toBe('failed')
    expect(dev.problems).toEqual([{ file: 'main.e16.ts', line: 12, message: 'x is not a u16' }])
    expect(a.calls.some((c) => c.startsWith('install'))).toBe(false)
    outcome = built
    a.main.files.texts['main.e16.ts'] = 'two'
    // Another pane's folder changed: not this one's.
    a.change('p2')
    await settle()
    expect(dev.status).toBe('failed')
    a.change()
    await settle()
    expect([dev.status, dev.problems, dev.builds]).toEqual(['built', [], 1])
    dev.dispose()
  })

  it('watches only while seen and open, says why a folder would not open, and lets go on close', async () => {
    const a = api()
    const dev = new DevGame(a.api, 'p1', inserting(), async () => 0)
    // No folder: main is never asked to watch nothing.
    dev.setSeen(true)
    dev.setSeen(false)
    dev.setSeen(true)
    await settle()
    expect(a.calls).toEqual([])
    await dev.create()
    expect([dev.folder, dev.status, dev.problems[0]?.message]).toEqual([
      null,
      'failed',
      'NEW GAME needs an empty folder',
    ])
    await dev.open()
    await settle()
    dev.setSeen(false)
    dev.setSeen(true)
    await settle()
    const before = held
    dev.close()
    expect(a.calls.filter((c) => c.startsWith('watch') || c.startsWith('close'))).toEqual([
      'watch p1 true',
      'watch p1 false',
      'watch p1 true',
      'watch p1 false',
      'close p1',
    ])
    expect(held).toBe(before - 1)
    expect(dev.folder).toBeNull()
  })

  it('closes its folder when the unit has no slot any more (made a pocket model in TUNE)', async () => {
    const a = api()
    const inserted: string[] = []
    const dev = new DevGame(a.api, 'p1', inserting(inserted), async () => 0)
    dev.setSeen(true)
    dev.setSlot(true)
    await dev.open()
    await settle()
    expect(dev.folder).not.toBeNull()
    const builds = dev.builds
    dev.setSlot(false)
    expect(dev.folder).toBeNull()
    expect(a.calls.slice(-2)).toEqual(['watch p1 false', 'close p1'])
    // A change told after it builds nothing and puts nothing in the slot.
    a.change()
    await settle()
    expect([dev.builds, dev.status]).toEqual([0, 'idle'])
    expect(inserted).toHaveLength(builds)
    dev.dispose()
  })

  it('lets a build under way come to nothing when the folder is closed or another opened', async () => {
    const a = api()
    const inserted: string[] = []
    const dev = new DevGame(a.api, 'p1', inserting(inserted), async () => 0)
    let open = () => {}
    gate = new Promise((r) => {
      open = r
    })
    await dev.open()
    await settle()
    dev.close()
    open()
    await settle()
    expect(a.calls.some((c) => c.startsWith('write') || c.startsWith('install'))).toBe(false)
    expect([dev.status, dev.folder, inserted]).toEqual(['idle', null, []])

    // Another folder opened while the first builds: only the second's build goes anywhere.
    gate = new Promise((r) => {
      open = r
    })
    await dev.open()
    await settle()
    gate = null
    await dev.open()
    await settle()
    open()
    await settle()
    expect(a.calls.filter((c) => c.startsWith('write'))).toEqual(['write 3 A C'])
    expect([dev.folder, dev.builds, inserted]).toEqual(['more', 1, ['MYGAME']])
    dev.close()
  })

  it('builds what changed while it was out of sight once seen again, and nothing that did not', async () => {
    const a = api()
    const dev = new DevGame(a.api, 'p1', inserting(), async () => 0)
    dev.setSeen(true)
    await dev.open()
    await settle()
    dev.setSeen(false)
    dev.setSeen(true)
    await settle()
    // Read again, the same: the machine goes on.
    expect(dev.builds).toBe(1)
    dev.setSeen(false)
    a.main.files.texts['main.e16.ts'] = 'edited unseen'
    dev.setSeen(true)
    await settle()
    expect([dev.status, dev.builds]).toEqual(['built', 2])
    dev.close()
  })

  it('keeps its folder for the next mount of a moved pane, and closes it for a closed one', async () => {
    vi.useFakeTimers()
    try {
      const a = api()
      const first = new DevGame(a.api, 'p1', inserting(), async () => 0)
      first.setSeen(true)
      await first.open()
      await settle()
      const before = held
      first.dispose()
      expect(held).toBe(before - 1)
      expect(a.calls.filter((c) => c.startsWith('close'))).toEqual([])
      expect(a.calls.at(-1)).toBe('watch p1 false')
      const next = new DevGame(a.api, 'p1', inserting(), async () => 0)
      next.setSeen(true)
      await settle()
      expect([next.folder, next.status, next.builds, next.report?.banks]).toEqual([
        'mygame',
        'built',
        1,
        3,
      ])
      expect(a.calls.at(-1)).toBe('read 1')
      expect(a.calls.filter((c) => c.startsWith('watch')).at(-1)).toBe('watch p1 true')
      next.dispose()
      // Nobody mounted it again: the pane was closed, and its folder with it.
      vi.advanceTimersByTime(20_000)
      expect(a.calls.at(-1)).toBe('close p1')
    } finally {
      vi.useRealTimers()
    }
  })

  it('says when the build could not be written back or the game would not go in the slot', async () => {
    const a = api()
    a.main.written = false
    const dev = new DevGame(a.api, 'p1', inserting(), async () => 0)
    await dev.open()
    await settle()
    expect([dev.status, dev.problems[0]?.message]).toEqual([
      'failed',
      'assets.e16.ts and compiled.s could not be written back',
    ])
    expect(a.calls.some((c) => c.startsWith('install'))).toBe(false)
    a.main.written = true
    const refusing = new DevGame(
      a.api,
      'p2',
      async () => false,
      async () => 0,
    )
    await refusing.open()
    await settle()
    expect([refusing.status, refusing.problems[0]?.message]).toEqual([
      'failed',
      'the game could not go in the slot',
    ])
    dev.close()
    refusing.close()
  })

  it('compares two reads of a folder byte for byte', () => {
    const one = { meta: 'm', texts: { a: 'x' }, pictures: { p: new Uint8Array([1, 2]) } }
    expect(sameFiles(one, structuredClone(one))).toBe(true)
    expect(sameFiles(one, { ...one, texts: { a: 'y' } })).toBe(false)
    expect(sameFiles(one, { ...one, pictures: { p: new Uint8Array([1, 3]) } })).toBe(false)
    expect(sameFiles(one, { ...one, pictures: {} })).toBe(false)
    expect(sameFiles(one, { ...one, meta: 'n' })).toBe(false)
  })
})
