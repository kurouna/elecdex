[English](index.md) | 日本語 | [简体中文](index.zh-CN.md)

# ユーザーガイド — elecdex

elecdex は、Windows・macOS・Linux 向けの SF 風のデスクトップのターミナルエミュレータ兼システムモニタです。eDEX-UI を Electron 45、Svelte 5、TypeScript 7 で一から作り直したもので、GPL-3.0 で公開しています。このガイドは、ペインと機能のすべてについて、何を見せるか、データをどこから得るか、どのくらいの頻度で更新するか、何を決して読まず送らないか、プラットフォームでどう違うかを説明します。elecdex は Windows で開発・使用しています。macOS と Linux のビルドは CI でのみテストしており、手で使っての検証は十分ではありません。

## はじめに

| ページ | 内容 |
| --- | --- |
| [レイアウトのプリセット](presets.ja.md) | 10 個のプリセット（standard、network、earth、dev、media、desk、ai、cockpit、retro、blank）、キー Ctrl+Shift+F1〜F10、それぞれのペイン |
| [ワークスペース](workspace.ja.md) | ペイン、分割とタブ、移動と閉じ方、ペインを前に出す、ポップアップのペイン、保存したレイアウト、アクションパレット、動きと音、バックグラウンドでの実行 |
| [キーボードショートカット](keyboard.ja.md) | 既定のキーすべて、割り当ての変え方、システム全体の表示・非表示のショートカット |
| [テーマと設定](themes-settings.ja.md) | 7 つのテーマと `settings.json` |

## ペイン

| ページ | ペイン |
| --- | --- |
| [システムのペイン](panes-system.ja.md) | Terminal、Clock、System、CPU、Memory、GPU、Disk、Top processes、Cluster、Launcher、Filesystem |
| [ネットワークのペイン](panes-network.ja.md) | Network status、Network traffic、World view、Connections、Wi-Fi、Ethernet |
| [開発のペイン](panes-dev.ja.md) | AI Agent、Git、Docker、Log Watch |
| [外の世界のペイン](panes-world.ja.md) | Orbit、Markets、Weather、RSS、Quakes、地震と津波の通知 |
| [AI のペイン](panes-ai.ja.md) | AI chat、ELEC system |
| [デスクのペイン](panes-desk.ja.md) | Calculator、Notes、Tasks、Timer、Clipboard、Calendar、Utility |
| [メディアのペイン](panes-media.ja.md) | Spectrum、Browser、YouTube、X、Mixer、Now playing |
| [レトロのペイン](panes-retro.ja.md) | CHIP-8、ELEC-16（POCKET、HANDHELD、PLAY-320、SCI-128） |

## 拡張、プライバシー、開発

| ページ | 内容 |
| --- | --- |
| [プラグイン](plugins-use.ja.md) | プラグインの入れ方、求める許可、見本。API は [plugins.md](../plugins.md) に |
| [ネットワークの利用とデータソース](data-sources.ja.md) | elecdex がつなぐ先すべて、送るもの、頻度、利用条件 |
| [開発](develop.ja.md) | elecdex のビルド、テスト、リリースと、作り直した理由 |

## 取扱説明書と設計書

- ELEC-16（日本語）: [BASIC](../elec16-basic.md)、[E16 の機械](../elec16-e16.md)、[e16c と CODE](../elec16-e16c.md)、[SOFT CARD](../elec16-soft.md)、[PLAY-320](../elec16-play-manual.md)、[SCI-128](../elec16-sci-manual.md)。HTML のかんたんガイド: [ポケコン](../elec16-guide/pocket.html)、[関数電卓](../elec16-guide/sci.html)（GitHub では HTML のソースが表示されるので、手元に取ってから開いてください）
- [設計](../architecture.md) と [決定の記録](../decisions.md): 設計と、すべての決定とその理由、測った数
- [プラグインの API](../plugins.md)
