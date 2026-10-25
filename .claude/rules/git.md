---
paths:
  - "src/shared/git*.ts"
  - "src/main/git/**"
  - "src/renderer/widgets/git/**"
  - "src/renderer/lib/highlight.ts"
  - "tests/unit/git*"
  - "tests/e2e/panes/git.spec.ts"
  - "src/main/ipc/git.ts"
  - "tests/component/git-*"
---

# The git pane

A repository read, with FETCH, PULL and PUSH as its only writes (architecture.md §5.9, shared/git.ts,
shared/git-sync.ts, shared/git-graph.ts, main/git/).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The git pane** (§5.9, shared/git.ts, main/git/) reads, and writes only FETCH, PULL and PUSH
  (two presses each); never stages, commits, checks out, merges or rebases. Repositories are chosen
  through main's picker and known by id (`git-repos.json`), so a layout carries no path; a pane
  is tied to no other pane.
  - FETCH/PULL/PUSH live in main/git/sync.ts, apart from the reading GitService; a later write
    goes there too. PULL is `--ff-only` only (user decision 2026-09-30);
    diverged, it refuses. PUSH names its one refspec, the branch onto the upstream its config
    names, never `+` or `--force`; behind or rejected, it refuses; no upstream, it leaves
    `push -u` to the terminal (user decision 2026-10-18). No hook runs, pre-push neither, and
    the armed PUSH says so (`core.hooksPath` is main's empty folder). A transport program the
    repository's own config names (`TRANSPORT_PROGRAM_KEYS`) refuses the press, and only https,
    http, ssh and git are spoken (`PROTOCOLS`: no folder, `ext::` or remote helper; e2e serve the
    remote over http). `syncBlocked`
    is checked against main's own reading, one at a time per repository, only for a page showing
    it.
  - git always runs with `GIT_FLAGS` (main/git/run.ts) and the diff flags; repository filters are
    emptied (`filterGuard`); submodule trees are not read; `--no-optional-locks`.
  - Without an open command, a file is opened only when its first bytes are text, a picture or
    a PDF and it would not run (`openVerdict`: its extension, an execute bit off Windows; on
    Windows only the kinds in `OPENS_ON_WINDOWS`, as the program is picked by the name);
    anything else is revealed instead.
  - Diffs only for files of the last reading; open/reveal only inside the tree (`locate`).
  - `git.openCommand` is set in settings.json only, never by settings.patch; run as program and
    arguments, never a shell; `.cmd` via `cmd.exe` only with safe arguments (main/git/open.ts).
  - The graph is asked for by the page (`git.log`: scope and count only), re-read when
    `historyAt` moves, laid out by `graphRows` (shared/git-graph.ts); its hover card stays in the
    pane.
  - Watched only while shown, read at most once a second; git's own bookkeeping is not a change.
  - File text is untrusted: highlight tokens drawn as text (lib/highlight.ts), never HTML.
