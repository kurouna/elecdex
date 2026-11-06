import { describe, expect, it } from 'vitest'
import {
  chrF,
  kanjiNumber,
  normalizeForScore,
  numbersDiffer,
  numbersOf,
  tripWarnLine,
} from '../../src/shared/translate/chrf'
import { applyBlockPatch, type BlockView, mergeTripPatch } from '../../src/shared/translate/run'

/** ROUND TRIP's score and how a round trip travels in patches (docs/translate.md §6.4). */

describe('chrF', () => {
  it('is 100 for the same text, white space aside, and low for an unrelated one', () => {
    expect(chrF('The pane is here.', 'The pane is here.')).toBe(100)
    expect(chrF('The pane is here.', 'The  pane   is here.')).toBe(100)
    expect(chrF('The pane is here.', 'Completely different words.')).toBeLessThan(
      tripWarnLine('en'),
    )
  })

  it('weighs what of the source came back over what was added', () => {
    const missing = chrF('The metrics collector runs apart.', 'The metrics collector')
    const added = chrF('The metrics collector', 'The metrics collector runs apart.')
    expect(missing).toBeLessThan(added)
  })

  it('scores a short answer low: an order it is too short for counts as nothing matched', () => {
    expect(chrF('abcdefgh', 'abc')).toBeLessThan(20)
  })

  it('works on text without spaces, as Japanese', () => {
    expect(chrF('ペインは右にある', 'ペインは右にある')).toBe(100)
    expect(chrF('ペインは右にある', 'ペインは左にある')).toBeGreaterThan(30)
    expect(chrF('', '')).toBe(100)
    expect(chrF('あ', '')).toBe(0)
  })
})

describe('round trip patches', () => {
  const block: BlockView = {
    index: 0,
    lead: '',
    source: 'Hi.',
    text: 'やあ。',
    state: 'done',
    note: null,
    tokens: null,
    ms: null,
    history: 0,
    terms: 0,
    edited: false,
    trip: null,
  }

  it('builds a round trip from its patches, and null takes it away', () => {
    let b = applyBlockPatch(block, {
      index: 0,
      trip: { text: '', state: 'queued', score: null, lang: 'en' },
    })
    b = applyBlockPatch(b, { index: 0, trip: { state: 'running' } })
    b = applyBlockPatch(b, { index: 0, trip: { append: 'Hi' } })
    b = applyBlockPatch(b, { index: 0, trip: { append: '.', state: 'done', score: 100 } })
    expect(b.trip).toEqual({ text: 'Hi.', state: 'done', score: 100, lang: 'en' })
    expect(applyBlockPatch(b, { index: 0, trip: null }).trip).toBeNull()
  })

  it('merges two patches as one, a whole text dropping what came before it', () => {
    expect(mergeTripPatch({ append: 'a' }, { append: 'b', state: 'done' })).toEqual({
      append: 'ab',
      state: 'done',
    })
    expect(mergeTripPatch({ append: 'a' }, { text: '' })).toEqual({ text: '' })
    expect(mergeTripPatch({ append: 'a' }, null)).toBeNull()
    // After the trip was taken away: a whole new one, nothing of the old showing through.
    expect(mergeTripPatch(null, { append: 'c' })).toEqual({
      text: 'c',
      state: 'queued',
      score: null,
      lang: '',
    })
  })
})

describe('the texts as they are compared', () => {
  it('reads kanji numerals as digits, and full-width as half-width', () => {
    expect(kanjiNumber('六')).toBe('6')
    expect(kanjiNumber('十二')).toBe('12')
    expect(kanjiNumber('二十')).toBe('20')
    expect(kanjiNumber('百')).toBe('100')
    expect(kanjiNumber('二〇二六')).toBe('2026')
    // 万 and 億 stay units, as the model writes them.
    expect(kanjiNumber('三万五千')).toBe('3万5000')
    expect(kanjiNumber('五千万')).toBe('5000万')
    expect(kanjiNumber('一万二千')).toBe('1万2000')
    expect(kanjiNumber('二十一')).toBe('21')
    expect(normalizeForScore('一日三回、２０２６年')).toBe('1日3回、2026年')
  })

  it('keeps digits before 万 and 千 one number', () => {
    expect(normalizeForScore('3万人')).toBe('3万人')
    expect(normalizeForScore('5千円')).toBe('5000円')
    expect(normalizeForScore('約1万5千台')).toBe('約1万5000台')
    expect(normalizeForScore('３万')).toBe('3万')
  })

  it('says a number changed, which chrF cannot see', () => {
    // One character apart: chrF scores it high, the numbers say it.
    expect(numbersDiffer('予算は五千万円です', '予算は500万円です')).toBe(true)
    expect(numbersDiffer('三千人', '300人')).toBe(true)
    expect(numbersDiffer('Take 3 apples and 2 pears.', 'Take 3 apples.')).toBe(true)
    // The same numbers written either way, in another order, or on one side only: not judged.
    expect(numbersDiffer('一日三回、六歳未満', '6歳未満は1日3回')).toBe(false)
    expect(numbersDiffer('1,500 yen', '1500円')).toBe(false)
    expect(numbersDiffer('twelve hours', '12 hours')).toBe(false)
    expect(numbersOf('約1万5千台、3.5 kg。')).toEqual(['1万5000', '3.5'])
  })

  it('lets a lone kanji numeral answer the same number in digits', () => {
    expect(numbersDiffer('第三章に5つの例がある。', '第3章に5つの例がある。')).toBe(false)
    expect(numbersDiffer('五分後に3回押す。', '5分後に3回押す。')).toBe(false)
    expect(numbersDiffer('三名が2日来た。', '3名が2日来た。')).toBe(false)
    expect(numbersDiffer('我有三本书和两支笔。', '我有3本书和2支笔。')).toBe(false)
    // A lone numeral answers only its own number: 第三章 against 第4章 is a change.
    expect(numbersDiffer('第三章に5つの例がある。', '第4章に5つの例がある。')).toBe(true)
  })

  it('takes the 一 of a word for no number, nor one for a digit', () => {
    // Paraphrases that drop 十分, 一般 or 一緒: not numbers, never flagged.
    expect(numbersDiffer('十分に注意して、3回確認する。', '充分に注意して、3回確認する。')).toBe(
      false,
    )
    expect(numbersDiffer('一般的に、手順は3つある。', '通常、手順は3つある。')).toBe(false)
    expect(numbersDiffer('一緒に2人で行く。', '2人で共に行く。')).toBe(false)
    expect(numbersDiffer('I have 3 apples and one pear.', 'I have 3 apples and 1 pear.')).toBe(
      false,
    )
    expect(numbersDiffer('two dogs and 3 cats', '2 dogs and 3 cats')).toBe(false)
    // A kanji number with its counter is one.
    expect(numbersOf('三人で五年、一回だけ')).toEqual(['3', '5'])
  })

  it('scores a number written either way as the same', () => {
    expect(chrF('三万人', '3万人')).toBe(100)
    expect(chrF('五千万円', '5000万円')).toBe(100)
    expect(chrF('六歳未満は無料です。', '6歳未満は無料です。')).toBe(100)
    expect(chrF('一回の充電で約十二時間もつ。', '1回の充電で約12時間もつ。')).toBe(100)
  })
})

describe('the warning line', () => {
  it('is lower for a language written without spaces, measured (2026-11-06)', () => {
    expect(tripWarnLine('en')).toBe(50)
    expect(tripWarnLine('fr')).toBe(50)
    expect(tripWarnLine('ja')).toBe(30)
    expect(tripWarnLine('zh-hans')).toBe(30)
    expect(tripWarnLine('th')).toBe(30)
  })

  it('lets a good Japanese paraphrase through, and says another meaning', () => {
    const source = '会議は木曜日の午後に変更になりました。'
    expect(chrF(source, '会議は木曜日の午後に変更されました。')).toBeGreaterThan(tripWarnLine('ja'))
    expect(chrF(source, '猫は午後ずっとソファで寝ている。')).toBeLessThan(tripWarnLine('ja'))
  })
})
