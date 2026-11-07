# AWS ペイン 設計

クラウド（インフラ・基盤）エンジニアが「いまこのアカウントで気にすべきこと」を 1 枚で見て、気になった
サービスを **BI のようにドリルダウン**して詳細まで確かめるペイン。利用者の AWS CLI v2 の認証にそのまま乗り、
**1 要求ごとに値段の付く API は呼ばず**、見えている間だけ読む。読むだけで、何も変えない。共通の核（起動・
許可リスト・時刻表・台帳・状態の語・画面の作法）は [cloud-cli.md](cloud-cli.md)。モックは
[aws-mock/index.html](aws-mock/index.html)。**設計段階（未実装）**。

## 0. 決定の記録

| 日付 | 決定 | 経緯 |
|------|------|------|
| 2026-11-07 | AWS CLI 経由で、インフラ・基盤のエンジニアが要る情報を出すペイン。無料の API の範囲 | 利用者の案 |
| 2026-11-07 | 各サービスを選ぶと、BI のようにドリルダウンして詳細を確かめられる（§5） | 利用者の指定 |
| 2026-11-07 | **（要決定）** 名前は AWS（ウィジェット id `aws`、ピッカーは "aws account"） | 提案 |
| 2026-11-07 | プリセット `cloud` の左の主役（舞台の 0.58）。LAYOUTS で `blank` の前（cloud-cli.md §10） | 利用者の指定 |
| 2026-11-07 | **（要決定）** v1 は 1 ペインに 1 プロファイル、リージョンは 4 つまで。複数アカウントを 1 枚にまとめるのは、CLI の重さを測ってから（§11） | 提案（Fable 5.1 は 1 枚に 4 プロファイルを推した） |
| 2026-11-07 | レビュー（Opus 5.5・Fable 5.1）で直したもの: 一斉起動をやめ周期を延ばす（在庫は 1 時間、アラームは 5 分）、`--query` で欄を絞る、CloudTrail の欄と見せ方、Free Tier の新プラン、EKS と RDS のサポート期限を API で、ACM の鍵の種類、グローバルなサービスの `--region us-east-1`、vCPU の数え方、複合アラーム、ルートと SG と RI/SP とドメインの期限など足りない読み取り、在庫の表を「変化」に、COST を 1 行に、見出しを PaneHost に | レビュー（cloud-cli.md §11） |
| 2026-11-07 | **Cost Explorer の API は有料**（1 要求 0.01 USD、ページごとに 1 要求。公式の料金ページで確かめた）。それでも要るので削らず、**明示して有効にする有料の probe** にする: 既定は OFF、有効にしたら 1 日 1 回、設定で頻度（手動・1 日・12 時間）と ON / OFF と月の上限（既定 100 要求 = 1 USD）を変えられる（§3.3） | 利用者の指摘と指定 |
| 2026-11-07 | **ACTIVE**: どのリソース・サービスが動いていて料金が発生しているかを 1 枚で見るダッシュボードを、RESOURCES に代えて置く。立ち上げっぱなしの EC2、大きな S3、付いていないボリュームなどが、推定の月額とともに見える（§5.0） | 利用者の指定 |
| 2026-11-07 | 実測: AWS CLI 2.39.6 は 1 回 約 1.2 秒・CPU 0.59 秒・最大 95 MB（`--version` だけで 0.45 秒）。gh の約 3 倍 | 測定（i5-1335U、§3.5） |

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
有料）、S3 のオブジェクトの一覧と中身（LIST は課金）、ログの中身、AWS Health の API（Business サポートが要る）。

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
| s3size R | `cloudwatch list-metrics --namespace AWS/S3 --metric-name BucketSizeBytes` → バケットと保存クラスごとの `get-metric-statistics`（日ごと、`NumberOfObjects` も） | 1 日 | 無料枠 | S3 の容量と保存クラス。**S3 の API は呼ばない**（`list-buckets` も LIST として課金されうる）。メトリクスは S3 が 1 日 1 回出すもの |
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

- **既定は OFF**。COST タブに「Cost Explorer is off · about $0.60 a month at once a day」と、有効にするボタンを
  出す。押すと設定の選び（頻度と上限）を開く。黙って有効にはならない
- **頻度**（ペインの設定）: OFF · MANUAL（REFRESH と、2 段目のボタンでだけ）· 1 DAY（既定）· 12 H。それより短い
  周期は選べない（Cost Explorer のデータは 1 日に数回しか進まず、短くしてもお金がかかるだけ）
- **月の上限**（既定 100 要求 = 1 USD、10〜1,000）: 台帳が今月の Cost Explorer の要求数を数え、上限に達したら
  月が替わるまで呼ばない（「CE CAP REACHED · 100 of 100」）。上限はアカウントごと（同じアカウントのペインが
  いくつあっても 1 つ）で、main が持つ
- **押すと有料のボタン**には値段を書く（`BY USAGE TYPE · $0.01`）。結果は 24 時間持ち、その間は押しても呼ばない
- 1 日の呼び出しは、有効にしたペインが見えていた日の最初の境界（00:00 からのずれ付き）。隠れていた日には呼ばない
- 台帳と足元: `PAID APIs 2 · $0.02 this month · cap $1.00`。型の上の `cost` は `'free' | 'free-tier' | 'paid'` になり、
  **`'paid'` は `PAID_PROBES` の表にあるものだけ**、それぞれ設定の鍵と上限を持つことを、表のテストが縛る
  （cloud-cli.md §2.4）
- 有料で、利用者が選べない時間ごとの粒度・リソースごとの粒度（`--granularity HOURLY`、`get-cost-and-usage-with-resources`）
  は使わない

### 3.4 呼ばないもの（許可リストの禁止の表）

| もの | 理由 |
|---|---|
| Cost Explorer の §3.3 以外（`ce` のほかの操作、時間ごとの粒度、リソースごと） | 有料で、要る理由が無い |
| `cloudwatch get-metric-data`、`get-metric-widget-image`、`get-insight-rule-report` | 無料枠の外で常に課金 |
| `s3api *`、`s3 *` | S3 は LIST 要求を課金する。バケットの数は後で（§11） |
| `health *`、`support *`（Trusted Advisor） | Business 以上のサポートプランが要る |
| `logs *` | 読んだデータ量に課金しうる（Logs Insights）。ログの中身はそもそも読まない |
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
  使っている型・クラスだけ（§3.1 の prices）
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

## 6. 画面

モックのとおり。上から:

- **見出し（PaneHost）**: `AWS`、subtitle に `prod-readonly · acme-prod (4829-1350-7216)`、badge にいちばん重い
  もの（「1 alarm」）か §4 の語
- **上段**: ◆ランプと語、ALARMS、ATTENTION（danger · warn）、**MTD**（`$412 · forecast 110%`、押すと COST タブ）、
  リージョンのランプの選び（`ALL · ap-ne-1 · us-e-1 · eu-w-1`。1 つだけ選ぶ絞り込みで、各ランプはその
  リージョンのいちばん重い注意の色）、右端に MASK・REFRESH・⚙
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

PROFILE（一覧から）、REGIONS（4 つまで）、PULSE（ON / OFF）、ACTIVITY（ON / OFF。CloudTrail を呼ばない）、SLOW
（周期 4 倍）、**COST EXPLORER（有料）**: OFF（既定）· MANUAL · 1 DAY · 12 H と、月の上限（10〜1,000 要求、既定 100）。
有料の設定の欄には、いまの頻度での月の見込み（「≈ 60 requests · $0.60 a month」）と今月の実績を並べる。
Cost Explorer の上限はアカウントごとに main が持つ（同じアカウントのペインで共有）。全体の設定（settings.json）は持たない。ペインの状態にプロファイル名・リージョン・ON/OFF・MASK・
タブ・ドリルダウンの位置だけ。

## 9. 要る権限（最小のポリシーを作る人のため）

`sts:GetCallerIdentity`、`iam:ListAccountAliases`、`iam:GetAccountSummary`、`iam:GenerateCredentialReport`、
`iam:GetCredentialReport`、`cloudwatch:GetMetricStatistics`、`cloudwatch:ListMetrics`、`cloudwatch:DescribeAlarms`、
`budgets:ViewBudget`、`freetier:GetAccountPlanState`、`freetier:GetFreeTierUsage`、`ec2:Describe*`、
`elasticloadbalancing:Describe*`、`rds:Describe*`、`lambda:ListFunctions`、`ecs:List*`、`ecs:Describe*`、
`eks:List*`、`eks:Describe*`、`cloudformation:ListStacks`、`cloudformation:DescribeStackEvents`、
`acm:ListCertificates`、`route53domains:ListDomains`、`savingsplans:DescribeSavingsPlans`、`backup:ListBackupJobs`、
`servicequotas:GetServiceQuota`、`guardduty:ListDetectors`、`guardduty:GetFindingsStatistics`、
`cloudtrail:LookupEvents`、`pricing:GetProducts`。Cost Explorer を有効にするなら `ce:GetCostAndUsage`、
`ce:GetCostForecast`。ガイドの data-sources.md にこの表を載せる。

## 10. ページに渡すもの

- 各 probe の `--query` が残したものだけ: 数、状態、短い id、名前（`Name` タグだけ）、日付、リージョン、
  決めた欄
- CloudTrail は §4.2 の欄だけ。セキュリティグループは判定（開いているポートの種類）だけ
- アカウント ID と ARN は渡す（見出しに要る）。MASK はページで伏せる（cloud-cli.md §7 の一覧）

## 11. 後で

複数プロファイルを 1 枚に（測ってから）、Cost Optimization Hub と Compute Optimizer の提案（無料だが登録が要る）、
CUR による資源ごとの実額、Security Hub、IAM Access Analyzer の外部アクセス、Compute Optimizer の提案、
Organizations の横断、SSO・login のセッションの残り時間、AWS の公開ステータス（利用者に聞く、§12）。

## 12. 利用者に聞くこと

- 名前（AWS）と、1 ペイン 1 プロファイルで始めること
- Cost Explorer の既定を OFF（有効にするまで呼ばない）にすること。ON を既定にすると、ペインを置いただけで
  月 0.6 USD ほどがかかる
- Price List の API に料金が無いことを確かめられなければ、単価を同梱の表にすること（ACTIVE の推定）
- AWS Health Dashboard の公開フィード（サインイン不要、無料）で、選んだリージョンの障害を出すか。CLI ではなく
  main の既存のフィードの取得になる（新しい通信先なので data-sources.md に足す）

## 13. テスト

[cloud-cli.md](cloud-cli.md) §9 に加えて: 判定（`attention.test.ts`: 各条件の境目、同梱の表の古さ、並び）、
`changes.test.ts`、`activeCost.test.ts`（数えるもの・数えないもの、マルチ AZ、延長サポート、IDLE の境目、
spot を除く、単価が無い型）、Cost Explorer（既定 OFF、頻度、月の上限で止まる、ページの数え方、24 時間の持ち）、
ドリルダウンの純粋関数（ファセットとクロスフィルタ、並べ替え、パンくずの道、消えた id）、
請求の解析（月の切り替わり、丸 1 日だけの傾き、メトリクスが無いとき、サービス別）、Free Tier の 2 つのプラン、
認証情報レポートの CSV、CloudTrail の解析（決めた欄だけ、AWSService を落とす、ConsoleLogin の失敗と MFA）、
`consoleUrl`、禁止の表。e2e は `aws.spec.ts`（代役の `demo` / `signedout` / `mfa` / `partial` / `nobilling` /
`newplan` / `nocli`、ドリルダウンの往復とキーボード）。
