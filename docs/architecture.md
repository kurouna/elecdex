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
| ビルド | electron-vite | 5.x (Vite 7.3.6) | main / preload / renderer の3ターゲット + HMR<br>**Vite 8 は採用不可**: Rolldown が Svelte 5.57 の内部 ESM をパースできずビルドが失敗する（実測済み）|
| UI | Svelte | 5.x (runes) | VDOM なし。常駐60fps UI に最適 |
| スタイル | 素のCSS + CSS変数デザイントークン + Svelte scoped CSS | — | Tailwind 不採用（clip-path/SVG装飾主体のため） |
| 端末 | `@xterm/xterm` | 6.x | addon: fit 0.11 / webgl 0.19 / unicode11 0.9 / search 0.16 / web-links 0.12 / serialize 0.14 / clipboard 0.2 |
| PTY | `node-pty` | 1.1.x | main プロセスで spawn。プリビルド配布あり |
| システム情報 | `systeminformation` | 5.33.x | `utilityProcess` 内でのみ使用 |
| 3D | `three` | 0.186 | Globe を自前実装。threlte は採用せず、シーン1つを素の three で書く（依存を増やす利点がない規模だった） |
| フォント | Chakra Petch / Saira Condensed / JetBrains Mono | fontsource 5.3 | すべて SIL OFL 1.1。woff2 をローカル同梱（`font-src 'self'`） |
| GeoIP | `@ip-location-db/geo-whois-asn-country-mmdb` + `mmdb-lib` | 2.3 / 3.0 | データは **CC BY 4.0（NRO）**、統合版 7.8MB のみ同梱。アカウント・APIキー・初回DL・同意が全て不要で完全オフライン |
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
│      └ geoip: 同じ collector 内で mmdb-lib + 同梱DB を遅延読込 │
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

v1 の既定レイアウトは原版の見た目（左カラム=システム / 中央=端末 / 右カラム=ネットワーク）を `SplitNode` で再現する。v1 ではドラッグ分割UIを出さず、既定プリセット + `layout.json` 直編集で足りる（分割UIは Phase 2.5 以降）。v0.0.2 でタイトルのドラッグ＆ドロップによる移動を追加した（§16）。

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
- プラグイン: レジストリは「ビルトイン + 動的登録」の2層。動的側には全プラグイン共通の `PluginPane.svelte` が `plugin:<id>` で載り、プラグイン本体は renderer の blob Worker で動く（仕様は [plugins.md](plugins.md)）

### 5.3 ターミナルセッションの寿命
ペインの寿命と PTY セッションの寿命を**分離**する。

- PTY は main の `PtyManager` が `sessionId` で保持する
- ペインを閉じてもセッションは（設定次第で）生き残せる → 誤操作からの復帰、ペインの移動、タブの付け替えが可能
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

初期のプリセットは `browser`（汎用）・`youtube`・`x` の 3 つ。ウィジェット id は `web.browser` / `web.youtube` / `web.x`。どれも複数置ける。

**セッション**: すべての Web ペインで 1 つの永続パーティション `persist:web` を共有する。YouTube プリセットでログインすれば、汎用ブラウザで開いた youtube.com もログイン済みになる。
- 守るべき境界は「workspace ⇔ Web ペイン」であり、ここは分けたまま。Web ペインどうしの分離は Chromium の Cookie のドメイン分離とサイト分離に任せる
- 代わりに、同じサイトの複数アカウントを並べては使えない（必要になれば「ペインごとの別セッション」を後から足す）
- 設定に「Web ペインのサイトデータを削除」（ログアウト）を置く

**ページに与えるもの**（パーティションの準備は 1 回だけ）:
- preload なし。`sandbox` / `contextIsolation` 有効、`nodeIntegration` 無効、スペルチェック無効（辞書のダウンロードを起こさないため）
- 権限は `clipboard-sanitized-write`（リンクのコピー）と `fullscreen` だけ許可し、ほかは拒否する（位置情報・カメラ・マイク・通知など）
- ページが全画面を要求したとき（動画の全画面ボタン）、Electron はウィンドウを全画面にし、終われば元に戻す（アプリがもともと全画面なら全画面のまま。実測）。ページの描画はビューの大きさのままなので、その間 main はビューをウィンドウ全体に広げて最前面に置き、ウィンドウのリサイズにも合わせる。終わればペインの矩形に戻す。その間に届いたペインの矩形は覚えておき、戻すときに使う
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
- ページには `prefers-color-scheme` をテーマの `mode` で伝える（`nativeTheme.themeSource`）。SF テーマではダークになり、フィルタ後は「暗い地にアクセント色の文字」になる。Business (Light) ではライト
- ビューの背景色はテーマの `surfaces.s0`。読み込み前やフィルタを入れる前の一瞬の白を抑える

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

- すべて **zod スキーマ + 既定値マージ**。壊れていたら既定に戻し、破損ファイルを `.bak` に退避して警告を出す（手編集する settings.json はその場に残し、上書きする直前に `.bak` へコピーする）
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
│  │  ├─ plugins/          # 走査と変換・代行 fetch・保存・サインイン窓（docs/plugins.md）
│  │  ├─ web/              # Web ペインのビュー（views.ts）と共有セッション（partition.ts）（§5.4）
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
│     ├─ plugins/          # PluginHost（Worker）、PluginPane、ブロック描画、設定欄
│     ├─ widgets/
│     │  ├─ registry.ts
│     │  ├─ terminal/ clock/ sysinfo/ cpu/ memory/ toplist/
│     │  ├─ netstat/ throughput/ globe/ filesystem/
│     │  └─ web/           # WebWidget（全プリセット共通、§5.4）
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
| CSP | `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src blob:` — Svelte scoped CSS はビルド時に静的CSSになるので `unsafe-inline` 不要。`worker-src blob:` はプラグインの Worker のためだけにあり、その Worker もこの CSP を継承する（docs/plugins.md §4） |
| 入力検証 | renderer 由来の全入力を main 側で zod 検証。パスは `path.resolve` 正規化 + allowlist |
| ナビゲーション | `will-navigate` / `setWindowOpenHandler` で外部遷移を拒否し、`shell.openExternal` に委譲 |
| 外部通信 | 更新チェック（GitHub API）、GeoIP DB 更新、気象庁の天気予報、Yahoo Finance の相場のみ。相場は markets ペインがある間だけ（1分に1回の一括リクエスト、全市場クローズ中は5分に1回。チャートは期間に応じて5分〜1時間に1回）。更新チェックと GeoIP は**設定で無効化可能**、GeoIP は初回同意制。天気予報は天気ペインがある間だけ、発表時刻の前後に条件付きリクエストで取得（ペインを置かなければ通信しない）。通信は main が行い、renderer の CSP は `connect-src 'self'` のまま |
| Web ペイン | workspace とは別の `WebContentsView`（パーティション `persist:web`、preload なし、sandbox）。権限はクリップボード書き込みとフルスクリーンのみ、ダウンロードは取り消し、遷移は http/https のみでプリセットの `hosts` 外は既定のブラウザへ（§5.4）。workspace の CSP は変えない |
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
| **4** | ファイルシステムウィジェット: CWD追従、ディスク使用量、クリックでパス入力。気象庁の天気予報ペイン | Windows でも CWD 追従する。天気予報は出典を明記し、発表時刻以外に取得しない |
| **5** | デザイントークン / テーマ / SFX / ブート演出 / アプリアイコン | リロードなしでテーマ切替。テーマ3種を自作 |
| **6** | Globe + GeoIP: Natural Earth から陸地の点群を生成、three で実装、接続先を国ごとにプロット | ペインを閉じれば収集も描画も止まる。アイドル時の追加コストが 1コアの約1.5% |
| **7** | 設定UI / キーバインドUI / 更新チェック / リリースパイプライン | タグ push で3OS分の配布物が出る（プレリリースに添付） |

Phase 2.5（任意・後続）: ドラッグによるペイン分割/移動UI、ワークスペースプリセット。

---

## 15. 未決事項

1. ~~**更新チェック**~~ — Phase 7 で決定: GitHub Releases の確認のみ（§16「更新チェック」）
2. **リガチャ** — Phase 5 で事前生成方式を入れるか、恒久的に見送るか
3. **都市単位 GeoIP** — 国単位（同梱 CC0）で足りるか。都市単位が必要なら DB-IP City (CC-BY-4.0, 134MB) のオプトインDLを足す

---

## 16. 決定済みの選択（記録）

| 論点 | 決定 | 理由 |
|---|---|---|
| ライセンス | **GPL-3.0**（原版 eDEX-UI と同一の LICENSE 本文） | オーナー判断により原版と同じライセンスで公開する。README に eDEX-UI への謝辞を記載。同梱アセット（OFL フォント、CC0 の IP データ、Public Domain の地理データ）はいずれも GPL と両立する |
| GeoIP | `@ip-location-db/geo-whois-asn-country-mmdb`（統合版 7.8MB のみ同梱、IPv4/IPv6 別ファイルは electron-builder で除外）+ 国重心テーブル | ユーザー操作ゼロが要件。GeoLite2 はアカウント必須、DB-IP City は 134MB。ルックアップは端末外に出ない。**訂正（Phase 6）**: 当初「CC0 で帰属表示不要」と記録したが、npm の license 欄が CC0-1.0 なだけで、同梱の NRO_LICENSE ではデータは CC BY 4.0（NRO）であり帰属表示が必要。地球儀ペインに「GeoIP: NRO, CC BY 4.0」、README に出典を表示する |
| フォント | Chakra Petch (display) / Saira Condensed (ui) / JetBrains Mono Variable (mono)、すべて OFL 1.1 | 原版の United Sans は商用。Saira Condensed が最も素性が近く9ウェイト。Chakra Petch が SF の角切り感を担う |
| TypeScript | 7.0.2 (native) + 6.0.3 (JS API) を併置、`svelte-check --tsgo` | 7.0 単体では JS Compiler API が無く svelte-check が動かないが、6 と併置して `--tsgo` を渡せば Svelte も TS7 で検査できる。TS7 移行で `baseUrl` 廃止と `composite`+`noEmit` 非対応の対応が必要だった |
| Vite | 7.3.6 + `@sveltejs/vite-plugin-svelte` 6.x | electron-vite 6.0.0-beta.1 は Vite 8 を受け付けるが、**Vite 8 の Rolldown が Svelte 5.57 をパースできずビルドが失敗する**（実測）。Rolldown 側の対応待ち |
| アプリ名/バージョンの解決 | `app.setName()` + ビルド時 `define` で `__APP_VERSION__` を注入 | `out/` に package.json が無いため、未パッケージ実行では `app.getName()` が "Electron"、`app.getVersion()` が Electron のバージョンを返し、`userData` も Electron の設定ディレクトリを指してしまう（E2E で回帰を固定） |
| アイコン | 手で編集する原本は `build/icon.svg` のみ。elec シリーズ（elecxzy / elecxterm / elecxmail）共通の構図に従い、アプリ固有のモチーフ（角切り HUD フレームの暗い画面・プロンプト・ワイヤーフレームの地球儀と接続ピン・CPU の波形）の上に、左下へシリーズ共通の「E」バッジ（#0ea5e9 の円・白フチ・3本の角丸バー）を重ねる。`npm run gen:icon`（@resvg/resvg-js）が build/icon.png（1024px、ico/icns/Linux 用は electron-builder が派生）と resources/icons/icon.png（256px、実行時のウィンドウ/タスクバー）を生成 | シリーズで統一した見た目にし、ベクターの原本から全サイズを作る |
| Biome の Svelte 対応 | `*.svelte` では `noUnusedImports` / `noUnusedVariables` を無効化 | Biome はマークアップ内での参照を追跡しないため、テンプレートでのみ使う import/変数を誤検知する。この検査は `svelte-check` が正しく担う |
| Svelte 5 $state と IPC | 保存時は `$state.snapshot` でプレーン化する | `$state` はツリーを Proxy で包み、structuredClone も Electron IPC も Proxy を複製できない。素の `this.tree` を渡すと例外になり、レイアウト保存が毎回失われていた（実測で発見） |
| アプリのショートカット | window の **capture** 段階で取得し伝播を止める | xterm は Backspace 等を自前の keydown で処理して伝播を止めるため、バブリング段階のリスナーには届かない（実測で発見） |
| セッションの回収 | ペインのアンマウントではシェルを殺さず、Workspace がレイアウト確定後に「現存ペインが所有しない」セッションだけを回収する | リロードやペイン移動でシェルを失わないため。所有判定をストア全体から行うと、閉じたペインの残骸が所有扱いになりシェルが永久にリークする（実測で発見） |
| レイアウトの破損ファイル | 読めない layout.json は `.bak` に退避し既定レイアウトで起動。読み込みで書き戻さない | 原版は起動毎に内蔵設定で userData を上書きし、ユーザー編集を消していた |
| HUD の意匠（Phase 3） | 原版 CSS から読み取った語彙で再構成: 監視モジュールは**枠で囲まず**上罫線（アクセント30%）＋両端の目盛り、角切り枠（50%）はシェルだけ、列見出し「PANEL / SYSTEM」（後に廃止）、35° 傾けた平行四辺形タブ（選択中は塗り）、方眼の背景。ルート文字サイズを `clamp(11px, 1.48vh, 26px)` で画面高に連動させ rem トークンを拡縮 | 原版は `augmented-ui` と vh 単位で同じ見た目を作っていた。外枠の種類はウィジェット定義の `chrome` / `headless` で決め、レイアウトエンジンは関知しない |
| メトリクスの配信 | utilityProcess 上の `MetricScheduler`（購読 0 で停止、同一間隔を1タイマーに集約、実行中は重ねない、同時起動時は 150ms ずつずらす）と、main の `MetricsBroker`（購読レジストリ、遅延起動、リロード/破棄での購読解除、最後の値の即時再送） | 原版は各ウィジェットが個別の setInterval で systeminformation を叩いていた。購読 0 で止まることは単体テストと E2E（収集回数が増えないこと）で固定 |
| Windows の収集方法 | 頻繁なソース（通信量・プロセス・IF・ping・電源・swap）は、自前で常駐させた PowerShell 1本が **.NET API** をループで読み JSON 行を流す `WindowsSampler` から取る。静的情報（10分間隔）だけ systeminformation | 実測（i5-1335U、システム全体の CPU 差分）: systeminformation 経由では既定レイアウトの監視が **1コアの143.8%**。呼び出しごとに PowerShell/wmic/ping.exe を起動するため。systeminformation の常駐 PowerShell モードは初回以降の呼び出しがすべて無期限にハングし使用不可。サンプラー化後は **13.6%**（アプリのツリー合計とシステム差分が一致し、隠れた子プロセスのコストが残っていないことを確認）。サンプラーは親 PID を毎秒確認し、親の強制終了後に孤児として残らない（実測で 0 を確認） |
| チャートの描画 | 自前 `StreamChart`。全チャートで1つのループを共有するが **連続 rAF にしない**（タイマーで 10fps に間引き、描画時だけ rAF）。1px 未満しか動かないフレームは描かない。非表示時は停止 | 連続 rAF は vsync ごとに renderer と GPU プロセスを起こす。60秒幅のチャートは約 200ms に 1px しか動かない |
| 性能の上限（E2E） | 既定レイアウトのアイドル時、Electron の全プロセスの累積 CPU 時間から 1コアの 40% 未満、ワーキングセット 1200MB 未満 | ローカル実測は 1コアの約 10%、約 570MB。CI の揺らぎを見込んだ上限 |
| layout.json の読み込み | `layout.load` のたびにディスクを読み直す。renderer の unload 時の保存は、保存待ちがある場合だけ行う | キャッシュと無条件の保存が、起動中に手で編集した layout.json を上書きしていた（E2E で発見・固定） |
| ターミナルの再接続時の画面 | main で各セッションの出力を `@xterm/headless` にも流し、attach 時は `@xterm/addon-serialize` のスナップショット（画面＋スクロールバック＋代替画面）を送る。スナップショット取得中に届いた出力はポートごとに保留し、スナップショットの後に送る。renderer は非表示のペインを fit せず、PTY へのリサイズは 120ms 安定してから送る | 生バイト列の再生は、Windows ConPTY がカーソル位置指定で画面を描き直すため別サイズの画面では崩れる。さらに**原因の本体**は、タブ化で再マウントされた背景タブ（display:none）を fit して 12x5 が PTY に送られ、ConPTY がバッファをその幅で折り返して再描画していたこと（実測で特定、E2E で修正前に失敗することを確認）。VS Code の再接続と同じ方式 |
| 起動シーケンス | 原版と同じ3段構成（ブートログ → タイトル → ペインの順次表示）。ブートログは原版の架空の macOS カーネルログではなく、実行環境・マシン・renderer のセキュリティ設定・復元するレイアウトなど起動時に実際に分かる事実を、原版と同じく加速しながら流す。表示順はシェルが先、以降はモジュールを「列方向の分割だけを数えた上からの行」ごとに左右同時に（原版の左右列の同期を任意のレイアウトへ一般化）。各ペインは steel-ignition の CRT シェーダーの電源投入（中央の横線から easeOutBack で上下に開く・開く縁の発光ビーム・半分開くまでの走査線フリッカー）を CSS の transform と疑似要素で再現する。ワークスペースは最初から visibility:hidden でマウントし、シェルとメトリクスは演出中に起動する。任意のキー/クリックでスキップ、ウィンドウごとに1回（sessionStorage）、`--no-intro` と prefers-reduced-motion で無効 | 演出が起動時間を増やさないこと、毎回見せられないことが条件。display:none ではなく visibility で隠すのは、表示時点で各ペインが実寸を持ちターミナルの fit が正しく行われるため（前項の ConPTY の問題を再発させない）。アニメーションは合成のみで、終了後はクラスを外し transform/filter を残さない（E2E で確認） |
| ファイルシステムウィジェット（Phase 4） | 追従するのは「最後にフォーカスしたターミナル」（無ければレイアウト内の最初のもの）。シェル統合の OSC 7 で cwd を得るので Windows でも追従する。ディレクトリのクリックは `cd <名前>` を入力して実行、ファイルのクリックは引用したパスをプロンプトに入力するだけ（実行しない）。引用はシェルごとに単一引用符（PowerShell は `''`、POSIX は `'''`、fish は `'`、cmd は二重引用符と `cd /d`）。追従先が無い・cwd を報告しないときは原版と同じく単独で閲覧（"detached"）。一覧・使用量・ドライブは main の `fs` IPC（絶対パスのみ受け付け正規化、読み取りはメタデータだけでファイル内容は返さない、1ディレクトリ最大1000件）。変更検知は `fs.watch` をディレクトリ単位で参照カウントし、ページのリロード/破棄で解除 | 原版はディレクトリ変更ごとに systeminformation の `fsSize()`（Windows では PowerShell 起動）を呼んでいた。`fs.statfs` は1回のシステムコールで済む。原版は全シェルで二重引用符を使い、`$` やバッククォートを含む名前で壊れていた |
| 天気予報ペイン（Phase 4） | 気象庁の予報 JSON（`/bosai/forecast/data/forecast/{office}.json`）を main の `WeatherService` が取得。購読のあるオフィスだけを、発表時刻（0・5・11・17時 JST）の12分前・3分後・20分後に確認し、2回目以降は `If-None-Match` の条件付きリクエスト（1日最大十数回、変化なしは 304）。失敗時は 5/15/30 分のバックオフで再試行し、最後の予報を表示し続ける。最後の予報を userData に保存し、再起動時は発表時刻をまたいでいなければ取得しない。E2E はローカルのスタブサーバーに `ELECDEX_JMA_BASE_URL` を向け、既定でも到達不能なポートを指すので、テストが実サイトに通信することはない。天気コードの表は気象庁のテロップに沿ってリポジトリに持ち、未知のコードは先頭桁（1晴・2曇・3雨・4雪）で描く。アイコンは気象庁の画像を使わず自前の線画 | 利用規約（https://www.jma.go.jp/jma/kishou/info/coment.html）に従い、ペイン内と README に「出典：気象庁ホームページ（URL）を加工して作成」を表示する（整形・アイコン化しているため「加工」と明記）。この JSON は公開 API ではない（仕様変更があり得る）ため、zod で緩く検証し欠けた項目は「データなし」として扱う。Qiita の解説（e_toyoda）が注意する通り、推測での無駄なリクエストを避ける |
| 既定のシェルタブと終了手段 | 既定レイアウトのシェルは3タブ（各タブが独立したシェル）。終了はフッターの EXIT ボタン（誤クリックで全シェルを失わないよう、3秒以内の2回目のクリックで終了）と Ctrl+Shift+Q（ターミナルにフォーカスがあっても capture 段階で取得）。F11 でフルスクリーン切り替え | 既定はフルスクリーンでウィンドウ枠も閉じるボタンも無く、アプリ側に終了手段が必要だった。e2e はターミナル数を数えるテストで単一ターミナルのレイアウトを明示的に与え、既定レイアウトの変更に左右されないようにした |
| テーマ（Phase 5） | テーマは zod で検証するデータ（accent の HSL、面の色、状態色の色相、フォント、端末の ANSI 調整と個別指定、スキャンライン/グロー）。純関数 `themeVariables` が決まった CSS カスタムプロパティの集合に変換し、ルート要素に設定するだけで適用する（リロードなし、テーマの値を CSS や HTML として解釈しない）。キャンバスや WebGL に描くもの（xterm・チャート・メモリのドット）は `revision` を監視して再読込。内蔵6種（tron / amber / phosphor / white / business-dark / business-light）に userData/themes/*.json を重ね、同じ id はユーザー側が勝つ。不正なファイルは理由付きで一覧から除外 | 原版はテーマ値を文字列連結で `<style>` に差し込み、切替のたびにウィンドウをリロードしていた。グロー（全テキストの text-shadow）はアイドル時 CPU を tron 7.8% → amber 10.1%（1コア比、実測）に増やすため、テーマ側で有効にしたときだけ属性で有効化する |
| 設定（Phase 5） | settings.json（theme / sound / motion）。全項目に既定値があり、空や部分的なファイルも有効。main が userData フォルダを監視し、手編集をリロードなしで全ウィンドウへ反映。編集途中で一時的に壊れた内容は隔離せず無視する（起動時に壊れていても移動せず既定値で動く。v0.0.5 で変更、下記）。テーマ選択と音の切替はフッターに置き、本格的な設定 UI は Phase 7 | エディタで保存中のファイルは壊れたファイルではない。フォルダを監視するのは、一時ファイルを rename で上書きするエディタでもファイル監視が外れないため |
| 効果音（Phase 5） | WebAudio で合成する（音声ファイルを同梱しない）。起動ログの行・起動完了・タイトル・グリッチ・ペインの点灯・分割/タブ/閉じる・ファイルブラウザのクリック・テーマ切替・終了確認。音ごとに最短間隔を設けて連打を抑える。既定は有効・音量 0.5、フッターで切替。E2E は既定で音を無効にした settings.json を置いて起動する | 原版は howler.js で録音素材を再生していた。合成なら素材のライセンスも読み込みも不要で、各音は短いレシピとしてコードで読める |
| ペインの追加と削除 | 原版のモジュールは固定で、消すことも足すこともできなかった。elecdex ではどのペインも閉じられる（タブはタブの ×、それ以外はホバーで出るペインの ×、Ctrl+Shift+W）ので、閉じたウィジェットを戻す手段として「ペイン追加」ピッカーを置く（Ctrl+Shift+A / フッターの + PANE）。原版のファジーファインダーと同じ、枠付きモーダルに絞り込み欄と一覧の形で、↑↓選択・Tab で配置（右 / 下 / 新しいタブ、前回の選択を記憶）・Enter で追加。複数配置を想定しないウィジェットが既に画面にあれば、複製せずそのペインにフォーカスする。一覧はウィジェットレジストリから作るので、プラグインのウィジェットもそのまま並ぶ | 既定レイアウトへの全リセットしか戻す手段がなかった。レイアウトの操作は既存の純関数（splitPane / addTab）を使い、新しい木構造の不変条件を増やさない |
| 地球儀（Phase 6） | 陸地は Natural Earth（world-atlas の land-110m）内に入るフィボナッチ球面上の点 3,458 個を `npm run gen:geo` で生成し、Points 1 回の描画で描く。国重心は countries-50m の各国最大の陸塊の重心（日付変更線をまたぐ輪は経度を連続化してから計算）。接続は新しいメトリクス `net.connections`（5 秒間隔）: Windows は常駐サンプラーが IP Helper の `GetActiveTcpConnections`、Linux は /proc/net/tcp*、macOS は netstat。確立済みで公開アドレスのものだけを残し、collector 内で国に解決して「国ごとの件数と重心」だけを renderer に送る（アドレス自体は renderer に渡さない）。自分の位置は原版のようにオンラインの IP 検索を使わず、システムのタイムゾーン → 国 → 重心。描画はチャートと共有の 10fps フレームループに乗せ（自転は 90 秒で1周）、非表示のタブ・ウィンドウでは描かず、動きを減らす設定では静止 | 実測（既定レイアウト、1コア比）: 地球儀なし約12%、専用タイマーで 15fps だと +10%、10fps で +7%、チャートと同じループに乗せると +1.5%。描画の回数よりコンポジタを別々に起こす回数が効いていた。原版の ENCOM Globe（three.js 43,000 行を同梱）は使わない |
| 位置情報の許可ダイアログ | Chromium の権限要求はクリップボード以外すべて拒否（`setPermissionRequestHandler` / `setPermissionCheckHandler`）。地球儀は OS の位置情報を使わず、タイムゾーンから国を決められないときはペイン中央に英語で "location unavailable" と一度だけ表示し、再試行しない | ユーザー環境で位置情報の許可を何度も求められた。レジストリ（CapabilityAccessManager\ConsentStore\location\NonPackaged）で許可を求めた実行ファイルは netsh.exe と判明。Windows 11 では `netsh wlan` が位置情報アクセス扱いになり、systeminformation のネットワーク系関数が内部で実行する。現在の Windows 経路では呼んでいない（アプリ実行中のプロセス生成を監視し netsh が起動しないことを確認）が、Electron 既定の「全権限許可」をやめて Chromium 由来の要求も封じた |
| CPU のコア別棒グラフ | CPU ペインにライン/棒の切替（`ViewToggle`、ペイン状態に保存）。棒はコアごとに transform: scaleY で伸縮し、85% 以上は警告色 | タスクマネージャーの論理プロセッサ表示に相当。幅や高さを毎秒変えるとレイアウトが走るので、合成だけで済む transform にした |
| アプリランチャー | main がカタログを持つ: Windows はスタートメニュー（全ユーザー・現ユーザー）の .lnk/.url とショートカットのないパッケージアプリ、macOS は .app、Linux は .desktop を走査（60秒を過ぎたら古い一覧をすぐ返して裏で再走査、アンインストーラー等を除外、同名を重複除去）し、settings.json の `launcher.items` を先頭に置く。renderer には名前と不透明な id だけを渡し、起動も id で行う。アイコンは表示範囲に入ったタイルだけ `app.getFileIcon` で取得（.lnk はリンク先の実行ファイルから） | ページが乗っ取られても一覧にない任意のコマンドは実行できない。URL は http/https のみ openExternal、引数付きのエントリはシェルを介さず spawn |
| 相場ペイン | yahoo-finance2 4.0.2 は main で実行する（ブラウザでは CORS とクッキー/crumb のため動かないと公式 README に明記）。devDependency にして main にバンドルし、MCP SDK などの依存を配布物に含めない。`MarketService`: 監視中の全銘柄を1回の quote で一括取得（1分ごと、全市場クローズ時は5分）、日中足は銘柄ごとに5分ごと（`chart` 15分足×5日から、90分以上の取引の空白で区切った最後のセッション）、失敗は前回値を保持してバックオフ。ペインの購読は別メッセージで届くため 250ms 待ってまとめる。E2E は `ELECDEX_MARKETS_STUB_URL` のローカルスタブを使い Yahoo に接続しない。表示はスパークライン（前日終値の破線基準、上昇/下落色）と、当日騰落率の発散棒グラフ（全銘柄同一スケール）を切替。「非公式・遅延の可能性・投資助言ではない」をペインに表示（足と期間は v0.0.5 で変更、「相場ペインの期間とローソク足」）| Yahoo の live な TOPIX 指数は無い（^TPX は2015年で停止）ため、既定リストは CME の円建て TOPIX 先物 TPY=F を「TOPIX 先物」と明記して使う。Yahoo が一括応答から銘柄を1つ落とすことが実測で一度あり、既に値のある銘柄はエラー扱いにしない |
| 既定レイアウトの再設計 | eDEX-UI の配置に合わせるのをやめ、ペインの役割で配置する。左「このマシン」: 時計（高さ 4%）・システム・CPU・メモリ・ディスク・上位プロセス・ネットワーク状態・通信量。中央「作業」: シェル3タブと、その下にランチャーとファイルブラウザ（シェルの cwd に追従し入力もするため隣接させる）を半分ずつ。右「外の世界」: 地球儀（30%）・相場・天気・カレンダー（右下）。列幅 18/64/18%（当初 20/58/22%）、右列の見出しは PANEL / WORLD（後に列見出しは廃止） | 時計は1行の表示なのに列の 12% を占めていた。ファイルの格子は中央の全幅を必要としないため、半分をランチャー（作業の起点）に充てた。ネットワーク状態と通信量はこのマシンの回線なので左の下へ移し、空いた右列で地球儀を大きくした。相場は8銘柄のうち4銘柄半が見える高さに抑え（残りはスクロール）、天気の1週間分と上位プロセス10行が収まり、1366×768 でも各ペインが読める大きさを保つことをスクリーンショットで確認。相場の行はスパークラインの canvas（既定の高さ 150px）が行の高さを押し広げていたため、canvas をフローから外した |
| ランチャーのアイコン色 | アイコン自身をマスクにしてアクセント色の背景を切り抜き、グレースケールにしたアイコンを乗算で重ねて陰影を残す。ホバーで元の色に戻す | 単色のシルエットでは見分けにくく、色相フィルターではテーマ色と一致しない。静的な CSS だけで、フレームごとの処理はなく、テーマ切替は再描画のみ |
| 相場ラベルの言語 | 既定銘柄はラベルを保存せず、表示時に `navigator.language`（Electron が OS の表示言語から設定、`--lang` で上書き可）で日本語/英語の組み込み名を選ぶ。ユーザーが入力したラベルはそのまま | 保存済みのラベルは言語を切り替えても変わらないため、既定の名前は保存しない |
| ランチャーの並び順 | 成功した起動を id（対象のハッシュで再起動後も同じ）ごとに launcher-usage.json に数え、回数の多い順、同数なら最近使った順に並べる。未使用の項目は従来の順（ユーザー項目が先）。最大 500 件で、古いものから忘れる | 並べ替えは main で行い、レンダラーは回数を表示に使うだけ。settings.json はユーザーが編集するファイルなので、機械が書き換える回数は別ファイルに分けた |
| カレンダーと祝日 | 日本の祝日は法律の規則（固定日・ハッピーマンデー・春分/秋分の近似式・振替休日・国民の休日、2019〜2021年の特例）から計算する。2000〜2099年が対象。祝日の暦は shared/holidays.ts のレジストリ（id・名前・年→祝日の純関数）に登録し、ペインの設定ボタンから国ごとのチェックボックスで選ぶ（既定はなし、ペインの状態に配列で保存。旧形式の文字列 "jp" も読む）。複数国を選ぶと名前に国タグを付ける。土曜はテーマの info 色相（既定 212、青系）、日曜と祝日は danger 色。カレンダーの文字は言語設定に関わらず英語 | 米国など他国の祝日は、規則のモジュールを1つ書いてレジストリに1行足すだけで設定に並ぶ | ネットワークを使わず、年ごとのデータ更新も要らない。内閣府の公表一覧（2019・2020・2021・2025・2026年）と一致することを単体テストで確認。春分・秋分は前年に官報で確定するが、近似式は対象期間で一致する |
| macOS の node-pty spawn-helper | postinstall（scripts/fix-node-pty.mjs）で prebuilds/darwin-*/spawn-helper に実行権限を付ける | node-pty 1.1.0 の公開パッケージは darwin 用 spawn-helper をモード 0644 で含み、macOS ではシェルが一切起動しない（CI の macOS e2e が13件失敗していた原因） |
| settings.json の監視 | フォルダの fs.watch に加え、settings.json を1秒ごとに stat で確認し、読めない（書き込み途中・ロック中）ときは 400ms 間隔で3回まで読み直す | GitHub Actions の Windows ランナーでは fs.watch のイベントで手編集が反映されなかった。stat 1回/秒のコストは計測上無視できる |
| CI のアイドル予算 | CI（環境変数 CI）では CPU 予算を1コアの 150% に緩め、暴走ループの検出だけに使う。開発機では 40% のまま | ランナーは GPU がなく地球儀がソフトウェア描画になり、Windows で約45%、Linux（xvfb）で約85% を計測。開発機の値（約13%）とは比較にならない |
| ウィンドウのタイトルバー | `titleBarStyle: 'hidden'` にしてページが高さ 30px のタイトルバーを描く（フルスクリーンでは描かない）。Windows / Linux はネイティブのウィンドウ操作ボタンを Window Controls Overlay で重ね、テーマ変更のたびに `setTitleBarOverlay` で背景色と記号色を合わせる（renderer は #rrggbb 2色だけを送り main が検証）。macOS は信号ボタンの分だけ左を空ける。フルスクリーンの状態は main から通知するが、Windows ではタイトルバーを隠したウィンドウで enter/leave-full-screen が発火しないため resize でも確認し、変化したときだけ送る | OS のタイトルバーは色を変えられない。枠は残すのでリサイズやスナップはそのまま使える。起動時にフルスクリーンだったウィンドウも F11 で抜けるとテーマ色のタイトルバーになる（従来は枠なしのままだった） |
| ステータスバーの自動非表示 | 常時表示をやめ、ポインタが画面下端 8px に来るとスライドインし、バーから離れるかウィンドウ外に出て 500ms 後に隠す。バー内にフォーカスがある間（テーマ選択中、確認待ちのボタン）は隠さない。判定は window の pointermove で位置から行う。表示中はペインの上に重ね、レイアウトの高さを取らない。左端の小文字の elecdex は GitHub のリポジトリを既定のブラウザで開く | バーは静止したポインタの下にスライドインするため、バー要素の enter/leave イベントでは「離れた」ことを検知できない。E2E はポインタを下端に動かすヘルパー（showStatusBar）を使う |
| 既定レイアウトのシェル拡大 | 列幅 20/58/22% → 18/64/18%、中央のシェルとランチャー/ファイルの比 70/30 → 74/26。ステータスバーが重ね表示になった分もシェルに回る | 1920×1080 のスクリーンショットで各ペインの可読性を確認。右列が狭くなり天気の週間予報は幅に収まる日数だけを1行で表示する（折り返した行の一部が見えていたため、はみ出す日は高さ 0 にして隠す） |
| 設定 UI（Phase 7） | ステータスバーの SETTINGS か Ctrl+Shift+. で開くモーダル。general（テーマ・テーマフォルダ・モーション・効果音と音量・ランチャーのインストール済みアプリ表示）、keyboard、updates の3区分。変更はすべて settings.patch 経由で即時に settings.json へ保存し、手編集もそのまま反映される。ランチャーの独自項目やテーマ定義はファイルで編集し、ダイアログからファイルを開く | 既存の「main が検証して保存し全ウィンドウへ配信する」経路をそのまま使い、UI 専用の状態を持たない。patch はランチャーの showSystem だけを受け付け、items は受け付けない（renderer から起動対象を増やせないようにする） |
| キーバインド（Phase 7） | 操作と既定のキーを shared/keybindings.ts に1か所で定義し、Workspace はキーマップを引くだけにした。キーは修飾キー + KeyboardEvent.code（"Ctrl+Shift+KeyA"）で保存し、Ctrl は Ctrl/Cmd の両方に一致。Ctrl・Alt・ファンクションキーのいずれかを含まないキーは受け付けない。設定の keybindings は操作 id → キー（null で解除）の上書きだけを持ち、既定と同じ値は保存しない。未知の id や不正なキーはファイル全体を無効にせず無視する。重複は先に定義された操作が使い、設定画面に「in use by …」と表示。記録中はアプリのショートカットを止める。ステータスバーのヒントは有効なキーから生成 | code で持つのでキーボード配列に依存しない。シェルで打つキーを奪わないことを検証で保証する。新しい版で増えた操作が古い版で settings.json ごと隔離される事態を避ける |
| 更新チェック（Phase 7） | electron-updater は使わず、GitHub API の releases/latest を起動 15 秒後と以後 24 時間ごとに1回だけ取得し（設定でオフにできる、既定オン）、下書き・プレリリースを除いて semver で比較する。新しい版があれば右下に通知を出し、リリースページを開く（URL はこのリポジトリのリリースページに限る）。404（未公開）は最新扱い。手動の「check now」は設定に関わらず実行。E2E は ELECDEX_UPDATES_URL を閉じたポートかローカルスタブに向け、GitHub に接続しない | 署名なしのビルドを自動で置き換えると Windows SmartScreen / macOS Gatekeeper の警告が毎回出て体験が悪い。確認だけなら通信は1日1回の小さな GET で済み、ダウンロード物の検証も要らない |
| リリースパイプライン（Phase 7） | .github/workflows/release.yml: `v*.*.*` タグの push（または既存タグを指定した手動実行）で、タグと package.json の version の一致を確認し、verify（lint・型検査・単体テスト）を通してから `gh release create --prerelease --generate-notes` でプレリリースを1つ作り、6 ジョブ（Linux x64/arm64、Windows x64/arm64、macOS arm64/x64）が `electron-builder --publish always`（releaseType: prerelease、公開から2時間を過ぎたリリースにも添付できるよう EP_GH_IGNORE_TIME=true）で成果物を添付する。人が確認して正式リリースに切り替える（更新チェックはプレリリースを無視するので、それまで既存のアプリには通知されない） | リリースを先に1つ作るのは、並列ジョブが同時に作成して重複するのを防ぐため。Windows arm64 と macOS x64 は node-pty のプリビルドがあり再ビルドしない（npmRebuild: false）ので同じランナーでクロスパッケージできる。署名は未設定 |
| リリース成果物の整理（v0.0.2） | electron-builder.yml のターゲットから arch を外し、アーキテクチャはジョブの `--x64` / `--arm64`（指定なしならホスト）で決める。`publish.publishAutoUpdate: false`・`nsis.differentialPackage: false`・`dmg.writeUpdateInfo: false` で latest*.yml と blockmap を出さない | v0.0.1 では設定の arch がコマンドラインより優先され、各ジョブが両アーキテクチャと x64+arm64 統合の Windows インストーラー（234MB）を作って同名ファイルを上書きし合っていた（ローカルで `electron-builder --arm64` を実行して確認）。更新チェックはアプリ自身が GitHub API で行い electron-updater を使わないので、更新定義ファイルと差分用 blockmap は不要 |
| 起動時のフォーカスとシェルのクリップボード（v0.0.2） | レイアウトの読み込みとリセットでは、木の順で最初のペインではなく最初に見えているシェルにフォーカスする。TerminalWidget の `term` を `$state.raw` にし、非同期にセッションと端末ができた後でもフォーカスの effect が再実行されるようにした。シェルでは選択で `navigator.clipboard.writeText`、右クリック（`contextmenu`）で `readText` → `terminal.paste` を行い、`rightClickSelectsWord` は無効 | 既定レイアウトでは時計ペインが最初なのでシェルに入力できなかった。さらに `term` が非リアクティブで、ペインがアクティブになった時点では端末がまだなく focus が空振りしていた。コピー／貼り付けは PuTTY・Windows Terminal と同じ操作にし、Ctrl+C はシェルの割り込みのまま残す。クリップボード権限は既に main で許可済み |
| シェルへのフォーカスとタブ切り替えのショートカット（v0.0.2） | `shell.focus`（Ctrl+Shift+S）は最後に使ったシェルが表示中ならそれ、なければ表示中の最初のシェル、なければ背面タブのシェル（タブを前面に出す）にフォーカスし、シェルがなければ追加する。`ui.shellFocus` カウンタで、既にフォーカス済みのペインにも再度 DOM フォーカスを当てる。`tab.next` / `tab.previous`（Ctrl+Shift+→ / ←）はフォーカス中のペインが2つ以上のタブグループにあるときだけ切り替え（端で折り返す、純粋関数 `neighbourTab`）、そうでなければアクションが false を返してキーを奪わない | Ctrl+Shift+L（ランチャー検索）と同じ操作感にするため。矢印の組み合わせは PowerShell の PSReadLine が単語選択に使うので、タブがない場面ではシェルに渡す |
| ペインのドラッグ＆ドロップ移動（v0.0.2） | タイトル（タイトルのないペインは上端の罫線に沿った帯、タブグループはヘッダーでグループごと、タブは単体）をつかみ、6px 動かしたらドラッグ開始。落とし先はポインタ下の `data-drop-node`（タブ外のペインかタブグループ）で、通常は最寄りの辺の側に挿入し（中央の領域はない）、Ctrl（macOS は Cmd）を押している間はタブとして追加する。押す・離すだけでも予告を切り替え、落とし先の領域をオーバーレイで予告する。木の操作は純粋関数 `moveNode`（`splitPane`・`addTab` と共通の `placeBeside` を使う）で、変化しない移動（自分自身・既に属するグループ・自分の内側）は同じ木を返すので、予告の可否もこれで判定する。ノードの id と state を保つので、移動したシェルは同じセッションに再接続する。Escape で取り消し、ドラッグ後のクリックは抑止 | 並べ替えのたびにペインを閉じて追加し直す必要があり不便だった。HTML の Drag and Drop ではなく Pointer Events + pointer capture を使うのは、ペイン内の位置で落とし先が変わる予告を滑らかに出し、テーマに合わない既定のゴースト画像を避け、端末やキャンバスの上を通っても操作を奪われないため。当初は中央 50% をタブ追加の領域にしていたが、挿入とタブ追加が1つのペイン上で隣り合い意図しない方になりやすかったため、修飾キーで分けた。予告枠は `getBoundingClientRect` の DOMRect をスプレッドして作っていたため位置が欠落し、画面の別の場所に出ていた（DOMRect の各値はプロトタイプのゲッターで、スプレッドではコピーされない）。明示的にプレーンなオブジェクトを作るよう直し、単体テストで DOMRect 相当の値を検証する。移動先で親が変わるウィジェットは作り直され、CPU などのグラフ履歴は消える（閉じて追加し直すのと同じ） |
| ペイン移動のテストと、見つかった木操作の不具合（v0.0.2） | 3層で検証する。単体（tests/unit/layout-ops）: 各配置・サイズ比・ラベル・表示中タブ・入力の不変性に加え、シード固定の乱数レイアウト40種×25手の移動で、木の不変条件・ペインの欠落/重複/変質なし・落とし先の側と順序・他グループの表示タブ維持・大半が実際の移動であることを毎手確認。コンポーネント（tests/component/pane-drag, jsdom）: 実レイアウトストアでジェスチャ（しきい値・Ctrl/Cmd の押下と解放・Escape・キャプチャ喪失・ウィンドウ外での解放・ドロップ後クリックの抑止・window リスナーの解除漏れ）。e2e（tests/e2e/pane-move）: 4辺の予告位置と着地位置、再起動後の復元、移動したシェルのセッション・画面・入力、グループごとの移動、Ctrl でのタブ化と取り出し、Escape・自分自身・ペイン外、閉じる、WebGL ペインの繰り返し移動で GPU コンテキストが失われないこと。テストを意図的に壊したコード（辺の順序・表示タブ・自グループ判定・タブの表示位置・しきい値・Ctrl 再判定・キャプチャ喪失・リスナー解除）で失敗することを確認済み。この過程で既存の2件を修正: (1) タブを閉じる/移動で取り除くと、それより前のタブのとき表示中のタブが1つ後ろにずれていた（表示中のタブを維持するよう `replace` を修正）。(2) タブ内のペインを分割すると、そのタブがグループから抜き出され、「下に分割」でも常に横に並んでいた（`splitPane` もグループを基準に分割するよう修正し、グループに分割やグループを入れる経路は `replace` で拒否） | ペイン移動は木の組み替え・再マウント・ポインタ操作が重なり不具合が出やすいため。WebGL は three.js も xterm の WebGL アドオンも dispose でコンテキストを明示的に失わせない。40回以上の移動と約20回のシェル再マウントでも問題は出なかったが、Chromium の同時コンテキスト数（約16）を超えると表示中のペインのものから失われうるため、ペインが消えるとき（閉じる・移動・リロード）に明示的に解放する: 地球儀は `renderer.forceContextLoss()`、端末は dispose の前に `lib/webgl.ts` の `releaseWebglContexts` でペイン内キャンバスの `WEBGL_lose_context` を呼ぶ（e2e で、閉じた直後に失われ残りのペインのものは生きていることを確認）。仕様とする性質: 分割から抜けたペインの幅は残りのペイン全体に比例配分されるため、同じペインの横に出し入れを繰り返すと隣のペインが少しずつ狭くなる（挿入は落とし先の半分を取る） |
| 描画フレームの集約とレイヤーの削減（v0.0.3） | (1) フレームループを壁時計の境界（100ms の倍数 + 5ms）で起こし、時計も同じ `msUntilBoundary(1000)` で刻むので、秒の更新がループのフレームに乗る。(2) 購読者ごとに周期を持たせ（`onFrame(cb, period)`、100ms の倍数）、ループは最短周期でのみ起きる。チャートは 200ms（`CHART_TICK_MS`）なので、地球儀がなければ毎秒5回、あれば地球儀のフレームの1回おきに描く。購読者が抜けたら短い周期の起床を取り消す。(3) メトリクスは届いた時点ではなく次の共有フレーム（`nextFrame`）で反映し、ストアを `SvelteMap` にしてソースごとに購読する（従来はどのソースの更新でも全ソースのレコードを置き換え、全ウィジェットの derived が再評価されていた）。(4) ファイルシステムのタイルの登場アニメーションを `both` から `backwards` に（終了後も fill が「実行中」扱いになり、Chromium がタイルごとに GPU レイヤーを保持し続けていた: 89→34 レイヤー）。(5) 時計のタイムゾーン略称は分だけに依存させる（毎秒 Intl.DateTimeFormat を作り直していた）。(6) チャートはリサイズ直後に即描画（canvas はサイズ変更で消えるため、次の刻みまで空白にしない） | UI/UX はそのままに、無駄な描画フレームを減らすため。計測（i5-1335U、1920×1080、各2回、同一セッションで変更前後）: 既定レイアウト 13.9%→12.9%、地球儀なし 9.6%→7.1%、チャートなし 10.1%→9.8%。トレースでは待機中の CPU の大半は JS ではなく（レンダラーのメインスレッドの JS は約3%）、フレームごとのコミット・ラスタ・GPU 合成で、1秒あたりのメインフレーム数が支配的だった（16.4→14.7/秒）。残る外れフレームは主に xterm のカーソル点滅（約1.7/秒、UX として維持）。地球儀の毎秒10回の描画は回転の滑らかさのため維持 |
| 地震情報と通知（v0.0.3） | 気象庁の `bosai/quake/data/list.json`（気象庁の地震情報ページが読む JSON、約 1 か月分）を使う。1 つの地震（`eid`）に震度速報 → 震源に関する情報 → 震源・震度情報が順に出るので、発表時刻順に畳み込んで項目ごとに最新の値を採る（取消のあった地震は除外、遠地地震は震度なしで保持）。main の `QuakeService`（Electron 非依存）は「通知がオン」または「地震ペインが開いている（参照カウント）」ときだけ動き、1 分ごと（`max-age=60` に合わせる）に If-None-Match で取得、未更新は 304 でパースも送信もしない。失敗時は前回の一覧を残して 1→2→5→10 分で再試行。状態の変化は全ウィンドウに送り、地球儀は購読せず聞くだけ（地球儀が取得を起こさない）。通知は設定 `quakes`（既定オフ、最大震度の閾値は既定 5弱、OS 通知と効果音は既定オン）。発生から 30 分以内・閾値以上・未通知の地震だけを地震ごとに 1 回通知し、後続の報で閾値に達したらその時点で通知する。通知済み id は quake-alerts.json に最大 200 件（通知を使うまで読み書きしない）。通知をオンにした時点で一覧に該当する地震があれば即時に通知。画面上部中央のバナーは後続の報で内容（震源・M・深さ）を更新し、5弱以上は閉じるまで残し、それ未満は 60 秒で消える。効果音 `quake`。ウィンドウが前面にないときは Electron の Notification。起動直後やリロード中に決まった通知はページに届かないため、この実行で通知した id を状態（`announced`）にも持ち、ページは最初の状態から直近 30 分のものを表示する（手で閉じたものはセッションストレージに覚えてリロードで再表示しない。実装中の e2e で、起動時の通知がページに届かず消える不具合として見つかり、修正前に失敗するテストを追加）。地震ペイン（既定レイアウトには入れない）は一覧・最大震度の色（3 から warn、5弱から danger）・M・深さ・遠地、通知設定へのボタン、出典「出典：気象庁ホームページ（URL）を加工して作成」と「緊急地震速報ではありません」。地球儀は 24 時間以内の地震の震央に M に応じた大きさ・震度の色の輪を置き、1 時間以内のものは波紋を出す（どれを出すかは 1 分ごとに選び直す）。地名はアプリの言語が日本語なら `anm`、それ以外は `en_anm` | 通知用途には防災情報 XML（Atom フィード＋個別 XML）より、同じ内容を 1 回の取得で持つ list.json が単純で、ETag による 304 で通信量もヘッダ分で済む（実測: 本文 約 290KB、gzip 約 27KB、未更新時 0 バイト）。天気ペインは地点ごとの予報でアプリ全体の通知とは性質が違い、天気ペインを閉じると通知も止まる結合を避けるため、独立した設定・サービス・ペインにした。緊急地震速報ではない（発表は揺れの 1〜数分後）ことを表示で明示する。世界（USGS）対応と津波はユーザー判断で次の段階。通知オフ・地震ペインなしの既定レイアウトのアイドル負荷は変更前後で差がない（metrics.spec を前後交互に各 4 回: 変更前 21.6/22.1/22.6/24.4%、変更後 23.6/22.8/21.6/22.9%。この日の計測は機器の状態で全体に高い） |
| 地震の世界対応と津波（v0.0.3） | 設定 `quakes.source` を追加（`auto`・`jma`・`usgs`、既定 auto: タイムゾーンが Asia/Tokyo かロケールが ja-JP なら日本、それ以外は世界。main と設定画面が同じ純関数 `resolveQuakeSource` で解決）。世界は USGS の `summary/4.5_day.geojson`（M4.5 以上・24 時間）を読み、震度がないためマグニチュードで判定（設定 `minMagnitude` 既定 6.0、通知の対象期間は USGS の掲載が遅いことを考え 1 時間。重要度は M5 から moderate、M6 から severe）。津波は日本が気象庁 `bosai/tsunami/data/list.json` の最新の報（取消は除外、24 時間で失効）の詳細 JSON の `Body.Tsunami.Forecast.Item` を区域ごとに読み（種別コード 52/53 大津波警報、51 津波警報、62 津波注意報のみ有効。予報 71–73・解除 50/60 は無効）、到達時刻または状況と高さを持つ。世界は NOAA の太平洋（PHEB）・国家（PAAQ）津波警報センターの Atom フィード（各センターの最新の報のみ）を、形式が固定なので XML パーサではなく少数の正規表現で読み、Warning・Threat を警報、Watch、Advisory を有効とする（Information は無効）。イベント ID は震央座標で、同じ地震の続報で再通知しない。通知キーは「発信元・イベント・レベル」で、レベルが上がれば再通知。`quakes.tsunami`（既定オン）で津波通知だけを切れる。サービスは 1 分ごとに選択中の発信元だけを取得し、全リクエストが条件付き（津波の詳細 JSON は新しい報のときに 1 回だけ）。発信元を切り替えると一覧・津波・前回の判定をリセットし、実行中の取得の結果は捨て（別発信元の津波フィードが混ざらない）、新しい発信元を条件なしで直ちに取得する。津波フィードの失敗は地震の一覧に影響させず、前回の状態を保つ。通知バナーは津波カードを先頭に置き、区域の一覧を展開でき、閉じると「発表中」の小さなタブに畳まれて警報中は常に見える位置に残り、解除されると「解除」を表示してから消える。大津波警報は枠を太くし、動きを減らす設定でなければ光をゆっくり明滅させる。ウィンドウ表示中はタイトルバー（30px）の下に出す。地震ペインは発信元の表示（Japan / world）、震度またはマグニチュードのバッジ、津波の帯、発信元ごとの出典。地球儀の波紋は大きな M でも半径を 0.03 rad に抑える（平面の輪が球面から浮いて見えるため）。レビューでの修正: (1) 気象庁の津波報の詳細の取得に失敗すると、リストの条件付き取得が 304 を返し続けて詳細を二度と取りに行かなかった → 失敗時にリストの検証子を捨てる。(2) 取得中に発信元を切り替えて戻すと、古い条件付き取得の 304 で新しい開始の一覧が空のまま残った → 世代番号で古い取得の結果を捨てる。(3) NOAA の報は解除を出さないため、失効を 24 時間から 6 時間に（気象庁は解除があるので 24 時間のまま）。(4) 津波のレベルが下がったときも再通知して音が鳴っていた → 同じ事象でそれまでに通知したより強いレベルだけ通知。(5) 発信元の切り替えで津波カードが「解除」と表示していた → カードの状態遷移を純関数（lib/tsunami-card.ts）に分けて切り替え時は黙って消す。(6) リロード時の通知の再表示で効果音が再生されていた → 鳴らさない。(7) settings.json で minMagnitude を選択肢以外（6.2 など）にすると設定ファイル全体が無効になった → 4.5〜9 の数値を受け付け、設定画面にもその値を出す。見直しで既存コードも整理: 新しい一覧の受信時に状態を二重に送っていたのを 1 回に、震度の短い表記・時刻の書式・出典の文言をペイン・バナー・OS 通知で共通の関数に、OS 通知の文面を `shared/quake-notifications.ts` に移して単体テスト可能にした | 世界の地震は USGS が定番で無料・パブリックドメイン。津波は国ごとに警報の発表元が違うため、日本は気象庁、世界は NOAA の 2 センター（太平洋全域と北米）とした。日本の利用者でも世界を選べば NOAA の情報になる（日本の沿岸については気象庁が正であることを文言で明示し、自治体の情報に従うよう促す）。NOAA のフィードは数 KB で報ごとに差し替わるだけなので、XML パーサ（遅延読み込み）を足すより正規表現で十分と判断し、不正な形式は「津波なし」として扱う |
| RSS ペイン（v0.0.3） | 既定レイアウトには入れず、ペイン追加から置く（複数可）。フィード URL（1 行 1 本、http/https、認証情報なし、最大 10 本）はペイン状態 `feeds` に持ち、未登録なら薄い文字で追加を促すだけで通信しない。main の `FeedService`（Electron 非依存、時刻・タイマー・通信・パース・保存を注入）が購読中の URL だけを取得し、IPC は天気・相場と同じ参照カウント（`SubscriptionRegistry`、preload の `keyedSubscriptions`、ページの破棄と再読み込みで解除）。間隔は 15 分固定、フィードが Cache-Control max-age・Expires・RSS の `<ttl>` でより長く求めたときだけ延ばし上限 1 時間。2 回目以降は If-None-Match / If-Modified-Since で、304 ならパースも保存も送信もしない。同時取得は 2 本、1 本 10 秒・2MB で打ち切り、Cookie は送らず Chromium の HTTP キャッシュも使わない。失敗時は前回の見出しを残して 5→15→30→60 分（Retry-After が長ければそれ、上限 1 日）で再試行し、次の試行時刻はフィードの状態に持つので、一覧の編集やページの再読み込みで購読し直しても前倒しで取りに行かない（ペインも一覧の差分だけ購読・解除する）。未取得のフィードへの 304 は失敗として扱い、200 以外の本文は読まずに破棄する。文字コードは Content-Type の charset → XML 宣言 → UTF-8（Shift_JIS・EUC-JP のフィードがある）。パースは fast-xml-parser で RSS 2.0・RSS 1.0（RDF）・Atom を形式判定せず `item`/`entry` として読み、DOCTYPE の実体は展開しない（実体参照は自前で XML の 5 つ・数値参照・よく使う HTML 名だけ復号）。見出しは HTML のタグ（既知のタグ名だけ。Vec<T> のような文字は残す）を除いた 300 文字までの平文、リンクは http/https の絶対 URL だけ。フィードごとに新しい 20 件を保持し、ペイン側で全フィードを混ぜて新しい順に 20 件（重複は除き、日付なしは後ろ）、はみ出したらスクロール。時刻は当日なら HH:MM、それ以前は M/D で、更新用のタイマーは日付が変わるときの 1 つだけ。最後の見出しを feeds-cache.json に保存し（30 日確認のないフィードと 50 件を超える分は削除）、再起動直後はそれを表示して間隔内なら取得しない。拡張機能（claude-usage-widget）の RSS を移植したもの。天気の IPC にあったキャッシュファイルの読み書きと User-Agent は `store/cache-file.ts` と `build-info.ts` に移して共有 | 通信は main に置く方針のため、main に DOMParser がなく XML パーサを依存に加えた。RSS ペインを置かない利用者に負荷を出さないよう、パーサは最初の取得時に動的 import（ビルドでも別チャンク）し、購読がなければタイマーも持たない。更新間隔をペインごとに選ばせないのは、同じフィードを別々の間隔で見るペインが並ぶと取得を共有できず複雑になるため（ユーザー判断で 15 分）。件数の設定も持たず最大 20 件のスクロールにした（ユーザー判断）。「N 分前」の相対表記はタイマーで更新し続ける必要があるため採らない |
| フルスクリーンでのウィンドウ操作（v0.0.3） | Windows・Linux のフルスクリーン時だけ、右上の角（上端 8px かつ右端からボタン列の幅）にポインタが入ると「最小化・フルスクリーン解除・終了（2回クリックで確定）」を上から出す（`WindowCorner.svelte`）。ショートカット `window.minimize`（Ctrl+Shift+M、変更可）を追加。キーバインドの定義に `platforms` を持たせ、対象外の OS では `effectiveBindings` が null を返す（キーをシェルから奪わず、競合としても出さず、設定画面にも出さない）。main の `system.minimize` も macOS では何もしない。下部ステータスバーと角の表示・非表示は共通の `lib/edge-reveal.svelte.ts`（ポインタ位置で判定し、フォーカスがある間は隠さない）、フルスクリーン状態はタイトルバーと共通の `stores/window-state.svelte.ts`。ボタンのツールチップは有効なショートカットから作る | フルスクリーンで起動すると最小化の手段がなかった。上端全体ではなく角に限るのは、上端のすぐ下にペインのタイトル（ドラッグの取っ手）とシェルのタブがあり誤表示を避けるため。下部バーへの追加は見送り（ユーザー判断）。macOS はフルスクリーンのウィンドウを最小化できず、上端でネイティブの操作が出るため対象外。e2e では最小化の呼び出しを main で記録して検証し、実際に最小化されたかはウィンドウマネージャのある環境でのみ確認する（CI の Xvfb にはない） |
| 描画フレームの集約とレイヤーの削減（v0.0.3） | (1) フレームループを壁時計の境界（100ms の倍数 + 5ms）で起こし、時計も同じ `msUntilBoundary(1000)` で刻むので、秒の更新がループのフレームに乗る。(2) 購読者ごとに周期を持たせ（`onFrame(cb, period)`、100ms の倍数）、ループは最短周期でのみ起きる。チャートは 200ms（`CHART_TICK_MS`）なので、地球儀がなければ毎秒5回、あれば地球儀のフレームの1回おきに描く。購読者が抜けたら短い周期の起床を取り消す。(3) メトリクスは届いた時点ではなく次の共有フレーム（`nextFrame`）で反映し、ストアを `SvelteMap` にしてソースごとに購読する（従来はどのソースの更新でも全ソースのレコードを置き換え、全ウィジェットの derived が再評価されていた）。(4) ファイルシステムのタイルの登場アニメーションを `both` から `backwards` に（終了後も fill が「実行中」扱いになり、Chromium がタイルごとに GPU レイヤーを保持し続けていた: 89→34 レイヤー）。(5) 時計のタイムゾーン略称は分だけに依存させる（毎秒 Intl.DateTimeFormat を作り直していた）。(6) チャートはリサイズ直後に即描画（canvas はサイズ変更で消えるため、次の刻みまで空白にしない） | UI/UX はそのままに、無駄な描画フレームを減らすため。計測（i5-1335U、1920×1080、各2回、同一セッションで変更前後）: 既定レイアウト 13.9%→12.9%、地球儀なし 9.6%→7.1%、チャートなし 10.1%→9.8%。トレースでは待機中の CPU の大半は JS ではなく（レンダラーのメインスレッドの JS は約3%）、フレームごとのコミット・ラスタ・GPU 合成で、1秒あたりのメインフレーム数が支配的だった（16.4→14.7/秒）。残る外れフレームは主に xterm のカーソル点滅（約1.7/秒、UX として維持）。地球儀の毎秒10回の描画は回転の滑らかさのため維持 |
| 時計・メモリ・電源の表示 | 時計の文字をペインの高さの 92% / 幅の 19% まで大きくし、ペインの高さを列の 6% から 4% に縮めた（余白をメモリと CPU のグラフへ）。メモリはドットの下にスワップと同じ意匠の使用量の横棒（USED）を加え、2行を1つのグリッドでそろえる。POWER は数値の横に残量に応じて塗る電池アイコンを置き、数値とアイコンの輪郭はほかの値と同じ色で、残量の塗りだけを 20% 未満は danger（赤系）、20% 以上は ok（緑）にする。充電中は稲妻を重ね、数値は充電中も表示する（従来は CHARGE） | ドットは分布の雰囲気、横棒は量を一目で読むためのもの。色の閾値は純関数 batteryGauge で単体テストする |
| 地球儀の描画順 | 球・陸地の点・マーカーの renderOrder を 0/1/2 に固定する | すべて半透明のため three.js はバウンディングスフィアの中心で奥から手前に並べるが、陸地の点群の中心は北半球に寄っていて地球の中心と一致しない。自転の一部の区間（起動直後を含む）で点群が球より奥と判定され、球が上から塗って点が消えていた。1 周（96 秒）を 8 秒ごとに撮影して明るい画素を数え、修正前は 0–8 秒と 56–96 秒で約 2,000（線のみ）、修正後は常に 8,700 以上であることを確認 |
| メモリの時系列グラフ | 440 個のドットをやめ、CPU と同じ StreamChart で使用率（実線）とスワップ率（淡色）を 3 分間表示し、下に USED / SWAP の横棒を残す | ドットは割合以上のことを表さず、変化も読めなかった。計測（既定レイアウト、1 コア比）: 使用量の棒は 1.5 秒ごとに更新され、420ms の幅アニメーションが常にコンポジタを動かして約 4%。棒はアニメーションなしの scaleX にし、グラフは 1 分幅だと 3 分幅より約 2% 高いため 3 分幅にした。e2e のアイドル計測は 14.7% |
| DISK ペイン | 新しいメトリクス disk.volumes（30 秒）と disk.io（2 秒）。ボリュームごとに使用量/容量の横棒（90% から警告色、97% から危険色）、使用率、空き容量、ファイルシステムと種別（リムーバブル・ネットワーク）。上段に全ディスクの読み書き速度とビジー率。Windows は常駐サンプラーの DriveInfo（固定・リムーバブルのみ。到達できないネットワークドライブは IsReady が数秒止まるため除外）と PerformanceCounter（PhysicalDisk(_Total) の Read/Write Bytes/sec と % Idle Time。英語名は日本語表示の Windows でも有効、生成に約 1 秒を 1 回、読み取り約 2ms）。Linux は df（si.fsSize）と /proc/diskstats の差分、macOS は df のみ（ディスク I/O は ioreg のプロセス起動が必要なため表示しない）。df の結果から tmpfs・squashfs・/snap・/run・/boot/efi・macOS のシステムボリュームを除き、同じ APFS コンテナは 1 つにまとめる | 容量はほとんど変わらないので時系列にせず、変化の速い I/O とビジー率を数値で添えた。既定レイアウトではメモリと上位プロセスの間 |
| ランチャーの起動エフェクト | ファイルシステムと同じ点滅（100ms 周期のアクセント反転）を、起動したタイルに 600ms かける。使用回数による並べ替えは点滅が終わってから行う | すぐに並べ替えると別のアプリのタイルがクリック位置に来て、エフェクトがそちらにかかって見えた |
| 時計・日付・余白の調整 | 時計の横にタイムゾーンの略称（JST、EDT）。Chromium の ICU は en-US では Asia/Tokyo を GMT+9 としか返さないため、en-US・en-GB・en-AU・en-IN・ja-JP などの順に略称を探し、無ければ小さな対応表（KST、SGT など）、それも無ければ UTC+9 の形。日付の横に英語の曜日（SEP 13 SUN）を置き、system の1行目の列幅を 1.45:1:0.7:1.05 に。カレンダーの土曜・休日の色は背景と 72% で混ぜて暗く。ペイン下部の余白は、ウィジェットの中身が上詰めで残る空きが原因だったため、system の行を上下端に配置、メモリの下余白を削除、ネットワーク状態とディスクの高さを中身に合わせた。ディスクの「C: Windows」はボリュームラベルがパスの続きに見えたので、ラベルはファイルシステムと同じ補足欄に移した | タイムゾーンの略称は夏時間でしか変わらないので 1 分ごとに計算する |
| 天気の複数ソース化 | 設計と比較は docs/weather-providers.md。1 つのペインが地点キー（`jma:office[:area]`・`met:lat,lon:tz`・`nws:lat,lon:tz`）で購読し、main が気象庁（既存の WeatherService）か MET Norway・NWS（PointForecasts）から取得して共通の WeatherReport を送る。日本は気象庁、米国は NWS、それ以外は MET Norway。地点は同梱の GeoNames 都市一覧（人口 50 万以上 + 首都、1,323 件）と気象庁の予報区一覧をポップアップで検索し、緯度経度も入力できる。°C/°F はペインごと。旧形式のペイン状態 `{ office, area }` はそのまま気象庁の地点として読む | データソースの違いは「ある項目・ない項目」で、共通モデルの省略可能な項目として吸収できた（MET Norway は北欧以外で降水確率を返さないことを実データで確認し、量 mm を表示）。地名は外部に送らない。MET Norway の利用規約（識別できる User-Agent、座標は小数 4 桁、Expires 前の再取得禁止、If-Modified-Since）と NWS の要件（User-Agent）に従い、取得時刻は地点ごとに最大 90 秒ずらして集中を避ける |
| World View の現在地の推定 | タイムゾーンの国 → ロケールの地域（ja-JP・ja → JP）→ 現在の UTC オフセットが同じ最大都市、の順に推定し、タイムゾーン以外から推定したときは凡例に (approx.) と付ける | UTC や Etc/GMT-9 など国を持たないタイムゾーンでは "location unavailable" になっていた。OS の位置情報は引き続き使わない |
| ファイルシステムの使用量バー | 下部の USED の横棒を削除し、マウントポイント・使用率・空き容量の文字だけを残す | DISK ペインがボリュームごとに同じ棒を表示するため重複していた |
| ファイルシステムペインの使用量表示の削除 | 下部のマウントポイント・使用率・空き容量の文字も削除し、それだけのために残っていた fs.diskUsage の IPC（main の diskUsage / mountPoint / mountFor、preload、型、チャネル）も削除 | ボリュームの容量は DISK ペインが表示する。使われない IPC を残さない |
| ランチャー検索のショートカット | 操作 launcher.focus（既定 Ctrl+Shift+L、設定で変更可）。ランチャーペインにフォーカスして検索欄を選択状態にし、ペインが無ければ右に追加してから入力欄へ。要求は ui ストアのカウンターで伝え、ペインが直前 2 秒以内の要求で開いた場合だけ受け取る | 古い要求に反応すると、レイアウトのリセットでランチャーが再表示されたときに入力中のシェルからフォーカスを奪う |
| コードレビューでの修正（2026-09-13） | (1) ランチャーで点滅中に別のアプリを起動すると、先の起動の並べ替えが失われていた → 点滅の終了を待つ Promise を必ず解決する。(2) ダイアログ（ペイン追加・設定・地点選択）を開いている間もレイアウトを変えるショートカットが背後のペインに効いていた → 終了と全画面以外は無視し、ダイアログは同時に1つだけにした。(3) macOS のディスク読み書きが「0 B/s」と表示されていた → 値を null にして「--」。(4) launch.spec.ts が MET・NWS・更新チェックの URL を閉じたポートに向けておらず、既定レイアウトの天気ペインが実サービスに接続し得た。(5) 地点の予報キャッシュが見た地点の数だけ増え続けた → 7 日取得していない地点は削除。(6) settings.json の keybindings の件数に上限が無かった → 64 件。(7) 未使用の ACTION_IDS・frameSubscriberCount・holidayOn、天気ペインで二重だった「過去の時間帯」の判定を削除。(8) 地球儀の現在地推定のオフセット比較で都市ごとに Intl を呼んでいた → タイムゾーンごとに記憶 | 未使用の export は機械的に走査し、プラグイン用に予約した registerDynamic / unregisterDynamic とテスト用の recipeLength は残した |
| WHITE テーマと表示の調整 | 4 つ目の組み込みテーマ White: 文字 #D7E0EA（HSL 212/31/88）、背景 #0A0B0D、走査線とやや弱いグロー、ANSI 色の寄せは 0.3（淡いアクセントに強く寄せると色が褪せる）。elec シリーズ（elecxzy）の配色に合わせた。DISK は macOS で読み書きが取れないとき、ダッシュの行ではなく行ごと表示しない。天気ペインは国（ソース）によって 6 時間ごとの行の有無で残り高さが変わり、下に空きが出ていたため、週間予報が残りの高さを埋め、アイコンがコンテナの高さに応じて大きくなるようにした。DISK は既定の高さで 1 ボリュームにスクロールバーが出ないよう行間を詰め、隠れているステータスバーの位置が分かるよう画面下端中央に短い目印を置いた | ペイン自体の高さを中身に合わせて動かす案は、隣のペインを押し広げ、ユーザーが調整した比率と衝突するため採らず、中身がペインを埋める方式にした |
| ペイン名と相場の色 | CPU ペインの名前を CPU USAGE から CPU にし、MEMORY・DISK と揃えた。相場の上昇・下落色（行・棒・スパークライン）は、カレンダーの週末色と同じく背景と 72% で混ぜて暗くした。スパークラインは canvas の CSS color を解決済みの rgb() として読むので、color-mix もそのまま使える | どのペインも使用量を表示するので、名前に USAGE を付けるのは冗長。付けない側に統一した |
| v0.0.1（最初のプレリリース、2026-09-13） | README を利用者向け（機能・インストール・キーボード・ペイン・設定）と開発者向けに再構成し、スクリーンショット 3 枚（Tron・White・設定のキーボード）を docs/screenshots に置いた。スクリーンショットは scripts/gen-screenshots.mjs が、ホームを C:/Users/Public 下のデモ用フォルダに差し替え、ランチャーを Windows 標準アプリだけにしたプロファイルで撮る。撮影中に見つかった設定のキーボード表の操作名のはみ出しは、列幅を最長の名前に合わせて修正 | 公開リポジトリの画像に個人のパス・インストール済みアプリ・ファイル名を載せない。再生成しても同じ条件で撮れるようスクリプトにした |
| グラフの時間軸の共有 | CPU・メモリ・通信量の StreamChart は、表示幅 60 秒・遅延 2 秒・再描画の刻み 200ms（壁時計基準）を frame-loop.ts の共通定数で共有する。各グラフは刻みが変わったときだけ、その刻みの時刻で描くので、並んだグラフは同じ速度で同じ瞬間に動く。メモリの取得間隔を 1.5 秒から CPU と同じ 1 秒にした | メモリだけ 3 分幅・1.5 秒間隔で、CPU と流れる速度が違って見えた。以前 3 分幅にしたのは 1 分幅の再描画コスト（約 2%）のためだったが、各グラフが自分の画素境界ごとに別々に描いていたのが原因で、刻みを揃えるとコンポジタの起床が 1 回にまとまり、1 分幅に戻してもアイドルは 14.3〜14.7%（変更前 14.7〜15.2%）|
| 登場エフェクト（カレンダー・天気・RSS・地震・ペイン追加） | 要素を作ったときに一度だけ走る CSS アニメーションにし、`opacity`・`transform`・`clip-path` だけを動かす。fill は `backwards`。長さと遅延には `--motion-scale`（モーション軽減時は 0）を掛ける。共通のものは styles/motion.css（`fx-rise`、新着行の `fx-fresh`）。カレンダーは月を変えるたびに `{#key}` でセルを作り直し、右下がりの対角線順（前の月は逆向き、`waveStep`）に 22ms 刻みで出す。今日のセルには波が届いた後にリングを一度広げる。月が同じ「today」では作り直さない。天気は予報が現れたとき（マウント時・地点の変更時）に、今日、週の各日を 45ms 刻みで出す。RSS と地震は `FreshTracker` で「最初の読み込みより後に来たキー」を新着とする。最初の読み込み（マウント・リロード・キャッシュ）は基準にするだけ。一度見たキーは再び新着にしない。RSS はフィードごと、地震は発信元ごとに持つ。新着行は左からワイプで入り、既存の行は `animate:flip` で下がる。左端のバーを 3 秒表示し、`fx-fresh` が終わったら新着から外す。一覧を下にスクロール中は Chromium のスクロールアンカーで読んでいる位置を保ち、「↑ n new」ピル（`NewAbove`）で先頭に戻れる。追加したペインは起動時と同じ CRT の電源投入（520ms）で出し、`layout.arrived` は一度だけ真を返す。移動による再マウントでは再生しない。モーション軽減時はクラス自体を付けない | 常時動くものを増やさず、アイドル負荷をゼロのままにするため（metrics.spec の予算内）。fill を `forwards`／`both` にするとアニメーションが終わっても active なまま GPU レイヤーが残る（ファイルシステムのタイルと同じ理由）。新着の強調は情報なので、モーション軽減時も 3 秒の表示は残す（フェードのみ）。最初の読み込みを新着にしないのは、起動やペイン移動のたびに一覧全体が光るのを避けるため。フィード単位にしたのは、後から追加したフィードや遅れて届いたフィードの項目が全部新着に見えるのを避けるため。CRT のクラスを軽減時に付けると、ビームの疑似要素がアニメーションなしで残る。e2e ではフレームではなく、作り直された要素と計算済みの `animation-*` を検証する。新着の e2e は main から `webContents.send` で次の読み込みを送って再現する。新着が「ない」ことは、3 秒後に消える強調を待って通ってしまわないよう、再試行しない即時の数で確かめる（発信元のリセットとフィードごとの基準を外すと失敗することを確認済み） |
| ペインを閉じるときのエフェクト | 見えているペインは2段階で閉じる。(1) 300ms の CRT 電源断（`crt-off`、開くときと同じ光る縁を `crt-beam` で付ける）。この間ペインはツリーに残し、`inert` にして、フォーカスは閉じた後の移り先へ先に移す。(2) ツリーから外し、場所を得たペインを 220ms の `crt-extend` で見せる。新しいレイアウトは一度で確定し、`clip-path: inset()` を古い枠から 0 へ動かして、動く辺にビームを走らせる。閉じる前後の枠（タブはグループの枠）を pane id ごとに測って比べる。背面にあったタブが表に出る場合は、中央の横線から開く。同時に進める閉じ操作は1つだけ（`layout.closingId`）。閉じる操作・分割・タブ追加・移動・リサイズ・リセット・保存の flush と、移動先があるときのタブ／シェルの切り替えは、先に `settle()` で進行中の閉じ操作を即座に確定し、拡張も打ち切る。フォーカスとペイン状態の変更は、閉じているペインを残したまま行う。閉じているペインにはフォーカスできず、ファイルブラウザが追うシェルや Ctrl+Shift+S の対象からも外す。背面のタブ、モーション軽減時、起動演出中は即座に閉じる。最後の1枚を閉じたときに補うペインは電源投入で出す | 残ったペインの `flex-basis` をアニメーションすると、毎フレームターミナルが fit され、途中のサイズが PTY に送られて ConPTY が履歴を折り返し直す（ターミナル節の問題）。clip-path ならレイアウトもサイズ送信も1回で済む（E2E で ResizeObserver の幅が2種類だけであることを確認）。閉じ操作を重ねると、先の確定で分割が畳まれ、電源断中のペインが再マウントされてアニメーションが最初からやり直しになる。拡張の計測も古いツリーに基づいてしまう。そのため直列化した。終了の判定を `animationend` ではなくタイマーにしたのは、アニメーションが走らない状況でも確実に閉じるため。タイマーはアニメーションの開始が1フレーム遅れる分（40ms）を足している |
| ダイアログと通知を閉じるときのエフェクト | ペイン追加・設定・天気の地点の3つのダイアログは、ペインと同じ 300ms の CRT 電源断（光る縁つき）で閉じ、暗幕は色だけを薄くする。Svelte の双方向トランジション（`transition:crtPower` / `transition:backdropShade`、lib/crt-transitions.ts）で実装する。電源断は `css(t)` で keyframes と同じ段階を再現する（lib/crt-motion.ts）。開く側は従来の `crt-on` のままで、トランジションは離脱中の要素を Svelte が inert にすることで閉じる側だと判断する。閉じた瞬間に `ui.…Open` は false になるので、キー処理・フォーカスの復帰・ショートカットはすぐ戻る。ダイアログを閉じてすぐ別のダイアログを開くと、`ui.closedAt` からの経過時間だけ新しい方の電源投入を遅らせ（最大 112ms）、古い絵が横線になった所から新しい絵が開く。古い暗幕はその場で透明にし、z-index を上げて、潰れていく絵を新しいダイアログの上に見せる。通知（アップデートの通知、地震のバナー、津波のカードとタブ）も同じ `transition:crtPower` で消える。地震と津波は並びごと消えることがあるので `|global` にし、残ったバナーは `animate:flip`（220ms）で詰める。大津波警報のカードは `breathe` が `crt-on` のアニメーションを上書きしていたため、電源投入の後に `breathe` を始めるよう両方を指定する。`crt-on` の本体アニメーションの fill は `backwards` にする（最終フレームは素の状態と同じ。`both` のままだと再生後も要素にアニメーションが残り、`animate:flip` が消えるバナーを流れから外さず、残りのバナーが詰まらなかった）。flip が消える要素を元の位置に留める transform は、電源断の scale の前に残す。取り消した電源断が戻り切ったら `crt-beam` を外す（`will-change` の GPU レイヤーを残さない） | 閉じる途中で同じダイアログを開き直すと Svelte は同じ要素を再利用する。`out:` だけのトランジションは最初の設定をキャッシュし続けるため、次に閉じるときに縁のアニメーションや暗幕の引き継ぎが古い状態のまま動いた（E2E で確認）。双方向なら intro のたびに設定が作り直され、取り消した電源断は途中から巻き戻る。暗幕を opacity で消すと子のダイアログまで暗くなるので、背景色だけを毎フレーム塗る。暗幕の引き継ぎは、新しい暗幕の intro で同じ更新の中に行う（フレームの tick を待つと、1 フレームだけ暗幕が二重になる） |
| ペインの設定ボタンの統一 | RSS と地震のペインも、天気・カレンダーと同じ右上の設定ボタン（SettingsButton）にした。RSS はボタンでフィードの編集欄を開閉する。地震の設定はアプリの設定なので、ボタンは設定ダイアログの Alerts を開き、ペインには現在の通知条件を文字で表示する | 以前は RSS が FEEDS、地震が ALERTS OFF という文字のボタンで、ペインごとに見た目も場所も違っていた |
| Windows のランチャーのアイコン | Windows ではアイコンを `app.getFileIcon` ではなく Windows シェルに描かせる（main/launcher/windows-icons.ts）。ショートカットファイル自体に `SHGetFileInfo(SHGFI_SYSICONINDEX)` を使い、システムイメージリストから `ImageList_GetIcon` で 32px を PNG にする。PowerShell は1バッチに1回だけ起動し（最大 64 件、20ms 集めてから、同時に1つ）、パスは base64 UTF-8 で標準入力から1行ずつ渡す。シェルが返せないとき、または PowerShell が失敗・ブロックされたときは従来の `getFileIcon` に戻す。アイコンはアプリ終了までメモリにキャッシュする | Excel などのアイコンが誤っていた。Chromium の IconLoader は .exe/.dll/.ico 以外を拡張子でキャッシュし、拡張子で問い合わせる。そのため、ターゲットを読めないショートカット（Office のアドバタイズ ショートカット、エクスプローラー）や .msc はすべて同じ汎用アイコンになっていた。さらにこの環境では、タスク マネージャー・拡大鏡・Git Bash・elecxterm の .exe でも汎用のプログラムアイコンが返った（Chrome・OneDrive・エクスプローラーは正しい）。`nativeImage.createThumbnailFromPath` はショートカットでも .exe でも失敗した。シェルに問い合わせればスタートメニューと同じ解決（アドバタイズ・インデックス付きアイコン・リソース ID）になる。`SHGFI_ICON` はショートカット矢印を重ねるので、イメージリストから取り出す。起動は約 0.6 秒で、初回表示とカタログ変更後だけ |
| ターミナルの開始フォルダ | 設定 `terminal.startDirectory`（既定は空＝ホーム）。設定画面の General → Terminal で、入力・参照（フォルダ選択ダイアログ）・home（空に戻す）ができる。main がペイン作成時に解決する（main/pty/start-directory.ts）。先頭の `~` はホーム。相対パスや存在しないフォルダはホームで起動し、設定画面に「Not a folder」と表示する。変更は新しいシェルだけに効き、開いているシェルはそのまま | 設定がシェルの起動を妨げないため。検証は main で行い、レンダラーは結果（解決後のパスと、ホームに戻したか）だけを受け取る |
| 天気ペインの週間予報の表示切り替え | ペイン状態 `week`（既定は表示）を、天気ペインの設定の WEEK チェックボックスで切り替える。非表示のときは今日の欄の下を空け、出典は `margin-top: auto` でペインの下端に置く | 高さの小さいペインや、今日の予報だけを見たい配置のため。ペインごとの選択なのでペイン状態に持つ |
| ブートログを Linux の起動ログの形式に | 流れと書式は Linux 6.x の起動に揃える。<br>・前半: カーネルリングバッファ。`[    x.xxxxxx]` のタイムスタンプに続き、Linux version・Command line・DMI・e820 メモリマップ・tsc・Memory・smpboot・pci/vgaarb・drm・fbcon・LSM・VFS/EXT4 の再マウント・IPv6 リンク・init の起動・systemd の機能フラグ／アーキテクチャ／ホスト名の順に出す。<br>・後半: systemd のユニット（`[  OK  ]`／`[FAILED]`）、`Startup finished`、tty1 のバナー、自動ログイン。<br>中身はすべて実際の値にする。<br>・main の `system.machine()`（main/machine-facts.ts）から: OS 名とリリース、アーキテクチャ、CPU の MHz、空きメモリ、pid、プロセス開始時刻、起動スイッチの名前、ホームがあるボリュームの容量、ネットワークインターフェイス名、GPU（PCI のベンダー/デバイス ID・名前・ドライバのバージョン）、ディスプレイ。<br>・レンダラーから: 実際の CSP、`navigator.onLine`、通知とアップデート確認の設定。<br>・ペインのあるサービスは Started、ないものは Listening（on demand）と書く。<br>タイムスタンプは main プロセス開始からの実時間（`performance` でマイクロ秒まで）。machine の取得が 1.5 秒以内に返らなければ、分かる行だけにする | 形だけの架空ログにせず、演出と事実を両立させるため。実際の値がない行は作らず省く。固定値は本物のログでも固定の部分（e820 の低位メモリ、PCI のクラスコード）だけにした。ネットワークのアドレスや起動スイッチの値（パスを含みうる）は画面に出さない。GPU 情報は Electron の `getGPUInfo('basic')`（この環境で約 8ms）で、GPU プロセスを待ちすぎないよう 1 秒で打ち切る。ソフトウェアレンダラー（Microsoft Basic Render Driver など）は PCI デバイスではないので出さない。systeminformation は Windows で位置情報の確認が出るため使わない |
| 起動時のペイン点灯をランダムな順に | 起動演出でシェルを最初に点灯したあと、モジュールを上からの行ごとではなく、ランダムな順（Fisher-Yates）に1枚ずつ点灯する。間隔は1枚あたり約 200ms を基準に ±40% ずらし、全体は 1.4 秒以内に収める（`revealDelays` の `span`）。効果音はペインごとに鳴る | 準備ができたペインから順に表示しているように見せるため（ユーザー要望）。ずれ幅を間隔の 40% までにしたので、順番が入れ替わったり2枚が同時に点灯したりしない。ペインが多いレイアウトでも待ち時間は延びない。単体テストは乱数を固定して、順番が毎回違うこと・間隔が一定でないこと・全体が span 内に収まることを確かめる |
| アプリアイコンを複数ペインの意匠に | カードを明るい色（#e2e8f0）にし、10px の間隔を空けた5枚の暗い HUD ペインに分ける。内容はシステムのバー・地球儀と接続・CPU のトレース・プロセス一覧で、左下の1枚はバッジの下に隠れる。「E」バッジの位置と形はシリーズ共通のまま。build/icon.svg から `npm run gen:icon` と `npm run gen:card` で PNG と README のカードを生成し直した | 以前は暗いカードの1枚の画面で、「E」の後ろが黒くまとまり、黒いターミナルの elecxterm と見分けにくかった（ユーザー指摘）。ペインが並ぶことが elecdex の特徴なので、それを形にした。明るい溝があるので、32px でも暗い背景の上でもペインの分割が見える |
| どのシェルペインもタブを持てる／シェルペイン間のフォーカス移動 | 単独のシェルペインにも、タブグループと同じタブ列（タブ1枚と +）を出す。タブ列は共通の `layout/TabStrip.svelte` にまとめた。+ は `layout.addTab` でそのペインをグループにする（Ctrl+Shift+T と同じ）。シェルはタブの × で閉じ、ペインの × ボタンはモジュールのペインだけに出す。グループの見出しは、選択中のタブ自身のタイトル（シェル名）にして単独ペインと揃えた。`shell.next` / `shell.previous`（Ctrl+Alt+Shift+→ / ←）は、フォーカスがシェルにあるときだけ、次の／前のシェル（単独のシェルペインか、シェルを含むタブグループ）に移る。移動先はグループなら選択中のタブ（シェルでなければ最初のシェル）で、木の順に端で折り返し、キーボードのフォーカスも移す。純粋関数は `neighbourShell`。シェル以外にフォーカスがあるときや、移動先がないときは false を返してキーを奪わない | 以前はタブ列がタブグループにしかなく、既定レイアウトのグループ以外に追加したシェルでは、ペインの操作からタブを増やせなかった（ユーザー指摘）。シェルが複数あると、Ctrl+Shift+S は最後に使ったシェルにしか戻らず、シェル間を移動できなかった。Ctrl+Shift+← / → は PSReadLine の単語選択と重なるので、グループ内のタブ切り替えだけに使う。そのためシェル間の移動には Alt を足した |
| BUSINESS テーマ、AMBER・PHOSPHOR の明るさ | 5 つ目の組み込みテーマ Business: Windows 11 のダークモードの色（背景 #202020、面 #1C1C1C / #2C2C2C、文字 #FFFFFF、補助文字 #9E9E9E、既定の青アクセントをダーク面に描く色 #60CDFF）、Segoe UI Variable と Cascadia Mono / Consolas、端末は Windows Terminal 既定の Campbell 配色、走査線・グローなし、グリッド線は背景と同色にして消す。文字色をアクセントから分けられるよう、テーマに任意の `text`（`primary` / `muted`）を追加し、トークンに `--text-base` / `--text-muted-base` を置いた（省略時は従来どおりアクセント、muted は半分の濃さ）。Amber は accent s 100 / l 58 → 90 / 50、グロー 0.45 → 0.35、Phosphor は s 72 / l 60 → 60 / 48、グロー 0.4 → 0.3（RGB の最大チャンネルが 1.0 と 0.89 で、グローと重なって眩しかった） | 仕事中に使える普通のアプリの見た目には、文字がアクセント色一色の HUD では足りず、文字だけ中立色にする必要があった。枠やハイライトはアクセントのまま残し、フォーカスの目印にする |
| BUSINESS (LIGHT) テーマ | Business を Business (Dark)（id `business-dark`）に改め、白系の Business (Light)（`business-light`）を追加: Windows 11 ライトモードの色（背景 #F3F3F3、カード #FFFFFF、文字 #1A1A1A、補助文字 #5F5F5F、既定の青アクセントを明るい面に描く色 #005FB8）、端末は Windows Terminal の One Half Light。テーマに任意の `mode`（dark / light）を追加し、`data-mode="light"` のとき tokens.css で状態色（danger / warn / ok / info）の明度を下げ、`--accent-strong` を明るくではなく暗くする。端末は light のとき xterm の `minimumContrastRatio` を 4.5 にする | 既存の色は黒地で光る前提で、白地では警告の黄色が読めず、シェルや PSReadLine が出す白・明るい黄色の文字が消えた（実際のスクリーンショットで確認）。ANSI 色を個別に暗く作り替えるより、xterm に WCAG AA を満たすまで補正させる方が、どのシェルの配色でも読める |
| Business テーマのランチャーアイコンを原色に | テーマの `effects.iconTint`（既定 true）を追加し、false のとき `data-icons="color"` でランチャーのアイコンのマスク・グレースケール・乗算をやめ、元の色で表示する。Business (Dark) / (Light) は false。README のスクリーンショットは組み込みテーマ全6種と設定ダイアログを scripts/gen-screenshots.mjs で撮る | HUD テーマではアクセント色に揃えることで一体感を出すが、仕事用のテーマではスタートメニューと同じ見慣れた色の方がアプリを見分けやすい |
| シェルペインの見出しとタブ名 | 見出しの左はシェル名ではなく TERMINAL（レジストリのタイトル）、右は選択中タブのフルパス（Windows では `\` 区切りに統一）。タブはフォルダ名だけ（ホームもフォルダ名で表示。当初の `~` だけでは分かりにくかった。ドライブ直下は `C:\`、大文字小文字はそのまま）で、同じ名前になるタブがあるときだけ親フォルダを1段ずつ足す（layout/tab-labels.ts、純関数で単体テスト）。作業フォルダが分からない間はシェル名、ホバーでシェル名とフルパス | 見出しとタブの両方にシェル名、見出しとタブの両方にパスが出て冗長だった。既定シェル1種類ではシェル名はタブを見分ける役に立たず、Windows Terminal や VS Code と同じく場所で見分ける方が速い（ユーザーと合意、2026-09-14） |
| 電源接続中のバッテリーの稲妻（v0.0.4） | 稲妻は、充電中だけでなく電源が接続されているとき（`acConnected`）にも出す。電池の外側、左隣に文字の高さいっぱいで、警告色（`--warn`）で描く（`BatteryGauge` の viewBox を左に広げる）。aria-label と title は「charging」と「plugged in」を分ける | 以前は充電中だけ、電池の充電量の上に文字色で重ねていた。この大きさ（約 20×9px）では緑の充電量に埋もれて見えなかった。さらに満充電で電源につないでいると、Windows は BatteryChargeStatus を充電中にしない（High のみ）ので、稲妻が出なかった（ユーザー指摘）。コンポーネントテストで、電源接続中（充電中・非充電）に稲妻が出てバッテリー駆動では出ないことを確認する |
| Linux CI の e2e 修正（v0.0.4） | 起動ログのテストは、ページ内の MutationObserver で行が増えるたびにログ全文を記録し、それを読む。OS 通知のテストは `Notification.isSupported` もスタブにする。GitHub Actions は checkout・setup-node・upload-artifact を最新の v7 に上げた | ubuntu-latest の e2e だけが v0.0.2 以降失敗し続けていた。起動ログは最終行（ログイン行）が約 0.5 秒でタイトルに置き換わり、アイドルで 1 コア 100% を超える遅いランナーでは、テストからのポーリングがその間を取り逃がしていた（トレースで「Startup finished」まで読めてログイン行だけ欠けていたことを確認）。Linux ランナーには通知サーバーがなく `Notification.isSupported()` が false になり、アプリは通知を出さない（実機の挙動としては正しい）。v4/v5 のアクションは Node 20 対象で非推奨の警告が出ていた。修正はブランチの CI（workflow_dispatch）で確かめてから main に入れた |
| スペアナとミキサーのペイン（v0.0.4） | 2 つの独立したペイン `spectrum` と `mixer`（既定レイアウトには入れない）。既存コードに加えた変更は、登録（builtins、IPC、preload の `audio` API、チャンネル、ビルド入力）と `appWindows()` だけ。<br>**スペアナ**<br>・システムの出力音は、ループバック音声付きの画面キャプチャ（`getDisplayMedia` + `setDisplayMediaRequestHandler` の `audio: 'loopback'`）で取る。Electron は音声だけの許可を受け付けないので、画面の映像トラックも付けて許可し、ページ側ですぐ止める。<br>・キャプチャはワークスペースではなく、非表示の専用ウィンドウ（`main/audio/capture-window.ts`）で行う。このウィンドウはインメモリの専用セッション（表示キャプチャはこのセッションだけが許可）、フレームと状態を送るだけの専用 preload、ネットワークもスタイルもない CSP のページを持つ。<br>・ページは FFT（4096）を 20Hz〜20kHz の 60 本の対数ビン（0〜1）にして 20 fps で送る。main はそのウィンドウからの IPC だけを受け、形を検査してから購読ペインに転送する。<br>・無音が 2.5 秒続くと送信を止め、読み取りを 10 fps に落とす。<br>・ペインは受け取ったビンを 7 / 10 / 16 / 31 バンドにまとめる（`bandsFromBins`）。31 バンドは 20Hz〜20kHz の ISO 1/3 オクターブ（公称値 20, 25, 31.5 … 20k）。ビンは 1/20 デケード、バンドは 1/10 デケード刻みなので、各バンドがビン 2 本ずつを受け持つ（両端のバンドは半分が範囲外なので 1 本）。最初は 2 の累乗の 32 バンド（半端な中心周波数）にしたが、目盛りが標準の値になり 1kHz のバンドがあり、ビンの受け持ちも均一になるので 31 にした。列が狭いときは、ラベルが重ならないよう数列おきに描く。上昇は即時、下降は 1.6/秒、ピークは 0.7 秒保持してから 0.9/秒で落とす（`stepMeters`）。<br>・「NO SOUND」などの短い状態表示は設定ボタンと同じ行に置き、バーに重ねない（設定を開いている間はその行を設定が使うので隠す）。キャプチャできない理由などの長いメッセージは表示領域の上に出す。<br>・フレームを受けたときだけ描く。ペインは IntersectionObserver で画面に見えている間だけ購読するので、背面タブや閉じたペインではキャプチャウィンドウごと止まる。<br>・見た目は既定が VFD シアン。ほかに VFD アンバー、LED（緑・黄・赤）、テーマ色、パターン（バー・上下対称・ピークのみ）、ピーク保持。すべてペイン状態に持つ。VFD と LED は自前の暗いガラスの上に描くので、明るいテーマでも同じに見える。<br>**ミキサー**<br>・`MixerService`（Electron 非依存）がプラットフォームのバックエンドを購読中だけ動かす。コマンドは直近の状態にあるチャンネルと照合し（id にタブ・改行は不可）、画面には即座に反映する。1.5 秒の猶予中は、まだ変更を反映していない読み取りで値が戻らないようにする。<br>・Windows は常駐する PowerShell 1 つ（C# の Core Audio ループ）。既定の出力デバイス名、マスターの音量とミュート、アプリごとのセッション（プロセス名でまとめる。Windows の音量ミキサーと同じ）を 1 秒ごと、ピークを 0.1 秒ごとに JSON 行で出す。コマンドは標準入力で受け、標準入力が閉じると終了する。<br>・macOS は AppleScript でマスターだけ、Linux は pactl（なければ wpctl でマスターだけ）を 2 秒ごとに読む。<br>・e2e では `ELECDEX_AUDIO_STUB=1`（1 kHz の固定音と架空のミキサー）を使う。<br>**実測**（i5-1335U、1 コア比、クロックだけのレイアウトは約 4%）<br>・スペアナは、音が鳴っている間が約 33%（GPU 13、ワークスペース 10、キャプチャウィンドウ 7、音声サービス 4）。表示中で無音のときが約 10%（キャプチャウィンドウ 6、音声サービス 3）。<br>・ミキサーは約 5%。常駐する PowerShell の分は 1.3%。 | Chromium が「今流れている音」を取れる経路はループバック付きの画面キャプチャだけ。その権限を普段の画面側に与えないため、別ウィンドウに隔離した。ウィンドウの外に出るのは帯域ごとの数値だけで、音も映像も録らない。<br>**描画の負荷**<br>・最初は 30 fps で、セグメントごとに canvas の shadowBlur をかけており、鳴っている間は 42%（GPU 25）だった。<br>・変わらない層（ガラス・消灯セグメント・ラベル）をキャッシュし、変化した列だけ描き直し、影をやめて一回り大きい薄い矩形で光を表しても、キャンバスの大きさを変えても、ほとんど下がらなかった。<br>・フレームレートには比例した（15 fps で約半分）。フレームごとに合成が起きる固定費が主なので、20 fps にした。落下とピーク保持の動きがあるので、見た目の滑らかさは保てる。<br>**ミキサーの負荷**<br>・最初はメーターを 0.1 秒ごとに全部描き直していて 16%だった。点灯セグメントが変わったときだけ描くようにし、5%になった。<br>**不具合**<br>・状態の読み取り（毎秒）のたびにメーターの canvas のアタッチメントが再実行され、メーターを空で描いていた。1 秒ごとに点滅していたので現在値で描くようにし、コンポーネントテスト（修正前は失敗することを確認済み）を追加した。<br>**ビルド**<br>・preload を 2 つの入力にすると、共有モジュールがチャンクに分かれ、サンドボックスの preload が読めなくなった。キャプチャ用 preload はチャンネル名を直接書き、単体テストで `CH` と一致を確認する。<br>**対応 OS**<br>・macOS のループバックは画面収録の許可が要り、未検証。<br>・Linux は Electron のループバックに対応していないので、parec で既定出力のモニターを録って main で解析する（下の「Linux のスペアナ・ミキサー・接続」）。 |
| フレームが来ないときのフレームループ（v0.0.4） | `nextFrame` で待っている処理（メトリクスの反映）も、フレームループの描画も、要求したアニメーションフレームが 500ms（`FRAME_STALL_MS`）来なければタイマーで先に進める | CI で「CPU ペインのバー表示」テストがときどき失敗していた（Linux と Windows）。追加した診断で、収集側は `cpu.load` を 21 回集めていたのに、ペインにコアが 1 つも出ていないことが分かった。サンプルは次の共有フレームで反映するが、ページからは非表示に見えない（`document.hidden` が false）のにフレームを出さない窓（表示前、非表示と通知されない遮蔽、CI の仮想ディスプレイ）では rAF が来ない。そのためサンプルがいつまでも反映されず、ループも次のフレームを予約できなくなっていた。rAF が来ない状況を再現するコンポーネントテストを追加し、修正なしで失敗することを確認した。既定レイアウトのアイドル負荷テストは 15.4%（予算内）で、通常時はタイマーを 1 つ置いて取り消すだけ |
| スペアナとミキサーのレビュー修正（v0.0.4） | **Windows ミキサー**：C# ループで、読み取りごとに作る COM オブジェクト（デバイス・セッション）を明示的に解放し（前回分は新しい一式に差し替えてから解放、例外時は新しい一式を解放）、デバイス名の PropVariant を `PropVariantClear` し、プロセス名のキャッシュを生きている pid だけに刈り込む。<br>**キャプチャ**：いつ動かすかを `SpectrumCapture`（Electron 非依存、`main/audio/spectrum-capture.ts`）に切り出し、失敗中にペインが加わったら開き直す。閉じた・差し替えたキャプチャからの遅れた通知は捨てる。<br>**ミキサーペイン**：閉じるときに送信待ちの音量変更を捨てる。<br>**テスト**：`SpectrumCapture` の単体テスト、`whileVisible`・スペアナ（見えている間だけ購読、状態表示、バンド数）・ミキサー（つまんだフェーダーが読み取りで戻らない、50ms 間引きと離したときの確定送信、ミュート、エラー表示、閉じたあと送らない）のコンポーネントテスト。 | レビューで見つけた漏れ。常駐する PowerShell は RCW を GC 任せにしていて、75 秒でワーキングセットが 1.4MB 増えていた（修正後 0.4MB）。失敗したキャプチャは、スペアナのペインをすべて閉じるまで再試行されなかった（権限を後から許可しても直らない）。送信待ちのタイマーは、ペインを閉じた後に存在しないペインの変更を送っていた（コンポーネントテストで修正前は失敗することを確認）。 |
| README のスペアナとミキサーのスクショ | `npm run gen:screenshots` に `elecdex-audio.jpg` を追加。既定レイアウトの中央列（シェル・ランチャーとファイル）の下に、スペアナとミキサーを 2:1 で並べる。音は `ELECDEX_AUDIO_STUB=demo`（`demoBins`：高域ほど下がる土台、拍ごとのキック、拍の間のスネア、ビンごとの揺らぎ）、ミキサーは架空のアプリ（デバイス名は「Speakers」）。撮るショットはコマンドライン引数で絞れる | 実機の音を鳴らして撮ると、再生中のアプリ名が写り、見た目も撮るたびに変わる。テスト用の 1 kHz の固定音では 1 本しか光らず、ペインの見た目が伝わらない。デモ用の音は時刻だけで決まる純関数なので、単体テストで検証できる。キャプチャ窓の外に何も出さない構造は変えていない |
| e2e の地震・津波のダミーデータ | tests/e2e/quakes.spec.ts のスタブが返す震源地名・津波予報区・見出し・USGS の地名・NOAA の地域名に `[TEST] ` を付ける。アプリ側は変えない | テスト中の画面や録画・スクリーンショットが、本物の地震や津波の情報と見分けがつかなかった。表示はデータそのままなので、スタブのデータに付ければ全表示（一覧、バナー、津波カード、OS 通知）に出る |
| プラグイン仕様（v0.0.5） | widget プラグイン。`<userData>/plugins/` の1ファイルかフォルダ（相対 import）を main が sucrase で変換（実行しない）し、renderer の blob Worker（1プラグイン1つ）で動かす。データを持つ service（プラグインに1つ）と描画する view（ペインごと）に分け、描画はブロック宣言型（chart・time・signin を含む）。通信は同意したホストへの GET だけを main が代行し、ログインが要るサイトはプラグイン専用セッション。保存は main のプラグイン単位ファイル、通知は同意制。同梱サンプルはポモドーロタイマー。詳細は docs/plugins.md | 保留中の Claude 使用量ウィジェット（非公式 API、ログイン Cookie、閉じている間の履歴収集、予測グラフ）を物差しにレビューし、当初案（ペインごとの Worker、Cookie なし、ペイン状態だけ、spark だけ）では実現できないと分かった。service/view 分割で2重取得と履歴の消失を、専用セッションで Cookie を、chart ブロックで予測線を解決する。非公式 API のプラグインはリポジトリに入れず userData に置く |
| プラグインの実装（v0.0.5） | Worker のスクリプトは `stripGlobals` と `pluginRuntime`（shared/plugin-runtime.ts）の `Function.prototype.toString` にモジュール表を渡して組み立てる。main の走査・変換は `PluginFolder`、代行 fetch は `PluginNet` + `net.request`（`redirect: 'manual'`）、保存は `PluginStorage`（userData/plugin-data/<id>.json、1 秒デバウンス、終了時に書き出し）、サインインは `persist:plugin-<id>` パーティション。renderer は `PluginHost` が descriptor を使い捨て Worker で読み、有効・同意済み・必要（ペインか background）なときだけ常駐 Worker を回す。レイアウトに `plugin:<id>` があって読み込めないときは汎用の「unknown widget」ではなく PluginPane が理由（オフ・要同意・エラー・フォルダに無い）を出す。ペイン状態は `state.plugin` に置く | ランタイムを文字列で書くと型も lint も効かないが、関数の文字列化なら TypeScript のまま書けて、単体テストが同じ文字列から組んだスクリプトを実行して外部参照が無いことを確かめられる。Electron 44 の `net.fetch` は `redirect: 'manual'` を「Redirect was cancelled」で失敗させた（実測）ため、リダイレクトを1段ずつ許可判定できる `net.request` にした（Cookie は useSessionCookies でリダイレクト応答の分も保たれることを実測）。編集で壊れたプラグインのペインが「フォルダに無い」と出る不具合は e2e で見つけ、ファイルが最後に名乗った id を保つようにした。ペインの attach を追跡対象から外さないと、描画のたびにペインが外れて付き直す無限ループになる（component テストで固定） |
| プラグインのセキュリティレビュー対応（v0.0.5） | 別オリジンへのリダイレクト後は `authorization` と `x-*` を送らない。同意を id とファイル名の組に結びつけ（`settings.plugins[id].key`）、同じ id を名乗る別ファイルは聞き直す。ホストでも `ctx.state` を 64 KiB に抑える。保存キーを `[A-Za-z0-9_.:-]{1,100}` に限り `__proto__` 等を拒む。サイト名に見える `link` の文字列は遷移先と一致させ、遷移先のホスト名を常に添える。個人情報系メトリクスと通信を同時に求めると同意画面で警告する。descriptor の読み取りは1つずつ順に行う。描画でエラーが消えるのは描画要求が届いた時点にした | 外部レビューの指摘（2026-09-15）をコードで確かめ、すべて事実だった。静的な descriptor 抽出（AST）は書き方の自由を失う割に、権限の無いコードの CPU 3 秒しか防げないので採らず、直列化で1コアに抑えた。フォルダから消えたプラグインの自動無効化は、エディタの保存で起きる一時的な消失で無効になるため採らない。DNS rebinding は https・443 固定・証明書検証で実効性が無いと判断した。修正前のコードで新しいテスト 11 件がすべて失敗することを確認した |
| Linux のスペアナ・ミキサー・接続（v0.0.5） | **スペアナ**: Linux だけ、隠しウィンドウの代わりに main が `parec --device=@DEFAULT_MONITOR@`（16 bit・48 kHz・モノラル・遅延 40 ms）を起動し（`main/audio/pulse-capture.ts`）、PCM を `PcmSpectrum`（`pcm-spectrum.ts`）で AnalyserNode と同じ手順（Blackman 窓、1/N、平滑化 0.35、dB）で解析して同じ 60 ビンにする。無音時の間引きは `pumpSpectrum`（shared/audio.ts）をキャプチャページと共有。音のデータが届いてから running を通知し、それまでフレームは送らない。parec がない・止まったときは理由付きで failed（ペインを開き直すと再試行）。テスト用スタブ（`ELECDEX_AUDIO_STUB`）では従来どおり隠しウィンドウを使う。<br>**ミキサー**: `main/audio/mixer-linux.ts`。pactl で既定シンク（`get-default-sink` と `-f json list sinks`。デバイス名は description）とアプリ（sink-inputs）を読み、変更も pactl（`@DEFAULT_SINK@`）。pactl がない、または JSON を出せない古い pactl なら wpctl でマスターだけ。最後に読めたツールで変更する。両方ないときはその旨、ツールが失敗したときは stderr の1行目を出す。Linux では `LC_ALL=C` で実行する。<br>**接続**: /proc/net/tcp6 の IPv4 射影アドレス（`::ffff:a.b.c.d`）を点区切りで返す。すべてのグループを書いた形の IPv6 ループバック（`0:0:0:0:0:0:0:1`）も公開アドレスから除く。 | Linux で3つとも動かなかった（ユーザー報告）。<br>・Electron（Chromium）の Linux にはループバック音声がなく、スペアナは「未対応」のままだった。parec は PulseAudio と PipeWire（pipewire-pulse）の両方で使える。`--device` を省くと既定の入力（マイク）を録ってしまうので、モニターを必ず指定し、単体テストで引数を確認する。解析は 1 回 0.136 ms（開発機、20 fps で 1 コアの約 0.3%）で、main で行ってもよいと判断した。<br>・ミキサーはマスターを wpctl（WirePlumber 付属）だけで読んでいたので、pactl があっても wpctl がない環境では全体が「なし」になり、wpctl の失敗も「見つからない」と表示していた。<br>・デュアルスタックのソケットが IPv4 の相手とつながると tcp6 に `::ffff:a.b.c.d` で載るが、16 進の 8 グループ（`0:0:0:0:0:ffff:808:808`）にしていたため、GeoIP が国を引けず（`::ffff:8.8.8.8` の形でも同梱 DB は null を返すことを確認）、プライベートアドレスも除外されていなかった。また /proc は `::1` を `0:0:0:0:0:0:0:1` と書くため、localhost への IPv6 接続が公開アドレス扱いで総数と「国不明」に数えられていた（修正後の見直しで発見）。<br>いずれも単体テストを追加（接続のテストは修正前に失敗することを確認）。Linux の実機では未確認 |
| プラグイン機構の見直し（v0.0.5） | カタログの適用を直列にし、読み取り中に次のカタログが来ても古い方が後から残らないようにした。同じ id の片方が消えたら残りを「重複」から戻す。変わらないプラグインは登録し直さない（設定変更のたびにペインとピッカーを起こさない）。「忘れる」は無効化してからデータを消す | 自主レビューで見つけた。重複は一度なると消えず、2つ以上のプラグインの読み取り中にフォルダが変わると消えたはずのプラグインが残り、忘れた直後の保存でデータが復活し得た。いずれも修正前のコードで失敗する component テストを加えた |
| 壊れた settings.json を残す（v0.0.5） | 起動時に読めない settings.json を `.bak` へ移動せず、その場に残して既定値で動く。UI から設定を変えて書き込むときは、ディスク上のファイルが読めなければ先に `settings.json.bak` へコピーする（起動後に手編集で壊した場合も同じ）。直せばそのままライブで反映される | ユーザー報告: 壊れた settings.json が消えたように見えた（起動時に .bak へ移動していた）。起動中に壊したファイルは、次の UI 変更でバックアップなしに上書きされていた。修正前のコードで失敗する unit / e2e テストを加えた |
| 折れ線グラフのグラデーション塗り（v0.0.5） | StreamChart（CPU・メモリ・スループット）とプラグインの chart ブロック（`fill`）は、列ごとに、その位置の線（ゼロ線より下の系列はその位置の谷）から基線へ、線の色が透明度 0 の同じ色へ消えるグラデーションで塗る（`lib/area-fill.ts`）。線形グラデーションは x で長さを変えられないので、面でクリップしてデバイスピクセル 2px 幅の短冊ごとに描く（境界を整数ピクセルに揃え、継ぎ目を出さない）。終点は `rgb(from 色 r g b / 0)` | ユーザー要望: 変動の少ないメモリなどが飾り罫に見えグラフに見えない。最初は面全体を頂点から 1 本のグラデーションで塗ったが、CPU や通信は起動時のスパイクが基準になり、低い線の下がほぼ透明だった。また `transparent` は透明な黒で、canvas は非乗算で補間するため中間色が半分の暗さ（実測 170→83）になり暗い地に沈んでいた。アイドル時 CPU は塗りなし 21.0% / 短冊塗り 20.8%（metrics.spec）で、追加負荷は測れない |
| アイコンボタンとサインインの自動クローズ（v0.0.5） | buttons ブロックの項目に `icon`（refresh など固定の一覧）を足し、指定時は文字を `title` / `aria-label` にしてアイコンだけ描く。サインインウィンドウが開いている間はパーティションの Cookie 変化（1 秒で束ねる）を `session` イベントで知らせ、プラグインはログインを確認できたら `ctx.closeSignIn()` で閉じる。資格情報は持たないので自動再ログインはしない。永続パーティションが Cookie の有効な間ログインを保ち（再起動後も、e2e で確認）、切れたらペインのサインインボタンから入り直す | ユーザー要望: claude-usage の再取得をアイコンに、ログイン後はウィンドウを自動で閉じる。プラグインにウィンドウ操作を渡さず、自分のサインインウィンドウを閉じることだけ許す |
| 相場ペインの期間とローソク足（v0.0.5） | 表示に Candles（ローソク足）を追加し、期間をペインの設定（歯車）で選ぶ。期間ごとに足を固定: 1D=5分足（直近1セッション）、5D=30分足（直近5セッション）、1M=60分足、6M=日足、1Y=週足、5Y=月足。取得は `chart()` の OHLC だけにし、Line は各足の終値を結ぶ。main は期間を実寸で保持し（最大 800 本）、送るときに最大 160 本へ**間引かず合成**（始値=最初、終値=最後、高安=最大最小）、描画時も幅 3px に 1 本まで合成する。購読キーは `symbol\|range`（main で検証）、クオートは銘柄単位の一括取得のまま。再取得は 1D 5分・5D 15分・1M 30分・それ以上 1 時間。1 分ごとのクオートで最新足を更新し、日中足は足の枠を越えたら次の足を作る。日足は日を越えたクオートで 5 分後に再取得（足の開始時刻は市場ごとなので自前で作らない）、週足・月足は常に最後の足を更新（月の長さが違うため）。騰落率は 1D が前日終値比、それ以外は窓の直前の足の終値（無ければ `chartPreviousClose`、次に最初の始値）から。棒グラフの目盛りは 5% までは 0.5 刻み、それ以上は 1・2・5×10ⁿ、ただし中央値の 4 倍で頭打ちにし、超えた棒は端で切って ▸/◂ を付ける。横軸は時刻でなく足の順番で等間隔（Line も同じ）にし、5D は日、1M は週（月曜始まり）、6M・1Y は月、5Y は年の変わり目に薄い縦線を引く。`--up`/`--down` は color-mix() なので Canvas には非表示の要素の computed color で渡す。範囲の無い既存ペインは 1D として表示。銘柄名の列は最大 9rem（幅の 28% だと広いペインで名前とグラフの間が空く）、ローソク足の行は折れ線の倍の高さ（基準 4.8rem・最大 8rem、収まらなければスクロール） | ユーザー要望。間引きは高値・安値を落とすため合成にした。期間を選ばせて足を自動にしたのは、Yahoo の上限（1 時間未満の足は 60 日、60 分足は 730 日）と表示できる本数に収めるため。初回のクオートが取得前の空の足に当たって捨てられていたので、足の再取得の後にクオートを当てる順にした |
| 列見出しの廃止（v0.0.5） | 左右の列の上にあった eDEX-UI 由来の見出し「PANEL / SYSTEM」「PANEL / WORLD」を削除し、その分をペインに充てる。分割ノードの `label` をスキーマ・木の操作・既定レイアウトから除いた。zod が未知のキーを捨てるので、見出し付きで保存された layout.json もそのまま読め、次の保存で `label` が消える（単体・e2e で確認）。シェルの見出し（TERMINAL と作業フォルダ）はグループ移動のつまみと作業フォルダの表示を兼ねるので残す | ユーザー要望: ペインを列の間で自由に動かせるようになり、列に固定の名前を付けても中身と合わなくなった（見出しは列に付くので、SYSTEM の列に天気を置いても SYSTEM のままだった） |
| システムペインの OS 行と一度だけの取得（v0.0.5） | **表示**: システムペインの2行目に OS セル（ラベル OS、1行全体、他の行と同じラベルの下に値の形）を置き、uname や winver に相当する文字列を出す（例: `Windows 11 Pro Version 25H2 (Build 26200.9457) x64`、`macOS Sequoia 15.1 (Build 24B83) arm64`、`Ubuntu 24.04.1 LTS (Noble Numbat) · Linux 6.8.0-45-generic x64`）。MANUFACTURER / MODEL / CHASSIS は3行目へ。幅が足りなければ末尾を省略し、title で全文を見せる。ホスト名は出さない。既定レイアウトの高さは 0.075 → 0.125（プロセス一覧 0.239 → 0.189）。保存済みの layout.json で左列が以前の既定の高さのまま（同じ並び・同じ比率）なら、読み込み時に新しい高さへ直す（`upgradeDefaultHeights`）。ユーザーが変えた高さはそのままにし、足りないときはペインの中で切って隣のペインに描かない。<br>**取得**: Windows は systeminformation の osInfo() を使わず、`reg query HKLM…CurrentVersion` 1回（DisplayVersion・CurrentBuildNumber・UBR）と `os.version()`・`os.arch()` から組み立てる（`os-version.ts`）。他の OS は osInfo() に codename・build・kernel を足す。<br>**頻度**: `cpu.info`・`os.info`・`hardware.system` を10分ごとの定期取得から `once: true` のソースに変えた。スケジューラはコレクタープロセスにつき1回だけ集め、購読し直し（ペインの移動、リロード）は broker のキャッシュで答える。失敗したときだけ 30 秒 → 2 分 → 10 分（以後 10 分）で再試行し、誰も見ていない間は再試行しない。コレクターが再起動したら集め直す | 既存の layout.json は保存時の比率を持ち続けるため、移行しないと更新した全員のシステムペインで3行目が CPU ペインに重なった（README 用の撮影で古い比率のまま撮って気づいた）。Windows 11 でもレジストリの ProductName は「Windows 10 Pro」のままなので使わない（`os.version()` は libuv が 11 に直す）。osInfo() は Windows で PowerShell を5つ起動し（1つは Windows Forms を読み込む）、約 1 秒かかるうえ UBR を返さない。これらの値はアプリの実行中に変わらない（OS の更新は再起動が要る）のに、以前は購読中10分ごとに合計約 4 秒分の wmic・PowerShell を起動し、ペインを動かすたびにも即座に集め直していた（`addSource` の即時取得）。e2e で、リロード2回とペインを閉じて戻したあとも3ソースの取得回数が 1 のままであることを確認し、定期取得のままのコードでは失敗することを確かめた |
| 背面タブの購読停止と日付の分境界（v0.0.5 以降） | **購読**: ウィジェット定義に `keepWhileHidden`（`metrics` の部分集合）を足し、PaneHost は表示中なら全ソース、背面タブ（`display:none`）の間はその部分集合だけを購読する。保持するのはグラフに履歴を貯めるソース（`cpu.load`、`mem.usage`・`mem.swap`、`net.throughput`）と一度だけのソース（`cpu.info`・`os.info`・`hardware.system`）。保持分と解放分は別の `$effect` にし、タブの切り替えで保持分が解放・再購読されないようにした。表示に戻ると解放分は即時取得で戻る（それまでの一瞬は `--`）。<br>**日付**: システムペインの日付は `setInterval(60 s)` をやめ、`msUntilBoundary(60_000)` の setTimeout を連ね、日付が変わったときだけ `$state` に代入する | 自主レビュー: 購読がペインの存在だけに結び付き、背面タブのプロセス一覧（Windows で 3 秒ごと）や接続一覧が見えないまま集められていた。グラフは穴が空くので止めない。一度だけのソースは保持しても費用がなく、切り替えのたびに行が消えるのを避ける。日付のタイマーはマウント時刻起点でフレームループの 100 ms 境界とずれて自前のフレームを起こし、毎分無駄に行を無効化していた（日付の変化も最大 1 分遅れた）。修正前に失敗する component テストと e2e を追加した |
| 再購読の即時取得を 1 周期に 1 回まで（v0.0.5 以降） | `MetricScheduler` は周期ソースごとに直前の収集開始時刻を持つ。外したソースが 1 周期以内に戻ったときはすぐには取得せず（ペインは broker のキャッシュの最新値を表示）、前回の収集から 1 周期後に取得する。グループの新規作成時は、最初のタイマーをその時刻に合わせる。周期を過ぎて戻ったソースは従来どおりすぐ取得する | 不具合報告: 背面タブで解放したソースは表示に戻るたびにすぐ取得されるため、タブを素早く切り替えると macOS では毎回 `ps`（`si.processes()`）が起動し、回数に上限がなかった（Windows は常駐する `WindowsSampler` なので起動しない）。デバウンスではなく周期で抑えたので、切り替えの頻度に関係なく各ソースの収集は 1 周期に 1 回までになり、`df` や `ping` などプロセスを起動するほかのソースにも効く。修正前に失敗する unit テストを追加した |
| ボタンの busy とブロック間の余白（v0.0.5） | buttons ブロックの項目に `busy` を足し、その間は円形のアイコン（refresh・reset）が回り、ほかは明滅する（CSS アニメーション。`prefers-reduced-motion` では明滅だけ）。プラグインのブロック間の余白は `--space-2` から `--space-1` に詰めた | ユーザー要望: claude-usage の再取得中に矢印を回したい、縦の余白を詰めてグラフに高さを回したい。アニメーションは通信中の数秒だけで、フレームループには載せない。余白はブロック共通なので pomodoro の見た目もスクリーンショットで確認した |
| Linux のモニター音量と接続の状態コード（v0.0.5 以降） | **スペアナ**: Lubuntu 26.04（PipeWire 1.6.2 の pulse サーバー）で、再生中も「NO SOUND」のままだった。既定の入力が出力のモニターになっており、そのモニターの音量が 8%（-66.33 dB）に下がっていたため、16 ビットで録った音楽が 0 と -1 に丸められていた（ミキサーは出力とアプリの音量なので 8% は見えない）。parec を `float32le` で録り、`pactl get-source-volume/get-source-mute @DEFAULT_MONITOR@` を 2 秒ごとに読んで、音量（Pulse の音量は 3 乗: 振幅 = (値/65536)^3）の逆数を掛ける（上限 100 dB、読めなければ 1 倍）。値を決め打ちせず毎回読むので、どの音量でも、途中で変えても追従する。ミュートと 0% は戻せないので `muted` 状態を送ってフレームを止め、ペインは理由と「unmute monitor」ボタンを出す。ボタンを押したときだけ main が `set-source-mute 0` と `set-source-volume 100%` を実行する（スペアナ購読中のページからのみ、Linux の実キャプチャ時のみ）。システム設定を黙って変えないため、補正を先にし、ボタンは補正できない場合だけにした。<br>**接続**: `/proc/net/tcp*` の状態列はカーネルの `tcp_states` 列挙（ESTABLISHED = 1、LISTEN = 10）で、パーサーは `03`（SYN_RECV）を確立済みとして読んでいたため、Linux の地球儀に接続が出なかった。`01` に修正。 |
| Windows のパッケージアプリと表示名（v0.0.5 以降） | ランチャーは Start Menu フォルダーの走査に加えて、シェルのアプリケーション フォルダー（`shell:AppsFolder`）からパッケージアプリ（AUMID が `パッケージファミリー名!アプリ ID` の形のもの）を一覧に加える。同じ PowerShell 1回で、各ショートカットと最上位フォルダーのシェル上の表示名（desktop.ini の LocalizedResourceName）も取り、名前とグループに使う（main/launcher/windows-apps.ts）。起動は `%SystemRoot%\explorer.exe shell:AppsFolder\<AUMID>` で、AUMID は main のカタログの値を正規表現で再確認したものだけ。アイコンはパスを `SHParseDisplayName` で PIDL にしてから `SHGetFileInfo(SHGFI_PIDL)` に渡す。ショートカットの id は従来どおりファイルのハッシュなので起動回数は引き継がれる。PowerShell が失敗したときはファイル名だけの従来の一覧に戻る | 新しい Teams・Outlook・ターミナル・電卓や Edge からインストールした Word/Excel などは MSIX で、どちらの Start Menu フォルダーにも .lnk がなく一覧に出なかった（この環境で Start Menu 122 件に対しショートカット 83 件、欠けていた 41 件はすべてパッケージアプリ）。ショートカット由来の項目はすでに一覧にあり、アプリケーション フォルダーからはリンク元の .lnk を引けないため、足すのはパッケージアプリだけにした。「Command Prompt」などは英語のファイル名で出ていた。PIDL 経由のアイコンは既存 83 件すべてで従来と同じ PNG だった。走査は PowerShell 込みで約 1.3 秒（従来はフォルダー走査のみ）。そのため一覧は stale-while-revalidate にした（main/launcher/system-cache.ts）: 待つのは初回の走査だけで、60 秒を過ぎた要求には手元の一覧をすぐ返して裏で再走査し、同時の要求は1回の走査を共有する。再走査で id・名前・グループが変わったときだけ `launcher:changed` を送り、ペインは表示中のタイルを残したまま一覧を取り直す。以前は期限切れ後の要求が再走査を待ったため、そのとき開いた・移動したペインは約 1.3 秒空の「scanning…」になり、起動後の並べ替えも遅れていた |
| バックグラウンド常駐（v0.0.5 以降、Windows のみ） | 設定に window セクションを追加。`window.minimizeToTray`（最小化で通知領域へ）・`window.closeToTray`（閉じても通知領域で実行を続ける）・`window.globalShortcut`（どのアプリからでも表示/隠す）・`window.startInBackground`（サインイン時に隠して起動）で、**すべて既定 off**。ログイン時の自動起動は settings.json に持たず、HKCU の Run キー（値名 `dev.kurouna.elecdex`）を毎回読む。タスクマネージャーで無効にされたら、その旨を表示する。アプリ側でオンにすると `enabled: true` で書き戻す。「start in the background」を切り替えたときだけ既存エントリーを引数付きで書き直し（`sync`）、OS 側の無効は保つ。起動時の比較・書き直しはしない: Electron 44 の `launchItems` は問い合わせたパスのエントリーしか返さず、`args` はレジストリに `--hidden` があっても常に空で返る（実機で確認）ため、比較すると毎回の起動で書き込むことになる。インストール先を移した場合は古いエントリーが見えず「オフ」と表示されるが、オンにし直せば同じ値名で上書きされ、アンインストールでも消える。オフにすると `enabled` の値によらず Run と StartupApproved の両方が消えることも確認した。トレイアイコンは格納系の設定が on のとき、またはウィンドウが隠れているときだけ出す。左クリック/ダブルクリックは「開く」だけで、表示中でも隠さない。メニューは Open / Settings / Quit で、Quit は確認なしで終了する。閉じる・最小化での格納は `quitting` フラグ（before-quit、Windows の session-end）で本当の終了と区別し、明示的な終了（Ctrl+Shift+Q、Quit ボタン、トレイ）は常に終了する。初回の格納時だけ「^ の中にある」と通知する（`background.json`）。ショートカットは keybindings の `window.toggle`（`scope: 'global'`、既定 Ctrl+Alt+Shift+E、win32 のみ）で、main が globalShortcut に登録し、ページの keymap からは外す。Accelerator は文字で解釈されるので、英字・数字・F キー・名前付きキーだけを許す（JIS の半角/全角＝Backquote や記号は不可）。登録に失敗したら（他アプリが使用中なら `register` が false を返すことを実機で確認）、UI がスイッチを off に戻して理由を表示する。動作は、前面なら隠す（格納設定がなければ最小化）、それ以外なら前面へ。キーを録り直すとき（`default` ボタンも含む）も同じ判定にし、登録できなければオフに戻す。録っている間は `globalShortcut.setSuspended` でキーを手放し、いま登録されているキーもそのまま録れるようにする（Electron の同 API はまさにこの用途を挙げている）。戻し忘れを避けるため、ページからの通知だけでなく、再読み込み・レンダラーの異常終了・ウィンドウの消滅でも main 側で必ず戻す。keyboard セクションの「reset all shortcuts」は `window.toggle` のキーを残す（一覧に出ていないキーが黙って既定に戻り、そのキーが他アプリに取られていると効かなくなるため）。重複判定 `conflicts` は `globalActive`（実際に登録されている状態）を受け取り、オンのときはグローバル側がキーを持つものとしてアプリ側の操作を衝突として報告し、オフのときは判定に加えない。`--hidden` での起動は表示せずイントロも省く。二重起動は前面化するが、`--hidden` 付きの二重起動は無視する。アンインストール時は build/installer.nsh で Run キーと StartupApproved の値を削除する（`${isUpdated}` のときは削除しない）。隠れている間・最小化中は main が `WindowState.hidden` を送り、frame-loop が描画を止める | Outlook / Teams / Slack / Discord の慣例と比べて決めた（ユーザー指示 2026-09-18: ショートカット既定なし＝オプトインでキーを横に表示、格納の2項目は別、全画面コーナーの「隠す」は不要、macOS/Linux は未検証なので項目を出さない、バックグラウンド起動は既定 off）。トレイを出す／出さないの独立した項目は置かない（Teams 等にはなく、隠れたウィンドウに戻れなくなるだけ）。Windows 11 は新しいアイコンを ^ の中にしまうので初回だけ案内する。`backgroundThrottling: false` のページでは、隠しても最小化しても `document.hidden` が false のまま（`setBackgroundThrottling(true)` を後から切り替えても変わらないことを Playwright 下で確認）なので、main から明示的に伝える。**実測**（既定レイアウト、1920×1080、この開発機）: 表示中 約19〜24%／格納中 約6%（1コア比）。描画を止めないと格納中も約26%のままだった（tests/e2e/metrics.spec.ts で比率を検査）。e2e は `ELECDEX_BACKGROUND_STUB=1` でトレイ・登録・Run キーをメモリ上のスタブにし、実機のタスクバー・キー・サインインには触れない。実物のトレイとショートカット（SendKeys による隠す／前面化、WM_CLOSE での格納）は手元の Windows で確認した |
| Web ペイン（v0.0.5 以降） | 汎用の Web ウィジェット 1 つとプリセット（`WEB_PRESETS`: browser / youtube / x、ウィジェット id は `web.<id>`）。main が所有する `WebContentsView` をペイン本体の矩形に重ね、全 Web ペインで永続パーティション `persist:web` を共有する。プリセットは home と、ペイン内で開くホストの一覧だけを持ち、それ以外は既定のブラウザで開く。ページは preload なし・sandbox・権限はクリップボード書き込みとフルスクリーンのみ・ダウンロード不可・http(s) のみ。テーマのフィルタは insertCSS の SVG feColorMatrix（輝度 × アクセント色）で、`effects.iconTint` が false のテーマと設定 `web.tint` が off のときは入れない。ダイアログ・通知・ドラッグ・CRT 演出の間はビューを隠し、ビューの capturePage を代わりに表示する。ページ内のショートカットは main の `before-input-event` で取って renderer で実行する。詳細は §5.4 | `<iframe>` は YouTube と X が埋め込みを拒否し、workspace の CSP を緩めることになる。`<webview>` は非推奨。サイトごとのウィジェットにすると、ビュー管理・フィルタ・権限・ショートカットを重複して持つことになる。セッションを分けると、同じサイトにペインごとにログインし直すことになる（ユーザー判断 2026-09-17: 共有する）。守る境界は workspace ⇔ Web ペインで、ここは分けたまま。フィルタの負荷は実測で誤差の範囲（§5.4）。Teams などの会議は保留（ユーザー判断） |

| ピッカーのキーボード選択とスクロール（v0.0.5 以降） | Add pane ピッカーと天気の地点ピッカーは、選択行が一覧の外に出たら `scrollIntoView({ block: 'nearest' })` で追随する（`renderer/lib/list-selection.ts` に共通化）。行の選択はポインターが「入った」ときではなく「動いた」ときにする（pointerenter → pointermove） | 不具合報告: Add pane で上下キーを押すと、画面に出ていない項目が選ばれてもスクロールせず、選択が見えなかった（天気のピッカーには元から追随があった）。ポインターが止まったままでも、スクロールで行がカーソルの下に来ると Chromium は pointerenter を出すため、キーで動かした選択がマウス側の行に戻る。修正前のコードで失敗する e2e を両ピッカーに追加した（行が一覧の矩形に収まるかを比較。Playwright の可視判定はスクロール領域のはみ出しを見ないため） |

| Web ペインのメモリ（v0.0.6 以降） | ペインが表示に戻った時点で、main（`entry.snapshot`）とペイン（`WebWidget` の `snapshot`）の両方が代役の画像を捨てる。`capturePage` の画像は幅 1600 を超えたら `resize` で縮め、JPEG の品質は 80。ウィンドウの `resize` リスナーはページの `destroyed` で外す。**背景のページを CDP で凍結・パージするのは採らない** | 代役の画像はビューを隠すたびに撮られるが、表示に戻しても解放しておらず、ペインごとに data URL とデコード済みビットマップ（2560×1440 なら JPEG 約 700KB、デコード後は数十 MB）が居座っていた。凍結・パージは実機で確かめて捨てた（実測、Electron 44 / Windows）: `Memory.forciblyPurgeJavaScriptMemory` を隠れたビューに送るとページが壊れ（`Runtime.evaluate` が "Cannot find default execution context"、`capturePage` は空、表示に戻しても復帰しない。RSS が減るのはページが消えるため）、`Page.setWebLifecycleState: 'frozen'` は `Page.enable` の有無によらず何も起きない（`freeze` イベントが出ず、スクリプトも動き続ける）。1GB 超は Chromium の素の値（ペイン＝レンダラープロセス）で、減らすにはページを破棄して復帰時に読み直すほかない（未着手） |

## 17. 既知の問題

現時点で記録すべき既知の問題はない。
