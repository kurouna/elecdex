---
paths:
  - "src/shared/cloud-cli/**"
  - "src/shared/aws/**"
  - "src/shared/github/**"
  - "src/main/cloud-cli/**"
  - "src/main/aws/**"
  - "src/main/github/**"
  - "src/main/ipc/cloud.ts"
  - "src/main/ipc/aws.ts"
  - "src/main/ipc/github.ts"
  - "src/renderer/widgets/aws/**"
  - "src/renderer/widgets/github/**"
  - "src/renderer/widgets/cloud/**"
  - "src/renderer/styles/cloud-pane.css"
  - "src/renderer/stores/cloud-alerts.svelte.ts"
  - "tests/unit/aws*"
  - "tests/unit/github*"
  - "tests/unit/cloud-*"
  - "tests/component/aws-*"
  - "tests/component/github-*"
  - "tests/e2e/panes/aws.spec.ts"
  - "tests/e2e/panes/github.spec.ts"
---

# AWS STATUS and GITHUB STATUS

The two panes that read through the user's own CLIs (architecture.md §5.26; docs/cloud-cli.md, docs/aws.md,
docs/github.md).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The CLI is run directly, never through a shell** (user decision 2026-11-08, cloud-cli.md §2.1):
  `execFile` with an absolute path found from absolute PATH entries and the known install folders,
  a fixed cwd, the environment of `cliEnv`, a timeout that ends the tree. Never PowerShell, never
  `shell: true`, never a path from the page.
- **Read only.** Every call is a read named in a probe table (main/aws/probes.ts,
  main/github/probes.ts) or the drill-down's on-demand reads; the catalog tests (tests/unit/aws.test.ts,
  github.test.ts) hold every argv to the allowed verbs. gh's REST calls always say `-X GET` (`-f`
  would make a POST); GraphQL sends queries only. AWS never calls S3's own API, GetMetricData,
  logs, secrets, Health or Support.
- **Free APIs only, but Cost Explorer.** The one paid probe has a `PaidCost` (its setting and its
  price), runs only when the account's answer is ON, under its monthly cap, at its frequency, and
  is asked about once per account in the pane (TURN ON and KEEP OFF alike). A new paid call is a
  new `PaidCost` row and a user decision.
- **Only while seen.** A board is subscribed while the pane is `seen`; nothing is in
  `keepWhileHidden`. The public status and the QUOTA ride on the same subscription (user decision
  2026-11-08: no reading while hidden; toast when shown). `watching()` answers `board:<key>` and
  `status:<source>`, empty when idle (the lifecycle contract).
- **The page names nothing but keys and ids.** A board key is canonical JSON parsed back by
  `parseAwsBoardKey` / `parseBoardKey`; lists, items, history and URLs come from main's own last
  reading; main opens only console.aws.amazon.com (and a region's), github.com, githubstatus.com
  and health.aws.amazon.com.
- **What crosses IPC is what the `--query` kept**: no tag but Name, no policy, rule, user data,
  environment variable or request parameter; CloudTrail only who, what, the error and a sign-in's
  result and MFA; a CLI's standard error only classified and redacted (`redactCliText`).
- A probe that reads for another's answer says `after`, and the other's `keyOf` decides when it
  reads again; a per-region or per-repository probe never waits a whole period on an empty list.
- Tests: `ELECDEX_CLOUD_STUB=1` (`=demo`, `=signedout`, `=nocli`, `=offline`, AWS `=partial`,
  `=nobilling`, GitHub `=ratelow`, `=finegrained`), `globalThis.__elecdexCloud` changes it
  (tests/e2e/support/cloud.ts); the status URLs point at a closed port. Nothing here ever reaches
  a real account or the network.
