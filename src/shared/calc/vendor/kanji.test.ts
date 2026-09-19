import { describe, it, expect } from 'vitest';
import { kanjiMagnitudeValue, matchKanjiMagnitude } from './index';

describe('漢数字の位', () => {
    it('単独の位', () => {
        expect(kanjiMagnitudeValue('十')).toBe(10);
        expect(kanjiMagnitudeValue('百')).toBe(100);
        expect(kanjiMagnitudeValue('千')).toBe(1000);
        expect(kanjiMagnitudeValue('万')).toBe(1e4);
        expect(kanjiMagnitudeValue('億')).toBe(1e8);
        expect(kanjiMagnitudeValue('兆')).toBe(1e12);
    });

    it('組み合わせは掛け算', () => {
        expect(kanjiMagnitudeValue('百万')).toBe(1e6);
        expect(kanjiMagnitudeValue('千万')).toBe(1e7);
        expect(kanjiMagnitudeValue('十万')).toBe(1e5);
        expect(kanjiMagnitudeValue('百億')).toBe(1e10);
        expect(kanjiMagnitudeValue('千億')).toBe(1e11);
    });

    it('受ける並びは「小さい位ひとつ + 大きい位ひとつ」まで', () => {
        expect(matchKanjiMagnitude('百万')).toBe('百万');
        expect(matchKanjiMagnitude('千')).toBe('千');
        // 「万億」「百十」は位の並びとして成り立たない。先頭の 1 文字だけを位として読む。
        expect(matchKanjiMagnitude('万億')).toBe('万');
        expect(matchKanjiMagnitude('百十')).toBe('百');
        // 三段重ねも二段までで切る ("千万億" は 1e7 までで、億は式の側でエラーになる)。
        expect(matchKanjiMagnitude('千万億')).toBe('千万');
    });

    it('位でなければ読まない', () => {
        expect(matchKanjiMagnitude('円')).toBeNull();
        expect(matchKanjiMagnitude('')).toBeNull();
        expect(matchKanjiMagnitude('葉')).toBeNull();
        expect(matchKanjiMagnitude('3')).toBeNull();
    });
});
