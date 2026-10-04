import { ANNUNCIATORS } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'
import { type CodeTaker, giveCode, typeAtBasic } from '../../src/renderer/widgets/elec16/code/give'

/**
 * What the pane types on the machine for CODE's RUN ▸ and LOAD ▸ and for FILES' LOAD ▸: the
 * machine brought to a prompt first - a program running is stopped, even one asleep at an
 * INPUT or waiting for a key, whose keys these would otherwise have been - and when that
 * cannot be done, the reason said, where they once did nothing without a word.
 */

const bit = (name: (typeof ANNUNCIATORS)[number]): number => 1 << ANNUNCIATORS.indexOf(name)

function taker(over: Partial<CodeTaker> = {}) {
  const did: string[] = []
  const t: CodeTaker = {
    off: false,
    asleep: true,
    status: 'running',
    annunciators: bit('RUN'),
    brk: () => did.push('brk'),
    whenAsleep: async () => true,
    loadCode: () => {
      did.push('load')
      return true
    },
    typeText: (text) => did.push(`type ${text}`),
    ...over,
  }
  return { t, did }
}

const IMAGE = new Uint8Array([1, 2, 3])

describe("CODE's RUN and LOAD", () => {
  it('writes the code and types CALL at an idle prompt, with no BRK', async () => {
    const { t, did } = taker()
    expect(await giveCode(t, IMAGE, 'run')).toBeNull()
    expect(did).toEqual(['load', 'type CALL 28672\n'])
  })

  it('stops a BASIC program first, though it sleeps waiting at an INPUT', async () => {
    const { t, did } = taker({ annunciators: bit('RUN') | bit('BUSY') })
    expect(await giveCode(t, IMAGE, 'run')).toBeNull()
    expect(did).toEqual(['brk', 'load', 'type CALL 28672\n'])
  })

  it('runs and lists from the monitor in its own words', async () => {
    const { t, did } = taker({ annunciators: bit('MON') })
    expect(await giveCode(t, IMAGE, 'run')).toBeNull()
    expect(await giveCode(t, IMAGE, 'load')).toBeNull()
    expect(did.filter((d) => d.startsWith('type'))).toEqual(['type G 7000\n', 'type U 7000\n'])
  })

  it('calls the code itself on PLAY-320, which has no prompt to type at, and LOAD only puts it there', async () => {
    const { t, did } = taker({
      annunciators: 0,
      callCode: (at) => did.push(`call ${at.toString(16)}`),
    })
    expect(await giveCode(t, IMAGE, 'run')).toBeNull()
    expect(await giveCode(t, IMAGE, 'load')).toBeNull()
    expect(did).toEqual(['load', 'call 7000', 'load'])
  })

  it('stops a program on PLAY-320 first, as on the others', async () => {
    const { t, did } = taker({ asleep: false, annunciators: 0, callCode: () => did.push('call') })
    expect(await giveCode(t, IMAGE, 'run')).toBeNull()
    expect(did).toEqual(['brk', 'load', 'call'])
  })

  it('says why when the machine does not come back to a prompt', async () => {
    const { t, did } = taker({ asleep: false, whenAsleep: async () => false })
    expect(await giveCode(t, IMAGE, 'run')).toMatch(/did not come back to its prompt/)
    expect(did).toEqual(['brk'])
  })

  it('says why when there is no machine to write the code into', async () => {
    const { t, did } = taker({ loadCode: () => false })
    expect(await giveCode(t, IMAGE, 'load')).toMatch(/no machine running in this pane/)
    expect(did).toEqual([])
  })
})

describe("FILES' LOAD", () => {
  it('types the LOAD at an idle prompt', async () => {
    const { t, did } = taker()
    expect(await typeAtBasic(t, 'LOAD "CLOCK.BAS"')).toBeNull()
    expect(did).toEqual(['type LOAD "CLOCK.BAS"\n'])
  })

  it('stops a program waiting for a key first, which would have taken the L as its key', async () => {
    const { t, did } = taker({ annunciators: bit('RUN') | bit('BUSY') })
    expect(await typeAtBasic(t, 'LOAD "CLOCK.BAS"')).toBeNull()
    expect(did).toEqual(['brk', 'type LOAD "CLOCK.BAS"\n'])
  })

  it('leaves the monitor for BASIC first, where LOAD is a word', async () => {
    const { t, did } = taker({ annunciators: bit('MON') })
    expect(await typeAtBasic(t, 'LOAD "X.BIN":CALL 28672')).toBeNull()
    expect(did).toEqual(['type Q\nLOAD "X.BIN":CALL 28672\n'])
  })

  it('says why when the machine does not come back to a prompt', async () => {
    const { t } = taker({ off: true, whenAsleep: async () => false })
    expect(await typeAtBasic(t, 'LOAD "CLOCK.BAS"')).toMatch(/did not come back to its prompt/)
  })
})
