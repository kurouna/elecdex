---
paths:
  - "src/main/background/**"
  - "src/shared/background.ts"
  - "tests/unit/background*"
  - "tests/e2e/app/background.spec.ts"
  - "src/renderer/stores/background.svelte.ts"
  - "tests/unit/login*"
---

# Running in the background

The tray icon, minimising or closing to it, the system-wide show/hide shortcut and the sign-in
entry (shared/background.ts, main/background/; the reasons in docs/decisions.md).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited. Every option is off until the user turns it on.

- **Never gate on the platform name**: ask `backgroundCapabilities` (shared/background.ts), computed
  by main from what this machine has (it probes for a tray, reads the session type); it travels in
  `BackgroundState`. Main ignores options the machine cannot do (settings.json travels).
- Decisions are pure (`decideClose`, `decideMinimize`, `decideToggle`, `trayWanted`,
  `closesToTray`); main/background/ carries them out. The page never hides the window itself
  (`system.closeWindow`). macOS keeps closing and minimising the platform's
  (`staysWithoutWindow`), and `window-all-closed` does not quit there.
- Putting away is told from quitting by `quitting`; an explicit quit always quits.
- The sign-in entry is one `LoginBackend` per platform (main/background/login/); the platform holds
  whether it is on.
