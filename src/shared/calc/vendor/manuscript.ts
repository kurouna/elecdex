/**
 * 原稿の分量を測る (calc-manuscript-region)。
 *
 * `count-words-region` が「単語・文字・行」を数えるのに対し、こちらは書き手が
 * 締切と目次を決めるための数 — 原稿用紙の枚数と、読むのにかかる時間。
 *
 * 数値ではなくテキストそのものを見る唯一の calc モジュール。
 */

/** 400 字詰め原稿用紙。日本の出版・大学のレポートで既定の単位。 */
export const CHARS_PER_SHEET = 400;

/** 読む速さ。日本語は 1 分あたりの文字数、英語は 1 分あたりの語数。 */
export const JAPANESE_CHARS_PER_MINUTE = 400;
export const ENGLISH_WORDS_PER_MINUTE = 200;

export interface ManuscriptMetrics {
    /** 空白と改行を除いた文字数 (原稿用紙の枚数はこれで数える)。 */
    characters: number;
    /** 空白を含む文字数。 */
    charactersWithSpaces: number;
    /** 空白区切りの語数。日本語には意味が薄いので、英文の目安として持つ。 */
    words: number;
    /** 空行で区切った段落の数。 */
    paragraphs: number;
    /** 行数 (末尾の改行は数えない)。 */
    lines: number;
    /** 400 字詰め原稿用紙の枚数 (切り上げ)。 */
    sheets: number;
    /** 読了時間 (分、切り上げ)。 */
    minutes: number;
    /** 読了時間をどちらの速さで見積もったか。 */
    basis: 'japanese' | 'english';
}

/** 日本語とみなす文字 (漢字・ひらがな・カタカナ・全角記号)。 */
const CJK = /[　-ヿ㐀-䶿一-鿿豈-﫿＀-｠]/;

/**
 * 原稿の分量を測る。
 *
 * 日本語か英語かは、空白を除いた文字のうち CJK が 3 割を超えるかで決める。
 * 混在原稿は日本語として数えるほうが実態に近い (英単語が混ざった日本語の記事は
 * 語数で測ると極端に短く出る)。
 */
export function manuscriptMetrics(text: string): ManuscriptMetrics {
    const charactersWithSpaces = [...text].length;
    const bare = [...text].filter((ch) => !/\s/.test(ch));
    const characters = bare.length;
    const cjk = bare.filter((ch) => CJK.test(ch)).length;
    const basis: 'japanese' | 'english' = characters > 0 && cjk / characters > 0.3 ? 'japanese' : 'english';

    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    const lines = text.length === 0 ? 0 : text.replace(/\n$/, '').split('\n').length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

    const minutes = characters === 0
        ? 0
        : Math.ceil(basis === 'japanese'
            ? characters / JAPANESE_CHARS_PER_MINUTE
            : words / ENGLISH_WORDS_PER_MINUTE);

    return {
        characters,
        charactersWithSpaces,
        words,
        paragraphs,
        lines,
        sheets: Math.ceil(characters / CHARS_PER_SHEET),
        minutes,
        basis,
    };
}
