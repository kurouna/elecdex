/**
 * 漢数字の位取り (3百万円 / 5千円 / 1,500万 のような、算用数字と漢字の混じった表記)。
 *
 * 日本語の文書では金額をこの形で書く。「3000000」と書かずに「3百万」と書くのは
 * 桁を数えさせないためで、**読み手にとってはこれが数値**なので、電卓と集計が
 * 読めないと「なぜか合計に入らない」数が表の中に混ざることになる。
 *
 * 扱うのは**算用数字に後置された位**だけで、漢数字そのもの (三百万) は読まない。
 * 「千」「百」を単独で数と認めると、地の文の「千葉」「百貨店」を 1000 や 100 として
 * 拾ってしまう — 集計コマンドは選択範囲の地の文ごと通るので、これは実害になる。
 * 数字が前にあることを、位として読んでよい合図にしている。
 */

/** 位の値。十・百・千は万以上と組み合わせて使う (百万 = 100 × 10^4)。 */
const MAGNITUDE: Record<string, number> = {
    十: 10,
    百: 100,
    千: 1000,
    万: 1e4,
    億: 1e8,
    兆: 1e12,
};

/**
 * 数字の後ろに来る位の並び。`[十百千]` と `[万億兆]` の 2 段に分けてあるのは、
 * 「百万」「千万」「百億」は受けて「万億」「百十」は受けないため。
 * 正規表現の断片として numbers.ts と共有する (拾う側と書き換える側で規則をずらさない)。
 */
export const KANJI_MAGNITUDE_SOURCE = '(?:[十百千]?[万億兆]|[十百千])';

const KANJI_MAGNITUDE = new RegExp(`^${KANJI_MAGNITUDE_SOURCE}`);

/** 文字列の先頭にある位を読む。無ければ null。 */
export function matchKanjiMagnitude(text: string): string | null {
    return KANJI_MAGNITUDE.exec(text)?.[0] ?? null;
}

/**
 * 位の並びを倍率にする ("百万" → 1e6、"千" → 1000)。
 *
 * 掛け合わせるだけで済むのは、受ける並びを上の 2 段に絞ってあるため。
 */
export function kanjiMagnitudeValue(text: string): number {
    let value = 1;
    for (const ch of text) value *= MAGNITUDE[ch];
    return value;
}
