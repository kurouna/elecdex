import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CHARS_PER_SHEET, manuscriptMetrics } from './manuscript';

const EMOJI = String.fromCodePoint(0x1f600);

describe('manuscriptMetrics — 文字数と枚数', () => {
    it('空白と改行を除いて数える', () => {
        const m = manuscriptMetrics('あい うえ\nお');
        expect(m.characters).toBe(5);
        expect(m.charactersWithSpaces).toBe(7);
    });

    it('400 字で 1 枚、端数は切り上げ', () => {
        expect(manuscriptMetrics('あ'.repeat(400)).sheets).toBe(1);
        expect(manuscriptMetrics('あ'.repeat(401)).sheets).toBe(2);
        expect(manuscriptMetrics('あ'.repeat(CHARS_PER_SHEET * 3)).sheets).toBe(3);
    });

    it('段落は空行で区切る', () => {
        const text = '一段落目。\n続き。\n\n二段落目。\n\n\n三段落目。';
        expect(manuscriptMetrics(text).paragraphs).toBe(3);
    });

    it('行数は末尾の改行を数えない', () => {
        expect(manuscriptMetrics('a\nb\nc').lines).toBe(3);
        expect(manuscriptMetrics('a\nb\nc\n').lines).toBe(3);
    });

    it('空のテキストはすべて 0', () => {
        expect(manuscriptMetrics('')).toMatchObject({
            characters: 0, sheets: 0, paragraphs: 0, lines: 0, minutes: 0, words: 0,
        });
    });

    it('サロゲートペアを 1 文字として数える', () => {
        // [...text] で数えないと絵文字が 2 文字になる。
        expect(manuscriptMetrics(EMOJI).characters).toBe(1);
        expect(manuscriptMetrics(EMOJI.repeat(3)).charactersWithSpaces).toBe(3);
    });
});

describe('manuscriptMetrics — 読了時間', () => {
    it('日本語は 1 分 400 字で見積もる', () => {
        const m = manuscriptMetrics('あ'.repeat(1200));
        expect(m.basis).toBe('japanese');
        expect(m.minutes).toBe(3);
    });

    it('英語は 1 分 200 語で見積もる', () => {
        const m = manuscriptMetrics(Array.from({ length: 400 }, () => 'word').join(' '));
        expect(m.basis).toBe('english');
        expect(m.words).toBe(400);
        expect(m.minutes).toBe(2);
    });

    it('英単語が混ざった日本語は日本語として数える', () => {
        // 語数で測ると、日本語の記事が極端に短く出てしまう。
        const m = manuscriptMetrics('この記事は TypeScript と Electron の話です。'.repeat(20));
        expect(m.basis).toBe('japanese');
    });

    it('端数は切り上げ（1 文字でも 1 分と出す）', () => {
        expect(manuscriptMetrics('あ').minutes).toBe(1);
        expect(manuscriptMetrics('word').minutes).toBe(1);
    });
});

describe('manuscriptMetrics — 性質', () => {
    it('どんな文字列でも throw せず、数はすべて 0 以上', () => {
        fc.assert(fc.property(fc.string({ maxLength: 200 }), (text) => {
            const m = manuscriptMetrics(text);
            for (const value of [m.characters, m.charactersWithSpaces, m.words, m.paragraphs, m.lines, m.sheets, m.minutes]) {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(Number.isFinite(value)).toBe(true);
            }
            // 空白を除いた文字数が、空白込みを超えることはない。
            expect(m.characters).toBeLessThanOrEqual(m.charactersWithSpaces);
        }), { numRuns: 500 });
    });

    it('文章を 2 つつなげると、文字数は足し算になる', () => {
        fc.assert(fc.property(
            fc.string({ maxLength: 100 }),
            fc.string({ maxLength: 100 }),
            (a, b) => {
                const total = manuscriptMetrics(a + b).characters;
                expect(total).toBe(manuscriptMetrics(a).characters + manuscriptMetrics(b).characters);
            },
        ), { numRuns: 300 });
    });

    it('文字が増えれば枚数も減らない（単調）', () => {
        fc.assert(fc.property(fc.integer({ min: 0, max: 2000 }), (n) => {
            const fewer = manuscriptMetrics('あ'.repeat(n)).sheets;
            const more = manuscriptMetrics('あ'.repeat(n + 1)).sheets;
            expect(more).toBeGreaterThanOrEqual(fewer);
        }), { numRuns: 200 });
    });
});
