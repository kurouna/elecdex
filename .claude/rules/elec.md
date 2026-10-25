---
paths:
  - "src/shared/elec.ts"
  - "src/main/ai/elec.ts"
  - "src/renderer/widgets/elec/**"
  - "tests/unit/elec.test.ts"
  - "tests/unit/elec-*"
  - "tests/e2e/panes/elec.spec.ts"
  - "scripts/demo-elec.mjs"
  - "scripts/elec-full-demo.mjs"
  - "src/main/ipc/elec.ts"
  - "src/renderer/stores/elec.svelte.ts"
  - "tests/component/elec-*"
---

# The ELEC system pane

A council of three seats on the AI chat's providers, and its light (architecture.md §5.8,
shared/elec.ts, main/ai/elec.ts, widgets/elec/). The providers and keys it speaks through are the
AI chat pane's, whose rules are in ai-chat.md beside this file.
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The ELEC system pane** (§5.8, shared/elec.ts, main/ai/elec.ts) runs a motion past LOGOS, ETHOS
  and PATHOS on the AI chat's providers, under the same rules; settings in `elec`, of which a
  deliberation keeps its own copy; the page sends only the motion.
  - A vote is the answer's last `VERDICT` line (`readVote`), never structured output. Invalid is
    not abstention; CONFIDENCE is shown, never counted; the resolution is computed (`resolve`), never stored.
  - Seats on one local server are asked in turn, hosted ones at once; round two cuts the others'
    statements to `statementRoom`.
  - Never name MAGI or its source (user decision 2026-09-21).
  - **One geometry** (widgets/elec/geometry.ts): change a plate there, never a coordinate in Stage
    or Effects (a unit test holds plate height and area).
  - **Its light** (pure, widgets/elec/light.ts) moves only while the council sits or once for an
    event; packets are traffic (`nextPackets`), never a loop. The resolution waits for the dark
    (`HOLD_MS`; `held` is marked while the council sits), unless it was unwatched or motion is
    reduced. The floor stops by holding its phase, not by pausing its animation.
  - Animate opacity and transform, **never a colour in keyframes**; never dim a plate by opacity -
    thin its colour towards the ground.
  - Removed and not to return without asking: convergence with a shock wave, orbits round the
    core, a radar (user decisions 2026-09-21).
  - **It runs at the display's rate** (user decision 2026-09-21, ~70% of a core while sitting):
    never move it to the 10 fps loop. The pane is not in the default layout.
