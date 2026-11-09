# GITHUB STATUS ペイン 設計

**GITHUB STATUS**（文中の「GITHUB ペイン」）は、GitHub でオープンソースなどを開発・保守する人が「いま自分を待っているもの」と「自分のリポジトリで何が
起きたか」を 1 枚で見て、リポジトリを選べばその中まで掘れるペイン。利用者の GitHub CLI（`gh`）の認証に
そのまま乗り、見えている間だけ、レート制限の小さな一部で読む。読むだけで、何も変えない。共通の核は
[cloud-cli.md](cloud-cli.md)。モックは [github-mock/index.html](github-mock/index.html)。**2026-11-08 に実装（未リリース）**。実装で決めたこと・設計から見送ったものは §0 と [decisions.md](decisions.md) の末尾。

git ペイン（§5.9）とは別物: あちらは手元の 1 リポジトリの作業ツリー、こちらは GitHub の上のアカウント全体。
互いを知らない（「ペインはほかのペインに結び付かない」のとおり）。

## 0. 決定の記録

| 日付 | 決定 | 経緯 |
|------|------|------|
| 2026-11-07 | GitHub CLI 経由で、OSS などの開発者が要る情報を出すペイン | 利用者の案 |
| 2026-11-08 | 名前は **GITHUB STATUS**（ウィジェット id `github`、ピッカーは "github status"）。既存のペインの名前に合わせた | 利用者の決定 |
| 2026-11-08 | GitHub の公開ステータス（githubstatus.com）を障害のときだけ出し、トーストは設定で選べる（既定 ON）（cloud-cli.md §12） | 利用者の決定 |
| 2026-11-07 | プリセット `cloud` の右上（舞台の 0.42 の上 0.62、下はシェルと LOG WATCH のタブ）（cloud-cli.md §10） | 利用者の指定 |
| 2026-11-07 | **（要決定）** v1 は github.com だけ（GHES は後で） | 提案 |
| 2026-11-07 | レビュー（Opus 5.5・Fable 5.1）で直したもの: 最初のタブを重複の無い QUEUE に、リポジトリのイベント（EVENTS）を足す、ACTIONS をリポジトリのタイルと掘った先へ、レートのゲージは少ないときだけ、数え下げの輪をやめる、貢献の格子は印として残し 1 時間ごとの別の probe に、fine-grained トークンと通知、`mergeable` の UNKNOWN、Issue の数の定義、スターの記録は公開リポジトリだけ | レビュー（cloud-cli.md §11） |
| 2026-11-07 | AWS ペインと同じ作法で、リポジトリを選ぶとペインの中で掘れる（§5.3） | AWS のドリルダウン（利用者の指定）に揃えた |
| 2026-11-07 | 最新の CLI と API で確かめた（§3.3）: gh 2.103.3 が最新（入っているのは 2.100.0）、期限付きトークン、プレリリース、Dependabot の無効、課金の API のスコープ | 利用者の指定（最新のドキュメントで、プロ向けに） |
| 2026-11-08 | **実装**: EVENTS は直近 24 時間で畳む（最初の表示で空にならないよう）。リポジトリごとの probe はリポジトリの一覧の答え（名前・既定ブランチ・最新のリリース）が変わったときだけすぐ読み直す。公開ステータスの通知の `minSeverity` は重さの語（major 以上 = danger）で持ち、部品の除外は `skip`（既定 Copilot） | 実装（decisions.md） |

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
| events | `gh api -i -X GET repos/{o}/{r}/events?per_page=30` ＋ `If-None-Match` | 5 分（見張るリポジトリが 8 個以上なら 10 分） | EVENTS（304 は数えない） |
| runs | `gh api -i -X GET repos/{o}/{r}/actions/runs?per_page=20` ＋ `If-None-Match` | 5 分（見張るリポジトリが 8 個以上なら 10 分） | タイルの点の列、承認待ち（`action_required`） |
| advisories | `gh api -i -X GET repos/{o}/{r}/security-advisories?state=triage` ＋ `If-None-Match` | 1 時間 | 非公開の脆弱性報告（管理者だけ。ほかは「—」） |
| ahead | GraphQL 1 本（リポジトリごとの別名で `ref(qualifiedName: "refs/tags/{tag}") { compare(headRef: "{default}") { aheadBy } }`。REST の compare は範囲のコミットと差分をすべて返していた） | 1 時間 | 前のリリースからのコミット数 |
| traffic | `gh api -i -X GET repos/{o}/{r}/traffic/views` ＋ `If-None-Match` | 6 時間 | 14 日の訪問とクローン（push 権のあるものだけ） |
| contrib | GraphQL（`contributionsCollection`） | 1 時間 | 帯の格子 |

- **304 はレート制限を減らさない**（実測 2026-11-07: 残り 4996 のまま）。inbox・events・runs は前回の
  `Last-Modified` / `ETag` を main のメモリに持ち、変化の無い読み取りをほぼ無料にする。`gh` は 304 で終了コード 1
  を返すので、`-i` の状態行で 304 を「変化なし」と読む。events・runs・traffic・compare・advisories は ETag を
  返すことを確かめた
- `X-Poll-Interval` が示す秒より短く通知を読まない（GitHub の指示）。inbox の時刻表は 1 分ごとに起きるが、前の
  答えから `X-Poll-Interval` を時刻表の 1 分単位に切り上げた間（90 秒なら 2 分、`inboxWait`）が経っていなければ
  読まずに前の答えを残す。前の答えの時刻は読み取りの終わりなので、余裕は時刻表の半周期（30 秒、`heldToRate` と
  同じ）。以前の 5 秒では 5 秒を超える読み取りのたびに次の分を飛ばし、2 分ごとにしか読まなかった。上段の
  「inbox next」も前の答えの時刻からこの間（RATE LOW なら 4 分）で言い、待てと言われた間はその終わりより前を
  言わない（`heldToRate`、`inboxProbe`、`nextInboxAt`。github-rate.test.ts）
- 予算（利用者の決定 2026-11-08）: **見張るリポジトリがいくつでも（上限 12）、304 が 1 つも無い最悪の 1 時間で
  REST の 5% 未満**（5,000 のうち 250 回未満）。そのため events と runs は、リポジトリが 7 個までは 5 分ごと、
  8 個からは 10 分ごとに読む（`repoEvery`、`FRESH_REPOS`）。時刻表は 5 分ごとに起き、前の読み取りから
  10 分（2 分半の余裕）経っていなければ読まずに前の答えを残す。ただし REFRESH の後と、一覧に新しいリポジトリが
  加わったときは待たずに読む。最悪の 1 時間は 7 個で約 237 回（inbox 60、events と runs が各 84、advisories 7、
  traffic 約 2、**4.7%**）、12 個で約 218 回（inbox 60、events と runs が各 72、advisories 12、traffic 2、
  **4.4%**）。どちらも 5 分ごとのままなら 12 個で約 362 回（7.2%）だった。8 個（自分のリポジトリを読む既定の
  上限）を 5 分ごとにすると約 261 回（5.2%）で越えるので、境目は 7 個。台帳のカードの周期もこの値を言う。
  GraphQL は 1 時間に約 18 本（queue 12、repos 4、ahead と contrib が各 1）。時刻表の単体テスト
  （github-rate.test.ts）が 7・8・12 リポジトリで 6 時間を回して確かめる
- 残りが 10% を切ったら（`rate` の読み取りの `low`）、`auth` と `rate` のほかの probe はどれも周期の 4 倍待つ
  （`heldToRate`。events と runs は上の周期の 4 倍）。上段に「RATE LOW · REST … · GQL … · reset 15:04」
  （`x-ratelimit-reset` から）
- RATE LOW の間と GitHub が待てと言った間（下）、REFRESH は 4 倍の周期で期限の来たもの（待てと言われた間は
  サインインと `rate_limit` だけ）しか読まない。30 秒ごとに押せば 4 倍の周期が省いた分を使い、待てと言われた
  間に呼べば GitHub の指示に背くため。押してもほとんど何も読まないことを、足元が「rate low: readings 4× apart
  until the reset at 15:04, and REFRESH reads only what is due」「GitHub asked to wait: REFRESH reads only the
  rate limit until 15:04」と言う（`refreshNote`、`GithubBoard.heldUntil`）
- レート制限の拒否はリポジトリや通知の答えではない。通知の 403 がレート制限なら（`waitAsked` が待ちを返す）
  「notifications のスコープが無い」とは読まず前の読み取りを残し、traffic・advisories・events・runs の
  そのリポジトリも前の答えを残す（一度も読めていなければ一覧から外し、タイルは「not read yet」。「needs push
  access」はそのリポジトリへのレート制限でない 403 か 404 だけ）。ほかの理由の失敗（オフライン、時間切れ、
  5xx、状態行の無い答え）も同じで、前の答えを残し、一度も読めていなければ一覧から外す。通知も 401・403・404
  のほかの失敗では前の読み取りを残す（5xx を空の受信箱と読まない）。`X-Poll-Interval` が空・0・数でなければ
  60 秒とする
- 許容される gh の呼び出し（リポジトリごとの読み取りと通知、どれも `-i`）が許すのは、状態行が 403 か 404 の
  自分の「いいえ」だけ。オフライン、時間切れ、5xx、状態行の無い答えはその probe の失敗で（スケジューラの
  `toleratedFailure`）、リンクの語が言い、退きの待ち（1、2、4…分）で読み直す。以前は何の印も付けず、リンクは
  LINKED、どのリポジトリも答えなかった読み取りが `{}` として読めたことになり、traffic は 6 時間、advisories は
  1 時間、タイルの「not read yet」のまま待った。どのリポジトリも答えなかった読み取りは読み取りにしない
  （`perRepo` が null: 前の答えが残り、読んだ時刻も進まない）
- events と runs の 10 分の歩調は、前の読み取りが**問い合わせた**リポジトリ（`GhContext.tried`）で決める。答えた
  ものでなく問い合わせたもので数えるので、答えないリポジトリが 1 つあってもほかを 5 分ごとに読まない（12 個で
  1 時間約 290 回になり 5% を越えていた）。加わったばかりのリポジトリはすぐ読む。歩調は全部を問い合わせた
  読み取り（`GhContext.fullAt`）から、その周期の境界で数える。`tried`・`fullAt`・`unheard` は呼び出しの後、
  読み取りが残るときだけ書く: ボードを隠して並んでいた呼び出しが起動されずに戻った読み取りはスケジューラが
  捨てるので、何も書かない（以前は呼ぶ前に「いま全部を問い合わせた」と書き、隠している間に捨てられた events を、
  もう一度見せても歩調の 10 分先まで読まず、何も残っていなかった）。前の読み取りが聞けなかったリポジトリ
  （`GhContext.unheard`）があれば、全部を読む番の前に走ったとき（退きの待ちの後、待ちが終わった後の
  `heldBack`）にそれだけを読み直す。以前は「前の読み取りが失敗した」（`GhContext.failed`）も要り、読み直しが
  レート制限の待ちの中に落ちると問題無しで片付くので、待ちが終わっても events はその 1 つを歩調の 10 分先まで
  読まず、traffic と advisories は全部を読み直して歩調を動かした。聞けなかったものが無く全部を読む番でもなければ
  何も読まない（traffic と advisories も。全部を読めた後に残っていた読み直しが、もう一度全部を読んでいた）。ほかは前の答えを残し、読み直しは歩調を動かさない（全部を読み直し、そこから歩調を数えていたので、
  12 個で 1 回ごとに 2% の 502 があると 1 時間 252 回（5.04%）、1 つのリポジトリが 1 回おきに失敗すると
  356 回（7.1%）だった。直して 215 回と 224 回）。全部を読む番は退きの待ちの中でも来る（`dueThroughBackoff`）。
  周期の境界の「いま読んだばかり」も全部を問い合わせた読み取り（`readAllAt`、`fullAt`）から数える: 境界の
  1、2 分前に落ちた 1 つのリポジトリの読み直し（退きの後、待ちが終わった後の `heldBack`）がその境界を飛ばさせ、
  ほかの runs が 300 秒でなく 600 秒おきになっていた。リストから外れたリポジトリは、何も読まない番でも前の答えから
  落とす（`perRepo`。以前は全部を読む番まで残り、advisories は 1 時間）
  いつも答えないリポジトリが 1 つあると probe 全体が退き、ほかは 1・3・7・15・35 分…と約 30 分ごとにしか
  読まれなかった。どのリポジトリも答えなかったとき（オフライン）だけ、待ちが全部を止める（traffic と
  advisories も同じ: 周期の境界の前の読み直しは聞けなかったものだけ。github-rate.test.ts）
- レート制限で拒まれたら（403 か 429、`API rate limit exceeded` / `secondary rate limit`）、THROTTLED にして
  その probe を退かせる。リポジトリごとの許容される呼び出し（push 権や管理者の要るもの）でも同じ（許容では
  拒否が何も印を付けず、次の分にまた呼んでいた）。答えが `retry-after` を持てばその秒まで、使い切った制限
  （`x-ratelimit-remaining: 0`）なら `x-ratelimit-reset` まで、どちらの見出しも無い 403・429 でも本文か gh の
  標準エラーが「rate limit」と言えば（二次的な制限はそう来ることがある）1 分（`SECONDARY_WAIT_MS`）、制限を
  使う probe を 1 つも呼ばず THROTTLED のまま待つ（`waitAsked`）。`x-ratelimit-reset` がもう過ぎていれば
  （この時計が GitHub より進んでいる、古い見出し）何も待たないことになるので 1 分。GraphQL（probe の
  `graphql` と掘り下げの `detail`）がデータ無しにレート制限で拒まれたら（gh の標準エラーの「rate limit」か
  `HTTP 429`、本文の `"type": "RATE_LIMITED"`。`-i` を付けないので見出しは無い、`graphqlLimited`）も 1 分待つ。
  待ちのために読まなかった probe は `GhContext.heldBack` に残り、待ちが終わった後のボードの最初の publish
  （inbox の時刻表が毎分起こす）で `runNow` する。以前は「新しいものは無い」として片付き、次の自分の境界
  （repos 15 分、contrib・ahead・advisories 1 時間、traffic 6 時間）まで読まず、待ちの間に開いた 2 枚目の
  ボードは約 14 分リポジトリが無く、拒否を受けた probe の 1 分後の読み直しも失われた。タイマーは持たない。制限はボードのものでなく利用者のものなので、
  待ちはサービスが 1 つ持ち（`GithubService` の `#holdUntil`、`GhContext.heldUntil`/`hold`）、どのボードも待つ
  （以前はボードごとで、2 枚目のペインは自分が 403 を受けるまで呼び続けた）。リポジトリの掘り下げ（§5.3）も
  待ちの間は読まず、前に読んだもの（5 分を過ぎていても）か `waiting` を答え、REFRESH も掘り下げの読み取りを
  捨てない。RATE LOW の間は掘り下げを 4 倍の 20 分持つ。`rate_limit` と `auth status` は制限を使わないので
  待たない
- GraphQL の応答の `rateLimit { cost remaining resetAt }` は台帳に足していない（台帳は要求の数だけ。GraphQL の
  残りは 5 分ごとの `rate_limit` で読む）

### 3.1 queue のクエリ（要旨）

```graphql
query Queue {
  review:   search(query: "is:open is:pr review-requested:@me archived:false", type: ISSUE, first: 20) { … PR の欄 }
  mine:     search(query: "is:open is:pr author:@me archived:false", type: ISSUE, first: 20) {
    … on PullRequest { isDraft reviewDecision mergeable
      commits(last: 1) { nodes { commit { statusCheckRollup { state } } } } } }
  assigned: search(query: "is:open assignee:@me archived:false", type: ISSUE, first: 20) { … }
  triage:   search(query: "is:open no:assignee no:label comments:0 -author:@me repo:… repo:…", type: ISSUE, first: 20) { … }
  rateLimit { cost remaining resetAt }
}
```

PR の欄: `number title url createdAt updatedAt isDraft additions deletions repository { nameWithOwner isPrivate }
author { login } authorAssociation`（アサインと TRIAGE の Issue・PR も `author` と `authorAssociation`）。本文（`body`）は読まない。
TRIAGE は自分が開いたものを除く（`-author:@me`。自分のものは自分の用事で、「誰も答えていない」ではない）。

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
  - warn: 7 日を超えたレビュー依頼、自分の PR に CHANGES / CONFLICT、承認待ちの実行（初めての人の PR）、
    開いている Dependabot の警告（タイルの数から、リポジトリごとに 1 行。開く先は `/security/dependabot`）
  - info: レビュー依頼、メンション、アサイン
  - 淡色: TRIAGE（誰も答えていない Issue・PR、古い順）
  - 初めての貢献（`authorAssociation` が FIRST_TIME_CONTRIBUTOR か FIRST_TIMER）のレビュー依頼と Issue に
    **1ST** の印（`newcomer`）。グループの見出しは Needs you now / Needs you soon / For you /
    Triage · nobody has answered。始まりの分からない行（advisory など）は年齢を作らず `—`
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

- **見出し（PaneHost）**: `GITHUB STATUS`、subtitle に `@login · github.com`、badge に「main red」（danger）、
  「GitHub incident」か §4 の語
- **障害の帯**（githubstatus.com に未解決の障害があるときだけ、1 行。impact と部品と状態。cloud-cli.md §12）。
  CI の失敗が GitHub 側の障害と重なっていれば、QUEUE の MAIN RED の行のカードに「GitHub Actions has an open
  incident since 13:40」と添える（自分のせいかどうかを見分けるため）
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
- 読み取りは開いたときだけ（PR とリリースの一覧を GraphQL 1 本、runs は probe の最後の答え）。5 分持つ（RATE
  LOW の間は 20 分、GitHub が待てと言った間は読まない。§3）

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

- 件名、番号、リポジトリ名、作者のログイン名（と初めての貢献かどうか）、日時、数、状態、項目の id だけ。本文、コメント、差分、ファイル、
  メールアドレス、URL そのものは渡さない（開くのは main）
- 件名・ブランチ名・ワークフロー名・タグ名は他人が書いた文字: Svelte の文字としてだけ描く
- プライベートのリポジトリは `isPrivate` を添え、MASK でその名前と件名を伏せる。events・runs・advisories の
  答えは見張っているリポジトリのものだけを渡し、どれがプライベートか分からないものはプライベートとして扱う
  （`watchedOnly`。リストから外れたプライベートのリポジトリが前の答えに残り、公開として MASK でも名前が出ていた）

## 9. 後で

既読化（2 度押し、別の設計）、Actions の分数と課金（`user` スコープが要る: 確かめた）、Discussions、Sponsors、
GHES、組織の全リポジトリ横断、Dependabot の個々の警告。

設定（settings.json の `github.incidents`、全ペインで共有。cloud-cli.md §12.5）: **notify**（GitHub の公開ステータスに障害が出たら
トースト、既定 ON）、**minSeverity**（既定 major: 実測で 1 日に約 5 件の障害が出るので、minor まで知らせると多すぎる）、
**components**（既定は Copilot を除く全部）、**system**（ウィンドウが前に無いときの OS の通知、既定 ON）。計画保守は
info の帯だけで、トーストは出さない。ペインの状態: 見張るリポジトリ（AUTO / PINNED）、INBOX の範囲、貢献の帯、MASK、タブ。

## 10. テスト

[cloud-cli.md](cloud-cli.md) §9 に加えて: `queueItems`（重複の畳み込み、重さ、並び）、`prVerdict`（全組み合わせ、
UNKNOWN）、`repoEvents`（畳み方、自分の操作）、`htmlUrlOf`（ホストと形を外れるものを断る）、スターの推移（日の
切り替わり、欠けた日、90 日の刈り込み、プライベートを書かない）、ストリーク、304 の読み方（終了コード 1 と状態行）、
`X-Poll-Interval` に従う時刻表、RATE LOW の 4 倍、レート制限の拒否での THROTTLED と待ち、レートの予算（7・8・12 リポジトリ、304 無しで REST 5% 未満。8 個からの 10 分の歩調、REFRESH と加わったリポジトリはすぐ読む。github-rate.test.ts）、レート制限の拒否を通知のスコープや push 権と読まない、トークンの種類ごとの言い方、
Dependabot の OFF / — / 数、プレリリース、GraphQL の本文がすべて `query`。e2e は `github.spec.ts`（代役の `demo` /
`signedout` / `finegrained` / `envtoken` / `ratelow` / `offline`、リポジトリの往復）。
