# AI AGENT ペインの Codex ソース 設計

AI AGENT ペイン（architecture.md §5.11）に、Claude Code に並ぶ 2 つ目のエージェントとして OpenAI の Codex
を加える設計。**まだ実装していない**（2026-10-19、利用者の判断で見送り。いずれ実装できるよう設計とモックを
残す）。見た目の案はモック [agents-mock/index.html](agents-mock/index.html)。

記録の形は、この PC の Codex 0.151.0（CLI・`codex exec`・Codex Desktop）の rollout と、
2026-10-19 に `codex exec --enable multi_agent` で入れ子のサブエージェントを動かした記録で確かめた。
Codex の記録も公開仕様ではないので、実装の前にその時点の版で確かめ直すこと。

## 0. 決定の記録

| 日付 | 決定 | 経緯 |
|------|------|------|
| 2026-10-19 | 状態は記録から推測する。waiting（許可待ち・入力待ち）は出さない | 利用者の選択。Codex は許可待ちを rollout に書かない（記録 9 本で 0 件）。推測で出すと長いコマンドの実行中と見分けられない |
| 2026-10-19 | 推測した状態も行は Claude Code と同じ言葉（BUSY / IDLE / ENDED）で出し、詳細カードに「記録から読んだ」と書く | 利用者の選択 |
| 2026-10-19 | 最初の版に、変更ファイルと差分・サブエージェント・`codex exec` のセッションを含める | 利用者の選択 |
| 2026-10-19 | idle と ended の境目は 30 分（記録が書かれなくなってから） | 利用者の選択。**その後の検証で不要になった**: ロックファイルで生死が分かる（§2.3）。ロックが読めない環境の予備としてだけ残す |
| 2026-10-19 | 実装は見送り、設計とモックだけをコミットする | 利用者の判断 |

## 1. 記録のありか

`CODEX_HOME`（既定は `~/.codex`）の下。**読むのは次の 3 つだけ**で、`auth.json`、sqlite（`state_5.sqlite` など）、
`history.jsonl`、`config.toml` は開かない。

| パス | 中身 | 使い方 |
|------|------|--------|
| `sessions/YYYY/MM/DD/rollout-<時刻>-<thread id>.jsonl` | 1 スレッド（セッションまたはサブエージェント）の追記だけの記録 | 本体。増えた分だけ読む |
| `session_index.jsonl` | `{id, thread_name, updated_at}` の追記。同じ id の行が何度も出る | タイトル。同じ id の最後の行 |
| `thread-writer-locks/<thread id>.lock` | スレッドを書いているプロセスが持つ空のファイル | 生死（§2.3） |

テストでは `ELECDEX_CODEX_DIR` で場所を差し替え、この PC の `~/.codex` を読まない（Claude Code の
`ELECDEX_CLAUDE_DIR` と同じ）。

## 2. rollout の読み方

各行は `{timestamp, ordinal, type, payload}`。`type` と `payload.type` の組で読む。

### 2.1 使う行

| 行 | 使うもの |
|----|----------|
| `session_meta` | `id`、`cwd`、`originator`（`codex-tui` / `codex_exec` / `Codex Desktop`）、`cli_version`、`source`、`thread_source`（`user` / `subagent`）。サブエージェントでは `parent_thread_id`、`agent_nickname`、`agent_path`、`subagent_history_start_ordinal`、`source.subagent.thread_spawn.depth` |
| `turn_context` | `model`、`cwd` |
| `event_msg:task_started` / `task_complete` / `turn_aborted` | ターンの開閉（`turn_id` で結ぶ）。`task_complete.last_agent_message` は最後の返事 |
| `event_msg:token_count` | `info.last_token_usage.input_tokens` を CTX、`info.model_context_window` を窓、`total_token_usage.output_tokens` を OUT |
| `response_item:custom_tool_call`（name `exec`） | コードモードの呼び出し。`input` は JS で、`tools.<名前>(...)` の最初の呼び出しからツール名と短い説明を取り出す（**実行しない**、正規表現で読むだけ） |
| `response_item:function_call` | `spawn_agent` / `wait_agent` などはそのまま名前がある。`arguments.message` は暗号化されていて読めない |
| `event_msg:item_completed`（item `FileChange`） | `changes` の各パスに `type`（add / update / delete）と `unified_diff`。変更ファイルと差分はここから作る |
| `event_msg:item_completed`（item `SubAgentActivity`） | `kind: started` と `agent_thread_id`、`agent_path`。子が始まった時刻 |
| `response_item:agent_message` | 子から親への `Message Type: FINAL_ANSWER`。子の終わりの裏付け |

`response_item:reasoning` の `encrypted_content`、`world_state`、`thread_settings_applied`、
`inter_agent_communication_metadata` は使わない。返事の本文（`message`）は Claude Code と同じく
直前の動きの行に短く出すだけにする。

### 2.2 サブエージェント

- 子は**自分の rollout を持つ**（同じ日付のフォルダに並ぶ）。親は `session_meta.parent_thread_id`、
  深さは `depth`、名前は `agent_nickname`（Codex が付ける。例: Huygens）と `agent_path` の末尾（例: `subagent_b`）。
  入れ子は `agent_path` が `/root/subagent_b/subagent_c` のように伸び、`parent_thread_id` は直接の親を指す。
- **子の rollout の先頭には親の履歴の写しがある**（2 つ目の `session_meta` と、親の `task_started`）。
  `ordinal` が `subagent_history_start_ordinal` より前の行は読み飛ばす。読み飛ばさないと、親のツール呼び出しや
  ターンを子のものと数えてしまう。
- 子への依頼文は暗号化されているので、行のタイトルは「ニックネーム task_name」にする。
- 子の状態: 自分の rollout のターンが開いていれば RUN、`task_complete` で DONE、`turn_aborted` で STOP、
  ロックが消えてターンが開いたままなら `unknown`（Claude Code の「セッションが去ったときにまだ動いていた」と同じ扱い）。
- 子が変えたファイルも、親のセッションの変更ファイルに SUB の印で入れる（Claude Code と同じ）。

### 2.3 生死と状態

2026-10-19 の検証: `thread-writer-locks/<id>.lock` は、そのスレッドを持つプロセスが動いている間は存在し、
Windows では排他で開けない（共有の読み取りでは開ける）。プロセスが終わるとファイルが消えた。
サブエージェントも 1 つずつロックを持ち、子のターンが終わってもプロセスが続く間は残った。

| 状態 | 条件 |
|------|------|
| busy | ロックがあり、ターンが開いている（`task_started` に対応する `task_complete` / `turn_aborted` がない） |
| idle | ロックがあり、最後のターンが閉じている |
| ended | ロックがない。最後の書き込みから `ENDED_KEPT_MS`（10 分）残す |
| unknown | ロックがなく、ターンが開いたまま |

- ロックは**ファイルの有無**で見る。排他で開けるかを試すのは、Codex がロックを取る瞬間とぶつかりうるので
  しない。消え残ったファイル（2026-09 に見た、終わったセッションの .lock）は、その時刻のあと記録が
  30 分書かれていなければ ended とみなす（0 章の 30 分はこの予備のため）。
- macOS と Linux でロックがどう振る舞うかは確かめていない。
- BUSY の行は、最後の書き込みからの経過を `quiet 18s` のように出す。許可待ちで止まっても BUSY のまま
  これが伸びる（waiting は出さない）。

### 2.4 ツールの短い名前

`exec_command` → EXEC、`apply_patch` → PATCH、`spawn_agent` → SPAWN、`wait_agent` → WAIT。
ほかは名前を大文字にする。説明は exec_command の `cmd` の先頭（Claude Code の Bash と同じく 80 字）、
apply_patch は変えたファイル名、spawn_agent と wait_agent は相手の task_name。

## 3. 表示（モック）

- 読むエージェントが 2 つ以上のとき、見出しの行に `CLAUDE` / `CODEX` のチップを置く。Codex は破線の枠。
- 数値の行の末尾に `exec` / `desktop` / `cli`（`originator` から）。
- 詳細カードの新しい行: AGENT（Codex と originator と版）、STATE（「read from the record」）、
  PROCESS（「its thread lock is held」）、サブエージェントの PATH。idle のカードには、Codex は許可待ちを
  記録しないので許可待ちでも BUSY と出ることを書く。
- 差分の見出しに `FROM THE RECORD`（ファイルを読まず、記録の `unified_diff` を出すため）。
- ペインの見出しの小さい文字は今の仕組みのまま「3 live · Claude Code, Codex」。

## 4. 実装するときの決まり

CLAUDE.md の AI AGENT ペインの規則に従う。要点:

- `AgentSource`（main/agents/source.ts）を 1 つ（main/agents/codex/）と `AGENT_SOURCE_IDS` の 1 行。ペインに
  Codex のためのコードは書かない。表示に要るもの（チップ、`quiet`、カードの行、差分の出どころ）は
  `AgentSession` の一般的な欄として足す。
- 読むのはペインが開いている間だけ、増えた分だけ。32 MB を超える記録は末尾 512 kB から読み、partial にする。
  変化のたびに記録全体を読み直さない。
- 監視するのは `sessions` の今日と昨日の日付フォルダ、`thread-writer-locks`、`session_index.jsonl`。
  `sessions` 全体を再帰で監視しない（日付フォルダが増え続ける）。
- 差分の `unified_diff` は記録の文字なので、Claude Code の差分と同じく文字として描く。
- テスト: 単体テストは tests/fixtures に、この検証の形を写した作り物の rollout（親・子・孫、写しの履歴つき、
  FileChange、ロックの有無）を置く。e2e は `ELECDEX_CODEX_DIR` に作り物を置き、ロックの出し入れで
  BUSY → IDLE → ENDED と、子のツリーと差分を確かめる。
- 設定の `agents.sources` に Codex を足す。既定で有効にするかは実装のときに決める。
