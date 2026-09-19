/**
 * 計算結果の見せ方。
 *
 * 評価そのもの (expression.ts) からは切り離してある。「どう計算するか」と
 * 「どう読ませるか」は変わる理由が別で、丸めの規則をパーサの中に置くと、
 * 値が要るだけの呼び出し側まで表示の都合に付き合わされる。
 */


/**
 * 計算結果を文字列にする。
 *
 * 有効数字 12 桁に丸めてから文字列化するのは 0.1 + 0.2 を 0.30000000000000004 と
 * 出さないため。IEEE754 の見た目のノイズは、電卓としては答えを間違えているのと
 * 同じくらい信用を落とす。12 桁は double の 15〜17 桁より十分内側で、丸めが
 * 意味のある桁を消さない範囲に取っている。
 */
export function formatCalcNumber(value: number): string {
    if (!Number.isFinite(value)) return String(value);
    const rounded = Number(value.toPrecision(12));
    if (Object.is(rounded, -0)) return '0';
    return String(rounded);
}

/** 3 桁区切りを入れた表記。合計のように桁が多い数を読ませるときだけ使う。 */
export function formatGrouped(value: number): string {
    const text = formatCalcNumber(value);
    // 指数表記になったものは区切らない (1.2e+21 に桁区切りを入れても読めない)。
    if (/[eE]/.test(text)) return text;
    const [intPart, fracPart] = text.split('.');
    const sign = intPart.startsWith('-') ? '-' : '';
    const digits = sign ? intPart.slice(1) : intPart;
    const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + grouped + (fracPart ? `.${fracPart}` : '');
}

/**
 * 数と単位を並べ、1 のときだけ単数形にする。
 *
 * "1 numbers" や "1 periods" と出る文は、書いた側が数えていないように見える。
 * エコー行はこの道具の顔なので、ここが崩れていると答えの信用まで落ちる。
 */
export function pluralize(count: number, word: string): string {
    return `${formatGrouped(count)} ${word}${count === 1 ? '' : 's'}`;
}

/** 2 進表記を出す上限。これ以上は桁が長すぎてエコー行で読めない。 */
const BINARY_LIMIT = 2 ** 32;

/**
 * 結果に 16 進 / 2 進を添える。整数で、かつ 10 以上のときだけ。
 *
 * 1 桁の数に "(0x7)" を付けても情報が増えないので黙る。負数は 2 の補数ではなく
 * 符号つき (-0xff) で出す — ビット幅を決めずに補数表記を出すほうが誤解を生む。
 */
export function describeCalcValue(value: number): string {
    const text = formatCalcNumber(value);
    const rounded = Number(value.toPrecision(12));
    if (!Number.isInteger(rounded) || Math.abs(rounded) < 10) return text;
    if (Math.abs(rounded) > Number.MAX_SAFE_INTEGER) return text;

    const sign = rounded < 0 ? '-' : '';
    const magnitude = Math.abs(rounded);
    const parts = [`${sign}0x${magnitude.toString(16).toUpperCase()}`];
    if (magnitude < BINARY_LIMIT) parts.push(`${sign}0b${magnitude.toString(2)}`);
    return `${text} (${parts.join(', ')})`;
}
