/**
 * ポイント位置の式を切り出す (calc-eval-region)。
 *
 * 「どこからどこまでが式か」だけを決める係。評価は expression.ts に任せ、
 * ここは範囲の候補を作って渡すだけにしてある。
 */

import { evaluateExpression, type CalcOptions } from './expression';
import { normalizeCalcInput } from './normalize';


/**
 * 式になり得る文字。ここに入っていない文字 (= : " ほとんどの日本語) は式の境界になる。
 *
 * 空白を含めているのは "3 + 4" と書く人のほうが多いから。そのぶん散文まで巻き込むので、
 * 実際の範囲は後段で「評価できるところまで」縮める。
 *
 * 位の漢字 (十百千万億兆) だけは境界にしない。"3百万*2" の途中で窓が切れると、
 * ミニバッファでは通る式がポイント位置では読めない、という食い違いになる。
 * 「千葉」のような地の文を巻き込んでも、数字が前に無い位は評価に失敗して落ちる。
 */
const EXPRESSION_CHARS = /[0-9A-Za-z_.,+\-*/%^()&|~!<>\s十百千万億兆]/;

/**
 * 式の文字かどうか。全角のまま書かれた式 ("１＋２") も拾えるよう、判定の前に
 * 評価器と同じ正規化を通す。ここを ASCII だけで見ていると、日本語入力のまま書いた式が
 * 「境界の連続」に見えて 1 文字も拾えない。
 */
const isExpressionChar = (ch: string): boolean => EXPRESSION_CHARS.test(normalizeCalcInput(ch));

/** ポイントから左右に広げる上限。行が長くても走査量を一定に抑える。 */
const WINDOW_LIMIT = 120;

/** 縮小候補として試す語の上限。O(k^2) で回すので、k を小さく抑える。 */
const MAX_WORDS = 24;

export interface ExtractedExpression {
    /** 切り出した式そのもの。 */
    text: string;
    /** 行内での開始位置 (含む)。 */
    start: number;
    /** 行内での終了位置 (含まない)。 */
    end: number;
    /** 評価結果。 */
    value: number;
}

/** 空白で区切った語と、その行内位置。 */
interface Word { start: number; end: number }

function splitWords(text: string, offset: number): Word[] {
    const words: Word[] = [];
    let i = 0;
    while (i < text.length) {
        if (/\s/.test(text[i])) { i++; continue; }
        const start = i;
        while (i < text.length && !/\s/.test(text[i])) i++;
        words.push({ start: offset + start, end: offset + i });
    }
    return words;
}

/**
 * 行 `line` のポイント位置 `col` にある式を切り出して評価する。見つからなければ null。
 *
 * 手順は 2 段。まず式になり得る文字だけを左右に広げて窓を作り、次にその窓を空白区切りの
 * 語に割って、**ポイントを含む最長の並びから順に評価してみる**。最初に評価できたものを
 * 採用する。"The result is 3 + 4 here" のような行でも "3 + 4" だけが残るのはこの縮小のため。
 *
 * 「評価できたものだけを返す」ので、失敗しても呼び出し側はバッファに触らない。式の判定を
 * 正規表現で当てにいくより、実際に評価してみるほうが確実で、規則も 1 か所に閉じる。
 *
 * options はそのまま評価器へ渡す。ans のような変数をここへ渡さないと、選択したときは
 * 読めるのにポイント位置では読めない、という食い違いが残る。
 */
export function extractExpressionAt(
    line: string,
    col: number,
    options?: CalcOptions,
): ExtractedExpression | null {
    if (!line) return null;
    const point = Math.max(0, Math.min(col, line.length));

    // 窓を広げる。ポイントが行末 ("3+4|" と打った直後) でも左側だけで成立する。
    let start = point;
    while (start > 0 && point - start < WINDOW_LIMIT && isExpressionChar(line[start - 1])) start--;
    let end = point;
    while (end < line.length && end - point < WINDOW_LIMIT && isExpressionChar(line[end])) end++;
    if (start === end) return null;

    const words = splitWords(line.slice(start, end), start);
    if (words.length === 0 || words.length > MAX_WORDS) return null;

    // ポイントを含む (または隣接する) 語の位置。ポイントが空白の上なら、その左右どちらの
    // 語から始めても良いので、範囲に含まれる条件だけを課す。
    const pivot = words.findIndex(w => point <= w.end);
    const anchor = pivot === -1 ? words.length - 1 : pivot;

    // 語数の多い候補から試す。同じ語数なら左に広いものを先に見る。
    for (let count = words.length; count >= 1; count--) {
        for (let i = 0; i + count <= words.length; i++) {
            const j = i + count - 1;
            if (i > anchor || j < anchor) continue;
            const from = words[i].start;
            const to = words[j].end;
            const text = line.slice(from, to);
            const result = evaluateExpression(text, options);
            if (!result.ok) continue;
            return { text, start: from, end: to, value: result.value };
        }
    }
    return null;
}
