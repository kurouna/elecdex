/**
 * テキストから数値を拾う (calc-sum-region などの集計コマンドの入口)。
 *
 * 「どれが数値か」だけを決める係。拾った数列をどう料理するかは statistics.ts に渡す。
 */

import { formatCalcNumber } from './format';
import { normalizeCalcInput } from './normalize';
import { KANJI_MAGNITUDE_SOURCE, kanjiMagnitudeValue } from './kanji';


/**
 * 数値の並び。3 桁区切りのカンマ (1,234) は 1 つの数として読み、".5" のような
 * 整数部のない小数も拾う。
 *
 * 先読み条件が 2 段になっているのは、外したいものが 2 つあるため。
 *
 * - **符号のマイナス**は、直前が英数字・閉じ括弧・小数点でないときだけ符号として扱う。
 *   こうしないと "2026-09-06" が 2026 と -9 と -6 になり、日付の入った表を合計したときに
 *   目に見えないところで数が減る。引き算のつもりの "10-3" も同じ理由で 10 と 3 に読む
 *   (合計であって式ではないため、ここでは足し算だけを行う)。
 * - **識別子の中の数字**は数えない ("utf8" の 8、"item2" の 2)。ここを数字全体の
 *   先読みにすると ".5" や "v1.2.3" の数値まで丸ごと落ちるので、除外するのは
 *   英字とアンダースコアの直後だけに絞る。
 */
const NUMBER_PATTERN = new RegExp(
    // 数値そのものは正規表現リテラルのまま置く (文字列に書き直すと \d が d に潰れる)。
    /(?<![A-Za-z_])(?:(?<![0-9A-Za-z_.)])-)?(?:\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/.source
    // 後置の位 (3百万 / 5千)。数字と地続きの 1 つの数として読む。
    + `(?<magnitude>${KANJI_MAGNITUDE_SOURCE})?`,
    'g',
);

/** 1 つのマッチを数値にする。桁区切りのカンマを外し、後置の位を掛ける。 */
function matchedValue(m: RegExpMatchArray): number {
    const magnitude = m.groups?.magnitude;
    const digits = magnitude ? m[0].slice(0, -magnitude.length) : m[0];
    return Number(digits.replace(/,/g, '')) * (magnitude ? kanjiMagnitudeValue(magnitude) : 1);
}

/**
 * テキストに含まれる数値を、現れた順に返す。
 *
 * 全角数字も対象にするため、先に正規化してから走査する。桁区切りのカンマは取り除いて
 * から Number に渡す。有限でない値 (桁溢れ) は落とす — 1 つ混ざっただけで合計も平均も
 * Infinity になり、他の数値が全部無意味になるため。
 */
export function parseNumbersInText(text: string): number[] {
    if (!text) return [];
    const out: number[] = [];
    for (const match of normalizeCalcInput(text).matchAll(NUMBER_PATTERN)) {
        const value = matchedValue(match);
        if (Number.isFinite(value)) out.push(value);
    }
    return out;
}

export interface RewriteResult {
    /** 書き換えたあとのテキスト。 */
    text: string;
    /** 見つけた数値の個数。 */
    total: number;
    /** 実際に表記が変わった個数。 */
    changed: number;
    /** 変換できず元のまま残した個数。 */
    skipped: number;
}

/**
 * テキスト中の数値を、位置と地の文はそのままに書き換える。
 *
 * fn が null を返した数値は元の表記のまま残す (丸められない大きさ、変換できない値など)。
 * 「拾う」(parseNumbersInText) と「書き換える」でパターンが分かれると、集計に入っている
 * のに書き換わらない数が出る。同じ 1 つの規則を両方から使う。
 *
 * fn には 0 起点の連番も渡す。構成比や階差のように「何番目か」で答えが変わる変換が
 * 位置を数え直さずに済む。
 */
export function mapNumbersInText(
    text: string,
    fn: (value: number, index: number) => number | null,
): RewriteResult {
    return rewriteNumbersInText(text, (value, index) => {
        const next = fn(value, index);
        return next === null || !Number.isFinite(next) ? null : formatCalcNumber(next);
    });
}

/**
 * mapNumbersInText の文字列版。数値を「数値でない表記」に書き換える変換が使う
 * (素因数分解の 2^3 * 5、小数を分数にした 1/3 など)。
 *
 * fn が null を返した数値は元の表記のまま残す。
 *
 * **数値を探すのは正規化した文字列の上で、切り貼りするのは元のテキスト。** 正規化は
 * 全角で書かれた数値を読むためのもので、書き戻すためのものではない。正規化後の文字列を
 * そのまま返すと、選択範囲の読点・全角スペース・全角括弧・× ÷ ・ までが半角へ化け、
 * 数値と関係のない地の文が黙って書き換わる (undo を押すまで気づけない)。
 *
 * 添字をそのまま使えるのは、正規化が長さを変えない (1 文字 → 1 文字) ため。
 * normalize.test.ts がその性質を BMP 全数で見張っている。
 */
export function rewriteNumbersInText(
    text: string,
    fn: (value: number, index: number) => string | null,
): RewriteResult {
    if (!text) return { text, total: 0, changed: 0, skipped: 0 };

    const source = normalizeCalcInput(text);
    let index = 0;
    let changed = 0;
    let skipped = 0;
    let out = '';
    let copied = 0;

    for (const m of source.matchAll(NUMBER_PATTERN)) {
        const start = m.index!;
        const end = start + m[0].length;
        // 地の文は元のテキストから運ぶ。
        out += text.slice(copied, start);
        copied = end;

        const original = text.slice(start, end);
        const value = matchedValue(m);
        if (!Number.isFinite(value)) { out += original; continue; }

        const written = fn(value, index++);
        if (written === null) { skipped++; out += original; continue; }
        // 表記が変わらないものは数えない。比べる相手は正規化後の表記で、
        // 残すのは元の表記 (全角で書かれた数値をそのままにしておくため)。
        if (written === m[0]) { out += original; continue; }
        changed++;
        out += written;
    }

    return { text: out + text.slice(copied), total: index, changed, skipped };
}
