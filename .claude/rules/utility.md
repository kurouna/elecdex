---
paths:
  - "src/shared/utility.ts"
  - "src/shared/codec.ts"
  - "src/shared/qr.ts"
  - "src/main/awake/**"
  - "src/renderer/widgets/utility/**"
  - "tests/unit/utility*"
  - "tests/unit/qr*"
  - "tests/e2e/panes/utility.spec.ts"
  - "src/main/ipc/utility.ts"
  - "src/renderer/lib/qr-code.ts"
  - "src/renderer/stores/awake.svelte.ts"
  - "tests/unit/awake*"
  - "tests/unit/codec*"
  - "tests/component/utility-*"
---

# The UTILITY pane

Small tools in one pane: AWAKE, CODEC, QR codes (architecture.md §5.16, shared/utility.ts,
shared/codec.ts, main/awake/).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The UTILITY pane** (§5.16, shared/utility.ts, shared/codec.ts, main/awake/): small tools in
  `UTILITY_MODULES`, never panes of their own; each starts with the user's action, runs in main
  through what is already there (no process per action), uses no network, reads nothing behind a
  consent, and is out of the plugin API.
  - AWAKE: `powerSaveBlocker` only, OFF / SYSTEM / DISPLAY. The hold is main's (`AwakeService`,
    `awake.json`), never pane state, and goes on with no pane open (the status bar and tray say
    so); its end waits on one `setTimeout`, rechecked on `resume`, never a tick.
  - Copies go through main (`utility.copy`). A Wi-Fi password is kept only sealed (`utility.seal`,
    safeStorage, purpose-checked by `unseal`), unsealed only while its code is shown, never in
    plain. CODEC's input is never written.
  - A QR code is dark on light, in theme colours only when contrast holds (`qrColours`); a test
    reads every theme's code back.
  - Tests: `ELECDEX_AWAKE_STUB=1`, `globalThis.__elecdexAwake`.
