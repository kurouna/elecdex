import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { mapNumbersInText, parseNumbersInText, rewriteNumbersInText } from './numbers';
import { evaluateExpression } from './expression';
import { kanjiMagnitudeValue } from './kanji';
import { summarize } from './statistics';
import { formatCalcNumber } from './format';

/** 絵文字 (サロゲートペア)。ソースへ直接置かず組み立てる。 */
const EMOJI = String.fromCodePoint(0x1f600);

/**
 * 「テキストを合計する」までの一連 (拾う → 要約する) を 1 つの関数として見る。
 * 数値が 0 個のときは summarize が null を返すので、呼び出し側が使う形へ潰しておく。
 */
const summed = (text: string) => {
    const stats = summarize(parseNumbersInText(text));
    return stats
        ? { sum: stats.sum, count: stats.count, mean: stats.mean }
        : { sum: 0, count: 0, mean: 0 };
};

describe('parseNumbersInText + summarize — 範囲内の数値の合計', () => {
    it('行に散った数値を足す', () => {
        expect(summed('1\n2\n3')).toEqual({ sum: 6, count: 3, mean: 2 });
        expect(summed('a 10 b 2.5 c')).toEqual({ sum: 12.5, count: 2, mean: 6.25 });
    });

    it('3 桁区切りのカンマは 1 つの数として読む', () => {
        expect(summed('1,234\n2,000')).toMatchObject({ sum: 3234, count: 2 });
    });

    it('日付のハイフンを負号と読まない', () => {
        // "2026-09-06" を 2026 / -9 / -6 と読むと、表の合計が静かに減る。
        expect(summed('2026-09-06')).toMatchObject({ sum: 2026 + 9 + 6, count: 3 });
    });

    it('先頭の負号は符号として読む', () => {
        expect(summed('-5\n10')).toMatchObject({ sum: 5, count: 2 });
        expect(summed('(-5) 10')).toMatchObject({ sum: 5, count: 2 });
    });

    it('全角数字も対象', () => {
        expect(summed('１０\n２０')).toMatchObject({ sum: 30, count: 2 });
    });

    it('数値が無ければ count 0（呼び出し側が「数値なし」と伝えられる）', () => {
        expect(summed('hello')).toEqual({ sum: 0, count: 0, mean: 0 });
        expect(summed('')).toEqual({ sum: 0, count: 0, mean: 0 });
    });

    it('指数表記', () => {
        expect(summed('1e3 1e3')).toMatchObject({ sum: 2000, count: 2 });
    });

    it('任意の文字列で throw せず、count は 0 以上・mean は sum/count', () => {
        fc.assert(fc.property(fc.string({ maxLength: 120 }), (text) => {
            const r = summed(text);
            expect(r.count).toBeGreaterThanOrEqual(0);
            expect(Number.isFinite(r.sum)).toBe(true);
            if (r.count === 0) expect(r.mean).toBe(0);
            else expect(r.mean).toBeCloseTo(r.sum / r.count, 9);
        }), { numRuns: 500 });
    });

    it('数値の並び順を変えても合計は変わらない', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: -9999, max: 9999 }), { minLength: 1, maxLength: 20 }),
            (xs) => {
                const forward = summed(xs.join('\n'));
                const backward = summed([...xs].reverse().join('\n'));
                expect(forward.count).toBe(xs.length);
                expect(forward.sum).toBeCloseTo(backward.sum, 9);
            },
        ), { numRuns: 200 });
    });
});

describe('parseNumbersInText + summarize — 小数・負数・数値でない文字', () => {
    it('小数を足す', () => {
        expect(summed('1.5\n2.25')).toMatchObject({ sum: 3.75, count: 2 });
        expect(summed('0.1 0.2')).toMatchObject({ count: 2 });
        // 合計の見せ方は formatCalcNumber が引き受ける (0.30000000000000004 を出さない)。
        expect(formatCalcNumber(summed('0.1 0.2').sum)).toBe('0.3');
    });

    it('負数を足す', () => {
        expect(summed('-5\n-2.5\n10')).toMatchObject({ sum: 2.5, count: 3 });
        expect(summed('-1,234\n1,234')).toMatchObject({ sum: 0, count: 2 });
    });

    it('合計が負のときも平均は sum/count', () => {
        const r = summed('-10\n-20');
        expect(r).toMatchObject({ sum: -30, count: 2, mean: -15 });
    });

    it('長音・ダッシュを負号と読まない', () => {
        // 正規化で 'ー' を '-' に寄せていた頃の回帰。日本語の表がそのまま壊れる。
        expect(summed('コーヒー100\n紅茶200')).toMatchObject({ sum: 300, count: 2 });
        expect(summed('――100')).toMatchObject({ sum: 100, count: 1 });
        expect(summed('メール―50')).toMatchObject({ sum: 50, count: 1 });
    });

    it('全角の負号は符号として読む', () => {
        expect(summed('－５\n１０')).toMatchObject({ sum: 5, count: 2 });
    });

    it('絵文字が混ざっても数値だけを拾う', () => {
        expect(summed(EMOJI + '100' + EMOJI + '200')).toMatchObject({ sum: 300, count: 2 });
        expect(summed(EMOJI.repeat(20))).toEqual({ sum: 0, count: 0, mean: 0 });
    });

    it('数値でない文字だけなら count 0', () => {
        expect(summed('あいうえお')).toEqual({ sum: 0, count: 0, mean: 0 });
        expect(summed('--- === +++')).toEqual({ sum: 0, count: 0, mean: 0 });
    });

    it('整数部のない小数も拾う', () => {
        // 数字全体に「英数字の直後は除く」を掛けていた頃は、".5" が丸ごと落ちて 0 になっていた。
        expect(summed('.5' + String.fromCharCode(10) + '.25')).toMatchObject({ sum: 0.75, count: 2 });
        expect(summed('-.5')).toMatchObject({ sum: -0.5, count: 1 });
    });

    it('識別子の中の数字は数えない', () => {
        expect(summed('utf8')).toEqual({ sum: 0, count: 0, mean: 0 });
        expect(summed('item2 100')).toMatchObject({ sum: 100, count: 1 });
        expect(summed('x1 x2 x3')).toEqual({ sum: 0, count: 0, mean: 0 });
    });

    it('日付や時刻の並びで負号を付けない', () => {
        expect(summed('2026-09-06 10:30')).toMatchObject({ sum: 2026 + 9 + 6 + 10 + 30, count: 5 });
    });
});

/** 改行。ソースへ直接書くと行が割れて読みにくいので組み立てる。 */
const LF = String.fromCharCode(10);

/**
 * 書き換え系コマンド (calc-round-region / calc-tax-included-region / calc-scale-region …) は、
 * ここが返したテキストで選択範囲をまるごと置き換える。**数値以外は 1 文字も変えてはいけない。**
 *
 * 走査の前には全角を半角へ寄せる正規化を通すが、それは「読むため」であって「書き戻すため」
 * ではない。正規化した文字列をそのまま返すと、選択範囲の読点・全角スペース・全角括弧が
 * まとめて半角へ化け、undo を押すまで気づけない形で日本語の文書が壊れる。
 */
describe('parseNumbersInText — 算用数字に後置された位 (3百万)', () => {
    it('位を掛けた 1 つの数として読む', () => {
        expect(parseNumbersInText('3百万')).toEqual([3000000]);
        expect(parseNumbersInText('5千')).toEqual([5000]);
        expect(parseNumbersInText('1万')).toEqual([10000]);
        expect(parseNumbersInText('2.5億')).toEqual([250000000]);
        expect(parseNumbersInText('3兆')).toEqual([3e12]);
    });

    it('桁区切りや全角と一緒でも読む', () => {
        expect(parseNumbersInText('1,500万')).toEqual([15000000]);
        expect(parseNumbersInText('３百万')).toEqual([3000000]);
    });

    it('金額の並んだ文を合計できる', () => {
        expect(summed('売上 3百万円、経費 5千円、雑費 200円'))
            .toEqual({ sum: 3005200, count: 3, mean: 3005200 / 3 });
    });

    it('数字が前に無い位は数値にしない', () => {
        // ここを緩めると、地の文の「千葉」「百貨店」が 1000 や 100 として合計に入る。
        expect(parseNumbersInText('千葉県の百貨店')).toEqual([]);
        expect(parseNumbersInText('千葉県に 3 店')).toEqual([3]);
    });

    it('位でない漢字は数値の一部にしない', () => {
        expect(parseNumbersInText('300円')).toEqual([300]);
        expect(parseNumbersInText('3人目')).toEqual([3]);
    });

    it('位は数字と地続きでなければ読まない', () => {
        expect(parseNumbersInText('3 百万')).toEqual([3]);
        expect(parseNumbersInText('合計 3 百万円')).toEqual([3]);
    });

    it('符号・小数・全角と組み合わせても 1 つの数として読む', () => {
        expect(parseNumbersInText('-3百万')).toEqual([-3000000]);
        expect(parseNumbersInText('0.5万')).toEqual([5000]);
        expect(parseNumbersInText('.5万')).toEqual([5000]);
        expect(parseNumbersInText('１，５００万')).toEqual([15000000]);
    });

    it('識別子の中の数字には位を付けさせない', () => {
        // "abc3百万" の 3 は識別子の一部。ここが緩むと変数名の混じったコードを
        // 選択したときに、数でないものが合計へ入る。
        expect(parseNumbersInText('abc3百万')).toEqual([]);
        expect(parseNumbersInText('utf8万')).toEqual([]);
        // ただし識別子の中の小数点以降は前からある規則どおり数として拾う
        // (ここを塞ぐと ".5" が書けなくなる)。位が付いてもその規則は変えない。
        expect(parseNumbersInText('v1.2万')).toEqual([2000]);
    });

    it('桁区切りが崩れている数は、位だけを道連れにしない', () => {
        // "1,50万" は 3 桁区切りとして読めない。区切りの手前で切って、
        // 残りの "50万" をひとつの数として読む (どちらも落とすほうが危ない)。
        expect(parseNumbersInText('1,50万')).toEqual([1, 500000]);
    });

    it('位を掛けて double を超えた数は落とす', () => {
        // 1 つ混ざるだけで合計も平均も Infinity になり、他の数値が全部無意味になる。
        expect(parseNumbersInText('9e307百万')).toEqual([]);
        expect(parseNumbersInText('9e307百万 と 5')).toEqual([5]);
    });

    it('拾う側と読む側で同じ数になる', () => {
        // numbers.ts の走査と expression.ts の字句解析は別々に位を読む。
        // ずれると「ミニバッファでは計算できるのに合計だと違う」になる。
        const MAGNITUDES = ['十', '百', '千', '万', '億', '兆', '百万', '千万', '十万', '百億'];
        fc.assert(fc.property(
            fc.integer({ min: 0, max: 999999 }),
            fc.constantFrom(...MAGNITUDES),
            (n, magnitude) => {
                const text = `${n}${magnitude}`;
                const evaluated = evaluateExpression(text);
                expect(evaluated.ok).toBe(true);
                expect(parseNumbersInText(text)).toEqual([evaluated.ok ? evaluated.value : NaN]);
            },
        ));
    });

    it('位でない文字を渡された倍率は NaN になり、呼び出し側で落ちる', () => {
        // kanjiMagnitudeValue の前提は「matchKanjiMagnitude が返した並びであること」。
        // 前提を破った値がどこかへ流れても、有限チェックのある両方の入口で止まる。
        expect(kanjiMagnitudeValue('円')).toBeNaN();
        expect(parseNumbersInText('3円')).toEqual([3]);
    });

    it('書き換えでも同じ範囲を 1 つの数として扱う', () => {
        // 拾う側と書き換える側で規則がずれると、合計には入るのに書き換わらない数が出る。
        const r = mapNumbersInText('3百万円', (v) => v * 2);
        expect(r.text).toBe('6000000円');
        expect(r.total).toBe(1);
    });

    it('値が変わらない写像でも、位は算用数字へ展開される', () => {
        // 書き換え系コマンドを通した時点で "3百万" は "3000000" になる。表記を
        // 保てないのは、位を残す書き方 (3百万 → 6百万) を持っていないため。
        // 意外な副作用なので、黙って変わらないよう形として固定しておく。
        const r = mapNumbersInText('3百万', (v) => v);
        expect(r).toEqual({ text: '3000000', total: 1, changed: 1, skipped: 0 });
    });

    it('書き換えても位の前後の地の文は原文のまま', () => {
        // 走査は正規化した文字列、切り貼りは元のテキスト。ここが入れ替わると
        // 全角の読点や括弧まで半角に化ける。
        const r = mapNumbersInText('（予算）３百万円、残り 5千円', (v) => v + 1);
        expect(r.text).toBe('（予算）3000001円、残り 5001円');
    });
});

describe('mapNumbersInText / rewriteNumbersInText — 数値以外は原文のまま', () => {
    it('全角の読点・空白・括弧を半角へ寄せない', () => {
        const text = '単価　1000、数量　2' + LF + '合計（税別）　2000';
        const result = mapNumbersInText(text, (v) => v * 2);
        expect(result.text).toBe('単価　2000、数量　4' + LF + '合計（税別）　4000');
        expect(result.changed).toBe(3);
    });

    it('掛け算・割り算の記号や中黒を演算子へ寄せない', () => {
        const text = '縦 3 × 横 4' + LF + '面積 12 ÷ 2';
        expect(mapNumbersInText(text, (v) => v).text).toBe(text);
    });

    it('全角で書かれた数値は読めて、置き換わるのはその数値だけ', () => {
        const text = '個数　１０、価格　２００';
        const result = mapNumbersInText(text, (v) => v + 1);
        expect(result.text).toBe('個数　11、価格　201');
        expect(result.changed).toBe(2);
    });

    it('1 つも書き換えないときは原文とまったく同じ文字列', () => {
        const text = 'メモ：単価　1,000 円、税込　1、100 円（概算）';
        expect(rewriteNumbersInText(text, () => null).text).toBe(text);
    });

    it('どんな文字列でも、書き換えなければ原文と一致する', () => {
        // 正規化の対象になる文字を必ず混ぜる。素の fc.string では全角がまず出ず、
        // 「地の文が半角へ化ける」壊れ方をすり抜けてしまう。
        const chars = fc.constantFrom(
            ...'0123456789. -abc'.split(''),
            ...'０９．－、　（）×÷・−'.split(''),
            'あ', LF,
        );
        fc.assert(fc.property(fc.array(chars, { maxLength: 60 }), (parts) => {
            const text = parts.join('');
            expect(rewriteNumbersInText(text, () => null).text).toBe(text);
            expect(mapNumbersInText(text, () => null).text).toBe(text);
        }), { numRuns: 1000 });
    });
});
