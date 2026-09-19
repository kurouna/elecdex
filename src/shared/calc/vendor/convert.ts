/**
 * 選択範囲の整数を別の基数へ書き換える (calc-hex-region など)。
 *
 * 集計 (statistics.ts) が「読むだけ」なのに対し、こちらは**本文を書き換える**。
 * 誤爆が文書を壊すので、判定はここに閉じ込め、迷うものは touch せず skipped として数える。
 */

import { normalizeCalcInput } from './normalize';

/** 対応する基数。10 進 (接頭辞なし) と、プログラマがよく使う 3 つ。 */
export type NumberBase = 2 | 8 | 10 | 16;

/** 基数ごとの接頭辞。10 進だけ接頭辞を持たない。 */
const PREFIX: Record<NumberBase, string> = { 2: '0b', 8: '0o', 10: '', 16: '0x' };

/** エコー行に出す基数の名前。 */
export const BASE_LABEL: Record<NumberBase, string> = {
    2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hexadecimal',
};

/**
 * 書き換えの対象になる整数。
 *
 * 既に 0x / 0b / 0o が付いているものも読むので、16 進 → 2 進のような変換も 1 回で通る。
 *
 * 対象から外しているもの、いずれも「変換すると情報が落ちるか、誤爆で文書が壊れる」もの:
 * - **小数** (`1.5`)。基数を変えると読めない値になる。
 * - **識別子の中の数字** (`utf8`, `item2`)。
 * - **3 桁区切りの一部** (`1,234` の `234`)。
 * - **指数表記** (`1e3`)。整数に見えて桁が跳ぶ。
 * - **後置の位が付いた数** (`3百万`)。先頭の数字だけ変換すると `0x3百万` になる。
 *
 * 符号のマイナスは、直前が英数字・閉じ括弧・小数点でないときだけ符号として扱う
 * (numbers.ts と同じ規則。"2026-09-06" を 2026 と -9 と -6 に割らないため)。
 */
const CONVERTIBLE =
    /(?<![0-9A-Za-z_.])(?<!\d,)(?:(?<![0-9A-Za-z_.)])-)?(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+)(?![0-9A-Za-z_.])(?!,\d)(?![十百千万億兆])/g;

export interface ConvertResult {
    /** 書き換えたあとのテキスト。1 つも変換していなければ元のまま。 */
    text: string;
    /** 書き換えた個数。 */
    converted: number;
    /** 見つけたが書き換えなかった個数 (安全に表せない大きさのもの)。 */
    skipped: number;
}

/** 1 つの整数を、接頭辞つきの表記にする。負数は符号を前に出す (-0xFF)。 */
export function formatInBase(value: number, base: NumberBase): string {
    const sign = value < 0 ? '-' : '';
    const digits = Math.abs(value).toString(base);
    // 16 進は大文字にそろえる。0x1F のほうが 0x1f より桁を数えやすく、
    // describeCalcValue の併記 (0xFF) とも表記がそろう。
    return sign + PREFIX[base] + (base === 16 ? digits.toUpperCase() : digits);
}

/**
 * テキスト中の整数を指定した基数の表記へ書き換える。
 *
 * double で正確に表せない大きさ (2^53 超) は書き換えずに残し、skipped として数える。
 * 黙って丸めた値を本文へ書き戻すと、元の数がどこにも残らない。
 */
export function convertNumbersInText(text: string, base: NumberBase): ConvertResult {
    if (!text) return { text, converted: 0, skipped: 0 };

    let converted = 0;
    let skipped = 0;
    // 全角で書かれた数字も拾えるよう、走査の前に正規化する。**ただし書き戻すのは元のテキスト。**
    // 正規化した文字列をそのまま返すと、数値と関係のない読点・全角スペース・全角括弧まで
    // 半角へ化けて、地の文が黙って書き換わる。添字をそのまま使えるのは、正規化が長さを
    // 変えない (1 文字 → 1 文字) ため (normalize.test.ts が BMP 全数で見張っている)。
    const source = normalizeCalcInput(text);
    let out = '';
    let copied = 0;

    for (const m of source.matchAll(CONVERTIBLE)) {
        const start = m.index!;
        const end = start + m[0].length;
        out += text.slice(copied, start);
        copied = end;

        const original = text.slice(start, end);
        const value = Number(m[0]);
        if (!Number.isSafeInteger(value)) { skipped++; out += original; continue; }
        const next = formatInBase(value, base);
        // 既にその基数で書かれていたものは数えない (「5 個変換した」が実態と合わなくなる)。
        if (next === m[0]) { out += original; continue; }
        converted++;
        out += next;
    }

    return { text: out + text.slice(copied), converted, skipped };
}
