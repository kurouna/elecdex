import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { extractExpressionAt } from './extract';
import { evaluateExpression } from './expression';

/** 絵文字 (サロゲートペア)。ソースへ直接置かず組み立てる。 */
const EMOJI = String.fromCodePoint(0x1f600);

/** `|` の位置をポイントとして extractExpressionAt を呼ぶ（テストの読みやすさのため）。 */
function at(lineWithPoint: string) {
    const col = lineWithPoint.indexOf('|');
    const line = lineWithPoint.replace('|', '');
    return extractExpressionAt(line, col);
}

describe('extractExpressionAt — ポイント位置の式', () => {
    it('打ち終えた直後（式の右端）で拾う', () => {
        expect(at('12*4.5|')).toMatchObject({ text: '12*4.5', start: 0, end: 6, value: 54 });
    });

    it('式の中でも拾う', () => {
        expect(at('12*|4.5')).toMatchObject({ text: '12*4.5', value: 54 });
        expect(at('|12*4.5')).toMatchObject({ text: '12*4.5', value: 54 });
    });

    it('散文に埋まった式は、評価できるところまで縮めて拾う', () => {
        // 空白を含めて窓を広げてから語単位で縮める。ここが効かないと行全体を掴んで失敗する。
        expect(at('The result is 3 + 4| here')).toMatchObject({ text: '3 + 4', value: 7 });
        expect(at('合計 100 * 3| を出す')).toMatchObject({ text: '100 * 3', value: 300 });
    });

    it('位の漢字は境界にしない（3百万*2 の途中で窓を切らない）', () => {
        expect(at('3百万*2|')).toMatchObject({ text: '3百万*2', value: 6000000 });
        expect(at('見積 1万 + 5千| 円')).toMatchObject({ text: '1万 + 5千', value: 15000 });
    });

    it('数字の付かない位は式として成立しないので拾わない', () => {
        expect(at('千葉県|')).toBeNull();
    });

    it('位を境界から外しても、地の文は縮小で落ちる', () => {
        // 位の漢字を窓に入れた副作用で散文を巻き込んでも、「評価できるところまで縮める」
        // 段が受け止める。ここが効かないと 千葉県 や 百貨店 のある行で式が拾えなくなる。
        expect(at('千葉県 と 100 * 3| 個')).toMatchObject({ text: '100 * 3', value: 300 });
        expect(at('百貨店の 2+3| 番')).toMatchObject({ text: '2+3', value: 5 });
    });

    it('ポイントが位の途中にあっても式全体を拾う', () => {
        expect(at('3百|万*2')).toMatchObject({ text: '3百万*2', value: 6000000 });
        expect(at('3百万|*2')).toMatchObject({ text: '3百万*2', value: 6000000 });
    });

    it('式でない文字は境界になる', () => {
        // '=' は式の文字ではないので、右辺だけが窓に入る。
        expect(at('total = 2 + 3|')).toMatchObject({ text: '2 + 3', value: 5 });
    });

    it('切り出した範囲は行内の実際の位置を指す', () => {
        const line = 'x = 10 + 5';
        const found = extractExpressionAt(line, line.length);
        expect(found).not.toBeNull();
        expect(line.slice(found!.start, found!.end)).toBe(found!.text);
        expect(found!.value).toBe(15);
    });

    it('関数・進数・全角も拾える', () => {
        expect(at('sqrt(16)|')).toMatchObject({ value: 4 });
        expect(at('0xff + 1|')).toMatchObject({ value: 256 });
        expect(at('１＋２|')).toMatchObject({ value: 3 });
    });

    it('式が無ければ null（バッファに触らせない）', () => {
        expect(at('hello world|')).toBeNull();
        expect(at('|')).toBeNull();
        expect(extractExpressionAt('', 0)).toBeNull();
    });

    it('単独の数値も式として拾う（16 進を 10 進に直す用途がある）', () => {
        expect(at('0b1010|')).toMatchObject({ text: '0b1010', value: 10 });
    });

    it('語数が多すぎる行は諦める（総当たりの上限）', () => {
        const many = Array.from({ length: 40 }, (_, i) => String(i + 1)).join(' + ');
        expect(extractExpressionAt(many, many.length)).toBeNull();
    });

    it('どんな行 / どの位置でも throw せず、返した範囲は行の中に収まる', () => {
        fc.assert(fc.property(
            fc.string({ maxLength: 80 }),
            fc.integer({ min: -10, max: 90 }),
            (line, col) => {
                const found = extractExpressionAt(line, col);
                if (!found) return;
                expect(found.start).toBeGreaterThanOrEqual(0);
                expect(found.end).toBeLessThanOrEqual(line.length);
                expect(found.start).toBeLessThan(found.end);
                expect(line.slice(found.start, found.end)).toBe(found.text);
                expect(Number.isFinite(found.value)).toBe(true);
            },
        ), { numRuns: 500 });
    });
});

describe('extractExpressionAt — 小数・負数・数値でない文字', () => {
    it('小数を含む式', () => {
        expect(at('1.5*2|')).toMatchObject({ text: '1.5*2', value: 3 });
        expect(at('0.1+0.2|')).toMatchObject({ text: '0.1+0.2' });
    });

    it('先頭が負号の式と、答えが負になる式', () => {
        expect(at('-3+10|')).toMatchObject({ text: '-3+10', value: 7 });
        expect(at('3-10|')).toMatchObject({ text: '3-10', value: -7 });
    });

    it('絵文字は境界になり、サロゲートを割らない', () => {
        const found = at(EMOJI + '12*2|');
        expect(found).toMatchObject({ text: '12*2', value: 24 });
        // 絵文字は 2 コードユニットなので、開始位置は 2 でなければ文字を割っている。
        expect(found!.start).toBe(2);
    });

    it('式の後ろに絵文字が続いても式だけを取る', () => {
        const line = '12*2' + EMOJI;
        const found = extractExpressionAt(line, 4);
        expect(found).toMatchObject({ text: '12*2', start: 0, end: 4 });
    });

    it('日本語は境界になる', () => {
        expect(at('合計12*2|')).toMatchObject({ text: '12*2', value: 24 });
        expect(at('12*2|円')).toMatchObject({ text: '12*2', value: 24 });
    });

    it('長音のあとの数値を負数にしない', () => {
        // 'ー' を '-' に寄せていた頃は "コーヒー100" が -100 になっていた。
        expect(at('コーヒー100|')).toMatchObject({ text: '100', value: 100 });
    });

    it('数値でない語だけの行では null', () => {
        expect(at('絵文字' + EMOJI + '|')).toBeNull();
        expect(at('total =|')).toBeNull();
    });

    it('渡した変数を式の中で読める（ポイント位置でも ans が使える）', () => {
        const vars = { ans: 42 };
        expect(extractExpressionAt('total = ans*2', 13, { vars })).toMatchObject({ text: 'ans*2', value: 84 });
        // 変数を渡さなければ式として成立しないので、切り出しも失敗する。
        expect(extractExpressionAt('total = ans*2', 13)).toBeNull();
    });

    it('絵文字を含む任意の行でも throw せず、範囲が文字を割らない', () => {
        fc.assert(fc.property(
            fc.array(fc.constantFrom('1', '+', '*', ' ', 'a', EMOJI, '.', '-', 'あ'), { maxLength: 30 })
                .map((a) => a.join('')),
            fc.integer({ min: 0, max: 30 }),
            (line, col) => {
                const found = extractExpressionAt(line, col);
                if (!found) return;
                expect(line.slice(found.start, found.end)).toBe(found.text);
                // 取り出した範囲だけで再評価しても同じ答えになる (= 文字が割れていない)。
                expect(evaluateExpression(found.text)).toEqual({ ok: true, value: found.value });
            },
        ), { numRuns: 500 });
    });
});
