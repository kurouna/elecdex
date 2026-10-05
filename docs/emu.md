# エミュレータの土台（shared/emu と widgets/emu）

> [architecture.md](architecture.md) §5.18（CHIP-8）と §5.19（ELEC-16）から参照する詳細設計。
> CHIP-8 と ELEC-16 と、これから作る機械が共有する部分の形・規則・約束をまとめる。
> ELEC-16 そのものの設計は [elec16.md](elec16.md)、判断と実測値は [decisions.md](decisions.md)。

## 1. 形

エミュレータのペインは、どの機械も同じ 3 層でできている。

| 層 | 置き場所 | 役割 |
|---|---|---|
| 純粋な機械 | `shared/<機種>/`（例: `shared/chip8/`） | 状態はただのデータ、振る舞いは状態に作用する関数。時間・DOM・Node を持たない。ページ、main（見本づくりや中身の検査）、vitest が同じコードを動かす |
| 機種に依らない純粋な部品 | `shared/emu/` | 時計、拡大率、スナップショットのバイト列、乱数、メモリの窓 |
| ページの部品 | `widgets/emu/`（機種に依らない）と `widgets/<機種>/` | runner（ループ・一時停止・見えているか）、残光、預け場所、AudioContext、画面の部屋と格子。機種の画面とキーと音は機種の側 |
| main の保存 | `main/<機種>/` | 利用者が持つもの（ライブラリ、セーブ、ユニット）。ページの状態にもレイアウトにも持たせない |

## 2. 境界の規則

`tests/unit/emu-boundary.test.ts` が守る。新しい機械を作ったら、そのテストの `MACHINES` に足す。

- 機械のコア（`shared/<機種>/`）は、自分自身と `shared/emu/` だけを import する。**別の機械のフォルダは import しない**
- `shared/emu/` は何も import しない
- コアと `shared/emu/` は、DOM、Node、タイマー、時計（`Date.now`、`performance`）、`Math.random` に触れない。時刻はページが渡し、乱数は状態に持つ（`shared/emu/random.ts`）
- ページの共通部分（`widgets/emu/`）は**どの機械も知らない**。機械の部品がその上に建つのであって、逆はない

## 3. 中身

| ファイル | 中身 | 使う機械 |
|---|---|---|
| `shared/emu/clock.ts` | `framesDue`: 経った時間から、回す機械のフレーム数（取り戻しには上限。長い止まりは落とす） | CHIP-8 |
| `shared/emu/fit.ts` | `fitScreen`: 部屋に画面を収める倍率。デバイスピクセルの整数倍（INTEGER）か、縦横比を保って全体（FIT）。90°・270° の回転 | CHIP-8 |
| `shared/emu/bytes.ts` | `ByteWriter` / `ByteReader`: スナップショットを 1 欄ずつ書いて読む（リトルエンディアン）。短い入力でも例外を投げず、`overrun` で「まるごとではない」と知らせる。**読み終えたら機種のデコーダが `overrun` か長さを確かめる**（CHIP-8 は長さを先に確かめ、最後に `overrun` も見る）。マジックと版と中身の検査は機種のもの | CHIP-8 |
| `shared/emu/random.ts` | `seedOf`、`xorshift32`: 状態に持つ乱数。スナップショットから同じ列が続き、決まった種のテストは毎回同じになる | CHIP-8 |
| `shared/emu/base64.ts` | `toBase64`、`fromBase64`: バイト列を文字に（コアには Node の Buffer も DOM の btoa もない）。段階 2 で CHIP-8 のプレビューから移した | CHIP-8 / ELEC-16 |
| `shared/emu/mem-window.ts` | MEM の窓: 行の並べ方（`windowStart`、`scrollWindow`）、行（`memoryRows`）、変わったバイト（`changedBytes`、`byteMap`）。メモリは配列か、副作用のない読み出し関数（`ByteSource`。I/O を持つ機械が FIFO を読んで減らさないように） | CHIP-8 |
| `widgets/emu/runner.svelte.ts` | `EmuRunner`: 一時停止、見えているか、状態（`empty` / `running` / `paused` / `halted`）、変更の数（AUTO を書くか決める）、描く人への通知。ループは機種が渡す（§4） | CHIP-8 |
| `widgets/emu/format.ts` | `hex`、`oneOf`: CORE と MEM の 16 進、ペイン状態の値の読み戻し（段階 2 のレビューで CHIP-8 と ELEC-16 から寄せた） | CHIP-8 / ELEC-16 |
| `widgets/emu/loops.ts` | ループ: `FrameLoop`（フレーム単位、画面が動く間は rAF、止まればタイマー）と `TimedLoop`（タイマーでサイクルを回し、画面が変わったときだけ rAF で描き、眠れば止まる） | CHIP-8 / ELEC-16 |
| `widgets/emu/painter.ts` | `Painter` / `paintStill`: 画面を画素にする。消えるドットはゆっくり、点くドットはすぐ。消える速さは機械が渡す（CRT の蛍光体、液晶の応答） | CHIP-8 |
| `widgets/emu/park.ts` | `createPark`: ペインの移動で再マウントする間、機械を 10 秒預かる場所。機種ごとに 1 つ（別の機種の機械を取り違えない） | CHIP-8 |
| `widgets/emu/audio.ts` | `SharedAudio` / `emuAudio`: エミュレータのペイン全体で 1 つの AudioContext。要るまで作らず、4 秒鳴らなければ眠らせる。機種の声（AudioWorklet のモジュール）は初めて頼まれたときに 1 度だけ足す | CHIP-8 |
| `widgets/emu/screen.ts` | `deviceRoom`（ResizeObserver の entry からデバイスピクセルの部屋。0 は無視）、`watchRoom`（CSS ピクセルの部屋を entry から。0 は無視）、`drawDotGrid`（ドットの間の格子を 1 度だけ canvas に描く） | CHIP-8 / ELEC-16 |

## 4. EmuRunner

ページで、共有の 10 fps ループのほかに自分のループを持つのはエミュレータだけ（利用者の決定。2026-09-21 に CHIP-8 で認め、2026-10-03 にエミュレータ全体へ広げた）。状態と一時停止は `EmuRunner` 1 つにまとめ、ループは `loops.ts` の部品を機種が選ぶ（下の「2 つのループ」）。機械ごとにループを書かない。

- **回すのは、機械が動いていて、かつペインが見えている間だけ**。隠れたら一時停止（`hidden`）し、見えても自分からは再開しない。見えない間に読み込まれた機械も、隠れた一時停止で始まる
- **いつ回すかは機械の方針**: CHIP-8 の `FramePolicy` は 1 フレームの長さ（`frameMs`）、止まりの後に取り戻す上限（`maxCatchUp`）、画面が動かないまま何フレームでタイマーに落とすか（`stillFrames`）。何も描かない rAF でも vsync ごとに描画の流れが起き、CHIP-8 では 1 コアの 5.5% かかったため、止まった画面は rAF ではなくタイマーで回す
- 機械が runner に約束すること（`EmuMachine`）: `running` だけ。ほかはループの約束（下）
- 機械の runner が足すこと: 読み込み、キー、音、画面の表示に要る状態。足し口は `settled`（状態を表示に合わせる）、`afterFrames`（1 回の tick の後。音）、`silence` と `quiet`（ループが止まったとき）。機械を入れるのは `setMachine`、変更を数えるのは `countChange`
- **CHIP-8 の方針**: 60 Hz、取り戻しは 3 フレームまで、30 フレーム止まればタイマー（`chip8-runner.test.ts` が固定している）

### 2 つのループ（段階 2 で作り直した）

段階 0 では、ループは `EmuRunner` の中の private なフレーム単位のものだった。段階 2 の初めに、ループを `loops.ts` の部品に分け、機種の runner が `EmuRunner` に渡す形にした（`super((owner) => new FrameLoop(host, owner, POLICY))`）。`EmuRunner` は状態と一時停止だけを持ち、ループが走らせ、描かせ、状態を合わせるときは `LoopOwner`（`ran`・`draw`・`settle`・`wanted`）を通す。CHIP-8 の振る舞いは変わらない（`chip8-runner.test.ts` は変えずに通る）。

- **`FrameLoop`**（CHIP-8）: 上の CHIP-8 の方針そのもの
- **`TimedLoop`**（ELEC-16）: 60 Hz のタイマーで回す。1 回ごとに、経った時間をすべて `advance` で機械に渡し（タイマーと時計は時間どおりに進む）、走らせるサイクルは「クロック × 経った時間」（取り戻しは 50 ms まで）。サイクルは小分けにして回し、1 回 8 ms の予算を超えたら残りは捨てる（MAX、遅い PC）。画面の版が動いたときだけ、rAF を 1 つ頼んで描く。描く間隔は方針の `drawMs` より短くしない（液晶は 30 回/秒、PLAY-320 は 60 回/秒）。間隔は rAF の時刻（vsync）どうしで測り、タイマー 1 つで待つのは「描く時刻の 8 ms（60 Hz の半フレーム）前」まで。そこで rAF を頼み、まだ早い vsync なら描かずに次の vsync を待つ。以前はタイマーで最後の 1 ms まで待ったため、描く予定の vsync を逃して 1 フレーム遅れ、60 Hz の画面で PLAY-320 は毎秒 31 枚、液晶は 20 枚になっていた（2026-10-05、vsync に揃う時計で測るテスト）。描く側が `true` を返すあいだ（消えかけのドット）はもう 1 フレーム頼むので、眠っていても残像は消えきる。`start()` は眠りの状態を忘れるので、止めてから入れ替えた機械が眠れば改めて知らせる。MAX は方針の `rate` が Infinity を返し、8 ms の予算まで回す。**機械が WFI で眠ったら、タイマーを止める**。起こすのはキー（runner が `wake()` を呼ぶ）か、機械が言う「起きる時刻」の `setTimeout` 1 つ。眠り始めと起きたときに runner に知らせる（ランプの `asleep`）。テストは `tests/unit/emu-loops.test.ts`
- 機械の約束はループごと: `FrameMachine`（`running`・`screenRevision`・`frame()`）と `TimedMachine`（`running`・`screenRevision`・`hz`・`advance(ms)`・`run(cycles)`）。ELEC-16 の `Elec16` は後者をそのまま満たす
- 重い機械（Linux 系ペイン）は、機械を Web Worker で動かす。`shared/emu` とコアは DOM を持たないので、そのまま Worker で動く。ただし**今の約束は同期で、画面の部品は `runner.machine.state` を直接読む**ので、そのままでは Worker に載らない。Worker の機械には、状態を写しで受け取る別のループと約束を作る

## 5. 段階 0（2026-10-03）で切り出したもの、残したもの

**合格の条件**: CHIP-8 の見た目と動きを変えない。テストは import の道筋を直す以外は変えずに通る。

- 切り出した: §3 の `bytes.ts`・`random.ts`・`mem-window.ts`（`shared/emu`）、`runner.svelte.ts`・`painter.ts`・`park.ts`・`audio.ts`・`screen.ts`（`widgets/emu`）。CHIP-8 の `runner.svelte.ts` は `EmuRunner` の上に、`park.ts` は `createPark` の上に建ち、`snapshot.ts` と `state.ts` は `shared/emu` を使う。境界のテストは `emu-boundary.test.ts` に名前を変え、`widgets/emu` がどの機械も知らないことも確かめる。新しい部品のテストは `emu-shared.test.ts`
- テストで変えたのは import の道筋だけ: `chip8-mem.test.ts`（窓の関数は `@shared/emu/mem-window` から）、`chip8-pane.test.ts`（`Painter` は `widgets/emu` から）
- 見直しで直したこと（Fable 5.1 のサブエージェントのレビュー）: 残光の部品は色の番号を `& 3` で丸めなくなったので、CHIP-8 のスナップショットは 0〜3 でない画素を受け取らないようにした（壊れたセーブの画素を、前は別の色、今は地として描くところだった。修正前に落ちるテストを足した）。デコーダは最後に `overrun` も確かめる。`deviceRoom`・`drawDotGrid`・`SharedAudio.wake` などにテストを足した
- **残したもの**と理由: 2 台目の機械の形が見えてから切り出す（形を推測して共通にすると、間違った抽象が残る）
  - `MemView.svelte`・`CoreView.svelte`・`Screen.svelte`（Svelte の部品）: ELEC-16 の CORE（レジスタ 16 本、CSR、眠り）と MEM（I/O を持つメモリ）、液晶の描き方（隙間と影）が決まる段階 2 で、共通にできる形を切り出す
  - ブザーの声（`buzzer.ts`・`buzzer-worklet.ts`）: `Tone` と `PatternVoice` は CHIP-8 のもの。AudioContext だけを共通にした
  - main の保存（`main/chip8/saves.ts`・`store.ts`）: ELEC-16 の保存はユニットごとの RAM と `card.json` で、CHIP-8 のプログラムごとのスロットとは形が違う。共有するのは `replaceFile` と「書く前と読むときにコアの decode で確かめる」規則だけ

## 6. ほかの使い道

| 案 | 中身 | 権利 | 規模 | 評価 |
|---|---|---|---|---|
| **ELEC-16** | オリジナルの 16 ビットポケコン（[elec16.md](elec16.md)） | 自前 | 大 | 作成中（段階 0 済み） |
| **16 ビットゲーム機** | ELEC-16 の GAME モデル。同じ CPU、アセンブラ、e16c、runner、保存。画面はタイルとスプライト、入力はパッド、音は数チャンネル。ソフトは自作 | 自前 | 中〜大 | 本命。ELEC-16 の後、別の仕様書で |
| **Linux 系ペイン** | RV32IMA の CPU に小さな Linux（BusyBox）を起動し、端末はペインの中の xterm。E16 で作った RISC の作り方が生きる。機械は Web Worker で動かす | カーネルと BusyBox は GPL。ソースの対応を同梱する | 大 | 本命。以前からの目標 |
| Uxn / Varvara | 公開されている小さな仮想機械。2 ビットの画面、音、マウス。File デバイスは ELEC-16 の記憶カードと同じ砂場で | 仕様と多くの ROM が MIT などで公開。作品ごとに確かめる | 中 | 候補。ソフトが最初から揃う |
| 4 ビットの学習ボード | 7 セグメントの LED と 16 進キーの、機械語を学ぶ小さなボード（オリジナル）。MEM と CORE が主役 | 自前 | 小 | 候補。共通部品の小さな試金石 |
| プラグイン API 3（エミュレータの受け皿） | プラグインが自分の機械を持ち込み、runner、画面、音、セーブはホストが出す | プラグインの作者の責任 | 中 | 要相談。同意の設計が要る |
| テスト用の決定的な機械 | 同じ入力で必ず同じ画面になる機械を、e2e の負荷や CRT の遷移のテストに使う | 自前 | 小 | ついでに |
| 市販のゲーム機やパソコン、実機のポケコン | — | ROM が著作物で、同梱も配布もできない | — | やらない |

**段階 2 のレビューのあとに寄せたものと、寄せなかったもの**: 2 台目の機械ができたので、`hex`・`oneOf`（`format.ts`）と CSS ピクセルの部屋の監視（`watchRoom`）を `widgets/emu` に寄せた。CORE と MEM の部品は寄せていない。MEM の論理（窓、変わったバイト）は既に `shared/emu/mem-window.ts` で共有していて、残りは機種ごとの表示（CHIP-8 のスプライトの絵、ELEC-16 の番地の種類の色）が大半のため。3 台目の機械で同じ形が見えたら部品にする
