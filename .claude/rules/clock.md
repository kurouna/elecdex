---
paths:
  - "src/renderer/widgets/clock/**"
  - "tests/component/clock-*.test.ts"
  - "tests/unit/clock-face-*.test.ts"
  - "tests/e2e/panes/clock.spec.ts"
  - "docs/clock-faces-mock/**"
---

# The CLOCK pane and its faces

The clock draws one of several faces, chosen in the settings dialog (general › clock, `clock.face`)
for every clock pane alike (docs/decisions.md, 2026-11-21; the designs in
docs/clock-faces-mock/final.html).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **A face is a folder and a row.** `widgets/clock/faces/<id>/` holds its component and its pure
  logic (a `.ts` beside it, unit-tested); `faces.ts` is the table the pane and the settings dialog
  read, and nothing else lists faces. An id is never renamed once released; an unknown id is drawn
  as the default and left in settings. The tests that hold this: tests/component/clock-faces.test.ts
  (the table, the setting) and the "every face" cases of clock-widget.test.ts and clock.spec.ts.
- **The pane keeps the time; a face only draws it.** ClockWidget ticks once on the shared second
  boundary, only while seen, and hands the face `now`, `zone`, `timeZone`, `visible`. A face runs
  no timer of its own; what it works out by the minute it derives from the minute. A face that
  moves between seconds (karman) does so on `onFrame` while `visible`, and with motion reduced
  steps once a second instead.
- **What a screen reader hears is the pane's**, the same for every face (the minute and the zone,
  on the root's `aria-label`); a face is a picture.
- **The default strip is the design size**: about 340 x 70-90 at the top of the system column
  (0.085 of its height, user request 2026-11-22); a face becomes a block from `TALL_FROM`
  (parts/layout.ts), the one height every face changes shape at.
  A face uses its width (user request 2026-11-21) and fits it, and lays itself out again when
  taller or brought forward (clock.spec.ts checks every face in the strip).
- **A face that uses noticeably more CPU is `heavy: true`**, and the settings list says so
  ("(uses more CPU)"); measure it at idle and record the numbers in docs/decisions.md.
- The default face is `longitude` (user decision 2026-11-22; `week` the day before), first in
  the list. AHEAD reads the alarms and the tasks'
  due times only, through their shared stores, only while seen; the timer pane's countdowns stay
  out of it (user decision).
