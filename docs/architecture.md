# elecdex — アーキテクチャ設計書

> eDEX-UI (GitSquared/edex-ui, v2.2.8, 2021年アーカイブ) の完全リライト。
> 原版のコード・アセットは一切継承せず、同等以上の体験をモダンな技術スタックで再構築する。
>
> **この文書の読み方**: §1〜§13 は設計で、実装に合わせて更新している。§14 は最初の実装計画の記録で、
> 当時のまま残してある。その後に加わった機能（天気・相場・RSS・地震・音声・プラグイン・Web ペイン・
> 保存レイアウト・バックグラウンド常駐・AI チャットなど）の判断は、理由と実測値つきで [decisions.md](decisions.md) にある。
>
> **動作確認の範囲**: 開発と日常の使用は Windows。macOS と Linux は GitHub Actions の e2e が通ることしか
> 確かめておらず、**人の手による動作確認は十分でない**（§13、§17）。
> 変えてはならない約束事の要約は [CLAUDE.md](../CLAUDE.md)。

---

## 1. 目的と非目的

### 目的
- **SF風フルスクリーン端末 + システムモニタ**という原版の体験価値を維持する
- 原版の構造的負債（固定レイアウト、グローバル状態、旧セキュリティモデル、OS依存ハック）を解消する
- **ペイン/タブ/ウィジェットを後から拡張できる**土台を最初から持つ
- Windows / macOS / Linux で同等に動き、CI から署名なしでも配布物が出る

### 非目的（v1 スコープ外）
- オンスクリーンキーボード / タッチ端末対応
- 内蔵ビューア（PDF / 画像 / 動画 / 音声）、ファジーファインダ
- 原版テーマJSON・キーボードレイアウトJSONとの互換性
- ~~外部プラグインの動的ロード~~ — v0.0.5 で実装した（[plugins.md](plugins.md)）。コマンド型のプラグインは見送り中

### ライセンス方針
elecdex は原版 eDEX-UI と同じ **GPL-3.0** で公開する。原版のソース・アセット（テーマ、SFX wav、grid.json、vendored encom-globe.js）は、ライセンス上は利用可能になったが、設計を刷新するため持ち込まない方針は維持する。

- 地球儀のタイルデータ → [Natural Earth](https://www.naturalearthdata.com/)（public domain）から自前の生成スクリプトで作る
- SFX → 新規制作または CC0 素材
- フォント → SIL OFL 1.1 のものを同梱（Chakra Petch / Saira Condensed / JetBrains Mono）
- IP 位置情報 → NRO が CC BY 4.0 で公開する RIR whois / GeoFeed / ASN 由来のデータ（npm パッケージは CC0-1.0 と表記されているが、同梱の NRO_LICENSE により nro.net への帰属表示が必要。地球儀ペインと README に表示）

---

## 2. 技術スタック（確定）

| 領域 | 採用 | バージョン | 備考 |
|---|---|---|---|
| シェル | Electron | 44.x | Chromium 最新系。`sandbox: true` + `contextIsolation: true` |
| 言語 | TypeScript | **7.0.2**（native）+ 6.0.3（JS API） | `typescript@6.0.3` を JS Compiler API 用に、`@typescript/native@npm:typescript@7.0.2` をネイティブコンパイラとして併置。`svelte-check --tsgo` で Svelte も TS7 で型検査する（elecxzy と同じ TS7 運用）|
| ビルド | electron-vite | 6.0.0-beta.3 (Vite 8.3.2、Rolldown + Oxc) | main / preload / renderer の3ターゲット + HMR。Vite 8 を受け付ける electron-vite は 6 のベータだけなので、それを使う（[decisions.md](decisions.md)） |
| UI | Svelte | 5.x (runes) | VDOM なし。常駐する UI の更新コストが小さい（動きは共有の 10 fps フレームループに載せる。[decisions.md](decisions.md)） |
| スタイル | 素のCSS + CSS変数デザイントークン + Svelte scoped CSS | — | Tailwind 不採用（clip-path/SVG装飾主体のため） |
| 端末 | `@xterm/xterm` | 6.x | addon: fit 0.11 / webgl 0.19 / unicode11 0.9 / search 0.16 / web-links 0.12 / serialize 0.14 / clipboard 0.2 |
| PTY | `node-pty` | 1.1.x | main プロセスで spawn。プリビルド配布あり |
| システム情報 | `systeminformation` | 5.33.x | `utilityProcess` 内でのみ使用 |
| 3D | `three` | 0.186 | Globe を自前実装。threlte は採用せず、シーン1つを素の three で書く（依存を増やす利点がない規模だった） |
| フォント | Chakra Petch / Saira Condensed / JetBrains Mono | fontsource 5.3 | すべて SIL OFL 1.1。woff2 をローカル同梱（`font-src 'self'`） |
| GeoIP | `@ip-location-db/geo-whois-asn-country-mmdb` + `mmdb-lib` | 2.3 / 3.0 | データは **CC BY 4.0（NRO）**、統合版 7.8MB のみ同梱。アカウント・APIキー・初回DL・同意が全て不要で完全オフライン |
| 設定検証 | `zod` | 4.x | 設定・テーマ・IPC入力の全検証 |
| ファイル監視 | `node:fs` の `watch` + mtime のポーリング | — | 設定 / テーマ / プラグインのホットリロード（`main/store/watch-user-file.ts`）。`fs.watch` が取りこぼす環境があるため更新時刻も見る。chokidar は使っていない |
| RSS / Atom | `fast-xml-parser` | 5.x | main でのみ使用。RSS ペインができるまで import しない |
| プラグインの変換 | `sucrase` | 3.35 | TypeScript を剥がすだけ。main は変換するだけで実行しない |
| 相場 | `yahoo-finance2` | 4.x | Node 専用（ブラウザでは CORS と cookie で動かない）。main にバンドル |
| AI チャット | `@anthropic-ai/sdk` | 0.131 | Anthropic の Messages API 用。main でのみ使い、anthropic 種別のプロバイダに最初に問い合わせるまで import しない。OpenAI 互換側は依存を足さず素の fetch + SSE（§5.7） |
| Lint/Format | Biome | 2.x | ESLint + Prettier を置換 |
| テスト | Vitest 5 / Playwright 1.63 (`_electron`) | — | unit + component + E2E |
| パッケージング | electron-builder | 26.x | nsis / dmg / AppImage + deb |
| パッケージマネージャ | npm | 11.x | pnpm はネイティブモジュール + electron-builder で `node-linker=hoisted` が必要になり利点が薄いため採用せず |

**チャートは自前実装**（原版の smoothie 1.35 を置換）。ストリーミング系は汎用ライブラリより軽い Canvas コンポーネントが有利。
**音声も自前実装**（Howler を置換）。Web Audio API に薄いラッパを書く。

---

## 3. プロセスアーキテクチャ

```
┌─ main process ──────────────────────────────────────────────┐
│  app 起動 / 単一インスタンスロック / ウィンドウ管理           │
│                                                             │
│  PtyManager       node-pty で PTY を spawn                  │
│    └─ OscParser   OSC 7 / OSC 133 を解釈して CWD・プロンプト │
│                                                             │
│  MetricsBroker    購読管理 + ファンアウト                    │
│    ├── utilityProcess: metrics   (systeminformation)        │
│      └ geoip: 同じ collector 内で mmdb-lib + 同梱DB を遅延読込 │
│                                                             │
│  SettingsStore    zod 検証 + fs.watch 監視                   │
│  ThemeResolver    内蔵(asar) ← ユーザー(userData) オーバーレイ│
│  FsBridge         ディレクトリ読み取り（allowlist 付き）     │
│                                                             │
│  IpcRouter        全ハンドラが zod で入力を検証              │
└───────────────┬─────────────────────────────────────────────┘
                │ ipcMain / ipcRenderer + MessageChannelMain
┌───────────────┴─────────────────────────────────────────────┐
│  preload (sandbox, contextIsolation)                        │
│    contextBridge.exposeInMainWorld("elecdex", api)          │
│    ← ここが唯一の境界。Node API は renderer に一切出さない   │
└───────────────┬─────────────────────────────────────────────┘
┌───────────────┴─────────────────────────────────────────────┐
│  renderer (Svelte 5)                                        │
│    LayoutTree ─ PaneHost ─ WidgetRegistry                   │
│      └─ widgets: widgets/builtins.ts の内蔵ウィジェット      │
│                  + plugin:<id>（blob Worker、plugins.md）   │
│    stores: settings / layout / sessions / metrics / theme    │
└─────────────────────────────────────────────────────────────┘
```

### 原版からの主要な変更

| 原版 | elecdex |
|---|---|
| PTY を `ws` で localhost TCP (port 3000, 3002-3005) 転送 | `MessageChannelMain` で main↔renderer を直結。ポート不要、プロキシ干渉なし |
| `cluster` で最大7プロセス fork | `utilityProcess` 1〜2本。プロセス数は収集負荷に応じて決める |
| 各ウィジェットが個別に `setInterval` で si を叩く | **単一スケジューラ + 購読ベース**。同一ソースの重複収集を排除し、購読0ならポーリング停止 |
| `nodeIntegration: true` / `contextIsolation: false` / `@electron/remote` | `sandbox: true` / `contextIsolation: true` / remote 不使用 |
| CWD 追跡: `/proc/<pid>/cwd` readlink・`lsof`・`ps` を1秒ポーリング（Windows 非対応） | **Shell Integration (OSC 7 / OSC 133)** を全OSで。ネイティブ取得はフォールバック |
| タブ5固定（ポート事前確保 + if連鎖） | タブ/ペイン無制限。レイアウトは木構造 |
| `document.querySelector("head").innerHTML +=` でテーマCSS注入 | CSS変数を `style.setProperty` で差し替え。`injectCSS` の生注入は廃止 |
| 起動毎に内蔵テーマを userData へ上書きコピー（ユーザー編集が消える） | 内蔵は asar から読み、userData は**オーバーレイ**。上書きしない |
| バンドラなし、terser/clean-css の後処理のみ | electron-vite（Vite 8: Rolldown/Oxc） |

---

## 4. IPC 設計

### 4.1 境界の原則
- renderer は **`window.elecdex` 以外の手段を一切持たない**（Node なし、remote なし、`eval` も CSP で封鎖）
- main 側の全ハンドラは **zod スキーマで入力を検証**してから処理する。パスは正規化して allowlist 照合
- チャネル名・ペイロード型・スキーマは `src/shared/` に集約し、main / preload / renderer が同一定義を import する
- main の各モジュールは自分のチャネルを 1 つの表にして `registerTable`（main/ipc/table.ts）で登録し、返る関数で
  まとめて外す（2026-10-03）。以前は `ipcMain.handle` / `on` を 1 本ずつ書き、`dispose` でチャネルをもう一度
  並べていたので、片方にだけ足したチャネルが残り得た。引数は `unknown` で受け、ハンドラが検査する。
  1 枚のボードを購読するペイン（クリップボード・NOW PLAYING・DOCKER・AI AGENT）の購読ページは
  `PageSubscribers` が持つ（追加で `whenPageGoes` を張り、0 になったかを知らせる）。隠れたキャプチャ
  ウィンドウ（audio/capture-window.ts）だけは、自分のウィンドウの寿命で自分のリスナーを外すので表にしない
- 診断用の `watching()`（e2e が「見えていないペインのために main が何もしていない」ことを確かめる）は、
  どのモジュールも並べた `string[]` を返し、何もしていなければ空（2026-10-03 に統一）。キーを持つものは
  その一覧（相場の銘柄、フィードの URL、天気の地点、ORBIT のセット、リポジトリの id）、1 つのボードを読む
  ものは読んでいる間だけ 1 語（`clipboard`・`session`・`engine`・`records`）

### 4.2 公開 API（preload）

以下は最初の設計時のスケッチで、考え方（名前空間ごとの型付き API、購読は解除関数を返す）を示す。
**現在の正確な形は `src/shared/api.ts`** にあり、名前空間は `system` / `background` / `pty` / `layout` /
`metrics` / `fs` / `weather` / `settings` / `themes` / `launcher` / `markets` / `feeds` / `clipboard` /
`nowPlaying` / `git` / `orbits` / `agents` / `ai` / `elec` / `quakes` / `notes` / `tasks` / `alarms` /
`updates` / `audio` / `plugins` / `web` の 27 個。

```ts
interface ElecdexApi {
  pty: {
    create(opts: PtyCreateOptions): Promise<PtySessionId>
    attach(id: PtySessionId, handlers: {
      onData(chunk: Uint8Array): void
      onExit(code: number, signal?: number): void
      onCwd(cwd: string): void
      onProcess(name: string): void
    }): () => void            // detach
    write(id: PtySessionId, data: string): void
    resize(id: PtySessionId, cols: number, rows: number): void
    dispose(id: PtySessionId): Promise<void>
    list(): Promise<PtySessionSummary[]>
  }
  metrics: {
    subscribe<K extends MetricSourceId>(
      id: K, handler: (sample: MetricSample<K>) => void
    ): () => void             // unsubscribe
    once<K extends MetricSourceId>(id: K): Promise<MetricSample<K>>
  }
  settings: {
    get(): Promise<Settings>
    patch(patch: DeepPartial<Settings>): Promise<Settings>
    onChange(handler: (s: Settings) => void): () => void
    revealFile(): Promise<void>
  }
  theme: {
    list(): Promise<ThemeSummary[]>
    get(id: string): Promise<ResolvedTheme>
    onChange(handler: (t: ResolvedTheme) => void): () => void
  }
  layout: {
    load(): Promise<LayoutTree>
    save(tree: LayoutTree): Promise<void>
    reset(): Promise<LayoutTree>
    saved: {                                   // 名前を付けて保存した配置（§5.6）
      list(): Promise<SavedLayoutSummary[]>    // 名前と id だけ。木は main に置いたまま
      save(name: string, tree: LayoutTree): Promise<SavedLayoutSummary[]>
      apply(id: string): Promise<LayoutTree | null>
      rename(id: string, name: string): Promise<SavedLayoutSummary[]>
      move(id: string, delta: number): Promise<SavedLayoutSummary[]>
      remove(id: string): Promise<SavedLayoutSummary[]>
      filePath(): Promise<string>              // 他の PC に持っていくファイル
    }
  }
  fs: {
    readDir(path: string): Promise<DirEntry[]>
    watch(path: string, handler: () => void): () => void
  }
  system: {
    info(): Promise<AppInfo>                 // version, platform, electron/node/chrome
    openExternal(url: string): Promise<void>
    revealInFolder(path: string): Promise<void>
    toggleDevTools(): void
    setFullscreen(on: boolean): void
  }
}
```

### 4.3 PTY データ経路（MessagePort）

`contextBridge` は `MessagePort` をそのまま渡せないため、**preload が port を保持して中継する**。

```
renderer: elecdex.pty.create()
  → preload: ipcRenderer.invoke("pty:create", opts)
    → main: node-pty spawn → MessageChannelMain 生成
           → webContents.postMessage("pty:port", { id }, [port2])
           → main は port1 に PTY 出力を post、port1 から受けた入力を pty.write
  → preload: ipcRenderer.on("pty:port", e => ports.set(id, e.ports[0]))
  → renderer: pty.attach(id, handlers) → preload が port.onmessage を handlers へ流す
```

- `ipcMain.on` の全メッセージが通る共有経路を避けられ、**1セッション1チャネルで独立**する
- ペイロードは `Uint8Array`（構造化クローン、文字列化コストなし）
- セッション破棄時に port を close し、preload 側の Map からも削除（リーク防止）

### 4.4 メトリクス購読

```
renderer widget (onMount)
  → elecdex.metrics.subscribe("cpu.load", cb)
    → main MetricsBroker: ソース "cpu.load" の購読者を +1
       └─ 購読者が 0→1 なら utilityProcess にポーリング開始を指示
    ← utilityProcess から sample 到着 → 購読中の webContents へ一括送信
renderer widget (onDestroy) → unsubscribe → 購読者 0 ならポーリング停止
```

ソース定義は main 側のレジストリ:

```ts
defineMetricSource({
  id: "cpu.load",
  intervalMs: 1000,
  collect: (si) => si.currentLoad(),
  // 同一 interval のソースは1ティックにまとめて収集する
})
```

**設計上の要点**: 原版でCPUを食っていたのは「各モジュールが独立に `setInterval` を回し、重い `si.processes()` / `si.mem()` を無調整で叩いていた」点。ここを購読ベースの単一スケジューラにすることが性能改善の本質。

---

## 5. 拡張性設計（ペイン / タブ / ウィジェット）

原版は `mod_column_left` / `main_shell` / `mod_column_right` / `filesystem` / `keyboard` という**5つの固定領域**にハードコードされていた。elecdex はこれを捨て、**レイアウトを永続化可能な木構造**として扱う。

### 5.1 レイアウトモデル

```ts
type LayoutNode = SplitNode | TabsNode | PaneNode

interface SplitNode {
  kind: "split"
  id: NodeId
  direction: "row" | "column"
  children: LayoutNode[]
  sizes: number[]          // 比率（合計1.0）
}

interface TabsNode {            // ペインをタブで束ねる
  kind: "tabs"
  id: NodeId
  children: PaneNode[]
  activeIndex: number
}

interface PaneNode {            // 葉 = ウィジェット1つ
  kind: "pane"
  id: NodeId
  widget: WidgetId             // "terminal" | "cpu" | "globe" | ...
  props?: JsonValue            // ウィジェット固有の設定（例: terminal の shell 上書き）
  state?: JsonValue            // 復元したい揮発状態（例: terminal の sessionId）
}

interface LayoutTree {
  version: number              // マイグレーション用
  root: LayoutNode
}
```

**ターミナルも監視ウィジェットも同じ `PaneNode`** として扱うのが要点。これにより以下が**後から機能追加なしで**成立する:

- ターミナルを左右/上下に分割（tmux 的ペイン）
- 監視ウィジェットを任意の位置・任意の個数で配置
- ワークスペースのプリセット保存/切替（§5.6 で実装済み）
- 1つの領域を複数タブで共有（`TabsNode`）

v1 の既定レイアウトは原版の見た目（左カラム=システム / 中央=端末 / 右カラム=ネットワーク）を `SplitNode` で再現する。v1 ではドラッグ分割UIを出さず、既定プリセット + `layout.json` 直編集で足りる（分割UIは Phase 2.5 以降）。v0.0.2 でタイトルのドラッグ＆ドロップによる移動を追加した（[decisions.md](decisions.md)）。タブの並び替えも同じジェスチャーで、`moveTabTo`（タブ列の「隙間」を指定して差し込む純粋関数）が担う。

### 5.2 ウィジェットレジストリ

```ts
// src/renderer/widgets/registry.ts（抜粋）
interface WidgetDefinition {
  id: string
  title: string
  description?: string                  // ピッカーに出す1行
  component: Component<WidgetProps>
  metrics?: readonly string[]           // 宣言した分だけ購読される
  keepWhileHidden?: readonly string[]   // 背面タブでも持ち続けるソース（チャートの履歴、1回きりのもの）
  chrome?: 'module' | 'shell'
  headless?: boolean                    // タイトル行なし（時計、システム）
  minSize?: { w: number; h: number }
  zoom?: 'full' | 'panel'               // 前面表示（§5.5）。省略 = 前面に出さない
  popup?: boolean                       // レイアウト外のポップアップに出せる（§5.13）。省略 = 出さない
  multiple?: boolean
  plugin?: boolean
  unlisted?: boolean                    // ピッカーに出さないが、レイアウトが名指しすれば解決する
}
```

内蔵ウィジェットは `widgets/builtins.ts` に並ぶ（2026-09 時点で25個: terminal / clock / sysinfo / cpu /
memory / disk / toplist / netstat / connections / throughput / filesystem / weather / globe / launcher /
markets / rss / aichat / quakes / calendar / spectrum / mixer / calc / notes / todo / timer）。Web ペインは
`WEB_PRESETS` の各プリセットが `web.<id>` として同じレジストリに載る（§5.4）。

- `PaneHost.svelte` が `widget: WidgetId` からレジストリを引いてコンポーネントを解決する
- ウィジェットは **自分が欲しいメトリクスを宣言するだけ**。購読/解除は `PaneHost` が生存期間に合わせて自動処理する
- プラグイン: レジストリは「ビルトイン + 動的登録」の2層。動的側には全プラグイン共通の `PluginPane.svelte` が `plugin:<id>` で載り、プラグイン本体は renderer の blob Worker で動く（仕様は [plugins.md](plugins.md)）

### 5.3 ターミナルセッションの寿命
ペインの寿命と PTY セッションの寿命を**分離**する。

- PTY は main の `PtyManager` が `sessionId` で保持する
- ペインの移動やタブの付け替えは再マウントになるが、セッションは生きたままで、新しいコンポーネントが `attach` し直す。どのペインからも指されなくなったセッションは、レイアウトが落ち着いてから4秒後にまとめて終了する（`Workspace.svelte` の `REAP_DELAY_MS`）。ペインを閉じる・保存レイアウトを切り替えることはシェルを終わらせることなので、切り替えはシェルがある間は先に尋ねる（§5.6）
- ウィンドウ再読み込み（開発時のHMR含む）でもセッションは維持され、`attach` で再結線する

### 5.4 Web ペイン（ブラウザ / YouTube / X）

Web ページをペインに表示する。**汎用の Web ウィジェット 1 つ + プリセット**の構成で、YouTube や X は専用ウィジェットではなくプリセット（データ）として足す。

**方式**: main が所有する `WebContentsView` をペインの矩形に重ねる。
- `<iframe>` は使わない。X も YouTube も `X-Frame-Options` / `frame-ancestors` で埋め込みを拒否し（YouTube は embed のみ例外）、workspace の CSP（`connect-src 'self'`）を緩めることにもなるため
- `<webview>` タグも使わない。Electron 自身が推奨しておらず、sandbox 化した workspace の renderer で `webviewTag` を有効にする必要があるため
- `WebContentsView` は workspace とは別の webContents なので、workspace の CSP・sandbox・権限はそのまま。renderer はペインの表示矩形を送るだけで、ネットワークに触れない

**プリセット**（`src/shared/web.ts` の `WEB_PRESETS`）: 1 件が 1 つのウィジェット `web.<id>` としてレジストリに登録され、ピッカーに並ぶ。プリセットを増やすときは、この配列に 1 件足すだけでよい（renderer・main・テストはこの配列から組み立てる）。

| フィールド | 意味 |
|---|---|
| `id` / `title` / `description` | ウィジェット id（`web.<id>`）、ペインのタイトル、ピッカーの説明 |
| `home` | 最初に開く URL。`null` は汎用ブラウザ（アドレスバーを出し、空のページから始める） |
| `hosts` | ペイン内で開くホスト（サブドメインを含む）。`null` は http/https ならどこでも。それ以外へのトップレベル遷移・リダイレクト・新しいウィンドウは既定のブラウザで開く。ログインの経路（accounts.google.com など）もここに含める |
| `userAgent` | そのプリセットだけが名乗る User-Agent（省略時はセッションのもの）。サイトがテレビ向けの画面を UA で出し分けるため。ビューを作った直後、読み込みの前に `webContents.setUserAgent` で設定する |
| `unlisted` | ペインの追加ピッカーに出さない（ウィジェット定義の `unlisted` になる）。保存されたレイアウトやほかのペインからのリンクでは今までどおり開く |

初期のプリセットは `browser`（汎用）・`youtube`・`youtubetv`・`x` の 4 つ。ウィジェット id は `web.browser` / `web.youtube` / `web.youtubetv` / `web.x`。どれも複数置ける。

`youtube` はピッカーに出さない（`unlisted`。ユーザー判断 2026-09-19）。ログインできないためで、YouTube を足すときはテレビ版を選ぶ。保存されたレイアウトの `web.youtube` はそのまま開き、ほかのペインから YouTube のリンクを開いたときの行き先としても残る。

`youtubetv` は YouTube のテレビ向け画面（`youtube.com/tv`）をテレビの User-Agent で開く。Google は知らないブラウザ（とりわけ組み込みのもの）からのログインを拒否するため、`youtube` ペインはログインできない（「このブラウザまたはアプリは安全でない可能性があります」。ユーザー報告 2026-09-18）。テレビ向け画面は Google 自身がテレビや機器のために用意した方式で、画面の QR コードと `yt.be/activate` のコードをスマートフォンで入力してログインする。判定を回避するのではなく、Google が認めている経路を使う（実測 2026-09-18: 上記の UA で QR とコードの画面まで到達）。UA の文字列から Electron の印を外していても、Client Hints のブランドは `Chromium` のままで `Google Chrome` にはならない（実測）。ここを偽装して判定を通すことはしない。

**セッション**: すべての Web ペインで 1 つの永続パーティション `persist:web` を共有する。YouTube プリセットでログインすれば、汎用ブラウザで開いた youtube.com もログイン済みになる。
- 守るべき境界は「workspace ⇔ Web ペイン」であり、ここは分けたまま。Web ペインどうしの分離は Chromium の Cookie のドメイン分離とサイト分離に任せる
- 代わりに、同じサイトの複数アカウントを並べては使えない（必要になれば「ペインごとの別セッション」を後から足す）
- 設定に「Web ペインのサイトデータを削除」（ログアウト）を置く

**ページに与えるもの**（パーティションの準備は 1 回だけ）:
- preload なし。`sandbox` / `contextIsolation` 有効、`nodeIntegration` 無効、スペルチェック無効（辞書のダウンロードを起こさないため）
- 権限は `clipboard-sanitized-write`（リンクのコピー）と `fullscreen` だけ許可し、ほかは拒否する（位置情報・カメラ・マイク・通知など）
- ページが全画面を要求したとき（動画の全画面ボタン）、Electron はウィンドウを全画面にし、終われば元に戻す（アプリがもともと全画面なら全画面のまま。実測）。ページの描画はビューの大きさのままなので、その間 main はビューをウィンドウ全体に広げて最前面に置き、ウィンドウのリサイズにも合わせる。終わればペインの矩形に戻す。その間に届いたペインの矩形は覚えておき、戻すときに使う
- **ウィンドウを覆えるのは見えているビューだけ**。ビューを隠すとき（ダイアログ・背面タブ・ペインの移動・ページの再読み込み）は、先にページの全画面を解く（`document.exitFullscreen()`）。見えないビューを隠している間に全画面を要求されたときも同じで、広げない。解除は 1 回頼むのではなく、ページが出るまで頼む: 要求が認められた時点では文書はまだ全画面に入っておらず、X11 ではその間に送った `exitFullscreen` が拒否される（[decisions.md](decisions.md)）。隠すときキーボードは workspace に戻るので、全画面のまま表示に戻すとワークスペース全体がページに覆われ、ポインターはページにしか届かず、全画面から出る Escape はページに届かない（ショートカット以外に出口がない。[decisions.md](decisions.md)）
- ダウンロードはすべて取り消す
- User-Agent から `Electron/…` と `elecdex/…` を除く（ログインページが組み込みブラウザを拒否するため。プラグインのサインインと同じ関数）
- 遷移は http/https（と `about:blank`）だけ。`file:` / `javascript:` / `chrome:` などは拒否する。汎用ブラウザのアドレスバーの入力も main が同じ規則で検証する
- 新しいウィンドウ: `hosts` 外は既定のブラウザで開く。`hosts` 内のリンク（`target=_blank`）は同じペインで開く。`hosts` 内の `window.open`（機能指定つき＝ログイン用のポップアップ）だけは、同じパーティションの子ウィンドウとして開く。子ウィンドウは helper として `appWindows()` から外す
- 右クリックメニュー: 戻る・進む・再読み込み、切り取り・貼り付け（入力欄のみ）・コピー・すべて選択、リンクのコピー、リンクを既定のブラウザで開く

**寿命**: ビューは main がペイン id ごとに保持する（シェルのセッションと同じ考え方）。
- ペインの移動・タブの付け替えで再マウントしても再読み込みしない
- コンポーネントはマウントごとにトークン（クレーム）を作り、open / show / hide / close に付ける。main は最後に open したクレーム以外からの show / hide / close を無視する。移動中は新しいコンポーネントが古い方のアンマウントより先にマウントされることがあり、古い方の最後の hide が新しい方の表示を消さないようにするため
- 開く処理はマウントにつき 1 回（props を追跡しない）。URL をペイン状態に保存するとペインのノードが新しくなり、props を読んだエフェクトは再実行されて、表示済みのビューを隠してしまうため（コンポーネントテストで固定）
- ペインを閉じたら（アンマウント時にツリーにない）すぐ破棄する。workspace の孤児回収（シェルと同じタイマー）が、レイアウトにないペインのビューも破棄する
- workspace のページが再読み込みされたらビューを隠し、新しいページが同じペイン id で開き直す。ウィンドウが閉じたら破棄する
- 最後に開いた URL はペイン状態（`state.url`）に保存し、再起動後に復元する。復元時も main が `hosts` で検証し、外れていれば `home` を開く

**表示と重なり**: `WebContentsView` は DOM より手前に描かれるネイティブ層なので、DOM の要素をその上に重ねられない。
- 次のときはビューを隠す: 背面タブ（矩形が 0）、ダイアログ（ピッカー・設定・場所選び）、ペインのドラッグ中、起動演出の間、ペインの電源オン／オフ／伸長の CRT 演出の間、DOM のオーバーレイ（地震・津波の通知、更新の通知など、`coverWeb` で登録した要素）と矩形が重なる間
- 背面タブ以外で隠すときは、main がビューの `capturePage`（ウィンドウの capturePage には子ビューが写らない）を撮って JPEG の data URL で返し、renderer が同じ位置に表示する。ダイアログの下や CRT 演出の中でも、ページが消えずに見える
- 隠したビュー（`setVisible(false)`）でもページは `visibilityState: 'visible'` のまま（Electron 44 で実測）。そのおかげで背面タブの YouTube は鳴り続けるが、描画や動画のデコードも続く。長く置いた背面タブの負荷が残るのは既知の制約で、e2e がこの挙動を固定している（変われば音が止まるため）
- ステータスバーと全画面時の右上のウィンドウ操作はポインター位置で出るが、ポインターが Web ペインの上にある間はページにイベントが届くため出ない（既知の制約。ショートカットか、別のペインの上で使う）
- renderer はペイン本体の矩形を ResizeObserver・レイアウトの木の変更・ウィンドウのリサイズ・表示や CRT 演出の変化のたびに測り直し、変わったときだけ main に送る。常時のポーリングはしない
- `coverWeb` で登録した要素は、リサイズと `transitionend` / `animationend` のたびに測り直す。スライドインするステータスバーは止まった位置で判定される

**テーマのフィルタ**: ランチャーのアイコンと同じく、ページをテーマのアクセント色の単色で描く。
- `insertCSS` でページの `html` に SVG の `feColorMatrix`（data URL）を `filter` として入れる。行列は「輝度 × アクセント色」で、白がアクセント色、黒が黒になる。ナビゲーションのたびに（`dom-ready`）入れ直し、テーマが変わったら差し替える
- テーマの `effects.iconTint` が false のテーマ（Business の 2 つ）では入れない。設定 `web.tint`（既定 off。色を付けたサイトは周りの HUD より読みにくく見にくいため、ユーザー判断 2026-09-18）が全 Web ペインの既定で、ペインごとにアドレスの右のトグル（ペイン状態 `tint`）で上書きできる。ペインが自分で決めた後は設定を変えてもそのペインは変わらない。main には外観（`accent` と設定の `tint`）とペインごとの `{ t: 'tint', on }` コマンドが届き、実際の色は `paneTint`（shared/web.ts）が決める
- 隠れているビュー（ダイアログの下など）の色が変わったときは、main が撮り直して新しい画像を renderer に送る（`web:snapshot`）。そうしないと、設定やトグルを変えてもダイアログを閉じるまで古い色の静止画が見えたままになる（ユーザー報告 2026-09-18）
- 負荷（実測、i5-1335U）: ペイン全面を 60 fps で描き換えるページで、フィルタあり GPU 10.6% + レンダラー 5.6%、なし 11.5% + 6.3%（1 コア比、8 秒平均）。差は測定のばらつきの範囲で、フィルタはコンポジタで処理される
- テーマの変更はビューごとに直列に処理する（insertCSS / removeInsertedCSS は非同期のため、続けて変えても最後の 1 つだけが残る）
- ページには `prefers-color-scheme` をテーマの `mode` で伝える（`nativeTheme.themeSource`。アプリ全体の設定で、ネイティブのメニューやダイアログも同じ配色になる。アプリのテーマは 1 つなので、そこは意図どおり）。SF テーマではダークになり、フィルタ後は「暗い地にアクセント色の文字」になる。Business (Light) ではライト
- それに加えて、ページ自身の既定色を合わせるために `:root { color-scheme: dark | light }` を `insertCSS` する（フィルタと同じ直列キュー・同じ `dom-ready` の入れ直し）。`prefers-color-scheme` だけでは UA の既定文字色は変わらないため、**背景も配色も宣言していないページ**がテーマの黒い下地の上で黒い文字のままになり、まったく読めなかった（指摘 2026-09-18、実測で輝度差 0）。`!important` は付けないので、自分で `color-scheme` を宣言しているサイトの意思はそのまま
- ビューの背景色はテーマの `surfaces.s0`。読み込み前やフィルタを入れる前の一瞬の白を抑える。これはドキュメントの下に恒久的に敷かれる色なので、上の `color-scheme` の注入と必ず対で入れる

**ショートカット**: ビューにフォーカスがあるとキー入力は workspace に届かない。
- main がビューの `before-input-event` で、keybindings.ts の実効キーマップ（settings の上書きを含む）に一致するキーだけを取り、アクション id を renderer に送る。Workspace は自分の keydown と同じ処理でそれを実行する
- それ以外のキーはページに渡す（コードは必ず Ctrl/Alt かファンクションキーを含むので、文字入力は奪わない）
- ページ内でマウスを押したとき（`input-event` の mouseDown / touchStart）と `focus` イベントで、main が renderer に伝え、そのペインにフォーカスを移す。WebContentsView は `focus` を出さないことがある（Windows、Electron 44 で確認）
- 転送したアクションの後、フォーカスが Web ペインにない（またはダイアログが開いた）ときは、renderer が `focusWorkspace` で main に workspace の webContents へキーボードを戻させる。アクションが DOM 上で移したフォーカス（シェルなど）が、そのまま効く
- 逆向き: ショートカットでフォーカスが Web ペインに移ったときだけ、ウィジェットがページにキーボードを渡す。ウィンドウ内のどこかを押した直後（500 ms）は渡さない。押したのがタイトルならドラッグ、アドレスバーなら入力が始まるため

**テスト**: 外部には接続しない。`ELECDEX_WEB_HOMES`（`youtube=http://127.0.0.1:port/yt/,x=…`）でプリセットの `home` を差し替えると、そのプリセットの `hosts` は差し替え先のホストだけになる。tests/e2e/support.ts は既定で全プリセットを閉じたポートに向ける。
- 単体: プリセットと遷移の判定（shared/web.ts）、main の `WebViews`（偽の Electron で、クレーム・遷移ポリシー・ポップアップ・フィルタ・ショートカット・破棄）
- コンポーネント: 表示・非表示・スナップショット・再マウント・フォーカス。IPC のモックは引数を structuredClone し、`$state` の Proxy をそのまま送る不具合を検出する
- e2e: 実際のビューの位置と表示、ダイアログ・背面タブ・リロード・再起動・移動、遷移の制限、権限、フィルタ、ショートカット、アドレスバー、サインアウト
- e2e の注意 1: Playwright は操作するすべてのページに `prefers-color-scheme: light` をエミュレートするため、ページに伝わる配色は main の `nativeTheme.themeSource` で確認する
- e2e の注意 2: ドラッグ中にビューを隠すと Chromium が合成のマウス移動を出し、そのボタン状態は OS のもの。Playwright（CDP）で押したボタンをブラウザ側は知らないため「離された」と扱われ、ドラッグが終わる（実際のマウスでは起きない）。ドラッグ中に隠すことはコンポーネントテストで確認し、e2e の移動は Web ペインを背面タブにしたまま行う

**後続（保留）**: Teams などの音声・ビデオ会議はこの土台に載せられるが、カメラ・マイク・画面共有の権限、通話中の非表示の扱い、組織の条件付きアクセスの確認が要る。ユーザーの指示まで着手しない（2026-09-17）。

---

### 5.5 ペインを前面に出す（ズーム）

一時的に 1 枚のペインをワークスペースのほぼ全面（9 割・中央）に出し、ほかのペインの前に置く。Gmail の作成ウィンドウの「拡大」に当たる操作で、レイアウトの**変更ではない**。

**方式**: ツリーは一切触らず、そのペインの要素だけを `position: fixed` でワークスペースの上に留める（`layout/pane-zoom.ts` が幾何、`stores/layout.svelte.ts` が状態）。
- 再マウントしない。ツリーを書き換えて 1 枚にする案も、別のレイヤーへ移す案も、ウィジェットの再マウントを起こす（シェルは再接続、Web ペインはビューを開き直し、WebGL は context を失う。§5.3・「Remounts happen」）
- ペインが抜けても**スロット（`SplitHost` の `.slot`）は flex の比率でそのまま**なので、後ろのペインは 1 ピクセルも動かない＝ほかのターミナルには一切リサイズが飛ばない
- タブの中のペインはグループ（`TabsHost`）ごと前に出す。タブストリップも一緒に来るので、前面のままタブを切り替えられる。切り替えたときはズームが新しいタブに移る（`followZoom`）
- 状態は保存しない。ズームは「今この 1 枚を見る」ための状態で、レイアウトとして復元すると、ユーザーが忘れたまま残った状態が残りのワークスペースを隠すため

**演出**（`styles/crt.css` の `crt-zoom`）: ペインは**最初のフレームから最終サイズ**に置かれ、そこから元の位置・大きさへの transform（FLIP）で飛んでくる。
- サイズを毎フレーム変える演出にはしない。ターミナルがその過渡サイズをすべてシェルに送り、ConPTY がその都度バッファを折り返す（閉じるときに `crt-extend` のクリップで隠すのと同じ理由。§5.1）。フィットは行きと帰りで 1 回ずつ
- 戻すときも、留めたまま元の位置へ縮む transform を再生し（同じキーフレームの `reverse` + `forwards`）、終わってから留めを外す。留めを外してから縮めると、負のインセットになって表現できない
- 飛行の起点・終点は `frameOfPane` が測る。留まっているかどうかは**実際に描かれている状態**（`position: fixed`）で判定する。ストアの状態はページより 1 フレーム先を行っており、戻る飛行の途中でもう一度ズームすると、飛行が離れつつある箱を測ってしまうため
- 背後には暗幕（`zoom-backdrop`）。ダイアログと同じ `backdropShade` で出入りする。押すと元に戻る
- **枠**（`layout/ZoomFrame.svelte`、`styles/frames.css` の `.zoom-frame`、2026-09-25 利用者の依頼）: 前面のペインとタブグループを、シェル枠の語彙（右上と左下を切り落とした縁取り）を一回り大きくした枠で囲み、四角い 2 隅に照準のようなブラケット、上下の辺の中央に目盛り、下の辺に `ESC · RETURN` を置く。ペインの箱の**外側**（0.7rem）に、ペインの後ろ（`z-index: -1`）で描く。内側に描くと、ズームがウィジェットに与えた大きさを枠が削るため。留めた要素の子なので、飛行の transform に一緒に乗り、自分の描画コストはない（何も動かない）。縁は通常のシェル枠（50%）より明るい 75%
- 動きを減らす設定では飛ばず、そのまま置かれ、そのまま戻る（`zoomMotion.animates()`）
- Web ペインのビューはネイティブ層で DOM より手前に描かれるため、**留まっているペイン以外の Web ペインはビューを隠してスナップショットに差し替える**（`pinnedPaneId` で判定する。矩形の重なりでは、前面のペイン自身が自分のカバー矩形の内側に入って自分を隠してしまう。`zoomedPaneId` では、戻る飛行中や電源オフ中＝暗幕がまだ消えていない間にビューが復帰してしまう）。前面に出た Web ペイン自身は、ペイン本体の `ResizeObserver` がそのまま新しい矩形を main に送るので、追加の IPC はない

**どのペインを出せるか**: ウィジェットの登録（`widgets/registry.ts` の `zoom`）が決める。**既定は「出さない」**で、指定のないウィジェットには ⤢ ボタンも出ず、ショートカットも効かない（`layout.zoomModeFor` が唯一の判定で、ボタンもキーもここを通る）。
- `'full'`: ワークスペースの 9 割。与えられた場所を埋めるもの — シェル、Web ページ、地球儀、スペクトラム、CPU / メモリ / トラフィックのチャート、相場、RSS、AI チャット、地震、ランチャー、ファイル、カレンダー、天気、メモ、タスク、時計
- `'panel'`: 中央に最大 880×560（`PANEL_BOX`、ウィンドウが小さいときは 9 割の方）。固定の大きさの方が読みやすいもの — 電卓、タイマー、ミキサー、ディスク、プロセス一覧（収集側が 12 件で頭打ちのため、全面にしても行は増えない）
- 指定なし: システム情報とネットワーク状態。数行の数値しかなく、拡大しても余白が広がるだけ（ユーザー指摘 2026-09-20）
- プラグインも同じ語彙を `descriptor.zoom` で宣言する（docs/plugins.md）。同梱のポモドーロは `'panel'`
- タブグループはアクティブなタブの指定に従う。出せないタブに切り替えたときはグループを元に戻す

**サイズに応じた中身**: 前面表示は入れ物を変えるだけで、中身をどう使うかは各ウィジェットの責任。カレンダーは幅 620px・高さ 320px 以上で前後 1 か月を並べる（`lib/calendar.ts` の `monthsShown`、純粋関数で単体テスト）。**ペインのリサイズは `ResizeObserver` のエントリの矩形で測る**こと。留めた直後のコールバックの中で `getBoundingClientRect` を呼び直すと、留める前のレイアウトの大きさが返ってきて（Electron 44 / Chromium で実測）、前面に出したのに 1 か月のままになる（e2e で固定）。

**手放すとき**: ツリーが変わる操作（分割・タブ追加・移動・リセット・ほかのペインを閉じる）は `settle()` が飛ばずに解除する。ドラッグの開始でも戻す（前面のペインと暗幕がすべてのドロップ先を覆っていて、どこにも落とせないため）。前面のペイン自身を閉じたときだけは留めたまま電源オフさせ、ツリーから消えた時点で留めを外す（先に戻してから消すと 1 フレーム跳ねる）。ほかのペインにフォーカスが移ったときも戻す。ウィンドウのリサイズでは留め直すだけ（`repin`）。

**操作**: `Ctrl+Shift+Z`（keybindings.ts の `pane.zoom`。Web ペインのページからも main 経由で届く）、ペイン右上の ⤢ ボタン（× の隣。モジュール枠・単独のシェル・タブグループのどれも同じ角に持つ、`layout/PaneCorner.svelte`）、暗幕のクリック、Escape。Escape はコードとして表現できない（Ctrl/Alt かファンクションキーが要る）ので Workspace が直接見る。ダイアログが開いている間はダイアログのもの。

**テスト**: 単体（`zoomBox` / `flipFrom` / `pinStyle`）、コンポーネント（留め・飛行・解除の条件すべて、`tests/component/pane-zoom.test.ts`）、e2e（実寸で 9 割、枠がペインの外側を囲み戻すと消えること、後ろのペインが動かないこと、最初のフレームで最終サイズであること、シェルの履歴が壊れないこと、タブグループ、Web ペインのビューの追従、動きを減らす設定）。

### 5.6 保存レイアウト（名前を付けた配置）

`LayoutTree` がデータなので、**配置に名前を付けて持っておく**のは木をもう1本持つだけで済む
（`src/shared/layouts.ts`、`layouts.json`、最大12件）。

**作業に追従する**。ファイルは名前付きの配置の一覧と `active`（いま作業中の id）を持ち、main は
`layout.save` のたびにその木を active のエントリにも書き戻す。スナップショット方式（明示的に
更新するまで変わらない）が当初の実装だったが、切り替えて戻ると操作が消えるのは誤りだった
（ユーザー報告 2026-09-20）。`active` は適用・保存で立ち、リセットと削除で外れる。

**2つのファイルの役割を分ける**。`layout.json` は生きている配置で、この実行にだけ意味のある
状態（ターミナルの `sessionId`）を含み、手編集の対象でもある。`layouts.json` は名前付きの写しで、
`portableTree` がその状態を落としてから書く。これで (1) シェルを作るたびの書き込みが消え
（同じ木なら書かない判定が効く）、(2) 差分が安定し、(3) **ファイルをそのまま他の PC に持って
いける**。同じ木を2つのファイルに書くオーバーヘッドへの答えは「同じ木を書かない」こと。

**壊れたときに全部を失わない**。エントリは1件ずつ検証し、通らないものだけ落とす。配列ごと
弾くと、1件の破損で無事な11件を失う。上限超過も同じく先頭から採る。layouts.json への書き込み
失敗は握って log に出し、生きている layout.json の保存は道連れにしない。

**番号キー**。先頭 `KEYED_LAYOUTS`（=9）件が Ctrl+Shift+1〜9 に対応する。対応はリストの並び順
そのものなので、ダイアログで上下に動かすことが「キーに載せる」操作になる。ステータスバー左の
番号ボタンも同じ並びで、以前そこにあったショートカット一覧は廃止した（一覧は一度読めば終わり、
ボタンは何度も押す）。

**切り替えの演出**（`layout/layout-switch.ts`）: 画面全体を同時に消灯（`layout.leaving`。タブ
グループはヘッダーとタブ列ごと1枚の絵として消える）→ 新しい配置を起動時と同じ順序で点灯
（`layout.switchDelays`。起動時の約1/3の速さ）。切り替えが重なったときはトークンで後勝ち。
モーション低減時と起動シーケンス中は演出なしで差し替える。

**切り替え前の確認**: 適用は置き換えなので、置き換えられるペインのシェルは終了する。シェルが
開いているときだけ確認ダイアログを出す（設定 `layout.confirmSwitch`、既定オン。ダイアログの
リンクで切り、設定 general で戻せる）。確認は切り替えが待っている Promise なので、ほかの
ダイアログが上に開くときは必ず「いいえ」で解決する（解決しないと、求めたレイアウトが永久に
適用されない）。

**保存の取りこぼしを作らない**: 切り替えとリセットは保留中の保存を捨てず書き出し、**送信済みで
返事待ちの保存も待つ**（main は届いた時点の active に書き戻すため、飛行中の保存は適用直後の
レイアウトに着いてしまう）。ページが閉じるときは `beforeunload` から同じ flush が走るので、
変更直後にキーボードで終了しても両方のファイルに残る。

**テスト**: 単体（`shared/layouts.ts` の純関数と破損許容）、コンポーネント（演出の時間計算、
飛行中の保存、確認の解決）、e2e（改名・並び替え・番号キー・ステータスバー・確認と設定の往復・
終了時の保存・破損した layouts.json・演出とモーション低減）。

**プリセット**（`shared/layout-presets.ts`、2026-09-24）: 用途別の配置を組み込みで持つ。standard（既定
レイアウトそのもの）/ network（地球儀・connections を 3:2・シェル）/ earth（ORBIT・地球儀・地震・天気・シェル）/
dev（AI AGENT、Docker とシェルのタブ、clipboard・timer・シェルのタブを縦に、右に GIT と AI チャットのタブ。前面は見えている間だけ読む Docker と clipboard と、差分に全高が要る GIT。§5.17。2026-10-01 に利用者の指定で組み直した）/ media（YouTube (TV)、その下に now playing・spectrum・mixer、X と RSS のタブ。§5.15）/ desk（3 列: notes の下に timer と calculator、tasks の下に clipboard、calendar の下に utility。シェルなし。clipboard は見えている間だけ読むのでタブに重ねない。§5.14。2026-09-27 に utility を入れるため 2 列から組み直した。§5.16）/ ai（AI チャット 2 つを上下に、右の広い列に ELEC system。§5.7・§5.8。2026-10-01 追加）の 7 つ。どれも既定の左カラム（システム列）を同じ幅・同じ高さで
左端に持つので、切り替えると計器盤はそのままで右の舞台だけが替わって見える。名前は ORBIT ペインと重ならない
ように earth にした（利用者の判断）。

- **プリセットは雛形で、2 種類目のレイアウトではない**。選ぶと、そのプリセットから作った保存レイアウトを
  一覧に足して切り替える（`withPresetLayout`）。以後は普通の保存レイアウトで、番号キーを持ち、作業に追従
  する。エントリは作った元の `preset` だけを覚えていて、それで同じプリセットを二重に足さない（もう一度選ぶと
  そのレイアウトへ行く）ことと、**↺ でプリセットに戻す**（`withPresetRestored`。名前と位置は保つ。作業中の
  ものなら、ページが保留中の保存を書き出してから戻し、ワークスペースも一緒に戻す）ことができる。利用者が同じ
  名前のレイアウトを持っていれば `desk 2` のように番号を付ける。
- **初回起動だけ 7 つを 1〜7 に登録する**（`seededLayouts`。active は standard）。初回とは layout.json も
  layouts.json も無いこと。既存の利用者の一覧と番号はその人のものなので、自動では足さない（利用者の判断）。
  棚から足す。e2e は新しいプロファイルから始まるので、support.ts が `ELECDEX_SEED_LAYOUTS=0` で止め、
  プリセットの spec だけが戻す。
- **LAYOUTS ダイアログ**: 一覧の下にプリセットの棚を置く（新しいダイアログは作らない）。カードは「on 3」
  （そのキーにある）/「kept」（キーの外にある）/「in this one」/「+ add」を出す。一覧の行と棚のカードには
  配置の縮図（`LayoutThumb.svelte`）を出す。木は main に置いたままなので、main が `layoutShape`
  （`shared/layout-shape.ts`、純関数）で矩形に落として要約に付け、プリセットの縮図はページが自分で計算する。
  左カラムは薄く描き、違いが目に入るようにした。キーは Tab で棚へ、← → で移動、↑ で一覧へ戻る。
- **キー**: プリセットごとに `layout.preset.<id>` の操作があり、既定は Ctrl+Shift+F1〜F7（棚の順）。
  場所ではなく id に結び付けるので、プリセットが増えても利用者が変えたキーは同じプリセットに残る。
  カードと同じく、作ったレイアウトがあればそこへ、なければ足して切り替える。素の F1〜F6 は tasks ペインの
  F2（編集）とシェル内の TUI（htop・mc など）の F キーを横取りするので、ほかのショートカットに合わせて
  Ctrl+Shift を付けた（利用者の判断）。カードの下に今のキーを出す。
- **棚は横にスクロールする**: プリセットが増えてもダイアログは高くならない。1 行に並べ、ホイールの縦の回転を
  横のスクロールにする（`layout/shelf-scroll.ts` の純関数。端と、収まっている棚では奪わない）。← → で移った
  カードは見える位置まで送られる。ダイアログの幅は 7 枚が 1 行に収まる 54rem（文字の大きさは窓の高さに従うので、幅が約 58rem を超える窓なら 1920x1080 でも 1366x768 でも収まる）。
- **選んだときの反応**: 行でもカードでも、選んだ項目がランチャーのタイルと同じアクセントの点滅
  （100ms × 3）をしてから、ダイアログが消灯して切り替えが始まる。点滅中の 2 回目の選択は受けない。
  モーション低減では点滅せずすぐ切り替える。
- **疎結合**: 判断はすべて `shared/layout-presets.ts` と `shared/layout-shape.ts` の純関数（単体テスト）。
  ページ側は `layout/presets.ts` だけがプリセットを知っていて、シェルの確認（`layout.mayReplace`）・保存の
  書き出し・切り替えの演出はレイアウトストアの既存の道を通る。ストアはプリセットを知らない。
- **テスト**: 単体で、全プリセットのウィジェットが実在すること、複数置けないものが 1 つだけなこと、
  正規化で変わらないこと、左カラムの形が既定と同じこと、1920x1080 で全ペイン・1366x768 で舞台のペインが
  `minSize` 以上になること（builtins.ts をテキストで読む。タブの後ろのペインも 1366x768 で確かめる）。e2e で初回の登録と 2 回目の起動、棚からの追加と
  切り替え（キーボード含む）、作業への追従と ↺、シェルの確認で「いいえ」、点滅とモーション低減。

### 5.7 AI チャットペイン

ローカルの LLM（Ollama / LM Studio / llama.cpp / vLLM）か、API キーを持っているサービス（Anthropic /
OpenAI / Gemini / OpenRouter）と話すペイン（`widgets/aichat`、`shared/ai.ts`、`main/ai/`、`main/ipc/ai.ts`）。
既定レイアウトには入れず、ペイン追加から置く（複数可、`zoom: 'full'`）。

**プロバイダは「アドレス + 方言」**。2026 年時点でローカルサーバーのほぼ全部と多くのクラウドが OpenAI の
`chat/completions` を話すので、方言は 2 つだけにした: `openai`（互換 API。素の fetch + SSE。依存なし）と
`anthropic`（Messages API。公式 SDK）。新しいサービスはコードではなく `AI_PRESETS` の 1 行で足す。
プロバイダは設定 `ai.providers`（id・表示名・種別・アドレス・既定モデル）、システムプロンプトは `ai.systemPrompt`。
アドレスはスキーマでは弾かず、使うときに `aiBaseUrl` で正規化する（http/https のみ、認証情報・クエリ・
フラグメントなし）。手編集の 1 行の誤りで settings.json 全体が既定に落ちるのを避けるため。

**キーはページに戻らない**。ページは `ai.setKey(providerId, key)` で main に渡すだけで、以後わかるのは
「保持しているか・どこにか」（`'stored' | 'session' | null`）だけ。main は Electron の `safeStorage`
（DPAPI / Keychain / デスクトップの keyring）で暗号化して `ai-keys.json` に置く。settings.json に置かないのは、
あのファイルが他の PC に持ち運ばれ、不具合報告に貼られるものだから。暗号化できない環境（keyring のない
Linux。`basic_text` バックエンドは固定パスワードなので「できない」扱い）では書かずにメモリに持ち、
終了まで有効であることを画面に出す。保持の有無を答えるだけなら復号しない（macOS では最初の復号が
Keychain の項目を作るため、チャットを使わない人に Keychain を触らせない）。平文 http の相手にキーを
送るのは、この PC かローカルネットワーク（loopback / RFC1918 / `.local`）に限る（`keyMayTravel`）。
リダイレクトは追わない（`redirect: 'error'`。`x-api-key` のような独自ヘッダは、fetch が別オリジンへの
リダイレクトでも落とさない）。キーなしの anthropic プロバイダでは SDK の通常の解決（`ANTHROPIC_API_KEY`、
`ant auth login` のプロファイル）に任せる。

**会話は main のもの**（メモと同じ理由）。`chats/<uuid>.json` に 1 会話 1 ファイル — 回答は数十 KB、
長い会話は MB になるので、1 つ答え終わるたびに全会話を書き直さない。ペイン状態は `chat` / `provider` /
`model` の 3 つだけ。**生成中の回答も main が持つ**（`AiChatService`、Electron 非依存で依存はすべて注入）:
ペインの移動は再マウントで、ページの再読み込みもあり得るが、どちらでも回答は途切れず、次に購読した
ページに「会話 + 書きかけ」のスナップショットが渡る。質問は問い合わせの前にディスクに書く（落ちても
失うのは回答だけ）。停止・失敗・終了時は書けたところまでを残し、理由（`stopped` / `length` / `refusal` /
`error`）をメッセージに持たせる。終了時（`will-quit`）の保存は同期で行う。

**配信はスナップショット + 差分**。断片は 100ms ごとにまとめて送る（速いローカルモデルは毎秒数百断片を
出すが、画面は 10 fps）。差分は「どこに足すか」（`textAt`）を持ち、合わなければページは
`applyChatEvent` が `'resync'` を返して取り直す — 欠けた文章を黙って表示しない。購読は preload と main で
参照カウントし、`did-start-navigation` と destroy で落とす（他の購読と同じ）。**誰も見ていない会話の
生成は 3 秒後に止める**（移動による再マウントはその内側で戻ってくる）。ペインを閉じたのに課金だけ続く、
を避けるため。

**通信するのは利用者が頼んだときだけ**: メッセージの送信、設定の「test」、ペインのモデル欄を開いたとき
（`/models`）。レイアウトに置いてあるだけのチャットペインはどこにも問い合わせない。

**推論（reasoning）の表示**: 方言・サーバーごとに出方が違うので main でそろえる。Anthropic は
`thinking: {type: 'adaptive', display: 'summarized'}`（既定の `omitted` だと長い無音になる）。OpenAI 互換は
`delta.reasoning_content`（DeepSeek / llama.cpp / vLLM）と `delta.reasoning`（Ollama / OpenRouter）、さらに
本文に `<think>…</think>` で書くローカルモデルのために `ThinkSplitter`（チャンク境界でタグが割れても 1 つの
タグとして扱い、回答の先頭のタグだけを数える）。表示は折りたたみ。**履歴として送り返すのは本文だけ**で、
thinking ブロックは送り返さない: ツールを使わない会話では API が要求せず、送り返さないので過去の質問の
編集・再生成が（Fable 5.1 の履歴編集チェックを含め）何も無効化しない。

**Anthropic 固有**: モデルの能力は名前から推測せず Models API に聞く（`max_tokens` の上限、adaptive thinking
の可否。プロバイダ + モデルごとに 1 回）。Models API のないプロキシでは thinking を付けず `max_tokens`
64000 で送る（どのモデルも受け付ける形）。会話の接頭辞は毎ターン同じなのでトップレベルの
`cache_control` でキャッシュする。`stop_reason` は本文より先に読み、`refusal` は理由つきの停止として残す。
`api.anthropic.com` 宛ての `claude-opus-5` / `claude-fable-5-1` に限り、サーバー側フォールバック
（beta `server-side-fallback-2026-07-01`、`fallbacks: "default"`）を付ける: 安全分類器が断った要求を同じ呼び出しの
中で別モデルが答え、メッセージには実際に答えたモデル名を残す。プロキシやクラウド基盤はこのパラメータを
知らない可能性があるので付けない（beta 面を使うのもこのときだけ）。

**Markdown は HTML を経由しない**。`lib/markdown.ts` が既知のノードだけの木を作り、`Markdown.svelte` が
要素として描く（段落・見出し・コードフェンス・リスト・引用・表・罫線、インラインはコード・強調・
打ち消し・リンク）。モデルの出力は信頼できないテキスト（Web ページの引用や、それに誘導された出力を
含み得る）で、木にはスクリプトもスタイルも画像リクエストも載らない。リンクは http/https だけで、
他のリンクと同じく `system.openExternal`。書きかけの回答を 100ms ごとに解釈するので、閉じていない
フェンスは「開いたコードブロック」として扱う。メモの「Markdown を描画しない」決定（[decisions.md](decisions.md)）とは別の話で、
あちらは自分の文章、こちらは Markdown で答えるよう訓練されたモデルの文章。

**見た目は HUD の語彙で**（2026-09-20、UI の作り込み）。メッセージは通信ログの 1 件: 名前、読み出しまで伸びる罫線、
左の縦線から下がる本文（自分の発言はアクセント + パネルと同じ欠けた角、返答はパネルの罫線で、書いている間だけ点灯）。
返答の見出しには `38 › 212 tok · 50 t/s`（プロバイダが数えたトークンと、main が測った生成時間 `ms` から出す速度）。
生成中は `writing · T+12s · 1.2k ch` のテレメトリと末尾のキャレット。**キャレットは CSS アニメーションにしない**:
遅いモデルでは何分も回り続けるコンポジタの仕事になるので、共有の拍（`lib/pulse.svelte.ts`）の `data-pulse` で
不透明度を 3 段に切り替える。経過秒は `onBoundary(1000)` に乗せ、依存するのは run の開始時刻（数値）だけ —
run 自体は毎秒 10 回作り直されるオブジェクトなので、それに依存すると毎回タイマーを張り直す。
会話のない状態は「LINK STANDBY / ▌プロバイダ · モデル / ホスト / AWAITING INPUT」（ホストは独立した行: 同じ行に置くと狭いペインでアドレスの途中で折れた。プロバイダとモデルの間でも先に折れる）、プロバイダが
ない状態は「NO LINK」と `> set up provider` のコマンド。入力欄は `>` のプロンプトを持つコマンドラインで、
キーボードを持っている間は左端が点灯する。生成中の読み出しは `TX`（送って待っている）/ `RX · reasoning` / `RX` と
共有の拍で明滅する受信ランプ。ペイン見出しのバッジは他のペインと同じく言葉で `receiving`（`RX` はペインの中でこそ通じる）。
**一時的な失敗の再試行（OpenAI 方言）**: ホスト型サービスは時々 429 / 5xx を返したり接続を切ったりし、同じリクエストが直後には通る。Anthropic 側は SDK が自分で再試行するのに、素の fetch の側には無かった（Gemini で test がたまに失敗するという報告 2026-09-21。再現はできず、通信層も 12 回試して安定していたが、この非対称は実在した）。`fetchPatiently`: 408 / 429 / 500 / 502 / 503 / 504 と、応答の前に切れた接続を、0.5 秒・1.5 秒おいて 2 回まで。回答が 1 バイトでも届いた後は再試行しない。`Retry-After` が 5 秒以内なら従い、長ければ待たずにその失敗を伝える。中断（Stop）は待ち時間も終わらせる。**このマシンや LAN のサーバーには再試行しない** — そこでの失敗（起動していない、メモリ不足、モデルがない）は文字どおりで、再試行は NO CARRIER を遅らせるだけ。**キーは他の欄と同じく、欄を離れたとき（と Enter）に保存する**。専用の `save key` ボタンは無くした（欄を離れれば保存されるので、押す意味がなかった）。保存は `change` ではなく `blur` と Enter で行う: `show` で欄の type を切り替えると Chromium が「値が変わった」ことを忘れ、その後の Enter で `change` が出ない。test は、打っただけのキーを先に保存してから問い合わせる。以前はボタンを押さないと保存されず、打ったまま test を押すとキーなしで送られた — Gemini はそれに `404 Requested entity was not found` と答えるので、キーが無いことが分からない（利用者の報告 2026-09-21。このダイアログは見出しで「saved as you go」と言っており、キーだけが例外だった）。キーの保存で**レイアウトを動かさない**: 以前は保存すると `key held…` の行と `forget key` ボタンが現れ、test ボタンが 25px 下がった。欄を離れた時点で保存するので、test を押している最中（mousedown の後、mouseup の前）にボタンが指の下から逃げ、click が発生せず結果も出なかった（利用者の報告、人の速さの押下で再現。Playwright の click は速すぎて見えないので、e2e は down / 250ms / up で押す）。状態の行は常にあり（`no key held`）、`forget key` は無効で置いておく。プロバイダを消したら、その id の test 結果・モデル一覧・打ちかけのキーも消す（同じプリセットから足し直すと同じ id になり、前の `ok · 58 models` が残っていた）。ホスト型でキーを持たないまま失敗したときは、結果に `no key is held for this provider` を添える。**保存済みのキーは `••••` に見せ、打っている間だけ `show` で読める**（2026-09-21）: 発端は、キーを 3 回貼り付けた 159 文字（正しくは 53 文字）が保存され、Gemini が `400 Invalid Auth key` を返し続けた件。欄は常に点なので、3 重の貼り付けも 1 回の貼り付けも同じに見えた。点は入力欄の値ではなく placeholder — ページはキーを持たないので、見せるものもコピーされるものも、誤って保存し直されるものも無い。保存済みのキーに `show` は効かない（main から出ない）。文字数の表示は付けない（利用者判断: 一般的でない）。設定の項目名は `AI CHAT` から `AI` に（プロバイダはチャット以外からも使い得る。利用者の指摘）。プロバイダごとの画面の状態（打ちかけのキー・表示中か・保存を断られたか・test 結果・モデル一覧）は id をキーにした 1 つのレコードで、プロバイダを消すと一緒に消える。設定画面は、main が保存を断ったキー（512 文字超など）を黙って消さず `that key was not kept` と言い、test のたびに前回の結果を消す（同じ文言が 2 回出ると、押しても何も起きなかったように見える）。
**バーは会話が先、リンクが後**（`+ NEW`・`LOG`・プロバイダ・モデル）。`new` はモデル欄の右にあって見つけにくかった（利用者の指摘）。会話を始める唯一のボタンなのでアクセント色にし、既に新しい会話のときは無効（title が「this is a new conversation」）。狭いペインではリンク側が下の行に折れる。**押せるようになったことは見える**: `send` と `+ new` は押せる間アクセント色で点灯する（`send` は地も `--accent-faint`）。以前の `send` は有効でも muted の文字で、Tron では無効（opacity 0.5）とほとんど見分けがつかなかった（利用者の指摘 2026-09-21。6 テーマすべてでスクリーンショットと e2e で確認）。**送れない理由は言う**: モデルが空だと send が暗いだけで、会話が表示されている状態では理由がどこにも無かった — `NO MODEL` の行を出し、モデル欄を警告色にする。**消えたプロバイダの会話は続けられる**: ペインが覚えている id が無くなっていたら、その会話に最後に答えたプロバイダを名前で探し（消して足し直すと id は変わるが名前は同じ）、モデルもその回答のものを使う。順に「ペイン自身の選択 → この会話に答えたもの → プロバイダの既定」。
**動き**（2026-09-21、利用者の依頼で検討）: 足したのは 3 つだけで、どれも一度きりか、既にある拍に乗る。(1) 待機画面の 4 行が 70ms ずつずれて `fx-rise` で上がる（リンクが立ち上がる。`new` を押した手応えにもなる）、(2) LOG の行が 22ms ずつずれて上がる（12 行で頭打ち）、(3) 送信後、最初の 1 バイトが来るまでの読み出しに `▰▱▱▱` の走査 — キャレットが既に使っている共有の拍（`pulse`）の位相を文字にしただけで、タイマーも CSS アニメーションも増えない。見送ったもの: 文字が復号されるような待機文字列のスクランブル（毎フレームのテキスト差し替えで、読むための文字を読みにくくする）、入力行や枠の走査線（終わらないアニメーション）、回答の 1 文字ずつの出現（ストリーミング自体がそれで、10fps の差分に上乗せすると遅く見えるだけ）。
モデル欄は `<datalist>` ではなく自前のリスト（`ModelField.svelte`。ペインと設定で共用）: Chromium の datalist はネイティブのポップアップで実質スクロールできず、モデルが百個ある Gemini や OpenRouter では画面に入った分しか選べなかった（利用者の報告 2026-09-21）。自由入力のまま（一覧にないモデルも打てる）で、入ると全件を出し、打つと絞り込み、矢印と Enter で選び、Escape はリストだけを閉じる（ペインの「停止」やダイアログの「閉じる」に渡さない）。リスト上の mousedown は既定動作を止める — スクロールバーを押しただけでフォーカスが外れて閉じないように。プロバイダの select はネイティブのまま。
モデル一覧の取得中は欄の右端に `QUERYING`、読めなかったら `NO LIST`（理由は title）を重ねて出す — プレースホルダは
モデルが入っている欄では見えない。取得は世代カウンタで数え、離れたプロバイダの返事が今の待ちを終わらせない。
失敗の集合（`error` / `unreachable` / `refusal`）は 1 つで、印の色と終わりの音（`glitch`）の両方がそれを見る。会話の一覧は `LOG`: 番号・タイトル・経過（`2h`。開いた時点から数え、刻まない）・
件数を等幅 1 行で並べ、export / delete は指した行（またはキーボードで入った行）にだけ出す。
**終わり方は短いコードで示し、プロバイダの言葉は隠さない**: `STOPPED` / `TRUNCATED` / `DECLINED` / `LINK ERROR` /
`NO CARRIER`（誰も出なかった。main が `unreachable` として他の失敗と分けて記録する）。詳細を title 属性に
しまう案は採らなかった — 「キーが拒否された (401)」「ollama は動いていますか」は直すために読む文で、
ホバーしないと出ない場所に置くものではない。見送った案: バーの `PROVIDER` / `MODEL` ラベル（最小幅 260px の
ペインで入力欄を削る。ラベルは aria に持たせてある）、select の自作（設定や天気と同じネイティブの select に
そろえる。自作リストボックスはキーボードと読み上げの対応が丸ごと自前になる）、`new` の改名（「リンク」は
プロバイダとの接続で、新しい会話は新しいリンクではない）、入力行のスキャンライン（終わらないアニメーション）。送信で `stdout`、回答の着地で `granted`、失敗で `glitch` を鳴らす（見ているペインだけ）。
ペイン見出しのサブタイトルは会話のタイトルだけ（モデルはすぐ下のバーにあるため）。

**コンテキストの窓（2026-09-21）**。会話の正本（ディスクとペイン）は常に全文で、削るのは main が
アダプタに渡す列だけ（`chatWindow`、`shared/ai.ts` の純関数）。ローカルのサーバーは起動時の窓（数千トークン）で
答え、超えた分は**黙って先頭から**（システムプロンプトごと）捨てるので、こちらで先に決める。

- **窓はプロバイダの属性**（`AiProvider.contextTokens`、トークン）。グローバル設定 1 本では Ollama の 8k と
  Claude の 1M を同時に表せず、ペインは会話の途中でプロバイダを替えられる。未設定ならアドレスで決める
  （`contextWindow`: このマシンか LAN に平文 http なら 8192、それ以外は 0 = 全文）。Ollama 自体の既定は
  4096 なので、README に「Ollama 側の context length に合わせる」と書いた。0 は明示的な「管理しない」。
- **単位はトークンの概算**（`estimateTokens`: ASCII は 4 文字で 1、それ以外は 1 文字で 1、メッセージごとに +4）。
  トークナイザは入れない（モデルごとに違い、同梱に値しない）。よく言われる「4 文字 ≒ 1 トークン」は英語の
  話で、日本語では 4 倍ずれる。プロバイダが返す実測（`usage.input`）で補正するが、**上方向だけ**
  （1〜2 倍、見積もり 500 トークン以上のときだけ、プロバイダ + モデルごと、メモリのみ）: 先頭を黙って
  捨てたサーバーは小さい数を返すので、それを信じると次はもっと送ってしまう。短いプロンプトでは
  チャットテンプレート自体のトークンが比を決めてしまうので測らない。
- **まとめて切り、切った位置を覚える**。送れるのは窓の 3/4（残りは回答と、同じ窓を食う reasoning の分）。
  超えたら窓の 1/2 まで一度に切り、その位置を `Chat.context.from` に保存して、次に超えるまで動かさない。
  毎ターン 1 件ずつ落とすスライディングウィンドウは、毎回プロンプトの先頭が変わるので llama.cpp / Ollama の
  KV キャッシュも Anthropic の prompt cache も毎ターン無効になる — ローカルでは毎回全プロンプトの
  再処理で、目に見えて遅い。切る位置は必ず user メッセージ（送る列が質問から始まる）。
- 送信ごとの判定順: 全文が収まれば全文（窓の大きいモデルに替えた、編集で短くなった → 線も消える）→
  保存した位置で収まればそこ → 切り直し。最後の質問は収まらなくても送る（プロバイダの返事に任せる。
  `TRUNCATED` や LINK ERROR として今の表示で見える）。「直近 N ターンは必ず残す」設定は採らなかった:
  長い貼り付けひとつで予算を破り、結局サーバー側の黙った切り捨てに戻る。
- `context` は質問と一緒に保存・配信されるので、線は回答を待たずに出る。読めない `context` は線を失うだけで、
  会話は失わない（`.catch(undefined)`。`contextTokens` も同じ）。
- ペインはログの切れ目に `NOT SENT · n ABOVE` の線を引く（警告色、理由と設定場所は title）。モデルが
  もう読んでいない範囲は、利用者が知る必要のあること。常設のゲージは置かない（実測の入力トークンは
  各回答の読み出しに既にある）。
- **要約（`ai.compact`、既定オフ）**。利用者が打っていないリクエストなので、入れるのは利用者。切り直しの
  たびに 1 回だけ、質問の前に、同じプロバイダ・同じモデルへ「残していく範囲」の要約を頼む
  （`COMPACT_PROMPT` + `compactTranscript`: これまでの要約 + 今回残していくメッセージ。入りきらなければ
  新しい方を優先し、入らない 1 件は頭だけ）。「問い合わせるのは送信・test・モデル一覧だけ」の約束のまま —
  回答後にバックグラウンドで要約する案は、単一 GPU のローカルで次の質問を待たせるので採らなかった。
  要約は **システムプロンプトの後ろ**に足す（`withSummary`）。`[CONTEXT]` の user メッセージにすると user が
  2 件続き、役割の交互を要求するチャットテンプレート（Gemma / Mistral 系）で失敗し、モデルもそれを利用者の
  発言として扱う。システムプロンプトが変わるのは切り直したときだけなので、キャッシュの上でも損がない。
  要約の場所（`summaryRoom`: 窓の 1/10、上限 600 トークン）は要約ができる前から予算に取り、書かれた要約は
  その場所に切りそろえる（`clipToTokens`）: 書いた結果で切る位置が動かないように。場所は `high` と `low` の
  差（窓の 1/4）より十分小さい。既に要約があるときは予約ではなく実際の大きさで数える。当初は一律 600 で、
  窓 1024 ではメッセージに 168 トークンしか残らず、**質問のたびに切り直して要約を頼んでいた**（レビューの
  指摘「予約が常に効く」を確かめる中で見つけた。テストは一律 600 に戻すと失敗する）。
- 要約は `Chat.context.summary = { text, before }`（`before` より前を代弁する）。失敗・空・中断は要約を
  失うだけで、質問は送る（その回は trim と同じ）。前の要約はそのまま送り続け、次の切り直しで
  `before` から先をまとめ直すので、失敗した回の範囲も拾われる。頼むのは 1 つの切れ目につき 2 回まで
  （`COMPACT_TRIES`）: 最初の 1 回と、それが実らなかったとき次の質問でもう 1 回。一時的な 500 で、次の
  切り直し（十数ターン先）まで「送られず、要約もされない」区間が残るのを避ける（レビューの指摘
  2026-09-21）。それ以上は試さない — 要約できないプロバイダに質問のたびに頼まない。数えるのは**実らなかった要約**だけで、`compact` がその場で数える: 送信を組み立てる段階では数えないので、保存に失敗して送られなかった質問や、利用者が要約の途中で止めた回は 1 回に入らない。回数はメモリにだけ持つ（再起動すればまた試せる。一時的な障害からの回復になる）。
  同じ仕組みで、切った後に設定をオンにした会話も、次の質問で要約される。`before` が編集で消えた要約、全文が収まる会話の要約は
  捨てる。設定をオフにしても、既にある要約は送り続ける。
- 要約中は `ChatRun.phase = 'compacting'`（ペインは `TX · COMPACTING`、見出しのバッジも `compacting`）。
  要約が終わると phase を外して `startedAt` を取り直す — 回答の tokens/s に要約の時間を入れない。
  Stop と会話の削除は要約中でも効き、質問は送られない。
- ログの線は、要約が線までを代弁していれば `SUMMARISED · n ABOVE`（アクセント色、開くと要約の本文）。
  **モデルが利用者の代わりに何を聞かされているかは、利用者が読めるべきもの**。モデルが書いた文なので
  マークアップにせずテキストで描く。手動の compact ボタンは置かない（`new` で足りる。バーに場所もない）。
- Anthropic のサーバー側 compaction（beta）は、専用ブロックを履歴に保持して送り返す必要があり
  「text だけが履歴」の設計と合わず、2 つの方言で仕組みが分かれるので使わない。

**ツールは持たせない（v1、ユーザー了承 2026-09-20）**。MCP / ツール実行は 2026 年のチャット UI の主流だが、「モデルの判断で
プロセスを起動し、ファイルを読む」経路は、このアプリの境界（§11: 汎用チャネルなし、パスを取る run なし）と
正面からぶつかる。入れるならプラグインと同じ水準の同意設計（ツールごとの許可、呼び出しごとの確認）が
先に要る。会話の分岐も見送り。画像添付も当初は見送ったが、2026-10-01 に利用者が解除した（下の「ファイル添付」）。

**ファイル添付（2026-10-01、利用者の仕様案を元に設計）**。利用者が自分で選んだテキスト・画像・PDF を質問に添える
（`shared/ai-attach.ts`、`main/ai/files.ts`、`widgets/aichat/attach.ts`・`draft.svelte.ts`・`Payload.svelte`・`FileCard.svelte`）。
モデルが自分で読みに行く経路（`read_file`、MCP、フォルダ一括、ワークスペースの自動添付）は持たない。上の「ツールは持たせない」は変わらない。

- **パスは一切通さない**。入口は `<input type=file>`・ペインへのドロップ・画像の貼り付けの 3 つで、どれもページに
  `File` として届き、ページがバイト列にして `ai.attach(draftId, {name, bytes, thumb?, source?})` で main に渡す。
  利用者の提案は main のピッカーと `attachPaths(paths)` だったが、パスを取る IPC は §11 の境界に反する
  （乗っ取られたページなら任意のパスを送れる）。git や CHIP-8 が main のピッカーを使うのは「パスを覚えて後で読み直す」
  ためで、ここは一度きりのスナップショットなので、渡す権限の小さいほうを採った（利用者判断 2026-10-01）。
  main は受け取ったバイト数をまず見て（最大 10 MB）、種類を**先頭のバイト（マジックナンバー）で**判定する（`classify`）。
  名前も OS の MIME も決め手にしない。PDF は先頭（空白のあと）の `%PDF-` だけで判定する: 先頭 1 KB のどこかにあればよいとすると、
  `%PDF-` を話題にするメモやプログラムが PDF として扱われた（レビューの指摘）。名前はベース名だけにし、タグを壊す文字を落とす（`attachmentName`）。
- **画像はページで描き直す**。`createImageBitmap` でデコードし、長辺 1568 px・面積 1.15 MP 以内（`fitImage`。
  Anthropic がそれ以上をサーバー側で縮小する境目で、それを超えて送っても帯域の無駄）に OffscreenCanvas で描き、
  PNG（スクリーンショットの文字がつぶれないよう、元が PNG なら）か JPEG に**エンコードし直す**。理由は 2 つ:
  信頼できない画像のデコードを main（ブラウザプロセス）でしない — Chromium はそのためにデコードをサンドボックス側で行っている、
  `nativeImage` は GIF/WebP を読めない — ことと、描き直しでカメラの EXIF（撮影場所の GPS を含む）が残らないこと。
  main は PNG と JPEG のヘッダから寸法を読むだけで、`fitImage` を満たさない画像や、EXIF のセグメント・PNG の
  `eXIf` / テキストのチャンクが残っている画像（`carriesMetadata`）は「ページが描き直したものではない」として断る。ページは
  名前や OS の種類が画像を示さないファイルも先頭のバイトで画像と見分け（`looksLikeImage`）、描き直しに回す — 拡張子のない
  写真が生のバイト列のまま（撮影場所ごと）送られる抜け道だった（レビューの指摘）。バイトだけで画像と見たものがデコード
  できなければ、そのままのバイト列として main に渡す（`BM` や `GIF8` で始まるテキストを画像として断らないため。BMP は
  オフセット 14 のヘッダ長まで、GIF は `GIF87a` / `GIF89a` まで見る）。そのとき画像なら、上の `carriesMetadata` が守る。
  チップ用の小さな JPEG（長辺 128 px、16 KB 以下）もページが作り、main は JPEG であることと大きさだけ確かめる。
- **上限**（`ATTACH_LIMITS`、デコード前のバイト数で数える。base64 は 4/3 倍になるため）: 1 質問 5 件・合計 15 MB、テキスト
  256 KB、画像（描き直した後）3.75 MB、PDF 10 MB・100 ページ。**テキストは超えたら切り詰めずに断る**: 先頭だけ残すと
  ログの肝心な末尾が消え、モデルは一部しか見ていないことを知らないまま答える。テキストの判定は UTF-8 として読め、NUL がなく、
  制御文字が 1% 以下（`readText`）。秘密に見えるファイル名（`.env` など）を黙って外す案は、利用者が自分で選んだものなので採らない（利用者判断 2026-10-01）。
- **送る前は main のメモリ、送ったら会話の横**。送る前のファイルは、ページが作った下書き id ごとに main のメモリに置く
  （ディスクには書かない: 送られないかもしれない）。id はペイン状態の `filesDraft` にあるので、移動（再マウント）した
  ペインは同じファイルを取り戻す。再起動すれば main は覚えておらず、id は何も指さない。保存レイアウトからは外す
  （`VOLATILE_PANE_STATE`）。下書きは 24 個・合計 64 MB まで（閉じたペインの下書きが溜まれば古いものから消える。
  いま足された下書きは消さない）。送信は、ページが見せているファイルの id を下書きと一緒に名指しし（`ChatRequest.files`）、
  main はその全部がそろわなければ送らない — 消えた下書きのファイルを黙って落とした質問を送らないため。ページは断られたら
  main が持っているものを読み直す。
  送信時、ファイルを `chats/<chatId>.files/<sha256>`（+ `.thumb`）に**会話の保存より先に**書く — 会話がないファイルを
  指すことがないように。会話 JSON にはメタデータ（名前・種類・バイト数・sha256・推定トークン数・寸法・縮小前の寸法・ページ数）
  だけを書く。会話 JSON は回答のたびに書き直すので、バイト列を入れない。同じ画像を 2 回送れば 1 つで済む。
  会話を消せばフォルダごと消え、質問を編集して参照されなくなったファイルは消す（`prune`）。
- **送る形**。テキストファイルは質問の本文に `<file name="…">…</file>` として入れる。Markdown のフェンスにしなかったのは、
  中身に ``` があると囲みが壊れるため。順序は「画像・PDF → テキストファイル → 質問」で、長い資料は質問の前に置くという
  Anthropic の助言に従った（提案は質問が先だった）。画像は、OpenAI 方言では `image_url` の data URL、
  Anthropic 方言では `image` の base64 ブロック。PDF は、Anthropic では `document` の base64 ブロック、OpenAI 方言では
  `file` パート（`file_data` の data URL）。後者を送るのは、`AI_PRESETS` で `pdf: true` のプリセット（OpenAI、OpenRouter）と
  **同じアドレス**のプロバイダだけ（`takesPdf`。アドレスで判定するので、以前に追加したプロバイダや custom でも同じに扱う。
  利用者判断 2026-10-01）。それ以外への新しい質問は送る前に断り（ペインは `NO DOCUMENT`、チップは警告色）、
  履歴にある PDF は `[paper.pdf (PDF, 3 pages, 90 KB) - not sent: Ollama is not sent PDF files]` という行に置き換える
  — 黙って落とさない。コピーが消えていたファイルも同じ形で名前だけ送る。Files API（`file_id`）は、サービス側に残るコピーの
  管理が増えるので使わない。画像が読めるかどうかは事前に判定しない: OpenAI 互換の `/models` は答えず、モデル名からの推測は
  §5.7 の規則で禁じている。読めないモデルへは送って、断られたら `LINK ERROR` にプロバイダ自身の言葉を添えて示す。
- **窓の中で数える**。画像のトークンは両方言の数え方の大きいほう（`imageTokens`: Anthropic の面積 ÷ 750 と OpenAI の
  512 px タイル）、PDF は 1 ページ 2500（ページ数が読めなければ 60 KB を 1 ページとみなす）、テキストはファイルの
  ブロックごと `estimateTokens`。これらは `chatWindow` でメッセージの見積もりに足すだけで、**切り方は変えない**。
  利用者の提案は「古い画像パートを順に落とす」だったが、それは毎ターン先頭が変わるスライディング窓で、prompt cache と
  KV キャッシュを毎回無効にする（上の「コンテキストの窓」）。さらに、1 リクエストの画像・PDF の合計（履歴を含む）を
  20 MB に抑える（`ATTACH_LIMITS.sent`。base64 にして Anthropic の 32 MB 上限を十分下回る）。窓が 0（全文を送る）の
  ホスト型でも、これを超えれば同じ切れ目の仕組みで切る。バイトにもトークンと同じ `high` / `low` の割合を掛ける: 掛けずに
  上限ぎりぎりで切ると、画像つきの質問を重ねるたびに切れ目が 1 つずつ進み、禁じたスライディング窓そのものになっていた
  （レビューの指摘。3 MB の画像を 40 回重ねるテストで、切れ目の移動は 34 回から 12 回以下になる）。そのプロバイダに送らない
  PDF は、名前の行になるので、ページ分のトークンもバイトも数えない（`asSent`）。要約（compact）には、ファイルの中身ではなく
  `[attached: …]` の行で名前だけを伝える。export も名前とサイズの行だけ。
- **見た目**。入力行の先頭に `+`。添えたファイルは入力行の上に **PAYLOAD** の列として並び、右端に「件数 · サイズ · 推定トークン」。
  チップは種類のタグ（TXT / IMG / PDF）か縮小画像・名前・サイズで、パネルと同じ欠けた角を持ち、`crt-on` で現れ `crtPower` で消える。
  読み込み中は破線のチップに `reading`。チップにポインターを置く（キーボードでフォーカスする、クリックする）と共通の詳細カード
  （HoverCard）が、チップに入りきらないもの — ファイル名の全体、正確なバイト数、推定トークン数、画像のピクセル数と縮小前の大きさ、
  どう送られるか — を出す。ファイルを持ってペインに入ると `DROP TO ATTACH` が `crt-on` で重なる。送信済みの質問にも同じチップを
  （× なしで）並べ、ファイルだけの質問は本文の行を出さない。質問を編集すると、そのファイルがチップとして戻り、× で外せる。
  次の質問のために待っているファイルは、編集の間もそのまま並び、編集をやめても残る（編集がそれを消していた。レビューの指摘）。
  チップが消えた（送った、外した、会話を替えた）ときは、開いていたカードも閉じる: 消えた要素には pointerleave が来ない。
  送ったファイルは同じ id のまま送った質問のものになる（main は送信の返事より先に会話を配る）ので、送信では手で閉じる。
  編集で、元のファイルと待っていたファイルを合わせて 1 質問の上限を超えるときは、送る前に `PAYLOAD FULL` と言って送らない。
  会話を切り替えても（`+ NEW`・LOG）、送る前のファイルは残す: 選び直す手間のほうが大きい。貼り付けにテキストが含まれていれば
  テキストとして貼る（Excel のセルはテキストと画像を両方運ぶ）。送れない理由は既存の行に、コード（`TOO LARGE` /
  `UNREADABLE` / `PAYLOAD FULL` / `NO DOCUMENT`）とファイル名つきの説明で出す。
- **テスト**: 単体（`ai-attach.test.ts`: 判定・名前・寸法・トークン・合成・窓。`ai-files.test.ts`: 下書き、保存、両方言の形、
  PDF の拒否と置き換え、欠けたコピー、編集で残すものと消すもの、会話の削除。`layouts-portable.test.ts`）、コンポーネント
  （チップ、× 、PDF の拒否、送信済みのチップ、編集、貼り付け、ドロップ、カード）、e2e（`aichat.spec.ts`: 選ぶ・ドロップ・貼り付けの
  3 経路で、スタブが受けた画像が JPEG に描き直されて EXIF の印を含まないこと、ページにもディスクにもパスが出ないこと、
  PDF が Anthropic 方言にだけ `document` として届くこと）。名前を付けて切り替える
システムプロンプト（「リンクプロファイル」）も見送った（ユーザー判断 2026-09-21）。

**テスト**: 単体（`shared/ai.ts` の純関数、`AiChatService` を偽アダプタと実ファイルで、`KeyVault`、
両アダプタをローカル HTTP サーバー相手に — 送るパス・ヘッダ・本文と、サーバーの答え方ごとの解釈、
リダイレクトを追わないこと、`lib/markdown.ts`）、e2e（`aichat.spec.ts`: プロバイダなしでは何にも触れない、
キーがページ・settings.json・ai-keys.json のどこにも平文で現れない、ストリーミングと再起動後の復元、停止、
再読み込みをまたぐ生成とペインを閉じたときの停止、Anthropic 方言、平文 http へのキー拒否）。
プロバイダは利用者自身のアドレスなので、テストはローカルのスタブを並べるだけでオフラインのまま。
`ELECDEX_AI_KEYS_STUB=1` が safeStorage を可逆のダミーに差し替える（Keychain と、その確認ダイアログに
触れないため）。

### 5.8 ELEC システムペイン

『エヴァンゲリオン』の MAGI に着想を得た合議ペイン（`widgets/elec`、`shared/elec.ts`、`main/ai/elec.ts`、
`main/ipc/elec.ts`）。賛否で答えられる議案（motion）を 3 つのユニット — **UNIT-1 LOGOS**（論理・根拠・実現性）、
**UNIT-2 ETHOS**（倫理・責任・影響を受ける人）、**UNIT-3 PATHOS**（感情・直感・欲求）— に諮り、各ユニットが
APPROVE / REJECT / ABSTAIN で投票し、規則に従って決議する。アプリ内の文言に MAGI や原作の名前は出さない
（ユーザー判断 2026-09-21。README で着想元として触れるだけ）。既定レイアウトには入れない（複数可、`zoom: 'full'`）。

**AI チャットの土台に載せる**。プロバイダ・キー・アダプタは §5.7 のものをそのまま使う（`registerAiIpc` が
`registerElecIpc` に `keyFor` と `adapter` を渡す）。宛先の解決（登録済みか・使えるアドレスか・平文 http で
LAN の外にキーを送らないか）は `main/ai/target.ts` の `targetFor` に出して両方から使う。保存は 1 件 1 ファイル
（`elec/<uuid>.json`）で、`main/ai/store.ts` の `FolderStore` を `ChatStore` と共用する。配信はスナップショット +
差分（差分は run の id と `textAt` を持ち、合わなければ `'resync'`）、100ms ごとにまとめる、誰も購読しない
審議は 3 秒後に止める、終了時は同期で保存 — すべてチャットと同じ規則。

**席（どのプロバイダのどのモデルか）は設定、審議はその写し**（ユーザー判断 2026-09-21）。設定 `elec` に
`seats`（3 席ぶんの provider id と model）・`personas`（空なら既定の立場）・`rule`・`rounds` を持つ。全 ELEC
ペインが同じ評議会になる。ページが送るのは議案の文だけで、席と規則は main が設定から読み、`Session.seats` /
`rule` / `rounds` に写してから問い合わせる — 審議の途中や後で設定を変えても、その審議は書き換わらない。
席の解決（`resolveSeat`）はチャットと同じ順: 自分のプロバイダが登録されていればそれ、なければ先頭。モデルは
自分のプロバイダのものならそれ、なければそのプロバイダの既定。3 席とも同じモデルでよい（立場で分かれる）。
手編集の誤りで settings.json 全体が既定に落ちないよう、`elec` の各項目は `.catch` で個別に既定へ戻る。

**票の取り方は文の約束**（`ELEC_CONTRACT`）。system に「約束 + ユニット名 + 立場」、user に議案。約束は
「議案の言語で 120 語以内の声明を書き、最後に英語で `VERDICT: APPROVE|REJECT|ABSTAIN` と `CONFIDENCE: 0-100`」。
CONFIDENCE には「どれだけ断言できるか」の目安（95-100 断言できる / 75-90 確信はあるが反論の余地 / 55-70 傾いている /
40-50 判断がつかない / 40 未満 根拠が薄い）を添える。0-100 とだけ頼むとモデルは考えによらず 85 に寄るため。
構造化出力（JSON モード・tool use）は使わない — 2 つの方言、とくにローカルモデルで対応がそろわない。
`readVote` は**最後の** VERDICT 行を寛容に読む（`**Verdict:** reject`、`> VERDICT： REJECTED`、`承認` / `否決`）。
票が末尾で決まるので、パネルは各ユニットが書き終えた順に点灯する。声明の表示とエクスポート、第 2 回に渡す
文からは票の行を除く。

**無効票は ABSTAIN と別**（ユーザー判断 2026-09-21）。リンクの失敗（`error` / `unreachable` / `refusal` /
利用者の `stopped`）と、票が読めない回答（NO VERDICT）は無効票。失敗の前に VERDICT を書いていても数えない。
回答が長さで切れた（`length`）ものは、VERDICT が読めれば数える。**CONFIDENCE は表示のみ**で集計に使わない。

**決議は保存せず、票から毎回計算する**（`resolve`、純関数）。最終回の各ユニットの票で数える。有効票が 2 未満は
`QUORUM NOT MET`。`majority`: 3 席のうち 2 席が同じ側なら `APPROVED` / `REJECTED`、それ以外（1-1-1、1 賛成 +
2 棄権など）は `DEADLOCK`。「賛成が反対より多い」（相対多数）にしなかったのは、1 賛成 2 棄権を可決と呼ぶのは
評議会の多数ではないから。`unanimous`: 3 席とも APPROVE で可決、1 つでも REJECT なら否決、それ以外は
`NO CONSENSUS`。票の記録（`ballots`）だけが正本で、規則の解釈を変えても過去の審議は読み直せる。

**第 2 回（`rounds: 2`、既定 1）**。全員の第 1 回が終わってから、各ユニットに他 2 ユニットの声明（と自分の声明）を
「`[UNIT-2 ETHOS · APPROVE]` + 本文」の形で渡して投票し直させる。本文は `clipToTokens` でプロバイダの窓に合わせて
切る（`statementRoom`: 窓の 1/10、上限 800 トークン。窓はチャットの `contextWindow`）— 3 つの声明がローカルの
8k 窓を溢れないように。リンクが失敗したユニットは `(no statement: its link failed)`。票が変わったユニットは
パネルに `reject › approve` と出す。問い合わせは倍になる（6 回）ので既定は 1 回。

**同じローカルサーバーの席は順番に、ホスト型は並列に**。`isLocalAddress` のアドレスを共有する席は 1 本の
レーンで逐次、それ以外は席ごとのレーンで同時に問い合わせる。GPU 1 枚の Ollama に 3 件同時に投げると、
メモリと窓を分け合って全員が遅くなる。順番待ちの席は `QUEUED`。

**停止**。Stop（Esc）は書けたところまでを票として残し（`stopped` の無効票）、まだ問い合わせていない席に空の
無効票を足し、`rounds` をいまの回に縮める — 決議は実際に行われた回の票になる（多くは `QUORUM NOT MET`）。
アプリが審議中に落ちた場合は票が 3 つそろわず、ライブの run もないので、ペインは `INTERRUPTED` と出す。

**見た目**（2026-09-21、「elecdex の意匠を踏襲しつつ、SF 感・モダン・少し派手で映える」という依頼）。
- 上段の **stage**: 3 枚のプレートを三角形に置き（UNIT-2 が上、UNIT-1 が左下、UNIT-3 が右下）、中央に六角形の
  `ELEC` コア、プレートの間に点線の輪とスポーク。プレートは SVG 1 枚を 100×100 で引き伸ばし、
  `vector-effect: non-scaling-stroke` で線を 1px に保つ。文字は HTML で同じ百分率に重ね、プレートごとの
  コンテナクエリ単位で大きさを決める（絵と一緒に縮まない）。盤面（board）は幅が高さの 1.6〜2.3 倍に収まり、
  広いペインでは中央に寄せる — 引き伸ばすと三角形が潰れて見えた。低いプレートではコード・モデル・確信度の
  ゲージを隠し、名前と票だけにする。右上の隅には RULE・ROUND・ELAPSED / TOOK・VOTES・TOKENS の読み出し、
  左上の隅には**コンソール**（下記）。どちらも狭いステージでは隠す。ステージはペインの 64%（最大 48rem）まで伸び、下の声明が 7rem を切る前に縮む。
- ステージの真上に **議案の帯**: `MOTION #3F3A`（id の先頭 4 桁）のタグと、議案そのものを見出しの大きさで。
  何への決議なのかが図と同じ視野に入るように（当初はペイン見出しのサブタイトルと、下の記録にだけあり、
  見づらいと利用者に言われた 2026-09-21）。常に置いておき（審議がなければ `awaiting motion`）、提出で図が
  動かないようにする。2 行を超えると畳み、押すと全文（最大 12rem でスクロール）。copy / edit は帯の右端。
- 色はテーマの意味トークン: 賛成 `--ok`、反対 `--danger`、棄権 `--info`、無効 `--warn`、書いている間 `--accent`。
  （無効票を一度 `--text-muted` に変えたが、`+ new` の黄色い縁 — 電源オフの不具合 — の報告を読み違えた変更だった
  ので、利用者の指示で `--warn` に戻した 2026-09-21。）
  プレートの塗りは `color-mix(… , var(--app-bg))` で不透明にし、背後の輪が透けないようにする。票が入った
  プレートと文字は `--glow` の分だけ光る（光らないテーマでは平ら）。Business (Light) でも確認済み。
- 動きは共有の拍と一度きりの演出だけ: 書いている席のプレート・コア・輪の破線は `pulse.phase`（`data-pulse`）で
  段階的に変わる（CSS の無限アニメーションなし）。票の着地で文字が判のように押され（`elec-stamp`）、プレートが
  一度閃く（`elec-flash`）— どちらも `backwards` で `--motion-scale` を掛ける。
- **光の演出**（2026-09-21、利用者の依頼「TRON っぽい SF 感。このペインは CPU・GPU・メモリを多少使ってよい」）。
  Tron のライトサイクルの語彙 — 明るい頭と短い尾が回路を走る — を、**審議中だけ**動かす:
  (1) 盤面の下に遠近の付いたグリッドの床（`rotateX` の面の中で線の層を 1 マスずつ `translateY` してループ。
  待機中は静止）、(3) 問い合わせ中のユニットのプレートの縁を 2 つの光が回る（RX になると速く）、(4) スポーク上のパケット —
  TX は コア→ユニット、RX は ユニット→コアの向き、(5) 輪を回る 2 つの彗星（プレートの下の層なので隙間にだけ見える）。
  一度きり: 票が入るとプレートの輪郭をその色で一周描いて消える。
  **外したもの**（利用者判断 2026-09-21「わざとらしすぎる」）: 決議の光がスポークからコアへ流れ込み衝撃波の輪が
  広がる演出、コアの周りの破線の軌道と回る弧、六角形の中のレーダー。決議は下の帯の CRT 点灯だけで示す。
- **電源**（2026-09-21、利用者の依頼）: 審議の前、ユニットは**電源が切れている** — 塗りのない暗いガラス、
  点線の縁、名前は薄く（ステージの `powered` がないとき）。議案が出されるとユニットが**リレーが閉じるように**
  順に点く: 上の ETHOS、左の LOGOS、右の PATHOS の順に 220ms ずつずらし、プレートと文字が真空管のように
  ちらついて点灯し（`elec-power-on`、不規則な不透明度の段）、走査線が各プレートを一度上から下へ走る
  （`elec-boot`、transform のみ）。送信の音に `expand`（管が温まる音）を重ねる。審議ごとに点灯し直す
  （プレートと文字を審議の id で作り直す）。どちらも `--motion-scale` を掛けた一度きりで、動きを減らす
  設定では一瞬で点く。
- **コンソール**（2026-09-21、利用者の依頼「ログっぽい進捗表示」）: ステージ左上の空きに、審議の出来事を
  `15:34:13 UNIT-1 LOGOS · VOTE APPROVE 78%` の形で 1 行ずつ。記録は持たず、審議の中身から毎回組み立てる
  （`widgets/elec/log.ts` の `councilLog`、純関数・単体テストあり）: 提出（`MOTION #C26A FILED`・規則・
  `POWER ON`）、各ユニットの `TX`（票の `at - ms`、書いている run の `startedAt`）と票（`VOTE …` /
  `NO VERDICT` / `LINK ERROR` など）、第 2 回の開始、いま受信中の `RX`（時刻なし）、最後に `RESOLUTION`
  か `LINK LOST · INTERRUPTED`。だから古い審議を開いても、見ていたペインと同じログになる。審議の前は
  `CORE ONLINE`・各ユニットのモデルと `POWER OFF`・`AWAITING MOTION`。新しい行が下に足され、古い行は上へ
  薄れて消える（14 行まで）。最後の行の後ろのカーソルは共有の拍。
  光はプレートの SVG（盤面に引き伸ばす）とは別の、盤面のピクセル座標の SVG（`Effects.svelte`）に描く —
  引き伸ばすと破線の長さも線の太さも縦横で変わるため。`stroke-dashoffset`（SVG の再描画）と `transform`
  （コンポジタ）だけで、自前の rAF は持たない。終わらないものはすべて `--ambient-play-state` で画面外では止まり、
  動きを減らす設定では `Effects` を描かず床も止める（e2e で確認）。**実測**（1920×1080、ELEC ペイン 1 枚、
  2 席に同時に問い合わせ中、`app.getAppMetrics` の 6 秒平均の合計）: 待機中 0.0%、審議中 5.6%（動きを
  減らす設定なら 0.7%）。既定レイアウトには入らず、待機中は何も動かないので、アイドル予算には影響しない。
- **つなぎ目と通信量**（2026-09-21、利用者が選んだ案: つなぎ目の全部、RX パケット、QUEUED の拍、決議の「間」、
  ゲージ、コンソールの打ち出し）。純粋な判断は `widgets/elec/light.ts`（単体テストあり）。
  - **床は止まった位置で止まる**。アニメーションを外すと格子が最大 1 マス跳んで始点に戻っていた。`paused` で
    残すと待機中ずっとレイヤーを持つので、ページを書き換える前（`$effect.pre`）に計算済みの transform から位相を
    読み（`floorPhase`）、素の `translateY` として持つ（`--floor-at`）。次の審議は負の `animation-delay` でそこから走る。
  - **光は現れ方・消え方を持つ**。彗星・縁の光・TX のパケットは `HOLD_MS`（250ms）でフェードして出入りする。
  - **TX→RX**: 走っているアニメーションの `animation-duration` を変えると位置が跳ぶので、縁の光は `{#key}` で
    走り直し、最初の断片が届いた瞬間にスポークが一度明滅する（`elec-lock`）。
  - **RX のパケットは通信量そのもの**。一定のループをやめ、main の差分 1 件（`UnitView.received` の増加）ごとに
    一度きりのパケットを 1 個流す。`nextPackets` が 1 本のスポークに同時 3 個・間隔 220ms までに抑える（main は
    毎秒 10 件送る）。速いモデルは連なり、考え込むモデルのスポークは暗い。途中から見た回答（ペインの再マウント、
    ログから開いた審議）には流さない。パケットは `animationend` で消し、背面タブ（`display: none`、アニメーションが
    走らない）で残ったものは次の発射のときに古いものから捨てる。
  - **QUEUED の縁の破線**は共有の拍で 1/4 周期ずつ進む（CSS アニメーションなし）。
  - **決議の「間」**。最後の票で光が消え、`HOLD_MS` のあいだ帯は何も言わず（コンソールの `RESOLUTION` 行・コアの
    下の語・音も待つ）、それから CRT 点灯。足すのではなく引く演出（収束や衝撃波は外したまま）。`held` は審議中に
    立てておくので、終わった更新そのものに「間」が入る — 後から effect で立てると判定が一度描かれてから消える。
    見ていなかった審議（ログから開いた、再マウント）と、動きを減らす設定では待たない。終わりは `setTimeout`
    （フレームではなく時刻）。スナップショットからやり直して終わっていた場合に持ち続けないよう、保留のない終了で外す。
  - **決議に加わらなかった席は一歩下がる**（`steppedBack`）: 可決なら APPROVE 以外、否決なら REJECT 以外、決まらな
    かった（DEADLOCK・QUORUM NOT MET・NO CONSENSUS・INTERRUPTED）なら 3 席とも。プレートは色を地に寄せて光を消す —
    不透明度にすると背後の輪が透ける。文字は子要素の不透明度（`.unit` 自身の不透明度は点灯アニメーションのもの）。
  - **電源オフ**: 待機に戻ると、点いていた席が点灯の逆順（右、左、上）にちらついて暗いガラスに落ちる。そのマウントで
    一度も点いていなければ（`was-on`）何もしない。
    動かすのは不透明度だけ — 当初はプレートの塗りと縁の色もキーフレームで補間したが、hsl のアクセントと
    `transparent` を混ぜた色の間を Chromium が補間すると、途中が黒い塗りと黄色の縁になった（利用者の指摘
    2026-09-21、`+ new` のたびに見えた）。e2e がフレームごとに縁と塗りの色が変わらないことを確かめる。
  - 確信度ゲージは票の着地で 0 から一度伸び（`scaleX`）、コンソールの行は `clip-path` + `steps()` で打ち出される。
  - Effects の光の `drop-shadow` は `data-mode="light"` では外す（明るい地では光ではなく滲みになる）。`--glow` に
    比例させる案は、既定の Tron が `glow: 0` で光を失うので採らなかった。
  - **再計測**（2026-09-21、同じ機械、1920×1080 相当、ELEC ペイン 1 枚、2 席が同時に RX、`getAppMetrics` の
    `cumulativeCPUUsage` の 6 秒差分の合計）: 待機中 0.4〜0.5%。審議中は**変更前 71〜73%**（GPU 46% + Tab 25%）、
    変更後 67%（断片が止まっている）〜81%（毎秒 10 断片）、動きを減らす設定で 5〜18%。上の「審議中 5.6%」は
    この測り方では再現しなかった（変更前のコードでも 70% 台）。`drop-shadow` を全部外しても 81% → 69% なので、
    主因はフィルタではなく、盤面大の SVG の `stroke-dashoffset` アニメーションと床が毎フレーム再描画されること。
    今回の変更はこの費用を増やしても減らしてもいない。減らすなら別の作業として扱う。
- **審議中の光は滑らかなまま（CPU を使ってよい）**（利用者判断 2026-09-21）。審議中の費用は 1 コアの 70% 前後。
  10fps の共有ループの段階送りに移す案を一度実装し（彗星・縁の光・パケット・床を `onFrame` で配置、審議中は
  プレートの `transition` なし）、28〜29% まで下がったが、**カクついて見え UX を損ねる**として取り消した。
  このペインは既定レイアウトに入らず、待機中は 0.5% なので、アイドル予算には響かない。
  そのとき分かったこと（同じ測り方、2 席が RX、毎秒 10 断片）: そのまま 70%、床だけ止めて 74%、光の SVG だけ
  消して 59%、両方で 51%、さらにプレートの `fill` のトランジションを切って 17% — 足し算にならない。終わらない
  アニメーションが 1 つでもあればステージ全体が毎フレーム合成され、その費用がほぼ全部。プレートの塗りは拍
  （250ms）ごとに変わり 240ms のトランジションが付いているので、これも実質終わらないアニメーション。つまり
  演出を 1 つ 2 つ削っても費用は変わらない。減らすなら全部を止めるしかなく、それは採らない。
- 中段の **resolution** 帯: `RESOLUTION ── APPROVED ── 2·1·0·0 ── again`。決議の語は `crt-on` +
  `transition:crtPower` で点灯する（通知と同じ扱い）。審議中は `▰▱▱▱ deliberating`。
  決定がこのペインの目的なので、帯は状態行ではなく独立した帯の大きさ（高さ 3.6rem、判定は `--step-3`、
  票数は `--step-1`）。幅 34rem 未満のペインでは判定を `--step-1` に下げ、`RESOLUTION` の見出しを隠す
  （最長の `QUORUM NOT MET` を 1 行に保つ）。
- **3 枚のプレートは同じ高さ・同じ面積**（利用者の指摘 2026-09-21。上の 1 枚は高さ 31%・面積 1253、下の 2 枚は 39%・
  1536 で、上が 2 割近く小さかった）。高さは 3 枚とも 35%（上 2–37%、下 62–97%。プレートの間の 25% はそのまま、
  4% 下へ動いただけなので、コアの置き方の式は同じで `coreTop` は 4% 下がる）。面積の差は幅で合わせる: 上は角を
  2 つ、下は 1 つ欠くので、上を 0.7% だけ広くする（40.7% 対 40%）。最初は高さを変えずに幅だけでそろえたが
  （上 48%・下 37.5%）、高さをそろえたいという依頼で改めた。輪・スポークの口・文字の箱はプレートから決まるので
  `geometry.ts` に集め（`RING`・`MOUTHS`・`plateBox`）、Stage と Effects が同じものを読む。単体テストが高さ・面積・
  左右対称を確かめる。
- **プレートに重ねる HTML の光はプレートの輪郭で切る**（利用者の指摘 2026-09-21）。票の着地の閃光（`.flash`）と点灯の
  走査線（`.boot`）は文字の箱（外接する長方形）に敷いていたので、欠いた角まで光っていた。`plateClip` がプレートの
  輪郭を箱の百分率の `clip-path` にし、`--plate-clip` で両方に掛ける。
- コアの六角形は、コアに向いた 3 辺 — 上のプレートの下辺と、下の 2 枚の斜めに欠いた辺 — から**画面上で**
  等距離の高さに置く（`widgets/elec/geometry.ts` の `coreTop`、利用者の指摘 2026-09-21）。盤面は縦横で
  伸び方が違うので、距離はピクセルで測り、盤面の大きさは ResizeObserver の矩形から読む（幅が高さの 2.3 倍
  で約 53%）。試して捨てた位置: 盤面の中央、輪の重心（58%、下に沈んで見えた）、上の下辺と下の上辺の中間
  （45.5%、斜辺は遠ざかる向きに傾いているので上寄りに見えた）。
- 下段の記録: 3 ユニットの声明は
  幅があれば横並び、狭ければ縦積みのカード（左の線と票のチップが票の色）。第 2 回では第 1 回の声明を
  `round 1 · reject` の折りたたみに。
- 用語はチャットに合わせる: `+ new`・`log`・`TX` / `RX` / `rx · reasoning`・`STOPPED` / `TRUNCATED` /
  `DECLINED` / `LINK ERROR` / `NO CARRIER`・`refused`・`no model`・`NO LINK` と `> set up provider`・
  ペイン見出しのバッジは言葉で `deliberating`。送信ボタンは `submit`、議案の欄は `motion · enter to submit`。
- 音: 送信で `stdout`、票ごとに `panel`、決議で可決 `granted` / 否決 `alarm` / 決まらない `glitch`（見ているペインだけ）。
- 立場の編集は設定の AI 欄の `elec system · standpoints`（プレースホルダが既定の立場）。席・規則・回数はペインのバーで。

**見送り**: 自由回答の質問と合意文の生成（4 回目の問い合わせになる。v2 候補）、議案の続き（1 議案 1 審議。
条件を変えるなら編集して再提出）、ツール、ユニット数の可変、票の重み付け。

**テスト**: 単体（`elec.test.ts`: 票の読み取り・決議・席の解決・設定の個別フォールバック・第 2 回の文面と
切り詰め・差分の適用・エクスポート。`elec-service.test.ts`: 偽アダプタと実ファイルで、並列と逐次、差分、
席の写し、無効票、第 2 回、停止、削除、拒否）、e2e（`elec.spec.ts`: プロバイダなしでは何にも触れない、
3 票で可決して再起動後も残る、ペインで選んだ席が設定に残る、第 2 回と票の変化、NO VERDICT と定足数、
Stop とペインを閉じたときの停止）。

### 5.9 GIT ペイン

利用者が選んだリポジトリを 1 ペインに 1 つ、読むだけで映す（v0.0.14 の後、2026-09-23）。変更ファイルの一覧、
選んだファイルの差分、コミットのグラフ。stage も commit もしない（ターミナルでする）。書き込むのは、利用者が
押した FETCH と PULL（fast-forward のみ）だけ（2026-09-30）。

- **リポジトリの指定**: ペインの SELECT REPOSITORY で main がフォルダ選択を開き、`git rev-parse
  --show-toplevel` で最上位を確かめて `git-repos.json` に登録し、16 桁の id だけを返す。ペイン状態は id
  だけを持つので、レイアウトにパスは入らず、別の機械では「知らない id」として選び直しを求める。ペインは
  他のペイン（ターミナルなど）と一切連動しない（利用者の決定、2026-09-23）。複数のリポジトリは複数のペインで。
- **監視と読み取り**（`main/git/service.ts`、Electron に依存しない）: 購読されている間だけ、作業ツリーを
  `fs.watch`（recursive）で見る。git フォルダの中は HEAD・index・refs・packed-refs・MERGE_HEAD などだけを
  合図にし、`index.lock` や objects は無視する（git を実行するたびに変わり、自分の読み取りで自分が起きる）。
  変化の後 300 ms 静まるのを待ち（静まらない書き込みが続いても最初の変化から 1 秒で読む）、1 リポジトリにつき
  1 秒に 1 回まで `status --porcelain=v2 -z`・
  `diff --numstat`（2 回）・（HEAD が動いたときだけ、ヘッダの 1 件）`log -n1` を実行する。前回と同じ内容なら送らない。ポーリングは
  ない。最後の購読者が去れば監視を閉じる（e2e で確認）。一覧にあるファイルが書き直されたときは、行数が同じ
  （差分の中身だけが変わった）でも送り直すので、開いている差分が古いまま残らない。読み取りに失敗した
  （git がない、フォルダが消えた）ときは 30 秒ごとに最初からやり直す。
- **git を安全に呼ぶ**（`main/git/run.ts`）: リポジトリの設定は任意のプログラムを指せる（`core.fsmonitor`、
  外部 diff、textconv、`log.showSignature` 経由の `gpg.program`、clean フィルタ）ので、常に
  `-c core.fsmonitor=false`・`-c log.showSignature=false` と `--no-ext-diff --no-textconv` を付ける。
  clean フィルタは status が触られたファイルを index と比べるときに走るので、リポジトリ自身の設定（global・
  system 以外）にあるフィルタを最初に `git config --get-regexp --show-scope` で調べ、名前ごとに
  `-c filter.<名前>.clean=` などで空にする（`filterGuard`。空のコマンドはフィルタなしとして扱われることを
  実際の git で確かめた。利用者自身の Git LFS などには触れない）。サブモジュールの中の作業ツリーは
  `--ignore-submodules=dirty` で見に行かない（そこでは別の設定で status が走るため。コミットが動いたことは見える）。
  `--no-optional-locks` で status に index を書かせない（利用者の git と index.lock を取り合わない）。
- **FETCH と PULL**（`main/git/sync.ts`、`shared/git-sync.ts`、2026-09-30、利用者の依頼と決定）: ヘッダの 2 つの
  ボタン。どちらも ConfirmButton の 2 回押しで、実行中は拍に合わせて FETCHING / PULLING が点滅する。結果はトーストで、
  短いコード（`PULLED 3 COMMITS`・`FETCHED · 2 COMMITS BEHIND`・`DIVERGED`・`PULL FAILED`）の横に git 自身の
  言葉を添える。読み取りの GitService とは別のモジュールにし、後で push を足すならここに足す。
  - pull は `--ff-only` だけ（`--no-rebase --no-autostash --no-verify-signatures --no-recurse-submodules`）。
    マージコミットもコンフリクトもエディタも起きない。分岐していれば失敗させ、`rev-list --left-right` で
    分岐と分かれば DIVERGED と「ターミナルで merge / rebase を」を出す。main の最後の読み取りで分岐が
    分かっていれば、ネットワークに行く前に断る（`syncBlocked`。ボタンも押せない）。
  - **フックは一切走らせない**: 毎回 `-c core.hooksPath=<userData/git-no-hooks>`（main の空フォルダ）。
    fetch でも `reference-transaction` が、pull では `post-merge` も走り、husky のように `core.hooksPath` を
    作業ツリーの中に向けたリポジトリでは、取り込んだコミットが次に走るプログラムを書き換えられるため。
    e2e（git.spec）で、作業ツリー内のフックが git 単体では走り、ペインからの FETCH・PULL・失敗した PULL では
    走らないことを確かめる（ガードを外すと `reference-transaction` が走って失敗することも確認）。
  - 認証や ssh、プロキシは利用者自身の設定をそのまま使う（それが無ければサインインできない）。端末は無いと
    伝え（`GIT_TERMINAL_PROMPT=0`）、それでも待つ転送は 120 秒で止めて TIMED OUT と言う。
  - main は、そのページが購読しているリポジトリだけ、main 自身の最後の読み取りで `syncBlocked` を確かめて
    （読めていない・merge などの途中・detached HEAD・upstream が無い）、1 リポジトリにつき 1 つずつ走らせる。
    終わったら成否によらず読み直す（`GitService.moved`）。
  `--literal-pathspecs` でパスを模様として読ませない。
- **コミットのグラフ**（2026-09-23、利用者の提案。VS Code のグラフに倣う）: ログは状態に入れず、ページが
  `git.log({ repoId, scope, count })` で頼む（main は `parseLogRequest` で検査し、開いているリポジトリにだけ答える）。
  `log --topo-order -z --decorate=full` で親（`%P`）と名前（`%D`、完全な名前なのでローカルとリモートのブランチを
  スラッシュでなく接頭辞で見分ける。リモートの HEAD は出さない）と本文（2000 字まで）を読む。範囲は既定で HEAD と
  その上流（`@{upstream}`。上流が消えていたら HEAD だけで読み直す）、ALL で `--branches --tags --remotes HEAD`
  （ペイン状態 `graph`）。最初に 100 件、MORE で 100 件ずつ 2000 件まで（1 件多く読んで続きの有無を知る）。この
  リポジトリで 1000 件を読むのに 70 ms。読み直すのは状態の `historyAt` が動いたとき: HEAD が動いたときに加えて、
  git フォルダの refs・packed-refs・HEAD の変化（タグ付けや fetch。HEAD は動かない）で main が更新する。index の
  変化では動かさない。
  - 列と線は純粋関数 `graphRows`（`shared/git-graph.ts`）: 各列は 1 つのコミットを待つレーン。コミットは自分を
    待つレーン（複数なら左端）に置かれ、ほかの待つレーンはそこで合流する。第 1 親は同じレーンを続け（本線が
    同じ列に留まる。`git log --graph` と同じ）、ほかの親は自分を待つレーンに合流するか空いた列を取る。空いた列は
    再利用するので狭いまま。行ごとに上半分と下半分の線を SVG で描き（WebGL は使わない）、色はテーマのトークン
    6 色を巡回する。マージは地の色の輪、HEAD のコミットには輪を重ねる。14 レーンを超える分は右で切る。
  - 行に留まる（350 ms）とカード（`GitCommitCard.svelte`）が出る: ハッシュ・作者・日時・名前・件名・本文（文字と
    して描く）・変更ファイル数と行数（既存の `git.commit` を 1 コミット 1 回だけ頼んで覚える）・親。ペインの中に
    置き、行の下に入らなければ上に出し、ペインの外にははみ出さない（隣の Web ペインのネイティブの面に隠れない）。
    出方は CRT の電源投入（`crt-on` と `crtPower`）。スクロールか離れると消える。
- **差分**: ページはリポジトリ id と相対パスと一覧の名前（staged など）で頼み、main は直前の読み取りに
  その一覧のそのファイルがあるときだけ答える。未追跡は 512 KB までの本文を全行追加として、衝突中は
  マーカーごとそのままを、コミットは `show` で。3000 行を超える分は切る。
- **描画**（`widgets/common/DiffView.svelte`、AI AGENT ペインでも使う）: 行内で変わった部分を、削除行と追加行の
  組の共通の頭と尻を除いた範囲として灯す。別のファイルを選んだら前のファイルの差分はすぐ消す（新しい
  ファイルの名前の下に前の行を出さず、届いた行を「新しく書かれた」と光らせない）。構文の色は highlight.js（利用者の提案）。core と言語は必要に
  なったときに動的 import し、答えの HTML は `lib/highlight.ts` が「class 付きの span とエスケープ済みの
  文字」だけの小さな文法として読み戻して**文字として描く**（HTML として挿さない。`<script>` を含むファイルで
  e2e が確認）。色は highlight.js のテーマではなくテーマのトークン（info・warn・accent など）で、
  Business（Light）でも読めることをスクリーンショットで確認した。
- **画像**（利用者の提案）: PNG・JPEG・GIF・WebP・BMP・ICO・AVIF の変更は差分の代わりに前後の画像を並べる。前後は
  unstaged なら index と作業ツリー、staged なら HEAD と index、untracked は作業ツリーだけ、コミットは親とそのコミット
  （`git show <rev>:<path>` をバイト列で）。拡張子は信用せず、先頭のバイトが画像の形式のもの（`sniffImage`）だけを
  data URL にしてページに渡す（CSP の `img-src data:` のまま）。SVG はテキストとして差分で見せ、画像としては描かない。
  5 MB を超えるものは描かない。
  前後の 2 枚は、左右に並べるか上下に積むかのうち大きく描ける方にする（`pairLayout`、利用者の提案 2026-09-24）。
  差分の本体の大きさは ResizeObserver のエントリから取るので、ペインの大きさが変われば並びも変わる。同じくらいなら
  左右（見比べやすい）。
  どちらかの画像をクリックすると、その側だけが差分の本文いっぱいに出る（`widgets/common/ImageViewer.svelte`、利用者の
  提案）。ホイールでポインタの位置を中心に拡大縮小、ドラッグで移動、ダブルクリックで全体と等倍を行き来し、キー（+ − 0 1、
  矢印、Escape）でも同じことができる。最初は全体が収まる大きさ（小さなアイコンは最大 32 倍まで拡大）で、拡大や移動を
  するまではペインの大きさに付いていく。バーの BEFORE / AFTER で同じ大きさの反対側を同じ位置のまま見比べられ、
  2 倍以上ではピクセルを四角のまま描く。バーの ← か Escape で前後を並べた表示に戻る。計算は
  `lib/image-view.ts`（純粋関数、単体テストあり）。
- **区切りを動かす**（利用者の指示）: 一覧と差分の間（一覧の幅）と、変更ファイルと LOG の間（LOG の高さ）に
  つまみ（`widgets/common/Splitter.svelte`）があり、ドラッグか、フォーカスして矢印キーで動かせる。ダブルクリックで
  既定に戻る。値はペイン状態（`listWidth`、`logShare`）に持つので、ペインごとに別で、再起動しても残る。ドラッグ中は
  画面だけを動かし、離したときに 1 回だけ保存する。既定は一覧の幅 34%、LOG は高さの 3/5（読むものの多くはログ）。
- **開く**: ダブルクリック（差分の行ならその行）で、`settings.json` の `git.openCommand` を
  `{file}` `{line}` `{dir}` を埋めて**プログラムと引数として**起動する（シェルを通さない）。空なら OS の既定の
  アプリ。ただし既定の動作が「実行」になるもの（.exe・.bat・.ps1・.lnk・.app・.desktop など、`runsWhenOpened`）は
  開かずにフォルダで示す（読むだけのペインが、クローンしたての `setup.bat` を走らせないため）。このコマンドはページからの settings.patch では変えられない（launcher の項目と同じく、ページが変え
  られるコマンドはページが起動できるプログラムになる）。Windows では `code` のような .cmd は Node がシェル
  なしで起動しないので、`cmd.exe /d /s /c` に各引数を引用して渡す。ただし cmd.exe が引用の中でも解釈する
  文字（`" % ^ & | < > !`）を含むパスは渡さず、.exe を指すよう伝える。開けるのは、実体をたどってもリポジトリ
  の内側にあり `.git` の中でないファイルだけ（`GitService.locate`）。
- **演出**（変化があったときだけ。待機中は何も動かない）: 状態を受けた瞬間に受信灯が一度灯る、新しい行は
  上から着地し消える行は縦に畳まれる、一覧をまたぐ移動（stage）は同じ行の移動（パスをキーに flip）、
  開いている差分で新しく現れた行だけが蛍光体のように立ち上がる、ブランチが替わったら本体が電源断→投入、
  merge / rebase の途中は共有の拍でチップが点滅。どれも opacity と transform だけで、動きを減らす設定では出ない。

**テスト**: 単体（`git-graph.test.ts`: 直線、分岐と合流、第 2 親の合流、octopus、列の再利用、読んだ範囲の外へ
続くレーン、無関係な 2 つの先端。`git.test.ts`: git 自身の出力での porcelain v2・numstat・name-status・log・
グラフの形式（親・名前・本文）・差分の解析、
行内の変化、分割表示、ページから受け取る値の検査、開くコマンドの組み立て、設定の patch で変えられないこと。
`git-service.test.ts`: 偽の git と時計で、読むきっかけ・静まり待ち・1 秒に 1 回・git の雑用の無視・変化が
ないときは送らない・監視の停止・差分を答える範囲・locate の範囲、.cmd の起動計画）、e2e（`git.spec.ts`:
実リポジトリで編集→stage→commit を外から行いペインが追う、グラフ（ブランチ・マージ・タグ・ALL・カードの本文と
ファイル数・外で付けたタグが出る）、100 件と MORE、コミットの差分、HTML を含むファイルを文字で描く、
設定のコマンドがファイルと行で起動される、リポジトリでないフォルダ、ペインを閉じると監視が止まる）。

### 5.10 ORBIT ペイン

管制室の正面スクリーン（グラウンドトラック）に倣う、正距円筒図法の世界地図（v0.0.14 の後、2026-09-23）。昼夜、
時計が変わる線、名目ゾーンの時刻の目盛り、ISS と天宮の現在位置と軌跡、観測地点への次のパス、ヘッダに GMT の
「通日/時:分:秒」と世界の時計。Starlink は ON にしたときだけ。

- **軌道要素**（`shared/orbits.ts`、`main/orbits/service.ts`）: CelesTrak の GP データを main が取る。位置は取らず、
  要素だけを取ってページで SGP4（satellite.js）で計算する。CelesTrak の利用ポリシー（2026-09-23 に確認）: 更新は
  2 時間ごと、1 回の更新につき 1 回まで、200 以外が返ったら直ちに問い合わせをやめること。そこで、stations
  （ISS と天宮、OMM JSON 9 KB）は 12 時間、starlink（TLE 約 1.8 MB、10,689 機）は 24 時間より古くならないと取らず、
  ペインが見せている間だけ、ディスクの写しを再起動をまたいで使い、200 以外の後は 24 時間（ネットワークに届かない
  ときは 1 時間）何も聞かない。この「聞かない」も写しに入れるので、再起動で回避されない（単体と e2e で確認）。
  ページに渡すのは SGP4 が読む数値と日付、TLE の 2 行だけ（`readStations`、`readTle` で検査）。Space-Track は
  アカウントが要り共有不可、Open Notify は HTTP のみ、SpaceX API は停止、wheretheiss.at は規約がない、として不採用。
- **satellite.js の入口**: 7.x の唯一の入口が WebAssembly 版（トップレベル await と node:worker_threads）も
  再エクスポートし、worker のバンドルが作れない。`lib/sgp4.ts` が JavaScript 版のファイルを直接読み込む。
- **地図データ**（`npm run gen:orbit-map`）: 陸地は Natural Earth 50m を 0.5° 格子のビットマスク（42 KB）に。
  時計が変わる線は timezone-boundary-builder 2026d（with-oceans-now、ODbL）から作る（利用者の選択。Natural Earth の
  時間帯は 2012 年時点のオフセットで、カザフスタン 2024、グリーンランド 2023 などが古い）。各ゾーンにその年の
  1 月と 7 月の UTC オフセットを Intl で割り当て、0.25° 格子に塗り、隣と時計が違う所だけを線にして簡略化した
  SVG パス（91 KB、58 通りの時計）。名前が違うだけのゾーン境は描かれず、夏時間だけ違う所（アリゾナ）は描かれる。
  ODbL の表記はペインと `tz-lines.json` 自身が持つ。
- **描画**（`widgets/orbit/draw.ts`、2D canvas）: 下地（点描の陸・経緯線・時計の線）は大きさかテーマが変わった
  ときだけ、夜は 1 分ごと、動くもの（軌跡・局・Starlink・目盛り）は `onBoundary(1000)` で毎秒。夜は -18° まで
  なめらかに暗くする（段階で塗ると極の周りに帯が出た）。暗いテーマでは夜をそれ以上暗くしても見えないので、
  昼側をアクセント色で薄く照らす。明るいテーマでは夜を薄く陰らせる。軌跡は地球の影の中を暗く点線で。
  Starlink（10,689 機）は、SGP4 の記録作り 76 ms・全機の配置 51 ms（実測）を一度にやると引っかかるので、
  毎秒の描画で 1,100 機ずつ配置し、各機は約 10 秒ごとに動く（10 秒で点の幅も動かない）。最初は blob の
  Web Worker にしたが、開発サーバーでは Vite が Worker を URL で配り CSP（`worker-src blob:`）に拒否され、
  blob の Worker からはモジュールを import できないため、開発時に点が出なかった（利用者の報告）。Worker を
  やめ、開発とビルドで同じ道を通るようにした。
- **ツールチップ**（利用者の提案）: ISS・天宮に 14 px、Starlink の点に 6 px まで近づくと、名前、NORAD 番号、
  位置、高度と速度、日照か影か、軌道傾斜角と周期、要素の古さ（追う局は観測地点への次のパスも）を出す。
  カーソルが止まっている間も毎秒追従する。ペインが縦に長いときは中身を上下中央に置く。
- **観測地点**: 天気ペインの地点は日本では気象台コードで緯度経度を持たないため使わず、ORBIT が自分のペイン状態に
  同梱の都市リスト（GeoNames）から選ぶ（利用者の「天気ペインと疎結合に」を、共有部品もなしで満たす）。既定は
  システムのタイムゾーンで最大の都市。位置情報は求めない。

**テスト**: 単体（`orbits.test.ts`: CelesTrak の実データでの読み取りと拒否、`orbit-service.test.ts`: 偽の時計で
取得の間隔・Starlink は見せている間だけ・拒否の後 24 時間・再起動をまたぐ写しと拒否、`orbit-astro.test.ts`: 夏至の
太陽直下点・通日の時計・名目ゾーンの時刻・ISS の高度と速度・影・東京へのパス）、e2e（`orbit.spec.ts`: CelesTrak の
代役で、stations を 1 回、Starlink は ON にしたときだけ、再起動で取らない、403 の後は取らない、ペインを閉じると
手放す、観測地点を都市リストから選ぶ）。

### 5.11 AI AGENT ペイン（実験的）

このマシンで動いているコーディングエージェントのセッションを、そのエージェント自身のローカルの記録から読む
（v0.0.14 の後、2026-09-23）。今は Claude Code だけ。記録は公開仕様ではないので、ピッカーの説明とペインに
「実験的」と出す（利用者の指示）。

- **中間層**（利用者の指示）: ページは `window.elecdex.agents` で main の `AgentHub`（`main/agents/hub.ts`）だけを
  呼ぶ。ハブは設定 `agents.sources` にあるソースだけを動かし、どのソースの記録かを知らないまま一つの形
  （`AgentBoard`）にまとめる。ソースは `AgentSource`（found / start / stop / sessions / diff）の実装で、
  Claude Code は `main/agents/claude/`。別のエージェントは、ソースを一つ足して `AGENT_SOURCE_IDS` に載せる。
- **Claude Code の記録**（2.1.28x で確認）: `sessions/<pid>.json`（動いているセッション 1 つにつき 1 つ。名前、
  フォルダ、`busy` などの状態）、`projects/<フォルダ>/<セッション>.jsonl`（会話の全文。ツールの出力を含み、
  1 行 1 MB を超えることもある）、`file-history/<セッション>/<名前>@vN`（そのセッションが初めて変える前の
  ファイルの写し。`@v1` がセッション前）。
- **負荷**（実測、この PC の 75 ファイル）: 最大の記録 124 MB を全部解析すると 944 ms、末尾 64 KB は 0.27 ms。
  記録の増え方は中央値 17.6 KB/分、上位 10% で 160 KB/分。そこで、sessions フォルダと projects フォルダを
  fs.watch で見て、記録が増えたら 400 ms 待ってから、前回の続きだけを 1 MB ずつ非同期に読む。32 MB を超える
  記録は末尾 512 KB から読み、数が「recent」だと示す。モデル自身の行（`"role":"assistant"`）、タイトル、
  file-history の行だけを JSON として解析し、ツールの結果は文字のまま読み飛ばす。ペインがないときは何も
  見ない。落ちたプロセスは sessions のファイルが残ることがあるので、pid の生存を開いている間 1 分ごとに確かめる。
- **差分**: セッションが変えたファイルは、`@v1` の写しと今のファイルを行単位の Myers 差分（`shared/text-diff.ts`、
  4000 行を超えて違うときは打ち切って全体を見せる）で比べ、GIT ペインと同じ `DiffView` で描く。ページは
  ファイルを main が渡した鍵（パスのハッシュ）で頼み、main は自分の記録にある鍵にだけ答える。
- **サブエージェントとバックグラウンドタスク**（2026-09-23、利用者の指示）: カードの下に、そのセッションが起動した
  サブエージェント（待ち合わせるものも、バックグラウンドのものも）と、バックグラウンドで動かした Bash / PowerShell を
  1 行ずつ出す（RUN / DONE / FAIL / STOP、不明は —）。終わったものは 10 分残す（`ENDED_KEPT_MS`）。
  セッションから枝分かれするツリーで描き、実行中のものは常に見せ、終わったものは「4 FINISHED 3 DONE 1 FAIL」の
  1 行に畳む。開いているセッションはペイン状態 `finished`（id の配列。盤面から消えた id は書くときに落とす）
  に持つ（2026-09-30、`widgets/agents/task-tree.ts`）。記録での形
  （2.1.280 で確認）:
  - 起動は親の記録のツール呼び出し（`Agent`、旧名 `Task`。`run_in_background: true` の Bash / PowerShell）。
  - バックグラウンドの終わりは親の記録の `<task-notification>`（混んでいるときの `queue-operation` の enqueue と、
    渡されたときの `origin.kind: task-notification` の user 行。どちらも小さい）。`<tool-use-id>` で呼び出しに結び（`<tool-use-id>` は同じタスクの最初の通知にしか付かない。2 通目以降は `<task-id>` だけなので、起動の結果で覚えた id で結ぶ。止まっては動き出すサブエージェントの最終通知がこれで、別 PC の報告で見つかった。2026-09-24）、note が「background work of its own still running / may be interim」の中間通知では終わりにせず、
    `<status>` の completed / failed / stopped / killed を読む（running は途中経過なので読まない）。時刻の新しい
    通知が勝つ。続きを頼まれたサブエージェントは、その記録が通知より先へ進んだら RUN に戻す。
  - 呼び出し自身の結果も読む（レビューで分かった、通知の来ない終わり方: この PC の記録で TaskStop で止めた
    3 件には通知がなかった）。結果を待っているタスクの id が記録自身の引用符で書かれた行だけを解析するので、
    ほかのツール結果は今までどおり読み飛ばす。`is_error` は失敗、そのうち `[Request interrupted…]` は停止。
    起動の結果の `Command running in background with ID: X` と `agentId: X` を覚え、`TaskStop`（`task_id`）が
    それを名指ししたら停止。`Async agent launched` はバックグラウンドの印（meta を待たずに分かる）。
    待ち合わせるサブエージェントは、その報告（結果）で完了。取りこぼしたときの予備として、親が次の回答を
    始めた時（`message.id` が変わった時）にも完了とする。1 回の回答はブロックごとに複数の行に書かれるので、
    行ではなく回答で数える。この PC の全記録（100 件）で、終わり方の分からないタスクは残らなかった。
  - 表示の上限: 動いているタスクは全部、終わったものは合わせて 12 件まで。変更ファイルは 60 件までで、
    サブエージェントのファイルは 20 件の枠を持つ（多く書くサブエージェントがセッション自身のファイルを
    押し出さない）。見つからないサブエージェント（拒否された呼び出しなど）は一度だけ探し、あとはフォルダの
    変化で見つける。ペインが閉じた後に終わった読み取りは何も知らせない（ハブも、購読がなければ送らない）。
  - サブエージェントの中身は `projects/<フォルダ>/<セッション>/subagents/agent-<id>.jsonl`（親と同じく前回の続き
    だけを読む）と `agent-<id>.meta.json`（`toolUseId` と `requestShape`。このアプリでは引数なしでも
    background になるので、こちらで判断する）。親の記録に見つかっていないサブエージェントが出たときと、
    subagents フォルダの変化で探す。
  - セッションのプロセスが消えたとき動いていたものは、推測で完了とせず「不明」にする。
  - サブエージェントが変えたファイルもセッションの変更ファイルに入れ、SUB と印を付ける。Claude Code は
    サブエージェントの編集の前の写しを file-history に残さない（この PC の記録で確認）ので、その差分は
    「写しがない」と出す。
- **一覧と差分の区切り**（利用者の指示）: GIT ペインと同じく、広いペインでは一覧と差分を横に並べて一覧の幅を、
  狭いペインでは縦に積んで一覧の高さを、つまみで動かせる。値はペイン状態（`listWidth`、`listHeight`）。一覧は
  スクロールする領域なので、幅のつまみは差分の左端に置く（一覧の中に置くと半分が切れて掴めなかった）。
- **テスト**: e2e は既定で `ELECDEX_CLAUDE_DIR` を存在しないフォルダに向け、この PC の記録を決して読まない。

**テスト**: 単体（`agents.test.ts`: 記録の読み取り、タスクの起動と終わり（通知、次の回答、引用された通知では
終わらないこと、再開）、サブエージェントの記録とメタ、途中の行、巨大な行を解析しないこと、写しの選び方、
実ファイルでのソース（生きているプロセス、死んだプロセス、追記分だけを読む、@v1 との差分）、ハブが設定の
ソースだけを動かすこと。`text-diff.test.ts`）、e2e（`agents.spec.ts`: 架空のフォルダで、カード、追記への追従、
サブエージェントとバックグラウンドのコマンドの行と、その終わり、
ファイルの差分、設定での ON/OFF、ペインを閉じると読まない）。

### 5.12 Wi-Fi ペイン

接続している Wi-Fi のどこで問題が起きているかを示す（2026-09-25、利用者の依頼）。目的は二つ：ビデオ会議の
品質が悪いときの原因調査（自分か、上りか下りか、無線か回線か）と、新幹線の Wi-Fi がよく切れる原因の調査。
ピッカー名は "Wi-Fi status"、ペインの見出しは WI-FI。既定のレイアウトには入れず、network プリセットに入れる。

- **取れるもの / 取らないもの**: Windows 11 24H2 から、BSSID を返す API（`WlanGetNetworkBssList`、
  `WlanGetAvailableNetworkList`、`WlanScan`、`WlanQueryInterface` の `current_connection` = opcode 7）は位置情報の
  許可がないと `ERROR_ACCESS_DENIED` になり、許可を求めるダイアログの対象になる（この PC は位置情報が端末全体で
  拒否で、実際に opcode 7 は 5 を返した）。elecdex は位置情報を求めない（[decisions.md](decisions.md)「位置情報の許可ダイアログ」）ので、
  **BSSID と周辺 AP のスキャンは対象外**（利用者の決定）。それ以外は位置情報なしで取れることをこの PC で確かめた：
  SSID は WinRT の `WlanConnectionProfileDetails.GetConnectedSsid`（Microsoft が位置情報なしの代替として案内する
  もの）、認証・暗号・疎通（キャプティブポータルは `ConstrainedInternetAccess`）・従量制は WinRT の接続プロファイル、
  RSSI・チャネル・無線のオンオフ・バックグラウンドスキャン・メディアストリーミングモードは wlanapi の各 opcode、
  規格・リンク品質・送受信レート・周波数・MLO は `wlan_intf_opcode_realtime_connection_quality`（opcode 19、24H2 から）、
  再送などのフレームカウンタは `WLAN_STATISTICS`、アドレス・ゲートウェイ・DNS・MTU・DHCP のリースは .NET。
  単体テストがスクリプトに禁止 API と opcode 7 が無いことを確かめる。
- **カウンタ**: Intel AX211 は `WLAN_STATISTICS` の 6 つの PHY 全部に同じ値を入れるので、足さずに各カウンタの
  最大を取る。**再送率**は送信フレームが 1 秒 100 以上のときだけ出す。アイドルのリンクは 1 秒に数十フレーム
  （キープアライブや省電力のポーリング）しか送らず、その半分が再送される（この PC、-55 dBm で 54%）。
  そのまま出していたら、何も悪くないのに RADIO と判定した。診断は直近 10 秒の合計で判断する。
- **ping の共有**（利用者の指摘）: ネットワーク状態ペインの ping と Wi-Fi ペインのインターネット側の ping は同じ
  相手（1.1.1.1）なので、一つの往復を両方が読む。main では打たない（main はブラウザプロセスで、止まると描画が
  止まる。Node に ICMP はない）。Windows はサンプラーの `probe` という種類で、Wi-Fi ペインが見えていれば毎秒、
  ネットワーク状態だけなら従来どおり 5 秒ごと。ゲートウェイへの ping は Wi-Fi ペインが見えているときだけ。
  Linux / macOS は `ping -i 1` を相手ごとに 1 本だけ常駐させて行を読み（`wifi/ping-stream.ts`）、ネットワーク状態の
  ping はそれが動いている間はその値を使う（`peek`、自分では起動しない）。
- **サンプラー**: 種類 `wlan`（毎秒）、`probe`（毎秒）、`wlanlog`（5 秒ごと）。WLAN の C# は、初めて必要になったとき
  に一度だけコンパイルする。接続プロファイルとアドレスは接続が変わったとき（状態かチャネルの変化）と 10 秒ごとに
  だけ読み、毎秒読むのはバイトカウンタだけ。ループはスリープの長さを固定せず、次の壁時計の秒まで待つ。
- **文字コード**（見つけた不具合）: サンプラーの PowerShell は出力をコンソールのコードページ（日本語 Windows では
  Shift-JIS）で書いていた。ログの切断理由は日本語なので、「ソ」(0x83 0x5C) の 2 バイト目がバックスラッシュとして
  次の引用符をエスケープし、その行全体が JSON として読めず、読み取りごと消えていた。プロセス名などの非 ASCII も
  文字化けしていた。出力を UTF-8 にした（`[Console]::OutputEncoding`）。
- **ログ**: `Microsoft-Windows-WLAN-AutoConfig/Operational` の 8001（接続）・8002（失敗）・8003（切断）を、最初は
  過去 24 時間分、以後は新しいレコードだけ読む（管理者権限は不要）。レコードには BSSID も書かれているが、
  スクリプトは名前を指定したフィールドだけを出す。Linux / macOS は OS のログを読まず（`no-log`）、ペインが自分で
  見たものだけを出す。
- **見えている間だけ**: どちらの source も `keepWhileHidden` に入れない（利用者の決定：非表示中の記録は不要）。
  履歴はページの `wifiHistory` が最大 60 分持ち（ペインを動かすと再マウントされるため、ペインの外に置く）、
  見ていなかった時間はタイムラインに空白のまま残す。切断は OS のログが残っているので、表示したときに過去 1 日分を補う。
- **プラグイン**: `net.wifi` と `net.wifi.events` は `PRIVATE_METRIC_SOURCE_IDS` に入れる（利用者の決定）。
  ネットワーク名と 1 日分の接続の記録は、どこにいたかに近い情報だから。
- **診断**（`diagnose`、純粋関数）: 経路を PC → RADIO → GATEWAY → INTERNET の区間に分け、直近 1 分で判定する。
  順に、無線オフ・未接続、キャプティブポータル、上りの喪失（ゲートウェイは応答するのにインターネットへの ping が
  4 回続けて失われた：新幹線のトンネルなどで車両の上り回線が切れた状態）、そして機械に近い区間から：無線（RSSI
  -67 / -75 dBm、再送 15 / 30%）、ゲートウェイ（RTT 20 / 60 ms、ジッタ 10 / 30 ms、損失 1 / 5%）、自分の上り
  （500 kB/s 以上送っていて、RTT と相関 0.6 以上）、インターネット（RTT 120 / 250 ms、ジッタ 30 / 60 ms、損失 1 / 5%）。
  近い区間の問題はその先のすべてに現れるので、近いほうを先に疑う。ping に一切応答しないゲートウェイは損失と
  みなさない。しきい値は `WIFI_LIMITS` の一か所。**MOS** は ITU-T G.107 を簡略化した E-model の推定値
  （RTT + 2×ジッタ + 10 を実効遅延とし、損失 1% ごとに R を 2.5 下げる）。通話の音声の目安であって測定値ではない。
- **イベント**: OS のログに加え、履歴から次を導く：接続したままチャネルが変わった（別のアクセスポイントへの
  乗り換え。BSSID は見ないので推定）、上りの喪失と回復、サインインページの出現。切断の間隔がほぼ一定なら
  「〜分ごと」と出す（サービスの接続時間の上限を疑う）。遅延スパイクが一定間隔なら同様に出す（バックグラウンド
  スキャンを疑う）。
- **画面**: 見出し行（SSID、状態、MOS、MASK、COPY）、経路の帯（4 つの局と間の線、判定の 1 行、直近 60 秒の
  ping のリボン）、電波（弧のゲージ、2.4 / 5 / 6 GHz の帯にチャネルと DFS 帯、規格の六角形、PHY レートのバー）、
  タイムライン（信号・再送・RTT・損失・通信量・イベントのレーン、1 / 5 / 15 / 60 分、クロスヘア）、ログ、詳細
  （L2・L3・アダプタ・カウンタと毎分の増分）。高さが足りないときは電波・タイムライン・ログ・詳細をタブにする
  （`wifiSections`）。network プリセットでは本体が約 620×455 になりタブになる。前面に出すと全部を縦に並べる。
- **負荷**（実測、i5-1335U、1920×1080、スタブ）: ペインのページ側は時計に置き換えた場合と比べて約 1.3% 増、
  サンプラーは Wi-Fi を読むと 1.25% → 2.11%（実機の Wi-Fi）。最初は ping ごとに線の上を滑る 0.7 秒の CSS
  アニメーションを 3 本走らせていて、それだけで 10.6% かかった（毎秒の大半、コンポジタが画面の速度で描き
  続ける）。パケットは毎秒 1/4 ずつ進む表示に変え、再描画は 1 秒に 1 回になった。
- **広い画面と説明**（2026-09-25、利用者の指摘「前面に出すとスカスカ」と依頼）: 前面に出した広いペイン（幅 1100px 以上で縦に並べられるとき、`wifiSections().wide`）は 2 列になる。上段は経路の帯・判定・リボンの横に電波、下段はタイムラインを全幅に、その下にログと詳細を並べる。局の間の線には、その区間の直近 1 分をスパークラインで載せる（RADIO の線は信号、GATEWAY と INTERNET の線は往復時間）。広いときに線が長く伸びても、何もない空白にしないため。タイムラインでは、ペインが見ていなかった区間に斜線を引き「NOT WATCHED」と書く（空白が回線の断にも描画の故障にも見えたため）。ログの上には OS のログから求めた過去 24 時間の接続の帯（`availability`、純粋関数）。詳細のカウンタには毎分の増分を棒で添える（フレーム数は多いほうの方向に対して、問題系は送信フレームに対する割合で、50% で満杯）。
- **凡例とカード**: 判定の下に 1 行の凡例（`18 ms ±2` の読み方、損失、色の意味、リボンの 1 マス）。専門的な項目にはポインタを置くと説明カードが開く（`HintCard.svelte`、文言は `hints.ts`）。内容は、何か・どう読むか・判定に使うしきい値・今の値（NOW）。しきい値は `WIFI_LIMITS` から引用して書き直さないので、説明と判定がずれない。ペインに一つのリスナーを置いて `data-hint` の要素に反応し、少し静止してから開く（ポインタが横切っただけでは開かない）。単体テストが、マークアップ上のすべての `data-hint` にカードがあることを確かめる。
- **原因の局を目立たせる**（2026-09-25、指摘を受けて）: 判定が指す局（`culpritStation`、純粋関数）の板を、その色で塗りつぶして 1.18 倍にし、数値も同じ色にする。network プリセットの狭い枠でも、文字を読む前に目が行くようにするため。transform で拡大するので周りは動かず、アニメーションもしない。
- **デモ**（`npm run demo:wifi`）: `train` スタブの 9:16 の撮影（ショート動画向け）。時間で決め打ちせず、判定が UPSTREAM LOST になるのと、ログにハンドオーバーが出るのを待つ。途中でポインタを INTERNET の局・判定・ハンドオーバー・タイムライン・MOS に置き、説明カードをその時点の値で開く。開始から終了まで約 45 秒。
- **文字の大きさ**（2026-09-26、利用者の提案を採用）: ペイン内では役割で段を分ける。**本文** `--step--1`（1080p で 12px）は普段読むもの：局名と局の数値、判定の根拠、状態語、タブ・ボタン・チップ、ログの行、詳細の値、チャネル・レート・注意書き、タイムラインの窓ボタンとクロスヘアの読み。**補助** `--step--2`（10px）はラベル類：凡例、MOS の見出し、詳細の項目名、帯域図の目盛り、ゲージの単位と等級、limits の行、件数。**強調**は SSID、MOS の数値、原因名（`--step-0` / `--step-1`）。以前は本文までほぼ `--step--2` で、狭い枠（26rem 未満）では局名と数値がさらに一段下がっていた。狭い枠では字を小さくせず、板を細くし、長い数値を省略する。`tokens.css` の定義は変えない（他のペインに影響するため）。固定 px は、ゲージの dBm（26）と規格の六角形（17）を除いてトークンに揃えた。キャンバスに描く文字（レーン名、目盛り）は対象外。e2e が、本文と補助の大きさを、狭い枠も含めて確かめる
- **複数のアダプタ**: ヘッダーの下に、信号バー付きのチップとして並べて切り替える（選択はペインの状態）。ゲートウェイへの ping は、接続中のアダプタそれぞれのゲートウェイに打つ（`WifiProbe.gateways`、最大 4）。そのため、表示を切り替えるとそのアダプタ自身のゲートウェイの値になる。インターネット側の ping は OS の既定の経路で出るので、どのアダプタを表示していても同じ。履歴もアダプタごとに持つ（`wifiHistory.byLink`）ので、切り替えた瞬間からそのアダプタの時系列を出せる。スタブ `dual` が 2 枚目（2.4 GHz の USB アダプタ）を返す。
- **テスト**: 単体（`wifi.test.ts` は判定・統計・イベント・レポート、`wifi-hints.test.ts` はカードの網羅・しきい値の引用・NOW・スパークライン・未記録区間、`wifi-readers.test.ts` は各 OS のパーサ・
  禁止 API・UTF-8・ping ストリーム・スタブ）、コンポーネント（`wifi-widget.test.ts`）、e2e（`wifi.spec.ts`、
  `hidden-panes.spec.ts`）。e2e は `ELECDEX_WIFI_STUB=1`（`train` は 40 秒ごとに 8 秒上りを失い、30 秒ごとに
  チャネルが変わる）で、実機の Wi-Fi を読まず、ping も外に出さない。スクリーンショットとデモは `demo`。
- **未検証**: Linux（`iw`、`/proc/net/wireless`、`/sys/class/net`）と macOS（`system_profiler`、10 秒ごと。
  ネットワーク名は macOS 14.4 から位置情報サービスなしでは `<redacted>`）は、パーサを単体テストしただけで
  実機では確かめていない。

### 5.13 ポップアップ（レイアウトに載せないペイン）

ウィジェットを 1 つ、レイアウトのツリーに入れずにワークスペースの上へ出す。枠は × だけで、ズーム・ドラッグ・分割・タブはない。閉じればレイアウトは開く前のまま。動機は Ctrl+Shift+L: ランチャーが無いレイアウトではランチャーペインを右に**常設で追加**していたため、アプリを起動したいだけで分割が変わり、閉じるまで残った（2026-09-26 利用者の提案）。

**構成**（疎結合。レイアウトのストアは一切知らない）:
- 判定は純粋関数（`layout/popup.ts`）: ピッカーの配置 `PickerPlacement`（レイアウトの `PanePlacement` に `'popup'` を足した、ピッカーだけの型）、選んだときの動作 `pickerChoice`（focus / add / popup / none）、行の表示 `pickerRowState`、ペイン id `popupPaneId`（`popup:<widget>`。レイアウトの id とは別の空間）
- 状態は `ui.popup`（ウィジェット id か null）。**ダイアログの 1 つ**として `ui` に置く。別ストアにすると、ダイアログの排他（どれかを開けばほかは閉じる）のために `ui` とそのストアが互いを参照することになるため。排他は `ui.clearFor` 1 か所にまとめた（それまでは各 `open*` が閉じる相手を手で並べていた）。`dialogOpen` に含まれるので、背後のレイアウト操作は止まり、Web ペインのビューはスナップショットに退く
- 描画は `layout/PopupPane.svelte`（App に 1 つ）。ダイアログと同じ `crt-on` / `crtPower` / `backdropShade` / `dialogDelay` で電源が入り、切れる。ウィジェットには `visible` と `active` を常に true で渡し、メトリクスの購読はペインと共通の `holdWidgetMetrics`（`layout/widget-metrics.svelte.ts`。PaneHost から切り出した）。閉じたら `paneMeta` を消し、キーボードを開く前の要素（ショートカットを押したシェルなど）へ戻す
- 閉じ方: ×、Escape（ポップアップ自身が捕まえる）、背景のクリック、ほかのダイアログ、ウィジェットの `ondone`

**ウィジェットの状態**（`stores/widget-state.svelte.ts`）: ウィジェットは自分の選択（表示の切り替え、選んだリポジトリ、電卓のテープなど）を、どこに出ていても `widgetState.patch(paneId, change)` で書く。レイアウトのペインの id ならそのまま `layout.patchPaneState` に渡し（従来どおりノードに保存）、`popup:` の id ならメモリに持つ。ポップアップの状態はウィジェットごとに 1 組で、アプリが動いている間だけ残る（閉じて開き直すと前の選択のまま。保存はしない）。マージは `layout-ops` の純粋関数 `mergePaneState` を両方で使う。ウィジェットはどちらに出ているかを知らない。

**出せるウィジェット**: 登録の `popup: true` だけ（既定は出さない）。組み込みのうち次の 3 つを除くすべて（27 種）。
- シェル: 誰も持たないセッションとして 4 秒後に刈られる
- タイマー: カウントダウンの終わりはマウントされているウィジェットが知らせるので、閉じると鳴らなくなる
- ファイル: レイアウトのシェルに追従し、そのペインへフォーカスを移す

Web ペイン（ビューが `reapOrphanSessions` に閉じられ、ポップアップ自身が被覆で隠れる）とプラグイン（`ctx.views` とペインの保存領域がペイン id に結び付いている）も対象外で、別の設計が要る（利用者の判断で見送り、2026-09-26）。`tests/unit/popup.test.ts` がソースを読んで、宣言したウィジェットとそれが読み込む自前のファイルがレイアウトのストアにも `patchPaneState` / `setPaneState` にも触れないこと、除外が上の 3 つだけであることを確かめる。

**ポップアップの上に開くダイアログ**: 天気の地点選択だけ（`ui` の `OVER`）。ペインが自分のために開く問いで、ポップアップが出ている間に開けるのはポップアップのウィジェットだけなので、ポップアップを閉じずにその上に開き、答えると戻る。その間は `ui.popupOnTop` が偽になり、Escape とランチャーのショートカットは地点選択のもの（Escape は 1 回で 1 つ閉じる）。設定を開くボタン（AI チャット・ELEC・地震）は従来どおりポップアップを閉じて設定に替わる。

**ピッカー**: 配置に `▣ pop up` を足した（Tab で巡回）。出せないウィジェットは一覧に残したまま「pane only」と薄く示し、選んでも何もしない。単一インスタンスでレイアウトにすでにあるものは、どの配置でもそのペインへフォーカスする（2 つ目を作らない従来の規則のまま）。

**ペインを呼び出すショートカット**（`layout/summon.ts`、2026-09-27 に Ctrl+Shift+U を足すとき、ランチャー専用だった処理を共通にした。利用者の依頼: 今後ほかのペインにも同じ形で割り当てられる基盤に）: `SUMMONS` にキー操作とウィジェットの組を 1 行足し、キーは shared/keybindings.ts に置く（今は `launcher.focus` → launcher、`utility.focus` → utility）。行き先は純粋関数 `summonChoice` が決める: レイアウトにそのウィジェットのペインがあればそこへ（`layout.focus` が裏のタブを前に出し、前面表示中なら切り替える。別のポップアップが出ていれば閉じる）。複数あれば、そのうちの 1 つにフォーカスがあるときは次へ（最後の次は最初）。無ければポップアップで開き、もう出ていれば `again`。呼ばれたことは `ui.summon` でペイン id とともに伝え、ウィジェットは `onSummoned`（lib/summoned.svelte.ts）で受けて、何をするかは自分で決める: ランチャーは検索欄を選択状態にしてキーボードを取り、UTILITY はフォーカスを取り、`again` なら `ondone` で閉じる（トグル）。共通部はどちらも知らない。受け取りはマイクロタスク 1 つ遅らせる（ポップアップは開いたときのフォーカスを覚えて閉じるときに戻すので、マウント中にフォーカスを取ると、戻り先がウィジェット自身になって行き場を失った。e2e で見つけた）。直前 2 秒以内の要求は、それに応えてマウントしたペインにも届く（古い要求はレイアウトのリセットで戻ったペインにフォーカスを奪わせる）。呼び出しのキーはポップアップの上でだけダイアログ越しに通す（別のウィジェットのポップアップと入れ替わる）。ほかのダイアログの上では効かない。ウィジェットは `popup: true` でなければならない（単体テスト `summon.test.ts`）。

**起動したら閉じる**: ランチャーは起動に成功すると、タイルの点滅（600ms）が終わってから `ondone` を呼ぶ。ポップアップはそれで閉じ、レイアウトのペインには `ondone` を渡さないので残る。ウィジェットはポップアップかどうかを知らない。アンマウント後に終わった点滅では呼ばない（その間に開いた別のポップアップを閉じてしまうため）。

**しないこと**（Phase 1）: 位置・大きさの保存、複数のポップアップ、ポップアップをレイアウトに定着させるボタン。`shell.focus`（Ctrl+Shift+S）はシェルが無ければ従来どおり追加する。ターミナルは常設で使う方が多く、ポップアップではセッションが刈られるため。

**テスト**: 単体（`popup.test.ts`: 選択・行の表示・出せるウィジェットの条件、`layout-ops.test.ts`）、コンポーネント（`dialog-motion.test.ts`: 排他、`closedAt`、レイアウト切り替えの問いへの no、地点選択が上に開くこと、`widget-state.test.ts`: 振り分けとマージ）、e2e（`tools.spec.ts`: ショートカットでポップアップ・layout.json 不変・押し直し・Ctrl+Shift+W が効かない・Escape でシェルへ戻る・起動で閉じペインは残る、`panes.spec.ts`: ピッカーの配置と pane only と設定ダイアログによる排他・出せる全ウィジェットが開いて閉じ、ページのエラーが無く layout.json も変わらないこと・選択が次に開いたときに残ること・天気の地点選択、`motion.spec.ts`: 電源オフ）。

### 5.14 クリップボードペイン（履歴）

直近にコピーしたものを並べ、選んでクリップボードへ戻す（2026-09-26、利用者の依頼。利用者が別の AI と作った設計案を参考に、elecdex の規則と実測に合わせて作り直した）。ピッカー名は "clipboard history"、見出しは CLIPBOARD。既定のレイアウトには入れず、desk プリセットと dev プリセット（タブの前面）に入れる。貼り付けの代行（キー送信）はしない。OS のクリップボード履歴（Win+V など）とは同期しない。

- **読む場所は main**: Electron の `clipboard` は main（とページ）にしかなく、utilityProcess には無い。サンドボックスのページには読ませない（ページが読めるのは右クリック貼り付けの `navigator.clipboard` だけで、履歴は main のもの）。Electron 44 のクリップボード API は非同期（`read()` / `readText()` / `write(ClipboardItem[])`、同期の `readHTML` / `readImage` / `availableFormats` は無くなった）。実測（i5-1335U）: 1 回の `read()` と `getType('text/plain')` は壁時計で 0.2〜0.5 ms、そのうち main のスレッドを止めるのは 10 µs 前後。1920×1080 の PNG の `getType` は 8.4 ms（同期部分 21 µs）
- **いつ読むか**: 見えているクリップボードペインが 1 つ以上あり、PAUSE でないときだけ。ペインは `seen` の間だけ購読し（裏のタブ、最小化、格納中は解除）、main は購読者がいる間だけ読む（`ClipboardWatcher.sync`）。見えていない間にコピーされたものは残らない。読み始めに 1 回読むので、表示した瞬間にクリップボードにあるものは一覧に入る（それ以前のコピーは入らない）。`keepWhileHidden` の対象外で、hidden-panes の e2e が裏のタブと最小化で `clipboard.watching()` が空になることを確かめる
- **間隔**: 壁時計の 250 ms 境界（`BoundaryTimer`、main/boundary-timer.ts）。タイマーは 1 本で、見るたびに次の境界へ張り直す（`setInterval` は使わない）。前の読み取りがまだ終わっていなければその境界は飛ばす（重ねない）。100 万文字以上のテキストが載っている間は 2 秒に 1 回（読むたびに全体を複製するため、`shouldReadText`）。Windows で変化を通知で受けるには `AddClipboardFormatListener` とウィンドウハンドルが要り、Electron は出していないので、ポーリングにした。main の CPU はペインありとなし（時計）で 20 秒平均 0.78% と 0.78%、差は測れなかった（実機のクリップボード、約 11 kB のテキスト）
- **非公開の印**: パスワードマネージャーはコピーに「履歴に残すな」という形式を添える。Windows の `ExcludeClipboardContentFromMonitorProcessing`・`Clipboard Viewer Ignore`・`CanIncludeInClipboardHistory`（DWORD、0 なら除外）、macOS の `org.nspasteboard.ConcealedType` / `TransientType`、KDE の `x-kde-passwordManagerHint`。Electron の `read()` は OS の生の形式を `electron application/osclipboard;format="名前"` として列挙する（Windows で KeePass と同じ形でコピーして確かめた）ので、形式の一覧だけで判定し（`privateMark`）、中身は読まない。一覧には載せず「N private copies left out」と数だけ出す。中身を読まないので、続けて 2 つの非公開コピーは区別できず 1 と数える
- **履歴への積み方**（`recordRead`、純粋関数）: 前回と同じテキストは何もしない。一覧にあるテキストは二重にせず先頭へ移して回数を足す。**選択のドラッグの吸収**: シェルは選択が変わるたびにコピーする（`onSelectionChange`）ので、ドラッグ中の "npm"・"npm ins"・"npm install" が 3 件になる。直前の読み取りから続けて見ていて（250 ms × 4 以内）、先頭の項目が 1.5 秒以内に変わったもので、互いに含む関係なら、先頭を置き換える。間に一時停止や非表示があれば吸収しない（見ていない間のコピーが先頭に吸われて消えた不具合を e2e が見つけた）。最大 50 件
- **持つもの**: テキストは 20 万文字まで戻せる形で持ち、それを超えたものは先頭だけを持って「NOT KEPT」（半分だけ戻すよりは戻さない）。HTML と RTF はそれぞれ 40 万文字まで添えて（Word の RTF は画像を含み数 MB になる）、戻すときに `text/plain`・`text/html`・`text/rtf` を 1 つの `ClipboardItem` で書く。RTF は Electron 44 の `read()` に `text/rtf` として現れ、同じ名前で書くと Windows の Rich Text Format になり、ほかのアプリから読める（PowerShell の `Clipboard.GetData(Rtf)` で読み書きとも確かめた）。Word と Outlook は HTML も載せるが、ワードパッドは RTF だけなので、RTF を持たないと書式が落ちる。同じテキストを書式付きで再びコピーしたら、その書式に置き換える（書式なしの再コピーでは前の書式を残す）。画像とファイルは持たない: 画像が同じ形式のまま差し替わった（スクリーンショットを 2 回撮った）ことを知るには毎回 PNG を読むしかなく（上の 8.4 ms を 1 秒に 4 回）、見送った
- **ページに渡すもの**: 先頭 600 文字のプレビュー、文字数・行数・種類・HTML の有無・回数・時刻だけ。全文と HTML は main に残り、ページは id で戻す・消す。永続化はしない（プロセスのメモリだけ。ペインを閉じても残り、終了で消える）。プラグイン API にクリップボードは無い
- **戻したとき**: その項目を「クリップボードにあるもの」とし（左の縦線と ON CLIPBOARD）、並びは動かさない（押した行が指の下から逃げないように）。次の読み取りで新しいコピーとは見なさない（`restored`）。**CLEAR はクリップボードも空にする**（2026-09-26、利用者の決定）。以前は一覧だけを空にし、クリップボードに残る内容を覚えて次の読み取りで拾い直さないようにしていたが、それでは同じテキストをコピーし直しても見分けられず、一覧に出なかった（利用者の報告: CLEAR のあと NOTES から同じ URL をコピーしても出ない）。Electron はコピーごとに進む番号（Windows の `GetClipboardSequenceNumber`、macOS の `changeCount`）を出していないので、変化はテキストの違いでしか知れない。空にすれば何も覚えておく必要がなく、次のコピーは同じテキストでも拾える。確認の表示は `CLEAR N + CLIPBOARD?`。× で「いまクリップボードにある項目」を消した場合はクリップボードに触れないので、その同じテキストのコピーし直しは拾えない（間に別のコピーをはさめば拾える）。**書き込みと読み取りの競合**: 戻す・CLEAR の書き込み中に始まった読み取りや、それをまたいだ読み取りは捨てる（`#writing` と `#epoch`）。古い内容や、一覧が知る前の書き込み結果を新しいコピーと取り違え、別の項目を先頭へ移していたため。ほかの点検で直したもの: 戻したあとの別のコピーを、先頭の項目のドラッグとして吸収していた（吸収は先頭がクリップボードにあるときだけに）、20 万文字を超える長文をコピーし直すたびに重複して並べていた（長さと先頭で同じと見る）、`// TODO` や `/help me` を PATH と判定していた（Unix のパスは空白を含まないものだけ）
- **画面**: 見出し行（状態のランプ WATCHING / PAUSED / STANDBY、件数、PAUSE・MASK・CLEAR）、絞り込み欄（MASK 中は出さない。当たる推測が伏せた内容を明かすため）、一覧、脚注。各行はタグ（`clipTags`: 種類 TXT・URL・PATH・NUM・CLR を全行に、CLR は色見本付き、`classifyClip`。書式付きならその下に RICH。一度は普通のテキストのタグを外したが、TXT だけ無いのは不自然という利用者の判断で全行に戻した、2026-09-26）、プレビュー（最大 3 行、高さ 260px 未満で 1 行）、大きさ・RICH・×回数、何分前か。クリックか Enter で戻し、↑ ↓ で行を移り、Delete か × で消す。CLEAR は 2 度押し（3 秒で解除）。**カード**（`ClipCard.svelte`、利用者の依頼で GIT のコミットカードと同じ作り）: 行に 350 ms 留まるか、キーボードで移ると（`:focus-visible` のときだけ。クリックで残るフォーカスでは出さない）、ペインの中で行の下（入らなければ上）にプレビュー全体（最大 600 文字、それより長いものは「the first 600 of N characters」）・形式（`text + HTML + RTF`、`clipFormats`）・コピーした時刻と回数を出す。無効なボタンはポインタのイベントを受けないので、ポインタは行の要素で追う。MASK 中は出さない。一覧のスクロールと非表示で消す。新しい行は RSS と同じ `fx-fresh`、並べ替えは `flip`
- **スニペット**（2026-09-27、利用者の依頼。`shared/snippets.ts`、`main/clipboard/snippets.ts`、`main/ipc/snippets.ts`、`SnippetsView.svelte`）: 意図して残すテキスト。ペインの上端の切り替え（タイマーと同じ作り、`history` / `snippets 件数`）で履歴と入れ替わり、選んだ側はペインの状態（`view`）に持つ。
  - **置き場所は main の `snippets.json`**（notes と同じく `JsonStore`、壊れたファイルは残して `.bak`、手での編集は `watchUserFile` で反映）。履歴はメモリだけという方針は変えない。ディスクに残るのは利用者がボタンで選んだものだけで、脚注にそう書く。settings.json には入れない（持ち運ぶため）。最大 100 件、テキストは履歴が丸ごと持つ 20 万文字まで。**HTML と RTF も持つ**（利用者の決定: 大きなものを入れるかは利用者の責任。スキーマにも上限を設けない。履歴の側で 40 万文字までに切られている）。プラグイン API には出さない
  - **作り方**: 履歴の行の **SNIP**（行に乗ると ×と一緒に出る）が id で main に頼み、main が履歴の全文と書式をそのまま写す（本文はページを通らない）。登録済みのテキストの行は ★ が点いたままで、押すとスニペットの側へ移ってその行を示す。持ち切れない長文（NOT KEPT）は登録できない。**+ NEW** で手書きもでき、名前（任意、空なら先頭行）とテキストを書くエディタが一覧の場所に開く（Ctrl+Enter で保存、Esc で取り消し）。同じテキストは二重にせず「already kept as 02」と既存の番号を言う。新しいものは末尾に足す（番号を動かさないため）
  - **COPY**: main が書き込み（`ClipboardWatcher.put`）、戻すときと同じく書き込みと重なった読み取りを捨てる。**履歴には積まない**（利用者の決定）: 同じテキストの項目があればそれを ON CLIPBOARD にし、無ければ何も足さず次の読み取りも同じテキストを新しいコピーと見なさない（`putOn`）。スニペットの行にも ON CLIPBOARD と縦線を出す: どのスニペットがクリップボードにあるかは main が `history.last` と索引（テキスト → id）から出し、`ClipBoard.snippet` と各行の `snipped` で渡す。スニペットが変わると main は履歴の絵も送り直す（`republish`）。COPY した回数と最後の時刻を数え、カードに出す
  - **読み取り**: スニペットの側を見ている間もクリップボードを読み続ける（利用者の決定）。ペインは見えていてランプも出ているので「見えている間だけ読む」に反しない。戻ったときに抜けが無い。スニペットの一覧は `seen` の間だけ `list` と `onChange` で受ける
  - **並べ替え**: 行頭の番号（01, 02…、その下の点がつまみ）をドラッグする。ドラッグ中は行が `flip` で道を空け、番号も入れ替わる。落とす位置は行の中央を越えた数（`dropIndex`、純関数、`withMove` と揃う）。行はドラッグ中に DOM の中で動くので、ポインタのキャプチャではなく window のイベントで追う（動いた要素はキャプチャを失う）。落としたあとは main の答えが来るまで新しい順を保つ（戻って見えないように）。Alt+↑ ↓ でも 1 つずつ動かせる。絞り込み中は動かせない（番号が一覧の位置と合わないため）
  - **編集と削除**: EDIT か F2 で開く。本文は `read` で main に頼む（一覧はプレビューだけ）。**書式付きのものの本文を変えると HTML と RTF は捨てる**（古い文面を貼り戻してしまうため）。名前だけの変更では残す。エディタは本文を変えた時点でそう警告する。× は 2 度押し（`DELETE?`、3 秒で解除、Delete キーも同じ）: 履歴と違って意図して残したものなので
  - **MASK** はスニペットにも効く。伏せている間は既存のスニペットのエディタを開かない（本文が見えるため。開いていれば閉じる）。書きかけの新規はそのまま。カードも出さない
  - **見つけた不具合**: 履歴の新しい行の強調（`fx-fresh`）は終わったときに外すが、終わる前にスニペットの側へ切り替えると要素ごと消えて外れず、戻ったときに古い行がまた光った。切り替えた時点で強調を捨てる（コンポーネントテスト）
- **テスト**: 単体（`clipboard.test.ts`: 境界・非公開の判定・分類・積み方・吸収と間の途切れ・上限・戻す・消す・ページに全文が渡らないこと、`clipboard-watcher.test.ts`: 購読の有無と一時停止で読まない・壁時計の境界・重ねない・長文の間引き・失敗しても止まらない・スニペットを積まずに置く・印、`snippets.test.ts`: 追加と重複・編集で書式を捨てる・移動・落とす位置・プレビューだけ渡す・棚の索引と書き込み）、コンポーネント（`clipboard-widget.test.ts`）、e2e（`clipboard.spec.ts`: SNIP から COPY と再起動まで、書く・ドラッグ・Alt+↑・F2・削除、`hidden-panes.spec.ts`、`layout-presets.spec.ts`）。e2e は `ELECDEX_CLIPBOARD_STUB=1` で main のメモリ上の代役を読み、実機のクリップボードを読まず書かない（コピーは `globalThis.__elecdexClipboard` から）。スクリーンショットは `demo`（作り物の午前の履歴）

### 5.15 NOW PLAYING ペイン（再生中のメディア）

いま再生中の曲や動画を、アート・曲名・アーティスト・アルバム・どこまで進んだかとともに出し、前へ・再生／一時停止・次へを送る（2026-09-27、利用者の依頼と設計案から）。ピッカー名と見出しは "now playing" / NOW PLAYING。既定のレイアウトには入れず、media プリセットの spectrum と mixer の並び（左端）に入れる。ボリュームは扱わない（mixer の領分）。

- **読む場所は main**（`main/media/`）。案ではメトリクスのソース（`media.nowPlaying`、`PRIVATE_METRIC_SOURCE_IDS`）だったが、ボタンの押下を送る経路が要り、collector の購読は読み取り専用なので、mixer と同じく main のサービスにした。メトリクスのソースではないので `PRIVATE_METRIC_SOURCE_IDS` にも入れない。プラグイン API には最初から無い（届く経路が無い）
- **Windows**: System Media Transport Controls（音量フライアウトが出すもの）を、常駐する PowerShell 1 つで読む（`main/media/windows.ts`）。1 行送るたびに 1 行の JSON で答える（`read`、または `playPause` / `next` / `previous` の後の読み取り）。セッションは Windows 自身が「現在」とするもの、無ければ再生中の最初のもの。ほかのセッションは数だけ（`+N`）。スクリプトは環境変数で渡す（`powerShellStart`: `spawn` 25 ms）。PowerShell 5.1 は WinRT のストリームを素の COM オブジェクトとして見るので、`AsStreamForRead` はリフレクションで呼ぶ（そうすると型変換が効く）。実測（i5-1335U）: 起動から最初の答えまで約 0.6 s、以後 1 回の読み取りは 1 ms 前後、押下と読み取りで 20 ms 前後
- **アート**: 曲（アプリ・曲名・アーティスト・アルバム・サムネイルの有無）が変わったときだけ、リーダーの中で 2 つの JPEG（品質 82）に縮めて base64 で 1 回送る: プレート用に長辺 192 px、カード用に長辺 512 px。元の画素数も添える。ブラウザーはサムネイルを曲名より少し遅れて出すので、有無もキーに入れる。main は大きさ（base64 で 88 000 字 / 400 000 字まで）と JPEG の先頭（`/9j/`）を確かめ、`data:` URL にする（CSP `img-src 'self' data:` の範囲）。小さいほうはセッションと一緒にページへ、大きいほうは main のメモリに置き、カードが開いたときだけ `nowPlaying.art()` で渡す（読み取りのたびに数十 kB を送らないため）。ディスクには置かない
- **いつ読むか**: 見えている NOW PLAYING ペインが 1 つ以上あるときだけ（ペインは `seen` の間だけ購読）。壁時計の 0.5 秒境界（`BoundaryTimer`）でタイマー 1 本を張り直し、`setInterval` は使わない。前の読み取りが終わっていなければその境界は飛ばす。案の「変更通知を主に」は取らなかった: PowerShell 5.1 から WinRT のイベントを受ける確かな手段が無く、読み取りが 1 ms なので、0.5 秒ごとに読んで変わったときだけページへ送る方が単純で確か。最後のペインが消えたら読むのをすぐやめ、リーダーのプロセスは 15 秒後に閉じる（`NOW_PLAYING_LINGER_MS`: ペインの移動やタブの切り替えで PowerShell を起こし直さないため。その間も読まない）。直前の 1 件はメモリにだけ残し、ペインが戻った瞬間に出す
- **位置**: プレーヤーは位置をときどき（シーク・一時停止・数秒ごと）しか報告しないので、報告された位置とその時刻（SMTC の `LastUpdatedTime`。10 年以上ずれた時刻は信じず読み取り時刻にする）から、再生中はページが壁時計の 1 秒境界（`onBoundary`）で数え進める（`positionNow`、終わりを越えない）。長さの無いストリームはバーを出さない
- **押下とシーク**: `control` は `playPause` / `next` / `previous` だけ（`isNowPlayingAction`）、`seek` は曲の先頭からの秒（`seekTarget`: プレーヤーが位置の変更を受け付け（SMTC の `IsPlaybackPositionEnabled`）、長さが分かり、0〜長さに収めた数のときだけ。リーダーは `TryChangePlaybackPositionAsync` にタイムラインの開始からの tick で渡す）。どれも購読している（=見えている）ページからしか受けない。プレーヤーが出していないボタンは無効にする（`IsNextEnabled` など）。結果は `ok` / `refused`（プレーヤーが受けなかった）/ `no-session` / `unsupported` / `failed` で、`ok` 以外はボタンの右に 3 秒だけ言う。Space キーの割り当ては案にあったが、キーは Ctrl/Alt か F キーを含むという規則（シェルのキーを奪わない）に反するので入れない。ボタンにフォーカスすれば Space / Enter で押せる
- **バー**（`SeekBar.svelte`、2026-09-27、利用者の指摘: ● があるとドラッグできそうに見える）: シークを受け付けるプレーヤーのときだけ、頭（◆）とつまめる高さ（見た目の線より高い当たり判定）、`role="slider"` を持ち、ドラッグ中は時刻がその位置を言い、離したときに 1 回だけ送る。キーボードは ←→ で 5 秒、Home / End。受け付けないプレーヤーでは頭の無い細いメーターにし、つまめるように見せない。シーク後はプレーヤーが次に位置を報告するまで（最長 `SEEK_HOLD_MS` = 3 秒）求めた位置を出す（`shownPosition`。ブラウザーは報告が少し遅れ、頭が一度戻って見えた）。断られたら報告どおりに戻す
- **正規化**（`readSession`、純粋関数）: 文字列は制御文字を空白にして 200 字（コードポイント）で切る。アプリ名は既知の id を表の名前に（`appLabel`: Firefox はハッシュの AUMID で登録する、パッケージアプリは名前の部分）。elecdex 自身の Web ペインが再生していると、Windows は elecdex の AppUserModelId を大文字で（`DEV.KUROUNA.ELECDEX`）報告するので、大小を無視して `ELECDEX_APP_ID`（main が設定し、electron-builder.yml の appId と同じことを単体テストが確かめる）と比べ、`elecdex` と出す（利用者の指摘、2026-09-27）。読めないものは推測せず null
- **画面**: 横長ならアートが左、縦長なら上（コンテナクエリ）。アートの枠は角を切ったプレートで、アートが無いときは線で描いた円盤。ランプ（PLAYING 緑 / PAUSED アクセント / NO SESSION・STANDBY 淡色 / UNSUPPORTED・エラー 警告色）とアプリ名、曲名（`--step-1`、2 行まで）、アーティスト（`--step-0`）、アルバム（`--step--1`）、バーと時刻（`--step--1`）、中央に寄せたボタン 3 つ（利用者の指摘で左寄せから変更）。バーは 1 秒ごとの段で、CSS のアニメーションは使わない
- **カード**（`ArtCard.svelte`、詳細カードの共通部品、§7.4）: アートにポインタを留める（またはキーボードで移る）と、大きいアート（元の縦横比。main から届くまではプレートの画像）、曲名の全文、アーティスト・アルバムの全文、プレーヤー（表示名と Windows の id）、長さ、アートの元の画素数、ほかのプレーヤーの数（`nowPlayingRows`）を出す。ペインがプレートの右に 300 px 以上空いていればプレートの横、そうでなければ上下に置く
- **macOS / Linux**: 今は読まない（ペインが「Windows only」と言う）。macOS の MediaRemote は非公開 API で、15.4 から Apple の署名の無いプロセスには答えない。Linux は MPRIS（D-Bus）で読める見込み（Phase 2）
- **テスト**: 単体（`now-playing.test.ts`: 正規化・切り詰め・アプリ名・アートの検査・位置の補間・リーダーの行・スクリプトが押すのは 3 つだけでスクリプトを環境変数で渡すこと・監視の境界・重ねない・読まない間・余韻と閉じ方・失敗しても止まらない・押下の可否）、コンポーネント（`now-playing-widget.test.ts`）、e2e（`now-playing.spec.ts`、`hidden-panes.spec.ts`）。e2e は `ELECDEX_NOWPLAYING_STUB=1` で main の代役を読み、実機のプレーヤーを読まず押さない（曲は `globalThis.__elecdexNowPlaying` から変える）。スクリーンショットとデモは `demo`（架空の曲と、`main/media/demo-art.ts` が画素から描いたジャケット。誰の作品も写さない）。実機の SMTC は、音量 0 の `Windows.Media.Playback.MediaPlayer` に表示用の曲情報とサムネイルを載せた PowerShell で確かめた（日本語の曲名、アート、一時停止）

### 5.16 UTILITY ペイン（AWAKE・QR・CODEC）

PowerToys のような小さな道具を 1 枚のペインにまとめる（2026-09-27、利用者の依頼 issue #12 と、設計の相談で決めたこと）。ピッカー名と見出しは "utility" / UTILITY。既定のレイアウトとプリセットには入れない。Phase 1 のモジュールは **AWAKE**（スリープの抑止）、**QR**（QR コードを作る）、**CODEC**（エンコード・ハッシュ・時刻・全角半角）の 3 つ。

- **器**: タイマーペインと同じく、上の切り替えボタン（`AWAKE | QR | CODEC`）で 1 つを出す。どれを出すかはペイン状態の `module`。モジュールの一覧は `UTILITY_MODULES`（shared/utility.ts）で、ペインではなくデータとして足す。ペイン状態の読み取りは純粋関数 `readUtilityPane`（型と長さを確かめ、足りないものは既定値）。ホールド中は、AWAKE 以外を出していても切り替えの行の右に `◆ hold · display · until 15:42` が出て、押すと AWAKE に切り替わる（タイマーの「もう一方のモードの様子」と同じ。期限は時刻で言い、数えないので毎秒の書き換えは無い）。ボタンの見た目（`u-row` / `u-label` / `u-chip`）は UTILITY ペインが 1 か所で持つ。**Ctrl+Shift+U**（`utility.focus`）はランチャーと同じ呼び出しの共通部（§5.13）で、レイアウトの UTILITY へフォーカス（複数なら押すたびに次へ）、無ければポップアップ、ポップアップが出ていれば閉じる（利用者の決定。閉じる判断は UTILITY の中で完結させ、共通部に分岐を持たせない）。ポップアップは前回のモジュールで開く。Linux の IBus は Ctrl+Shift+U を Unicode 入力に使うので、キーが届かない環境では設定で変えるペインの見出しのバッジ `hold` も同じ理由（裏のタブでも見える）。`multiple`、`popup: true`、`zoom: 'panel'`
- **モジュールにしてよいもの**（規則は CLAUDE.md）: ユーザーが明示した操作で始まるスイッチか一度きりの操作。main の中で Electron の API か既存の仕組みで行い、操作のたびにプロセスを起動しない。ネットワークを使わない。同意の要るものは読まない。プラグインからは届かない（plugin-api.ts に無い）。対応の可否はプラットフォーム名ではなく、main が確かめた結果で決める。入れないと決めたもの: カラーピッカー（画面のキャプチャが要る）、hosts の編集（管理者権限）、OCR、キーの割り当て変更、ロック画面の無効化
- **コピー**: QR の画像と CODEC の結果は、ページの `navigator.clipboard` ではなく main の `utility.copy` で書く（テキストは 1 MB、PNG は署名を確かめて 4 MB まで）。main のクリップボードの層を通るので、テストでは `ELECDEX_CLIPBOARD_STUB` の代役に書かれ、実機のクリップボードに触れない

#### AWAKE（スリープの抑止）

- **手段は Electron の `powerSaveBlocker`**（`main/awake/`）。案では OS ごとに `SetThreadExecutionState`・IOPMAssertion・`systemd-inhibit` を呼ぶ予定だったが、Chromium がそれぞれ（Windows の電源要求、macOS の IOPMAssertion、Linux の D-Bus の ScreenSaver と logind）をプロセスの中で行うので、外部プロセスは起動しない（`spawn` で main が止まる問題も、Windows で叩き直す処理も無い）。OS はプロセスが終わると要求を解くので、クラッシュでも抑止は残らない
- **段階は OFF / SYSTEM / DISPLAY の 3 つ**。`prevent-display-sleep` はシステムのスリープも止める（画面が点いたまま PC だけ眠ることはない）ので、案の「DISPLAY だけ」は成り立たず、2 つのトグルを 3 択にした（PowerToys Awake の「画面もオンのまま」と同じ形）。SYSTEM は `prevent-app-suspension`（画面は消えてよい）。段階を変えるときは、新しい要求を張ってから古いものを解く（抑止が途切れる瞬間を作らない）
- **止められないもの**: 蓋を閉じる、スリープのボタン、スタートメニューのスリープ（ユーザーの操作）。DISPLAY はスクリーンセーバーやそれに続くロックも起こさなくなることがある（OS 次第。手動の確認項目）。モジュールの注記が 1 行で言う
- **期間**: ∞ / 30M / 1H / 2H / 4H と `+30M`（上限は今から 24 時間）。ホールド中に期間を選び直すと、その時点から数え直す。期限は壁時計の `until`（epoch ms）で持ち、main が `setTimeout` 1 本で待つ（リマインダーと同じ。起きたとき時計がまだ手前なら張り直す）。スリープ明け（`powerMonitor` の `resume`）にも期限を確かめる。ティックやハートビートは無い。ページの T-minus は、見えているときだけ `onBoundary(1000)` で数える
- **保存と復元**（利用者の決定: 前回の状態を戻す）: ホールド（段階・`until`・`since`）は main の `awake.json`（`replaceFile`）。ペイン状態には置かない: 保存レイアウトは別の機械へ持ち運ぶ作りで、ホールドが入ると別の PC まで起こしっぱなしにする。ペインが 2 つあれば食い違い、レイアウトの切り替えでホールドが変わり、ペインが開かなければ戻らない。起動時、main はウィンドウより先に `restoreHold` で読み、無期限か期限前なら張り直す（期限を過ぎていれば OFF にして書く）。クラッシュ後も同じ。elecdex が動いていない間は何も止めていない（プロセスが無いので OS が要求を解いている）ことを、モジュールの注記と README が言う。ブートログが `Started awake.service - Hold ...` と 1 行言う。ペイン状態に置くのは、そのペインで選んでいる期間だけ
- **ペインを閉じても続く**（利用者の決定）: ホールドは main のもので、ペインは見ているだけ。代わりに、ペインの外にも出す: ステータスバーに `awake · system · until 15:42`（押すと UTILITY が AWAKE でポップアップする。数えないので 1 秒ごとの書き換えは無い）、その下端の目印の線がアクセント色に灯る、通知領域のアイコンのツールチップ（出していれば）
- **状態**（`AwakeState`）: `level`、`until`、`since`、`held`（`powerSaveBlocker.isStarted`。要求したのに張れていなければ `NO HOLD` を警告色で）、`onBattery`（`powerMonitor`。バッテリーのときは 1 行、警告色。自動で OFF にはしない: ホールドはユーザーの意図）。状態が変わったときだけ全ウィンドウに送る（常駐の購読やポーリングは無い）。ページでは `stores/awake.svelte.ts` が 1 つ持ち、ステータスバーとペインが読む
- **画面**: 左に T-minus を囲むリング（60 の目盛り。弧が残りの割合、∞ は全周、OFF は淡色）、右に状態語（`RELEASED` / `HOLD · SYSTEM` / `HOLD · DISPLAY` / `NO HOLD`）と期限の時刻、`LEVEL` と `FOR` のボタン。SVG で、変わるのは 1 秒に 1 回の弧と数字だけ（見えている間）
- **判断は純粋関数**（shared/utility.ts）: `holdFor`（要求から次のホールド）、`extendHold`、`holdExpired`、`restoreHold`、`blockerKind`、`awakeLine`（ステータスバーとツールチップとブートログの文）。main の `AwakeService` は blocker・保存・時計・タイマー・電源を注入され、単体テストで回る
- **テスト**: `ELECDEX_AWAKE_STUB=1` で blocker と電源の状態がメモリの代役になり（`globalThis.__elecdexAwake`）、テストの実行が実機を起こしっぱなしにしない。実機で本当に眠らないか（Windows の Modern Standby を含む）は手動で確かめる

#### QR（QR コードを作る）

- **種類**: TEXT、URL（スキームが無ければ `https://` を足す）、WI-FI（`WIFI:T:WPA;S:…;P:…;H:true;;`、`\ ; , : "` をエスケープ。スマートフォンがかざすだけで接続できる形式）。誤り訂正 L / M / Q / H（既定 M）。入力は UTF-8 のバイトモードなので日本語も入る
- **生成はページの中**（`qrcode-generator`、MIT、依存なし、devDependency）。ネットワークは使わない。符号は `qrBuild`（renderer/lib/qr-code.ts。ライブラリはページにだけ入り、main には載らない）が作り、描く画素は純粋関数 `qrPixels` が作る。単体テストは生成した画像を jsQR（devDependency）で読み戻して元の文字列と一致するかを確かめる（日本語、WI-FI のエスケープ、容量ちょうど、全テーマの色）
- **容量**: 使ったバイト数と、その誤り訂正での上限（バージョン 40、L 2953 / M 2331 / Q 1663 / H 1273 バイト）を出し、あふれたら `OVER CAPACITY`
- **色はテーマに合わせる**（利用者の決定）。読み取り側は明るさで二値化するので色相は効かないが、明暗の向きは効く（明るいモジュールを暗い地に置いた反転 QR は、ZXing 系など既定で読まない実装が残る）。そこで常に**暗いモジュールを明るい地に**置く: 暗いテーマは地をアクセント色、モジュールを地の色に、明るいテーマは地を地の色、モジュールを文字色に。`qrColours` がコントラスト比を確かめ、4 に届かなければ白地に黒へ戻す。キャンバスは 2D で、1 モジュールを整数の実画素にし、周りに 4 モジュールの余白（クワイエットゾーン）
- **保存**（利用者の決定）: TEXT と URL の入力、Wi-Fi の SSID・方式・隠しネットワーク、誤り訂正はペイン状態に保存する（保存レイアウトにも入り、持ち運ばれる）。**Wi-Fi のパスワードは暗号化してペイン状態に置く**: AI キーと同じ `safeStorage`（main/secrets/。テストは `ELECDEX_AI_KEYS_STUB` の代役）で、ページは `utility.seal` で `v2:` 付きの暗号文を受け取って保存し、表示するときに `utility.unseal` で戻す。封は用途（`elecdex:utility-secret:`）ごとに作り、開けるときに確かめる: AI キーも同じ `safeStorage` で暗号化されるので、用途が無いと AI キーの暗号文を `unseal` に渡せば平文が返り、「キーはページに渡らない」が破れる（2026-09-27 のレビューで見つけた。用途の無い `v1:` は読まない）。AI キーと違い平文はページに渡る（QR そのものがパスワードを含むので、ページが持たずに描く方法は無い）。`unseal` は自分の形式と決まった長さのものしか解かず、復号は WI-FI を表示しているときだけ（macOS では最初の復号がキーチェーンの確認を出すので、マウントしただけでは解かない）。別の機械では解けないので欄を空にして `SEALED ON ANOTHER MACHINE` と言う。キーリングの無い Linux ではパスワードを保存せず `NOT SAVED · NO KEYRING` と言う（平文で保存に逃げない）
- **画面での覆い**: パスワード入りの WI-FI の QR は初めは覆っておき、`REVEAL` で見せる。ペインが見えなくなるか再マウントされると、また覆う（画面共有や撮影に写らないように）。パスワード欄は AI キーの欄と同じで、「表示」は入力中の文字だけを見せる

#### CODEC（エンコード・ハッシュ・時刻・全角半角）

- **操作**: ENCODE（Base64、Base64URL、URL、Hex）、DECODE（Base64、URL、Hex、JWT の中身。署名は確かめない、と言う）、HASH（SHA-1、SHA-256、SHA-512、WebCrypto）、TIME（Unix 秒・ミリ秒と日時の相互変換。空なら今）、WIDTH（全角→半角、半角→全角、NFKC）、UUID（v4、押すたびに新しく）。すべて shared/codec.ts の純粋関数で、入力が変わるたびにその場で出す。失敗は結果の欄に理由を警告色で（`runCodec` は例外を投げない: 上限で切った入力に残る片割れのサロゲートは URL エンコードで、日付に収まらない JWT の `exp` は `toISOString` で投げていた）
- **保存**: 選んだ操作はペイン状態に保存する。**入力はディスクに書かない**: トークンやハッシュの元は秘密であることが多く、保存レイアウトは持ち運ばれる。ペインの移動（再マウント）で消えないよう、ページのメモリにペインごとに持つ（アプリを終わると消える）。入力は 20 万文字まで
- **結果**: `COPY`（main 経由）と `⇅`（結果を入力に移す。デコードの続けがけ用）

#### テスト

単体（`utility.test.ts`: ペイン状態の読み取り・ホールドの遷移と復元・blocker の種類と掛け替えの順序・期限とスリープ明け・文、`qr.test.ts`: WI-FI のエスケープ・URL・容量・色・jsQR での読み戻し、`codec.test.ts`: 各操作と誤り、`awake-service.test.ts`: main のサービスと、封と開封の形式）、コンポーネント（`utility-widget.test.ts`: 封の途中で忘れたパスワードが保存されないことも）、e2e（`utility.spec.ts`: ホールドがペインを閉じても続き、再起動で戻り、期限を過ぎていれば OFF、ステータスバーとポップアップ、QR のコピーと Wi-Fi の封、CODEC のコピーと入力が保存されないこと。`hidden-panes.spec.ts`）

### 5.17 DOCKER ペイン（コンテナの一覧と操作）

ローカルの Docker エンジンのコンテナを Compose のプロジェクトごとに並べ、状態・ヘルス・公開ポート・使用量を出し、起動・停止・再起動・一時停止・再開を送る（2026-09-27、利用者の案と、設計の相談で決めたこと）。ピッカー名は "docker containers"、見出しは DOCKER。既定のレイアウトには入れず、dev プリセットの AI AGENT の下に、シェルとタブに重ねて前面に入れる（2026-10-01、利用者の指定。当初はタブに重ねずに置いていた）。

- **main のサービス**（`main/docker/`）。案ではメトリクスのソース（`dev.docker`、`PRIVATE_METRIC_SOURCE_IDS`）だったが、NOW PLAYING（§5.15）と同じく押下を送る経路が要り、collector の購読は読み取り専用なので、main のサービスにした。メトリクスのソースではないのでどちらの一覧にも入れない。プラグイン API には最初から無い（届く経路が無い。単体テストが plugin-api.ts に docker が無いことを確かめる）
- **エンジンへの経路**: Docker Engine API を node の `http` で、Unix ソケット・Windows の名前付きパイプ（`socketPath` に `\\.\pipe\docker_engine` を渡せる）・この機械の TCP で話す。**CLI は起動しない**（読み取りのたびのプロセス起動を避け、テキストの出力に依らない）。クライアントのライブラリも使わない（使う要求は 5 種類で、dockerode は依存が増えるだけ）。単体テストが engine.ts などに `child_process` が無いことを確かめる。応答は 4 MB、読み取りは 2 秒、押下は 35 秒（stop は既定の猶予 10 秒を待つ）で打ち切る。API の版は `/_ping` の `Api-Version` と、知っている最新（1.47）の低いほう。1.24 未満は UNSUPPORTED
- **エンジンの場所**（`findEndpoint`、判断は `parseDockerHost` などの純粋関数）: `docker` コマンドと同じ順に、`DOCKER_HOST`、現在のコンテキスト（`DOCKER_CONTEXT` か `~/.docker/config.json` の `currentContext`。アドレスは `contexts/meta/<名前の sha256>/meta.json`）、いつもの場所（Windows は `docker_engine` のパイプ、macOS は `~/.docker/run/docker.sock` と `/var/run/docker.sock`、Linux は `/var/run/docker.sock`・rootless の `$XDG_RUNTIME_DIR/docker.sock`・Docker Desktop の `~/.docker/desktop/docker.sock` のうち在るもの）。これで colima・OrbStack・Linux の Docker Desktop・rootless Docker・Podman の互換ソケットに、コードを足さずに届く。**使わないもの**: 別の機械の TCP（誰かのサーバー）、TLS（証明書を扱わない）、ssh（プロセスを起動する）、`fd://`。ページからアドレスは変えられない（プロセスの環境と利用者のファイルに従うだけ）。リンクのたびに探し直すので、コンテキストを切り替えれば次のリンクで従う
- **いつ問い合わせるか**: 見えている DOCKER ペインが 1 つ以上あるときだけ（ペインは `seen` の間だけ購読し、裏のタブ・最小化・格納中は解除。`keepWhileHidden` の対象外）。その間、イベントのストリーム（`GET /events`、コンテナの、一覧を変える種類だけにエンジン側で絞る。ヘルスチェックの exec は数秒ごとに来るので除く）を 1 本つなぎ、イベントの次の 250 ms 境界で一覧を 1 回読む（stop と die、Compose の十数個がまとめて 1 回になる）。加えて壁時計の 10 秒境界で読み直す（"Up 2 minutes" の進み、つなぎ直し）。**利用者の決定（2026-09-27）: 案の「1 秒ごとの一覧」でなくイベントと 10 秒**。Docker Desktop はデーモンを VM で動かすので、毎秒の問い合わせは VM を起こし続ける。動いているコンテナの使用量は 5 秒境界で（`stats?stream=false&one-shot=true`、最大 24 個、同時に 4 つ。CPU はこちらの前回の読み取りとの差で、`docker stats` と同じ式。メモリは使用量からファイルキャッシュを引く）。どれもタイマー 1 本を次の境界へ張り直し（`BoundaryTimer`、境界は `shared/wall-clock.ts` の `nextBoundary`）、`setInterval` は使わず、前の読み取りと重ねない。最後のペインが消えたらストリームを閉じてタイマーを止め、直前の一覧はメモリにだけ残して、ペインが戻った瞬間に出す。ディスクにもログにも書かない
- **リンクの状態**（`DockerLink`）: STANDBY（見えていない）、LINKING、LINKED、NO DAEMON（接続できない、または Docker Desktop のパイプが 500 を返す＝エンジンが止まっている）、DENIED（EACCES: Linux で docker グループに入っていない）、UNSUPPORTED、LINK ERROR（応答が遅い）。NO DAEMON / DENIED / UNSUPPORTED では一覧を空にし、LINK ERROR では直前の一覧を残す（遅いだけでコンテナが消えたわけではない）。ストリームが切れたらすぐつなぎ直す（開いて 1 秒以内に切れ続けるなら 10 秒境界で）
- **ページに渡すもの**（`readContainer`）: 短い ID（12 桁）・名前・イメージ・状態・エンジンの Status の文・ヘルス（Status の `(healthy)` などから）・終了コード・公開ポート（IPv4 と IPv6 で 2 度並ぶものは 1 つに）・Compose のプロジェクト・サービス・作業フォルダ・作成時刻・使用量だけ。**ラベルはこの 3 つしか読まず、コマンドとマウントは読まない**（秘密を含みうる）。フル ID は main が持ち、ページは短い ID で指す。上限は 100 件（超えたら動いているもの、次に新しいものを残し、`truncated`）
- **押下**（`control`）: start / stop / restart / pause / unpause だけ（`DOCKER_ACTIONS`）。**remove・kill・prune は無い**。main は、見えているページからの、直前の一覧にあるコンテナで、その状態が受け付けるもの（`actionsFor`）だけを送る。stop と restart は猶予 10 秒（`?t=10`）。304（すでにそうなっている）は ok。ページは stop・restart・pause を 2 度押しにする（3 秒で解除、クリップボードの CLEAR と同じ）。送っている間は行の状態が STOPPING… などになり、結果は次のイベントの一覧で追いつく（楽観更新はしない）。断られたら理由を脚注に出す
- **画面**: 見出し行（リンクのランプと語、UP / DOWN の数、ALL | RUN）、列の見出し（NAME・IMAGE・PORTS・CPU・MEM・STATE）、プロジェクトごとのまとまり（見出しを押すと畳む。畳んだものと絞り込みはペインの状態。プロジェクトが 1 つも無ければ見出しは出さない）、脚注（エンジンの版・API・OS・場所、または問題）。**行は状態で並べ替えない**（プロジェクト、サービス、名前の順）: 止めた行がポインタの下から逃げないように（クリップボードペインと同じ原則）。状態の語は UP / HEALTHY / UNHEALTHY / STARTING / PAUSED / RESTARTING / EXITED（0 以外ならコード付き）/ CREATED / DEAD と、エンジンの Status から取った長さ（`statusAge`: 2h、5m、<1s）。色は ok（動いている）、info（一時停止・ヘルス確認中）、warn（unhealthy・再開中・0 以外で終了）、danger（dead）、淡色（止まっている）。ランプは動いているものだけ塗る。名前を押すと名前をコピー、公開 TCP ポートを押すと既定のブラウザーで開く（`portUrl`: この機械のアドレスだけ、既存の `system.openExternal`）、`›_` は `docker exec -it <name> sh` をコピー（名前がシェルの読み替えない文字だけのとき。コピーは UTILITY と同じ `utility.copy` で main を通す）。操作ボタンはポインタかキーボードのある行だけに、使用量の列の上に重ねて出す（状態の語は隠さない）。列は幅に応じて IMAGE → CPU・MEM → PORTS の順に畳む（コンテナクエリ。列の定義はペインが持ち、行と見出しが同じ変数を読む）。新しいコンテナは `fx-fresh`、並びの変化は `flip`。**最初の一覧を「新着」と数えない**: まだ一覧を読んでいないボード（`sampledAt` 0）は既知の一覧に入れない（入れていたので、開くたびに全行が光り、その終わりが最小化中に DOM を書き換えて hidden-panes の e2e が見つけた）
- **カード**（`ContainerCard.svelte`、§7.4）: 名前（NAME 列）に留まるか名前へキーボードで移ると、フルネームと状態、行に入らないもの（イメージ全体、Compose のプロジェクトとサービス、フォルダ、エンジンの Status の文、アドレス付きの全ポート、CPU、メモリと上限、作成時刻、ID）と、名前と `›_` で何がコピーされるか。**カードは名前からだけ開く**（2026-09-27、利用者の報告: 行全体で開いていたので、下の行のボタンへポインタを動かす途中でカードが開き、押したいボタンを覆っていた）
- **見送り**: ログ（秘密を含みうるので、出すなら MASK の設計から）、イメージ・ボリューム・ネットワークの一覧、Kubernetes、ペイン内のシェル、別の機械のエンジン
- **テスト**: 単体（`docker.test.ts`: 読み取り・ラベルとコマンドを渡さないこと・ヘルスと終了コード・長さ・ポート・上限・まとめ方・押下の可否・使用量の計算・エンジンの場所・版・イベントの行、`docker-watcher.test.ts`: 見えるまで問い合わせない・250 ms の境界でまとめる・10 秒と 5 秒の境界・止めたらストリームもタイマーも止まる・NO DAEMON からの復帰・DENIED・遅いだけなら一覧を残す・重ねない・押下の可否、`docker-engine.test.ts`: 本物の名前付きパイプ／Unix ソケットに立てた偽の Engine API で、要求の形・イベント・押下・応答の上限・タイムアウト・止まったエンジン・古いエンジン）、コンポーネント（`docker-widget.test.ts`）、e2e（`docker.spec.ts`、`hidden-panes.spec.ts`、`layout-presets.spec.ts`）。e2e は `ELECDEX_DOCKER_STUB=1` で main の代役を読み、実機の Docker に触れない（`globalThis.__elecdexDocker` で変え、`down` / `denied` でエンジンが無い・開けない場合）。スクリーンショットは `demo`（架空の 2 つのプロジェクト）

### 5.18 CHIP-8 ペイン（CHIP-8・SUPER-CHIP・XO-CHIP を遊ぶ）

組み込みペイン `chip8`。CHIP-8、SUPER-CHIP、XO-CHIP のプログラムをペインの中で動かし、遊べるようにする（2026-09-29、利用者の設計案を参考に仕様を決め直し、画面のモックを見てもらってから着手）。同梱するのは chip8Archive（CC0、104 本）と chip8-test-suite（GPL-3.0、DIAG として）だけで、ほかは利用者が IMPORT で持ち込む。ネットワークは使わない。**段階 7 まで、すべての段階を作り終えた**。

- **構成（疎結合）**: 機種に依らない部分を `shared/emu/`（`clock.ts` の `framesDue`、`fit.ts` の `fitScreen`）、CHIP-8 の機械を `shared/chip8/` に置く。`shared/chip8` は自分と `shared/emu` しか import せず、`shared/emu` は何も import しない。DOM・Node・タイマー・時計・`Math.random` にも触れない（`chip8-boundary.test.ts` が守る）。だからページ（段階 2）、main（取り込んだ ROM の見本づくり、段階 3）、vitest が同じコードをそのまま動かす。ページ側のつなぎは `renderer/widgets/chip8/`、目録・利用者のライブラリ・セーブは `main/chip8/` に置く。**今後のエミュレータ系のペイン（Linux など）も同じ形にする**: 純粋な機械 + ページの小さな runner + main が持つ保存。`shared/emu` を共有し、別の機械のフォルダは import しない
- **機械の形**: 状態はただのデータ（`state.ts` の `Chip8State`）、振る舞いは状態に作用する関数（`exec.ts` は命令の上位 4 ビットごとの小さな関数の表、`display.ts` はスプライト・消去・スクロール・解像度）、ページが持つのは `Chip8` クラス 1 つ（`machine.ts`: `load`・`restore`・`frame`・`step`・`press`・`release`・`releaseAll`・`tune`・`snapshot`）。時間は持たない。1 フレームは最大 `ipf` 命令と 60 Hz のタイマーを 1 回進めることで、いつ何回呼ぶかは呼ぶ側（`framesDue`）が決める。乱数は xorshift32 で、状態に持つ（スナップショットから同じ列が続く）
- **互換性の基準は Octo**: chip8Archive の作品は Octo で書かれている。そのため Octo と同じく**どの機種でもすべての命令を実行する**（CHIP-8 と書かれた作品に、実行時に SUPER-CHIP を調べるものがある）。機種が決めるのはメモリ（4 KB / XO-CHIP は 64 KB）と互換モードの既定だけ。0000 は終了（空のメモリに入った）、FX0A は待っている間に押して離したキーを渡す（前から押していたキーは取らない。待っている間もタイマーは進む）、`displayWait` では DXYN でそのフレームの命令を打ち切る、呼び出しは 16 段。どの機種にもない命令（0NNN、末尾が 0 でない 5XY/9XY、知らない 8XY・EX・FX）では止まり、場所と命令を `halt` に残す（HALT の表示に使う）
- **互換モード**（`quirks.ts`）: `vfReset`・`memIncrement`・`shiftVx`・`jumpVx`・`clip`・`displayWait`・`vfOrder`。名前は「オンのとき機械が何をするか」に揃えた。プロファイルは chip8-test-suite の quirks テストが機種ごとに期待する値（CHIP-8 = COSMAC VIP、SCHIP = Octo の "modern"、XO-CHIP = Octo）。chip8Archive の Octo 名のフラグは `quirksFromOcto` で読む（`loadStoreQuirks` はオンで I を進めないので向きが逆）
- **フォント**（`fonts.ts`）: Octo の 6 種（octo・vip・dream6800・eti660・schip・fish）。小さい 16 字を 0 番地、大きい 16 字をその後ろ（0x50）に置く。表は Octo（MIT）から写したもので、THIRD_PARTY_NOTICES に載せる
- **テストスイート**（`resources/chip8/test-suite/`）: Timendus の chip8-test-suite の `bin/` を、各 `.ch8` の元の Octo ソース（`.8o`、GPL が求める対応するソース）と LICENSE ごと置く。取った commit は同じフォルダの README に書く。単体テスト（`chip8-suite.test.ts`）は全 8 本を走らせ、画面を ASCII のフィクスチャ（`tests/unit/fixtures/chip8/`）と比べる。フィクスチャは README の画像と目で照らし合わせ、すべてのチェックに印が付くことを確かめてから置いた（quirks は 3 機種、flags は 2 機種、scrolling は 4 通り、FX0A は押して離す）。quirks と scrolling は 0x1FF に選択肢を書いてメニューを飛ばす（スイートの README が認める方法）
- **スナップショット**（`snapshot.ts`）: 先頭にマジック `C8SN` と版を置いたバイト列。機種・フォント・互換モード・IPF・レジスタ・スタック・画面・XO の音・SCHIP のフラグ・メモリを持つ（最大は XO-CHIP の約 74 KB、`SNAPSHOT_MAX_SIZE`）。押されているキーは持たない（戻したときはすべて離れている）。読むときは長さ・マジック・版・値の範囲をすべて確かめ、合わなければ null（新しく始める）。main は大きさだけを確かめ、中身はこのコアが確かめる
- **機種の推定**（`platform.ts`、IMPORT 用）: 3584 バイトを超えれば XO-CHIP。それ以外は、**0x200 から制御の流れ（ジャンプ・コール・スキップの両側・F000 の 2 語）をたどり、命令として届く語だけ**を見て、XO-CHIP の命令があれば XO-CHIP、SUPER-CHIP の命令があれば SUPER-CHIP、なければ CHIP-8。バイト列をそのまま数える方式は、IBM ロゴのスプライトデータに含まれる `00FF` を hires と読んで誤った。BNNN の先はたどれないので、その先にしかない命令は見落とす（そのときはより素朴な機種になり、利用者が変えられる）
- **キー**（`keys.ts`）: COSMAC VIP の 4×4 を `1234 / QWER / ASDF / ZXCV` に位置（`event.code`）で割り当てる。**矢印（5・7・8・9）と Space（6）も Octo と同じく押す**。chip8Archive の作品は Octo のキー配置で作られ、説明に「矢印と Space」と書くものが多いため。そのためペイン自身のキーは **P（一時停止）** と、一時停止中の **Enter（1 フレーム進める）**。Ctrl・Alt・システムキーとの組み合わせ、Tab、Esc（前面表示を戻すのはアプリの Esc）、F キーは受け取らない。押しっぱなしの繰り返しは飲み込む
- **画面**（段階 2）: `fitScreen` は**デバイスピクセル**で倍率を決める（125% 表示でもドットの幅が揃う）。INTEGER（既定）は hires の 1 ドットを単位にした整数倍で、lores はその 2 倍にして、解像度が切り替わっても絵の大きさが変わらない。FIT は縦横比を保って領域いっぱい。1 ドットも取れない狭さでは FIT。90°・270° の回転（chip8Archive の `screenRotation`）では縦横を入れ替えて測る。大きさは ResizeObserver の entry から読む。canvas は論理解像度で、CSS で拡大する（`image-rendering: pixelated`）。色は THEME（既定）と ORIGINAL（作者の配色、同梱分）。THEME の XO の 4 色は**アクセントの濃淡**（地・アクセント・地に寄せたアクセント・明るいアクセント）で、モックで `--info` を混ぜたら AMBER などで色がぶつかった。蛍光体の残光（PHOSPHOR、既定 ON、尾は 2〜3 ドット）、ドットの格子（DOTS、倍率 4 以上）。描き直すのは `screenRevision` が動いたときと残光が消えていく間だけ
- **elecdex の作法**（段階 2 以降で守ること）: ボタンと行の押下はランチャーのタイルと同じ 100 ms の点滅で、画面を切り替える押下は LayoutsDialog と同じく 3 拍点滅してから実行する。画面が現れる・消えるもの（LIBRARY ⇄ RUN、IMPORT のシート、PAUSED / HALT の表示、詳細カード）は crt.css の電源の入り切り（`crt-on` と `crtPower`）。ライブラリのタブの切り替えは KEYSTREAM と同じく一覧の電源を落として入れ直し、行はタイルのように入る。操作音（`sfx`）は LOAD・戻る・HALT に。ランプの点滅は `lib/pulse.svelte.ts` で、CSS アニメーションにしない。バッジは小文字の語（`running`、`paused`、`halted`）。行の詳細カードは HoverCard。CORE・MEM は 10 fps のフレームループで描く。LOAD のときは CORE にブートログのような 1 行（`LOAD 200 · 3,584 B · VIP`、保存した機械から続けたときは `RESUME 2A4 · …`）を同じループで 1 フレーム 4 文字ずつ打つ（CORE を開いたときにもう動いていれば全文。移動の再マウントでは打ち直さない。動きを減らす設定では全文）。一時停止中は STEP（1 命令）の横に FRAME（1 フレーム、Enter と同じ）。長く続くアニメーションは `--ambient-play-state` を付ける。文字の大きさは読むものが `--step--1`、ラベルが `--step--2`
- **周期**（段階 2、`runner.svelte.ts`）: 実行中で、かつペインが `seen` の間だけ、ペイン専用のループを回す（10 fps のフレームループの例外。ゲームは 60 Hz でないと遊べない。利用者承認）。`framesDue` の取り戻しは最大 3 フレーム。見えなくなったら一時停止して AUTO に保存し、戻っても自動では再開しない。**画面が動いている間は rAF、半秒（30 フレーム）動かなければ 60 Hz のタイマー**に切り替え、画面が変わった最初のフレームで rAF に戻す。rAF はそれだけで毎 vsync 描画の流れを起こし、何も描かない実行のコストの大半がそれだった（メニューで待つ、テストが終わって空回りする）。タイマーは合成を要求しない。CORE は 10 fps のフレームループで読み、実行中は刻々変わる命令数を出さない（速さを出し、止まったら数を出す）。画を描くのは `screenRevision` が動いたときと残光が消えていく間だけ
- **ページの構成**（段階 2、`renderer/widgets/chip8/`）: `Chip8Widget`（つなぐだけ: キー、フォーカス、読み込み、預け、色、ペイン状態）、`runner.svelte.ts`（ループと一時停止。ホストを差し替えて単体テストする）、`Screen`（`fitScreen`、ResizeObserver の entry のデバイスピクセル、格子、回転、鳴っている間のベゼル）、`painter.ts`（残光、純粋）、`palette.ts`（純粋）、`buzzer.ts` と `buzzer-worklet.ts`（全ペインで 1 つの AudioContext を必要になってから作り、4 秒鳴らなければ眠らせる。音は AudioWorklet 上の `PatternVoice` で、位相を切らさず Octo と同じ低域通過で鳴らし、与えられた時間が尽きれば自分で止まる。音が OFF・ミュート・音量 0 なら作らない）、`park.ts`（ペインの移動で再マウントする間、機械を 10 秒預かる。レイアウトは見ない）、`pane-state.ts`・`core.ts`（純粋）、`library.svelte.ts`（`chip8.list()` を 1 度だけ、ROM は id で）。見えない間は ResizeObserver が 0 を返すので、0 は無視する（右の列が畳まれ、戻ると CRT で開き直していた。e2e で見つけた）。ボタンを押すとフォーカスはペインに戻り、ゲームのキーが途切れない（入力欄は除く）。一覧の行は `scrollIntoView` で見せない（ワークスペースまで動く）
- **main**（段階 2）: `chip8.list()` と `chip8.rom(id)` だけ（`main/chip8/catalog.ts`、`main/ipc/chip8.ts`）。`resources/chip8/programs.json` は `npm run gen:chip8`（`scripts/gen-chip8.mjs`）が書き、chip8Archive の言葉（Octo の互換フラグ名、`tickrate`、`fontStyle`、`screenRotation`）のまま持つ。`programFromEntry` がコアのプロファイルを通して機械の設定に直すので、プロファイルは 1 か所にしかない。ファイル名は 1 段のフォルダと .ch8 だけを許し（外へ出られない）、壊れた項目は 1 つずつ捨てる
- **設定**（段階 2）: `chip8.core`（新しいペインで CORE を出すか、既定 ON。ペインごとに PANEL で変えられる）と `chip8.volume`（操作音とは別、既定 0.5、操作音が OFF なら鳴らない）
- **利用者のライブラリ**（段階 4、`main/chip8/store.ts`）: 同梱の目録に、取り込んだプログラム、プログラムごとの調整（IPF と互換モードのうち、そのプログラム自身のものと違う分だけ。`tuningFrom`）、★ を重ねて `chip8.list()` で渡す。持つのは `userData/chip8/library.json`（壊れた項目は 1 つずつ捨てる）。調整と ★ はライブラリにあるプログラムにだけ付けられる。変更はどのペインからでも `chip8:changed` で全ウィンドウに知らせ、ページのライブラリは丸ごと置き換える（先にページで変えない）。ペイン状態は表示の選択だけ（レイアウトと一緒に他の PC へ持ち運ばれるため）。ペインを移動したときは、ページのメモリに預けた機械を引き取る（引き取られないまま 10 秒たったら破棄。レイアウトストアは見ない）
- **IMPORT**（段階 4）: ライブラリの + IMPORT で main が picker を開く（ページはパスを渡さない。拡張子は ch8・c8・sc8・xo8・bin、すべてのファイルも選べる）。main は**読む前に大きさを確かめ**（空、または 65,024 バイトを超えるものは理由を返して断る）、sha256 の名前で `userData/chip8/imported/<sha256>.ch8` に写す（id は `imported/<先頭 16 桁>`。同じバイト列はもう一度取り込んでも 1 本）。題名はファイル名から、機種はコアの推定（`guessPlatform`）、見本の絵と SENSED のキーは gen-chip8 と同じ `previewRun` で main が作る（ファイルと機種ごとに 1 度、覚えておく）。取り込むと IMPORTED のタブに移り、シート（`ImportSheet`、ライブラリの上に CRT で開き、ライブラリの中だけを暗くする）で題名と機種を直せる。推定の理由（XO-CHIP の命令がある、など）を添える。機種を変えると調整とセーブを忘れる（別の機械のものだから）。そのプログラムには大きすぎる機種は選べない。REMOVE は 2 度押しで、ファイル・調整・★・セーブごと消す。取り込んだものは詳細の EDIT で同じシートを開ける。動かしている最中に別のペインで消されたら、そのペインは機械を片付けてライブラリに戻り、そう書く
- **セーブ**（段階 4、`main/chip8/saves.ts`）: プログラムごとに AUTO と 3 枠を `userData/chip8/saves/<id の / を -- に>/<枠>.c8s` に `replaceFile` で書く。main は書く前と読むときにコアの `decodeSnapshot` で中身を確かめ、ライブラリにないプログラムのものは書かない（消した直後の AUTO がフォルダを残さない）。枠の一覧には保存した時刻と、スナップショットの画面から作った見本の絵を付ける。**AUTO** はペインが自分で書く: ライブラリに戻るとき、見えなくなったとき、ペインが消えるとき（移動・レイアウトの切り替え・閉じる）、ページが去るとき（`pagehide`: 再読み込み・終了）。機械が前回から動いていなければ書かない（runner の `changes`）、止まった（HALT した）機械は書かない。再起動や再読み込みの後は AUTO から一時停止で戻る。ライブラリの LOAD は AUTO があれば **CONTINUE**（まだページにある機械ならそのまま続け、なければ AUTO から）と **NEW**（最初から）になり、「left at 14:32」と添える。**SAVE** タブ（パネルの 3 つ目）は 1〜3 と AUTO を画面の見本と時刻で並べ、SAVE（中身のある枠は 2 度押し）と LOAD（一時停止中ならそのまま）。スナップショットを戻すときは、機種が同じときだけ受け取り、IPF と互換モードは今の調整にする（保存の後で調整を変えても今の設定で続く）
- **TUNE の保存**（段階 4）: 速さと互換モードを変えると、その場で機械に効き、プログラム自身のものとの差が main に残る（次に開いたときも、ほかのペインでも同じ設定で動く）。TUNING の行に YOURS / PROGRAM'S OWN を出し、OWN で自身のものに戻す（main は調整を忘れる）。詳細の速さと詳細カードには調整後の値を出し、TUNED / yours と添える
- **★**: 詳細の ☆ で付け外し、行の年の前に ★。★ が 1 つでもあれば ALL の次に ★ のタブが出る（開いている間は 0 になっても残る）
- **ライブラリ**（段階 3）: chip8Archive の 104 本（CC0、`resources/chip8/archive` に ROM と元の `programs.json` を `source.json` として、取った commit は同じフォルダの README）とテストスイートの 8 本。タブは ACTION・PUZZLE・STORY（ビジュアルノベル・アドベンチャー・RPG）・MUSIC（リズムゲームとトラッカー）・TOYS（遊ぶもの: ペイント・水槽・言語処理系）・SHOWCASE（Octojam のタイトル）・DIAG・IMPORTED で、振り分けは gen-chip8 の表（全 104 本を割り当てていることを確かめる）。chip8Archive の色名（`hotpink` など）、3 桁、`#` なしの色は #rrggbb に直し、書かれていない色は Octo の既定色で埋める
- **見本の絵**（`shared/chip8/preview.ts`）: `npm run gen:chip8` がどのプログラムもペインと同じコアで 10 秒分（600 フレーム、固定の種）キーを押さずに動かし、10 フレームごとの画面から `pickPreview`（点いたドットが最も多いもの。ほぼ全部点いた画面は除く）が選んだ 1 枚を、面ごとに 1 ビットで詰めて base64 にして programs.json に入れる（112 本で 200 KB）。そのとき調べたキー（SENSED）も入れ、キーパッドの図に光らせる。ページはテーマか作者の色で描く（PNG にしないのはそのため）。単体テストが、programs.json の見本とキーが今のコアが描くものと一致することを確かめる（コアを変えたら gen:chip8 をやり直す）。gen-chip8 は Node のフックで `.js` を `.ts` に解決して TypeScript のコアをそのまま読む（Node 23.6 以降は型を外して動かす）
- **ATTRACT**（`Attract.svelte`）: 選んだプログラムを詳細の横で、キーも音もなく、ゲームと同じ runner で 10 秒ずつ繰り返し動かす。動くのはライブラリが見えていて、**30 秒以内にポインタかキーか検索の入力があった間だけ**。誰も触らなければ止まって、その画のまま待つ。動き続けると 1 コアの 2 割ほどかかった。動きを減らす設定では見本の静止画
- **MEM**（段階 6、`MemView.svelte`、純粋な部分は `mem.ts`）: パネルの 2 つ目のタブ（CORE・MEM・TUNE・SAVE）。メモリを 1 行 8 バイト（スプライトの 1 行が 1 バイトなので、ビットとしても読める幅）で 16 行、**PC**・**I**・**FREE** のどれかを追う。追う番地の行を窓の 4 分の 1 の高さに置き、メモリの両端は越えない（`windowStart`）。ホイールで 2 行ずつ動かすと FREE になる（パネルは動かさない）。次に実行する語は地の色、I のバイトは枠、I から 16 バイトは下線、フォント（0x000〜0x0EF）はアクセント、プログラムのバイトは本文の色、残りは淡く、前回から変わったバイトは 1 拍だけ光る。脇に I からの 16 バイトをスプライトとして描く（8×16 のマス、テーマの色）。読むのは CORE と同じく実行中の 10 fps のループと手で進めた後だけで、見えている 128 バイトしか DOM にしない（XO-CHIP の 64 KB でも同じ）
- **一覧と詳細の境**: ドラッグで動かせる（共通の `Splitter`、git ペインと同じ。30〜75%、ダブルクリックで半分に戻る）。割合はペイン状態 `listShare` に、ドラッグを離したときに 1 度だけ書く
- **行と詳細カード**: 行は見本の絵・題名・作者と催し・機種・年。留まると `ProgramCard`（HoverCard）が説明の全文、機種と画面、速さ、互換モード（プロファイル名か、機種の既定からの差）、キー、日付、回転、ライセンスを出す（行にある題名・作者・催し・年は繰り返さない。`programRows`）。検索と並べ替えで行が消えたときは、leave が来ないのでカードを閉じる（見つけた不具合）。検索はタブに関係なくライブラリ全体から探し、その間タブは淡くなる
- **段階**: 1 コアと単体テスト（済み）、2 実行画面（済み）、3 ライブラリ・目録・見本・ATTRACT・詳細カード・DIAG（済み）、4 セーブ・AUTO・IMPORT・TUNE の保存・★（済み）、5 XO の音・ORIGINAL・回転・CORE と STEP（段階 2〜3 で済み。段階 5 で CORE のブートログの行と FRAME、一覧と詳細の境のドラッグ）、6 MEM（済み）、7 負荷の測定・README の画像・紹介ツアー（済み）
- **見送り**: 巻き戻し、ファイルのドラッグ＆ドロップでの IMPORT、Octo のソース（.8o）やカートリッジ（.gif）の読み込み、ポップアップ表示（ダイアログを開くたびに閉じてゲームが止まるため）、矢印キーの割り当てをプログラムごとに変える設定（Octo と同じ固定の割り当てにしたので不要）

## 6. ターミナル設計

### 6.1 構成
`@xterm/xterm` 6 + fit / webgl / unicode11 / search / web-links / serialize / clipboard。

- **リガチャは v1 では見送る**。`@xterm/addon-ligatures` は `font-ligatures` 経由で Node の fs を要求し、sandbox renderer では動かない。同梱フォントのリガチャ定義をビルド時に事前生成して WebGL レンダラに食わせる方式を Phase 5 以降で検討する
- 画面フィットは `FitAddon` をそのまま使う。原版の「`gcd(w,h)===100` なら cols+3」的な経験的ハック（issue #302）は持ち込まない。端の余白は CSS 側で吸収する
- スクロールは xterm 標準に任せる（原版は wheel/touch を手実装していた）

### 6.2 Shell Integration による CWD / プロセス追跡

原版は `/proc/<pid>/cwd` の readlink、`lsof`、`ps -o comm` を1秒ポーリングし、**Windows は構造的に非対応**だった。elecdex は端末のエスケープシーケンスで取る。

| シーケンス | 用途 |
|---|---|
| `OSC 7 ; file://<host><path> ST` | CWD 通知 |
| `OSC 133 ; A/B/C/D ST` | プロンプト開始 / 入力開始 / コマンド実行開始 / 終了（終了コード付き） |

- `resources/shell-integration/` に bash / zsh / fish / pwsh 用の注入スクリプトを同梱
- PTY 起動時に注入する: bash は `--init-file`、zsh は `ZDOTDIR` 差し替え、fish は `XDG_DATA_DIRS`、pwsh は `-NoExit -Command`（スクリプト本体は環境変数で渡す。理由は [decisions.md](decisions.md)）
- main の `OscParser` が PTY 出力ストリームから該当シーケンスを抽出（xterm には渡さず消費）し、`onCwd` / `onProcess` として通知する
- ネイティブ取得へのフォールバック（`/proc` や `lsof` の低頻度ポーリング）は設計時に考えたが入れていない。注入が効かないシェルでは CWD 追従が働かないだけで、ポーリングは一切しない
- 副産物として「直前コマンドの終了コード」「実行時間」が取れる。セッション情報には入れているが、タブに終了コードを出すバッジは意図して無効にしてある（シェルそのものが終了したときの `exited N` だけを出す）

### 6.3 シェル解決
`which` 相当を main 側で実装し、`shell-env` 相当（ログインシェルの環境変数取り込み、原版 issue #366）も main で行う。`TERM=xterm-256color` / `COLORTERM=truecolor` / `TERM_PROGRAM=elecdex` を付与する。

---

## 7. テーマ / デザイントークン

**文字の大きさの役割**（2026-09-26）: 本文・主数値は `--step--1`（1080p で 12px）以上。`--step--2`（10px）は凡例・出典・ラベル・タブの件数・ツールバーのボタンなど、読ませる主情報ではないものに限る。`em` で縮めるときも、実効で `--step--2` を下回らないこと（接続一覧の `0.85em` は `--step--1` の中なので約 10.2px で可）。`tokens.css` にない段（`--step--3` など）を書くと、`var()` は親の大きさに戻って意図より大きく描かれるため、単体テスト（`type-scale.test.ts`）が定義済みの段だけが使われていることを確かめる。ただし、システム列のように高さが固定の場所や、幅の決まったタイルでは、切り詰めが増えるなら小さいままにする（下記 [decisions.md](decisions.md) の判断を参照）。

### 7.1 トークン設計
CSS カスタムプロパティを**階層化**する。原版は `--color_r/g/b` と `--color_black` 等の数個しかなく、各CSSが `rgba(var(--color_r),...)` を手組みしていた。

```css
:root {
  /* ── primitive ── テーマが供給する生の値 */
  --accent-h: 183; --accent-s: 22%; --accent-l: 74%;
  --surface-0: #000000;   /* 最背面 */
  --surface-1: #05080d;   /* パネル地 */
  --surface-2: #0b1118;
  --line: #262828;
  --text-base: …; --text-muted-base: …;   /* テーマの text。省略時はアクセントから */

  /* ── semantic ── コンポーネントが参照する層 */
  --accent:        hsl(var(--accent-h) var(--accent-s) var(--accent-l));
  --accent-dim:    hsl(var(--accent-h) var(--accent-s) var(--accent-l) / .35);
  --accent-faint:  hsl(var(--accent-h) var(--accent-s) var(--accent-l) / .12);
  --text:          var(--text-base);
  --text-muted:    var(--text-muted-base);
  --panel-bg:      var(--surface-1);
  --panel-border:  var(--accent-dim);
  --danger: …; --warn: …; --ok: …;

  /* ── typography / motion / space ── */
  --font-display: "…"; --font-ui: "…"; --font-mono: "…";
  --step--1: .75rem; --step-0: .875rem; --step-1: 1.125rem;
  --dur-fast: 120ms; --dur-panel: 420ms; --ease-out: cubic-bezier(.2,.8,.2,1);
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
}
```

- 単一の accent を HSL で持つことで、原版の `color(...).grayscale().mix(...)` 相当の派生色をCSSだけで作れる
- コンポーネントは **semantic 層のみ**を参照する。primitive を直接読まない
- ターミナルの16色パレットはテーマが明示指定 or accent からの自動派生（派生ロジックは renderer の純関数にしてユニットテストする）

### 7.2 テーマスキーマと適用

```ts
// src/shared/theme.ts（抜粋）
const ThemeSchema = z.object({
  id, name, author?,
  mode: z.enum(['dark', 'light']).optional(),        // 'light' は明るい地: 状態色を暗くし、端末は最小コントラストを上げる
  accent: z.object({ h: Hue, s: Percent, l: Percent }),
  surfaces: z.object({ s0: Hex, s1: Hex, s2: Hex, line: Hex }),
  text: z.object({ primary: Hex, muted: Hex }).partial().optional(),   // 省略時、文字はアクセント色
  status: z.object({ danger: Hue, warn: Hue, ok: Hue, info: Hue }).partial().optional(),
  fonts: z.object({ display, ui, mono }).partial().optional(),
  terminal: z.object({ ansiPull?, ansi? }).optional(), // 16色はアクセントから派生し、指定した色だけ上書き
  effects: z.object({ scanlines, glow, iconTint }).partial().optional(),
})
```

- 内蔵は6つ: tron / amber / phosphor / white / business-dark / business-light。地球儀などの Canvas / WebGL は
  テーマ専用の色を持たず、同じトークンを `appearance.revision` のたびに読み直す
- **どのテーマも全ての変数を設定する**（`themeVariables`）ので、切り替えで前のテーマの値が残らない

- 適用は `el.style.setProperty("--accent-h", …)` の一括更新。**DOM/HTML の再注入はしない**（原版の `head.innerHTML +=` / `injectCSS` 生注入を廃止）
- テーマ切替は**ページリロード不要**（原版は `window.location.reload(true)` していた）。xterm のテーマも `term.options.theme = …` で差し替える
- 任意CSSの持ち込みを許すなら `@layer theme-override` 内に限定し、CSSOM でパースできたルールのみ適用する（v1 では機能自体を入れない）
- 解決順: **内蔵(asar) → userData オーバーレイ**。同名IDはユーザー側が勝つ。内蔵を userData に書き戻さない

### 7.3 SF演出の実装方針
原版の `augmented-ui`（角切りフレーム）は `clip-path` + 擬似要素で自前実装する。ブートログ演出・グリッチロゴ・パネルの順次フェードインは Svelte の transition + CSS アニメーションで再構成し、**`prefers-reduced-motion` と設定で無効化できる**ようにする。

---

### 7.4 詳細カード（ポインタを留めると開くポップアップ）

要素の詳細をポップアップで見せるときは、どのペインでも同じ部品を使う（2026-09-26、利用者の決定）。`title` 属性の単なるツールチップ（ボタンの名前など）は対象外。

- **判断は `lib/hover-card.ts`**（純粋関数とタイマー、単体テストあり）:
  - `cardPlacement`: 対象の下、入らなければ上。左右と上はペインの端から `CARD_GAP` 内側に収める。**ペインの外へは出さない**（Web ペインのネイティブのビューに隠れ、関係のないペインを覆うため）
  - `anchorOf`: ペイン内の座標にする。ポインタで開いたときはポインタの少し右（`POINTER_OFFSET`）、キーボードのときは要素の左端から
  - `HoverRest`: ポインタが `HOVER_REST_MS`（350 ms）留まると開く（行の上を通り過ぎても開かない）。カードが開いている間に次の要素へ移ると、次はすぐ開く。キーボードで移ったとき（`:focus-visible`。クリックで残るフォーカスは除く）もすぐ開く。離れると閉じるが、その瞬間が終わるまで待つ（ブラウザは次の行に入る前に前の行から出るので、待たないと移るたびに閉じて開き直す）。遅れて届いた前の要素の leave では閉じない
- **枠は `widgets/common/HoverCard.svelte`**: accent の 1px の線、一段明るい地（`--panel-bg-raised`）、グロー、等幅の `--step--1`、ポインタを受けない。開閉はダイアログと同じ CRT の電源オン／オフ（`crt-on`・`crtPower`）。中身は各ペインが渡す。見出しの下に事実を並べるときは `CardRows.svelte`（小さなラベルと値の 2 列、`CardRow`）、時刻は `cardTime`
- **中身の決め方**: カードは行に書ききれないことを見せる場所で、行と同じことを繰り返さない（利用者の指摘、2026-09-27: GIT のファイル一覧の `title` が行と同じ相対パスで意味がなかった）。丸めた数値は正確に（AGENT の 42k → 42,005 tokens）、省略した名前は全体を（フルパス）、記号は言葉に（`M` → modified）。何を書くかは純粋関数（`agents/cards.ts`、`git/file-card.ts`）で決め、単体テストで確かめる
- **使っているもの**: NOW PLAYING のアート（`ArtCard`、§5.15）。GIT のコミット（`GitCommitCard`）と変更ファイル（`GitFileCard`: この PC 上のフルパス、変更の種類と状態を言葉で、改名元、行数、クリックでできること。git は Windows でもリポジトリのフォルダを `C:/…` と返すので、ドライブのパスはバックスラッシュで書き直す。右クリックの「Copy full path」も同じ関数）、AI AGENT のセッション（`AgentCard`: タイトル、フォルダのフルパス、状態、プロセス、モデル、開始と最後の動き、正確なトークン数とターン数、いまのツール、タスクの内訳、変更ファイルの数、よく使うツール、セッション ID）とタスク（種類・状態・開始と終了・かかった時間・ステップ数・最後のステップ）と変更ファイル（フルパス）、クリップボードの項目（`ClipCard`）、Wi-Fi の数値の説明（`HintCard`。ペインに 1 つのリスナーで `data-hint` の要素を拾う作りはそのまま、幅 22rem）、ORBIT の衛星と太陽直下点（地図の上を探るものなので、待たずに出てポインタに付いて動く。太陽直下点のカードは位置・赤緯（季節）・そこが南中であること・観測地での太陽高度と昼夜を示す（`sunLines`、利用者の依頼 2026-09-27）。タイトルの色はどの種類も `--info` に揃えた（利用者の指摘: ステーションだけ本文と同じ色で揃っていなかった）。ISS・CSS・太陽のカードはほかのカードと同じく電源オン／オフで開閉し、Starlink の点のカードは即時で `power={false}`（何千もの点の上をポインタが掃くので、点ごとに電源が入り切れするとうるさい）。種類ごとに別の表示ブロックにしてあるので、ステーションから Starlink の点へ直接移っても、それぞれ自分の開き方になる（利用者の提案、2026-09-27）
- **使わないもの**: マーケットの詳細チャートと Wi-Fi のタイムラインの、クロスヘアに付く読み取り表示（ポインタに合わせて途切れず変わる計器で、カードではない）
- 以前は GIT とクリップボードが置き方の計算・枠・タイマーをそれぞれ持ち、Wi-Fi（左の太線と角の切り欠き）と ORBIT（左の色線）は別のデザインだった。単体テスト（`hover-card.test.ts`）が、`HoverCard` 以外に `role="tooltip"` を持つ部品が無いことと、使っている 6 つを確かめる（`detail-cards.test.ts` は AGENT と GIT のカードの中身）。新しくカードを足したら、そのテストの一覧に加える

## 8. チャート / 可視化

| 原版 | elecdex |
|---|---|
| smoothie 1.35（DOM canvas、ライブラリのRAFループ） | 自前 `StreamChart`（2D Canvas）。全チャートと全アニメーションが1つの 10 fps フレームループ（`lib/frame-loop.ts`）を共有する。`OffscreenCanvas` + Worker は設計時の案で、この描画量では不要だったので入れていない |
| RAM: 440個の `<div>` を毎1.5秒更新 | 単一 Canvas。使用率とスワップを CPU と同じ時間軸のグラフで描く（ドットマップはやめた） |
| ENCOM Globe（vendored three.js 43,539行） | 素の three 0.186（threlte は不採用、§2）。陸地は Natural Earth から生成した点群で、接続先・弧・震源も `Points` で描く |

- Globe を含め、描画はペインかウィンドウが見えていない間は止まる。WebGL コンテキストを取るのは地球儀とシェルだけで、他は 2D Canvas に揃えている（Chromium が保持するのは約16個。[decisions.md](decisions.md)）
- `backgroundThrottling: false` は原版同様必要なので、隠れた・最小化したウィンドウは main が `WindowState.hidden` で知らせ、フレームループが止まり、CSS アニメーションも `data-offscreen` で止める

---

## 9. 設定 / 永続化

`app.getPath("userData")` 配下:

```
settings.json       # zod 検証付き。未知キーは保持したまま警告。ショートカットの変更もここ（keybindings）
layout.json         # LayoutTree（version 付き、マイグレータあり）。生きている配置は常にこの1つ
layouts.json        # 名前を付けて保存した配置と、いま作業中のもの（shared/layouts.ts。最大12件）
                    # 機械に依存する状態（セッション id）を含まないので、他の PC にそのまま持っていける
notes.json          # メモ本文（main 所有。ペインは noteId だけを持つ）
tasks.json          # タスクとリスト（main 所有。期限の通知も main がスケジュールする）
chats/              # AI チャットの会話。1 会話 1 ファイル（<uuid>.json。main 所有。§5.7）
                    # 添付したファイルは <uuid>.files/<sha256>（と .thumb）。会話と一緒に消える
ai-keys.json        # AI プロバイダの API キー。OS の暗号化（safeStorage）を通した値だけ。settings.json には置かない
alarms.json         # アラーム（時刻・曜日・on/off。main 所有。ペインを閉じていても鳴る）
background.json     # 「通知領域に入りました」の案内を出し済みかどうか
launcher-usage.json # ランチャーの起動回数（よく使う順）
quake-alerts.json   # 通知済みの地震・津波（再起動で同じものを知らせ直さない）
feeds-cache.json / weather-cache.json / weather-cache-points.json   # 最後に取れたデータ
themes/             # ユーザーテーマ（内蔵へのオーバーレイ）
plugins/            # プラグイン本体と elecdex-plugin.d.ts（plugins.md）
plugin-data/        # プラグインごとの保存領域
Partitions/web      # Web ペインの cookie とサイトデータ（§5.4）
```

ターミナルのセッションはファイルに残さない: 生きている間は main が持ち、`layout.json` のペインが
その `sessionId` を指す（§5.3）。

- **layout.json は「生きている配置」、layouts.json は「名前付きの写し」**（§5.6）。前者はこの実行に
  だけ意味のある状態（`sessionId`）を持ち、後者は `portableTree` がそれを落としてから書くので、
  同じ木を二度書くことにはならず、ファイルごと他の PC に持っていける
- **ペイン設定は layout.json、ユーザー資産は専用ファイル**。表示の選択（電卓のモード、メモの折返し、
  タイマーの `startedAt`）はペインの寿命と一致してよいので pane state に置く。メモ本文とタスクは
  ペインを閉じても残るべきもので、しかも打鍵ごとにツリー全体を書き直すのは高いので main が別ファイルで
  持つ。タスクがとくに main 所有なのは、期限の通知がペインの開閉と無関係に届く必要があるため
  （`src/main/reminders`: 次の1件だけを `setTimeout` で待ち、ポーリングしない）
- すべて **zod スキーマ + 既定値マージ**。壊れていたら既定に戻し、破損ファイルを `.bak` に退避して警告を出す（手編集する settings.json はその場に残し、上書きする直前に `.bak` へコピーする）
- `fs.watch` + 更新時刻のポーリングで監視（`main/store/watch-user-file.ts`）→ 変更を renderer に push（再起動不要）
- ショートカットはデータ（`shared/keybindings.ts`）で、ページの `keydown` が解決する。Electron の `globalShortcut` を使うのは `scope: 'global'` の1つ（表示 / 非表示の切り替え）だけで、利用者が設定で有効にしたときに限って OS に登録する（[decisions.md](decisions.md)）

---

## 10. ディレクトリ構成

```
elecdex/
├─ package.json / electron.vite.config.ts / electron-builder.yml / biome.json
├─ tsconfig.json / tsconfig.node.json / tsconfig.web.json / tsconfig.e2e.json
├─ vitest.config.ts / playwright.config.ts
├─ build/                  # icon.svg と生成物、NSIS の installer.nsh、macOS の entitlements
├─ public/                 # README のバナー（elecdex_repo_card.svg）
├─ resources/
│  ├─ icons/               # アプリと通知領域のアイコン
│  ├─ chip8/               # programs.json（gen:chip8）、archive/（chip8Archive、CC0）、test-suite/（GPL-3.0、Octo ソース付き）（§5.18）
│  └─ shell-integration/   # bash / zsh / fish / pwsh の注入スクリプト
├─ scripts/                # gen-icon / gen-repo-card / gen-geo / gen-cities / gen-screenshots、
│                          # sync-calc（vendor の電卓を上書き同期）、fix-node-pty（postinstall）
├─ examples/plugins/pomodoro/   # 新しい plugins フォルダに書き出すサンプル
├─ examples/plugins/keystream/  # apiVersion 2（canvas・keys・sound）の見本、リズムゲーム（plugins.md §13）
├─ src/
│  ├─ shared/              # ★ main / preload / renderer で共有: 型・チャネル名・純粋なロジック
│  │  ├─ api.ts            # ElecdexApi 型（唯一のソース）
│  │  ├─ channels.ts       # IPC チャネル名の定数
│  │  ├─ schemas/          # zod: layout（設定・テーマなどのスキーマは各モジュールに置く）
│  │  ├─ layout-ops.ts / layouts.ts / default-layout.ts   # 木の操作、保存レイアウト、既定の配置
│  │  ├─ layout-presets.ts / layout-shape.ts   # プリセット（§5.6）、縮図の矩形
│  │  ├─ settings.ts / theme.ts / keybindings.ts / background.ts / web.ts
│  │  ├─ plugin-api.ts / plugin-runtime.ts / plugins.ts   # プラグインの公開型・Worker の実行時・検証
│  │  ├─ plugin-keys.ts / plugin-sound.ts                # プラグインに渡すキー、プラグインが鳴らす音符の検査（純粋）
│  │  ├─ calc/             # vendor/（elecxzy の評価器を無改変で）+ elecdex 側のラッパー + types/
│  │  ├─ emu/              # エミュレータ共通の純粋関数: 時計（framesDue）、拡大率（fitScreen）（§5.18）
│  │  ├─ chip8/            # CHIP-8 の機械: 状態・命令・画面・互換モード・フォント・スナップショット・逆アセンブル・推定・キー（§5.18）
│  │  ├─ geo/              # 生成データ: 都市、国の重心、タイムゾーン → 国
│  │  ├─ ai.ts             # AI チャット: プロバイダ、会話、main とページの間のイベント（§5.7）
│  │  └─ weather*.ts / quakes*.ts / tsunami.ts / markets.ts / feeds.ts / notes.ts / tasks.ts / ...
│  ├─ main/
│  │  ├─ index.ts / window.ts / app-windows.ts / window-control.ts
│  │  ├─ ipc/              # 名前空間ごとのハンドラ（全て入力を検証）
│  │  ├─ store/            # json-store、cache-file、watch-user-file
│  │  ├─ pty/              # PtyManager、OscParser、shell-integration、screen-mirror、start-directory
│  │  ├─ metrics/          # broker と購読（collector は services/）
│  │  ├─ fs/ launcher/ weather/ markets/ feeds/ quakes/ updates/
│  │  ├─ clipboard/        # 見えている間だけ読む監視（watcher）、Electron の読み書き、テスト用の代役（§5.14）
│  │  ├─ media/            # NOW PLAYING: 見えている間だけ読む監視（watcher）、Windows の SMTC リーダー、代役（§5.15）
│  │  ├─ docker/           # DOCKER: エンジンの場所（endpoint）、Engine API のクライアント（engine）、見えている間だけの監視（watcher）、代役（§5.17）
│  │  ├─ awake/            # UTILITY の AWAKE: ホールドのサービス、powerSaveBlocker、代役（§5.16）
│  │  ├─ ai/               # 会話ストア、キー保管、チャットサービス、方言ごとのアダプタ（openai / anthropic）（§5.7）
│  │  ├─ reminders/        # 次の1件だけを待つスケジューラ（タスクとアラーム）
│  │  ├─ audio/            # 隠しキャプチャウィンドウ、parec、OS ごとのミキサー
│  │  ├─ plugins/          # 走査と変換・導入（install.ts）・代行 fetch・保存・サインイン窓（plugins.md）
│  │  ├─ web/              # Web ペインのビュー（views.ts）と共有セッション（partition.ts）（§5.4）
│  │  └─ background/       # 通知領域のアイコン、システム全体のショートカット、login/（OS ごと）
│  ├─ services/            # utilityProcess
│  │  ├─ metrics.worker.ts
│  │  └─ metrics/          # scheduler、sources、windows-sampler、geoip、sockets/（OS ごと）
│  ├─ preload/index.ts     # 唯一の境界
│  └─ renderer/
│     ├─ index.html / main.ts / App.svelte / BootScreen / SettingsDialog / TitleBar / Toasts / ...
│     ├─ audio-capture/    # 隠しキャプチャウィンドウのページ（workspace とは別セッション）
│     ├─ layout/           # Workspace、LayoutNodeView、SplitHost、TabsHost、PaneHost、PaneCorner（右上の ⤢ / ×）、
│     │                    # TabStrip、PanePicker、LayoutsDialog、pane-drag / pane-close / pane-zoom / layout-switch
│     ├─ plugins/          # PluginHost（Worker）、PluginPane、ブロック描画（CanvasBlock を含む）、合成音源（synth・voices・held）、Worker に渡す環境とフォント、設定欄
│     ├─ widgets/          # registry.ts、builtins.ts、common/（StreamChart、Digits、SegmentMeter、HoverCard・CardRows（§7.4）…）、
│     │                    # ウィジェットごとのフォルダ（monitor/ は監視系をまとめて持つ）
│     ├─ lib/              # frame-loop、crt-transitions、sfx、webgl、time-series、markdown（AI チャットの木）、hover-card（§7.4）…
│     ├─ stores/           # layout、appearance、sessions、metrics、ui、web、background …（runes）
│     └─ styles/           # reset / tokens / frames / effects / crt / motion
├─ tests/
│  ├─ unit/                # Vitest（node）
│  ├─ component/           # Vitest + jsdom
│  └─ e2e/                 # Playwright _electron（support.ts が外部サービスを全てスタブに向ける）
└─ docs/
   ├─ architecture.md      # 本書
   ├─ plugins.md           # プラグイン API とその規則
   ├─ weather-providers.md # 天気の提供元ごとの規約と取得方針
   └─ screenshots/         # README の画像（npm run gen:screenshots）
```

---

## 11. セキュリティ

| 項目 | 方針 |
|---|---|
| `contextIsolation` | `true`（原版は false） |
| `sandbox` | `true`。preload は `ipcRenderer` / `contextBridge` のみ使用 |
| `nodeIntegration` | `false`（原版は true） |
| `@electron/remote` | 不使用（原版は全面依存） |
| CSP | `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src blob:` — Svelte scoped CSS はビルド時に静的CSSになるので `unsafe-inline` 不要。`worker-src blob:` はプラグインの Worker のためだけにあり、その Worker もこの CSP を継承する（docs/plugins.md §4） |
| 入力検証 | renderer 由来の全入力を main 側で zod 検証。パスは `path.resolve` 正規化 + allowlist |
| ナビゲーション | `will-navigate` / `setWindowOpenHandler` で外部遷移を拒否し、`shell.openExternal` に委譲 |
| 外部通信 | すべて main が行い、renderer の CSP は `connect-src 'self'` のまま。行き先は、更新チェック（GitHub API。設定で無効化可能）、天気（気象庁 / MET Norway / NWS）、相場（Yahoo Finance）、地震と津波（気象庁、または USGS と NOAA）、利用者が並べた RSS フィード、利用者が設定に並べた AI プロバイダ（メッセージを送ったとき・「test」・モデル一覧を開いたときだけ。§5.7）、同意したプラグインが名指ししたホスト、Web ペインで開いたサイト。**どれも、それを必要とするペインがある間（地震は通知が有効な間も）だけ**通信し、条件付きリクエストでまとめて取り、失敗時は間隔を空けて最後のデータを画面に残す。相場は1分に1回の一括リクエスト（全市場クローズ中は5分に1回、チャートは期間に応じて5分〜1時間に1回）、天気は発表時刻の前後だけ。GeoIP は同梱データベースを引くだけで、更新のダウンロードも問い合わせもしない。取得間隔と各サービスの規約は README「Data sources」と [weather-providers.md](weather-providers.md) |
| Web ペイン | workspace とは別の `WebContentsView`（パーティション `persist:web`、preload なし、sandbox）。権限はクリップボード書き込みとフルスクリーンのみ、ダウンロードは取り消し、遷移は http/https のみでプリセットの `hosts` 外は既定のブラウザへ（§5.4）。workspace の CSP は変えない |
| XSS | `innerHTML` 使用禁止（Biome ルールで機械的に禁止）。原版の `_escapeHtml` / `_purifyCSS` 自作ヘルパは不要になる |

---

## 12. ビルド / 配布 / CI

- **ターゲット**: Windows `nsis` (x64, arm64) / macOS `dmg` (x64, arm64) / Linux `AppImage` + `deb` (x64, arm64)
- `node-pty` はネイティブモジュール。electron-builder の `npmRebuild` + `@electron/rebuild` で対応。プリビルドが無い組み合わせのみビルドツールチェーンが必要
- **CI は GitHub Actions のネイティブ arm64 ランナー**（`ubuntu-24.04-arm` / Apple Silicon の `macos-latest`）を使う。原版の QEMU + Docker クロスビルドは廃止 → ビルド時間とトラブルが激減する
- ワークフロー（`.github/workflows/ci.yml`）: `static`（lint + typecheck）と `test`（vitest）を ubuntu で、`e2e`（build → Playwright）を ubuntu / windows / macos の3つで並行に走らせる。リリースは別ファイル（`release.yml`）で、タグ `v<version>` の push で動き、タグと `package.json` の一致を確かめてから6つの配布物をプレリリースに添付する
- 署名は任意。macOS notarization の設定だけ用意し、secrets が無ければスキップする
- 配布物のサイズ目標: 原版比で縮小（vendored three.js と pdf.js が消え、バンドル + tree-shaking が効く）

---

## 13. テスト戦略

| 層 | 対象 | ツール |
|---|---|---|
| unit | OSC パーサ、設定マージ/マイグレーション、テーマ解決、ANSIパレット派生、レイアウトツリー操作（分割/閉じる/移動）、メトリクス購読カウント | Vitest |
| component | 各ウィジェットのレンダリング、StreamChart の描画呼び出し | Vitest + `@testing-library/svelte` |
| integration | PtyManager（実 PTY を spawn して `echo` の往復）、MetricsBroker の購読ライフサイクル | Vitest (node 環境) |
| E2E | 起動 → ターミナルでコマンド実行 → 出力検証 / タブ追加・削除 / ペイン分割 / テーマ切替（リロードなし）/ 設定変更の反映 | Playwright `_electron` |

**性能回帰テスト**: アイドル時の CPU 使用率とメモリを E2E で計測して縛る（`tests/e2e/metrics.spec.ts`）。原版の最大の問題が性能だったため、これを数値で持つ。既定レイアウトの実測は1コアの約12〜13%・ワーキングセット約600MB で、ローカルの閾値は 40%・1200MB、共有ランナーで揺れる CI は 300%・1500MB（暴走だけを捕まえる）。設計当初の目安（アイドル CPU < 3%、RSS < 400MB）は監視ペインを並べた既定レイアウトでは現実的でなく、実測に置き換えた。

**プラットフォームごとの確認の範囲**: 手元で動かして確かめているのは Windows だけ。macOS と Linux は
GitHub Actions の e2e（`ci.yml` の `ubuntu-latest` / `windows-latest` / `macos-latest`）が通ることしか
確かめていない。e2e はスタブ相手の自動操作なので、実機の音声デバイス、通知領域、Keychain / keyring、
IME、HiDPI、実際のシェルとの相性などは見ていない。**macOS と Linux の動作確認は十分でない**（§17）。

**テストは外部サービスに触れない**: 天気・相場・地震・更新確認・Web ペインの行き先は既定で閉じたポートに向け、必要な spec だけがローカルのスタブを立てる。音声・通知領域・サインイン時起動・ソケット一覧もスタブに差し替え、実機の音量・タスクバー・スタートアップ・接続先に触れない（環境変数の一覧は CLAUDE.md）。

---

## 14. 実装フェーズ（最初の計画の記録）

最初に立てた計画で、Phase 7 まで完了している（v0.0.1、2026-09-13）。当時の記述のまま残す — Phase 0 の pnpm は採用せず npm にした（§2）。以後の機能は [decisions.md](decisions.md) に記録している。

| Phase | 内容 | 完了条件 |
|---|---|---|
| **0** | スキャフォールド: pnpm / electron-vite / Svelte5 / TS7 / Biome / Vitest / Playwright / CI / electron-builder | 空ウィンドウが3OSでビルド&起動し、CI が全緑 |
| **1** | ターミナル: PtyManager + MessagePort + xterm + Shell Integration (OSC 7/133) + タブ無制限 | 3OSで対話シェルが動き、CWDとプロセス名が取れる（Windows含む） |
| **2** | レイアウトエンジン: LayoutTree / Splitter / TabsNode / WidgetRegistry / PaneHost + 永続化 | 既定レイアウト再現 + `layout.json` 編集で任意配置ができる |
| **3** | メトリクス基盤 + 監視ウィジェット: clock / sysinfo / cpu / memory / toplist / netstat / throughput | 購読0でポーリングが止まる。アイドルCPU閾値を満たす |
| **4** | ファイルシステムウィジェット: CWD追従、ディスク使用量、クリックでパス入力。気象庁の天気予報ペイン | Windows でも CWD 追従する。天気予報は出典を明記し、発表時刻以外に取得しない |
| **5** | デザイントークン / テーマ / SFX / ブート演出 / アプリアイコン | リロードなしでテーマ切替。テーマ3種を自作 |
| **6** | Globe + GeoIP: Natural Earth から陸地の点群を生成、three で実装、接続先を国ごとにプロット | ペインを閉じれば収集も描画も止まる。アイドル時の追加コストが 1コアの約1.5% |
| **7** | 設定UI / キーバインドUI / 更新チェック / リリースパイプライン | タグ push で3OS分の配布物が出る（プレリリースに添付） |

Phase 2.5（任意・後続）: ドラッグによるペイン分割/移動UI、ワークスペースプリセット。

---

## 15. 未決事項

1. ~~**更新チェック**~~ — Phase 7 で決定: GitHub Releases の確認のみ（[decisions.md](decisions.md)「更新チェック」）
2. **リガチャ** — Phase 5 で事前生成方式を入れるか、恒久的に見送るか
3. **都市単位 GeoIP** — 国単位（同梱、CC BY 4.0）で足りるか。都市単位が必要なら DB-IP City (CC-BY-4.0, 134MB) のオプトインDLを足す

---

## 16. 決定済みの選択（記録）

理由と実測値つきの判断の記録は [decisions.md](decisions.md) に分けた（2026-10-03。この文書の半分を
占めていた）。新しい判断はそちらの末尾に足す。

---

## 17. 既知の問題

- **macOS と Linux の動作確認は十分でない**。どちらも配布物は作っているが、確かめてあるのは
  GitHub Actions の e2e が通ることだけで、人が日常的に使って確かめた実績がない。とくに OS に触れる部分 —
  スペクトラムの音声取り込み（macOS は未確認と README にも明記）、ミキサー、通知領域とシステム全体の
  ショートカット、サインイン時の起動、CONNECTIONS ペインのソケット読み取り、AI チャットのキー暗号化
  （Keychain / keyring。e2e では `ELECDEX_AI_KEYS_STUB` で差し替えているので、本物は一度も通っていない）—
  は、Windows 以外では実機での確認を経ていない。
