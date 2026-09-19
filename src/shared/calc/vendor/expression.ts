/**
 * 数式の評価 (M-x calc / calc-eval-region の計算部分)。
 *
 * ここは純関数だけで閉じている。React も Electron も Buffer も触らないので、
 * コマンド層 (CalcCommands.ts) を通さずに単体でテストできる。
 *
 * **eval / Function / プラグインのワーカーは使わない。** CSP を締めていること、
 * プラグインをワーカー隔離までして守っていることと矛盾するため、字句解析と再帰下降
 * パーサを自前で持つ。入力はユーザーがミニバッファに打った 1 行で外から流れ込む値では
 * ないが、「文字列をコードとして実行できる経路をアプリに 1 つも作らない」ことを優先する。
 *
 * 文法 (下ほど強く結合する):
 *   expr     := bitor
 *   bitor    := bitand ('|' bitand)*
 *   bitand   := shift ('&' shift)*
 *   shift    := additive (('<<' | '>>') additive)*
 *   additive := term (('+' | '-') term)*
 *   term     := unary (('*' | '/' | '%') unary)*
 *   unary    := ('+' | '-' | '~') unary | postfix
 *   postfix  := power '!'*
 *   power    := primary ('^' unary)?          // 右結合。2^3^2 = 2^(3^2)
 *   primary  := number | name | func '(' expr (',' expr)* ')' | '(' expr ')'
 *
 * 単項マイナスが power より弱いのは Emacs Calc と同じで、-2^2 は -(2^2) = -4 になる。
 * ビット演算の優先順位は C に合わせた (`^` は冪乗に使っているので、排他的論理和は
 * xor() 関数で書く)。
 */

import { normalizeCalcInput } from './normalize';
import { SQUARE_METERS_PER_TSUBO } from './transform';
import { kanjiMagnitudeValue, matchKanjiMagnitude } from './kanji';

export type CalcResult =
    | { ok: true; value: number }
    | { ok: false; error: string };

export interface CalcOptions {
    /**
     * 式から名前で参照できる値。CalcCommands が直前の答えを `ans` として渡す。
     * 評価器自身は状態を持たない — 履歴を持つのは呼び出し側の仕事。
     */
    vars?: Record<string, number>;
}

/** 入力の上限。これを超える式は打ち間違いか、そもそも計算する気がないもの。 */
const MAX_INPUT_LENGTH = 500;

/**
 * 括弧のネスト上限。
 *
 * 再帰下降なので、"((((((..." のような入力は素の実装だとスタックを食い尽くして
 * RangeError で落ちる。モンキーテストが真っ先に見つける類の穴なので、パーサ側で
 * 数えて普通のエラーに変える。
 */
const MAX_DEPTH = 64;

/** 階乗の上限。170! までが double で有限、171! は Infinity になる。 */
const MAX_FACTORIAL = 170;

// ── 字句解析 ──

type TokenKind = 'number' | 'name' | 'op';

interface Token {
    kind: TokenKind;
    text: string;
    value?: number;
}

/** 評価中に投げる内部例外。外へは CalcResult の error として出る。 */
class CalcError extends Error { }

const SINGLE_CHAR_OPERATORS = new Set(['+', '-', '*', '/', '%', '^', '(', ')', ',', '&', '|', '~', '!']);

/**
 * 数値リテラルを読む。10 進 (指数つき) のほか 0x / 0b / 0o を受ける。
 * 進数リテラルを受けるのはプログラマ向けエディタとしての実用面が大きい。
 *
 * 10 進には後置の位 (3百万 / 5千) も付けられる。日本語の文書に出てくる金額の書き方を
 * そのまま打てるようにするためで、拾う側 (numbers.ts) と同じ規則を kanji.ts から使う。
 * 進数リテラルには付けない — 0xFF万 に意味は無い。
 */
function readNumber(src: string, start: number): { text: string; value: number; next: number } | null {
    const radix = /^0[xX][0-9a-fA-F]+|^0[bB][01]+|^0[oO][0-7]+/.exec(src.slice(start));
    if (radix) {
        const text = radix[0];
        return { text, value: Number(text), next: start + text.length };
    }
    // 10 進。".5" と "1." の両方を受ける。指数部は e の直後に数字が続くときだけ取り込む
    // (そうしないと "2e" や "3e+" のような打ちかけを数値として飲み込んでしまう)。
    const dec = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(start));
    if (!dec) return null;
    const magnitude = matchKanjiMagnitude(src.slice(start + dec[0].length));
    const text = magnitude ? dec[0] + magnitude : dec[0];
    const value = Number(dec[0]) * (magnitude ? kanjiMagnitudeValue(magnitude) : 1);
    if (!Number.isFinite(value)) throw new CalcError(`Number out of range: ${text}`);
    return { text, value, next: start + text.length };
}

function tokenize(src: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < src.length) {
        const ch = src[i];
        if (/\s/.test(ch)) { i++; continue; }

        if (/[0-9.]/.test(ch)) {
            const num = readNumber(src, i);
            if (!num) throw new CalcError(`Unexpected character: ${ch}`);
            tokens.push({ kind: 'number', text: num.text, value: num.value });
            i = num.next;
            continue;
        }

        if (/[A-Za-z_]/.test(ch)) {
            const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))![0];
            tokens.push({ kind: 'name', text: name.toLowerCase() });
            i += name.length;
            continue;
        }

        // 2 文字演算子を 1 文字より先に見る。'<' '>' は単独では使わない。
        const pair = src.slice(i, i + 2);
        if (pair === '<<' || pair === '>>') {
            tokens.push({ kind: 'op', text: pair });
            i += 2;
            continue;
        }

        if (SINGLE_CHAR_OPERATORS.has(ch)) {
            tokens.push({ kind: 'op', text: ch });
            i++;
            continue;
        }

        // src[i] は UTF-16 の 1 単位なので、絵文字だとサロゲートの片割れになる。
        // そのままエラー文に載せると豆腐が出るため、コードポイントで読み直す。
        throw new CalcError(`Unexpected character: ${String.fromCodePoint(src.codePointAt(i)!)}`);
    }
    return tokens;
}

// ── 名前表 ──

/**
 * 名前で参照できる定数。
 *
 * 載せる条件は「定義から動かないこと」。消費税率や為替レートのように改定される数は、
 * 電卓に焼き込んだ瞬間に古くなり、しかも古いことが画面からは見えないので入れない
 * (税は `calc-tax-included-region` のように、率をその場で尋ねるコマンドの側で扱う)。
 *
 * 単位系は持たないので、時間は秒、データ量はバイトの素の数値として返す。
 */
export const CALC_CONSTANTS: Record<string, number> = {
    // 数学
    pi: Math.PI,
    e: Math.E,
    tau: Math.PI * 2,
    phi: (1 + Math.sqrt(5)) / 2,

    // 割合。`bp` は金利や手数料に使うベーシスポイント (1bp = 0.01%)。
    percent: 0.01,
    permille: 0.001,
    bp: 0.0001,

    // 桁。日本語の万・億・兆は、決算の数字をそのまま打てるように名前で置く。
    k: 1e3,
    thousand: 1e3,
    million: 1e6,
    billion: 1e9,
    trillion: 1e12,
    man: 1e4,
    oku: 1e8,
    cho: 1e12,

    // データ量 (バイト)。10 進と 2 進の両方を持つ — 回線と見積書は 10 進、
    // ディスクとメモリは 2 進で数えるので、どちらかに寄せると必ず片方が狂う。
    kb: 1e3,
    mb: 1e6,
    gb: 1e9,
    tb: 1e12,
    kib: 1024,
    mib: 1024 ** 2,
    gib: 1024 ** 3,
    tib: 1024 ** 4,

    // 時間 (秒)。月と年は日数が一定でないので置かない。
    minute: 60,
    hour: 3600,
    day: 86400,
    week: 604800,

    // 面積。坪の比は calc-tsubo-region と同じものを使う。
    tsubo: SQUARE_METERS_PER_TSUBO,
};

/** 32 ビット整数として扱えるか。ビット演算は JS の仕様どおり 32 ビットで行う。 */
function requireInt32(value: number, op: string): number {
    // 範囲は符号つき 32 ビットそのまま。abs で見ると下限 (-2147483648) だけが弾かれ、
    // ~2147483647 の結果をそのまま次の演算に渡せなくなる。
    if (!Number.isInteger(value) || value < -0x80000000 || value > 0x7fffffff) {
        throw new CalcError(`${op} needs 32-bit integers`);
    }
    return value;
}

function factorial(n: number): number {
    if (!Number.isInteger(n) || n < 0) throw new CalcError('Factorial needs a non-negative integer');
    if (n > MAX_FACTORIAL) throw new CalcError('Factorial is too large');
    let out = 1;
    for (let i = 2; i <= n; i++) out *= i;
    return out;
}

function gcd(a: number, b: number): number {
    let x = Math.abs(Math.trunc(a));
    let y = Math.abs(Math.trunc(b));
    while (y) { const t = x % y; x = y; y = t; }
    return x;
}

/** 引数の数。-1 は可変長 (1 個以上)、[min, max] は範囲。 */
type Arity = number | [number, number];

const FUNCTIONS: Record<string, { arity: Arity; fn: (...args: number[]) => number }> = {
    // 基本
    sqrt: { arity: 1, fn: Math.sqrt },
    cbrt: { arity: 1, fn: Math.cbrt },
    abs: { arity: 1, fn: Math.abs },
    exp: { arity: 1, fn: Math.exp },
    sign: { arity: 1, fn: Math.sign },
    pow: { arity: 2, fn: Math.pow },
    // 対数。2 引数なら底を指定する (log(8, 2) = 3)。
    ln: { arity: 1, fn: Math.log },
    log: { arity: [1, 2], fn: (x, base) => (base === undefined ? Math.log10(x) : Math.log(x) / Math.log(base)) },
    log2: { arity: 1, fn: Math.log2 },
    log10: { arity: 1, fn: Math.log10 },
    // 三角関数 (引数はラジアン)。度で書きたいときは deg / rad で挟む。
    sin: { arity: 1, fn: Math.sin },
    cos: { arity: 1, fn: Math.cos },
    tan: { arity: 1, fn: Math.tan },
    asin: { arity: 1, fn: Math.asin },
    acos: { arity: 1, fn: Math.acos },
    atan: { arity: 1, fn: Math.atan },
    atan2: { arity: 2, fn: Math.atan2 },
    sinh: { arity: 1, fn: Math.sinh },
    cosh: { arity: 1, fn: Math.cosh },
    tanh: { arity: 1, fn: Math.tanh },
    rad: { arity: 1, fn: (deg) => (deg * Math.PI) / 180 },
    deg: { arity: 1, fn: (rad) => (rad * 180) / Math.PI },
    // 丸め。round は桁数を取れる (round(3.14159, 2) = 3.14)。
    floor: { arity: 1, fn: Math.floor },
    ceil: { arity: 1, fn: Math.ceil },
    trunc: { arity: 1, fn: Math.trunc },
    round: {
        arity: [1, 2],
        fn: (x, digits) => {
            if (digits === undefined) return Math.round(x);
            if (!Number.isInteger(digits) || Math.abs(digits) > 15) throw new CalcError('round needs 0-15 digits');
            const scale = Math.pow(10, digits);
            return Math.round(x * scale) / scale;
        },
    },
    // 集約
    min: { arity: -1, fn: Math.min },
    max: { arity: -1, fn: Math.max },
    hypot: { arity: -1, fn: Math.hypot },
    avg: { arity: -1, fn: (...xs) => xs.reduce((a, b) => a + b, 0) / xs.length },
    sum: { arity: -1, fn: (...xs) => xs.reduce((a, b) => a + b, 0) },
    // 整数
    fact: { arity: 1, fn: factorial },
    gcd: { arity: -1, fn: (...xs) => xs.reduce(gcd) },
    lcm: { arity: -1, fn: (...xs) => xs.reduce((a, b) => (a === 0 || b === 0 ? 0 : Math.abs(a * b) / gcd(a, b))) },
    // ビット演算。^ は冪乗に取られているので xor は関数で書く。
    and: { arity: 2, fn: (a, b) => requireInt32(a, 'and') & requireInt32(b, 'and') },
    or: { arity: 2, fn: (a, b) => requireInt32(a, 'or') | requireInt32(b, 'or') },
    xor: { arity: 2, fn: (a, b) => requireInt32(a, 'xor') ^ requireInt32(b, 'xor') },
    not: { arity: 1, fn: (a) => ~requireInt32(a, 'not') },
    shl: { arity: 2, fn: (a, b) => requireInt32(a, 'shl') << requireInt32(b, 'shl') },
    shr: { arity: 2, fn: (a, b) => requireInt32(a, 'shr') >> requireInt32(b, 'shr') },
};

// ── 構文解析 + 評価 ──
//
// 木を作らずその場で畳む。値以外に持ち回るものが無いので、木にしても得がない。

class Parser {
    private index = 0;
    private depth = 0;

    private readonly tokens: Token[];
    private readonly vars: Record<string, number>;

    constructor(tokens: Token[], vars: Record<string, number>) {
        this.tokens = tokens;
        this.vars = vars;
    }

    private peek(): Token | undefined { return this.tokens[this.index]; }

    private eat(text: string): boolean {
        const t = this.peek();
        if (t && t.kind === 'op' && t.text === text) { this.index++; return true; }
        return false;
    }

    private expect(text: string): void {
        if (!this.eat(text)) {
            const t = this.peek();
            throw new CalcError(t ? `Expected ${text} before ${t.text}` : `Expected ${text}`);
        }
    }

    parse(): number {
        const value = this.expr();
        const rest = this.peek();
        if (rest) throw new CalcError(`Unexpected token: ${rest.text}`);
        return value;
    }

    private expr(): number { return this.bitOr(); }

    private bitOr(): number {
        let value = this.bitAnd();
        while (this.eat('|')) {
            value = requireInt32(value, '|') | requireInt32(this.bitAnd(), '|');
        }
        return value;
    }

    private bitAnd(): number {
        let value = this.shift();
        while (this.eat('&')) {
            value = requireInt32(value, '&') & requireInt32(this.shift(), '&');
        }
        return value;
    }

    private shift(): number {
        let value = this.additive();
        for (; ;) {
            if (this.eat('<<')) value = requireInt32(value, '<<') << requireInt32(this.additive(), '<<');
            else if (this.eat('>>')) value = requireInt32(value, '>>') >> requireInt32(this.additive(), '>>');
            else return value;
        }
    }

    private additive(): number {
        let value = this.term();
        for (; ;) {
            if (this.eat('+')) value += this.term();
            else if (this.eat('-')) value -= this.term();
            else return value;
        }
    }

    private term(): number {
        let value = this.unary();
        for (; ;) {
            if (this.eat('*')) value *= this.unary();
            else if (this.eat('/')) {
                const rhs = this.unary();
                if (rhs === 0) throw new CalcError('Division by zero');
                value /= rhs;
            } else if (this.eat('%')) {
                const rhs = this.unary();
                if (rhs === 0) throw new CalcError('Division by zero');
                value %= rhs;
            } else return value;
        }
    }

    private unary(): number {
        if (this.eat('-')) return -this.unary();
        if (this.eat('+')) return this.unary();
        if (this.eat('~')) return ~requireInt32(this.unary(), '~');
        return this.postfix();
    }

    private postfix(): number {
        let value = this.power();
        while (this.eat('!')) value = factorial(value);
        return value;
    }

    private power(): number {
        const base = this.primary();
        // 右辺を unary にするのは 2^-3 を書けるようにするため。^ 自体は右結合。
        if (this.eat('^')) return Math.pow(base, this.unary());
        return base;
    }

    private primary(): number {
        const t = this.peek();
        if (!t) throw new CalcError('Unexpected end of expression');

        if (t.kind === 'number') { this.index++; return t.value!; }

        if (t.kind === 'name') {
            this.index++;
            // 3 つとも hasOwnProperty で引く。素の添字だと "constructor" や "__proto__" が
            // Object.prototype から生えているものに当たり、関数表に無い名前が関数として
            // 扱われる (「constructor takes undefined argument(s)」のような答えになる)。
            const fn = Object.prototype.hasOwnProperty.call(FUNCTIONS, t.text) ? FUNCTIONS[t.text] : undefined;
            if (fn) {
                this.expect('(');
                const args = this.args();
                this.checkArity(t.text, fn.arity, args.length);
                return fn.fn(...args);
            }
            // 変数は定数より先に見る。呼び出し側が ans を上書きできるようにするため。
            // (関数名だけは変数より強い — 上で先に返している。)
            if (Object.prototype.hasOwnProperty.call(this.vars, t.text)) return this.vars[t.text];
            if (Object.prototype.hasOwnProperty.call(CALC_CONSTANTS, t.text)) return CALC_CONSTANTS[t.text];
            throw new CalcError(`Unknown name: ${t.text}`);
        }

        if (this.eat('(')) {
            const value = this.nested(() => this.expr());
            this.expect(')');
            return value;
        }

        throw new CalcError(`Unexpected token: ${t.text}`);
    }

    private checkArity(name: string, arity: Arity, got: number): void {
        if (arity === -1) {
            if (got < 1) throw new CalcError(`${name} needs at least one argument`);
            return;
        }
        if (Array.isArray(arity)) {
            if (got < arity[0] || got > arity[1]) {
                throw new CalcError(`${name} takes ${arity[0]}-${arity[1]} arguments, got ${got}`);
            }
            return;
        }
        if (got !== arity) throw new CalcError(`${name} takes ${arity} argument(s), got ${got}`);
    }

    /** 関数の実引数列。'(' は呼び出し側が食べ、')' はここで食べる。 */
    private args(): number[] {
        const args: number[] = [];
        if (this.eat(')')) return args;
        this.nested(() => {
            do { args.push(this.expr()); } while (this.eat(','));
        });
        this.expect(')');
        return args;
    }

    /** 括弧の内側を数える。深すぎる入力でスタックを溢れさせない。 */
    private nested<T>(body: () => T): T {
        if (++this.depth > MAX_DEPTH) throw new CalcError('Expression is nested too deeply');
        try { return body(); } finally { this.depth--; }
    }
}

/**
 * 式を評価する。例外は投げず、必ず CalcResult を返す。
 *
 * 「throw しない」は呼び出し側の都合ではなく、この関数がユーザーの打鍵をそのまま
 * 受ける唯一の入口だから。壊れた入力はエラー文字列としてエコー行に出るのが正しい。
 */
export function evaluateExpression(input: string, options?: CalcOptions): CalcResult {
    if (typeof input !== 'string') return { ok: false, error: 'Empty expression' };
    if (input.length > MAX_INPUT_LENGTH) return { ok: false, error: 'Expression is too long' };

    const src = normalizeCalcInput(input).trim();
    if (!src) return { ok: false, error: 'Empty expression' };

    try {
        const tokens = tokenize(src);
        if (tokens.length === 0) return { ok: false, error: 'Empty expression' };
        const value = new Parser(tokens, options?.vars ?? {}).parse();
        if (!Number.isFinite(value)) return { ok: false, error: 'Result is not a finite number' };
        return { ok: true, value };
    } catch (e) {
        if (e instanceof CalcError) return { ok: false, error: e.message };
        // パーサの想定外。握り潰すと原因が消えるのでメッセージだけは通す。
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
}
