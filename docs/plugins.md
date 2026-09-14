# elecdex プラグイン仕様（v0.0.5: widget プラグイン）

> 状態: **仕様確定、未実装**。v0.0.5 で実装する。
> 範囲は **widget プラグインのみ**（ペインを足す）。端末に書き込む command プラグインは §10 のとおり後続版。

---

## 1. 方針

| 決定 | 内容 | 理由 |
|---|---|---|
| 配布形式 | `<userData>/plugins/` に `.ts` か `.js` を1枚置く | npm・ビルド・パッケージ化が要らない。elecxzy と同じ形 |
| 実行場所 | renderer の **blob Worker**（ペインごとに常駐） | Node・DOM・`window.elecdex`・アプリ状態に構造的に届かない。main はテキストを変換するだけで実行しない |
| 描画 | **ブロック宣言型**。プラグインはデータ（`Block[]`）を返し、ホストが Svelte で描く | サンドボックスを緩めずに済む。テーマ・フォント・eDEX の見た目にプラグイン作者の手間なしで揃う |
| 通信 | **宣言したホストだけ**、main が代行する `ctx.fetch` | 天気・相場など外部 API を読むのが最大の用途。renderer の CSP（`connect-src 'self'`）は変えない |
| 信頼 | 置いただけでは**無効**。有効化時に権限を見せて同意を取る | 置かれたファイルが勝手に通信やプロセス一覧の読み取りを始めない |

### 現状との関係

レイアウト側はすでにプラグインを受けられる。`registry.ts` の動的層に `plugin:<id>` で載せれば、分割・タブ・移動・保存・ピッカーは変更不要。
ただし `WidgetDefinition.component` は Svelte コンポーネントなので、プラグインは直接載せない。**全プラグインが共通の `PluginPane.svelte` を component として登録**し、それが Worker を回す。

---

## 2. プラグインの形

```ts
// <userData>/plugins/cpu-gauge.ts
import type { WidgetPlugin } from './elecdex-plugin'   // 型だけ。変換時に消える

export default {
  apiVersion: 1,
  id: 'cpu-gauge',                 // /^[a-z0-9][a-z0-9-]{0,39}$/、全プラグインで一意
  title: 'cpu gauge',
  description: 'Average CPU load as one big number.',
  permissions: {
    metrics: ['cpu.load'],         // 購読してよいメトリクス
    hosts: [],                     // ctx.fetch してよいホスト（完全一致）
  },
  settings: [
    { key: 'decimals', type: 'number', label: 'Decimals', default: 0, min: 0, max: 2 },
  ],
  minSize: { w: 160, h: 60 },
  multiple: true,

  setup(ctx) {
    ctx.metrics.on('cpu.load', (load) => {
      ctx.render([
        { t: 'big', value: load.total.toFixed(ctx.settings.decimals), unit: '%', tone: load.total > 90 ? 'danger' : undefined },
        { t: 'bar', value: load.total / 100 },
      ])
    })
  },
} satisfies WidgetPlugin
```

- `import` は **`import type` だけ**許す。値の import・`require` は読み込みエラー
- `export default` にオブジェクトを1つ。`setup` 以外は**データだけ**（descriptor として取り出せること）
- `apiVersion` がこのビルドより新しいものは読まずに「新しい elecdex が必要」と表示

---

## 3. 読み込み（main: `PluginService`）

1. `plugins/` が無ければ作り、サンプル `hello-elecdex.ts` を1本書く。**フォルダが既にあれば（空でも）二度と書かない**
2. `elecdex-plugin.d.ts` を毎回このビルドの API に同期する（手編集不可と明記）
3. `*.ts` / `*.js`（`*.d.ts` 除く）を走査
   - `lstat` で**通常ファイルのみ**（symlink を追わない、サブフォルダに降りない）
   - **1 MiB 超は読まずにスキップ**
   - sucrase（`transforms: ['typescript', 'imports']`）で CJS 文字列に変換。値の import が残ったらエラー
   - 失敗はファイル単位で隔離し、他を止めない
4. フォルダを `fs.watch`（300 ms デバウンス）し、変わったファイルだけ再変換して renderer に通知
5. IPC は `plugins.list()`（`{ file, hash, code | null, error | null }[]`）と `plugins.onChange` のみ。**main はコードを実行しない**

変換器は elecxzy と同じ sucrase 3.35.1（最新）。Node の `module.stripTypeScriptTypes` は型を消すだけで `export` を CJS にできず、classic Worker で読めないため採らない。

---

## 4. 実行（renderer: `PluginHost`）

### 4.1 descriptor の取り出し

読み込み時に**使い捨て Worker** で `export default` を評価し、`setup` を除いた descriptor を返させる（3 秒で terminate）。
zod で検証し、id 重複・不正な権限・不正な設定定義はそのプラグインをエラーにする。この段階では `ctx` を渡さないので、コードが何をしても何にも届かない。

### 4.2 ペインごとの Worker

`plugin:<id>` のペインがマウントされたら常駐 Worker を1つ作り `setup(ctx)` を呼ぶ。アンマウント（閉じる・移動・リロード）で `terminate()`。移動で作り直しになるため、残したい値は `ctx.state` に置く（ビルトインと同じ規則）。

```
[prologue]  fetch / XMLHttpRequest / WebSocket / EventSource / importScripts / Worker /
            SharedWorker / indexedDB / caches / BroadcastChannel / RTCPeerConnection
            を undefined に。require は throw。module / exports を用意
[plugin]    sucrase 変換済み CJS
[epilogue]  ctx を組み立て、ホストとのメッセージ（下記）を処理
```

- **classic Worker**。CSP の `script-src` に `blob:` は無く `worker-src blob:` だけで動く
- グローバルの潰しは多層防御にすぎない。真の封じ込めはアプリ CSP。**CSP を緩める変更をしたら再監査必須**（security テストで CSP 文字列を固定する）

### 4.3 暴走対策

- ホストは 2 秒ごとに ping、**5 秒応答が無ければ terminate**（同期の無限ループ）。ペインは「plugin not responding」と再起動ボタンに落ちる
- `ctx.render` は 10 fps のフレームループに合わせて間引き、最後の1回だけ描く
- Worker が投げた未捕捉例外はペインにエラー表示（スタックの先頭数行）。3 回続けば自動再起動をやめる

### 4.4 見えていないとき

ペインが見えない（隠れたタブ・画面外・ウィンドウ最小化）間は `ctx.every` のタイマーとメトリクス配信を止め、`ctx.on('visibility')` で知らせる。見えたら即 1 回タイマーを発火する。スペアナの `whileVisible` と同じ考え方で、見えないペインのために通信・計算しない。

---

## 5. `ctx` API（apiVersion 1）

```ts
interface PluginContext<S> {
  /** 描画。呼ぶたびに全置き換え。 */
  render(blocks: readonly Block[]): void
  /** 周期実行。最小 1000 ms。見えない間は止まる。解除関数を返す。 */
  every(ms: number, fn: () => void | Promise<void>): () => void
  /** permissions.metrics に宣言したものだけ。未宣言は throw。 */
  metrics: { on<K extends MetricSourceId>(id: K, fn: (value: MetricValue<K>) => void): () => void }
  /** permissions.hosts に宣言し、同意されたホストだけ。 */
  fetch(url: string, init?: { headers?: Record<string, string> }): Promise<PluginResponse>
  /** ペインごとの設定値（settings 定義から型が付く）。変更は on('settings')。 */
  readonly settings: S
  /** ペイン状態（JSON、64 KiB 上限）。移動・再起動をまたいで残る。 */
  state: { get<T>(): T | undefined; set(value: unknown): void }
  readonly size: { w: number; h: number }
  on(event: 'settings' | 'resize' | 'visibility', fn: () => void): () => void
  /** list / button ブロックのクリック。 */
  on(event: 'action', fn: (action: string, itemId?: string) => void): () => void
  /** ペイン右上のサブタイトル（ビルトインの paneMeta と同じ場所）。 */
  subtitle(text: string | null): void
  log(...args: unknown[]): void
}

interface PluginResponse {
  status: number
  headers: Record<string, string>
  text(): string
  json(): unknown
}
```

`setup` は解除関数を返してよい（terminate 前に呼ぶ。ただし呼ばれる保証はない）。

---

## 6. ブロック（描画スペック）

```ts
type Tone = 'ok' | 'warn' | 'danger' | 'dim'

type Block =
  | { t: 'heading'; text: string }
  | { t: 'text'; text: string; tone?: Tone; size?: 'sm' | 'md' | 'lg'; wrap?: boolean }
  | { t: 'big'; value: string; unit?: string; label?: string; tone?: Tone }
  | { t: 'rows'; rows: readonly { label: string; value: string; tone?: Tone }[] }
  | { t: 'bar'; value: number; label?: string; text?: string; tone?: Tone }        // value 0..1
  | { t: 'spark'; values: readonly number[]; min?: number; max?: number; label?: string }
  | { t: 'table'; columns: readonly string[]; rows: readonly (readonly string[])[]; align?: readonly ('left' | 'right')[] }
  | { t: 'list'; items: readonly { id: string; text: string; sub?: string; tone?: Tone }[]; action?: string }
  | { t: 'button'; text: string; action: string }
  | { t: 'link'; text: string; href: string }          // https のみ。クリックで既定ブラウザ
  | { t: 'notice'; text: string; tone?: Tone }         // エラー・出典表示
  | { t: 'divider' }
```

- **色は指定できない**。`tone` を semantic トークンに写す。テーマ切替・Business (Light) の暗色補正にも自動で追従
- 上限: ブロック 200、文字列 2,000 字、`spark` 512 点、`table` 200 行。超過分は切り捨ててペイン下部に notice
- ホストが zod で検証。不正なブロックはそれだけ落とし、理由を `ctx.log` 相当でペインに出す
- HTML は解釈しない（テキストとして描く）。`link` はホストが https か確かめ、`shell.openExternal` に委ねる
- 描画は既存の共通部品（`StreamChart` 等）を再利用し、ビルトインのペインと見分けがつかない見た目にする

---

## 7. 通信（main: `PluginFetch`）

renderer の `PluginHost` が Worker の `ctx.fetch` を中継し、**Worker を所有するプラグイン id を自分で付けて** main に送る（プラグインは他のプラグインを名乗れない）。main が次を強制する:

| 規則 | 値 |
|---|---|
| スキーム | `https:` のみ |
| ホスト | そのプラグインが**同意済み**の `hosts` に完全一致（ワイルドカード・IP リテラル・`localhost` は宣言時点で不可） |
| メソッド | GET のみ（v1） |
| ヘッダ | プラグイン指定は `accept` / `authorization` / `x-*` のみ。Cookie は送らず保存しない。User-Agent は `elecdex/<version> plugin/<id>` |
| リダイレクト | 最大 3 回、行き先も許可ホストに限る |
| 応答 | 1 MiB 上限、15 秒タイムアウト |
| 頻度 | プラグインごとに毎秒 1 回・毎分 30 回。超過は即エラー（キューしない） |

テストでは `ELECDEX_PLUGIN_HTTP_HOSTS=127.0.0.1:<port>` のときだけ、そのホストに http を許す（既存の `ELECDEX_*_BASE_URL` と同じく本番では未設定）。

---

## 8. 有効化・同意・設定

### 8.1 状態

`settings.plugins[<id>] = { enabled: boolean, granted: { metrics: string[], hosts: string[] } }`

- 新しく見つかったプラグインは `enabled: false`
- 有効化時に、descriptor の権限（メトリクスは「プロセス名が見える」「接続先 IP が見える」など平易な説明付き）と通信先ホストを見せて同意を取る
- **ファイルを編集しても、権限が広がらなければ同意は保つ**（開発中の保存のたびに聞かない）。広がったら無効に戻して再同意
- main の `PluginFetch` は `granted.hosts` だけを見る。renderer から来た descriptor は信じない

### 8.2 設定ダイアログ「plugins」

ファイル一覧、状態（有効・無効・要同意・エラー・新しい elecdex が必要）、権限、有効化トグル、「フォルダを開く」（main 固定パスの `shell.openPath`）、「再読み込み」。

### 8.3 ペインごとの設定

`settings` 定義からホストがフォームを生成し、ペインの歯車（既存 `SettingsButton`）で開く。型は `string` / `number`（min/max/step）/ `boolean` / `select`（options）。値はペイン状態に保存。

### 8.4 ピッカーとレイアウト

- 有効なプラグインだけピッカーに出し、「plugin」バッジを付ける
- レイアウトに `plugin:<id>` があるのに無効・削除・エラーなら、ペインは理由と「設定を開く」ボタンを出す（ツリーは消さないので、戻せば復活する）
- ビルトインの上書きはできない（`plugin:` 名前空間で衝突しない）
- 起動ログにプラグインの読み込み結果を1行ずつ出す

---

## 9. テスト

| 層 | 対象 |
|---|---|
| unit | descriptor・ブロック・設定定義の zod 検証、ホスト許可判定（IP・localhost・リダイレクト先）、頻度制限、ブロック上限の切り詰め、`plugins/` 走査のハードニング（symlink・フォルダ・1 MiB・scaffold 一回性・`.d.ts` 同期・値 import の拒否） |
| component | `PluginPane`（Worker は差し替え可能なインターフェース越し）: 描画・action 送信・見えない間の停止・エラー・not responding 表示 |
| e2e | 一時 userData にプラグインを置き、有効化 → 同意 → ペイン追加 → 描画、ファイル編集で再読み込み、ローカルスタブへの fetch、未同意ホストの拒否、閉じたらタイマーと fetch が止まる |
| security | Worker 内で `fetch` 等が undefined・`require` が throw、CSP 文字列の固定、無限ループの terminate、他プラグイン id の詐称不可、権限拡大で再同意 |

外部サービスには一切つながない。

---

## 10. 後続版に回すもの

- **command プラグイン**（アクティブ端末の可視テキスト・cwd・直前コマンドの終了コードを受け、書き込みを返す）。キーバインド割り当てかコマンドパレットかを決めてから
- `canvas` ブロック（自由描画）、`columns` による横並び
- POST 等の GET 以外、プラグイン間共有ストレージ
- 複数ファイル構成・配布用フォルダ形式

---

## 11. 実装順（v0.0.5）

1. `PluginService`（走査・変換・監視・`.d.ts`・scaffold）と IPC
2. `PluginHost`（prologue、descriptor 取り出し、常駐 Worker、ping）
3. `PluginPane.svelte` とブロック描画・検証
4. `ctx`: render / every / state / settings / subtitle / visibility / metrics
5. `PluginFetch` と同意・設定ダイアログ・ピッカー・起動ログ
6. サンプル（通信なし）、`.d.ts` の文書化、README、architecture.md §16
