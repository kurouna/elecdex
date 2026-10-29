# デモ動画の作り方・直し方・撮り方

紹介動画や X・YouTube 用の動画は、アプリを Playwright で動かすスクリプト（`scripts/demo-*.mjs`）で撮る。
手で操作して録るのではなく、毎回同じ動きを再現できるようにするためで、リリースごとに撮り直す
（紹介デモはリリースごとに更新する。.claude/rules/publishing.md、利用者の決定 2026-09-27）。

## 1. 撮り方（再生と録画）

Windows でだけ動く（README のスクリーンショットと同じく、Windows のスタブと PowerShell を前提にしている）。

1. `npm run build`（デモは `out/` のビルドを動かす。ソースを変えたら必ずビルドし直す）
2. 録画範囲を決める: `npm run demo:tour -- --probe` で窓だけを開き、大きさと位置を確かめる
3. 本番: `npm run demo:tour`。窓は `--lead` 秒（既定 10 秒）たってから開くので、その間に録画を始める
4. 終わったら窓を閉じる（`--exit` を付けると最後に自動で閉じる）

`npm run` に引数を渡すときは `--` の後に書く（`npm run demo:tour -- --theme=black`）。

### 主なデモ

| コマンド | 内容 | 大きさ・長さ |
|---|---|---|
| `demo:tour` | 紹介デモ（起動画面、プリセット、network の ETHERNET と LINK のカード、ORBIT、エージェント、Docker、LOG WATCH、メディア、KEYSTREAM、アクションパレットで cockpit、retro（ELEC-16 は波を描いたまま TUNE でスキンを ALLOY・GLASS・MOCHI と替える）、ELEC、テーマ） | 1600×900、起動のあと約 168 秒 |
| `demo:tour-black` | 同じものを Black テーマで（`--theme=black`） | 同上 |
| `demo:tour-shorts` | 紹介デモの 9:16 版（2 段のレイアウト。network は Wi-Fi の下に ETHERNET） | 540×960 を zoom 0.75（720×1280 として描く）、起動込みで 2 分以内（約 116 秒） |
| `demo:panefx` | ペインの動きの紹介（*unreleased* の演出を含む）。standard から dev プリセットのキーで切り替え、Ctrl+Shift+矢印でペインを渡り歩いて枠が光る、Ctrl+Tab でクリップボードのグループのタブが瞬いて点灯、コンテナの後ろのシェルを右に分割（新しいペインが点灯し、場所を譲った辺が光る）、そのシェルをタイトルでドラッグ（四隅の括弧、着地の飛行、残ったペインが広がる）、Ctrl を押したままリポジトリのグループにタブとして落とす、前面に出して戻す、エージェントのペインを閉じて通知の undo で戻す。英語の字幕付き | 1600×900、約 52 秒 |
| `demo:cockpit` | cockpit プリセット単独（カード、全コアの負荷、前に出す、境目のドラッグ、テーマ） | 1600×900、Black、約 61 秒 |
| `demo:devflow` | dev プリセットの紹介と使い方（standard から Ctrl+Shift+G のダイアログでプリセットの dev を選ぶ、エージェント、Git の差分とコミット、テストの負荷、Docker の再起動、クリップボード、AI チャット、シェル）。英語の字幕付き。`demo:devflow-ja`（`--ja`）は字幕だけ日本語 | 1600×900、約 62 秒 |
| `demo:logwatch` | LOG WATCH ペイン単独（ファイルを選ぶ、流れる行・×n・NEW、ERROR BURST とスタックトレース、/regex/ の絞り込み、PATTERNS と MUTE、MASK、2 行を選んで EXPLAIN）。英語の字幕付き。ログはテイクが固定の種から書き、AI は代役 | 1280×720、約 55 秒 |
| `demo:keystream` | KEYSTREAM の曲を通しで | |
| `demo:games` | PLAY-320 の 3 本のゲーム | |
| `demo:elec16` | ELEC-16 単独 | 1280×600 |
| `demo:sci` | ELEC-16 SCI（SCI-128）単独。Black のテーマに CHALK の本体（利用者の決定 2026-10-25）。本体のキーを手で押すように、まず v2 の CONST（h × 5×10¹⁴ Hz）と CONV（100 °F を °C に）、Σ(1/X,1,4) = 25/12 と ∫(X²,0,3) = 9、CPLX の (1+2i)(3−i) と r∠θ、MATRIX で 2×2 を打って逆行列、PROG で斜辺のプログラムを打って走らせる。続いて sin45°+½ を 2D で打って (1+√2)/2、F⇄D で小数、500+25% = 625、定数計算（K）、EQUATION の 2 次方程式の正確な解と頂点、STATS の直線の回帰、BASE の HEX の AND と BIN のドット、TUNE で SLATE・PLAIN・CHALK。横に CORE。英語の字幕は電卓と CORE のあいだ（`captionPlace`）。`--theme` で別のテーマ | 1600×900、約 130 秒 |
| `demo:elec16-intro` | ELEC-16 の紹介。左にポケコン（POCKET-48、CLASSIC）、右に関数電卓（SCI-128、CHALK）を並べ、ゲームは出さない。ポケコンは電源の入れ直し、プロンプトでの計算と ANS、0.1+0.2、文字列の答え、LEFT$・MID$・RIGHT$・SPACE$・STRING$、本体のカナキーで PRINT "ｶﾀﾅ"、AUTO で打つ DATA・READ・BEEP の音階を RUN、RENUM と LIST、LINE と CIRCLE と GPRINT、MON で E16 マニュアルの 32 バイトを書いて U・G・Q・CALL、PANEL の FILES で SOFT CARD の SINEWAVE、CODE の TypeScript を 3 段階で比べて RUN、TUNE でスキンを 4 つ。関数電卓は demo:sci と demo:whatsnew44 のキーの並びで、2D の正確な答えと F⇄D、→PRIME、SI 接頭辞と ENG、Σ と ∫、CONST、CPLX、MATRIX の逆行列、EQUATION の 2 次方程式と頂点と不等式、STATS、nlow、BASE。最後に電卓を前に出し TUNE で SLATE・PLAIN・SIMPLE（4 列の縦長の電卓で 1234×5678）・CHALK。ポケコンの部と電卓の部では、それぞれのペインを Ctrl+Shift+Z で前に出して見せる。英語の字幕は前に出したペインの下の中央 | 1600×900、約 275 秒 |
| `demo:panes` / `demo:snippets` / `demo:wifi` / `demo:dev` / `demo:elec` / `demo:presets` / `demo:shorts` | X 用の短いもの | |
| `demo:whatsnew` / `demo:whatsnew22` | そのリリースで増えたもの | |
| `demo:whatsnew44` | v0.0.43〜v0.0.44 で増えたもの。standard プリセットから LAYOUTS のプリセットの棚を retro まで送って切り替え、機械の名前のタブ（ELEC-16 SCI）を前に出す。新しい SCI-128 で、360 の →PRIME（2³×3²×5）、SI 接頭辞の 47k×220p を ENG 2 回で 10.34μ、Π(X,1,5) = 120、127 mod 16 = 15、nlow(1.96)、EQUATION の不等式 X²−2X−1≤0 を正確な形で答えて F⇄D で小数。英語の字幕付き | 1600×900、約 74 秒 |
| `demo:whatsnew38` | v0.0.38 で増えたもの。ELEC-16 ひとつのペインで SINEWAVE を走らせ、TUNE を開いて光で描く 5 つのスキン（ALLOY、GRAPHITE、NEO、MOCHI、GLASS）を順に。TUNE を畳んで GLASS のキーで `PRINT 4*9`、アクションパレットで Business Light にして明るいガラス、元のテーマに戻して MOCHI と ALLOY で終わる。英語の字幕付き | 1600×900、約 46 秒 |
| `demo:whatsnew36` | v0.0.35〜v0.0.36 で増えたもの。network プリセットの Wi-Fi の下の ETHERNET（CRC エラーのあるケーブルのスタブ `crc`）を前に出し、LINK と CRC の数字のカード、LOG の CRC ERRORS の行。最後にアクションパレット（Ctrl+Shift+P）で Black のテーマを探して当て、元に戻す | 1600×900、約 27 秒 |
| `demo:whatsnew34` | v0.0.34 で増えたもの。どれもペインを前に出して見せる（dev プリセットで、AI AGENT のサブエージェントが起動したサブエージェントとそのカード、GIT ペインの PUSH を 2 回押しで代役のリモートへ、GIT の隣のタブに置いた GPU ペイン。最後に cockpit の CLUSTER の GPU レーンと VRAM のスロット） | 1600×900、約 48 秒 |

一覧と一言の説明は .claude/rules/scripts.md にもある。各スクリプトの先頭のコメントに、場面の並びと何が代役かが書いてある。

### 共通のオプション（`takeOptions`、scripts/demo-take.mjs）

| オプション | 意味 |
|---|---|
| `--probe` | 窓を開いて待つだけ。録画範囲を合わせるため |
| `--width=` `--height=` | 窓の中身の大きさ（px） |
| `--x=` `--y=` | 窓の位置（省くと中央） |
| `--lead=10` | 窓が出てから始まるまでの秒数 |
| `--zoom=` | ページの拡大率。1 未満で小さな窓に多く入れる |
| `--pace=1` | すべての待ち時間に掛ける係数（1.5 でゆっくり、0.8 で速く） |
| `--theme=tron` | 組み込みテーマのどれか |
| `--shots=<dir>` | 2 秒ごとにスクリーンショットを保存する。撮れたものを確かめるため |
| `--exit` | 最後に窓を閉じる（tour、tour-shorts、cockpit、games、keystream、panes、snippets、whatsnew など） |
| `--no-intro` | 起動画面を飛ばす（tour、tour-shorts） |
| `--no-captions` | 下の英語の字幕を出さない（字幕を付けたデモ: tour、tour-black、tour-shorts、devflow） |

字幕は `openTake` が返す `caption(text)` で出す（`null` で消す）。下中央をペインが埋めるテイクは、`openTake` の `captionPlace`（`left` `right` `bottom`）で置き場所を変える（demo:sci）。紹介デモの字幕の文面は demo-beats.mjs の `CAPTIONS` と `OPENING` に 1 回だけ書き、横型と縦型の両方が使う。デモがページに足す要素で、クリックもポインターも
下へ通し、何も待たないので、操作も長さも字幕のないときと同じ。画面の下中央に出す（Web ペインはページの上に
別に描かれるので、その位置を避けている。media プリセットの Web ペインは左上と右の列）。テーマの色で `crt-on` で現れる。
起動画面のあいだの字幕は `openTake` の `opening` で渡す（`log` は起動ログ、`title` はタイトル、`shell` は最初のシェルに打つあいだ）。起動画面の場面が変わるのを待って出すだけなので、起動の長さは変わらない。

9:16 版は窓を 540×960 で録り、1080×1920 に拡大して書き出す（1080 px の高さの画面に収まるようにするため）。

## 2. 何が映り、何が代役か

撮影は毎回新しいデモ用プロファイルで行い、この PC のものは何も読まない・押さない・起きたままにしない
（demo-take.mjs `openTake`）。

- **代役**: ホームフォルダー（`C:\Users\Public\Documents\elecdex-demo`）、Git リポジトリと作者、
  Claude Code のフォルダー、通信先、Wi-Fi、クリップボード、再生中の曲とジャケット、Docker、
  Web ページ（YouTube と X の代わりのページ）、RSS、メモとタスク、ELEC の答え（モデルもキーも使わない）、
  ユーザー名（taro）とホスト名（ELECDEX-DEMO）。中身は demo-fixtures.mjs と preset-shots.mjs。
- **音楽**: KEYSTREAM の自作曲を WAV に書き出し（keystream-wav.mjs、一時フォルダーにキャッシュ）、
  スペクトラムの代役が鳴らす（`ELECDEX_AUDIO_STUB=tracks`）。
- **本物**: 人工衛星の軌道要素、天気、マーケット、地震（ペインが普段どおり取りに行く）。
- **この PC の値が映るもの**: システム列と CLUSTER の CPU・メモリ・機種名・ローカル IP など。
  README のスクリーンショット（`npm run gen:screenshots`）とは違い、デモでは隠していない。
  サムネイルに使うときは気をつける。

## 3. しくみ

| ファイル | 役目 |
|---|---|
| `demo-take.mjs` | すべてのデモの土台。オプション、プロファイル（保存したレイアウト、設定、スタブの環境変数）、窓の大きさと位置、`wait`（`--pace` が掛かる）、`--shots` |
| `demo-beats.mjs` | 紹介デモの横型と縦型が共有する「場面」（beat）。ISS のカード、コンテナの停止、KEYSTREAM、CLUSTER、ELEC-16、PLAY-320、CHIP-8、ELEC、テーマなど。場面はここに 1 回だけ書き、両方の版から呼ぶ |
| `demo-tour.mjs` / `demo-tour-shorts.mjs` | 場面の並びと待ち時間。レイアウトの木（縦型は独自の 2 段レイアウト）とユニット（`playUnits`） |
| `demo-fixtures.mjs` | 代役の世界（ホーム、リポジトリ、Claude Code のフォルダー） |
| `demo-logfeed.mjs` | LOG WATCH に映す架空のショップ API のログ。固定の種から書くので毎回同じ。`logFiles` がプロファイルの log-files.json に入れ、`live` がテイクのあいだ書き足す（`burst` でエラーを急に増やす） |
| `demo-play-kit.mjs` | PLAY-320 のゲームをキーで遊ぶ（ELECAIRCOMBAT は画面の HUD を読んで飛ぶ） |
| `demo-keystream-kit.mjs` | KEYSTREAM の曲を譜面どおりに打つ仕掛けと、メニューの歩き方 |
| `preset-shots.mjs` | ビルドしたアプリからプリセットの木を取り出す。メディアの代役ページとデスクの中身 |

場面はアプリの `data-testid` を頼りに動かす。ペインを前に出すのは Ctrl+Shift+Z（`beat.forward`）、
レイアウトの切り替えは番号キーか LAYOUTS ダイアログ（`toLayout`、`throughTheDialog`、`toPreset`）。

## 4. 直し方

1. 直すのは場面（demo-beats.mjs）か、並びと待ち時間（demo-tour.mjs / demo-tour-shorts.mjs）か決める。
   両方の版に出る動きは demo-beats.mjs で直し、版ごとの違いは引数で渡す
   （例: `aircombat(hold, { nth, title, controls, briefing })`、`cluster(hold, { cards, which })`）。
2. 新しい機能を見せるときは場面を 1 つ足し、もう正しくない場面は外す。目立つ新機能には場面を
   与える（.claude/rules/publishing.md）。
3. `npm run build` してから `--shots=<dir> --lead=2 --exit` で通しで撮り、画像を開いて確かめる。
   最後に `tour: N s after the boot` が出る。縦型は窓が出た時刻（`window up`）から最後までで測る。
4. 長さを守る。横型は約 2 分、縦型は起動画面込みで 2 分以内（YouTube ショートのため）。
   足したら、ほかの場面の待ち時間を詰める。
5. 両方の版を撮り直したら、コミットのメッセージに長さを書く。

### これまでにはまったところ

- **待ち時間は「始まり」から数えない**: KEYSTREAM は START から数えると前奏で使い切り、演奏の前に
  次へ移っていた。最初の音が打たれたこと（`__keystreamDemo.pressed > 0`）を待ってから数える。
  ほかでも、見せたいことが起きたのを待ってから数える。
- **同じペインが複数あるとき**: retro には ELEC-16 / PLAY-320 のタブが 3 つある。`getByTestId` は
  対象のペインの中で引く（`airDogfight` に `screen` を渡すのはこのため）。
- **消えかけのカードも数に入る**: 説明カードは電源を切る間も DOM に残る。ORBIT で ISS のカードが消える途中に
  Starlink のカードが出ると `orbit-tip` が 2 つになり、`getByTestId('orbit-tip').textContent()` が strict mode で
  落ちて demo:dev が止まっていた。待つカードは種類で引く（`[data-testid=orbit-tip][data-kind=starlink]`）。
- **Web ペインは `--shots` に写らない**: テレビや X のペインは別の WebContentsView なので、
  ページのスクリーンショットでは空白に見える。録画には映る。切り替えの瞬間に写る代役の絵で確かめる。
- **切り替えた直後のタイムライン**: network に切り替えた直後の Wi-Fi・ETHERNET は、見ていた秒が数秒しかなく、
  既定の 5 分では帯のほとんどが NOT WATCHED になる。紹介デモではどちらも 1 分の目盛りで開く（`window: '1m'`）。
- **大きさで段が変わるペイン**: 縦型の窓は文字が大きくなる（ルートの文字は 1.48vh）。CLUSTER の段は
  デザインのピクセルで測る（docs/cluster.md）。縦型で崩れたら、まずそのペインの大きさの判定を疑う。
- **ゲームの開始**: ELECFIGHTER や ELECAIRCOMBAT はタイトルや説明の画面を A や START で送る。
  その秒数は場面の引数で、短くしすぎると押す前に画面が来ない。
- **負荷をかける場面**（demo:cockpit）: PowerShell のジョブでは足りず遅いので、node の worker を
  コア数だけ回し、Ctrl+C で止める。

## 5. 公開の前に

- 映っているのは代役か本物か（2 節）。この PC の値（機種名、ローカル IP、プロセス名）が映ってよいか。
- ほかの人のもの（ページ、作品、曲）が映っていないか。音楽は KEYSTREAM の自作曲だけ。
- 長さ（4 節）。X の動画は 2 分 20 秒まで。
