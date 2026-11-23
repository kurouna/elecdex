# ELEC-16 CODE の WRITE: 言葉から e16c を書く（設計）

ELEC-16 POCKET の CODE 画面の下に入力欄（WRITE）を置き、「ワンキーゲームを作って」のような言葉から、AI が e16c の TypeScript を左のエディタに書く。書き終えると COMPILE し、誤りがあれば AI に返して直させる。モックは [elec16-ai-code-mock/index.html](elec16-ai-code-mock/index.html)。CODE 画面そのものは [elec16.md](elec16.md) の 6 章「CODE 画面」、e16c は [elec16-e16c.md](elec16-e16c.md)。

状態: 設計中（2026-11-23）。版 2: Fable 5.2 のレビューを入れた（13 章）。プロンプトを試験した（14 章）。実装はまだない。

## 1. 決まっていること（2026-11-23、利用者の決定）

1. 書くのは **e16c の TypeScript だけ**。BASIC は見送り、アセンブリは出さない
2. **POCKET だけ**。PLAY-320 と SCI-128 には WRITE の行を出さない
3. 使えるのは **設定の AI にプロバイダがあるとき**。LINK の AI スイッチ（PANEL の LINK）とは関係しない
4. **入力欄でプロバイダとモデルを選ぶ**（AI チャットペインと同じ選び方）
5. 自動修正は **2 回まで**（AI に頼むのは 1 回の SEND で最大 3 回）
6. 書く先は **今開いているファイル**。エディタが CODE の最初の見本（`SAMPLE`）と同じか空でなければ、置き換える前に確かめる
7. 2 回目からの SEND は **今のエディタのコードを添えて** 送る（「スコアを右上に」で直していける）
8. SEND は他のボタンと同じく点滅してから動く（`afterBlink`）。スクロールバーなど見た目はテーマに従う

## 2. 画面と操作

```
┌ CODE ──────────────────────────────────────────────────────────────┐
│ MAIN.TS ▾  new name          COMPILE  -O0 -O1 -O2  RUN▸ LOAD▸ SAVE │
│ ┌ TypeScript ─────────────────┐ ┌ E16 assembly ───────────────────┐ │
│ │ （書いている間は <pre>）    │ │                                 │ │
│ └─────────────────────────────┘ └─────────────────────────────────┘ │
│ (誤りの一覧、段階の表)                                              │
│ ◆THINKING ── ◆WRITE ── ◆COMPILE ── FIX 1/2 ── ◇READY  00:14 · 1.9 KB│  ← 高さは常に取っておく
│ WRITE │ > ワンキーゲームを作って        │ ANTHROPIC ▾ │ model   │SEND│
│ Sent: your words and the code in MAIN.TS, to Anthropic.             │  ← 説明の行。確認と結果もここ
└────────────────────────────────────────────────────────────────────┘
```

- **入力欄**: AI チャットペインの composer と同じ枠、`>`、textarea（`field-sizing: content`、高さは 8rem まで）。Enter で送り、Shift+Enter で改行。IME 変換中と `event.repeat` の Enter では送らない。空なら SEND は押せない。狭いペインでは、プロバイダとモデルが入力欄の下の行に折り返す
- **プロバイダ**: 設定の AI のプロバイダの select。**モデル**: AI チャットペインの `ModelField`（打つか、開いたときにプロバイダから読む一覧から選ぶ）。モデルは **プロバイダごとに** ペインの状態に残す（`writeModels: Record<providerId, string>`、`writeProvider`）。既定はそのプロバイダに設定で選んであるモデル。設定からプロバイダが消えたら、描くときに残っている最初のものを使う（`normalize` では決めない。設定が見えないため）
- **使えないとき**: プロバイダがない → 入力欄は無効、説明の行に「No AI provider is set. Add one in Settings ▸ AI」。モデルが空 → ModelField を `wanting` にし、SEND は押せない。ユニットがない・ソースを読み終えていない → SEND は押せない
- **SEND**: 3 拍点滅してから動く。確かめるかどうかは 3 章
- **確認**: 説明の行が確認になる: 「REPLACE? WRITE replaces the code in MAIN.TS with what the AI writes. UNDO puts it back.」と REPLACE / CANCEL。キーは lib/question-keys.ts と同じ（← →、Enter、Esc は CANCEL）。始まりは REPLACE（12 章）。**確認の間、エディタは読み出し専用**で、確認の行の外を押せば CANCEL。CRT の演出はしない（CODE の `.said` と同じく、ただ出る）
- **考えている間**（最初の文字が来るまで、モデルが推論しているとき）: 段階の行は THINKING。文は出さない
- **書いている間**:
  - エディタは `<textarea>` の代わりに破線の枠の `<pre>` になり、コードの部分が届くそばから入る。末尾にキャレット、最後の行が見えるように送る。右上に「writing · 0.9 KB」
  - 届いた文字は main がまとめて送る（10 回／秒ほど）。ページは受けるたびに `$state` を 1 回書く
  - COMPILE の場所は WRITING / COMPILING / FIXING の札（git の FETCHING と同じ形）。RUN ▸ などは押せない。ファイルの選択と新しい名前も押せない
  - SEND は STOP（警告色）。入力欄は無効にせず **読み出し専用**にして `data-owns-escape` を付け、Esc で STOP（キーボードを失わない）
- **段階の行**: THINKING → WRITE → COMPILE →（誤りがあったときだけ FIX n/2）→ READY。今の段階は点滅（`pulse`、送っている間だけ）、終わった段階は塗り、直らなければ FIX が赤。各段階は文字でも書く（形だけで読ませない）。右に経過時間（`onBoundary(1000, …)`、seen の間だけ）と大きさ。トークン数は答えが終わってから（入力と出力の合計、3 回分の和）
- **自動修正**: 4 章。直している間、エディタは前の完全な答えを誤りの印つきで出したまま。直した答えが全部届いてから置き換える
- **READY**: 右にアセンブリ、段階の表。説明の行に「Written from "…" and compiled after 1 fix · 744 bytes at -O2 · 6 lines changed」と **UNDO**（`.e16-btn`、`afterBlink`）。**RUN ▸ は人が押す**
- **FAILED / STOPPED**: 誤りは今の CODE と同じ赤い一覧で、行に飛べる。プロバイダが失敗したときは、その言葉を説明の行にそのまま出す（ai-chat.md: 終わりの印の横にプロバイダの言葉）。UNDO はある
- **UNDO**: 書く前のソースと入れ替える（もう一度押すと戻る: 2 つの控えの入れ替えで、払った答えを誤って捨てない）。8 章のとおり Elec16Widget が持つので、MACHINE との行き来と RUN ▸ を越えて残る。ペインの移動と再読み込みでは残らない（説明書に書く）
- 状態は読み上げ用の `aria-live="polite"` の領域で伝える（WRITING、FIX 1/2、READY、FAILED）。流れ込むコードは読み上げない

## 3. 確かめるとき

`needsConfirm(source, lastWritten)`（純粋）:

- エディタが `SAMPLE` と同じ → 確かめない。比べる前に CRLF を LF に、各行の末尾の空白と末尾の空行を落とす。空白だけなら空とみなす。`sourceToMachine` → `sourceFromMachine` を通った `SAMPLE` も同じとみなす（テストで確かめる）
- エディタが **WRITE が最後に書いたものと同じ**（人がまだ手を入れていない）→ 確かめない（「スコアを右上に」を続けて頼めるように。12 章）
- それ以外 → 確かめる

## 4. 流れ

1 回の SEND は、ページの状態機械 `WriteFlow` が回す。

```
idle ─SEND→ (confirm?) ─REPLACE→ thinking → writing ─答え→ compiling ─通る→ ready
                 └CANCEL→ idle                                   └誤り→ fixing(1) → compiling → fixing(2) → compiling ─誤り→ failed
thinking / writing / fixing ─STOP→ stopped                       どこでも: プロバイダが失敗 → failed
```

- **依頼**: main に `write`（言葉と今のコード）を送る。直すときは `writeFix`（誤りの一覧）。**会話と回数は main が持つ**（5 章）
- **COMPILE はメモリで**: `compileCode(rom, file, source)`（`code/compiler.ts`）をカードを通さずに呼ぶ。往復の間はカードに書かない。READY になったときに 1 度だけカードに書く（今の `keep()`）。FAILED と STOPPED では書かない（人が COMPILE するか、CODE を離れるときに今までどおり書かれる）
- **判じるのは選んでいる段階（-O0〜-O2）だけ**。大きさは段階で違う（説明書 11.3 の例は -O0 で 1,672 バイト、-O2 で 166 バイト。領域は 2,048 バイト）。選んだ段階が **大きさだけ** で落ち、上の段階なら通るときは、直させずにその段階に切り替えて READY とし、そう書く
- 直させる誤り: e16c の誤り、`sourceToMachine` の誤り（機械の文字でない）、答えにコードブロックがない・`main` がない・32 KB を越える、測る機械で `measured.end === 'fault'`（始めてすぐ落ちる）。`limit`（2,000 万サイクルを越える）はゲームでは普通なので誤りにしない
- 誤りの一覧（`fixMessage`）: `MAIN.TS:41:10 理由` の形で 20 件まで。ライブラリ（`ELEC16`）の誤りは「in the built-in library (do not redefine its names)」と書く
- 依頼の本人確認: SEND のときの **ユニット・ファイル・依頼の番号** を控える。ユニットが替わる（他のペインに渡す、電源）・ファイルが替わる・ペインが作り直されたら止める。届いた文字と答えには依頼の番号が付き、違う番号のものは捨てる

## 5. main: `elec16.write`

- `src/main/elec16/write.ts` の `CodeWriter`。LINK の AI サービス（`main/elec16/link/ai.ts`）と同じく、AI チャットのプロバイダ・鍵・アダプタを使う（`targetFor`、`adapter.stream`）。**鍵はページに来ない**
- チャンネル（`registerTable` の 1 つの表、`main/ipc/elec16.ts`）:
  - `elec16.write(pane, { serial, provider, model, words, code })` → `Promise<WriteResult>`。新しい会話を始める
  - `elec16.writeFix(pane, { serial, errors })` → `Promise<WriteResult>`。同じ会話の続き。main が回数を数え、3 回目の依頼の後は断る
  - `elec16.writeStop(pane)`
  - 届いた文字は `elec16:write-text`（`{ pane, serial, text }`、まとめて 100 ms ごと）で依頼したページにだけ送る。`thinking` の印も同じ口で（中身は送らない）。preload は `onWriteText(pane, handler)`
  - `WriteResult`: `{ ok: true, serial, text, usage? }` か `{ ok: false, serial, stop: 'stopped' | 'failed' | 'refused' | 'timeout' | 'too-long', note }`
  - zod: 言葉は 2,000 字、コードは 40,000 字、誤りは 20 件・各 300 字まで。プロバイダ id は設定にあるもの
- 会話（言葉＋コード、答え、誤り、直した答え…）は main のメモリに 1 ペイン 1 つ。結果、STOP、ページが消えた（`whenPageGoes`）、次の `write` で捨てる。ファイルには書かない
- 1 ペインに 1 つずつ。答えの文字が 64 KB を越えたら止めて `too-long`。時間は **最後の文字から 60 秒**（何も来ない間）と、全体で 10 分。`watching()` は動いている依頼の `page/pane` を並べる
- システムプロンプトは main が付ける（ページからは送らない）
- **推論は既定のまま**（`noThinking` を付けない。AI チャットと同じ）。`noThinking` は Anthropic の方言でしか効かず、付けるとプロバイダで振る舞いが変わる。直す 1 往復が減れば元が取れる。答えの長さの上限は付けない
- ネットワークは main だけ。送るのは、言葉、今のコード、誤りの一覧、AI の前の答えだけ。カードのほかのファイル、RAM、機械の状態は送らない

## 6. システムプロンプト（`shared/elec16/write-prompt.ts`、純粋）

試験した下書きは [elec16-write-prompt.md](elec16-write-prompt.md)（14 章）。

- **置き場所**: main は `shared/e16c/` を読めない（`tests/unit/package-deps.test.ts` の `NOT_AT_RUNTIME`: e16c は TypeScript のパーサーを読む）。プロンプトが読む `LIBRARY` と領域の定数は、パーサーを読まない `shared/e16c/code-area.ts` にある。**code-area.ts を `shared/elec16/code-area.ts` に移し**（e16c とページはそこから読む）、`write-prompt.ts` と `write-code.ts` を `shared/elec16/` に置く。`link-text.ts` の隣
- 英語で書く。答えのコメントと画面の文字も英語か半角カナにさせ、漢字・全角は使わせない（機械の文字だけ）。利用者の言葉は何語でもよい
- 中身:
  1. 役割: ELEC-16 POCKET（16 ビットの架空のポケコン）の e16c プログラムを書く
  2. 機械: 液晶 240×48 ドット、40 桁 6 行、4 MHz（ユニットで変わる）
  3. 時間: **`TCOUNT`（FF30、1 秒に 1,024）で測る。空のループで待たない**（速さが -O の段階とクロックで変わる）。乱数は `TCOUNT` か `csrr(0xc00)`。日付と時刻は CLOCK（FF38〜FF3E のバイト）
  4. キー: `getkey`、`keyWaiting`（SHIFT だけでも真になり、そのとき `getkey` は待つ）、押し続けは `KEYMAT`、キーの番号の表。**どこかのキーで BASIC に戻る**こと
  5. 描き方: 毎こま `cls()` しない。動いたところだけ描き直す
  6. e16c の部分集合: 型（`u16`、`i16`、`u8`、`bool`）、`as` は広げるだけで読み替えは `u16()` `i16()` `u8()`、i16 と u16 を混ぜない、定数はその型に収まる、大域の初期値はコンパイル時の値だけ。配列は大域の `bytes(n)` / `words(n)` だけ（リテラルと初期値なし）。文字列は `str()` の中だけ。`/` は `div()`。`++` `--` `=` は文としてだけ。引数は 4 つまで。入れ子の関数とアロー関数はない。クラス、クロージャ、オブジェクト、例外、`number` はない。名前は全ファイルで 1 つの名前空間: 組み込みとライブラリの名前（一覧を載せる）を定義し直さない。`export function main(): void` が入口
  7. ライブラリ: `LIBRARY` の関数の型を **ソースから取り出して** 並べる（手で写さない）
  8. 大きさ: コードと文字列は 2,048 バイト（7000–77FF）。ライブラリの分を引いた実際の目安（行数）。大域変数と配列は 7800–7BEF
  9. よくある誤り: 説明書 10 章の表を短くしたもの（e16c の言葉は直し方を言うので、そのまま役に立つ）
  10. 例: 2〜3 本（キーで動くゲーム、液晶に描くもの）。**この規則のとおりに書いたもの**
  11. 答える前に確かめる表（14 章: これで取りこぼしが減った）
  12. 答えの形: ```` ```ts ```` のコードブロック 1 つだけ。前置きも後書きもなし。直すときは全体を同じ形で返す
- 目安 8〜12 KB。**テストで**: 例が今の e16c で通り、測る機械で `main` から戻るかキーを待つこと（`fault` でない）。ライブラリと組み込みの名前の一覧が `LIBRARY` と e16c に一致すること。「ない」と書いたもの（クラス、アロー関数…）を実際にコンパイルして断られること

## 7. 答えからコードを取り出す（`shared/elec16/write-code.ts`、純粋）

- `extractCode(text)`: `export function main` を含む **最後の** フェンス（```` ```ts ````、```` ```typescript ````、```` ``` ````）の中。閉じていなければ最後まで（STOP のため）。フェンスがなければ null（誤りとして直させる。プロンプトはフェンスを頼んでいる）
- `streamingCode(partial)`: 届いている途中のテキストから、今エディタに出す分（開きのフェンスの後から、閉じのフェンスの手前まで。閉じかけの ` は出さない）
- `machineText(code)`: 改行は LF、タブは 2 空白、よくある活字の記号を ASCII に（’ ‘ → '、“ ” → "、— – → -、… → ...、NBSP → 空白）。それでも機械の文字でない字は `sourceToMachine` の誤りとして直させる
- モデルの文は信用しないデータ: エディタの文字になるだけで、ページで実行も HTML としての表示もしない。動くのは e16c がコンパイルした E16 コードとして、コアの上でだけ

## 8. ページの作り

**WriteFlow と UNDO は Elec16Widget が持つ**。CodeView は `{#if pane.view === 'code'}` の中にあり、MACHINE に切り替えると（RUN ▸ もそうする）壊れて、中の状態は消えるため。

| 置き場所 | 中身 |
|---|---|
| `widgets/elec16/write-flow.svelte.ts` | `WriteFlow`: 状態、依頼の番号、UNDO の 2 つの控え、経過時間、最後に書いたもの。Elec16Widget が 1 つ作り、ユニット・ファイルが替わると止める |
| `widgets/elec16/WriteLine.svelte` | 段階の行、入力欄、説明の行（確認と結果を含む）。`WriteFlow` を描くだけ |
| `shared/elec16/write-flow.ts`（純粋） | 遷移、`MAX_FIXES = 2`、`needsConfirm`、どの誤りを直させるか、段階の切り替え（4 章）、`changedLineCount`、結果の文 |
| `shared/elec16/write-prompt.ts`、`write-code.ts`、`code-area.ts`（純粋） | 6 章、7 章 |
| `CodeView.svelte` | `flow` を受ける。書いている間は `<pre>` を出す。`compile()` を、ビューの状態を変えずに `{ problem } \| LevelResult[]` を返す関数と、それを描く部分に分ける（WriteFlow もこれを使う） |
| `Elec16Widget.svelte` | POCKET のときだけ `WriteFlow` を作り CodeView に渡す。コンパイラの `holdCompiler` も、WriteFlow が動いている間はここで持つ |
| `pane-state.ts` | `writeProvider`、`writeModels`（文字列として確かめるだけ） |

- 変わった行を光らせることはしない（textarea の上に重ねて描くのは壊れやすく、描き直す面も広い）。説明の行に「6 lines changed」と数だけ出す

## 9. テスト

- 単体: `extractCode`（最後のフェンス、閉じない、言語名なし、フェンスなし）、`streamingCode`、`machineText`、`writePrompt`（例がコンパイルでき測る機械で `fault` でない、名前の一覧、「ない」ものが断られる）、`fixMessage`（20 件、ライブラリ）、`write-flow.ts`（遷移、2 回で failed、STOP、大きさだけの誤りで段階を切り替える、fault を直させる）、`needsConfirm`（見本、往復した見本、改行の違い、最後に書いたもの）、package-deps.test.ts（main が shared/elec16 の write-prompt を読めて e16c を読まない）
- main: `CodeWriter` を偽のアダプタで（1 ペイン 1 つ、`writeFix` の回数、止める、無音 60 秒、64 KB、ページが消える、入力の上限、ないプロバイダ、番号）
- コンポーネント: WriteLine（プロバイダなし、モデルなし、確認のキー、Esc、`event.repeat`、live 領域）
- e2e（`tests/e2e/panes/elec16-write.spec.ts`）: AI のスタブサーバー（spec が立てる）で、①見本のまま SEND → READY → RUN ▸ → CODE に戻って UNDO がある、②自分のコード → 確認 → CANCEL で何も変わらない、③誤りのある答え → 直る、④2 回直らない → FAILED、UNDO で戻る、⑤プロバイダなし、⑥STOP、⑦書いている間に MACHINE へ行って戻る
- 契約: `tests/e2e/contracts/ipc-table.ts` に `elec16.write`、`writeFix`、`writeStop`、`onWriteText` と `watching`。lifecycle の ELEC-16 の行に「書いている答えは unseen でも続く」。`escape-owner.test.ts`、`question-dialogs.test.ts` の `CASES`。`crtPower` は使わないので dialogs.ts の行は要らない

## 10. 文書

- 説明書 elec16-e16c.md に「WRITE: 言葉から書く」の節（2 章の後）。UNDO はペインの移動と再読み込みで消えることも
- ガイド docs/guide/panes-retro.md（英・日・中）の ELEC-16 の節、data-sources.md（何を、どのプロバイダに送るか。LINK の AI スイッチとは別であること）、*unreleased* の印
- elec16.md 6 章の CODE からこの文書へのリンク、decisions.md（code-area.ts を移したこと、推論、時間切れ）、.claude/rules/elec16.md に一行
- デモ: 次のリリースで introduction デモに 1 拍

## 11. モックに足すもの

- 状態: THINKING、STOPPED、プロバイダの失敗（言葉つき）、モデルなし
- 段階の行の FIX は誤りが出てから。書いている間のトークン数は出さない（大きさと時間）。時間と大きさは `--step--1`、プロバイダの select も
- UNDO はボタン。確認と結果は説明の行に。段階の行の高さを取っておき、行が出ても エディタが動かない
- COMPILE の場所に FIXING。書いている間の入力欄は読み出し専用（無効にしない）
- 見本のゲームを、プロンプトの規則のとおりに（TCOUNT で待つ、毎こま cls しない、キーで戻る）

## 12. レビューの後に決まったこと（2026-11-23、利用者の決定）

1. **続けて頼むとき**: エディタが WRITE の最後に書いたものと同じ（人が手を入れていない）なら、確かめずに書く。手を入れていれば確かめる
2. **大きさだけの誤り**: 選んでいる段階では大きすぎ、上の段階なら収まるときは、直させずに段階を切り替えて READY にし、そう書く
3. **推論**: プロバイダの既定のまま（`noThinking` を付けない）
4. **確認の始まり**: REPLACE から始める

## 13. レビュー（Fable 5.2、2026-11-23）で直したこと

- main は `shared/e16c/` を読めない → code-area.ts を shared/elec16 に移す（6 章）
- CODE は MACHINE に切り替えると壊れる → WriteFlow と UNDO は Elec16Widget に（8 章）
- STOP や FAILED の後に CODE を離れると、壊れたコードがカードに書かれ UNDO もない → 往復はメモリで COMPILE、UNDO は Widget に（4 章、8 章）
- `compile()` は結果を返さない → 返す関数と描く部分に分ける（8 章）
- -O0 は大きさで落ちやすい → 選んでいる段階だけで判じる（4 章）
- 無効な入力欄では Esc が取れない → 読み出し専用に（2 章）
- 届いた文字に依頼の番号がない → `serial`（4 章、5 章）
- 書いている間にユニットが替わる → 控えて止める（4 章）
- 会話と回数をページが持つと上限が守れない → main が持つ（5 章）
- モデルはプロバイダのもの → プロバイダごとに残す（2 章）
- 答えの大きさの上限、時間切れ、活字の記号、ライブラリの誤り、`fault`、プロンプトに要るもの（6 章）
- 光る行はやめて数だけ。書いている間は `<pre>`（2 章、8 章）
- 契約の表（ipc-table、escape-owner）（9 章）

## 14. プロンプトの試験（2026-11-23）

6 章のシステムプロンプトを下書きし（[elec16-write-prompt.md](elec16-write-prompt.md)、約 9.9 KB）、サブエージェントをチャットのモデルに見立てて、プロンプトだけを渡して書かせた。答えは e16c で -O0〜-O2 にコンパイルし、-O2 を測る機械で動かした（一時的な単体テストのハーネス。コミットしていない）。

| 回 | モデル | 依頼 | 一発で -O2 が通った | 測る機械 |
|---|---|---|---|---|
| 1 | Sonnet | ワンキーゲーム、数当て、時計、サインカーブ、迷路、インベーダー風 | 6 / 6 | fault なし |
| 2 | Haiku | 時計、じゃんけん、タイピング、ライフゲーム、ストップウォッチ、既存コードの変更、誤りの修正 | 6 / 7（変更の依頼で `/` を使った） | fault なし |
| 3 | Haiku（確認表を足した版） | スネーク、跳ねるボール、素数、反射神経、三目並べ、既存コードの変更、誤りの修正 | 7 / 7 | fault なし |

- 修正の往復（e16c の誤りの文をそのまま返す）は、2 回とも 1 回で直った。e16c の言葉が直し方を言うので、そのまま役に立つ
- **-O0 はすべて大きさで落ちた**（2,226〜5,462 バイト）。-O1 と -O2 は全部入った（-O2 で 310〜1,380 バイト）。4 章の「選んでいる段階だけで判じる」が要る。CODE の既定の段階は -O2 のまま
- 1 回目の時計は、機械の時計（FF38〜）をプロンプトに書いていなかったため、時刻を打たせる作りになった。足した後は時計を読んだ。**機械にあるものはプロンプトに書かないと使われない**
- プロンプトの最後に「答える前に確かめること」の表（`/`、裸の文字列、型のない `let`、式の中の `++`、i16 と u16、配列、ASCII、main と終わり方、名前）を足すと、Haiku の取りこぼしがなくなった
- 中身も依頼どおり: TCOUNT で待ち、毎こま `cls()` せず、Q か BRK で戻り、カーソルを隠して戻す。例に書いた形をよく真似る（例は規則どおりに書くこと）
- 試していないもの: OpenAI 互換のプロバイダとローカルのモデル。実装の後、実際のプロバイダで確かめる
