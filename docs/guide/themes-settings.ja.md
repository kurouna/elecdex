[English](themes-settings.md) | 日本語 | [简体中文](themes-settings.zh-CN.md)

# テーマと設定 — elecdex

elecdex は Windows・macOS・Linux 向けの SF 風ターミナルエミュレーター兼システムモニターで、eDEX-UI を作り直したものです。このページは、8 つの組み込みテーマと自分のテーマの追加、モーションとサウンドの設定、設定ダイアログ、`settings.json` のすべてのキーと既定値、OS ごとのファイルの置き場所、レイアウトのファイル、アップデートの確認を説明します。macOS と Linux は自動テストでビルドと実行をしているだけで、手作業での確認は十分ではありません。

## このページの内容

- [テーマ](#テーマ)
- [テーマの追加](#テーマの追加)
- [モーション](#モーション)
- [サウンド](#サウンド)
- [設定ダイアログ](#設定ダイアログ)
- [settings.json](#settingsjson)
- [ファイルの場所](#ファイルの場所)
- [レイアウトのファイル](#レイアウトのファイル)
- [アップデート](#アップデート)

## テーマ

| | |
| --- | --- |
| 場所 | *Settings → General → appearance → theme*、ステータスバーの *theme*、アクションパレット（Ctrl+Shift+P） |
| 設定 | `settings.json` の `theme`（既定は `"tron"`。どのテーマにもない id はこれに戻ります） |
| ファイル | 自分のテーマ: アプリのデータフォルダーの `themes` フォルダー |

8 つのテーマは、再読み込みせずにその場で切り替わります。ページはテーマを CSS 変数として設定し、キャンバスのペインは色を読み直します。

| テーマ | id | モード | 見た目 |
| --- | --- | --- | --- |
| Tron | `tron` | dark | eDEX-UI の既定の見た目。黒に近い地に彩度を落とした青緑、走査線とグローなし。既定のテーマ |
| Amber | `amber` | dark | 単色のアンバーの端末。走査線と暖かいグロー |
| Phosphor | `phosphor` | dark | 緑の P1 蛍光体、昔ながらのモニター。走査線とグロー |
| White | `white` | dark | 冷たい白のモニター。#0A0B0D の地に #D7E0EA の文字、走査線と柔らかいグロー |
| Black | `black` | light | White を反転させたもの。淡い #D7E0EA の地に黒に近い #0A080D の文字、同じ走査線と、ごくわずかなグロー |
| Business (Dark) | `business-dark` | dark | Windows 11 のダークモードの配色と既定の青いアクセント、Segoe UI と Cascadia Mono、Windows Terminal の Campbell 配色。グリッド・走査線・グローなし、ランチャーのアイコンは元の色 |
| Business (Light) | `business-light` | light | 同じものを Windows 11 のライトモードで。One Half Light 配色 |
| Paper | `paper` | light | *unreleased*: 電子ペーパーのようなモノクロでシンプルなもの。灰色の紙（#D9D9D5、ペインは #E5E5E1）に #111111 のインク、色相のないアクセント、端末の 16 色はそれぞれ濃さの違う灰色、Segoe UI と Cascadia Mono。グリッド・走査線・グローなし |

- Tron、Amber、Phosphor、White は HUD 向け、Business (Dark) と Business (Light) は普段の仕事向け、Paper はモノクロでシンプルです。
- 文字はテーマのアクセント色です。ただし Business テーマや Paper のように文字色を指定したテーマは除きます。
- 明るいテーマ（`mode: "light"`）では、ステータス色が濃くなり、ターミナルは薄い色を 4.5:1 のコントラストまで引き上げます。
- Business テーマは Web ペインに色を付けません（下の `web.tint`）。

![Tron テーマの elecdex。左にシステムモニター、中央にランチャーとファイルブラウザーと 3 つのシェルのタブ、右に世界の眺め・マーケット・天気・カレンダー](../screenshots/elecdex-tron.jpg)

![Black テーマの cockpit プリセット。淡い地に黒に近い文字と走査線](../screenshots/elecdex-cockpit.jpg)

![Business (Dark) テーマの ai プリセット。2 つの AI チャットペインと、GPU ペインの上の ELEC system。回答はすべて画像用の代役が書いたもの](../screenshots/elecdex-ai.jpg)

どのテーマもいずれかの画像に写っています: Tron（standard、earth）、Amber（blank、CHIP-8）、Phosphor（dev）、White（network、media）、Black（cockpit）、Paper（desk）、Business (Dark)（ai）、Business (Light)（関数電卓 ELEC-16 SCI）。

## テーマの追加

テーマを追加するには、`settings.json` の隣にある `themes` フォルダー（*Settings → General → themes folder* で開きます）に JSON ファイルを置きます。すぐに反映され、組み込みテーマと同じ `id` を持つものはそのテーマを置き換えます。読み込めないファイルは、黙って一覧から消えるのではなく、テーマ選択の下に理由とともに表示されます。

```json
{
  "id": "ice",
  "name": "Ice",
  "accent": { "h": 200, "s": 60, "l": 70 },
  "surfaces": { "s0": "#000000", "s1": "#010203", "s2": "#040506", "line": "#101820" },
  "terminal": { "ansiPull": 0.5, "ansi": { "red": "#ff5f56" } },
  "effects": { "scanlines": false, "glow": 0.2 }
}
```

| フィールド | 必須 | 値 |
| --- | --- | --- |
| `id` | はい | 英小文字、数字、ハイフン |
| `name` | はい | 1〜60 文字。選択肢に表示される名前 |
| `author` | いいえ | 60 文字まで |
| `mode` | いいえ | `"dark"`（既定）、または明るい地の `"light"`。ステータス色が濃くなり、ターミナルは薄い色を 4.5:1 まで引き上げます |
| `accent` | はい | `h` は 0〜360、`s` と `l` は 0〜100 |
| `surfaces` | はい | `s0`、`s1`、`s2`（地と一段上のパネル）と `line`（グリッド）。それぞれ `#rrggbb` |
| `text` | いいえ | 文字色の `primary` と `muted`。指定しなければ文字はアクセント色になり、muted は primary の半分の濃さです |
| `status` | いいえ | `danger`、`warn`、`ok`、`info` の色相（`info` はカレンダーの土曜日にも使います） |
| `fonts` | いいえ | `display`、`ui`、`mono` のフォントファミリーの並び（名前、引用符、カンマのみ） |
| `terminal.ansiPull` | いいえ | 0〜1。導き出した ANSI 色をどれだけアクセントに寄せるか（既定 0.45） |
| `terminal.ansi` | いいえ | 16 の ANSI 色を名前で（`black` … `brightWhite`）、それぞれ `#rrggbb`。導き出した色より 1 色ずつ優先されます |
| `effects.scanlines` | いいえ | 画面全体の CRT の走査線 |
| `effects.glow` | いいえ | 文字の蛍光体のグロー、0〜1 |
| `effects.iconTint` | いいえ | `false` にするとランチャーのアイコンを元の色で表示します |

色は `#rrggbb` で指定します。テーマは検証されてから決まった組の CSS 変数に変換され、中身が CSS や HTML として解釈されることはありません。

## モーション

| | |
| --- | --- |
| 場所 | *Settings → General → appearance → motion* |
| 設定 | `motion`: `"system"`（既定）、`"full"`、`"reduced"` |

- `system` は OS の「視差効果を減らす」設定に従い、`full` と `reduced` はそれより優先されます。
- 見た目には、このマシンの実際の情報を並べる Linux 風のブートログのあとに続く、CRT の電源が入るような起動シーケンスがあります。あとから追加したペインも同じように点灯し、閉じたペインは消灯して隣のペインがその場所へ広がります。保存したレイアウトに切り替えると画面全体が消灯し、次のレイアウトがペインごとに点灯します。ダイアログや通知も消灯します。
- 月ごとの日付の波、せり上がる天気予報、3 秒間ハイライトしながらスライドインする新しい見出しや地震といった短い登場エフェクトはモーション設定に従います。
- モーションを減らす設定では何も動きません。これらのエフェクトも CRT の切り替えも省かれます。
- ウィンドウが隠れているときや最小化されているときは、アニメーションが止まります。

## サウンド

| | |
| --- | --- |
| 場所 | *Settings → General → sound*、ステータスバーの *sound on / off* |
| 設定 | `sound.enabled`（既定 `true`）、`sound.volume` 0〜1（既定 `0.5`。ダイアログでは 0〜100 %） |

- インターフェース音は録音ではなく WebAudio で合成しています。音声ファイルはありません。
- 同じスイッチが、地震・津波の速報とタスクのリマインダーの音にも効きます。これらはインターフェース音がオンのときだけ鳴ります。
- シェルのベルは別に設定します: *Settings → General → terminal → bell*（`terminal.bell`: `both` は点滅と音、`flash`、`sound`、`off`。既定は `both`）。
- CHIP-8 と ELEC-16 のブザーには、インターフェース音とは別の音量があります（`chip8.volume`、`elec16.volume`）。

## 設定ダイアログ

![Tron テーマの設定ダイアログ、キーボードの項目](../screenshots/elecdex-settings.jpg)

| | |
| --- | --- |
| 場所 | Ctrl+Shift+.、ステータスバーの *settings*、アクションパレットの設定のセクション |
| 保存先 | `settings.json`。変更したその場で保存されます |

セクションは次の順に並びます。

| セクション | 内容 |
| --- | --- |
| general | appearance（テーマ、themes folder、モーション）、sound、terminal（開始フォルダー、文字の大きさ、複数行の貼り付けの確認、ベル）、git（ファイルを開くコマンド）、chip-8（コアの表示、ブザーの音量）、elec-16（ブザーの音量、新しいペインのスキン）、layouts（レイアウト切り替えの確認）、launcher（インストール済みアプリの一覧）、web panes（ページにテーマの色を付ける、すべてのサイトからサインアウト） |
| window | ウィンドウの外のアイコン、そこへの最小化と格納、システム全体の表示 / 非表示ショートカット、サインイン時の起動とバックグラウンドでの開始。マシンが何かを提供できるときだけ表示されます（[キーボードとレイアウト](keyboard.ja.md#バックグラウンド実行)） |
| keyboard | すべてのショートカット。割り当てを変えられます（[キーボードとレイアウト](keyboard.ja.md#ショートカットの割り当て変更)） |
| alerts | 地震と津波: ソース、速報、しきい値、システム通知、警告音 |
| ai | AI プロバイダー、システムプロンプト、要約、ELEC system の席 |
| plugins | 入っているプラグイン、その権限と設定（[プラグイン](plugins-use.ja.md)） |
| updates | バージョン、毎日の確認、*check now*（[アップデート](#アップデート)） |

ダイアログ上部の *settings.json* ボタンでファイルを開けます。Escape でダイアログを閉じます。

## settings.json

設定ダイアログでの変更はすべて、その場でアプリのデータフォルダー（[ファイルの場所](#ファイルの場所)）にある `settings.json` に保存されます。このファイルはアプリの実行中に手で編集することもでき、main がファイルを見張って結果を反映します。読み取れないファイルはそのまま残され（直るまでは既定値が使われます）、アプリからの変更で置き換える前に `settings.json.bak` へコピーされます。

どのフィールドにも既定値があるので、空のファイルや一部だけのファイルも有効です。例:

```json
{
  "theme": "amber",
  "sound": { "enabled": true, "volume": 0.5 },
  "motion": "system",
  "terminal": { "startDirectory": "~/work" },
  "keybindings": { "app.quit": null },
  "window": { "minimizeToTray": false, "closeToTray": true, "globalShortcut": true, "startInBackground": false },
  "updates": { "check": true },
  "layout": { "confirmSwitch": true },
  "web": { "tint": false },
  "quakes": { "source": "auto", "notify": true, "minIntensity": "5-", "minMagnitude": 6, "tsunami": true, "system": true, "sound": true },
  "reminders": { "notify": true, "system": true, "sound": true, "snoozeMinutes": 10, "leadMinutes": 0 }
}
```

キーと既定値（`src/shared/settings.ts` より）:

| キー | 既定値 | 値と意味 |
| --- | --- | --- |
| `version` | `1` | ファイルの形式 |
| `theme` | `"tron"` | テーマの id（[テーマ](#テーマ)） |
| `sound.enabled` | `true` | インターフェース音 |
| `sound.volume` | `0.5` | 0〜1 |
| `motion` | `"system"` | `system`、`full`、`reduced` |
| `terminal.startDirectory` | `""` | 新しいシェルを開くフォルダー。空ならホーム、先頭の `~` はホームを表します。存在しないフォルダー（やネットワーク共有）なら、代わりにホームで開きます |
| `terminal.fontSize` | `13` | シェルの文字の大きさ（ピクセル）、8〜32 |
| `terminal.confirmPaste` | `true` | 2 行以上のテキストを貼り付ける前に確認する（改行ごとにコマンドが実行されるため） |
| `terminal.bell` | `"both"` | `both`、`flash`、`sound`、`off` |
| `launcher.showSystem` | `true` | プラットフォームのアプリを一覧に出す |
| `launcher.items` | `[]` | 手で加えるランチャーの項目（`name`、`target`、任意の `args`。200 個まで）。このファイルでだけ編集します |
| `keybindings` | `{}` | ショートカットの上書き: アクションの id → キー、または割り当てなしの `null`（[キーボードとレイアウト](keyboard.ja.md#ショートカットの割り当て変更)） |
| `window.trayIcon` | `false` | ウィンドウの外にアイコンを出す |
| `window.minimizeToTray` | `false` | 最小化で通知領域にしまう |
| `window.closeToTray` | `false` | 閉じると通知領域にしまい、elecdex は動き続ける |
| `window.globalShortcut` | `false` | 表示 / 非表示ショートカットをどのアプリからでも効かせる |
| `window.startInBackground` | `false` | サインイン時の起動で、隠れた状態で始める |
| `layout.confirmSwitch` | `true` | シェルが開いている間に保存したレイアウトを適用する前に確認する |
| `web.tint` | `false` | Web ページをテーマのアクセント色で描く |
| `updates.check` | `true` | 1 日 1 回、GitHub に新しいリリースを問い合わせる |
| `quakes.source` | `"auto"` | `auto`（システムが日本向けの設定なら日本）、`jma`、`usgs` |
| `quakes.notify` | `false` | 地震の速報。オンの間は、地震ペインが開いているかどうかに関係なく、ソースを毎分確認します |
| `quakes.minIntensity` | `"5-"` | 日本: 知らせる最大震度の下限（`1` … `7`） |
| `quakes.minMagnitude` | `6` | 世界: 知らせるマグニチュードの下限（4.5〜9） |
| `quakes.tsunami` | `true` | 津波警報・注意報など。地震のしきい値に関係なく知らせる |
| `quakes.system` | `true` | ウィンドウが前面にないときはシステム通知も出す |
| `quakes.sound` | `true` | 警告音（インターフェース音がオンのとき） |
| `reminders.notify` | `true` | タスクのリマインダー |
| `reminders.system` | `true` | ウィンドウが前面にないときはシステム通知も出す |
| `reminders.sound` | `true` | 音（インターフェース音がオンのとき） |
| `reminders.snoozeMinutes` | `10` | *snooze* で先送りする時間、1〜1440 分 |
| `reminders.leadMinutes` | `0` | 期限の何分前に知らせるか、0〜1440 |
| `ai.providers` | `[]` | 登録した AI プロバイダー。キーはここには保存しません |
| `ai.systemPrompt` | `""` | すべての会話の先頭に送る |
| `ai.compact` | `false` | 会話がプロバイダーの窓を超えたら、モデルに要約を求める |
| `agents.sources` | `["claude-code"]` | AI AGENT ペインが記録を読む相手 |
| `git.openCommand` | `""` | git ペインでダブルクリックしたファイルを開く方法（`{file}`、`{line}`、`{dir}` を埋める。シェルを通さずプログラムとして実行）。空ならシステムのアプリ。このファイルでだけ設定します |
| `logWatch.keepLines` | `5000` | さかのぼれる行数: 1000、5000、20000、50000 |
| `logWatch.initialLines` | `500` | ペインがファイルを開いたときに末尾から読む行数: 100、500、2000 |
| `chip8.core` | `true` | 新しい CHIP-8 ペインで CORE 表示を出す |
| `chip8.volume` | `0.5` | CHIP-8 のブザー、0〜1 |
| `elec16.volume` | `0.5` | ELEC-16 のブザー、0〜1 |
| `elec16.skin` | `"elec"` | 新しい ELEC-16 ペインのスキン |
| `elec16.link.on` | `true` | LINK 全体 |
| `elec16.link.ai.on` | `false` | LINK の AI サービス |
| `elec16.link.ai.provider` | `""` | LINK が使う AI プロバイダー |
| `elec16.link.cart.on` | `true` | LINK の CART サービス |
| `elec` | — | ELEC system の席、立場、決め方（既定 `majority`）、ラウンド数（既定 1） |
| `plugins` | `{}` | プラグインの id ごとに: 有効かどうか、同意した権限、設定値（[プラグイン](plugins-use.ja.md)） |

- 一部のグループ（ELEC system、LINK、ELEC-16 と CHIP-8 の値、ターミナルの新しい項目）は、手編集の誤りがあってもその値だけが既定値に戻ります。
- AI の API キーはこのファイルにはありません。OS が暗号化して `ai-keys.json` に入れるので、`settings.json` は別のマシンにコピーできます。

## ファイルの場所

アプリのデータフォルダーは、アプリ名 `elecdex` に対する Electron の userData フォルダーです。

| OS | フォルダー |
| --- | --- |
| Windows | `%APPDATA%\elecdex`（通常は `C:\Users\<ユーザー名>\AppData\Roaming\elecdex`） |
| macOS | `~/Library/Application Support/elecdex` |
| Linux | `$XDG_CONFIG_HOME/elecdex`、通常は `~/.config/elecdex` |

macOS と Linux のパスは Electron の既定に従ったもので、手作業での確認は十分ではありません。

中にあるもの:

| ファイルまたはフォルダー | 内容 |
| --- | --- |
| `settings.json`（`settings.json.bak`） | 設定 |
| `themes/` | 自分のテーマ |
| `layout.json`（`layout.json.bak`） | 今の配置 |
| `layouts.json`（`layouts.json.bak`） | 保存したレイアウト |
| `plugins/`、`plugin-data/` | プラグインと、それぞれが保存するデータ（[プラグイン](plugins-use.ja.md#ファイルの置き場所)） |
| `notes.json`、`tasks.json`、`alarms.json` | notes・tasks・アラームのデータ |
| `snippets.json` | clipboard ペインのスニペット |
| `ai-keys.json` | AI の API キー（OS が暗号化） |
| `chats/`、`elec/` | AI の会話と ELEC system の審議 |
| `git-repos.json`、`log-files.json` | git ペインと LOG WATCH ペインで選んだリポジトリとログファイル（id で識別） |
| `awake.json` | Utility ペインの AWAKE の保持 |
| `feeds-cache.json` | フィードごとの最新の RSS 見出し |
| `Partitions/web` | Web ペインの Cookie とサイトデータ（*sign out of all sites* まで） |

## レイアウトのファイル

| ファイル | 内容 |
| --- | --- |
| `layout.json` | 今使っている唯一の配置 |
| `layouts.json` | 名前ごとの保存したレイアウトと、作業中のレイアウトの id |

- レイアウトは `settings.json` と同じ場所の `layout.json` にあります。現在使っている唯一の配置で、手で編集した場合は読み込み時に検証され、読み込めないときは破棄されずに `layout.json.bak` へ退避されます。
- 保存したレイアウトは `layouts.json` にあり、名前ごとの各レイアウトと、作業中のレイアウトの id を持っています。このマシンに固有のものは含みません（ターミナルのセッション id は保存時に取り除かれます）。そのため **このファイルはそのまま別のコンピューターにコピーできます**。Web ペインが最後に開いていたページは残ります（YouTube ペインで見ていた動画も含みます）。新しいシェルがこのファイルを書き換えることはありません。
- 読み込めないエントリーはそれだけが取り除かれ、残りは保たれます。ファイル全体が読み込めない場合は `layouts.json.bak` へ退避されます。

```json
{
  "version": 1,
  "active": "k3f9d1ab",
  "items": [
    { "id": "k3f9d1ab", "name": "work", "tree": { "version": 1, "root": { "kind": "pane", "id": "p1", "widget": "terminal" } } }
  ]
}
```

保存したレイアウトとプリセットの振る舞い: [キーボードとレイアウト](keyboard.ja.md#保存したレイアウト)。

## アップデート

| | |
| --- | --- |
| 場所 | *Settings → Updates* |
| 読むもの | [GitHub Releases API](https://docs.github.com/rest/releases/releases#get-the-latest-release): 公開済みの最新リリース |
| 更新 | 起動の 15 秒後、以後は 1 日 1 回（設定がオンの間）。*check now* でいつでも確認できます |
| 設定 | `updates.check`（既定 `true`） |
| プライバシー | 最新リリースを 1 回問い合わせるだけで、何もダウンロードもインストールもしません |

- 新しいリリースがあれば通知が出ます。*open release page* でブラウザーにそのページを開きます。インストールは自分で行います。
- 確認はプレリリースを無視します。リリースが知らされるのは、プレリリースから昇格した後です。
- elecdex がつなぐ先の一覧: [ネットワークの利用とデータソース](data-sources.ja.md)。

関連: [キーボードとレイアウト](keyboard.ja.md) · [プラグイン](plugins-use.ja.md) · [開発](develop.ja.md)
