import { describe, it, expect } from 'vitest';
import { evaluateExpression, formatCalcNumber, CALC_CONSTANTS } from './index';
import { describeCalcValue } from './format';

/** 成功を前提に値だけ取り出す（失敗ならエラー文字列を expect に見せて落とす）。 */
const value = (src: string, vars?: Record<string, number>) => {
    const r = evaluateExpression(src, vars ? { vars } : undefined);
    return r.ok ? r.value : `ERROR: ${r.error}`;
};

/** 絵文字 (サロゲートペア)。ソースへ直接置かず組み立てる。 */
const EMOJI = String.fromCodePoint(0x1f600);

/** 失敗を前提にエラー文字列だけ取り出す。 */
const error = (src: string) => {
    const r = evaluateExpression(src);
    return r.ok ? `UNEXPECTED OK: ${r.value}` : r.error;
};

describe('evaluateExpression — 四則と優先順位', () => {
    it('基本の四則', () => {
        expect(value('1+2')).toBe(3);
        expect(value('10 - 4')).toBe(6);
        expect(value('6*7')).toBe(42);
        expect(value('7/2')).toBe(3.5);
        expect(value('7%3')).toBe(1);
    });

    it('乗除は加減より強い', () => {
        expect(value('1+2*3')).toBe(7);
        expect(value('(1+2)*3')).toBe(9);
        expect(value('2*3+4*5')).toBe(26);
    });

    it('冪乗は右結合で、乗除より強い', () => {
        expect(value('2^3^2')).toBe(512);      // 2^(3^2)
        expect(value('2*3^2')).toBe(18);
        expect(value('2^-2')).toBe(0.25);
    });

    it('単項マイナスは冪乗より弱い（Emacs Calc と同じ）', () => {
        expect(value('-2^2')).toBe(-4);
        expect(value('(-2)^2')).toBe(4);
        expect(value('--3')).toBe(3);
        expect(value('-  -3')).toBe(3);
    });

    it('減算は左結合', () => {
        expect(value('10-3-2')).toBe(5);
        expect(value('100/5/2')).toBe(10);
    });
});

describe('evaluateExpression — 数値リテラル', () => {
    it('小数と指数', () => {
        expect(value('.5+.5')).toBe(1);
        expect(value('1.')).toBe(1);
        expect(value('2e3')).toBe(2000);
        expect(value('1.5e-2')).toBe(0.015);
    });

    it('16 進 / 2 進 / 8 進', () => {
        expect(value('0xff')).toBe(255);
        expect(value('0XFF+1')).toBe(256);
        expect(value('0b1010')).toBe(10);
        expect(value('0o17')).toBe(15);
    });

    it('指数の打ちかけは数値として飲み込まない', () => {
        expect(error('2e')).toMatch(/Unexpected token: e/);
        expect(error('3e+')).toMatch(/Unexpected/);
    });
});

describe('evaluateExpression — 関数と定数', () => {
    it('1 引数関数', () => {
        expect(value('sqrt(16)')).toBe(4);
        expect(value('abs(-3)')).toBe(3);
        expect(value('floor(2.7)')).toBe(2);
        expect(value('SQRT(9)')).toBe(3); // 大小は無視する
    });

    it('可変長関数', () => {
        expect(value('max(1,5,3)')).toBe(5);
        expect(value('min(1,5,3)')).toBe(1);
        expect(value('avg(1,2,3,4)')).toBe(2.5);
        expect(value('sum(1,2,3)')).toBe(6);
        expect(value('gcd(12,18)')).toBe(6);
        expect(value('lcm(4,6)')).toBe(12);
    });

    it('log は底を取れる', () => {
        expect(value('log(100)')).toBe(2);      // 既定は常用対数
        expect(value('log(8,2)')).toBe(3);
        expect(value('ln(1)')).toBe(0);
    });

    it('round は桁数を取れる', () => {
        expect(value('round(2.5)')).toBe(3);
        expect(value('round(3.14159,2)')).toBe(3.14);
    });

    it('度とラジアン', () => {
        expect(value('round(sin(rad(30)),6)')).toBe(0.5);
        expect(value('round(deg(pi),6)')).toBe(180);
    });

    it('定数', () => {
        expect(value('pi')).toBeCloseTo(Math.PI, 12);
        expect(value('e')).toBeCloseTo(Math.E, 12);
        expect(value('round(tau/pi,6)')).toBe(2);
        expect(value('round(phi,4)')).toBe(1.618);
    });

    it('割合の定数', () => {
        expect(value('8*percent')).toBeCloseTo(0.08, 12);
        expect(value('1200*3.5*percent')).toBeCloseTo(42, 9);
        expect(value('5*permille')).toBeCloseTo(0.005, 12);
        expect(value('25*bp')).toBeCloseTo(0.0025, 12);
        // ベーシスポイントは 1bp = 0.01%。取り違えると桁が 100 倍ずれる。
        expect(value('100*bp/percent')).toBeCloseTo(1, 12);
    });

    it('桁の定数（万・億・兆と thousand/million/billion/trillion）', () => {
        expect(value('3*man')).toBe(30000);
        expect(value('2.5*oku')).toBe(250000000);
        expect(value('1*cho')).toBe(1e12);
        expect(value('oku/man')).toBe(10000);
        expect(value('12*k')).toBe(12000);
        expect(value('thousand')).toBe(1000);
        expect(value('3*million')).toBe(3e6);
        expect(value('1.2*billion')).toBe(1.2e9);
        expect(value('trillion/billion')).toBe(1000);
    });

    it('データ量は 10 進と 2 進の両方を持つ', () => {
        expect(value('gb')).toBe(1e9);
        expect(value('gib')).toBe(1073741824);
        expect(value('kib')).toBe(1024);
        expect(value('mib/kib')).toBe(1024);
        expect(value('tib/gib')).toBe(1024);
        expect(value('round(gb/gib,6)')).toBe(0.931323);
        expect(value('mb')).toBe(1e6);
        expect(value('kb')).toBe(1000);
        expect(value('tb')).toBe(1e12);
    });

    it('時間は秒で表す', () => {
        expect(value('hour')).toBe(3600);
        expect(value('minute')).toBe(60);
        expect(value('day/hour')).toBe(24);
        expect(value('week/day')).toBe(7);
        expect(value('7.5*hour/minute')).toBe(450);
    });

    it('坪は書き換えコマンドと同じ比', () => {
        expect(value('round(tsubo,6)')).toBe(3.305785);
        expect(value('round(50*tsubo,4)')).toBe(165.2893);
    });

    it('定数名は小文字の ASCII だけ（大文字を書くと永久に読めない）', () => {
        // 字句解析が名前を小文字化してから表を引くので、'GB' のような鍵は
        // 書いた本人以外だれも辿り着けない死んだ項目になる。
        for (const name of Object.keys(CALC_CONSTANTS)) {
            expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
        }
    });

    it('定数の値はすべて有限で 0 でない', () => {
        // 0 や NaN が 1 つ混ざると、それを使った式が黙って 0 や NaN を返す。
        for (const [name, v] of Object.entries(CALC_CONSTANTS)) {
            expect(`${name}: ${Number.isFinite(v) && v !== 0}`).toBe(`${name}: true`);
        }
    });

    it('定数名が関数名とぶつかっていない', () => {
        // ぶつかると primary() は関数を先に見るので、その定数は永久に読めなくなる。
        // 名前を足すときにだけ効く見張りなので、値ではなく参照できるかどうかを見る。
        for (const name of Object.keys(CALC_CONSTANTS)) {
            const r = evaluateExpression(name);
            expect(r.ok ? 'ok' : `${name}: ${r.error}`).toBe('ok');
        }
    });

    it('引数の数が合わなければエラー', () => {
        expect(error('sqrt(1,2)')).toMatch(/sqrt takes 1 argument/);
        expect(error('pow(2)')).toMatch(/pow takes 2 argument/);
        expect(error('max()')).toMatch(/at least one argument/);
        expect(error('round(1,2,3)')).toMatch(/round takes 1-2 arguments/);
    });

    it('関数名には括弧が要る', () => {
        expect(error('sqrt 4')).toMatch(/Expected \(/);
    });
});

describe('evaluateExpression — ビット演算と階乗', () => {
    it('C と同じ優先順位（| < & < シフト < 加減）', () => {
        expect(value('1|2')).toBe(3);
        expect(value('6&3')).toBe(2);
        expect(value('1|2&3')).toBe(3);          // 1 | (2 & 3)
        expect(value('1<<4')).toBe(16);
        expect(value('256>>4')).toBe(16);
        expect(value('1<<2+1')).toBe(8);         // 1 << (2 + 1)
        expect(value('~0')).toBe(-1);
    });

    it('関数形のビット演算（^ は冪乗なので xor は関数）', () => {
        expect(value('xor(12,10)')).toBe(6);
        expect(value('and(12,10)')).toBe(8);
        expect(value('or(12,10)')).toBe(14);
        expect(value('shl(1,8)')).toBe(256);
        expect(value('shr(256,8)')).toBe(1);
        expect(value('not(0)')).toBe(-1);
    });

    it('32 ビットに収まらない値は黙って丸めずエラーにする', () => {
        // JS の & は暗黙に 32 ビットへ切り詰めるので、放っておくと答えが静かに変わる。
        expect(error('2^40 & 1')).toMatch(/32-bit/);
        expect(error('1.5 | 1')).toMatch(/32-bit/);
    });

    it('階乗は後置 ! と fact() の両方', () => {
        expect(value('5!')).toBe(120);
        expect(value('0!')).toBe(1);
        expect(value('fact(5)')).toBe(120);
        expect(value('3!+1')).toBe(7);
        expect(error('(-1)!')).toMatch(/non-negative integer/);
        expect(error('2.5!')).toMatch(/non-negative integer/);
        expect(error('200!')).toMatch(/too large/);
    });
});

describe('evaluateExpression — 名前の解決 (敵対的)', () => {
    it('Object.prototype から生えている名前は関数でも定数でもない', () => {
        // 素の添字で表を引くと FUNCTIONS['constructor'] が Object に当たり、
        // 関数表に無い名前が関数として扱われる。3 つの表すべてを hasOwnProperty で引く。
        expect(error('__proto__')).toBe('Unknown name: __proto__');
        expect(error('constructor')).toBe('Unknown name: constructor');
        expect(error('constructor(1)')).toBe('Unknown name: constructor');
        expect(error('__proto__(1)')).toBe('Unknown name: __proto__');
        // 大文字を含むものは小文字化されて別名になるので、そもそも表に当たらない。
        expect(error('toString')).toBe('Unknown name: tostring');
        expect(error('hasOwnProperty')).toBe('Unknown name: hasownproperty');
    });

    it('呼び出し側の変数も、継承したものは見ない', () => {
        // vars は外から来るオブジェクト。プロトタイプ越しの値まで読むと、
        // 呼び出し側が渡したつもりのない名前が式から見えることになる。
        const inherited = Object.create({ ans: 5 });
        const r = evaluateExpression('ans', { vars: inherited });
        expect(r.ok ? r.value : r.error).toBe('Unknown name: ans');
    });

    it('名前は大文字小文字を問わない', () => {
        expect(value('PI')).toBeCloseTo(Math.PI, 12);
        expect(value('GB')).toBe(1e9);
        expect(value('Man')).toBe(10000);
        expect(value('BP')).toBeCloseTo(0.0001, 15);
        expect(value('MAX(1,2)')).toBe(2);
    });

    it('定数は関数ではない（括弧を付けると落ちる）', () => {
        expect(error('pi(3)')).toBe('Unexpected token: (');
        expect(error('man(2)')).toBe('Unexpected token: (');
    });

    it('関数名は変数より強い（変数で関数を隠せない）', () => {
        // 定数は上書きできるが関数は上書きできない、という非対称はここで固定しておく。
        // 隠せてしまうと min(1,2) が突然エラーになる式が書けてしまう。
        expect(error('min')).toBe('Expected (');
        expect(value('min(1,2)', { min: 3 })).toBe(1);
        expect(value('pi', { pi: 3 })).toBe(3);
    });

    it('暗黙の乗算はしない', () => {
        // 3pi を 3*pi と読む電卓もあるが、ここは読まない。読むことにすると
        // 2e3 (指数) や 0x (進数) と衝突して、字句の規則が一段複雑になる。
        expect(error('3pi')).toBe('Unexpected token: pi');
        expect(error('3man')).toBe('Unexpected token: man');
        expect(value('3*man')).toBe(30000);
        // 漢字の位だけは数値の一部なので、隣接して書ける (3万 は 3*man と同じ)。
        expect(value('3万')).toBe(30000);
    });
});

describe('evaluateExpression — 定数どうしの関係', () => {
    it('桁の定数は掛け合わせても矛盾しない', () => {
        expect(value('man*man')).toBe(value('oku'));
        expect(value('oku*man')).toBe(value('cho'));
        expect(value('cho')).toBe(value('trillion'));
        expect(value('k')).toBe(value('thousand'));
        expect(value('k*k')).toBe(value('million'));
        expect(value('million*k')).toBe(value('billion'));
    });

    it('データ量は 1024 の冪で積み上がる', () => {
        expect(value('kib*kib')).toBe(value('mib'));
        expect(value('kib^3')).toBe(value('gib'));
        expect(value('kib^4')).toBe(value('tib'));
        expect(value('kb*kb')).toBe(value('mb'));
        expect(value('kb')).toBe(value('k'));
    });

    it('時間は秒で積み上がる', () => {
        expect(value('60*minute')).toBe(value('hour'));
        expect(value('24*hour')).toBe(value('day'));
        expect(value('7*day')).toBe(value('week'));
    });

    it('坪は 121 倍すると 400 平方メートルに戻る', () => {
        expect(value('121*tsubo')).toBeCloseTo(400, 9);
    });
});

describe('evaluateExpression — 定数を演算子の境界に置く', () => {
    it('32 ビットに収まる定数と収まらない定数', () => {
        // gib = 2^30 は符号つき 32 ビットに収まり、その 2 倍は収まらない。
        expect(value('gib|0')).toBe(1073741824);
        expect(error('gib*2|0')).toMatch(/32-bit/);
        expect(error('tb&1')).toMatch(/32-bit/);
        expect(value('mib<<1')).toBe(2097152);
    });

    it('階乗は定数でも上限と整数の規則が効く', () => {
        expect(error('k!')).toMatch(/too large/);
        expect(error('percent!')).toMatch(/non-negative integer/);
    });

    it('桁が溢れた答えは値として返さない', () => {
        // 定数は大きいので、冪に使うと簡単に double を超える。
        expect(error('gb^gb')).toMatch(/finite/);
        expect(value('tib*tib*tib')).toBe(1.329227995784916e36);
    });
});

describe('evaluateExpression — 算用数字に後置された位 (3百万)', () => {
    it('日本語の文書に出てくる金額の書き方をそのまま打てる', () => {
        expect(value('3百万')).toBe(3000000);
        expect(value('5千')).toBe(5000);
        expect(value('1万')).toBe(10000);
        expect(value('2億')).toBe(2e8);
        expect(value('3兆')).toBe(3e12);
        expect(value('1.5億')).toBe(1.5e8);
    });

    it('式の中で使える', () => {
        expect(value('3百万+5千')).toBe(3005000);
        expect(value('1.5億*2')).toBe(3e8);
        expect(value('3百万/man')).toBe(300);
        expect(value('(1万+2千)*3')).toBe(36000);
    });

    it('位だけを書くことはできない', () => {
        // 数字を要求することで、地の文の「千葉」を 1000 と読む余地を無くしている。
        expect(error('千')).toMatch(/Unexpected character: 千/);
        expect(error('百万')).toMatch(/Unexpected character: 百/);
    });

    it('進数リテラルには位を付けない', () => {
        expect(error('0xFF万')).toMatch(/Unexpected character: 万/);
    });

    it('位は数字と地続きでなければ読まない', () => {
        // 空白を挟んだ "3 百万" は、数と地の文が並んでいるだけ。ここを繋ぐと
        // 「合計 3 百万円です」のような文で 3 が 300 万に化ける。
        expect(error('3 百万')).toMatch(/Unexpected character: 百/);
    });

    it('位を重ねられるのは二段まで', () => {
        // 「千万」は受けるが、その先の「億」は位として読まない。曖昧な並びを
        // 黙って掛け算し続けると、3千万億 のような打ち間違いが 3e15 として通る。
        expect(error('3千万億')).toMatch(/Unexpected character: 億/);
        expect(error('3万万')).toMatch(/Unexpected character: 万/);
        expect(error('3百万百')).toMatch(/Unexpected character: 百/);
    });

    it('小数・符号・指数と組み合わせる', () => {
        expect(value('0.5万')).toBe(5000);
        expect(value('.5万')).toBe(5000);
        expect(value('-3百万')).toBe(-3000000);
        expect(value('3百万*0')).toBe(0);
        // 指数表記に位を足すと掛かる。実務で書く形ではないが、黙って片方を捨てない。
        expect(value('1e3万')).toBe(1e7);
    });

    it('位を掛けて double を超えたら値を返さない', () => {
        // 桁溢れは掛けた後にしか分からない。9e307 は有限だが、百万を掛けると Infinity。
        expect(error('9e307百万')).toMatch(/Number out of range/);
    });
});

describe('evaluateExpression — 変数 ans', () => {
    it('呼び出し側が渡した値を参照できる', () => {
        expect(value('ans+1', { ans: 41 })).toBe(42);
        expect(value('ans*ans', { ans: 3 })).toBe(9);
    });

    it('渡されていなければ未知の名前として扱う', () => {
        expect(error('ans+1')).toBe('Unknown name: ans');
    });

    it('変数は定数を上書きできる（履歴を持つのは呼び出し側の責務）', () => {
        expect(value('pi', { pi: 3 })).toBe(3);
    });
});

describe('evaluateExpression — エラー', () => {
    it('空入力', () => {
        expect(error('')).toBe('Empty expression');
        expect(error('   ')).toBe('Empty expression');
    });

    it('ゼロ除算', () => {
        expect(error('1/0')).toBe('Division by zero');
        expect(error('1%0')).toBe('Division by zero');
        expect(error('1/(2-2)')).toBe('Division by zero');
    });

    it('括弧の不一致', () => {
        expect(error('(1+2')).toMatch(/Expected \)/);
        expect(error('1+2)')).toMatch(/Unexpected token: \)/);
    });

    it('未知の名前と未知の文字', () => {
        expect(error('foo+1')).toBe('Unknown name: foo');
        expect(error('1 $ 2')).toBe('Unexpected character: $');
    });

    it('演算子だけ / 途中で終わる式', () => {
        expect(error('1+')).toBe('Unexpected end of expression');
        expect(error('*')).toMatch(/Unexpected/);
    });

    it('無限大になる式は結果として認めない', () => {
        expect(error('1e308*10')).toBe('Result is not a finite number');
        expect(error('1e999')).toMatch(/out of range/);
    });

    it('深すぎるネストはスタックを溢れさせずエラーになる', () => {
        // 素の再帰下降なら RangeError で落ちるところ。上限を超えたら普通のエラーで返す。
        const deep = '('.repeat(200) + '1' + ')'.repeat(200);
        expect(error(deep)).toBe('Expression is nested too deeply');
    });

    it('長すぎる入力は読まない', () => {
        expect(error('1+'.repeat(400) + '1')).toBe('Expression is too long');
    });

    it('文字列以外を渡しても throw しない', () => {
        expect(evaluateExpression(undefined as any).ok).toBe(false);
        expect(evaluateExpression(null as any).ok).toBe(false);
        expect(evaluateExpression(42 as any).ok).toBe(false);
    });
});

describe('evaluateExpression — 小数', () => {
    // 評価は double をそのまま返し、見た目のノイズを落とすのは formatCalcNumber の役目。
    // ユーザーが目にするのは整形後なので、小数はそちらで突き合わせる。
    const shown = (src: string) => formatCalcNumber(value(src) as number);

    it('小数どうしの四則が、整形後に浮動小数のノイズを見せない', () => {
        expect(shown('0.1+0.2')).toBe('0.3');
        expect(shown('1.1*3')).toBe('3.3');
        expect(shown('4.2-0.2')).toBe('4');
        expect(shown('0.3/0.1')).toBe('3');
        expect(shown('0.1*3')).toBe('0.3');
        // 評価の生の値にはノイズが残っている（整形が効いていることの裏取り）。
        expect(value('0.1+0.2')).not.toBe(0.3);
    });

    it('小数の剰余と冪乗', () => {
        expect(value('5.5%2')).toBe(1.5);
        expect(shown('5.1%2')).toBe('1.1');
        expect(value('6.25^0.5')).toBe(2.5);
        expect(value('2^0.5')).toBeCloseTo(Math.SQRT2, 12);
    });

    it('整数部・小数部が欠けた書き方', () => {
        expect(value('.25')).toBe(0.25);
        expect(value('0.')).toBe(0);
        expect(value('.5*.5')).toBe(0.25);
    });

    it('小数の桁は 12 桁まで残る', () => {
        expect(formatCalcNumber(value('1/3') as number)).toBe('0.333333333333');
        expect(value('1.23456789012')).toBe(1.23456789012);
    });

    it('非常に小さい小数も有限なら答えとして受ける', () => {
        const r = evaluateExpression('1e-320');
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.value).toBeGreaterThan(0);
    });

    it('小数には階乗もビット演算も使えない', () => {
        expect(error('2.5!')).toMatch(/non-negative integer/);
        expect(error('2.5 & 1')).toMatch(/32-bit/);
        expect(error('~1.5')).toMatch(/32-bit/);
    });

    it('小数の答えには進数を併記しない', () => {
        expect(describeCalcValue(12.5)).toBe('12.5');
    });
});

describe('evaluateExpression — 負の数', () => {
    it('負の数の四則', () => {
        expect(value('-5+3')).toBe(-2);
        expect(value('-5*-3')).toBe(15);
        expect(value('-7/2')).toBe(-3.5);
        expect(value('-7%3')).toBe(-1);
        expect(value('3-10')).toBe(-7);
    });

    it('負の数の関数と定数', () => {
        expect(value('abs(-2.5)')).toBe(2.5);
        expect(value('floor(-2.5)')).toBe(-3);
        expect(value('ceil(-2.5)')).toBe(-2);
        expect(value('round(-2.5)')).toBe(-2);   // JS の Math.round は 0 方向でなく +∞ 方向
        expect(value('trunc(-2.9)')).toBe(-2);
        expect(value('sign(-3)')).toBe(-1);
        expect(value('min(-5,3)')).toBe(-5);
        expect(value('avg(-5,5)')).toBe(0);
    });

    it('負の 16 進・2 進リテラル', () => {
        expect(value('-0xff')).toBe(-255);
        expect(value('-0b1010')).toBe(-10);
        expect(describeCalcValue(value('-0xff') as number)).toBe('-255 (-0xFF, -0b11111111)');
    });

    it('負の数のビット演算は符号つき 32 ビットとして扱う', () => {
        expect(value('-1>>1')).toBe(-1);        // 算術シフト
        expect(value('-8>>2')).toBe(-2);
        expect(value('-1 & 255')).toBe(255);
        expect(value('~2147483647')).toBe(-2147483648);
    });

    it('32 ビットの下限は演算に使えるが、上限を 1 超えると弾く', () => {
        // abs で範囲を見ていると下限 (-2147483648) だけが弾かれる。境界を両側から押さえる。
        expect(value('-2147483648 & 1')).toBe(0);
        expect(value('2147483647 & 1')).toBe(1);
        expect(error('2147483648 & 1')).toMatch(/32-bit/);
        expect(error('-2147483649 & 1')).toMatch(/32-bit/);
    });

    it('負の数の階乗と、答えが虚数になる式は認めない', () => {
        expect(error('(-3)!')).toMatch(/non-negative integer/);
        expect(error('sqrt(-1)')).toBe('Result is not a finite number');
        expect(error('(-8)^0.5')).toBe('Result is not a finite number');
        expect(error('ln(-1)')).toBe('Result is not a finite number');
    });

    it('負のゼロは 0 と表示する', () => {
        expect(formatCalcNumber(value('-0') as number)).toBe('0');
        expect(formatCalcNumber(value('0*-1') as number)).toBe('0');
        expect(describeCalcValue(-0)).toBe('0');
    });

    it('負の数を 0 で割ってもゼロ除算', () => {
        expect(error('-5/0')).toBe('Division by zero');
    });
});

describe('evaluateExpression — 数値でない文字', () => {
    it('絵文字はサロゲートを割らずに 1 文字として報告する', () => {
        // src[i] は UTF-16 の 1 単位なので、素直に載せると片割れ (豆腐) がエコー行に出る。
        expect(error('1+' + EMOJI)).toBe('Unexpected character: ' + EMOJI);
        expect(error(EMOJI)).toBe('Unexpected character: ' + EMOJI);
        expect(error(EMOJI + '+1')).toBe('Unexpected character: ' + EMOJI);
    });

    it('絵文字だけを並べても throw しない', () => {
        const many = EMOJI.repeat(30);
        expect(evaluateExpression(many).ok).toBe(false);
        expect(() => evaluateExpression(many)).not.toThrow();
    });

    it('日本語や記号は未知の文字として返す', () => {
        expect(error('あ')).toBe('Unexpected character: あ');
        expect(error('1 + 円')).toBe('Unexpected character: 円');
        expect(error('1 @ 2')).toBe('Unexpected character: @');
        expect(error('1 # 2')).toBe('Unexpected character: #');
        expect(error('"1"')).toBe('Unexpected character: "');
    });

    it('英字の並びは未知の名前として返す（1 文字ずつではなく語として）', () => {
        expect(error('total')).toBe('Unknown name: total');
        expect(error('1 + apple')).toBe('Unknown name: apple');
    });

    it('タブ・改行・全角スペースは区切りとして飛ばす', () => {
        expect(value('1\t+\n2')).toBe(3);
        expect(value('\r\n 6 * 7 ')).toBe(42);
        expect(value('1　+　2')).toBe(3);
    });

    it('NUL や制御文字は未知の文字として返す', () => {
        const r = evaluateExpression('1' + String.fromCharCode(0) + '2');
        expect(r.ok).toBe(false);
    });

    it('数値と数値でない文字が混ざっても答えを作らない', () => {
        expect(evaluateExpression('12abc').ok).toBe(false);
        expect(evaluateExpression('12' + EMOJI + '34').ok).toBe(false);
    });
});
