[English](develop.md) | 日本語 | [简体中文](develop.zh-CN.md)

# 開発 — elecdex

elecdex は Windows・macOS・Linux 向けの SF 風ターミナルエミュレーター兼システムモニターで、eDEX-UI を Electron 45、Svelte 5、TypeScript 7、xterm.js 6 で一から作り直したものです（GPL-3.0）。このページはビルドして手を入れる人のためのものです: なぜ作り直したのか、スタックとそのバージョン、ソースからのインストールと実行、コマンド、テストの構成、設計文書の場所、リリースのしかた。開発と利用は Windows で行っています。macOS と Linux は GitHub Actions の e2e テストでビルドと実行をしているだけで、手作業での確認は十分ではありません。

## このページの内容

- [なぜ作り直したのか](#なぜ作り直したのか)
- [スタック](#スタック)
- [はじめに](#はじめに)
- [コマンド](#コマンド)
- [テスト](#テスト)
- [ソースの構成](#ソースの構成)
- [設計文書とルール](#設計文書とルール)
- [リリース手順](#リリース手順)

## なぜ作り直したのか

eDEX-UI はアーカイブされました。作者自身の言葉を借りれば、そのコードベースは "in dire need of a fresh refactoring"（新たなリファクタリングがどうしても必要）な状態でした。elecdex はそのアイデアを受け継ぎ、実装は捨てています。

| eDEX-UI | elecdex |
| --- | --- |
| PTY を localhost の WebSocket（ポート 3000 以降）経由でトンネリング | `MessageChannelMain` でセッションごとに 1 チャネル。待ち受けるソケットはありません |
| `nodeIntegration: true`、`contextIsolation: false`、`@electron/remote` | `sandbox: true`、`contextIsolation: true`、型付きの preload ブリッジが 1 つだけ。レンダラーはネットワークにもファイルシステムにもアクセスできません |
| コアごとに `cluster` を fork し、各ウィジェットが独自のタイマーで `systeminformation` をポーリング | `utilityProcess` 1 つと、購読で動き誰も見ていなければ止まるスケジューラー。Windows では読み取りごとに PowerShell を起動せず、常駐するサンプラー 1 つで取得します（監視のコストは実測で 1 コアの 144% → 14%） |
| カレントディレクトリを `/proc`、`lsof`、`ps` のポーリングで追跡（Windows 非対応） | シェル統合（`OSC 7` / `OSC 9;9` / `OSC 133`）により Windows でも動作 |
| 画面の 5 領域が固定、ターミナルのタブは 5 つ | 永続化されるレイアウトツリー。ペイン、分割、タブに上限はありません |
| バンドラーなし。minify は後処理 | electron-vite（Vite + Rollup） |

ほかにも eDEX-UI と違う点があります。ビルドしたページは `file://` ではなく `app://elecdex` から配られ、コンテンツセキュリティポリシーは `connect-src 'self'` です。ネットワークへのリクエストはすべて main プロセスが行います。テーマは検証済みのデータとして CSS 変数に変換され、`<style>` タグに文字列として埋め込まれることはありません。

## スタック

Electron 45 · TypeScript 7 (native) · electron-vite 6 / Vite 8 · Svelte 5 (runes) · `@xterm/xterm` 6 · node-pty 1.1 · systeminformation · three · zod 4 · Biome 2 · Vitest 5 · Playwright · electron-builder 26

| 部分 | パッケージとバージョン（package.json） |
| --- | --- |
| ランタイム | `electron` 45.0.0。ツールには Node.js 22 以上（`engines`） |
| 言語 | 型チェックは TypeScript 7（`@typescript/native` 7.0.2）、JavaScript API には `typescript` 6.0.3。`strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`erasableSyntaxOnly` |
| ビルド | `electron-vite` 6.0.0、`vite` 8.3.5。ページは minify してビルドします |
| UI | `svelte` 5.57.2（runes）、`svelte-check` 4.7.7 |
| ターミナル | `@xterm/xterm` 6、`@xterm/headless` 6、`node-pty` 1.1 |
| システムの読み取り | `systeminformation` 5.33（`utilityProcess` の中で）。Windows では常駐するサンプラー |
| 地球儀 | `three` 0.186 |
| 検証 | `zod` 4.6 |
| プラグイン | `sucrase` 3.35.1（TypeScript をプラグインの Worker のモジュールに変換） |
| AI | `@anthropic-ai/sdk` 1.1.0（初回使用時に読み込み）。ほかのプロバイダーは OpenAI 互換の HTTP |
| lint と整形 | `@biomejs/biome` 2.6.2（ESLint や Prettier は使いません）。認知的複雑度は 15 以下 |
| テスト | `vitest` 5.0.5、`jsdom` 30.1.3、`@testing-library/svelte` 5.4.2、`@playwright/test` 1.64.1 |
| パッケージ化 | `electron-builder` 26.15.3 |

ライブラリのバージョンは最新のリリースに固定します。例外は [docs/decisions.md](../decisions.md) に記録します（たとえば `@types/node` は Electron の Node に合わせます）。

## はじめに

```bash
npm ci
npm run dev -- -- --windowed --no-intro   # the second -- hands flags to Electron; npm start is the same
```

| アプリのフラグ | 効果 |
| --- | --- |
| `--windowed` | フルスクリーンにしない（既定はフルスクリーン） |
| `--no-intro` | 起動シーケンスを飛ばす |

- **Windows と macOS** ではネイティブのツールチェーンは不要です。node-pty にはビルド済みの N-API バイナリが同梱されており、Electron がそのまま読み込みます。
- **Linux** ではインストール時に node-pty が一度だけコンパイルされます（`python3`、`make`、C++ コンパイラーが必要）。npm 11 は先に承認を求めるので、`npm install-scripts approve node-pty && npm rebuild node-pty` を実行してください。
- Electron のバイナリは、このプロジェクトの `postinstall` スクリプトがダウンロードします（Electron 45 には独自のインストールスクリプトがなく、初回使用時のダウンロードも electron-vite からは起動されないためです）。このスクリプトは node-pty の macOS 用 `spawn-helper` に実行権限も付けます。`--ignore-scripts` を使った後は、一度 `npx install-electron` を実行してください。`npm run dev` が "Electron uninstall" で失敗するときは、これが原因です。

## コマンド

### ビルドと確認

```bash
npm run verify       # lint + typecheck + unit/component tests
npm run build        # bundle main / preload / renderer into out/
npm run test:e2e     # Playwright against the built app (run build first)
npm run test:e2e:smoke # a few minutes of the e2e: launch and the mount and lifecycle contracts
npm run test:packaged  # the packaged app from release/ started once (after package)
npm run package      # installers into release/
```

| コマンド | 内容 |
| --- | --- |
| `npm run dev` / `npm start` | electron-vite の開発サーバーとアプリ |
| `npm run verify` | `biome check .`、型チェック（node、e16c、e2e、`svelte-check --tsgo` による web）、`vitest run` |
| `npm run build` | `out/` への本番ビルドと、ビルドが取り込んだものから作る `out/THIRD_PARTY_NOTICES.txt` |
| `npx playwright test`（`npm run test:e2e`） | `out/` に対する e2e テスト全体。`@perf` のテストは最後。`--project=e2e` で除外 |
| `npm run test:e2e:smoke` | 起動と、mount・lifecycle の契約。コミット前に手早く確かめる（先にビルド） |
| `npm run package` | `release/` にインストーラー |
| `npm run package:dir` | `release/win-unpacked`（macOS・Linux はそれぞれの相当物）に展開済みのアプリ |
| `npm run test:packaged` | `release/` のパッケージ済みアプリを CDP 経由で 1 回起動（`package` か `package:dir` の後） |
| `npm run lint:fix` / `npm run format` | Biome の修正と整形 |

個別のテスト:

```bash
npx vitest run tests/unit/<file>.test.ts
npx playwright test tests/e2e/<folder>/<file>.spec.ts -g "<name>"   # folders: app, workspace, panes, extensions, contracts
```

### 生成とツール

| コマンド | 書き出すもの |
| --- | --- |
| `npm run gen:icon` | `build/icon.svg` → `build/icon.png` と `resources/icons/icon.png` |
| `npm run gen:card` | README のバナー `public/elecdex_repo_card.svg` |
| `npm run gen:geo` | 地球儀の陸の点、国の重心、タイムゾーンの表 |
| `npm run gen:cities` | 天気の地点選択の都市一覧（GeoNames） |
| `npm run gen:orbit-map` | ORBIT の地図: 陸の点とタイムゾーンの線（timezone-boundary-builder、ODbL） |
| `npm run gen:chip8` | CHIP-8 のライブラリとプレビュー、`resources/chip8/programs.json` |
| `npm run gen:elec16` | ELEC-16 の ROM（e16c による BASIC、アセンブリ）、SOFT CARD、ゲームの棚 |
| `npm run gen:screenshots` | デモ用プロファイルでの README のスクリーンショット（Windows、先にビルド） |
| `npm run demo:*` | 代役の上で動くアプリの画面録画（Windows、先にビルド）。作り方は [docs/demos.md](../demos.md) |
| `node scripts/log-feed.mjs [file] [--format=…] [--rate=20]` | LOG WATCH を手で試すための作り物のログ |
| `node scripts/instruments-wav.mjs [dir] [voice]` | プラグインの楽器を WAV ファイルにして聴く |
| `node scripts/sync-calc.mjs <elecxzy>` | 同梱の電卓（`src/shared/calc/vendor`。手で編集しない）を elecxzy のチェックアウトで上書き |

## テスト

エンドツーエンドテストは実際のサービスに接続せず、実行しているマシンにも手を触れません。天気、マーケット、更新確認は閉じたポートかローカルのスタブに向けられ（予報とともに気象庁の地震・津波の一覧、USGS と NOAA のフィードも同様です）、RSS フィード、AI プロバイダー、プラグインのホスト、Web ペインのサイトはローカルサーバーが応答します。サウンド、通知領域のアイコン、サインイン時の登録、ソケットの一覧、API キーの暗号化は代用品に置き換えられます。スイート全体には数分かかります。リリース前には全体を実行し、個々の変更ではその変更が影響しうるスペックを実行します。

| フォルダー | 実行 | 内容 |
| --- | --- | --- |
| `tests/unit/` | Vitest、Node | 純粋なロジック、スキーマ、テストで守るルール（ライフサイクルの表にすべてのペインがあること、どのテーマもすべての変数を設定することなど） |
| `tests/component/` | Vitest + jsdom + Testing Library | Svelte のコンポーネント |
| `tests/e2e/app/` | Playwright `_electron` | アプリ全体: 起動、ブート、設定、終了、多重起動、バックグラウンド、プラグインの封じ込め、古いプロファイルからの更新 |
| `tests/e2e/workspace/` | Playwright | レイアウト、保存したレイアウト、プリセット、ペインの移動、手前に出す、パレット |
| `tests/e2e/panes/` | Playwright | ペインごとに 1 つのスペック |
| `tests/e2e/extensions/` | Playwright | プラグイン（API 1 と 2、KEYSTREAM）と Web のプリセット |
| `tests/e2e/contracts/` | Playwright | すべてのペイン・キー・ダイアログ・IPC メソッドに対する表駆動の検査: mount、lifecycle、永続化、モーション、テーマ、キー割り当て、IPC、障害、出典表示、外部へのリクエストがないこと |

- Playwright には 2 つのプロジェクトがあります: `e2e`（`@perf` 以外のすべて）と、その後に走る `perf`（アイドル時の予算と CPU の計測）。
- スタブは `tests/e2e/support.ts` が設定する環境変数（`STUB_ENV`）です。`ELECDEX_AUDIO_STUB=1`、`ELECDEX_WIFI_STUB=1`、`ELECDEX_DOCKER_STUB=1` など。
- e2e スイートの設計（どの種類の検査をどこに置くか、その理由）: [docs/e2e-design.md](../e2e-design.md)。
- テストの外で elecdex が動いていると（インストール済みのアプリや、開いたままの `npm run dev`）、起動やドラッグが失敗します。レポーターがそれを `test-results/elecdex-running.log` に記録します。

## ソースの構成

```
src/shared/     contracts shared by all processes (API types, IPC channel names, schemas, pure logic)
src/main/       app lifecycle, window, IPC handlers, pty, weather, markets, feeds, quakes, launcher,
                audio, plugins, web panes, reminders, running in the background, updates
src/preload/    the one and only contextBridge surface
src/renderer/   Svelte 5 UI: layout tree, widgets, the plugin host, dialogs, design tokens
src/services/   utilityProcess: the metrics collector
examples/       the sample plugins (pomodoro, and KEYSTREAM for API version 2)
tests/          unit (vitest) · component (vitest + jsdom) · e2e (playwright _electron; docs/e2e-design.md)
scripts/        asset generators (icon, banner, globe data, city list, README screenshots)
docs/           architecture.md (the design, in Japanese), decisions.md (the decision log,
                in Japanese), plugins.md, weather-providers.md, elec16.md (the ELEC-16 design),
                elec16-basic.md, elec16-e16.md, elec16-e16c.md, elec16-soft.md, elec16-play-manual.md, elec16-kit.md,
                elec16-sci-manual.md (the ELEC-16 manuals, elec16-sci.md the calculator's design,
                in Japanese)
```

## 設計文書とルール

| 文書 | 内容 |
| --- | --- |
| [docs/architecture.md](../architecture.md) | 設計。節ごと、ペインごとに 1 節 |
| [docs/decisions.md](../decisions.md) | すべての決定と、その理由、根拠になった実測値 |
| [docs/plugins.md](../plugins.md) | プラグイン API |
| [docs/e2e-design.md](../e2e-design.md) | e2e テストの設計 |
| [docs/weather-providers.md](../weather-providers.md) | 天気のサービスとその利用条件 |
| [docs/palette.md](../palette.md)、[docs/cluster.md](../cluster.md)、[docs/logwatch.md](../logwatch.md) | アクションパレット、CLUSTER ペイン、LOG WATCH ペイン |
| [docs/elec16.md](../elec16.md)、[docs/emu.md](../emu.md) | ELEC-16 ペインと、エミュレーター共通の土台 |
| [docs/demos.md](../demos.md) | デモの作り方、変え方、録り方 |
| [docs/guide/data-sources.ja.md](data-sources.ja.md) | すべてのネットワーク接続と、送るもの、利用条件 |

変更が守るべきルール（セキュリティ境界、ネットワークをどこで扱うか、テストが触れてよいもの）は [CLAUDE.md](../../CLAUDE.md) に、ペインやサブシステムごとのルールは [.claude/rules/](../../.claude/rules) にあります。

## リリース手順

1. `package.json` の `version` を設定し、コミットして push します。
2. そのコミットに `v<version>` のタグを付けて push します: `git tag v0.1.0 && git push origin v0.1.0`。
3. Release ワークフローがタグと `package.json` の一致を確認し、lint、型チェック、ユニットテストを実行したうえで、自動生成したノート付きの GitHub プレリリースを作成し、Windows（x64、arm64）、macOS（arm64、x64）、Linux（AppImage と deb、x64 と arm64）のインストーラーを添付します。
4. プレリリースを確認し、準備ができたら "Set as a pre-release" のチェックを外します。更新確認はプレリリースを無視するので、動いているアプリが新しいリリースを知らせるのはこの後です。

- ワークフロー（[.github/workflows/release.yml](../../.github/workflows/release.yml)）は、ランナーが自分で作ったものを実行できる場合、各パッケージを利用者が受け取る形のまま 1 回起動します（クロスビルドの Windows arm64 と macOS x64 は除く）。
- ビルドには署名がありません。各 OS で出る警告と、その先へ進む方法は README の *警告が表示されたら* にあります。
- メンテナー向けの完全な手順（タグの前にテスト全体とパッケージ済みアプリを実行し、後でリリースを読む）は、[CLAUDE.md](../../CLAUDE.md) の *Releases* にあります。

関連: [キーボードとレイアウト](keyboard.ja.md) · [テーマと設定](themes-settings.ja.md) · [プラグイン](plugins-use.ja.md)
