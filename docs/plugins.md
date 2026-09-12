# elecdex プラグイン設計

> 採用モデル: **elecxzy (`src/plugins/PluginHost.ts` + `electron/main/PluginService.ts`) と同じ形式**。
> 単一 `.ts` ファイル / main で sucrase トランスパイル / renderer の blob Worker で実行 / データ入出力のみ。

---

## 1. なぜこの形式か

当初は「レジストリを静的登録 + 将来は utilityProcess でサンドボックス実行」と設計していたが、elecxzy の方式のほうが優れている。

| 論点 | elecxzy 方式 | 当初案 |
|---|---|---|
| プラグイン作者の手間 | `.ts` を1枚置くだけ。npm もビルドもマニフェストも不要 | パッケージ化・ビルドが必要 |
| サンドボックス | **classic Web Worker（blob: URL）**。Node も DOM もアプリ状態も構造的に到達不可 | utilityProcess は Node フル権限。剥がす作業が必要 |
| 特権プロセスの関与 | main は**テキストを変換するだけで一度も実行しない** | main/utility がプラグインコードを実行する |
| 暴走時 | timeout で `terminate()`。UI は固まらない | プロセス kill は可能だが粒度が粗い |
| ネットワーク封じ込め | アプリ CSP (`connect-src 'self'`, `unsafe-eval` 無し) を blob Worker が継承 | utilityProcess は CSP の外側 |
| 型支援 | 生成した `.d.ts` を plugins/ に置くだけでエディタが補完 | 同様に可能 |

とくに **renderer が `sandbox: true` のまま、プラグインをそれより更に狭い文脈で動かせる**点が決定的。elecdex のセキュリティ方針（§11）と完全に整合する。

---

## 2. 配置と読み込み

```
<userData>/plugins/
├─ elecdex-plugin.d.ts     # AUTO-GENERATED（毎回同期。手編集不可）
├─ hello-world.ts          # 初回のみ scaffold。以後ユーザー所有
└─ <任意>.ts
```

`PluginService`（main）の責務 — elecxzy と同じ:

1. `plugins/` が無ければ作り、サンプルを1本書く。**既に存在すれば（空でも）二度と scaffold しない**
2. `elecdex-plugin.d.ts` は「このビルドのプラグイン API」と常に同期（消えたら再生成、古ければ上書き）
3. `*.ts`（`*.d.ts` 除く）を走査し、**sucrase で `['typescript','imports']` 変換**して CJS 文字列にする
4. ハードニング:
   - `lstat` で**通常ファイルのみ**（symlink を追わない、ディレクトリに降りない）
   - **1 MiB 上限**（超過は読まずにスキップ）。特権プロセスの OOM / 長時間ブロックを防ぐ
   - 読み込み/変換の失敗はプラグイン単位で隔離し、他を止めない

**main はプラグインコードを実行しない。** テキスト変換のみ。

---

## 3. 実行サンドボックス

`PluginHost`（renderer）が呼び出しごとに**新しい classic Worker** を blob: URL から作る。

```
[prologue]  fetch / XMLHttpRequest / WebSocket / importScripts / Worker /
            indexedDB / caches / EventSource / BroadcastChannel /
            RTCPeerConnection = undefined
            var module={exports:{}}; var exports=module.exports;
            require(n) -> throw   // プラグインに import は無い
[plugin]    sucrase 変換済み CJS
[epilogue]  onmessage: 'descriptor' -> 宣言を返す / 'run' -> execute(input) の結果を返す
```

- **classic worker（module worker ではない）**: ネストした ESM import を避ける。CSP の `script-src` に `blob:` は無く、`worker-src` だけが blob: を許すため
- グローバルの潰しは**多層防御にすぎない**。真の封じ込めはアプリ CSP。**CSP を緩める変更をしたらこの Worker は再監査が必須**（prototype chain 経由で剥がしは回避できる）
- Worker は **timeout / 対象ペインの破棄 / ウィンドウ teardown** で `terminate()`
- `descriptor` プローブは実行 timeout とは独立（3秒）

---

## 4. プラグイン API（elecdex 版）

elecxzy はエディタなので `PluginInput -> PluginResult`（テキスト編集）だった。elecdex は端末 + 監視なので、**2種類**に分ける。どちらも「データを受け取りデータを返す」だけで、DOM もアプリ状態も触らない。

### 4.1 command プラグイン

M-x 相当の呼び出しで、アクティブなターミナルに対して働く。elecxzy の直系。

```ts
export interface CommandInput {
  /** アクティブターミナルの可視バッファ（末尾 N 行）。 */
  readonly text: string
  /** 選択範囲。無ければ null。 */
  readonly selection: { readonly start: number; readonly length: number } | null
  /** Shell Integration から得た CWD。取得できていなければ null。 */
  readonly cwd: string | null
  /** 現在フォアグラウンドのプロセス名。 */
  readonly process: string | null
  /** 直前のコマンドの終了コードと実行時間（OSC 133 由来）。 */
  readonly lastCommand: { readonly exitCode: number; readonly durationMs: number } | null
  readonly platform: 'win32' | 'darwin' | 'linux'
}

export type CommandResult =
  | string                                  // この文字列を端末に書き込む（改行なし）
  | null                                    // 何もしない
  | { write: string; submit?: boolean; message?: string }
  | { message: string }                     // 通知のみ

export interface CommandPlugin {
  kind: 'command'
  command: string          // コマンドパレットに出る名前
  description: string
  apiVersion?: number      // 現行は 1。新しい版を宣言したものは読み込み時にスキップ
  execute(input: CommandInput): CommandResult
}
```

ホスト側は結果を**検証してから**適用する（elecxzy の `applyPluginResult` と同じ思想）:
`write` は文字列か、`submit` は真偽値か、長さ上限を超えていないか、対象ターミナルがまだ生きているか。不正なら echo して破棄。

### 4.2 widget プラグイン

監視パネルを足せるようにする。Worker から DOM は触れないので、**宣言的な描画スペックを返させ、ホストが描く**。この間接化がサンドボックスを一切緩めずに拡張性を与える。

```ts
export interface WidgetInput {
  /** 宣言した metrics の最新サンプル。 */
  readonly metrics: Readonly<Record<string, unknown>>
  /** 割り当てられた描画領域（CSS ピクセル）。 */
  readonly size: { readonly w: number; readonly h: number }
  readonly tick: number
}

/** ホストが解釈する描画プリミティブ。これ以外は描けない。 */
export type Draw =
  | { t: 'text'; x: number; y: number; s: string; size?: number; dim?: boolean }
  | { t: 'bar'; x: number; y: number; w: number; h: number; v: number }      // v: 0..1
  | { t: 'spark'; x: number; y: number; w: number; h: number; v: number[] }
  | { t: 'dots'; x: number; y: number; cols: number; rows: number; on: number[] }
  | { t: 'rule'; x: number; y: number; w: number }
  | { t: 'rows'; rows: readonly (readonly string[])[] }

export interface WidgetPlugin {
  kind: 'widget'
  id: string
  title: string
  description: string
  apiVersion?: number
  /** 購読したいメトリクスソース id。宣言した分だけホストが購読する。 */
  metrics: readonly string[]
  minSize?: { w: number; h: number }
  render(input: WidgetInput): readonly Draw[]
}
```

- 色はプラグインが指定できない。**テーマの semantic トークンからホストが決める**（`dim` で控えめ指定のみ可）。テーマ切替でプラグイン製パネルも追従する
- `Draw[]` の件数に上限を設け、超過は切り捨てて echo
- `render` は Worker 内の純関数。timeout 超過で terminate、そのペインは「plugin timed out」表示に落ちる

### 4.3 レイアウトとの接続

widget プラグインは §5.2 の `WidgetRegistry` に**ビルトインと同じ形で**載る。`PaneNode.widget` が `plugin:<id>` を指したら、ホストはビルトインの代わりに `PluginWidgetHost.svelte` を解決し、それが Worker を回して `Draw[]` を Canvas に描く。

つまり**レイアウトツリー側には一切の特別扱いが要らない**。ペインの分割・タブ・永続化はビルトインと完全に同じ経路を通る。

---

## 5. 実装フェーズ上の位置

| Phase | プラグイン関連 |
|---|---|
| 1 (terminal) | `CommandInput` に入る情報（cwd / process / lastCommand）を OSC パーサ側で用意する |
| 2 (layout) | `WidgetRegistry` を「ビルトイン + 動的」の2層にしておく（動的側は空のまま） |
| 3 (metrics) | `MetricSourceId` を文字列で引ける形にしておく（プラグインが宣言で購読するため） |
| **7** | `PluginService` / `PluginHost` / `.d.ts` 生成 / サンプル / 設定UI |

Phase 1〜3 では**受け口の形だけ合わせておき**、実体は Phase 7 で入れる。

---

## 6. テスト方針（elecxzy に倣う）

elecxzy は `PluginHost.test.ts` / `PluginHost.load.test.ts` / `PluginHost.security.test.ts` / `pluginTimeout.test.ts` と、
`PluginService.test.ts` / `pluginSandbox.security.test.ts` を持つ。elecdex も同じ4系統を置く:

1. **load**: 走査・sucrase 変換・`.d.ts` 同期・scaffold の一回性・壊れたプラグインの隔離
2. **security**: `require` が throw すること、ネットワークグローバルが落ちていること、symlink/ディレクトリ/1MiB超がスキップされること、CSP 前提が壊れていないこと
3. **timeout**: descriptor プローブと run の両方で terminate されること、UI が固まらないこと
4. **result validation**: 不正な `CommandResult` / `Draw[]` を適用せず echo すること

---

## 7. elecxzy から持ち込まない点

- **テキスト編集系の結果適用**（`start`/`length`/`cursor`/`select`、read-only 領域の保護）は elecdex に対応物が無い。端末は追記ストリームなので `write` + `submit` で足りる
- **`M-x` コマンドパレット**は elecdex には無い（Phase 7 でコマンドパレットを作るか、キーバインドに直接割り当てるかは未決）
