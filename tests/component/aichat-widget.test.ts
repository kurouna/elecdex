import type { Chat, ChatEvent, ChatRun } from '@shared/ai'
import { defaultSettings } from '@shared/settings'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: AiChatWidget } = await import(
  '../../src/renderer/widgets/aichat/AiChatWidget.svelte'
)
const { default: Markdown } = await import('../../src/renderer/widgets/aichat/Markdown.svelte')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { sfx } = await import('../../src/renderer/stores/sound.svelte.ts')

/**
 * The chat pane against a hand-driven main: what it asks for and when, how it
 * follows an answer, and that a model's text never becomes markup.
 */

const CHAT_ID = '11111111-2222-4333-8444-555555555555'

const chat = (messages: Chat['messages'] = []): Chat => ({
  version: 1,
  id: CHAT_ID,
  title: 'Greeting',
  createdAt: 1,
  updatedAt: 1,
  messages,
})
const run = (text = ''): ChatRun => ({
  id: 'run-1',
  text,
  thinking: '',
  provider: 'Local',
  model: 'tiny',
  startedAt: Date.now(),
})
const delta = (textAt: number, text: string): ChatEvent => ({
  type: 'delta',
  chatId: CHAT_ID,
  runId: 'run-1',
  textAt,
  text,
  thinkingAt: 0,
  thinking: '',
})

let handlers: Array<(event: ChatEvent) => void>
let ai: Record<string, ReturnType<typeof vi.fn>>
let openExternal: ReturnType<typeof vi.fn>
let setPaneState: ReturnType<typeof vi.spyOn>

function withProvider(): void {
  appearance.settings = {
    ...defaultSettings(),
    sound: { enabled: false, volume: 0 },
    ai: {
      systemPrompt: '',
      providers: [
        {
          id: 'local',
          name: 'Local',
          kind: 'openai',
          baseUrl: 'http://localhost:11434/v1',
          model: 'tiny',
        },
      ],
    },
  }
}

beforeEach(() => {
  handlers = []
  openExternal = vi.fn(async () => undefined)
  ai = {
    providers: vi.fn(async () => []),
    onProviders: vi.fn(() => () => {}),
    chats: vi.fn(async () => []),
    onChats: vi.fn(() => () => {}),
    models: vi.fn(async () => ({ models: [{ id: 'tiny' }, { id: 'large' }], error: null })),
    create: vi.fn(async () => CHAT_ID),
    remove: vi.fn(async () => true),
    send: vi.fn(async () => ({ ok: true })),
    stop: vi.fn(),
    subscribe: vi.fn((_id: string, handler: (event: ChatEvent) => void) => {
      handlers.push(handler)
      return () => {
        handlers = handlers.filter((h) => h !== handler)
      }
    }),
  }
  vi.stubGlobal('elecdex', { ai, system: { openExternal } })
  Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => undefined) } })
  setPaneState = vi.spyOn(layout, 'setPaneState').mockImplementation(() => {})
  appearance.settings = { ...defaultSettings(), sound: { enabled: false, volume: 0 } }
})

afterEach(() => {
  cleanup()
  setPaneState.mockRestore()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

const mount = (state?: Record<string, unknown>) =>
  render(AiChatWidget, { props: { paneId: 'p', state } as never })

const emit = async (event: ChatEvent): Promise<void> => {
  for (const handler of [...handlers]) handler(event)
  await settle()
}

describe('AiChatWidget', () => {
  it('with no provider listed it asks for one and follows nothing', async () => {
    mount()
    await settle()
    expect(screen.getByTestId('aichat-setup')).toBeTruthy()
    expect(ai.subscribe).not.toHaveBeenCalled()
  })

  it('calls no provider by being there: the model list is read when its field is opened', async () => {
    withProvider()
    mount()
    await settle()
    expect(screen.getByTestId('aichat-empty').textContent).toMatch(/Local\s·\stiny/)
    // The address has a line to itself: beside the model, a narrow pane broke it in the middle.
    const host = screen.getByTestId('aichat-empty').querySelector('.host')
    expect(host?.textContent).toBe('localhost:11434')
    expect(host?.parentElement).toBe(screen.getByTestId('aichat-empty'))
    expect(ai.models).not.toHaveBeenCalled()

    await fireEvent.focus(screen.getByTestId('aichat-model'))
    await settle()
    expect(ai.models).toHaveBeenCalledTimes(1)
    // And once: opening it again does not ask again.
    await fireEvent.focus(screen.getByTestId('aichat-model'))
    expect(ai.models).toHaveBeenCalledTimes(1)
  })

  it('Enter sends, Shift+Enter and the Enter that ends an IME conversion do not', async () => {
    withProvider()
    mount()
    await settle()
    const input = screen.getByTestId('aichat-input') as HTMLTextAreaElement
    await fireEvent.input(input, { target: { value: 'こんにちは' } })

    await fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    await fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })
    await fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    await settle()
    expect(ai.send).not.toHaveBeenCalled()

    await fireEvent.keyDown(input, { key: 'Enter' })
    await settle()
    // A pane with no conversation makes one first, and keeps its id only once the message was taken.
    expect(ai.create).toHaveBeenCalledTimes(1)
    expect(ai.send).toHaveBeenCalledWith(CHAT_ID, {
      provider: 'local',
      model: 'tiny',
      text: 'こんにちは',
    })
    expect(setPaneState).toHaveBeenCalledWith('p', { chat: CHAT_ID })
    expect(input.value).toBe('')
  })

  it('a message that is refused keeps the draft, says why, and leaves no empty conversation', async () => {
    withProvider()
    ai.send?.mockResolvedValueOnce({ ok: false, error: 'the address is not usable' })
    mount()
    await settle()
    const input = screen.getByTestId('aichat-input') as HTMLTextAreaElement
    await fireEvent.input(input, { target: { value: 'hello' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    await settle()
    const problem = screen.getByTestId('aichat-problem')
    expect(problem.querySelector('.code')?.textContent).toBe('refused')
    expect(problem.querySelector('.detail')?.textContent).toBe('the address is not usable')
    expect(input.value).toBe('hello')
    expect(ai.remove).toHaveBeenCalledWith(CHAT_ID)
    expect(setPaneState).not.toHaveBeenCalled()
  })

  it('follows an answer piece by piece, and starts over rather than show a text with a hole', async () => {
    withProvider()
    mount({ chat: CHAT_ID })
    await settle()
    expect(ai.subscribe).toHaveBeenCalledTimes(1)

    await emit({ type: 'snapshot', chatId: CHAT_ID, chat: chat(), run: run() })
    await emit(delta(0, 'Hel'))
    await emit(delta(3, 'lo'))
    expect(screen.getByTestId('aichat-run').textContent).toContain('Hello')
    // Sent and waiting is TX; once text arrives the link is receiving.
    expect(screen.getByTestId('aichat-telemetry').textContent).toContain('rx · T+')

    // A piece went missing between 5 and 9.
    await emit(delta(9, 'ld'))
    expect(ai.subscribe).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('aichat-run').textContent).not.toContain('ld')

    await emit({ type: 'snapshot', chatId: CHAT_ID, chat: chat(), run: run('Hello world') })
    expect(screen.getByTestId('aichat-run').textContent).toContain('Hello world')
  })

  it("marks an answer that failed with a code, and keeps the provider's own words in view", async () => {
    withProvider()
    mount({ chat: CHAT_ID })
    await settle()
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      run: null,
      chat: chat([
        { id: 'q', role: 'user', text: 'hi', at: 1 },
        {
          id: 'a',
          role: 'assistant',
          text: '',
          at: 2,
          stop: 'unreachable',
          error: 'could not reach localhost:11434 - is it running?',
        },
      ]),
    })
    const stop = screen.getByTestId('aichat-stop')
    expect(stop.querySelector('.code')?.textContent).toBe('no carrier')
    // Not tucked into a tooltip: it is what the fault is fixed with.
    expect(stop.querySelector('.detail')?.textContent).toBe(
      'could not reach localhost:11434 - is it running?',
    )
  })

  it('says it is querying while the model list is read, whatever the field already holds', async () => {
    withProvider()
    let answer: (value: { models: never[]; error: string | null }) => void = () => {}
    ai.models?.mockReturnValueOnce(
      new Promise((resolve) => {
        answer = resolve
      }),
    )
    mount()
    await settle()
    const field = screen.getByTestId('aichat-model') as HTMLInputElement
    // A model is already typed there, so a placeholder would never be seen.
    expect(field.value).toBe('tiny')
    expect(screen.queryByTestId('aichat-models-state')).toBeNull()

    await fireEvent.focus(field)
    await settle()
    expect(screen.getByTestId('aichat-models-state').textContent).toBe('querying')

    answer({ models: [], error: 'could not reach localhost:11434 - is it running?' })
    await settle()
    // A list that could not be read says so, with why.
    const state = screen.getByTestId('aichat-models-state')
    expect(state.textContent).toBe('no list')
    expect(state.title).toBe('could not reach localhost:11434 - is it running?')
  })

  it('an answer for the provider left behind does not end the wait for the one chosen since', async () => {
    withProvider()
    appearance.settings.ai.providers.push({
      id: 'other',
      name: 'Other',
      kind: 'openai',
      baseUrl: 'http://localhost:1234/v1',
      model: 'big',
    })
    const answers: Array<(value: { models: Array<{ id: string }>; error: null }) => void> = []
    ai.models?.mockImplementation(
      () =>
        new Promise((resolve) => {
          answers.push(resolve)
        }),
    )
    const view = mount()
    await settle()
    await fireEvent.focus(screen.getByTestId('aichat-model'))
    await settle()

    // The pane moves to the other provider before the first has answered, and asks again.
    await view.rerender({ paneId: 'p', state: { provider: 'other' } } as never)
    await fireEvent.change(screen.getByTestId('aichat-provider'), { target: { value: 'other' } })
    await fireEvent.focus(screen.getByTestId('aichat-model'))
    await settle()
    expect(ai.models).toHaveBeenLastCalledWith('other')

    answers[0]?.({ models: [{ id: 'from-the-first' }], error: null })
    await settle()
    expect(screen.getByTestId('aichat-models-state').textContent).toBe('querying')
    expect(document.querySelector('datalist option')).toBeNull()

    answers[1]?.({ models: [{ id: 'from-the-second' }], error: null })
    await settle()
    expect(screen.queryByTestId('aichat-models-state')).toBeNull()
    expect(document.querySelector('datalist option')?.getAttribute('value')).toBe('from-the-second')
  })

  it('an answer that ends is heard: landed, stopped by hand, or lost - NO CARRIER included', async () => {
    withProvider()
    const play = vi.spyOn(sfx, 'play').mockImplementation(() => {})
    mount({ chat: CHAT_ID })
    await settle()
    const ended = async (stop?: 'stopped' | 'error' | 'unreachable' | 'refusal'): Promise<void> => {
      play.mockClear()
      await emit({ type: 'snapshot', chatId: CHAT_ID, chat: chat(), run: run('so far') })
      await emit({
        type: 'snapshot',
        chatId: CHAT_ID,
        run: null,
        chat: chat([
          { id: 'q', role: 'user', text: 'hi', at: 1 },
          { id: 'a', role: 'assistant', text: 'so far', at: 2, ...(stop ? { stop } : {}) },
        ]),
      })
    }
    await ended()
    expect(play).toHaveBeenCalledWith('granted')
    await ended('stopped')
    expect(play).toHaveBeenCalledWith('granted')
    for (const lost of ['error', 'unreachable', 'refusal'] as const) {
      await ended(lost)
      expect(play, lost).toHaveBeenCalledWith('glitch')
      expect(play, lost).not.toHaveBeenCalledWith('granted')
    }
    play.mockRestore()
  })

  it('stops the answer from the button and with Escape', async () => {
    withProvider()
    mount({ chat: CHAT_ID })
    await settle()
    await emit({ type: 'snapshot', chatId: CHAT_ID, chat: chat(), run: run('so far') })

    await fireEvent.click(screen.getByTestId('aichat-stop-button'))
    await fireEvent.keyDown(screen.getByTestId('aichat-input'), { key: 'Escape' })
    expect(ai.stop).toHaveBeenCalledTimes(2)
    expect(ai.stop).toHaveBeenCalledWith(CHAT_ID)
  })

  it('shows what the provider counted and how fast it wrote', async () => {
    withProvider()
    mount({ chat: CHAT_ID })
    await settle()
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      run: null,
      chat: chat([
        { id: 'q', role: 'user', text: 'hi', at: 1 },
        {
          id: 'a',
          role: 'assistant',
          text: 'hello',
          at: 2,
          model: 'tiny',
          usage: { input: 1200, output: 90 },
          ms: 3000,
        },
      ]),
    })
    expect(screen.getByTestId('aichat-usage').textContent).toBe('1.2k › 90 tok · 30 t/s')
  })

  it('editing a question resends from it', async () => {
    withProvider()
    mount({ chat: CHAT_ID })
    await settle()
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      run: null,
      chat: chat([
        { id: 'q1', role: 'user', text: 'first wording', at: 1 },
        { id: 'a1', role: 'assistant', text: 'answer', at: 2 },
      ]),
    })
    await fireEvent.click(screen.getByTestId('aichat-edit'))
    const input = screen.getByTestId('aichat-input') as HTMLTextAreaElement
    expect(input.value).toBe('first wording')
    await fireEvent.input(input, { target: { value: 'second wording' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    await settle()
    expect(ai.send).toHaveBeenCalledWith(CHAT_ID, {
      provider: 'local',
      model: 'tiny',
      text: 'second wording',
      replaceFrom: 'q1',
    })
  })

  it('lets go of a conversation main no longer has', async () => {
    withProvider()
    mount({ chat: CHAT_ID, model: 'large', provider: 'local' })
    await settle()
    await emit({ type: 'snapshot', chatId: CHAT_ID, chat: null, run: null })
    expect(setPaneState).toHaveBeenCalledWith('p', {
      chat: undefined,
      model: 'large',
      provider: 'local',
    })
  })

  it('stops following when it goes', async () => {
    withProvider()
    const { unmount } = mount({ chat: CHAT_ID })
    await settle()
    expect(handlers).toHaveLength(1)
    unmount()
    expect(handlers).toHaveLength(0)
  })
})

describe('Markdown', () => {
  it("never makes markup of a model's text", async () => {
    const { container } = render(Markdown, {
      props: {
        source:
          '<img src=x onerror=alert(1)> and <script>alert(1)</script>\n\n[click](javascript:alert(1))',
      },
    })
    await settle()
    expect(container.querySelector('img, script, a')).toBeNull()
    expect(container.querySelector('button.link')).toBeNull()
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>')
  })

  it('opens a link through main, and copies a code block', async () => {
    const { container } = render(Markdown, {
      props: { source: 'See [the docs](https://example.test/docs).\n\n```js\nlet a = 1\n```' },
    })
    await settle()
    await fireEvent.click(container.querySelector('button.link') as HTMLButtonElement)
    expect(openExternal).toHaveBeenCalledWith('https://example.test/docs')

    await fireEvent.click(screen.getByTestId('chat-code-copy'))
    await settle()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('let a = 1')
    expect(screen.getByTestId('chat-code-copy').textContent?.trim()).toBe('copied')
  })

  it('draws words next to each other with no space of its own between them', async () => {
    const { container } = render(Markdown, { props: { source: 'a**b**`c`d' } })
    await settle()
    expect(container.querySelector('p')?.textContent).toBe('abcd')
  })
})
