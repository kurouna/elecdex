---
paths:
  - "src/shared/ai.ts"
  - "src/shared/ai-attach.ts"
  - "src/main/ai/**"
  - "src/renderer/widgets/aichat/**"
  - "src/renderer/lib/markdown.ts"
  - "tests/unit/ai-*"
  - "tests/e2e/panes/aichat.spec.ts"
  - "src/main/ipc/ai.ts"
  - "src/renderer/stores/ai.svelte.ts"
  - "tests/unit/ai*"
  - "tests/unit/markdown*"
  - "tests/unit/support/ai-harness.ts"
  - "tests/e2e/support/stubs/**"
  - "tests/component/aichat-*"
---

# The AI chat pane

Providers, keys, the conversation and attached files (architecture.md §5.7, shared/ai.ts,
shared/ai-attach.ts, main/ai/). The ELEC council and the ELEC-16's LINK use the same providers
and keys under the same rules (elec.md, elec16.md beside this file).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The AI chat pane** (§5.7, shared/ai.ts, main/ai/). A provider is an address and a dialect
  (OpenAI-compatible or Anthropic's SDK, lazily imported); add a service to `AI_PRESETS`, not code.
  - **A key never reaches the page**: sent once (`ai.setKey`), safeStorage-encrypted into
    `ai-keys.json` (never settings.json). The page learns only whether one is held; held dots are
    a placeholder, never a value, and "show" only shows what is being typed. Asking decrypts
    nothing. No key over plain http beyond the local
    network (`keyMayTravel`); no redirects followed.
  - The conversation and the answer being written are main's (`AiChatService`): snapshot then
    deltas; a delta that does not fit is a resync. An unfollowed answer stops after a few seconds.
  - A provider is asked only on send, test, or the model list - never on mount.
  - **The conversation is never cut; what is sent is** (`chatWindow`, pure, main only). The window
    is the provider's (`contextTokens`; by its address when unset), in estimated tokens (never
    characters), cut rarely and by a lot, place kept in `Chat.context` -
    never a per-turn sliding window. Provider token counts correct only upwards. The pane shows
    `NOT SENT`.
  - Summaries (`ai.compact`, off by default): asked for at a cut as part of the send (once more
    next send if empty), never after an answer or on a timer; placed after the system prompt,
    never as a message; held to `summaryRoom`; their failure costs only the summary. `SUMMARISED`
    shows the text.
  - A model's text is untrusted: drawn from lib/markdown.ts's tree, never as HTML.
  - The Anthropic adapter follows the claude-api skill (capabilities from the Models API,
    `stop_reason` first, thinking summarized and never replayed, fallbacks only on Anthropic's
    endpoint).
  - The link vocabulary never hides what the user must read: an end code always has the
    provider's words beside it, not in a tooltip. Failures are one set (`FAILED`, read by colour
    and sound); add a `ChatStop` deliberately. Caret and lamp step with lib/pulse.svelte.ts, not a
    CSS animation. The badge stays in words.
  - **Attached files** (§5.7, shared/ai-attach.ts, main/ai/files.ts) reach main as bytes, never a
    path, and no channel takes one. Main judges by first bytes; images are decoded and re-encoded
    in the page, never in main, which reads only their headers. Main's judging stays linear in
    the file's size (a crafted PDF or PNG once held it for seconds).
    Waiting files are main's memory under `filesDraft`; sent, they are written beside the chat
    (`<chat>.files/<sha256>`) first. Too-long text is refused, never cut. PDFs only to Anthropic
    and `pdf` presets (`takesPdf`), else refused or named in the history - never dropped unsaid.
    Files count in `chatWindow` and are cut with their message.
  - No tools, MCP, branching or prompt profiles (user decisions 2026-09-20/21). Do not add them
    without asking: a model that can start processes or read files needs a consent design like
    the plugins' first. The model never reads a file of its own accord. The one exception is
    Anthropic's server-side web search on Anthropic's dialect (user decision 2026-10-31,
    `CHAT_SEARCHES`): nothing runs here, and the pages cited are listed under the answer.
