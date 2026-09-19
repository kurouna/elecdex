/**
 * 入力の正規化。数式の評価 (expression.ts) と数値の抽出 (numbers.ts) の両方が通る入口。
 *
 * 両者で表記の受け方がずれると、「ミニバッファでは計算できるのに合計だと拾えない」
 * といった説明のつかない差になるため、規則は 1 か所に置く。
 */


/**
 * 全角英数記号を半角へ、算術記号の別字を ASCII へ寄せる。
 *
 * 日本語入力のまま "１＋２" や "3×4" と打てるほうが自然で、これを弾くと
 * 「なぜか計算できない」という体験になる。変換対象は算術に出る文字だけに絞り、
 * 一般の NFKC 正規化はしない (全角の丸括弧や読点は拾いたいが、㍉ のような合字まで
 * 展開する必要はない)。
 *
 * **長音 'ー' とダッシュ '―' はマイナスにしない。** 見た目は似ているが日本語の本文に
 * 普通に出る字で、これを '-' に寄せると calc-sum-region が "コーヒー100円" を -100 と
 * 読む。符号として受けるのは ASCII の '-'、全角の '－'、MINUS SIGN の '−' だけ。
 */
/**
 * 変換の対象になる文字が 1 つでもあるか。
 *
 * 下の switch と全角範囲が扱う文字をそのまま並べたもの。**片方だけ増やすと、その文字が
 * 黙って変換されなくなる** ため、normalize.test.ts が「実際に変わる文字の集合」を
 * 全コードポイントで数え上げて突き合わせている。
 *
 * これが要るのは速さのため。集計コマンドは選択範囲をまるごと通すので、5MB を選ぶと
 * 1 文字ずつの走査だけで 0.6 秒かかる。実際のテキストはほとんどが変換対象ゼロなので、
 * 1 回の走査で確かめて、そのときは元の文字列をそのまま返す。
 */
const NEEDS_NORMALIZE = /[\uFF01-\uFF5E\u3000\u3001\u00D7\u00F7\u30FB\u2212]/;

export function normalizeCalcInput(input: string): string {
    if (!NEEDS_NORMALIZE.test(input)) return input;

    let out = '';
    for (const ch of input) {
        const code = ch.codePointAt(0)!;
        // 全角 ！(FF01) 〜 ～(FF5E) は ASCII と 0xFEE0 ずれで 1 対 1 対応する。
        if (code >= 0xff01 && code <= 0xff5e) {
            out += String.fromCharCode(code - 0xfee0);
            continue;
        }
        switch (ch) {
            case '　': out += ' '; break;   // 全角スペース
            case '×': case '・': out += '*'; break;
            case '÷': out += '/'; break;
            case '−': out += '-'; break;   // MINUS SIGN。長音 'ー' やダッシュ '―' は含めない (下の注記)
            case '、': out += ','; break;
            default: out += ch;
        }
    }
    return out;
}
