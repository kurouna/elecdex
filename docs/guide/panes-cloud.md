English | [日本語](panes-cloud.ja.md) | [简体中文](panes-cloud.zh-CN.md)

# Cloud panes: AWS STATUS and GITHUB STATUS — elecdex

elecdex is a science-fiction terminal emulator and system monitor, a rewrite of eDEX-UI on Electron, Svelte and TypeScript. This page covers its two panes for cloud work: **AWS STATUS** (what needs someone in an AWS account, what runs and bills in it now, this month's cost and who changed what) and **GITHUB STATUS** (what waits on you on GitHub, your notifications, what happened in your repositories, and the repositories themselves). Both read through the command-line tools you already use, AWS CLI v2 and GitHub CLI, only while the pane is shown, and change nothing. For each it states what it reads, how often, what it costs, what it never reads or does, and its settings. elecdex runs on Windows, macOS and Linux; it is developed and used on Windows, and macOS and Linux have only been built and run by the automated tests, so they are not sufficiently verified.

On this page:

- [The cloud preset](#the-cloud-preset)
- [How both panes read](#how-both-panes-read)
- [AWS STATUS](#aws-status)
- [GITHUB STATUS](#github-status)
- [Public status and incident toasts](#public-status-and-incident-toasts)
- [Common behaviour](#common-behaviour)
- [Design documents](#design-documents)

## The cloud preset

<p align="center">
  <img src="../screenshots/elecdex-cloud.jpg" alt="The cloud preset in the Business (Light) theme: the system column on the left; an AWS STATUS pane on a made-up account acme-prod with one alarm, the month to date and its forecast against the budget, two region lamps, the one-line Cost Explorer question, the ACCOUNT PULSE band and the RESOURCES tab with 27 services, 23 resources that look forgotten and are billed, the five dearest of them, and a card per service with how many are in use of all; on the right a GITHUB STATUS pane of a made-up user octo-aki with the contribution grid and the QUEUE grouped as broken or blocked, waiting too long, for you and triage; under it a shell with a LOG WATCH tab beside it">
  <br><sub>cloud · Business (Light) · a stand-in AWS CLI and gh, made-up account and user</sub>
</p>

The cloud preset (Ctrl+Shift+F10) is the account, the repositories and a shell for both CLIs:

| Place | Panes |
| --- | --- |
| Left column | The system column every preset but cockpit and blank shares |
| Centre (0.58 of the stage) | AWS STATUS |
| Right, top (0.62 of the height) | GITHUB STATUS |
| Right, bottom | A shell in front, LOG WATCH in a tab behind it |

- Both CLI panes read only while they are shown, so the preset reads nothing until it is on screen, and LOG WATCH behind its tab reads nothing until chosen.
- AWS STATUS starts with the free reads under the profile `default` (every call names its profile with `--profile`, so `AWS_PROFILE` does not choose it; ⚙ does), and asks about Cost Explorer the first time it shows an account (*unreleased:* RESOURCES' `GetMetricData` is on by default, under a cap of $1.00 a month per account; off in ⚙). Without the CLIs each pane shows **NO CLI** and how to install it.
- Presets are templates: choosing one adds a saved layout that then follows your changes. A new install starts with all eleven presets, the first ten on the number keys; an existing list of layouts is never added to.

## How both panes read

| | |
| --- | --- |
| Runs | Your own AWS CLI v2 (`aws`) and GitHub CLI (`gh`), started directly by elecdex's main process: no shell, no PowerShell, the arguments passed as a list. |
| Finds them | On `PATH`, absolute entries only (the folder elecdex runs in is never searched), then the install folders: on Windows `%LOCALAPPDATA%\Programs\Amazon\AWSCLIV2\aws.exe` or `%ProgramFiles%\Amazon\AWSCLIV2`, and `C:\Program Files\GitHub CLI\gh.exe`; elsewhere `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`. A CLI installed after elecdex started may need elecdex restarted. |
| Signs in | Never. elecdex never sees a credential or token: the CLI signs in as it always does. Signed out, the pane shows the command to copy (`aws login --profile=<name>`, `aws sso login --profile=<name>`, `gh auth login`), never runs it, and stops reading until **REFRESH**. |
| Writes | Nothing, anywhere in the account: read only. GITHUB STATUS marks no notification read. |
| Updates | Only while the pane is seen: not behind a tab, not with the window minimised or hidden. Nothing in the background, notifications included. |

- **The wall clock's grid.** Each reading waits on a boundary of its period (5 minutes, 15 minutes, an hour …) with a small offset of its own, so the readings of one period do not start together.
- **Two CLI starts at once at most**, across both panes; one that runs 20 seconds is stopped with its child processes.
- **Failures back off** 1, 2, 4 … up to 30 minutes, per reading; the last good result stays on screen, marked stale.
- **REFRESH** reads everything now, at most once in 30 seconds (main holds the limit).
- **MASK** hides on screen account ids, aliases, ARNs, logins, private repository names, addresses and bucket names, and the pane's subtitle with them.
- **The ledger.** The foot of each pane counts today's requests - free, free tier, 304 (unchanged, which costs GitHub no rate limit) and paid - with a card per reading: its period, its cost and today's count, and the CLI's path and version. The counts are kept in memory only.
- **Link states** in the top row: STANDBY (not shown), LINKING, LINKED, PARTIAL (a read refused: only the operation's name is shown), NO CLI / OLD CLI, SIGNED OUT, THROTTLED / RATE LOW, OFFLINE, LINK ERROR. A CLI's own error text is never shown, logged or put in a toast.
- Both can be brought forward (Ctrl+Shift+Z, filling the window) and popped up; rows have detail cards.

## AWS STATUS

<p align="center">
  <img src="../screenshots/pane-aws.jpg" alt="The AWS STATUS pane on its own, on a made-up account acme-prod with two regions: the top row with one alarm, ATTENTION 5 danger and 8 warn, the month to date of 218 dollars with its forecast at 110% of budget, the region lamps; the one-line Cost Explorer question; the ACCOUNT PULSE band; the RESOURCES tab with 27 services, about 4.50 dollars an hour billed by the hour, 23 resources that look forgotten and are billed, the five dearest (a Bedrock Provisioned Throughput with no calls, an EC2 instance running in a region not shown, an OpenSearch Serverless collection with no searches, a cache with no connections, a SageMaker notebook in service for 40 days) and a card per service with how many are in use of all (EC2 4 of 6, ECS 2 of 4, S3 4 of 6, EBS 6 of 8), what looks forgotten and its money">
  <br><sub>AWS STATUS · RESOURCES · a stand-in AWS CLI, a made-up account</sub>
</p>

| | |
| --- | --- |
| Where | cloud preset (Ctrl+Shift+F10); picker (Ctrl+Shift+A) "aws status". Several panes can be added. Can be popped up and brought forward (Ctrl+Shift+Z). |
| Reads | One AWS profile per pane (⚙ lists `aws configure list-profiles`) in up to 4 regions (none chosen: the profile's own region); global services are asked in us-east-1. Free APIs only, plus CloudWatch calls inside its free tier, plus Cost Explorer if you turn it on. *Unreleased:* RESOURCES adds the lists of every service it shows, S3's bucket list, CloudWatch Logs' log groups, and CloudWatch's paid `GetMetricData` under a monthly cap (on by default). |
| Updates | Only while the pane is seen, each reading at its own period (below). |
| Platforms | Wherever AWS CLI v2 runs. Not verified by hand on macOS or Linux. |
| Privacy | Read only; never a Secrets Manager, Health or Support call, and of S3 and CloudWatch Logs only the bucket list and the log groups (*unreleased*), never an object, a log or a message. MASK hides every resource name on RESOURCES and in the drill-down (*unreleased*). Of CloudTrail, only time, who, operation, region, error and a console sign-in's result and MFA are kept. Nothing of the account reaches a plugin. |
| Settings | Per pane in ⚙: profile, regions, ACCOUNT PULSE on or off, ACTIVITY (CloudTrail) on or off, SLOW ×4. Per account: Cost Explorer and the cost QUOTA (`aws-billing.json`); *unreleased:* GetMetricData and its cap (`aws-billing.json`), ELSEWHERE and the resources marked KEEP (`aws-inventory.json`). For every pane: the incident toasts, `aws.incidents` in `settings.json`. |

The top row: the link word, **ALARMS**, **ATTENTION** (danger · warn), **MTD** (the month to date from the billing metric, with the budget's forecast and the quota's share; a press opens COST), the region lamps (ALL or one region, each lamp the colour of its heaviest finding), **MASK**, **REFRESH**, ⚙.

**ACCOUNT PULSE** is a band of the last 24 hours of CloudTrail write events in 15-minute bars: errors in danger, console sign-ins as diamonds, alarms ringing as a bar. CloudTrail is about 5 minutes late, and the band says so. It can be turned off in ⚙, and is dropped when the pane is too low.

The tabs:

| Tab | What it shows |
| --- | --- |
| **RESOURCES** (*unreleased*, the first tab) | What the account has and what looks forgotten (below) |
| **ATTENTION** | What needs someone, heaviest first: alarms (composite ones too), impaired instances, failed backups, failed CloudFormation stacks; the root user without MFA, with access keys, or used in the last 24 hours; GuardDuty high findings; a security group open to the world on 22, 3389 or all ports that an instance uses; console users without MFA; an operation refused 10 or more times in 15 minutes; certificates in use expiring (danger within 7 days, warn within 30); domains expiring with auto-renew off; Savings Plans and Reserved Instances ending within 30 days; access keys older than 90 days; EKS standard support ending within 90 days or past; Lambda runtimes already deprecated; unattached EBS volumes and Elastic IPs; instances stopped over 30 days; EKS on extended support; budgets forecast over 100% or actual over 80%; free plan credits ending within 30 days, or the legacy free tier over 85%; *unreleased:* one line for what looks forgotten and is billed, which opens RESOURCES' list |
| **ACTIVE** | What runs and bills now: ≈ $/hour and ≈ $/month at list prices, a stacked bar by service, and rows by service, dearest first, with **IDLE** (a running instance whose 7-day CPU average is under 2% and maximum under 10%) and **WASTE** counts; a *NOT BILLING NOW* line; what came and went since the day's first reading. Always under it the fixed line *≈ Estimates at list prices, not your bill · prices shipped with elecdex, 2026-11* |
| **COST** | This UTC month, last month to the same day, a straight line to the month's end from the full days, budgets, the cost QUOTA gauge and its USD input, and by service from the billing metric's `ServiceName` (or from Cost Explorer when it is on) |
| **ACTIVITY** | CloudTrail write events, the last 50 per region; filters ALL, WRITES, LOGINS, ERRORS; AWS's own automation left out |
| **ACCOUNT** | The account, its alias, users and roles, the ARN signed in as; the root user's MFA, keys and last sign-in; console users without MFA; keys over 90 days; GuardDuty counts; the regions |

### RESOURCES

*Unreleased.* The first tab, and the one a new pane opens on. It answers what is in the account and what was made and left behind. Nothing is stopped or deleted; it only says what was read.

- **Figures**: SERVICES (with resources and regions), BILLED BY THE HOUR (≈ $/hour and ≈ $/month of what bills by the hour; a press opens ACTIVE), LOOKS FORGOTTEN · BILLING (how many, ≈ $/month, and how many cost nothing; a press opens the whole list), NEW 7 D (what came and went in seven days; a press opens them).
- **LOOKS FORGOTTEN**: the first five, sorted by ≈ $ a month from now (a judgement on fewer days than the quiet days ranks lower). Each row: the kind, the name, why in plain words ("no traffic 30 d", "not attached since 11-01"), how long it has been quiet, and ≈ $/month; the card says what it was judged by. **keep** ("I meant to leave it") takes a row off the list for this account; it comes back if its cost more than doubles. Up and Down move between rows.
- A **SERVICES** heading with a **CARDS · DETAIL** switch (*unreleased*; the pane keeps the choice, CARDS by default). **CARDS**: a card a service, always in the same order (compute, storage, databases, network, AI, edge and API, integration, security, logs). A card: the name and its 7-day change, **in use / all** in the regions shown (`9 / 12`), what in use means (`instances running, not idle`) and, only when something is not in use, the rest (`2 forgotten? · 1 stopped · 1 quiet · 1 kept`) with the forgotten ones' ≈ $ a month (`free` when the rest is all quiet). In use is what is neither stopped nor on LOOKS FORGOTTEN (nor kept), so the card and the list agree; what is in other regions stays in ELSEWHERE. Its frame turns warn and danger as a tile's. Bedrock's card counts what is placed and used in 30 days, with the models and their tokens. A service still being read shows `–` and *reading…*; one refused with nothing read shows `?` and the operation. The card on a card gives the states, the size, the regions with their counts, ≈ $/month and what quiet means. The arrow keys go to the nearest card; Enter opens it.
- **DETAIL**: tiles, grouped (compute, storage, databases, network, AI, edge and API, integration, security, logs), the groups with the most forgotten money first. A tile: the count and its noun, a thin line of its states, the regions, a legend, how many look forgotten and ≈ $/month. Its frame turns warn from ≈ $50 a month of forgotten resources and danger from ≈ $500. Bedrock's tile has two halves: the models used in 30 days, and what is placed (Provisioned Throughput, custom and imported models, knowledge bases, agents, guardrails, inference profiles, AgentCore runtimes). The arrow keys go to the nearest tile that way; Enter opens it.
- Under the cards or tiles: **Also here** (VPCs, certificates, stacks, alarms), **Checked, none here**, **Denied** (an operation refused), **ELSEWHERE** (what is in the regions the pane does not show, from a weekly sweep; its list has *check other regions now*), and **Billed this month, not read here** (a service in the billing metric that no tile covers; a press opens COST).
- Services: EC2, ECS, EKS, Lambda, S3, EBS, EBS snapshots, AMIs, ECR, RDS, DynamoDB, ElastiCache, OpenSearch, Redshift, NAT gateways, load balancers, public IPv4, VPC endpoints, Transit Gateway attachments, Site-to-Site VPN, CloudFront, API Gateway, SQS, SNS, Kinesis Data Streams, Transfer Family, Bedrock, OpenSearch Serverless, SageMaker, KMS, Route 53 hosted zones and CloudWatch Logs.
- What looks forgotten is judged by what was read: a usage metric with no data point (no traffic, requests, connections, invocations or messages) over the quiet days (30), an instance stopped over 30 days, a volume or address not attached, an empty bucket, a log group whose function is gone, a snapshot whose volume is gone, an alarm watching something gone. With `GetMetricData` off, the judgement falls back to `ListMetrics`' 14 days. Provisioned Throughput counts as forgotten only when neither it nor its base model has calls.
- The narrower the pane, the fewer columns of cards (13 rem at least each, two on a narrow pane) or tiles; on a low pane the tiles become one line each, and on a very low one only the figures and the list stay.

### Drilling down

From RESOURCES, from ACTIVE, or from an ATTENTION row, a service opens inside the pane:

- **A service**: facet bars - a click filters by a value, and the other groups count again under that filter (cross-filtering) - and a list, sorted by a click on its header.
- **One resource**: its fields; what is related (an instance's volumes, Elastic IPs and alarms; a volume's instance); its findings; **HISTORY**, that resource's CloudTrail, read when pressed (free); **↗ CONSOLE**, which opens the AWS console page main builds from its own reading.
- Crumbs with ‹ lead back. With the focus in the pane, Enter goes a step down, Escape or Backspace a step up.
- Services: EC2, EBS, public IPv4 (Elastic IPs), S3, NAT gateways, load balancers, RDS, EKS, Lambda, CloudFormation, ACM and alarms; *unreleased:* every RESOURCES service, and the lists across services (forgotten, new, elsewhere) with a service column. One resource from RESOURCES also shows how long it has been quiet, what that was judged by, and **KEEP**. S3's sizes come from CloudWatch's daily `BucketSizeBytes`; of S3's own API only the bucket list is called (*unreleased*), at most once a day.

### What it costs

- **Free APIs**, and CloudWatch's `GetMetricStatistics`, `ListMetrics` and `DescribeAlarms`, which count against CloudWatch's free tier of 1 million requests a month, shared by the whole account (the ledger counts them as *free tier*).
- **GetMetricData** (*unreleased*, RESOURCES only) is always paid, $0.01 per 1,000 metrics. It is on by default, counted by metric, and stops at a monthly cap per account (25,000 · 100,000, the default, $1.00 · 500,000 metrics in ⚙), after which the judgement falls back to the free tier's calls. The ledger shows the metrics and the dollars this month, and *GMD CAP REACHED*.
- **S3's bucket list** (*unreleased*) may be billed as a LIST request: once a day, at most 31 a month.
- **Cost Explorer** ($0.01 a request) is off until you turn it on, and is asked about the first time the pane shows an account, in a one-line card inside the pane: **TURN ON**, **KEEP OFF**, **LATER** (asked again after elecdex restarts, at most once a day) and **▸ more**, which opens the frequency (MANUAL · ONCE A DAY, the default · EVERY 12 H) and the monthly cap (10 · 50 · 100, the default, $1.00 · 200 · 500 · 1,000 requests), with the month's estimate (once a day ≈ 60 requests, $0.60).
- A Cost Explorer reading is two requests: the month by service, and AWS's forecast. It stops at the cap until the next UTC month. Refused (no `ce:GetCostAndUsage`, or Cost Explorer not enabled), it turns itself off and says why.
- The answer, the cap, the count and the quota are kept per account in `aws-billing.json`.

### Cost QUOTA

- An amount in USD per account (0 = off, the default), with steps at 80% and 100% (or 100% only).
- A toast when this UTC month's billing metric first passes a step, once per step per month, remembered on disk.
- Checked every 6 hours while the pane is shown, so a toast can come half a day late, or later when the pane is not shown. AWS Budgets is AWS's own alarm; this one is elecdex's, on screen.
- Needs *Receive CloudWatch billing alerts* turned on (free) in the Billing preferences. On the payer account the billing metric is the whole organization's bill.

### List prices

ACTIVE's estimates use unit prices shipped with elecdex (`src/shared/aws/list-prices.ts`): US East On-Demand list prices (Linux, shared tenancy) for common EC2 and RDS types, EBS, S3 storage classes, NAT gateways, public IPv4, load balancers and EKS, and other regions by the region's usual ratio. It is an approximation, not your bill; the Price List API is not called.

### Periods

| Reading | Period |
| --- | --- |
| Identity | 15 min |
| Alarms, impaired instances | 5 min |
| CloudFormation stacks, CloudTrail | 15 min |
| Inventory: instances, volumes, addresses, NAT gateways, load balancers, security groups, RDS, Lambda, backups, GuardDuty | 1 h |
| Account summary | 1 h |
| Billing metric, budgets, credential report | 6 h |
| Free plan | 12 h |
| Certificates, domains, Savings Plans, Reserved Instances, EKS, S3 sizes, EC2's 7-day CPU | 1 day |
| Cost Explorer (when on) | Once a day or every 12 h, or only on REFRESH (MANUAL) |
| RESOURCES (*unreleased*): ECS, Bedrock's Provisioned Throughput, OpenSearch Serverless | 1 h |
| RESOURCES: most lists (log groups, tables, queues, topics, APIs, caches, streams…) | 6 h |
| RESOURCES: buckets, images, repositories, keys, usage metrics and GetMetricData | 1 day |
| RESOURCES: ELSEWHERE, the regions not shown | 1 week |

RESOURCES' readings are shared by every pane on the same account and kept in `aws-inventory.json`, so a second pane reads nothing again.

**SLOW ×4** in ⚙ makes every period four times as long, except the billing metric's.

### Permissions

AWS's managed policy `ReadOnlyAccess` (or `ViewOnlyAccess` with `AWSBillingReadOnlyAccess`) covers every read. A refused read shows **PARTIAL** and the operation's name only; *unreleased:* **COPY POLICY** beside it copies an IAM policy that allows exactly those reads (actions only, no account or ARN), and RESOURCES names the refused services once, under its tiles. The actions, for a policy of your own, are in [Network access and data sources](data-sources.md#aws-status-permissions).

## GITHUB STATUS

<p align="center">
  <img src="../screenshots/pane-github.jpg" alt="The GITHUB STATUS pane on its own, for a made-up user octo-aki: the top row with QUEUE 12 of which 4 danger, REVIEW 3 and MAIN RED 1, the next inbox reading; the contribution grid of the last year with 1,495 contributions and a 3-day streak; the QUEUE tab with its filters, grouped as broken or blocked (a pull request waiting 8 days, one failing, a default branch red, a private vulnerability report), waiting too long (workflows to approve, a review waiting 4 days, a conflict), for you (an assignment, a mention, a review request) and triage">
  <br><sub>GITHUB STATUS · QUEUE · a stand-in gh, a made-up user</sub>
</p>

| | |
| --- | --- |
| Where | cloud preset (Ctrl+Shift+F10); picker (Ctrl+Shift+A) "github status". Can be popped up and brought forward (Ctrl+Shift+Z). |
| Reads | github.com through `gh` (`gh api -X GET …`, read-only GraphQL queries, `gh auth status --json hosts`) |
| Updates | Only while the pane is seen, each reading at its own period (below); conditional requests where GitHub answers 304. |
| Platforms | Wherever GitHub CLI runs. github.com only (not GitHub Enterprise Server). Not verified by hand on macOS or Linux. |
| Privacy | Read only: marks nothing read, merges, comments or approves nothing. Bodies, comments, diffs and files are not read. Written to disk: only daily star counts of public repositories (`github-stars.json`, 90 days). |
| Settings | Per pane in ⚙: repositories AUTO or PINNED, the contribution band on or off. For every pane: the incident toasts, `github.incidents` in `settings.json`. |

The top row: the link word, **QUEUE** (its count and danger count), **REVIEW** (pull requests waiting on you), **MAIN RED** (repositories whose default branch is red), the rate limit only while it runs low, the next inbox reading, **MASK**, **REFRESH**, ⚙. Under it the **contribution band**: the last year as a grid, with the year's count and the streak; ⚙ turns it off, and it is dropped when the pane is too low.

The tabs:

| Tab | What it shows |
| --- | --- |
| **QUEUE** | What waits on you, one row per thing, heaviest first: a default branch red, private vulnerability reports, your pull requests failing, conflicting or with changes requested, workflow runs waiting for approval, review requests (warn after 3 days, danger after 7), mentions, assignments, and TRIAGE - issues nobody has answered in your repositories. Filters ALL, MINE, REVIEW, SECURITY, MENTION, TRIAGE |
| **INBOX** | The raw notifications. The pane marks nothing read. A fine-grained token cannot read notifications, and the tab says so |
| **EVENTS** | The last 24 hours in the watched repositories, folded by repository and kind (stars, forks, issues, pull requests, releases, pushes) |
| **REPOS** | A tile per repository: stars and their 7-day change, forks, issues, pull requests, alerts, the default branch's last runs, the latest release (prereleases included) and the commits since, and views over 14 days where you have push access. A tile drills into its runs, open pull requests and releases |

- **Stars' 7-day change** comes from elecdex's own daily notes, since GitHub keeps no daily count: of public repositories only, in `github-stars.json`, 90 days.
- **Repositories**: AUTO - your own repositories that are neither forks nor archived, the eight with the most stars - or PINNED, a list of `owner/name` (12 at most, organisations' too).
- **Opening**: ↗ on a row (or Enter with the row focused) opens it in your browser. The page sends only the row's id; main builds the link from what it read, on github.com (and githubstatus.com) only. In a repository's drill-down, ‹ or Escape or Backspace goes back.

| Reading | Call | Period |
| --- | --- | --- |
| Sign-in | `gh auth status --json hosts` | 15 min |
| Rate limit | `gh api -X GET rate_limit` | 5 min |
| Notifications | `gh api -i -X GET notifications` with If-Modified-Since | 60 s, as GitHub's `X-Poll-Interval` asks; a 304 costs no rate limit |
| Queue | one GraphQL search | 5 min |
| Repositories | one GraphQL query | 15 min |
| Events, workflow runs | `gh api -i -X GET` per repository, with If-None-Match | 5 min |
| Contributions | one GraphQL query | 1 h |
| Private vulnerability reports, commits since the release | `gh api -X GET` per repository | 1 h |
| Traffic (views) | `gh api -X GET` per repository with push access | 6 h |

A token without the scope a reading needs shows **PARTIAL** for that reading alone.

## Public status and incident toasts

While a pane of a service is shown, main also fetches that service's public status, every 5 minutes, without the CLI and without signing in:

| | AWS STATUS | GITHUB STATUS |
| --- | --- | --- |
| Source | `https://status.aws.amazon.com/rss/all.rss` (about 60 KB; conditional requests do not work there) | `https://www.githubstatus.com/api/v2/incidents/unresolved.json` and `…/scheduled-maintenances/active.json` |
| Band | Only while an incident is open in the pane's regions or a global service | Only while an incident is open (planned maintenance as an info band, never a toast) |
| Toast from | warn (`aws.incidents.minSeverity`) | danger, Copilot left out (`github.incidents.minSeverity`, `skip`) |

- A press on the band opens a card of the incidents; ↗ (or Enter) opens the status page. The card says it is the service's public status, not your account's.
- A toast comes for a new incident, or one that got heavier, at most one per source every 15 minutes, gathered. What was already open at the pane's very first reading stays a band only. Incidents already told are remembered 30 days in `cloud-alerts.json`, so a restart does not repeat them.
- When elecdex is not in front, a system notification instead, if `system` is on. It never names the account.
- On by default, because the status is read only while a pane is shown. Changed in either pane's ⚙, under *Every AWS STATUS pane* / *Every GITHUB STATUS pane*; the keys are in [Themes and settings](themes-settings.md#settingsjson).
- Since nothing is read while the pane is hidden, an incident or a quota passed then is told when the pane is next shown.

## Common behaviour

- **Read only while seen.** Main's readings stop when the last pane of a board is no longer seen, and are dropped when the page reloads. No exception for toasts.
- **The CLIs' sign-in is theirs.** No key, token or credential enters elecdex; for a profile that signs in through `credential_process` too, the CLI is started only while you look at the pane.
- **No plugin API** reaches either pane.
- **Text is drawn as text.** Titles, branch, workflow, alarm and stack names are someone else's writing and are never inserted as HTML.
- **Links are built by main** from its own last reading: the AWS console, github.com and the status pages, never a URL the page sends.
- **For developers:** the tests never run the real CLIs or reach an account: `ELECDEX_CLOUD_STUB=1` puts a stand-in `aws` and `gh` in their place (`=demo` for the screenshots, `=signedout`, `=nocli`, `=offline` …), and the public status URLs point at closed ports.

## Design documents

In Japanese:

- [cloud-cli.md](../cloud-cli.md): what both panes share - starting the CLIs, the allow-list, the schedule, the ledger, the public status
- [aws.md](../aws.md): AWS STATUS - every call, the drill-down, Cost Explorer, the QUOTA, the permissions
- [github.md](../github.md): GITHUB STATUS - every call, the queue, the repositories
- [decisions.md](../decisions.md): decisions with reasons and measured numbers
- [Network access and data sources](data-sources.md)
