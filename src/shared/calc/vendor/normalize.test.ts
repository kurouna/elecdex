import { describe, it, expect } from 'vitest';
import { normalizeCalcInput } from './normalize';
import { evaluateExpression } from './expression';

/** 正規化が効いているかは「式として通るか」で見るのが一番早い。 */
const value = (src: string) => {
    const r = evaluateExpression(src);
    return r.ok ? r.value : `ERROR: ${r.error}`;
};
const error = (src: string) => {
    const r = evaluateExpression(src);
    return r.ok ? `UNEXPECTED OK: ${r.value}` : r.error;
};

describe('normalizeCalcInput — 全角と別字の吸収', () => {
    it('全角英数記号を半角へ寄せる', () => {
        expect(normalizeCalcInput('１＋２')).toBe('1+2');
        expect(normalizeCalcInput('（３＊４）')).toBe('(3*4)');
        expect(value('１＋２')).toBe(3);
    });

    it('算術記号の別字', () => {
        expect(value('3×4')).toBe(12);
        expect(value('12÷4')).toBe(3);
        expect(value('5−2')).toBe(3);
        expect(value('max(1、2)')).toBe(2);
        expect(value('1　+　2')).toBe(3); // 全角スペース
    });
});

describe('normalizeCalcInput — 長音とダッシュはマイナスにしない', () => {
    it('長音とダッシュはそのまま残す', () => {
        // ここを '-' に寄せると "コーヒー100円" が -100 になる (calc-sum-region の回帰)。
        expect(normalizeCalcInput('コーヒー')).toBe('コーヒー');
        expect(normalizeCalcInput('―')).toBe('―');
        expect(error('5ー3')).toBe('Unexpected character: ー');
        expect(error('5―3')).toBe('Unexpected character: ―');
    });

    it('マイナスとして受けるのは 3 種類だけ', () => {
        expect(value('5-3')).toBe(2);     // ASCII HYPHEN-MINUS
        expect(value('5－3')).toBe(2);    // FULLWIDTH HYPHEN-MINUS
        expect(value('5−3')).toBe(2);     // MINUS SIGN
    });
});

describe('normalizeCalcInput — 早道と変換表のずれ', () => {
    it('実際に変わる文字は、全角 ASCII 範囲と 6 つの別字だけ', () => {
        // 速さのための早道 (NEEDS_NORMALIZE) と下の switch は別々に書かれているので、
        // 片方だけ増やすとその文字が黙って変換されなくなる。BMP を全数走査して突き合わせる。
        const changed: number[] = [];
        for (let code = 0; code <= 0xffff; code++) {
            const ch = String.fromCharCode(code);
            if (normalizeCalcInput(ch) !== ch) changed.push(code);
        }
        const expected: number[] = [];
        for (let code = 0xff01; code <= 0xff5e; code++) expected.push(code);
        // 　(全角空白) 、(読点) ×(乗算) ÷(除算) ・(中点) −(MINUS SIGN)
        expected.push(0x3000, 0x3001, 0x00d7, 0x00f7, 0x30fb, 0x2212);
        expect(changed.sort((a, b) => a - b)).toEqual(expected.sort((a, b) => a - b));
    });

    it('変換対象を含まない文字列はそのまま返る（早道が効いている）', () => {
        const plain = 'total = 1234 + 5678 // note';
        expect(normalizeCalcInput(plain)).toBe(plain);
    });

    it('正規化はべき等（2 回かけても変わらない）', () => {
        const src = '１＋２　×　３、４';
        const once = normalizeCalcInput(src);
        expect(normalizeCalcInput(once)).toBe(once);
    });

    /**
     * **長さを変えない** = 正規化の前後で添字が一致する。
     *
     * 数値の書き換え (numbers.ts / convert.ts) は、正規化した文字列の上で数値の位置を見つけ、
     * その添字で**元のテキスト**を切り貼りして地の文を保つ。この性質が崩れると、切り出しが
     * 1 文字ずつずれて地の文が欠ける。変換表へ 1 文字 → 2 文字の組 (㍉ → ミリ のような合字の
     * 展開) を足すと壊れるので、表を触るときはここで止まる。
     */
    it('正規化は長さを変えない（添字がずれない）', () => {
        for (let code = 0; code <= 0xffff; code++) {
            const ch = String.fromCharCode(code);
            expect(normalizeCalcInput(ch).length).toBe(ch.length);
        }
        // サロゲートペア (絵文字) も 2 コードユニットのまま通る。
        const emoji = String.fromCodePoint(0x1f600);
        expect(normalizeCalcInput('１' + emoji + '、').length).toBe(2 + emoji.length);
    });
});
