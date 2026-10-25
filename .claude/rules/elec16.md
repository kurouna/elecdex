---
paths:
  - "src/shared/elec16/**"
  - "src/shared/e16c/**"
  - "src/shared/elec16-units.ts"
  - "src/main/elec16/**"
  - "src/renderer/widgets/elec16/**"
  - "src/renderer/widgets/emu/**"
  - "resources/elec16/**"
  - "tests/unit/elec16*"
  - "tests/unit/e16c*"
  - "tests/fixtures/e16c/**"
  - "tests/fixtures/elec16/**"
  - "tests/fixtures/kit/**"
  - "tests/e2e/panes/elec16*.spec.ts"
  - "docs/elec16*"
  - "docs/elec16-*/**"
  - "docs/elecfighter-mock/**"
  - "scripts/gen-elec16.mjs"
  - "scripts/elec*/**"
  - "scripts/elec*-art.mjs"
  - "scripts/demo-elec16.mjs"
  - "scripts/demo-sci.mjs"
  - "scripts/demo-games.mjs"
  - "scripts/demo-play-kit.mjs"
  - "src/main/ipc/elec16.ts"
  - "tests/unit/support/elec16-asm.ts"
  - "tests/e2e/support/elec16.ts"
  - "tests/component/elec16-*"
---

# The ELEC-16 pane: the pocket, PLAY-320, its games and kit, SCI

An original pocket computer, designed and built phase by phase (architecture.md §5.19; docs/elec16.md
is the design, its section 15 how a change is made; docs/elec16-play.md, elec16-kit.md, the four games'
documents and elec16-sci.md the models built on it; the manuals in Japanese are elec16-basic.md,
elec16-e16.md, elec16-e16c.md, elec16-soft.md, elec16-play-manual.md, elec16-sci-manual.md). Read
elec16.md before working on it. It shares shared/emu and widgets/emu with CHIP-8 (chip8.md beside this
file); LINK's AI service uses the AI chat pane's providers and keys under ai-chat.md's rules.
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The ELEC-16 pane** (§5.19, docs/elec16.md) is designed and built phase by phase: read
  elec16.md before working on it, and its section 15 (how a change is made, the test helpers,
  the traps met so far) before changing it.
  - Its user manuals, in Japanese, are docs/elec16-basic.md (BASIC), docs/elec16-e16.md (the
    ISA, the assembler, the monitor, ROM services), docs/elec16-e16c.md (e16c and CODE) and
    docs/elec16-soft.md (the SOFT CARD's programs), linked from all three READMEs. A SOFT CARD
    program has a .help beside it (English, what FILES shows when it is picked; gen:elec16
    refuses one without). A change a user can see in BASIC, the instruction set, the
    assembler, the monitor or e16c updates its manual in the same commit, as elec16.md; every
    example in a manual runs (check it on the core). An original machine only: no third-party ROM, font, BASIC
  dialect, trade dress or real model name in what is published (user decision 2026-10-03).
  - The encoding lives once, in shared/elec16/isa.ts; the assembler, disassembler and CPU read
    it, and a test round-trips every instruction (every 16-bit encoding). One encoding, one
    meaning: a do-nothing form is illegal, not a second spelling.
  - MCPY and MSET (block copy and fill) move at most `BLOCK_STEP` bytes and run again from the
    same address with their registers moved on, so an interrupt or BRK is never held up by a
    long block; e16c's `memcpy` and `memset` are one instruction each.
  - The ROM is hand-written E16 assembly (resources/elec16/rom); its font, key table and I/O
    addresses come from shared/elec16 (font.ts, keys.ts, bus.ts) through rom.ts, never copied
    into the assembly. `npm run gen:elec16` writes rom.json; a test holds it to the sources.
  - BASIC is e16c TypeScript (rom/basic/*.e16.ts); basic.s is e16c's -O2 output
    (`compileBasic`), written only by `npm run gen:elec16`, never by hand. Its function names
    share the ROM's labels. A function only assembly calls is exported (-O2 drops the rest).
  - e16c code runs alike as TypeScript and on the machine: `as` only widens; a change of
    reading is `u8()`, `u16()` or `i16()`. A miscompile gets a function in
    tests/fixtures/e16c/sample.e16.ts that shows it. tests/unit/e16c-fuzz.test.ts runs seeded programs five ways (TypeScript,
    the interpreter, -O0, -O1, -O2); before changing e16c, run it with E16C_FUZZ_SEEDS=2000.
  - BRK is a line of its own (IRQ 15), not a key in the FIFO: it always gets the machine back.
  - A unit (its RAM and card) is main's (main/elec16/units.ts); one pane runs it at a time, by
    claim. Its battery backup is the core's snapshot, written only when the pane is hidden or
    closed, the machine is switched off or the page goes - never on a timer. The core never
    touches the card: it makes a request, the page passes it on, main does it (`cardOp`).
  - BASIC's second half lives in ROM banks 0-3, the monitor's U and B in 4, ASK in 5 (`BASIC_SOURCES`);
    a bank's strings are read only in that bank. String variables have a fixed room: no
    garbage collector. B writes C.EBREAK into RAM code only while G runs it. The fixed ROM is
    nearly full: a new statement goes in a bank. A keyword is only ever added at the end of
    `KEYWORDS` (a program keeps tokens) and becomes a reserved word (the BASIC manual's appendix).
  - What a snapshot keeps is the unit's battery backup: a change to it bumps
    `SNAPSHOT_VERSION` and still reads every older version (a unit comes back with its RAM, the
    new part as a new machine's); a version's layout never changes once pushed.
  - The LCD is drawn at the machine's resolution, scaled crisp by CSS, the gaps a grid drawn
    once - never at device pixels - and at most thirty times a second (`drawMs`; measured).
  - Skins are data (skins.ts; every skin sets every field, today's eight through `TODAY`). The
    five relief skins (docs/elec16-skins-mock) draw only with backgrounds, shadows and
    pseudo-elements - never a size layout.ts computes; their materials are data: SVGs baked
    opaque (skin-art.ts), their faces bundled (faces.ts, the カナ key's two letters by
    `unicode-range`). The arrows are drawn, never a glyph; a label too wide is narrowed
    sideways by measurement (cap-fit.ts), never made smaller. No `filter` on a key's hover
    (measured: it doubled a press's cost). GLASS follows the theme's mode and accent.
  - CODE compiles in a blob worker (`?worker&inline`, CSP unchanged); a person's code runs only
    as E16 code on the core, never as JavaScript. Only the worker and tests import
    shared/e16c/program.ts (it pulls in TypeScript's parser); the page reads code-area.ts.
  - The body follows the agreed mock (name plate but on Business and PLAIN, key layout, key
    tops) and is never stretched: `deviceFit` sizes it, the pane's room goes round it. PLAIN
    draws no case (`bare`) and a flat screen (`lcd.flat`), every colour the theme's.
  - LINK (FF70-FF7E, elec16.md section 12) is the machine's only way out: it names a service
    of main's by number (the AI is 0; another is a `LinkService` in main/elec16/link and a line
    in link-services.ts, never code in the core, the page or the ROM). The core makes a request,
    the page passes it on, main answers - only for the page that holds the unit, nothing while
    LINK or that service is off in the panel's LINK (LINK on, the AI off, CART on by default;
    an old single switch is the AI's, `linkSettings`). A SEND goes only after a person's action since the last (HELD
    otherwise: PASTE's keys do not count), one at a time a unit, no token cap (as the AI chat pane), 180 s. The
    AI uses the AI settings' providers and keys (a key never reaches the page or the machine;
    a provider with none may be chosen); its answer reaches the machine only as the LCD's
    characters (`lcdReply`), and everything else - dictionary, translation, search, weather -
    is the model's (search on the provider's side, user decision 2026-10-04). A machine waiting
    for main (LINK, the card) is not at its prompt: the runner neither counts auto power-off
    nor tells CODE's RUN it is there. A device line enabled by the ROM is put back
    (`MIE_LINES`, mie at the monitor's way in).
  - The SOFT CARD (resources/elec16/soft) is written into soft.json only by `npm run gen:elec16`
    (a test holds it and runs every program); main lays it read-only over every unit's card
    and never writes it. PASTE and LOAD ▸ type through the key FIFO (`pasteKeys`), never
    into RAM.
  - PLAY-320 (docs/elec16-play.md) has what is new alone - extended RAM, video, the pad, the
    cartridge slot - by model data (`xramMax`, `video`, `pad`, `cart`, `drawHz`, `rom`), and
    tests hold every other model as it was. Its ROM is resources/elec16/play (no BASIC, no
    monitor), sharing link.s with the pocket ROM. A cartridge's ROM never goes in a snapshot:
    the page puts it back from main's shelf by hash. The game shelf is main's
    (main/elec16/games.ts), apart from CHIP-8's in every file, channel and list; games.json is
    written only by `npm run gen:elec16`. A press is a button PADHIT marks that was up at the
    last look (a tapped key is often down and up between two).
  - Its game kit (elec16-play.md section 10, shared/elec16/kit, games/lib) builds a game with
    `sources` in its game.json: code copied into RAM 2000-6FFF, data in banks, constants in a
    generated `assets.e16.ts` and e16c's output kept as `compiled.s` (neither edited). Code given a bank runs in the window and never
    moves it. A sprite's palette field is 0-7 for slots 8-15. Pictures are PNG in exact palette
    colours; music is the kit's MML, effects on channels 12-15. ELECLANCE
    (docs/elec16-eleclance.md) is its sample: its PNGs and stage.txt are the source once
    scripts/eleclance-art.mjs drew them; a test holds every song's channels in step.
    ELECAIRCOMBAT and ELECDRILL (docs/elec16-elecaircombat.md, elec16-elecdrill.md) are the
    same kind of sample, each with its art script and test.
  - ELECFIGHTER (docs/elec16-elecfighter-design.md is its design, kept in step with the code;
    elec16-elecfighter.md its manual) is the fourth. Its fighters are nameless humans, P1 and the
    CPU told apart by the fill colour alone, in eight slots (scripts/elecfighter/slots.json, a
    glTF with the README's bone names) - never characters (user decision 2026-10-08). three.js
    is a design tool only: scripts/elecfighter-art.mjs renders the bitmaps ahead of time and the
    cartridge streams them; the 3D data and SVGs live in scripts/elecfighter, the PNGs are the
    source once drawn, a slot's hand box lines (boxes.txt) are never overwritten. Slots, stages
    and opponents are table rows: no code names one. The CPU sees the player only at now - R and
    reads no frame's input; its habits are tendencies (at most 70%) with whims, and are never
    written in the manual or the game (user decision). The seed is the clock and the cycle count
    at START (tests fix the clock). The round robin is measured on balance changes and recorded
    in the design's 3.1, not unit-tested (a match takes seconds and results are chaotic).
  - GAMES ▸ DEVELOP (elec16-play.md section 11, docs/elec16-kit.md, main/elec16/devgame.ts):
    main picks a game's folder, keeps it per page and pane (`devKey`, the pane id checked) and
    reads only the files game.json names, inside it once links are followed (`realpath`);
    every read, write and install carries the opening's `gen`, and a stale one is refused.
    The build runs in CODE's worker, never in main; main writes back only assets.e16.ts and
    compiled.s (the temporary file made afresh, `wx`), and a new game's template
    (resources/elec16/kit-template, a test builds it) only into an empty folder. A build
    replaces only an earlier build of its id on the shelf (`built`), never a bundled or
    imported game; no automatic START (CART needs a person's action).
  - ELEC-16 SCI (docs/elec16-sci.md; elec16-sci-manual.md its manual, in Japanese) is the
    calculator model SCI-128, opened by the picker's own row (`variants`, `fresh`), never a
    widget of its own. Its ROM is resources/elec16/sci: main.s and e16c files, a bank each as
    `SCI_SOURCES` (shared/e16c/sci-rom.ts) says - the fixed ROM keeps what every key goes
    through, the rest in banks (a test holds 3.5 KB of it free, lowered from 4 KB for v3: ask
    the user before going below it, user decision 2026-10-25); sci.s and sci-rom.json are written only by
    `npm run gen:elec16`. e16c names are one namespace across every file: a new global or
    function gets a name no other file has. e16c's globals stay in 0100-0BFF (a load reaches 8191 from zero);
    a large new area goes at a fixed address in the RAM map (elec16-sci.md section 6.7), the kept regions checked by their marks
    (0C00, 5C24; the modes' 1600, 5C36; v2's 2800, 5C48) - a change of a kept layout takes a new mark.
    A bank's strings and tables are read in that bank: a name another bank draws is copied to
    RAM first (consts.e16.ts `extName`), and the maths unit's PARSE reads RAM only.
  - Every value is a decimal and an exact form `(p + r√s)/q`: the decimal is always worked
    out, the form followed beside it (exact.e16.ts) and dropped - never an error - when it
    cannot be kept. Answers show the form first only as SETUP and section 6.4 say.
  - Its words are its own (section 9): functions in small letters as they go into the line
    (`round(`, `rand`), SHIFT faces the key's inverse, the rest in FUNC (ANGLE, CONST and
    CONV are screens on the SHIFT faces of keys with no inverse); no maker's names,
    spellings or key layouts. Where calculators agree, it behaves as they do (`mod`: whole
    numbers from 0 alone, user decision 2026-10-25). A change a user can see updates the manual in the same commit,
    and the manual's examples run (elec16-sci-rom.test.ts; v2's chapters in
    elec16-sci-v2.test.ts, v3's in elec16-sci-v3.test.ts). Tests reach CALC's FUNC pages by
    their titles (`fp:NAME` in elec16-sci-helpers.ts), never by counting ▼: pages get added.
  - The page reads its screen for a screen reader by its dots (`dotText`, shared/elec16/font.ts:
    text on any row, big digits): keep it cheap (measured 0.3 ms a screen).
