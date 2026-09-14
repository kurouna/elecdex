# elecdex プラグイン仕様（v0.0.5: widget プラグイン）

> 状態: **v0.0.5 で実装済み**。範囲は **widget プラグイン**（ペインを足す）。端末に書き込む command プラグインは §11 のとおり後続版。
> 同梱サンプルは `examples/plugins/pomodoro/`（ポモドーロタイマー）。

---

## 1. 方針

| 決定 | 内容 | 理由 |
|---|---|---|
| 配布形式 | `<userData>/plugins/` に `.ts` / `.js` を1枚、または **フォルダ**（`index.ts` と相対 import） | npm・ビルド・パッケージ化が要らない。数百行のプラグインはファイルを分けて保守・テストできる |
| 実行場所 | renderer の **blob Worker、1プラグイン1つ** | Node・DOM・`window.elecdex`・アプリ状態に構造的に届かない。main はテキストを変換するだけで実行しない |
| 構成 | **service**（データの取得と保持、プラグインに1つ）と **view**（ペインごとの描画） | 同じプラグインのペインが2つあっても取得は1回。データはペインを閉じても残る |
| 描画 | **ブロック宣言型**。view はデータ（`Block[]`）を返し、ホストが Svelte で描く | サンドボックスを緩めない。テーマ・フォント・eDEX の見た目に作者の手間なしで揃う |
| 通信 | **宣言し同意したホストだけ**、main が代行する `ctx.fetch`。ログインが要るサイトはプラグイン専用セッション | 外部 API を読むのが最大の用途。renderer の CSP（`connect-src 'self'`）は変えない |
| 信頼 | 置いただけでは**無効**。有効化時に権限を見せて同意を取り、権限が広がったら取り直す | 置かれたファイルが勝手に通信・プロセス一覧の読み取り・常駐を始めない |

### 本体との関係

レイアウト側はすでにプラグインを受けられる。`registry.ts` の動的層に `plugin:<id>` で載れば、分割・タブ・移動・保存・ピッカーは変更不要。
全プラグインが共通の `PluginPane.svelte` を component として登録し、それが Worker に view を開かせる。
非公式 API を使うプラグインや個人用のプラグインは userData に置くだけで、このリポジトリには入れない。

---

## 2. プラグインの形

```ts
// <userData>/plugins/pomodoro/index.ts
import type { ElecdexPlugin } from '../elecdex-plugin'   // 型だけ。変換時に消える

export default {
  apiVersion: 1,
  id: 'pomodoro',                  // /^[a-z0-9][a-z0-9-]{0,39}$/、全プラグインで一意
  title: 'pomodoro',
  description: 'A focus timer: work, short break, long break.',
  permissions: {
    metrics: [],                   // 購読してよいメトリクス
    hosts: [],                     // ctx.fetch してよいホスト（完全一致）
    session: [],                   // hosts のうち、ログインセッションを使うもの
    background: false,             // ペインが無くても service を動かす
    notify: true,                  // 効果音とシステム通知
  },
  settings: [
    { key: 'work', type: 'number', label: 'Work (min)', default: 25, min: 1, max: 120 },
  ],
  minSize: { w: 180, h: 120 },
  multiple: true,

  service(ctx) { /* 取得・保存・ctx.publish(model) */ },
  view(ctx) { ctx.onData((model) => ctx.render(blocks(model))) },
} satisfies ElecdexPlugin
```

- `export default` にオブジェクトを1つ。`service` / `view` 以外は**データだけ**（descriptor として取り出せること）
- `view` は必須、`service` は任意
- 値の import はフォルダ内の相対パスだけ。`require`・パッケージ名・フォルダ外は実行時に throw
- `apiVersion` がこのビルドより新しいものは読まずに「新しい elecdex が必要」と表示

---

## 3. 読み込み（main: `PluginService`）

1. `plugins/` が無ければ作り、同梱サンプル `pomodoro/` を書く。**フォルダが既にあれば（空でも）二度と書かない**
2. `elecdex-plugin.d.ts` を毎回このビルドの API に同期する（手編集不可と明記）。中身は `src/shared/plugin-api.ts` そのもので、ホストとプラグインの型は同じファイルから来る
3. 走査
   - 直下の `*.ts` / `*.js`（`*.d.ts` 除く）は1ファイルのプラグイン
   - 直下のフォルダで `index.ts` か `index.js` を持つものはフォルダのプラグイン。中の `.ts` / `.js` を最大 4 階層・64 ファイルまで読む
   - `lstat` で**通常ファイルとフォルダのみ**（symlink を追わない）
   - 1 プラグイン合計 **1 MiB 超は読まない**
   - 各ファイルを sucrase（`transforms: ['typescript', 'imports']`）で CJS に変換し、`{ "<相対パス>": function (module, exports, require) {…} }` の表にまとめる（ファイル名は `JSON.stringify` で埋める）
   - 失敗はプラグイン単位で隔離し、他を止めない
4. フォルダを再帰で監視（300 ms デバウンス）し、変わったら全体を再走査して、中身のハッシュが変わったものだけ renderer が再起動する
5. **main はコードを実行しない**

変換器は elecxzy と同じ sucrase 3.35.1（最新）。Node の `module.stripTypeScriptTypes` は `export` を CJS にできず、classic Worker で読めないため採らない。

---

## 4. 実行（renderer: `PluginHost`）

### 4.1 descriptor の取り出し

読み込み時に**使い捨て Worker** で評価し、関数を除いた descriptor を返させる（3 秒で terminate）。
zod で検証し、id 重複・不正な権限・不正な設定定義はそのプラグインをエラーにする。この段階では `ctx` を渡さないので何にも届かない。

### 4.2 プラグインの Worker

```
[prologue]  fetch / XMLHttpRequest / WebSocket / EventSource / importScripts / Worker /
            SharedWorker / indexedDB / caches / BroadcastChannel / RTCPeerConnection を
            自身とプロトタイプの両方から消す。モジュール表と相対 require を用意
[plugin]    sucrase 変換済みのモジュール表
[runtime]   ctx を組み立て、ホストとのメッセージを処理
```

- **classic Worker**。CSP の `script-src` に `blob:` は無く `worker-src blob:` だけで動く。`eval` も CSP で使えない
- グローバルの消去は多層防御にすぎない。真の封じ込めはアプリ CSP。**CSP を緩める変更をしたら再監査必須**（テストで CSP 文字列を固定する）
- Worker を動かす条件
  - `background` 同意済み: 有効な間ずっと（アプリ起動中）
  - それ以外: そのプラグインのペインが1つ以上ある間。最後のペインが閉じたら terminate
- 有効化の取り消し・ファイル変更・権限拡大で terminate（変更なら作り直す）

### 4.3 暴走対策

- ホストは 2 秒ごとに ping、**5 秒応答が無ければ terminate**。ペインは「plugin not responding」と再起動ボタンに落ちる
- `ctx.render` は 10 fps のフレームループに合わせて間引き、最後の1回だけ描く
- 未捕捉例外はペインにエラー表示（先頭数行）。view の例外はそのペインだけ、service の例外は全ペイン

### 4.4 見えていないとき

ペインが見えない間（隠れたタブ・画面外）は **view の** `ctx.every` を止め、見えたら1回すぐ発火する。
service のタイマーは止めない（データを積む役目だから）。background でないプラグインは、ペインが無くなれば Worker ごと止まる。

---

## 5. `ctx` API（apiVersion 1）

```ts
interface CommonContext<S> {
  readonly settings: S                      // プラグイン設定の値（settings 定義から型が付く）
  readonly locale: string                   // 'ja' | 'en' など、アプリの言語
  every(ms: number, fn: () => void | Promise<void>): () => void   // 最小 1000 ms
  on(event: 'settings', fn: () => void): () => void
  log(...args: unknown[]): void
}

interface ServiceContext<S, M> extends CommonContext<S> {
  publish(model: M): void                   // 全 view に配る。後から開いた view にも最新を渡す
  metrics: { on<K extends MetricSourceId>(id: K, fn: (value: MetricValue<K>) => void): () => void }
  fetch(url: string, init?: { headers?: Record<string, string> }): Promise<PluginResponse>
  storage: { get<T>(key: string): T | undefined; set(key: string, value: unknown): void; delete(key: string): void }
  notify(message: { title: string; body?: string; sound?: boolean }): void   // permissions.notify
  setOptions(key: string, options: readonly { value: string; label: string }[]): void  // select の選択肢
  on(event: 'settings' | 'session', fn: () => void): () => void            // session: ログイン・ログアウトした
  on(event: 'action', fn: (action: PluginAction) => void): () => void     // view から来た操作
}

interface ViewContext<S, M> extends CommonContext<S> {
  onData(fn: (model: M) => void): () => void
  render(blocks: readonly Block[]): void    // 呼ぶたびに全置き換え
  readonly size: { w: number; h: number }
  readonly visible: boolean
  state: { get<T>(): T | undefined; set(value: unknown): void }   // ペイン状態（JSON、64 KiB）
  subtitle(text: string | null): void
  badge(text: string | null, tone?: Tone): void
  on(event: 'settings' | 'resize' | 'visibility', fn: () => void): () => void
  on(event: 'action', fn: (action: PluginAction) => void): () => void
}

/** list / button のクリック。view が受け、既定で service にも届く。 */
interface PluginAction { action: string; item?: string; pane: string }

interface PluginResponse { status: number; headers: Record<string, string>; text(): string; json(): unknown }
```

- `service` がないプラグインでは `publish` 系は無く、view が `every` などで自分で描く
- `fetch` / `storage` / `metrics` / `notify` は service だけが持つ。取得と保存をプラグインに1か所へ寄せるため
- view の `on('action')` はペイン固有の反応（表示切替など）に使い、同じ action は service にも届く
- `service` と `view` は解除関数を返してよい（terminate 前に呼ぶが保証はない）

---

## 6. ブロック（描画スペック）

```ts
type Tone = 'ok' | 'warn' | 'danger' | 'dim' | 'accent'

type Block =
  | { t: 'heading'; text: string }
  | { t: 'text'; text: string; tone?: Tone; size?: 'sm' | 'md' | 'lg' }
  | { t: 'big'; value: string; unit?: string; label?: string; tone?: Tone }
  | { t: 'rows'; rows: readonly { label: string; value: string; tone?: Tone }[] }
  | { t: 'bar'; value: number; label?: string; text?: string; tone?: Tone; segments?: number }  // value 0..1
  | { t: 'steps'; count: number; done: number; label?: string; tone?: Tone }                   // ●●●○
  | { t: 'spark'; values: readonly number[]; min?: number; max?: number; label?: string }
  | { t: 'chart'; height?: number
      x: { min: number; max: number; time?: boolean }
      y: { min: number; max: number; unit?: string }
      series: readonly { points: readonly (readonly [number, number])[]; line?: 'solid' | 'dashed' | 'dotted'; tone?: Tone; fill?: boolean }[]
      rules?: readonly { x?: number; y?: number; label?: string; tone?: Tone }[]
      labels?: readonly { x: number; y: number; text: string; tone?: Tone }[] }
  | { t: 'time'; at: number; style: 'relative' | 'countdown' | 'clock' | 'date'; label?: string; tone?: Tone }
  | { t: 'table'; columns: readonly string[]; rows: readonly (readonly string[])[]; align?: readonly ('left' | 'right')[] }
  | { t: 'list'; items: readonly { id: string; text: string; sub?: string; tone?: Tone }[]; action?: string }
  | { t: 'buttons'; items: readonly { action: string; text: string; primary?: boolean; disabled?: boolean }[] }
  | { t: 'link'; text: string; href: string }            // https のみ。クリックで既定ブラウザ
  | { t: 'signin'; host: string; text?: string }         // session のホストにログインするボタン
  | { t: 'notice'; text: string; tone?: Tone }           // エラー・出典・「非公式」表示
  | { t: 'divider' }
```

- **色は指定できない**。`tone` を semantic トークンに写す（`accent` はテーマの差し色）。テーマ切替と Business (Light) の暗色補正に自動で追従
- `time` はホストが毎秒描き直す（countdown は `mm:ss`、relative は「2h 13m」）。view が毎秒 render しなくてよい
- `signin` はホストが描くボタンで、**利用者のクリックでだけ**ログイン窓が開く。プラグインから窓を開く API は無い
- 上限: ブロック 200、文字列 2,000 字、`spark` 512 点、`chart` 系列 8・各 1,024 点、`table` 200 行、`list` 200 件。ブロック数の超過はペインに注記し、文字列と配列は黙って切り詰める
- ホストが zod で検証する。不正なブロックはそれだけ落とし、理由をペインに出す。HTML は解釈しない

---

## 7. 通信（main: `PluginNet`）

renderer の `PluginHost` が Worker の `ctx.fetch` を中継し、**Worker を所有するプラグイン id を自分で付けて** main に送る（プラグインは他を名乗れない）。main は renderer から来た descriptor を信じず、settings.json の**同意済み権限だけ**を見る。

| 規則 | 値 |
|---|---|
| スキーム | `https:` のみ |
| ホスト | 同意済み `hosts` に完全一致。ワイルドカード・IP リテラル・`localhost` は宣言できない |
| メソッド | GET のみ（v1） |
| ヘッダ | プラグイン指定は `accept` / `accept-language` / `authorization` / `x-*` のみ |
| リダイレクト | 最大 3 回、行き先も同意済みホストに限る |
| 応答 | 1 MiB 上限、15 秒タイムアウト。`set-cookie` は返さない |
| 頻度 | プラグインごとにトークンバケット（容量 5、毎分 30 回分を補充）。超過は即エラー |

### 7.1 セッション

- `session` に挙げたホストへの取得は、プラグイン専用の保存領域 `persist:plugin-<id>` の Cookie を付けて、Electron の `net`（Chromium の通信経路）で送る。User-Agent は Chromium 標準から Electron と elecdex の表記を除いたもの
- それ以外のホストはメモリ上の共用領域で、Cookie を送らず残さない。User-Agent は `elecdex/<version> plugin/<id>`
- ログイン窓: `signin` ブロック（または設定の「sign in」）のクリックで開く BrowserWindow。プラグインごとに1枚で、2度目は前面に出すだけ。その領域を使い、preload なし・sandbox・権限要求はすべて拒否。https の遷移は許し（Google などの外部ログインのため）、ポップアップは同じ窓で開き、今の origin をタイトルに出す。閉じたら service に `session` イベント
- 設定の「ログアウト」とプラグインの削除で、その領域を消す
- プラグインから Cookie の値は見えない。見えるのは応答だけ

テストでは `ELECDEX_PLUGIN_HOST_MAP=api.example.test=127.0.0.1:<port>` で、名前のホストへの https をローカルの http スタブに送る。許可判定は本番と同じまま（本番では未設定）。

リダイレクトを1段ずつ判定するため、main は `net.fetch` ではなく `net.request`（`redirect: 'manual'`）を使う。Electron 44 の `net.fetch` は `redirect: 'manual'` を「Redirect was cancelled」で失敗させる（実測）。

---

## 8. 保存・通知・設定

### 8.1 `ctx.storage`

プラグイン単位のキーと値。main が `<userData>/plugin-data/<id>.json` に書く（1 秒デバウンス、終了時に書き出し）。JSON で合計 1 MiB 上限、超える `set` は例外。起動時に全体を Worker に渡すので `get` は同期。

### 8.2 `ctx.notify`

`permissions.notify` に同意したプラグインだけ。アプリ内ではペインを光らせ、インターフェース音が有効ならチャイムを鳴らす（`sound: false` で鳴らさない）。ウィンドウが前面にないときはシステム通知も出す。1 分に 6 回まで。

### 8.3 状態

`settings.plugins[<id>] = { enabled, granted: { metrics, hosts, session, background, notify }, values }`

- 新しく見つかったプラグインは `enabled: false`
- 有効化時に権限を平易な説明付きで見せて同意を取る
  - メトリクス: `proc.list` は「動いているプログラム名が見える」、`net.connections` は「通信先の IP が見える」など
  - `session`: 「このサイトにあなたとしてアクセスします」
  - `background`: 「ペインを閉じても動き続けます」
- **ファイルを編集しても、権限が広がらなければ同意は保つ**（開発中の保存のたびに聞かない）。広がったら動かさず「要同意」

### 8.4 設定ダイアログ「plugins」

ファイル一覧、状態（有効・無効・要同意・エラー・新しい elecdex が必要）、権限、有効化トグル、プラグイン設定（`settings` 定義から生成。型は `string` / `number` / `boolean` / `select`）、サインインとログアウト、「忘れる」（保存データとセッションを消して設定から外す）、「フォルダを開く」。保存すれば自動で読み直すので再読み込みボタンは無い。`select` の選択肢は定義に書くか、service が `setOptions` で後から渡す。

### 8.5 ピッカーとレイアウト

- 有効なプラグインだけピッカーに出し、「plugin」バッジを付ける
- レイアウトに `plugin:<id>` があるのに無効・削除・エラーなら、ペインは理由と「設定を開く」ボタンを出す（ツリーは消さないので、戻せば復活する）
- ビルトインの上書きはできない（`plugin:` 名前空間で衝突しない）

---

## 9. 同梱サンプル: ポモドーロタイマー

`examples/plugins/pomodoro/`（フォルダ形式）。API の主な機能を一通り使う見本で、通信はしない。

- **service**
  - 状態（フェーズ、終了予定時刻、何本目か）を `ctx.storage` に置き、再起動しても続きから
  - フェーズ終了で `ctx.notify`
- **view**
  - `big` の残り時間（`time` countdown）、VFD 風の `bar`（segments）、今日の本数の `steps`、`buttons`（start / pause / skip / reset）
  - ペインが狭いときは数字だけ（`ctx.size`）
- 設定は作業・短い休憩・長い休憩の分数と、長い休憩までの本数

---

## 10. テスト

| 層 | 対象 |
|---|---|
| unit | descriptor・ブロック・設定・Worker からのメッセージの zod 検証。ホスト許可判定（IP・localhost・リダイレクト先）。トークンバケット。ブロック上限の切り詰め。走査のハードニング（symlink・深さ・ファイル数・1 MiB・scaffold 一回性・`.d.ts` 同期）。モジュール表と相対 require。Worker ランタイム（偽の self で ctx を動かす）。ポモドーロの状態遷移 |
| component | `PluginPane` とブロック描画（Worker は差し替え可能なインターフェース越し）: action 送信・見えない間の停止・エラー・not responding・`signin` |
| e2e | 一時 userData にプラグインを置き、有効化 → 同意 → ペイン追加 → 描画。ファイル編集で再読み込み。ローカルスタブへの fetch と未同意ホストの拒否。storage が再起動をまたぐ。閉じたら Worker・タイマー・fetch が止まる |
| security | Worker 内で `fetch` 等が使えない（プロトタイプ経由も CSP で届かない）、CSP 文字列の固定、無限ループの terminate、他プラグイン id の詐称不可、権限拡大で止まる |

外部サービスには一切つながない。

---

## 11. 後続版に回すもの

- **command プラグイン**（アクティブ端末の可視テキスト・cwd・直前コマンドの終了コードを受け、書き込みを返す）。キーバインド割り当てかコマンドパレットかを決めてから
- `canvas` ブロック（自由描画）、`columns` による横並び、ペインごとの設定フォーム
- POST 等の GET 以外

---

## 12. 実装順（v0.0.5）

1. 共有の型とスキーマ（`plugin-api.ts`、`plugins.ts`）、設定の `plugins`
2. `PluginService`（走査・変換・監視・`.d.ts`・scaffold）、`PluginNet`、storage、ログイン窓、通知、IPC
3. Worker ランタイムと `PluginHost`（descriptor・常駐・ping・メトリクス中継）
4. `PluginPane.svelte` とブロック
5. 設定ダイアログ・ピッカー・レイアウトの欠落表示
6. ポモドーロ、e2e、README、architecture.md §16
