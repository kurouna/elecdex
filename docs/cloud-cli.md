# CLI を読むペインの共通の核（AWS STATUS・GITHUB STATUS）設計

AWS CLI（`aws`）と GitHub CLI（`gh`）を main から起動し、その JSON を読んで見せるペイン **AWS STATUS** と
**GITHUB STATUS** の、両方に共通する部分の設計（文中の「AWS ペイン」「GITHUB ペイン」はこの 2 つ）。ペインそのものは [aws.md](aws.md) と [github.md](github.md)。見た目のたたき台は
[aws-mock/index.html](aws-mock/index.html) と [github-mock/index.html](github-mock/index.html)（ブラウザで開く
だけで動く。数字はすべて作り物）。**2026-11-08 に実装（未リリース）**。実装で決めたこと・設計から見送ったものは §0 と [decisions.md](decisions.md) の末尾。

## 0. 決定の記録

| 日付 | 決定 | 経緯 |
|------|------|------|
| 2026-11-07 | AWS ペインと GITHUB ペインを作る。CLI 経由で情報を取り、既存コードと疎結合にする。UI は既存ペインと揃える | 利用者の案 |
| 2026-11-07 | AWS は無料の API の範囲だけを呼ぶ | 利用者の指定 |
| 2026-11-08 | **CLI はシェルを通さず、main が `aws.exe` / `gh.exe` を直接起動する**（§2.1）。PowerShell 経由の利点と欠点を実測して示し、利用者が直接を選んだ | 利用者の決定（初めの案は「PowerShell 経由」） |
| 2026-11-07 | 初版を Opus 5.5 と Fable 5.1 に見せ、指摘で直した（§11） | 利用者の指定 |
| 2026-11-07 | プリセット `cloud` を作り、LAYOUTS（Ctrl+Shift+G）の棚で `blank` の前に置く（§10） | 利用者の指定 |
| 2026-11-08 | 名前は既存のペイン（NETWORK STATUS など）に合わせて **AWS STATUS** と **GITHUB STATUS**。ウィジェット id は `aws` と `github`、ピッカーは "aws status" と "github status" | 利用者の決定 |
| 2026-11-08 | `cloud` を入れると、新しく入れた人の `blank` に番号のキーが付かなくなる。それでよい | 利用者の決定 |
| 2026-11-08 | AWS と GitHub の**公開ステータス**を出す。**障害のときだけ**ペインに出し、障害が起きたらトーストを出すかを設定で選べる（既定 ON）（§12） | 利用者の決定 |
| 2026-11-08 | ~~通知のためだけに、ペインがレイアウトにある間は隠れていても読む~~ → **取りやめ**: 障害の通知も QUOTA も、ペインが見えている間だけ読み、その時点でトーストを出す。見えている間だけの規則に例外を作らない（§13） | 利用者の決定 |
| 2026-11-08 | 決定を反映した版を、もう一度サブエージェントのレビューに回す。Opus 5.5（RSS の事象の鍵と「開いている」の決め方、304 が効かないこと、テストのスタブ、GitHub の通知の多さ、重複除けをディスクに、UTC の月、背後の読み取りと `credential_process`、契約の表）と Fable 5.1（Cost Explorer の 1 枚の矛盾と畳み方、上限の表を 1 つに、推定の 1 行を固定、AWS の帯の 3 色、トーストの形を 1 つに、§13 の伝え方、MASK と OS の通知）の指摘で直した | 利用者の指定 |
| 2026-11-08 | **実装**: 先に読むべき probe を待つ `after` と、その答えの `keyOf` が変わったときだけ読み直す仕組みを核に足した。共通の見た目は `styles/cloud-pane.css`。OS の通知は MASK にかかわらずアカウントの名前を出さない。代役は `ELECDEX_CLOUD_STUB`、公開ステータスの URL は `ELECDEX_AWS_STATUS_URL`・`ELECDEX_GITHUB_STATUS_URL` | 実装（decisions.md） |

## 1. 目的と非目的

**目的**

- 利用者がすでに設定している CLI の認証（`aws configure` / `aws sso login`、`gh auth login`）にそのまま乗る。
  elecdex は鍵もトークンも持たず、読まず、ページにも渡さない
- 2 つのペインが同じ核（起動・許可リスト・時刻表・呼び出しの台帳・代役）を使い、ペイン固有の部分は
  「何を呼び、どう読むか」の表と、純粋な解析関数だけにする
- 既存コードへの変更は登録に限る（§6 に全部を挙げる）

**非目的**

- 書き込み。リソースの作成・変更・削除、通知の既読化、PR のマージ、Actions の再実行（どれも v1 には無い）
- CLI の代わりに SDK や HTTP を直接話すこと（§2.1、§8）
- ログインの代行。`aws sso login` も `gh auth login` も、ペインはコマンドをコピーさせるだけ
- プラグイン API。アカウントの情報なので、`net.wifi` と同じく私的にする（単体テストが plugin-api.ts に
  aws・github が無いことを確かめる）

## 2. 起動（main、`src/main/cloud-cli/`）

### 2.1 PowerShell を通さず直接起動する（利用者の決定 2026-11-08）

Wi-Fi ペインが PowerShell を使うのは、Win32 の API（`wlanapi`、`GetIfTable2`）に届く手段が PowerShell の C#
しか無いからで、それも 1 本の常駐プロセス（`WindowsSampler`）に読ませている。`aws` と `gh` はそれ自体が
実行ファイルなので、PowerShell を挟んでも CLI のプロセスは 1 回ごとにでき、その上に PowerShell が 1 つ増える。

**実測**（2026-11-08、i5-1335U、Windows 11、3 回の平均）:

| | 直接 | PowerShell 5.1 経由 | PowerShell 7 経由 |
|---|---|---|---|
| 起動だけ（`-Command "exit 0"`） | — | 179 ms | 271 ms |
| `gh api rate_limit` | 383 ms | 552 ms（+169 ms） | — |
| `aws sts get-caller-identity`（この回は資格情報の期限切れで失敗した呼び出し） | 1,382 ms | 1,388 ms | 1,522 ms |
| PowerShell 1 つのメモリ | — | 67 MB | — |

**PowerShell を通す利点**（あるとすれば）:

| 利点 | 実際には |
|---|---|
| `.cmd` / `.ps1` の shim（pip の `aws.cmd`、一部のパッケージマネージャー）もそのまま動く | 対象は AWS CLI **v2** と gh で、どちらも `.exe`。v1 は形が違うので対象外にしている（§2.2） |
| Wi-Fi の常駐の PowerShell（`WindowsSampler`）に起動を任せれば、main の `spawn`（3〜13 ms）が要らない | CLI のプロセスは結局できる。main を止めたくなければ utilityProcess から直接起動すれば足りる（§3.4） |
| 利用者のプロファイルの環境（エイリアス、`$env` の設定）が効く | `-NoProfile` で起動する決まり（CLAUDE.md）なので効かない。効かせると起動がさらに遅く、結果が人ごとに変わる |
| PowerShell の AWS Tools（`AWS.Tools.*`）も使える | CLI ではなくなる。モジュールの導入が要る |

**PowerShell を通す欠点**:

| 欠点 | 中身 |
|---|---|
| 遅い・重い | 1 回ごとに +170〜270 ms と 67 MB。AWS は 1 時間に約 130 回起動するので、1 時間に約 25〜35 秒・CPU が余分にかかる |
| 注入の危険 | 引数を配列でなくスクリプトの文字列に組む。プロファイル名や `owner/repo` の引用符の誤りが、そのまま別のコマンドになる。直接なら引数は配列で、シェルが読み替えない |
| 会社の PC で止まる | AppLocker、制約付き言語モード（Constrained Language Mode）、PowerShell の禁止が企業の端末ではよくある。AMSI（ウイルス対策）がスクリプトを走査して遅くもなる。クラウドのエンジニアの多くは会社の PC で使う |
| 文字コード | PowerShell 5.1 はパイプの出力を自分の文字コード（日本語版の既定は cp932）で変換し直す。CLI の UTF-8 の JSON を化かしうる（この PC はたまたま UTF-8 に設定済み） |
| 間違いの読み取り | PowerShell は CLI の標準エラーを ErrorRecord に包み、終了コードも `$LASTEXITCODE` を通す。拒否・期限切れの分類（§4）が 1 段難しくなる |
| 止め方 | 時間切れで PowerShell を止めても子の `aws.exe` が残る。木ごと止める手当てが 1 段増える |
| macOS / Linux | 別の経路が要る（pwsh は既定で入っていない） |

**決定**（2026-11-08）: 利点はどれも対象外か別の手段で足り、欠点は速さ・安全・会社の PC での動作・文字コードに及ぶので、git ペイン
（main/git/run.ts）と同じ `execFile` で直接起動し、**シェルは使わない**（`shell: false`、`.cmd` も起動しない）。
重さの本体は CLI のほうにある（§5）。

### 2.2 実行ファイルの見つけ方

- `PATH` の**絶対パスの項目だけ**を自分でたどり、`aws.exe` / `gh.exe`（Windows）、`aws` / `gh`（ほか）を
  見つけ、その絶対パスで起動する。今いるフォルダは探さない（Windows は既定で今いるフォルダを先に探すので、
  置かれた偽物を拾わないため）。見つけたパスはセッションの間持ち、台帳のカードに出す
- `cwd` は決まった空のフォルダ（`userData` の下に作る）。gh はリポジトリの中で起動されると `{owner}` や
  `GH_REPO` をそこから読むので、利用者のどのフォルダでも起動しない
- `PATH` に無ければ、決まったインストール先（絶対パス）を見る: aws は `%LOCALAPPDATA%\Programs\Amazon\AWSCLIV2\`
  （利用者ごと）と `%ProgramFiles%\Amazon\AWSCLIV2\`（全員）、gh は `%ProgramFiles%\GitHub CLI\` と
  `%LOCALAPPDATA%\Programs\GitHub CLI\`。macOS は `/usr/local/bin`・`/opt/homebrew/bin`、Linux は `/usr/local/bin`・
  `/usr/bin`。実測（2026-11-07）: インストール直後、すでに動いていたプロセスの `PATH` には AWSCLIV2 が無かった
- 見つからない: NO CLI。`aws.cmd`（pip で入れた v1）だけが見つかったときは「AWS CLI v1 found; the pane needs
  v2」と言う。インストールしたのに見つからないのは、elecdex が古い `PATH` のまま動いているため（サインイン時に
  起動したとき）なので、「elecdex を起動し直してください」と添える
- gh は版を確かめる（`auth status --json` は新しい。2.60 未満なら OLD CLI）

### 2.3 走らせ方（`runCli`）

- `execFile(absPath, [...FIXED_FLAGS, ...argv], { shell: false, windowsHide: true, cwd, maxBuffer: 4 MB })`。
  時間切れ 20 秒で `killTree`（main/git/run.ts のものを `main/process/kill-tree.ts` へ移し、git/run.ts は
  再エクスポートする。git の振る舞いは変えない）
- 環境はプロセスのものに次だけを足す（表は `CLI_ENV`、単体テストが縛る）
  - aws: `AWS_PAGER=""`、`AWS_CLI_AUTO_PROMPT=off`、`AWS_RETRY_MODE=standard`、`AWS_MAX_ATTEMPTS=2`
    （既定の再試行は 20 秒を越えうる）、`PYTHONUTF8=1`、`PYTHONIOENCODING=utf-8`（日本語版 Windows で
    パイプへの出力が cp932 になり、日本語の `Name` タグが化けるか落ちる。テストで確かめる）。引数に
    `--output json --no-cli-pager --cli-connect-timeout 5 --cli-read-timeout 15 --color off`
  - gh: `GH_PROMPT_DISABLED=1`、`GH_NO_UPDATE_NOTIFIER=1`、`GH_PAGER=""`、`NO_COLOR=1`、`GH_SPINNER_DISABLED=1`、
    `GH_HOST=github.com`（利用者の環境の `GH_HOST` が v1 を別のホストへ向けないように）
  - `AWS_REGION` / `AWS_DEFAULT_REGION` は消す。リージョンは必ず引数で渡す（グローバルなサービスも
    `--region us-east-1` を明示する）
- 標準入力: GraphQL の本文だけ（`gh api graphql --input -`。本文は JSON `{"query": …, "variables": …}`）。
  ほかは閉じる
- 同時に走らせるのは全体で 2 本まで。同じ問い合わせ（同じ probe と同じ引数）は重ねない（走っている
  ものの結果を待つ）

### 2.4 許可リスト（probe の表）

**ページは probe の id も引数も送らない**。ページが購読するのは「ボード」（AWS はプロファイルとリージョン、
GitHub はホストと見張るリポジトリ）で、何を呼ぶかは main の表が決める。表に無いものは走らない。

```ts
// shared/cloud-cli/probe.ts（純粋。main とテストが読む）
interface CliCall {
  tool: 'aws' | 'gh'
  argv: readonly string[]      // 定数と、検証済みの値だけ（§2.5）
  stdin?: string               // GraphQL の本文（queries.ts の定数から作る）
}
interface Probe<T> {
  id: string                   // 'aws.ec2.instances' など
  every: Cadence               // 壁時計の周期（§3）
  cost: 'free' | 'free-tier' | Paid   // Paid = { setting: 鍵, perRequestUsd: 0.01, cap: 鍵 }（PAID_PROBES だけ）
  // 1 回の読み取り。list → describe のような連鎖も、ここで許可リストの呼び出しを組む
  run(ctx: ProbeContext, cli: (call: CliCall) => Promise<CliResult>): Promise<T>
}
```

- **aws の呼び出しには必ず固定の `--query`（JMESPath）と `--max-items` を付ける**。ページに出す欄だけを
  CLI の側で残すので、Lambda の環境変数、EKS の証明書、インスタンスのほかのタグ、CloudTrail の
  `requestParameters` は main のメモリにも入らない。数で足りるもの（90 日より古いスナップショットの数など）は
  `--query` の `length()` で数える。出力が小さいので `maxBuffer` は 4 MB で足りる
- `--max-items` に当たったら「at least 1,000」のように下限として見せる（数え違いを黙らない）
- **単体テストが表を縛る**（`cloud-cli-catalog.test.ts`。全 probe の `run` を偽の `cli` で走らせ、出した
  呼び出しを集めて調べる）:
  - aws の操作はすべて `FREE_OPERATIONS`（名前の表）にある。名前の形は `describe-` `list-` `get-` `lookup-`
    で、例外は `iam generate-credential-report` だけ（読み取りの区分の操作。名前で許す）
  - **有料の呼び出しは `PAID_PROBES` の表にあるものだけ**（今は AWS の Cost Explorer の 3 つ（[aws.md](aws.md) §3.3）と、
    RESOURCES の GetMetricData（§14.4a、利用者の決定 2026-11-08: 既定 ON、本数で数え、月の上限で無料の読み取りに戻る））。
    `s3api list-buckets` は別の区分 `metered-tiny`（固定の上限 月 31 回、設定なし）。
    それぞれが、既定 OFF の設定の鍵、1 要求の値段、月の上限の鍵を持ち、時刻表は設定が OFF なら呼ばず、上限に
    達したら呼ばない（単体テスト）。`PAID_PROBES` の外で有料の操作（`FREE_OPERATIONS` に無いもの）を出せば落ちる
  - 禁止の表（`ce` の `PAID_PROBES` 以外、`cloudwatch get-metric-widget-image`・`get-insight-rule-report`、
    `list-buckets` 以外の `s3api`、`s3`、`describe-log-groups` 以外の `logs`、`ssm get-parameter*`、`secretsmanager`、`--endpoint-url`、`--debug`）に当たらない
  - aws の呼び出しはすべて `--query` と `--max-items` と `--region` を持つ
  - gh は `api` と `auth status` だけ。REST の `api` は必ず `-X GET`（`-f` / `-F` を付けると gh は黙って POST に
    する: §5）。`graphql` は本文が queries.ts の定数で、テストがそれを GraphQL として構文解析し、操作の種類が
    すべて `query` であることを確かめる（文字列の `mutation` を探すのではない）
  - 利用者の文字列は値としてしか入らない（`--profile=<名前>` のように `=` で繋ぐ。単独の引数にしない）

### 2.5 値の検証

`ProbeContext` に入るのは zod で形を確かめ、しかも main がそれを一覧から得たものだけ。

| 値 | 形 | 出どころ |
|---|---|---|
| AWS のプロファイル | `^[A-Za-z0-9_+=,.@][\w+=,.@-]{0,63}$`（先頭が `-` でない） | `aws configure list-profiles` の答え |
| リージョン | `^[a-z]{2}(-[a-z]+)+-\d$` | `ec2 describe-regions` の答え |
| アカウント ID | `^\d{12}$` | `sts get-caller-identity` の答え（budgets の `--account-id`） |
| GitHub の `owner/name` | 各部分 `^[A-Za-z0-9_.-]{1,100}$`、ただし `.` と `..` は断る | 設定（PINNED）か GraphQL の答え |

## 3. いつ呼ぶか（`CliScheduler`）

### 3.1 見えている間だけ

- 既存の購読の規則どおり: ペインは `seen` の間だけボードを購読し、参照カウントで、`whenPageGoes` で落とす。
  `keepWhileHidden` には載せない。最後の購読者が去ったら時刻表を止める。**例外は無い**: 公開ステータスと QUOTA も見えている間だけ（§13、利用者の決定 2026-11-08）
- probe ごとに壁時計の周期（`BoundaryTimer`。1 分、5 分、15 分、1 時間、6 時間、1 日）で呼ぶ。**同じ周期の
  probe が境界で一斉に起動しないよう、probe の id から決まるずれ（周期の 1/4 まで、秒単位）を足す**
  （AWS CLI は 1 回ごとに重いので、15 分の境界で 40 本が並ぶと 20〜40 秒の塊になる）
- 最初の購読では、手元の結果がその周期より古いものだけを呼ぶ（タブを行き来するたびに呼び直さない）
- **最後に良かった結果を残す**。失敗しても画面は消さず、その項目の時刻を淡くし「STALE · 12m」と添える
- 失敗は probe ごとに退く（1 → 2 → 4 → … 最大 30 分、境界に合わせる）。THROTTLED は「retry 14:31」
  （AWS は解除の時刻を返さない。GitHub は `x-ratelimit-reset` があればそれ）
- **SIGNED OUT・MFA・時間切れのボードは時刻表から外す**。`credential_process`（aws-vault、granted、
  1Password など）は起動のたびに鍵束や MFA の窓を開きうる（`windowsHide` でその窓が隠れ、時間切れまで
  待つこともある）。REFRESH を押すまで呼ばない、と notice に書く。`aws configure get credential_process
  --profile=<名前>`（手元のファイルを読むだけ）で、あれば最初の起動の前に一度言う
- REFRESH はページのボタンだが、**30 秒に 1 度の制限は main がボードごとに持つ**。ページの見た目（下線が
  減る）は main の答えた残り時間に従う
- SLOW（ペインの設定）: すべての周期を 4 倍にする。CloudTrail に出る自分の読み取りを減らしたい人のため（§3.2）

### 3.2 呼び出しの台帳（`ledger`）

- probe ごとに今日と今月の**起動回数と API 要求数**（`--max-items` とページの大きさから、CLI の返した
  `NextToken` の数で数える）、成功・失敗、304（GitHub）、最後の所要時間を、main のメモリと
  `cli-ledger.json`（`replaceFile` で、1 分境界にまとめて）に持つ。中身は数だけで、引数も結果も書かない
- 足元: `REQUESTS TODAY 214 · FREE 176 · FREE TIER 38 · PAID APIs 0`。**PAID APIs** は「1 要求ごとに値段の
  付く API を呼んだ数」。利用者が有料の probe を有効にしていなければ必ず 0 で、0 であることが見えるのが、
  「無料の範囲で」を画面で確かめる手段になる。有効にしていれば `PAID APIs 2 · $0.02 this month · cap $1.00`
  （今月の数と値段と上限）。上限に達したら `CAP REACHED` を warn で
- **台帳のカードは正直に言う**: 「API の値段だけの話。読み取りはどれも CloudTrail に管理イベントとして残り、
  2 本目の証跡や SIEM はイベント数で課金しうる。CloudWatch の無料枠（月 100 万要求）はアカウント全体で
  共有なので、ほかの監視ツールが使い切っていれば `get-metric-statistics` にも値段が付く」。今日このペインが
  CloudTrail に残したおよその数（＝ aws の要求数）も出す
- 起動の内訳（probe、周期、費用の分類、今日の数）と、使っている実行ファイルの絶対パスと版

### 3.3 結果の持ち方

- main のメモリだけ（DOCKER ペインと同じ）。再起動したら呼び直す。ディスクに書くのは次の 4 つだけ: 台帳（`cli-ledger.json`、数だけ）、GitHub の
  公開リポジトリのスターの日ごとの数（`github-stars.json`、[github.md](github.md) §6）、AWS のアカウントごとの設定
  （`aws-billing.json`: Cost Explorer の答えと上限、QUOTA と知らせた段、プロファイルからアカウント ID への対応。
  アカウント ID を含む）、トーストした障害の id（`cloud-alerts.json`、§12.5）
- 同じボードを見るペインが複数あれば、結果も時刻表も 1 つ
- 変化を見せるため（AWS の CHANGES、GitHub の EVENTS）、ボードごとに「今日最初に読んだもの」の id の集合を
  メモリに持つ（再起動で消える。見出しに「since 09:12」と起点を出す）

### 3.4 どのプロセスで

main で走らせる（git ペイン、LOG WATCH と同じ）。`--query` で出力は数 KB〜数十 KB になり、JSON の解析は
1 ms に満たないはず。実装の最初に、起動（`spawn`）と解析の時間を測り、どちらかが main を 10 ms 以上止めるなら
metrics の utilityProcess（collector）へ移す。probe の表と解析は純粋なので、どちらでも同じものを使える。

## 4. 状態（リンク）の語と、間違いの伝え方

| 語 | いつ | 色 |
|---|---|---|
| STANDBY | 見えていない | 淡色 |
| LINKING | 最初の読み取りの最中。REFRESH の間もこの語 | アクセント（点滅、`--ambient-play-state` に従う） |
| LINKED | 直近の probe がすべて成功 | ok |
| PARTIAL | 一部の probe が DENIED（権限が無いだけ） | warn |
| NO CLI / OLD CLI | 実行ファイルが無い・古い | danger |
| SIGNED OUT | 認証が無い・切れた・MFA が要る | warn（コピーできるコマンド付き） |
| THROTTLED / RATE LOW | レート制限 | warn（「retry 14:31」） |
| OFFLINE | 接続できない | 淡色（最後の結果を残す） |
| LINK ERROR | それ以外 | danger |

- ペインの見出し（PaneHost）の `paneMeta.badge` に、LINKED でないときの語か、いちばん重い注意
  （「1 alarm」danger、「sso expired」warn）を出す（DOCKER・Ethernet と同じ）。タブの裏にいても見える
- 分類（`classifyCliError`）は純粋関数で、aws と gh の標準エラーの決まり文句から決める。**標準エラーの文は
  ページへも、トーストへも、ログへも渡さない**。渡すのは分類と、決まった形で取り出したものだけ:
  DENIED なら操作名（`perform: ([\w-]+:[\w*]+)` の 1 つ）、THROTTLED なら次の時刻。分類できないものは
  LINK ERROR とし、`redactCliText`（ARN、12 桁の数字、メールアドレス、`AKIA…` を伏せる純粋関数）を通した
  先頭 120 字だけを出す。COPY DETAILS がトーストを写すので、MASK の有無によらず必ず伏せる
- 読めなかったものは `problems` としてトーストに 1 度ずつ（Wi-Fi と同じ）

## 5. 実測と確かめたこと（2026-11-07、gh 2.100.0）

- `gh api -i -X GET notifications -H "If-Modified-Since: …"` は **304 で終了コード 1**、レート制限の残りは
  減らない（4996 のまま）。`X-Poll-Interval: 60`。304 は失敗でなく「変化なし」として、`-i` の状態行で読む
- `gh api` は `-f` / `-F` を付けると既定のメソッドを POST に変える。REST は必ず `-X GET`
- `gh auth status --json hosts` は `state`・`login`・`scopes`・`tokenSource`・`active` を返す（トークンは
  `--show-token` を付けない限り出ない。付けない）。サインインの状態は終了コードでなく JSON の `state` で読む
- classic のトークンで `repo` があれば、`notifications` のスコープが無くても通知は読めた
- `aws` はこの機械に無く、未計測。**AWS CLI v2 は凍結した Python で、1 回に 0.5〜1 秒の CPU と 60〜100 MB の
  メモリを使うと言われる**。実装の最初に、AWS ペイン 1 枚・3 リージョンで 1 時間に起動する数と、その CPU を
  測り、decisions.md に書く。e2e の `@perf` のアイドルの予算は子プロセスを数えないので、別に数える
- 重すぎたときの退路は AWS SDK v3 を `import()` する案（§8）。ただし資格情報が elecdex のメモリに入り、
  §1 の約束（鍵を持たない）が崩れる。その取引は利用者に聞く

## 6. 既存コードとの接点（疎結合）

新しいフォルダだけで閉じる。

```
src/shared/cloud-cli/   probe.ts（型）、errors.ts（分類・redactCliText）、cadence.ts（ずれ）、ledger.ts、mask.ts
src/shared/aws/         probes.ts（表）、parse/*.ts、attention.ts、changes.ts、cost.ts、console-url.ts
src/shared/github/      probes.ts、queries.ts（GraphQL の定数）、parse/*.ts、queue.ts、verdict.ts、stars.ts、html-url.ts
src/main/cloud-cli/     run.ts（runCli、実行ファイル探し）、scheduler.ts、ledger-store.ts、boards.ts、stub.ts
src/main/aws/           service.ts（プロファイルとリージョン、ボード）、register.ts（registerTable）
src/main/github/        service.ts、stars-store.ts、register.ts
src/renderer/widgets/cloud/   共通の部品: LinkLamp、LedgerFoot、AttentionRow、StaleMark、CopyCommand、OpenButton
src/renderer/widgets/aws/     AwsWidget.svelte と部品
src/renderer/widgets/github/  GithubWidget.svelte と部品
```

既存へ足すもの:

| ファイル | 足すもの |
|---|---|
| main の ipc の登録 | `registerAws()`、`registerGithub()`（各モジュールのチャンネルは 1 つの `registerTable`） |
| src/shared/channels.ts、api.ts、src/preload/index.ts | `aws.*`・`github.*` のチャンネルと型と橋（ボードの購読、REFRESH、`open(itemId)`、プロファイル一覧） |
| 診断 | 各モジュールの `watching()`（購読中のボードの id、並べた `string[]`、何も無ければ空） |
| src/renderer/widgets/builtins.ts | 2 行（`keepWhileHidden` なし、`zoom: 'full'`、`popup: true`） |
| tests/e2e/contracts/panes.ts | 2 行（見えている間に main がすること、残すもの、隠れて続けるもの＝なし） |
| main の通知（トースト） | 既存の地震の通知と同じ判断（`windowInFront()`）で、ページのトーストか OS の通知を出す共通の関数（§12.5） |
| tests/e2e/contracts/dialogs.ts、ホバーカードの一覧のテスト | notice、障害の帯、Cost Explorer の 1 枚、2 つのトースト、各カード（「+2 more」、QUOTA、Budgets と QUOTA の違い）の行 |
| docs/guide/themes-settings.md | 新しい鍵 `aws.incidents`・`github.incidents` と既定値（3 か国語） |
| tests/e2e/support.ts の `STUB_ENV` | `ELECDEX_CLOUD_STUB=1` |
| tests/unit/plugin-api の確かめ | aws・github が無いこと |
| main/git/run.ts | `killTree` を main/process/kill-tree.ts へ移す（再エクスポート） |
| 文書 | architecture.md の節、.claude/rules/cloud-cli.md、CLAUDE.md の表の行、docs/guide/panes-cloud.md（新しい群）と README の表、data-sources.md（3 か国語） |

使う既存の部品: HoverCard、`onBoundary`、`BoundaryTimer`、`replaceFile`、`refCounted`、`paneMeta`、
`utility.copy`（コマンドのコピー）、`fx-fresh`（新しい行）。**`system.openExternal` は使わない**:
任意の URL を開けるので、ページの検査は境界にならない。代わりに `aws.open(itemId)` / `github.open(itemId)` で、
main が自分の直前の読み取りから URL を組み、ホストを確かめて開く（ランチャーが不透明な id で起動するのと同じ）。

## 7. 画面の共通の作法

既存ペインの言葉に揃える（DOCKER・LOG WATCH・Wi-Fi・git）。モックの一番上の行は PaneHost の見出しを
写したもので、ウィジェットのものではない。

- **見出し（PaneHost）**: 登録の名前（`AWS STATUS` / `GITHUB STATUS`）、`paneMeta.subtitle` にプロファイルとアカウント
  （ログイン名とホスト）、`badge` に §4 の語。MASK 中は subtitle も伏せる（タブとグループの副題にも出るため）
- **ウィジェットの上段**: ◆ランプと語、いくつかの数字（`.figure`: 小さなラベルの上に mono の値）、
  絞り込みの札、右端に MASK・REFRESH・⚙（Wi-Fi の MASK / COPY、LOG WATCH と同じ位置）
- **帯**: ペインごとの印（AWS は ACCOUNT PULSE、GitHub は貢献の格子）。2D canvas 1 枚、文字は HTML で重ねる。
  ペインの高さが足りないとき（コンテナクエリ、高さ 30 rem 未満）は落とし、設定でも消せる
- **タブ**: LOG WATCH と同じ。選ばれたタブはアクセントで塗り、文字は `--text-inverse`。切り替えは CRT の点灯
- **絞り込みの行**: タブの下の 1 行（LOG WATCH の filters と同じ）。タブの行に詰めない
- **行**: 左の 2 px の縁が重さ（danger / warn / info）。札は枠線だけ（塗りは使わない。重さは縁と札の色で）、
  本文、右に年齢。行は重さで並べ、**読み直しで動かさない**（新しい行は重さの位置に入り、ほかの行の順は保つ。
  DOCKER と同じ原則）。新しい行は `fx-fresh`（3 秒の縁の印）
- **開く**: 行全体のクリックでは開かない（うっかり開く）。ポインタかキーボードのある行にだけ ↗ を出し、
  それか Enter で開く（DOCKER の公開ポートと同じ）
- **数字が変わったとき**: その数字だけ不透明度の重ねで 1 度光る（色のアニメーションではない）
- **カード**: HoverCard（§7.4）。行に入らないものだけを言う（行を言い直さない）
- **人の書いた文字**: Issue や PR の件名、ブランチ名、ワークフロー名、アラーム名、スタック名、セッション名は
  他人が書いたもの。Svelte の文字としてだけ描き、`{@html}` は使わない（git ペインのファイルの文字と同じ）
- **MASK**: 伏せるものは純粋関数（`shared/cloud-cli/mask.ts`）が決め、単体テストが一覧を持つ: アカウント ID、
  エイリアス、ARN、ユーザー・ロール・セッションの名前、証明書のドメイン名、IP アドレス、メールアドレス、
  ログイン名、プライベートのリポジトリの名前と件名。ペインの状態に持つ
- **足元**: 台帳（§3.2）。留まると台帳のカード
- **NO CLI**: 帯もタブも出さず、DOCKER のエンジンが無いときと同じく中央の 1 枚（`NO CLI`、入れ方、コピー
  できるコマンド）
- **幅による組み替え**: コンテナクエリで列を落としてカードに回す（各設計に順序）。大きさは
  `ResizeObserver` の entry から読む
- **アニメーション**: 常に動いているものは LINKING の点滅だけで、`animation-play-state: var(--ambient-play-state)`
  を付ける。走っている CI は塗りの半分のランプ（静止）。数を数え下げる表示は置かず、「next 14:23」の
  時刻を、変わったときだけ書く
- **型の大きさ**: 読むもの（リポジトリ名、リージョン、誰か、エラーコード）は `--step--1` 以上、札・凡例・
  枠は `--step--2`
- **光**: ランプと大きな数字は Wi-Fi と同じ `--glow` の影を持つ。札は Wi-Fi のチップと同じ角の切れた形

### 7.1 視認性（2026-11-07、モックを 4 テーマ × 4 つの大きさ × 2 つの解像度で実測して決めた）

利用者の指定（視認性も確かめる）。サブエージェントがモックを 228 枚撮り、描かれた色でコントラストを測った結果から:

- **読むデータに `--text-muted` を使わない**。`--text-muted`（アクセントの 50%）は暗いテーマで 3.5:1 しか無く、
  ラベル・凡例・枠のためのもの。年齢、リージョン、id、誰か、差分などの二次のデータは、ペインの中で
  `--text-dim: color-mix(in srgb, var(--text) 78%, var(--surface-1))`（約 5:1）を使う。意味のトークンからの
  派生で、テーマごとの値は持たない
- 読む文字は 4.5:1 以上、大きな文字・ランプ・棒・縁・フォーカスの枠は 3:1 以上。**全テーマで確かめる**:
  Tron、Green、Black、Business (Light) と (Dark)。Business (Light) は本物の値（文字 `#1a1a1a`、淡色 `#5f5f5f`、
  `data-mode="light"` の濃い状態色）で測る（初版のモックは古い写しで、そこでの不合格の多くはモックの誤りだった）
- **文字を `opacity` で薄めない**（既読の行、TRIAGE の行、STALE）。色を `--text-dim` に替える。STALE の薄めは
  1 段だけ（入れ子で 2 度掛かって 1.4:1 になっていた）
- 1366×768 では `--step--2` が 8.75 px になる。**読むデータと文は `--step--1` 以上**（年齢、ファセットの値と数、
  差分、カードの本文、設定の説明、足元の文）。`--step--2` はラベル・凡例・枠だけ。`<small>` は `font-size` を
  明示する（既定の `smaller` で 7.3 px になっていた）。説明の文は大文字・字間なしの文の形で
- 棒（ファセット、コスト、ゲージ）はアクセントの 60%（Business は 70%）。積み上げの帯の文字は塗りの上で
  `--text-inverse`。取消・無しの CI ランプは淡色の輪（`opacity` ではなく）
- **キーボードのフォーカスは見える枠**（`:focus-visible { outline: 1px solid var(--accent) }`）。背景だけ
  （1.2:1）にしない
- **押せるものと押せないものを見分けられる**: 掘れる行だけに `›`、開ける行だけに `↗`（ポインタかフォーカスで
  出し、Tab で届く）、押せない行にフォーカスやホバーの背景を付けない。上段の数字はどれも押せるボタンで、
  ラベル付き（`4 danger · 12 warn`、`forecast 110% of budget`）
- **赤や黄の理由をその場に書く**: 2 段目の一覧に FLAG の列（`22 open to world`、`idle 7 d`）、3 段目は状態の
  ランプ（running）と理由の札を別にする（赤い running は失敗に読めた）、関係するものの行の理由を色付きで
- 種類の札（PR / IS）は中立の色。緑や赤は状態にだけ使う（PR の緑が FAILING の赤の隣で成功に読めた）
- 数の列は右寄せ、表の中の棒は数字の下の細線（数字に重ねない）。欠かせない部分を省略しない（エラーコードの列は
  11 rem、自分のリポジトリは所有者を省いて名前だけ）
- カードとトーストはペインの中に収める（高さを超えれば中でスクロール。数の列は折り返さず、文の列は折り返す）
- 2 度目の計測（Fable 5.1、約 470 枚）で残った、**アプリ全体のトークンの問題**（このペインだけでは直さない）:
  Business (Light) の `--warn`（#b36205、4.06:1）と `--ok`（#218321、4.37:1）が 4.5:1 にわずかに届かない、
  ボタン・タブ・タイルの枠 `--panel-rule`（アクセントの 30%）が全テーマで 1.6〜2.1:1。直すなら tokens.css と
  theme.ts で、全ペインの見た目が変わるので別の作業にする

## 8. 見送り・後で

- SDK 直結（`@aws-sdk/client-*`）。CLI が重いと分かったときの退路（§5、資格情報の取引を利用者に聞く）
- 書き込み（通知の既読、Actions の再実行、EC2 の停止など）。別の設計で、2 度押しと見えているページからの
  規則（DOCKER と同じ）から
- 複数ホスト（GitHub Enterprise Server）、AWS Organizations の全アカウント横断

## 9. テスト

- **実物の CLI を走らせない**。`ELECDEX_CLOUD_STUB=1` で `runCli` を代役に替え、呼び出しごとの作り物の JSON
  （`tests/fixtures/cloud-cli/aws/*.json`、`github/*.json`）と、状態の切り替え（`signedout`、`mfa`、`nocli`、
  `throttled`、`partial`、`offline`）を返す。`globalThis.__elecdexCloud` で e2e から替える
- 単体: 表の縛り（§2.4）、値の検証（§2.5）、分類と `redactCliText`（実物の標準エラーの文で）、時刻表（見えるまで
  呼ばない・境界とずれ・退き・重ねない・止めたら止まる・SIGNED OUT で外す・REFRESH の 30 秒を main で）、
  台帳（起動と要求の数え方、日と月の切り替わり）、MASK の一覧、各解析
- 単体（実物の起動）: `runCli` を node の小さな偽の実行ファイルに向け、引数がシェルを通らないこと、今いる
  フォルダの同名の実行ファイルを拾わないこと、時間切れで木ごと止まること、標準入力に本文が届くこと、
  UTF-8 の日本語が化けないこと
- コンポーネント: 各ウィジェット（状態ごと、MASK、狭い幅、低い高さ）
- e2e: 各ペインの spec、`lifecycle.spec.ts`（契約の表の行）

## 10. プリセット `cloud`

利用者の指定（2026-11-07）: 2 つのペインを並べるプリセット `cloud` を作り、LAYOUTS（Ctrl+Shift+G）の棚では
`blank` の前に置く。

```
┌──────────┬──────────────────────────────┬──────────────────────┐
│ system   │ AWS                          │ GITHUB               │
│ column   │ （ACTIVE・ATTENTION・COST…）  │ （QUEUE・EVENTS…）    │
│ （既定の  │                              ├──────────────────────┤
│ 幅と高さ）│                              │ TERMINAL │ LOG WATCH │
└──────────┴──────────────────────────────┴──────────────────────┘
          （舞台の 0.58）                    （舞台の 0.42、上 0.62 / 下 0.38）
```

```ts
{
  // The account and what runs and bills in it on the left, the repositories and what waits on
  // the user on the right, and a shell for both CLIs under them (user's request 2026-11-07).
  id: 'cloud',
  name: 'cloud',
  description: 'the AWS account and what runs and bills in it, GitHub\'s queue and repositories, and a shell for both CLIs',
  build: () =>
    withSystemColumn(
      [pane('aws'), split('column', [pane('github'), tabs([pane('terminal'), pane('logwatch')])], [0.62, 0.38])],
      [0.58, 0.42],
    ),
}
```

- **並び**: `LAYOUT_PRESET_IDS` と `LAYOUT_PRESETS` の `retro` と `blank` の間に入れる。LAYOUTS の棚は
  `LAYOUT_PRESETS` の順に並ぶので、`cloud` は `blank` の前に出る（棚は横にスクロールするので、11 枚でも 1 行の
  まま。panes-layout.md の「どのカードも 1 行に」を保つ）
- **キー**: `layout.preset.cloud` に Ctrl+Shift+F10、`blank` は F11 へ（F キーは棚の順、keybindings.test.ts。利用者の決定 2026-11-08、decisions.md）。プリセットのキーは場所ではなく
  id に付くので、`blank` は Ctrl+Shift+F10 のまま
- **番号のキー**（Ctrl+Shift+1〜9, 0）: 最初の起動はプリセットを順に保存したレイアウトにする（`seededLayouts`）。
  `KEYED_LAYOUTS` は 10 なので、`cloud` が 10 番め（Ctrl+Shift+0）になり、**新しく入れた人の `blank` には番号の
  キーが付かなくなる**（F10 では行ける）。今の利用者のレイアウトの一覧には足さない（利用者の決定 2026-09-24、
  棚から選べば足される）。利用者の決定（2026-11-08）: それでよい（`blank` は F10 と棚で行ける）
- **システムの列**: 既定の幅と高さのまま（`WITH_SYSTEM_COLUMN` に入る）。どのペインも `minSize` 以上（単体テスト）
- **プリセットは何もオンにしない**: AWS STATUS は見えたときに既定のプロファイル（`AWS_PROFILE` か `default`）で
  無料の読み取りを始め、Cost Explorer（有料）は最初に表示したときに尋ねる（[aws.md](aws.md) §3.3）。公開ステータスの
  トーストの既定 ON はペインの既定で、プリセットが入れるものではない。CLI が無ければ NO CLI の 1 枚
- **一緒に直すもの**（CLAUDE.md とレイアウトの規則のとおり、同じコミットで）: shared/layout-presets.ts、
  keybindings.ts、Workspace.svelte（プリセットのキー）、tests/e2e/workspace/layout-presets.spec.ts の `PRESETS`、
  単体テスト（minSize、システムの列、並び）、scripts/gen-screenshots.mjs のショット（代役 `ELECDEX_CLOUD_STUB=1` の
  demo で）、README の gallery のセルと数（「ten presets」→「eleven presets」）、docs/guide/presets.md の節と表と数、
  keyboard.md の Ctrl+Shift+F10（cloud）と F11（blank）、すべて英・日・中の 3 か国語で

## 11. レビューで直したこと（2026-11-07）

初版を Opus 5.5 と Fable 5.1 に別々に見せた（互いの意見は渡していない）。両方が挙げたもの: 台帳が起動の数で
API 要求を数えていない、`--query` が無く秘密が main のメモリに入る、標準エラーの文が ARN を運ぶ、見出しが
PaneHost の見出しと二重になる、常に動くアニメーション、CloudTrail の扱い、新しい Free Tier のプラン。片方が
挙げたもの: 表のテストと probe の表の矛盾（generate、GraphQL の POST）、連鎖する probe、Windows の起動の
細部（今いるフォルダ、cp932、`GH_PAGER`、`GH_HOST`）、`credential_process` の窓、REFRESH を main で縛る、
`openExternal` をやめて id で開く、一斉起動のずれ、CloudTrail に残る自分の読み取り、MASK の一覧。
各ペインの中身の直しは aws.md・github.md の §0 に。

## 12. 公開ステータス（障害のときだけ）

利用者の決定（2026-11-08）: AWS と GitHub の公開ステータスを出す。**障害が起きているときだけ**ペインに出し、
平常時は何も場所を取らない。障害が起きたらトーストを出すかを設定で選べ、既定は ON。

### 12.1 取得先と実測（2026-11-07〜08）

| | AWS STATUS | GITHUB STATUS |
|---|---|---|
| 障害 | `https://status.aws.amazon.com/rss/all.rss`（AWS Health Dashboard の公式の RSS、サインイン不要） | `https://www.githubstatus.com/api/v2/incidents/unresolved.json`（Statuspage の公開 API） |
| 計画保守 | なし | `…/api/v2/scheduled-maintenances/active.json`（173 B） |
| 大きさ | 約 60 KB、42 項目（3 月まで遡る） | 平常時 160 B と 173 B |
| 条件付き要求 | **効かない**: ETag と Last-Modified を返すが、`If-None-Match` も `If-Modified-Since` も 200 で 59,917 B。gzip も無い | 効く（弱い ETag で 304） |
| 周期 | 見えている間だけ 5 分（フィードの `<ttl>` は 5。1 回 60 KB、条件付き要求が効かない） | 見えている間だけ 5 分 |
| 呼ばないもの | `health.aws.amazon.com/public/currentevents`（ダッシュボードの JSON。260 KB の UTF-16 で、文書の無い内部の形） | `summary.json`（全部品の状態。要るのは障害と保守だけ）、`shortlink`（`stspg.io` で main のホストの確かめに通らない） |

- **CLI は使わない**。サインインの要らない公開の HTTPS を main で取る。feeds/ から借りるのは XML の解析と退きの
  関数だけで、その購読の表には載せない（RSS ペインの `watching()` に混ざらないため）。新しい通信先として
  data-sources.md に、何を・どの周期で・測った大きさを書く
- **テスト**: `STUB_ENV` に `ELECDEX_AWS_STATUS_URL` と `ELECDEX_GITHUB_STATUS_URL`（閉じたポート）を足し、
  tests.md に書く。e2e は保存した本物のフィード（`tests/fixtures/cloud-cli/status/all.rss` など）をローカルの
  スタブで返す。トーストの既定が ON なので、これが無いとペインを置くだけの e2e（lifecycle、`cloud` のプリセット、
  スクリーンショット）が AWS と GitHub に届いてしまう

### 12.2 AWS の RSS の読み方（`awsStatusEvents`、純粋。保存した本物のフィードでテスト）

本物のフィードで確かめた形: どの `guid` も `https://status.aws.amazon.com/#<slug>_<epoch>`（例
`ec2-us-west-2_1794013936`）。`<slug>` はサービスとリージョン、`<epoch>` はその**更新**の時刻で、更新ごとに変わる。
解消は題だけに出る（`Service is operating normally: [RESOLVED] …`）。ほかの頭は `Service impact:`、
`Service disruption:`、`Service degradation:`、`Informational message:`。同じ事象の題は大文字小文字が揺れる。
`pubDate` は PST/PDT の文字列。

- **鍵**は `guid` の `#` から最後の `_` まで（`ec2-us-west-2`）。**時刻**は `<epoch>`（`pubDate` は使わない）
- 鍵ごとに時刻の順に並べ、**最後の解消より後の、解消でない最初の項目から**を「起きている」とする。解消の項目が
  来るまで開いたまま。**24 時間で閉じたとはみなさない**（実例: `multipleservices-me-central-1` と `me-south-1` は
  3 月から解消の項目が無く、ダッシュボードも障害のまま）
- 最後の更新から 7 日を超えた事象は淡く出し（「last update 53 d ago」）、トーストは出さない
- **事象の id**（重複を除く鍵）＝鍵＋開いた項目の時刻
- **重さ**: disruption は danger、impact・degradation は warn、Informational は info。題の頭で決める
- **リージョン**: `<slug>` の末尾がリージョンの形ならそれ。そうでないもの（`multipleservices`、`route53` など）は
  グローバルとして、どのペインにも出す。ペインは設定のリージョンとグローバルだけを見せる

### 12.3 GitHub の読み方

- `incidents[]` の `id`・`name`・`impact`（none / minor / major / critical）・`status`（investigating / identified /
  monitoring）・`components[].name`・`updated_at`。`impact: none` は info。`components` が空（実測で 50 件中 17 件）の
  ときは `name` で見せる。URL は `https://www.githubstatus.com/incidents/<id>` を main が組む
- **計画保守**は info の帯にして、トーストは出さない
- **部品の絞り込み**（設定 COMPONENTS）: 既定は Copilot を除く全部（実測: 10-27〜11-05 の 50 件のうち約 3 分の 1 が
  Copilot だけの障害）。Git Operations、API Requests、Actions、Pages、Packages、Webhooks、Issues、Pull Requests…を選べる。
  `components` が空の障害（実測 50 件中 17 件）は部品で絞れないので、**いつも通す**

### 12.4 ペインでの見せ方

- 障害が起きている間だけ、上段の下に 1 行の帯。AWS は `AWS · ap-northeast-1 · Amazon EC2 · Service disruption:
  Increased API error rates · since 13:40`（AWS の RSS には investigating のような段階の語は無い）、GitHub は
  `GITHUB · major · Actions, Pages · Delayed job starts · investigating`。重さの色（§12.2、§12.3: AWS も danger /
  warn / info の 3 色）。**帯を押すとカード**（障害の一覧、それぞれの更新の時刻）で、公式のステータスのページは
  ポインタかフォーカスのあるときに出す ↗（か Enter）で開く（「行全体のクリックでは開かない」§7 と同じ。main が URL を
  組む）。2 件以上なら帯の右に「+2 more」。帯にもキーボードのフォーカスの枠（§7.1）
- 見出しの `paneMeta.badge` の順: アラーム（AWS）/ MAIN RED（GitHub）＞ QUOTA 超え ＞ 公開の障害 ＞ リンクの語
- **公開の障害と自分のアカウントは別物**: 帯のカードに「This is AWS's public status, not your account's.」
  （アカウントごとの AWS Health は Business サポートが要るので読まない）

### 12.5 トースト（設定）

設定は地震の通知と同じ形にする（settings.json）:

```ts
aws:    { incidents: { notify: true, system: true, minSeverity: 'warn' } }               // notify の既定 true
github: { incidents: { notify: true, system: true, minSeverity: 'major', components: [...] } }
```

- **既定が ON の理由**をスキーマのコメントに書く（利用者の決定 2026-11-08）。地震の通知（既定 OFF）と違い、
  ペインを置いて見ていることが同意の代わりになる（読むのは見えている間だけ、§13）。音は無い
- 出すとき: `minSeverity` 以上の新しい障害を初めて見たとき、その重さが上がったとき。**解消のトーストは、
  その事象をトーストしたときだけ**。同じ出どころのトーストは 15 分に 1 度までにまとめる（「3 GitHub incidents」）
- **いつトーストするか**: ペインが見えて読み取ったときに、まだトーストしていない障害を見つけたら、その時点で。
  隠れていた間に始まった障害も、見えたときの最初の読み取りで 1 度トーストする（まとめて「2 AWS incidents since
  09:12」）。ただし、**ペインを初めて置いたときの読み取りで既に起きていた障害**は帯だけ（置いた瞬間に古い障害を
  並べないため）。7 日より更新の無い事象はいつもトーストしない
- **重複除けはディスクに持つ**: トーストした事象の id と重さを `cloud-alerts.json`（`replaceFile`、30 日で刈る）に。
  メモリだけだと、起動のたびに続いている障害をトーストし直す（地震の通知の `quake-alerts.json` と同じ）
- 送り先: elecdex のウィンドウが前にあればページのトースト、前に無ければ（`windowInFront()` が false）`system`
  が ON なら OS の通知。地震の通知と同じ判断で、共通の通知の関数を通す（地震のチャンネルは使わない）
- **トーストの形は 1 つ**（アプリのトーストの store の形: 題・本文・1 つの操作、10 秒）: 題は出どころと重さ
  （「AWS incident · ap-northeast-1」「GitHub incident · major」「Cost quota · 100%」）、本文はサービス・部品・要約・
  時刻、操作は **OPEN STATUS**（障害）か **OPEN COST**（QUOTA: そのペインの COST タブへ）。AWS も GitHub も同じ形で
  描く（モックの 2 つは揃える）
- **OS の通知を押したら** elecdex のウィンドウを前に出し、そのペインに焦点を移す（地震の通知の `showMainWindow` と
  同じ）。**MASK**: どれかのペインが MASK 中なら、OS の通知の本文からアカウントの別名と ID を除く（「an AWS account
  passed 100% of its quota」）。通知センターに残るのは画面の MASK の外なので。設定の欄にそう書く
- **どこで変えるか**: 鍵は settings.json の `aws.incidents` と `github.incidents`（themes-settings.md に載せる）。変えるのは
  **ペインの ⚙ の「Every … pane」の欄だけ**（そこにすべての鍵: notify・system・minSeverity、GitHub は components も）。
  設定の画面には「AWS STATUS と GITHUB STATUS の ⚙ で変える」と 1 行だけ書く
- **数の見込み**: AWS の `minSeverity: warn` で 4 リージョンなら、まとめた後で 1 日に 1〜3 件ほど（RSS の 3 月から
  11 月までの 42 項目から）。GitHub の `major` 以上は 1 日に 1 件を下回る（10-27〜11-05 の 50 件から）
- 同じ障害が 2 枚の AWS ペイン（リージョンが違う）に当たっても 1 度。2 枚のリージョンの和で判断する

## 13. 見えている間だけ（通知も例外にしない）

利用者の決定（2026-11-08）: 障害の通知と QUOTA のために、ペインが隠れているときに読む必要は無い。**見えている
間だけ読み、その時点でトーストを出す**。初版のこの節にあった「レイアウトにある間は隠れていても読む」例外は
取りやめた。

- 公開ステータス（AWS・GitHub）と QUOTA の請求メトリクスは、ほかの probe と同じく**ボードの購読（`seen` の間）**
  に載る。`keepWhileHidden` にも、別の購読にも載せない。最後の購読者が去れば止まる
- 隠れていた間に起きたことは、見えたときの最初の読み取りで分かり、まだ知らせていなければそこでトーストする
  （§12.5、[aws.md](aws.md) §5.6）。重複除けはディスクにあるので、起動し直しても同じものを繰り返さない
- そのため CLAUDE.md の Subscriptions と Network lives in main の規則は**変えない**（新しい通信先を data-sources.md と
  Network lives in main の列挙に「AWS STATUS・GITHUB STATUS が見えている間だけ」と足すだけ）
- `credential_process` のプロファイルも、見えている間だけ読むので窓が誰も見ていないときに開くことは無い
- 契約の表（tests/e2e/contracts/panes.ts）の「隠れて続けるもの」は**なし**。lifecycle の e2e は、隠れている間・
  最小化・閉じたあとに、公開ステータスも請求メトリクスも読まないことを確かめる。`watching()` は種類ごとの項目
  （`board:<profile>`、`status:aws`、`status:github`）を返し、見えていなければ `[]`
- 代わりに失うもの: elecdex を最小化していたりペインが後ろのタブにあったりすると、障害や QUOTA 超えはそのペインを
  見るまで知らせない。ペインの設定の欄にそう書く（「Checked while this pane is shown」）
