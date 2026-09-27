# elecdex プラグイン仕様（v0.0.5: widget プラグイン、apiVersion 2: canvas・keys・sound）

> 状態: **v0.0.5 で実装済み**。範囲は **widget プラグイン**（ペインを足す）。端末に書き込む command プラグインは §11 のとおり後続版。
> **apiVersion 2**（canvas ブロック・キー入力・音）は §13（2026-09-27 実装、未リリース）。
> 同梱サンプルは `examples/plugins/pomodoro/`（ポモドーロタイマー、新しい plugins フォルダに書かれる）と、
> apiVersion 2 の見本 `examples/plugins/keystream/`（リズムゲーム、フォルダから入れる）。

---

## 1. 方針

| 決定 | 内容 | 理由 |
|---|---|---|
| 配布形式 | `<userData>/plugins/` に `.ts` / `.js` を1枚、または **フォルダ**（`index.ts` と相対 import） | npm・ビルド・パッケージ化が要らない。数百行のプラグインはファイルを分けて保守・テストできる |
| 実行場所 | renderer の **blob Worker、1プラグイン1つ** | Node・DOM・`window.elecdex`・アプリ状態に構造的に届かない。main はテキストを変換するだけで実行しない |
| 構成 | **service**（データの取得と保持、プラグインに1つ）と **view**（ペインごとの描画） | 同じプラグインのペインが2つあっても取得は1回。データはペインを閉じても残る |
| 描画 | **ブロック宣言型**。view はデータ（`Block[]`）を返し、ホストが Svelte で描く | サンドボックスを緩めない。テーマ・フォント・eDEX の見た目に作者の手間なしで揃う |
| 通信 | **宣言し同意したホストだけ**、main が代行する `ctx.fetch`。ログインが要るサイトはプラグイン専用セッション | 外部 API を読むのが最大の用途。renderer の CSP（`connect-src 'self'`）は変えない |
| 信頼 | 置いただけでは**無効**。有効化時に権限を見せて同意を取り、権限が広がったら取り直す | 置かれたファイルが勝手に通信・プロセス一覧の読み取り・常駐を始めない（説明を読むためにトップレベルのコードは動くが、何の権限も持たない。§4.1） |

### 本体との関係

レイアウト側はすでにプラグインを受けられる。`registry.ts` の動的層に `plugin:<id>` で載れば、分割・タブ・移動・保存・ピッカーは変更不要。
全プラグインが共通の `PluginPane.svelte` を component として登録し、それが Worker に view を開かせる。
非公式 API を使うプラグインや個人用のプラグインは userData に置くだけで、このリポジトリには入れない。

**導入**: 設定の PLUGINS に「install from a folder…」がある。main が OS のフォルダ選択を開き
（ページはパスを一切渡さない＝API にパスを取る呼び出しを増やさない）、選ばれたフォルダから
**entry から辿れるモジュールだけ**を `<userData>/plugins/<フォルダ名>` にコピーする
（`src/main/plugins/install.ts`）。`index.ts`/`index.js` から import を辿り、そこで見つかった
ファイルだけが対象で、辿り着かないもの（テスト、古い版、メモ）は**コピーも検査もしない**——
Worker が読み込むのも entry から require されたものだけであり、リポジトリにはプラグイン以外の
ものが一緒に置かれているため。同名があれば置き換えるか尋ねる（権限と保存データは id に紐づく
のでそのまま残り、id が変われば同意は取り直しになる）。入れたプラグインは**無効のまま**で、
手で置いたものと同じ同意の道を通る。

フォルダ名は見ない。`tests/` の中のファイルでも、entry から import していればコピーされる
（していなければコピーされない）。

辿る途中で、実行せずに分かることを確かめる。(1) 各ファイルが sucrase を通ること＝構文、
(2) import がすべて**スキャナがモジュール表に入れるファイル**に解決すること。ここはスキャナの
規則そのもので、コードファイルであること、どの階層でもドット始まりと `node_modules` でないこと、
深さの上限（`PLUGIN_LIMITS.depth`）に収まることを見る——スキャナが束ねないファイルは Worker が
読み込めないファイルであり、コピーしても開いた瞬間に落ちるため。解決規則は Worker の `resolve`
（shared/plugin-runtime.ts）と同じもので、片方を変えたらもう片方も変える。パッケージの import
（`from 'lodash'`）、フォルダの外に出る import、存在しないファイル、コードでないファイルの
import はここで断る——Worker が読み込んだ時点で初めて気づくのでは、インストールし、有効化し、
ペインを出した後になってしまうため。記述子（id・name・panes）の検証だけは実行が要るので、
従来どおり読み込み時に行われ、設定の行に理由が出る。指定されたフォルダがプラグインを
**含んでいる**だけのとき（別の elecdex の plugins フォルダなど）は、その旨を答える。


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
  zoom: 'panel',                   // 'full' | 'panel' | 省略（前面表示しない）
  multiple: true,

  service(ctx) { /* 取得・保存・ctx.publish(model) */ },
  view(ctx) { ctx.onData((model) => ctx.render(blocks(model))) },
} satisfies ElecdexPlugin
```

- `export default` にオブジェクトを1つ。`service` / `view` 以外は**データだけ**（descriptor として取り出せること）
- `zoom` はペインを前面に大きく出せるか（Ctrl+Shift+Z、× の隣の ⤢）。`'full'` はワークスペースのほぼ全面で、
  与えられた場所を埋めるペイン（リスト・グラフ・ページ）向け。`'panel'` は真ん中に読みやすい大きさで出す。
  **省略するとボタンも出ず、ショートカットも効かない**（数値がいくつか並ぶだけのペインはこれが正しい）
- `view` は必須、`service` は任意
- 値の import はフォルダ内の相対パスだけ。`require`・パッケージ名・フォルダ外は実行時に throw
- `apiVersion` がこのビルドより新しいものは読まずに「新しい elecdex が必要」と表示。canvas・keys・sound を使うなら 2（§13）

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

- **同意前にトップレベルのコードが動く**。`ctx` も通信も保存も無い Worker の中なので届くものは無いが、CPU は使える。無限ループのプラグインを並べても1コアしか占有しないよう、**1つずつ順に**読む（2026-09-16 のレビューで並列だったのを修正）
- AST からの静的抽出は採らない。`const plugin = {...}; export default plugin` や設定の配列を別ファイルに置く書き方ができなくなり、「1枚置くだけ」の手軽さと引き換えにする利点が、権限を持たないコードの CPU 3 秒に見合わないため
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
  closeSignIn(): void                        // ログインが通ったらログイン窓を閉じる
  readonly views: { open: number; visible: number }                        // 開いている・見えているペインの数
  on(event: 'settings' | 'session' | 'views', fn: () => void): () => void  // session: ログイン・ログアウトした / views: ペインの開閉と表示の変化
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
- `views` で、ペインにしか出さないもの（稼働状況など）はペインがある間だけ取り、積み続けるもの（履歴など）は background で取り続ける、と分けられる。数は Worker 内のランタイムが数えるので、ホストとの往復は無い
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
  | { t: 'buttons'; items: readonly { action: string; text: string; icon?: ButtonIcon; busy?: boolean; primary?: boolean; disabled?: boolean }[] }
      // icon: refresh / play / pause / stop / skip / reset / add / remove / settings / open。アイコンだけを描き、text はツールチップと読み上げ名になる。busy の間はアイコンが回る（refresh・reset 以外は明滅）
  | { t: 'link'; text: string; href: string }            // https のみ。開くサイト名を必ず添えて描く
  | { t: 'signin'; host: string; text?: string }         // session のホストにログインするボタン
  | { t: 'notice'; text: string; tone?: Tone }           // エラー・出典・「非公式」表示
  | { t: 'divider' }
  | { t: 'canvas'; id: string; height?: number }          // apiVersion 2。Worker が自分で描く面（§13）
```

- `chart` の `fill` は、各位置の線から基線へ、線の色が透明へ消えるグラデーションで塗る（本体の CPU・メモリ・通信のグラフと同じ）
- **色は指定できない**。`tone` を semantic トークンに写す（`accent` はテーマの差し色）。テーマ切替と Business (Light) の暗色補正に自動で追従
- `time` はホストが毎秒描き直す（countdown は `mm:ss`、relative は「2h 13m」）。view が毎秒 render しなくてよい
- `signin` はホストが描くボタンで、**利用者のクリックでだけ**ログイン窓が開く。プラグインから窓を開く API は無い
- 上限: ブロック 200、文字列 2,000 字、`spark` 512 点、`chart` 系列 8・各 1,024 点、`table` 200 行、`list` 200 件。ブロック数の超過はペインに注記し、文字列と配列は黙って切り詰める
- ホストが zod で検証する。不正なブロックはそれだけ落とし、理由をペインに出す。HTML は解釈しない
- `link` は、文字列がサイト名や URL に見えるなら `href` のホストと一致しなければ落とす。一致しても、描くときは開くサイトのホスト名を文字列の隣に必ず出す（表示と遷移先の食い違いによる誘導を防ぐ）

---

## 7. 通信（main: `PluginNet`）

renderer の `PluginHost` が Worker の `ctx.fetch` を中継し、**Worker を所有するプラグイン id を自分で付けて** main に送る（プラグインは他を名乗れない）。main は renderer から来た descriptor を信じず、settings.json の**同意済み権限だけ**を見る。

| 規則 | 値 |
|---|---|
| スキーム | `https:` のみ |
| ホスト | 同意済み `hosts` に完全一致。ワイルドカード・IP リテラル・`localhost` は宣言できない |
| メソッド | GET のみ（v1） |
| ヘッダ | プラグイン指定は `accept` / `accept-language` / `authorization` / `x-*` のみ |
| リダイレクト | 最大 3 回、行き先も同意済みホストに限る。最初の要求と別オリジンに移ったら、以後は `authorization` と `x-*` を送らない（ブラウザと同じく、あるサイト用の資格情報を次のサイトに渡さない） |
| 応答 | 1 MiB 上限、15 秒タイムアウト。`set-cookie` は返さない |
| 頻度 | プラグインごとにトークンバケット（容量 5、毎分 30 回分を補充）。超過は即エラー |

### 7.1 セッション

- `session` に挙げたホストへの取得は、プラグイン専用の保存領域 `persist:plugin-<id>` の Cookie を付けて、Electron の `net`（Chromium の通信経路）で送る。User-Agent は Chromium 標準から Electron と elecdex の表記を除いたもの
- それ以外のホストはメモリ上の共用領域で、Cookie を送らず残さない。User-Agent は `elecdex/<version> plugin/<id>`
- 開いている間にその領域の Cookie が変わると（1 秒待ってまとめて）service に `session` イベントを送る。プラグインはそこで取得をやり直し、通るようになったら `ctx.closeSignIn()` で窓を閉じる。ログインのあと利用者が窓を閉じる必要はない
- ログインの自動更新はしない（資格情報は持たない）。領域は永続なので、サイトの Cookie が有効な間は再起動をまたいでログインが続き、切れたらプラグインが `signin` を出して利用者のクリックを待つ
- ログイン窓: `signin` ブロック（または設定の「sign in」）のクリックで開く BrowserWindow。プラグインごとに1枚で、2度目は前面に出すだけ。その領域を使い、preload なし・sandbox・権限要求はすべて拒否。https の遷移は許し（Google などの外部ログインのため）、ポップアップは同じ窓で開き、今の origin をタイトルに出す。閉じたら service に `session` イベント
- 設定の「ログアウト」とプラグインの削除で、その領域を消す
- プラグインから Cookie の値は見えない。見えるのは応答だけ

テストでは `ELECDEX_PLUGIN_HOST_MAP=api.example.test=127.0.0.1:<port>` で、名前のホストへの https をローカルの http スタブに送る。許可判定は本番と同じまま（本番では未設定）。

リダイレクトを1段ずつ判定するため、main は `net.fetch` ではなく `net.request`（`redirect: 'manual'`）を使う。Electron 44 の `net.fetch` は `redirect: 'manual'` を「Redirect was cancelled」で失敗させる（実測）。

---

## 8. 保存・通知・設定

### 8.1 `ctx.storage`

プラグイン単位のキーと値。main が `<userData>/plugin-data/<id>.json` に書く（1 秒デバウンス、終了時に書き出し）。JSON で合計 1 MiB 上限、超える `set` は例外。キーは `[A-Za-z0-9_.:-]` の 1〜100 文字で、`__proto__`・`constructor`・`prototype` は使えない（Worker と main の両方で確かめる）。起動時に全体を Worker に渡すので `get` は同期。

### 8.2 `ctx.notify`

`permissions.notify` に同意したプラグインだけ。アプリ内ではペインを光らせ、インターフェース音が有効ならチャイムを鳴らす（`sound: false` で鳴らさない）。ウィンドウが前面にないときはシステム通知も出す。1 分に 6 回まで。

### 8.3 状態

`settings.plugins[<id>] = { enabled, granted: { metrics, hosts, session, background, notify }, values }`

- 新しく見つかったプラグインは `enabled: false`
- 有効化時に権限を平易な説明付きで見せて同意を取る
  - メトリクス: `proc.list` は「動いているプログラム名が見える」、`net.connections` は「通信先の IP が見える」など
  - 求められるのは `PLUGIN_METRIC_SOURCE_IDS`（`shared/metrics.ts`）にあるソースだけ。接続一覧ペインの `net.sockets`（どのプログラムがどこと通信しているか）は `PRIVATE_METRIC_SOURCE_IDS` にあり、**どのプラグインにも許可できない**。新しいソースは必ずどちらかに入れる（単体テストが確かめる）
  - `session`: 「このサイトにあなたとしてアクセスします」
  - `background`: 「ペインを閉じても動き続けます」
  - `keys`: 「ペインにフォーカスがある間に押したキーを受け取ります（Ctrl や Alt との組み合わせは渡しません）」、`sound`: 「音楽と音を鳴らします」（§13）
- **ファイルを編集しても、権限が広がらなければ同意は保つ**（開発中の保存のたびに聞かない）。広がったら動かさず「要同意」
- 同意は id と**ファイル名（またはフォルダ名）**の組に結びつける（`settings.plugins[id].key`）。別のファイルが同じ id を名乗っても権限は引き継がず、「x.ts が y.ts に同意した id を使っている」と示して聞き直す
- 個人情報に当たるメトリクス（プロセス名、接続先、ネットワークアドレス、機種、OS とマシン名）と通信先を同時に求めるプラグインには、同意画面で「それらを通信先へ送れる」と明記する
- フォルダから消えたプラグインの同意は自動では外さない。エディタの保存（一時的な削除や改名）で無効になるのを避けるため。消す場合は設定の「忘れる」を使う

### 8.4 設定ダイアログ「plugins」

ファイル一覧、状態（有効・無効・要同意・エラー・新しい elecdex が必要）、権限、有効化トグル、プラグイン設定（`settings` 定義から生成。型は `string` / `number` / `boolean` / `select`）、サインインとログアウト、「忘れる」（保存データとセッションを消して設定から外す）、「フォルダを開く」。保存すれば自動で読み直すので再読み込みボタンは無い。`select` の選択肢は定義に書くか、service が `setOptions` で後から渡す。

### 8.5 ピッカーとレイアウト

- 有効なプラグインだけピッカーに出し、「plugin」バッジを付ける
- レイアウトに `plugin:<id>` があるのに無効・削除・エラーなら、ペインは理由と「設定を開く」ボタンを出す（ツリーは消さないので、戻せば復活する）
- ビルトインの上書きはできない（`plugin:` 名前空間で衝突しない）
### 8.6 ペイン状態の再検査

`ctx.state` の 64 KiB 上限は Worker 内のランタイムが守るが、プラグインは `self.postMessage` で直接ホストに送れる。ホストは受け取った値を JSON にして大きさを確かめ、超えたものは layout.json に入れずペインにエラーを出す。

保存された状態は、レイアウトを読み直した後（再起動、レイアウトの切り替え）ペインが Worker に mount するときに渡す。レイアウトはこれを Svelte の状態（プロキシ）として持つので、ホストは `$state.snapshot` で素のデータに写してから送る。プロキシのまま `postMessage` すると DataCloneError で mount が失敗し、view が作られずにペインが空のままになる（2026-09-27 に直した。tests/component/plugins.test.ts と tests/e2e/plugins.spec.ts が再起動の経路を確かめる）。

### 8.7 検討して対応しないもの

- **DNS rebinding・社内ネットワークへの到達**: ホスト名の解決先 IP は確かめない。https 必須・ポート指定不可（443 のみ）・Chromium による証明書検証があり、攻撃者のドメイン名の有効な証明書を持つ 443 番のサービスが手元のネットワークにある状況は現実的でないため、二重解決の複雑さに見合わない

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
- `columns` による横並び、ペインごとの設定フォーム（`canvas` ブロックは apiVersion 2 で実装した。§13）
- POST 等の GET 以外

---

## 12. 実装順（v0.0.5）

1. 共有の型とスキーマ（`plugin-api.ts`、`plugins.ts`）、設定の `plugins`
2. `PluginService`（走査・変換・監視・`.d.ts`・scaffold）、`PluginNet`、storage、ログイン窓、通知、IPC
3. Worker ランタイムと `PluginHost`（descriptor・常駐・ping・メトリクス中継）
4. `PluginPane.svelte` とブロック
5. 設定ダイアログ・ピッカー・レイアウトの欠落表示
6. ポモドーロ、e2e、README、architecture.md §16

---

## 13. canvas・keys・sound（apiVersion 2）

> 状態: 実装済み（2026-09-27、未リリース）。見本は `examples/plugins/keystream/`（リズムゲーム KEYSTREAM）。
> ブロックでは描けないもの——表示レートで動く絵、押したキーへの即座の反応、音楽——のための 3 つの汎用の機能。
> どれもゲーム専用ではなく、メトロノーム・可視化・別のゲームにもそのまま使える。

### 13.1 方針

| 決定 | 内容 | 理由 |
|---|---|---|
| 版 | 使うプラグインは `apiVersion: 2` を宣言する。`permissions.keys` / `sound` は 2 でしか宣言できない（記述子の検証で断る） | 古い elecdex はこの権限を黙って捨てて動かしてしまう。2 と宣言すれば「新しい elecdex が必要」と言う。1 のプラグインはこれまでどおり読む |
| 描画 | `canvas` ブロック。ホストが `<canvas>` を作り `transferControlToOffscreen()` で Worker に**渡し切る**。2D のみ | Worker の中で描けば、ページにコードを持ち込まずに自由な絵が描ける。WebGL は GPU コンテキストの予算（CLAUDE.md）を食うので出さない |
| フレーム | `ctx.animate(fn)`。Worker の `requestAnimationFrame` を、ペインが見えていてウィンドウが画面にある間だけ回す | 10 fps のフレームループでは落ちてくるノーツが読めない（ELEC と同じ判断）。見えない間は 1 フレームも描かない |
| キー | `permissions.keys`。**ペイン自身にフォーカスがある間**だけ、Ctrl・Alt・システムキーを含まないキーを `code` で渡す。ペインの隅にホストが **KEYS** のランプを出す | シェルやアプリのショートカットを奪わない。キーを取っている間を、プラグインが描けない場所で必ず見せる（偽の入力欄への誘導を防ぐ） |
| 音 | `permissions.sound`。ホストの合成音源（Web Audio。サンプルは使わない）に、音色と時刻を指定した音符を渡す | Worker には Web Audio が無い。音色を固定の一覧にすれば、音量と同時発音数をホストが抑えられる |
| 時計 | 時刻はすべて Worker の `performance.now()`（ミリ秒）。ページと Worker の間は `timeOrigin` を足したエポックミリ秒で渡す | ページと Worker は時間原点が違う。キーの時刻、フレームの時刻、音の時刻が 1 本の時計にそろえば、判定も表示も音もずれない |

### 13.2 `canvas` ブロックと `ctx.surface`

```ts
{ t: 'canvas', id: 'screen' }             // 高さを省くとペインの残りを埋める
{ t: 'canvas', id: 'meter', height: 120 } // CSS px、40〜2000
```

- id は `/^[a-z0-9][a-z0-9-]{0,39}$/`。1 ペインに 4 つまで、同じ id は 2 つ目から落とす（`readBlocks`）
- 描けるようになると view に `surface` イベント。`ctx.surface(id)` で今のものを取れる。`g` は CSS px 単位に拡大済みの 2D コンテキスト（`Canvas2D`、plugin-api.ts に DOM 型なしで書き出した部分集合）、`w`・`h` は CSS px、`dpr` は画素比
- 大きさが変わる（ペインのリサイズ、画素比の違う画面への移動）と、キャンバスは消えて `surface` がもう一度来る。描き直す
- 大きさ 0（タブの裏）は伝えない。消した絵を誰にも見せないために描き直させることはしない。キャンバスを Worker に渡すのは ResizeObserver の最初の報告のとき（デバイス画素の大きさが分かってから）。先に渡すと、ペインが現れるときに 2 度大きさを決め直す（1 度消える）
- 大きさは CSS px の実数と、ブラウザーが言うデバイス画素（`devicePixelContentBoxSize`）で伝え、キャンバスはデバイス画素ちょうどの大きさにする。丸めで 1 px ずれると、拡大縮小されてにじむ
- **キャンバスは 1 つの Worker にしか渡せない**。プラグインの再起動（編集・restart）ではペインの「epoch」が上がり、ホストが canvas 要素ごと作り直して新しい Worker に渡す
- `ctx.theme`: テーマの色（`ground`・`text`・`accent` など 15 色、ページが計算した `rgb()`）・フォント・明暗・モーション低減。テーマが変わると `theme` イベント
- アプリのフォント（Chakra Petch・Saira Condensed・JetBrains Mono）は、最初の canvas のときにホストがバイト列で Worker に渡し、Worker が `FontFace` にする。ページの `@font-face` は Worker に届かず、file:// のページからは Worker が取りにも行けない（CSP の `font-src 'self'`）ため。フォントのモジュールは遅延読み込みで、canvas を使うプラグインが無ければ読まない。読み終わると `theme` イベントで描き直させる

### 13.3 `ctx.animate`

- `ctx.animate(fn)` は解除関数を返す。`fn(now)` は表示のフレームごと、ペインが見えていて（`visible`）ウィンドウが最小化・格納されていない間だけ呼ばれる
- **動くものが無くなったら止める**のはプラグインの責任。KEYSTREAM はメニューで静止し、エフェクトが消えたところで止める（メニューで止まっている間は、KEYSTREAM 1 ペインだけのアプリ全体で約 2%）
- 実測（2026-09-27、Windows 開発機、1920×1080、KEYSTREAM 1 ペインのアプリ全体、1 コア比）: 演奏中 約 65%。内訳は、ペイン全面のキャンバスを毎フレーム出すだけで約 33%、合成音の伴奏が約 6%、描画が約 26%。ELEC ペイン（§5.8）と同じく、滑らかさを取った

### 13.4 `ctx.keys`

```ts
permissions: { keys: true }
ctx.on('key', (k) => { k.code; k.down; k.shift; k.at })   // at は Worker の時計
ctx.on('focus', () => ctx.keys.focused)
ctx.keys.labels.KeyQ                                        // この配列で印字されている文字（AZERTY なら 'A'）
```

- 渡すのは `PLUGIN_KEY_CODES`（英字・数字・記号・Space・Enter・Escape・Backspace・矢印）だけ。**Ctrl / Alt / システムキーとの組み合わせ、Tab、ファンクションキー、IME の変換中は渡さない**（`keyFate`、shared/plugin-keys.ts）。押しっぱなしのリピートはページから取り上げるが渡さない
- ペインは `tabindex=0`・`role="application"` になり、クリックでフォーカスを取る。ボタンなどペインの中の部品にフォーカスがあるときは渡さない
- フォーカスかウィンドウのフォーカスが離れると、押されたままのキーを「離した」として渡し、`focus` イベント
- Escape は、ペインが前面表示（Ctrl+Shift+Z）のときはワークスペースが先に取って戻す（既存の規則）
- `labels` は `navigator.keyboard.getLayoutMap()` から。取れなければ US 配列の表記

### 13.5 `ctx.sound` と `ctx.keys.play`

```ts
permissions: { sound: true }
ctx.sound.play([{ voice: 'epiano', pitch: 64, at: now + 500, length: 300, level: 0.8, pan: 0 }])
ctx.sound.stop()                                  // このペインの音を止め、予約を捨てる
ctx.keys.play({ KeyA: { voice: 'epiano', pitch: 60 } })   // キーを押した瞬間にホストが鳴らす
ctx.keys.play({ KeyA: { voice: 'lead', pitch: 60, hold: true } })   // 押している間だけ鳴る
ctx.keys.sustain(true)                            // サステインペダル: 離したキーの音も鳴り続ける
```

- 音色: `piano`・`epiano`・`lead`・`chip`・`bass`・`pluck`・`pad`・`kick`・`snare`・`clap`・`hat`・`openhat`・`crash`・`tom`（renderer/plugins/voices.ts。インターフェース音と同じく合成で、ファイルもライセンスも無い）
- `at` は「聞こえる時刻」。ホストは出力のタイムスタンプ（`getOutputTimestamp`）でコンテキストの時刻に直すので、出力の遅延を含めて合う。過去の時刻と省略はすぐ鳴らす
- 1 回に 4096 音まで、10 分先まで、1 ペインの予約は 16384 音まで。曲を丸ごと渡すと長い曲や密な曲はこの上限に当たるので、数秒先までずつ渡すのがよい（KEYSTREAM は 5 秒先まで、残りが 3 秒を切ったら次を渡す。schedule.ts）。音高 0〜127、長さ 30 秒まで、音量 0〜1、定位 −1〜1 に丸める（`readNote`、shared/plugin-sound.ts）。遠い音符はキューで待ち、鳴る 250 ms 前にノードになる（曲を丸ごと渡してもノードは数個ずつ）
- 同時発音は 64 まで（古いものから切る）。最後にリミッターを通す
- **`keys.play` の音はホストがキーを受けた場で鳴らし、それから Worker にキーを渡す**。楽器が Worker の往復を待たない
- `hold` の付いた音はキーを押している間（30 秒まで）鳴り、キーが上がると音色ごとのリリースで消える（`Played.release`）。`keys.sustain(true)` の間は、キーが上がっても鳴り続け、`sustain(false)` で上がっているキーの音をすべて離す。鳴り続けているキーをもう一度打つと、前の音は止めてから鳴らし直す（ピアノのダンパーと同じ）。この規則は renderer/plugins/held.ts（`HeldNotes`）にまとめ、合成音源とは関数 2 つでつなぐ
- `sound.stop()` はペインの音をすべて止めるので、押さえている音とペダルの状態もホストから消える。ペダルを踏んだままにしたいプラグインは、止めたあとに `sustain(true)` を送り直す（KEYSTREAM の FREE モードがそうしている）
- インターフェース音のオン・オフとは別（プラグインの音量はプラグインの設定で持つ）。ペインが閉じる・Worker が止まると、そのペインの音は止まる。見えなくなったときに止めるかはプラグインが決める（KEYSTREAM は一時停止する）
- 何も鳴らなくなって 4 秒で AudioContext を suspend する（待機中に音声スレッドを回さない）
- テストでは音量 0 のまま鳴らし、ペインの `data-notes`（合成音源が受け取った音符の数）で確かめる

### 13.6 同意と検査

- 同意画面の文言: keys「ペインにフォーカスがある間に押したキーを受け取る（Ctrl や Alt との組み合わせは渡さない）」、sound「音楽と音を鳴らす」
- keys・sound は main を通らない（ページのホストが持つ）。メトリクスの中継と同じく、ホストが settings.json の同意（`grant.keys` / `grant.sound`）を見てから渡す・鳴らす。Worker 内のランタイムも、宣言していない `ctx.keys` / `ctx.sound` は例外にする
- 検査: Worker から来る `sound`・`sound-stop`・`keymap` は `WorkerMessageSchema` で形を、`readNotes` / `readKeymap` で中身を確かめる

### 13.7 見本: KEYSTREAM（`examples/plugins/keystream/`）

落ちてくる文字を判定線で打つと主旋律が鳴り、伴奏はゲームが鳴らすリズムゲーム。インストールは設定の「install from a folder」でこのフォルダを選ぶ（新しい plugins フォルダには書かない。keys と sound の同意が要るため）。

- **鍵盤**: ホーム段（A〜'）が白鍵、その上の段が黒鍵。QWERTY の段のずれが鍵盤の黒鍵の並びにそのまま重なる（R と I の位置は E–F、B–C の間で、鍵盤にも黒鍵が無い）。18 キーで C4〜F5、どの曲でも同じキーは同じ音（keyboard.ts）
- **譜面**: 旋律を「打つキーの文字」で書く（`'h.k.;-lk|h--.fghk'`、notation.ts）。伴奏は曲ごとに書く（`band`、arrange.ts）: 16 分 16 個で 1 小節のパターン（section。キック・スネア・クラップ・ハット・オープンハット・タム・クラッシュ、ベース、コード、アルペジオ、パッド）を幾つかと、各小節がどれを鳴らすかの並び（form。`*` で小節の頭にクラッシュ、`!` で最後の拍をスネアのロール）。ベースとコードはその小節のコードに従い、コードは旋律の下（D3〜C#4）に置く。どの曲にもある小節は songs/parts.ts。曲の拍の置き方に伴奏を合わせるため、スタイルから組み立てる方式はやめた
- **曲**: 16 曲、やさしい順。elecdex のオリジナル 8 曲: BOOT SEQUENCE（118 BPM、シンセウェイブ）・SAKURA SIGNAL（140、J-POP 風。A メロは 1 小節ずつ下がるベース、サビは F–G–Em–Am）・NEON CIRCUIT（120、ハウス）・AFTERGLOW（124、ディスコハウス）・HEART PROTOCOL（124、K-POP 風。808 のヴァース、ハーフタイムのプリコーラス、フック、ダンスブレイク）・ZERO GRAVITY（128、EDM。ブレイクダウン、ビルドアップ、ドロップ）・PACKET STORM（150、ユーロビート）・OVERCLOCK（172、ドラムンベース）。パブリックドメインの 8 曲を原曲の旋律から編曲: TWINKLE（きらきら星）・FROG CHORUS（かえるの合唱。伴奏が 2 小節遅れで旋律を追う輪唱、`round`）・ODE TO JOY（ベートーヴェン「歓喜の歌」）・SWAN LAKE（チャイコフスキー「白鳥の湖」情景の主題、トランス）・GALOP INFERNAL（オッフェンバック「天国と地獄」）・SYMPHONY 40（モーツァルト「交響曲第 40 番」冒頭）・MOUNTAIN KING（グリーグ「山の魔王の宮殿にて」、96→176 BPM）・TURKISH MARCH（モーツァルト「トルコ行進曲」、原曲の 5 度下の D マイナー）。どれも GPL-3.0。シューベルト「魔王」は入れていない（知られているのはピアノの 3 連符の連打で、歌の旋律は確かに書けない）
- **難易度**: EASY は拍頭の音だけを打ち、残りはゲームが弾く。NORMAL は全部。HARD は判定幅を 3/4 にし、SIGNAL が尽きると NO CARRIER で終わる
- **判定**: SYNC ±40 ms、LOCK ±80、ACK ±120、打てなかった音は DROP で鳴らない。どの音にも当たらないキーは STRAY と数えるが罰しない
- **画面**: ヘッダー（スコア・チェイン・精度・SIGNAL ゲージ）、ピアノロール状のレーン、判定線、eDEX-UI のオンスクリーンキーボード。幅があれば左に打鍵のログ（TX）、右にこれから打つ文字の列（RX）と曲の位置。メニューはディレクトリの一覧風、読み込みは起動ログ風。結果はゲームのリザルト画面の運び（draw/result.ts、result-parts.ts）: 見出しを打ち出し、スコアを数え上げ、判定ごとのバーを順に伸ばしてから、ランクを菱形に叩き込み（S と A は光の輪）、ランプ（CLEAR / FULL CHAIN / ALL SYNC / NO CARRIER、`lampOf`）を押す。前の最高との差、FAST / SLOW（SYNC の外の早い・遅い、`fastSlow`）、精度のリング、打鍵のずれの分布を添え、ランクが決まる瞬間にランクに応じた和音を鳴らす（fanfare.ts）。演出は 2.5 秒で終わり、その後の画面は止まる（最後のフレームが静止画面そのもの）。狭いペインでは分析のパネルを 1 行にまとめる
- **操作**: ↑↓ 曲、←→ 難易度、Enter 開始、Esc / Space 一時停止（R やり直し、Q メニュー）、演奏中の ↑↓ は落下速度。フォーカスが外れる・ペインが見えなくなると一時停止（読み込み中なら、カウントの前で止まって待つ）。鍵盤はメニュー・一時停止・結果の画面でも楽器として鳴る（判定はしない。音を覚えるため。一時停止の R と Q は音の無いキー）。音はキーの文字でなく位置で決まることをメニューに書く
- **記録**: service が `ctx.storage` に曲×難易度の最高記録を持つ。service と view は同じ Worker で動くので、view は records.ts を通して直接読み書きする
- 設定: 主旋律の音色（E.PIANO / PIANO / SYNTH LEAD / CHIP）、音量、タイミングの補正（ms）、ガイド（自分のパートを小さく鳴らす）
- **FREE モード**（free.ts、draw/free.ts）: メニューの曲の後ろにある FREE PLAY。何も落ちてこず、判定もしない。キーは押している間だけ鳴り（`hold`）、Space がサステインペダル、←→ でキー全体を 1 オクターブずつ ±2 まで、↑↓ で音色（E.PIANO / PIANO / SYNTH LEAD / CHIP / PLUCK / PAD / BASS）を変える。1〜9 でその曲の伴奏（メロディなし、カウントなし）をループで鳴らし、0 で止める（Enter は入れる・切る）。< と >（, と . のキー）で一つ前・後の曲の伴奏へ（10 曲目から先にも届く。一覧は選んだ伴奏と一緒にスクロールする）。伴奏も数秒先までずつ渡す（`loopBetween`）。弾いた音は鍵盤から上へ伸びる帯になって昇っていき、押さえている音はコード名で示す（chord-name.ts）。フォーカスが外れる・ペインが見えなくなると伴奏は止まる。音色とオクターブはペインの状態に残す（メニューで選んだ曲・難易度・落下速度も同じく残り、再起動しても同じ所から始まる）
