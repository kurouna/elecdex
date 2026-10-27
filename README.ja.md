<p align="center">
  <img src="./public/elecdex_repo_card.svg" width="800" alt="elecdex - Sci-fi terminal and system monitor, rebuilt">
</p>

[![CI](https://github.com/kurouna/elecdex/actions/workflows/ci.yml/badge.svg)](https://github.com/kurouna/elecdex/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/kurouna/elecdex?include_prereleases)](https://github.com/kurouna/elecdex/releases)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Zenn](https://img.shields.io/badge/Zenn-kurouna-blue)](https://zenn.dev/kurouna)
[![X](https://img.shields.io/badge/X-elecxzy-black)](https://x.com/elecxzy)

[English](README.md) | **日本語** | [简体中文](README.zh-CN.md)

# elecdex

SF 風のデスクトップ用ターミナルエミュレーター兼システムモニターです。
[eDEX-UI](https://github.com/GitSquared/edex-ui)（2021 年にアーカイブ済み）を、現在の安全な技術スタックで
一から書き直したもので、Windows・macOS・Linux に対応しています。

<p align="center">
  <a href="https://youtu.be/JlCZzLhp_PM">
    <img src="./docs/screenshots/elecdex-hero.jpg" alt="Tron テーマの elecdex：左にシステムモニター、中央にシェルの上で BASIC の式を表示するポケコン ELEC-16 と関数電卓 ELEC-16 SCI、右に世界地図・マーケット・天気">
  </a>
  <br>
  ▶ <a href="https://youtu.be/JlCZzLhp_PM">3 分の紹介動画</a> · <a href="https://youtube.com/shorts/K-Is8LihR1w">ショート（縦型）</a>
</p>

> **v0.0.48 — プレリリース。** 以下に書いた機能はすべて現時点で動作します。ビルドには署名がありません。
> *unreleased* と記したものは `main` にあり、次のリリースで入ります。
>
> **Windows で開発し、使っています。** macOS と Linux もリリースごとにビルドしていますが、
> 動かしたのは GitHub Actions 上の自動 end-to-end テストだけで、実際に手で長く使った人はまだいません。
> そのため **macOS と Linux は十分に検証されていません**。粗いところがあるはずなので、
> 見つけたものはぜひ[報告](https://github.com/kurouna/elecdex/issues)してください。
>
> 設計メモ：[docs/architecture.md](docs/architecture.md)。すべての判断とその理由：
> [docs/decisions.md](docs/decisions.md)。

## これは何か

elecdex は、シェルとシステムの状態を 1 つの画面に並べる、SF の端末風のデスクトップアプリです。eDEX-UI（2021 年にアーカイブ）を Electron 45、Svelte 5、TypeScript 7 で一から作り直したもので、GPL-3.0 で公開しています。

- **シェル**: PowerShell、bash、zsh、fish を node-pty でタブと分割に。シェル統合（OSC 7 / OSC 9;9）で、Windows でも各シェルの作業フォルダ（カレントディレクトリ）を追従します。
- **ペイン**: 組み込みのペイン 40 種と Web ペイン（Browser、YouTube、X）を、状態が保存される分割とタブのツリー構造で並べます。レイアウトのプリセット 10 個、保存したレイアウト、アクションパレット。
- **システムとネットワーク**: CPU、メモリ、GPU、ディスク、プロセス、プログラムごとの TCP ソケット、Wi-Fi とイーサネットの診断。Windows では読み取りのたびにプロセスを起動しません（常駐する 1 つのサンプラーが読みます）。
- **外の世界**: 天気（気象庁、NWS、MET Norway）、マーケット、RSS、地震と津波、手元で計算する衛星（SGP4）、通信先の国を同梱の GeoIP データベースで調べて示す地球儀。
- **仕事と AI**: Git（読み取りと FETCH/PULL/PUSH）、Docker、Log Watch、Claude Code のセッション、OpenAI 互換または Anthropic の API への AI チャット（鍵は OS で暗号化して保存）。
- **独自の機械**: CHIP-8 のエミュレータと、オリジナルの 16 ビットのポケコン ELEC-16（BASIC、ゲーム機のモデル、関数電卓）。
- **セキュリティ**: 画面はサンドボックスで、Node もネットワークも使えません（`connect-src 'self'`）。通信はすべてメインプロセスが、ペインがそのデータを必要としている間だけ行い、テレメトリはありません。プラグインは許可したことだけができるサンドボックスのワーカーで動きます。

## レイアウトのプリセット

10 個のプリセットで、画面全体をキー 1 つで切り替えます（**Ctrl+Shift+F1**〜**F10**）。cockpit と blank 以外は、左のシステムの列をそのまま残します。各スクリーンショットは異なるテーマで撮影しています。詳しくは [レイアウトのプリセット](docs/guide/presets.ja.md) にあります。

<table>
  <tr>
    <td align="center" width="50%"><a href="docs/guide/presets.ja.md#standard"><img src="./docs/screenshots/elecdex-tron.jpg" alt="Tron テーマの standard プリセット"></a><br><sub><b>standard</b> · Ctrl+Shift+F1 · シェル、このマシン、外の世界</sub></td>
    <td align="center" width="50%"><a href="docs/guide/presets.ja.md#network"><img src="./docs/screenshots/elecdex-network.jpg" alt="White テーマの network プリセット"></a><br><sub><b>network</b> · Ctrl+Shift+F2 · プログラムごとのソケット、Wi-Fi、イーサネット、地球儀</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><a href="docs/guide/presets.ja.md#earth"><img src="./docs/screenshots/elecdex-earth.jpg" alt="Tron テーマの earth プリセット"></a><br><sub><b>earth</b> · Ctrl+Shift+F3 · 頭上の衛星、足もとの地震、天気</sub></td>
    <td align="center" width="50%"><a href="docs/guide/presets.ja.md#dev"><img src="./docs/screenshots/elecdex-dev.jpg" alt="Phosphor テーマの dev プリセット"></a><br><sub><b>dev</b> · Ctrl+Shift+F4 · 動いている AI エージェント、Docker、Git、Log Watch</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><a href="docs/guide/presets.ja.md#media"><img src="./docs/screenshots/elecdex-media.jpg" alt="White テーマの media プリセット"></a><br><sub><b>media</b> · Ctrl+Shift+F5 · Web ペイン、音のスペクトル、ミキサー、再生中の曲</sub></td>
    <td align="center" width="50%"><a href="docs/guide/presets.ja.md#desk"><img src="./docs/screenshots/elecdex-desk.jpg" alt="Black テーマの desk プリセット"></a><br><sub><b>desk</b> · Ctrl+Shift+F6 · メモ、タスク、タイマー、クリップボード、カレンダー、ユーティリティ</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><a href="docs/guide/presets.ja.md#ai"><img src="./docs/screenshots/elecdex-ai.jpg" alt="Business (Dark) テーマの ai プリセット"></a><br><sub><b>ai</b> · Ctrl+Shift+F7 · 2 つの AI チャット、ELEC の評議、GPU</sub></td>
    <td align="center" width="50%"><a href="docs/guide/presets.ja.md#cockpit"><img src="./docs/screenshots/elecdex-cockpit.jpg" alt="Black テーマの cockpit プリセット"></a><br><sub><b>cockpit</b> · Ctrl+Shift+F8 · マシン全体を 1 枚の CLUSTER ペインに</sub></td>
  </tr>
  <tr>
    <td align="center" width="50%"><a href="docs/guide/presets.ja.md#retro"><img src="./docs/screenshots/elecdex-retro.jpg" alt="Tron テーマの retro プリセット"></a><br><sub><b>retro</b> · Ctrl+Shift+F9 · CHIP-8、ELEC-16 の機械、関数電卓 SCI-128</sub></td>
    <td align="center" width="50%"><a href="docs/guide/presets.ja.md#blank"><img src="./docs/screenshots/elecdex-blank.jpg" alt="Amber テーマの blank プリセット"></a><br><sub><b>blank</b> · Ctrl+Shift+F10 · ペインなし: 自分のレイアウトを組む</sub></td>
  </tr>
</table>

## ペイン

| 分類 | ペイン | ガイド |
| --- | --- | --- |
| システム | Terminal、Clock、System、CPU、Memory、GPU、Disk、Top processes、Cluster、Launcher、Filesystem | [システムのペイン](docs/guide/panes-system.ja.md) |
| ネットワーク | Network status、Network traffic、World view、Connections、Wi-Fi、Ethernet | [ネットワークのペイン](docs/guide/panes-network.ja.md) |
| 開発 | AI Agent、Git、Docker、Log Watch | [開発のペイン](docs/guide/panes-dev.ja.md) |
| 外の世界 | Orbit、Markets、Weather、RSS、Quakes、地震と津波の通知 | [外の世界のペイン](docs/guide/panes-world.ja.md) |
| AI | AI chat、ELEC system | [AI のペイン](docs/guide/panes-ai.ja.md) |
| デスク | Calculator、Notes、Tasks、Timer、Clipboard、Calendar、Utility | [デスクのペイン](docs/guide/panes-desk.ja.md) |
| メディア | Spectrum、Browser、YouTube、X、Mixer、Now playing | [メディアのペイン](docs/guide/panes-media.ja.md) |
| レトロ | CHIP-8、ELEC-16（POCKET、HANDHELD、PLAY-320、SCI-128） | [レトロのペイン](docs/guide/panes-retro.ja.md) |

## インストール

お使いのプラットフォーム向けのインストーラーを
[Releases](https://github.com/kurouna/elecdex/releases) からダウンロードしてください。

| プラットフォーム | ファイル |
| --- | --- |
| Windows x64 / arm64 | `elecdex-win-x64-<version>.exe` / `elecdex-win-arm64-<version>.exe` |
| macOS Apple silicon / Intel | `elecdex-mac-arm64-<version>.dmg` / `elecdex-mac-x64-<version>.dmg` |
| Linux x64 | `elecdex-linux-x86_64-<version>.AppImage` または `elecdex-linux-amd64-<version>.deb` |
| Linux arm64 | `elecdex-linux-arm64-<version>.AppImage` または `elecdex-linux-arm64-<version>.deb` |

作者が普段使っているのは Windows 版です。macOS 版と Linux 版も同じリリースワークフローで作られ、
GitHub のランナー上でエンドツーエンドテストに合格していますが、実機で触って確かめたことはありません。
十分に検証されていないものとしてお使いください。

### 警告が表示されたら

インストーラーにはコード署名をしていません。証明書の費用は個人のプロジェクトで負担できる額を超えるためです。
そのため、Windows と macOS は初回の起動前に警告を表示します。これは発行元が OS にとって未知であることを
示すもので、ファイルに何かが見つかったという意味ではありません。ダウンロードしたファイルを先に確かめたい場合は、
リリースページにすべてのファイルの SHA-256 チェックサムが載っています。各インストーラーは、タグの付いたソースから
GitHub のランナー上で [リリースワークフロー](.github/workflows/release.yml) によってビルドされています。
以下の手順が必要なのは、インストールごとに一度だけです。

**Windows**

1. ブラウザーがダウンロードを保留することがあります（「一般的にダウンロードされていません」）。Edge では、
   ダウンロードの *⋯* メニュー → *保存* → *詳細表示* → *保持する* を選びます。Chrome では *保存* を選びます。
2. `.exe` を実行します。SmartScreen が **「Windows によって PC が保護されました」** と表示したら、**詳細情報** を
   クリックし、続けて **実行** をクリックします。
3. インストーラーは現在のユーザーだけにインストールするため、管理者権限は求めません。

ファイルがブロックされたと表示され、*実行* が出てこない場合は、`.exe` を右クリック →
*プロパティ* → **許可する** にチェック → *OK* とし、もう一度実行してください。

**macOS**（15 Sequoia 以降。それより前のバージョンは最後の手順を参照）

1. `.dmg` を開き、**elecdex** を *アプリケーション* にドラッグします。
2. *アプリケーション* から elecdex を開きます。macOS が **「“elecdex”にマルウェアが含まれていないことを
   検証できませんでした」** と表示したら、**完了** をクリックします（*ゴミ箱に入れる* ではありません）。
3. **システム設定 → プライバシーとセキュリティ** を開き、*セキュリティ* までスクロールして、elecdex についての
   行の横にある **このまま開く** をクリックします。パスワードか Touch ID で確認し、もう一度 **このまま開く** を
   クリックします。
4. macOS 14 以前では、アプリを右クリック → **開く** → **開く** で同じことができます。

代わりに **「“elecdex”は壊れているため開けません」** と表示された場合も、ファイルは壊れていません。
起動を止めているのは、ダウンロード時に付いた検疫（quarantine）属性です。この属性を取り除いてから、
もう一度アプリを開いてください。

```bash
xattr -dr com.apple.quarantine /Applications/elecdex.app
```

**Linux**（警告は出ませんが、知っておいてほしいことが二つあります）

- **deb**（Debian、Ubuntu）: `sudo apt install ./elecdex-linux-amd64-<version>.deb`。Ubuntu 24.04 以降で
  Electron のサンドボックスを起動するために必要な AppArmor プロファイルも、あわせてインストールされます。
- **AppImage**: `chmod +x elecdex-linux-*.AppImage` を実行してから起動します。FUSE 2（`libfuse2`、Ubuntu 24.04
  では `libfuse2t64`）が必要です。Ubuntu 24.04 以降では AppArmor がサンドボックスをブロックするため、
  *SUID sandbox helper* についてのメッセージを出して止まることがあります。その場合は deb を使ってください。
  `--no-sandbox` を付けて起動しないでください。レンダラーをあなたのファイルから遠ざけているのは、このサンドボックスです。

elecdex はフルスクリーンで起動します。**F11** でフルスクリーンを抜け、**Ctrl+Shift+Q** で終了します。
`--windowed` を付けるとウィンドウで起動し、`--no-intro` を付けると起動シーケンスを省略します。

### ソースから動かす

```bash
git clone https://github.com/kurouna/elecdex.git
cd elecdex
npm ci
npm run dev -- -- --windowed --no-intro
```

`npm ci` は Electron をダウンロードし、macOS では node-pty を直します。Linux では、node-pty がコンパイルできるようにそのインストールスクリプトを許可してください。テスト、ビルド、そのほかのコマンドは [開発ガイド](docs/guide/develop.ja.md) にあります。

## はじめの操作

| キー | 働き |
| --- | --- |
| Ctrl+Shift+A | ペインを足す（ピッカー） |
| Ctrl+Shift+F1 … F10 | レイアウトのプリセットへ |
| Ctrl+Shift+G | 保存したレイアウト |
| Ctrl+Shift+P | 操作、レイアウト、テーマ、設定を名前で探す（アクションパレット） |
| Ctrl+Shift+Z | フォーカスのあるペインを、ほかのペインの上に大きく出す（もう一度で戻す） |
| Ctrl+Shift+. | 設定 |
| F11 / Ctrl+Shift+Q | 全画面を抜ける / 終了 |

ショートカットはすべて *設定 → Keyboard* で変えられます。一覧は [キーボードショートカット](docs/guide/keyboard.ja.md) にあります。

## ドキュメント

| ページ | 内容 |
| --- | --- |
| [ユーザーガイド](docs/guide/index.ja.md) | 下のページの目次 |
| [レイアウトのプリセット](docs/guide/presets.ja.md) | 10 個のプリセットをペインごとに |
| [ワークスペース](docs/guide/workspace.ja.md) | ペイン、分割、タブ、保存したレイアウト、パレット、テーマと動き、バックグラウンドでの実行 |
| [キーボードショートカット](docs/guide/keyboard.ja.md) | 既定のキーすべて、割り当ての変更、システム全体のショートカット |
| [テーマと設定](docs/guide/themes-settings.ja.md) | 7 つのテーマ、`settings.json` |
| [プラグイン](docs/guide/plugins-use.ja.md) | プラグインの入れ方とできること（[API](docs/plugins.md)） |
| [ネットワークの利用とデータソース](docs/guide/data-sources.ja.md) | elecdex がつなぐ先すべて、頻度と利用条件 |
| [開発](docs/guide/develop.ja.md) | ビルド、テスト、リリース、作り直した理由 |
| [ELEC-16 の取扱説明書とガイド](docs/guide/panes-retro.ja.md#elec-16) | BASIC、E16 の機械、e16c、SOFT CARD、PLAY-320、SCI-128。ポケコンと関数電卓は、スクリーンショット付きの HTML のかんたんガイドも |
| [設計](docs/architecture.md) · [決定の記録](docs/decisions.md) | 設計と、すべての決定とその理由 |

## サードパーティのアセット

| アセット | 提供元 | ライセンス |
| --- | --- | --- |
| 表示用フォント | [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch) | SIL OFL 1.1 |
| UI フォント | [Saira Condensed](https://fonts.google.com/specimen/Saira+Condensed) | SIL OFL 1.1 |
| 等幅フォント | [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | SIL OFL 1.1 |
| ELEC-16 のキートップのフォント | [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed)、[IBM Plex Sans Condensed](https://fonts.google.com/specimen/IBM+Plex+Sans+Condensed)、[Inter Tight](https://fonts.google.com/specimen/Inter+Tight)、[M PLUS Rounded 1c](https://fonts.google.com/specimen/M+PLUS+Rounded+1c)、[Albert Sans](https://fonts.google.com/specimen/Albert+Sans)。カナキーの 2 字は [BIZ UDPGothic](https://fonts.google.com/specimen/BIZ+UDPGothic)、[IBM Plex Sans JP](https://fonts.google.com/specimen/IBM+Plex+Sans+JP)、[Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP)、M PLUS Rounded 1c から（[Fontsource](https://fontsource.org/) 経由） | SIL OFL 1.1 |
| IP ジオロケーション | [`@ip-location-db/geo-whois-asn-country-mmdb`](https://github.com/sapics/ip-location-db)、データは [NRO](https://www.nro.net/) による | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)（npm パッケージは CC0-1.0 と表記されていますが、同梱の NRO_LICENSE は nro.net へのクレジット表示を求めています） |
| 地球儀の陸地と国の形状 | [Natural Earth](https://www.naturalearthdata.com/)（[world-atlas](https://github.com/topojson/world-atlas) 経由） | パブリックドメイン / ISC（ビルド時のみ使用） |
| 国コードとタイムゾーン | [i18n-iso-countries](https://github.com/michaelwittig/node-i18n-iso-countries)、[countries-and-timezones](https://github.com/manuelmhtr/countries-and-timezones) | MIT（ビルド時のみ使用） |
| README バナーのフォント | [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) | SIL OFL 1.1（ビルド時にアウトライン化して SVG に埋め込み） |
| マーケットデータのクライアント | [yahoo-finance2](https://github.com/gadicc/yahoo-finance2) | MIT（メインプロセスにバンドル） |
| タイムゾーンの境界（ORBIT） | [timezone-boundary-builder](https://github.com/evansiroky/timezone-boundary-builder) 2026d（OpenStreetMap のデータから作成） | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)、© OpenStreetMap contributors。`src/renderer/widgets/orbit/tz-lines.json` にある派生した線（`npm run gen:orbit-map` で生成）も ODbL のもとにあり、ペインにクレジットを表示します。 |
| ORBIT 地図の陸地 | [Natural Earth](https://www.naturalearthdata.com/) 50m の陸地（world-atlas 経由） | パブリックドメイン（"Made with Natural Earth"、ペインにクレジットを表示） |
| 軌道の伝播計算（SGP4） | [satellite.js](https://github.com/shashwatak/satellite-js) | MIT |
| git ペインの差分のシンタックスカラー | [highlight.js](https://highlightjs.org/) | BSD-3-Clause |
| 電卓の式評価器 | [elecxzy](https://github.com/kurouna/elecxzy) の `src/utils/calc` を無修正で `src/shared/calc/vendor` にコピー | MIT |
| CHIP-8 のフォント | [Octo](https://github.com/JohnEarnest/Octo) の `js/emulator.js` から `src/shared/chip8/fonts.ts` にコピー | MIT |
| CHIP-8 のプログラム | [chip8Archive](https://github.com/JohnEarnest/chip8Archive)（作者はそれぞれ）。`resources/chip8/archive` に同梱 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)。ペインに表示 |
| CHIP-8 のテスト用プログラム（DIAG） | Timendus の [chip8-test-suite](https://github.com/Timendus/chip8-test-suite)。`resources/chip8/test-suite` に Octo のソースとともに同梱 | GPL-3.0 |

ジオロケーションのデータベースは同梱されているため、アカウントも API キーも初回起動時の
ダウンロードも不要で、IP の検索がマシンの外に出ることはありません。

アプリのビルドに使われるすべてのパッケージと上記のデータは、ライセンス本文とともに
`THIRD_PARTY_NOTICES.txt` に記載されています。このファイルは各リリースで実行ファイルの隣に置かれます（`npm run build` が生成します）。

---

## ライセンス

本ソフトウェアは、eDEX-UI と同じ [GNU General Public License v3.0](./LICENSE) のもとで公開されています。

## 謝辞

本アプリケーションは、以下の先駆的なプロジェクトの設計と哲学に深くインスパイアされています。
この優れたソフトウェアを生み出した開発者およびコミュニティの皆様に、最大限の敬意と謝意を表します。

- **[eDEX-UI](https://github.com/GitSquared/edex-ui)**
  - Copyright (c) 2017-2021 Gabriel "Squared" Saillard
  - 作者: Gabriel "Squared" Saillard ([gaby.dev](https://gaby.dev))
  - GNU General Public License v3.0 のもとでライセンスされています

---

<p align="center">Copyright © 2026 elecxzy project</p>
