import { describe, it, expect } from 'vitest';
import { describeCalcValue, formatCalcNumber, formatGrouped, pluralize } from './format';
import { evaluateExpression } from './expression';

/** 成功を前提に値だけ取り出す。 */
const value = (src: string) => {
    const r = evaluateExpression(src);
    return r.ok ? r.value : NaN;
};

describe('formatCalcNumber — 浮動小数のノイズを見せない', () => {
    it('0.1+0.2 は 0.3', () => {
        expect(formatCalcNumber(0.1 + 0.2)).toBe('0.3');
        expect(formatCalcNumber(value('0.1+0.2') as number)).toBe('0.3');
    });

    it('整数と負のゼロ', () => {
        expect(formatCalcNumber(42)).toBe('42');
        expect(formatCalcNumber(-0)).toBe('0');
        expect(formatCalcNumber(-1.5)).toBe('-1.5');
    });

    it('有限でない値も文字列にはできる', () => {
        expect(formatCalcNumber(Infinity)).toBe('Infinity');
        expect(formatCalcNumber(NaN)).toBe('NaN');
    });
});

describe('formatGrouped — 3 桁区切り', () => {
    it('整数部だけを区切る', () => {
        expect(formatGrouped(1234567)).toBe('1,234,567');
        expect(formatGrouped(-1234.5)).toBe('-1,234.5');
        expect(formatGrouped(999)).toBe('999');
        expect(formatGrouped(0)).toBe('0');
        expect(formatGrouped(-0)).toBe('0');
    });

    it('指数表記は区切らない', () => {
        expect(formatGrouped(1e21)).toBe('1e+21');
    });
});

describe('describeCalcValue — 進数の併記', () => {
    it('10 以上の整数には 16 進と 2 進を添える', () => {
        expect(describeCalcValue(255)).toBe('255 (0xFF, 0b11111111)');
        expect(describeCalcValue(-255)).toBe('-255 (-0xFF, -0b11111111)');
    });

    it('1 桁の数と小数には添えない', () => {
        expect(describeCalcValue(7)).toBe('7');
        expect(describeCalcValue(3.5)).toBe('3.5');
        expect(describeCalcValue(0)).toBe('0');
    });

    it('大きすぎる数は 2 進を省き、さらに大きければ 10 進だけ', () => {
        expect(describeCalcValue(2 ** 33)).toBe('8589934592 (0x200000000)');
        expect(describeCalcValue(1e300)).toBe('1e+300');
    });
});

describe('pluralize — 数と単位', () => {
    it('1 のときだけ単数形', () => {
        expect(pluralize(1, 'number')).toBe('1 number');
        expect(pluralize(2, 'number')).toBe('2 numbers');
        expect(pluralize(0, 'number')).toBe('0 numbers');
    });

    it('件数にも 3 桁区切りが掛かる', () => {
        expect(pluralize(1200, 'number')).toBe('1,200 numbers');
    });

    it('単位はそのまま使える', () => {
        expect(pluralize(1, 'period')).toBe('1 period');
        expect(pluralize(420, 'month')).toBe('420 months');
        expect(pluralize(1, 'sheet')).toBe('1 sheet');
    });
});
