# ELEC-16 CODE（e16c）取扱説明書

e16c は、TypeScript の部分集合を ELEC-16 の機械語（E16）に翻訳するコンパイラです。ELEC-16 ペインの **CODE** 画面で TypeScript を書き、COMPILE を押すと、その場で E16 の機械語ができ、ポケコンの上で動きます。

この文書は、CODE 画面でプログラムを書く人のための手引きと参照です。設計と理由は [elec16.md](elec16.md) の §6「TypeScript から E16 アセンブリへ（e16c）」と「CODE 画面（段階 6）」にあります。ここに書いた例は、すべてこの文書を書いた時点（2026-10-04）のコンパイラで -O0・-O1・-O2 の 3 つの段階で翻訳し、機械で動かして確かめたものです。数字（バイト数とサイクル数）もそのときの実測です。

## 目次

1. [はじめに](#1-はじめに)
2. [CODE 画面の使い方](#2-code-画面の使い方)
3. [プログラムの形](#3-プログラムの形)
4. [型と読み方の決まり](#4-型と読み方の決まり)
5. [文と式](#5-文と式)
6. [組み込み関数](#6-組み込み関数)
7. [ライブラリと ROM サービス](#7-ライブラリと-rom-サービス)
8. [最適化の段階](#8-最適化の段階)
9. [大きさの上限とメモリ](#9-大きさの上限とメモリ)
10. [エラーメッセージ](#10-エラーメッセージ)
11. [例題](#11-例題)
12. [上級: asm、declare、ROM のバンク](#12-上級-asmdeclarerom-のバンク)
13. [付録: 機械語の約束](#13-付録-機械語の約束)

## 1. はじめに

### 1.1 e16c とは

- 書くのは **TypeScript の構文**です。構文の解析には TypeScript 自身の構文解析器を使います。ただし使えるのは一部で、型は ELEC-16 の 16 ビットのワードに合わせた `u16` `i16` `u8` `bool` だけです
- e16c は書かれたものを検査し、部分集合の外のものは**行と桁と理由を出して断ります**。断ったものは翻訳しません
- できた機械語は ELEC-16 の RAM の **7000 番地**から置かれ、BASIC の `CALL 28672`（28672 = 7000 の 16 進）か、モニタの `G 7000` で動きます
- あなたのコードが JavaScript として実行されることはありません。動くのは E16 の機械語としてだけです（-O2 の「コンパイル時の実行」も、e16c の中間表現を解釈する小さな実行器が手数の上限つきで行います）

### 1.2 いちばん大事な決まり: TypeScript でも機械でも同じ意味

e16c の部分集合は、**同じソースを TypeScript として動かしても、E16 の機械語として動かしても、同じ答えになる**ように作られています。ELEC-16 の BASIC の ROM はこの部分集合で書かれており、テストでは同じソースを TypeScript のまま動かした答えと、機械で動かした答えを比べています。

ところが TypeScript の数は 64 ビットの浮動小数点で、機械の数は 16 ビットのワードです。次のような場所で、二つの読み方は食い違います。

| 書いたもの | TypeScript では | 機械では |
|---|---|---|
| `7 / 2` | 3.5 | 3 |
| u16 の変数と `-1` の比較 | -1 のまま比べる | 65535 と比べる |
| `x << 16` | 65536 倍 | シフト量の下 4 ビットだけを使う |
| `true === 1` | 偽 | bool は 1 なので真 |
| `-1 >>> 1`（i16） | 2147483647 | 32767 |

e16c は、このように**読み方で答えが変わるものを見つけると断ります**。断られたときは、メッセージがどう書き直せばよいかを言います（`use div(a, b)`、`say which with i16()` など）。この文書のあちこちに出てくる決まりは、ほとんどがこの一つの原則から来ています。

ただし、e16c には値の大きさは分かりません。足し算や掛け算が 16 ビットを越えるかどうかは、書く人が `wrap16()` で示します（[4.9](#49-16-ビットの折り返しと-wrap16)）。

### 1.3 最初のプログラム

CODE 画面を初めて開くと、カードに `MAIN.TS` がなければ、次の見本（`SAMPLE`）が入っています。

```ts
// A program for the ELEC-16, in the subset of TypeScript e16c compiles.
// main() runs on CALL 28672 (BASIC) or G 7000 (the monitor), and returns to it.
// The library: putc puts cls locate newline putnum puthex getkey keyWaiting beep pset.

const GREETING = str('HELLO FROM TYPESCRIPT')

export function main(): void {
  cls()
  puts(GREETING)
  newline()
  for (let n: u16 = 1; n <= 10; n++) {
    putnum(n * n)
    putc(0x20)
  }
  newline()
}
```

- `str('…')` は文字列を機械語の後ろに置き、その**番地**（u16）を返します
- `export function main(): void` が入口です。`CALL 28672` で呼ばれ、終わると BASIC に戻ります
- `cls` `puts` `newline` `putnum` `putc` は、どのプログラムにも付いてくる**ライブラリ**の関数です（[7.1](#71-ライブラリの関数)）。import は要りません

COMPILE を押してから RUN ▸ を押すと、画面が MACHINE に戻り、次のように出ます。

```
HELLO FROM TYPESCRIPT
1 4 9 16 25 36 49 64 81 100
>
```

## 2. CODE 画面の使い方

### 2.1 開く

ELEC-16 ペインの帯にある **CODE** を押すと、ペイン全体が CODE 画面になります。同じ場所のボタン（CODE 画面では **MACHINE**）でポケコンに戻ります。CODE 画面が出ている間、機械は一時停止します（プロンプトで眠っていたなら、戻るとそのまま続きます）。

コンパイラ（TypeScript の構文解析器を含み、数 MB あります）は、CODE を初めて開いたときに読み込まれ、ページの Web Worker の中で動きます。

### 2.2 画面の各部

| 部分 | 働き |
|---|---|
| ファイルの選択 | カードにある `.TS` のファイルから選びます。選ぶ前に、今のソースをカードに書きます |
| new name | 新しいファイルの名前を打って Enter。英大文字と数字 8 字まで（`.TS` は自動で付きます）。カードにない名前は空のソースから始まります（`MAIN.TS` だけは見本から） |
| **COMPILE** | ソースをカードに書いてから、-O0・-O1・-O2 の 3 つを全部作り、それぞれを測ります。作っている間は COMPILING と出ます |
| **-O0 / -O1 / -O2** | 「選んでいる段階」を決めます。右のアセンブリ、エラーの一覧、RUN ▸・LOAD ▸・SAVE .BIN が使うのはこの段階です。選び直しても翻訳し直しはしません。新しいペインでは -O2 |
| **RUN ▸** | 選んでいる段階の機械語を機械に入れて、動かします（[2.5](#25-run--と-load-)） |
| **LOAD ▸** | 機械語を入れて、モニタで逆アセンブル（`U 7000`）を出します。動かしはしません |
| **SAVE .BIN** | 選んでいる段階の機械語を、カードに `.BIN` として書きます（[2.6](#26-save-bin-とカードのファイル)） |
| 左の欄 | TypeScript のソース |
| 右の欄 | 選んでいる段階の E16 アセンブリ（e16c の出力） |
| エラーの一覧 | `MAIN.TS:3:15` の形の場所と理由。場所を押すと、ソースのその位置にカーソルが移ります |
| 段階の表 | 段階ごとの **bytes**（機械語の大きさ）と **cycles to return**（`main` から戻るまでのサイクル数） |

RUN ▸・LOAD ▸・SAVE .BIN は、選んでいる段階がエラーなしでできたときだけ押せます。

### 2.3 COMPILE

COMPILE を押すと、次の順で進みます。

1. ソースが変わっていれば、カードの `.TS` に書きます。**ソースに機械の文字にない字があると、ここで止まります**（[2.6](#26-save-bin-とカードのファイル)）
2. あなたのソースとライブラリを、3 つの段階で翻訳します
3. 7000 番地に入口を付けてアセンブルし、機械語の領域（2,048 バイト）に収まるかを確かめます
4. できたものを、それぞれ測ります

**測り方**: 電源を入れて BASIC のプロンプトで眠った ELEC-16（既定のモデル、240×48）のスナップショットを作り、そこから `CALL` と同じように 7000 を呼んで、戻るまでのサイクル数を数えます。どの段階も同じスナップショットから始めます。表の cycles の欄は次のどれかです。

| 表示 | 意味 |
|---|---|
| `10,751` | `main` から戻った。入口と大域変数の初期化（`e16c_init`）を含むサイクル数 |
| `5,244 · waits for a key` | キーを待って眠った（測る機械にキーは来ないので、そこまでの数） |
| `> 20,000,000` | 2,000 万サイクルを過ぎても終わらない（無限ループなど） |
| `… · fault` | 例外で止まった |
| `—` | その段階は作れなかった |

WAIT のようにタイマーで眠るものは、測るときは待たずに時間を進めます。クロックは既定で 4 MHz なので、1 秒は 4,000,000 サイクル、1 フレーム（60 分の 1 秒）は約 66,667 サイクルです。

### 2.4 最適化の段階

| 段階 | ひとことで | 大きさ | 速さ |
|---|---|---|---|
| -O0 | 素直な翻訳。式は機械のスタックで、変数はメモリ | 大きい（ライブラリも全部入る） | 遅い |
| -O1 | 変数をレジスタに置き、比較と分岐を 1 命令に | 小さい | 速い |
| -O2 | -O1 に加えて、小さな関数の展開、定数の引数の呼び出しをコンパイル時に計算、使わない関数（ライブラリも）を消す | いちばん小さい | いちばん速い |

見本（`SAMPLE`）と、何もしないプログラム（`export function main(): void {}`）の実測です。

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| 見本: バイト | 1,404 | 420 | 176 |
| 見本: サイクル | 13,494 | 10,792 | 10,751 |
| 何もしない: バイト | 1,230 | 350 | 18 |
| 何もしない: サイクル | 30 | 16 | 16 |

見本のサイクルがあまり減らないのは、時間の大半が ROM の画面の処理（CLS と文字の表示）だからです。計算の多いプログラムでは差が大きくなります（エラトステネスのふるいで -O0 221,800 → -O1 27,534 サイクル。[11.5](#115-エラトステネスのふるい)）。詳しくは [8 章](#8-最適化の段階)。

### 2.5 RUN ▸ と LOAD ▸

RUN ▸ と LOAD ▸ は、選んでいる段階の機械語を機械に渡します。

1. ペインを MACHINE に戻します
2. 機械が動いていれば（BASIC のプログラムを実行中など）、まず BRK と同じことをします
3. 機械がプロンプトで眠るのを待ち（3 秒まで）、機械語を RAM の 7000 番地からに書きます
4. 人がキーを打つのと同じ形で、次を打ち込みます

| | BASIC のプロンプトでは | モニタのプロンプトでは |
|---|---|---|
| RUN ▸ | `CALL 28672` | `G 7000` |
| LOAD ▸ | `MON` を打ってから `U 7000` | `U 7000` |

LOAD ▸ はモニタの逆アセンブルを出すだけで、動かしません。PANEL の CORE で 7000 番地のあたりにブレークポイントを置いてから `G 7000` と打てば、一命令ずつ追えます。

RAM に書いた機械語は電池で保たれます。電源を切っても残り、`CALL 28672` で何度でも動かせます。

### 2.6 SAVE .BIN とカードのファイル

- **ソース（`.TS`）**: CODE 画面のソースは、ユニットの記憶カードの `.TS` ファイルです（既定 `MAIN.TS`）。COMPILE の前、ファイルを選び直す前、CODE 画面を離れるときに書きます。空行も残ります
- **SAVE .BIN**: 選んでいる段階の機械語を、同じ名前の `.BIN`（`MAIN.TS` なら `MAIN.BIN`）としてカードに書きます。書けると `Saved MAIN.BIN: CALL 28672 after LOAD "MAIN.BIN".` と出ます
- BASIC からは `LOAD "MAIN.BIN"`（.BIN の既定の読み込み先は 7000）のあと `CALL 28672` で動きます。FILES タブで .BIN の LOAD ▸ を押すと、`LOAD "MAIN.BIN":CALL 28672` を打ち込みます
- .BIN に入るのは 7000 からの機械語と文字列だけです。大域変数と配列（7800 から）は、動くたびに入口が初めの値を入れ直します

**ソースに書ける文字**: カードのファイルは ELEC-16 の文字で持つので、ソースに書けるのは **ASCII（20〜7E）と半角カナ**だけです（タブは空白になります）。漢字、ひらがな、全角の字は、コメントの中でも書けません。書くと COMPILE の前に次のように出て、翻訳しません。

```
Line 3 has "漢" (U+6F22), which the ELEC-16 cannot keep.
```

コメントは英語か半角カナで書いてください。カードは 1 ファイル 32 KB まで、全体で 256 KB です。

### 2.7 BASIC とモニタから動かす

CODE 画面を使わずに、自分で打っても同じです。

```
>CALL 28672
```

```
*G 7000
```

どちらも 7000 番地の入口を呼びます。入口は大域変数と配列を初めの値にしてから `main()` を呼び、`main` が戻ると BASIC かモニタのプロンプトに戻ります。ゲーム機 PLAY-320（[elec16-play.md](elec16-play.md)、作っている途中）では、RUN はページが 7000 番地を直接呼び、`main` が戻ると描いたものを残して止まり、BRK で起動画面に戻ります。PLAY-320 の ROM にはキーボードがないので、`getkey` と `readline`（と G4 までの `ask`）は -1 を返します。`pset` はポケコンの液晶の並びに書くので PLAY-320 では使えません（PLAY-320 の描画のライブラリは G7 で足します）。

### 2.8 BRK とプログラムの止め方

**BRK は、どこから動かしたプログラムでも止めます。** モニタの `G 7000` からでも、BASIC の `CALL 28672`（RUN ▸ もこれ）からでも、キーを待たずに回り続けるループの中でも、`BREAK AT 7010` のように場所を言ってモニタのプロンプトに落ちます。モニタの `R` で止まったときのレジスタが見られ、`Q` で BASIC に戻ります。

プログラムの中で BRK を受け取って自分で終わる必要はありません。ENTER などのキーで終わるようにしておけば十分です。

例外（奇数番地へのワードの読み書き、ROM への書き込み、知らない ROM サービスなど）が起きると、どちらから動かしていても、`FAULT 000B AT 7016` のように原因と場所を言ってモニタに落ちます。原因の番号は 2 不正な命令、4 / 6 境界外れの読み / 書き、7 ROM への書き込み、B 知らない ECALL です。

## 3. プログラムの形

### 3.1 main と入口

- プログラムには `export function main(): void` が要ります。ないと `there is no main: export function main(): void` と出ます
- **`export` を付けてください**。付けないと、どの段階でも「main is not exported: export function main(): void」と言って作りません（付けないと -O2 が「どこからも呼ばれない関数」として消してしまうため）
- 7000 番地には e16c が入口を置きます。入口は `e16c_init`（大域変数と配列を初めの値に）を呼び、次に `main` を呼び、戻ります。右の欄のアセンブリには入口は出ません

### 3.2 関数

```ts
function gcd(a: u16, b: u16): u16 {
  while (b !== 0) {
    const t = b
    b = a % b
    a = t
  }
  return a
}
```

- 引数は **4 つまで**（`a function takes at most four arguments`）。引数には型を書きます
- 戻り値の型は `void` か、`u16` `i16` `u8` `bool` のどれか。配列は返せません（`a function returns a word, not an array`）。戻り値の型を書かなければ `void` です
- 値を返す関数が最後まで行くと 0 を返します
- 再帰できます。関数はどの順に書いても、互いに呼べます
- 関数の中に関数は書けません。アロー関数、クロージャもありません
- 引数は値渡しで、関数の中で書き換えても呼んだ側は変わりません。配列を渡すと番地が渡るので、要素の書き換えは呼んだ側に見えます（[3.4](#34-配列-bytes-と-words)）

### 3.3 定数と大域変数

```ts
const START: u16 = 100   // a constant: no RAM, its value is used where it is named
let runs: u16 = 0        // a global in RAM (from 7800)
let total: u16 = START
```

- **最上位の `const`** は、コンパイル時に決まる値の名前です。RAM を使いません。式は書けますが、コンパイル時に分かるものだけです（`const TWICE = LIMIT * 2` は可、`peek()` や関数の呼び出しは不可）
- **最上位の `let`** は RAM の大域変数（1 つ 2 バイト）です。初めの値も、コンパイル時に分かる値だけです（`a top-level value must be known while compiling`）
- 大域変数は**動くたびに**入口が初めの値に戻します。前に動かしたときの値は残りません
- 最上位の定数と変数は、宣言した後でしか使えません（`const A = B + 1` の後に `const B = 2` は `B is not known`）。関数の本体からは、どこで宣言したものでも使えます
- 最上位に書けるのは、関数、変数と定数の宣言、import、型の宣言（無視されます）、`export { … }` だけです。最上位に文（`putc(65)` など）は書けません

### 3.4 配列: bytes と words

```ts
const marks = bytes(8)   // 8 bytes in RAM: a u8[]
const table = words(4)   // 4 words in RAM: a u16[]
```

- 配列は**最上位で** `bytes(n)` か `words(n)` で作ります。RAM の決まった場所に置かれ、大きさは変わりません。関数の中では作れません（`bytes is only for a top-level const`）
- 数は**数字で**書きます。定数の名前は使えません（`const N = 10` のあと `bytes(N)` は `bytes takes a count`）
- 要素の型は `bytes` が `u8`、`words` が `u16` です。`a[i]` で読み書きします
- 配列は動くたびに 0 で埋められます
- **添字の範囲は確かめません**。外を書くと、ほかの変数を壊します
- 配列は数ではありません。番地が欲しいときは `addr(a)` です（`an array is not a number: use addr(a) for its address`）
- 関数の引数の型に `u8[]` `u16[]` を書けば、配列を渡せます。番地が渡ります
- `.length` などのプロパティはありません

```ts
function total(a: u8[], n: u16): u16 {
  let s: u16 = 0
  for (let i: u16 = 0; i < n; i++) s += a[i]
  return s
}
```

### 3.5 文字列: str

- 文字列は `str('…')` で書きます。答えは**番地（u16）**で、文字のバイトの後ろに 0 が付きます。機械語の後ろ（7000 からの領域）に置かれ、同じ文字列は 1 度だけ置かれます
- 最上位の `const` にも、関数の中の式にも書けます。引数は文字列のリテラル 1 つだけです（`str takes one string literal`）
- 文字列をそのまま書くこと（`puts('HI')`）はできません（`StringLiteral is not in the subset`）。テンプレート文字列も同じです（`FirstTemplateToken is not in the subset`）
- 書けるのは機械の文字（ASCII と半角カナ）です。半角カナは機械の A1〜DF になります。それ以外の字は `"漢" is not in the machine's character set`
- `'\r'` のようなエスケープは使えます（`putc` と `puts` は CR で改行します）
- 文字列は機械語と同じ RAM にあり、書き換えはできますが、.BIN に入るのは最初の中身です

### 3.6 局所変数とスコープ

```ts
let x: u16 = 0      // a type and a value
let y = peek(0)     // the type from the value (here u16)
let z: u16          // a type with no value: starts at 0
const k = 3         // a known value: no register or memory at all
```

- 型も値もない `let x` は書けません（`x needs a type or a value`）
- `{ }` の中で宣言した変数は、その中だけで通じます。同じ名前を内側で宣言し直せます（外の名前は隠れます）
- 関数の中の `const` で値がコンパイル時に分かるものは、名前を付けた定数になり、場所を取りません

### 3.7 メモリの配置

| 番地 | 中身 |
|---|---|
| 7000–77FF | 入口、あなたの関数、使うライブラリの関数、文字列（2,048 バイト） |
| 7800–7BEF | 大域変数と配列（1,008 バイト）。宣言した順に置かれます |
| 7C00 より上 | スタック（8000 から下へ。BASIC やモニタと分け合います） |

例えば [11.8](#118-配列を関数に渡す) の `marks` は、最初の宣言なので `addr(marks)` が 7800 です。右の欄のアセンブリの先頭に、配列の番地（`marks = 0x7800 ; 8 bytes`）と大域変数の番地（`; runs at 0x7800`）が出ます。

## 4. 型と読み方の決まり

### 4.1 4 つの型と配列

| 型 | 中身 | 範囲 |
|---|---|---|
| `u16` | 符号なしのワード | 0〜65535 |
| `i16` | 符号付きのワード | -32768〜32767 |
| `u8` | バイト | 0〜255 |
| `bool`（`boolean` も可） | 真偽 | `true`（1）、`false`（0） |
| `u8[]` / `u16[]` | RAM の配列（中身は番地） | |

機械ではどれも 16 ビットのワードです。型が決めるのは「ワードをどう読むか」で、比較、割り算、右シフトの命令が符号付きか符号なしかが変わります。`number` や `string`、自分で付けた型の名前（`type Byte = u8`、interface）は使えません（`number is not a type of the subset (u16, i16, u8, bool, u8[], u16[])`）。

### 4.2 数の定数

- 数は 10 進、`0x`、`0b` で、0〜65535 の整数です。`70000` は `70000 is not a word`、小数も同じく断ります
- 数のリテラルは u16 です。`-1` は「u16 の定数 1 に負号」で、**型のない負の定数**は i16 として扱われます（`const LOW = -1`、`let k = -1` は i16）
- 定数はそれを入れる場所の範囲に収まらなければいけません: `let x: u16 = -1` は `-1 does not fit a u16`、`let g: u8 = 300` は `300 does not fit a u8`

### 4.3 型の決まり方

型を書かない変数は、最初の値から型が決まります。

| 値 | 変数の型 |
|---|---|
| u16 の値 | u16 |
| u8 の値（`peek()`、バイトの配列の要素など） | **u16**（後で大きな値を入れられるように） |
| 負の定数 | i16 |
| 比較、`!`、`&&`、`\|\|` | bool |
| i16 の値 | i16 |
| 配列 | その配列 |

式の型は次のとおりです: i16 どうし（または i16 と定数）の計算は i16、それ以外の計算は u16、比較は bool。`x & 0xff` のように 0〜255 の定数との AND は u8 です（バイトに収まることの書き方）。

### 4.4 符号付きと符号なしを混ぜない

i16 と符号なし（u16、u8）を一つの計算や比較に混ぜると断ります。

```ts
export function lessThan(a: i16, b: u16): bool {
  return a < b   // this mixes i16 and an unsigned value: say which with i16() or u16()
}
```

TypeScript で `-1 < 1` は真ですが、機械が符号なしで比べると 65535 < 1 で偽になるからです。どちらで読むかを `i16()` か `u16()` で書きます。

```ts
export function lessThan(a: i16, b: u16): bool {
  return a < i16(b)
}
```

（メッセージは「`as` で」と言いますが、i16 と u16 の読み替えは `as` ではできません。`i16()` か `u16()` を使ってください。[4.6](#46-as-と-u8-u16-i16)）

片方が定数なら混ぜてかまいません。`s < 0`（s が i16）は符号付きの比較です。

代入も同じです。i16 の値を u16 の変数に入れると `a i16 is not a u16: say which with u16()`、逆は `a u16 is not a i16: say which with i16()`。u8 を i16 に入れるのはかまいません（0〜255 はどちらでも同じ）。

`?:` の二つの答えが i16 と u16 のときも断ります（`one answer is signed and the other is not: say which with i16() or u16()`）。

二つの答えが定数の `?:` は、TypeScript と同じく数です。`true` と `false` なら bool、0〜255 の数どうしなら u8（u16 にも i16 にもそのまま入ります）、負の数があれば i16、それ以外は u16 です。`c ? 1 : 0` は数なので、外側の `?:` で 3 と並べることも、`let k = c ? 1 : 0` の後で `k = 7` とすることもできます。

### 4.5 定数はその読み方に収まること

比較、割り算と余り、右シフトでは、値の横に置く定数がその読み方の範囲に入っていなければ断ります。

```ts
let x: u16 = peek16(0)
if (x < -1) { }           // -1 is not a u16 here: say which with i16() or u16()

let s: i16 = -2
if (s < 40000) { }        // 40000 is not a i16 here: say which with i16() or u16()
```

u16 の -1 は、TypeScript では -1 のまま比べられ、機械では 65535 と比べられるからです。

二つとも定数でも同じです。`div(-7, 2)` は、`-7` も `2` も u16 の定数なので `-7 is not a u16 here` と断られます。符号付きで割りたいときは、型を書いた定数にします。

```ts
const a: i16 = -7
putint(div(a, 2))   // -3
putint(a % 2)       // -1
```

`switch` の `case` も同じで、u16 の値に `case -1:` は `-1 is not a u16` です。

### 4.6 as と u8() u16() i16()

読み方を変えるには組み込み関数を使います。TypeScript でも機械でも同じことをします。

| 書き方 | 意味 | 機械の命令 |
|---|---|---|
| `u8(x)` | 下位バイト（0〜255） | `andi` 1 つ |
| `u16(x)` | ワードを符号なしで読む（0〜65535） | なし |
| `i16(x)` | ワードを符号付きで読む（-32768〜32767） | なし |

`as` は、読み方が変わらないときだけ使えます: 同じ型か、`u8` や `bool` を `u16` に広げるとき。それ以外は断ります。

```ts
const x: u16 = 5
const s = x as i16   // a u16 read as a i16 differs in TypeScript: use u8(), u16() or i16()
const t = i16(x)     // this is the way
```

`i16(40000)` は -25536、`u16(-1)` は 65535 です。なお、`i16()` や `u8()` の答えはコンパイル時の定数にはならないので、最上位の `const` の値には使えません（`const NEG = i16(0xffff)` は `a top-level value must be known while compiling`。`const NEG = -1` と書きます）。

### 4.7 u8 の変数と配列の要素

- **u8 の変数には u8 の値しか入りません**。`let b: u8 = 0; b = b + 1` は `a u16 is not a u8: take its low byte with u8()` です。TypeScript では 256 がそのまま残り、機械では 0 になるからです。`b = u8(b + 1)` と書きます
- u8 の値は: `u8()`、`x & 0xff`（0〜255 の定数との AND）、`peek()`、バイトの配列の要素、0〜255 の定数、bool
- **配列の要素には、どんな値でも入れられます**。TypeScript（Uint8Array / Uint16Array）でも機械でも、要素の幅に切られるからです。`marks[0] = -1` は読むと 255、`marks[1] = 300` は 44 です

### 4.8 bool

- 比較、`!`、`&&`、`||` の答えは bool です。`&&` と `||` は、答えが決まったところで止まります
- **bool と数を `===` `!==` で比べることはできません**（`a bool is never 1 or 0 in TypeScript: compare it with a bool, or test it as it is`）。TypeScript では `true === 1` が偽だからです。`if (b)`、`if (!b)`、`b === true` と書きます
- bool の `switch` に数の `case` は書けません（`1 is not a bool`）
- 条件（`if`、`while`、`?:`）には、bool でも数でも書けます。0 でなければ真です

### 4.9 16 ビットの折り返しと wrap16

機械の計算は、いつも 16 ビットで折り返します（65535 + 1 は 0）。TypeScript の数は折り返しません。そこで、**16 ビットを越えうる計算は `wrap16()` で包む**のが決まりです。

```ts
n = wrap16(n + 1)
check = wrap16(check * 3 + buffer[i])
```

- `wrap16(x)` は機械では何もしません（命令は出ません）。TypeScript では `x & 0xffff` です
- e16c は値の大きさを知らないので、`wrap16` を忘れても断りません。機械の上では答えは同じですが、同じソースを TypeScript として動かすと食い違います
- 引き算で負になる u16（`a - b` で b が大きい）、u16 の `-x` と `~x`、i16 の計算が範囲を出るとき（`i16()` で読み直す）も同じです
- 配列の要素への代入と、`u8()`、`u16()`、`i16()` は、それ自体が切るので要りません

### 4.10 割り算、余り、シフト

- **`/` は使えません**（`/ gives a fraction in TypeScript: use div(a, b)`）。整数の割り算は `div(a, b)` です。0 に向かって切り捨てます
- `%` は使えます。i16 なら符号付き（答えの符号は割られる数と同じ。TypeScript と同じ）
- 定数の 0 で割ること（`div(w, 0)`、`w % 0`）は断ります（`a division by zero differs on the machine`）。変数が 0 のときの機械の答えは、商は全ビット 1、余りは割られる数です
- **符号付きの割り算で、割る数が 0 になりうる（定数でない）ときは `idiv(a, b)`** を使います。`div` は 0 で割ると 65535 を返しますが、機械はそれを i16 として -1 と読むので、答えが食い違います。`idiv` は 0 で割ると -1 を返し、両方で同じになります（`div(s, t)` と書くと `a signed division by what may be 0 differs: use idiv(a, b)`）。割る数が 0 でない定数なら、`div` のままで構いません
- 変数の割る数が 0 のときの `%` は、TypeScript では NaN、機械では割られる数です。`%` の割る数が 0 にならないようにしてください
- `>>` は、i16 なら算術シフト（符号を保つ）、u16 なら論理シフトです
- **i16 に `>>>` は使えません**（`>>> on an i16 differs in TypeScript: use >> or u16()`）
- 定数のシフト量は 0〜15 です（`a shift by 16 differs on the machine: 0 to 15`）。変数のシフト量は確かめませんが、機械は下 4 ビットしか使わないので、16 以上にしないでください
- `**` はありません

## 5. 文と式

### 5.1 使える文

| 文 | 注記 |
|---|---|
| `let` `const` | [3.6](#36-局所変数とスコープ) |
| 代入 `=` と `+=` `-=` `*=` `%=` `&=` `\|=` `^=` `<<=` `>>=` `>>>=` | 文としてだけ。`a = b = 2` や `while (x = 1)` は不可 |
| `++` `--` | 文としてだけ（`i++` も `++i` も）。`a[i]++` も可 |
| 関数の呼び出し | 値を捨ててよい |
| `if` / `else` | |
| `while` `do … while` `for` | `for (;;)` も可。`for … of` と `for … in` は不可 |
| `break` `continue` | ラベル付きは不可 |
| `switch` | `case` は定数だけ。`default`、`case` の重ね、落ちていくこと、可。`switch` の中の `continue` は外のループに（ループの外では不可） |
| `return` | |
| `` asm`…` `` | [12 章](#12-上級-asmdeclarerom-のバンク) |

### 5.2 演算子

| 種類 | 演算子 |
|---|---|
| 算術 | `+` `-` `*` `%`（`/` の代わりに `div()`） |
| ビット | `&` `\|` `^` `~` `<<` `>>` `>>>` |
| 比較 | `===` `!==` `<` `<=` `>` `>=`（`==` `!=` は `===` `!==` と同じ） |
| 論理 | `&&` `\|\|` `!` |
| 条件 | `?:` |
| 単項 | `-` `+` `~` `!` |
| 型 | `as`（[4.6](#46-as-と-u8-u16-i16)）、`!`（後置。何もしない） |
| 添字 | `a[i]` |

定数どうしの計算は、どの段階でもコンパイル時に済ませます。

### 5.3 使えないもの

| 書いたもの | メッセージ |
|---|---|
| オブジェクト `{ a: 1 }`、配列リテラル `[1, 2]` | `ObjectLiteralExpression is not in the subset` など |
| `class` | `ClassDeclaration is not in the subset at the top level` |
| interface の型、`.` でのプロパティ | `P is not a type of the subset …`、`PropertyAccessExpression is not in the subset` |
| アロー関数、関数の中の関数 | `ArrowFunction is not in the subset`、`FunctionDeclaration is not in the subset` |
| 文字列のリテラル、テンプレート文字列 | `StringLiteral is not in the subset`、`FirstTemplateToken is not in the subset`（`str()` を使う） |
| `try` / `catch`、例外 | `TryStatement is not in the subset` |
| ラベル | `LabeledStatement is not in the subset` |
| `for … of` | `ForOfStatement is not in the subset` |
| 分割代入 | `destructuring is not in the subset` |
| 値としての `++` `--` `=` | `PostfixUnaryExpression is not in the subset`、`++ and -- are statements here, not values`、`an assignment is a statement here, not a value` |
| `**` | `** is not in the subset` |
| 浮動小数点、async、ジェネレータ、GC のあるもの | 部分集合の外 |

## 6. 組み込み関数

どのプログラムでも、宣言せずに使えます。同じ名前の関数や変数は作れません（`peek is a built-in`）。

| 関数 | 答え | 意味 | 機械では |
|---|---|---|---|
| `peek(a)` | u8 | 番地 a のバイト | `lbu` |
| `poke(a, v)` | なし | 番地 a に v の下位バイトを書く | `sb` |
| `peek16(a)` | u16 | 番地 a のワード（リトルエンディアン）。**a は偶数** | `lw` |
| `poke16(a, v)` | なし | 番地 a にワードを書く。**a は偶数** | `sw` |
| `div(a, b)` | u16 / i16 | 整数の割り算（0 に向かって切り捨て）。両方 i16（か i16 と定数）なら符号付き。符号付きで割る数が定数でないときは `idiv` | `divu` / `div` |
| `idiv(a, b)` | i16 | 符号付きの割り算。0 で割ると -1、-32768 ÷ -1 は -32768（機械と同じ） | `div` |
| `wrap16(x)` | u16 | 16 ビットに折り返す（[4.9](#49-16-ビットの折り返しと-wrap16)） | なし |
| `u8(x)` | u8 | 下位バイト | `andi` |
| `u16(x)` | u16 | 符号なしで読む | なし |
| `i16(x)` | i16 | 符号付きで読む | なし |
| `memcpy(to, from, n)` | なし | from から to へ n バイト写す。重なっていても全部正しく写る（memmove と同じ） | `MCPY` 1 命令 |
| `memset(to, value, n)` | なし | to から n バイトを value の下位バイトで埋める | `MSET` 1 命令 |
| `ecall(n, …)` | u16 | ROM サービス n を呼ぶ。引数は 4 つまで、答えは a0 | `ecall` |
| `csrr(n)` | u16 | CSR n を読む。n は定数 | `csrr` |
| `csrw(n, v)` | なし | CSR n に書く。n は定数 | `csrw` |
| `wfi()` | なし | 許可された割り込み（ROM はキーとカード）が来るまで眠る | `wfi` |
| `addr(a)` | u16 | 配列の番地 | |
| `bytes(n)` / `words(n)` | 配列 | 最上位の宣言でだけ（[3.4](#34-配列-bytes-と-words)） | |
| `str('…')` | u16 | 文字列の番地（[3.5](#35-文字列-str)） | |
| `` asm`…` `` | なし | アセンブリを書く（[12 章](#12-上級-asmdeclarerom-のバンク)） | |

補足:

- **ワードの番地は偶数**です。奇数番地の `peek16` / `poke16` は機械で例外になり、モニタに落ちます（`FAULT 0004` / `FAULT 0006`）
- **8000 番地より上（ROM）に書くと**例外です（`FAULT 0007`）。I/O（FF00〜）への書き込みはデバイスに届きます
- `memcpy` と `memset` の番地と数は u16 です。i16 を渡すと `say which with u16()`、配列をそのまま渡すと `is not a u16`（`addr()` を使う）。命令は 1 回に 8 バイトずつ進むので、長い転送の途中でも割り込みや BRK が入れます。MCPY は 1 バイト 2 サイクル、MSET は 1 サイクル（と 8 バイトごとに 1）
- `ecall` は ROM サービスの番号と、引数 4 つまで（`ecall takes a service and up to four arguments`）。番号は t0、引数は a0〜a3 に入ります
- `csrr` と `csrw` の CSR は定数で書きます（`a CSR is named by a constant`）。読んで役に立つのは `0xc00`（cycle、サイクル数の下位 16 ビット）と `0xc02`（instret、命令数）です。`mie`（304）や `mtvec`（305）を書き換えると ROM が動かなくなることがあります
- `wfi()` は、キーを待つ間に CPU を回し続けずに眠るためのものです

## 7. ライブラリと ROM サービス

### 7.1 ライブラリの関数

CODE のプログラムには、`ELEC16` という名前のライブラリがいつも一緒に翻訳されます（`code-area.ts` の `LIBRARY`）。import は要りません。同じ名前の関数は作れません（`putc is declared twice`）。ライブラリの中で起きたエラーは、ファイル名 `ELEC16` で出ます。

| 関数 | 意味 |
|---|---|
| `putc(c: u16): void` | 文字を 1 つ出す。CR（0x0D）は改行、BS（0x08）は戻って消す、CLS（0x0C）は画面を消す |
| `puts(text: u16): void` | 番地 text から 0 までの文字を出す |
| `getkey(): u16` | キーを待ち、その文字を返す（[7.3](#73-キーのコード)） |
| `cls(): void` | 画面を消し、カーソルを左上に |
| `locate(column: u16, row: u16): void` | カーソルを桁と行へ（画面の中に収める） |
| `puthex(v: u16): void` | 4 桁の 16 進で出す |
| `newline(): void` | 次の行の頭へ（下端なら画面を送る） |
| `putnum(v: u16): void` | 10 進で出す（0〜65535。負の数は [11.6](#116-符号付きの数を書く)） |
| `keyWaiting(): bool` | キーの FIFO にキーがあるか（待たない） |
| `beep(freq: u16, ms: u16): void` | freq Hz の音を ms ミリ秒鳴らし始める。鳴り終わるのは待たない |
| `pset(x: u16, y: u16): void` | 液晶の点 (x, y) を点ける。画面の外は何もしない。4 階調のモデルでは一番濃く |
| `readline(buf: u16, max: u16): i16` | 1 行を打ってもらい、buf に 0 で終わる字で入れる。答えは字数、-1 CLS、-2 BRK（BASIC から）、-3 MODE |
| `ask(question: u16, reply: u16, max: u16): i16` | AI に聞く（LINK）。問いは 0 で終わる字、答えは reply に max バイトまで、0 で終わる。答えは長さ、負なら -STATUS（[7.5](#75-ai-に聞くask)） |
| `askAs(type: u16, question: u16, reply: u16, max: u16): i16` | タイプを選んで AI に聞く（0 NORMAL 〜 10 WEATHER） |
| `askNew(): void` | AI との会話を忘れ、次から新しい会話にする |

ライブラリは export されていないので、-O2 は使わない関数を消します。-O0 と -O1 では全部が入ります（何もしないプログラムでも -O0 で 1,542 バイト、-O1 で 478 バイト）。

### 7.2 ROM サービス（ECALL）

ライブラリの多くは、ROM サービスを `ecall` で呼んでいるだけです。直接呼ぶこともできます。

| 番号 | サービス | 引数 | 答え |
|---|---|---|---|
| 0 | PUTC | a0: 文字 | |
| 1 | PUTS | a0: 0 で終わる文字の番地 | |
| 2 | GETKEY | | キーの文字（待つ） |
| 3 | CLS | | |
| 4 | LOCATE | a0: 桁、a1: 行 | |
| 5 | PUTHEX | a0: ワード | |
| 6 | NEWLINE | | |
| 7 | READLINE | a0: バッファの番地、a1: 最大の字数 | 打った字数。-1 CLS、-2 BRK（BASIC から）、-3 MODE |
| 8 | LINK | a0: 問い、a1: 答えの置き場、a2: 最大バイト数、a3: サービス × 256 ＋ タイプ | 答えの長さ。負なら -STATUS |

- READLINE は打つ字を画面に出し、BS で消せます。バッファには打った字と、その後ろに 0 が入るので、バッファは最大の字数 + 1 バイト要ります。答えは負の数があるので `i16(ecall(7, …))` で読みます（[11.7](#117-名前を尋ねる)）
- 9 以上の番号は例外になり、`FAULT 000B` でモニタに落ちます
- ECALL の間も BRK は効きます（キーを待っているときを含む）

### 7.3 キーのコード

`getkey()` が返す値です。

| キー | 値 |
|---|---|
| 英字 | その文字。CAPS（起動時は掛かっている）と SHIFT のどちらか一方が掛かっていれば大文字 |
| 数字、記号 | その文字。SHIFT 面の記号は SHIFT を付けて |
| SPACE | 0x20 |
| ENTER | 0x0D |
| BS / DEL / INS | 0x08 / 0x0F / 0x0E |
| CLS / MODE / ANS | 0x0C / 0x10 / 0x14 |
| ← → ↑ ↓ | 0x1C / 0x1D / 0x1E / 0x1F |
| カナ | A1〜DF（KANA モードで） |
| BRK（BASIC から動かしているとき） | 0x03 |

SHIFT、CAPS、カナのキーは `getkey` の中でモードを変えるだけで、値としては返りません。そのため `keyWaiting()` が真でも、それが SHIFT だけなら、`getkey()` は次のキーを待ちます。

### 7.4 I/O と画面のメモリ

`peek16` / `poke16` で直接読み書きできる主なものです（全体は [elec16.md](elec16.md) §5）。

| 番地 | 名前 | 中身 |
|---|---|---|
| FF12 | KEYCOUNT | FIFO にあるキーの数 |
| FF14–FF1D | KEYMAT | 押し続けているキーの行列（ゲーム用、バイトで読む） |
| FF20 / FF22 / FF24 | WIDTH / HEIGHT / DEPTH | 液晶の幅と高さ（ドット）、1 ドットのビット数 |
| FF2A | CURSOR | カーソルの位置（下位が桁、上位が行） |
| FF2C | CURMODE | カーソルの形（0 なし、1 下線、2 ブロック、+4 で点滅） |
| FF30 | TCOUNT | 1 秒に 1,024 進むカウンタ（ホストの時刻で進む） |
| FF38–FF3E | CLOCK | 秒、分、時、日、月、年 − 2000、曜日（バイト） |
| FF40 / FF42 | FREQ / DUR | ブザーの周波数と長さ（DUR を書いた時から鳴る） |
| E000– | VRAM | 液晶。幅 × (高さ ÷ 8) バイトで、1 バイトが縦 8 ドット（ビット 0 が上）。8 ドットの 1 段（文字 1 行）が幅のバイト数 |

既定のモデル（240×48）では、画面は 40 桁 6 行、VRAM は E000 から 1,440 バイトです。モデルによって大きさが違うので、WIDTH と HEIGHT を読んで合わせてください。

### 7.5 AI に聞く（ask）

`ask` は、ELEC-16 の LINK（[E16 マニュアル](elec16-e16.md) §4.8）で、elecdex の設定の AI に問いを渡します。使う前に PANEL の LINK で LINK と AI を ON にし、プロバイダを選んでおきます。

```ts
// 打った問いを AI に聞いて、答えを出す。何も打たずに ENTER で終わる。
const line = bytes(41)
const answer = bytes(201)

export function main(): void {
  askNew()
  for (;;) {
    putc(0x3f)
    const n = readline(addr(line), 40)
    newline()
    if (n <= 0) return
    const got = ask(addr(line), addr(answer), 200)
    if (got < 0) {
      puts(str('LINK FAILED'))
    } else {
      puts(addr(answer))
    }
    newline()
  }
}
```

- 答えは液晶の文字（ASCII と半角カナ）だけで、`max` バイトまでです。置き場は `max` ＋ 1 バイト要ります（終わりの 0）
- 問いにカナがあればカナで、なければ英語で答えます。`askAs(8, …)`（TRANS）は逆の言葉に訳します
- 負の答えは -STATUS です: -2 OFF（LINK が OFF）、-3 HELD（前の `ask` の後に人がキーを押していない）、-4 FAILED、-5 BAD REQUEST、-7 CANCELLED。HELD があるので、プログラムが続けて `ask` しても 2 回目は送られません。上の例のように、問いを打ってもらってから聞きます
- 待つ間、機械は WFI で眠ります。BRK で止めるとモニタに落ち、問いは取り消されます
- TypeScript として動かすと、`ecall` は 0 を返すので `ask` の答えは 0（空の答え）です

## 8. 最適化の段階

### -O0: 素直な翻訳

式の値はすべて機械のスタックに積んで下ろし、局所変数は fp（s0）の下のフレームに置きます。読みやすく、e16c の中間表現（スタック型のバイトコード）がそのまま見えます。ライブラリも全部入るので、大きなプログラムは機械語の領域に入らないことがあります（[11.1](#111-pset-で線を引く) は -O0 で 2,342 バイトになり作れません）。

### -O1: レジスタと分岐

- 局所変数は、使う回数の多い順に s0〜s3 に置き、残りはフレームに
- 定数、変数、番地は要るまでレジスタに載せない（`x + 1` は `addi` 1 つ、`if (a < b)` は分岐 1 つ）
- 条件は値にせず分岐にする。`&&` `||` は互いを飛び越す分岐、ループは足元で確かめる（1 周に分岐 1 つ）
- 何も呼ばない関数（葉）は、引数を来たレジスタのまま使い、保存も移しもしない
- 定数の掛け算はシフトと加減算に、符号なしの 2 の累乗での割り算と余りは `srli` と `andi` に
- 配列の要素 `buffer[i + 1]` は `lbu t0, buffer+1(s1)` のように 1 命令に

### -O2: 展開とコンパイル時の計算

-O1 の前に、中間表現を書き換えます。

- **定数の引数で呼ばれる純粋な関数を、コンパイル時に実行**して答えの定数にします。純粋とは、大域変数、メモリ、配列、文字列、ECALL、CSR、アセンブリに触れず、純粋な関数しか呼ばないこと。手数は 10 万操作までで、越えれば呼び出しのまま残します
- 何も呼ばない小さな関数を展開します: 4 操作までならすべての呼び出しに、24 操作までなら呼ぶ所が 1 つだけで export していないとき（元の関数は消えます）
- 定数の畳み込み、`x + 0` や `x * 1` を消す、定数の条件の分岐、届かないコード、飛ぶだけのジャンプを消す
- **export していない、どこからも呼ばれない関数を消します**（使わないライブラリの関数も）。`main` に `export` が要るのはこのためです

### 同じプログラムの 3 つの段階

```ts
function fact(n: u16): u16 {
  if (n <= 1) return 1
  return wrap16(n * fact(n - 1))
}

export function main(): void {
  putnum(fact(8))
  newline()
}
```

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| バイト | 1,400 | 402 | 90 |
| サイクル | 2,484 | 1,449 | 1,203 |

-O1 の `fact` は次のようになります（右の欄に出るとおり。`;` の行は元のソースの行です）。

```
; MAIN.TS:1 fact(n) at -O1
;   n in s1
fact:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; MAIN.TS:2  if (n <= 1) return 1
  li t0, 1
  bltu t0, s1, .L1
  ; MAIN.TS:2  return 1
  li a0, 1
  j .return
.L1:
  ; MAIN.TS:3  return wrap16(n * fact(n - 1))
  addi a0, s1, -1
  call fact
  mul a0, s1, a0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret
```

-O2 では `fact(8)` がコンパイル時に計算され、`fact` そのものが消えて、`main` は次だけになります。

```
main:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; MAIN.TS:7  putnum(fact(8))
  li a0, 40320
  call putnum
  ; MAIN.TS:8  newline()
  ; ELEC16:8  ecall(6)
  li t0, 6
  ecall
  ...
```

`newline` も展開されて、ECALL が直接書かれています。

### どの段階を使うか

ふつうは **-O2** を使ってください。-O0 と -O1 は、翻訳の仕組みを見比べたり、-O2 の展開で追いにくくなったコードを読むためのものです。3 つの段階は同じ答えを出すことを、テストが確かめています。

## 9. 大きさの上限とメモリ

| もの | 上限 | 越えたとき |
|---|---|---|
| 機械語と文字列（7000–77FF） | 2,048 バイト | `the program is 2342 bytes: the code area holds 2048` |
| 大域変数と配列（7800–7BEF） | 1,008 バイト | `the data area (0x7800-0x7bf0) is full`（入らなかった最初の宣言の場所で） |
| 関数の引数 | 4 つ | `a function takes at most four arguments` |
| ECALL の引数 | 4 つ | `ecall takes a service and up to four arguments` |
| 数 | 0〜65535 | `70000 is not a word` |
| ソースの .TS | 32 KB | カードに書けない |

- 大域変数は 1 つ 2 バイト（u8 でも）、配列は偶数バイトに切り上げます。`bytes(1008)` は入り、`bytes(1009)` は入りません
- **スタック**は 8000 から下へ伸び、BASIC やモニタと分け合います。使えるのは 7C00 までのおよそ 1 KB で、BASIC から呼ぶとその一部は BASIC が使っています。深い再帰はスタックがデータ領域を壊すので避けてください。-O1 の `fact` は 1 段 4 バイトです
- 計測は 2,000 万サイクルで打ち切ります（4 MHz で 5 秒）。機械の上では打ち切りはありません
- 一つの式の中で、分岐をまたいで持つ値が多すぎると（7 つまで）、-O1 と -O2 は翻訳を止めます（`an expression in … keeps more than 7 values across a branch`）。式を分けて局所変数に入れてください

## 10. エラーメッセージ

エラーは `ファイル:行:桁 理由` で出ます。行が 0 のもの（大きさ、アセンブル）はファイル名だけです。

| メッセージ | 意味と直し方 |
|---|---|
| `there is no main: export function main(): void` | `main` がない |
| `main is not exported: export function main(): void` | `main` に `export` がない |
| `undefined symbol 名前` | `declare function` した関数がない（[12 章](#12-上級-asmdeclarerom-のバンク)） |
| `the program is N bytes: the code area holds 2048` | 機械語の領域に入らない。-O2 にするか、プログラムを小さく |
| `the data area (0x7800-0x7bf0) is full` | 大域変数と配列が 1,008 バイトを越えた |
| `/ gives a fraction in TypeScript: use div(a, b)` | `/` の代わりに `div(a, b)` |
| `this mixes i16 and an unsigned value: say which with` … | i16 と u16 を混ぜた。`i16()` か `u16()` で読み方を書く |
| `N is not a u16 here: say which with i16() or u16()` | 比較・割り算・シフトの定数が読み方の範囲の外 |
| `N is not a i16 here: say which with i16() or u16()` | 同上 |
| `N does not fit a u16`（u8、bool） | 定数が入れる場所の範囲の外 |
| `a i16 is not a u16: say which with u16()` | 符号付きの値を符号なしの場所へ |
| `a u16 is not a u8: take its low byte with u8()` | u8 の変数には `u8()` で |
| `a u16 read as a i16 differs in TypeScript: use u8(), u16() or i16()` | `as` で読み方は変えられない |
| `one answer is signed and the other is not: say which with i16() or u16()` | `?:` の答えの型が違う |
| `an array is not a number: use addr(a) for its address` | 配列を数として使った |
| `a bool is never 1 or 0 in TypeScript: compare it with a bool, or test it as it is` | bool を数と比べた |
| `>>> on an i16 differs in TypeScript: use >> or u16()` | i16 に `>>>` |
| `a shift by N differs on the machine: 0 to 15` | 定数のシフト量が 16 以上 |
| `a division by zero differs on the machine` | 定数の 0 で割った |
| `N is not a word` | 0〜65535 の整数でない数 |
| `X is not a type of the subset (u16, i16, u8, bool, u8[], u16[])` | 使えない型 |
| `X is not in the subset` | 部分集合の外の構文（[5.3](#53-使えないもの)） |
| `X is not in the subset at the top level` | 最上位に書けないもの |
| `x needs a type or a value` | `let x` に型も値もない |
| `x is declared twice` | 同じ名前（ライブラリの関数の名前を含む） |
| `x is a built-in` | 組み込み関数の名前 |
| `x is not known` | 宣言されていない名前 |
| `x cannot be assigned` | 定数や関数に代入した |
| `x is a function, not a value` | 関数を値として使った |
| `f takes N arguments` | 引数の数が違う |
| `this call gives no value` | `void` の関数の答えを使った |
| `this function returns a value` / `returns nothing` | `return` と戻り値の型が合わない |
| `a top-level value must be known while compiling` | 最上位の値がコンパイル時に分からない |
| `bytes takes a count` / `bytes is only for a top-level const` | `bytes(n)` は最上位で、数字で |
| `str takes one string literal` | `str()` の引数 |
| `"字" is not in the machine's character set` | 文字列に機械にない字 |
| `a case must be a constant` | `case` に変数 |
| `continue inside a switch is not in the subset` | ループの外の `switch` で `continue` |
| `not inside a loop or a switch` | ループの外の `break` |
| `a CSR is named by a constant` | `csrr` / `csrw` の番号が変数 |
| `the source nests too deeply` | 括弧や式の入れ子が深すぎる |
| `Line N has "字" (U+XXXX), which the ELEC-16 cannot keep.` | ソースに機械の文字にない字（COMPILE の前、カードに書くとき） |
| `The compiler could not run: …` | コンパイラの Worker が動かなかった |

## 11. 例題

どれも 3 つの段階で翻訳し、機械で動かして確かめたものです（[11.1](#111-pset-で線を引く) だけは -O0 では大きすぎます）。表の数字は COMPILE の表と同じものです。

### 11.1 pset で線を引く

画面の縁と 2 本の対角線を、Bresenham の方法で引きます。終わるとキーを待ち、押すと画面を消して戻ります。符号付きの計算（i16）の例でもあります。

```ts
// Lines with pset: a frame round the screen and its two diagonals.
function line(x0: i16, y0: i16, x1: i16, y1: i16): void {
  const dx: i16 = x1 > x0 ? x1 - x0 : x0 - x1
  const dy: i16 = y1 > y0 ? y0 - y1 : y1 - y0
  const sx: i16 = x0 < x1 ? 1 : -1
  const sy: i16 = y0 < y1 ? 1 : -1
  let err: i16 = dx + dy
  let x = x0
  let y = y0
  while (true) {
    pset(u16(x), u16(y))
    if (x === x1 && y === y1) break
    const e2: i16 = err * 2
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
  }
}

export function main(): void {
  cls()
  const right = i16(peek16(0xff20) - 1)
  const bottom = i16(peek16(0xff22) - 1)
  line(0, 0, right, 0)
  line(right, 0, right, bottom)
  line(right, bottom, 0, bottom)
  line(0, bottom, 0, 0)
  line(0, 0, right, bottom)
  line(0, bottom, right, 0)
  getkey()
  cls()
}
```

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| バイト | 2,342（入らない） | 648 | 434 |
| サイクル | — | 96,718 · waits for a key | 94,955 · waits for a key |

-O0 では `the program is 2342 bytes: the code area holds 2048` と出ます。-O1 か -O2 を選んでください。

### 11.2 矢印キーで動かす

`*` を矢印キーで左右に動かし、端では音を鳴らします。ENTER で終わります（BRK ならどこでもモニタで止まります。[2.8](#28-brk-とプログラムの止め方)）。

```ts
// A star moved by the arrow keys; ENTER ends.
const LEFT = 0x1c
const RIGHT = 0x1d
const ENTER = 0x0d
const STAR = 0x2a
const SPACE = 0x20

export function main(): void {
  cls()
  puts(str('ARROWS MOVE, ENTER ENDS'))
  const columns = div(peek16(0xff20), 6)
  let x: u16 = div(columns, 2)
  let going = true
  while (going) {
    locate(x, 2)
    putc(STAR)
    const k = getkey()
    locate(x, 2)
    putc(SPACE)
    switch (k) {
      case LEFT:
        if (x > 0) x--
        else beep(220, 50)
        break
      case RIGHT:
        if (x < columns - 1) x++
        else beep(220, 50)
        break
      case ENTER:
        going = false
        break
    }
  }
  cls()
}
```

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| バイト | 1,804 | 524 | 290 |
| サイクル | 5,465 · waits for a key | 5,266 · waits for a key | 5,244 · waits for a key |

文字は 6 ドット幅なので、桁の数は画面の幅 ÷ 6 です。

### 11.3 キーを待たずに数える

`keyWaiting()` でキーが来たかだけを見て、待たずに数え続けます。キーが来たら、そのキーを `getkey()` で取ってから終わります。キーを待たないループでも、BRK を押せばモニタで止まります（[2.8](#28-brk-とプログラムの止め方)）。

```ts
// Counts until a key is pressed, without waiting for one.
export function main(): void {
  cls()
  puts(str('PRESS A KEY'))
  let n: u16 = 0
  while (!keyWaiting()) {
    locate(0, 1)
    putnum(n)
    n = wrap16(n + 1)
  }
  getkey()
  newline()
}
```

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| バイト | 1,360 | 406 | 168 |
| サイクル | > 20,000,000 | > 20,000,000 | > 20,000,000 |

測る機械にはキーが来ないので、計測は打ち切りになります。

### 11.4 memset と memcpy

`memset` でダッシュの行を作り、`memcpy` で文字列をその中に写します。最後に、VRAM の 2 行目（文字の 1 行は幅のバイト数）を 3 行目に写します。

```ts
// memset and memcpy: a row of dashes with a word copied into it, then a screen row copied.
const row = bytes(40)

export function main(): void {
  cls()
  memset(addr(row), 0x2d, 39)
  puts(addr(row))
  newline()
  memcpy(addr(row) + 16, str('ELEC-16'), 7)
  puts(addr(row))
  newline()
  const width = peek16(0xff20)
  memcpy(0xe000 + width * 2, 0xe000 + width, width)
  newline()
}
```

```
---------------------------------------
----------------ELEC-16----------------
----------------ELEC-16----------------
>
```

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| バイト | 1,508 | 460 | 168 |
| サイクル | 13,592 | 13,332 | 13,292 |

`row` の 40 バイト目は 0 のままなので、`puts` の終わりになります（配列は動くたびに 0 で埋められます）。

### 11.5 エラトステネスのふるい

1,000 バイトの配列で、1000 より小さい素数を数えます。計算が中心なので、段階の差がよく見えます。

```ts
// The primes below 1000, by the sieve of Eratosthenes.
const sieve = bytes(1000)

export function main(): void {
  memset(addr(sieve), 1, 1000)
  sieve[0] = 0
  sieve[1] = 0
  for (let i: u16 = 2; i * i < 1000; i++) {
    if (sieve[i] === 0) continue
    for (let j: u16 = i * i; j < 1000; j += i) sieve[j] = 0
  }
  let count: u16 = 0
  for (let i: u16 = 0; i < 1000; i++) {
    if (sieve[i] !== 0) count++
  }
  puts(str('PRIMES BELOW 1000: '))
  putnum(count)
  newline()
}
```

```
PRIMES BELOW 1000: 168
```

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| バイト | 1,946 | 534 | 264 |
| サイクル | 221,800 | 27,534 | 27,479 |

-O1 は -O0 のおよそ 8 倍速く、4 MHz で約 7 ミリ秒です。

### 11.6 符号付きの数を書く

ライブラリの `putnum` は 0〜65535 だけを書きます。i16 を書く関数を足します。

```ts
// A signed number: the library's putnum writes only 0 to 65535.
function putint(v: i16): void {
  if (v < 0) {
    putc(0x2d)
    putnum(u16(-v))
  } else {
    putnum(u16(v))
  }
}

export function main(): void {
  putint(-1234)
  putc(0x20)
  putint(i16(40000))
  putc(0x20)
  const a: i16 = -7
  putint(div(a, 2))
  putc(0x20)
  putint(a % 2)
  newline()
}
```

```
-1234 -25536 -3 -1
```

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| バイト | 1,456 | 442 | 174 |
| サイクル | 5,472 | 4,008 | 3,979 |

`-v` は -32768 のときも -32768 のままですが、`u16()` で読めば 32768 なので正しく書けます。

### 11.7 名前を尋ねる

ROM サービス 7（READLINE）で 1 行を読みます。CLS、BRK、MODE で打つのをやめると負の数が返るので、`i16()` で読んで確かめます。

```ts
// A line typed in through ROM service 7 (READLINE), answered.
const line = bytes(21)

export function main(): void {
  puts(str('NAME? '))
  const n = i16(ecall(7, addr(line), 20))
  newline()
  if (n < 0) return
  puts(str('HELLO, '))
  puts(addr(line))
  newline()
}
```

```
NAME? BOB
HELLO, BOB
```

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| バイト | 1,384 | 430 | 130 |
| サイクル | 1,049 · waits for a key | 1,002 · waits for a key | 1,002 · waits for a key |

### 11.8 配列を関数に渡す

```ts
// An array handed to a function: its address goes, as a reference.
const marks = bytes(8)
const table = words(4)

function total(a: u8[], n: u16): u16 {
  let s: u16 = 0
  for (let i: u16 = 0; i < n; i++) s += a[i]
  return s
}

export function main(): void {
  for (let i: u16 = 0; i < 8; i++) marks[i] = i * 10
  table[0] = 1000
  table[3] = table[0] + 234
  putnum(total(marks, 8))
  putc(0x20)
  putnum(table[3])
  putc(0x20)
  puthex(addr(marks))
  newline()
}
```

```
280 1234 7800
```

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| バイト | 1,956 | 528 | 256 |
| サイクル | 5,399 | 2,943 | 2,914 |

### 11.9 大域変数

大域変数は動くたびに初めの値に戻るので、何度 `CALL` しても同じ答えです。

```ts
// Globals, constants and a counter kept between calls.
const START: u16 = 100
let runs: u16 = 0
let total: u16 = START

function add(n: u16): void {
  total = wrap16(total + n)
  runs++
}

export function main(): void {
  for (let k: u16 = 1; k <= 4; k++) add(k)
  putnum(runs)
  putc(0x20)
  putnum(total)
  newline()
}
```

```
>CALL 28672
4 110
>CALL 28672
4 110
```

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| バイト | 1,492 | 448 | 186 |
| サイクル | 2,196 | 1,308 | 1,286 |

### 11.10 サイクルを数える

CSR の cycle（`0xc00`）を読んで、プログラムの中で時間を測ります。値は下位 16 ビットだけなので、差は `wrap16` で取ります（65,536 サイクルより長いものは測れません。長い時間はタイマーの TCOUNT で）。

```ts
export function main(): void {
  const start = csrr(0xc00)
  let s: u16 = 0
  for (let i: u16 = 0; i < 100; i++) s = wrap16(s + i)
  const spent = wrap16(csrr(0xc00) - start)
  putnum(s)
  putc(0x20)
  putnum(spent)
  newline()
}
```

| | -O0 | -O1 | -O2 |
|---|---|---|---|
| 画面 | `4950 7353` | `4950 508` | `4950 508` |
| バイト | 1,444 | 416 | 154 |

100 周のループが、-O0 では 7,353 サイクル、-O1 では 508 サイクルです。

## 12. 上級: asm、declare、ROM のバンク

### asm`…`

関数の中に、E16 のアセンブリをそのまま書けます。CODE でも使えます。

```ts
export function main(): void {
  asm`
    li a0, 0x41
    li t0, 0
    ecall
  `
  newline()
}
```

これは ROM サービス 0（PUTC）で `A` を出します（-O2 で 42 バイト）。

- 書けるのは `` asm`…` `` の形だけで、`${…}` は使えません（`` only asm`...` with no substitutions is a template here ``）。変数の値をアセンブリに渡す口はないので、大域変数の番地（右の欄の先頭に出ます）を読み書きするか、組み込み関数で RAM に置いてから使います
- 行はそのまま出力に入ります。アセンブリの書き方は [elec16.md](elec16.md) §6「アセンブラ」
- **使ってよいのは t0〜t3 と a0〜a3** です。s0〜s3（局所変数と、-O0 のフレームポインタ）、sp、gp は元のままにしてください。-O1 と -O2 は、asm の前に式の途中の値をスタックに退かせます
- asm を含む関数は、-O2 のコンパイル時の計算の対象になりません
- 同じソースを TypeScript として動かすと、`asm` は例外を投げます（機械でしか動きません）

### declare function

ROM の BASIC は、`declare function putc(c: u16): void` のように、手書きのアセンブリの関数を宣言して名前で呼んでいます。**CODE ではこれは使えません**。CODE のプログラムは ROM のラベルと一緒にはアセンブルされないので、`undefined symbol fresh_line` のように失敗します。ROM の働きは、ROM サービス（`ecall`）とライブラリで使ってください。

### ROM のバンク

e16c には、ソースのファイルごとに ROM のバンク（0〜11）を指定し、バンクをまたぐ呼び出しを ROM の `far_call` で行う仕組みがあります。これは ROM を作るとき（`npm run gen:elec16`）だけのもので、CODE には指定する場所がありません。CODE のプログラムはすべて 7000 からの RAM に入ります。

ELEC-16 PLAY のゲーム（カートリッジ）も同じ仕組みで、バンクは 1〜127、呼び出しはゲームの RAM の `far_call` です。ゲームの作り方（フォルダ、絵、曲、ライブラリ）は [elec16-play.md の 10 章](elec16-play.md#10-ゲームキットg7) にあります。

### 大きな実例

ELEC-16 の BASIC と、モニタの U（逆アセンブル）と B（ブレークポイント）は、この部分集合で書かれています（`resources/elec16/rom/basic/*.e16.ts`、全部で約 4,900 行）。式の評価、文字列、配列、カードのファイルまで、どう書けるかの見本になります。e16c の確かめに使う見本 `tests/fixtures/e16c/sample.e16.ts` は、TypeScript としても機械でも動き、両方の答えが同じことをテストが確かめています。

## 13. 付録: 機械語の約束

e16c の出力は ROM と同じ約束に従います。アセンブリから e16c の関数を呼ぶとき、または右の欄を読むときに使ってください。

| レジスタ | 使い方 |
|---|---|
| a0〜a3（x4〜x7） | 引数（1 つ目から順に）。答えは a0 |
| t0〜t3（x8〜x11） | 一時。呼ばれた側が壊してよい |
| s0〜s3（x12〜x15） | 呼ばれた側が守る。-O1 と -O2 では局所変数、-O0 では s0 がフレームポインタ（fp） |
| ra（x1） | 戻り番地 |
| sp（x2） | スタック（2 バイト単位、下へ伸びる） |
| gp（x3） | ROM の作業域（0000） |

- 関数のラベルは関数の名前そのものです。export した関数は -O2 でも消えません
- ECALL は a0〜a3 と t0〜t3 を変えてよく、ほかは守ります
- 入口（7000）は次のとおりです

```
start:
  addi sp, sp, -2
  sw ra, 0(sp)
  call e16c_init
  call main
  lw ra, 0(sp)
  addi sp, sp, 2
  ret
```
