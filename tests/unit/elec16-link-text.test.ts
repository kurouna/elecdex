import { AI_TYPES } from '@shared/elec16/link-services'
import {
  aiSystemPrompt,
  aiTraits,
  answerScript,
  kanaRoom,
  lcdReply,
  queryText,
} from '@shared/elec16/link-text'
import { describe, expect, it } from 'vitest'

/**
 * The AI behind LINK as text (shared/elec16/link-text.ts): English or kana, the prompt, and a
 * model's answer made into the LCD's characters.
 */

/** Text as the machine's bytes: ASCII, and half-width kana at A1-DF. */
const machine = (text: string): Uint8Array =>
  new Uint8Array(
    [...text].map((c) => {
      const code = c.codePointAt(0) ?? 0
      return code >= 0xff61 ? code - 0xff61 + 0xa1 : code
    }),
  )
/** The machine's bytes as text, kana half-width. */
const shown = (bytes: Uint8Array): string =>
  String.fromCharCode(...[...bytes].map((b) => (b >= 0xa1 ? b - 0xa1 + 0xff61 : b)))

const TRANS = AI_TYPES.indexOf('TRANS')

describe('which script an answer is in', () => {
  it('is kana for a question with a kana letter, English for one without', () => {
    expect(answerScript(0, machine('ﾃﾝｷﾊ?'))).toBe('kana')
    expect(answerScript(0, machine('WHAT IS 2+2?'))).toBe('english')
    // The kana punctuation alone is not Japanese.
    expect(answerScript(0, machine('｢HI｣･｡'))).toBe('english')
    expect(answerScript(0, machine('ﾞ'))).toBe('kana')
  })

  it('is the other one for TRANS', () => {
    expect(answerScript(TRANS, machine('ｲﾇ'))).toBe('english')
    expect(answerScript(TRANS, machine('DOG'))).toBe('kana')
  })

  it('names which types remember, search and cross', () => {
    const named = (name: string) => aiTraits(AI_TYPES.indexOf(name as (typeof AI_TYPES)[number]))
    expect(named('NORMAL')).toEqual({ remembers: true, search: false, crosses: false })
    expect(named('DICT').remembers).toBe(false)
    expect(named('SEARCH').search).toBe(true)
    expect(named('WEATHER')).toEqual({ remembers: false, search: true, crosses: false })
    expect(named('TRANS').crosses).toBe(true)
  })
})

describe('the question as the model reads it', () => {
  it('makes half-width kana full-width, voiced marks joined', () => {
    expect(queryText(machine('ﾊﾟﾙｻｰｯﾃ ﾅﾆ? ｶﾞｲﾄﾞ｡'))).toBe('パルサーッテ ナニ? ガイド。')
    expect(queryText(machine('ｳﾞｧ ｱﾞ'))).toBe('ヴァ ア゛')
  })

  it('drops what is neither ASCII nor kana', () => {
    expect(queryText(new Uint8Array([0x41, 0x0d, 0x90, 0x42]))).toBe('AB')
  })
})

describe('the system prompt', () => {
  it('holds the rules for the script and the length, after the type', () => {
    const english = aiSystemPrompt(0, 'english', 200, '2026-10-04')
    expect(english).toContain('only ASCII')
    expect(english).toContain('within 200 characters')
    expect(english).toContain('Today is 2026-10-04.')
    const kana = aiSystemPrompt(0, 'kana', 200, '2026-10-04')
    expect(kana).toContain('漢字は使わず')
    expect(kana).toContain('分かち書き')
    expect(kana).toContain(`${kanaRoom(200)} 文字以内`)
  })

  it('says which way TRANS goes', () => {
    expect(aiSystemPrompt(TRANS, 'english', 100, 'x')).toContain('Japanese into natural English')
    expect(aiSystemPrompt(TRANS, 'kana', 100, 'x')).toContain('English into natural Japanese')
  })

  it('has an instruction for every type', () => {
    const prompts = AI_TYPES.map((_, k) => aiSystemPrompt(k, 'english', 100, 'x'))
    expect(new Set(prompts).size).toBe(AI_TYPES.length)
  })
})

describe('an answer on the LCD', () => {
  it('turns hiragana and katakana into half-width kana, voiced marks apart', () => {
    expect(shown(lcdReply('ぱるさーは はやく まわる ほしです。', 'kana', 100))).toBe(
      'ﾊﾟﾙｻｰﾊ ﾊﾔｸ ﾏﾜﾙ ﾎｼﾃﾞｽ｡',
    )
    expect(shown(lcdReply('「ガイド」・ヴィ、ヶ', 'kana', 100))).toBe('｢ｶﾞｲﾄﾞ｣･ｳﾞｨ､ｹ')
  })

  it('makes full-width letters and typography ASCII', () => {
    expect(shown(lcdReply('ＡＢＣ１２３！ “hi” it’s — ok…', 'english', 100))).toBe(
      'ABC123! "hi" it\'s - ok...',
    )
  })

  it('shows what it has no character for as one ?', () => {
    expect(shown(lcdReply('明日は はれ', 'kana', 100))).toBe('?ﾊ ﾊﾚ')
    expect(shown(lcdReply('Tokyo 東京 today', 'english', 100))).toBe('Tokyo ? today')
    // English has no kana.
    expect(shown(lcdReply('A ねこ B', 'english', 100))).toBe('A ? B')
  })

  it('takes out Markdown, line breaks and control characters', () => {
    const text = '# Title\n**Bold** and `code`.\n- one\n- two\n[link](http://x)\fend\u0007'
    expect(shown(lcdReply(text, 'english', 200))).toBe('Title Bold and code. one two link end')
  })

  it('keeps whole sentences that fit, without dots', () => {
    const text = 'One sentence here. Two sentences here. Three sentences here.'
    expect(shown(lcdReply(text, 'english', 40))).toBe('One sentence here. Two sentences here.')
  })

  it('cuts at a space with ... when no sentence fits, and never past max', () => {
    const text = 'a very long sentence that goes on and on without any end at all'
    const bytes = lcdReply(text, 'english', 30)
    expect(bytes.length).toBeLessThanOrEqual(30)
    expect(shown(bytes)).toBe('a very long sentence that...')
    expect(shown(lcdReply('x'.repeat(50), 'english', 10))).toBe('xxxxxxx...')
    expect(lcdReply('abc', 'english', 2).length).toBe(2)
  })

  it('counts a voiced mark as a byte of its own', () => {
    const bytes = lcdReply('がが。がが。', 'kana', 5)
    expect(shown(bytes)).toBe('ｶﾞｶﾞ｡')
  })

  it('never answers with a byte outside the LCD characters', () => {
    const text = '\u0000\u001b[31m漢字🙂ｶﾅ ﾃｽﾄ\r\nok\u007f\u0080ÿ'
    for (const script of ['english', 'kana'] as const) {
      for (const b of lcdReply(text, script, 255)) {
        expect((b >= 0x20 && b <= 0x7e) || (b >= 0xa1 && b <= 0xdf)).toBe(true)
      }
    }
  })
})
