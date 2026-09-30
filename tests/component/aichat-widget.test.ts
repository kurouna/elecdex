import type { Chat, ChatEvent, ChatRun } from '@shared/ai'
import type { AttachmentView } from '@shared/ai-attach'
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
const { paneMeta } = await import('../../src/renderer/stores/pane-meta.svelte.ts')

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
let patchPaneState: ReturnType<typeof vi.spyOn>

function withProvider(): void {
  appearance.settings = {
    ...defaultSettings(),
    sound: { enabled: false, volume: 0 },
    ai: {
      systemPrompt: '',
      compact: false,
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
  patchPaneState = vi.spyOn(layout, 'patchPaneState').mockImplementation(() => {})
  appearance.settings = { ...defaultSettings(), sound: { enabled: false, volume: 0 } }
})

afterEach(() => {
  cleanup()
  patchPaneState.mockRestore()
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
    expect(patchPaneState).toHaveBeenCalledWith('p', { chat: CHAT_ID })
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

  it('offers every model the provider lists, in a list of its own that can be scrolled and walked', async () => {
    withProvider()
    const many = Array.from({ length: 120 }, (_, i) => ({ id: `models/m-${i}` }))
    ai.models?.mockResolvedValueOnce({ models: [...many, { id: 'tiny' }], error: null })
    mount()
    await settle()
    const field = screen.getByTestId('aichat-model') as HTMLInputElement
    await fireEvent.focus(field)
    await settle()
    // Not a datalist: that popup is the browser's, and what did not fit on it could not be reached.
    expect(document.querySelector('datalist')).toBeNull()
    // All of them, though the field already names one - a list that offered only "tiny" would be no list.
    expect(screen.getAllByTestId('aichat-model-option')).toHaveLength(121)

    // Typing narrows it; the arrows walk it and Enter takes the one they are on.
    await fireEvent.input(field, { target: { value: 'm-11' } })
    expect(screen.getAllByTestId('aichat-model-option').map((o) => o.textContent)).toEqual([
      'models/m-11',
      ...Array.from({ length: 10 }, (_, i) => `models/m-11${i}`),
    ])
    await fireEvent.keyDown(field, { key: 'ArrowDown' })
    await fireEvent.keyDown(field, { key: 'ArrowDown' })
    expect(screen.getAllByTestId('aichat-model-option')[1]?.getAttribute('aria-selected')).toBe(
      'true',
    )
    await fireEvent.keyDown(field, { key: 'Enter' })
    expect(patchPaneState).toHaveBeenLastCalledWith('p', {
      provider: 'local',
      model: 'models/m-110',
    })
    expect(screen.queryByTestId('aichat-model-list')).toBeNull()
  })

  it('a model is chosen with the pointer, typed as it is, or left alone with Escape', async () => {
    withProvider()
    mount()
    await settle()
    const field = screen.getByTestId('aichat-model') as HTMLInputElement
    await fireEvent.focus(field)
    await settle()
    await fireEvent.click(screen.getAllByTestId('aichat-model-option')[1] as HTMLElement)
    expect(patchPaneState).toHaveBeenLastCalledWith('p', { provider: 'local', model: 'large' })

    // A model the list does not know is still a model: the list may be out of date.
    await fireEvent.focus(field)
    await fireEvent.input(field, { target: { value: ' my-own:7b ' } })
    await fireEvent.blur(field)
    expect(patchPaneState).toHaveBeenLastCalledWith('p', { provider: 'local', model: 'my-own:7b' })

    // Escape closes the list and takes nothing - and is the list's, not the pane's "stop".
    patchPaneState.mockClear()
    await fireEvent.focus(field)
    await fireEvent.input(field, { target: { value: 'half typed' } })
    await fireEvent.keyDown(field, { key: 'Escape' })
    expect(screen.queryByTestId('aichat-model-list')).toBeNull()
    await fireEvent.blur(field)
    expect(patchPaneState).not.toHaveBeenCalled()
    expect(ai.stop).not.toHaveBeenCalled()
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
    expect(screen.queryAllByTestId('aichat-model-option')).toEqual([])

    answers[1]?.({ models: [{ id: 'from-the-second' }], error: null })
    await settle()
    expect(screen.queryByTestId('aichat-models-state')).toBeNull()
    expect(screen.getAllByTestId('aichat-model-option').map((o) => o.textContent)).toEqual([
      'from-the-second',
    ])
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

  it('"new" comes first in the bar, and is dark while the conversation is already a new one', async () => {
    withProvider()
    mount()
    await settle()
    const fresh = screen.getByTestId('aichat-new') as HTMLButtonElement
    expect(fresh.disabled).toBe(true)
    expect(fresh.title).toBe('this is a new conversation')
    // Ahead of the provider and the model: it belongs to the conversation, not to the link.
    const bar = fresh.parentElement as HTMLElement
    expect([...bar.children].indexOf(fresh)).toBe(0)
    expect(bar.children[1]).toBe(screen.getByTestId('aichat-history-toggle'))
    cleanup()

    mount({ chat: CHAT_ID })
    await settle()
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      chat: chat([{ id: 'q', role: 'user', text: 'hi', at: 1 }]),
      run: null,
    })
    const again = screen.getByTestId('aichat-new') as HTMLButtonElement
    expect(again.disabled).toBe(false)
    await fireEvent.click(again)
    // Strictly, since the undefined key is how the store is told to let go of the conversation.
    expect(patchPaneState.mock.lastCall).toStrictEqual(['p', { chat: undefined }])
  })

  it('a conversation whose provider was removed goes on with the one of the same name, and its model', async () => {
    withProvider()
    // Removed and added again: the same name, a new id - and no default model yet.
    appearance.settings.ai.providers = [
      { id: 'ollama', name: 'Other', kind: 'openai', baseUrl: 'http://localhost:1/v1', model: '' },
      {
        id: 'gemini-2',
        name: 'Gemini',
        kind: 'openai',
        baseUrl: 'https://g.example/v1',
        model: '',
      },
    ]
    mount({ chat: CHAT_ID, provider: 'gemini', model: 'flash' })
    await settle()
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      run: null,
      chat: chat([
        { id: 'q', role: 'user', text: 'hi', at: 1 },
        { id: 'a', role: 'assistant', text: 'hello', at: 2, provider: 'Gemini', model: 'flash' },
      ]),
    })
    expect((screen.getByTestId('aichat-provider') as HTMLSelectElement).value).toBe('gemini-2')
    expect((screen.getByTestId('aichat-model') as HTMLInputElement).value).toBe('flash')
    expect(screen.queryByTestId('aichat-blocked')).toBeNull()

    await fireEvent.input(screen.getByTestId('aichat-input'), { target: { value: 'and again' } })
    await fireEvent.keyDown(screen.getByTestId('aichat-input'), { key: 'Enter' })
    await settle()
    expect(ai.send).toHaveBeenCalledWith(CHAT_ID, {
      provider: 'gemini-2',
      model: 'flash',
      text: 'and again',
    })
  })

  it('says why nothing can be sent, instead of a button that is merely dark', async () => {
    withProvider()
    appearance.settings.ai.providers = [
      { id: 'other', name: 'Other', kind: 'openai', baseUrl: 'http://localhost:1/v1', model: '' },
    ]
    const view = mount({ chat: CHAT_ID })
    await settle()
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      run: null,
      chat: chat([
        { id: 'q', role: 'user', text: 'hi', at: 1 },
        { id: 'a', role: 'assistant', text: 'hello', at: 2, provider: 'Gone', model: 'flash' },
      ]),
    })
    expect((screen.getByTestId('aichat-send') as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByTestId('aichat-blocked').textContent).toContain('no model is chosen')
    expect(screen.getByTestId('aichat-model').getAttribute('aria-invalid')).toBe('true')

    // Naming a model is all it takes to go on - with another provider than the one that is gone.
    await view.rerender({
      paneId: 'p',
      state: { chat: CHAT_ID, provider: 'other', model: 'big' },
    } as never)
    await settle()
    expect(screen.queryByTestId('aichat-blocked')).toBeNull()
    expect(screen.getByTestId('aichat-model').getAttribute('aria-invalid')).toBe('false')
  })

  it('draws a line where what the model is sent begins, and none while all of it goes', async () => {
    withProvider()
    mount({ chat: CHAT_ID })
    await settle()
    const messages = [
      { id: 'q1', role: 'user' as const, text: 'first', at: 1 },
      { id: 'a1', role: 'assistant' as const, text: 'one', at: 2 },
      { id: 'q2', role: 'user' as const, text: 'second', at: 3 },
      { id: 'a2', role: 'assistant' as const, text: 'two', at: 4 },
    ]
    await emit({ type: 'snapshot', chatId: CHAT_ID, chat: chat(messages), run: null })
    expect(screen.queryByTestId('aichat-cut')).toBeNull()

    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      chat: { ...chat(messages), context: { from: 'q2', at: 5 } },
      run: null,
    })
    const cut = screen.getByTestId('aichat-cut')
    expect(cut.textContent?.trim()).toBe('not sent · 2 above')
    // In the log, right above the first message that still goes - and nothing is hidden.
    expect(cut.nextElementSibling?.textContent).toContain('second')
    expect(screen.getAllByTestId('aichat-message')).toHaveLength(4)
    // Why, and where it is set, is one hover away.
    expect(cut.title).toContain('settings')
  })

  it('a summary of what is above the line can be read there, as text', async () => {
    withProvider()
    mount({ chat: CHAT_ID })
    await settle()
    const messages = [
      { id: 'q1', role: 'user' as const, text: 'first', at: 1 },
      { id: 'a1', role: 'assistant' as const, text: 'one', at: 2 },
      { id: 'q2', role: 'user' as const, text: 'second', at: 3 },
    ]
    const told = '<img src=x onerror=alert(1)> They said **first**.'
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      chat: {
        ...chat(messages),
        context: { from: 'q2', at: 5, summary: { text: told, before: 'q2' } },
      },
      run: null,
    })
    expect(screen.getByTestId('aichat-cut').textContent?.trim()).toBe('summarised · 2 above')
    const summary = screen.getByTestId('aichat-summary')
    // A model wrote it: it is text, never markup.
    expect(summary.querySelector('p')?.textContent).toBe(told)
    expect(summary.querySelector('img')).toBeNull()

    // A summary that ends before the line does not speak for all that is above it.
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      chat: {
        ...chat(messages),
        context: { from: 'q2', at: 5, summary: { text: told, before: 'q1' } },
      },
      run: null,
    })
    expect(screen.getByTestId('aichat-cut').textContent?.trim()).toBe('not sent · 2 above')
    expect(screen.getByTestId('aichat-summary').querySelector('p')?.textContent).toBe(told)
  })

  it('says it is summarising while it is, before the question is asked', async () => {
    withProvider()
    mount({ chat: CHAT_ID })
    await settle()
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      chat: chat([{ id: 'q', role: 'user', text: 'hi', at: 1 }]),
      run: { ...run(), phase: 'compacting' },
    })
    expect(screen.getByTestId('aichat-telemetry').textContent).toContain('tx · compacting')
    expect(screen.getByTestId('aichat-run').textContent).toContain(
      'summarising what no longer fits',
    )
    // Beside the pane's title too: nothing is being received yet.
    expect(paneMeta.get('p').badge).toBe('compacting')

    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      chat: chat([{ id: 'q', role: 'user', text: 'hi', at: 1 }]),
      run: run(),
    })
    expect(screen.getByTestId('aichat-telemetry').textContent).not.toContain('compacting')
    expect(screen.getByTestId('aichat-run').textContent).toContain('waiting for Local')
    expect(paneMeta.get('p').badge).toBe('receiving')
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
    // Only the conversation is let go of; the provider and the model stay in the pane state.
    expect(patchPaneState.mock.lastCall).toStrictEqual(['p', { chat: undefined }])
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

describe('AiChatWidget files', () => {
  const DRAFT = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
  const image: AttachmentView = {
    id: 'img',
    kind: 'image',
    name: 'a-rather-long-screenshot-name-from-the-desktop.png',
    mime: 'image/png',
    bytes: 245_760,
    sha256: 'a'.repeat(64),
    tokens: 1600,
    width: 1280,
    height: 720,
    source: { width: 4032, height: 3024 },
    thumb: 'data:image/jpeg;base64,AAAA',
  }
  const paper: AttachmentView = {
    id: 'pdf',
    kind: 'pdf',
    name: 'paper.pdf',
    mime: 'application/pdf',
    bytes: 90_000,
    sha256: 'b'.repeat(64),
    tokens: 5000,
    pages: 2,
  }
  const notes: AttachmentView = {
    id: 'txt',
    kind: 'text',
    name: 'notes.md',
    mime: 'text/plain',
    bytes: 12,
    sha256: 'c'.repeat(64),
    tokens: 20,
  }

  beforeEach(() => {
    // Chips and the card power on and off like a tube, which asks whether motion is reduced;
    // the card measures itself, and jsdom has no observer.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
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
    ai.pending = vi.fn(async () => [])
    ai.attach = vi.fn(async () => ({ ok: true, file: notes }))
    ai.detach = vi.fn(async () => [])
    ai.discard = vi.fn(async () => undefined)
    ai.thumbs = vi.fn(async () => ({}))
  })

  it('shows the files waiting in its draft, and sends them with no words needed', async () => {
    withProvider()
    ai.pending = vi.fn(async () => [image, notes])
    mount({ filesDraft: DRAFT })
    await settle()
    expect(ai.pending).toHaveBeenCalledWith(DRAFT)
    const chips = screen.getAllByTestId('aichat-chip')
    expect(chips.map((chip) => chip.dataset.kind)).toEqual(['image', 'text'])
    expect(screen.getByTestId('aichat-payload-total').textContent).toBe(
      '2 files · 240 KB · ~1.6k tok',
    )
    // A file is something to send.
    const send = screen.getByTestId('aichat-send') as HTMLButtonElement
    expect(send.disabled).toBe(false)
    await fireEvent.click(send)
    await settle()
    expect(ai.send).toHaveBeenCalledWith(CHAT_ID, {
      provider: 'local',
      model: 'tiny',
      text: '',
      draft: DRAFT,
      files: ['img', 'txt'],
    })
    expect(screen.queryByTestId('aichat-payload')).toBeNull()
  })

  it('leaves a file out with its ×', async () => {
    withProvider()
    ai.pending = vi.fn(async () => [image, notes])
    ai.detach = vi.fn(async () => [notes])
    mount({ filesDraft: DRAFT })
    await settle()
    await fireEvent.click(screen.getAllByTestId('aichat-chip-remove')[0] as HTMLElement)
    await settle()
    expect(ai.detach).toHaveBeenCalledWith(DRAFT, 'img')
    expect(screen.getAllByTestId('aichat-chip')).toHaveLength(1)
  })

  it('says a PDF will not go to a provider that is not sent one, and does not try', async () => {
    withProvider()
    ai.pending = vi.fn(async () => [paper])
    mount({ filesDraft: DRAFT })
    await settle()
    expect(screen.getByTestId('aichat-chip').classList.contains('unsent')).toBe(true)
    expect(screen.getByTestId('aichat-blocked').textContent).toMatch(
      /no document.*Local is not sent PDF files/,
    )
    expect((screen.getByTestId('aichat-send') as HTMLButtonElement).disabled).toBe(true)
  })

  it('a sent question shows its files, and no empty line where it had no words', async () => {
    withProvider()
    ai.thumbs = vi.fn(async () => ({ img: 'data:image/jpeg;base64,BBBB' }))
    mount({ chat: CHAT_ID })
    await settle()
    const { thumb: _thumb, ...kept } = image
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      run: null,
      chat: chat([{ id: 'q1', role: 'user', text: '', at: 1, attachments: [kept] }]),
    })
    await settle()
    const shown = screen.getByTestId('aichat-message-files')
    expect(shown.querySelector('img')?.getAttribute('src')).toBe('data:image/jpeg;base64,BBBB')
    expect(shown.querySelector('[data-testid=aichat-chip-remove]')).toBeNull()
    expect(screen.getByTestId('aichat-message').querySelector('.said')).toBeNull()
  })

  it('an edited question carries its files, and keeps only those left on it', async () => {
    withProvider()
    mount({ chat: CHAT_ID, filesDraft: DRAFT })
    await settle()
    const { thumb: _thumb, ...kept } = image
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      run: null,
      chat: chat([{ id: 'q1', role: 'user', text: 'look', at: 1, attachments: [kept, notes] }]),
    })
    await fireEvent.click(screen.getByTestId('aichat-edit'))
    await settle()
    const payload = screen.getByTestId('aichat-payload')
    expect(payload.querySelectorAll('[data-testid=aichat-chip]')).toHaveLength(2)
    await fireEvent.click(
      payload.querySelectorAll('[data-testid=aichat-chip-remove]')[1] as HTMLElement,
    )
    await settle()
    await fireEvent.keyDown(screen.getByTestId('aichat-input'), { key: 'Enter' })
    await settle()
    expect(ai.send).toHaveBeenCalledWith(CHAT_ID, {
      provider: 'local',
      model: 'tiny',
      text: 'look',
      replaceFrom: 'q1',
      keep: ['img'],
    })
  })

  it('files waiting for the next question stay through an edit, and after it is left', async () => {
    withProvider()
    ai.pending = vi.fn(async () => [notes])
    mount({ chat: CHAT_ID, filesDraft: DRAFT })
    await settle()
    const { thumb: _thumb, ...kept } = image
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      run: null,
      chat: chat([{ id: 'q1', role: 'user', text: 'look', at: 1, attachments: [kept] }]),
    })
    await fireEvent.click(screen.getByTestId('aichat-edit'))
    await settle()
    const chips = () =>
      [...screen.getByTestId('aichat-payload').querySelectorAll('[data-testid=aichat-chip]')].map(
        (chip) => (chip as HTMLElement).dataset.kind,
      )
    expect(chips()).toEqual(['image', 'text'])
    await fireEvent.keyDown(screen.getByTestId('aichat-input'), { key: 'Escape' })
    await settle()
    // The edit's own file goes back to it; the waiting one stays, and main was not told to drop it.
    expect(chips()).toEqual(['text'])
    expect(ai.discard).not.toHaveBeenCalled()
  })

  it('an edit that would carry more than a question takes says so before it is sent', async () => {
    withProvider()
    const waiting = [0, 1, 2].map((n) => ({ ...notes, id: `w${n}`, sha256: String(n).repeat(64) }))
    ai.pending = vi.fn(async () => waiting)
    mount({ chat: CHAT_ID, filesDraft: DRAFT })
    await settle()
    const own = [0, 1, 2].map((n) => ({ ...notes, id: `o${n}`, sha256: String(n + 5).repeat(64) }))
    await emit({
      type: 'snapshot',
      chatId: CHAT_ID,
      run: null,
      chat: chat([{ id: 'q1', role: 'user', text: 'look', at: 1, attachments: own }]),
    })
    await fireEvent.click(screen.getByTestId('aichat-edit'))
    await settle()
    expect(screen.getByTestId('aichat-blocked').textContent).toMatch(
      /payload full.*up to 5 files - leave 1 out/,
    )
    expect((screen.getByTestId('aichat-send') as HTMLButtonElement).disabled).toBe(true)
  })

  it('a card whose chip went goes with it', async () => {
    withProvider()
    ai.pending = vi.fn(async () => [image])
    const { thumb: _thumb, ...sent } = image
    // Main publishes the conversation with the question before it answers the send: the file,
    // with the same id, is the sent question's by the time the chip goes.
    ai.send = vi.fn(async () => {
      for (const handler of [...handlers]) {
        handler({
          type: 'snapshot',
          chatId: CHAT_ID,
          run: null,
          chat: chat([{ id: 'q1', role: 'user', text: '', at: 1, attachments: [sent] }]),
        })
      }
      return { ok: true }
    })
    mount({ chat: CHAT_ID, filesDraft: DRAFT })
    await settle()
    const face = screen.getByTestId('aichat-chip').querySelector('.face') as HTMLElement
    await fireEvent.focus(face)
    await settle()
    expect(screen.getByTestId('aichat-file-card')).toBeTruthy()
    // Sent from the keyboard while the card is up: the chip goes, with no pointerleave.
    await fireEvent.keyDown(screen.getByTestId('aichat-input'), { key: 'Enter' })
    await settle()
    expect(screen.queryByTestId('aichat-payload')).toBeNull()
    await vi.waitFor(() => expect(screen.queryByTestId('aichat-file-card')).toBeNull())
  })

  it('a send refused for a file main let go shows again what main holds', async () => {
    withProvider()
    ai.pending = vi.fn(async () => [image])
    ai.send = vi.fn(async () => ({
      ok: false,
      error: 'a file waiting here was let go - attach it again',
    }))
    mount({ filesDraft: DRAFT })
    await settle()
    ai.pending = vi.fn(async () => [])
    await fireEvent.click(screen.getByTestId('aichat-send'))
    await settle()
    expect(screen.getByTestId('aichat-problem').textContent).toMatch(/was let go/)
    expect(ai.pending).toHaveBeenCalledWith(DRAFT)
    expect(screen.queryByTestId('aichat-payload')).toBeNull()
  })

  it('a picture pasted alone is attached; text pasted stays text', async () => {
    withProvider()
    mount()
    await settle()
    const input = screen.getByTestId('aichat-input')
    const paste = (files: File[], text: string): Event => {
      const event = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clipboardData', {
        value: { files, getData: () => text },
      })
      input.dispatchEvent(event)
      return event
    }
    const file = new File(['# notes'], 'image.txt', { type: 'text/plain' })
    expect(paste([file], 'cells as text').defaultPrevented).toBe(false)
    expect(ai.attach).not.toHaveBeenCalled()
    expect(paste([file], '').defaultPrevented).toBe(true)
    await settle()
    await vi.waitFor(() => expect(ai.attach).toHaveBeenCalledTimes(1))
    const [draftId, upload] = (ai.attach?.mock.lastCall ?? []) as [string, { name: string }]
    // A draft is made for it, and kept in the pane's state so a moved pane finds it again.
    expect(draftId).toMatch(/^[0-9a-f-]{36}$/)
    expect(patchPaneState).toHaveBeenCalledWith('p', { filesDraft: draftId })
    expect(upload.name).toMatch(/^pasted-\d{8}-\d{6}\.txt$/)
  })

  it('says why a file was not taken, in its code and in words', async () => {
    withProvider()
    ai.attach = vi.fn(async () => ({
      ok: false,
      code: 'unreadable',
      detail: 'only text, images and PDF files can be attached',
    }))
    mount()
    await settle()
    const input = screen.getByTestId('aichat-attach-input') as HTMLInputElement
    Object.defineProperty(input, 'files', {
      value: [new File([new Uint8Array([0, 1, 2])], 'tool.exe')],
      configurable: true,
    })
    await fireEvent.change(input)
    await vi.waitFor(() =>
      expect(screen.getByTestId('aichat-attach-problem').textContent).toMatch(
        /unreadable.*tool\.exe: only text, images and PDF files/,
      ),
    )
  })

  it('shows where files may be dropped while they are held over the pane', async () => {
    withProvider()
    mount()
    await settle()
    const pane = screen.getByTestId('aichat')
    const drag = (type: string, types: string[]): void => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'dataTransfer', { value: { types, files: [] } })
      pane.dispatchEvent(event)
    }
    drag('dragenter', ['text/plain'])
    await settle()
    expect(screen.queryByTestId('aichat-drop')).toBeNull()
    drag('dragenter', ['Files'])
    await settle()
    expect(screen.getByTestId('aichat-drop').textContent).toMatch(/drop to attach.*room for 5/)
    drag('dragleave', ['Files'])
    await settle()
    expect(screen.queryByTestId('aichat-drop')).toBeNull()
  })

  it('a chip’s card says what the chip has no room for', async () => {
    withProvider()
    ai.pending = vi.fn(async () => [image])
    mount({ filesDraft: DRAFT })
    await settle()
    const face = screen.getByTestId('aichat-chip').querySelector('.face') as HTMLElement
    await fireEvent.focus(face)
    await settle()
    const card = screen.getByTestId('aichat-file-card')
    expect(card.textContent).toContain(image.name)
    expect(card.textContent).toMatch(/PNG\s·\s1280×720/)
    expect(screen.getByTestId('aichat-file-card-source').textContent).toBe(
      'made smaller from 4032×3024',
    )
    expect(card.textContent).toMatch(/245,760 bytes · ~1,600 tokens/)
    await fireEvent.blur(face)
    await vi.waitFor(() => expect(screen.queryByTestId('aichat-file-card')).toBeNull())
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
