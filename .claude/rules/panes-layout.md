---
paths:
  - "src/renderer/**"
  - "src/shared/layout*.ts"
  - "src/shared/layouts.ts"
  - "src/shared/default-layout.ts"
  - "src/shared/keybindings.ts"
  - "src/shared/shortcut-applies.ts"
  - "src/shared/palette.ts"
  - "src/shared/theme.ts"
  - "src/shared/title-bar.ts"
  - "tests/component/**"
  - "tests/e2e/workspace/**"
  - "tests/e2e/contracts/**"
  - "tests/unit/layout*"
  - "tests/unit/layouts*"
  - "tests/unit/default-layout*"
  - "tests/unit/keybindings*"
  - "tests/unit/e2e-*"
  - "tests/unit/palette*"
  - "tests/unit/popup*"
  - "tests/unit/summon*"
  - "tests/unit/theme*"
  - "tests/unit/xterm-theme*"
  - "tests/unit/hover-card*"
  - "tests/unit/crt-motion*"
  - "docs/palette.md"
  - "docs/palette-mock/**"
  - "src/main/ipc/layout.ts"
  - "src/shared/schemas/layout.ts"
  - "tests/unit/shortcut-applies*"
  - "tests/unit/title-bar*"
  - "tests/e2e/support/layouts.ts"
---

# Panes, layout, dialogs, shortcuts and themes

How the page is put together: the layout tree and its ops, popups, faults, saved layouts and
presets, shortcuts, the action palette, the CRT transitions, themes, detail cards and type sizes
(architecture.md §5.5, §5.6, §5.13, §5.24 and §7; docs/palette.md). These hold for every widget
in src/renderer, built-in or plugin.
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **Layout state** is a persisted tree; every change goes through a pure op in
  src/shared/layout-ops.ts, and every tree from disk through `normalizeTree` (ids made unique:
  a repeated key stops the workspace drawing). Widgets change their pane state only with
  `widgetState.patch(paneId, change)` (stores/widget-state.svelte.ts; undefined removes a key) -
  never `layout.patchPaneState` or spreading `state` into `setPaneState`. A tabbed pane is split,
  moved beside or dropped on through its group, and a group holds only panes, of any widget.
  Nested groups are postponed (user decision 2026-09-17). A tree with no pane is the empty
  layout (`emptyNode`, the only childless node, as the root): blank is one, and closing the last
  pane of any layout leaves one, never a shell put in (user decision 2026-10-25). Splits carry no header; the shell's
  TERMINAL header stays, as the group's drag handle and the path. Pane moves are tested at unit,
  component and e2e level: extend those.
- **A popped-up pane is never in the layout** (§5.13, layout/popup.ts): held in `ui.popup` as one
  of the dialogs (opening any dialog puts it away; it counts in `dialogOpen`), drawn by
  PopupPane.svelte, never saved, nor its choices. Offered only for `popup: true` widgets (not the
  shell, timer, file browser, CHIP-8, web pages or plugins), which must reach nothing of the
  layout store (a unit test reads them). Only the weather place picker opens over a popup
  (`OVER`). The launcher's shortcut pops one up when the layout has none. A widget ends its popup
  through `ondone`, never by knowing it is in one. A summoning shortcut is a line in `SUMMONS`
  (layout/summon.ts) with its chord in keybindings.ts; `summonChoice` decides where it goes and
  the widget answers via `onSummoned` - never a branch for one widget in the shared part, nor a
  flag of its own in `ui`.
- **Faults are said, not swallowed** (lib/fault-report.ts, layout/PaneFault.svelte): every
  built-in widget, in the layout or popped up, sits in `PaneFault`, so a throw stops that pane
  alone (RETRY) and is a red toast; an exception nothing in the page caught is one too. Once per
  message, a few a minute; COPY DETAILS copies only the message, the version and the platform.
- **Remounts happen.** Moving a pane remounts its widget: keep what must survive in pane state or
  main (a shell reattaches to its session).
- **Saved layouts** (§5.6, src/shared/layouts.ts). `layout.json` is live, with volatile state;
  `layouts.json` holds copies stripped by `portableTree`. Main writes the live tree into the
  active entry on every save, only when it differs. A layout follows the work - never a snapshot
  (user decision 2026-09-20). Switching flushes the pending save and waits for one in flight. A
  broken entry is dropped alone; the file is never discarded whole. `KEYED_LAYOUTS`
  (Ctrl+Shift+1..9 by place): change shared/layouts.ts, keybindings.ts and Workspace.svelte
  together (a unit test). Switching asks first while shells are open (`layout.confirmSwitch`), a
  promise the switch awaits: whatever takes the screen from it must answer it. The keyboard
  reset asks the same question (`confirmReset`); a reset button asks by its second click.
  - **Presets** (shared/layout-presets.ts) are templates, never a second kind of layout: choosing
    one adds a saved layout carrying `preset` that then follows the work. Each keeps the default
    system column at its width and heights (all but cockpit, whose CLUSTER pane does its job:
    `WITH_SYSTEM_COLUMN`, user decision 2026-10-10, and blank), every pane at its `minSize` (a unit test). Only a
    first start is given them; an existing list is never added to (user decision 2026-09-24).
    Decisions are pure (there and layout-shape.ts); only layout/presets.ts knows presets in the
    page. A new preset also needs its key (keybindings.ts, Workspace.svelte), the LAYOUTS
    dialog wide enough for every card in one row, tests/e2e/workspace/layout-presets.spec.ts's `PRESETS`,
    and a shot (scripts/gen-screenshots.mjs) in the README's gallery and docs/guide/presets.md, with
    the counts in both, in all three languages.
- **Shortcuts** are data (src/shared/keybindings.ts), handled in Workspace.svelte; never a key
  check elsewhere. A chord includes Ctrl/Alt or is a function key. `scope: 'global'` actions are
  main's OS registrations, out of the page keymap, the list and "reset all", and `conflicts`
  reports the app action as the loser while the OS holds the keys. A tooltip names a chord
  through `chordHint` (lib/chord-hint.ts), as it is bound now - never a chord written out.
- **The action palette** (§5.24, docs/palette.md, palette/, shared/palette.ts) never imports
  the workspace: an action or preset row goes through `commands` (lib/commands.ts) to
  Workspace's own `run`, so it does what its key does; a row that cannot run stays, with its
  reason (`UNAVAILABLE_REASON`, a unit test holds it to `shortcutApplies`). A new kind of row is
  one pure function in palette/sources.ts. Focus goes back before a row runs, never after.
- **Open and close with the CRT effect** (styles/crt.css, lib/crt-transitions.ts): everything that
  appears or goes over the workspace powers on and off.
  - Panes: `layout.arrived`; closing via `layout.closingId` and a `crt-extend` clip
    (layout/pane-close.ts), never animated sizes. One close at a time; tree changes call
    `layout.settle()` first.
  - After a move, a split, a close or an undo, `reflow` measures the panes before and after and
    `layout.effects` plays one effect each (layout/pane-reflow.ts: fly, extend, lit edges); a tab
    shown flickers on, the keyboard's arrival flares (`focus(id, true)`, never a click). A host
    plays one effect of its own at a time, chosen in `hostMotion` (layout/pane-motion.ts): a new
    one goes there, for both hosts.
  - Layouts: `layout.leaving`, then pane by pane (layout/layout-switch.ts); last switch wins.
  - Zoom (`layout.zoom`, §5.5): `position: fixed` and a transform (`crt-zoom`), never growing;
    the tree is untouched, nothing remounts, and every tree change lets go of it. Forward, its
    corner holds ⤡ alone, never a × beside it (user decision 2026-10-03); Ctrl+Shift+W closes
    the pane that is forward. Registry `zoom:
    'full'` (fills its room), `'panel'` (a fixed size) or nothing (no button, no shortcut - the
    default); plugins declare it in their descriptor. A widget laying itself out by its size
    reads it from the `ResizeObserver` entry, never by measuring inside the callback.
  - Dialogs: `crt-on`, `transition:crtPower`, `--crt-delay={dialogDelay()}`, backdrop
    `transition:backdropShade`, opened and closed through `ui` (so `ui.closedAt` is kept).
  - Notices and toasts: `crt-on` and `transition:crtPower` (`|global` where needed).
  - Skipped with motion reduced. A new dialog, popup, toast or notice gets a row in
    tests/e2e/contracts/dialogs.ts (a unit test finds every `transition:crtPower` without one);
    other motion goes in tests/e2e/workspace/motion.spec.ts (or its own spec, with `clickThen`).
- **Themes** are data turned into CSS variables; canvas/WebGL widgets re-read colours on
  `appearance.revision`. Components read semantic tokens. Text is the accent unless a theme sets
  `text`. Never assume a dark ground: `mode: 'light'` sets `data-mode="light"` (darker status
  colours, xterm's minimum contrast); check both Business themes and Black. Every theme sets every variable
  (`themeVariables`).
- **Detail cards** (§7.4) are `widgets/common/HoverCard.svelte`, placed and timed by
  lib/hover-card.ts (`cardPlacement`, `anchorOf`, `HoverRest`) - never a widget's own card or a
  `title`. A card keeps inside its pane, opens after a rest (at once for the keyboard or from an
  open card), powers on and off like a dialog, and says what the row has no room for, never the
  row again. A unit test lists the cards: add new ones there.
- **Type sizes by role** (§7): what people read is `--step--1` or larger; `--step--2` is for
  legends, labels and chrome; nothing smaller. Only steps tokens.css defines; `em` only where the
  parent's size varies (a unit test checks).
