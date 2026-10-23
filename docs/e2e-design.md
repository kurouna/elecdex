# e2e テストの再設計（案 v2）

対象: tests/e2e（Playwright `_electron`）。2026-10-23 の棚卸し（4 分割で全テストを分類）と、2 観点のレビュー（実現性・リリース品質）を反映した版。

## 1. 現状

| 項目 | 値 |
|---|---|
| spec | 53（+ support.ts 651 行、reporter.ts） |
| テスト | 約 536（パラメータ展開前） |
| アプリ起動 | 約 560 回（ほぼ 1 テスト 1 起動） |
| 固定待ち `waitForTimeout` | 178 か所（ページ内の `setTimeout` による待ちは別） |
| 下位テスト | unit 275 ファイル、component 95 ファイル |

棚卸しでの判定（**候補**。§5 の手順で 1 件ずつ確定する）:

| 判定 | 件数 | 意味 |
|---|---|---|
| DEL 候補 | 約 58 | 下位テストが同じ主張を持ち、e2e が配線・実 OS・境界・回帰のどれも足していない（当初 65、レビューで 7 件を誤りと判定） |
| SLIM | 約 186 | 一部は下位で検証済み。e2e は配線や実 OS の部分だけ残せる |
| DUP | 約 50 | 別の e2e と実質同じ |
| FLAKY? | 約 160 | 固定待ち、CPU 閾値、ピクセル座標 |
| SHARE | 約 130 | 隣のテストとアプリを共有できる |

レビューで DEL が誤りと分かったもの（残す）: panes:449（`main.ts` が `watchPageFaults()` を呼ぶ配線はここだけ）、wifi:96（network プリセットを実アプリで適用する唯一の e2e）、logwatch-edges:73（実物の `fs.watch` が新しいファイルを知らせる。unit は通知を手で呼ぶ）、aichat:743（鍵の境界）、palette:235（実アプリでの回帰）、chip8:229・elec16:184（「見えていた → 隠れた → 戻った」の再開。hidden-panes は「最初から見えない」しか見ていない）。motion:256 は DEL ではなく SLIM（「戻った瞬間に正しい時刻」はここだけ）。

### 1.1 構造的な問題

1. **観点の置き場所が決まっていない。** 「ペインが消えたら止まる」は 15 の spec に個別版があり、汎用版（hidden-panes）は「最初から裏」「最小化」だけで「閉じた」「見えていたのが隠れて戻った」を持たない。最小化の一覧からは 12 ペインが漏れている。重複と漏れが同時に起きている。
2. **同じ流れの複数版。** シェルがある時の切替確認（4 か所）、リセット（3 か所）、複数行貼り付け（3 か所）、PANEL（chip8・elec16 がほぼ同文）、同じ id の保存レイアウト（5 か所）、再起動での幅保持（git・agents）。
3. **下位で済む検証を e2e でしている。** desk、logwatch-edges の半分、palette・zoom・pane-move の一部、wifi・ethernet・connections の表示、spectrum-paint（Electron 不要の canvas 検査）、bundle（ビルド後のファイル検査）。
4. **起動の浪費。** 同じ初期レイアウトの連続テストが毎回起動する（web は 27 起動、5 で足りる）。プロファイルを作るためだけの起動、`launchOnTwoLayouts` を使わない前置き（8 件）。
5. **待ち方。** 保存のデバウンス待ち 1500 ms が数十か所、「何も起きない」を固定待ちで確認、CI では落ちえない CPU 閾値、スタブの時計を実時間で待つ（ethernet:84 約 150 秒、wifi:69 約 120 秒）。
6. **ヘルパーの重複と分岐。** AI プロバイダのスタブ 4 つ、JMA 互換 2 つ、`shell.openExternal` の代役 5 つ、pty を N ms 読むコード 8 つ、1 ペインのレイアウト生成 10 か所。elec16-link の `typeLine` は elec16 側の macOS 対策を欠いている。

### 1.2 規則違反（設計と独立に、段階 0 で直す）

| 箇所 | 問題 | 直し方 |
|---|---|---|
| launch.spec | `--user-data-dir` 無しで起動し、実機の elecdex プロファイルを読み書きする（userData 名の検査のため意図的） | フラグは足さず、APPDATA（Windows）・HOME（macOS）・XDG_CONFIG_HOME（Linux）を一時フォルダに向ける |
| wifi・ethernet の COPY | 実機のクリップボードに書いて読む（lib/copied.svelte.ts の `navigator.clipboard`） | main の copy 経由にしてスタブで受けるか、テスト時はクリップボードのスタブに書く |
| background の 2 つ目の起動 | `spawn` に `STUB_ENV` が無い | `STUB_ENV` を渡す |
| hidden-panes・terminal-gpu | 最小化を手書き（WM が無いと skip でなく失敗） | `putWindowAway` |

### 1.3 名前と中身が違うテスト

logwatch:78（閉じていない）、filesystem:96（非表示を検証）、logwatch:196（再起動が無い）、weather:113（記憶を検証しない）、appearance:188（既定値に戻してから再起動）。

## 2. e2e の役割

e2e は「アプリを実際に起動しないと見えないこと」だけを持つ。

| 記号 | e2e が持つもの | 例 |
|---|---|---|
| W | **配線**: 起動時の登録、ページ → preload → main →（worker/collector/OS）→ ページの一往復 | `watchPageFaults()` の呼び出し、ペインの操作が main に届き結果が描かれる |
| O | **実 OS・実プロセス・実レイアウト**: pty、GPU/WebGL、ウィンドウ、ファイル監視、子プロセス、実フォントと実寸 | ConPTY の折り返し、`fs.watch`、app:// から読む同梱フォントの幅 |
| P | **実際の再起動・リロードをまたぐ永続化** | layout.json、main が持つ各ファイル |
| B | **境界**: サンドボックス、CSP、パスを受けない、鍵がページに来ない・平文で出ない、外部に出ない | plugin-containment、web ペインの権限 |
| R | **実アプリでしか見つからなかった回帰** | `@regression` と由来のコミット |

### 2.1 削除の規則

e2e を消してよいのは、次をすべて満たすときだけ。

1. W/O/P/B/R のどれにも当たらない。コメントに実アプリでの発見が書かれたもの、境界を守るものは対象外。
2. 同じ主張を持つ下位テストがあり、**元のコードで落ちることを確かめた**（無ければ先に書く）。
3. DUP を理由にするなら、代わりになる e2e の **ファイルと行** を PR に書く。その e2e が同じ W/O 要素（起動時の配線、実物の OS API、同梱資源）を通ることも確かめる。

## 3. 構成

「もれなく・ダブりなく」を、**観点ごとに置き場所を 1 つだけ決め、一覧を unit テストで検査する**ことで担保する。

### 3.1 置き場所の規則

| 観点 | 置き場所 |
|---|---|
| 全ペイン共通の振る舞い | contracts/（表駆動） |
| アプリ全体の境界 | app/security.spec |
| ペイン固有の境界（git の transport 拒否、docker の押せる操作、clipboard の private、web の権限） | そのペインの spec に `@boundary` |
| ペイン状態（`widgetState.patch` → layout.json）の永続化 | contracts/persistence に 1 往復。各ウィジェットの patch は component |
| main が持つファイルの永続化（chip8 library、elec16 のバッテリー、snippets、notes/tasks/alarms、git-repos、log-files、awake） | そのペインの spec |
| 古いプロファイルからの更新 | app/upgrade.spec |
| 外部データ源の障害 | contracts/faults |
| 内部の障害（プラグインの停止、pty の起動失敗、collector の異常終了、書き込み失敗） | contracts/faults の内部節 |
| 見えなくても続く背景処理（地震速報、AWAKE、リマインダー、更新確認、音声キャプチャ窓） | app/background-work.spec |
| プラグイン（API 1/2）と web プリセット | extensions/plugins.spec、extensions/web.spec（ペイン扱いだが builtins 外） |

### 3.2 横断契約（contracts/）

表は `tests/e2e/contracts/panes.ts`。**unit テストで builtins.ts の全 id が表にあることを検査**し（hidden-panes-list.test.ts と同じ形）、新しいペインは 1 行足さないと落ちる。各行に持たせるもの:

- 起動条件: 必要な env・スタブ・fixture（JMA・markets・CelesTrak の URL、Claude フォルダ、リポジトリやログを `pickerAnswers` で）
- `makeBusy`: 動いている状態にする操作
- `probe`: 止まったことの測り方（モジュールの `watching()`、`metrics.stats().active`、スタブの計数、ページだけのペインは MutationObserver）
- `unseen`: 隠れたとき **止まる / 続く（理由つき）**。続く側（シェル、書き途中の回答、タイマー、地震速報、プラグイン、web の再生）と `keepWhileHidden` も検証する
- `popup`・`zoom`: registry から読む
- `skipOn`: 最小化を試せない環境

| spec | 契約 | 検証のしかた |
|---|---|---|
| mount | 全ウィジェットが PaneFault なしに立ち上がる、ピッカーから開ける、`popup: true` はポップアップでも開ける（1 度に 1 つ、`ondone`、`OVER`） | 状態ごとに 1 レイアウトで一括、失敗はウィジェット名をキーにした `toEqual` |
| lifecycle | 閉じた・裏タブ・最小化・リロードで、止まるべきものが止まり、続くべきものが続く。**見えていたものが隠れて戻ると、すぐに再開する** | 同上。`makeBusy` が要るものだけ個別の `test()` |
| persistence | ペイン状態が 1 往復で戻る | 1 本 |
| same-id | 保存レイアウト間で同じ id のペインが自分の状態を開く | 仕組みが 4 つ（ELEC-16 ユニット、chip8 の保存、web ビュー、プラグイン状態）なので 1 spec に 4 本 |
| motion | 全ダイアログ・トースト・ペインの CRT 点灯と消灯、モーション低減で即時 | ダイアログ一覧も表にし、unit で漏れを検査 |
| themes | 全テーマで起動して PaneFault 無し、light は `data-mode="light"` | 1 起動でテーマを順に切り替える |
| keybindings | keybindings.ts の全項目が実アプリで動く | 表駆動。期待結果を各行に持つ |
| ipc | `window.elecdex` の全メソッドに不正な引数を渡し、拒否されること、main が落ちないこと | 表駆動 |
| faults | 外部データ源（到達不能・壊れた応答）でエラー表示と最後の良いデータ保持。内部の障害 | 源ごとに 1 行 |
| attribution | JMA、GeoIP、CelesTrak/ODbL、Yahoo の非公式・遅延・投資助言でない | 1 本 |

さらに **全テスト共通の fixture** で、main の session と net から localhost 以外へのリクエストが 0 であることを検査する（「外部サービスに接続しない」を仕組みで守る）。

### 3.3 app/（アプリ全体）

| spec | 範囲 |
|---|---|
| launch | 起動、preload、サンドボックス、userData の名前、バージョン、メニュー無し、パスを受けない reveal |
| first-run | 空プロファイル＋プリセットの種まきありの本当の初回起動 |
| upgrade | 前のリリースのプロファイル一式（commit した fixture）で起動し、PaneFault 無し、ファイルを丸ごと捨てない、壊れた 1 件だけ落とす。settings（キー上書き、プラグイン許可）、layout/layouts、chip8 library、elec16 の各 `SNAPSHOT_VERSION`、snippets、notes/tasks/alarms、log-files、git-repos、awake |
| boot | イントロ、スキップ、リロードで再生しない |
| window | タイトルバー、全画面の角、ステータスバー、最小化、スクロールしない |
| single-instance | 2 つ目の起動で既存の窓が出る（トレイにしまっていても） |
| exit | 終了ボタン、ショートカット、終了直前の保存、**子プロセス（サンプラー、pty、キャプチャ窓、collector）が残らない**（全 OS） |
| background | トレイ・グローバルショートカット・サインイン（win32） |
| background-work | 見えなくても続く背景処理 |
| security | plugin-containment、CSP が外部 fetch を拒む、app:// |
| settings | 設定ダイアログ、更新確認（appearance を統合） |

### 3.4 workspace/

layout（分割・閉じる・リサイズ・リロード・再起動・壊れた layout.json）、saved-layouts（保存・切替・改名・番号キー・**切替時の確認はここだけ**、palette とプリセットは委ねる）、presets（**全 9 種を実アプリで適用**、現在は 3 種）、pane-move（着地とセッション維持。ピクセルは component）、zoom、palette、hover-cards（実レイアウトでペインの内側に収まる）。

### 3.5 panes/

ペインごとに 1 spec。logwatch と logwatch-edges は統合、tools は cpu・launcher・calendar・markets に分ける。中身は **そのペイン固有の W/O/P/B/R だけ**（目安 3〜8 本）。contracts の観点は書かない。

### 3.6 パッケージ済みアプリ（packaged/）

今の e2e は out/ に対し `isPackaged=false` で走るので、パッケージでしか通らない分岐が試されていない: asar.unpacked の node-pty、shell-integration の asar → unpacked の書き換え、app:// が asar から配る、chip8 カタログ・GeoIP・フォント・capture-window.html・utilityProcess の asar 内パス、devtools の無効化と login backend、mac の entitlements。

- **接続方式（段階 0 で試行済み、Windows の release/win-unpacked）**: `_electron.launch` は 20 秒でタイムアウトする（`enableNodeCliInspectArguments: false` のため）。`--remote-debugging-port` で起動して `chromium.connectOverCDP` で繋ぐと 0.8 秒で繋がり、2.4 秒で workspace が揃い、`isPackaged = true`、既定レイアウトの 3 つのシェルが asar.unpacked の node-pty で動き、echo が返った。この方式を使う。main を `app.evaluate` で操作できないので、検証はページと `window.elecdex` から行う。
- **起動には必ず `--user-data-dir` を渡す。** 試行で、`ELECTRON_RUN_AS_NODE=1` を付けた起動（fuse の確認）にこれを渡し忘れ、パッケージ版が実機のプロファイルで 15 秒動いた（git-repos.json などが書き直された。layout・settings は無事）。fuse の確認も使い捨てプロファイルで行う。fuse は効いていた（Node として動かず、elecdex として起動した）。
- 内容: 空プロファイルで起動、シェルを開いて echo、プリセット適用、終了。fuse が反転していること（`ELECTRON_RUN_AS_NODE=1` で Node として動かない）。
- CI の package ジョブ（各 OS・arch）で、作ったパッケージにこれを走らせる。

## 4. 書き方の規約

1. **アプリの共有は fixture で。** worker スコープの `app` と、テストスコープの `workspace`（リセットして、アイドルを確かめる）。`describe.serial` は使わない（1 本の失敗で残りが skip になり、範囲が黙って減る）。失敗した worker は捨てられ、次は新しいアプリになる。
   - リセットは `app.evaluate`（main）と既存の API（layout の保存・リセット、保存レイアウトの削除、settings の patch）で行う。**テスト用の新しい IPC チャネルは作らない**（汎用チャネル禁止の規則）。
   - リセット後に、全モジュールの `watching()` が空、`metrics.stats().active` が空、pty が 0 であることを確かめる。漏れはそこで捕まる。
   - **ペイン id はテストごとに一意**にする。main はペイン id で状態を持つ（ELEC-16 ユニット、chip8 の AUTO、web ビュー）。
   - 独自に起動するもの: exit、background、launch、boot、first-run、upgrade、packaged、@perf、terminal-size・terminal-gpu、起動時 env やスタブのシナリオに依存するもの、ウィンドウを最小化・リサイズするもの、再起動をまたぐもの。
2. **スタブのシナリオは起動時の env のまま。** Wi-Fi・Ethernet・GPU のスタブは collector（utilityProcess）がモジュール読み込み時に env を読み、時間もプロセス開始から数える。シナリオごとに spec か worker を分ける（約 10 起動）。
3. **固定待ちは許可リスト制。** unit テストで tests/e2e を grep し、`waitForTimeout` とページ内の `setTimeout` 待ちを理由つきの許可リストと照合する。保存待ちは `waitForSave()`（`savedLayout` の変化を待つ）。「何も起きない」は `quietFor(ms, probe)` だけで書く。計数器が無いものは、段階 1 でアプリ側にテスト用の読み口（既存のスタブフックと同じ形）を足す。
4. **ピクセルは「重ならない・はみ出さない・順序」で書く。** 固定座標の ±2px は component へ。
5. **ヘルパーは support/ に集約。** launch.ts、fixtures.ts、layouts.ts、panes.ts（ロケータ、閉じる、`watching`）、os.ts（最小化、ファイル選択・保存ダイアログ、`openExternal` の代役）、pty.ts（`runCapture`、N ms 読む）、stubs/（AI プロバイダ 1 つ、JMA 互換 1 つ、汎用 HTTP）、quiet.ts。
6. **回帰テストは `@regression` と由来のコミット**を書く。統廃合で消さない。

## 5. 段（タグとプロジェクト）

| 段 | 内容 | いつ |
|---|---|---|
| `@smoke` | contracts/mount、app/launch、各ペインの代表 1 本 | コミット前に **追加で** 回す。「触ったサブシステムの spec と、変更を駆動する spec」という今の規則は置き換えない |
| 既定 | 全部 | リリース前。**素の `npx playwright test` が `@perf` を含む全件**になるようにする（リリース手順 2 のコマンドを変えない） |
| `@perf` | アイドル予算、CPU 計測 | Windows 実機では厳しい閾値。CI では今の粗い閾値（300%/1500 MB）を保ち、回帰を次のリリースまで放置しない。比率の検査（隠れたとき < 見えるとき × 0.5）はそのまま判定 |
| `@win32` 等 | プラットフォーム限定 | 該当 OS |
| `@real` | 実物の読み取り器（sockets・wifi・ethernet・gpu・docker・media）を読み取り専用で | **判断事項**。CI のランナー限定（使い捨てで「この機械」ではない） |

CI の `retries: 1` は不安定さを隠すので、再試行で通ったテストは flaky として報告させる（`--fail-on-flaky-tests` か reporter）。

## 6. 移行計画

各段階は単独でコミットでき、終わるごとに全 e2e が緑。

| 段階 | 内容 | 完了条件 |
|---|---|---|
| 0 | 基準を測る（JSON レポーターで spec ごとの時間・起動数）。1.2 の規則違反と 1.3 の名前違いを直す。packaged スモークの接続方式を試す | 基準値を decisions.md に記録 |
| 1 | support/ への分割とヘルパー集約。固定待ちの置き換えと許可リストの unit。足りない計数器をアプリに足す（本番コードの変更は相談してから。§6.1） | 固定待ちが許可リストだけ（済: 理由の無い待ちは tests/unit/e2e-waits.test.ts が拒む） |
| 2 | contracts/ を作り、表と unit の網羅検査を入れる。**旧テストはまだ消さない** | 全ウィジェットが表にある |
| 3 | 契約が旧テストを置き換えられることを確かめる: ウィジェットごとに、その振る舞いをわざと壊すと契約が落ちること。確かめたものから旧テストを消す。ORBIT（200 以外の応答の後は 1 日聞かない）や quakes（速報が on の間だけ取得）のように、旧テストが汎用版より多くを主張しているものはペイン spec に残す | 消した各テストに、落ちることを確かめた契約名を PR に書く |
| 4 | DEL を §2.1 の規則で 1 件ずつ確定して削除、SLIM を縮める。下位テストが無いもの（約 30）は先に書く | 同上 |
| 5 | fixture による起動の共有と再配置（app/ workspace/ contracts/ panes/ extensions/ packaged/） | 起動数を測って記録 |
| 6 | タグとプロジェクト、CI（package ジョブのスモーク、flaky の報告）。**CLAUDE.md と docs を同じコミットで書き換える**（hidden-panes.spec・motion.spec・metrics.spec・`runCapture` の場所など、spec 名を挙げている規則） | リリース手順が新しい構成で通る |
| 7 | 漏れの追加（§7） | |

**基準（段階 0 で計測、decisions.md）**: 537 件、44.7 分（Windows 開発機）。起動と終了だけで約 15〜19 分（35〜40%）、CPU 計測 5 本で約 5 分、スタブの時計待ち 2 本で約 1.7 分。

**目標**: テスト 537 → 約 350、起動 560 → 約 220（再起動約 30、background 19、スタブのシナリオ約 15、起動条件の検査は独立のまま）、既定の段で 25 分以下。最大の効果は起動の共有（約 10 分）、次が DEL/SLIM と固定待ちの解消。CPU 計測は時間を減らさず `@perf` に分ける。

### 6.1 段階 1 の結果（2026-10-23）

- support.ts は support/ の各モジュールを束ねるだけになった: launch、layouts（`single`・`beside`・`tabbed`・`SINGLE_CLOCK`・`NO_SWITCH_PROMPT`）、workspace（`paneOf`・`paneById`・`closePane`・`reloadWorkspace`・`openSettings`・`waitForSaved`・`savedSettings`）、pty（`runCapture`・`sessionIds`・`listenToSessions`）、main（`watching`・`watchingAll`・`metricsActive`）、quiet（`quietFor`）、measure（`idleCpu`・`mutationsIn`）、terminal、elec16、plugins、stub-hooks（`stubOf`）、fixtures、stubs/（AI プロバイダ、HTTP サービス、`openExternal`）。logwatch の 2 spec だけが使う support/logwatch.ts は束ねない。
- 固定待ち `waitForTimeout` は 178 → 57。ほかに保存待ちなど信号を待つ形に約 30、「何も起きない」の検査は `quietFor` に 87 か所。残る待ちはすべて `// wait:` で理由を書き、unit テストがそれを求める。spec は合計で約 1,600 行減った。
- 全件 536 件で、移行による失敗は 2 件（`listenToSessions` が聞き取りを操作の前に終えていた。修正済み）。pane-move の最初のドラッグが一度だけ失敗したのは既存の不安定さで、ペインの点灯を待つようにした。
- **アプリに読み口があれば消せる待ち（本番コードの変更なので未着手、要相談）**:
  - レイアウト保存の「保存待ち・最後に保存した時刻」: layout.spec 2 か所、panes.spec 2 か所、utility.spec、tools.spec、weather.spec
  - metrics の収集中の件数（`metrics.stats()` に in-flight）: metrics.spec 3 か所
  - プラグインの worker 数: plugins.spec 1 か所
  - KEYSTREAM の synth に渡った音の数: keystream.spec 1 か所
  - CHIP-8 のアトラクト画面の実行回数: chip8.spec 1 か所
  - ELEC-16 の LCD の描画回数: elec16.spec 1 か所

### 6.2 段階 2 の結果（2026-10-23）

- tests/e2e/contracts/ に 11 の契約と 4 つの表を置いた。表は unit テストが本体と突き合わせる: 全ウィジェット（panes.ts ↔ builtins.ts、e2e-contracts.test.ts）、全キー操作（keys.ts ↔ keybindings.ts）、全ダイアログ（dialogs.ts ↔ ui store と `transition:crtPower` の部品）、`window.elecdex` の全 252 メソッド（ipc-table.ts ↔ api.ts）。表から漏れたものは unit で落ちる。
- 契約: lifecycle（タブ裏・最小化・閉じる・リロードで止まり、戻すとすぐ再開。続くべきもの）、mount（全ペインが描ける、ピッカーとポップアップ）、persistence、same-id（4 つの仕組み）、attribution、themes、keybindings、motion、ipc（不正な引数を拒み main が落ちない）、faults（外部 9 源の壊れた応答と不通、プラグイン、壊れたストア、collector の停止）、no-external（外部ホストへの通信 0、Chromium の net log と main の通信を見る）。全 47 件で 5.3 分。旧テストはまだ消していない。
- **契約が見つけた本番の不具合（すべて修正済み）**:
  - quakes ペインがタブの裏・最小化中も地震一覧を購読し続けた。spectrum と mixer が最小化中もキャプチャと読み取りを続けた（d7a3b7b2）。
  - `net.ping` が 1.1.1.1 に固定で、e2e 中も外へ ping していた。`ELECDEX_PING_HOST`（ループバックのみ受け付ける）を足し、STUB_ENV が 127.0.0.1 にする。
  - NOAA が Atom フィードでない応答（200 のエラーページ、途中で切れた本文）を返すと、発表中の津波警報が消えた。完全なフィードでない応答は失敗として扱い、知っていた警報を保つ。
- **挙動の変化（利用者の判断 2026-10-23）**: 通知 off のとき、globe の震源マークは quakes ペインが見えている間だけ出る（以前は裏の quakes ペインが取得を続けていたため出ていた）。globe 自身に取得させると、既定レイアウトの全員が毎分 JMA に問い合わせることになるため、させない。
- **契約にできなかった・まだ薄いもの**:
  - シェルが起動できない場合（シェルに設定が無く、ComSpec を渡しても Windows の値が勝つ）。
  - main の起動直後の Node 側の通信（テスト側から包めるのは起動後。Chromium 側は net log で起動から見ている）。外部通信の検査は全テスト共通の fixture ではなく 1 spec。
  - lifecycle の「続くべきもの」はシェルだけを確かめている（書き途中の回答、評議会、タイマー、AWAKE、地震の通知、プラグイン、web の再生は理由を書いただけ）。mixer は main の状態を外から読めないので footprint が無く、component テストだけが守る。
  - persistence はペイン状態の代表 4 つ。

### 6.3 段階 3 の結果（2026-10-23）

- **契約が旧テストの代わりになることを、本番を一時的に壊して確かめた**（確認ごとに戻し、コミットには含まない）:
  - `seen` を無視させた（metrics の購読、weather・clipboard・nowplaying・docker・git・orbit・agents）→ lifecycle のタブ裏と最小化が、壊した全部を名指しして落ちた。
  - 閉じても購読を放さないようにした（metrics、weather）→ 閉じる契約が落ちた。
  - 設定ダイアログから `transition:crtPower` を外した → motion 契約が settings-dialog で落ちた。
  - main がページの去った購読を落とさないようにした → **lifecycle のリロードも旧 metrics.spec:199 も落ちなかった**（ページはアンロード時に自分で放し、同じソースを購読し直すページには main が別の経路で古い購読を整理する）。契約に「クラッシュしたページの購読を main が落とす」を足し、時計 1 つで戻すことで main の後始末だけが働く形にした。元のコードで通り、壊したコードで落ちることを確かめた。
  - あわせて、旧 hidden-panes.spec にあった「一度も表示していないペインが DOM を変えない」を lifecycle に足した。
- **消した旧テスト 23 本**: hidden-panes.spec の 4 本（と hidden-panes-list.test）、metrics の 4 本（閉じると止まる・全部閉じると止まる・リロード・裏のタブ）、connections・globe・wifi・ethernet・weather の「閉じたら止まる」、clipboard・now-playing・docker の「裏のタブでは読まない」、同じ id の保存レイアウト（chip8・elec16・plugins・web）、motion の「ダイアログの電源断」と「トースト」、desk の「ピッカーに全部ある」。panes の「ポップアップできる全部」は、選択が残る検証だけに縮めた。
- 残したもの: clipboard の「レイアウト切替で読まない」（切替による外し方は契約に無い）、web の「別の場所の同じ id」、chip8・elec16 の「裏で止まり戻ると再開する」（ページだけの機械の再開は契約が見ていない）、quakes の「通知 off でペインが無ければ何も取得しない」。

### 6.4 段階 4 の結果（2026-10-24）

- 単体・コンポーネントテストが持つ e2e を **46 本消した**（layout・presets・pane-move・panes・zoom・motion・palette・boot 18、connections・wifi・ethernet・appearance・CLUSTER 9、chip8・elec16・keystream・desk・utility 9、aichat・elec・agents・logwatch 10）。1 本ずつ、§2.1 の規則で配線・実 OS・再起動・境界・回帰でないことを確かめ、本番コードを一時的に壊して下位テストが落ちることを見てから消した（壊したコードはコミットしていない）。
- 下位テストが無かった・弱かったものは先に書いた: component の pane-picker、cluster-widget、chip8-panel、elec-widget、agents-widget（新規）、layout-question・pane-drag・pane-zoom・pane-corner・ethernet-widget・wifi-widget・appearance-revision・connections-widget・timer-widget・todo-widget・logwatch-widget（追加・強化）、unit の ai-ipc、logwatch-ipc（新規）、logwatch-main（junction を通す実パス）。壊しても落ちなかった下位テストが 2 つ見つかり（logwatch-main の実パス、logwatch-widget の設定の toEqual）、直した。
- 候補から外して残したもの: elec16 の PANEL（Elec16Widget 自身の配線を下位テストが見ていない）、notes の削除と task の改名・期限（main に正しい引数を送る e2e はそれだけ）、weather の地点選択とポップアップの Escape（App.svelte の取り付け順に依存）、LOG WATCH の EXPLAIN の失敗（Electron 自身の `net.fetch` の失敗を読むのはそれだけ）。
- `launch()` は `--no-intro` のとき起動演出が飛んだこと（`data-boot="done"`）も確かめるので、boot.spec の同じ検査を消した。
- SLIM: ELEC-16 の PLAY-320 への TUNE から、別の e2e と単体が持つ CODE の実行部分を削った。ほかは、残る再起動や長い待ちが配線・再起動・境界・回帰のためだったので削っていない。
- **全件 515 件、43.3 分**（基準 537 件・44.7 分。途中で契約 48 件を足している）。

### 6.5 段階 5 の結果（2026-10-24）

- **起動の共有**（tests/e2e/support/shared.ts）: テストは `shared(options)` で、同じ起動条件の前後のテストとアプリを共有する。テストの間に、シェルを終え、main のダイアログと shell の差し替えを戻し、窓を起動時の大きさに戻し、テストのレイアウトを保存してリロードし、ポインタを隅に動かす。設定・保存レイアウト・main がプロファイルに置くファイル（Chromium のキャッシュを除く）・窓が起動時と違えば、黙って起動し直す。起動・終了は時計 1 つで約 1.6 秒、既定レイアウトで約 4.3 秒、リロードは約 0.5 秒（計測）。171 テストが 107 回の起動で済んだ。main がファイルに状態を書くテスト（リポジトリ、ログ、ノート、CHIP-8 のセーブ、キャッシュ）は起動し直しになるので、縮んだのは約 1 分。clipboard（main のメモリの履歴）と「収集プロセスは起動しない」の検査は共有しない。
- **並列は見送った**: worker 3 で 17.2 分、2 で約 17 分だったが、ホバーで開くカード、ドラッグ、ファイル監視のテストが実行のたびに違う組み合わせで落ちた（chip8・clipboard・docker・zoom・agents・git など）。Chromium の隠れた窓の扱いを止めても変わらず、原因はアプリ 2〜3 個分の負荷。直列（worker 1）のまま。負荷で落ちるテストを一つずつ直せば並列にできる（別の作業）。
- **組分け**: `npx playwright test` は `e2e`（全部）のあとに `perf`（CPU を測る 5 本、`@perf`）を回す。`--project=e2e` で計測を除ける。CI は `failOnFlakyTests` で、再試行で通ったテストも失敗にする。
- **再配置**: tests/e2e/app（9）、workspace（8）、panes（32）、extensions（3）、contracts（11）。
- **一時フォルダの後始末**: 再起動したテストのプロファイルが消えず、開発機の一時フォルダに 1,300 余り残っていた。`launch()` が作ったプロファイルは、再起動をまたいで最後の close と worker の終了時に消す。
- **全件 515 件、39.9 分**（`perf` を含む）。

## 7. 追加する検証（優先度順）

1. 古いプロファイルからの更新（app/upgrade）。リリースで最も壊れやすい。
2. パッケージ済みスモークを全 OS・arch の package ジョブで（§3.6）。
3. 終了後に子プロセスが残らない（全 OS）。
4. lifecycle の「閉じた」「隠れて戻る」「続くべきものが続く」と、最小化の全ペイン。
5. 全 9 プリセットの適用、本当の初回起動。
6. 外部へのリクエスト 0 の共通 fixture、CSP が外部 fetch を拒む、IPC の不正引数。
7. 出典表記（ORBIT、markets）。
8. 単一インスタンス（トレイ中も）。
9. keybindings・themes の表駆動。
10. 内部の障害（collector の異常終了、プラグインの停止、pty の起動失敗）。
11. ペインごとの抜け: logwatch の閉じた・再起動後の追従・一度も書かれないファイル、Docker の `denied` と pause/unpause、プラグインのフォルダからのインストール、quakes の到達不能、git のレイアウトにパスが無いこと、web ペインの最小化、ダウンロード拒否の検証。

### 7.1 自動化しない（手作業のリリースチェックリストに書く）

未署名の警告（SmartScreen、Gatekeeper、AppImage の FUSE）、deb のインストールとアンインストール（installer.nsh のサインイン項目の削除）、win arm64 の起動（arm ランナーが無い限り）。

## 8. 判断を仰ぐ点

1. `@real` 段（CI ランナーで実物の読み取り器を読み取り専用で）を置くか。
2. パッケージ済みスモークをリリース手順の必須にするか。win arm64 用の arm ランナーを使うか。
3. 古いプロファイルの fixture を何版前まで持つか（直前 1 版か、v0.0.x の主要な版すべてか）。
4. 削除と統合を、ペイン単位の小さなコミットで進めてよいか（1 コミットに 1 サブシステム）。
