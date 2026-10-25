---
paths:
  - "src/shared/chip8/**"
  - "src/shared/emu/**"
  - "src/shared/chip8-library.ts"
  - "src/main/chip8/**"
  - "src/renderer/widgets/chip8/**"
  - "src/renderer/widgets/emu/**"
  - "resources/chip8/**"
  - "tests/unit/chip8*"
  - "tests/unit/emu*"
  - "tests/e2e/panes/chip8.spec.ts"
  - "docs/emu.md"
  - "scripts/gen-chip8.mjs"
  - "src/main/ipc/chip8.ts"
  - "tests/unit/fixtures/chip8/**"
  - "tests/component/chip8-*"
---

# The CHIP-8 pane and the emulators' shared base

Our own CHIP-8 machine (architecture.md §5.18) and the base every emulator shares, shared/emu and
widgets/emu (docs/emu.md). The ELEC-16 is the second machine on it: see elec16.md beside this file.
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The CHIP-8 pane** (§5.18) runs our own TypeScript machine on 2D canvas - never WASM or eval.
  - `shared/chip8` imports only itself and `shared/emu`; `shared/emu` nothing; neither touches the
    DOM, Node, timers, the clock or `Math.random` (emu-boundary.test.ts holds them). A pane wraps
    them and never reaches in. A later emulator takes the same shape (docs/emu.md) and shares
    `shared/emu` and the page's `widgets/emu`, never another machine's folder; `widgets/emu`
    knows no machine. Extract a shared part when a second machine needs it, not before.
  - Octo is the reference: every platform runs every instruction, the platform decides only
    memory and quirks, and the keys are Octo's (arrows and Space are pads 5 7 8 9 and 6). Timendus's chip8-test-suite must pass on
    all three platforms (chip8-suite.test.ts): a change that moves a fixture is checked against
    the suite's README, not re-recorded.
  - Presses blink (lib/blink.ts), appearing and going use `crt-on` / `crtPower`, lamps `pulse`.
  - Its game loop runs on the emulators' runner (`EmuRunner`, widgets/emu/runner.svelte.ts), the
    one exception to the 10 fps loop (widened from CHIP-8 to every emulator, user decision
    2026-10-03): only while running and `seen`, paused out of sight. When to tick is the machine's
    policy; CHIP-8's is rAF while the screen moves, a 60 Hz timer once still.
  - Keys reach the machine only while the pane itself has focus (a press on its buttons hands it
    back). ROMs come from main by id (`chip8.list`, `chip8.rom`);
    programs.json is written only by `npm run gen:chip8`.
  - What the user keeps is main's (`chip8/library.json`, save files), never pane state, only for
    library programs, snapshots checked by the core's decoder and taken up only for the machine
    they were made on, with today's tuning. Imports go through main's picker, size
    checked first. AUTO is written when play stops (never on a timer, only if it moved). Changes
    broadcast `chip8:changed`; the page's library is replaced whole.
