# GITHUB ペイン 設計

GitHub でオープンソースなどを開発・保守する人が「いま自分を待っているもの」と「自分のリポジトリで何が
起きたか」を 1 枚で見て、リポジトリを選べばその中まで掘れるペイン。利用者の GitHub CLI（`gh`）の認証に
そのまま乗り、見えている間だけ、レート制限の小さな一部で読む。読むだけで、何も変えない。共通の核は
[cloud-cli.md](cloud-cli.md)。モックは [github-mock/index.html](github-mock/index.html)。**設計段階（未実装）**。

git ペイン（§5.9）とは別物: あちらは手元の 1 リポジトリの作業ツリー、こちらは GitHub の上のアカウント全体。
互いを知らない（「ペインはほかのペインに結び付かない」のとおり）。

## 0. 決定の記録

| 日付 | 決定 | 経緯 |
|------|------|------|
| 2026-11-07 | GitHub CLI 経由で、OSS などの開発者が要る情報を出すペイン | 利用者の案 |
| 2026-11-07 | **（要決定）** 名前は GITHUB（ウィジェット id `github`、ピッカーは "github activity"） | 提案 |
| 2026-11-07 | プリセット `cloud` の右上（舞台の 0.42 の上 0.62、下はシェルと LOG WATCH のタブ）（cloud-cli.md §10） | 利用者の指定 |
| 2026-11-07 | **（要決定）** v1 は github.com だけ（GHES は後で） | 提案 |
| 2026-11-07 | レビュー（Opus 5.5・Fable 5.1）で直したもの: 最初のタブを重複の無い QUEUE に、リポジトリのイベント（EVENTS）を足す、ACTIONS をリポジトリのタイルと掘った先へ、レートのゲージは少ないときだけ、数え下げの輪をやめる、貢献の格子は印として残し 1 時間ごとの別の probe に、fine-grained トークンと通知、`mergeable` の UNKNOWN、Issue の数の定義、スターの記録は公開リポジトリだけ | レビュー（cloud-cli.md §11） |
| 2026-11-07 | AWS ペインと同じ作法で、リポジトリを選ぶとペインの中で掘れる（§5.3） | AWS のドリルダウン（利用者の指定）に揃えた |
| 2026-11-07 | 最新の CLI と API で確かめた（§3.3）: gh 2.103.3 が最新（入っているのは 2.100.0）、期限付きトークン、プレリリース、Dependabot の無効、課金の API のスコープ | 利用者の指定（最新のドキュメントで、プロ向けに） |

## 1. 何を見せるか（保守する人の問い）

| 問い | 答える場所 |
|---|---|
| 誰かが自分を待っていないか（レビュー依頼、メンション、アサイン、初めての人の実行の承認） | QUEUE |
| 自分の PR は通りそうか（CI、レビュー、衝突） | QUEUE（手を入れるべきものだけ）、掘った先の PULLS |
| 自分のリポジトリで何が起きたか（新しい Issue・PR・スター・フォーク・リリース・プッシュ） | EVENTS |
| 誰も答えていない Issue や PR は | QUEUE の TRIAGE |
| 既定ブランチは赤くないか | 上段の MAIN RED、REPOS のタイルの実行の点の列 |
| 非公開の脆弱性報告・Dependabot の警告は | QUEUE（SECURITY）、タイル |
| 前のリリースから何コミット溜まったか | タイル（`v0.9.2 +38`） |
| リポジトリは見られているか | タイル（★ と 7 日の増減、14 日の訪問） |
| 生の通知 | INBOX |

非目的: 書き込み（既読化、マージ、コメント、Actions の再実行や承認）、コードやファイルの中身、ほかの人の
アカウントの監視、課金（Actions の分数は後で、§9）。

## 2. 認証

- `gh auth status --json hosts`（15 分ごと、`--show-token` は付けない）で、ログイン名、`state`、`scopes`、
  `tokenSource`、`active` を得る。サインインの状態は終了コードでなく JSON の `state` で読む（§3.3）。
  トークンは elecdex に一度も入らない
- 入っていない: SIGNED OUT とし、`gh auth login` をコピーさせる
- **トークンの種類ごとに言うことを替える**
  - classic で通知が読めない: `gh auth refresh -s notifications` をコピー（実測: `repo` があれば読める）
  - fine-grained の個人のトークン: 通知の API はそもそも使えない。INBOX に「notifications need a classic token
    or `gh auth login`」と出し、ほかは読む
  - `GH_TOKEN` / `GITHUB_TOKEN` が環境にある（`tokenSource` が環境）: `gh auth refresh` は効かないので、そう言う
  - 期限付きトークン（gh 2.103 の `gh auth login --expiring`）: gh が使うときに更新する。切れて更新もできない
    ときは SIGNED OUT
- 足りない権限は項目ごとに PARTIAL（「NEEDS SCOPE · notifications」、「ADMIN ONLY」）

## 3. 呼ぶもの（probe の表）

すべて `gh api -X GET …` か `gh api graphql --input -`（本文は queries.ts の定数、操作はすべて `query`）。
レート制限は認証済みで REST 5,000 / 時、GraphQL 5,000 点 / 時（`gh api rate_limit` で確かめた）。

| probe | 呼び方 | 周期 | 使い道 |
|---|---|---|---|
| auth | `gh auth status --json hosts` | 15 分 | ログイン名、スコープ、トークンの出どころ |
| rate | `gh api -X GET rate_limit` | 5 分（レート制限に数えない） | 残り（少ないときだけ上段に） |
| inbox | `gh api -i -X GET notifications?per_page=50` ＋ `If-Modified-Since` | `X-Poll-Interval`（実測 60 秒） | 生の通知 |
| queue | GraphQL 1 本（§3.1） | 5 分 | レビュー依頼、自分の PR、アサイン、TRIAGE |
| repos | GraphQL 1 本（見張るリポジトリを別名で並べる） | 15 分 | 数、最新のリリース（プレリリースを含む）、既定ブランチの CI、警告の有無 |
| events | `gh api -i -X GET repos/{o}/{r}/events?per_page=30` ＋ `If-None-Match` | 5 分 | EVENTS（304 は数えない） |
| runs | `gh api -i -X GET repos/{o}/{r}/actions/runs?per_page=10` ＋ `If-None-Match` | 5 分 | タイルの点の列、承認待ち（`action_required`） |
| advisories | `gh api -X GET repos/{o}/{r}/security-advisories?state=triage` | 1 時間 | 非公開の脆弱性報告（管理者だけ。ほかは「—」） |
| ahead | `gh api -X GET repos/{o}/{r}/compare/{tag}...{default}`（`--jq .ahead_by` 相当を main で） | 1 時間 | 前のリリースからのコミット数 |
| traffic | `gh api -X GET repos/{o}/{r}/traffic/views`、`…/clones` | 6 時間 | 14 日の訪問とクローン（push 権のあるものだけ） |
| contrib | GraphQL（`contributionsCollection`） | 1 時間 | 帯の格子 |

- **304 はレート制限を減らさない**（実測 2026-11-07: 残り 4996 のまま）。inbox・events・runs は前回の
  `Last-Modified` / `ETag` を main のメモリに持ち、変化の無い読み取りをほぼ無料にする。`gh` は 304 で終了コード 1
  を返すので、`-i` の状態行で 304 を「変化なし」と読む。events・runs・traffic・compare・advisories は ETag を
  返すことを確かめた
- `X-Poll-Interval` が示す秒より短く通知を読まない（GitHub の指示）
- 予算: 1 ペインが 1 時間に使うのは REST 5%（250）、GraphQL 5%（250 点）まで。時刻表の単体テストが、見張る
  リポジトリ 12 個（上限）で計算して確かめる。残りが 10% を切ったら周期を 4 倍にし、上段に「RATE LOW · reset 15:04」
  （`x-ratelimit-reset` から）
- GraphQL の応答の `rateLimit { cost remaining resetAt }` を台帳に足す
- 二次のレート制限（同時の要求、短い間の多すぎる要求）に当たったら `retry-after` に従い、THROTTLED

### 3.1 queue のクエリ（要旨）

```graphql
query Queue {
  review:   search(query: "is:open is:pr review-requested:@me archived:false", type: ISSUE, first: 20) { … PR の欄 }
  mine:     search(query: "is:open is:pr author:@me archived:false", type: ISSUE, first: 20) {
    … on PullRequest { isDraft reviewDecision mergeable
      commits(last: 1) { nodes { commit { statusCheckRollup { state } } } } } }
  assigned: search(query: "is:open assignee:@me archived:false", type: ISSUE, first: 20) { … }
  triage:   search(query: "is:open no:assignee no:label comments:0 repo:… repo:…", type: ISSUE, first: 20) { … }
  rateLimit { cost remaining resetAt }
}
```

PR の欄: `number title url createdAt updatedAt isDraft additions deletions repository { nameWithOwner isPrivate }
author { login }`。本文（`body`）は読まない。

repos のクエリはリポジトリごとに: `stargazerCount forkCount issues(states: OPEN) { totalCount }`（PR を含まない。
REST の `open_issues_count` は PR を含むので使わない）、`pullRequests(states: OPEN) { totalCount }`、
**`releases(first: 1, orderBy: {field: CREATED_AT, direction: DESC}) { nodes { tagName isPrerelease publishedAt } }`**
（`latestRelease` はプレリリースを返さない。実測: elecdex は v0.0.59 でなく v0.0.58 を返した。プレリリースで
出すプロジェクトは多い）、`hasVulnerabilityAlertsEnabled`、`vulnerabilityAlerts(states: OPEN) { totalCount }`
（無効なら「OFF」、読めなければ「—」。0 と書かない）、`defaultBranchRef { name target { … on Commit
{ statusCheckRollup { state } } } }`、`isPrivate isArchived pushedAt`。

### 3.2 見張るリポジトリ

- 既定（AUTO）: 自分が持つ、フォークでなくアーカイブでもないリポジトリを、スターの多い順に 8 つ
- PINNED: 設定で `owner/name` を並べる（12 まで、形を確かめ、存在しないものは「NOT FOUND」のタイル）。
  組織のリポジトリも可
- ペインの状態に持つのは名前だけ

### 3.3 最新の CLI と API で確かめたこと（2026-11-07）

| 確かめたこと | どうなっていたか |
|---|---|
| gh の版 | 最新は v2.103.3（2026-10-26）。入っているのは 2.100.0。2.103 で期限付きトークン（`--expiring`）と、`auth status` の期限切れの説明が入った |
| `gh auth status --json hosts` | `state`、`login`、`scopes`、`tokenSource`、`active`。トークンは `--show-token` の時だけ |
| `gh api` のメソッド | `-f` / `-F` で黙って POST になる。REST は必ず `-X GET` |
| 通知の 304 | 終了コード 1、レート制限は減らない。`X-Poll-Interval: 60` |
| `repos/{o}/{r}/events`、`actions/runs`、`traffic/*`、`security-advisories`、`compare` | どれも 200 と ETag（自分のリポジトリ） |
| `actions/runs?status=action_required` | 200（承認待ちの実行を絞れる） |
| Dependabot の警告 | 無効のリポジトリは 403「Dependabot alerts are disabled」。gh は `admin:repo_hook` を足せと言うが的外れ。GraphQL の `hasVulnerabilityAlertsEnabled` で見分ける |
| GraphQL の `latestRelease` | プレリリースを返さない（`releases(first:1, orderBy:CREATED_AT)` を使う） |
| 課金（`users/{u}/settings/billing/usage`） | `user` スコープが要る（無いと 404）。v1 では読まない |
| GraphQL のクエリ全体 | `contributionsCollection`、`repositories(ownerAffiliations: OWNER, isFork: false, orderBy: STARGAZERS)`、`statusCheckRollup` が答えた |

## 4. 判定（`shared/github/*.ts`、純粋）

- **QUEUE**（`queueItems`）: 同じものは 1 行にまとめる（レビュー依頼の PR が通知にもある、など）。種類と重さ:
  - danger: 自分のリポジトリの既定ブランチの CI が赤い、自分の PR が FAILING、非公開の脆弱性報告（triage）
  - warn: 7 日を超えたレビュー依頼、自分の PR に CHANGES / CONFLICT、承認待ちの実行（初めての人の PR）
  - info: レビュー依頼、メンション、アサイン
  - 淡色: TRIAGE（誰も答えていない Issue・PR、古い順）
- **PR の状態の札**（`prVerdict`）: FAILING（rollup が FAILURE / ERROR）、CONFLICT（mergeable が CONFLICTING）、
  CHANGES（CHANGES_REQUESTED）、APPROVED、PENDING（CI が走っている、**または mergeable が UNKNOWN**: GitHub が
  最初の問い合わせで計算を始め、次の読み取りで答える）、DRAFT、WAITING。一番悪いものを 1 つ札に、全部をカードに
- **待たせている時間**: レビュー依頼は作られてから（または依頼されてから）の日数。3 日で warn、7 日で danger
  （`GH_LIMITS`）
- **EVENTS**（`repoEvents`）: Issues・PullRequest・Watch（スター）・Fork・Release・Push・IssueComment を、
  リポジトリと種類で畳んで「tern · ★ +4 · 2 new issues · 1 PR opened · 14:10」のように。自分の操作は淡く。
  GitHub のイベントは数分遅れて届き、各リポジトリの直近 300 件・90 日まで
- **スターの推移**（`starDelta`）: §6
- **ストリーク**: 貢献の連続日数（今日がまだ 0 なら昨日まで）

## 5. 画面

モックのとおり。上から:

- **見出し（PaneHost）**: `GITHUB`、subtitle に `@login · github.com`、badge に「main red」（danger）か §4 の語
- **上段**: ◆ランプと語、QUEUE（数、danger の数）、REVIEW（自分を待つ PR）、MAIN RED（既定ブランチが赤い
  リポジトリの数、0 なら淡く）、RATE LOW のときだけ REST / GQL の残り、右に「inbox next 14:23」（時刻を、
  変わったときだけ書く）、右端に MASK・REFRESH・⚙
- **帯（このペインの印）**: 53 週 × 7 日の貢献の格子（2D canvas 1 枚）。GitHub の緑の草ではなく、アクセントの
  濃淡の四角を回路の基板のように並べ、月の区切りは HTML の細い線と文字。左に年の数、右に STREAK。マスに留まると
  その日の数。高さが足りないとき・狭いとき（26 週に）・設定で消える
- **タブ**: QUEUE (n) · INBOX (n) · EVENTS · REPOS
- **絞り込みの行**: QUEUE は ALL · REVIEW · MINE · MENTION · TRIAGE · SECURITY、INBOX は理由で
- **QUEUE**: 行は重さの縁、種類の記号（PR / IS / CI / SEC / RUN）、リポジトリ、件名、札（`prVerdict` か理由）、
  待たせている日数。↗ で開く（§7）
- **INBOX**: 生の通知。未読の◆、理由の札、年齢
- **EVENTS**: リポジトリごとに畳んだ行（§4）。新しいものは `fx-fresh`。足元に「since 09:12」
- **REPOS**: タイル（幅に応じて 1〜3 列）: 名前（プライベートは PRIVATE の札）、★ と 7 日の増減と 30 日の細い線、
  フォーク・Issue・PR・警告、**直近 10 回の実行の点の列**（緑・赤・走っている途中は半分の塗り・取消は淡く。
  既定ブランチの最新が赤ければタイルの縁が danger）、最新のリリース（プレリリースは PRE の札）と「+38 since」、
  14 日の訪問の小さな棒（push 権があるときだけ）。タイルを選ぶと 2 段目（§5.3）
- **足元**: 台帳（`REQUESTS TODAY 512 · 304 FREE 380 · REST 132/h · GQL 48 pts/h · PAID APIs 0`）

### 5.1 幅と高さによる組み替え

- wide: 行に作者・年齢・行数の棒まで、REPOS は 3 列
- medium: 行数の棒と作者を落とす（カードへ）、REPOS は 2 列
- narrow（32 rem 未満）: 帯は 26 週、REPOS は 1 列で訪問の棒を落とす
- 低い（30 rem 未満）: 帯を落とす

### 5.2 何も無いとき

- QUEUE 0 件: 「nothing waits on you · last read 14:22」
- INBOX 0 件: 「inbox zero」

### 5.3 リポジトリを掘る（AWS のドリルダウンと同じ作法）

- パンくず `REPOS › kurouna/tern`、‹ で戻る、Enter / Escape、CRT の点灯（[aws.md](aws.md) §5.1 と同じ部品
  `DrillCrumbs`）
- 2 段目（1 リポジトリ）: 上に数の列（★・フォーク・訪問・クローン・Issue・PR）、下に 3 つの区画:
  - RUNS: 直近 20 回（ワークフロー、ブランチ、イベント、所要時間、結果。承認待ちは warn）
  - PULLS: 開いた PR（`prVerdict`、作者、待ち日数）
  - RELEASES: 直近 5 つ（プレリリースの札、資産のダウンロード数、それからのコミット数）
- 読み取りは開いたときだけ（runs と PR の一覧を GraphQL 1 本、リリースは REST 1 回、ETag 付き）。5 分持つ

## 6. スターの推移（ディスクに書く唯一のもの）

- GitHub はスターの日ごとの数を返さない（`starred_at` を全部めくると、大きなリポジトリでは数百回の要求になる）。
  main が repos を読むたびに、日ごとの最後の `stargazerCount` を `github-stars.json`（`replaceFile`、リポジトリ
  ごとに 90 日分）に持つ
- **書くのは公開リポジトリだけ**（プライベートのリポジトリの名前をディスクに残さない）
- 増減は「今日の値 − 7 日前の値」。7 日分が無いうちは「since 11-07」と添える

## 7. ブラウザーで開く

- ↗ を押すと、ページは `github.open(itemId)` を送るだけ。main が直前の読み取りからその項目の `url` / `html_url`
  を引き、`htmlUrlOf`（純粋）で `https://github.com/{o}/{r}/(pull|issues|actions/runs|releases/tag)/…` などの形と
  ホストを確かめて開く。通知の `subject.url`（API の URL）もここで直す。直せないものはリポジトリのページ
- 単体テストが全種類を確かめる（ホストと形を外れるものを断る）

## 8. ページに渡すもの

- 件名、番号、リポジトリ名、作者のログイン名、日時、数、状態、項目の id だけ。本文、コメント、差分、ファイル、
  メールアドレス、URL そのものは渡さない（開くのは main）
- 件名・ブランチ名・ワークフロー名・タグ名は他人が書いた文字: Svelte の文字としてだけ描く
- プライベートのリポジトリは `isPrivate` を添え、MASK でその名前と件名を伏せる

## 9. 後で

既読化（2 度押し、別の設計）、Actions の分数と課金（`user` スコープが要る: 確かめた）、Discussions、Sponsors、
GHES、組織の全リポジトリ横断、Dependabot の個々の警告、githubstatus.com の公開の状態（利用者に聞く: 新しい
通信先になる）。

## 10. テスト

[cloud-cli.md](cloud-cli.md) §9 に加えて: `queueItems`（重複の畳み込み、重さ、並び）、`prVerdict`（全組み合わせ、
UNKNOWN）、`repoEvents`（畳み方、自分の操作）、`htmlUrlOf`（ホストと形を外れるものを断る）、スターの推移（日の
切り替わり、欠けた日、90 日の刈り込み、プライベートを書かない）、ストリーク、304 の読み方（終了コード 1 と状態行）、
`X-Poll-Interval` に従う時刻表、レートの予算（12 リポジトリで 5% 以内）、トークンの種類ごとの言い方、
Dependabot の OFF / — / 数、プレリリース、GraphQL の本文がすべて `query`。e2e は `github.spec.ts`（代役の `demo` /
`signedout` / `finegrained` / `envtoken` / `ratelow` / `offline`、リポジトリの往復）。
