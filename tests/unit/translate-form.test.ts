import { describe, expect, it } from 'vitest'
import { formOf } from '../../src/shared/translate/form'

/** The form ROUND TRIP puts a block back into Japanese in: the source's own (form.ts). */

describe('formOf', () => {
  it('tells だ・である from です・ます by the sentences’ endings', () => {
    expect(formOf('隣の客はよく柿食う客だ')).toBe('plain')
    expect(formOf('これは試験である。結果は良かった。')).toBe('plain')
    expect(formOf('明日は雨が降る。傘を持っていく。')).toBe('plain')
    expect(formOf('これはペンです。')).toBe('polite')
    expect(formOf('明日は雨が降ります。傘を持っていきましょう。')).toBe('polite')
    expect(formOf('ご確認ください。')).toBe('polite')
    expect(formOf('本当ですか？')).toBe('polite')
    expect(formOf('本当にそうなのか？')).toBe('plain')
  })

  it('counts what most sentences say, closing marks and quotes taken off', () => {
    expect(formOf('「そうだ」と彼は言った。私もそう思う。それでいいです。')).toBe('plain')
    expect(formOf('そうです。そう思います。それでいいのだ。')).toBe('polite')
  })

  it('takes no vote from quoted speech or list items, which have forms of their own', () => {
    expect(formOf('先生は「明日は休みだ。宿題もない。」とおっしゃいました。')).toBe('polite')
    expect(
      formOf('手順は次の通りです。\n・ファイルを開く\n・名前を付けて保存する\n・アプリを閉じる'),
    ).toBe('polite')
    expect(formOf('次の通りだ。\n1. 開く\n2. 保存します')).toBe('plain')
  })

  it('reads every い-adjective as plain, 下さい as polite, past a closing parenthetical', () => {
    expect(formOf('今日は寒い。風も強い。')).toBe('plain')
    expect(formOf('ご確認下さい。')).toBe('polite')
    expect(formOf('私は学生だ（大学院）。')).toBe('plain')
    // A noun ending in い says no form.
    expect(formOf('はい。')).toBe('polite')
    expect(formOf('ご協力のお願い')).toBe('polite')
  })

  it('stays polite, as before, when nothing says a form', () => {
    expect(formOf('リリースノート')).toBe('polite')
    expect(formOf('')).toBe('polite')
    expect(formOf('Release notes')).toBe('polite')
    // As many of each: polite.
    expect(formOf('雨が降る。雨が降ります。')).toBe('polite')
  })
})
