# デモ動画の作り方・直し方・撮り方

紹介動画や X・YouTube 用の動画は、アプリを Playwright で動かすスクリプト（`scripts/demo-*.mjs`）で撮る。
手で操作して録るのではなく、毎回同じ動きを再現できるようにするためで、リリースごとに撮り直す
（紹介デモはリリースごとに更新する。CLAUDE.md の Publishing、利用者の決定 2026-09-27）。

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
| `demo:tour` | 紹介デモ（起動画面、プリセット、ORBIT、エージェント、Docker、メディア、KEYSTREAM、cockpit、retro、ELEC、テーマ） | 1600×900、起動のあと約 156 秒 |
| `demo:tour-black` | 同じものを Black テーマで（`--theme=black`） | 同上 |
| `demo:tour-shorts` | 紹介デモの 9:16 版（2 段のレイアウト） | 540×960 を zoom 0.75（720×1280 として描く）、起動込みで 2 分以内 |
| `demo:cockpit` | cockpit プリセット単独（カード、全コアの負荷、前に出す、境目のドラッグ、テーマ） | 1600×900、Black、約 61 秒 |
| `demo:keystream` | KEYSTREAM の曲を通しで | |
| `demo:games` | PLAY-320 の 3 本のゲーム | |
| `demo:elec16` | ELEC-16 単独 | 1280×600 |
| `demo:panes` / `demo:snippets` / `demo:wifi` / `demo:dev` / `demo:elec` / `demo:presets` / `demo:shorts` | X 用の短いもの | |
| `demo:whatsnew` / `demo:whatsnew22` | そのリリースで増えたもの | |

一覧と一言の説明は CLAUDE.md の Commands にもある。各スクリプトの先頭のコメントに、場面の並びと何が代役かが書いてある。

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
   与える（CLAUDE.md の Publishing）。
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
- **Web ペインは `--shots` に写らない**: テレビや X のペインは別の WebContentsView なので、
  ページのスクリーンショットでは空白に見える。録画には映る。切り替えの瞬間に写る代役の絵で確かめる。
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
