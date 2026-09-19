# calc/vendor — a copy of elecxzy's calculator logic

Nothing in this folder is written here, and nothing in it is edited here. It is a
verbatim copy of `src/utils/calc` from [elecxzy](https://github.com/kurouna/elecxzy),
a sibling project by the same author, taken at the commit recorded in `SOURCE.json`.

The files are pure logic — no DOM, no Node, no Electron — which is why they can be
dropped into `src/shared` and used from the renderer, main and the metrics service
alike. They carry their own tests, including a fast-check property layer that checks
the parser against a reference implementation; those run with elecdex's unit suite.

## Why a copy, and not a patch

Keeping the copy pristine is what makes an upgrade a single overwrite. When elecxzy's
calculator gains a function or fixes a rounding rule, the whole folder is replaced and
the tests that came with it say whether anything moved underneath us.

Everything elecdex needs on top — an `ans` register, `name = expr` assignment, the
formatted result a pane shows, the tally report, input guards — lives one level up in
`src/shared/calc/`, the wrapper layer. **Fix things there, never here.** A change made
inside this folder is lost at the next sync, silently.

## How it is wired in

The files here would not pass elecdex's `noUncheckedIndexedAccess` (29 index accesses
across six of them), and rewriting those would be an edit. So the folder is kept out of
TypeScript's program entirely:

- `tsconfig.*.json` exclude `src/shared/calc/vendor/**` and map `@calc/*` to the hand
  written declarations in `../types/`, which are the contract the wrapper codes against.
- The bundlers (`electron.vite.config.ts`, `vitest.config.ts`) map `@calc/*` to the real
  files here, so the declarations describe what actually runs.
- `biome.json` ignores this folder: reformatting it to elecdex's style would be an edit
  too, and the diff noise would hide the real changes at the next sync.

The declarations in `../types/` are the one thing that has to keep up with an upgrade.
If a sync adds an export the wrapper wants, add it there.

## Syncing

```bash
node scripts/sync-calc.mjs ../elecxzy-dev     # path to an elecxzy checkout
npm run verify
```

The script replaces every file here, rewrites `SOURCE.json`, and omits
`index.docs.test.ts` — that one test reads elecxzy's own directory layout off disk.
`tests/unit/calc-wrapper.test.ts` keeps its spirit here: it fails if anything outside
`src/shared/calc/` reaches into this folder instead of going through the wrapper.

## Licence

elecxzy is MIT (`LICENSE.md` in this folder); elecdex is GPL-3.0-only. MIT code may be
taken into a GPL-3.0 work as long as its copyright notice travels with it, which is what
`LICENSE.md` and `SOURCE.json` are here for.
