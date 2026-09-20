import {
  AI_LIMITS,
  AI_PRESETS,
  ago,
  aiBaseUrl,
  applyChatEvent,
  type Chat,
  type ChatRun,
  type ChatView,
  chatMarkdown,
  chatRequest,
  chatTitle,
  compactCount,
  EMPTY_VIEW,
  freshProviderId,
  keyMayTravel,
  paneAiChat,
  ThinkSplitter,
  tokensPerSecond,
} from '@shared/ai'
import { applySettingsPatch, defaultSettings, SettingsSchema } from '@shared/settings'
import { describe, expect, it } from 'vitest'

const CHAT_ID = '11111111-2222-4333-8444-555555555555'

describe('a provider address', () => {
  it('is kept in one form: http(s), no trailing slash', () => {
    expect(aiBaseUrl('http://localhost:11434/v1/')).toBe('http://localhost:11434/v1')
    expect(aiBaseUrl('  https://api.anthropic.com ')).toBe('https://api.anthropic.com')
    expect(aiBaseUrl('https://openrouter.ai/api/v1')).toBe('https://openrouter.ai/api/v1')
  })

  it('is refused when it is not a plain web address', () => {
    for (const bad of [
      'file:///etc/passwd',
      'ftp://host/v1',
      'localhost:11434',
      'https://user:secret@host/v1',
      'https://host/v1?key=abc',
      'https://host/v1#frag',
      '',
      42,
      null,
    ]) {
      expect(aiBaseUrl(bad)).toBeNull()
    }
  })

  it('every preset has a usable one and an id a provider may have', () => {
    for (const preset of AI_PRESETS) {
      expect(aiBaseUrl(preset.baseUrl)).toBe(preset.baseUrl)
      expect(freshProviderId(preset.id, [])).toBe(preset.id)
    }
  })
})

describe('where a key may be sent', () => {
  it('anywhere over https', () => {
    expect(keyMayTravel('https://api.openai.com/v1')).toBe(true)
  })

  it('in the clear only to this machine or the local network', () => {
    for (const near of [
      'http://localhost:1234/v1',
      'http://127.0.0.1:8080/v1',
      'http://[::1]:8080/v1',
      'http://192.168.1.20:11434/v1',
      'http://10.0.0.5/v1',
      'http://172.20.1.1/v1',
      'http://gpu-box.local:8000/v1',
    ]) {
      expect(keyMayTravel(near), near).toBe(true)
    }
    for (const far of ['http://api.example.com/v1', 'http://172.32.0.1/v1', 'http://8.8.8.8/v1']) {
      expect(keyMayTravel(far), far).toBe(false)
    }
  })
})

describe('provider ids', () => {
  it('a second provider from the same preset gets an id of its own', () => {
    expect(freshProviderId('ollama', ['ollama'])).toBe('ollama-2')
    expect(freshProviderId('ollama', ['ollama', 'ollama-2'])).toBe('ollama-3')
  })
})

describe('the ai settings', () => {
  it('start with no provider and no prompt', () => {
    expect(defaultSettings().ai).toEqual({ providers: [], systemPrompt: '' })
  })

  it('a patch replaces the provider list and leaves the prompt', () => {
    const start = applySettingsPatch(defaultSettings(), { ai: { systemPrompt: 'be brief' } })
    const next = applySettingsPatch(start ?? defaultSettings(), {
      ai: {
        providers: [
          { id: 'ollama', name: 'Ollama', kind: 'openai', baseUrl: 'http://localhost:11434/v1' },
        ],
      },
    })
    expect(next?.ai.systemPrompt).toBe('be brief')
    expect(next?.ai.providers).toEqual([
      {
        id: 'ollama',
        name: 'Ollama',
        kind: 'openai',
        baseUrl: 'http://localhost:11434/v1',
        model: '',
      },
    ])
  })

  it('two providers cannot share an id, and nothing like a key is kept', () => {
    const provider = { id: 'a', name: 'A', kind: 'openai', baseUrl: 'http://localhost/v1' }
    expect(applySettingsPatch(defaultSettings(), { ai: { providers: [provider, provider] } })).toBe(
      null,
    )
    const parsed = SettingsSchema.parse({ ai: { providers: [{ ...provider, apiKey: 'sk-1' }] } })
    expect(JSON.stringify(parsed)).not.toContain('sk-1')
  })
})

describe('reasoning written inline', () => {
  const feed = (pieces: string[]): { text: string; thinking: string } => {
    const splitter = new ThinkSplitter()
    const out = { text: '', thinking: '' }
    for (const piece of [...pieces.map((p) => splitter.push(p)), splitter.flush()]) {
      out.text += piece.text
      out.thinking += piece.thinking
    }
    return out
  }

  it('is split from the answer', () => {
    expect(feed(['<think>let me see</think>The answer is 4.'])).toEqual({
      text: 'The answer is 4.',
      thinking: 'let me see',
    })
  })

  it('survives tags cut anywhere by the stream', () => {
    const whole = '<think>step one\nstep two</think>\n\nDone.'
    for (let cut = 1; cut < whole.length; cut += 1) {
      expect(feed([whole.slice(0, cut), whole.slice(cut)]), `cut at ${cut}`).toEqual({
        text: '\n\nDone.',
        thinking: 'step one\nstep two',
      })
    }
    expect(feed([...whole])).toEqual({ text: '\n\nDone.', thinking: 'step one\nstep two' })
  })

  it('an answer with no reasoning passes through, a "<" at its end included', () => {
    expect(feed(['a <', 'b> c', ' 1 <'])).toEqual({ text: 'a <b> c 1 <', thinking: '' })
  })

  it('only a tag that opens the answer counts', () => {
    expect(feed(['Use the <think> tag like so: <think>x</think>'])).toEqual({
      text: 'Use the <think> tag like so: <think>x</think>',
      thinking: '',
    })
  })

  it('reasoning never closed is still reasoning', () => {
    expect(feed(['<think>still going'])).toEqual({ text: '', thinking: 'still going' })
  })
})

describe('following a conversation', () => {
  const chat: Chat = {
    version: 1,
    id: CHAT_ID,
    title: 't',
    createdAt: 1,
    updatedAt: 1,
    messages: [],
  }
  const run: ChatRun = { id: 'r1', text: '', thinking: '', provider: 'P', model: 'm', startedAt: 1 }
  const delta = (textAt: number, text: string, runId = 'r1') =>
    ({ type: 'delta', chatId: CHAT_ID, runId, textAt, text, thinkingAt: 0, thinking: '' }) as const

  it('a snapshot is the whole truth; deltas append to it', () => {
    let view = applyChatEvent(EMPTY_VIEW, { type: 'snapshot', chatId: CHAT_ID, chat, run })
    view = applyChatEvent(view as ChatView, delta(0, 'Hel'))
    view = applyChatEvent(view as ChatView, delta(3, 'lo'))
    expect((view as ChatView).run?.text).toBe('Hello')
  })

  it('a delta that does not fit asks for a new snapshot instead of leaving a hole', () => {
    const view: ChatView = { chat, run: { ...run, text: 'Hel' } }
    expect(applyChatEvent(view, delta(5, 'x'))).toBe('resync')
    expect(applyChatEvent(view, delta(3, 'x', 'another-run'))).toBe('resync')
    expect(applyChatEvent({ chat, run: null }, delta(0, 'x'))).toBe('resync')
  })
})

describe('what a pane may ask', () => {
  it('a well-formed request passes, cut to the limits', () => {
    expect(chatRequest({ provider: 'ollama', model: 'llama3', text: 'hi' })).toEqual({
      provider: 'ollama',
      model: 'llama3',
      text: 'hi',
    })
    expect(chatRequest({ provider: 'ollama', model: 'llama3' })).toEqual({
      provider: 'ollama',
      model: 'llama3',
    })
  })

  it('a message longer than a message may be is cut, not refused', () => {
    const long = chatRequest({
      provider: 'ollama',
      model: 'm',
      text: 'x'.repeat(AI_LIMITS.text + 10),
    })
    expect(long?.text).toHaveLength(AI_LIMITS.text)
  })

  it('anything else is refused', () => {
    for (const bad of [
      null,
      'hi',
      { provider: '../x', model: 'm', text: 'hi' },
      { provider: 'ollama', model: '', text: 'hi' },
      { provider: 'ollama', model: 'm', text: '   ' },
      { provider: 'ollama', model: 'm', text: 5 },
      { provider: 'ollama', model: 'm', replaceFrom: 5 },
    ]) {
      expect(chatRequest(bad)).toBeNull()
    }
  })
})

describe('pane state', () => {
  it('is read defensively: layout.json may be edited by hand', () => {
    expect(paneAiChat(undefined)).toEqual({ chat: null, provider: null, model: null })
    expect(paneAiChat({ chat: '../../etc', provider: 'UPPER', model: 7 })).toEqual({
      chat: null,
      provider: null,
      model: null,
    })
    expect(paneAiChat({ chat: CHAT_ID, provider: 'ollama', model: 'qwen3:8b' })).toEqual({
      chat: CHAT_ID,
      provider: 'ollama',
      model: 'qwen3:8b',
    })
  })
})

describe('readouts', () => {
  const answer = { id: 'a', role: 'assistant' as const, text: 'x', at: 1 }

  it('tokens a second, only when both were measured and it took long enough to say', () => {
    expect(tokensPerSecond({ ...answer, usage: { input: 9, output: 90 }, ms: 3000 })).toBe(30)
    expect(tokensPerSecond({ ...answer, usage: { input: 9, output: 90 } })).toBeNull()
    expect(tokensPerSecond({ ...answer, ms: 3000 })).toBeNull()
    expect(tokensPerSecond({ ...answer, usage: { input: 9, output: 90 }, ms: 50 })).toBeNull()
    expect(tokensPerSecond({ ...answer, usage: { input: 9, output: 0 }, ms: 3000 })).toBeNull()
  })

  it('how long ago, as a log says it', () => {
    const now = Date.UTC(2026, 8, 21, 12, 0)
    const minute = 60_000
    expect(ago(now, now)).toBe('now')
    expect(ago(now + 5 * minute, now)).toBe('now')
    expect(ago(now - 5 * minute, now)).toBe('5m')
    expect(ago(now - 125 * minute, now)).toBe('2h')
    expect(ago(now - 3 * 24 * 60 * minute, now)).toBe('3d')
    expect(ago(now - 40 * 24 * 60 * minute, now)).toBe('2026-08-12')
  })

  it('counts are shortened for a readout', () => {
    expect(compactCount(0)).toBe('0')
    expect(compactCount(999)).toBe('999')
    expect(compactCount(1234)).toBe('1.2k')
    expect(compactCount(9999)).toBe('10.0k')
    expect(compactCount(45_678)).toBe('46k')
  })
})

describe('titles and export', () => {
  it('a conversation is named after the first line asked', () => {
    expect(chatTitle('\n\n# How do I reverse a list?\nIn Python.')).toBe('How do I reverse a list?')
    expect(chatTitle('   ')).toBe('untitled')
    expect(chatTitle('x'.repeat(500)).length).toBe(80)
  })

  it('exports as markdown, naming who said what', () => {
    const chat: Chat = {
      version: 1,
      id: CHAT_ID,
      title: 'Lists',
      createdAt: 1,
      updatedAt: 2,
      messages: [
        { id: 'a', role: 'user', text: 'How?', at: 1 },
        { id: 'b', role: 'assistant', text: 'Like so.', at: 2, model: 'llama3' },
      ],
    }
    expect(chatMarkdown(chat)).toBe('# Lists\n\n## You\n\nHow?\n\n## llama3\n\nLike so.\n')
  })
})
