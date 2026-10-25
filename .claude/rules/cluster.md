---
paths:
  - "src/shared/cluster.ts"
  - "src/renderer/widgets/cluster/**"
  - "tests/unit/cluster*"
  - "tests/e2e/panes/cluster.spec.ts"
  - "docs/cluster.md"
  - "scripts/demo-cockpit.mjs"
  - "tests/component/cluster-*"
---

# The CLUSTER pane

The cockpit preset's instrument cluster (architecture.md §5.20, docs/cluster.md, shared/cluster.ts,
widgets/cluster/).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The CLUSTER pane** (§5.20, docs/cluster.md, shared/cluster.ts, widgets/cluster/) reads only
  what main already provides - its metric sources, the AWAKE store, `quakes.observe` - and no
  other pane, main module or channel knows it is there (user decision 2026-10-10).
  - Every level (a number, its bars, a core, a lamp, the message line) comes from one pure
    judgement in shared/cluster.ts; a lamp lights only when its level has held.
  - A reading is drawn as it arrives; the lanes are lines redrawn once per cpu.load sample,
    without animation (user decision 2026-10-10), and never scroll on their own. A lamp that does not apply (BATT without a battery, QUAKE with quake
    alerts off) is left out, never shown dark. No settings.
