# AWS STATUS ペイン 設計

**AWS STATUS**（文中の「AWS ペイン」）は、クラウド（インフラ・基盤）エンジニアが「いまこのアカウントで気にすべきこと」を 1 枚で見て、気になった
サービスを **BI のようにドリルダウン**して詳細まで確かめるペイン。利用者の AWS CLI v2 の認証にそのまま乗り、
**1 要求ごとに値段の付く API は呼ばず**、見えている間だけ読む。読むだけで、何も変えない。共通の核（起動・
許可リスト・時刻表・台帳・状態の語・画面の作法）は [cloud-cli.md](cloud-cli.md)。モックは
[aws-mock/index.html](aws-mock/index.html)。**2026-11-08 に実装（未リリース）**。実装で決めたこと・設計から見送ったものは §0 と [decisions.md](decisions.md) の末尾。

## 0. 決定の記録

| 日付 | 決定 | 経緯 |
|------|------|------|
| 2026-11-07 | AWS CLI 経由で、インフラ・基盤のエンジニアが要る情報を出すペイン。無料の API の範囲 | 利用者の案 |
| 2026-11-07 | 各サービスを選ぶと、BI のようにドリルダウンして詳細を確かめられる（§5） | 利用者の指定 |
| 2026-11-08 | 名前は **AWS STATUS**（ウィジェット id `aws`、ピッカーは "aws status"）。既存のペインの名前に合わせた | 利用者の決定 |
| 2026-11-07 | プリセット `cloud` の左の主役（舞台の 0.58）。LAYOUTS で `blank` の前（cloud-cli.md §10） | 利用者の指定 |
| 2026-11-08 | 1 ペインに 1 プロファイル、リージョンは 4 つまで。複数アカウントを 1 枚にまとめるのは、CLI の重さを測ってから（§11） | 利用者の決定（提案のとおり） |
| 2026-11-07 | レビュー（Opus 5.5・Fable 5.1）で直したもの: 一斉起動をやめ周期を延ばす（在庫は 1 時間、アラームは 5 分）、`--query` で欄を絞る、CloudTrail の欄と見せ方、Free Tier の新プラン、EKS と RDS のサポート期限を API で、ACM の鍵の種類、グローバルなサービスの `--region us-east-1`、vCPU の数え方、複合アラーム、ルートと SG と RI/SP とドメインの期限など足りない読み取り、在庫の表を「変化」に、COST を 1 行に、見出しを PaneHost に | レビュー（cloud-cli.md §11） |
| 2026-11-07 | **Cost Explorer の API は有料**（1 要求 0.01 USD、ページごとに 1 要求。公式の料金ページで確かめた）。それでも要るので削らず、**明示して有効にする有料の probe** にする: 既定は OFF、有効にしたら 1 日 1 回、設定で頻度（手動・1 日・12 時間）と ON / OFF と月の上限（既定 100 要求 = 1 USD）を変えられる（§3.3） | 利用者の指摘と指定 |
| 2026-11-07 | **ACTIVE**: どのリソース・サービスが動いていて料金が発生しているかを 1 枚で見るダッシュボードを、RESOURCES に代えて置く。立ち上げっぱなしの EC2、大きな S3、付いていないボリュームなどが、推定の月額とともに見える（§5.0） | 利用者の指定 |
| 2026-11-07 | 実測: AWS CLI 2.39.6 は 1 回 約 1.2 秒・CPU 0.59 秒・最大 95 MB（`--version` だけで 0.45 秒）。gh の約 3 倍 | 測定（i5-1335U、§3.5） |
| 2026-11-08 | **Cost Explorer は、そのアカウントを AWS STATUS で最初に表示したときに ON にするか尋ねる**（ペインの中の 1 枚。答えはアカウントごとに main が持つ）（§3.3） | 利用者の決定（「既定 OFF」から替えた） |
| 2026-11-08 | Price List の API が有料と分かったら、ACTIVE の推定の単価は同梱の表にする。どちらでも、ACTIVE の下部に推定であることを明記する（§5.0） | 利用者の決定 |
| 2026-11-08 | 公開ステータス（AWS Health Dashboard の RSS）を障害のときだけ出し、トーストは設定で選べる（既定 ON）（cloud-cli.md §12） | 利用者の決定 |
| 2026-11-08 | **コストの QUOTA**: あらかじめ決めた金額を今月の見込み額が超えたらトースト。既定は 0（OFF）（§5.6） | 利用者の指定 |
| 2026-11-08 | QUOTA は USD でよい。障害の通知と QUOTA は**ペインが見えている間だけ読み、その時点でトースト**（隠れている間には読まない） | 利用者の決定 |
| 2026-11-08 | **実装**: ACTIVE の単価は同梱の表（Price List の API は呼ばない）。拒否された読み取りは許容の呼び出しでも操作名を集めて PARTIAL（Free Tier の API だけは出さない）。リージョンごと・インスタンスごとの probe は `after` で先の答えを待つ。実物の 1 リージョンで最初の 1 周が 36 回・45 秒。見送ったもの: ECS、スナップショット、VPC、RDS の保守と延長サポートの判定、vCPU・EIP の上限、COST の 2 段目の曲線、Cost Explorer の使用の種類別、3 段目の横への道の記録。サービス別の請求は 6 時間ごとに読む（COST を開いている間だけ、ではなく） | 実装（decisions.md） |
| 2026-11-08 | **RESOURCES**（修正案、§14、Opus 5.5 のレビューで直した版）: いま何があるか・作って忘れていそうなものをダッシュボードで見せる新しい先頭のタブ（既定のタブ）。CloudWatch Logs（`describe-log-groups`・`describe-log-streams`）と S3 の `list-buckets` を禁止の表から外す。DynamoDB・ECS・SQS・SNS・API Gateway・CloudFront・Bedrock を足す | 利用者の指定と決定 |

## 1. 何を見せるか（インフラのエンジニアの問い）

重さの順に上から並べる（レビューで決めた階層: 事故 → 期限 → お金 → 無駄 → 在庫）。

| 問い | 答える場所 | 主な API |
|---|---|---|
| いま鳴っているもの、壊れているものは | 上段の ALARMS、ATTENTION（danger） | `describe-alarms`、`list-stacks`、`describe-instance-status`、GuardDuty |
| 期限が来るものは | ATTENTION（EXPIRY） | ACM、Route 53 Domains、RI / Savings Plans、IAM のキー、EKS・RDS・Lambda のサポート |
| 危ない設定は | ATTENTION（SECURITY）、ACCOUNT | IAM の概要と認証情報レポート、世界に開いた SG、ルートの使用 |
| **いま何が動いていて、いくらかかっているか** | **ACTIVE**（推定の時間あたり・月あたり、サービス別、リソース別へ掘れる） | 各サービスの describe / list、S3 の容量（CloudWatch）、EC2 の CPU（7 日の平均）、定価（Price List） |
| 今月いくらか、予算を超えそうか、何が高いか | 上段の MTD、COST タブ（サービス別へ掘れる。使用の種類までは Cost Explorer を有効にしたとき） | CloudWatch の請求メトリクス（`ServiceName` 次元つき）、Budgets、Free Tier、Cost Explorer（有料・任意） |
| 放置されて課金されているものは | ACTIVE の IDLE / WASTE、ATTENTION（COST） | CPU の低いまま動き続ける EC2、付いていないボリューム・EIP、止めたままのインスタンスの EBS、延長サポートの EKS / RDS |
| 何が増えた・減ったか | ACTIVE の変化の行 | 各サービスの describe / list の差 |
| 誰が何を変えたか | ACTIVITY、帯の PULSE | CloudTrail の `lookup-events` |
| ある 1 つのリソースの全部は | ドリルダウンの 3 段目（§5） | そのリソースの describe と、関係するものと、その CloudTrail |

非目的: 変更・停止・削除、利用者が有効にしていない有料の呼び出し（§3.3）、メトリクスのグラフ（GetMetricData は
有料。RESOURCES の判定にだけ §14.4a の上限付きで使う）、S3 のオブジェクトの一覧と中身（LIST は課金）、ログの中身、AWS Health の API（Business サポートが要る）。

## 2. 認証とプロファイル

- プロファイルの一覧は `aws configure list-profiles`（手元のファイルを読むだけ）。ペインの設定で選び、
  ペインの状態にはプロファイル名だけを持つ
- 最初に `sts get-caller-identity` で誰として入っているかを確かめる。エイリアスは `iam list-account-aliases`
- **サインインの種類ごとに、切れたときのコマンドを替える**（`aws configure list` の TYPE と、標準エラーの文で
  決める。どちらも手元）: `login`（AWS CLI の `aws login`、実測でこの機械はこれ）→ `aws login --profile=<名前>`、
  `sso` → `aws sso login --profile=<名前>`、assume role ＋ MFA → 「シェルで一度 `aws sts get-caller-identity
  --profile=<名前>` を実行すると、CLI が一時的な資格情報を持つ」。どれもペインは起動しない（ブラウザーを開くか
  入力を待つ対話なので）
- `credential_process` のプロファイルは、起動のたびに窓を開きうる（cloud-cli.md §3.1）
- 推奨の権限: AWS 管理ポリシーの `ReadOnlyAccess`（または `ViewOnlyAccess` ＋ `AWSBillingReadOnlyAccess`）。
  要る操作は §9。足りないものは PARTIAL として、その項目に「DENIED · freetier:GetAccountPlanState」と操作名だけを
  出す（実測: 拒否の文は ARN を含む。操作名だけを取り出す、cloud-cli.md §4）

## 3. 呼ぶもの（probe の表）

### 3.1 常に読むもの（見えている間、壁時計の周期で）

「R」はリージョンごと、「G」はグローバル（`--region us-east-1` を明示）。どの呼び出しも `--query` で
欄を絞り、`--max-items` を持つ（cloud-cli.md §2.4）。

| probe | CLI | 周期 | 費用 | 使い道 |
|---|---|---|---|---|
| identity G | `sts get-caller-identity` | 15 分 | 無料 | アカウント、ARN、疎通 |
| alias G | `iam list-account-aliases` | 1 日 | 無料 | 見出し |
| regions G | `ec2 describe-regions` | 1 日 | 無料 | 設定の候補（実測 17） |
| account G | `iam get-account-summary` | 1 時間 | 無料 | ルートの MFA、ユーザー・ロールの数 |
| credreport G | `iam generate-credential-report` → `get-credential-report` | 1 日 | 無料 | キーの年齢、MFA の無いユーザー、ルートのキーと最後の使用（CSV。決めた列だけ） |
| billing G | `cloudwatch get-metric-statistics`（`AWS/Billing` `EstimatedCharges` `Currency=USD`、日ごとの最大） | 6 時間 | 無料枠 | 今月と先月の同じ日まで（1 回で月の全日。実測 7 点） |
| billsvc G | `cloudwatch list-metrics`（`AWS/Billing`）→ サービスごとの `get-metric-statistics` | 6 時間（COST タブを開いている間だけ） | 無料枠 | サービス別の今月（§5.3） |
| budgets G | `budgets describe-budgets --account-id=<id>` | 6 時間 | 無料 | 予算・実績・予測（実測で読めた） |
| plan G | `freetier get-account-plan-state`（新プラン）、`get-free-tier-usage`（旧プラン） | 12 時間 | 無料 | クレジットの残りと期限、または無料枠の使用率 |
| alarms R | `cloudwatch describe-alarms --state-value ALARM --alarm-types CompositeAlarm MetricAlarm` | 5 分 | 無料枠 | 鳴っているアラーム（複合も） |
| health R | `ec2 describe-instance-status --filters Name=instance-status.status,Values=impaired` ほか | 5 分 | 無料 | 状態の確認に落ちたインスタンス |
| stacks R | `cloudformation list-stacks`（失敗・ロールバックの状態に絞る） | 15 分 | 無料 | 失敗したスタック |
| trail R | `cloudtrail lookup-events --lookup-attributes AttributeKey=ReadOnly,AttributeValue=false --max-items 50` | 15 分 | 無料（管理イベント） | ACTIVITY と PULSE（§4.2） |
| ec2 R | `ec2 describe-instances` | 1 時間 | 無料 | 台数・型・止めた日・ライフサイクル（spot を除くため） |
| volumes R | `ec2 describe-volumes` | 1 時間 | 無料 | 付いていないもの |
| eips R | `ec2 describe-addresses` | 1 時間 | 無料 | 付いていないもの |
| nat R / elb R / vpcs R | `describe-nat-gateways`、`elbv2 describe-load-balancers`、`describe-vpcs` | 1 時間 | 無料 | 数 |
| sgopen R | `ec2 describe-security-groups`（`--query` で 0.0.0.0/0・::/0 に 22・3389・全ポートを開く規則だけ） | 1 時間 | 無料 | 判定だけをページへ（規則そのものは渡さない） |
| rds R | `rds describe-db-instances`（`EngineLifecycleSupport` を含む） | 1 時間 | 無料 | 状態、延長サポート |
| rdsmaint R | `rds describe-pending-maintenance-actions` | 1 時間 | 無料 | 強制適用日 |
| lambda R | `lambda list-functions`（`--query` で名前・ランタイム・最終更新だけ。環境変数は来ない） | 1 時間 | 無料 | サポート終了の近いランタイム（同梱の表） |
| ecs R | `ecs list-clusters` → `describe-clusters` → `list-services` → `describe-services` | 1 時間 | 無料 | running < desired のサービス |
| eks R | `eks list-clusters` → `describe-cluster`（`--query` で版と `upgradePolicy` だけ）、`eks describe-cluster-versions` | 1 日 | 無料 | 標準サポートの期限（API が答える）、延長サポート中か |
| acm R＋G | `acm list-certificates --includes keyTypes=RSA_1024,RSA_2048,RSA_3072,RSA_4096,EC_prime256v1,EC_secp384r1,EC_secp521r1` | 1 日 | 無料 | 期限（既定では RSA 2048 しか返らない。CloudFront 用は us-east-1） |
| domains G | `route53domains list-domains` | 1 日 | 無料 | ドメインの期限と自動更新 |
| commit G＋R | `savingsplans describe-savings-plans`、`ec2 describe-reserved-instances`、`rds describe-reserved-db-instances` | 1 日 | 無料 | 期限の近い RI / SP |
| backup R | `backup list-backup-jobs --by-state FAILED --by-created-after <24 時間前>` | 1 時間 | 無料 | 失敗したバックアップ |
| quota R | `service-quotas get-service-quota`（L-1216C47A）、`ec2 describe-account-attributes`（EIP の上限）、使っている型だけの `describe-instance-types --instance-types …` | 1 日 | 無料 | vCPU と EIP の上限と使用 |
| s3size R | `cloudwatch list-metrics --namespace AWS/S3 --metric-name BucketSizeBytes` → バケットと保存クラスごとの `get-metric-statistics`（日ごと、`NumberOfObjects` も） | 1 日 | 無料枠 | S3 の容量と保存クラス。S3 の API は RESOURCES の `list-buckets`（§14.4、`metered-tiny`）だけ。メトリクスは S3 が 1 日 1 回出すもの |
| ec2cpu R | 動いているインスタンスごとの `cloudwatch get-metric-statistics`（`CPUUtilization`、7 日、1 日ごとの平均と最大） | 1 日 | 無料枠 | IDLE の判定（7 日の平均 2% 未満かつ最大 10% 未満）。50 台まで（多い順でなく、動いている時間の長い順） |
| prices G | `pricing get-products --region us-east-1`（使っている型・クラス・ボリュームの種類だけ、On-Demand・Linux・共有テナンシー） | 7 日（`aws-prices.json` に持つ） | 料金の記載なし（**要確認**。有料なら同梱の単価表に替える） | ACTIVE の推定額 |
| guardduty R | `guardduty list-detectors` → `get-findings-statistics --group-by SEVERITY` | 1 時間 | 無料 | 重さ別の件数（古い `--finding-statistic-types COUNT_BY_SEVERITY` ではなく `--group-by`） |

- **周期を延ばした**（初版は在庫 15 分）: 在庫は 1 時間で十分で、AWS CLI は 1 回が重い（§3.5）。急ぐのは
  アラームと状態の確認の 5 分だけ
- `free-tier` は CloudWatch の「月 100 万要求」（GetMetricData・GetInsightRuleReport・GetMetricWidgetImage を
  除く）に数えられるもの。4 リージョンで alarms が月 34,560、billing と billsvc が数百: 無料枠の約 3.5%。
  ただし無料枠は**アカウント全体で共有**で、ほかの監視ツールが使い切っていれば値段が付く（台帳のカードに書く）
- 請求メトリクスは「Receive CloudWatch billing alerts」を有効にしていないと無い（無いときの表示は §6）。
  サービス別（`ServiceName` 次元）も同じ設定で出る
- Free Tier: 2025-07-15 より後に作ったアカウントはクレジット制の新プランで、`get-account-plan-state`（クレジットの
  残り・期限・FREE / PAID）。旧プランは `get-free-tier-usage`（実測で読めた）。PAID で無料枠の提供が無ければ、
  帯から外す（本番のアカウントでは雑音）。管理アカウント以外は答えないので、それも「無し」として扱う
- vCPU の上限 L-1216C47A は On-Demand の A・C・D・H・I・M・R・T・Z の系統だけ。spot と他の系統は数えない

### 3.2 開いたときだけ読むもの（ドリルダウン、§5）

| 段 | CLI | いつ | 費用 |
|---|---|---|---|
| サービスの一覧 | §3.1 の結果（一覧に要る欄まで `--query` で取ってある）。足りない欄は `describe-*` を 1 回 | 2 段目を開いたとき、手元が 5 分より古ければ | 無料 |
| 1 件の詳細 | そのリソースの `describe-*`（`--instance-ids i-…` など、id は直前の一覧のもの） | 3 段目を開いたとき。5 分持つ | 無料 |
| 関係するもの | 付いているボリューム・EIP・SG の名前・それを見るアラーム（`describe-alarms --query` で次元に id を含むもの）・スタックのイベント（`describe-stack-events`）・EKS のノードグループ・VPC のサブネット | 3 段目を開いたとき | 無料（アラームは無料枠） |
| そのリソースの操作の履歴 | `cloudtrail lookup-events --lookup-attributes AttributeKey=ResourceName,AttributeValue=<id>` | 3 段目で HISTORY を開いたとき | 無料（2 TPS の制限に従い 1 回） |

### 3.3 有料で、利用者が有効にしたときだけ呼ぶもの: Cost Explorer

**料金**（公式の料金ページ、2026-11-07 に確かめた）: Cost Explorer の API は 1 要求 0.01 USD（主の請求ビュー。
独自の請求ビューはソースごとに 0.01 USD）。応答がページに分かれれば 1 ページが 1 要求（FAQ）。時間ごとの粒度は
別料金なので使わない。請求メトリクスの `ServiceName` ではサービスまでしか分からず、**使用の種類（インスタンスの
時間、NAT の GB、EBS の GB-月）、リージョン、タグ、AWS の予測**は Cost Explorer にしか無い。利用者の判断
（2026-11-07）で、削らずに次の形で持つ。

| probe | CLI | 既定の周期 | 1 回の要求数 | 使い道 |
|---|---|---|---|---|
| ce.month G | `ce get-cost-and-usage --granularity DAILY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE`（月初から今日） | 1 日 | 1（ページが分かれれば増える） | サービス別の日ごとの実額 |
| ce.forecast G | `ce get-cost-forecast --granularity MONTHLY --metric UNBLENDED_COST`（今日から月末） | 1 日 | 1 | AWS の予測（予算が無くても） |
| ce.usage G | `ce get-cost-and-usage … --filter SERVICE=<名前> --group-by USAGE_TYPE`（または REGION） | **押したときだけ**（COST の 2 段目で） | 1 | 使用の種類・リージョン別の内訳 |

- **最初に表示したときに尋ねる**（利用者の決定 2026-11-08）: あるアカウントを AWS STATUS で初めて表示したとき、
  上段の下にペインの中の 1 枚（ダイアログではない。ペインは並べて見るものなので）を CRT の点灯で出す:
  「Turn on Cost Explorer for acme-prod? It adds the real amount by usage type and region and AWS's forecast. It is a
  paid API: $0.01 a request.」と、**TURN ON**、**KEEP OFF**、**LATER** の 3 つのボタン
  - **TURN ON と KEEP OFF は同じ重さ**のボタンにする（有料の側だけを塗って押させない）
  - 1 枚の中で頻度（MANUAL · ONCE A DAY · EVERY 12 H）と月の上限を選べる。上限の選びは 1 枚と ⚙ で**同じ 1 つの表**
    （`CE_CAPS`: 10 · 50 · 100 · 200 · 500 · 1,000 要求）で、どこでも**金額と要求数を両方**書く（`$1.00 = 100`）。選びごとに月の見込みを出し（`once a day ≈ 60 requests · $0.60`、`every 12 h ≈ 120 ·
    $1.20`）、**頻度 × 30 日が上限を超えるなら** warn で「the cap would stop it around day 25」と言う。応答が
    ページに分かれた月は、その数も見込みに足す
  - **誰にでも尋ねる**（使えるかを先に確かめる無料の手段が無く、確かめのためだけに有料の要求はしない）。1 枚には
    「Needs Cost Explorer enabled in the Billing console (for a member account, by the payer) and
    ce:GetCostAndUsage.」と書いておく。ON にしたあとの最初の読み取りが拒まれた（AccessDenied）か、Cost Explorer が
    有効でない（AWS は有効にしてからデータが出るまで最大 24 時間と言う）なら、**OFF に戻し**、理由を ⚙ の欄と
    上段の下の 1 行の notice（トーストではない）に出す: 「Cost Explorer refused: this role may not call
    ce:GetCostAndUsage. Turned off.」。この状態は `refused` として持ち、⚙ で ON にし直せる（その 1 回も 1 要求）。
    読み取り専用の SSO ロールでメンバーのアカウントを見る、よくある場合がこれに当たる
  - **ボタンが何をするかを 1 枚に書く**（文なので `--step--1`・`--text-dim`）: 「Keep off: never asked again for this
    account. Later: asked again the next time elecdex starts. Either way, ⚙ changes it.」
  - **答えはアカウントごとに main が持つ**（`aws-billing.json`、`replaceFile`。月の上限と同じ持ち主）。答えた時刻も
    持ち、設定の欄と台帳のカードに「kept off · 11-08」「on since 11-08」と出す。どこか 1 枚で答えたら、同じ
    アカウントを見ているほかのペインの 1 枚も閉じる（main が配る）
  - **LATER** は「アプリを次に起動したあと、1 日に 1 度まで」また尋ねる（main がアカウントごとに持つ）。
    ペインの再マウントやタブの切り替えでは出し直さない（再マウントは起きるので）
  - ペインのフォーカスは奪わない。1 枚が出ている間も、ほかのタブは使える。MASK 中はアカウントの名前を伏せる
  - **畳んで出すのが既定**: 1 枚は 1 行（「Cost Explorer for acme-prod: turn on? · paid, $0.01 a request · TURN ON ·
    KEEP OFF · ▸ more」）で出し、▸ で全文と頻度・上限の選びが開く。一度きりの問いがペインの本体（そのために置いた
    もの）を押し下げないため。TURN ON を 1 行のまま押したら既定（1 日 1 回、100 要求 = $1.00）で ON。幅が 32 rem
    未満なら TURN ON と KEEP OFF だけを残す
  - 1 枚は notice と同じく `crt-on` と `transition:crtPower` で、tests/e2e/contracts/dialogs.ts に行を足す
- OFF のとき、COST タブに「Cost Explorer is off · about $0.60 a month at once a day」と、有効にするボタンを出す
  （押すと同じ 1 枚）。黙って有効にはならない
- **頻度**（ペインの設定）: OFF · MANUAL（REFRESH と、2 段目のボタンでだけ）· 1 DAY（既定）· 12 H。それより短い
  周期は選べない（Cost Explorer のデータは 1 日に数回しか進まず、短くしてもお金がかかるだけ）
- **月の上限**（既定 100 要求 = 1 USD、10〜1,000）: 台帳が今月の Cost Explorer の要求数を数え、上限に達したら
  月が替わるまで呼ばない（「CE CAP REACHED · 100 of 100」）。上限はアカウントごと（同じアカウントのペインが
  いくつあっても 1 つ）で、main が持つ
- **押すと有料のボタン**には値段を書く（`BY USAGE TYPE · $0.01`）。結果は 24 時間持ち、その間は押しても呼ばない
- 1 日の呼び出しは、有効にしたペインが見えていた日の最初の境界（00:00 からのずれ付き）。隠れていた日には呼ばない
- 台帳と足元: `PAID APIs 2 · $0.02 this month · cap $1.00`。型の上の `cost` は `'free' | 'free-tier' | Paid`（設定の鍵・1 要求の値段・上限の鍵を持つ形、cloud-cli.md §2.4）になり、
  **`'paid'` は `PAID_PROBES` の表にあるものだけ**、それぞれ設定の鍵と上限を持つことを、表のテストが縛る
  （cloud-cli.md §2.4）
- 有料で、利用者が選べない時間ごとの粒度・リソースごとの粒度（`--granularity HOURLY`、`get-cost-and-usage-with-resources`）
  は使わない

### 3.4 呼ばないもの（許可リストの禁止の表）

| もの | 理由 |
|---|---|
| Cost Explorer の §3.3 以外（`ce` のほかの操作、時間ごとの粒度、リソースごと） | 有料で、要る理由が無い |
| `cloudwatch get-metric-widget-image`、`get-insight-rule-report`（`get-metric-data` は利用者の決定 2026-11-08 で §14.4a の有料の probe として許す） | 無料枠の外で常に課金 |
| `s3api *`、`s3 *`（`s3api list-buckets` だけは §14.4 で許す案、利用者の決定 2026-11-08） | S3 は LIST 要求を課金する。オブジェクトの一覧と中身は読まない |
| `health *`、`support *`（Trusted Advisor） | Business 以上のサポートプランが要る |
| `logs *`（`describe-log-groups` だけは §14.4 で許す案、利用者の決定 2026-11-08） | 読んだデータ量に課金しうる（Logs Insights）。ログの中身はそもそも読まない |
| `ssm get-parameter*`、`secretsmanager *`、`kms decrypt` | 秘密を読む。費用以前に読まない |
| 書き込みのすべて | 非目的 |

### 3.5 重さ（実測 2026-11-07、AWS CLI 2.39.6、i5-1335U、Windows 11）

| | 時間 | CPU | メモリ |
|---|---|---|---|
| `aws --version` | 0.45〜0.50 秒 | — | — |
| `sts get-caller-identity` | 1.20〜1.37 秒 | 0.59 秒 | — |
| `ec2 describe-regions` | 約 1.2 秒 | — | 最大 95 MB |
| 7 種の読み取り（iam、freetier、cloudwatch、ec2） | 1.2〜2.1 秒 | — | — |

1 ペイン・3 リージョンで §3.1 を回すと、1 時間におよそ 3 × (12 × 2 ＋ 4 ＋ 10) ＋ 15 ≒ 130 回、CPU 約 77 秒
（1 コアの約 2%、1 時間の平均）。ずれ（cloud-cli.md §3.1）で塊を避ける。実装の最初に、この数を実物の
アカウントで測り直して decisions.md に書く。

### 3.6 最新の CLI で確かめたこと（2026-11-07、AWS CLI 2.39.6 = 最新のタグ）

同梱のヘルプ（`aws <service> <operation> help`）と、この機械のアカウントでの読み取り（無料のものだけ）で確かめた。

| 確かめたこと | どうなっていたか |
|---|---|
| サインインの種類 | `aws configure list` の TYPE が `login`: 2025 年に入った `aws login`（コンソールの資格情報。CLI が更新用のトークンで自分で更新し続ける。置き場所は `AWS_LOGIN_CACHE_DIRECTORY` で変えられる） |
| 期限切れの文（2026-11-08 に実物で出た） | `aws: [ERROR]: Unable to refresh login credentials because of a change in your password. Please reauthenticate with your new password using 'aws login'.` → SIGNED OUT、`aws login --profile=<名前>` をコピーさせる |
| 拒否の文 | 終了コード 254、`User: arn:aws:… is not authorized to perform: freetier:GetAccountPlanState on resource: arn:…`。ARN を 2 つ含む |
| `freetier get-account-plan-state` | `accountPlanType`、`accountPlanStatus`、`accountPlanRemainingCredits.amount`、`accountPlanExpirationDate` |
| `freetier get-free-tier-usage` | 旧プランのアカウントで、サービス・使用の種類・実績・上限が返った |
| 請求メトリクス | `get-metric-statistics` の日ごとの最大で 11 月の 7 点 |
| `budgets describe-budgets` | `--account-id` 付きで予算の名前と上限 |
| `cloudtrail lookup-events` | 1 ページ最大 50（`--page-size` の max 50）、「毎秒 2 要求まで」とヘルプに明記。件数は `--max-items` |
| `acm list-certificates` | 既定は RSA_2048 だけ、ACME のものは返さない（`--includes` で鍵の種類と `CertificateKeyPairOrigins`） |
| `eks describe-cluster-versions` | `endOfStandardSupportDate` と `status` がある。`describe-cluster` に `upgradePolicy` |
| `guardduty get-findings-statistics` | `--group-by SEVERITY`（`--finding-statistic-types COUNT_BY_SEVERITY` は古い形） |
| `rds describe-db-instances` | `EngineLifecycleSupport` がある |
| `cloudwatch describe-alarms` | `--alarm-types CompositeAlarm MetricAlarm`（付けないと複合を返さない） |
| `ec2 describe-instances` | `InstanceLifecycle`（spot を除く） |
| `ec2 describe-instance-status`、`savingsplans describe-savings-plans --states`、`route53domains list-domains`（`AutoRenew`）、`backup list-backup-jobs --by-state`、`ec2 describe-account-attributes --attribute-names`、`ecs describe-services`（`runningCount`）、`iam generate-credential-report`（`State`） | どれもヘルプにある |
| 実行ファイルの場所 | 利用者ごとのインストールは `%LOCALAPPDATA%\Programs\Amazon\AWSCLIV2\aws.exe`（全員のものは `%ProgramFiles%\Amazon\AWSCLIV2\`）。**インストール直後、すでに動いていたプロセスの `PATH` には入っていなかった**（ユーザーの `PATH` には入っていた） |

### 3.7 費用の根拠（実装前に確かめる）

公式の料金ページで実装の直前に確かめ、decisions.md に日付と URL を書く: CloudWatch（無料枠と除外の 3 操作）、
Cost Explorer（API 1 要求の価格）、Budgets（監視と通知は無料）、Free Tier API（2023-11 の発表で「追加料金なし」、
`GetAccountPlanState`）、S3（LIST の価格）、GuardDuty・CloudTrail・Route 53 Domains・Savings Plans・Backup の
読み取りに値段が無いこと。

## 4. 判定（純粋）

### 4.1 ATTENTION（`shared/aws/attention.ts`）

しきい値は `AWS_LIMITS` に名前で持ち、カードがその値を引く（Wi-Fi の `WIFI_LIMITS` と同じ）。

| 重さ | 札 | 条件 |
|---|---|---|
| danger | ALARM | アラームが ALARM（複合も） |
| danger | HEALTH | インスタンスの状態の確認が impaired、ECS のサービスが running 0 で desired > 0 |
| danger | STACK | スタックが `*_FAILED` / `UPDATE_ROLLBACK_FAILED` |
| danger | SECURITY | ルートに MFA が無い・アクティブなキーがある・直近 24 時間にルートが使われた、GuardDuty の重さ 7 以上、22 / 3389 / 全ポートが世界に開いた SG がインスタンスに付いている |
| danger | EXPIRY | 使われている証明書・ドメインが 7 日以内に切れる、または切れている |
| warn | EXPIRY | IMPORTED の証明書が 30 日以内、AMAZON_ISSUED が 30 日以内（＝自動更新が 60 日前に済んでいない）、ドメインが 30 日以内で自動更新が OFF、RI / SP が 30 日以内、アクセスキーが 90 日より古い、RDS の強制適用日が 14 日以内 |
| warn | SUPPORT | EKS の標準サポートの終了まで 90 日以内（`describe-cluster-versions` の日付）、Lambda のランタイムが 90 日以内（同梱の表、確かめた日付付き） |
| warn | COST | 付いていないボリューム（GiB）、付いていない EIP、30 日より前に止めたインスタンス（EBS の課金は続く）、**延長サポート中の EKS / RDS**（標準のおよそ 6 倍の料金になる） |
| warn | BUDGET | AWS の予測が予算の 100% を超える、実績が 80% を超える |
| warn | HEALTH | ECS のサービスが running < desired、失敗したバックアップ（24 時間） |
| warn | SECURITY | コンソールで入れるのに MFA の無い IAM ユーザー、同じ操作の AccessDenied が 15 分に 10 回以上（ACTIVITY から） |
| warn | QUOTA | vCPU か EIP の使用が上限の 80% を超える |
| warn | PLAN | 無料のクレジットが 20% を切った・30 日以内に切れる、旧プランの無料枠が 85% を超えた |

- 行の並び: 重さ、次に札、次に古いもの。読み直しで動かさない（cloud-cli.md §7）
- 行を押すと、そのリソースのドリルダウンの 3 段目へ（§5）。↗ はコンソールを開く（§7）

### 4.2 ACTIVITY と PULSE（`shared/aws/trail.ts`）

- CloudTrail のイベントの履歴は**平均 5 分ほど遅れて届き、保証も無い**。1 回に 50 件まで、条件は 1 つ、
  リージョンごとに毎秒 2 要求まで
- 残す欄（`--query` で取る）: 時刻、操作名、サービス、リージョン、`userIdentity` の種類と名前（ユーザー名か
  ロールのセッション名）、`errorCode`、それとコンソールのサインインのための 2 つだけ:
  `responseElements.ConsoleLogin`（Success / Failure）と `additionalEventData.MFAUsed`。ほかの
  `requestParameters` と `responseElements` は来ない
- `AWSService`（AWS 自身）の操作は落とす（自動化の雑音）
- 目立たせるもの: ルートの使用、MFA の無いコンソールのサインイン、IAM・セキュリティグループ・KMS の変更、
  AccessDenied の連なり、失敗したサインイン
- 50 件に達したら「50 shown · older ones not read」と言う
- 自分の読み取りは ReadOnly=true なので、この絞り込みには出ない

### 4.3 変化（`shared/aws/changes.ts`、ACTIVE の上の行）

在庫の表は、数だけでは毎日同じで見なくなる（レビュー）。そこで今日最初に読んだ id の集合（cloud-cli.md §3.3）と
いまの集合の差を出す: 「+2 EC2 (web-3, web-4) · −1 NAT · since 09:12」。新しく止まったインスタンス、新しく
外れたボリュームも差として出す。追加の呼び出しは無い。

## 5. ドリルダウン（BI のように掘る）

利用者の指定（2026-11-07）。どのサービスも同じ 3 段で掘れる。**どの段もペインの中で開き、ダイアログは
使わない**（ペインは並べて見るものなので）。

```
1 段目  ACTIVE（動いていて料金の発生しているもの、サービス別）／ COST（サービス別の今月）
   │ サービスの行・セルを選ぶ
2 段目  サービス: 集計の棒（ファセット）と、並べ替えられる一覧
   │ 棒を押すと絞り込み（クロスフィルタ）、行を選ぶと
3 段目  1 件: 欄の表、関係するもの（横へ掘れる）、注意、HISTORY（そのリソースの CloudTrail）
```

### 5.0 ACTIVE: 動いていて料金の発生しているもの（1 段目）

利用者の指定（2026-11-07）: 「EC2 を実は立ち上げっぱなしだった」「S3 に大容量のデータがある」が見える
ダッシュボード。在庫の数を並べるのではなく、**いまお金を使っているもの**を、推定の額の大きい順に並べる。

- **上: メーター**（大きな数字 2 つと 1 本の帯）: `≈ $0.86 / h now` と `≈ $627 / month at this rate`（いま動いている
  ものを定価のまま 1 か月動かしたら）。その下に、サービス別の割合を 1 本の積み上げの帯で（EC2・RDS・NAT・S3・
  EBS・EKS・ELB・EIP…）。帯の区切りを押すとそのサービスの 2 段目へ。右に「billing metric this month $412」を並べ、
  推定と実額がずれていれば（割引・無料枠・データ転送）そう言う
- **下: サービスの行**（推定の月額の大きい順。0 のサービスは「NOT BILLING NOW」の淡い 1 行にまとめる）:
  サービス名、動いているもの（`17 running`）、**IDLE / WASTE の数**（warn）、推定の月額の棒と額、リージョンの
  内訳の小さな点（ランプの色）、今日の変化（`+2`）。行を押すと 2 段目
- **何を「動いていて料金の発生しているもの」と数えるか**（`activeCost`、純粋。単価は `prices`）:

| サービス | 数えるもの | 推定 | IDLE / WASTE |
|---|---|---|---|
| EC2 | running のインスタンス（spot を除く） | 型の On-Demand 単価 × 時間 | IDLE: 7 日の CPU 平均 2% 未満かつ最大 10% 未満で動き続けている。WASTE: 止めて 30 日を超え EBS だけ課金 |
| EBS | すべてのボリューム（GiB × 種類、io2 は IOPS も） | GB-月の単価 | WASTE: 付いていない、止めたインスタンスに付いたまま 30 日 |
| S3 | バケットの容量（保存クラスごと、CloudWatch の `BucketSizeBytes`） | クラスごとの GB-月の単価（要求と転送は数えない） | 大きいもの上位 5 つを行のカードに。WASTE: 判定しない（中身を見ないので） |
| Snapshots | 自分のスナップショットの合計 GiB | GB-月（実際の課金は差分なので上限の見積もりと書く） | WASTE: 元のボリュームが無いもの |
| NAT | available の NAT ゲートウェイ | 時間の単価（処理した GB は数えない） | — |
| EIP | すべてのパブリック IPv4（付いているものも課金） | 時間の単価 | WASTE: 付いていない |
| ELB | active のロードバランサー | 時間の単価（LCU は数えない） | IDLE: ターゲットが 0（2 段目で読む） |
| RDS | available のインスタンス | クラスの単価 × 時間（マルチ AZ は 2 倍）、延長サポートの上乗せ | WASTE: 延長サポート。止めた RDS は 7 日で自動で起動し直すと注記 |
| EKS | クラスタ | 時間の単価（延長サポートは 6 倍） | WASTE: 延長サポート |
| ECS（Fargate） | 動いているタスクの vCPU と GB | vCPU 時・GB 時の単価 | — |
| Lambda・DynamoDB（オンデマンド）など | 使った分だけのもの | 推定しない（「usage-based」と書き、実額は COST） | — |

- 推定は**定価（On-Demand、Linux、共有テナンシー）**で、Savings Plans・RI・無料枠・割引・データ転送・要求の
  料金は入れない。数字の頭に必ず `≈` を付け、メーターのカードにそう書く。単価は Price List から週に 1 度、
  使っている型・クラスだけ（§3.1 の prices）。**Price List の API に値段があると分かったら、同梱の単価の表
  （`shared/aws/list-prices.ts`、リージョンと型ごと、確かめた日付と出典付き、リリースの手順で更新）に替える**
  （利用者の決定 2026-11-08）。どちらで読んだかを下部に書く。同梱の表は新しい同梱のデータなので、README の第三者の表と
  `DATA_SOURCES` に行を足し（3 か国語）、AWS の価格の公開の条件を確かめる。Price List の API に値段があるかは公式の
  記載が見つからず（2 度のレビューでも）、実装の前に確かめて decisions.md に日付と出典を書く
- **下部に推定であることを明記する**（利用者の決定 2026-11-08）: ACTIVE の一覧の下に、**スクロールしても動かない
  1 行**（一覧の外、足元の台帳の上）を読む大きさ（`--step--1`、文の形）で: 「≈ Estimates at list prices, not your
  bill · Price List, 11-05 ⓘ」。ⓘ に留まるとカードで全文（「On-Demand list prices for what is switched on. Savings
  Plans, RIs, the free tier, discounts, data transfer and requests are left out. The bill is under COST.」）。出どころは
  **使っているほうだけ**を書く（Price List なら読んだ日、同梱の表なら「prices shipped with elecdex, checked
  2026-11-07」）。2 段目・3 段目でも金額の列がある間は同じ 1 行を固定で出す
- 行に留まるとカード: そのサービスで額の大きい上位 5 件（名前、動いている時間、推定の月額）
- 2 段目（ACTIVE › EC2）の一覧には「running for」（最後に起動してからの時間）、「≈ $/month」、7 日の CPU の細い線
  （1 日ごと 7 点、`get-metric-statistics` の結果。グラフ用に GetMetricData は使わない）が加わり、既定の並びは
  推定の月額の大きい順。ファセットに ACTIVITY（running · idle · stopped）が加わる

### 5.1 道しるべ

- タブの行の下に**パンくず**: `ACTIVE › EC2 › ap-northeast-1 › web-1`。各段は押して戻れる。左端に ‹（1 段戻る）
- キーボード: 一覧の中で Enter が 1 段下へ、Escape か Backspace が 1 段上へ（LOG WATCH の Escape と同じく、
  ペインの中にフォーカスがあるときだけ。全体のショートカットではない）
- 段を移るたびに CRT の点灯（タブの切り替えと同じ）。下へは上から、戻るときは下から点く
- いまの段（サービス、リージョン、絞り込み、並べ替え、id）はペインの状態に持つ。再マウントしても同じ所に
  戻る。id は main の直前の一覧にあるものだけが効く（無ければ 2 段目に戻り「gone since 14:05」と言う）
- 3 段目からは「関係するもの」で横へ移れる（インスタンス → そのボリューム → そのスナップショット）。
  パンくずは横へ移った道を残す（最大 5 つ、それより前は `…`）

### 5.2 2 段目: サービス

- **上: ファセットの棒**（横棒、2〜4 本の群）: サービスごとに決めた切り口（EC2 なら STATE・TYPE・AZ・
  PLATFORM、EBS なら STATE・TYPE・SIZE の階級、Lambda なら RUNTIME・MEMORY・LAST MODIFIED の階級）。数と割合。
  **棒を押すとその値で一覧を絞り、ほかの群の棒もその絞り込みで数え直す**（クロスフィルタ）。もう一度押すと
  外す。絞り込みはパンくずの横に札で並び、× で外せる
- **下: 一覧**: 列の見出しを押すと並べ替え（▲▼）。列はサービスごとの表（`shared/aws/drill.ts` の `DRILL`）で、
  幅に応じて後ろから落とす。行の左縁は §4.1 の重さ。数の列は右寄せで、最大値に対する細い棒を背に引く
  （BI の表の中の棒）
- 足元: 「214 instances · 37 shown · read 14:05 · next 15:00」
- ファセットと絞り込みと並べ替えは純粋関数（`facets(rows, def, filters)`、`sortRows`）で、ページの中で計算する
  （main からは一覧が 1 度来るだけ）。一覧は `--max-items 1000` まで。超えたら「1,000 of at least 1,000」

### 5.3 COST の掘り方

- 1 段目（COST タブ）: 今月の見込み額、先月の同じ日まで、予算と AWS の予測、そしてサービス別の今月の棒
  （請求メトリクスの `ServiceName` 次元、`billsvc`、無料枠）。棒は高い順、上位 12 と OTHER。Cost Explorer を
  有効にしていれば、棒は Cost Explorer の実額（1 日前まで）に替わり、AWS の予測を添える
- 2 段目（サービスを選ぶ）: そのサービスの月の日ごとの累計と、先月の同じ曲線（破線）、先月の同じ日との差。
  ACTIVE で同じサービスの推定（≈）を並べる
- 3 段目（使用の種類・リージョン）: **Cost Explorer が要る**。OFF なら「Cost Explorer is off」と、有効にする
  ボタン。ON なら「BY USAGE TYPE · $0.01」「BY REGION · $0.01」のボタン（押したときだけ呼び、24 時間持つ、§3.3）
- タグ・リソースごとの内訳は CUR（Cost and Usage Report）が要り、このペインは読まない。「Billing console ↗」
- 請求メトリクスは数時間ごとにしか進まない。直線の延長は**丸 1 日のデータだけ**で傾きを取る

### 5.4 3 段目: 1 件

- **上: 名前と状態**（大きく、ランプ付き）、種類、リージョン / AZ、年齢
- **欄の表**: サービスごとに決めた欄だけ（EC2: id、型、状態、起動、プラットフォーム、VPC / サブネット、
  プライベート IP（MASK で伏せる）、パブリック IP の有無、SG の数、IMDSv2 の要否、付いているボリュームの数と合計
  GiB、`Name` タグ）。**ほかのタグ、ユーザーデータ、セキュリティグループの規則、ポリシーの本文、環境変数は
  読まない**
- **関係するもの**: 種類ごとの小さな表で、押すとそのリソースの 3 段目へ（横へ掘る）
- **このリソースの注意**: §4.1 のうち、このリソースに当たるもの
- **HISTORY**（押したときだけ読む）: そのリソースの CloudTrail の直近 50 件を、時刻・誰か・操作・結果で
- **↗ CONSOLE**: そのリソースのコンソールを開く（§7）

### 5.5 掘れるサービスと切り口

| サービス | 2 段目のファセット | 一覧の列 | 3 段目の関係するもの |
|---|---|---|---|
| EC2 | ACTIVITY · STATE · TYPE · AZ · PLATFORM | 名前、id、型、状態、AZ、running for、CPU 7 日、≈ $/月 | ボリューム、EIP、SG（名前と、世界に開いているか）、アラーム |
| S3 | REGION · CLASS · SIZE | バケット（MASK）、リージョン、GB、オブジェクト数、主な保存クラス、≈ $/月 | 保存クラスごとの容量、30 日の容量の推移（日ごと） |
| EBS | STATE · TYPE · SIZE | id、名前、GiB、型、状態、付いている先、作成 | インスタンス、スナップショット（数と最新） |
| EIP | ASSOCIATED · DOMAIN | アドレス（MASK）、付いている先 | インスタンス / NAT |
| RDS | ENGINE · CLASS · STATE · SUPPORT | 名前、エンジンと版、クラス、状態、マルチ AZ、延長サポート | 保守の予定、スナップショット（数）、アラーム |
| Lambda | RUNTIME · MEMORY · MODIFIED | 名前、ランタイム、メモリ、最終更新 | アラーム、サポート期限 |
| ECS | CLUSTER · LAUNCH TYPE · HEALTH | サービス、クラスタ、running / desired、起動種別 | タスク定義の版、アラーム |
| EKS | VERSION · SUPPORT | クラスタ、版、サポートの期限、延長か | ノードグループ（`list-nodegroups` → `describe-nodegroup`） |
| ELB | TYPE · SCHEME | 名前、種類、スキーム、状態 | ターゲットグループの数 |
| NAT | STATE · CONNECTIVITY | id、VPC、状態 | VPC、EIP |
| VPC | DEFAULT | id、名前、CIDR | サブネット（`describe-subnets`）、NAT |
| Stacks | STATUS | 名前、状態、最終更新、ドリフト | 直近のスタックイベント（`describe-stack-events`、失敗の理由） |
| ACM | TYPE · KEY · IN USE | ドメイン（MASK）、期限、種類 | 使っているもの（ARN の種類だけ） |
| Snapshots | AGE | id、ボリューム、GiB、作成 | ボリューム |
| Alarms | STATE · NAMESPACE | 名前、状態、メトリクス、更新 | 見ているリソース |

### 5.6 コストの QUOTA（金額を超えたらトースト）

利用者の指定（2026-11-08）: あらかじめ決めた金額を超えたらトーストで知らせる。既定は 0（OFF）。

- **何と比べるか**: 今月ここまでの見込み額（請求メトリクス `EstimatedCharges` の月初からの最大。無料枠、6 時間ごと）。
  月末の予測ではない（予測が QUOTA を超えたら知らせる段は「後で」、利用者に確かめる）
- **通貨**: 請求メトリクスは **USD**（`Currency=USD` の次元。請求書を円で受け取っていてもメトリクスは USD）。QUOTA も
  USD で決め、設定の欄にそう書く。`list-metrics` が USD 以外の通貨を返すアカウントでは QUOTA を断る
- **月は AWS の月（UTC）**: 請求メトリクスは UTC の 1 日 00:00（日本では 9:00）に 0 に戻る。段の数え直しも UTC の月で、
  UTC の月初より後の点だけを使う（日本の 0 時に数え直すと、先月の合計で 1 日の朝に誤ったトーストが出る）
- **設定**（アカウントごとに main の `aws-billing.json`）: QUOTA（USD、0 = OFF、既定 0）と、知らせる段（既定は 80% と
  100%。100% だけにもできる）
- **トースト**: 見込み額が段を初めて超えたとき、その月（UTC）に 1 度ずつ。「acme-prod passed 80% of its $1,000 quota ·
  $812 this month」。100% は danger、80% は warn
  - **知らせた段は月ごとに `aws-billing.json` に持つ**（メモリだけだと、起動のたびに同じ段をまた知らせる）
  - すでに超えている状態で QUOTA を決めたら、いちばん上の段を 1 度だけ。QUOTA を上げたら段を数え直す
  - 値が下がっても（クレジット、返金）知らせ直さない
  - 送り先は §12.5（cloud-cli.md）と同じ: ウィンドウが前ならページのトースト、前に無ければ OS の通知
- **読むのは見えている間だけ**（利用者の決定 2026-11-08）: ペインが見えている間の `billing` probe（6 時間ごと、見えた
  ときに 6 時間より古ければすぐ）の結果で比べ、段を超えていればその時点でトースト。隠れている間は読まない
  - 隠れていた間に段を超えていたら、見えたときの最初の読み取りで 1 度トーストする（段は月ごとにディスクにあるので、
    起動し直しても繰り返さない）
  - SIGNED OUT のあいだは比べられない。MTD の横に「quota not checked since 09:00」と出す（トーストはしない）
- **支払いのアカウント**では、`LinkedAccount` の次元の無い `EstimatedCharges` は組織全体の請求になる。欄に「On the
  payer account this is the whole organization's bill.」と書く（メンバーのアカウントを個別に見る `LinkedAccount` は後で）
- **SLOW ×4** を選んでも `billing` は 6 時間のまま（請求メトリクスが進むのが 1 日に
  数回なので、これより延ばすと知らせが 1 日遅れる）
- COST のゲージの目盛りは、選んだ段に従う（「100% only」なら 80% の目盛りを描かない）
- **遅れと限界を書く**: 欄に「Checked every 6 hours while this pane is shown: a toast can come half a day after the money
  was spent, or later if the pane is not shown. AWS Budgets
  is the alarm AWS keeps; this one is elecdex's own, on screen.」
- **画面**: 上段の MTD に QUOTA を並べる（`$824 · 82% of quota $1,000`、80% で warn、100% で danger）。COST の 1 段目に
  QUOTA のゲージ（予算のゲージとは別: 予算は AWS Budgets のもの、QUOTA は elecdex の中だけのもの）。カードで違いを言う
- **使えないとき**: 請求メトリクスが無い（billing alerts が OFF）なら入力を無効にし、理由を出す。メンバーの
  アカウントは、支払いのアカウントが billing alerts を ON にしていないとメトリクスが無い（CloudWatch の文書）。
  そう言う。新しい無料プランのアカウントでメトリクスがクレジットを差し引くかは未確認: 実装の前にクレジットのある
  アカウントで確かめ、引かないなら欄に書く

## 6. 画面

モックのとおり。上から:

- **見出し（PaneHost）**: `AWS STATUS`、subtitle に `prod-readonly · acme-prod (4829-1350-7216)`、badge にいちばん重い
  もの（「1 alarm」「AWS incident」「over quota」）か §4 の語
- **上段**: ◆ランプと語、ALARMS、ATTENTION（danger · warn）、**MTD**（`$824 · forecast 110% of budget`。QUOTA が
  あれば `· 82% of quota`。押すと COST タブ）、
  リージョンのランプの選び（`ALL · ap-ne-1 · us-e-1 · eu-w-1`。1 つだけ選ぶ絞り込みで、各ランプはその
  リージョンのいちばん重い注意の色）、右端に MASK・REFRESH・⚙
- **障害の帯**（AWS の公開ステータスに障害があるときだけ、1 行。cloud-cli.md §12）
- **Cost Explorer の 1 枚**（このアカウントを初めて表示したときだけ。§3.3）
- **帯 ACCOUNT PULSE**（このペインの印。2D canvas 1 枚、文字は HTML。高さが足りないときと設定で消える）:
  直近 24 時間、15 分ごと 96 本。書き込みの操作を刻み、エラーと拒否を danger、コンソールのサインインを info の
  菱形、いま鳴っているアラームを鳴り始めた時刻から今までの danger の帯で描く。右端の 15 分は「CloudTrail の
  遅れ」（平均 5 分、保証なし）として淡く描き、凡例で言う。刻みに留まるとカード（その 15 分の操作の上位）
- **タブ**: ATTENTION (n) · ACTIVE · COST · ACTIVITY · ACCOUNT
- **パンくず**（掘っているとき）と**絞り込みの行**（ACTIVITY の ALL · WRITES · LOGINS · ERRORS、2 段目の札）
- **本体**: §4、§5
- **足元**: 台帳（cloud-cli.md §3.2）

### 6.1 幅と高さによる組み替え

- wide（56 rem 以上）: 上段に全部、2 段目のファセットは 4 群を横に
- medium: MTD は数字だけ、ファセットは 2 群ずつ 2 行、一覧のリージョンの列を落とす
- narrow（32 rem 未満）: リージョンのランプは ALL と数だけ（押すと選び）、ファセットは 1 群ずつ（▸ で次）、
  一覧は名前・状態・数の 1 つだけ
- 低い（30 rem 未満）: 帯を落とす

### 6.2 何も無いとき

- ATTENTION が 0 件: 「nothing needs attention · 31 checks across 3 regions」（空であることに意味がある）
- 請求メトリクスが無い: COST タブと MTD に「billing alerts are off · Billing preferences → Receive CloudWatch
  billing alerts（free）」。Budgets はそれでも出る
- NO CLI: 中央の 1 枚（cloud-cli.md §7）

## 7. コンソールを開く

- ↗（行と 3 段目）を押すと、ページは `aws.open(itemId)` を送るだけ。main が直前の読み取りからリソースの種類・
  リージョン・id を引き、`consoleUrl`（純粋）で `https://<region>.console.aws.amazon.com/...` を組み、ホストが
  `console.aws.amazon.com` か `<region>.console.aws.amazon.com` であることを確かめて開く。単体テストが全種類の
  URL を確かめる
- コンソールのサインインはブラウザーのもの（CLI の資格情報は渡らない）。カードにそう書く

## 8. 設定（ペインごと）

**このペイン**（ペインの状態）: PROFILE（一覧から）、REGIONS（4 つまで）、PULSE（ON / OFF）、ACTIVITY（ON / OFF。
CloudTrail を呼ばない）、SLOW（周期 4 倍）。MASK、タブ、ドリルダウンの位置。

**このアカウント**（main の `aws-billing.json`、同じアカウントのペインで共有）:

- **COST EXPLORER（有料）**: OFF · MANUAL · 1 DAY · 12 H と、月の上限（10〜1,000 要求、既定 100）。最初に表示したときに
  尋ねる（§3.3）。欄には、いまの頻度での月の見込み（「≈ 60 requests · $0.60 a month」）と今月の実績を並べる
- **COST QUOTA**: USD、0 = OFF（既定）、知らせる段（80% と 100% / 100% だけ）（§5.6）

**AWS STATUS 全体**（settings.json の `aws`、全ペインで共有）:

- **`aws.incidents`**: `notify`（AWS の公開ステータスに障害が出たらトースト、既定 ON）、`system`（ウィンドウが前に無いときは OS の通知、既定 ON）、`minSeverity`（既定 warn）（cloud-cli.md §12）

全体の設定は最後のものだけ。プロファイルの鍵、ARN、結果は持たない。

## 9. 要る権限（最小のポリシーを作る人のため）

`sts:GetCallerIdentity`、`iam:ListAccountAliases`、`iam:GetAccountSummary`、`iam:GenerateCredentialReport`、
`iam:GetCredentialReport`、`cloudwatch:GetMetricStatistics`、`cloudwatch:ListMetrics`、`cloudwatch:DescribeAlarms`、
`budgets:ViewBudget`、`freetier:GetAccountPlanState`、`freetier:GetFreeTierUsage`、`ec2:Describe*`、
`elasticloadbalancing:Describe*`、`rds:Describe*`、`lambda:ListFunctions`、`ecs:List*`、`ecs:Describe*`、
`eks:List*`、`eks:Describe*`、`cloudformation:ListStacks`、`cloudformation:DescribeStackEvents`、
`acm:ListCertificates`、`route53domains:ListDomains`、`savingsplans:DescribeSavingsPlans`、`backup:ListBackupJobs`、
`servicequotas:GetServiceQuota`、`guardduty:ListDetectors`、`guardduty:GetFindingsStatistics`、
`cloudtrail:LookupEvents`、`pricing:GetProducts`。Cost Explorer を有効にするなら `ce:GetCostAndUsage`、
`ce:GetCostForecast`。ガイドの data-sources.md にこの表を載せる。RESOURCES（§14）は加えて `s3:ListAllMyBuckets`、`logs:DescribeLogGroups`、`dynamodb:ListTables`・`DescribeTable`、`sqs:ListQueues`・`GetQueueAttributes`、`sns:ListTopics`・`ListSubscriptions`、`apigateway:GET`、`cloudfront:ListDistributions`、`bedrock:List*`・`bedrock:GetKnowledgeBase` 相当の `bedrock-agent` の List・Get、`bedrock-agentcore:ListAgentRuntimes`、`aoss:ListCollections`・`BatchGetCollection`、`eks:ListNodegroups`・`ListFargateProfiles`、`elasticloadbalancing:DescribeTargetHealth`。

## 10. ページに渡すもの

- 各 probe の `--query` が残したものだけ: 数、状態、短い id、名前（`Name` タグだけ）、日付、リージョン、
  決めた欄
- CloudTrail は §4.2 の欄だけ。セキュリティグループは判定（開いているポートの種類）だけ
- アカウント ID と ARN は渡す（見出しに要る）。MASK はページで伏せる（cloud-cli.md §7 の一覧）

## 11. 後で

複数プロファイルを 1 枚に（測ってから）、Cost Optimization Hub と Compute Optimizer の提案（無料だが登録が要る）、
CUR による資源ごとの実額、Security Hub、IAM Access Analyzer の外部アクセス、Compute Optimizer の提案、
Organizations の横断、SSO・login のセッションの残り時間、QUOTA を円で決める（為替の取得が要る）。
RESOURCES の追加の候補（§14.9）。

## 12. 利用者の決定（2026-11-08、§0 にも）

- 名前は AWS STATUS、1 ペイン 1 プロファイル
- Cost Explorer は、そのアカウントを最初に表示したときに尋ねる（§3.3）
- Price List が有料なら同梱の単価の表。ACTIVE の下部に推定であることを明記（§5.0）
- 公開ステータスは障害のときだけ、トーストは設定で（既定 ON）（cloud-cli.md §12）
- コストの QUOTA、既定 0 = OFF（§5.6）。メトリクスが USD なので QUOTA も USD

## 13. テスト

[cloud-cli.md](cloud-cli.md) §9 に加えて: 判定（`attention.test.ts`: 各条件の境目、同梱の表の古さ、並び）、
`changes.test.ts`、`activeCost.test.ts`（数えるもの・数えないもの、マルチ AZ、延長サポート、IDLE の境目、
spot を除く、単価が無い型）、Cost Explorer（既定 OFF、頻度、月の上限で止まる、ページの数え方、24 時間の持ち）、
ドリルダウンの純粋関数（ファセットとクロスフィルタ、並べ替え、パンくずの道、消えた id）、
請求の解析（月の切り替わり、丸 1 日だけの傾き、メトリクスが無いとき、サービス別）、Free Tier の 2 つのプラン、
認証情報レポートの CSV、CloudTrail の解析（決めた欄だけ、AWSService を落とす、ConsoleLogin の失敗と MFA）、
`consoleUrl`、禁止の表。e2e は `aws.spec.ts`（代役の `demo` / `signedout` / `mfa` / `partial` / `nobilling` /
`newplan` / `nocli`、ドリルダウンの往復とキーボード）。

## 14. RESOURCES: いま何があり、何を忘れていそうか（2026-11-08、レビュー済み・利用者の決定済み・実装済み、未リリース）

利用者の指定（2026-11-08）: 「アラーム・セキュリティ・期限切れ・課金だけでなく、**アクティブなリソース**（起動している
EC2、作られた S3、有効な CloudWatch Logs など）を、**メインとしてダッシュボード的に**表示したい」「AWS の利用状況・
使用状況をできるかぎりダッシュボード的に。**作ったことを忘れて放置しているもの**を可視化したい」「見やすい UX/UI に
こだわる」。ACTIVE（§5.0）は「お金を使っているものを額の順に」、RESOURCES は**種類と放置**を受け持つ、新しい先頭のタブ。
初版はサブエージェント（Opus 5.5）のレビューで 26 件の指摘を受け、この版で直した（§14.10）。

### 14.0 決めたこと（利用者、2026-11-08）

| 決定 | 中身 |
|---|---|
| 置き場所 | **新しい先頭のタブ RESOURCES**。ペインを開くと最初に出る（ペインの状態にタブが無いとき）。ATTENTION・ACTIVE・COST・ACTIVITY・ACCOUNT はそのまま |
| 新しい読み取り | **CloudWatch Logs**（`logs describe-log-groups`。中身と Logs Insights は使わない）と **S3 のバケット一覧**（`s3api list-buckets`）を、§3.4 の禁止の表から外す |
| 足すサービス | DynamoDB、ECS、SQS と SNS、API Gateway と CloudFront、**Bedrock で使っているもの** |
| 進め方 | 設計とモックをサブエージェントがレビューし、直してから実装 |
| 追加のサービス（レビューの後） | **追加できるものすべて**: VPC のインターフェースエンドポイント、SageMaker、EBS のスナップショットと AMI、ElastiCache・OpenSearch のドメイン・Redshift・Kinesis Data Streams、Transit Gateway のアタッチメント・Site-to-Site VPN・Transfer Family、KMS のカスタマーキー、Route 53 のホストゾーン、ECR（§14.4b）。Secrets Manager は §3.4 の禁止のまま（秘密の API 群には触れない、CLAUDE.md の境界） |
| GetMetricData | **許す**（§3.4 から外す）。有料の probe として台帳に数え、月の上限を持つ（§14.4a） |
| MASK | **RESOURCES のリソース名をすべて**伏せる（§14.6） |
| ATTENTION との重複 | ATTENTION の忘れもの（idle の EC2、付いていない EBS・EIP、止めたままのインスタンス）は、**RESOURCES への 1 行の要約**に替える（§14.1） |

### 14.1 何に答えるか

| 問い | 答える場所 |
|---|---|
| 作って忘れていて、いまお金のかかっているものは | LOOKS FORGOTTEN（§14.2 B、判定は §14.3）。**いちばん上** |
| このアカウントにいま何があるか（サービスごとの数、状態、場所） | 数字の帯とサービスのタイル（§14.2 A・C） |
| 見ていないリージョンに何か残っていないか | ELSEWHERE の 1 行（§14.2 D） |
| このペインが読まないサービスにお金が出ていないか | BILLED, NOT LISTED の 1 行（§14.2 E） |
| この 1 週間で何が増え、何が消えたか | NEW 7 D（§14.2 A） |

非目的は §1 と同じ（変更・停止・削除はしない、中身は読まない）。**「消してよい」とは言わない**: 見えたこと
（何日動きが無いか、何で確かめたか）だけを言い、決めるのは利用者。

**ATTENTION・ACTIVE との関係**（重複を作らない）: 判定は `forgotten.ts` の 1 つの述語、しきい値は `AWS_LIMITS` に
名前で置く。ACTIVE の IDLE / WASTE の数もそれを使い、言葉も 3 か所で同じにする。ATTENTION の COST の行のうち
忘れもの（idle の EC2、付いていない EBS・EIP、止めたままのインスタンス）は、1 行の要約「9 look forgotten ·
≈ $1.6k/mo › RESOURCES」に替える（利用者の決定 2026-11-08）。延長サポートや予算は ATTENTION に残す。タブに留まるとカードで
役割を言う（RESOURCES = 種類と放置、ACTIVE = いまの額の順）。

### 14.2 画面（1 段目）

上から 5 つ。どれも押すと（Enter でも）ドリルダウン（§5）の 2 段目か 3 段目へ。2 段目から戻ると、来たタイルや行に
フォーカスを戻す。

**A. 数字の帯**（4 つ。押せるものは button）:

| 数字 | 中身 | 押すと |
|---|---|---|
| SERVICES `22` | 何かがあるサービスの数。下に `365 resources · 3 regions`（数は小さく: 問いに答えるのは種類と額） | — |
| BILLED BY THE HOUR `≈ $7.11 / h` | 時間課金のもの（EC2 running、RDS、NAT、ELB、EKS、Fargate のタスク、パブリック IPv4、OpenSearch Serverless の OCU、Bedrock の PT…）のいまの推定。下に `39 resources · ≈ $5.2k a month`。カードで何を数えたかを言う | ACTIVE |
| LOOKS FORGOTTEN · BILLING `19` | §14.3 に当たり、お金のかかるものの数（warn）。下に `≈ $2.2k a month · +16 not billing`。額に入らないもの（単価の無い PT）は `+ 1 not priced` と書き足す | B の全件 |
| NEW 7 D `+6 · −2` | 7 日で現れた・消えたもの。下に一番新しいもの | 2 段目、作成日の新しい順 |

- NEW の基準: 作成日の取れる種類（`CreationDate`・`creationTime`・`CreatedTimestamp`・`CreationDateTime`）は作成日、
  取れない種類は main が最初に見た日。**観測を始めた日（最初の起動）は数えない**（すべてが新しくなるので）。Lambda と
  一緒に自動でできるロググループは、その関数に畳む。消えたものは id を `aws-inventory.json` に覚え、消えて 30 日で捨てる

**B. LOOKS FORGOTTEN**（上位 5 行。narrow は 3 行。見出しに `19 billing · 16 not billing · 3 kept`）:
1 行 = 種類の札、名前、**理由の文**（読ませたいので `--text` の色・通常の太さ。色は左の縁だけ）、**quiet for**（`14 d+`・
`120 d`・`unknown` のどれか。時間と出どころを混ぜない）、`≈ $/mo`。並びは **これからの ≈ $/月** の大きい順で、
判定の窓を満たしていないもの（観測を始めて日が浅い）は下げ、静かな日数は同点の決め手。お金のかからないものは後ろ。
danger の縁は種類でなく額で決める（`AWS_LIMITS.forgottenDangerUsd`、既定 $500/月）。右端に `all 35 ›`。行に
留まるとカード: 判定の根拠（`AWS/NAT · no BytesOutToDestination data point in 14 d`）。行の `keep`（button、
読み上げの名前は「keep: I meant to leave it」）で B から外す（§14.3）。行の間は矢印キーで動く。

**C. サービスのタイル**（GITHUB STATUS の REPOS のタイルと同じ型。分類の見出しの下に並べる）:

- 分類と並び: **忘れものの額の大きい分類から**（同じなら固定の順: COMPUTE・STORAGE・DATABASE・NETWORK・AI・
  EDGE & API・INTEGRATION・LOGS）。お金のかからない台帳もの（VPC、ACM、CloudFormation、アラーム）はタイルに
  せず、格子の下に 1 行: `Also here: 6 VPCs · 5 certificates · 27 stacks (1 failed) · 25 alarms (1 in ALARM)`（押すと
  それぞれの 2 段目）
- 1 枚: サービス名、**大きな数と名詞**（`10 running`、`9 buckets`、`152 log groups`）、**状態の細い積み上げ線**、
  リージョンの点、凡例の 1 行、下の行に `n forgotten?`（お金のかかるもの、warn）と `n quiet`（かからないもの、dim）、
  時間課金なら `≈ $/mo`、容量のものは合計
- **タイルの枠が warn になるのは、そのサービスの忘れものの ≈ $ が `AWS_LIMITS.tileWarnUsd`（既定 $50/月）以上の
  ときだけ**（色は「お金がかかる」の 1 つの意味。レビューで 22 枚中 14 枚が warn で壁紙になっていた）
- Bedrock のタイルは 2 段: **使ったモデル**（30 日のトークン、モデルごとの細い棒。表示名は推論プロファイルと
  基盤モデルの一覧で引く）と**置いてあるもの**（PT・カスタムモデル・取り込んだモデル・ナレッジベース・エージェント・
  ガードレール・アプリケーションの推論プロファイル・AgentCore のランタイム）。PT があれば、その額で枠を決める
- 数が 0 のサービスは `Checked, none here: ECS · …`、提供されていないリージョンは数えない（§14.4）、拒否されたものは
  `Denied: dynamodb:ListTables`
- 矢印キーで、その向きのいちばん近いタイルへ（分類をまたいで）。Enter で 2 段目
- 中くらいの高さでは、タイルを **1 行 1 サービスの密な形**（名前・数・状態の線・忘れもの・額）に替える。cloud
  プリセットの実際の高さで A と B が最初の画面に入り、密な形のタイルが続けて見えること

**D. ELSEWHERE**（1 行。見ているリージョンの外にリソースがあるときだけ）: `us-west-2: 1 EC2 running, 1 volume ·
ap-southeast-1: 1 NAT · read 11-05`。外のリージョンは describe だけなので、理由は `running 9 mo · use not read
(region not shown)`。押すと 2 段目。手動の `check other regions now` を 2 段目に置く。

**E. BILLED, NOT LISTED**（1 行）: `Billed this month, not read here: Amazon Kinesis $41.20 · AWS Glue $3.10 › COST`。
請求メトリクスのサービス別（§3.1 の billsvc）を、**ServiceName → タイルの対応表**（`shared/aws/service-names.ts`、
テストで縛る。AmazonEC2 は EC2・EBS・NAT・EIP、AmazonCloudWatch は Logs とアラーム、AmazonVPC は IPv4 と
エンドポイント…）と突き合わせる。読まないと決めたもの（CloudTrail、KMS、Route 53、Config、税、Cost Explorer
自身…）は**除外の表**に入れ、$1 未満は出さない。billing alerts が OFF なら出さない。新しい呼び出しは無い。

**幅と高さ**（§6.1 と同じ境目）: wide はタイル 4 列、medium は 3 列で A の下の行を落とす、narrow は 2 列で B を 3 行・
D と E を数だけに、short（30 rem 未満）は A と B だけ。

### 14.3 「忘れていそう」の判定（純粋、`shared/aws/forgotten.ts`）

- **理由は列挙**（`idle-cpu`・`stopped`・`unattached`・`no-traffic`・`no-requests`・`no-connections`・`empty`・
  `unchanged`・`no-events`・`orphan-log-group`・`unused-capacity`・`dlq-backlog`・`no-subscribers`・`pt-unused`・
  `empty-cluster`・`alarm-orphan`…）で返し、文・札・2 段目のファセットはそこから作る（文字列を分けて作らない）
- **静かさの窓は種類ごとに違い、文に実際の窓を書く**: list-metrics は「過去 14 日にデータ点の無いメトリクスを返さない」
  （CloudWatch の文書）ので `no data 14 d+`、main の記録でそれより長く言えるときは `no data since 10-02`。EC2 の CPU は
  7 日。静かな日数の既定は 30 日（⚙ で 30 · 60 · 90）で、窓が 30 日に満たないものは確信度を下げて並べる
- 「付いていない日数」（EBS・EIP）は、describe に外した時刻が無いので、**main が最初に付いていないのを見た日から**
  数え、そう書く（`not attached since 11-01 (first seen)`）

| 種類 | 判定 | 文の例 | 根拠 |
|---|---|---|---|
| EC2 | running で 14 日中 4 日以上「CPU 10% 以下かつ NetworkOut 5 MB 以下」（Trusted Advisor の低使用率と同じ形）／止めて 30 日超 | `low use 4 of 14 d · 0.4 % CPU`／`stopped 41 d · 100 GiB still billed` | CPU と NetworkOut の日ごと（1 件ずつ、お金のかかる候補だけ） |
| EBS・EIP | 付いていない | `not attached since 11-01` | describe と main の記録 |
| NAT | `BytesOutToDestination` のデータ点が無いか 0 | `no traffic 14 d+` | 1 件ずつ（0 でも出続けるメトリクス） |
| ELB（ALB・NLB・Classic） | ターゲット 0（`describe-target-health`）／`RequestCount`・`ProcessedBytes` が 14 日データ無し | `no targets`／`no requests 14 d+` | list-metrics |
| RDS | `DatabaseConnections` の 30 日の最大 0（保守的: 監視や複製で 1 以上になり見逃すが、誤検知は少ない） | `no connections 30 d` | 1 件ずつ |
| EKS | ノードグループも Fargate プロファイルも無いクラスタ（制御プレーンだけが課金） | `no nodes · control plane billed` | `list-nodegroups`・`list-fargate-profiles` |
| ECS | desired 0 のサービス、サービスの無いクラスタ（低い CPU は使わない: 小さなサービスでは普通） | `desired 0`／`empty cluster` | describe |
| S3 | 一覧にあり容量のメトリクスが無い＝空（**見ているリージョンのバケットだけ**。外は `size not read (region not shown)`）／main の記録で容量と数が 90 日動かず、大半が STANDARD のまま（ライフサイクルが無い兆し） | `empty · created 2 y ago`／`unchanged since 08-10 · 12.4 TB in STANDARD` | list-buckets、s3size、main の記録 |
| CloudWatch Logs | `/aws/lambda/<名>`・`/aws/rds/instance/<id>` などで、元のリソースがもう無い（**呼び出し 0 回で言える**）／`IncomingBytes` が 14 日データ無し、かつ保持が無期限 | `function gone · 38 GB kept forever`／`no events 14 d+ · 124 GB kept forever` | 名前の突き合わせ、list-metrics |
| DynamoDB | プロビジョンドで `Consumed*` が 14 日データ無し（容量の分だけ課金）／オンデマンドで同じ | `provisioned 50/25, unused 14 d+`／`no reads or writes 14 d+` | list-metrics |
| SQS | DLQ（`RedrivePolicy` で見分ける）にメッセージがたまっている → **ATTENTION の HEALTH（warn）**へ、忘れものではない／`NumberOfMessagesSent` が 14 日データ無し（SQS は 6 時間活動の無いキューのメトリクスを出さない: 無い＝0） | `2,140 in dead-letter queue`／`no messages 14 d+` | get-queue-attributes、list-metrics |
| SNS | 購読 0／`NumberOfMessagesPublished` が 14 日データ無し | `no subscribers` | list-subscriptions（数だけ） |
| API Gateway | REST は `Count`（ApiName）、HTTP は `Count`（ApiId）、**WebSocket は `ConnectCount`・`MessageCount`** が 14 日データ無し | `no requests 14 d+` | list-metrics |
| CloudFront | `Requests`（us-east-1、`Region=Global`）が 14 日データ無しで有効のまま | `no requests 14 d+ · still enabled` | list-metrics |
| Lambda | `Invocations` が 14 日データ無し（お金はかからない） | `not invoked 14 d+` | list-metrics |
| Bedrock PT | InService で、その PT の呼び出しが見えない。**PT の呼び出しが ModelId 次元に PT の ARN として出るかは未確認**: list-metrics に PT の ARN か id が無ければ `use unknown` と書き、danger にしない。契約中は `commitment ends 12-03` を添える（契約期間中は消せない） | `PT billed by the hour · no calls seen 14 d+ · commitment ends 12-03` | list-provisioned-model-throughputs、list-metrics |
| Bedrock カスタム・取り込んだモデル | 14 日呼ばれていない（保存の月額） | `custom model unused 14 d+` | list-metrics |
| OpenSearch Serverless | **OCU はコレクションごとでなく、同じ KMS キーの群で共有**。群の OCU は `AWS/AOSS` の `SearchOCU`・`IndexingOCU`（アカウント単位）。コレクションは `SearchRequestRate` が 14 日データ無し | `no searches 14 d+ · shares 4 OCU with 1 collection` | list-metrics、batch-get-collection |
| アラーム | 見ている次元のリソースが、もう一覧に無い（追加の呼び出し無し。1 本 $0.10/月、最初の 10 本は無料） | `watches i-0ab… which is gone` | `describe-alarms`（全状態） |

- **並び**: これからの ≈ $/月が主、窓の確信度と静かな日数が従。額は ACTIVE と同じ単価の表（`list-prices.ts`）。
  **PT の model unit の単価を表に足す**。足せない型は `not priced` とし、A の合計にそう書く
- **KEEP**: B の行と 3 段目で「意図して置いている」と印を付けると B から外れる（タイルには残る）。ページは id だけを送り、
  main は直前の一覧にあるものだけを受ける（新しい IPC、`registerTable` の 1 行）。印は `aws-inventory.json` に
  アカウントとリソースごとに、付けた日とそのときの ≈ $ と一緒に持ち、**額が 2 倍を超えたら解いて出し直す**。数は
  B の見出しに出し、⚙ で一覧と解除

### 14.4 読み取り（§3.1 への追加）

**原則**（レビューの指摘 1〜4）:

- **使われているかは `cloudwatch list-metrics` でまとめて判定する**: 名前空間ごと・リージョンごとに 1〜2 回（500 件
  ずつの頁）で、14 日データの無いリソースが全部分かる。1 件ずつの `get-metric-statistics` は、0 でも出続ける
  メトリクス（RDS `DatabaseConnections`、NAT の `Bytes*`、EC2 の CPU と NetworkOut）で、しかもお金のかかる候補
  だけ。それより長い静かさは、main が毎日の答えから「最後に list-metrics に出た日」を `aws-inventory.json` に持って
  延ばす
- **1 日・6 時間の読み取りはアカウントごと**に main が持ち、`aws-inventory.json` に残す（Cost Explorer の取り分けと
  同じ形）。リージョンの違うペインが 2 枚でも、再起動しても、やり直さない
- **CLI の枠の優先度**: 枠（2 本、両ペインで共有）に 2 段の優先度を付け、alarms・identity・health・trail と GITHUB
  STATUS を先に通す。RESOURCES の一括の読み取りは同時 1 本まで。最初の 1 周は件数の list / describe を先、判定の
  メトリクスを後にし、B は判定が揃うまで `judging… (within 10 min)` と出す
- **提供されていないリージョン**: bedrock・bedrock-agent・bedrock-agentcore-control・opensearchserverless は提供の
  無いリージョンがある。そこでの `Could not connect to the endpoint URL` を OFFLINE に数えない（errors.ts の
  正規表現に当たるので、同じボードのほかの probe が通っているときは `not offered in this region` に分類し、PARTIAL
  にも数えない）。テストを足す
- 新しい費用の区分 **`metered-tiny`**（`PAID_PROBES` の paid ではない）: 固定の上限（月 31 回）、設定なし、利用者の
  決定の日付を持つ。`s3api list-buckets` がこれ。台帳はこの区分で数え、カタログのテストを直す

| probe | CLI（`--query` で残す欄） | 周期 | 費用 | 1 リージョンの回数 |
|---|---|---|---|---|
| buckets G | `s3api list-buckets --query Buckets[].[Name,CreationDate,BucketRegion]`（ディレクトリバケットは出ない。CreationDate は概算として扱い、実物で確かめる） | 1 日 | `metered-tiny`（S3 の LIST の単価で課金されるかは未確認、§3.7 で確かめる） | 1（G） |
| loggroups R | `logs describe-log-groups --query logGroups[].[logGroupName,creationTime,retentionInDays,storedBytes,logGroupClass]` | 6 時間 | API の料金の行が料金表に無い（無料と考えるが未確認、**実装の前に確かめる**） | 1〜2 |
| ddb R | `dynamodb list-tables` → お金のかかる候補（プロビジョンド）を知るための `describe-table`（`--query` で名前・状態・作成日・容量・件数・課金の方式・RCU・WCU・クラス） | 6 時間 | 無料 | 1 ＋ テーブル数（50 まで） |
| ecs R | §3.1 の ecs（`describe-clusters` は数だけ、`describe-services` は desired と running） | 1 時間 | 無料 | 2〜4 |
| eksnodes R | `eks list-nodegroups`・`list-fargate-profiles`（クラスタごと） | 1 日 | 無料 | クラスタ × 2 |
| elbtg R | `elbv2 describe-target-groups` → `describe-target-health`（ターゲット 0 を知る）、`elb describe-load-balancers`（Classic） | 6 時間 | 無料 | 2 ＋ グループ数 |
| sqs R | `sqs list-queues`（URL からキュー名だけ、アカウント ID は落とす）→ `get-queue-attributes --attribute-names ApproximateNumberOfMessages CreatedTimestamp RedrivePolicy` | 6 時間 | SQS の要求（月 100 万の無料枠） | 1 ＋ キュー数（50 まで） |
| sns R | `sns list-topics`、`list-subscriptions --query Subscriptions[].TopicArn`（**宛先は main にも入れない**） | 6 時間 | 管理 API の料金は未確認（料金表の requests は publish と理解） | 2 |
| apis R | `apigateway get-rest-apis`、`apigatewayv2 get-apis`（名前・種類・作成日） | 6 時間 | 無料 | 2 |
| cloudfront G | `cloudfront list-distributions --query DistributionList.Items[].[Id,Enabled,Status,LastModifiedTime,Aliases.Items[0]]` | 6 時間 | 無料 | 1（G） |
| bedrock R | `bedrock list-provisioned-model-throughputs`（`commitmentDuration`・`commitmentExpirationTime` も、1 時間）、`list-custom-models`、`list-imported-models`、`list-inference-profiles`（APPLICATION と SYSTEM_DEFINED: 表示名のため）、`list-foundation-models`（表示名、1 週）、`list-guardrails`、`bedrock-agent list-agents`、`list-knowledge-bases` → `get-knowledge-base`（ベクトルストアをつなぐ）、`bedrock-agentcore-control list-agent-runtimes` | 1・6 時間 | 無料 | 約 10 ＋ KB 数 |
| aoss R | `opensearchserverless list-collections` → `batch-get-collection`（種類・状態・作成日・KMS キー） | 1 時間 | 無料 | 2 |
| quiet R | `cloudwatch list-metrics` を名前空間とメトリクスごとに（AWS/Lambda Invocations、AWS/SQS NumberOfMessagesSent、AWS/SNS NumberOfMessagesPublished、AWS/ApiGateway Count・ConnectCount、AWS/ApplicationELB RequestCount、AWS/NetworkELB ProcessedBytes、AWS/Logs IncomingBytes、AWS/DynamoDB ConsumedReadCapacityUnits、AWS/AOSS SearchRequestRate、AWS/CloudFront Requests は us-east-1） | 1 日 | 無料枠 | 約 10〜15 |
| bedrockuse **全リージョン** | `cloudwatch list-metrics --namespace AWS/Bedrock --metric-name Invocations`（クロスリージョン推論は呼んだ側に出るので、見ているリージョンの外も）→ 見つかったモデルだけ `Invocations`・`InputTokenCount`・`OutputTokenCount` の 30 日 | 1 日 | 無料枠 | 全リージョン × 1 ＋ モデル × 3 |
| lastuse R | 0 でも出続けるメトリクスを、お金のかかる候補だけ 1 件ずつ（NAT、RDS、EC2 の CPU と NetworkOut） | 1 日 | 無料枠 | 候補の数（20 まで） |
| sweep G | 見ていないリージョンごとに `ec2 describe-instances`（running の数と型）・`describe-volumes`・`describe-nat-gateways`・`describe-addresses`（4 種） | **週 1 回**（と手動）。SCP で拒否されたリージョンは黙って飛ばす | 無料 | 13 リージョン × 4 = 52 |

- **回数と時間**（実測の 1 回 1.5〜3.5 秒、CPU 約 0.6 秒、decisions.md）: 1 リージョンの最初の 1 周は、今の約 36 回に
  約 40〜60 回（テーブル・キューの数による）。4 リージョンで約 200 回、同時 1 本で **10 分前後**かけて読む（CPU は
  2 分程度）。2 周目からは、1 時間あたり今の約 1.3 倍、1 日の読み取りは約 80 回。実装の後に実物で測り decisions.md に
  書く。SLOW（×4）はこれにも効く
- **CloudWatch の無料枠**: quiet・bedrockuse・lastuse で 1 日 約 150 回（4 リージョン）＝月 約 5,000 回。今の分と
  合わせて月 100 万の約 4%
- **GetMetricData**（利用者の決定 2026-11-08）で、quiet の後半と lastuse・bedrockuse の 1 件ずつの読み取りを置き換える
  （§14.4a）。list-metrics は「どれがあるか」を知るためだけに残す
- **Resource Explorer** は状態（running か）や大きさを返さないので sweep の代わりにならない。集約インデックスがある
  ときだけ「どのリージョンを読むか」の絞り込みに使う
- 拒否は今と同じく PARTIAL に操作名を出す。`ReadOnlyAccess` が AgentCore と aoss を含むかは未確認: 実装の前に
  ポリシーの版で確かめる

### 14.4a GetMetricData（有料の probe、利用者の決定 2026-11-08）

- **何に使うか**: §14.3 の使用の判定と Bedrock のトークン。list-metrics で見つけたメトリクスを、1 回 500 本まで
  まとめて `cloudwatch get-metric-data` で読む（30 日、1 日ごとの合計か最大）。14 日の窓に頼らず 30 日を直接言える
  （`no data 30 d` / `no traffic 30 d`）。1 件ずつの `get-metric-statistics`（lastuse、bedrockuse の後半、EC2 の CPU と
  NetworkOut、S3 の容量の日ごと）もここに寄せる
- **値段と上限**: CloudWatch の料金は 1,000 メトリクスあたり 0.01 USD（GetMetricData は無料枠の外、§3.4 の理由）。
  1 日 1 回、4 リージョンで 1 日 数百〜2,000 本、月 数万本 ＝ **月 0.1〜0.6 USD 程度**の見込み（実装の後に実物で
  測る）。`PAID_PROBES` に行を足し（Cost Explorer と同じ型: 設定の鍵 `getMetricData`、単価、月の上限）、既定は **ON・
  月の上限 100,000 本（1 USD）**。上限に達したら、その月は list-metrics の 14 日の判定に戻り、台帳の paid に
  `GMD CAP REACHED` と出す
- **台帳**: paid の欄に Cost Explorer と並べて数える（要求の回数でなくメトリクスの本数とその額）。⚙ の「This account」に
  ON · OFF と上限（25,000 · 100,000 · 500,000 本）。OFF なら §14.4 の無料の手だけで判定する（窓は 14 日）
- **リージョン**: GetMetricData はリージョンごと。Bedrock は全リージョンの list-metrics で見つかったリージョンだけ、
  CloudFront は us-east-1
- **テスト**: 本数の数え方、上限で止まること、OFF で無料の手に戻ること、カタログ（`get-metric-data` だけを許し、
  `get-metric-widget-image` と `get-insight-rule-report` は禁止のまま）

### 14.4b 追加のサービス（利用者の決定 2026-11-08: 追加できるものすべて）

どれも無料の describe / list で、1 リージョン 1〜2 回（6 時間ごと、件数の多いものは 1 日）。使用の判定は §14.4a。

| 分類 | サービス | CLI | 忘れものの判定 |
|---|---|---|---|
| NETWORK | VPC のインターフェースエンドポイント | `ec2 describe-vpc-endpoints --filters Name=vpc-endpoint-type,Values=Interface` | 30 日 `BytesProcessed` 0（AWS/PrivateLinkEndpoints）。AZ ごとの時間課金 |
| NETWORK | Transit Gateway のアタッチメント | `ec2 describe-transit-gateway-attachments` | 30 日 `BytesIn` 0（AWS/TransitGateway）。アタッチメントごとの時間課金 |
| NETWORK | Site-to-Site VPN | `ec2 describe-vpn-connections` | トンネルが 30 日 DOWN（`TunnelState`）。接続ごとの時間課金 |
| AI | SageMaker | `sagemaker list-endpoints`・`list-notebook-instances`・`list-apps`（InService のもの） | エンドポイントは 30 日 `Invocations` 0、ノートブックは InService のまま 7 日超、Studio のアプリは InService のまま 1 日超 |
| STORAGE | EBS のスナップショット・AMI | `ec2 describe-snapshots --owner-ids self`、`describe-images --owners self` | 元のボリュームが無いスナップショット、どのインスタンスも起動していない 90 日超の AMI（`LastLaunchedTime`） |
| STORAGE | ECR | `ecr describe-repositories` → 大きいものだけ `describe-images`（容量の合計） | 90 日 push も pull も無い（`lastRecordedPullTime`） |
| DATABASE | ElastiCache | `elasticache describe-cache-clusters`・`describe-serverless-caches` | 30 日 `CurrConnections` の最大 0 |
| DATABASE | OpenSearch のドメイン | `opensearch list-domain-names` → `describe-domains` | 30 日 `SearchRate` と `IndexingRate` 0 |
| DATABASE | Redshift | `redshift describe-clusters`、`redshift-serverless list-workgroups` | 30 日 `DatabaseConnections` の最大 0（止めたクラスタは課金されない旨を書く） |
| INTEGRATION | Kinesis Data Streams | `kinesis list-streams`（`StreamModeDetails` も） | 30 日 `IncomingRecords` 0。シャードかストリームの時間課金 |
| INTEGRATION | Transfer Family | `transfer list-servers` | 30 日 `BytesIn`・`BytesOut` 0。サーバーごとの時間課金 |
| SECURITY | KMS のカスタマーキー | `kms list-keys` → `describe-key`（`KeyManager=CUSTOMER` だけ、1 日） | 無効化されたまま、または削除の予定の無い 1 鍵 月 1 USD。使用は CloudTrail を引かないので `use unknown` |
| SECURITY | Route 53 のホストゾーン | `route53 list-hosted-zones`（G） | レコードが NS と SOA だけのゾーン（1 ゾーン 月 0.5 USD） |

- 回数: 1 リージョン 約 15 回が加わる（6 時間ごと）。最初の 1 周は件数の list / describe を先に、判定は GetMetricData の
  1 日 1 回にまとめる。§14.4 の「回数と時間」と同じく、実装の後に実物で測る
- 単価の表（`list-prices.ts`）にこれらの時間課金と月額を足す。足せないものは `not priced`
- 権限: `ReadOnlyAccess` に含まれるかを、実装の前にポリシーの版で確かめる（`kms:DescribeKey` など）。拒否は PARTIAL

### 14.5 2 段目・3 段目

- 新しいサービスごとに `DRILL` の定義（§5.5 の型）: ファセットと列
  - CloudWatch Logs: 保持（never · 1 y · 30 d …）、クラス、保存量の区分、取り込み（14 d あり・無し）、元のリソース
    （あり・無し）。列に **30 日の取り込みの推定額**（`IncomingBytes` の合計 × 単価。保管より大きいことが多い）
  - S3: §5.5 に「作成日」「空」の列、ファセット `empty`
  - DynamoDB: 課金の方式、テーブルのクラス、容量の区分、使用
  - SQS: 種類（standard · fifo · DLQ）、待ち、使用
  - SNS: 購読の数（0 · 1+）、使用
  - API Gateway: 種類（REST · HTTP · WebSocket）、使用
  - CloudFront: 有効、使用
  - Bedrock: 種類、モデル、状態
- **サービスをまたぐ一覧** `RESOURCES › FORGOTTEN`: ファセットはサービス・理由（列挙の語）・リージョン・課金、列は
  名前・サービス・理由・quiet for・≈ $/mo
- 3 段目: ランプの語はそのリソースの状態（ロググループなら `kept forever` や `30 d retention`。「listed」は使わない）、
  `Quiet for` の行と根拠、KEEP。ロググループの RELATED に元の関数や RDS（あれば、無ければ `gone`）
- ↗ のコンソールの URL を新しい種類ごとに `consoleUrl` へ（単体テストが全種類を確かめる、§7）

### 14.6 ページに渡すもの・MASK

- §10 と同じく `--query` が残した欄だけ。ログの中身、キューのメッセージ、SNS の宛先、Bedrock のプロンプトは読まない。
  キューの URL はキュー名だけに、ARN はリソース名だけに main で削る
- **MASK は RESOURCES のリソース名をすべて伏せる**（利用者の決定 2026-11-08: スクリーンショットを人に見せる用途に
  安全なほう）。バケット・ロググループ・テーブル・関数・キュー・トピック・API・ディストリビューションとその別名・
  EC2 の Name・Bedrock の KB とエージェント・コレクション・そのほか §14.4b の名前。種類と数、額、理由の文の数字は
  残す（`bucket-••`、`log group /aws/lambda/••`）。hover のカード、NEW 7 D の副題、2 段目・3 段目、トーストも対象。
  `mask.ts` の単体テストの一覧に足す

### 14.7 設定（§8 への追加）

このペイン: ELSEWHERE（ON · OFF、既定 ON、週 1 回）、静かな日数（30 · 60 · 90）。このアカウント: KEEP の一覧（解除できる）。

### 14.8 テスト（§13 への追加）

`forgotten.test.ts`（理由の列挙ごとの境目、窓の確信度、分からないときの文、額のしきい値で danger・warn、並び、
KEEP と 2 倍での出し直し）、`inventory.test.ts`（タイルの数と状態の線、0 件・拒否・提供されていないリージョン、
ELSEWHERE、NEW 7 D の基準日、Also here）、`service-names.test.ts`（ServiceName の対応と除外の表）、エンドポイントの
失敗を OFFLINE にしない errors のテスト、カタログの argv（許す動詞に `list-buckets`・`describe-log-groups`・
`list-metrics` の新しい名前空間だけを足す）、`metered-tiny` の区分、スケジューラの優先度と同時 1 本、
アカウントごとの 1 日の読み取りが 2 枚のペインで 1 回、代役 `demo` に新しいサービスと忘れもの（`elsewhere`・
`quiet`・`noregion` のモード）。component はタイルの格子とキーボード（矢印、戻ったときのフォーカス）。e2e は
RESOURCES が既定のタブ、タイル → 2 段目 → 戻る、B の行 → 3 段目 → KEEP、ELSEWHERE。lifecycle の契約は変わらない。

### 14.9 決まったことと、実装の前に確かめること

利用者が決めた（2026-11-08、§14.0）:

1. 追加のサービスは**追加できるものすべて**（§14.4b）。Secrets Manager だけは §3.4 の禁止のまま
2. **GetMetricData を許す**（§14.4a、既定 ON、月 100,000 本 = 1 USD の上限）
3. MASK は**リソース名をすべて**（§14.6）
4. ATTENTION の忘れものは **RESOURCES への 1 行の要約**に（§14.1）

尋ねず、レビューの推奨どおりにしたもの（実装の前なら変えられる）:

5. ELSEWHERE の掃引は週 1 回（52 回）と手動、既定 ON
6. KEEP の印を持ち、額が 2 倍で出し直す
7. 静かな日数の既定 30 日（GetMetricData で 30 日を直接読む。OFF なら 14 日の窓）

実装の前に確かめる:

8. CloudWatch Logs の Describe と SNS の管理 API の値段（公式の記載が見つからない、2026-11-08）。有料なら外す
9. Bedrock の PT の呼び出しがメトリクスにどう出るか（§14.3）、`list-buckets` の課金と CreationDate（§14.4）
10. `ReadOnlyAccess` が AgentCore・aoss・§14.4b の各操作を含むか

### 14.10 レビューで直したもの（Opus 5.5、2026-11-08）

読み取りの回数の見積もりが 1 桁小さかった（list-metrics でまとめる、アカウントごとに 1 日 1 回、枠の優先度、同時 1 本）、
提供されていないリージョンが OFFLINE に見える、Bedrock の PT の判定の不確かさ・契約期間・単価・全リージョンの使用、
OpenSearch Serverless の OCU は群で共有、見ていないリージョンの S3 が「空」に見える、`list-buckets` の費用の区分、
Logs の判定（孤児のロググループ、IncomingBytes、lastIngestionTime）、SQS の最古のメッセージはメトリクスで DLQ は
ATTENTION へ、SNS の宛先を入れない、WebSocket の API、Classic ELB とターゲット 0、ECS と EC2 の CPU だけの判定を
やめる、空の EKS、BILLED NOT LISTED の対応表、並びを「これからの額」に、warn の色を額のしきい値に、1 段目の
階層（SERVICES、Also here、quiet for）、理由の列挙、ELSEWHERE はメトリクスを読まない、NEW 7 D の基準、KEEP の
IPC と数と出し直し、ATTENTION・ACTIVE との重複、MASK の範囲を問いに、権限の表（§9）、アラームの全状態、
数字を button に、矢印とフォーカス、最初の表示の順。

### 14.11 実装で決めたこと（2026-11-08）

- **ELSEWHERE の見回り**は 13 リージョンで切らず、見ていない有効なリージョンを全部（上限 16）読む。名前の順で 13 に
  切ると us-west-2 が落ちるため。4 リージョンを見ていれば 13 になる
- **静かな日数**は main が 30 日（`AWS_LIMITS.quietDays`）で判定する。60・90 日はボードの key に入れず、行の
  `window` でページが絞る
- **S3 の「変わらない」**は容量の履歴だけで判定し、オブジェクト数は読まない（main の 90 日の記録が要るので、代役では
  すぐには出ない）
- **NEW 7 D**: EC2 の LaunchTime、Lambda の LastModified、CloudFront の LastModifiedTime は作成日ではないので、
  main が初めて見た日で数える
- **GetMetricData の dimension**: dimension が 1 つで決まるメトリクス（NAT、RDS、Redshift、EC2、DynamoDB、Logs…）
  だけを直接組み立て、複数の dimension のもの（ElastiCache、OpenSearch、VPC エンドポイント、TGW、SageMaker、AOSS）は
  list-metrics が見つけた組だけを問う。でたらめな dimension で 0 になり、誤って「静か」と出るのを避けるため
- **REFRESH** で RESOURCES の共有の読み取りを読み直すのは、押す前から 5 分以上古いものだけ
- **代役**の「忘れた GPU」は us-west-2 の g5.xlarge（ELSEWHERE）。既存の e2e（`1 IDLE`、EC2 の 6 行）を保つため

### 14.12 CARDS: サービスを「使用中 / 総数」のカードで（案、2026-11-08）

利用者の提案（2026-11-08）: 「すべてのリソースをバーで表示しようとしているが、デモを見る限り情報がビジー。GITHUB
STATUS のように、サービスごとに `2 / 3`（アクティブ数 / 総数）をカード型で出したほうがわかりやすい。今の表示と
切り替えられるようにし、既定をカード型に」。モックは docs/aws-mock の RESOURCES（既定で CARDS）。

- **切り替え**: C（サービス）の見出し `SERVICES 18` の右に `CARDS · DETAIL`。既定は CARDS。DETAIL は今のタイル
  （分類の見出し、状態の積み上げ線、凡例）。選んだほうはペインの状態に持つ（`resView`、既定は持たない）。A の数字、
  B の LOOKS FORGOTTEN、Also here、ELSEWHERE、BILLED NOT LISTED はどちらでも同じ
- **カード 1 枚**（GITHUB STATUS の REPOS のタイルと同じ作り）: サービス名と 7 日の増減、大きく `使用中 / 総数`
  （`9 / 12`）、その下に「使用中」が何を指すかの短い語（`running, not idle`）、下の行に忘れていそうなもの
  （`3 forgotten?` と `≈ $/mo`。お金のかからないものだけなら `1 quiet · free`、無ければ `all in use`）。枠の色は
  DETAIL のタイルと同じ規則（忘れものの ≈ $ が $50/月 以上で warn、$500/月 以上で danger、単価の無い PT は warn）
- **「使用中」の定義**: 総数から、止まっているもの（EC2 の running 以外、RDS の available 以外、ECS の desired 0）と、
  §14.3 の判定で忘れていそう・静かなものを引いた数。LOOKS FORGOTTEN と同じ述語なので、カードと一覧が食い違わない。
  語はサービスごと（EC2 `running, not idle`、S3 `buckets not empty`、EBS `volumes attached`、Lambda `invoked in 30 d`、
  SQS `queues with messages`、CloudWatch Logs `groups receiving`…）。main が `ResourceTile` に `inUse` と `inUseWord`
  を足して送り、ページは数えない。純粋な関数の 1 か所で決め、単体テストで縛る
- **並び**: 分類の見出しは出さず、忘れものの額の大きい分類の順にサービスを平らに並べる（同じ額なら固定の順）。
  幅に合わせて `auto-fill`（最小 10.5 rem）、narrow は 2 列。矢印キーはいちばん近いカードへ、Enter で 2 段目
- **カード**（hover・フォーカス）: 総数と名詞、使用中とその語、使用中でない数（止まっている、または読んだかぎり
  静か）、リージョン。「DETAIL が状態・容量・凡例を見せる」と一言
- **Bedrock**: DETAIL の 2 段のタイルの代わりに、置いてあるもの（PT、カスタムモデル…）の使用中 / 総数
- **読み取りは増えない**。MASK はカードに名前が無いので変わらない

**Fable 5.1 の UX/UI レビューで直したもの（2026-11-08、上の箇条より優先）**:

1. **計算が閉じる**: `総数 − 使用中 = forgotten? + stopped + quiet`。どれも見ているリージョンのものだけで数え、
   ELSEWHERE（見ていないリージョン）は ELSEWHERE の行に残す（モックで `EBS 18 / 19` に `2 forgotten?` と出て、
   引き算が合わなかった）。下の行は残り全部を言う: `2 forgotten? · 1 stopped   ≈ $1.1k`、`6 quiet   free`。
   main の純粋な関数が数え、全タイルでこの式が成り立つことを単体テストで縛る
2. **色はお金だけ、枠と同じしきい値**: `n forgotten?` は `--text`。`≈ $` だけを、枠が色づくとき（$50/月 以上で
   warn、$500/月 以上で danger、単価の無い PT は warn）に同じ色に、それ未満は `--text-dim`。7 日の増減は
   お金ではないので `--text-dim`
3. **サービス名は読む大きさ**: `--step--1`、mono、大文字にしない（`CloudWatch Logs`）。色は muted のまま
4. **並びは固定**: COMPUTE・STORAGE・DATABASE・NETWORK・AI・EDGE & API・INTEGRATION・SECURITY・LOGS の順に平らに。
   カードの場所が額で動かないので覚えられる。額の順は LOOKS FORGOTTEN の仕事
5. **語は名詞から**: `<名詞> <述語>`（`instances running, not idle`、`gateways with traffic`、
   `buckets not empty, not stale`…）。表は 1 つ、全種類にあることをテストで縛る
6. **カードの額は一覧と同じ書き方**: `/mo` を付けない（帯が「a month」を 1 度言う）。$10 未満だけセントまで
7. **何も無ければ下の行を出さない**: 片付いた盤面が静かに読める。`0 / 3` の 0 は暗くしない
8. **hover のカードはカードに無いことを言う**: 状態の内訳（DETAIL の凡例）、容量、リージョンごとの数、そのサービスの
   ≈ $/月、静かさの窓。最後に `A press opens the list.`
9. **Bedrock**: `6 / 8`（置いたもののうち 30 日に使われたもの）、語の行に `placed, used in 30 d · 4 models · 31M tok`、
   モデルごとの量は hover のカード
10. **読み取り中はカード、拒否はカードにしない**（拒否は利用者の決定 2026-11-08: DETAIL にタイルが無いのと同じく、`?` のカードが十数枚並んでアカウントのものを埋めた）: 読み取り中は比を `–`、語 `reading…`、下 `first read ≤ 10 min`。拒否されて 0 件の
    サービスは Denied の行だけに名前を出す（操作名は PARTIAL と COPY POLICY）。0 件と提供の無いリージョンも今の 1 行のまま
11. **切り替えはフォーカスを保つ**: 押したボタンにフォーカスを戻し、2 段目から戻るときは開いたカードへ
12. **読み上げの名前**: `EC2: 9 of 12 instances running, not idle, 2 forgotten?, 1 stopped, about $1.1k a month`
13. **カードの最小幅は 13 rem**（wide で 4 列）。10.5 rem の 5 列では下の行が `2 forgotten? · 1…` と切れた

見送ったもの: 低い高さでカードを 1 行にする案と、30 rem 未満で 1 行のチップを出す案（任意、後で）。帯の `SERVICES 18`
と見出しの `SERVICES 18` の重なりはそのまま。
