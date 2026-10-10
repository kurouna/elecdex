# CLUSTER ペイン 設計（設計中）

1 枚で済むダッシュボード。車の計器盤のように、システム・ネットワーク・デスクの状態を 1 つのペインに
まとめ、利用者が並べ方に悩まなくて済むようにする。大きさに合わせて組み替わり、値は壁時計の秒にそろって
動く。この文書は実装前の設計で、決まったことと未決事項を分けて書く。実装が入ったら
architecture.md §5.20 に要約を移し、ここは詳細として残す。

見た目の合意はモック（Artifact「elecdex CLUSTER」第 6 版）で取った。モックの数値は作り物で、
描き方（SVG と CSS トランジション）は実装と違う（§5）。

## 0. 決定の記録

| 日付 | 決定 | 経緯 |
|------|------|------|
| 2026-10-10 | 1 枚のペインで計器盤のように見せる。名前は CLUSTER | 利用者の案 |
| 2026-10-10 | main がすでに出している情報だけで描く。main・preload・ほかのペインには手を入れない | 利用者の指定（疎結合） |
| 2026-10-10 | アナログのダイヤル案（REV 1・2）と BRACKET・TAPE 案をやめ、LANES 案にする | 利用者の選択 |
| 2026-10-10 | 数字の見せ方は 1 種類（ラベル・数字と単位・2 px のメーター・注記）。枠で囲った数字は使わない | 利用者の指摘（UPTIME だけ枠付きだった） |
| 2026-10-10 | 値は 1 秒に 1 回。その間は動きでつなぐが、続く動きは 10 fps ループに乗せ、例外にしない | 利用者の指定 |
| 2026-10-10 | 最上段に警告灯を 1 行、その下に時計と曜日入りの日付。時計の桁は固定幅で、時刻が変わっても警告灯は動かない。日付はレーンの数字と同じ大きさ | 利用者の指定 |
| 2026-10-10 | レーンの順は CPU・MEMORY・DISK I/O・NETWORK RX・NETWORK TX・PING | 利用者の指定 |
| 2026-10-10 | 余裕があるときは CPU の下にコアごとの「今」の負荷を出す（履歴なし） | 利用者の指定 |
| 2026-10-10 | 値は届いたその場で描く（遅れは次のフレームまで）。秒の境目に合わせて待たず、StreamChart の 2 秒遅れにも合わせない。レーンは流し続けず、値が届くたびに 1 本ぶん詰める | 利用者の指定（2 秒の遅れは長い） |
| 2026-10-10 | 当てはまらない警告灯は出さない。地震の通知がオフなら QUAKE を、電池の無い機械では BATT を、行から外す | 利用者の指定 |
| 2026-10-10 | 設定項目は持たない | 利用者の指定 |
| 2026-10-10 | プリセットは実装の最後に足す。CLUSTER の右と下（または右か下）にターミナル | 利用者の案 |
| 2026-10-10 | 名前はペインが `cluster`（見出し CLUSTER、ピッカーは cluster dashboard）、プリセットが `cockpit` | 利用者の選択 |
| 2026-10-10 | cockpit プリセットだけはシステム列を持たない例外にする。CLUSTER が左上、その右と下にターミナル | 利用者の選択（中身がシステム列と重なるため） |
| 2026-10-10 | CPU 温度、CPU クロック、外気温、Docker・git の警告灯は入れない | 温度は Windows で常に null、クロックは Windows で実クロックで動かない見込み（未確認）、天気は地点の設定が要り、Docker と git は他ペインの領分 |

## 1. 目的と非目的

**目的**

- これ 1 枚で「今この機械はどうか」が分かる。いちばん重い異常は言葉で出る
- 置き場所を選ばない。全画面から細い柱まで、どの大きさでも崩れずに読める
- 値は届いたその場で変わり、計器らしい短い動きで「生きている」と分かる

**非目的**

- 既存のシステム系ペイン（cpu・memory・throughput など）を置き換えない。並べたい人は並べられる
- 詳しい調査（プロセス一覧、接続先の一覧、ディスクごとの内訳）はしない。それは詳細カードと各ペインの役目
- 設定項目を増やさない。最初は並び・閾値・表示するレーンを固定にする（§9）

## 2. 画面構成

上から順に:

1. **警告灯の行**: `LINK PING CPU MEM DISK BATT AWAKE QUAKE` の 8 語と、その右のメッセージ行。
   - 点いた灯のうちいちばん重いものをメッセージ行が言葉で言い、ほかにもあれば `+N MORE` と添える
   - メッセージ行の詳細カードは点いている全部を並べる
2. **時計と日付**: 時計（`--step-4`）と、曜日入りの日付（`--step-2`、レーンの数字と同じ）。注記は ISO 週番号と UTC オフセット。
3. **レーン**: CPU、（コアの行）、MEMORY、DISK I/O、NETWORK ▼ RX、NETWORK ▲ TX、PING。各レーンは次の 3 つでできている。
   - 左: ラベルと数字。数字は右寄せで、いちばん広い値の幅を取るので単位が動かない
   - 中: 60 秒の棒の履歴
   - 右: 60 秒のピークと平均
4. **コアの行**（余裕があるときだけ）: 論理コアごとの今の負荷を 1 本ずつ。4 本おきにコア番号。右に「いちばん忙しいコア」と「85% 以上のコアの数」。
5. **時間軸**（wide だけ）: `−60 s · −45 · −30 · −15 · NOW`。
6. **スロット**: SWAP、DISK（いちばん埋まっている固定ボリューム）、CONNECTIONS（PEERS）、TOP PROCESS、POWER、UPTIME、LINK ▼ TOTAL、AWAKE。

### 2.1 段（tier）

ペイン自身の大きさ（`ResizeObserver` の entry）から、レイアウトが必要とする高さで選ぶ。
判断は純粋関数 `clusterTier(w, h)`（§4）。

| 段 | 条件（目安） | 並べ方 |
|----|------|--------|
| wide | 幅 1100 以上、高さ 500 以上 | 時計の上に日付を積み、右にスロット 4×2。レーンは 1 列、高さ 40–72 px、時間軸あり |
| medium | 幅 560 以上で、全部が入る高さ | 時計と日付を横に、スロットは下に。ピークと平均はカードへ |
| short | 幅 560 以上、高さ 230 以上 | 時計を一段小さく。レーンは 2 列 3 行、スロットなし |
| compact | 幅 460 以上、高さ 380 以上 | レーンは 1 列で 34 px から。スロットなし |
| narrow | それ以外 | 縦に積んでスクロール。警告灯は折り返す |

- **コアの行**: wide では高さ 560 以上、medium では 7 行ぶん入るときだけ出し、レーン 2 行ぶんの高さを取る
- **境目のちらつき防止**: 段は数 px のヒステリシスで選ぶ。ドラッグ中に行き来しないため
- **確認したサイズ**: 1180×620、600×660、600×300、1180×260、360×700、700×420、480×500、1600×900

## 3. データ

すべて既存の仕組みから読む。新しい IPC、metrics のソース、main のサービスは作らない。

| 表示 | ソース | 周期 | 後ろのタブで |
|------|--------|------|--------------|
| CPU レーン、コアの行 | `cpu.load`（`total`、`cores`） | 1 s | 取り続ける |
| MEMORY | `mem.usage` | 1 s | 取り続ける |
| NETWORK RX / TX、LINK TOTAL | `net.throughput`（`rxSec`、`txSec`、`rxTotal`、`txTotal`、`iface`） | 1 s | 取り続ける |
| DISK I/O | `disk.io`（`busy`、`readSec`、`writeSec`） | 2 s | 離す |
| PING | `net.ping`（`ms`、`host`） | 5 s | 離す |
| LINK 灯 | `net.interface`（`state`、`iface`） | Windows 5 s、ほか 30 s | 離す |
| SWAP | `mem.swap` | 10 s | 離す |
| DISK | `disk.volumes` | 30 s | 離す |
| CONNECTIONS | `net.connections`（`total` は通信先の公開アドレスの数、`countries`） | 5 s | 離す |
| TOP PROCESS | `proc.list`（`all`、`top`） | Windows 5 s、ほか 3 s | 離す |
| POWER、BATT 灯 | `power.battery` | 30 s | 離す |
| UPTIME | `os.uptime` を最後の値から毎秒進める | 5 s | 離す |
| QUAKE 灯を出すか | 設定（`settings.quakes.notify`） | 変化時 | — |
| AWAKE、AWAKE 灯 | `awake` ストア（stores/awake.svelte.ts、App が `init` 済み） | 変化時 | — |
| QUAKE 灯 | `window.elecdex.quakes.observe`（地球儀ペインと同じ。何も始めない） | 変化時 | — |

- **購読の仕組み**: `metrics` に宣言し、PaneHost に retain してもらう。参照カウントなので、同じソースを読むほかのペインがあっても poll は 1 回で済む
- **`keepWhileHidden`**: 履歴を描く 1 秒のソース 3 つ（`cpu.load`、`mem.usage`、`net.throughput`）だけにする
- **見えていない間の空白**: DISK I/O と PING の見えていなかった時間は、空白として描く
- **ペイン状態**: 持たない。選べることが無いため（§9 で足すなら `widgetState.patch` だけで）
- **`net.sockets`・`net.wifi` は読まない**: 私的なソースなので
- **プラグイン API との関係**: 変わらない

### 3.1 値が無いとき

- **電池が無い機械**（`hasBattery` が false）: POWER は `AC · NO BATTERY`。BATT 灯は行に出さない
- **QUAKE 灯**: 地震の通知（`settings.quakes.notify`）がオンのときだけ行に出す。ページは設定を読めるので、main には何も足さない。オンのときは `quakes.observe` の告知（`announced`）で点ける。消灯で「異常なし」と読ませないよう、オフの人には灯そのものを見せない
- **`disk.io` の `busy` が null**（macOS など）: DISK I/O レーンは読めないことを表示し、灯を判定しない
- **応答の無い PING**: `ms` が null なら危険。棒はレーンいっぱいの赤。応答の無い秒（5 秒周期の間）は棒を立てない

## 4. 判定（`src/shared/cluster.ts`、純粋）

ページにも DOM にも依らず、単体テストで押さえる。

- **`level(source, value)`**: なし・注意・危険を返す。数字・棒・先頭の点・コア・警告灯・メッセージがすべてこれに従う
  - CPU と MEMORY: 85% で注意、95% で危険
  - DISK（ボリューム）: 90% で注意、95% で危険
  - DISK I/O: 90% で注意
  - PING: 150 ms で注意、応答なしで危険
  - 電池: 放電中に 20% で注意、10% で危険
- **`lamps(readings, history)`**: 警告灯ごとに、なし・情報・注意・危険・空き枠のどれかを返す
  - 灯が点くのは、同じ段階が 10 秒続いたときだけ。PING は応答 2 回ぶん
  - LINK は `state` が down なら即座に点ける
- **`message(lamps)`**: いちばん重い灯の文と、ほかの灯の数。重さが同じなら警告灯の並び順で決める
- **`clusterTier(w, h, prev)`**: §2.1 の段。ヒステリシスつき
- **`coresRow(tier, w, h)`**: コアの行を出すかどうか
- **`netPosition(bytesPerSec)`**: 対数目盛り（1 Mbps〜10 Gbps）の位置
- **`formatRate`**: 1000 Mbps を超えたら Gbps に切り替える
- **`groupCores(cores, max = 32)`**: 32 本を超えるコアは隣どうしをまとめ、束の最大を描く
- **カードの行**（`widgets/cluster/cards.ts`、純粋）: 行に無いことだけを返す（§7）。detail-cards.test.ts に足す

## 5. 描画と動き

- **値は届いたその場で**: metrics ストアは届いた値を次のフレーム（最大 0.1 秒）で反映する。CLUSTER はそれをそのまま描き、秒の境目まで待たない。時計だけは `onBoundary(1000)` で秒の境目に変わる
- **レーンは 1 枚の 2D canvas**: 6 本の棒の履歴、先頭の点、新しい棒の伸び、コアの行を `onFrame`（10 fps）で描く
  - 時間の刻みは `cpu.load` の届いた時刻。1 秒のソース（`cpu.load`・`mem.usage`・`net.throughput`）は collector が同じタイマーで集めるので、同時に届く
  - DISK I/O と PING は、届いた秒の棒に入れる。届かない秒は空ける
  - 値が届くたびに、棒 1 本ぶんを 2 コマ（0.2 秒）で左へ詰め、新しい棒は 3 コマで下から伸び、先頭の点は 2 コマで移る。次の値までは止まっていて描かない
  - 見えていない間（`seen` でない）は描かない
  - テーマの色は `appearance.revision` で読み直す
  - GPU のコンテキストは取らない（2D）
- **一回きりの動きは CSS**:
  - 数字の転がり: 既存の `Digits.svelte` と `fx-digit`
  - 細いメーターの伸び縮み（`transform: scaleX`）
  - 警告灯の点灯と消灯: 2 層を透明度でクロスフェード
  - メッセージの入れ替え
  - どれも `--motion-scale` に従う
- **続く動きは `lib/pulse` に合わせる**: 危険の灯の明滅と 1 s の点。`--ambient-play-state` で止まる
- **動きを減らす設定**: 時間の動きは止まり、1 秒ごとの書き換えだけになる
- **StreamChart との違い**: StreamChart は流し続けるために `chartTick`（5 Hz）と `CHART_DELAY_MS`（2 秒遅れ）を使う。CLUSTER は流し続けないので、どちらも要らない
- **AMBER テーマ**: 注意の黄が地色に近いので、色だけに頼らない
  - 数字のラベルに ▲（注意）と ◆（危険）を付ける
  - canvas の注意・危険の棒には頭に印を付ける
- **測ること**: metrics.spec のアイドル予算の中に収まるか

## 6. モジュール構成と既存コードへの変更

**新しく作るもの**

- `src/shared/cluster.ts`: §4 の純粋関数と閾値
- `src/renderer/widgets/cluster/ClusterWidget.svelte`: 購読した値の読み取り、秒の境目での確定、段の選択、各部品の配置
- `src/renderer/widgets/cluster/Lanes.svelte`: レーンとコアの行を描く 1 枚の canvas
- `src/renderer/widgets/cluster/Readout.svelte`: 数字の見せ方の 1 種類。中で `Digits` を使う
- `src/renderer/widgets/cluster/Lamps.svelte`: 警告灯とメッセージ行
- `src/renderer/widgets/cluster/cards.ts`: カードの行（純粋）
- `tests/unit/cluster.test.ts`、`tests/unit/cluster-cards.test.ts`、`tests/component/cluster.test.ts`、`tests/e2e/cluster.spec.ts`

**既存に足すもの**（どれも一覧に 1 行ずつ）

- `src/renderer/widgets/builtins.ts`: `registerBuiltin` を 1 つ（`id: 'cluster'`、`title: 'cluster'`、`pickerTitle: 'cluster dashboard'`）
  - `metrics` には §3 のソースを宣言する
  - `keepWhileHidden` は 3 つ
  - `zoom: 'full'`、`popup: true`
  - `minSize` は narrow の最小、たとえば `{ w: 260, h: 200 }`
- `tests/e2e/hidden-panes.spec.ts` の `WIDGETS` に `'cluster'`。hidden-panes-list.test.ts が registry と突き合わせる
- `tests/unit/detail-cards.test.ts`（またはカード一覧のテスト）にカードを足す
- `docs/architecture.md` §5.20、README 3 か国語のペイン一覧（実装時）

**触らないもの**

- main、preload、`api.ts`、collector、`shared/metrics.ts`、レイアウトのストアとプリセット、ほかのウィジェット

**疎結合にする方法**

- ウィジェットが読むのは既存のストア 2 つ（`metrics`、`awake`）と、公開 API 1 つ（`quakes.observe`）だけ
- 判定は `shared/cluster.ts` に閉じ、ページの部品は描くことだけをする
- 既存のチャート部品（StreamChart）は時間の扱いが違うので使わず、共有するのは `onFrame`、`onBoundary`、`Digits`、`HoverCard` だけ

### 6.1 cockpit プリセット（実装の最後）

- **並び**: CLUSTER を左上（幅 6 割、高さ 6 割強）に置き、その下にターミナル、右に高さいっぱいのターミナル
  - 幅 1920 の画面で CLUSTER が wide の段に入る幅にする
  - 各ペインの `minSize` は守る
- **システム列の例外**: このプリセットだけシステム列を持たない（2026-10-10、利用者の選択）
  - layout-presets.ts の決まりの文と単体テストに、例外を 1 つだけ明記する
  - ほかのプリセットの決まりは変えない
- **CLAUDE.md の手順どおりに足すもの**:
  - `LAYOUT_PRESET_IDS` の末尾（9 番目なので Ctrl+Shift+9）
  - keybindings.ts と Workspace.svelte
  - LAYOUTS ダイアログの幅
  - layout-presets.spec.ts の `PRESETS`
  - README 3 か国語のスクリーンショットと数
- **既存の利用者**: 新しいプリセットは初回起動だけに与えるので、既存の保存レイアウトの一覧には足されない（2026-09-24 の決定）。LAYOUTS ダイアログから選べる

## 7. 詳細カード

HoverCard（`cardPlacement`、`anchorOf`、`HoverRest`）で開く。

- **出すもの**: 行に無いことだけ。テキストとしてだけ描く（プロセス名は他人の文字列なので）
- **キーボード**: 数字はフォーカスでき、フォーカスでカードが開く
- **ピークと平均**: medium・short・compact・narrow では行に無いので、レーンのカードに入れる

| 対象 | カードに出すもの |
|------|------------------|
| CPU | 忙しいコア上位、上位 3 プロセス |
| コアの行 | 忙しいコア上位 4、静かなコア 2 |
| MEMORY | 使用・空き、スワップの容量 |
| DISK I/O | 読み・書きの速さ |
| NETWORK | インターフェース名（`iface` をそのまま）、対数目盛りの範囲 |
| PING | 先のホスト（`host`）と、5 秒に 1 回であること |
| DISK | 全ボリューム |
| CONNECTIONS | 国別の上位 |
| TOP PROCESS | 上位 3 |
| UPTIME | 起動した日時 |
| LINK | インターフェース名と状態 |
| メッセージ行 | 点いている灯の全文 |

## 8. テスト

- **単体**（`cluster.test.ts`）:
  - 閾値の境目
  - 10 秒続いたときだけ灯が点くこと
  - 空き枠の条件（電池なし、地震を追っていない、busy が null）
  - メッセージの優先順位と `+N`
  - 段とヒステリシス、コアの行の条件
  - 対数目盛りの位置、Gbps への切り替え、コアの束ね
- **カード**: 行の値を繰り返さないこと（detail-cards の流儀）
- **コンポーネント**: 段ごとに描く部品、警告灯の状態、数字の固定幅
- **e2e**（`cluster.spec.ts`）:
  - 置ける、ズームできる、ポップアップできる
  - 各段で重なりやはみ出しが無い
  - スタブの metrics で警告灯とメッセージが変わる
  - 後ろのタブでは 3 ソースだけが残る
- **既存の spec**:
  - hidden-panes.spec.ts（一覧に足す）
  - motion.spec.ts（動きを減らす設定）
  - metrics.spec.ts（アイドル予算）

## 9. 未決事項

1. **既定のレイアウト**: 入れない想定。
