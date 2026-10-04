import { describe, expect, it, vi } from 'vitest'

/**
 * The pane's development folder (widgets/elec16/dev-game.svelte.ts, docs/elec16-play.md
 * section 11) on stand-ins for main and CODE's worker: a build writes its two files back,
 * goes on the shelf and into the slot; a failure says where; a change builds again; the folder
 * is watched only while seen; closing lets go of everything.
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
let held = 0
vi.mock('../../src/renderer/widgets/elec16/code/compiler.ts', () => ({
  buildKit: async () => outcome,
  holdCompiler: () => {
    held++
    return () => {
      held--
    }
  },
}))

const { DevGame } = await import('../../src/renderer/widgets/elec16/dev-game.svelte.ts')

function api() {
  const calls: string[] = []
  let changed: (() => void) | null = null
  const files = { meta: '{}', texts: {}, pictures: {} }
  return {
    calls,
    change: () => changed?.(),
    api: {
      devOpen: async () => ({ ok: true as const, name: 'mygame' }),
      devNew: async () => ({ ok: false as const, problem: 'the folder already has a game.json' }),
      devRead: async () => ({ ok: true as const, files }),
      devWrite: async (a: string, c: string) => {
        calls.push(`write ${a} ${c}`)
        return true
      },
      devInstall: async (image: Uint8Array) => {
        calls.push(`install ${image[0]}`)
        return { ok: true as const, id: 'MYGAME' }
      },
      devClose: async () => {
        calls.push('close')
      },
      devWatch: (on: boolean) => {
        calls.push(`watch ${on}`)
      },
      onDevChange: (h: () => void) => {
        changed = h
        return () => {
          changed = null
        }
      },
    },
  }
}

/** Until no build is going (promises only, no timers). */
const settle = async () => {
  for (let k = 0; k < 200; k++) await Promise.resolve()
}

describe("the pane's development folder", () => {
  it('builds what it opens: the two files back, onto the shelf, into the slot', async () => {
    outcome = built
    const a = api()
    const inserted: string[] = []
    const dev = new DevGame(
      a.api,
      async (id) => void inserted.push(id),
      async () => 0x80e0,
    )
    dev.setSeen(true)
    await dev.open()
    await settle()
    expect(dev.folder).toBe('mygame')
    expect([dev.status, dev.report, dev.builds]).toEqual([
      'built',
      { banks: 3, ramCode: 1000, tiles: 40 },
      1,
    ])
    expect(a.calls).toEqual(['watch false', 'watch true', 'write A C', 'install 7'])
    expect(inserted).toEqual(['MYGAME'])
    expect(held).toBe(1)
  })

  it('says where a build failed, and builds again when the folder changes', async () => {
    outcome = { ok: false, errors: [{ file: 'main.e16.ts', line: 12, message: 'x is not a u16' }] }
    const a = api()
    const dev = new DevGame(
      a.api,
      async () => {},
      async () => 0,
    )
    await dev.open()
    await settle()
    expect(dev.status).toBe('failed')
    expect(dev.problems).toEqual([{ file: 'main.e16.ts', line: 12, message: 'x is not a u16' }])
    expect(a.calls.some((c) => c.startsWith('install'))).toBe(false)
    outcome = built
    a.change()
    await settle()
    expect([dev.status, dev.problems, dev.builds]).toEqual(['built', [], 1])
    dev.dispose()
  })

  it('watches only while seen, says why a folder would not open, and lets go on close', async () => {
    outcome = built
    const a = api()
    const dev = new DevGame(
      a.api,
      async () => {},
      async () => 0,
    )
    await dev.create()
    expect([dev.folder, dev.status, dev.problems[0]?.message]).toEqual([
      null,
      'failed',
      'the folder already has a game.json',
    ])
    await dev.open()
    await settle()
    dev.setSeen(false)
    dev.setSeen(true)
    const before = held
    dev.close()
    expect(a.calls.slice(-4)).toEqual(['watch false', 'watch true', 'watch false', 'close'])
    expect(held).toBe(before - 1)
    expect(dev.folder).toBeNull()
  })
})
