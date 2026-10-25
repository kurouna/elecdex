---
paths:
  - "src/shared/agents.ts"
  - "src/main/agents/**"
  - "src/renderer/widgets/agents/**"
  - "tests/unit/agents*"
  - "tests/e2e/panes/agents.spec.ts"
  - "docs/agents-codex.md"
  - "docs/agents-mock/**"
  - "src/main/ipc/agents.ts"
  - "src/renderer/stores/ai.svelte.ts"
  - "tests/unit/agent*"
  - "tests/component/agents-*"
---

# The AI AGENT pane

Agents' local records, read and never run (architecture.md §5.11, shared/agents.ts, main/agents/;
docs/agents-codex.md is a Codex source, designed and not built).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The AI AGENT pane** (§5.11, shared/agents.ts, main/agents/) is experimental and only reads
  agents' local records - never sends, never runs them.
  - The page talks to `AgentHub`; an agent is an `AgentSource` (main/agents/source.ts) plus
    `AGENT_SOURCE_IDS`, never code in the pane.
  - Claude Code records are read only while a pane is open, incrementally; over 32 MB from the
    last 512 kB, marked partial. Never parse a whole record on a change, nor a line that is not the
    model's own except a task's ending notice or a waiting call's result (matched by id in the
    record's own quotes).
  - Subagents and background commands are a session's tasks, ended by `<task-notification>` (an
    interim one ends nothing), TaskStop, their own result or a hand-back marked by Claude Code
    (`origin.handback`); a subagent is read from its own record under `<session>/subagents/`;
    still running when the session went is `unknown`, never done. What a subagent starts hangs
    under it (`children`), found by its meta file's `parentAgentId`; a subagent whose record
    moves on past its end runs again.
  - Tests never read this machine's `~/.claude` (`ELECDEX_CLAUDE_DIR`).
