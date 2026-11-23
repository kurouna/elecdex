import { sourceFromMachine } from '@shared/elec16/charset'
import { SAMPLE } from '@shared/elec16/code-area'
import type { Elec16WritePiece, Elec16WriteResult } from '@shared/elec16-write'
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest'
import type { LevelResult } from '../../src/renderer/widgets/elec16/code/protocol.ts'
import { WriteFlow, type WriteView } from '../../src/renderer/widgets/elec16/write-flow.svelte.ts'

/**
 * WRITE's flow in the page (widgets/elec16/write-flow.svelte.ts; docs/elec16-write.md sections
 * 2-4): one SEND from the words to READY or FAILED, against a main and a compiler the test
 * answers by hand - the question before code of one's own, the fixes, a level up for a program
 * only too big, STOP, UNDO, and nothing taken from a request that is no longer the pane's.
 */

const GOOD = 'export function main(): void { cls() }'
const BAD = 'export function main(): void { putnum(7 / 2) }'
const fenced = (code: string) => `\`\`\`ts\n${code}\n\`\`\``

const levels = (errors: string[] = [], end = 'returned', tooBigBelow = -1): LevelResult[] =>
  ([0, 1, 2] as const).map((level) => {
    const big = level <= tooBigBelow
    const errs = big
      ? [
          {
            file: 'MAIN.TS',
            line: 0,
            column: 0,
            message: 'the program is 2900 bytes: the code area holds 2048',
          },
        ]
      : errors.map((message) => ({ file: 'MAIN.TS', line: 1, column: 40, message }))
    return {
      level,
      asm: `; -O${level}`,
      errors: errs,
      image: errs.length > 0 ? new Uint8Array() : new Uint8Array([1, 2]),
      measured: errs.length > 0 ? null : { cycles: 9, end: end as 'returned' },
    }
  })

interface Harness {
  flow: WriteFlow
  view: WriteView & { text: string; kept: string; builds: LevelResult[][]; begun: number }
  answers: ((r: Elec16WriteResult) => void)[]
  pieces: ((p: Elec16WritePiece) => void)[]
  api: { write: Mock; writeFix: Mock; writeStop: Mock; writeFile: Mock; onWriteText: Mock }
  compiled: string[]
  build: (source: string) => LevelResult[]
  level: { now: 0 | 1 | 2 }
  /** A build waits on this: the test holds it to see the flow while it compiles. */
  gate: Promise<void>
}

function harness(
  start = SAMPLE,
  build: (source: string) => LevelResult[] = (s) =>
    s === BAD ? levels(['/ gives a fraction in TypeScript: use div(a, b)']) : levels(),
): Harness {
  const answers: Harness['answers'] = []
  const pieces: Harness['pieces'] = []
  const compiled: string[] = []
  const pending = () =>
    new Promise<Elec16WriteResult>((resolve) => {
      answers.push(resolve)
    })
  const api = {
    write: vi.fn(pending),
    writeFix: vi.fn(pending),
    writeStop: vi.fn(),
    writeFile: vi.fn(async () => 0),
    onWriteText: vi.fn((handler: (p: Elec16WritePiece) => void) => {
      pieces.push(handler)
      return () => {}
    }),
  }
  const level = { now: 2 as 0 | 1 | 2 }
  const flow = new WriteFlow({
    api,
    pane: 'p1',
    compile: async (_file, source) => {
      compiled.push(source)
      await h.gate
      return h.build(source)
    },
    hold: () => () => {},
    level: () => level.now,
    setLevel: (l) => {
      level.now = l
    },
    choice: () => ({ provider: 'local', model: 'm1', name: 'Local' }),
    now: () => 0,
  })
  const view = {
    text: start,
    kept: start,
    builds: [] as LevelResult[][],
    source() {
      return this.text
    },
    replaced(text: string, kept: boolean) {
      this.text = text
      if (kept) this.kept = text
    },
    onCard(text: string) {
      this.kept = text
    },
    built(l: LevelResult[]) {
      this.builds.push(l)
    },
    begun: 0,
    began() {
      this.begun++
    },
  }
  flow.target('u1', 'MAIN.TS')
  flow.attach(view)
  const h: Harness = {
    flow,
    view,
    answers,
    pieces,
    api,
    compiled,
    build,
    level,
    gate: Promise.resolve(),
  }
  return h
}

const settle = async () => {
  for (let k = 0; k < 10; k++) await Promise.resolve()
}
const answer = async (h: Harness, text: string) => {
  const serial = h.api.write.mock.calls.at(-1)?.[1]?.serial ?? 0
  h.answers.shift()?.({ ok: true, serial, text })
  await settle()
}
const cardText = (h: Harness) =>
  // The card keeps a line end after the last line.
  sourceFromMachine(h.api.writeFile.mock.calls.at(-1)?.[2] as Uint8Array).replace(/\n$/, '')

afterEach(() => vi.restoreAllMocks())

describe("WRITE's flow", () => {
  it('writes at once over the sample, streams the code in, and is ready once it builds', async () => {
    const h = harness()
    h.flow.words = 'make a game'
    h.flow.send()
    expect(h.flow.state).toBe('thinking')
    expect(h.api.write).toHaveBeenCalledWith('p1', {
      serial: 1,
      provider: 'local',
      model: 'm1',
      words: 'make a game',
      code: SAMPLE,
      file: 'MAIN.TS',
    })
    h.pieces[0]?.({ pane: 'p1', serial: 1, round: 0, text: '```ts\nexport fun' })
    expect(h.flow.state).toBe('writing')
    expect(h.flow.live).toBe('export fun')
    // Another pane's text, or an older SEND's, is not this one's.
    h.pieces[0]?.({ pane: 'p2', serial: 1, round: 0, text: 'XX' })
    h.pieces[0]?.({ pane: 'p1', serial: 0, round: 0, text: 'YY' })
    expect(h.flow.live).toBe('export fun')
    await answer(h, fenced(GOOD))
    expect(h.flow.state).toBe('ready')
    expect(h.view.text).toBe(GOOD)
    expect(h.view.kept).toBe(GOOD)
    expect(cardText(h)).toBe(GOOD)
    expect(h.view.builds).toHaveLength(1)
    expect(h.api.writeStop).toHaveBeenCalledWith('p1')
    expect(h.flow.words).toBe('')
  })

  it('asks before code of one’s own is replaced; CANCEL leaves it, REPLACE writes', async () => {
    const h = harness(GOOD)
    h.flow.words = 'make a game'
    h.flow.send()
    expect(h.flow.state).toBe('confirm')
    expect(h.api.write).not.toHaveBeenCalled()
    h.flow.cancel()
    expect(h.flow.state).toBe('idle')
    expect(h.flow.words).toBe('make a game')
    h.flow.send()
    h.flow.replace()
    expect(h.api.write).toHaveBeenCalledTimes(1)
  })

  it('does not ask again over what it wrote itself, and sends that code with the change', async () => {
    const h = harness()
    h.flow.words = 'a game'
    h.flow.send()
    await answer(h, fenced(GOOD))
    h.flow.words = 'score at the top'
    h.flow.send()
    expect(h.flow.state).toBe('thinking')
    expect(h.api.write.mock.calls[1]?.[1]).toMatchObject({ code: GOOD, serial: 2 })
    await answer(h, fenced(`${GOOD}\n// more`))
    // A change to a program: how many of its lines changed.
    expect(h.flow.changedOwn).toBe(true)
    expect(h.flow.changed).toBe(1)
  })

  it('gives e16c’s errors back and takes the fix, keeping the last whole answer on screen meanwhile', async () => {
    const h = harness()
    h.flow.words = 'a game'
    h.flow.send()
    await answer(h, fenced(BAD))
    expect(h.flow.state).toBe('fixing')
    expect(h.flow.live).toBe(BAD)
    expect(h.flow.marks).toEqual([1])
    expect(h.api.writeFix).toHaveBeenCalledWith('p1', {
      serial: 1,
      errors: [
        {
          file: 'MAIN.TS',
          line: 1,
          column: 40,
          message: '/ gives a fraction in TypeScript: use div(a, b)',
        },
      ],
    })
    // The fix coming in does not replace the screen until it has all come.
    h.pieces[0]?.({ pane: 'p1', serial: 1, round: 1, text: '```ts\nexport' })
    expect(h.flow.live).toBe(BAD)
    await answer(h, fenced(GOOD))
    expect(h.flow.state).toBe('ready')
    expect(h.flow.fixes).toBe(1)
    // Written over the sample: a new program, its length; not "changed".
    expect(h.flow.changedOwn).toBe(false)
    expect(h.flow.changed).toBe(1)
  })

  it('drops the last answer’s marks once the fix has come, while it builds', async () => {
    const h = harness()
    h.flow.words = 'a game'
    h.flow.send()
    await answer(h, fenced(BAD))
    expect(h.flow.marks).toEqual([1])
    let open = () => {}
    h.gate = new Promise((resolve) => {
      open = resolve
    })
    await answer(h, fenced(GOOD))
    expect(h.flow.state).toBe('compiling')
    expect(h.flow.live).toBe(GOOD)
    expect(h.flow.marks).toEqual([])
    open()
    await settle()
    expect(h.flow.state).toBe('ready')
  })

  it('fails after two fixes, leaving the code unkept in the editor and UNDO to put the old back', async () => {
    const h = harness(GOOD)
    h.flow.words = 'x'
    h.flow.send()
    h.flow.replace()
    await answer(h, fenced(BAD))
    await answer(h, fenced(BAD))
    await answer(h, fenced(BAD))
    expect(h.api.writeFix).toHaveBeenCalledTimes(2)
    expect(h.flow.state).toBe('failed')
    expect(h.flow.errors).toHaveLength(1)
    expect(h.view.text).toBe(BAD)
    expect(h.view.kept).toBe(GOOD)
    expect(h.api.writeFile).not.toHaveBeenCalled()
    h.flow.undo()
    await settle()
    expect(h.view.text).toBe(GOOD)
    expect(cardText(h)).toBe(GOOD)
    expect(h.flow.undone).toBe(true)
    h.flow.undo()
    await settle()
    expect(h.view.text).toBe(BAD)
  })

  it('moves up a level without a fix when the chosen one is only too big', async () => {
    const h = harness(SAMPLE, () => levels([], 'returned', 0))
    h.level.now = 0
    h.flow.words = 'x'
    h.flow.send()
    await answer(h, fenced(GOOD))
    expect(h.flow.state).toBe('ready')
    expect(h.level.now).toBe(1)
    expect(h.flow.switched).toBe(1)
    expect(h.api.writeFix).not.toHaveBeenCalled()
  })

  it('fixes a program that faults as it starts, an answer with no code, and what the card cannot keep', async () => {
    const faulting = harness(SAMPLE, (s) => (s === GOOD ? levels([], 'fault') : levels()))
    faulting.flow.words = 'x'
    faulting.flow.send()
    await answer(faulting, fenced(GOOD))
    expect(faulting.flow.state).toBe('fixing')
    expect(faulting.api.writeFix.mock.calls[0]?.[1].errors[0].message).toMatch(/faulted/)

    const prose = harness()
    prose.flow.words = 'x'
    prose.flow.send()
    await answer(prose, 'Sorry, I cannot.')
    expect(prose.flow.state).toBe('fixing')
    expect(prose.api.writeFix.mock.calls[0]?.[1].errors[0].message).toMatch(/no .*block/i)

    const kanji = harness()
    kanji.flow.words = 'x'
    kanji.flow.send()
    await answer(kanji, fenced('// 漢字\nexport function main(): void {}'))
    expect(kanji.flow.state).toBe('fixing')
    expect(kanji.api.writeFix.mock.calls[0]?.[1].errors[0]).toMatchObject({ line: 1 })
    expect(kanji.compiled).toEqual([])
  })

  it('STOP keeps what came, unkept and not compiled; main is told', async () => {
    const h = harness()
    h.flow.words = 'x'
    h.flow.send()
    h.pieces[0]?.({ pane: 'p1', serial: 1, round: 0, text: '```ts\nexport function main' })
    h.flow.stop()
    expect(h.api.writeStop).toHaveBeenCalledWith('p1')
    expect(h.flow.state).toBe('stopped')
    expect(h.view.text).toBe('export function main')
    expect(h.view.kept).toBe(SAMPLE)
    // Its answer, coming after all, is not taken.
    h.answers.shift()?.({ ok: false, serial: 1, stop: 'stopped', note: 'stopped' })
    await settle()
    expect(h.flow.state).toBe('stopped')
    expect(h.compiled).toEqual([])
  })

  it('says a provider’s failure in its words', async () => {
    const h = harness()
    h.flow.words = 'x'
    h.flow.send()
    h.answers.shift()?.({ ok: false, serial: 1, stop: 'failed', note: 'the key was refused (401)' })
    await settle()
    expect(h.flow.state).toBe('failed')
    expect(h.flow.note).toBe('the key was refused (401)')
    expect(h.view.text).toBe(SAMPLE)
  })

  it('stops when the unit or the file changes under it, and keeps what came for that file', async () => {
    const h = harness()
    h.flow.words = 'x'
    h.flow.send()
    h.pieces[0]?.({ pane: 'p1', serial: 1, round: 0, text: '```ts\nconst A = 1\n' })
    h.flow.detach(h.view)
    h.flow.target('u2', 'MAIN.TS')
    expect(h.api.writeStop).toHaveBeenCalled()
    expect(h.flow.state).toBe('idle')
    await answer(h, fenced(GOOD))
    expect(h.api.writeFile).not.toHaveBeenCalled()
    expect(h.flow.takePending('u1', 'MAIN.TS')).toBeNull()
  })

  it('finishes with the view gone, and gives the view what it wrote when it comes back', async () => {
    const h = harness()
    h.flow.words = 'x'
    h.flow.send()
    h.flow.detach(h.view)
    await answer(h, fenced(GOOD))
    expect(h.flow.state).toBe('ready')
    expect(cardText(h)).toBe(GOOD)
    expect(h.flow.resultsFor('u1', 'MAIN.TS')).not.toBeNull()
    expect(h.flow.resultsFor('u1', 'OTHER.TS')).toBeNull()
  })

  it('sends nothing with no words, no provider, or while one is under way', () => {
    const h = harness()
    h.flow.words = '   '
    h.flow.send()
    expect(h.api.write).not.toHaveBeenCalled()
    h.flow.words = 'x'
    h.flow.send()
    h.flow.send()
    expect(h.api.write).toHaveBeenCalledTimes(1)
  })

  it('gives main at most twenty errors, each cut to what a fix takes', async () => {
    const many = Array.from({ length: 25 }, (_, k) => `x${k} is not known ${'.'.repeat(400)}`)
    const h = harness(SAMPLE, (s) => (s === BAD ? levels(many) : levels()))
    h.flow.words = 'x'
    h.flow.send()
    await answer(h, fenced(BAD))
    const sent = h.api.writeFix.mock.calls[0]?.[1].errors as { message: string }[]
    expect(sent).toHaveLength(20)
    expect(Math.max(...sent.map((e) => e.message.length))).toBeLessThanOrEqual(300)
  })

  it('puts the program in the editor at once on READY, and says so when the card will not take it', async () => {
    const h = harness()
    let write: (status: number) => void = () => {}
    h.api.writeFile.mockImplementation(
      () =>
        new Promise<number>((resolve) => {
          write = resolve
        }),
    )
    h.flow.words = 'x'
    h.flow.send()
    await answer(h, fenced(GOOD))
    expect(h.view.text).toBe(GOOD)
    expect(h.view.kept).toBe(SAMPLE)
    write(3)
    await settle()
    expect(h.flow.state).toBe('failed')
    expect(h.flow.note).toMatch(/could not be written to the card/)
    expect(h.view.kept).toBe(SAMPLE)
  })

  it('keeps the last whole answer when the provider fails during a fix, and offers no UNDO left from an earlier SEND', async () => {
    const h = harness()
    h.flow.words = 'x'
    h.flow.send()
    await answer(h, fenced(GOOD))
    expect(h.flow.canUndo).toBe(true)
    h.flow.words = 'BROKEN'
    h.flow.send()
    expect(h.flow.canUndo).toBe(false)
    await answer(h, fenced(BAD))
    expect(h.flow.state).toBe('fixing')
    h.answers.shift()?.({ ok: false, serial: 2, stop: 'timeout', note: 'the provider went quiet' })
    await settle()
    expect(h.flow.state).toBe('failed')
    expect(h.view.text).toBe(BAD)
    expect(h.flow.canUndo).toBe(true)
  })

  it('ends the SEND as failed when main cannot be asked, letting the compiler go', async () => {
    const h = harness()
    h.api.write.mockImplementation(async () => {
      throw new Error('no handler')
    })
    h.flow.words = 'x'
    h.flow.send()
    await settle()
    expect(h.flow.state).toBe('failed')
    expect(h.flow.note).toMatch(/no handler/)
    expect(h.flow.busy).toBe(false)
  })

  it('tells the view a SEND began (its old build goes), and says when a STOP came before any code', () => {
    const h = harness()
    h.flow.words = 'x'
    h.flow.send()
    expect(h.view.begun).toBe(1)
    h.flow.stop()
    expect(h.flow.note).toMatch(/before any code came/)
    expect(h.view.text).toBe(SAMPLE)
  })

  it('forgets the last SEND’s build when a new one begins, so a remount shows none', async () => {
    const h = harness()
    h.flow.words = 'x'
    h.flow.send()
    await answer(h, fenced(GOOD))
    expect(h.flow.resultsFor('u1', 'MAIN.TS')).not.toBeNull()
    h.flow.words = 'y'
    h.flow.send()
    h.flow.stop()
    expect(h.flow.resultsFor('u1', 'MAIN.TS')).toBeNull()
  })

  it('swaps for real on UNDO and REDO: an edit after READY comes back, and the build goes', async () => {
    const h = harness()
    h.flow.words = 'x'
    h.flow.send()
    await answer(h, fenced(GOOD))
    const edited = `${GOOD}\n// tweaked`
    h.view.text = edited
    const begun = h.view.begun
    h.flow.undo()
    await settle()
    expect(h.view.text).toBe(SAMPLE)
    expect(h.view.begun).toBe(begun + 1)
    expect(h.flow.resultsFor('u1', 'MAIN.TS')).toBeNull()
    h.flow.undo()
    await settle()
    expect(h.view.text).toBe(edited)
  })

  it('parks unfinished text when the view goes, so a pane closed after STOP leaves the card as it was', () => {
    const h = harness(GOOD)
    h.flow.words = 'x'
    h.flow.send()
    h.flow.replace()
    h.pieces[0]?.({ pane: 'p1', serial: 1, round: 0, text: '```ts\nexport function ma' })
    h.flow.stop()
    expect(h.flow.holdsUnkept).toBe(true)
    // CODE going asks first: the half program is parked, not written.
    expect(h.flow.park('u1', 'MAIN.TS', h.view.text)).toBe(true)
    expect(h.flow.takePending('u1', 'MAIN.TS')).toBe('export function ma')
    // Kept by a person (their COMPILE): it is theirs now, written as usual.
    h.flow.kept()
    expect(h.flow.park('u1', 'MAIN.TS', h.view.text)).toBe(false)
  })

  it('ends FAILED without asking the model when the compiler itself fails', async () => {
    const h = harness(SAMPLE, () => {
      throw new Error('the worker stopped')
    })
    h.flow.words = 'x'
    h.flow.send()
    await answer(h, fenced(GOOD))
    expect(h.flow.state).toBe('failed')
    expect(h.flow.note).toMatch(/compiler could not run: the worker stopped/)
    expect(h.api.writeFix).not.toHaveBeenCalled()
    expect(h.view.text).toBe(GOOD)
  })

  it('forgets text left for a file when the unit changes, and refuses a program too long to send', async () => {
    const h = harness()
    h.flow.words = 'x'
    h.flow.send()
    h.pieces[0]?.({ pane: 'p1', serial: 1, round: 0, text: '```ts\nconst A = 1\n' })
    h.flow.detach(h.view)
    h.flow.stop()
    h.flow.target('u2', 'MAIN.TS')
    h.flow.target('u1', 'MAIN.TS')
    expect(h.flow.takePending('u1', 'MAIN.TS')).toBeNull()

    const long = harness('x'.repeat(40_001))
    long.flow.words = 'x'
    long.flow.send()
    long.flow.replace()
    expect(long.api.write).not.toHaveBeenCalled()
    expect(long.flow.note).toMatch(/too long to send/)
  })

  describe('found in review (2026-11-23)', () => {
    /** writeFile answers when the test says, in the order asked. */
    function heldCard(h: Harness) {
      const held: ((status: number) => void)[] = []
      h.api.writeFile.mockImplementation(
        () =>
          new Promise<number>((resolve) => {
            held.push(resolve)
          }),
      )
      return held
    }

    it('a card write that answers late never puts its text back over what came since', async () => {
      const h = harness(GOOD)
      const held = heldCard(h)
      h.flow.words = 'x'
      h.flow.send()
      h.flow.replace()
      await answer(h, fenced(`${GOOD}\n// new`))
      expect(h.flow.state).toBe('ready')
      // UNDO before READY's write has answered: the code before WRITE is in the editor...
      h.flow.undo()
      expect(h.view.text).toBe(GOOD)
      // ...and READY's write, answering now, does not put WRITE's code back over it.
      held[0]?.(0)
      await settle()
      expect(h.view.text).toBe(GOOD)
      held[1]?.(0)
      await settle()
      expect(h.view.text).toBe(GOOD)
      expect(h.view.kept).toBe(GOOD)
    })

    it('a card write failing late says nothing over a SEND begun since', async () => {
      const h = harness()
      const held = heldCard(h)
      h.flow.words = 'x'
      h.flow.send()
      await answer(h, fenced(GOOD))
      h.flow.words = 'y'
      h.flow.send()
      expect(h.flow.state).toBe('thinking')
      held[0]?.(3)
      await settle()
      expect(h.flow.state).toBe('thinking')
      expect(h.flow.note).toBe('')
    })

    it('a READY the card would not take leaves the code unkept, parked when CODE goes', async () => {
      const h = harness()
      h.api.writeFile.mockImplementation(async () => 3)
      h.flow.words = 'x'
      h.flow.send()
      await answer(h, fenced(GOOD))
      expect(h.flow.state).toBe('failed')
      expect(h.flow.holdsUnkept).toBe(true)
      expect(h.flow.park('u1', 'MAIN.TS', GOOD)).toBe(true)
    })

    it('REDO after a STOP puts the unfinished code back in the editor only, never on the card', async () => {
      const h = harness(GOOD)
      h.flow.words = 'x'
      h.flow.send()
      h.flow.replace()
      h.pieces[0]?.({
        pane: 'p1',
        serial: 1,
        round: 0,
        text: '```ts\n// it’s\nexport function ma',
      })
      h.flow.stop()
      h.flow.undo()
      await settle()
      expect(h.view.text).toBe(GOOD)
      h.api.writeFile.mockClear()
      h.flow.undo()
      await settle()
      // Its typographic marks made the machine's, as an answer's are.
      expect(h.view.text).toBe("// it's\nexport function ma")
      expect(h.api.writeFile).not.toHaveBeenCalled()
      expect(h.flow.holdsUnkept).toBe(true)
    })

    it('says when UNDO could not write to the card', async () => {
      const h = harness()
      h.flow.words = 'x'
      h.flow.send()
      await answer(h, fenced(GOOD))
      h.api.writeFile.mockImplementation(async () => 3)
      h.flow.undo()
      await settle()
      expect(h.flow.note).toMatch(/could not be written to the card/)
    })

    it('a card write answering after the person typed keeps what they typed, the written text the card’s', async () => {
      const h = harness()
      const held = heldCard(h)
      h.flow.words = 'x'
      h.flow.send()
      await answer(h, fenced(GOOD))
      // A key typed while READY's write is on its way.
      h.view.text = `${GOOD} `
      held[0]?.(0)
      await settle()
      expect(h.view.text).toBe(`${GOOD} `)
      expect(h.view.kept).toBe(GOOD)
    })

    it('a program too long to send clears what the last SEND showed', async () => {
      const h = harness(SAMPLE, (s) => (s === BAD ? levels(['x is not known']) : levels()))
      h.flow.words = 'x'
      h.flow.send()
      await answer(h, fenced(BAD))
      await answer(h, fenced(BAD))
      await answer(h, fenced(BAD))
      expect(h.flow.state).toBe('failed')
      expect(h.flow.fixes).toBe(2)
      h.view.text = 'x'.repeat(40_001)
      h.flow.words = 'y'
      h.flow.send()
      expect(h.flow.note).toMatch(/too long to send/)
      expect(h.flow.fixes).toBe(0)
      expect(h.flow.bytes).toBe(0)
      expect(h.flow.errors).toEqual([])
    })
  })
})
