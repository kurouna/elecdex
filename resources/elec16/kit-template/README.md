# MY GAME

ELEC-16 PLAY のゲームキットで作るゲームの雛形です。

- elecdex の ELEC-16 ペインで PLAY-320 にし、パネルの GAMES → DEVELOP の「OPEN FOLDER」でこのフォルダを開くと、ビルドしてユニットに差します。START で始まります
- ファイルを保存するたびに、作り直して差し直します
- `main.e16.ts` がゲームのプログラム（e16c: TypeScript の部分集合）、`game.json` がゲームの説明、`art/` が絵（PNG）、`music/` が曲（MML）です
- `assets.e16.ts` と `compiled.s` はビルドが書きます（手で直さない）。`lib/` はエディタのためのライブラリと型の写しです（ビルドはアプリに入っているものを使います）
- 手引きは elecdex の docs/elec16-kit.md にあります
