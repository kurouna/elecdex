---
paths:
  - "README*.md"
  - "docs/guide/**"
  - "docs/screenshots/**"
  - "docs/demos.md"
  - "scripts/gen-screenshots.mjs"
  - "scripts/preset-shots.mjs"
  - "scripts/demo-*.mjs"
  - "scripts/gen-notices.mjs"
  - "scripts/third-party-notices*"
  - "scripts/media-standins.mjs"
  - "scripts/packaged-smoke.mjs"
  - ".github/workflows/**"
  - "package.json"
  - "package-lock.json"
  - "electron-builder*"
  - "tests/unit/third-party-notices*"
---

# Publishing: screenshots, demos, notices, releases

What goes out with a release and how it is made (docs/demos.md for the demos;
scripts/gen-screenshots.mjs, scripts/gen-notices.mjs, .github/workflows/release.yml).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **README screenshots** must not show personal data: `npm run gen:screenshots` (demo home,
  curated launcher entries, made-up author). One shot per preset in a different theme, plus
  layouts, settings, the action palette, ELEC, CHIP-8 (T8NKS),
  the ELEC-16's five relief skins as crops of the body (`elecdex-skins`; GLASS on a light theme too),
  and every pane of the Panes section alone (`panes`: `pane-<widget>.jpg`, its own box cut from a
  layout that gives it a fixed share of the window; LOG WATCH's EXPLAIN by a stand-in). A new pane
  gets its `shootPane` line, its picture on its guide page (docs/guide/panes-*.md) in all three
  languages, and a line in the README's panes table. Preset trees come from the built app
  (scripts/preset-shots.mjs). Everything of someone else's or this machine is a stand-in: web
  panes show stand-in pages (never YouTube's or X's own), stubs run at `=demo`, the chats and the
  council talk to a stand-in (no model, no key). Regenerate after a visible change to a theme, a
  preset or the default layout. A new theme or preset gets a shot in the README's gallery and on
  docs/guide/presets.md, in all three languages.
- **The introduction demo** (`npm run demo:tour`, its 9:16 cut `demo-tour-shorts.mjs` under two
  minutes; docs/demos.md says how every demo is recorded, built and changed, and the traps met) is updated with every release (user decision 2026-09-27): a new central or showy
  feature gets a beat, a beat no longer true goes. About two minutes, boot first and themes last,
  stand-ins only (demo-take.mjs: nothing of this machine read, pressed or kept awake, no one's
  pages or artwork, no model or key; the music is KEYSTREAM's own tracks). The beats live once in
  scripts/demo-beats.mjs and both cuts use them. Check each take with `--shots`.
- **Third-party notices**: `npm run build` writes `out/THIRD_PARTY_NOTICES.txt`
  (scripts/gen-notices.mjs) from what each build bundled; the package puts it, and LICENSE,
  beside the executable. New bundled data goes into `DATA_SOURCES`
  (scripts/third-party-notices.mjs) and the README table.
- **Releases** (the procedure, user decision 2026-10-18), in this order:
  1. Bump `package.json` (and package-lock.json, `npm version --no-git-tag-version`); in all
     three READMEs, name the new version in the status line and drop the *unreleased* marks of
     what it carries - in the READMEs and in docs/guide, all three languages.
  2. Run every test: `npm run verify`, `npm run build`, then the whole `npx playwright test` (the
     `perf` project last), then `npm run package:dir` and `npm run test:packaged`.
     Only when all are green (a failure here is fixed, or shown to be this machine's, first).
  3. Commit `chore(release): v<version> / v<version> をリリース`, tag `v<version>`, push the
     branch and the tag (.github/workflows/release.yml makes a pre-release a person promotes).
  4. Once the release workflow is done, read the release and its notes (`gh release view`):
     the assets for every platform, and the notes in English and Japanese.
  5. Read the CI run of the pushed commit. A failing test is fixed, committed and pushed; a
     fault in the shipped code that is not severe does not need a new release.
- **The builds are unsigned**: the README's *If a warning appears* (per OS) and release.yml's
  notes (English and Japanese) say the same; change both.
