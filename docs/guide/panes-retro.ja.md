[English](panes-retro.md) | 日本語 | [简体中文](panes-retro.zh-CN.md)

# レトロな機械: CHIP-8 と ELEC-16 — elecdex

elecdex は eDEX-UI を Electron で作り直した SF 風のターミナルエミュレーター兼システムモニターです。このページでは、2 つのエミュレーターのペインを説明します。**CHIP-8** は、elecdex のために書いた機械で CHIP-8・SUPER-CHIP・XO-CHIP のプログラムを動かします。**ELEC-16** は elecdex が独自に設計した 16 ビットのポケコンで、CPU、ROM、BASIC、機械語モニタはすべて自前です。ゲーム機 **PLAY-320** や関数電卓 **ELEC-16 SCI（SCI-128）** にもなります。どちらもサンドボックスの中の 2D canvas で動き、自分ではネットワークを使わず、見えない間は一時停止します。Windows、macOS、Linux で動きます。elecdex は Windows で開発し使っています。macOS と Linux は GitHub Actions のテストでビルドして動かしているだけで、手での検証は十分ではありません。

<p align="center">
  <img src="../screenshots/elecdex-retro.jpg" alt="Tron テーマの retro プリセット：左にシステム列。右に ELEC-16、関数電卓の ELEC-16 SCI、CHIP-8 をタブにした 1 つのペイン。前面は SLATE の本体の関数電卓で、液晶は sin(45)+1/2 に正確な形 (1+√2)/2 で答え、その下に関数キー 2 段と数のキー。横にパネルの CORE でレジスタと動いている ROM のコード。その下に 16 バンドのスペクトラム">
  <br><sub>retro · Tron · 前面は ELEC-16 SCI</sub>
</p>

## このページの内容

- [retro プリセット](#retro-プリセット)
- [CHIP-8](#chip-8)
- [ELEC-16](#elec-16)
- [PLAY-320](#play-320)
- [ELEC-16 SCI](#elec-16-sci)
- [説明書とガイド](#説明書とガイド)
- [設計の文書](#設計の文書)

## retro プリセット

| | |
|---|---|
| 開き方 | Ctrl+Shift+F9、または LAYOUTS ダイアログ |
| ペイン | 左にシステム列。ELEC-16、ELEC-16 SCI、CHIP-8 をタブにした 1 つのペイン。その下に 16 バンドの [Spectrum](panes-media.ja.md#spectrum) |

プリセットを選ぶと保存レイアウトが 1 つ追加され、その後は作業に合わせて変わります。desk プリセットにも、utility ペインの横に ELEC-16 SCI のタブがあります。どちらの機械もペインのピッカー（Ctrl+Shift+A）から何枚でも追加でき、Ctrl+Shift+Z で前面に出すと画面が大きくなります。どちらもワークスペースの上にポップアップはしません。ダイアログを開くたびにポップアップが閉じ、動いている機械が止まってしまうためです。ショートカットは *Settings → Keyboard* で変えられます。プリセットの一覧は [presets.ja.md](presets.ja.md#retro) にあります。

## CHIP-8

<p align="center">
  <img src="../screenshots/elecdex-chip8.jpg" alt="Amber テーマで中央の列いっぱいの CHIP-8 ペイン：T8NKS のタイトル画面（向かい合う 2 台の戦車を琥珀の 4 階調で描く）、横にキーパッド、レジスタ、プログラムカウンタの前後のコード">
  <br><sub>CHIP-8 · Amber</sub>
</p>

| | |
|---|---|
| 開き方 | retro プリセット（タブ）。ピッカー: "chip-8"。何枚でも置け、前面に出せる |
| 読むもの | 同梱のライブラリと、main のファイル選択で取り込んだプログラムのファイル |
| 更新 | 動かしていて、ペインが見えている間だけ動く。見えなくなると一時停止 |
| プラットフォーム | Windows、macOS、Linux（macOS と Linux は手で検証していない） |
| プライバシー | ネットワークを使わない。ページはファイルのパスを受け取らない |
| 設定 | *Settings → General → chip-8*: show the core（既定 ON）、buzzer volume（既定 50%。操作音が OFF なら鳴らない）。速度と互換モードはプログラムごとに TUNE で |

### 機械

- elecdex のために TypeScript で書いた CHIP-8・SUPER-CHIP・XO-CHIP の機械で、2D canvas に描きます（WASM や eval は使いません）。Timendus の chip8-test-suite を 3 機種すべてで通ります。
- Octo を基準にしています。どの機種でもすべての命令を実行し、機種が決めるのはメモリ（4 KB、XO-CHIP は 64 KB）と互換モードの既定だけです。どの機種にもない命令に来ると HALT で止まり、その場所を示します。

### ライブラリ

- chip8Archive（CC0）の 104 本（ゲーム、ビジュアルノベル、リズムゲーム、おもちゃ、Octojam のタイトルカード。作者名つき）と、テストスイートの 8 本（DIAG）が入っています。
- 種類ごとのタブ: ACTION、PUZZLE、STORY、MUSIC、TOYS、SHOWCASE、DIAG、IMPORTED。★ を付けると ★ のタブも出ます。検索はライブラリ全体から探します。3 機種の表示を切り替えられます。
- どの行にも画面の見本が付きます。ライブラリを作るときに、同じ機械でプログラムを 10 秒動かして作ったものです。
- 行にポインタを留めると詳細カードが開き、説明の全文、機種と画面、速度、互換モード、キー、日付、回転、ライセンスを出します。
- 選んだプログラムは、ライブラリを触っている間、詳細の横で勝手に動きます。ポインタ、キー、検索が 30 秒なければ止まります。
- 一覧と詳細の境はドラッグで動かせ、ダブルクリックで半分に戻ります。

### 遊ぶ

- 画面はドット 1 つを画面の整数ピクセルで描き、蛍光体の残光とドットの間の格子を付けます。どちらも切れ、FIT で領域いっぱいにもできます。色はテーマの色（THEME）か作者の配色（ORIGINAL）です。
- キーパッドは位置で 1234 / QWER / ASDF / ZXCV です。Octo と同じく、矢印と Space も 5 7 8 9 と 6 を押します。
- キーを受け取るのはペインにフォーカスがある間だけです。Ctrl、Alt、システムキーとの組み合わせ、Tab、Esc、ファンクションキーは受け取りません。ペインのボタンを押すと、フォーカスは機械に戻ります。
- **P** で一時停止、一時停止中の **Enter** で 1 フレーム進みます。

### パネル

- **CORE** にはレジスタ、スタック、プログラムカウンタの前後のコードが出ます。**STEP** で 1 命令、**FRAME** で 1 フレーム進めます。
- **MEM** にはプログラムカウンタか I の周りのメモリと、I からのバイトをスプライトとして描いたものが出ます。
- **TUNE** で速度と互換モード（VIP・SCHIP・XO、または 1 つずつ）を変えられます。変えた設定はそのプログラムに残り、どのペインでも効きます。**OWN** でプログラム自身のものに戻ります。
- **SAVE** では、プログラムごとに 3 つの機械を画面の見本つきで残せます。

### セーブと取り込み

- 見えなくなると一時停止し、戻ってきても待っています。レイアウトで動かしても、続きから動きます。
- やめた所は AUTO に残ります。書くのは遊ぶのをやめたときで、タイマーでは書きません。再起動の後でも **LOAD** が **CONTINUE**（最初からは **NEW**）になります。
- **+ IMPORT** で、手元のプログラムのファイル（`.ch8`、`.c8`、`.sc8`、`.xo8`、`.bin`、またはすべてのファイル。65,024 バイトまで）を main のファイル選択から取り込みます。
  - 機種はプログラムが届く命令から推定します。
  - 見本はライブラリと同じように作ります。
  - 名前と機種はあとから直せます。機種を変えると、調整とセーブは消えます。
  - **REMOVE**（2 度押し）で、ファイルを調整、★、セーブごと消します。
- ★ を付けたプログラムは ★ のタブに集まります。
- 残したものは main のもので、elecdex のユーザーデータのフォルダにあります（`chip8/library.json`、取り込んだファイル、セーブ）。別の PC へ持ち運ばれるレイアウトには入りません。

<p align="center">
  <img src="../screenshots/pane-chip8.jpg" alt="CHIP-8 ペイン単体：プログラムの画面と、横にキーパッドとコアのパネル">
  <br><sub>CHIP-8</sub>
</p>

## ELEC-16

<p align="center">
  <img src="../screenshots/elecdex-elec16.jpg" alt="中央の列の CLASSIC スキンの ELEC-16 ペイン：名前板に ELEC-16 と 16-BIT POCKET COMPUTER とある黒いポケコン、正弦波を描く灰緑の液晶、赤い BRK キーのあるキーボード、横に CORE でレジスタとコード">
  <br><sub>ELEC-16 · CLASSIC スキン</sub>
</p>

| | |
|---|---|
| 開き方 | retro プリセット（ELEC-16 と ELEC-16 SCI のタブ）、desk プリセット（ELEC-16 SCI）。ピッカー: "elec-16" と "elec-16 sci"。何枚でも置け、前面に出せる |
| 読むもの | main のファイル選択で取り込んだもののほか、機械の外は何も読まない。LINK が AI に届くのは ON にしたときだけ |
| 更新 | 電源が入っていて、眠っておらず、見えている間だけ動く。プロンプトでは眠る。液晶を描くのは 1 秒に 30 回まで |
| プラットフォーム | Windows、macOS、Linux（macOS と Linux は手で検証していない） |
| プライバシー | 利用者のコードは機械語としてだけ動き、JavaScript として動くことはない。API キーはページにも機械にも届かない。LINK が送るのは問いだけで、人がキーを押した後だけ |
| 設定 | *Settings → General → elec-16*: buzzer volume、skin of a new pane。ユニットごとにパネルの TUNE と LINK で |

elecdex のために設計した 16 ビットのポケコンで、実在の機種の写しではありません。CPU（E16。32 ビットと 16 ビットの命令を混ぜる RISC）、ROM、フォント、BASIC はすべて自前です。ペインのタブには機械の種類が出ます: ELEC-16 POCKET、HANDHELD、PLAY、SCI。

### モデル

モデルはパネルの TUNE で選びます。変えると機械は再起動します。

| モデル | 画面 | 文字 | 起動すると |
|---|---|---|---|
| POCKET-32 | 240×32、1 ビット | 40 桁 4 行 | BASIC |
| POCKET-48（既定） | 240×48、1 ビット | 40 桁 6 行 | BASIC |
| POCKET-64 | 240×64、1 ビット | 40 桁 8 行 | BASIC |
| HANDHELD-160 | 160×144、4 階調 | 26 桁 18 行 | BASIC |
| PLAY-320 | 320×288、カラー | — | 起動画面（[PLAY-320](#play-320)） |
| SCI-128 | 128×64、1 ビット | 21 桁 8 行 | 電卓（[ELEC-16 SCI](#elec-16-sci)） |

- POCKET と HANDHELD のモデルの間では RAM が残ります。
- PLAY-320 や SCI-128 との行き来では RAM が消えるので、TUNE は 2 度押しで確かめます。

### 機械

| 部分 | |
|---|---|
| CPU | E16: 16 ビット RISC、レジスタ 16 本、32 ビットと 16 ビットの命令を混ぜる |
| クロック | 既定 4 MHz。ユニットごとに TUNE で 1、2、4、8、16、32 MHz か MAX。タイマーと時計はホストの時刻で進むので、どの速さでも `WAIT` と `TIME$` はずれない |
| メモリ | RAM 32 KB、電池バックアップ付き（起動時の BASIC の空きは 26,622 バイト）。7000–7BFF（3 KB）は機械語の領域 |
| そのほか | ブザー、タイマー、時計、10 進浮動小数点の演算ユニット、記憶カード |

### BASIC とモニタ

- 起動すると **BASIC** になります。`3*4+SIN 30` と打てば答えが、行番号を付ければプログラムになります（`LIST`、`RUN`、`AUTO`、`RENUM`）。
- 文字列、配列、`DATA`、音（`BEEP`）、点と線と円（`PSET`、`LINE`、`CIRCLE`）、時計（`TIME$`）、記憶カードのファイル（`SAVE`、`LOAD`、`FILES`、`OPEN`）が使えます。
- 方言は独自のもので、どの会社の ROM、説明書の文、方言も写していません。
- `MON` で機械語モニタ（ダンプ、書き込み、実行、逆アセンブル、ブレークポイント）を開きます。
- **BRK**（赤いキー、PC では Pause）でいつでも機械を取り戻せます。

### キーと PASTE

- ペインにフォーカスがある間は PC のキーボードで打てます。KANA モードでは JIS かな配列でカナを打ちます。
- Esc、Tab、ファンクションキー、Ctrl・Alt・システムキーとの組み合わせは取らず、アプリに残します。
- **PASTE**（または機械の上で右クリック）は、クリップボードをキーの列として打ち込みます。打てない文字は飛ばして数えます。Ctrl+V は取りません。

### 液晶とスキン

- 液晶は既定で 240×48 です。本物のようなドットの影、ゆっくり消える残像、コントラストまで 1 ドットずつ描きます。描くのは機械の解像度で、画面の整数ピクセルにくっきり拡大します。
- 本体は丸ごと描くか、描かないかです。FULL（本体とキーボード）、COMPACT（液晶とキー 1 列）、LCD（液晶だけ）を、ペインの大きさから選ぶか、TUNE で固定します。引き伸ばしはしません。
- 13 のスキンで本体を着せ替えます: ELEC、PLAIN、TRON、BUSINESS LIGHT、BUSINESS DARK、CLASSIC、IVORY、NIGHT、ALLOY、GRAPHITE、NEO、MOCHI、GLASS。PLAIN は本体を描かず、今のテーマのアプリの見た目になります。
- うち 5 つは光で立体に描き、キートップもそれぞれの書体で刻みます:
  - **ALLOY**: ヘアラインの金属に黒い鍵盤の板
  - **GRAPHITE**: 黒鉛色の梨地に白いテンキー
  - **NEO**: 低いキーと紙のような画面の、今のポケコン
  - **MOCHI**: 桜色に水玉、飴のような艶のパステルのキーのかわいいもの
  - **GLASS**: 奥に基板が見える透明なガラスの筐体で、テーマの明暗とアクセントに従う
- どれも実在の製品の写しではありません。

<table>
  <tr>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-alloy.jpg" alt="ALLOY：ヘアラインの金属に彫った名前板の文字、琥珀の線 1 本、沈んだ黒い板に黒いキー"><br><sub>ALLOY</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-graphite.jpg" alt="GRAPHITE：黒鉛色の梨地の本体、明るいキー、白に近いテンキー、濃い機能キーと赤い BRK"><br><sub>GRAPHITE</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-neo.jpg" alt="NEO：冷たい明るい灰の本体、切り欠きに収まった低いキー、紙のような画面、コバルトの ENTER"><br><sub>NEO</sub></td>
  </tr>
  <tr>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-mochi.jpg" alt="MOCHI：桜色に白い水玉、ミント・クリーム・レモン・ラベンダーの艶のあるパステルのキー、プラム色の画面"><br><sub>MOCHI</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-glass.jpg" alt="暗いテーマの GLASS：縁が光る暗いガラスの本体、奥に見える基板、ガラスのキー"><br><sub>GLASS</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-glass-light.jpg" alt="明るいテーマの GLASS：同じガラスを明るくしたもの、ENTER にアクセントの青"><br><sub>GLASS・明るいテーマ</sub></td>
  </tr>
</table>

### ユニット、電池バックアップ、記憶カード

- 1 台の機械は main が持つ **ユニット**です。ペインが持つのはユニットの id と表示の選択だけです。
- ユニットの RAM は電池バックアップで、再起動の後も残ります。バックアップを書くのは、ペインが隠れたか閉じたとき、電源を切ったとき、ページが去るときで、タイマーでは書きません。
- 1 台を動かすのは 1 つのペインだけです。2 つ目のペインには **MOVE HERE**（引き継ぐ）と **NEW UNIT** が出ます。
- カードにはユニットのファイルを置きます。名前は英大文字と数字の 8+3 文字まで、1 ファイル 32 KB、1 枚 256 KB までです。
- パネルのカードの画面では、`.bas`（テキスト）、`.asm`（main がアセンブルして `.BIN` に）、バイナリ、データのファイルを **IMPORT** / **EXPORT** できます。どれも main のファイル選択を通ります。
- 自動電源 OFF（既定 10 分、30 分、しない）は、機械がキーを待っている間だけ数えます。RAM は残ります。

### パネル

| タブ | |
|---|---|
| CORE | レジスタとコード。ブレークポイント、STEP、HALT |
| MEM | メモリ。PC、SP、VRAM、または好きな番地を追う |
| FILES | カードと SOFT CARD。LOAD ▸ が `LOAD` の行を打ち込む |
| TUNE | PASTE、クロック（1〜32 MHz、MAX）、モデルと液晶、本体の描き方、コントラスト、残像、スキン、自動電源 OFF |
| LINK | LINK 全体とサービスごとの ON/OFF、AI のプロバイダ、送った数、直前の失敗 |
| GAMES | PLAY-320 だけ: カートリッジの差し口とゲームの棚 |

機械の上の帯には、CPU ランプ（running、asleep、off）、SND、KEYS（フォーカス）、一時停止、BRK、POWER、RESET（CPU を始め直す。RAM は残る）、PANEL、CODE があります。

### SOFT CARD

SOFT CARD には 13 本のプログラムが入っていて、どのユニットのカードにも読み出し専用で重なります。

| プログラム | |
|---|---|
| SINEWAVE | 正弦波 |
| BOUNCE | はねる玉 |
| CLOCK | 時計 |
| MAZE | 迷路 |
| PRIMES | 素数 |
| HITBLOW | 数当て |
| LANDER | 月着陸 |
| CANNON | 大砲で的を撃つ |
| BIORHYTH | バイオリズム |
| UNITS | 単位の換算 |
| CHAT | LINK で AI と話す |
| ASMDEMO.BIN | 機械語の見本 |
| TICKER.BIN | 機械語の流れる文字 |

- BASIC から: `FILES "SOFT"` で一覧、`LOAD "PRIMES"` で読み込み。
- パネルの FILES でプログラムを選ぶと、その使い方も出ます。
- 同じ名前のファイルを自分のカードに保存すれば、そちらが読まれます。

### LINK

- **LINK** でプログラムから、elecdex の AI の設定にある AI と話せます。プロバイダと鍵は [AI チャット](panes-ai.ja.md#ai-chat)ペインと同じものです。
  - `ASK Q$,A$` で問いを渡して答えを受け取ります。英語で、カナで聞けばカナで答えます（液晶に漢字はありません）。
  - `ASK TYPE` で答え方を選びます: ふつう、先生、BASIC の相談役、クイズ、物語、詩、占い、辞書、翻訳、ウェブ検索、天気。
  - `ASK NEW` で新しい会話を始めます。
- **ON にするまで何も送りません**（パネルの LINK）。LINK 全体は既定で ON、AI のサービスは OFF、CART（PLAY-320 のカートリッジ。アプリの中で済む）は ON です。
- 送るのは問いと、そのユニットの直近の会話だけです。会話は main のメモリにだけ置き、ディスクには書きません。機械のメモリのほかの部分は送りません。
- 人がキーを押すまで、プログラムは次を送れません。PASTE が打つキーは数えません。1 台につき 1 つずつで、180 秒で時間切れです。
- 答えは液晶の文字としてだけ機械に届きます。検索や天気もモデルが答えます（プロバイダの側のウェブ検索）。このコンピューターでは何も動きません。
- API キーは暗号化して main に置きます。鍵のないプロバイダ（ローカルのモデル）も選べます。

### CODE

- **CODE** は、TypeScript の部分集合（e16c）で書いたプログラムを 3 段階の最適化で機械語にコンパイルし、大きさとサイクル数を並べて見せます。
- **RUN ▸** で機械に入れて動かし、**LOAD ▸** でモニタ用に置きます。SAVE TO CARD で `.BIN` として残せます。
- コンパイラはページの Worker で動きます。利用者のコードは機械語としてだけ動き、JavaScript として動くことはありません。
- CODE はどのモデルでも使えます。PLAY-320 と SCI-128 では、RUN が起動画面や電卓から直接プログラムを呼びます。

### 負荷

- プロンプトで待つ間は CPU が眠り、ペインの負荷は一時停止したものとほぼ同じです。
- 見えなくなると止まり、電池バックアップを書きます。戻ったとき、プロンプトで眠っていた機械はそのまま続き、動いていた機械は一時停止の表示から戻ります。
- Windows での実測（アプリ全体、1 コア比）: プロンプトで眠る間は約 7%、4 MHz で毎フレーム画面を書くと約 23〜28%、32 MHz で約 40%。

<p align="center">
  <img src="../screenshots/pane-elec16.jpg" alt="ELEC-16 ペイン単体：ポケコンの本体と液晶、横にパネル">
  <br><sub>ELEC-16</sub>
</p>

## PLAY-320

<p align="center">
  <img src="../screenshots/elecdex-play-air.jpg" alt="Phosphor テーマで横長のグラファイトの本体の PLAY-320 にした ELEC-16 ペイン：画面に ELECAIRCOMBAT のコックピット、シーカーの円の中のエース GANNET に赤いロックの枠と ENGAGE、命中したミサイルの爆発、下にレーダー・スコア・損傷の表示と点いた LCK のランプ。横に CORE で動いている E16 のレジスタとプログラムカウンタのコード">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECAIRCOMBAT · Phosphor · 横に CORE</sub>
</p>

| | |
|---|---|
| 開き方 | ELEC-16 ペインの TUNE でモデルを PLAY-320 に（銘板は ELEC-16 PLAY） |
| 読むもの | main のゲームの棚のカートリッジ。自分のものは main のファイル選択か GAMES ▸ DEVELOP から |
| 更新 | 動いていて見えている間、1 秒に 60 フレーム |
| プラットフォーム | Windows、macOS、Linux（macOS と Linux は手で検証していない） |
| プライバシー | ネットワークを使わない。CART のサービスはアプリの中で済む |
| 設定 | TUNE: 拡張 RAM、本体、色、クロック。LINK: CART |

### ゲーム機

| 部分 | |
|---|---|
| 画面 | 320×288、32,768 色（RGB555）から選ぶパレット、1 秒に 60 フレーム |
| 描画 | スクロールする背景 2 枚、スプライト 128 個、パレット 16 本、行の割り込み、DMA を持つ描画回路 |
| 音 | ステレオの 16 チャンネル。エンベロープ、スライド、波形表 |
| メモリ | RAM 32 KB と、TUNE で選ぶ最大 512 KB の拡張 RAM |
| カートリッジ | ROM 最大 1 MB、セーブ RAM 最大 32 KB（ゲームごとに残る） |
| 起動 | 起動画面。BASIC もモニタもなく、自動で電源は切れない |
| 本体 | 縦長か横長、12 個のボタン（十字、A、B、X、Y、L、R、START、SELECT）。色は graphite、ivory、coral。画面だけにもできる |

### 操作

| PC のキー | ボタン |
|---|---|
| 矢印 | 十字 |
| Z / X / S / A | A / B / X / Y |
| Q / W | L / R |
| Enter / 右 Shift | START / SELECT |
| Pause | BRK |

- 標準の配置のゲームパッドも、ボタンの位置で使えます。左スティックも使えます。
- キーとゲームパッドが機械に届くのは、ペインにフォーカスがあり、見えている間だけです。

### ゲームを遊ぶ

- パネルの **GAMES** で棚からカートリッジを差し、**START** で遊びます。CODE のプログラムも動かせます。
- 棚には 4 本のゲームが入っています:
  - **ELECLANCE**: LANCE、ボム、OVERDRIVE、2 体のボスの縦スクロールシューティング（[説明](../elec16-eleclance.md)）
  - **ELECAIRCOMBAT**: コックピットから見る 1 対 1 の空中戦。空と海を毎フレーム描き直して水平線が傾き、独自の敵機を 17 方向 × 8 回転 × 7 大きさで描いてカートリッジから写す。機銃、ロックオンのミサイル、フレアで 5 人のエースと戦う（[説明](../elec16-elecaircombat.md)）
  - **ELECDRILL**: 掘り進むブロックパズル。同じ色のかたまりがまとめて消え、支えを失ったブロックは揺れて落ち、4 個そろうと連鎖。空気に気をつけて 5 つの地層を 500 m の核まで（[説明](../elec16-elecdrill.md)）
  - **ELECFIGHTER**: ラウンド制の 1 対 1 の対戦格闘。戦うのは名前のない人型の枠、産業用の格闘シミュレータの訓練用の体。低ポリゴンのモデルから前もって描いたワイヤーとベタ塗りの人が、弱と強、高さで変わるガード、投げと投げ抜け、チェーン、カウンター、ダッシュで、それぞれ別の頭を持つ 4 つの対戦プログラムと戦う（[説明](../elec16-elecfighter.md)）
- 遊び方は [PLAY-320 の取扱説明書](../elec16-play-manual.md) にあります。
- カートリッジの ROM は電池バックアップに入りません。ページが棚から中身のハッシュで差し直します。同じゲームが棚になければ、起動画面に戻ります。

<p align="center">
  <img src="../screenshots/elecdex-play.jpg" alt="Business (Dark) テーマで縦長のコーラルの本体の PLAY-320 にした ELEC-16 ペイン：カラー画面に ELECLANCE、小さな敵の間をまっすぐ上に LANCE を撃つ自機、横の表示にスコア・CHAIN・SHIP・BOMB・VOLT。横に GAMES で、差し口に ELECLANCE、3 本の棚と DEVELOP">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECLANCE · Business (Dark)</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play-drill.jpg" alt="Business (Light) テーマで画面だけを出す PLAY-320 の ELEC-16 ペイン：ELECDRILL の赤・黄・緑・青のブロックの井戸、深さ 34 m の掘り手と上に光る 3 CHAIN、両側に深さの計器・AIR のタンク・DRILLERS・CHAIN の表示。横に MEM で E16 のメモリを 16 進で">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECDRILL · Business (Light) · 画面だけ、横に MEM</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play-fighter.jpg" alt="Tron テーマで画面だけを出す PLAY-320 の ELEC-16 ペイン：GRID のステージでの ELECFIGHTER の第 1 戦、青いワイヤーとベタ塗りの S4 OUTBOX が赤の S2 RUSH に火花とともにパンチを当てる。後ろに街並みと遠近の床、上に体力のバーと TIME。横に GAMES で差し口に ELECFIGHTER">
  <br><sub>ELEC-16 PLAY（PLAY-320）· ELECFIGHTER · Tron · 画面だけ、横に GAMES</sub>
</p>

### ゲームを作る

- ゲームは、PNG の絵とテキストで書いた曲を取り込むゲームキットで、e16c から作ります。
- **GAMES ▸ DEVELOP** でゲームのフォルダを開きます。空のフォルダを選べば、雛形から新しいゲームを書き出します。
- アプリの中でビルドしてユニットに差し、ファイルを保存するたびに作り直します。Node もリポジトリも要りません。
- main が読むのは、そのフォルダの中の、ゲームの `game.json` が名指すファイルだけです。書き戻すのは `assets.e16.ts` と `compiled.s` だけです。ビルドはページの Worker で行います。
- ビルドしても勝手には始まりません。START は人が押します。
- [ゲーム開発の手引き](../elec16-kit.md) を見てください。

## ELEC-16 SCI

<p align="center">
  <img src="../screenshots/elecdex-sci.jpg" alt="Business (Light) テーマで縦長のチョークホワイトの本体の SCI-128 電卓にした ELEC-16 ペイン：教科書のように分数を組んだ 2D の sin(45)+1/2、その下に正確な形の答え (1+√2)/2。オレンジの SHIFT 面と ALPHA の文字のキー、濃い色のカーソルパッド、赤い DEL と AC、青い =。横に CORE で E16 のレジスタとコード">
  <br><sub>ELEC-16 SCI（SCI-128）· CHALK · Business (Light)</sub>
</p>

| | |
|---|---|
| 開き方 | retro と desk のプリセット（タブ）。ピッカー: "elec-16 sci"。新しいユニット（SCI 1、SCI 2 …）で開くので、だれかの BASIC が消えることはない |
| 読むもの | 機械の外は何も読まない |
| 更新 | キーを待つ間は眠る。自動電源 OFF はポケコンのモデルと同じ |
| プラットフォーム | Windows、macOS、Linux（macOS と Linux は手で検証していない） |
| 設定 | TUNE: 本体（SLATE、CHALK、PLAIN）、クロック、自動電源 OFF、FULL / SIMPLE / COMPACT / LCD |

独自に設計した関数電卓のモデル SCI-128 で、128×64 の液晶と縦長の本体を持ちます。本体は SLATE、CHALK、またはテーマの色の PLAIN です。PLAIN はポケコンの PLAIN と同じく本体を描かず、液晶とパネルの罫線で囲んだキーだけになります。SIMPLE は液晶と数のキー（0〜9、.、EXP、ANS、DEL、AC、+ − × ÷、=）だけを出し、ふつうの電卓のように使えます。AUTO はこれを選びません。言葉は独自のもので、どの会社の名前、つづり、キーの並びも使いません。

### 式と答え

- 式は 2D（分数、根号、累乗を教科書の形で組み、縦線のカーソルがその中に入る）か 1 行で打ちます。
- 答えはできるかぎり分数と `(p + r√s)/q` の正確な形のまま残ります（sin 45° は √2/2、1/3+1/6 は 1/2）。F⇄D で大きな数字の小数にします。
- 変数、Ans、M、履歴。
- **FUNC**: gcd、lcm、%（500+25% は 625）、int、round、rand、dice、coin、pol、rec と、STATS の結果や推定値を式の中で。
- ほかに、定数計算、角度の換算、上書き、度分秒、双曲線関数、f(x) と FIND X。

### モード

| モード | |
|---|---|
| STATS | 1 変数と 6 つの回帰（直線、2 次、指数、対数、べき乗、逆数）。40 行まで |
| BASE | 32 ビットの HEX・DEC・OCT・BIN・5 進と AND・OR・XOR・XNOR |
| TABLE | 30 行までの f(X) の表 |
| EQUATION | 2 元・3 元の連立、正確な解や虚数解の 2 次、3 次 |
| CPLX | 複素数。a + bi と r∠θ |
| MATRIX | 3×3 までの行列とベクトル: 行列式、逆行列、転置、内積、外積 |
| PROG | 入力、出力、条件、ジャンプのあるプログラム 4 本 |

- **CONST** で物理定数 20 個（CODATA 2022）を入れます。
- **CONV** で 20 組の単位を換算します。
- **Σ・d/dx・∫** で X の式の和・微分・積分を求めます。和は正確な形のままです: Σ(1/X,1,4) は 25/12。
- v0.0.44 で追加:
  - `mod` と Π
  - →PRIME（答えを素因数の積で: 360 は 2³×3²×5）
  - SI 接頭辞（47k×220p。ENG をもう一度押すと 10.34μ）
  - 正規分布（nlow、nmid、nup、→z）
  - EQUATION の 2 次・3 次の不等式（X²−X−6>0 は X<−2 と 3<X）

### キーとパネル

- PC から: 数字、`+ - * / ^ ( ) .`、Enter（=）、Backspace（DEL）、Delete（AC）、矢印。
- 文字のキーは関数です: `s` SIN、`c` COS、`t` TAN、`l` LN、`g` LOG、`r` √、`f` a/b、`e` EXP、`!` x!。Shift を押しながらの文字は、そのキーの SHIFT 面を打ちます。
- パネルは CORE、MEM、TUNE です。FILES、GAMES、LINK、PASTE はありません。
- 画面はほかのモデルと同じく読み上げられます。
- [SCI-128 の取扱説明書](../elec16-sci-manual.md) を見てください。

## 説明書とガイド

説明書は日本語です。

| 文書 | |
|---|---|
| [BASIC](../elec16-basic.md) | ELEC-16 BASIC |
| [E16 の機械語とモニタ](../elec16-e16.md) | 命令セット、アセンブラ、モニタ、ROM サービス |
| [e16c（CODE の TypeScript）](../elec16-e16c.md) | TypeScript の部分集合と CODE 画面 |
| [SOFT CARD のプログラム](../elec16-soft.md) | 各プログラムの動かし方と遊び方 |
| [PLAY-320](../elec16-play-manual.md) | ゲーム機の取扱説明書 |
| [PLAY-320 のゲーム開発](../elec16-kit.md) | ゲームキットと GAMES ▸ DEVELOP |
| [ELECLANCE](../elec16-eleclance.md)、[ELECAIRCOMBAT](../elec16-elecaircombat.md)、[ELECDRILL](../elec16-elecdrill.md)、[ELECFIGHTER](../elec16-elecfighter.md) | 4 本のゲーム |
| [SCI-128](../elec16-sci-manual.md) | 関数電卓の取扱説明書 |
| [pocket.html](../elec16-guide/pocket.html)、[sci.html](../elec16-guide/sci.html) | ポケコンと関数電卓の HTML のかんたんガイド |

- GitHub では HTML のファイルはソースとして表示されます。かんたんガイドは、リポジトリを手元に取ってブラウザーで開いてください。
- 機械の中でも、FILES でプログラムを選ぶとその使い方が出ます。

## 設計の文書

- [architecture.md §5.18 CHIP-8](../architecture.md#518-chip-8-ペインchip-8super-chipxo-chip-を遊ぶ)
- [architecture.md §5.19 ELEC-16](../architecture.md#519-elec-16-ペイン16-ビットポケコン設計済み作成中)
- [emu.md](../emu.md): エミュレーターが共有する土台
- [elec16.md](../elec16.md): 機械、ROM、e16c、ペイン、保存、LINK
- [elec16-play.md](../elec16-play.md): PLAY-320 のモデル
- [elec16-sci.md](../elec16-sci.md): SCI-128 のモデル
