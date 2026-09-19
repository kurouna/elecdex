import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { BASE_LABEL, convertNumbersInText, formatInBase, type NumberBase } from './convert';
import { evaluateExpression } from './expression';

/** 絵文字 (サロゲートペア)。ソースへ直接置かず組み立てる。 */
const EMOJI = String.fromCodePoint(0x1f600);

const to = (text: string, base: NumberBase) => convertNumbersInText(text, base);

describe('formatInBase — 1 つの整数の表記', () => {
    it('接頭辞は基数ごと、16 進は大文字', () => {
        expect(formatInBase(255, 16)).toBe('0xFF');
        expect(formatInBase(255, 2)).toBe('0b11111111');
        expect(formatInBase(255, 8)).toBe('0o377');
        expect(formatInBase(255, 10)).toBe('255');
    });

    it('負数は符号を前に出す', () => {
        expect(formatInBase(-255, 16)).toBe('-0xFF');
        expect(formatInBase(-10, 2)).toBe('-0b1010');
        expect(formatInBase(-7, 10)).toBe('-7');
    });

    it('0 はどの基数でも 0', () => {
        expect(formatInBase(0, 16)).toBe('0x0');
        expect(formatInBase(0, 10)).toBe('0');
    });
});

describe('convertNumbersInText — 基本', () => {
    it('10 進から他の基数へ', () => {
        expect(to('255', 16).text).toBe('0xFF');
        expect(to('255', 2).text).toBe('0b11111111');
        expect(to('255', 8).text).toBe('0o377');
    });

    it('接頭辞つきの表記も読み直す（16 進 → 2 進が 1 回で通る）', () => {
        expect(to('0xff', 2).text).toBe('0b11111111');
        expect(to('0b1010', 16).text).toBe('0xA');
        expect(to('0o17', 10).text).toBe('15');
        expect(to('0xFF 0b11 0o7', 10).text).toBe('255 3 7');
    });

    it('行に散った数値をすべて書き換え、周りの文字は残す', () => {
        const result = to('mask = 255, shift = 8;', 16);
        expect(result.text).toBe('mask = 0xFF, shift = 0x8;');
        expect(result.converted).toBe(2);
    });

    it('複数行をまとめて書き換える', () => {
        const src = ['10', '20', '30'].join('\n');
        expect(to(src, 16).text).toBe(['0xA', '0x14', '0x1E'].join('\n'));
    });

    it('負数の符号を保つ', () => {
        expect(to('-255', 16).text).toBe('-0xFF');
        expect(to('(-16)', 2).text).toBe('(-0b10000)');
    });

    it('既にその基数で書かれているものは数に入れない', () => {
        const result = to('0xFF and 16', 16);
        expect(result.text).toBe('0xFF and 0x10');
        expect(result.converted).toBe(1);
    });

    it('何も変換しなければ元の文字列がそのまま返る', () => {
        const result = to('hello world', 16);
        expect(result).toEqual({ text: 'hello world', converted: 0, skipped: 0 });
    });
});

describe('convertNumbersInText — 触らないもの', () => {
    it('小数は書き換えない（基数を変えると読めない値になる）', () => {
        expect(to('1.5 and 2.25', 16)).toEqual({ text: '1.5 and 2.25', converted: 0, skipped: 0 });
        expect(to('価格 10.5 円', 16).converted).toBe(0);
    });

    it('識別子の中の数字は書き換えない', () => {
        expect(to('utf8 item2 x1', 16).converted).toBe(0);
        expect(to('const utf8 = 16;', 16).text).toBe('const utf8 = 0x10;');
    });

    it('3 桁区切りの数は書き換えない（区切りごと壊さない）', () => {
        expect(to('1,234', 16)).toEqual({ text: '1,234', converted: 0, skipped: 0 });
    });

    it('指数表記は書き換えない', () => {
        expect(to('1e3', 16).converted).toBe(0);
    });

    it('位が後ろに付いた数は書き換えない', () => {
        // 先頭の数字だけ変換すると "0x3百万" になり、元の数がどこにも残らない。
        expect(to('3百万', 16)).toEqual({ text: '3百万', converted: 0, skipped: 0 });
        expect(to('5千円', 16).converted).toBe(0);
        expect(to('3百万 と 12', 16).text).toBe('3百万 と 0xC');
        // 位が続けて出てくる形も、どちらの数も触らない。
        expect(to('1万2千', 16).converted).toBe(0);
        // 位が数の前にあるだけなら、その数は普通の整数として書き換える。
        expect(to('百 3', 16).text).toBe('百 0x3');
        // 空白で切れていれば位ではないので、数だけが書き換わる。
        expect(to('3 百万', 16).text).toBe('0x3 百万');
    });

    it('2^53 を超える整数は書き換えず skipped として数える', () => {
        // 黙って丸めた値を本文へ書き戻すと、元の数がどこにも残らない。
        const result = to('9007199254740993', 16);
        expect(result).toMatchObject({ text: '9007199254740993', converted: 0, skipped: 1 });
    });

    it('日本語や絵文字が混ざっていても数値だけを書き換える', () => {
        expect(to('個数 16 個' + EMOJI, 16).text).toBe('個数 0x10 個' + EMOJI);
    });

    it('全角数字は半角の表記へ書き換える', () => {
        expect(to('１６', 16).text).toBe('0x10');
    });

    /**
     * 基数変換も選択範囲をまるごと置き換える。走査の前に全角を半角へ寄せるのは「読むため」で、
     * 書き戻すのは元の地の文でなければならない。正規化した文字列をそのまま返すと、
     * 読点・全角スペース・全角括弧までが半角へ化ける。
     */
    it('数値以外の全角文字を半角へ寄せない', () => {
        const text = '個数　16、予備　32' + String.fromCharCode(10) + '合計（内訳）　48';
        expect(to(text, 16).text).toBe('個数　0x10、予備　0x20' + String.fromCharCode(10) + '合計（内訳）　0x30');
    });

    it('1 つも変換しないときは原文とまったく同じ文字列', () => {
        // 変換できる整数が無い行。地の文だけが残る。
        const text = 'メモ：単価（税込）　1.5 倍、原価　2.25 倍';
        expect(to(text, 16)).toMatchObject({ text, converted: 0 });
    });
});

describe('convertNumbersInText — 性質', () => {
    const bases: NumberBase[] = [2, 8, 10, 16];

    it('どの基数へ変換しても、読み直せば同じ値', () => {
        fc.assert(fc.property(
            fc.integer({ min: -1000000, max: 1000000 }),
            fc.constantFrom(...bases),
            (n, base) => {
                const written = formatInBase(n, base);
                expect(evaluateExpression(written)).toEqual({ ok: true, value: n });
            },
        ), { numRuns: 500 });
    });

    it('10 進へ戻すと元の 10 進表記に一致する', () => {
        fc.assert(fc.property(
            fc.integer({ min: 0, max: 1000000 }),
            fc.constantFrom(...bases),
            (n, base) => {
                const once = convertNumbersInText(String(n), base).text;
                expect(convertNumbersInText(once, 10).text).toBe(String(n));
            },
        ), { numRuns: 500 });
    });

    it('同じ基数へ 2 回かけても結果は変わらない（べき等）', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: -99999, max: 99999 }), { minLength: 1, maxLength: 10 }),
            fc.constantFrom(...bases),
            (xs, base) => {
                const once = convertNumbersInText(xs.join(' '), base).text;
                const twice = convertNumbersInText(once, base);
                expect(twice.text).toBe(once);
                expect(twice.converted).toBe(0);
            },
        ), { numRuns: 300 });
    });

    it('数字を含まない文字列は 1 文字も変わらない', () => {
        fc.assert(fc.property(
            fc.string({ maxLength: 80 }).filter((t) => !/[0-9０-９]/.test(t)),
            fc.constantFrom(...bases),
            (text, base) => {
                const result = convertNumbersInText(text, base);
                expect(result.converted).toBe(0);
                expect(result.text).toBe(text);
            },
        ), { numRuns: 300 });
    });

    it('空白区切りの整数列は、個数も並び順も保たれる', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: -99999, max: 99999 }), { minLength: 1, maxLength: 12 }),
            fc.constantFrom(...bases),
            (xs, base) => {
                const result = convertNumbersInText(xs.join(' '), base);
                const tokens = result.text.split(' ');
                expect(tokens).toHaveLength(xs.length);
                // 並びの各要素が、元の値をその基数で書いたものになっている。
                tokens.forEach((token, i) => expect(token).toBe(formatInBase(xs[i], base)));
            },
        ), { numRuns: 300 });
    });

    it('任意の文字列で throw しない', () => {
        fc.assert(fc.property(
            fc.string({ maxLength: 120 }),
            fc.constantFrom(...bases),
            (text, base) => {
                expect(() => convertNumbersInText(text, base)).not.toThrow();
            },
        ), { numRuns: 300 });
    });
});

describe('BASE_LABEL — エコー用の名前', () => {
    it('4 つとも名前を持つ', () => {
        expect(BASE_LABEL).toEqual({ 2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hexadecimal' });
    });
});
