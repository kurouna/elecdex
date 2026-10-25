---
paths:
  - "scripts/**"
  - "docs/demos.md"
---

# Generators and demo scripts

The asset generators and the demo recordings (docs/demos.md says how a demo is made, changed and
recorded). Every demo is Windows-only and needs `npm run build` first.
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

```bash
npm run gen:icon       # build/icon.svg -> build/icon.png + resources/icons/icon.png
npm run gen:card       # README banner: public/elecdex_repo_card.svg
npm run gen:geo        # globe land points, country centroids, time zone table
npm run gen:cities     # weather picker city list (GeoNames)
npm run gen:orbit-map  # ORBIT map: land dots, and time zone lines (timezone-boundary-builder, ODbL)
npm run gen:chip8      # CHIP-8 library + previews: resources/chip8/programs.json (--archive <dir> to update chip8Archive)
npm run gen:elec16     # ELEC-16 ROM: BASIC (e16c) -> basic.s, rom/*.s -> rom.json; soft/ -> soft.json
npm run gen:screenshots # README screenshots in a demo profile (Windows; build first)
npm run demo:elec      # drives the ELEC pane for a screen recording (Windows; build first; --alone)
npm run demo:full      # the whole app for a screen recording, windowed (Windows; build first; --probe)
npm run demo:dev       # AI AGENT + GIT at work, then ORBIT, for a recording (Windows; build first; --probe)
npm run demo:devflow   # the dev preset in use: the way there, agent, git, load, Docker, clipboard, chat, shell, captioned (--ja or demo:devflow-ja: in Japanese; Windows; build first)
npm run demo:presets   # the layouts dialog stepping through every preset, for a recording (Windows; build first; --probe)
npm run demo:shorts    # the same in a tall 9:16 window, layouts in 2 or 3 tiers (--tiers=2|3; Windows; build first)
npm run demo:wifi      # the Wi-Fi pane on the train stub, 9:16, cards opening on the way (Windows; build first)
npm run demo:panes     # DOCKER, CLIPBOARD, NOW PLAYING and UTILITY at work, 16:9, under 30 s (Windows; build first)
npm run demo:cockpit   # the cockpit preset: CLUSTER's cards, a load on every core, forward, resized, Black (Windows; build first)
npm run demo:tour      # the introduction video: boot, presets, ETHERNET, ORBIT, agents, Docker, media, the palette, ELEC, themes (Windows; build first)
npm run demo:tour-black # the same tour in the Black theme (--theme=black), its themes ending on Black (Windows; build first)
npm run demo:tour-shorts # the same tour, 9:16 in two tiers, under 2 min, for Shorts (Windows; build first)
npm run demo:keystream # KEYSTREAM: menu previews, a track typed on time through instrument changes, its result (Windows; build first)
npm run demo:snippets  # the clipboard pane's snippets: kept, written, moved, pasted into the shell, 16:9, under 30 s (Windows; build first)
npm run demo:whatsnew  # what v0.0.19-v0.0.20 added, most striking first: CHIP-8, files in the ai preset's chat, dev's agent tree and FETCH/PULL, 16:9 (Windows; build first)
npm run demo:whatsnew22 # what v0.0.22 added: the pocket's new BASIC, the PLAY-320's three games, MULQ in CODE, 16:9 (Windows; build first)
npm run demo:whatsnew34 # what v0.0.34 added: the GPU pane, CLUSTER's GPU lane, nested subagents, the git pane's PUSH, 16:9 (Windows; build first)
npm run demo:whatsnew36 # what v0.0.35-v0.0.36 added: the ETHERNET pane on a cable with CRC errors, brought forward, and the action palette, 16:9 (Windows; build first)
npm run demo:whatsnew38 # what v0.0.38 added: the ELEC-16's five skins modelled in light, GLASS following the theme, captioned, 16:9 (Windows; build first)
npm run demo:elec16    # the ELEC-16 alone, 1280x600: BASIC, the SOFT CARD, CODE, the skins (Windows; build first)
npm run demo:sci       # ELEC-16 SCI alone in Black, 16:9, ~130 s: v2's CONST, CONV, Σ, ∫, CPLX, MATRIX, PROG first, then exact answers, %, a constant, EQUATION, STATS, BASE, its bodies, captioned (Windows; build first)
npm run demo:logwatch  # LOG WATCH alone: a made-up log followed, a burst, filter, PATTERNS, MASK, two lines EXPLAINed by the stand-in, captioned, 16:9, ~55 s (Windows; build first)
npm run demo:games     # the PLAY-320's three games played, bodies and themes changing, CORE beside (Windows; build first)
node scripts/eleclance-art.mjs           # ELECLANCE's pictures drawn afresh (overwrites its PNGs, the source)
node scripts/elecaircombat-art.mjs       # the same for ELECAIRCOMBAT
node scripts/elecdrill-art.mjs           # the same for ELECDRILL
node scripts/elecfighter-art.mjs [stage|title|screens]  # ELECFIGHTER's pictures: three.js renders the fighters in a hidden Electron window
node scripts/elecfighter/serve.mjs       # ELECFIGHTER's design viewer (viewer.html): the same three.js scene the bitmaps come from
node scripts/sync-calc.mjs <elecxzy>  # overwrite the vendored calculator from an elecxzy checkout
node scripts/instruments-wav.mjs [dir] [voice]  # the plugins' instruments to WAV files, to listen to
node scripts/log-feed.mjs [file] [--format=jsonl|logfmt|generic|syslog|clf|plain] [--rate=20] [--encoding=utf-8|utf-16le|shift_jis] [--rotate=60]  # a made-up log for LOG WATCH
```
