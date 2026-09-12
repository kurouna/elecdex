# elecdex — アーキテクチャ設計書

> eDEX-UI (GitSquared/edex-ui, v2.2.8, 2021年アーカイブ) の完全リライト。
> 原版のコード・アセットは一切継承せず、同等以上の体験をモダンな技術スタックで再構築する。

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
- 外部プラグインの動的ロード（※レジストリ設計は将来のプラグイン化を見据える）

### ライセンス方針
原版は GPL-3.0。**原版のソース・アセット（テーマ、SFX wav、grid.json、vendored encom-globe.js）を一切持ち込まない**ことでライセンス継承を回避する。

- 地球儀のタイルデータ → [Natural Earth](https://www.naturalearthdata.com/)（public domain）から自前の生成スクリプトで作る
- SFX → 新規制作または CC0 素材
- フォント → SIL OFL 1.1 のものを同梱（Chakra Petch / Saira Condensed / JetBrains Mono）
- IP 位置情報 → RIR whois 由来の CC0-1.0 データ（帰属表示も不要）

---

## 2. 技術スタック（確定）

| 領域 | 採用 | バージョン | 備考 |
|---|---|---|---|
| シェル | Electron | 44.x | Chromium 最新系。`sandbox: true` + `contextIsolation: true` |
| 言語 | TypeScript | 5.9.x | `strict` 全部オン。enum/namespace 非使用（`erasableSyntaxOnly`）<br>**7.x を採用しない理由**: 7.0 は Go ネイティブ移植版で `lib/typescript.js` の JS Compiler API を同梱せず、`svelte-check` / `@sveltejs/vite-plugin-svelte` が動かない。ツール側が対応次第移行する |
| ビルド | electron-vite | 5.x (Vite 7.3) | main / preload / renderer の3ターゲット + HMR<br>Vite 8 は electron-vite 5 の peer 範囲外。あわせて `@sveltejs/vite-plugin-svelte` は 6.x（7.x は Vite 8 必須） |
| UI | Svelte | 5.x (runes) | VDOM なし。常駐60fps UI に最適 |
| スタイル | 素のCSS + CSS変数デザイントークン + Svelte scoped CSS | — | Tailwind 不採用（clip-path/SVG装飾主体のため） |
| 端末 | `@xterm/xterm` | 6.x | addon: fit 0.11 / webgl 0.19 / unicode11 0.9 / search 0.16 / web-links 0.12 / serialize 0.14 / clipboard 0.2 |
| PTY | `node-pty` | 1.1.x | main プロセスで spawn。プリビルド配布あり |
| システム情報 | `systeminformation` | 5.33.x | `utilityProcess` 内でのみ使用 |
| 3D | `three` + `@threlte/core` | 0.186 / 8.x | Globe を自前実装 |
| フォント | Chakra Petch / Saira Condensed / JetBrains Mono | fontsource 5.3 | すべて SIL OFL 1.1。woff2 をローカル同梱（`font-src 'self'`） |
| GeoIP | `@ip-location-db/geo-whois-asn-country-mmdb` + `mmdb-lib` | 2.x / 3.x | **CC0-1.0**、15.7MB を同梱。アカウント・APIキー・初回DL・同意が全て不要で完全オフライン |
| 設定検証 | `zod` | 4.x | 設定・テーマ・IPC入力の全検証 |
| ファイル監視 | `chokidar` | 5.x | 設定/テーマのホットリロード |
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
│    └── utilityProcess: geoip     (mmdb-lib + 同梱CC0 DB)   │
│                                                             │
│  SettingsStore    zod 検証 + chokidar 監視                   │
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
│      └─ widgets: terminal / cpu / memory / toplist /        │
│                  netstat / throughput / globe / filesystem /│
│                  clock / sysinfo                            │
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
| バンドラなし、terser/clean-css の後処理のみ | electron-vite（Rollup/esbuild） |

---

## 4. IPC 設計

### 4.1 境界の原則
- renderer は **`window.elecdex` 以外の手段を一切持たない**（Node なし、remote なし、`eval` も CSP で封鎖）
- main 側の全ハンドラは **zod スキーマで入力を検証**してから処理する。パスは正規化して allowlist 照合
- チャネル名・ペイロード型・スキーマは `src/shared/` に集約し、main / preload / renderer が同一定義を import する

### 4.2 公開 API（preload）

```ts
// src/shared/api.ts が型の唯一のソース
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
  }
  fs: {
    readDir(path: string): Promise<DirEntry[]>
    watch(path: string, handler: () => void): () => void
    diskUsage(path: string): Promise<DiskUsage>
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
- ワークスペースのプリセット保存/切替
- 1つの領域を複数タブで共有（`TabsNode`）

v1 の既定レイアウトは原版の見た目（左カラム=システム / 中央=端末 / 右カラム=ネットワーク）を `SplitNode` で再現する。v1 ではドラッグ分割UIを出さず、既定プリセット + `layout.json` 直編集で足りる（分割UIは Phase 2.5 以降）。

### 5.2 ウィジェットレジストリ

```ts
interface WidgetDefinition<P = unknown> {
  id: WidgetId
  title: string
  component: Component                  // Svelte コンポーネント
  propsSchema?: z.ZodType<P>            // props の検証
  metrics?: MetricSourceId[]            // 宣言した分だけ購読される
  minSize?: { w: number; h: number }
  aspect?: "free" | "square"
  capabilities?: ("resizable" | "multiple" | "needsGpu")[]
}

export const widgets = defineWidgets([
  terminalWidget, clockWidget, sysinfoWidget, cpuWidget,
  memoryWidget, toplistWidget, netstatWidget, throughputWidget,
  globeWidget, filesystemWidget,
])
```

- `PaneHost.svelte` が `widget: WidgetId` からレジストリを引いてコンポーネントを解決する
- ウィジェットは **自分が欲しいメトリクスを宣言するだけ**。購読/解除は `PaneHost` が生存期間に合わせて自動処理する
- 将来のプラグイン化: レジストリを「ビルトイン + 動的登録」の2層にし、動的側は別 `utilityProcess` でサンドボックス実行する余地を残す（v1 では静的登録のみ）

### 5.3 ターミナルセッションの寿命
ペインの寿命と PTY セッションの寿命を**分離**する。

- PTY は main の `PtyManager` が `sessionId` で保持する
- ペインを閉じてもセッションは（設定次第で）生き残せる → 誤操作からの復帰、ペインの移動、タブの付け替えが可能
- ウィンドウ再読み込み（開発時のHMR含む）でもセッションは維持され、`attach` で再結線する

---

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
- PTY 起動時に注入する: bash は `--init-file`、zsh は `ZDOTDIR` 差し替え、fish は `XDG_DATA_DIRS`、pwsh は `-NoExit -Command`
- main の `OscParser` が PTY 出力ストリームから該当シーケンスを抽出（xterm には渡さず消費）し、`onCwd` / `onProcess` として通知する
- **フォールバック**: 一定時間 OSC が来なければ、Linux `/proc` / macOS `lsof` を**低頻度**（3〜5秒）でポーリング。Windows はフォールバックなし（注入が効かないシェルでは CWD 追従を無効表示）
- 副産物として「直前コマンドの終了コード」「実行時間」が取れるので、ステータス表示に使える

### 6.3 シェル解決
`which` 相当を main 側で実装し、`shell-env` 相当（ログインシェルの環境変数取り込み、原版 issue #366）も main で行う。`TERM=xterm-256color` / `COLORTERM=truecolor` / `TERM_PROGRAM=elecdex` を付与する。

---

## 7. テーマ / デザイントークン

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

  /* ── semantic ── コンポーネントが参照する層 */
  --accent:        hsl(var(--accent-h) var(--accent-s) var(--accent-l));
  --accent-dim:    hsl(var(--accent-h) var(--accent-s) var(--accent-l) / .35);
  --accent-faint:  hsl(var(--accent-h) var(--accent-s) var(--accent-l) / .12);
  --text:          var(--accent);
  --text-muted:    hsl(var(--accent-h) var(--accent-s) 55%);
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
const ThemeSchema = z.object({
  id: z.string(), name: z.string(), author: z.string().optional(),
  accent: z.object({ h: z.number(), s: z.number(), l: z.number() }),
  surfaces: z.object({ s0: Hex, s1: Hex, s2: Hex, line: Hex }),
  fonts: z.object({ display: z.string(), ui: z.string(), mono: z.string() }),
  terminal: z.object({ /* fg, bg, cursor, selection, ansi16?: … */ }),
  globe: z.object({ base: Hex, marker: Hex, pin: Hex, arc: Hex }).optional(),
  effects: z.object({ scanlines: z.boolean(), glow: z.number() }).optional(),
})
```

- 適用は `el.style.setProperty("--accent-h", …)` の一括更新。**DOM/HTML の再注入はしない**（原版の `head.innerHTML +=` / `injectCSS` 生注入を廃止）
- テーマ切替は**ページリロード不要**（原版は `window.location.reload(true)` していた）。xterm のテーマも `term.options.theme = …` で差し替える
- 任意CSSの持ち込みを許すなら `@layer theme-override` 内に限定し、CSSOM でパースできたルールのみ適用する（v1 では機能自体を入れない）
- 解決順: **内蔵(asar) → userData オーバーレイ**。同名IDはユーザー側が勝つ。内蔵を userData に書き戻さない

### 7.3 SF演出の実装方針
原版の `augmented-ui`（角切りフレーム）は `clip-path` + 擬似要素で自前実装する。ブートログ演出・グリッチロゴ・パネルの順次フェードインは Svelte の transition + CSS アニメーションで再構成し、**`prefers-reduced-motion` と設定で無効化できる**ようにする。

---

## 8. チャート / 可視化

| 原版 | elecdex |
|---|---|
| smoothie 1.35（DOM canvas、ライブラリのRAFループ） | 自前 `StreamChart`。単一RAFループを全チャートで共有し、`OffscreenCanvas` + Worker に描画を逃がす |
| RAM: 440個の `<div>` を毎1.5秒更新 | 単一 Canvas のドットマップ（DOMノード440個の更新を排除） |
| ENCOM Globe（vendored three.js 43,539行） | three 0.186 + threlte。タイルは Natural Earth から自前生成、ピン/アーク/衛星軌道を InstancedMesh で描画 |

- Globe は GPU負荷が高いので、**設定で無効化でき、ウィンドウ非フォーカス時はフレームレートを落とす**
- `backgroundThrottling: false` は原版同様必要だが、可視性に応じた自前のレート制御を入れる

---

## 9. 設定 / 永続化

`app.getPath("userData")` 配下:

```
settings.json       # zod 検証付き。未知キーは保持したまま警告
keybindings.json    # ショートカット定義
layout.json         # LayoutTree（version 付き、マイグレータあり）
sessions.json       # 復元するターミナルセッション
themes/             # ユーザーテーマ（内蔵へのオーバーレイ）
logs/
```

- すべて **zod スキーマ + 既定値マージ**。壊れていたら既定に戻し、破損ファイルを `.bak` に退避して警告を出す
- `chokidar` で監視 → 変更を renderer に push（再起動不要）
- ショートカットは原版同様 `app` / `shell` の2種（アプリ動作 / 端末へコマンド送出）。`globalShortcut` は**アプリがフォーカスされている間だけ**登録する（原版 issue #361 相当の挙動を明示的に設計へ入れる）

---

## 10. ディレクトリ構成

```
elecdex/
├─ package.json
├─ electron.vite.config.ts
├─ electron-builder.yml
├─ biome.json
├─ tsconfig.json / tsconfig.node.json / tsconfig.web.json
├─ resources/
│  ├─ icons/               # アプリアイコン (ico/icns/png)
│  ├─ fonts/               # OFL/Apache フォント
│  ├─ sfx/                 # CC0/新規 SFX
│  ├─ shell-integration/   # bash/zsh/fish/pwsh 注入スクリプト
│  └─ geo/                 # Natural Earth から生成したタイルデータ
├─ scripts/
│  ├─ gen-geo-tiles.ts     # Natural Earth → タイルJSON
│  └─ gen-icons.ts
├─ src/
│  ├─ shared/              # ★ main/preload/renderer で共有
│  │  ├─ api.ts            # ElecdexApi 型
│  │  ├─ channels.ts       # IPC チャネル名の定数
│  │  ├─ schemas/          # zod: settings / theme / layout / metrics
│  │  └─ types/
│  ├─ main/
│  │  ├─ index.ts
│  │  ├─ window.ts
│  │  ├─ ipc/              # ハンドラ（全て zod 検証）
│  │  ├─ pty/              # PtyManager, OscParser, shell-resolve, env
│  │  ├─ metrics/          # MetricsBroker, sources/
│  │  ├─ settings/
│  │  ├─ themes/
│  │  └─ fsbridge/
│  ├─ services/            # utilityProcess エントリ
│  │  ├─ metrics.worker.ts
│  │  └─ geoip.worker.ts
│  ├─ preload/
│  │  └─ index.ts          # 唯一の境界
│  └─ renderer/
│     ├─ index.html
│     ├─ main.ts
│     ├─ App.svelte
│     ├─ layout/           # LayoutTree 描画, Splitter, TabStrip, PaneHost
│     ├─ widgets/
│     │  ├─ registry.ts
│     │  ├─ terminal/ clock/ sysinfo/ cpu/ memory/ toplist/
│     │  └─ netstat/ throughput/ globe/ filesystem/
│     ├─ lib/              # StreamChart, SfxPlayer, theme-apply, ansi-palette
│     ├─ stores/           # settings, layout, sessions, metrics, theme (runes)
│     ├─ styles/           # reset.css, tokens.css, frames.css
│     └─ boot/             # ブート演出
├─ tests/
│  ├─ unit/                # Vitest
│  └─ e2e/                 # Playwright _electron
└─ docs/
   ├─ architecture.md      # 本書
   ├─ theming.md
   └─ widgets.md
```

---

## 11. セキュリティ

| 項目 | 方針 |
|---|---|
| `contextIsolation` | `true`（原版は false） |
| `sandbox` | `true`。preload は `ipcRenderer` / `contextBridge` のみ使用 |
| `nodeIntegration` | `false`（原版は true） |
| `@electron/remote` | 不使用（原版は全面依存） |
| CSP | `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'` — Svelte scoped CSS はビルド時に静的CSSになるので `unsafe-inline` 不要 |
| 入力検証 | renderer 由来の全入力を main 側で zod 検証。パスは `path.resolve` 正規化 + allowlist |
| ナビゲーション | `will-navigate` / `setWindowOpenHandler` で外部遷移を拒否し、`shell.openExternal` に委譲 |
| 外部通信 | 更新チェック（GitHub API）と GeoIP DB 更新のみ。いずれも**設定で無効化可能**、GeoIP は初回同意制 |
| XSS | `innerHTML` 使用禁止（Biome ルールで機械的に禁止）。原版の `_escapeHtml` / `_purifyCSS` 自作ヘルパは不要になる |

---

## 12. ビルド / 配布 / CI

- **ターゲット**: Windows `nsis` (x64, arm64) / macOS `dmg` (x64, arm64) / Linux `AppImage` + `deb` (x64, arm64)
- `node-pty` はネイティブモジュール。electron-builder の `npmRebuild` + `@electron/rebuild` で対応。プリビルドが無い組み合わせのみビルドツールチェーンが必要
- **CI は GitHub Actions のネイティブ arm64 ランナー**（`ubuntu-24.04-arm` / Apple Silicon の `macos-latest`）を使う。原版の QEMU + Docker クロスビルドは廃止 → ビルド時間とトラブルが激減する
- ワークフロー: `lint` → `typecheck` (`tsc --noEmit` + `svelte-check`) → `test:unit` → `build` → `test:e2e` →（タグ時のみ）`release`
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

**性能回帰テスト**: アイドル時の CPU 使用率とメモリを E2E で計測し、閾値（例: アイドル CPU < 3%、RSS < 400MB）を CI でガードする。原版の最大の問題が性能だったため、これを数値で縛る。

---

## 14. 実装フェーズ

| Phase | 内容 | 完了条件 |
|---|---|---|
| **0** | スキャフォールド: pnpm / electron-vite / Svelte5 / TS7 / Biome / Vitest / Playwright / CI / electron-builder | 空ウィンドウが3OSでビルド&起動し、CI が全緑 |
| **1** | ターミナル: PtyManager + MessagePort + xterm + Shell Integration (OSC 7/133) + タブ無制限 | 3OSで対話シェルが動き、CWDとプロセス名が取れる（Windows含む） |
| **2** | レイアウトエンジン: LayoutTree / Splitter / TabsNode / WidgetRegistry / PaneHost + 永続化 | 既定レイアウト再現 + `layout.json` 編集で任意配置ができる |
| **3** | メトリクス基盤 + 監視ウィジェット: clock / sysinfo / cpu / memory / toplist / netstat / throughput | 購読0でポーリングが止まる。アイドルCPU閾値を満たす |
| **4** | ファイルシステムウィジェット: CWD追従、ディスク使用量、クリックでパス入力 | Windows でも CWD 追従する |
| **5** | デザイントークン / テーマ / SFX / ブート演出 | リロードなしでテーマ切替。テーマ3種を自作 |
| **6** | Globe + GeoIP: Natural Earth タイル生成、three/threlte 実装、接続先プロット | 無効化可能。GPU負荷が許容範囲 |
| **7** | 設定UI / キーバインドUI / 更新チェック / リリースパイプライン | タグ push で3OS分の配布物が出る |

Phase 2.5（任意・後続）: ドラッグによるペイン分割/移動UI、ワークスペースプリセット。

---

## 15. 未決事項

1. **更新チェック** — GitHub Releases を叩くだけにするか、`electron-updater` で自動更新まで入れるか（署名なしだと Windows/macOS で体験が悪い）
2. **リガチャ** — Phase 5 で事前生成方式を入れるか、恒久的に見送るか
3. **都市単位 GeoIP** — 国単位（同梱 CC0）で足りるか。都市単位が必要なら DB-IP City (CC-BY-4.0, 134MB) のオプトインDLを足す

---

## 16. 決定済みの選択（記録）

| 論点 | 決定 | 理由 |
|---|---|---|
| ライセンス | MIT | 原版コード・アセットを一切継承しないクリーンリライトのため GPL 継承は発生しない |
| GeoIP | `@ip-location-db/geo-whois-asn-country-mmdb`（CC0-1.0, 15.7MB）を同梱 + 国重心テーブル | ユーザー操作ゼロが要件。GeoLite2 はアカウント必須、DB-IP City は 134MB。RIR whois 由来の CC0 データなら帰属表示すら不要で、ルックアップも端末外に出ない |
| フォント | Chakra Petch (display) / Saira Condensed (ui) / JetBrains Mono Variable (mono)、すべて OFL 1.1 | 原版の United Sans は商用。Saira Condensed が最も素性が近く9ウェイト。Chakra Petch が SF の角切り感を担う |
| TypeScript | 5.9.3 | 7.0 は JS Compiler API 非同梱のため Svelte ツールチェーンが動かない |
| Vite | 7.3.6 + `@sveltejs/vite-plugin-svelte` 6.x | electron-vite 5 の peer 範囲。Vite 8 に上げるには electron-vite 6 待ち |
| アプリ名/バージョンの解決 | `app.setName()` + ビルド時 `define` で `__APP_VERSION__` を注入 | `out/` に package.json が無いため、未パッケージ実行では `app.getName()` が "Electron"、`app.getVersion()` が Electron のバージョンを返し、`userData` も Electron の設定ディレクトリを指してしまう（E2E で回帰を固定） |
| アイコン | `scripts/gen-icon.mjs` が SDF から build/icon.png を生成。ico/icns/Linux セットは electron-builder が派生 | バイナリ資産をリポジトリに持たず、デザイントークンと色が同期する |
| Biome の Svelte 対応 | `*.svelte` では `noUnusedImports` / `noUnusedVariables` を無効化 | Biome はマークアップ内での参照を追跡しないため、テンプレートでのみ使う import/変数を誤検知する。この検査は `svelte-check` が正しく担う |
