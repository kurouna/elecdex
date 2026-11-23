import type { AiProvider } from '@shared/ai'
import { SAMPLE } from '@shared/elec16/code-area'
import type { Elec16WritePiece, Elec16WriteResult } from '@shared/elec16-write'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  WriteFlow,
  type WriteFlowDeps,
} from '../../src/renderer/widgets/elec16/write-flow.svelte.ts'
import { stubMatchMedia } from './support/dom.ts'
import { settle } from './support/settle.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { default: WriteLine } = await import('../../src/renderer/widgets/elec16/WriteLine.svelte')

/**
 * CODE's WRITE line (widgets/elec16/WriteLine.svelte): what it says with no provider or no
 * model, the question's keys (it starts on REPLACE, ← → move, Escape and a press elsewhere
 * cancel), Escape in the words as STOP while a SEND is under way, Enter that sends once, and
 * the steps it draws.
 */

const PROVIDER: AiProvider = {
  id: 'local',
  name: 'Local',
  kind: 'openai',
  baseUrl: 'http://127.0.0.1:1/v1',
  model: 'm1',
}

let answers: ((r: Elec16WriteResult) => void)[] = []
let pieces: ((p: Elec16WritePiece) => void)[] = []
let api: {
  write: ReturnType<typeof vi.fn>
  writeFix: ReturnType<typeof vi.fn>
  writeStop: ReturnType<typeof vi.fn>
  writeFile: ReturnType<typeof vi.fn>
  onWriteText: ReturnType<typeof vi.fn>
}

function flowWith(source: string): WriteFlow {
  const flow = new WriteFlow({
    api: api as unknown as WriteFlowDeps['api'],
    pane: 'p1',
    // Every level builds and returns.
    compile: async () =>
      ([0, 1, 2] as const).map((level) => ({
        level,
        asm: '',
        errors: [],
        image: new Uint8Array([1]),
        measured: { cycles: 1, end: 'returned' as const },
      })),
    hold: () => () => {},
    level: () => 2,
    setLevel: () => {},
    choice: () => ({ provider: 'local', model: 'm1', name: 'Local' }),
    now: () => Date.now(),
  })
  flow.target('u1', 'MAIN.TS')
  flow.attach({
    source: () => source,
    replaced: () => {},
    onCard: () => {},
    built: () => {},
    began: () => {},
  })
  return flow
}

const props = (flow: WriteFlow, change: Record<string, unknown> = {}) => ({
  flow,
  file: 'MAIN.TS',
  providers: [PROVIDER],
  provider: PROVIDER,
  model: 'm1',
  seen: true,
  blocked: false,
  onprovider: vi.fn(),
  onmodel: vi.fn(),
  ...change,
})

beforeEach(() => {
  answers = []
  pieces = []
  stubMatchMedia(true)
  const pending = () =>
    new Promise<Elec16WriteResult>((resolve) => {
      answers.push(resolve)
    })
  api = {
    write: vi.fn(pending),
    writeFix: vi.fn(pending),
    writeStop: vi.fn(),
    writeFile: vi.fn(async () => 0),
    onWriteText: vi.fn((h: (p: Elec16WritePiece) => void) => {
      pieces.push(h)
      return () => {}
    }),
  }
  vi.stubGlobal('elecdex', { ai: { models: vi.fn(async () => ({ models: [], error: null })) } })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("CODE's WRITE line", () => {
  it('says what is missing when the settings have no provider, or the provider no model', async () => {
    const flow = flowWith(SAMPLE)
    const view = render(WriteLine, props(flow, { provider: null, providers: [], model: '' }))
    expect((screen.getByTestId('elec16-write-words') as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByTestId('elec16-write-line').textContent).toMatch(/No AI provider is set/)
    expect(screen.queryByTestId('elec16-write-send')).toBeNull()
    await view.rerender(props(flow, { model: '' }))
    flow.words = 'x'
    await tick()
    expect((screen.getByTestId('elec16-write-send') as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByTestId('elec16-write-line').textContent).toMatch(/Local has no model chosen/)
  })

  it('tells what is sent, and sends once on Enter - not a held one, not while composing', async () => {
    const flow = flowWith(SAMPLE)
    render(WriteLine, props(flow))
    expect(screen.getByTestId('elec16-write-line').textContent).toMatch(
      /your words and the code in MAIN\.TS, to Local · m1/,
    )
    const words = screen.getByTestId('elec16-write-words')
    await fireEvent.input(words, { target: { value: 'a game' } })
    await fireEvent.keyDown(words, { key: 'Enter', repeat: true })
    await fireEvent.keyDown(words, { key: 'Enter', isComposing: true })
    expect(api.write).not.toHaveBeenCalled()
    await fireEvent.keyDown(words, { key: 'Enter' })
    expect(api.write).toHaveBeenCalledTimes(1)
    expect((words as HTMLButtonElement).disabled).toBe(false)
    expect(words.hasAttribute('readonly')).toBe(true)
    expect(screen.getByTestId('elec16-write-send').textContent).toBe('stop')
    expect(screen.getByTestId('elec16-write-live').textContent).toBe('Thinking')
  })

  it('stops on Escape in the words, keeping the keyboard there', async () => {
    const flow = flowWith(SAMPLE)
    render(WriteLine, props(flow))
    const words = screen.getByTestId('elec16-write-words')
    await fireEvent.input(words, { target: { value: 'a game' } })
    await fireEvent.click(screen.getByTestId('elec16-write-send'))
    // The line owns Escape while it writes; the words are inside it (ownership is read up).
    expect(words.closest('[data-owns-escape]')).toBe(screen.getByTestId('elec16-write'))
    await fireEvent.keyDown(words, { key: 'Escape' })
    expect(api.writeStop).toHaveBeenCalledWith('p1')
    expect(flow.state).toBe('stopped')
  })

  it('asks before code of one’s own: the keyboard on REPLACE, arrows along the row, Escape or a press elsewhere cancels', async () => {
    const flow = flowWith('export function main(): void {}')
    render(WriteLine, props(flow))
    await fireEvent.input(screen.getByTestId('elec16-write-words'), { target: { value: 'a game' } })
    await fireEvent.click(screen.getByTestId('elec16-write-send'))
    expect(flow.state).toBe('confirm')
    await settle(3)
    expect(document.activeElement).toBe(screen.getByTestId('elec16-write-replace'))
    expect(screen.getByTestId('elec16-write-line').hasAttribute('data-owns-escape')).toBe(true)
    await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(screen.getByTestId('elec16-write-cancel'))
    await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' })
    expect(flow.state).toBe('idle')
    expect(api.write).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByTestId('elec16-write-send'))
    expect(flow.state).toBe('confirm')
    await fireEvent.pointerDown(document.body)
    expect(flow.state).toBe('idle')

    await fireEvent.click(screen.getByTestId('elec16-write-send'))
    await settle(3)
    // Enter on the question's own text presses the answer it starts on (on a button, the
    // browser presses that button itself).
    await fireEvent.keyDown(screen.getByTestId('elec16-write-line'), { key: 'Enter' })
    expect(api.write).toHaveBeenCalledTimes(1)
  })

  it('leaves keys typed elsewhere alone, and a keyboard leaving the question cancels it', async () => {
    const flow = flowWith('export function main(): void {}')
    render(WriteLine, props(flow))
    const outside = document.createElement('input')
    document.body.append(outside)
    await fireEvent.input(screen.getByTestId('elec16-write-words'), { target: { value: 'a game' } })
    await fireEvent.click(screen.getByTestId('elec16-write-send'))
    await settle(3)
    expect(flow.state).toBe('confirm')
    // A shell elsewhere, say: its Enter is its own, never REPLACE.
    await fireEvent.keyDown(outside, { key: 'Enter' })
    expect(api.write).not.toHaveBeenCalled()
    expect(flow.state).toBe('confirm')
    // The pane taking the keyboard back on a press inside it (its root holds the line) is not
    // leaving: found in the running app, where pressing REPLACE cancelled the question.
    await fireEvent.focusOut(screen.getByTestId('elec16-write-replace'), {
      relatedTarget: document.body.firstElementChild,
    })
    expect(flow.state).toBe('confirm')
    await fireEvent.focusOut(screen.getByTestId('elec16-write-replace'), { relatedTarget: outside })
    expect(flow.state).toBe('idle')
    outside.remove()
  })

  it('draws the steps: FIX only once a fix is asked for, and the size as it comes', async () => {
    const flow = flowWith(SAMPLE)
    render(WriteLine, props(flow))
    expect(screen.getByTestId('elec16-write-steps').textContent?.trim()).toBe('')
    await fireEvent.input(screen.getByTestId('elec16-write-words'), { target: { value: 'a game' } })
    await fireEvent.click(screen.getByTestId('elec16-write-send'))
    pieces[0]?.({ pane: 'p1', serial: 1, round: 0, text: `\`\`\`ts\n${'x'.repeat(2048)}` })
    await tick()
    const steps = screen.getByTestId('elec16-write-steps').textContent ?? ''
    expect(steps).toMatch(/thinking.*write.*compile.*ready/s)
    expect(steps).not.toMatch(/fix/)
    expect(screen.getByTestId('elec16-write-meta').textContent).toMatch(/2\.0 KB/)
    answers.shift()?.({ ok: true, serial: 1, text: 'no code here' })
    await settle(10)
    expect(flow.state).toBe('fixing')
    expect(screen.getByTestId('elec16-write-steps').textContent).toMatch(/fix 1\/2/)
    expect(screen.getByTestId('elec16-write-live').textContent).toBe('Fixing, 1 of 2')
  })

  it('stops at the press, with no blink to wait for, and on Escape wherever the keyboard is in the line', async () => {
    stubMatchMedia(false)
    const flow = flowWith(SAMPLE)
    render(WriteLine, props(flow))
    await fireEvent.input(screen.getByTestId('elec16-write-words'), { target: { value: 'a game' } })
    flow.send()
    await tick()
    expect(screen.getByTestId('elec16-write').hasAttribute('data-owns-escape')).toBe(true)
    await fireEvent.click(screen.getByTestId('elec16-write-send'))
    expect(flow.state).toBe('stopped')

    flow.send()
    await tick()
    await fireEvent.keyDown(screen.getByTestId('elec16-write-send'), { key: 'Escape' })
    expect(flow.state).toBe('stopped')
  })

  it('takes the keyboard at READY only from nowhere or its own line, never from another pane', async () => {
    const flow = flowWith(SAMPLE)
    render(WriteLine, props(flow))
    const outside = document.createElement('input')
    document.body.append(outside)
    await fireEvent.input(screen.getByTestId('elec16-write-words'), { target: { value: 'a game' } })
    flow.send()
    outside.focus()
    answers.shift()?.({ ok: true, serial: 1, text: '```ts\nexport function main(): void {}\n```' })
    await settle(10)
    expect(flow.state).toBe('ready')
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })

  describe('found in review (2026-11-23)', () => {
    async function ready(flow: WriteFlow): Promise<void> {
      await fireEvent.input(screen.getByTestId('elec16-write-words'), {
        target: { value: 'a game' },
      })
      flow.send()
      answers.shift()?.({
        ok: true,
        serial: 1,
        text: '```ts\nexport function main(): void {}\n```',
      })
      await settle(10)
      expect(flow.state).toBe('ready')
    }

    it('says when UNDO could not write to the card', async () => {
      const flow = flowWith(SAMPLE)
      render(WriteLine, props(flow))
      await ready(flow)
      api.writeFile.mockImplementation(async () => 3)
      await fireEvent.click(screen.getByTestId('elec16-write-undo'))
      await settle(6)
      expect(screen.getByTestId('elec16-write-line').textContent).toMatch(
        /could not be written to the card/,
      )
    })

    it('leaves an Escape that ends a word being composed to the IME, never STOP', async () => {
      const flow = flowWith(SAMPLE)
      render(WriteLine, props(flow))
      await fireEvent.input(screen.getByTestId('elec16-write-words'), {
        target: { value: 'a game' },
      })
      flow.send()
      await tick()
      await fireEvent.keyDown(screen.getByTestId('elec16-write-words'), {
        key: 'Escape',
        isComposing: true,
      })
      expect(flow.state).toBe('thinking')
    })

    it('locks the model field while a SEND is under way or the question is asked', async () => {
      const own = flowWith('export function main(): void {}')
      render(WriteLine, props(own))
      const model = () => screen.getByTestId('elec16-write-model') as HTMLInputElement
      expect(model().disabled).toBe(false)
      await fireEvent.input(screen.getByTestId('elec16-write-words'), {
        target: { value: 'a game' },
      })
      const provider = () => screen.getByTestId('elec16-write-provider') as HTMLSelectElement
      own.send()
      await tick()
      expect(own.state).toBe('confirm')
      expect(model().disabled).toBe(true)
      // The provider beside it, as the model: neither changes under a question or a SEND.
      expect(provider().disabled).toBe(true)
      own.replace()
      await tick()
      expect(model().disabled).toBe(true)
      expect(provider().disabled).toBe(true)
    })

    it('stops saying QUERYING when the model list could not be asked for', async () => {
      vi.stubGlobal('elecdex', {
        ai: {
          models: vi.fn(async () => {
            throw new Error('no handler')
          }),
        },
      })
      const flow = flowWith(SAMPLE)
      render(WriteLine, props(flow))
      await fireEvent.focus(screen.getByTestId('elec16-write-model'))
      await settle(6)
      expect(screen.getByTestId('elec16-write').textContent).not.toMatch(/querying/)
    })
  })
})
